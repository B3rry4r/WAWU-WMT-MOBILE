---
id: WALLET-25
title: Add money by card
owner: YOU
area: WALLET
order: 265
priority: after-launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [MONEY-06]
decisions: [R-10]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# WALLET-25 · Add money by card

## Current state

As of 16 Oct 2026.
- **Status:** todo. Nothing built, on purpose. Branch `wmt/WALLET-25` holds this note only (mobile); backend and wawu-id untouched.
- **Blocked:** there is no card provider to build against, and the task cannot be built under the current rulings.
  - Fintava takes no card payments into a wallet (`docs/fintava/naira-api.md`, "Money in": "No card collection").
  - Nuvion is the wallet provider (R-45). `tasks/NUV-04.md` (PLAN-PAY, 8 Oct) lists WALLET-25, WALLET-26 and WALLET-36 as obsolete: "Adding money is by bank transfer only (R-42), and Nuvion has no naira card or USSD pay-in." `docs/PAYMENTS-PLAN.md` (row for WALLET-25) says the same.
  - R-44: "there is no card payment for now", on the website and in the payment plan.
  - R-20 allows no mocks, stand-ins or fallbacks, and the machine has no provider keys, so a card flow cannot be built or tested against a provider that does not exist.
  - Nothing in either repo describes a card charge API: no endpoint, request, saved-card token, 3-D Secure step or webhook payload. The only card-acquiring facts are Nuvion's `error_acquiring_*` error codes in `src/nuvion/nuvion-error.ts`, which are not enough to build from.
- **Needed from the lead:** either mark WALLET-25 (and WALLET-26, WALLET-36) obsolete as NUV-04 says, or name the card provider and give its docs and a sandbox key. WALLET-36 depends on this task.
- **History:** tasks/history/WALLET-25.md not created (no round happened).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W16: top up with a card, 3-D Secure, saved cards.

## Scope

Card funding through Fintava (or the provider they name) with 3-D Secure and saved card tokens; the fee per R-10.

## Capability checks

- [ ] A sandbox card top-up credits the wallet once.
- [ ] A declined card shows why and charges nothing.

## Builder report

_Builder, 16 Oct 2026. No code was written; this is a stop, not a build._
- **Files changed:** this file only.
- **Why nothing was built:** see Current state. The task says "Fintava (or the provider they name)". Fintava has no card collection, Nuvion has no naira card pay-in (NUV-04), R-44 says no card payment for now, and R-20 forbids a stand-in.
- **Capability checks:** "A sandbox card top-up credits the wallet once" and "A declined card shows why and charges nothing": NOT RUN. No sandbox, provider or API exists for a card charge.
- **Gate counts:** not run (no code changed).
- **Gaps and shared-change requests filed:** none. A fee line is already in place for later: R-10 puts WAWU's 1.5% on the card provider's own charge, and the provider's charge is unknown (`docs/designer/BRIEF.md`, W16).
- **Not done and why:** everything in Scope, for the reason above.
- **Question for the lead:** is WALLET-25 obsolete (as NUV-04 says), or is there a card provider to build on? If there is one, a rebuild needs its docs for the charge call, the 3-D Secure step, card tokens, refunds and webhooks.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
