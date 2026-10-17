---
id: KYC-06
title: Complete your account: ID document, proof of address, checking, rejected
owner: YOU
area: KYC
order: 280
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [NUV-03, KYC-03, KYC-04, KYC-05]
decisions: [R-6, R-39, R-42]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A26, A27, A28, A29]
---
# KYC-06 · Complete your account: ID document, proof of address, checking, rejected

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder); waiting for a verifier.
- **Status:** verifying. Branch `wmt/KYC-06` in the mobile repo only (no backend, wawu-id or migration change: every route A26 to A29 use is served on backend main `a5e48fc`).
- **Built:** A26 `IdDocumentScreen`, A27 `ProofOfAddressScreen`, A28 `CheckingScreen`, A29 `RejectedScreen`, routes `open-wallet-id`, `open-wallet-address`, `open-wallet-checking`, `open-wallet-rejected`, and `ReviewResume` on `/open-wallet` (a person whose details the Hub already has lands on A26, A28 or A29 by `review.stage`, never on the first question again). A8 is the existing KYC-04 screen, reached through `useOpenWalletWay().opened` once the Hub says `accountNumberStatus` is `active`.
- **How Submit works** (`submit.ts`): `POST /money/wallet/open` only while the Hub has no opening or asks for the details again after a refusal (the day's tries are limited, so it is never repeated while `needs_documents`), then the ID's two sides in one multipart request, then the proof of address; the Hub sends the opening to review itself once both are in. Files live in memory (`draft.ts`), are dropped once sent and on every way out of the flow. A phone sends `{ uri, name, type }`, the browser sends the bytes (`api/documents.ts`).
- **Not drawn on purpose (R-47):** the boards' sublines "Done · NIN slip" and "Utility bill · September" (nothing knows a type or a month: G-821). Added states the boards do not draw but the flow needs: empty upload tile on A27, loading and error on all four, "Nothing to add here" when `required` is false, "Start again" when the details are no longer held, the wait line on A29 while `canResubmit` is false.
- **Open questions for the lead (gaps filed):** G-820 (the Hub's open call needs ID type and number, bill type, postal code and the BVN and NIN, and no board draws them, so a person with no opening yet cannot finish Submit; a person already at `needs_documents` can), G-822 (Continue needs both sides as drawn, a passport has one), G-821 (A28's "in a few moments" is a timing the Hub does not give). SHARED-CHANGES KYC-06 #1 (four route rows in `_layout.tsx`).
- **Checks:** typecheck, lint and `documentsFlow.test.tsx` (25 tests) pass; the full mobile check result is in the builder report (history). V5 pictures, V9 end to end through a Nuvion stack and the real submit: NOT RUN (see report).
- **Next:** a verifier runs V1, V4, V5, V6, V7, V9 on this branch. Findings by severity: none yet.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/KYC-06.md](history/KYC-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
