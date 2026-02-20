import json
from http.server import BaseHTTPRequestHandler

from _shared import get_api_key, handle_options, read_json, send_error, send_json, summarize_transcript


class handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            data = read_json(self)
        except json.JSONDecodeError:
            send_error(self, 400, "Invalid JSON")
            return

        transcript = data.get("transcript", [])
        summary = summarize_transcript(transcript, get_api_key())
        send_json(self, {"summary": summary})
