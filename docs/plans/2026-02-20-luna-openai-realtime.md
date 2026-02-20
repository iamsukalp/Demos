# Luna OpenAI Realtime API Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Luna from a scripted IVR demo into a fully conversational AI assistant using OpenAI's Realtime API (WebSocket), with real-time voice in/out, live transcripts, function calling, and fallback to scripted mode.

**Architecture:** Python WebSocket relay server proxies between browser and OpenAI Realtime API. Browser streams mic audio via WebSocket, receives Luna's voice + transcript in real-time. System prompts per scenario define Luna's behavior. Function calling simulates banking actions.

**Tech Stack:** Python 3.9+, `websockets`, `openai` (pip), OpenAI Realtime API (`gpt-4o-realtime-preview`), vanilla JS (Web Audio API, WebSocket API)

**Design Doc:** `docs/plans/2026-02-20-luna-openai-realtime-design.md`

---

## Task 1: Python Dependencies & Project Setup

**Files:**
- Modify: `Luna Demo/requirements.txt`

**Step 1: Update requirements.txt**

```
# Luna IVR Demo - Python Dependencies
# Core server (stdlib)
#   - http.server, socketserver, os, json, asyncio
# OpenAI Realtime API integration
websockets>=12.0
openai>=1.0
```

**Step 2: Install dependencies**

Run: `cd "E:/EXL/Demos/Luna Demo" && pip install websockets openai`
Expected: Both packages install successfully

**Step 3: Verify imports work**

Run: `python -c "import websockets; import openai; print('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add "Luna Demo/requirements.txt"
git commit -m "feat(luna): add websockets and openai dependencies"
```

---

## Task 2: LLM Engine — System Prompts & Tools

**Files:**
- Create: `Luna Demo/llm_engine.py`

**Step 1: Create llm_engine.py with base system prompt and all 10 scenario prompts**

The file must contain:

1. `BASE_SYSTEM_PROMPT` — Luna's persona, tone, compliance rules, response style
2. `SCENARIO_PROMPTS` dict — one entry per scenario with caller profile, objective, resolution path
3. `SCENARIO_TOOLS` dict — function call definitions per scenario (e.g., `block_card`, `check_balance`)
4. `build_session_config(scenario_id)` — returns the full `session.update` config dict including:
   - `instructions` (base + scenario prompt combined)
   - `voice` ("alloy")
   - `modalities` (["text", "audio"])
   - `input_audio_format` ("pcm16")
   - `output_audio_format` ("pcm16")
   - `input_audio_transcription` ({"model": "whisper-1"})
   - `turn_detection` ({"type": "server_vad", "threshold": 0.5, "silence_duration_ms": 500, "prefix_padding_ms": 300})
   - `tools` (scenario-specific function definitions)
   - `tool_choice` ("auto")
   - `temperature` (0.8)
5. `handle_function_call(name, arguments)` — returns mock JSON responses for each banking tool

**Base system prompt content:**
```
You are Luna, an AI-powered banking assistant for EXL Financial Services.

Personality: Warm, professional, concise. You sound like a helpful bank representative.
Response style: Keep responses to 1-3 sentences. Be conversational, not robotic.
Greeting: Always greet the caller by name when you know it.

Compliance rules:
- Never read out full account numbers. Only reference last 4 digits.
- Always verify the caller's identity before making account changes.
- If you cannot help, offer to transfer to a human agent.

When you use a tool/function, briefly tell the caller what you're doing (e.g., "Let me pull up your account...").
After a tool returns results, summarize the key information naturally.

If the caller asks about something outside your banking capabilities, politely redirect them.
```

**Scenario prompt example (block-card):**
```
CURRENT CALL CONTEXT:
Caller: Varun Khator (Platinum tier member)
Account: ****4829
Phone: (555) 234-5678
Verified: Yes (phone number matched)

Scenario: The caller wants to block/freeze their credit card.
Your objective: Verify which card, place an immediate hold, order a replacement, and confirm.

Available actions (use the provided tools):
- verify_identity: Verify caller by last 4 digits of card
- block_card: Block the specified card immediately
- order_replacement: Order a replacement card

Resolution: You can handle this entirely. Do NOT transfer to an agent.
```

