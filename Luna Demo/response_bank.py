"""
Luna IVR Response Bank
======================
Response variants and branching trees for all 10 scenarios.
Each scenario has stages mapped to conversation turn indices.
Each stage has multiple response variants with keyword triggers.
"""

# Intent keywords for cross-scenario detection
INTENT_KEYWORDS = {
    'block-card': ['block', 'freeze', 'cancel', 'stolen', 'lost', 'unauthorized', 'credit card', 'debit card'],
    'loan-balance': ['loan', 'balance', 'owe', 'auto loan', 'car loan', 'payment', 'payoff'],
    'dispute': ['dispute', 'charge', 'transaction', 'fraudulent', 'unauthorized', 'wrong charge'],
    'restructure': ['joint account', 'separate', 'divorce', 'split', 'restructure'],
    'reset-password': ['password', 'reset', 'locked out', 'login', 'online banking', 'forgot password'],
    'activate-card': ['activate', 'new card', 'received', 'activation', 'replacement card'],
    'transfer-funds': ['transfer', 'move money', 'checking', 'savings', 'between accounts'],
    'credit-limit': ['credit limit', 'increase', 'raise', 'higher limit', 'limit increase'],
    'mortgage-rate': ['mortgage', 'rate', 'refinance', 'renegotiate', 'lower rate'],
    'wire-transfer': ['wire', 'wire transfer', 'international', 'overseas', 'send money abroad'],
}

# ===== Response Bank =====

