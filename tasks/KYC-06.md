---
id: KYC-06
title: Complete your account: ID document, proof of address, checking, rejected
owner: YOU
area: KYC
order: 280
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [NUV-03, KYC-03, KYC-04, KYC-05]
decisions: [R-6, R-39, R-42]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A26, A27, A28, A29]
---
# KYC-06 · Complete your account: ID document, proof of address, checking, rejected

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 1 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below. Nothing blocks it; ready to schedule.
- **History:** none yet. Reports go to tasks/history/KYC-06.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-6, R-39, R-42 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Opening a wallet now needs an ID document (front and back where it has two sides) and a proof of address, then the person waits for Nuvion's check and sees approval or a rejection with what to fix.

## Scope

- New files under `src/features/open-wallet/`. A26: `GET /money/identity/documents` (`required`, `documents`, `maxBytes`, `acceptedTypes`) and `POST /money/identity/documents` with the front and the back. A27: the home address and a utility bill or bank statement from the last 3 months, same route. Submit goes with `POST /money/wallet/open`.
- A28: poll `GET /money/wallet` (`state`, `accountNumberStatus`, `openingFlow`): "Checking your details", then A8 "Approved" (KYC-04) with the account number. A29: `review.reasons[].message` and `.fix` ("Your proof of address is older than 3 months", "Upload a bill or statement from July or later") and `review.canResubmit`; Upload again returns to A26 or A27.
- The hosted selfie hand-off (A6, A7) stays KYC-03's and is reworked in DV2-05. The old A20 "Proof of address" in the limits flow is WALLET-19's and is a different board.

## Capability checks

- [ ] A person can add both sides of an ID, a proof of address and a home address, and submit.
- [ ] A person waiting sees Checking your details and reaches Approved with the account number when the Hub says so.
- [ ] A rejected person sees the Hub's reason and fix, and can upload again once `canResubmit` is true.
- [ ] A person with no wallet who taps Wallet is sent into this flow in the ruled order (V7).
- [ ] Each board above (A26, A27, A28, A29) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