**Tool definition example:**
```python
{
    "type": "function",
    "name": "block_card",
    "description": "Block a credit card immediately. Use when caller confirms the card to block.",
    "parameters": {
        "type": "object",
        "properties": {
            "card_last_4": {
                "type": "string",
                "description": "Last 4 digits of the card to block"
            },
            "reason": {
                "type": "string",
                "enum": ["lost", "stolen", "fraud", "other"],
                "description": "Reason for blocking"
            }
        },
        "required": ["card_last_4"]
    }
}
```

**Mock function response example:**
```python
def handle_function_call(name, arguments):
    if name == "block_card":
        return json.dumps({
            "success": True,
            "card_last_4": arguments.get("card_last_4", "4829"),
            "status": "blocked",
            "block_time": "2024-01-15T10:30:00Z",
            "replacement_eligible": True
        })
```

All 10 scenarios need prompts and tools:
- `block-card`: verify_identity, block_card, order_replacement
- `loan-balance`: check_loan_balance, calculate_payoff
- `dispute`: file_dispute, get_transaction_details
- `restructure`: get_account_details → then ESCALATE (tell caller you'll transfer)
- `reset-password`: send_reset_link, unlock_account
- `activate-card`: activate_card, enable_contactless
- `transfer-funds`: transfer_funds, check_balance
- `credit-limit`: check_credit_score, request_limit_increase → ESCALATE
- `mortgage-rate`: get_mortgage_details, check_rates → ESCALATE
- `wire-transfer`: initiate_wire, verify_recipient → ESCALATE

For escalation scenarios (restructure, credit-limit, mortgage-rate, wire-transfer), the system prompt should instruct Luna to gather initial information, then tell the caller she's transferring them to a specialist.

**Step 2: Verify the module loads**

Run: `cd "E:/EXL/Demos/Luna Demo" && python -c "from llm_engine import build_session_config, handle_function_call; print(build_session_config('block-card')['session']['instructions'][:50])"`
Expected: First 50 chars of the combined system prompt

**Step 3: Commit**

```bash
git add "Luna Demo/llm_engine.py"
git commit -m "feat(luna): add LLM engine with system prompts and tools for all 10 scenarios"
```

---

## Task 3: WebSocket Relay Server

**Files:**
- Modify: `Luna Demo/serve.py`

**Step 1: Rewrite serve.py to support both HTTP and WebSocket**

The server needs to:

1. Keep the existing HTTP server for static files and `/api/config` endpoint
2. Add a WebSocket server on a separate port (8091) using the `websockets` library
3. `/api/config` POST endpoint: receives `{"apiKey": "sk-..."}`, stores in a global variable (never written to disk)
4. WebSocket handler (`/ws`):
   - On connection: read `scenarioId` from query params
   - Open a WebSocket to `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview` with auth headers
   - Send `session.update` event with config from `build_session_config(scenario_id)`
   - Relay all messages bidirectionally:
     - Browser → Server → OpenAI (audio chunks, etc.)
     - OpenAI → Server → Browser (audio deltas, transcripts, function calls)
   - On function call (`response.function_call_arguments.done`):
     - Call `handle_function_call(name, args)`
     - Send `conversation.item.create` with function_call_output
     - Send `response.create` to resume after tool use
   - On disconnect: close OpenAI WebSocket

**Key implementation details:**

```python
import asyncio
import websockets
import json
import threading
from llm_engine import build_session_config, handle_function_call

API_KEY = None  # Set via /api/config

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"

async def relay_handler(browser_ws):
    """Handle a browser WebSocket connection by relaying to OpenAI."""
    # Parse scenario from query string
    path = browser_ws.request.path  # e.g., /ws?scenario=block-card
    # Extract scenario_id from query params

    if not API_KEY:
        await browser_ws.send(json.dumps({"type": "error", "message": "No API key configured"}))
        return

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "OpenAI-Beta": "realtime=v1"
    }

    async with websockets.connect(OPENAI_REALTIME_URL, extra_headers=headers) as openai_ws:
        # Wait for session.created
        session_created = await openai_ws.recv()
        await browser_ws.send(session_created)

        # Send session config
        config = build_session_config(scenario_id)
        await openai_ws.send(json.dumps(config))

        # Bidirectional relay
        async def browser_to_openai():
            async for message in browser_ws:
                await openai_ws.send(message)

        async def openai_to_browser():
            async for message in openai_ws:
                data = json.loads(message)

                # Intercept function calls
                if data["type"] == "response.function_call_arguments.done":
                    result = handle_function_call(data["name"], json.loads(data["arguments"]))
                    # Send function output back to OpenAI
                    await openai_ws.send(json.dumps({
                        "type": "conversation.item.create",
                        "item": {
                            "type": "function_call_output",
                            "call_id": data["call_id"],
                            "output": result
                        }
                    }))
                    await openai_ws.send(json.dumps({"type": "response.create"}))

                # Forward everything to browser
                await browser_ws.send(message)

        await asyncio.gather(browser_to_openai(), openai_to_browser())

async def start_ws_server():
    async with websockets.serve(relay_handler, "0.0.0.0", 8091):
        await asyncio.Future()  # run forever

# Run WS server in a thread alongside HTTP server
threading.Thread(target=lambda: asyncio.run(start_ws_server()), daemon=True).start()
```

The HTTP server stays on port 8090, WebSocket server on 8091.

**Step 2: Test the server starts without errors**

Run: `cd "E:/EXL/Demos/Luna Demo" && timeout 3 python serve.py || true`
Expected: Server starts, prints status for both HTTP and WS servers

**Step 3: Commit**

```bash
git add "Luna Demo/serve.py"
git commit -m "feat(luna): add WebSocket relay server for OpenAI Realtime API"
```

---

## Task 4: Frontend — Settings Modal (API Key Input)

**Files:**
- Modify: `Luna Demo/index.html`

**Step 1: Add settings modal HTML**

Add after the header section in the HTML body:

- A gear icon button in the header (next to dark mode toggle and home button)
- A modal overlay with:
  - Title: "Settings"
  - API Key input field (password type, with show/hide toggle)
  - Connection status indicator (red dot = not configured, green dot = connected)
  - "Save" button
  - "Close" button
- Modal CSS: centered, white card, overlay backdrop, dark mode compatible

**Step 2: Add settings JavaScript**

- `openSettingsModal()` / `closeSettingsModal()` — toggle modal visibility
- `saveApiKey()` — save to localStorage, send to server via `POST /api/config`
- `loadApiKey()` — on page load, read from localStorage, send to server
- `checkConnection()` — test if API key is valid by attempting a config save, update indicator
- Update the header actions area to include the gear icon

**Step 3: Add CSS for the settings modal**

Style the modal to match the existing design system (orange accent, rounded corners, shadows, dark mode support).

**Step 4: Verify manually**

Open `http://localhost:8090` in browser, click gear icon, enter a test key, save. Check localStorage has the key. Check the status indicator updates.

**Step 5: Commit**

```bash
git add "Luna Demo/index.html"
git commit -m "feat(luna): add settings modal for OpenAI API key configuration"
```

---

## Task 5: Frontend — WebSocket Client & Audio Streaming

**Files:**
- Modify: `Luna Demo/index.html`

**Step 1: Add WebSocket client and audio infrastructure**

Add new JavaScript functions to `index.html`:

**WebSocket connection management:**
```javascript
// State additions
state.ws = null;           // WebSocket to our relay server
state.audioContext = null;  // Web Audio API context (reuse existing)
state.aiMode = false;       // true when API key is configured

async function connectRealtime(scenarioId) {
    const ws = new WebSocket(`ws://localhost:8091/ws?scenario=${scenarioId}`);
    state.ws = ws;

    ws.onopen = () => {
        console.log('Realtime connected');
        updateCallState('connected-bot');
        startMicStream();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealtimeEvent(data);
    };

    ws.onclose = () => {
        console.log('Realtime disconnected');
        stopMicStream();
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        addSystemMessage('Connection error. Falling back to scripted mode.');
        state.aiMode = false;
    };
}

