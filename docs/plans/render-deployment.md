# Render Deployment Plan

## Goal
Deploy the entire EXL Demos app (static files + REST APIs + WebSocket relay) to Render as a single web service, enabling Luna's AI voice mode which requires persistent WebSocket connections.

## Problem
Vercel doesn't support persistent WebSocket connections. The Luna AI voice mode needs a WebSocket relay that bridges the browser to OpenAI's Realtime API. Render supports long-running processes with WebSocket connections.

## Architecture
Render exposes **one port** via `$PORT` env var. We need HTTP (static files + API) and WebSocket on the same port. The `websockets` library supports this via `process_request` — we can handle HTTP requests there and pass WebSocket upgrades to the relay handler.

## Changes Required

### 1. Create `render_serve.py` (new file)
A unified server using the `websockets` async library that handles both HTTP and WebSocket on a single port:
- **HTTP handling**: Serve static files + all `/api/*` POST endpoints via `process_request` callback
- **WebSocket handling**: The relay handler for OpenAI Realtime API (existing logic from `serve.py`)
- Use `$PORT` env var (default 8000 for local dev)
- Graceful SIGTERM handling for zero-downtime deploys on Render

Why a new file instead of modifying `serve.py`:
- `serve.py` uses `http.server` + threading for WS — works great locally
- Render needs a single-port async server — fundamentally different architecture
- Keep both so local dev (`serve.py`) and Render (`render_serve.py`) both work

### 2. Update `Luna Demo/index.html` (line 4073)
Change the hardcoded `ws://localhost:` WebSocket URL to dynamically detect the host:
```js
// Before:
const wsUrl = 'ws://localhost:' + state.wsPort + '/?scenario=...'

// After: use current host with wss:// in production, ws:// locally
const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = protocol + '//' + location.host + '/ws?scenario=...'
```
This works for both local dev and Render because:
- Local: `ws://localhost:8000/ws?scenario=...`
- Render: `wss://exl-demos.onrender.com/ws?scenario=...`

Also update the `state` object to remove `wsPort` dependency since WS is on same port.

### 3. Update `api/config.py` (Vercel endpoint)
Change `wsAvailable: False` → dynamically report based on deployment. Actually, on Vercel this should stay `False` since Vercel can't do WS. The `render_serve.py` config handler will return `True`.

### 4. Create `render.yaml`
Render blueprint for one-click deploy:
```yaml
services:
  - type: web
    name: exl-agentic-demos
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: python render_serve.py
    envVars:
      - key: OPENAI_API_KEY
        sync: false
```

### 5. No changes needed to:
- `CBI Demo/` — no API/localhost references, pure frontend
- `BPVA Demo/` — no API/localhost references, pure frontend
- `serve.py` — keep for local development
- `api/` directory — keep for Vercel deployment (alternative)
- `vercel.json` — keep as-is for Vercel deployment

## File Summary
| File | Action |
|------|--------|
| `render_serve.py` | **Create** — unified HTTP+WS server for Render |
| `render.yaml` | **Create** — Render deployment blueprint |
| `Luna Demo/index.html` | **Edit** line 4073 — dynamic WS URL |
| Everything else | No changes |

## Deployment Steps
1. Make the code changes above
2. Commit and push to GitHub
3. On Render dashboard: create new Web Service → connect GitHub repo
4. Set environment variable `OPENAI_API_KEY`
5. Deploy

## Notes
- Render free tier drops WebSocket connections after 5 minutes — need at least the Starter plan ($7/mo) for longer calls
- The Vercel deployment continues to work for everything except AI voice mode
- Both deployments share the same codebase, no conflicts
