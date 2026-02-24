# Trim DTMF Verification Steps — Fair Comparison

**Date**: 2026-02-24
**Status**: Approved

## Problem

The DTMF traditional IVR scripts have heavy authentication steps (full card numbers, SSNs, zip codes, dates of birth) that the AI IVR side doesn't require. This creates an unfair comparison — the time difference should come from menu navigation and hold times, not from extra security burden.

## Decision

**Approach A: Trim DTMF auth to match AI.** Remove excessive verification steps from 5 DTMF scenarios so both sides verify equivalently. The menu tree navigation + hold queues already demonstrate the contrast.

## Changes by Scenario

### block-card
**Remove**: 16-digit card entry, SSN last 4, "Verifying..." wait
**Keep**: Menu navigation through Cards > Lost/Stolen, card blocked confirmation
**After**: IVR navigates to the right menu, announces card blocked — no manual data entry

### activate-card
**Remove**: 16-digit card entry, SSN last 4, zip code entry, "Verifying..." wait
**Keep**: Menu navigation, card activated confirmation
**After**: IVR confirms new card ending in 5531 is activated after menu selection

### loan-balance
**Remove**: Account number entry, date of birth entry, "Retrieving..." wait
**Keep**: Menu navigation through Loans > Auto Loans, balance readout
**After**: IVR navigates to auto loans, reads balance — no credential entry

### reset-password
**Remove**: Account/SSN entry
**Keep**: Menu navigation through Other Services > Online Banking > Password Reset, email confirmation
**After**: IVR navigates to password reset, sends to registered email

### transfer-funds
**Remove**: Source account entry, destination account entry
**Keep**: Menu navigation through Account Services > Transfers, amount entry, confirmation
**After**: Amount is the only thing entered; accounts selected through menu

### No changes needed
- **dispute**: Agent-handled, auth is conversational (name + last 4)
- **restructure**: Agent-handled, no DTMF auth exists
- **credit-limit**: Agent-handled, auth is conversational
- **mortgage-rate**: Agent-handled, no DTMF auth exists
- **wire-transfer**: Agent-handled, details given to agent conversationally

## Metrics Update
Recalculate `metrics.totalTime` for each affected scenario to reflect the shorter scripts.
