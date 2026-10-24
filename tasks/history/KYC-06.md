# KYC-06 · round history

Moved out of [tasks/KYC-06.md](../KYC-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder (Sonnet), 17 Oct 2026. Mobile `wmt/KYC-06` from `origin/wmt/MERGE-5` `7de785d`; backend untouched (a5e48fc serves every route used).

**Files** (all under `src/features/open-wallet/` unless named): new `IdDocumentScreen.tsx` (A26), `ProofOfAddressScreen.tsx` (A27), `CheckingScreen.tsx` (A28), `RejectedScreen.tsx` (A29), `ReviewResume.tsx`, `DocumentParts.tsx` (upload tile, file row), `documentCopy.ts`, `draft.ts`, `submit.ts`, `api/documents.ts`, `api/review.ts`, `documents/{types,pick,pick.web}.ts`, `__tests__/documentsFlow.test.tsx`; routes `src/app/open-wallet-{id,address,checking,rejected}.tsx`; changed `entry.ts` (4 paths), `leave.ts` (the 4 routes join the flow, `checking`, `rejected`, `uploadAgain`, `needsDocuments`, and the draft is forgotten on leave and opened), `src/app/open-wallet.tsx` (wrapped in `ReviewResume`), `BACKEND_GAPS.md` (G-820 to G-822), `SHARED-CHANGES.md` (KYC-06 #1), `docs/LOG.md`.

**Capability checks** (each a named "a user can" test in `documentsFlow.test.tsx`, run against the real `fetch` path with a stubbed network):
- Both sides, a proof and an address, Submit: the ID's two sides go in ONE multipart request (`kind`, `file`, `file_back`, asserted in order), the proof in another, no details sent again while `needs_documents`; with no opening yet the details go first, from the kept check and the typed address, never a `checkHandle`.
- Waiting: A28 shows "Checking your details", stays while `checking` or `approved` with the number `on_its_way`, and moves to A8 only when `state` is `open` and `accountNumberStatus` is `active`; to A29 on `rejected`, `stopped` or `expired`; to A26 on `needs_documents`.
- Rejected: A29 shows each `reason.message` and `fix`; Upload again only when `canResubmit` (A27 when every reason is the proof of address, else A26); otherwise the wait from `canResubmitAt` and Done.
- Order (V7): `/open-wallet` resumes by `review.stage` (`resumeTarget`); NOT walked on a device or stack.
- Loading, error and the added states are entered by their real cause (a 503 from `GET /money/wallet`, `409 wallet_not_open`, `required: false`, a refused upload, `documents_closed`).

**Gates and counts** (local full check, GitHub cannot run mobile CI): typecheck and lint clean; `npm test -- --maxWorkers=2` 185 suites, 3268 tests passed (before two renames the gates asked for); `npm run gates` 10 gates, 693 files scanned, 0 fail, 5 warn (the five PROVISIONAL warnings on main, none mine); `npm run tasks` 330 tasks ok. The gates first failed three of my lines (a `gap:` key, a `showProblem` state name, a comment); fixed by renaming, then gates, typecheck, lint, `documentsFlow.test.tsx` (25) and `npm run tasks` run again, EXIT 0. Gate counts before my change were not taken separately (main's own run: 0 fail on these files).

**NOT RUN, with the reason:** (1) V5 pictures at 390 px, light and dark, beside A26 to A29: the stack's Hub runs the older opening (`WALLET_PROVIDER` fintava), so none of these screens has data to draw there, and a Hub on `nuvion` takes only `https://api.nuvion.dev` as its base URL (no local stand-in can stand behind a built Hub), so a picture needs the Nuvion rows seeded in the stack's database or the app's calls answered by a browser-side fixture; neither was done inside the step budget. The boards were rendered (`build/design_shots/`) and the layout metrics are taken from `design/_gen/auth.js` lines 62 to 68, not from a picture comparison. (2) V9 for Submit and A28 to A8 against a built Hub: same reason; the reads and writes are the generated contract's, tested against its response shapes. (3) A device (V10): the camera and file pickers on a phone.

**Gaps and shared changes filed:** G-820, G-821, G-822; SHARED-CHANGES KYC-06 #1.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._


## Builder report (round 2)

Builder (Sonnet), 17 Oct 2026. Mobile `wmt/KYC-06` continued from `b6629b4` (on `7de785d`); backend read-only at `a5e48fc`, no migration.

**Files** (under `src/features/open-wallet/` unless named): new `ChoiceField.tsx`, `DetailsNeeded.tsx`, `documentFields.ts`, `__tests__/routeGuard.test.tsx`; changed `IdDocumentScreen`, `ProofOfAddressScreen`, `CheckingScreen`, `RejectedScreen`, `ReviewResume`, `draft`, `submit`, `leave`, `entry`, the four route files, `src/app/open-wallet.tsx` and `src/app/_layout.tsx` (SHARED-CHANGES KYC-06 #1, marked applied), `BACKEND_GAPS.md` (G-820 to G-822 notes, G-823 new). Tests changed in `documentsFlow.test.tsx` (this task's own): the A27 "Start again" test became "Add your details", the A27 open-call test carries the new fields, Submit is no longer asserted disabled, A28's line, and two A29 tests hold details first.

**Red first, then green** (`documentsFlow.test.tsx`, "Round 2" blocks, and `routeGuard.test.tsx`): 24 of 46 tests and 4 of 8 failed before the code; all pass after. A rejected person with no details held is led to the first step from A29, A26 and A27 and sent nothing; the first step skips the resume (`skip`); with details held A27 sends them then the documents; photos and bill are dropped when the last holder closes and kept while A26 is still there; signed out, none of the four stays; the new fields are asked and checked only where the open call carries them; a passport asks no back; Submit names what is missing; A28 and A29 errors have Close.

**In a browser** (stack `kyc_06`, own Metro cache, only ports 7460 and 7467 baked, real login, fixtures for `/money/*` only): cold load of A29 then Upload again lands on `/open-wallet?again=1` with the first step shown; A26 and A27 by a link with nothing held show "We need your details again" and lead there; signed out, each of the four goes to the welcome screen with no money call; home, A26, A27, back, back, reopen A26 reads "Tap to take a photo" on both tiles; Close on the A28 and A29 errors leaves to Home; a passport hides the back and unlocks Continue after the front. Pictures in `scratchpad/kyc-06-b/pics/` (`cmp-a26` to `cmp-a29`: board dark, built dark, board light, built light).

**Gates and counts:** before 185 suites, 3268 tests; after 186 suites, 3297 tests, gates 10 run, 0 fail, 5 warn (the same five as main), lint 0 errors.

**Gaps and shared changes:** G-820 (BVN and NIN with KYC-07), G-821 (sublines), G-822 resolved, G-823 new; SHARED-CHANGES KYC-06 #1 applied.

**Not done:** the open call's browser trace and V9 on a `nuvion` Hub (see Current state).

