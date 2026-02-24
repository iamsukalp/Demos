"""
IRIS AI IVR Guardrails
Server-side transaction limit enforcement and PII protection.
"""

import re

# ===== Transaction Limits =====

TRANSACTION_LIMITS = {
    'transfer_funds': {
        'max_amount': 25_000,
        'param': 'amount',
        'escalate_to': 'a supervisor',
        'label': 'single-transaction',
    },
    'initiate_wire': {
        'max_amount': 10_000,
        'param': 'amount',
        'escalate_to': 'a compliance officer',
        'label': 'wire transfer',
    },
    'request_limit_increase': {
        'max_multiplier': 2.0,
        'param': 'requested_limit',
        'escalate_to': 'the underwriting team',
        'label': 'credit limit increase',
    },
}


def check_transaction(func_name, args, customer=None):
    """
    Check if a function call violates transaction guardrails.

    Returns:
        None  — no guardrail triggered, proceed to handler.
        dict  — guardrail triggered, return this as the function result.
    """
    rule = TRANSACTION_LIMITS.get(func_name)
    if not rule:
        return None

    # Credit limit increase: check multiplier against current limit
    if func_name == 'request_limit_increase':
        requested = _parse_number(args.get(rule['param'], 0))
        current_limit = 0
        if customer and 'credit_card' in customer:
            current_limit = customer['credit_card'].get('limit', 0)
        max_allowed = current_limit * rule['max_multiplier']
        if current_limit > 0 and requested > max_allowed:
            return {
                'success': False,
                'guardrail': 'transaction_limit',
                'error': (
                    f"A credit limit increase to ${requested:,.0f} exceeds the maximum "
                    f"of ${max_allowed:,.0f} (2x the current ${current_limit:,.0f} limit). "
                    f"I can transfer you to {rule['escalate_to']} for approval."
                ),
                'escalate': True,
                'escalate_to': rule['escalate_to'],
            }
        return None

    # Amount-based limits (transfer_funds, initiate_wire)
    amount = _parse_number(args.get(rule['param'], 0))
    if amount > rule['max_amount']:
        return {
            'success': False,
            'guardrail': 'transaction_limit',
            'error': (
                f"The {rule['label']} amount of ${amount:,.2f} exceeds the "
                f"${rule['max_amount']:,.0f} per-transaction limit. "
                f"I can transfer you to {rule['escalate_to']} for approval."
            ),
            'escalate': True,
            'escalate_to': rule['escalate_to'],
        }

    return None


def _parse_number(value):
    """Safely parse a numeric value from args (could be string or number)."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0


# ===== PII Scrubbing =====

def _mask_digits_factory(keep_last):
    """Create a masking function that keeps the last N digits."""
    def _mask(match):
        raw = re.sub(r'[\s-]', '', match.group(1))  # strip spaces/dashes
        if len(raw) < 8:
            return match.group(0)  # too short, probably not a card/account
        return '****' + raw[-keep_last:]
    return _mask


# Patterns ordered from most specific to least specific
_PII_PATTERNS = [
    # Credit card numbers: 13-19 digits (with optional spaces/dashes)
    (re.compile(r'\b(\d[\d\s-]{11,17}\d)\b'), _mask_digits_factory(4)),
    # SSN with dashes: XXX-XX-XXXX
    (re.compile(r'\b(\d{3}-\d{2}-\d{4})\b'), lambda m: '***-**-' + m.group(1)[-4:]),
    # SSN without dashes: 9 consecutive digits (not preceded by safe contexts)
    (re.compile(r'(?<!\$)(?<!#)(?<!TRF-)(?<!WIR-)(?<!DSP-)\b(\d{9})\b'), lambda m: '*****' + m.group(1)[-4:]),
    # Long account numbers: 8-12 consecutive digits (not preceded by "last" or "ending in")
    (re.compile(r'(?i)(?<!last )(?<!ending in )(?<!ding )\b(\d{8,12})\b'), lambda m: '****' + m.group(1)[-4:]),
]


def scrub_pii(text):
    """
    Scrub potential PII (card numbers, SSNs, account numbers) from text.
    Preserves 4-digit sequences (common in 'last 4 digits' references).
    """
    if not text:
        return text
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text
