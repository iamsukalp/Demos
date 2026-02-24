"""
IVR Call Containment Server
====================
Static file server + API endpoints for dynamic response engine.
WebSocket relay server for OpenAI Realtime API integration.
"""

import http.server
import socketserver
import os
import json
import asyncio
import threading
from urllib.parse import urlparse, parse_qs

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Import response engine (graceful if missing)
try:
    from response_engine import get_response, extract_entities, classify_yes_no, detect_intent_switch
    ENGINE_AVAILABLE = True
except ImportError:
    ENGINE_AVAILABLE = False

# Import LLM engine (graceful if missing)
try:
    from llm_engine import build_session_config, handle_function_call, lookup_customer
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

# Try importing websockets
try:
    import websockets
    WS_AVAILABLE = True
except ImportError:
    WS_AVAILABLE = False

PORT = 8090
WS_PORT = 8091

# API key — loaded from environment variable
API_KEY = os.environ.get("OPENAI_API_KEY", "")

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"

# Persistent call history file (shared with root serve.py)
HISTORY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'iris_history.json')
MAX_HISTORY = 50


def load_history():
    """Load call history from JSON file."""
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_history(history):
    """Save call history to JSON file."""
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history[-MAX_HISTORY:], f)


class IrisHandler(http.server.SimpleHTTPRequestHandler):

    def log_message(self, format, *args):
        pass  # suppress logs to avoid stdout issues

    def end_headers(self):
        # Prevent caching so refreshes always work
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    # --- CORS ---
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    # --- API Routing ---
    def do_POST(self):
        """Route API requests."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self._json_error(400, 'Invalid JSON')
            return

        # API key configuration endpoint
        if self.path == '/api/config':
            self._handle_config(data)
            return

        if self.path == '/api/test-key':
            self._handle_test_key(data)
            return

        if self.path == '/api/summarize':
            self._handle_summarize(data)
            return

        if self.path == '/api/tts':
            self._handle_tts(data)
            return

        if self.path == '/api/history':
            self._handle_add_history(data)
            return

        # Response engine endpoints (fallback/scripted mode)
        if not ENGINE_AVAILABLE:
            self._json_error(503, 'Response engine not available')
            return

        if self.path == '/api/respond':
            self._handle_respond(data)
        elif self.path == '/api/classify':
            self._handle_classify(data)
        elif self.path == '/api/entities':
            self._handle_entities(data)
        elif self.path == '/api/intent-switch':
            self._handle_intent_switch(data)
        else:
            self._json_error(404, f'Unknown API endpoint: {self.path}')

    def do_GET(self):
        """Handle GET requests — API routes then static files."""
        if self.path == '/api/history':
            self._handle_get_history()
            return
        # Fall through to static file serving
        super().do_GET()

    def do_DELETE(self):
        """Handle DELETE requests."""
        if self.path == '/api/history':
            self._handle_delete_history()
            return
        self._json_error(404, f'Unknown endpoint: {self.path}')

    def _handle_config(self, data):
        """Store API key in memory."""
        global API_KEY
        api_key = data.get('apiKey', '').strip()
        if api_key:
            API_KEY = api_key
        self._json_response({
            'success': True,
            'configured': API_KEY is not None and len(API_KEY) > 0,
            'wsPort': WS_PORT,
            'wsAvailable': WS_AVAILABLE and LLM_AVAILABLE,
        })

    def _handle_test_key(self, data):
        """Test the API key by making a lightweight request to OpenAI."""
        global API_KEY
        api_key = data.get('apiKey', '').strip() or API_KEY
        if not api_key:
            self._json_response({'valid': False, 'error': 'No API key provided'})
            return
        try:
            import urllib.request
            req = urllib.request.Request(
                'https://api.openai.com/v1/models/gpt-4o-mini',
                headers={'Authorization': f'Bearer {api_key}'}
            )
            resp = urllib.request.urlopen(req, timeout=10)
            if resp.status == 200:
                self._json_response({'valid': True, 'error': None})
            else:
                self._json_response({'valid': False, 'error': f'OpenAI returned HTTP {resp.status}'})
        except urllib.error.HTTPError as e:
            if e.code == 401:
                self._json_response({'valid': False, 'error': 'Invalid API key'})
            elif e.code == 404:
                self._json_response({'valid': True, 'error': None})
            else:
                self._json_response({'valid': False, 'error': f'OpenAI error: HTTP {e.code}'})
        except Exception as e:
            self._json_response({'valid': False, 'error': f'Connection failed: {str(e)}'})

    def _handle_summarize(self, data):
        """Generate a detailed AI-powered call summary from the transcript."""
        global API_KEY
        transcript = data.get('transcript', [])
        if not transcript:
            self._json_response({'summary': 'No transcript available.'})
            return
        if not API_KEY:
            self._json_response({'summary': 'API key not configured.'})
            return

        # Build a human-readable conversation log
        lines = []
        for msg in transcript:
            role = msg.get('role', 'system')
            text = msg.get('text', '')
            if role == 'customer':
                lines.append(f"Customer: {text}")
            elif role == 'bot':
                lines.append(f"IRIS (AI Agent): {text}")
            elif role == 'system':
                lines.append(f"[System: {text}]")
        conversation_log = '\n'.join(lines)

        prompt = (
            "You are an IVR call center analyst. Below is the transcript of a call between a customer and IRIS, "
            "an AI IVR agent for EXL Financial Services. Write a concise but detailed summary of the call. "
            "Include:\n"
            "- Why the customer called (intent)\n"
            "- Key steps taken during the call\n"
            "- Any verification or authentication performed\n"
            "- Actions executed by the bot (e.g., card blocked, dispute filed)\n"
            "- Whether the issue was resolved or escalated\n"
            "- Any notable customer requests or concerns\n\n"
            "Keep the summary to 3-5 sentences. Be factual and professional.\n\n"
            f"--- Transcript ---\n{conversation_log}\n--- End ---"
        )

        try:
            import urllib.request
            req_body = json.dumps({
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
                "temperature": 0.3,
            }).encode('utf-8')
            req = urllib.request.Request(
                'https://api.openai.com/v1/chat/completions',
                data=req_body,
                headers={
                    'Authorization': f'Bearer {API_KEY}',
                    'Content-Type': 'application/json',
                },
                method='POST',
            )
            resp = urllib.request.urlopen(req, timeout=15)
            resp_data = json.loads(resp.read().decode('utf-8'))
            summary = resp_data['choices'][0]['message']['content'].strip()
            self._json_response({'summary': summary})
        except Exception as e:
            self._json_response({'summary': f'Summary generation failed: {str(e)}'})

    def _handle_respond(self, data):
        """Main response endpoint — get dynamic response for a conversation turn."""
        scenario_id = data.get('scenarioId')
        turn_index = data.get('turnIndex')
        user_input = data.get('userInput', '')
        context = data.get('context', {})

        if scenario_id is None or turn_index is None:
            self._json_error(400, 'Missing scenarioId or turnIndex')
            return

        result = get_response(scenario_id, turn_index, user_input, context)
        self._json_response(result)

    def _handle_classify(self, data):
        """Classify user input as yes/no/other."""
        text = data.get('text', '')
        result = classify_yes_no(text)
        self._json_response({'classification': result})

    def _handle_entities(self, data):
        """Extract entities from text for a given scenario."""
        text = data.get('text', '')
        scenario_id = data.get('scenarioId', '')
        entities = extract_entities(text, scenario_id)
        self._json_response({'entities': entities})

    def _handle_intent_switch(self, data):
        """Check if user input matches a different scenario."""
        user_input = data.get('userInput', '')
        current_scenario = data.get('currentScenarioId', '')
        result = detect_intent_switch(user_input, current_scenario)
        self._json_response({'switch': result})

    # --- JSON Helpers ---
    def _handle_tts(self, data):
        """Text-to-Speech via OpenAI TTS API. Returns MP3 audio."""
        global API_KEY
        text = data.get('text', '').strip()
        if not text:
            self._json_error(400, 'No text provided')
            return
        if not API_KEY:
            self._json_error(503, 'API key not configured')
            return
        try:
            import urllib.request
            req_body = json.dumps({
                "model": "tts-1",
                "input": text,
                "voice": "alloy",
                "response_format": "mp3",
            }).encode('utf-8')
            req = urllib.request.Request(
                'https://api.openai.com/v1/audio/speech',
                data=req_body,
                headers={
                    'Authorization': f'Bearer {API_KEY}',
                    'Content-Type': 'application/json',
                },
                method='POST',
            )
            resp = urllib.request.urlopen(req, timeout=15)
            audio_data = resp.read()
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self._send_cors_headers()
            self.send_header('Content-Length', str(len(audio_data)))
            self.end_headers()
            self.wfile.write(audio_data)
        except Exception as e:
            self._json_error(500, f'TTS failed: {str(e)}')

    def _handle_get_history(self):
        """Return call history."""
        self._json_response(load_history())

    def _handle_add_history(self, data):
        """Add a new call history entry."""
        if not data:
            self._json_error(400, 'No data provided')
            return
        history = load_history()
        history.append(data)
        save_history(history)
        self._json_response({'success': True, 'count': len(history)})

    def _handle_delete_history(self):
        """Clear all call history."""
        save_history([])
        self._json_response({'success': True})

    def _json_response(self, data, status=200):
        """Send a JSON response."""
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json_error(self, status, message):
        """Send a JSON error response."""
        self._json_response({'error': message}, status)


# ===== WebSocket Relay Server =====

async def relay_handler(browser_ws):
    """Handle a browser WebSocket connection by relaying to OpenAI Realtime API."""
    global API_KEY

    # Parse scenario and phone from query string
    path = browser_ws.request.path if hasattr(browser_ws, 'request') else browser_ws.path
    parsed = urlparse(path)
    params = parse_qs(parsed.query)
    scenario_id = params.get('scenario', [None])[0]
    phone = params.get('phone', [None])[0]
    silence_ms = int(params.get('silence', [1000])[0])

    # Look up customer from phone number
    customer_context = None
    if phone and LLM_AVAILABLE:
        customer_context = lookup_customer(phone, scenario_id)

    if not API_KEY:
        await browser_ws.send(json.dumps({
            "type": "error",
            "error": {"message": "No API key configured. Open Settings to add your OpenAI API key."}
        }))
        await browser_ws.close()
        return

    if not LLM_AVAILABLE:
        await browser_ws.send(json.dumps({
            "type": "error",
            "error": {"message": "LLM engine not available."}
        }))
        await browser_ws.close()
        return

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "OpenAI-Beta": "realtime=v1"
    }

    try:
        async with websockets.connect(
            OPENAI_REALTIME_URL,
            additional_headers=headers,
            max_size=2**24,  # 16MB for audio data
        ) as openai_ws:

            # Wait for session.created from OpenAI
            session_created = await openai_ws.recv()
            await browser_ws.send(session_created)

            # Send session config with system prompt and tools
            config = build_session_config(scenario_id, customer_context=customer_context, phone=phone, silence_ms=silence_ms)
            await openai_ws.send(json.dumps(config))

            # Wait for session.updated confirmation
            session_updated = await openai_ws.recv()
            await browser_ws.send(session_updated)

            # Trigger IRIS's greeting — send response.create so it speaks first
            await openai_ws.send(json.dumps({"type": "response.create"}))

            # Bidirectional relay
            async def browser_to_openai():
                """Forward messages from browser to OpenAI."""
                try:
                    async for message in browser_ws:
                        await openai_ws.send(message)
                except websockets.exceptions.ConnectionClosed:
                    pass

            async def openai_to_browser():
                """Forward messages from OpenAI to browser, intercept function calls."""
                try:
                    async for message in openai_ws:
                        data = json.loads(message)

                        # Intercept completed function calls — execute and send result back
                        if data.get("type") == "response.function_call_arguments.done":
                            func_name = data.get("name", "")
                            call_id = data.get("call_id", "")
                            arguments_str = data.get("arguments", "{}")

                            try:
                                arguments = json.loads(arguments_str)
                            except json.JSONDecodeError:
                                arguments = {}

                            result = handle_function_call(func_name, arguments, scenario_id=scenario_id, phone=phone)

                            # Send function output back to OpenAI
                            await openai_ws.send(json.dumps({
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "function_call_output",
                                    "call_id": call_id,
                                    "output": result
                                }
                            }))

                            # Tell OpenAI to continue generating a response
                            await openai_ws.send(json.dumps({
                                "type": "response.create"
                            }))

                        # Forward everything to browser (including function call events)
                        await browser_ws.send(message)

                except websockets.exceptions.ConnectionClosed:
                    pass

            # Run both relay directions concurrently
            done, pending = await asyncio.wait(
                [
                    asyncio.ensure_future(browser_to_openai()),
                    asyncio.ensure_future(openai_to_browser()),
                ],
                return_when=asyncio.FIRST_COMPLETED,
            )

            # Cancel remaining tasks
            for task in pending:
                task.cancel()

    except websockets.exceptions.InvalidStatusCode as e:
        error_msg = "Invalid API key" if e.status_code == 401 else f"OpenAI connection failed (HTTP {e.status_code})"
        await browser_ws.send(json.dumps({
            "type": "error",
            "error": {"message": error_msg}
        }))
    except Exception as e:
        try:
            await browser_ws.send(json.dumps({
                "type": "error",
                "error": {"message": f"Connection error: {str(e)}"}
            }))
        except Exception:
            pass


async def start_ws_server():
    """Start the WebSocket relay server."""
    async with websockets.serve(
        relay_handler,
        "0.0.0.0",
        WS_PORT,
        max_size=2**24,  # 16MB for audio data
    ):
        print(f"  WebSocket relay on ws://localhost:{WS_PORT}")
        await asyncio.Future()  # run forever


def run_ws_server():
    """Run the WebSocket server in a new event loop (for threading)."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(start_ws_server())


# ===== Start Servers =====

# Start WebSocket server in a background thread
if WS_AVAILABLE and LLM_AVAILABLE:
    ws_thread = threading.Thread(target=run_ws_server, daemon=True)
    ws_thread.start()
    ws_status = "WebSocket relay active"
else:
    ws_status = "WebSocket relay unavailable"
    if not WS_AVAILABLE:
        ws_status += " (install websockets)"
    if not LLM_AVAILABLE:
        ws_status += " (llm_engine.py missing)"

# Start HTTP server
engine_status = "with response engine" if ENGINE_AVAILABLE else "static only (engine not found)"
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), IrisHandler) as httpd:
    print(f"IRIS server on http://localhost:{PORT} ({engine_status})")
    print(f"  AI mode: {ws_status}")
    httpd.serve_forever()