function disconnectRealtime() {
    if (state.ws) {
        state.ws.close();
        state.ws = null;
    }
    stopMicStream();
}
```

**Microphone streaming (PCM16, 24kHz):**
```javascript
async function startMicStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaStream = stream;

    const audioContext = new AudioContext({ sampleRate: 24000 });
    state.audioContext = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
        if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);
        // Convert float32 to PCM16
        const pcm16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.floor(float32[i] * 32768)));
        }

        // Base64 encode and send
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        state.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64
        }));
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
}
```

**Audio playback (receiving Luna's voice):**
```javascript
// Audio playback queue
state.audioQueue = [];
state.isPlayingAudio = false;

function handleRealtimeEvent(event) {
    switch (event.type) {
        case 'session.created':
        case 'session.updated':
            console.log('Session ready');
            break;

        case 'response.audio.delta':
            // Queue audio chunk for playback
            queueAudioChunk(event.delta);
            break;

        case 'response.audio_transcript.delta':
            // Update Luna's transcript in real-time
            appendBotTranscript(event.delta);
            break;

        case 'response.audio_transcript.done':
            // Finalize Luna's message
            finalizeBotMessage(event.transcript);
            break;

        case 'conversation.item.input_audio_transcription.completed':
            // Show what the user said
            addCustomerMessage(event.transcript);
            break;

        case 'input_audio_buffer.speech_started':
            // User started talking — interrupt Luna if she's speaking
            interruptAudioPlayback();
            showUserSpeakingIndicator(true);
            break;

        case 'input_audio_buffer.speech_stopped':
            showUserSpeakingIndicator(false);
            break;

        case 'response.function_call_arguments.done':
            // Show tool usage in transcript
            addSystemMessage(`Luna is ${getToolDescription(event.name)}...`);
            break;

        case 'response.done':
            // Check if escalation happened
            checkForEscalation(event);
            break;

        case 'error':
            console.error('Realtime error:', event.error);
            addSystemMessage('An error occurred. ' + (event.error?.message || ''));
            break;
    }
}

