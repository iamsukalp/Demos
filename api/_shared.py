import json
import os
import sys
import urllib.error
import urllib.request


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IRIS_DIR = os.path.join(ROOT_DIR, "IRIS Demo")

if IRIS_DIR not in sys.path:
    sys.path.insert(0, IRIS_DIR)

try:
    from response_engine import get_response, extract_entities, classify_yes_no, detect_intent_switch

    ENGINE_AVAILABLE = True
except Exception:
    ENGINE_AVAILABLE = False
    get_response = None
    extract_entities = None
    classify_yes_no = None
    detect_intent_switch = None


def read_json(handler):
    length = int(handler.headers.get("Content-Length", 0))
    body = handler.rfile.read(length) if length > 0 else b""
    if not body:
        return {}
    return json.loads(body.decode("utf-8"))


def send_json(handler, data, status=200):
    payload = json.dumps(data).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def send_error(handler, status, message):
    send_json(handler, {"error": message}, status)


def handle_options(handler):
    send_json(handler, {"ok": True})


def get_api_key():
    return os.environ.get("OPENAI_API_KEY", "").strip()


def test_openai_key(api_key):
    if not api_key:
        return {"valid": False, "error": "No API key provided"}

    try:
        req = urllib.request.Request(
            "https://api.openai.com/v1/models/gpt-4o-mini",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        resp = urllib.request.urlopen(req, timeout=10)
        if resp.status == 200:
            return {"valid": True, "error": None}
        return {"valid": False, "error": f"OpenAI returned HTTP {resp.status}"}
    except urllib.error.HTTPError as exc:
        if exc.code == 401:
            return {"valid": False, "error": "Invalid API key"}
        if exc.code == 404:
            return {"valid": True, "error": None}
        return {"valid": False, "error": f"OpenAI error: HTTP {exc.code}"}
    except Exception as exc:
        return {"valid": False, "error": f"Connection failed: {str(exc)}"}


def summarize_transcript(transcript, api_key):
    if not transcript:
        return "No transcript available."
    if not api_key:
        return "API key not configured."

    lines = []
    for msg in transcript:
        role = msg.get("role", "system")
        text = msg.get("text", "")
        if role == "customer":
            lines.append(f"Customer: {text}")
        elif role == "bot":
            lines.append(f"IRIS (AI Agent): {text}")
        elif role == "system":
            lines.append(f"[System: {text}]")
    conversation_log = "\n".join(lines)

    prompt = (
        "You are an IVR call center analyst. Below is the transcript of a call between a customer and IRIS, "
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
        req_body = json.dumps(
            {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
                "temperature": 0.3,
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=req_body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=15)
        resp_data = json.loads(resp.read().decode("utf-8"))
        return resp_data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        return f"Summary generation failed: {str(exc)}"
