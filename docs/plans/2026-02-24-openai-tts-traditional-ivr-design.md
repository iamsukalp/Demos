# OpenAI TTS for Traditional IVR

## Context
The Traditional IVR demo uses browser SpeechSynthesis for TTS, which sounds robotic and varies by browser/OS. Replace with OpenAI's TTS API (model: tts-1, voice: alloy) for professional, consistent audio quality.

## Architecture
Server-side TTS endpoint — browser sends IVR text to server, server calls OpenAI `/v1/audio/speech`, returns MP3 audio, browser plays via Web Audio API.

## Changes

### Server (`IRIS/serve.py` + root `serve.py`)
- New `POST /api/tts` endpoint accepting `{ "text": "..." }`
- Calls OpenAI TTS API with model=tts-1, voice=alloy, response_format=mp3
- Returns MP3 audio blob
- Uses existing `OPENAI_API_KEY` from environment

### Client (`IRIS/traditional.html`)
- Replace `speakText()` — fetch `/api/tts`, decode MP3, play via Web Audio API
- Keep toggle button, TTS cancellation, Promise.all parallel pattern
- Remove browser SpeechSynthesis code and Chrome workaround
- On-demand generation per step
- Fallback: if `/api/tts` fails, silently continue without audio
