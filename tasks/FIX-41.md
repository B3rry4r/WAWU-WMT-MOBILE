---
id: FIX-41
title: A failed bank send that is later seen completed is put in front of a person, and a send to an unsaved account needs the name token
owner: YOU
area: MONEY
order: 335
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [WALLET-09]
decisions: [R-10, R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-41 · A failed bank send that is later seen completed is put in front of a person, and a send to an unsaved account needs the name token

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-41.md`): verdict merge, nothing medium or worse. Stacked in batch 5 (backend and mobile `wmt/MERGE-5`).
- **Id and order:** filed after-launch at order 290, the way FIX-38 (289) is (the task check keeps launch orders before full QA); it follows WALLET-09, which is launch.
- **History:** the builder report is in [history/FIX-41.md](history/FIX-41.md).
- **Open findings:** none yet. Two things left for the sweep are in tasks/SWEEP-MONEY.md (F1, F2).
- **Next:** an independent verifier checks the two rulings below against the WALLET-09 round 2 specs (R1 and N3).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The WALLET-09 task file, and the verifier's round 2 report (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-09.md`, findings 1 and 3)
- `tasks/SWEEP-MONEY.md`, row F8

## Goal

Two follow-ups the WALLET-09 round 2 check found (lead's rulings, 16 Oct 2026; the owner may override).

1. **A failed bank send that is later seen completed is never left silent** (SWEEP-MONEY F8). WALLET-09 round 2 fails a send at once on three refusals (payouts not available, a frozen wallet, not enough balance), on the word that no transfer exists. If that word is wrong and the transfer completes, nothing flagged the send. Now a SUCCESS sighting on a failed bank send (a webhook the ledger notes as `status failed vs completed`, or a provider read) sets the transfer's review flag and its discrepancy and logs once. It changes no balance and never sends again. The sweep also asks the provider once about each bank send that failed 1 to 48 hours ago with no provider record (a read by our reference through `WALLET_PROVIDER`, R-39, nothing sent), so a success the webhook missed is found too. A provider that could not be reached is asked again. A retry with the same released key is still a new send; the first one is now visible for review.
2. **A send to an account that is not saved must carry the `nameToken`** of the name check the person saw. Without it the route answers `400` with one plain sentence, before the PIN: nothing sent, no PIN try used, the key given back. A saved account and the payout account (a withdrawal) are unchanged.

## Scope

`src/money/transfers/wallet-transfer.service.ts` (the settle branch for a failed bank send, the sweep's one look), `src/money/transfers/bank-send-target.ts` (the guard), the `nameToken` description in `src/money/dto/money-request.dto.ts`, `docs/contract/CONVENTIONS.md`, and `contract/openapi.json` regenerated (one description; SHARED-CHANGES FIX-41 #1). Tests: the cases below are added to `src/money/transfers/tests/bank-transfer.contract.spec.ts`, whose `send` helper now carries the name check's token as the app does (a test that wants none writes `nameToken: undefined`).

## Capability checks

- [ ] R1, for each of the three refusal kinds: refuse the send, deliver a signed SUCCESS for its reference, and the transfer stays `failed` with the review flag and a discrepancy set, one log line, no balance moved, no second call to the provider; the same delivery again and a sweep change nothing; a retry with the same key is a new send and the first stays flagged.
- [ ] R1, the sweep: a failed bank send the provider has a SUCCESS record of is flagged once; none is asked before an hour or after 48 hours; a send with no record at the provider is asked once and flagged never.
- [ ] N3: a send to an unsaved account without the token is `400`, nothing sent, no PIN try used, and the same key works with a token; a saved account and the payout account send without one.
- [ ] Red on `b113e63` first: the five new cases fail there (no flag, no lookup, `403` from the PIN instead of `400`).
- [ ] Every WALLET-09 case still passes. Backend `tsc --noEmit`, eslint, `contract:build` twice equal, CI on the head.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-41.md](history/FIX-41.md).

## Owner sign-off
