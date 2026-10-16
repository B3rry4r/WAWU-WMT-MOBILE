---
id: SWEEP-MONEY
title: Money sweep: the low findings of the money tasks
owner: YOU
area: SWEEP
order: 248
priority: launch
repo: all
type: backend-refactor
status: todo
depends_on: [MONEY-16, NUV-06, WALLET-07, WALLET-04, WALLET-16, TIER-02, SETTINGS-06]
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-MONEY · Money sweep: the low findings of the money tasks

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 40, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
- **Waits on:** MONEY-16, NUV-06, WALLET-07, WALLET-04, WALLET-16, TIER-02, SETTINGS-06 (not merged yet; its lows are listed now so none is lost).
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Money, wallets, bills and tiers: MONEY, NUV, WALLET, BILLS and TIER tasks. Backend, wawu-id and mobile. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| MONEY-16 | RF-1 | Any HTTP 200 from the mail route counts as mailed; require `emailed === true`. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 181 |
| MONEY-16 | RF-2 | `giveUp` misses a lease whose `leaseUntil` is already past. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 182 |
| MONEY-16 | RF-3 | A body key named `constructor` makes wawu-id answer 500. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 183 |
| MONEY-16 | RF-4 | A bare domain or phone number inside a sentence is not handled. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 184 |
| MONEY-16 | RF-5 | A newline in a logged value can forge a log line. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 185 |
| MONEY-16 | RF-6 | docs/LOG.md says G-680 for what was renumbered G-690. | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 186 |
| MONEY-16 | RF-7 | Test gaps M10, M13, M18, M32 and W16 (surviving mutants). | branch `wmt/MONEY-16`, `tasks/MONEY-16.md`, Verifier report, round 2, line 187 |
| NUV-06 | F1 | The WALLET-09 lead note names the private `prepare`; callable are `forBeneficiary` and `forPayoutAccount`. The seam's `reconcileSend` needs a SHARED-CHANGES NUV-06 #2 row. | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 293 |
| NUV-06 | F2 | `nuvion-adapter.spec.ts` was edited (three methods added to its filled-by-a-task list) and no SHARED-CHANGES row says so. | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 294 |
| NUV-06 | F3 | A ledger row of another provider on the same reference waits forever here; NUV-05 stops for review. | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 295 |
| NUV-06 | F4 | The changed NUV-05 test can no longer tell `done` from `failed` for a bank-transfer stranger (mutant T04 survives). | branch `wmt/NUV-06`, `tasks/NUV-06.md`, Verifier report, round 2, line 296 |
| NUV-05 | N1 | Seven of 37 mutants survive the builder's specs (all killed by the verifier's probes). | `tasks/NUV-05.md`, Verifier report, line 162 |
| NUV-05 | N2 | `reconcileSend` starts its walk at `since` minus ten minutes, not at the row's `sentAt` (latent, no caller reaches it). | `tasks/NUV-05.md`, Verifier report, line 163 |
| NUV-05 | N3 | A `refunded` event whose `payment_type` is not `book-transfer` is answered `done` before `meta.source_payment_id` is read (needs the sandbox). | `tasks/NUV-05.md`, Verifier report, line 164 |
| NUV-03 | N1 | Low. The boot refusal for `IDENTITY_HOLD_DAYS` above 30 applies under every `WALLET_PROVIDER`: with `IDENTITY_HOLD_DAYS=40` on fintava the branch refuses to boot where main boots. Accept, or gate the check on the Nuvion provider. | `tasks/NUV-03.md`, Verifier report, round 4, line 419 |
| NUV-03 | N2 | Low, test gap: mutant C1 survives. Removing `bvnVerifiedAt: startedAt` from the `failed` branch of `ReviewedOpening.claim()` passes every spec of the area. | `tasks/NUV-03.md`, Verifier report, round 4, line 420 |
| WALLET-06 | T4 | Test gap: the `pin_changed_again` branch of W36 and W37 re-reads the wallet, and nothing asserts it. | `tasks/WALLET-06.md`, Verifier report, round 3, line 410 |
| WALLET-06 | T5 | Test gap: the old-row mutant VB08 is killed by one test only. | `tasks/WALLET-06.md`, Verifier report, round 3, line 412 |
| WALLET-07 | D1 | Spec gap: `completeFromRecord`'s fresh re-read for a send no longer `pending` is pinned by no spec (mutant M02). | branch `wmt/WALLET-07`, `tasks/WALLET-07.md`, Verifier report, line 98 |
| WALLET-07 | D2 | Spec gap: the sweep's backoff and the 72 hour lower bound are pinned by no spec (M20, M21). | branch `wmt/WALLET-07`, `tasks/WALLET-07.md`, Verifier report, line 99 |
| WALLET-07 | D3 | Wording: a request that never left answers 503 `provider_unreachable` with "We are still confirming this payment". | branch `wmt/WALLET-07`, `tasks/WALLET-07.md`, Verifier report, line 100 |
| WALLET-04 | D2 | Test gap: the debit total could be summed on the phone and no test would notice (M09). | branch `wmt/WALLET-04`, `tasks/WALLET-04.md`, Verifier report, line 142 |
| WALLET-04 | D3 | Test gap: the search wait and the search key are pinned by no test (M13, M14). | branch `wmt/WALLET-04`, `tasks/WALLET-04.md`, Verifier report, line 143 |
| WALLET-04 | D4 | W27's Account line loses the last four digits for a long bank name. | branch `wmt/WALLET-04`, `tasks/WALLET-04.md`, Verifier report, line 144 |
| WALLET-16 | F6 | An earning does not check that payer and payee differ (nor does the database). | branch `wmt/WALLET-16`, `tasks/WALLET-16.md`, Verifier report, line 113 |
| WALLET-16 | F7 | The trigger that keeps a landed row from changing covers UPDATE, not DELETE. | branch `wmt/WALLET-16`, `tasks/WALLET-16.md`, Verifier report, line 114 |
| BILLS-01 | R4-1 | More spellings of "n/a" (`N-A`, `N A`, `N_A`) and look-alikes (`nu1l`, Cyrillic u) draw a green name. | `tasks/BILLS-01.md`, Verifier report, round 4, line 437 |
| BILLS-01 | R4-2 | A failure signal the reader does not walk (`result`, `outcome`, `isError` and others) leaves a green name beside it. Low, as ruled. | `tasks/BILLS-01.md`, Verifier report, round 4, line 438 |
| BILLS-01 | R4-3 | A real owner is refused (502 `meter_unconfirmed`) when a success body says "without errors". Low, fails safe. | `tasks/BILLS-01.md`, Verifier report, round 4, line 439 |
| BILLS-01 | R4-4 | The placeholder rule reads only the first 2,000 characters before dropping invisible ones. Hostile input only. | `tasks/BILLS-01.md`, Verifier report, round 4, line 440 |
| BILLS-01 | R4-5 | Trailing invisible characters are not stripped from a real name. Info. | `tasks/BILLS-01.md`, Verifier report, round 4, line 441 |
| BILLS-01 | R4-6 | Backspace after a comma and Delete before one are dead keys in the amount box. Low now, medium when the web follows. | `tasks/BILLS-01.md`, Verifier report, round 4, line 442 |
| BILLS-01 | R4-7 | A refused paste over a selection collapses the selection; a digit beside a dropped leading zero. Cosmetic. | `tasks/BILLS-01.md`, Verifier report, round 4, line 443 |
| TIER-02 | D11 | The owner question's item 7 has the wrong numbers: with 15 places "remove some" is the whole truth at 15 up, and the worst case is 5. Info; fix at the mobile sign-off. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 918 |
| TIER-02 | T14 | No route-level test reaches a tier the config does not name (mutant M1 survives all 125 tests). Info. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 919 |
| TIER-02 | N18 | The new ended-plan sentence drops "Everything you published stays up." Wording; the owner may want it back. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 920 |
| TIER-02 | N19 | An ended tier that held extras: the sentence says a bigger plan has room and does not say to renew. Never false. | branch `wmt/TIER-02`, `tasks/TIER-02.md`, Verifier report, round 5, line 921 |
| SETTINGS-06 | L4 | Money check and freeze are not atomic with a money action: an open hold created while the balance is being read still lets DELETE schedule (the final check keeps the account, so no money is lost). Pending ledger entries (a withdrawal made to empty the wallet) are not a blocker; a failed one would reverse into the frozen wallet and hold the purge back. | branch `wmt/SETTINGS-06`, `tasks/history/SETTINGS-06.md`, Verifier report, round 1, finding 4 (copy at `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-06.md`) |
| SETTINGS-06 | L5 | A cancel after a provider switch (scheduled under Fintava, cancelled with a provider that cannot unfreeze) answers `cancelled: true, walletUnfrozen: false`, clears `walletFrozenAt` and leaves the wallet frozen at Fintava. The row's `walletProvider` is not used. | branch `wmt/SETTINGS-06`, `tasks/history/SETTINGS-06.md`, Verifier report, round 1, finding 5 (copy at `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-06.md`) |
| SETTINGS-06 | L6 | A wallet opened during the 30 days is not frozen (nothing refuses opening while a deletion is scheduled); the final check blocks the purge if it holds money. A repeat DELETE after the date but before the sweep answers a past date. The web's comments in `src/lib/api/settings.ts` (lines 120 and 127) still say 48 hours. | branch `wmt/SETTINGS-06`, `tasks/history/SETTINGS-06.md`, Verifier report, round 1, finding 6 (copy at `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SETTINGS-06.md`) |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