RESPONSE_BANK = {

    # ==========================================
    # BLOCK CARD (contained) — P1
    # ==========================================
    'block-card': {
        'stages': {
            'greeting': {
                'turn_index': 3,  # customer says "I need to block my card"
                'variants': [
                    {
                        'id': 'bc-urgent',
                        'keywords': ['right away', 'immediately', 'emergency', 'urgent', 'just now', 'happening now', 'quick'],
                        'text': "I understand this is urgent. Let me put a temporary hold on all your cards right now for safety.\n\nDone — a temporary hold is in place. Now, can you tell me the last four digits of the specific card you'd like to permanently block?",
                        'thinkingTime': 1800,
                    },
                    {
                        'id': 'bc-stolen',
                        'keywords': ['stolen', 'lost', 'missing', 'someone took', 'can\'t find', 'wallet'],
                        'text': "I'm very sorry to hear your card was stolen. I'll block it right away to prevent any unauthorized transactions.\n\nCan you confirm the last four digits of the card so I can locate it on your account?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'bc-suspicious',
                        'keywords': ['suspicious', 'think', 'maybe', 'not sure', 'might be', 'looks like', 'unauthorized'],
                        'text': "I understand your concern about possible unauthorized use. Let's look into this together.\n\nCan you share the last four digits of the card so I can check the recent activity?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'bc-standard',
                        'keywords': ['block', 'freeze', 'cancel', 'credit card', 'debit card', 'card'],
                        'text': "I'm sorry to hear that. I can help you block your credit card immediately. For security, can you confirm the last four digits of the card you'd like to block?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "I'm sorry to hear that. I can help you block your credit card immediately. For security, can you confirm the last four digits of the card you'd like to block?",
            },
            'card-digits': {
                'turn_index': 5,  # customer provides card digits
                'variants': [
                    {
                        'id': 'bc-digits-given',
                        'keywords': ['ends in', 'last four', 'digits', 'number'],
                        'requires_entity': 'cardLast4',
                        'text': "Thank you, Varun. I can see your Visa card ending in {{cardLast4}} on your account. I'm blocking this card now.\n\nDone — your card ending in {{cardLast4}} has been blocked effective immediately. No further transactions will be processed.\n\nHere's what happens next:\n• A replacement card will be mailed within 3–5 business days\n• Recurring payments will need to be updated with the new card\n• Any unauthorized transactions will be investigated automatically\n\nWould you like me to help with anything else?",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'bc-digits-plain',
                        'keywords': [],
                        'requires_entity': 'cardLast4',
                        'text': "Got it — card ending in {{cardLast4}}. I'm blocking this card now.\n\nDone — your Visa card ending in {{cardLast4}} has been blocked effective immediately.\n\nHere's what happens next:\n• Replacement card mailed in 3–5 business days\n• You'll need to update any recurring payments\n• Unauthorized charges will be investigated automatically\n\nIs there anything else I can help with?",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "Thank you, Varun. I can see your Visa card ending in {{cardLast4}} on your account. I'm blocking this card now.\n\nDone — your card ending in {{cardLast4}} has been blocked effective immediately. No further transactions will be processed.\n\nHere's what happens next:\n• A replacement card will be mailed within 3–5 business days\n• Recurring payments will need to be updated with the new card\n• Any unauthorized transactions will be investigated automatically\n\nWould you like me to help with anything else?",
            },
            'wrap-up': {
                'turn_index': 7,  # customer says thanks/goodbye
                'variants': [
                    {
                        'id': 'bc-close-positive',
                        'keywords': ['thanks', 'thank you', 'no', 'everything', 'great', 'good', 'all set', 'that\'s it'],
                        'condition': "yes_no == 'no'",
                        'text': "You're welcome, Varun. Your account security is our priority. Have a great day!",
                        'thinkingTime': 1200,
                    },
                    {
                        'id': 'bc-close-more',
                        'condition': "yes_no == 'more_help'",
                        'keywords': ['also', 'another', 'one more', 'actually', 'something else'],
                        'text': "Of course, I'm happy to help with anything else. What would you like to do?",
                        'thinkingTime': 1500,
                    },
                    {
                        'id': 'bc-close-question',
                        'keywords': ['replacement', 'when', 'how long', 'new card', 'temporary'],
                        'text': "Great question! Your replacement card will arrive within 3–5 business days. In the meantime, you can use any other cards on your account, or I can set up a virtual card number for immediate online purchases. Would you like that?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "You're welcome, Varun. Your account security is our priority. Have a great day!",
            },
        },
    },

    # ==========================================
    # DISPUTE (escalated) — P1
    # ==========================================
    'dispute': {
        'stages': {
            'greeting': {
                'turn_index': 3,  # customer describes dispute
                'variants': [
                    {
                        'id': 'dp-fraud-clear',
                        'keywords': ['fraudulent', 'fraud', 'didn\'t make', 'not mine', 'never been', 'don\'t recognize'],
                        'text': "I'm sorry to hear about that, Varun. Protecting your account is our top priority. I'll need a few details to locate the charge.\n\nCould you tell me the approximate amount and the merchant name so I can identify the specific transaction?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'dp-uncertain',
                        'keywords': ['suspicious', 'weird', 'strange', 'don\'t remember', 'looks wrong', 'unfamiliar'],
                        'text': "I understand — unfamiliar charges can be concerning. Let's investigate this together.\n\nCan you share the approximate amount or the merchant name? I'll pull up your recent transactions and we can review them.",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'dp-multiple',
                        'keywords': ['several', 'multiple', 'more than one', 'two', 'three', 'bunch of'],
                        'text': "I'm very sorry — multiple unauthorized charges is definitely something we need to address immediately. Let me pull up your recent activity.\n\nCan you describe the charges you don't recognize? The amounts and merchant names will help me locate them quickly.",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'dp-standard',
                        'keywords': ['dispute', 'charge', 'transaction', 'wrong', 'unauthorized'],
                        'text': "I'm sorry to hear about that, Varun. Could you tell me the approximate amount or the merchant name so I can identify the specific charge?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "I'm sorry to hear about that, Varun. Could you tell me the approximate amount or the merchant name so I can identify the specific charge?",
            },
            'details': {
                'turn_index': 5,  # customer provides amounts/merchants
                'variants': [
                    {
                        'id': 'dp-amounts-given',
                        'keywords': ['dollar', 'amount', 'charge', 'at', 'store', 'gas station', 'electronics'],
                        'requires_entity': 'disputeAmount',
                        'text': "I can see the transactions on your account. Given the pattern — charges in a city you've never visited — this does appear to be fraudulent activity.\n\nI'm going to:\n• Flag these transactions for dispute immediately\n• Issue provisional credits to your account\n• Block your current card to prevent further charges\n\nSince this involves potential fraud, let me connect you with our Fraud Resolution specialist who can complete the investigation. One moment please.",
                        'thinkingTime': 2800,
                    },
                    {
                        'id': 'dp-merchant-named',
                        'keywords': [],
                        'requires_entity': 'merchantName',
                        'text': "Thank you for those details. I can see the charges on your account and they do look suspicious.\n\nI'm flagging them for immediate dispute and will issue provisional credits. However, since this involves potential fraud with specific merchants, I'd like to connect you with our Fraud Resolution Team for a thorough investigation. One moment.",
                        'thinkingTime': 2500,
                    },
                ],
                'fallback_text': "I can see both transactions on your account. Given the pattern — charges in a city you've never visited — this does appear to be fraudulent activity.\n\nLet me connect you with a specialist who can file the dispute and issue a provisional credit. One moment please.",
            },
            'agent-followup': {
                'turn_index': 9,  # customer asks about timeline after agent connects
                'variants': [
                    {
                        'id': 'dp-timeline-question',
                        'keywords': ['how long', 'when', 'timeline', 'investigation', 'take'],
                        'text': "Typically 10 to 15 business days for the full investigation. However, the provisional credits will appear on your account within 24 hours, so you won't be out of pocket.\n\nWe'll send you email updates at each stage of the investigation. Your replacement card will arrive in 2–3 business days via express shipping.\n\nIs there anything else I can help with?",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'dp-money-question',
                        'keywords': ['money back', 'refund', 'credit', 'reimburse', 'get back'],
                        'text': "Absolutely — provisional credits for the full disputed amounts will be posted to your account within 24 hours. If the investigation confirms fraud, those credits become permanent.\n\nYour replacement card will arrive in 2–3 business days via express shipping. Is there anything else?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "Typically 10 to 15 business days. We'll send you updates by email. Your replacement card will arrive in 2–3 business days via express shipping.",
            },
            'wrap-up': {
                'turn_index': 11,  # customer thanks and closes
                'variants': [
                    {
                        'id': 'dp-close-positive',
                        'condition': "yes_no == 'no'",
                        'keywords': ['thanks', 'thank you', 'appreciate', 'that covers', 'everything'],
                        'text': "Of course, Varun. We take fraud very seriously and we'll keep you updated throughout the process. Have a good evening.",
                        'thinkingTime': 1200,
                    },
                ],
                'fallback_text': "Of course, Varun. We take fraud very seriously and we'll keep you updated. Have a good evening.",
            },
        },
    },

    # ==========================================
    # TRANSFER FUNDS (contained) — P1
    # ==========================================
    'transfer-funds': {
        'stages': {
            'greeting': {
                'turn_index': 3,  # customer wants to transfer
                'variants': [
                    {
                        'id': 'tf-specific-amount',
                        'keywords': ['transfer', 'move', 'checking', 'savings'],
                        'requires_entity': 'transferAmount',
                        'text': "Absolutely! I can see your accounts:\n• Checking (***4829) — Balance: $8,342.15\n• Savings (***7712) — Balance: $22,580.00\n\nYou'd like to transfer ${{transferAmount}}. From checking to savings, is that right?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'tf-standard',
                        'keywords': ['transfer', 'move', 'money', 'checking', 'savings', 'between', 'accounts'],
                        'text': "Absolutely! I can see your accounts:\n• Checking (***4829) — Balance: $8,342.15\n• Savings (***7712) — Balance: $22,580.00\n\nHow much would you like to transfer, and from which account?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'tf-savings-goal',
                        'keywords': ['save', 'put away', 'savings', 'set aside', 'emergency'],
                        'text': "Great idea to save! I can see your accounts:\n• Checking (***4829) — Balance: $8,342.15\n• Savings (***7712) — Balance: $22,580.00\n\nHow much would you like to move to your savings account?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "Absolutely! I can see your Checking (***4829) — Balance: $8,342.15 and Savings (***7712) — Balance: $22,580.00. How much would you like to transfer?",
            },
            'amount': {
                'turn_index': 5,  # customer provides amount
                'variants': [
                    {
                        'id': 'tf-amount-given',
                        'keywords': [],
                        'requires_entity': 'transferAmount',
                        'text': "Got it. Confirming the transfer:\n• From: Checking (***4829)\n• To: Savings (***7712)\n• Amount: ${{transferAmount}}\n\nAfter this transfer, your checking balance will be updated accordingly. Shall I go ahead?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'tf-amount-large',
                        'keywords': ['all', 'everything', 'most of', 'as much as'],
                        'text': "I want to make sure we leave enough in checking for any upcoming payments. I'd recommend keeping at least $500 as a buffer.\n\nWould you like to transfer $7,842.15, leaving $500 in checking?",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "Confirming: From Checking (***4829) To Savings (***7712), Amount: ${{transferAmount}}. Shall I go ahead?",
            },
            'confirmation': {
                'turn_index': 7,  # customer confirms or denies
                'variants': [
                    {
                        'id': 'tf-yes',
                        'condition': "yes_no == 'yes'",
                        'keywords': ['yes', 'go ahead', 'proceed', 'do it', 'sure', 'confirm'],
                        'text': "Done! The transfer of ${{transferAmount}} has been processed successfully.\n\n• Checking (***4829): Balance updated\n• Savings (***7712): Balance updated\n• Funds are available immediately\n\nA confirmation has been sent to your email. Is there anything else I can help with?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'tf-no',
                        'condition': "yes_no == 'no'",
                        'keywords': ['no', 'cancel', 'wait', 'stop', 'never mind'],
                        'text': "No problem — I've cancelled the transfer request. Your account balances remain unchanged.\n\nIs there anything else I can help you with?",
                        'thinkingTime': 1500,
                    },
                    {
                        'id': 'tf-change-amount',
                        'keywords': ['different', 'change', 'less', 'more', 'actually', 'instead'],
                        'text': "Of course! What amount would you like to transfer instead?",
                        'thinkingTime': 1200,
                    },
                ],
                'fallback_text': "Done! The transfer of ${{transferAmount}} has been processed successfully. Funds are available immediately. Confirmation sent to your email.",
            },
            'wrap-up': {
                'turn_index': 9,
                'variants': [
                    {
                        'id': 'tf-close',
                        'condition': "yes_no == 'no'",
                        'keywords': ['thanks', 'no', 'that\'s it', 'perfect', 'all good'],
                        'text': "You're welcome, Varun. Have a wonderful day!",
                        'thinkingTime': 1200,
                    },
                ],
                'fallback_text': "You're welcome, Varun. Have a wonderful day!",
            },
        },
    },

    # ==========================================
    # LOAN BALANCE (contained) — P2
    # ==========================================
    'loan-balance': {
        'stages': {
            'greeting': {
                'turn_index': 3,
                'variants': [
                    {
                        'id': 'lb-check-balance',
                        'keywords': ['balance', 'owe', 'remaining', 'how much', 'left'],
                        'text': "Of course! I can look that up for you. Let me pull up your auto loan details.\n\nHere's your auto loan summary:\n• Loan Account: ***7712\n• Original Amount: $28,500.00\n• Current Balance: $14,230.67\n• Monthly Payment: $485.00\n• Next Payment Due: March 15, 2026\n• Interest Rate: 4.9% APR\n• Remaining Term: 30 months\n\nYou're right on track with your payments. Is there anything else you'd like to know?",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'lb-payoff',
                        'keywords': ['payoff', 'pay off', 'pay it off', 'early', 'lump sum'],
                        'text': "Let me pull up your auto loan right away.\n\nYour current payoff amount is $14,188.42 as of today. Here are the details:\n• Loan Account: ***7712\n• Current Balance: $14,230.67\n• Payoff Amount: $14,188.42 (reflects interest adjustment)\n• No prepayment penalty on your loan\n\nWould you like to proceed with a payoff, or would you prefer to continue regular monthly payments?",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'lb-payment-info',
                        'keywords': ['payment', 'due', 'when', 'next payment', 'monthly'],
                        'text': "Let me check your loan details.\n\nYour next auto loan payment:\n• Amount Due: $485.00\n• Due Date: March 15, 2026\n• Account: ***7712\n• Current Balance: $14,230.67\n\nYour payment history shows all on-time payments. Would you like to know anything else about your loan?",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "Of course! I can look that up for you. Let me pull up your auto loan details.\n\nHere's your auto loan summary:\n• Loan Account: ***7712\n• Current Balance: $14,230.67\n• Monthly Payment: $485.00\n• Next Payment Due: March 15, 2026\n\nIs there anything else you'd like to know?",
            },
            'followup': {
                'turn_index': 5,
                'variants': [
                    {
                        'id': 'lb-early-payoff',
                        'keywords': ['pay off early', 'penalty', 'prepayment', 'extra payment', 'pay more', 'lump sum'],
                        'text': "Great question. Your auto loan does not have a prepayment penalty, so you can pay it off early at any time without additional fees.\n\nThe current payoff amount as of today is $14,188.42, which reflects a small interest adjustment. You can make extra payments or a lump sum through online banking.\n\nWould you like to set up an extra payment today?",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'lb-interest-rate',
                        'keywords': ['interest', 'rate', 'apr', 'refinance'],
                        'text': "Your current interest rate is 4.9% APR, which is competitive for auto loans. With current market rates, refinancing might save you a small amount, but given your remaining balance and term, the savings may not justify the fees.\n\nWould you like me to run a refinancing comparison for you?",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'lb-payment-history',
                        'keywords': ['history', 'previous', 'past payments', 'record', 'statements'],
                        'text': "Your payment history is excellent — all payments have been on time over the life of the loan. I can send a detailed statement to your registered email if you'd like a complete breakdown.\n\nWould that be helpful?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "Great question. Your auto loan does not have a prepayment penalty. The current payoff amount is $14,188.42. Would you like to proceed with anything else?",
            },
            'wrap-up': {
                'turn_index': 7,
                'variants': [
                    {
                        'id': 'lb-close',
                        'condition': "yes_no == 'no'",
                        'keywords': ['no', 'thanks', 'just wanted', 'that\'s all', 'options'],
                        'text': "Anytime, Varun. If you decide to make extra payments in the future, just give us a call or log into your online banking. Have a wonderful day!",
                        'thinkingTime': 1200,
                    },
                ],
                'fallback_text': "Anytime, Varun. If you decide to make extra payments in the future, just give us a call or log into your online banking. Have a wonderful day!",
            },
        },
    },

    # ==========================================
    # ACTIVATE CARD (contained) — P2
    # ==========================================
    'activate-card': {
        'stages': {
            'greeting': {
                'turn_index': 3,
                'variants': [
                    {
                        'id': 'ac-just-received',
                        'keywords': ['received', 'got', 'arrived', 'mail', 'new card', 'just got'],
                        'text': "Of course! I can activate your new card right away. Could you please read me the last four digits of the new card number?",
                        'thinkingTime': 1500,
                    },
                    {
                        'id': 'ac-replacement',
                        'keywords': ['replacement', 'replace', 'old card', 'expired', 'renew'],
                        'text': "Welcome back! I can see a replacement card was issued for your account. Let me activate it right away.\n\nCould you confirm the last four digits on the new card?",
                        'thinkingTime': 1800,
                    },
                ],
                'fallback_text': "Of course! I can activate your new card right away. Could you please read me the last four digits of the new card number?",
            },
            'card-digits': {
                'turn_index': 5,
                'variants': [
                    {
                        'id': 'ac-digits',
                        'keywords': [],
                        'requires_entity': 'newCardLast4',
                        'text': "Thank you, Varun. Your new Visa Platinum card ending in {{newCardLast4}} is now active and ready to use!\n\n• Contactless payments: Enabled\n• Online transactions: Enabled\n• Credit limit: $15,000\n• Your old card has been automatically deactivated\n\nYou can set your PIN at any First National ATM. Is there anything else I can help with?",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "Thank you, Varun. Your new Visa Platinum card ending in {{newCardLast4}} is now active. Contactless and online payments are enabled. Credit limit: $15,000. Your old card has been deactivated.",
            },
            'wrap-up': {
                'turn_index': 7,
                'variants': [
                    {
                        'id': 'ac-close',
                        'condition': "yes_no == 'no'",
                        'keywords': ['no', 'that\'s all', 'pin', 'atm', 'thanks'],
                        'text': "Sounds good, Varun. You can set your PIN at any First National ATM. Enjoy your new card and have a great day!",
                        'thinkingTime': 1200,
                    },
                    {
                        'id': 'ac-pin-question',
                        'keywords': ['pin', 'set pin', 'how do i', 'change pin'],
                        'text': "You can set or change your PIN at any First National ATM, or through our mobile banking app under Card Settings. Would you like help with anything else?",
                        'thinkingTime': 1500,
                    },
                ],
                'fallback_text': "Sounds good, Varun. You can set your PIN at any First National ATM. Enjoy your new card and have a great day!",
            },
        },
    },

    # ==========================================
    # RESET PASSWORD (contained) — P2
    # ==========================================
    'reset-password': {
        'stages': {
            'greeting': {
                'turn_index': 3,
                'variants': [
                    {
                        'id': 'rp-locked-out',
                        'keywords': ['locked', 'blocked', 'can\'t log in', 'locked out', 'too many attempts'],
                        'text': "I understand, Varun. Your online banking access was temporarily locked after multiple login attempts — this is a security measure to protect your account.\n\nI'll send a password reset link to your registered email. Can you confirm — is your email still varun.k@email.com?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'rp-forgot',
                        'keywords': ['forgot', 'don\'t remember', 'can\'t remember', 'what is my'],
                        'text': "No worries — that happens to everyone! I can send a password reset link to your registered email.\n\nCan you confirm your email address is still varun.k@email.com?",
                        'thinkingTime': 1800,
                    },
                    {
                        'id': 'rp-standard',
                        'keywords': ['password', 'reset', 'login', 'online banking', 'access'],
                        'text': "I can help you reset your online banking password right away. I'll send a reset link to your registered email.\n\nCan you confirm — is your email still varun.k@email.com?",
                        'thinkingTime': 1800,
                    },
                ],
                'fallback_text': "I understand, Varun. I'll send a password reset link to your registered email. Can you confirm — is your email still varun.k@email.com?",
            },
            'confirm-email': {
                'turn_index': 5,
                'variants': [
                    {
                        'id': 'rp-email-yes',
                        'condition': "yes_no == 'yes'",
                        'keywords': ['yes', 'correct', 'that\'s right', 'yep', 'same'],
                        'text': "I've sent the reset link to varun.k@email.com. Here's what to do:\n\n1. Check your inbox (and spam folder just in case)\n2. Click the \"Reset Password\" link — it's valid for 15 minutes\n3. Create a new password (must be 8+ characters with a number and symbol)\n4. Your account will be unlocked automatically after reset\n\nIs there anything else I can help with?",
                        'thinkingTime': 2000,
                    },
                    {
                        'id': 'rp-email-changed',
                        'condition': "yes_no == 'no'",
                        'keywords': ['no', 'changed', 'different', 'new email', 'updated'],
                        'text': "I understand — for security, I can't update the email for password reset over the phone. You'll need to visit a branch with your ID to update your registered email.\n\nAlternatively, I can reset your password via SMS to your registered phone number ending in ***8891. Would you like me to do that instead?",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "I've sent the reset link to varun.k@email.com. Check your inbox, click the link (valid for 15 minutes), and create a new password. Your account will be unlocked automatically.",
            },
            'wrap-up': {
                'turn_index': 7,
                'variants': [
                    {
                        'id': 'rp-close',
                        'condition': "yes_no == 'no'",
                        'keywords': ['no', 'thanks', 'that\'s all', 'all i needed'],
                        'text': "You're welcome, Varun. If you have any trouble with the reset link, just call us back. Have a great day!",
                        'thinkingTime': 1200,
                    },
                ],
                'fallback_text': "You're welcome, Varun. If you have any trouble with the reset link, just call us back. Have a great day!",
            },
        },
    },

    # ==========================================
    # ACCOUNT RESTRUCTURING (escalated) — P3
    # ==========================================
    'restructure': {
        'stages': {
            'greeting': {
                'turn_index': 3,
                'variants': [
                    {
                        'id': 'rs-divorce',
                        'keywords': ['divorce', 'separation', 'wife', 'husband', 'spouse', 'splitting'],
                        'text': "I understand, Varun, and I'm sorry you're going through this. I can see you have several joint accounts that would need to be addressed.\n\nLet me summarize what I see:\n• Joint Checking Account\n• Joint Savings Account\n• Joint Mortgage\n\nIs that correct, or are there other joint accounts I should be aware of?",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'rs-standard',
                        'keywords': ['joint', 'separate', 'restructure', 'accounts', 'split'],
                        'text': "I understand, Varun. You'd like to separate your joint accounts. Let me pull up your account information.\n\nI can see joint checking, joint savings, and a joint mortgage on your profile. Is that everything, or are there additional joint accounts?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "I understand, Varun. You'd like to: Separate joint checking, Separate joint savings, Address joint mortgage. Is that correct?",
            },
            'details': {
                'turn_index': 5,
                'variants': [
                    {
                        'id': 'rs-more-accounts',
                        'keywords': ['credit card', 'automatic', 'payments', 'also', 'more'],
                        'text': "I understand the urgency and complexity. This involves multiple account types — checking, savings, mortgage, credit card, and automatic payments — and may have legal implications depending on your separation agreement.\n\nLet me connect you with a relationship manager who specializes in account restructuring. They can guide you through the entire process. One moment please.",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'rs-simple',
                        'keywords': ['yes', 'that\'s it', 'correct', 'right'],
                        'text': "Given the complexity of restructuring joint accounts, especially with a mortgage involved, I'd like to connect you with a relationship manager who can walk you through all the options and legal considerations.\n\nThis ensures everything is handled properly. One moment please.",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "I understand the urgency. This involves multiple account types and may have legal implications. Let me connect you with a relationship manager. One moment please.",
            },
            'agent-followup': {
                'turn_index': 9,
                'variants': [
                    {
                        'id': 'rs-get-started',
                        'keywords': ['get started', 'today', 'individual', 'new account', 'set up'],
                        'text': "Absolutely. Let's get your individual checking and savings opened right now while we're on the call. I'll also schedule a follow-up appointment to handle the mortgage and credit card restructuring once you have the legal paperwork.\n\nDoes Thursday or Friday next week work better for the follow-up?",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'rs-timeline',
                        'keywords': ['how long', 'timeline', 'process', 'when', 'take'],
                        'text': "The individual accounts can be set up today. For the joint mortgage and credit card, we'll need your separation agreement or court order — that typically takes 2–4 weeks once we have the documentation.\n\nWould you like to start with the accounts we can set up right now?",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "Absolutely. Let's get your individual checking and savings opened right now. I'm also scheduling a follow-up appointment for next week. Does Thursday or Friday work better?",
            },
            'wrap-up': {
                'turn_index': 11,
                'variants': [
                    {
                        'id': 'rs-close',
                        'keywords': ['thursday', 'friday', 'works', 'great', 'thanks', 'thorough'],
                        'text': "Of course, Varun. You'll receive a confirmation email within the hour with your new account details and the appointment confirmation. Take care, and we'll speak soon.",
                        'thinkingTime': 1500,
                    },
                ],
                'fallback_text': "Of course, Varun. You'll receive the confirmation email within the hour. Take care, and we'll speak Thursday.",
            },
        },
    },

    # ==========================================
    # CREDIT LIMIT (escalated) — P3
    # ==========================================
    'credit-limit': {
        'stages': {
            'greeting': {
                'turn_index': 3,
                'variants': [
                    {
                        'id': 'cl-specific-amount',
                        'keywords': ['increase', 'raise', 'bump', 'higher', 'credit limit', 'more credit'],
                        'text': "Thank you, Varun. I can see your excellent payment history on your Visa card:\n• Current Limit: $15,000\n• Account Age: 36 months\n• Payment History: All on-time\n• Credit Score: 782 (Excellent)\n\nSince the requested increase exceeds our auto-approval threshold, let me connect you with our credit underwriting team. With your track record, this should be straightforward.",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'cl-general',
                        'keywords': ['credit', 'limit', 'more', 'spend', 'not enough'],
                        'text': "I can help with that. Let me pull up your account details.\n\nYour current limit is $15,000 with an excellent payment history. How much of an increase were you hoping for?",
                        'thinkingTime': 2000,
                    },
                ],
                'fallback_text': "Thank you, Varun. I can see your excellent payment history. Current limit $15,000, 36 months on-time, credit score 782. Let me connect you with credit underwriting.",
            },
            'wrap-up': {
                'turn_index': 7,
                'variants': [
                    {
                        'id': 'cl-close',
                        'keywords': ['fast', 'thanks', 'everything', 'great', 'appreciate'],
                        'text': "You're very welcome, Varun. With your track record, it was an easy decision. Your new $25,000 limit is effective immediately. Enjoy the increased flexibility, and have a great day!",
                        'thinkingTime': 1500,
                    },
                ],
                'fallback_text': "You're very welcome, Varun. With your track record it was an easy decision. Enjoy the increased flexibility!",
            },
        },
    },

    # ==========================================
    # MORTGAGE RATE (escalated) — P3
    # ==========================================
    'mortgage-rate': {
        'stages': {
            'greeting': {
                'turn_index': 3,
                'variants': [
                    {
                        'id': 'mr-renegotiate',
                        'keywords': ['rate', 'renegotiate', 'refinance', 'lower', 'better rate', 'interest'],
                        'text': "I can definitely help you explore that. Let me pull up your mortgage details.\n\nYour current mortgage:\n• Account: ***4401\n• Rate: 6.1% fixed\n• Balance: $385,200\n• Monthly Payment: $2,548\n\nCurrent market rates are indeed lower. Let me connect you with our mortgage services team who can walk you through your refinancing options.",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'mr-curious',
                        'keywords': ['wondering', 'seen', 'rates come down', 'should be', 'think'],
                        'text': "Great timing to look into this, Varun. Your current rate of 6.1% was competitive when you locked it in, but market rates have shifted.\n\nLet me pull up your details and connect you with a mortgage specialist who can present your refinancing options.",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "Your current mortgage: Account ***4401, Rate 6.1% fixed, Balance $385,200, Monthly Payment $2,548. Current market rates are lower. Let me connect you with mortgage services.",
            },
            'agent-option': {
                'turn_index': 7,
                'variants': [
                    {
                        'id': 'mr-option-a',
                        'keywords': ['option a', 'fixed', 'lower payment', 'savings', 'first', '5.2'],
                        'text': "Wonderful choice, Varun. The fixed rate gives you predictability. Here's what I'm doing:\n\n• Locking in 5.2% for 60 days\n• Scheduling a property appraisal\n• Sending you a pre-filled refinancing application by email\n\nYour new estimated monthly payment will be approximately $2,333 — saving you about $215 per month or $2,580 per year.\n\nIs there anything else you'd like to know?",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'mr-option-b',
                        'keywords': ['option b', 'arm', 'adjustable', 'variable', 'lower initial', '4.8'],
                        'text': "The ARM option is a great choice if you're planning to sell or refinance again within 7 years. Here's what I'm setting up:\n\n• Locking in 4.8% for 60 days\n• Scheduling a property appraisal\n• Sending the refinancing application by email\n\nYour initial monthly payment will be approximately $2,247 — saving $301 per month for the first 7 years.\n\nAnything else you'd like to know?",
                        'thinkingTime': 2500,
                    },
                    {
                        'id': 'mr-more-info',
                        'keywords': ['difference', 'which one', 'recommend', 'pros and cons', 'compare'],
                        'text': "Great question. Here's a quick comparison:\n\n• Option A (5.2% Fixed): Predictable payment of ~$2,333/month forever. Best if you're staying long-term.\n• Option B (4.8% ARM 7/1): Lower initial payment of ~$2,247/month, but rate adjusts after 7 years.\n\nGiven your excellent credit, I'd recommend Option A for stability. Which would you prefer?",
                        'thinkingTime': 2500,
                    },
                ],
                'fallback_text': "Wonderful choice. I'm locking in the rate for 60 days, scheduling a property appraisal, and sending you a pre-filled refinancing application. New payment approximately $2,333 — saving $215/month.",
            },
            'wrap-up': {
                'turn_index': 9,
                'variants': [
                    {
                        'id': 'mr-close',
                        'keywords': ['perfect', 'sounds good', 'thanks', 'great', 'help'],
                        'text': "My pleasure, Varun. You'll receive the email within the hour. Congratulations on the rate reduction — that's significant savings over the life of the loan. Have a great day!",
                        'thinkingTime': 1500,
                    },
                ],
                'fallback_text': "My pleasure, Varun. You'll receive the email within the hour. Congratulations on the rate reduction!",
            },
        },
    },

    # ==========================================
    # WIRE TRANSFER (escalated) — P3
    # ==========================================
    'wire-transfer': {
        'stages': {
            'greeting': {
                'turn_index': 3,
                'variants': [
                    {
                        'id': 'wt-repeat-transfer',
                        'keywords': ['wire', 'transfer', 'international', 'send', 'parents', 'india', 'abroad'],
                        'text': "I can help you get started with that. I see a previous international wire on file to HDFC Bank, India.\n\nInternational wires require verification and a compliance review for amounts over $10,000. Let me connect you with our international payments team to process this securely.",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'wt-first-time',
                        'keywords': ['first time', 'never done', 'how do i', 'new'],
                        'text': "I'd be happy to help you set up an international wire transfer. I'll need a few details — the recipient's bank name, account number, and SWIFT code.\n\nSince this is your first wire, let me connect you with our international payments specialist who can guide you through the process.",
                        'thinkingTime': 2200,
                    },
                ],
                'fallback_text': "I can help you get started. I see a previous wire on file to HDFC Bank, India. International wires require verification and compliance review. Let me connect you with our international payments team.",
            },
            'confirmation': {
                'turn_index': 7,
                'variants': [
                    {
                        'id': 'wt-confirm-yes',
                        'condition': "yes_no == 'yes'",
                        'keywords': ['yes', 'correct', 'go ahead', 'looks good', 'proceed'],
                        'text': "Wire transfer initiated. Here's your confirmation:\n\n• Confirmation: #WIR-2026-44210\n• Amount: ${{wireAmount}} USD\n• Recipient: HDFC Bank, Mumbai\n• Wire fee: Waived (Platinum account)\n• Estimated arrival: 1–2 business days\n\nYou'll receive a confirmation email shortly. Is there anything else?",
                        'thinkingTime': 2200,
                    },
                    {
                        'id': 'wt-change',
                        'keywords': ['different', 'change', 'amount', 'wrong'],
                        'text': "No problem — what would you like to change? I can update the amount, recipient details, or we can start fresh.",
                        'thinkingTime': 1500,
                    },
                ],
                'fallback_text': "Wire transfer initiated. Confirmation #WIR-2026-44210. Amount: ${{wireAmount}} USD. Wire fee waived (Platinum). Estimated arrival: 1–2 business days.",
            },
            'wrap-up': {
                'turn_index': 9,
                'variants': [
                    {
                        'id': 'wt-close',
                        'keywords': ['great', 'easier', 'thanks', 'branch'],
                        'text': "Glad I could help, Varun. Next time you can also initiate international wires through our online banking portal — it's available 24/7 with the same competitive exchange rates. Have a great day!",
                        'thinkingTime': 1500,
                    },
                ],
                'fallback_text': "Glad I could help, Varun. Next time you can also initiate international wires through our online banking portal. Have a great day!",
            },
        },
    },
}
