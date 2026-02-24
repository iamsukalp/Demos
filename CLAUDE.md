# EXL AI Suite

Interactive showcase of three AI-powered demo apps for insurance and banking.

## Project Structure

```
serve.py              # Unified aiohttp server (HTTP + WebSocket, port 8000)
index.html            # Main portal linking to all 3 apps
render.yaml           # Render deployment config
requirements.txt      # Python deps: aiohttp, websockets

BPVA/index.html       # Agent Assist — insurance doc search + Q&A (single-file app)
CBI/                  # Conversational BI — banking analytics
  index.html, css/app.css, js/app.js, js/chat-engine.js,
  js/analytics-panel.js, js/scenarios.js, questions.csv
IRIS/                 # IRIS IVR — AI voice agent (most actively developed)
  index.html          # AI IVR app (5800+ lines, monolithic HTML/CSS/JS)
  traditional.html    # Traditional DTMF IVR (scripted menus)
  llm_engine.py       # System prompts, tool definitions, CUSTOMER_DB, mock function handlers
  response_engine.py  # Scripted keyword-matching response engine
  response_bank.py    # Response variants for all 10 scenarios
  serve.py            # Standalone IRIS server (port 8090 + WS 8091)
```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS, no frameworks, no build step. CDN deps: Tailwind v4, Chart.js, Marked.js, Supabase JS v2, Google Fonts.
- **Backend**: Python 3.11 — `aiohttp` (unified server), `websockets` (OpenAI Realtime relay).
- **APIs**: OpenAI Realtime API (`gpt-4o-realtime-preview`), OpenAI Chat/TTS, Supabase (PostgreSQL).
- **Deployment**: Render (`render.yaml`), URL: `https://exl-ai-suite.onrender.com`

## Architecture

```
Browser ──HTTP──> serve.py (port 8000) ──> Static files (all 3 apps)
Browser ──WS──> serve.py /ws ──relay──> OpenAI Realtime API (wss://api.openai.com)
                     │
                     ├─ Intercepts function_call events
                     └─ Executes mock handlers via llm_engine.handle_function_call()
```

Single-port architecture: aiohttp serves both HTTP and WebSocket on the same port (required for Render/PaaS).

## IRIS IVR (Primary App)

### Key Components

| File | Purpose |
|------|---------|
| `index.html` | AI IVR UI — voice calls, scenarios, history, compare mode |
| `traditional.html` | DTMF IVR — scripted keypad-based menus |
| `llm_engine.py` | OpenAI session config, system prompts, tool schemas, mock banking functions, CUSTOMER_DB (5 profiles) |
| `response_engine.py` | Keyword scoring, entity extraction, yes/no classification for scripted mode |
| `response_bank.py` | All scripted response variants, intent keywords for 10 scenarios |

### Data Flow (AI Voice Call)

1. User clicks Call → browser opens WebSocket to `/ws?scenario=X&phone=Y`
2. Server connects to OpenAI Realtime API, sends session config (instructions + tools)
3. Browser streams mic audio (PCM16) → relay → OpenAI
4. OpenAI responds with audio + function calls
5. Server intercepts function calls → executes mock handlers → sends results back
6. Audio streams back to browser for playback
7. On call end → `saveCallToHistory()` persists to Supabase

### 10 Banking Scenarios

block-card, loan-balance, dispute, restructure, reset-password, activate-card, transfer-funds, credit-limit, mortgage-rate, wire-transfer

Each scenario defines: system prompt overlay, tool set, mock function handlers, scripted DTMF equivalent.

### Customer Profiles (CUSTOMER_DB in llm_engine.py)

5 profiles keyed by phone number: Varun Khator (Platinum), Marcus Thompson (Gold), Sofia Ramirez (Silver), Emily Chen (Platinum), James O'Brien (Gold). Each has full financial history (checking, savings, credit card, loans, mortgage, credit score).

### Supabase Integration

- **Table**: `iris_history` (id, created_at, customer_name, customer_phone, duration, duration_seconds, intent, actions_taken, outcome, messages)
- **Client-side only**: Supabase JS loaded via CDN in `index.html`, anon key hardcoded (public, safe — security via RLS)
- **Server endpoints**: `/api/history` GET/POST/DELETE are no-op stubs (history fully client-side)
- Column mapping: snake_case DB ↔ camelCase JS

## Conventions

### Code Style
- **Single-file HTML apps**: All CSS in `<style>`, all JS in `<script>`, no external files (except CBI)
- **CSS**: Custom properties for theming (`--orange`, `--navy`, `--gray-*`), dark mode via `.dark` class on `<html>`, BEM-like naming
- **JS State**: Global `state` object for UI state, `dom` object caching element references
- **No frameworks**: Everything is vanilla JS with DOM manipulation

### Patterns
- **Optimistic UI**: Update in-memory state + render immediately, persist to Supabase in background
- **Guarded init**: Wrap `supabase.createClient()` in try/catch for CDN failure resilience
- **Null guards**: All Supabase operations check `if (!_supabaseClient) return`
- **Fire-and-forget**: Background saves don't block UI
- **Anti-flash**: Dark mode class applied in `<head>` before paint

### API Key Management
- `OPENAI_API_KEY` environment variable (server-side)
- Runtime config via `POST /api/config` — browser settings UI lets users set/test keys
- Key validated against OpenAI before storing

## Development

```bash
# Start server (serves all 3 apps)
python serve.py
# → http://localhost:8000

# Or use Claude launch config
# .claude/launch.json → "exl-server"
```

No npm/build step — edit HTML files and refresh browser.

### Deployment
- Push to `main` → Render auto-deploys
- Render caches aggressively — use `?v=N` query param to bust cache during testing
- `OPENAI_API_KEY` must be set in Render dashboard (not in render.yaml)

## Common Tasks

### Adding a New IRIS Scenario
1. `llm_engine.py` — Add to `SCENARIO_PROMPTS`, `SCENARIO_TOOLS`, implement handler in `handle_function_call()`
2. `index.html` — Add to `SCENARIOS` object and `DTMF_SCENARIOS` for compare mode
3. `response_bank.py` — Add scripted response stages and variants
4. `response_engine.py` — Add to `INTENT_KEYWORDS` if needed

### Modifying IRIS UI
- All CSS is inline in `<style>` block of `index.html` or `traditional.html`
- JS is in `<script>` at end of body
- State lives in global `state` object, DOM refs in `dom` object

### Call History
- CRUD operations in `index.html`: `saveCallToHistory()`, `loadHistory()`, `deleteHistoryItem()`, `clearHistory()`
- Supabase table: `iris_history`, project: `fdwmywxvjlrqutohonln.supabase.co`
- History saves from AI calls (all 3 paths): scripted playback, compare mode AI side, live Realtime API calls
