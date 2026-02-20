# Luna IVR - AI Voice Call Containment Demo

An interactive demo showcasing AI-powered IVR (Interactive Voice Response) call containment for banking. Luna is a real-time AI voice agent that handles customer calls using OpenAI's Realtime API, with phone-number-based customer identification, mock banking tools, and scenario-specific validation.

## Features

- **AI Voice Mode** — Real-time voice conversation using OpenAI Realtime API (`gpt-4o-realtime-preview`)
- 10 banking call scenarios with dedicated tool sets and prompts
- Freeform "Start Call" mode for open-ended conversations
- Phone-number-based customer lookup with rich financial profile
- Collapsible sidebar showing customer details on call connect (with shimmer loading animation)
- Mock banking tool calls with scenario-specific account validation
- Call resolution cards showing intent, actions taken, and containment vs. escalation outcome
- Real-time transcript with response ID tracking for correct message ordering
- Whisper hallucination filtering

## Scenarios

| Scenario | Account (Last 4) | Outcome |
|----------|:-----------------:|---------|
| Block Card | 5531 | Contained |
| Loan Balance | 7712 | Contained |
| Dispute Transaction | 5531 | Escalated |
| Account Restructuring | 4829 | Escalated |
| Reset Password | 5531 | Contained |
| Activate Card | 5531 | Contained |
| Transfer Funds | 4829 | Contained |
| Credit Limit Increase | 5531 | Escalated |
| Mortgage Rate | 4401 | Escalated |
| Wire Transfer | 4829 | Escalated |

## Project Structure

```
Luna Demo/
├── index.html           # Single-file app (HTML/CSS/JS) — UI, audio, WebSocket client
├── llm_engine.py        # LLM system prompts, tool definitions, mock banking handlers
├── response_engine.py   # Scripted response engine (bot mode, no LLM)
├── serve.py             # Standalone server (port 8090 HTTP + 8091 WebSocket)
├── demo-script.csv      # Demo script reference for presenters
├── requirements.txt     # Python dependencies
└── README.md            # This file
```

## Architecture

```
Browser (index.html)
  ├── Mic → PCM16 audio → base64 chunks
  ├── WebSocket client ──────────────────┐
  └── Audio playback ← PCM16 audio      │
                                         ▼
                              serve.py (WebSocket relay)
                              ├── Phone → Customer lookup
                              ├── Session config builder
                              ├── Function call handler ←──── llm_engine.py
                              │   ├── verify_identity
                              │   ├── block_card, transfer_funds, ...
                              │   └── end_call
                              └── Relay ──────────────────┐
                                                          ▼
                                              OpenAI Realtime API
                                              (gpt-4o-realtime-preview)
```

## Prerequisites

- **Python 3.x**
- **Google Chrome** (required for Web Audio API and microphone access)
- **Microphone** (required for voice input)
- **OpenAI API key** with access to `gpt-4o-realtime-preview`
- **Internet connection**

## Setup & Installation

### 1. Install Python

Download and install Python 3.x from [python.org](https://www.python.org/downloads/).

### 2. Create a virtual environment (recommended)

```bash
cd "E:\EXL\Demos\Luna Demo"
python -m venv venv
```

Activate:

- **Windows:** `venv\Scripts\activate`
- **macOS / Linux:** `source venv/bin/activate`

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This installs `websockets` for the OpenAI Realtime API WebSocket relay.

## Running the App

### Option A: From the root server (recommended)

```bash
cd "E:\EXL\Demos"
python serve.py
```

Open `http://localhost:8000/Luna%20Demo/` in Chrome.

### Option B: Standalone

```bash
cd "E:\EXL\Demos\Luna Demo"
python serve.py
```

Open `http://localhost:8090` in Chrome.

> **Important:** Use `http://`, not `https://`.

## OpenAI API Key

The server includes a hardcoded demo key. To use your own:

1. Click the **Settings** gear icon in Luna's header
2. Enter your OpenAI API key
3. Click **Test & Save**

The key is validated against the OpenAI API before being stored in the server session.

## Customer Data

The demo uses a single customer profile for all scenarios:

| Field | Value |
|-------|-------|
| Name | Varun Khator |
| Phone | +91-7978961229 |
| Tier | Platinum |
| Checking | ****4829 — $8,342.15 |
| Savings | ****9088 — $45,200.00 |
| Visa Platinum | ****5531 — $6,200.00 balance, $25,000 limit |
| Auto Loan | ****7712 — $14,230.67 remaining |
| Mortgage | ****4401 — $287,000 at 5.8% |
| Credit Score | 782 (Excellent) |

Each scenario validates against its specific account number. For example, the Block Card scenario only accepts card ending in **5531** (the Visa Platinum).

## Usage

1. Select a scenario from the dropdown (or click **Start Call** for freeform)
2. Click the **Call** button
3. Watch the shimmer loading animation as customer data is fetched
4. Luna greets you by name — speak naturally to interact
5. When done, say goodbye — Luna will end the call and show a resolution card

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change `PORT` in `serve.py` |
| ERR_SSL_PROTOCOL_ERROR | Use `http://` not `https://` |
| No voice / silence | Grant microphone permission in Chrome |
| "WebSocket relay unavailable" | `pip install websockets` |
| "Invalid API key" | Enter a valid key in Settings |
| "LLM engine not available" | Ensure `llm_engine.py` is in the Luna Demo directory |
| Messages out of order | Hard refresh with **Ctrl+Shift+R** |