function queueAudioChunk(base64Delta) {
    // Decode base64 to PCM16 bytes
    const binaryString = atob(base64Delta);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert PCM16 to Float32 for Web Audio API
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
    }

    // Create AudioBuffer and play
    const audioBuffer = state.audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = state.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(state.audioContext.destination);
    source.start();
}
```

**Step 2: Modify the call flow**

Update `selectScenario()` and call flow functions:
- If `state.aiMode` is true (API key configured): use `connectRealtime(scenarioId)` instead of `playScenario()`
- If `state.aiMode` is false: use existing scripted `playScenario()` as fallback
- Update `endCall()` to call `disconnectRealtime()`
- Update "Start Call" freeform button to use realtime mode

**Step 3: Add transcript management for realtime mode**

- `appendBotTranscript(delta)` — appends text character by character to the current bot message bubble (creates one if needed)
- `finalizeBotMessage(fullText)` — marks the current bot message as complete
- `addCustomerMessage(transcript)` — adds a customer message bubble with their transcribed speech
- `showUserSpeakingIndicator(active)` — shows/hides a pulsing indicator when user is talking

**Step 4: Add a mode indicator in the UI**

Show "AI Mode" or "Scripted Mode" badge in the header or footer based on `state.aiMode`.

**Step 5: Commit**

```bash
git add "Luna Demo/index.html"
git commit -m "feat(luna): add WebSocket client, mic streaming, and audio playback for Realtime API"
```

---

## Task 6: Frontend — Updated Call Flow UI

**Files:**
- Modify: `Luna Demo/index.html`

**Step 1: Simplify the voice input area for AI mode**

When in AI mode:
- Hide the "Done Speaking" button — VAD handles turn detection
- Hide the text input area during active calls (keep it as fallback when not in a call)
- Show a simple call control bar:
  - Large "End Call" button (red)
  - Mute mic toggle button
  - Speaker mute toggle button
  - Call timer (reuse existing)
- Show a live waveform visualization (reuse existing canvas, but drive it from mic input continuously)

When in scripted mode:
- Keep everything as-is (current UI)

**Step 2: Update the call initiation flow**

When user clicks a scenario card in AI mode:
1. Show "ringing" state (500ms, same as current)
2. Connect to WebSocket relay
3. OpenAI session starts → Luna automatically greets the caller (the system prompt instructs her to greet)
4. User talks naturally — no buttons needed

When user clicks "Start Call" (freeform) in AI mode:
1. Connect with a generic system prompt (no scenario-specific context)
2. Luna greets: "Hi, this is Luna from EXL Financial. How can I help you today?"
3. Based on what the user says, Luna handles it naturally (no intent detection needed — GPT does it)

**Step 3: Handle escalation in AI mode**

When Luna decides to escalate (says something like "transfer to a specialist"):
- Detect escalation via function call or transcript keywords
- Disconnect the Realtime WebSocket
- Show transfer animation (1500ms, same as current)
- Show transfer summary card (generate from conversation context)
- Switch to scripted agent messages (same as current)

**Step 4: Update metrics**

- `state.stats.botContained` / `state.stats.agentEscalated` — increment based on whether Luna escalated
- Track whether AI mode was used in the session

**Step 5: Commit**

```bash
git add "Luna Demo/index.html"
git commit -m "feat(luna): update call flow UI for realtime conversational mode"
```

---

## Task 7: Audio Playback Improvements

**Files:**
- Modify: `Luna Demo/index.html`

**Step 1: Implement proper audio queue for smooth playback**

The current `queueAudioChunk` from Task 5 plays each chunk independently, which causes gaps. Improve this:

- Use an `AudioWorklet` or a growing `AudioBuffer` approach
- Maintain a playback cursor and queue incoming chunks
- Handle interruption (when user starts speaking, stop playback immediately via `input_audio_buffer.speech_started`)
- Send `conversation.item.truncate` to OpenAI when user interrupts to sync state

```javascript
class AudioStreamPlayer {
    constructor(sampleRate = 24000) {
        this.sampleRate = sampleRate;
        this.audioContext = new AudioContext({ sampleRate });
        this.nextStartTime = 0;
        this.sources = [];
    }

