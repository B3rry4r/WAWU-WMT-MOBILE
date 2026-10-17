# VERIFY-04 · round history

Moved out of [tasks/VERIFY-04.md](../VERIFY-04.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/features/verify/` `PublishScreen.tsx`, `publishApi.ts`, `IdentityCheck.tsx`, `identityModel.ts`, `ProductsFullHost.tsx`; `DraftFormScreen.tsx` (Publish); routes `publish`, `shop-product`, `create-upload`.
- Checks: tsc EXIT 0; eslint on the changed files EXIT 0; jest `src/features/verify` 8 suites, 67 tests (12 checkout, 11 publish and tier, 44 earlier) EXIT 0, and `src/features/create`, `me`, `settings`, `home` with the send model test, 17 suites, 314 tests, passed. Tests: `publishAndTier.test.tsx` (pick two files, category, publish once with the two file links, review note, share link through `Share.share`; no tier; paused with the Hub's reason; checking then passed then form; full tier opens VF13; `identityStateOf`).
- Gaps: G-VERIFY-04-1, G-VERIFY-04-2. Shared: SHARED-CHANGES ME-12 #2.
- NOT RUN: stack run and pictures.
- Round 2 (F3): app tsc EXIT 0; eslint on the changed files EXIT 0; jest `src/features/verify` 8 suites 70 tests EXIT 0 (new: the Hub's pause shows its sentence as VF15b, no steps added, nothing published, Try again opens Open your wallet). Backend `wmt/S7` ee90b56 on `wmt/MERGE-11`: tsc EXIT 0; eslint EXIT 0 on the changed files; jest 17 suites 319 tests (plans, upload allowance, the new unit, gate and HTTP specs: paused refused on POST /content, draft publish and presign; ID upload allowed; no tier gets 402 first; passed, under way and never started publish) EXIT 0; five more PlansModule specs 91 tests EXIT 0; `npm run test:protected` 2 suites 253 tests EXIT 0 (seeded database); gates 0 fail, 88 accepted EXIT 0; check_baseline EXIT 0; contract:build EXIT 0, 109 lines added, none removed.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

