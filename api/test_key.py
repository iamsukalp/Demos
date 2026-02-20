import json
from http.server import BaseHTTPRequestHandler

from _shared import get_api_key, handle_options, read_json, send_error, send_json, test_openai_key


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

        api_key = (data.get("apiKey") or "").strip() or get_api_key()
        send_json(self, test_openai_key(api_key))
