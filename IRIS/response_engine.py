"""
IVR Call Containment Response Engine
========================
Keyword matching, entity extraction, and response selection.
Ported from BPVA's calculateKeywordScore pattern.
No external dependencies — stdlib only.
"""

import re
from response_bank import RESPONSE_BANK, INTENT_KEYWORDS

# ===== Keyword Scoring (ported from BPVA) =====

def calculate_keyword_score(user_input, keywords):
    """
    Score how well user_input matches a list of keywords.
    Returns normalized 0.0–1.0 score.

    Scoring:
    - Exact substring match: keyword_word_count * 2
    - Multi-word all-present: keyword_word_count * 1.5
    - Partial word match: 0.5 (each input word used once)
    """
    input_lower = re.sub(r'[?!.,;:\'"()]', '', user_input.lower().strip())
    input_words = [w for w in input_lower.split() if len(w) > 2]
    score = 0.0
    max_possible = len(keywords)
    if max_possible == 0:
        return 0.0

    used_words = set()

    for keyword in keywords:
        kw_lower = keyword.lower()
        if kw_lower in input_lower:
            # Exact substring match — strongest signal
            score += len(kw_lower.split()) * 2
        else:
            kw_words = kw_lower.split()
            if len(kw_words) > 1:
                # Multi-word: check if ALL keyword words appear in input
                if all(kw in input_lower for kw in kw_words):
                    score += len(kw_words) * 1.5
                    continue
            # Partial: only count if there's a NEW input word matching
            for word in input_words:
                if word not in used_words and (kw_lower in word or word in kw_lower):
                    score += 0.5
                    used_words.add(word)
                    break

    return score / max_possible


# ===== Entity Extraction =====

ENTITY_PATTERNS = {
    'cardLast4':       r'\b(\d{4})\b',
    'newCardLast4':    r'\b(\d{4})\b',
    'dollarAmount':    r'\$\s?(\d[\d,]*\.?\d{0,2})',
    'transferAmount':  r'\$\s?(\d[\d,]*\.?\d{0,2})',
    'wireAmount':      r'\$\s?(\d[\d,]*\.?\d{0,2})',
    'disputeAmount':   r'\$\s?(\d[\d,]*\.?\d{0,2})',
    'merchantName':    r'(?:at|from|called|store called)\s+([A-Z][A-Za-z\']+(?:\s+[A-Z][A-Za-z\']+){0,2})',
    'email':           r'[\w.-]+@[\w.-]+\.\w+',
    'percentage':      r'(\d+(?:\.\d+)?)\s*%',
}

# Which entities to try extracting per scenario
SCENARIO_ENTITIES = {
    'block-card':     ['cardLast4'],
    'loan-balance':   ['dollarAmount'],
    'dispute':        ['disputeAmount', 'merchantName'],
    'restructure':    [],
    'reset-password': ['email'],
    'activate-card':  ['newCardLast4'],
    'transfer-funds': ['transferAmount'],
    'credit-limit':   ['dollarAmount'],
    'mortgage-rate':  ['percentage'],
    'wire-transfer':  ['wireAmount'],
}


def extract_entities(text, scenario_id):
    """Extract entities from user text based on scenario context."""
    entities = {}
    entity_names = SCENARIO_ENTITIES.get(scenario_id, [])

    for entity_name in entity_names:
        pattern = ENTITY_PATTERNS.get(entity_name)
        if not pattern:
            continue

        # For dispute, extract multiple amounts/merchants
        if entity_name in ('disputeAmount', 'merchantName'):
            matches = re.findall(pattern, text)
            if matches:
                entities[entity_name] = matches
        else:
            match = re.search(pattern, text)
            if match:
                entities[entity_name] = match.group(1)

    return entities


# ===== Yes/No Classification =====

YES_PATTERNS = [
    'yes', 'yeah', 'yep', 'sure', 'go ahead', 'please', 'do it',
    'proceed', 'correct', "that's right", 'absolutely', 'ok', 'okay',
    'sounds good', "let's do it", 'perfect', 'confirmed', 'affirmative',
    'right', 'exactly', 'definitely'
]

NO_PATTERNS = [
    'no', 'nah', 'nope', 'not right now', 'cancel', 'never mind',
    "that's all", 'nothing else', "i'm good", 'all set', "don't",
    'stop', 'wait', 'hold on', "not yet", "i'll pass", 'no thanks'
]

MORE_HELP_PATTERNS = [
    'also', 'another', 'one more', 'while i have you', 'actually',
    'additionally', 'by the way', 'something else', 'another thing',
    'can you also', 'i also need'
]