    play(pcm16Base64) {
        const float32 = this.decodePCM16(pcm16Base64);
        const buffer = this.audioContext.createBuffer(1, float32.length, this.sampleRate);
        buffer.getChannelData(0).set(float32);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;
        const startTime = Math.max(now, this.nextStartTime);
        source.start(startTime);
        this.nextStartTime = startTime + buffer.duration;
        this.sources.push(source);
    }

    interrupt() {
        this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
        this.sources = [];
        this.nextStartTime = 0;
    }

    decodePCM16(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
        return float32;
    }
}
```

**Step 2: Add mute controls**

- Mic mute: stop sending `input_audio_buffer.append` events (but keep stream open)
- Speaker mute: disconnect audio output node (but keep receiving for transcript)

**Step 3: Drive waveform visualization from live audio**

- Use the existing canvas waveform animation
- In AI mode, feed it from the mic input (user speaking) or output audio (Luna speaking)
- Show different colors: orange when Luna speaks, blue when user speaks

**Step 4: Commit**

```bash
git add "Luna Demo/index.html"
git commit -m "feat(luna): improve audio playback with queuing, interruption, and mute controls"
```

---

## Task 8: Freeform Mode & Graceful Fallback

**Files:**
- Modify: `Luna Demo/index.html`
- Modify: `Luna Demo/serve.py`

**Step 1: Update freeform "Start Call" for AI mode**

In AI mode, the freeform call is simpler:
- No client-side intent detection needed
- Connect with a generic banking assistant prompt
- Luna asks "How can I help?" and GPT handles intent naturally
- If Luna uses a scenario-specific tool, update the sidebar to highlight the matching scenario

**Step 2: Add fallback detection**

If the WebSocket connection fails or API returns errors:
- Set `state.aiMode = false`
- Show a toast notification: "AI mode unavailable. Using scripted mode."
- Fall back to existing `playScenario()` behavior seamlessly
- User can retry by re-saving the API key in settings

**Step 3: Add the mode indicator to the footer**

Next to the existing metrics, show:
- "AI Mode" (green badge) when connected via Realtime API
- "Scripted Mode" (gray badge) when using fallback
- "No Key" (red badge) when no API key configured

**Step 4: Commit**

```bash
git add "Luna Demo/index.html" "Luna Demo/serve.py"
git commit -m "feat(luna): add freeform AI mode and graceful fallback to scripted mode"
```

---

## Task 9: End-to-End Testing & Polish

**Files:**
- Modify: `Luna Demo/index.html` (minor fixes)
- Modify: `Luna Demo/serve.py` (minor fixes)
- Modify: `Luna Demo/README.md`

**Step 1: Test scripted mode (no API key)**

1. Start server: `python serve.py`
2. Open `http://localhost:8090`
3. Verify all 10 scenarios work in scripted mode
4. Verify footer shows "Scripted Mode"
5. Verify settings modal shows "No API key configured"

