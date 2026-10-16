---
id: KYC-07
title: Complete your account: the flag on Home, and BVN and NIN as step 1 of 4
owner: YOU
area: KYC
order: 281
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [KYC-06, HOME-01, KYC-05]
decisions: [R-6, R-47]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A30, A31]
---
# KYC-07 · Complete your account: the flag on Home, and BVN and NIN as step 1 of 4

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): KYC-06.
- **History:** none yet. Reports go to tasks/history/KYC-07.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-6, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Until the wallet is open, Home shows a "Complete your account" flag that starts the identity steps, and the BVN and NIN step reads "1 of 4" (A31); the flag is an extra way in beside the first tap on Wallet (R-6).

## Scope

- New files under `src/features/open-wallet/` and a small change to Home's wallet card (HOME-01's `MoneyCard.tsx`, fenced to this task by the entry rule). A30: while `GET /money/wallet` `state` is not open the card shows "Complete your account / Verify your identity to get your account number"; it goes when the account is open (the flag stays until KYC is done).
- A31: the BVN and NIN step (KYC-05's fields) under the "Complete your account" header with "1 of 4", then the selfie hand-off, the ID document (A26) and the proof of address (A27). `POST /money/identity/bvn` and `GET /money/identity` are unchanged. The phone-does-not-match case still reaches A14.
- Route-graph row in SHARED-CHANGES queue 4: sign-up no longer asks for the BVN (A3, DV2-05).

## Capability checks

- [ ] A person with no wallet sees the flag on Home, taps it, and reaches A31.
- [ ] A person who has opened their wallet no longer sees the flag.
- [ ] A31 shows step 1 of 4 and moves to the next step with a matching BVN.
- [ ] Each board above (A30, A31) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
