---
id: MONEY-15
title: Transaction history and detail
owner: YOU
area: MONEY
order: 108
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-10]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# MONEY-15 · Transaction history and detail

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W26-W28: search, filter, monthly in and out, and one transaction's detail.

## Scope

GET history with search, category filter and cursor pages; monthly totals; GET one transaction.

## Capability checks

- [ ] Searching a recipient's name finds their transfers.
- [ ] Monthly totals equal the sum of that month's rows.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-15` 35e4e33 (from main 6d48c97, which did not move; `origin/wmt/MONEY-13` 35b68af merged in as 35e4e33 at the lead's request); mobile `wmt/MONEY-15` (from main 12aa3c9; main 3304f1e merged in, PROGRESS regenerated, `npm run check` exit 0 again: 371 tests, gates 0 fail on 96 files, 203 tasks).
- **MONEY-13 merged in (lead's request):** a merge commit, no rebase; one conflict, the comment block in `money.module.ts` (both kept). The three history routes now carry `@RequireOpenWallet()` and take `@CurrentWallet()`; the service's own no-wallet check and its `BALANCE_OPENING_MESSAGE` import are gone, so no wallet is the gate's `409 wallet_not_open` / `wallet_opening` in the gate's words (my spec now asserts `NO_WALLET_MESSAGE` and `WALLET_OPENING_MESSAGE` on all three routes). MONEY-13's specs changed on purpose, each because these routes are now served and gated: the gated-route lists in `wallet-gate-coverage.spec.ts` and `wallet-gate.contract.spec.ts` name the three routes (the contract spec then sends them as every kind of person without a wallet), and the coverage spec's example of a declared route moves from `GET money/transactions` to `GET money/holds`. Gate specs 3 suites, 45/45. Contract regenerated after the merge: semantically identical (enum order aside), so the committed file is unchanged. If MONEY-13 changes after its verification, this branch merges it again.
- **Built** (`src/money/history/`): `GET /money/transactions` (filter chips, `q`, `month`, cursor pages, grouped unlock earnings, `group=<key>`), `GET /money/transactions/summary`, `GET /money/transactions/{id}`, served from the MONEY-10 ledger only (no Fintava call, no balance); the MONEY-04 declarations removed from `MoneyContractModule`, contract regenerated (only the 3 operations lose `x-wawu-served: false` and their "not served" note; path order moves). Rules written in backend `docs/contract/CONVENTIONS.md` section 6 ("The history"). Shared files touched, small: `src/money/money.module.ts` (controller + provider), `money-contract.module.ts`, `SERVED_MONEY_ROUTES` (+3), `WALLET.md` (3 rows), `contract/openapi.json` (regenerated). The no-wallet answer is MONEY-13's wallet gate (below).
- **Check 1, searching a recipient's name finds their transfers:** `money-history.contract.spec.ts` records rows through the ledger's own writer and reads them over HTTP with RS256 tokens: every transfer naming Chidinma Okoro (bank, wallet, in) and nothing else, for "Chidinma", "chidinma okoro", "OKORO", "dinma O" and her handle; with `filter=money_out` only her money out; a row a delivery wrote (no name) is named from the other person's `FintavaWallet.accountName` and found. Sandbox (`docs/fintava/sandbox/36-money15-history.md`): a real ₦10 round trip A to B and back, `q=Bayo` as A finds both movements, B gets 404 for A's row.
- **Check 2, monthly totals equal the sum of that month's rows:** the spec walks the month's list page by page and adds up its completed rows by direction: equal to `/summary`, and to the expected 10,200,000 in / 3,768,076 out, with Lagos-midnight edges on both ends, pending, failed and a reversed send left out, and a grouped row not changing it. Sandbox: `inKobo` 1000, `outKobo` 1000 = the month's 2 completed rows.
- **Also proved:** 45 rows in 3 pages, each once, newest first, a row landing mid-scroll shifts nothing; bad cursor, group key, month, limit, `q` length, non-uuid id: 400; someone else's row = no row = 404; merchant rows never shown; status as the ledger moves it (pending, completed, reversed; a disagreeing sighting stays pending); W27 fee split ₦25,000 + ₦40 + ₦25 = ₦25,065; only the last 4 of a bank account; kobo exact at 2^53-1. 37 tests (25 HTTP, 12 unit). 14 one-line mutants of the service, each alone, file restored by copy (owner, account, wallet kind, the summary's owner and wallet kind, completed-only summary, Lagos day, Lagos month, LIKE escape, completed-only groups, group of 2 or more, the fee split check, the cursor's id tie-break, note search): all killed; owner, account and wallet kind only after the "only rows on the caller's own wallet" test was added (each is redundant with the other two on rows the writer makes).
- **Checks after the MONEY-13 merge (35e4e33):** `tsc` 0; eslint 0 on changed files; full suite on fresh seeded `m15_full2_test` with my WAWU ID stand-in on :4001 (`lsof` empty before and after, stopped straight after): 126/126 suites, 3,058 passed, 3 skipped, 0 failed (`hub-rate-limits` and every money, Fintava, KYC and identity spec in it); protected `run.sh --fresh` (code 35e4e33, lock 6d48c97): 253/253, all 244 required, no lock file touched; gates 16 fail / 10 warn / 76 accepted on 628 files, the same findings as main; CI tripwire 0; key scan 0 of 58.
- **Checks before the merge (3a16544):** `tsc --noEmit` 0; eslint 0 on every changed `.ts`; `src/money src/fintava src/admin/kyc-review` + `hub-rate-limits`: 30 suites, 1,305 passed (no `@Throttle` added); full suite on fresh seeded `m15_full_test`, WAWU ID stand-in on :4932, the 4 suites that hard-code :4001 left out: 119 suites, 2,951 passed, 3 skipped, 22 failed, all in `notification`, `blocked-account` and `saved-item`, which also hard-code :4001 and got 401 because :4001 was then held by another session's process; once :4001 was free (`lsof` empty before and after; my stand-in started there and stopped straight after) those 3 and the 4 left out ran on fresh seeded `m15_p4001_test`: 7/7 suites, 67/67, so 0 failures across the suite; protected `run.sh --fresh` (code 3a16544, lock origin/main 6d48c97): 253/253, all 244 required, no lock file touched. Gates before 16 fail / 10 warn / 76 accepted (619 files), after 16 / 10 / 76 (624 files), the same findings line for line (main has 10 warn, not 9); `check_baseline.py` clean; CI tripwire 0 added lines; key scan 0 of 58 windows on every commit and the sandbox output. Mobile `npm run check` before (main 12aa3c9): exit 1, only "docs/PROGRESS.md is out of date" (main's own state); after (this branch, PROGRESS regenerated): exit 0, typecheck 0, lint 0, 20 suites / 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks. Mobile `sync_contract.py --backend` copies the backend's origin/main (6d48c97), so only `contract/SOURCE_COMMIT` moved (cdcb2bc to 6d48c97, same contract); the 3 routes' served markers reach the app's contract when the backend branch merges (no type changes: the generated file only loses the three "Declared by MONEY-04, not served yet" doc comments).
- **Gaps filed:** G-44 (the receiver's row shows Fintava's reference, the sender's ours: two receipt references for one transfer; MONEY-10's consumer) and G-45 (rows only a delivery wrote have a bank code and no bank name, so "Transfer · GTBank" loses the bank; WALLET-09, WALLET-10). No shared-change request. `contract:build` is not deterministic (a second build reorders enum values); the committed contract is the first build, semantically main's plus the 3 served markers.
- **Default (agent), owner may override:** (1) only `completed` unlock earnings group, so a group's status and sums are confirmed money; (2) a group's id, reference and time are its latest movement's, its counterparty, note and ids null, and search sees its description only; (3) `group=<key>` ignores `filter`, `q` and `month`; (4) "Content" is unlocks and tips, "Bills" is category `bill` or a `bill` link (a held bill too); (5) the receipt shows the sending feature's quoted fee split only when amount plus both equals Fintava's total, else Fintava's charge with WAWU's fee 0; (6) the summary sums `totalKobo` of `completed` rows by `occurredAt` in Africa/Lagos time; (7) a frozen wallet's history still reads (nothing asks Fintava, and the gate answers no freeze); (8) copy the canvas does not draw, for the owner to read: "Top up", "Held payment", "Payment", "Earning", "Credits", "Paid question", "Event ticket", "Legal fee", "School fee", "Verification", "Reversal", "Refund", "Bill", "Bank account", "Biller", "Someone on Who Made This", "Who Made This", "N buyers", "We could not find that transaction."; (9) the other side's name: as recorded, else their wallet's account name, else `@handle`; the reference: ours, else Fintava's, session, transaction id, tagapay, else the row id.
- **NOT RUN:** V9's real sign-in (verifier's pass; the sandbox run signed in at the stand-in WAWU ID). Bank-send and bill rows from the sandbox: payouts refused (question 17). A real delivery: OPS-10. W27 "Report a problem": SUPPORT-01 (G-8). V10: no screen (WALLET-04).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
