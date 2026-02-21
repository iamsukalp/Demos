"""
EXL Demos Server
=================
Single-port server: static files + Luna IVR API endpoints + WebSocket relay.
Works locally (python serve.py) and on Render / any PaaS that exposes one port.

Uses aiohttp for combined HTTP + WebSocket on a single port.
"""

import os
import sys
import json
import asyncio

from aiohttp import web
import aiohttp

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

# WebSocket client library for OpenAI relay
try:
    import websockets
    WS_AVAILABLE = True
except ImportError:
    WS_AVAILABLE = False

# Single port — Render sets $PORT; default 8000 for local dev
PORT = int(os.environ.get('PORT', 8000))

# API key — loaded from environment variable
API_KEY = os.environ.get('OPENAI_API_KEY', '')

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"

# Persistent stats file
STATS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'luna_stats.json')
DEFAULT_STATS = {"scenariosRun": 0, "botContained": 0, "agentEscalated": 0, "totalHandleTime": 0}


def load_stats():
    """Load stats from JSON file."""
    try:
        with open(STATS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return dict(DEFAULT_STATS)


def save_stats(stats):
    """Save stats to JSON file."""
    with open(STATS_FILE, 'w') as f:
        json.dump(stats, f)


# ===== CORS Middleware =====

@web.middleware
async def cors_middleware(request, handler):
    if request.method == 'OPTIONS':
        resp = web.Response(status=200)
    else:
        resp = await handler(request)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    resp.headers['Pragma'] = 'no-cache'
    return resp


# ===== API Handlers =====

async def handle_config(request):
    global API_KEY
    data = await request.json() if request.content_length else {}
    api_key = data.get('apiKey', '').strip()
    if api_key:
        API_KEY = api_key
    return web.json_response({
        'success': True,
        'configured': bool(API_KEY),
        'wsPort': PORT,
        'wsAvailable': WS_AVAILABLE and LLM_AVAILABLE,
    })


async def handle_test_key(request):
    global API_KEY
    data = await request.json() if request.content_length else {}
    api_key = data.get('apiKey', '').strip() or API_KEY
    if not api_key:
        return web.json_response({'valid': False, 'error': 'No API key provided'})
    try:
        import urllib.request, urllib.error
        req = urllib.request.Request(
            'https://api.openai.com/v1/models/gpt-4o-mini',
            headers={'Authorization': f'Bearer {api_key}'},
        )
        resp = urllib.request.urlopen(req, timeout=10)
        return web.json_response({'valid': resp.status == 200, 'error': None})
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return web.json_response({'valid': False, 'error': 'Invalid API key'})
        elif e.code == 404:
            return web.json_response({'valid': True, 'error': None})
        return web.json_response({'valid': False, 'error': f'OpenAI error: HTTP {e.code}'})
    except Exception as e:
        return web.json_response({'valid': False, 'error': f'Connection failed: {str(e)}'})


async def handle_summarize(request):
    global API_KEY
    data = await request.json() if request.content_length else {}
    transcript = data.get('transcript', [])
    if not transcript:
        return web.json_response({'summary': 'No transcript available.'})
    if not API_KEY:
        return web.json_response({'summary': 'API key not configured.'})

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
        return web.json_response({'summary': summary})
    except Exception as e:
        return web.json_response({'summary': f'Summary generation failed: {str(e)}'})


async def handle_respond(request):
    if not ENGINE_AVAILABLE:
        return web.json_response({'error': 'Response engine not available'}, status=503)
    data = await request.json() if request.content_length else {}
    scenario_id = data.get('scenarioId')
    turn_index = data.get('turnIndex')
    user_input = data.get('userInput', '')
    context = data.get('context', {})
    if scenario_id is None or turn_index is None:
        return web.json_response({'error': 'Missing scenarioId or turnIndex'}, status=400)
    result = get_response(scenario_id, turn_index, user_input, context)
    return web.json_response(result)


async def handle_classify(request):
    if not ENGINE_AVAILABLE:
        return web.json_response({'error': 'Response engine not available'}, status=503)
    data = await request.json() if request.content_length else {}
    text = data.get('text', '')
    result = classify_yes_no(text)
    return web.json_response({'classification': result})


async def handle_entities(request):
    if not ENGINE_AVAILABLE:
        return web.json_response({'error': 'Response engine not available'}, status=503)
    data = await request.json() if request.content_length else {}
    text = data.get('text', '')
    scenario_id = data.get('scenarioId', '')
    entities = extract_entities(text, scenario_id)
    return web.json_response({'entities': entities})


async def handle_intent_switch(request):
    if not ENGINE_AVAILABLE:
        return web.json_response({'error': 'Response engine not available'}, status=503)
    data = await request.json() if request.content_length else {}
    user_input = data.get('userInput', '')
    current_scenario = data.get('currentScenarioId', '')
    result = detect_intent_switch(user_input, current_scenario)
    return web.json_response({'switch': result})


async def handle_get_stats(request):
    """Return shared persistent stats."""
    return web.json_response(load_stats())


async def handle_update_stats(request):
    """Update shared persistent stats."""
    data = await request.json() if request.content_length else {}
    stats = load_stats()
    for key in DEFAULT_STATS:
        if key in data:
            stats[key] = data[key]
    save_stats(stats)
    return web.json_response(stats)


# ===== WebSocket Relay Handler =====

async def ws_relay(request):
    """WebSocket endpoint: relay browser <-> OpenAI Realtime API."""
    global API_KEY

    scenario_id = request.query.get('scenario') or None
    phone = request.query.get('phone') or None
    print(f"  [WS] Browser connected — scenario={scenario_id}, phone={phone}")

    # Upgrade to WebSocket
    browser_ws = web.WebSocketResponse(max_msg_size=2**24)
    await browser_ws.prepare(request)

    customer_context = None
    if phone and LLM_AVAILABLE:
        customer_context = lookup_customer(phone, scenario_id)
        print(f"  [WS] Customer: {customer_context.get('name') if customer_context else 'not found'}")

    if not API_KEY:
        await browser_ws.send_json({
            "type": "error",
            "error": {"message": "No API key configured. Open Settings to add your OpenAI API key."}
        })
        await browser_ws.close()
        return browser_ws

    if not LLM_AVAILABLE:
        await browser_ws.send_json({
            "type": "error",
            "error": {"message": "LLM engine not available."}
        })
        await browser_ws.close()
        return browser_ws

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
            await browser_ws.send_str(session_created)

            config = build_session_config(scenario_id, customer_context=customer_context, phone=phone)
            await openai_ws.send(json.dumps(config))
            print(f"  [WS] Sent session config")

            session_updated = await openai_ws.recv()
            print(f"  [WS] Got session.updated")
            await browser_ws.send_str(session_updated)

            print(f"  [WS] Sending response.create for greeting")
            await openai_ws.send(json.dumps({"type": "response.create"}))

            async def browser_to_openai():
                try:
                    async for msg in browser_ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            await openai_ws.send(msg.data)
                        elif msg.type == aiohttp.WSMsgType.ERROR:
                            break
                except Exception:
                    pass

            async def openai_to_browser():
                msg_count = 0
                try:
                    async for message in openai_ws:
                        if browser_ws.closed:
                            break
                        data = json.loads(message)
                        msg_count += 1
                        evt_type = data.get("type", "?")
                        if evt_type != "response.audio.delta":
                            print(f"  [WS] OpenAI → Browser: {evt_type}")
                        elif msg_count % 50 == 0:
                            print(f"  [WS] OpenAI → Browser: audio chunks ({msg_count} msgs)")

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
                            await openai_ws.send(json.dumps({"type": "response.create"}))

                        await browser_ws.send_str(message)

                except websockets.exceptions.ConnectionClosed:
                    pass
                except Exception:
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
        if not browser_ws.closed:
            await browser_ws.send_json({
                "type": "error",
                "error": {"message": error_msg}
            })
    except Exception as e:
        if not browser_ws.closed:
            try:
                await browser_ws.send_json({
                    "type": "error",
                    "error": {"message": f"Connection error: {str(e)}"}
                })
            except Exception:
                pass

    return browser_ws


# ===== App Setup =====

# ===== Security: block sensitive paths =====

BLOCKED_PREFIXES = ('.git', '.venv', '.vercel', '.env', '.claude', '__pycache__', 'node_modules', 'luna_stats')


async def handle_root(request):
    """Serve index.html for the root URL."""
    return web.FileResponse(os.path.join(os.getcwd(), 'index.html'))


@web.middleware
async def block_sensitive_paths(request, handler):
    """Block access to sensitive directories and files."""
    path = request.path.lstrip('/')
    for prefix in BLOCKED_PREFIXES:
        if path == prefix or path.startswith(prefix + '/'):
            raise web.HTTPNotFound()
    return await handler(request)


def create_app():
    app = web.Application(middlewares=[block_sensitive_paths, cors_middleware])

    # API routes
    app.router.add_post('/api/config', handle_config)
    app.router.add_post('/api/test-key', handle_test_key)
    app.router.add_post('/api/summarize', handle_summarize)
    app.router.add_post('/api/respond', handle_respond)
    app.router.add_post('/api/classify', handle_classify)
    app.router.add_post('/api/entities', handle_entities)
    app.router.add_post('/api/intent-switch', handle_intent_switch)
    app.router.add_get('/api/stats', handle_get_stats)
    app.router.add_post('/api/stats', handle_update_stats)

    # WebSocket relay — mounted at /ws (browser connects to /ws?scenario=...&phone=...)
    app.router.add_get('/ws', ws_relay)

    # Serve index.html at root
    app.router.add_get('/', handle_root)

    # Static files — serve the Demos directory (no directory listings)
    app.router.add_static('/', path=os.getcwd(), show_index=False)

    return app


if __name__ == '__main__':
    engine_status = "with Luna response engine" if ENGINE_AVAILABLE else "static only"
    llm_status = "LLM engine ready" if LLM_AVAILABLE else "LLM engine unavailable"
    ws_status = "WebSocket relay ready" if WS_AVAILABLE else "WebSocket unavailable (pip install websockets)"
    print(f"EXL Demos starting on port {PORT} ({engine_status}, {llm_status})")
    print(f"  {ws_status}")
    print(f"  HTTP + WebSocket on single port {PORT}")
    web.run_app(create_app(), host='0.0.0.0', port=PORT, print=None)
