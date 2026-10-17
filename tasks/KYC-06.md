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

As of 17 Oct 2026, builder round 2 done (Sonnet builder); waiting for a verifier.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/KYC-06-r2.md`, round 2): verdict merge, nothing medium or worse. Stacked in batch 7 (backend and mobile `wmt/MERGE-7`). Branch `wmt/KYC-06` in the mobile repo only (no backend, wawu-id or migration change: every route A26 to A29 use is served on backend main `a5e48fc`).
- **Built (round 1):** A26 `IdDocumentScreen`, A27 `ProofOfAddressScreen`, A28 `CheckingScreen`, A29 `RejectedScreen`, routes `open-wallet-id`, `-address`, `-checking`, `-rejected`, and `ReviewResume` on `/open-wallet` (a person whose details the Hub already has lands on A26, A28 or A29 by `review.stage`). A8 is KYC-04's, reached through `useOpenWalletWay().opened` once `accountNumberStatus` is `active`. Submit (`submit.ts`): `POST /money/wallet/open` only while the Hub has no opening or asks for the details again, then the ID's sides in one multipart request, then the proof of address.
- **Built (round 2, the check's findings and the owner's answers of 17 Oct):**
  - Finding 1: a refusal (`rejected`, `expired`) takes no documents until corrected details are sent (Hub `documents_closed`), and the details need the BVN and NIN (never held on the phone). So with no details held, A29's Upload again, and A26 or A27 reached by a link, lead to the first step (`/open-wallet?again=1`, which does not resume the review), never back to A29. A27's old "Start again" is "Add your details" and leads there too.
  - Finding 2: `useDraftLifetime` drops the photos and the bill when the last screen holding them closes (back, browser back, a screen replacing them, unmount), and `useDropDraftOnExit` when another screen takes the front.
  - Finding 3: SHARED-CHANGES KYC-06 #1 applied (four rows in `_layout.tsx`, row marked applied).
  - G-820: ID type and number (A26), bill type and postal code (A27), a `ChoiceField` and `AuthField` like the form's others, asked only where the open call carries them, sent as `idType`, `idNumber`, `proofOfAddressType`, `postalCode` (A5's town and state as `city` and `state`). G-822: a passport has one side (no back asked, Continue after the front). G-821: A28 reads "This usually takes a few minutes."
  - Findings 4 and 6: A27's Submit is never a silent dead end (it says what is missing under the field or in a banner); A28 and A29 error states have Close beside Try again.
- **Open (gaps):** G-820 (`bvn` and `nin` stay with A31, KYC-07: until it holds them Submit under nuvion ends in the Hub's own 400 for the first field it lacks, and no step links A6 to A26), G-821 (the boards' sublines "Done · NIN slip" and "Utility bill · September" stay unbuilt, R-47), G-823 (the Hub sends no notice when the account number is ready, so the owner's alert cannot be built: unblocked by a backend notification where `src/nuvion/handlers/accounts.ts` records the number).
- **Checks:** local full check EXIT 0 (typecheck, lint 0 errors, jest 186 suites and 3297 tests, gates 10 run, 697 files, 0 fail, 5 warn as on main, `npm run tasks`). Pictures (V5) of A26 to A29 at 390 px, light and dark, beside the boards, from a web export through stack `kyc_06`: the four states the boards draw match, the new fields look like the form's others. NOT RUN: the open call and its body in a browser (nothing links A6 to A26, and the kept BVN check is dropped when the first step closes), covered by `documentsFlow.test.tsx`; V9 against a Hub on `nuvion` (no Nuvion rows on the stack).
- **Next:** the lead merges it with batch 7.

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