**Step 2: Test AI mode (with API key)**

1. Open settings, paste a valid OpenAI API key
2. Click a scenario → verify WebSocket connects
3. Verify Luna greets the caller by voice
4. Speak to Luna → verify transcript appears
5. Verify Luna responds with voice + text
6. Test tool usage (e.g., "block my card ending in 4829")
7. Test escalation scenario (e.g., mortgage rate)
8. Test "End Call" disconnects cleanly
9. Test freeform "Start Call"

**Step 3: Test error handling**

1. Use an invalid API key → verify error message
2. Disconnect internet mid-call → verify graceful fallback
3. Test browser without microphone permission → verify appropriate message

**Step 4: Update README.md**

Add a section about AI mode:
- How to get an OpenAI API key
- How to enter the key in the settings
- Which model is used (gpt-4o-realtime-preview)
- Approximate cost per demo session
- Fallback behavior

**Step 5: Fix any bugs found during testing**

**Step 6: Commit**

```bash
git add "Luna Demo/index.html" "Luna Demo/serve.py" "Luna Demo/README.md"
git commit -m "feat(luna): end-to-end testing, polish, and README update for AI mode"
```

---

## Task 10: Final Commit & Cleanup

**Step 1: Review all changes**

Run: `git diff --stat main`
Verify only expected files changed.

**Step 2: Final commit if any remaining changes**

```bash
git add -A
git commit -m "feat(luna): OpenAI Realtime API integration complete — conversational AI banking assistant"
```

---

## Summary of Deliverables

| # | Task | Files | Estimated Effort |
|---|------|-------|-----------------|
| 1 | Dependencies | requirements.txt | Quick |
| 2 | LLM Engine | llm_engine.py (new) | Medium |
| 3 | WebSocket Relay | serve.py | Medium |
| 4 | Settings Modal | index.html | Medium |
| 5 | WS Client & Audio | index.html | Large |
| 6 | Call Flow UI | index.html | Medium |
| 7 | Audio Playback | index.html | Medium |
| 8 | Freeform & Fallback | index.html, serve.py | Medium |
| 9 | Testing & Polish | all files | Medium |
| 10 | Final cleanup | — | Quick |
