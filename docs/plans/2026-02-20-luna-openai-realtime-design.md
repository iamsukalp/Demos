# Luna IVR — OpenAI Realtime API Integration Design

## Goal

Transform Luna from a scripted IVR demo into a fully conversational AI banking assistant using OpenAI's Realtime API. Users talk to Luna like a real phone call — no record/stop buttons, sub-second latency, voice in and voice out.

## Architecture

```
Browser (index.html)
├── Settings modal (API key input → localStorage)
├── Chat UI (live transcript — both sides)
├── Audio Context (mic in / speaker out — continuous)
└── WebSocket client → ws://localhost:8090/ws
        │
serve.py (Python)
├── HTTP server (static files + /api/config)
└── WebSocket relay (/ws) → proxies to OpenAI
        │
OpenAI Realtime API (wss://api.openai.com/v1/realtime)
├── Speech-to-text (user audio in)
├── GPT-4o reasoning (system prompt + conversation)
├── Text-to-speech (Luna voice out)
└── VAD (automatic turn detection)
```

## Decisions Made

- **Fully dynamic conversations** — no scripted response bank for AI mode
- **GPT-4o-mini** for reasoning (fast, cheap, smart enough for banking demos)
- **API key via UI** — presenter pastes key in settings modal, stored in localStorage, sent to server on load
- **TTS enabled by default** — Luna speaks all responses
- **Server-side relay** — browser connects to our server, server proxies to OpenAI (keeps API key server-side)
- **Fallback to scripted mode** — if no API key, existing keyword engine works as before

## System Prompts

Base prompt (shared):
- Luna persona: warm, professional, concise banking AI assistant
- Compliance rules: never share full account numbers, require verification
- Response style: 1-3 sentences, natural conversational tone

Scenario-specific context (appended per call):
- Caller profile (name, account, tier)
- Scenario objective and available actions
- Resolution path (bot-resolve vs. escalate to agent)

## Function Calling (Tools)

Each scenario defines tools Luna can "execute":
- `block_card(card_last_4)` — places hold, orders replacement
- `check_balance(account_id)` — returns mock balance
- `transfer_funds(from, to, amount)` — mock transfer
- `verify_identity(last_4_digits)` — mock verification
- etc.

Tools return mock banking data to make the demo feel real.

## Frontend Changes

- **Settings modal:** gear icon in header, API key input, connection status indicator
- **Call flow:** "Start Call" opens WebSocket + mic, "End Call" closes both
- **Transcript:** live word-by-word rendering for both customer and Luna
- **Audio:** browser speakers play Luna's voice continuously, mute button available
- **No record/stop/done buttons** — VAD handles turn-taking
- **Text input kept** as accessibility fallback (hidden during active voice call)

## Server Changes

- `serve.py` — add WebSocket server (via `websockets` lib), `/api/config` endpoint
- New `llm_engine.py` — system prompts, tool definitions, mock banking functions
- `requirements.txt` — add `openai`, `websockets`

## Fallback Mode

When no API key is configured:
- Existing `response_engine.py` + `response_bank.py` handle conversations
- Settings modal shows "Scripted mode — add API key for AI mode"
- All current functionality preserved

## Escalation Handling

- Bot-contained scenarios (6): Luna resolves via conversation + function calls
- Agent-escalation scenarios (4): Luna gathers info, then says "connecting you with a specialist" → disconnect Realtime session → switch to scripted agent messages

## Files

| File | Action | Purpose |
|------|--------|---------|
| `llm_engine.py` | Create | System prompts, tools, mock banking functions |
| `serve.py` | Modify | WebSocket relay, /api/config |
| `requirements.txt` | Modify | Add openai, websockets |
| `index.html` | Modify | Settings modal, WS client, audio streaming, new call flow |
| `response_engine.py` | Keep | Fallback mode |
| `response_bank.py` | Keep | Fallback mode |
