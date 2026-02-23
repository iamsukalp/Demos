# EXL AI Suite

An interactive showcase of three AI-powered apps for insurance and banking domains. Each app is a self-contained web application served from a single local development server.

| App | Domain | Description |
|-----|--------|-------------|
| **Agent Assist** | Insurance | AI-powered document search with conversational Q&A, document ingestion pipeline, and analytics |
| **Conversational BI** | Banking | Natural-language business intelligence with charts, data tables, SQL, and insights |
| **IRIS IVR** | Banking | AI voice agent for IVR call containment with OpenAI Realtime API, real-time speech, and mock banking tools |

## Project Structure

```
EXL Demos/
├── index.html                    # Main portal (links to all 3 apps)
├── serve.py                      # Unified server: HTTP (8000) + WebSocket relay (8091)
├── requirements.txt              # Python dependencies
├── README.md                     # This file
│
├── BPVA/                         # Agent Assist
│   └── index.html                # Single-file app (HTML/CSS/JS)
│
├── CBI/                          # Conversational BI
│   ├── index.html
│   ├── css/app.css
│   ├── js/
│   │   ├── app.js
│   │   ├── chat-engine.js
│   │   ├── analytics-panel.js
│   │   └── scenarios.js
│   └── questions.csv
│
└── IRIS/                         # IRIS IVR
    ├── index.html                # Single-file app (HTML/CSS/JS)
    ├── llm_engine.py             # LLM prompts, tool defs, and mock banking handlers
    ├── response_engine.py        # Scripted response engine (bot mode)
    ├── serve.py                  # Standalone server (port 8090)
    ├── requirements.txt
    ├── README.md
    └── demo-script.csv
```

## Prerequisites

- **Python 3.x** (for the local development server)
- **Google Chrome** (recommended for microphone and Web Audio API support)
- **Microphone** (required for IRIS IVR AI voice calls)
- **OpenAI API key** (required for IRIS IVR AI mode — needs access to `gpt-4o-realtime-preview`)
- **Internet connection** (CDN libraries and OpenAI API calls require connectivity)

## Setup & Installation

### 1. Install Python

Download and install Python 3.x from [python.org](https://www.python.org/downloads/).

Verify the installation:

```bash
python --version
```

### 2. Create a virtual environment (recommended)

```bash
cd "E:\EXL\Demos"
python -m venv venv
```

Activate the environment:

- **Windows (Command Prompt):**
  ```bash
  venv\Scripts\activate
  ```
- **Windows (PowerShell):**
  ```bash
  venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `websockets` — used by the WebSocket relay server for IRIS IVR AI voice mode

All front-end dependencies (Tailwind CSS, Chart.js, Marked.js, Google Fonts) are loaded via CDN at runtime — no npm or build step is required.

## Starting the Server

### Option A: Serve all apps from the root (recommended)

```bash
cd "E:\EXL\Demos"
python serve.py
```

You should see:

```
EXL Demos on http://localhost:8000 (with IRIS response engine)
  IRIS AI mode: WebSocket relay active
  WebSocket relay on ws://localhost:8091
```

Open **Google Chrome** and navigate to:

```
http://localhost:8000
```

This opens the main portal with cards for all three apps. Click any card to launch that app.

### IRIS IVR (standalone)

IRIS IVR has its own server for standalone use:

```bash
cd "E:\EXL\Demos\IRIS"
python serve.py
```

This serves IRIS IVR on `http://localhost:8090`. See `IRIS/README.md` for full details.

> **Important:** Always use `http://`, not `https://`. These are local dev servers without SSL.

## Accessing the Apps

Once the server is running at `http://localhost:8000`:

| URL | App |
|-----|-----|
| `http://localhost:8000` | Main portal |
| `http://localhost:8000/BPVA/` | Agent Assist |
| `http://localhost:8000/CBI/` | Conversational BI |
| `http://localhost:8000/IRIS/` | IRIS IVR |

## App Details

### Agent Assist (BPVA)

- Chat interface with 6 starter questions about insurance claims
- Document ingestion pipeline — click the upload zone to select a file, watch the parse/chunk/embed/store animation
- Knowledge Base table with activate/deactivate toggles
- Analytics dashboard with charts and counters

### Conversational BI (CBI)

- Split-panel layout: Chat (left) + Analytics (right)
- 21 banking scenarios (deposits, loans, NPAs, revenue, etc.)
- Auto-generated charts, data tables, SQL queries, and insights
- Dark mode toggle

### IRIS IVR

- **AI Voice Mode** — Real-time voice conversation with IRIS using OpenAI's Realtime API (`gpt-4o-realtime-preview`)
- 10 banking call scenarios: Block Card, Loan Balance, Dispute Transaction, Account Restructuring, Reset Password, Activate Card, Transfer Funds, Credit Limit Increase, Mortgage Rate, Wire Transfer
- Freeform "Start Call" mode for open-ended conversations
- Phone-number-based customer lookup with rich financial profile
- Collapsible sidebar with customer details (accounts, balances, credit score)
- Shimmer loading animation on call connect
- Mock banking tool calls with scenario-specific validation
- Call resolution cards showing intent, actions taken, and containment outcome

## OpenAI API Key

IRIS IVR AI mode requires an OpenAI API key with access to the `gpt-4o-realtime-preview` model.

The server includes a hardcoded built-in key for convenience. To use your own key:
1. Open IRIS IVR in the browser
2. Click the Settings gear icon
3. Enter your OpenAI API key
4. Click "Test & Save"

## CDN Dependencies (loaded at runtime)

| Library | Version | Used By |
|---------|---------|---------|
| Tailwind CSS | v4 | All apps |
| Chart.js | v4 | Agent Assist, Conversational BI |
| Marked.js | latest | Agent Assist |
| Google Fonts (Inter, JetBrains Mono) | — | All apps |
| Material Icons | — | Conversational BI |

No local installation is needed for these — they are fetched from CDN when the page loads.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `python` not recognized | Install Python 3.x and add it to your system PATH |
| Port already in use | Stop other processes on the port, or change `PORT` in `serve.py` |
| ERR_SSL_PROTOCOL_ERROR | Use `http://` not `https://` |
| Page shows stale content | Hard refresh with **Ctrl+Shift+R**, or restart the server |
| Charts not rendering | Check internet connection (Chart.js loads via CDN) |
| IRIS IVR — no voice | Use Google Chrome and grant microphone permission |
| IRIS AI — "WebSocket relay unavailable" | Install `websockets` with `pip install websockets` |
| IRIS AI — "Invalid API key" | Open Settings and enter a valid OpenAI API key |
| Blank page / 404 | Ensure you started the server from the correct directory |
