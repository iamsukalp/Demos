import json
from http.server import BaseHTTPRequestHandler

from _shared import get_api_key, handle_options, read_json, send_error, send_json


class handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            read_json(self)
        except json.JSONDecodeError:
            send_error(self, 400, "Invalid JSON")
            return

        send_json(
            self,
            {
                "success": True,
                "configured": bool(get_api_key()),
                "wsPort": 8091,
                "wsAvailable": False,
            },
        )
