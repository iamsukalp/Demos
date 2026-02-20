import json
from http.server import BaseHTTPRequestHandler

from _shared import ENGINE_AVAILABLE, get_response, handle_options, read_json, send_error, send_json


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

        scenario_id = data.get("scenarioId")
        turn_index = data.get("turnIndex")
        user_input = data.get("userInput", "")
        context = data.get("context", {})

        if scenario_id is None or turn_index is None:
            send_error(self, 400, "Missing scenarioId or turnIndex")
            return

        result = get_response(scenario_id, turn_index, user_input, context)
        send_json(self, result)