def classify_yes_no(text):
    """Classify text as 'yes', 'no', 'more_help', or 'other'."""
    text_lower = text.lower().strip()

    for pattern in MORE_HELP_PATTERNS:
        if pattern in text_lower:
            return 'more_help'

    for pattern in YES_PATTERNS:
        if pattern in text_lower:
            return 'yes'

    for pattern in NO_PATTERNS:
        if pattern in text_lower:
            return 'no'

    return 'other'


# ===== Intent Switch Detection =====

def detect_intent_switch(user_input, current_scenario_id):
    """Check if user input matches a different scenario better than current."""
    best_other = None
    best_score = 0.0

    for scenario_id, keywords in INTENT_KEYWORDS.items():
        if scenario_id == current_scenario_id:
            continue
        score = calculate_keyword_score(user_input, keywords)
        if score > best_score and score >= 0.3:
            best_score = score
            best_other = scenario_id

    if best_other:
        return {'scenarioId': best_other, 'confidence': round(best_score, 3)}
    return None


# ===== Main Response Selection =====

def get_response(scenario_id, turn_index, user_input, context=None):
    """
    Select the best response variant for a given scenario turn.

    Returns:
        dict with: text, thinkingTime, entitiesExtracted, fallbackUsed, dynamicScore
    """
    context = context or {}
    existing_entities = context.get('extractedEntities', {})

    # Get response bank for this scenario
    scenario_bank = RESPONSE_BANK.get(scenario_id)
    if not scenario_bank:
        return {
            'text': None,
            'thinkingTime': 1500,
            'entitiesExtracted': {},
            'fallbackUsed': True,
            'dynamicScore': 0.0
        }

    # Find the stage that matches this turn_index
    stages = scenario_bank.get('stages', {})
    matched_stage = None
    for stage_name, stage_data in stages.items():
        if stage_data.get('turn_index') == turn_index:
            matched_stage = stage_data
            break

    if not matched_stage:
        return {
            'text': None,
            'thinkingTime': 1500,
            'entitiesExtracted': {},
            'fallbackUsed': True,
            'dynamicScore': 0.0
        }

    # Extract entities from user input
    new_entities = extract_entities(user_input, scenario_id)
    all_entities = {**existing_entities, **new_entities}

    # Classify yes/no for branching
    yes_no = classify_yes_no(user_input)

    # Score all variants
    best_variant = None
    best_score = 0.0

    for variant in matched_stage.get('variants', []):
        # Check condition (yes/no branching)
        condition = variant.get('condition')
        if condition:
            if condition == "yes_no == 'yes'" and yes_no != 'yes':
                continue
            elif condition == "yes_no == 'no'" and yes_no != 'no':
                continue
            elif condition == "yes_no == 'more_help'" and yes_no != 'more_help':
                continue

        # Check required entity
        requires = variant.get('requires_entity')
        if requires and requires not in all_entities:
            continue

        # Score keywords
        keywords = variant.get('keywords', [])
        if keywords:
            score = calculate_keyword_score(user_input, keywords)
        elif condition:
            # Condition-only variants (yes/no) get a base score if condition matched
            score = 0.5
        else:
            score = 0.0

        if score > best_score:
            best_score = score
            best_variant = variant

    # Threshold check
    if best_variant and best_score >= 0.1:
        return {
            'text': best_variant['text'],
            'thinkingTime': best_variant.get('thinkingTime', 1800),
            'entitiesExtracted': new_entities,
            'fallbackUsed': False,
            'dynamicScore': round(best_score, 3)
        }

    # Check if there's a yes/no match with just condition (no keywords needed)
    for variant in matched_stage.get('variants', []):
        condition = variant.get('condition')
        if condition:
            if condition == "yes_no == 'yes'" and yes_no == 'yes':
                return {
                    'text': variant['text'],
                    'thinkingTime': variant.get('thinkingTime', 1800),
                    'entitiesExtracted': new_entities,
                    'fallbackUsed': False,
                    'dynamicScore': 0.5
                }
            elif condition == "yes_no == 'no'" and yes_no == 'no':
                return {
                    'text': variant['text'],
                    'thinkingTime': variant.get('thinkingTime', 1800),
                    'entitiesExtracted': new_entities,
                    'fallbackUsed': False,
                    'dynamicScore': 0.5
                }
            elif condition == "yes_no == 'more_help'" and yes_no == 'more_help':
                return {
                    'text': variant['text'],
                    'thinkingTime': variant.get('thinkingTime', 1800),
                    'entitiesExtracted': new_entities,
                    'fallbackUsed': False,
                    'dynamicScore': 0.5
                }

    # Fallback to scripted message
    fallback_text = matched_stage.get('fallback_text')
    return {
        'text': fallback_text,
        'thinkingTime': 1800,
        'entitiesExtracted': new_entities,
        'fallbackUsed': True if fallback_text else True,
        'dynamicScore': 0.0
    }
