"""
EXL Demos Server
=================
Static file server for all demos + Luna IVR API endpoints + WebSocket relay.
Run from the Demos root: python serve.py
"""

import http.server
import socketserver
import os
import sys
import json
import asyncio
import threading
from urllib.parse import urlparse, parse_qs

# Set working directory to this file's location (Demos root)
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Add Luna Demo to Python path for its modules
LUNA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Luna Demo')
sys.path.insert(0, LUNA_DIR)

# Import Luna response engine (graceful if missing)
try:
    from response_engine import get_response, extract_entities, classify_yes_no, detect_intent_switch
    ENGINE_AVAILABLE = True
except ImportError:
    ENGINE_AVAILABLE = False

# Import Luna LLM engine (graceful if missing)
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

PORT = 8000
WS_PORT = 8091

# API key — hardcoded for demo convenience
API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"


class DemoHandler(http.server.SimpleHTTPRequestHandler):

    def log_message(self, format, *args):
        # Only log API calls, not static files
        msg = str(args[0]) if args else ''
        if '/api/' in msg:
            print(f"  [HTTP] {msg}")

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    # --- CORS ---
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    # --- API Routing ---
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self._json_error(400, 'Invalid JSON')
            return

        if self.path == '/api/config':
            self._handle_config(data)
            return

        if self.path == '/api/test-key':
            self._handle_test_key(data)
            return

        if self.path == '/api/summarize':
            self._handle_summarize(data)
            return

        # Response engine endpoints (Luna scripted mode)
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

    def _handle_config(self, data):
        global API_KEY
        api_key = data.get('apiKey', '').strip()
        if api_key:
            API_KEY = api_key
        # Report current state (don't clear hardcoded key if no key sent)
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
                headers={
                    'Authorization': f'Bearer {api_key}',
                }
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
                # Model not found but key works
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
                lines.append(f"Luna (AI Agent): {text}")
            elif role == 'system':
                lines.append(f"[System: {text}]")
        conversation_log = '\n'.join(lines)

        prompt = (
            "You are an IVR call center analyst. Below is the transcript of a call between a customer and Luna, "
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
        text = data.get('text', '')
        result = classify_yes_no(text)
        self._json_response({'classification': result})

    def _handle_entities(self, data):
        text = data.get('text', '')
        scenario_id = data.get('scenarioId', '')
        entities = extract_entities(text, scenario_id)
        self._json_response({'entities': entities})

    def _handle_intent_switch(self, data):
        user_input = data.get('userInput', '')
        current_scenario = data.get('currentScenarioId', '')
        result = detect_intent_switch(user_input, current_scenario)
        self._json_response({'switch': result})

    def _json_response(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json_error(self, status, message):
        self._json_response({'error': message}, status)


# ===== WebSocket Relay Server =====

async def relay_handler(browser_ws):
    global API_KEY
    print(f"  [WS] Browser connected, scenario={browser_ws.request.path if hasattr(browser_ws, 'request') else '?'}")

    path = browser_ws.request.path if hasattr(browser_ws, 'request') else browser_ws.path
    parsed = urlparse(path)
    params = parse_qs(parsed.query)
    scenario_id = params.get('scenario', [None])[0]
    phone = params.get('phone', [None])[0]
    print(f"  [WS] Scenario: {scenario_id}, Phone: {phone}, API_KEY set: {API_KEY is not None}")

    # Look up customer from phone number
    customer_context = None
    if phone and LLM_AVAILABLE:
        customer_context = lookup_customer(phone, scenario_id)
        print(f"  [WS] Customer lookup: {customer_context.get('name') if customer_context else 'not found'}")

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
        print(f"  [WS] Connecting to OpenAI Realtime...")
        async with websockets.connect(
            OPENAI_REALTIME_URL,
            additional_headers=headers,
            max_size=2**24,
        ) as openai_ws:
            print(f"  [WS] Connected to OpenAI!")

            session_created = await openai_ws.recv()
            print(f"  [WS] Got session.created")
            await browser_ws.send(session_created)

            config = build_session_config(scenario_id, customer_context=customer_context, phone=phone)
            await openai_ws.send(json.dumps(config))
            print(f"  [WS] Sent session config")

            session_updated = await openai_ws.recv()
            print(f"  [WS] Got session.updated")
            await browser_ws.send(session_updated)

            # Trigger Luna's greeting — send response.create so she speaks first
            print(f"  [WS] Sending response.create for greeting")
            await openai_ws.send(json.dumps({"type": "response.create"}))

            async def browser_to_openai():
                try:
                    async for message in browser_ws:
                        await openai_ws.send(message)
                except websockets.exceptions.ConnectionClosed:
                    pass

            async def openai_to_browser():
                msg_count = 0
                try:
                    async for message in openai_ws:
                        data = json.loads(message)
                        msg_count += 1
                        evt_type = data.get("type", "?")
                        if evt_type != "response.audio.delta":
                            print(f"  [WS] OpenAI → Browser: {evt_type}")
                        elif msg_count % 50 == 0:
                            print(f"  [WS] OpenAI → Browser: audio chunks ({msg_count} msgs total)")

                        if data.get("type") == "response.function_call_arguments.done":
                            func_name = data.get("name", "")
                            call_id = data.get("call_id", "")
                            arguments_str = data.get("arguments", "{}")

                            try:
                                arguments = json.loads(arguments_str)
                            except json.JSONDecodeError:
                                arguments = {}

                            result = handle_function_call(func_name, arguments, scenario_id=scenario_id, phone=phone)

                            await openai_ws.send(json.dumps({
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "function_call_output",
                                    "call_id": call_id,
                                    "output": result
                                }
                            }))

                            await openai_ws.send(json.dumps({
                                "type": "response.create"
                            }))

                        await browser_ws.send(message)

                except websockets.exceptions.ConnectionClosed:
                    pass

            done, pending = await asyncio.wait(
                [
                    asyncio.ensure_future(browser_to_openai()),
                    asyncio.ensure_future(openai_to_browser()),
                ],
                return_when=asyncio.FIRST_COMPLETED,
            )

            for task in pending:
                task.cancel()

    except websockets.exceptions.InvalidStatusCode as e:
        print(f"  [WS] ERROR: OpenAI returned HTTP {e.status_code}")
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
    async with websockets.serve(
        relay_handler,
        "0.0.0.0",
        WS_PORT,
        max_size=2**24,
    ):
        print(f"  WebSocket relay on ws://localhost:{WS_PORT}")
        await asyncio.Future()


def run_ws_server():
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
        ws_status += " (pip install websockets)"
    if not LLM_AVAILABLE:
        ws_status += " (llm_engine.py missing)"

engine_status = "with Luna response engine" if ENGINE_AVAILABLE else "static only (Luna engine not found)"
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), DemoHandler) as httpd:
    print(f"EXL Demos on http://localhost:{PORT} ({engine_status})")
    print(f"  Luna AI mode: {ws_status}")
    httpd.serve_forever()

