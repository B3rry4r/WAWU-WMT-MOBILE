---
id: WALLET-37
title: Withdraw only to your own name, and 30 name checks an hour
owner: YOU
area: WALLET
order: 255
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [WALLET-09, WALLET-14]
decisions: [R-51, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-37 · Withdraw only to your own name, and 30 name checks an hour

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** S. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): WALLET-09.
- **History:** none yet. Reports go to tasks/history/WALLET-37.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-51, R-10 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A person can set a payout account only in their own verified name, and a withdrawal to any other name is refused before the PIN. Bank name checks are limited to 30 an hour per person (R-51; G-765, G-764). Sends to other people are unchanged.

## Scope

- `PUT /money/payout-account` refuses an account whose holder name does not match the verified name (the rule `matchesBvnName` uses today): `409` with a plain-words reason and the bank's name beside the verified name, nothing saved. A saved payout account that no longer matches (the bank now names it differently) is refused at withdrawal time, before the PIN, with the key given back (WALLET-09 pattern, G-762).
- `POST /money/banks/name-check` allows 30 checks an hour per signed-in person (not per address, G-764). The number is an admin setting (`name_check_per_hour`, launch value 30). Over it: `429` with the minutes left in plain words, no check made.
- The app side is one change in A21 (WALLET-11's `src/features/wallet/PayoutAccountScreen.tsx`): show the refusal reason and let the person fix the account. No other screen changes.

## Capability checks

- [ ] A person saves a payout account in their own name; saving one in another name is refused and nothing is stored.
- [ ] A withdrawal to a payout account the bank now names differently is refused before the PIN and the key is given back.
- [ ] The 31st name check in an hour from one person answers 429 and a second person on the same address is not blocked.
- [ ] A bank send to someone else's account (W8) still works and still confirms the name.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
