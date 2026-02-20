import json
from http.server import BaseHTTPRequestHandler

from _shared import ENGINE_AVAILABLE, extract_entities, handle_options, read_json, send_error, send_json


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

        if not ENGINE_AVAILABLE:
            send_error(self, 503, "Response engine not available")
            return

        text = data.get("text", "")
        scenario_id = data.get("scenarioId", "")
        send_json(self, {"entities": extract_entities(text, scenario_id)})
