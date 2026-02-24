# Conventional IVR Comparison — Side-by-Side Demo

## Purpose

Add a comparison mode inside the IVR Call Containment app that shows a traditional DTMF IVR alongside the AI IVR, running the same scenario simultaneously. This lets demo viewers see the stark contrast between the painful old-school phone tree and the modern AI-powered experience.

## Entry Point

A **"Compare"** button in the app header (next to dark mode toggle). Clicking it toggles comparison mode on/off.

## Layout

### Normal Mode (existing)
```
[Sidebar] | [Transcript Pane]
```

### Comparison Mode
```
[Sidebar] | [Traditional IVR Pane] | [AI IVR Pane]
```

- Sidebar remains unchanged (profiles, history, scenarios)
- Main content splits into two equal-width panes with a thin vertical divider
- Left pane: "Traditional IVR" — muted gray theme, phone icon
- Right pane: "AI IVR" — EXL orange theme, bot icon
- Each pane has its own header label, scroll area, and status indicator

## Comparison Flow

1. User clicks "Compare" in header — view splits
2. User selects a customer profile from sidebar
3. User clicks a scenario — a **"Play Both"** button appears (replaces normal Start AI Call / scenario trigger)
4. Clicking "Play Both" starts both simulations simultaneously
5. AI side finishes first (30-45s) — shows green checkmark and waits
6. Traditional side grinds through menus, hold, agent transfer (2-3 min)
7. When both complete, a **comparison summary bar** slides in above the footer

## Traditional DTMF Simulation

Each of the 5 scripted scenarios gets a parallel DTMF script stored in a `DTMF_SCENARIOS` object. Each script is an array of steps:

### Step Types
- `system` — IVR system voice (robotic style): "Welcome to EXL Bank..."
- `menu` — Menu prompt with options: "Press 1 for... Press 2 for..."
- `keypress` — Customer presses a number (shown with keypad icon)
- `hold` — Hold period with elapsed timer and "Your call is important..." messages
- `agent` — Human agent speaks (different color from bot)
- `customer` — Customer speaks to agent
- `transfer` — "Transferring you to..." message

### Visual Styling (DTMF Pane)
- System/menu messages: monospace font, gray background, robotic feel
- Keypress: circular keypad button icon with the digit
- Hold: pulsing "On Hold..." indicator with animated music notes and running timer
- Agent messages: plain blue-gray bubble (not orange)
- Overall color scheme: grays and muted blues — deliberately dated/boring
- Text appears with a slow typewriter effect to simulate robotic TTS

### Timing
- Menu prompts: 4-6s display time (simulating slow reading)
- Customer keypresses: 1-2s
- Hold period: 15-20s compressed (represents 5-10 min real wait)
- Agent conversation: 2-3s per message
- Total DTMF flow: ~2:00-2:30 per scenario

### DTMF Scripts per Scenario

**Block Credit Card:** Welcome -> Main menu (press 2 for cards) -> Card menu (press 2 for lost/stolen) -> Hold queue ("caller #4, 8 min wait") -> Agent verifies identity -> Agent blocks card -> 7-10 day replacement

**Check Loan Balance:** Welcome -> Main menu (press 1 for accounts) -> Account menu (press 3 for loans) -> Hold queue -> Agent looks up balance -> Reads numbers verbally -> No prepayment info unless asked

**Dispute Transaction:** Welcome -> Main menu (press 2 for cards) -> Card menu (press 3 for billing) -> "Invalid option, returning to main menu" -> Re-navigate -> Hold queue (longer) -> Agent takes details -> Agent files dispute -> 10 business day timeline

**Credit Limit Increase:** Welcome -> Main menu (press 2 for cards) -> Card menu (press 4 for other) -> "That option is not available" -> Press 0 for operator -> Hold queue -> Agent checks eligibility manually -> Callback required

**Mortgage Inquiry:** Welcome -> Main menu (press 3 for loans) -> Loan menu (press 2 for mortgage) -> Hold queue (longest) -> Agent transfers to mortgage dept -> Second hold -> Specialist answers

## AI IVR Pane

Reuses the existing scripted scenario message flow from `SCENARIOS` object. Same bubble styling, same timing, same resolution cards. No changes needed — it already works.

## Comparison Summary Bar

Appears when both sides complete. Shows a horizontal bar above the footer:

| Metric | Traditional IVR | AI IVR |
|--------|----------------|--------|
| Total Time | 2:15 | 0:42 |
| Interactions | 12 | 5 |
| Hold Time | 1:05 | None |
| Resolution | Agent handled | Bot contained |
| Customer Effort | High | Low |

- AI side metrics colored green
- Traditional side metrics colored red/amber
- Animated count-up for numbers

## Scope

- **Scripted scenarios only** — Compare mode is disabled during live AI calls
- **5 DTMF scripts** — one per existing scenario
- **Single file** — all changes in `IRIS/index.html` (CSS + HTML + JS)
- **No server changes** — purely client-side simulation

## Exit Compare Mode

- Click "Compare" button again
- Click "Exit Compare" button that appears in comparison mode
- Returns to normal single-pane layout
- Transcript area is cleared

## Implementation Order

1. Add Compare button to header + comparison mode state toggle
2. Build split-pane layout CSS (comparison mode classes)
3. Create DTMF pane HTML structure (header, scroll area, status)
4. Write `DTMF_SCENARIOS` data for all 5 scenarios
5. Build DTMF playback engine (typewriter text, keypress icons, hold animation)
6. Wire "Play Both" to run both simulations in parallel
7. Build comparison summary bar with animated metrics
8. Polish timing and transitions
