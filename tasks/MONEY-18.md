---
id: MONEY-18
title: Hold, release and refund
owner: YOU
area: MONEY
order: 94
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17]
decisions: [R-19, R-10, R-31, R-5, R-11, R-39, R-42, R-44]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-18 · Hold, release and refund

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Paid DMs and tickets hold money until something happens, then pay out or refund.

## Scope

Hold (a transfer into WAWU's merchant wallet, R-19), release to the payee, refund to the payer.

Fintava's charge on a release or a refund is WAWU's to pay (R-31).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava's API can't reserve part of a balance, so a hold is a transfer into WAWU's merchant wallet (`/transaction/wallet-to-wallet` with our `CustomerReference`), released by a transfer to the payee or refunded by a transfer back (R-19). The nightly check (MONEY-16) also checks that held money in WAWU's wallet equals the open holds in our ledger.

## Capability checks

- [x] A held payment is not spendable by the payer and not yet paid to the payee.
- [x] A refund returns the price (not Fintava's charge) to the payer's wallet once, even if requested twice (R-10).

## Builder report

Builder, 10 Oct 2026 (Sonnet agent; the lead's brief for MONEY-18, with two MONEY-17 follow-ups carried in). wawu-backend `wmt/MONEY-18` at `49e68de` (started from `wmt/MONEY-17` `2ff458e`, then backend main `8e57981`, which holds MONEY-17 (#105), merged on the lead's note; the migration `20261020160000_wallet_holds` sorts after every folder on main); this repo `wmt/MONEY-18` at its tip (main `b04cbe6`, already in). Evidence and scripts: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/money18/` (`mut/` the mutation runner and its logs, `mutants.out`, `hub/` the built-Hub driver, `*.txt` the check logs). No Fintava, Nuvion, Flutterwave or wawuafrica.com host was called: Fintava is the repo's local double, Nuvion the seam stand-in.

**No screen was built or changed** (`artboards: []`, R-47: the app reads none of these routes yet), so there are no pictures to take.

#### What was built

- **A hold, written with the payment.** The held kinds (`paid_dm`, `event_ticket`, `bill`) were refused by `PayableRegistry` until now; they register like any other kind. Completing a payment of a held kind writes a `WalletHold` in the SAME transaction as the payment's `pending` to `completed`, so a payment is `completed` exactly when its price is held. The price is already in WAWU's own account (MONEY-17's transfer into the merchant wallet / operational account); the hold is the row that says whose it is until something happens. `PaymentView.hold` carries it, the quote says `willBeHeld: true`, and the selling feature's `onCompleted` is told the hold's id (`CompletedPayment.holdId`).
- **Release** (`WalletHoldService.release`): the payee's 85% moves from WAWU's account to the payee's wallet through `WALLET_PROVIDER` (`walletToWallet`), our reference `wawu-rel-<hold id>`; WAWU's 15% never moves; with no payee (a bill) nothing moves. The payment's `payeeSettledAt` is set, so WALLET-16 never lands the same share again. **Refund** (`refund`): the PRICE moves back to the payer under `wawu-ref-<hold id>`; the provider's charge on the original payment is not returned (R-10). The provider's charge on either move is WAWU's (R-31): the person receives the whole figure, and the hold (`providerFeeKobo`) and the merchant-side ledger row record the charge.
- **Once, one way.** The first request sets `action` in one conditional update; asking the same again is the same hold; the other request is a `HoldRequestError` (`other_action_chosen`). The move is handed to the provider by a lease only one caller wins (`sentAt`), under a reference the provider refuses to repeat. The migration adds CHECKs and a BEFORE UPDATE trigger (an action never changes once set, a settled hold never changes, a refund returns exactly the price, the split is the price), so the database holds the rules whatever the code does.
- **The provider's record is the truth.** A hold is `released`/`refunded` only when the provider CONFIRMED the move: its answer, or its record of our reference when the answer was lost (a Nuvion transfer accepted as `pending` is asked about until it says). An unknown outcome (timeout, 5xx, accepted and not finished, repeated reference) is asked about at 1, 2, 4 ... 60 minutes, never sent again, never read as "nothing moved", and goes to review past `PAYMENT_REVIEW_AFTER_HOURS` (72). Only the provider's own record that the move FAILED starts a new try, under a new reference (`-2`). A reversal, or another amount than asked, goes to review.
- **Waiting is not failing.** No wallet yet (R-11: tried every minute, lands the minute one opens), a frozen wallet (G-10: hourly, paid on unfreeze), WAWU's own account short (an error in the log on every try), the provider out of reach, another provider's hold (a rollback sends nothing for it): the hold stays `held`, the money stays in WAWU's account, and the minute sweep tries again. Nothing is refunded because a release is stuck.
- **Routes:** `GET /money/holds?role=payer|payee&cursor=&limit=` and `GET /money/holds/{id}` are served (MONEY-04's declared contract unchanged: wallet gate, `no-store`, payer or payee only, a stranger `404 not_found`, cursor `h1.`). **Ledger:** both sides of each move under our reference, category `earning` (a release; the payee's row names the payer) or `refund`, linked to the item. **For MONEY-16:** `openTotals()`. **Account deletion:** `WalletHold` mapped (payer `ANONYMISED`, payee `COUNTERPARTY`).
- **Files (backend):** `src/money/holds/` (`wallet-hold.service.ts`, `hold-rules.ts`, `hold-view.service.ts`, `hold-cursor.ts`, `money-holds.controller.ts`, three specs), `src/money/payments/` (`wallet-payment.service.ts`, `payment-figures.ts`, `payment-config.ts`, `payable-registry.ts`, two follow-up specs, `payment-units.spec.ts`), `src/money/money.module.ts`, `money-payment.controller.ts`, `src/account-purge/account-data-map.ts`, the three served-route lists, `prisma/schema.prisma` + migration `20261020160000_wallet_holds`, `.env.example`, `docs/contract/CONVENTIONS.md` (section 18) and `WALLET.md`, `contract/openapi.json`. Mobile: this file, BACKEND_GAPS (G-445 to G-449; G-10 noted), SHARED-CHANGES (MONEY-18 #1 to #6), LOG, the contract and generated types, INDEX and PROGRESS.

#### Two MONEY-17 follow-ups (own section; lead rulings, Default (lead), owner may override)

- **D8-1 (the discrepancy note lost when two completions race).** Reproduced first with the round 8 verifier's held-path specs (`vmoney17r8/probes/zz-v8-probes.contract.spec.ts`, "V8 D1": lost note, and receipt variant, fee 3000 and 1500) on the unfixed tree: **4 failed** (`d81-before.txt`). The fix: after `complete()` returns a row that is `completed`, this path's note is joined onto it by the same conditional update the already-completed branch uses (`keepNote`). The same four after the fix: **4 passed** (`d81-after.txt`). They are permanent in `payment-follow-ups.contract.spec.ts` (they wait for the held path to end, not for a time); mutant P1 (the line removed) is killed by them.
- **N2 (a provider charge that is not believed).** New setting `PAYMENT_CHARGE_REVIEW_ABOVE_KOBO` (`PROVISIONAL(PAYMENT-CHARGE-REVIEW-ABOVE-KOBO, owner=YOU, why=...)` in `payment-config.ts`, `.env.example`; default 100000 kobo = ₦1,000, 0 to 100000000). A charge below 0, a total below the amount, or a charge above the QUOTED one by MORE than the cap is `untrusted` in `completedFigures`, and `completeFromRecord` (the one function every path completes a payment through) sends the payment to review: `chargeReviewSince` and `reviewSince` set, out of the sweep, both figures on `discrepancy` ("charge not trusted: Fintava reported 202826 kobo (fee 102826), quoted 102325 kobo (fee 2325); held for review"), nothing delivered, the item still claimed, the buyer told it is still being confirmed, the buyer's ledger row marked with the same words, and none of the provider's figures written to the payment or the ledger. It is sticky: no later path completes or corrects it, only a person clears it (G-448: no tool yet). A payment already completed and delivered at the quote is only marked. A charge exactly at the cap is believed (completed, flagged `debitReviewSince`, as before). Specs on every path. **Fintava** (`payment-follow-ups.contract.spec.ts`): the answer to the send, the signed report after a lost answer, the payment sweep, a direct settle and the ledger status check after the review (none completes it), a negative fee, the boundary at the cap and one kobo over, the late report on a payment already completed, and the honest boundary that Fintava's lookups carry no charge (the quote stands, nothing is untrusted). **Nuvion** (`payment-follow-ups-nuvion.contract.spec.ts`; Nuvion's record carries the charge on every path): the answer at once, the sweep's read of a transfer that finished later, the ledger status check first, two negative charges (the ledger's own refusal of a negative fee does not crash the status sweep), the boundary, and a charge below the quote but not below 0 (believed, not flagged).

#### Capability checks

- [x] **A held payment is not spendable by the payer and not yet paid to the payee.** Passed: `wallet-hold.contract.spec.ts` "check 1" (Fintava double over HTTP) and `wallet-hold-nuvion.contract.spec.ts` "a held payment sits in the operational account" (Nuvion stand-in). A ₦1,000 paid DM debits the buyer ₦1,023.25 once, the payment completes into a `held` hold (₦1,000, `dm_answered`, split 85000 / 15000), the price sits in WAWU's account, the creator's wallet is unchanged and no move toward the creator exists. The buyer's wallet is already short of the price: a purchase the rest cannot cover is `402 insufficient_funds` with the real shortfall. `GET /money/holds` shows it to the payer and to the payee, `PaymentView.hold` and the quote's `willBeHeld` say so, and the feature is handed the hold's id.
- [x] **A refund returns the price (not the provider's charge) to the payer's wallet once, even if requested twice (R-10).** Passed: Fintava "check 2" and Nuvion "a refund returns the price ...". The buyer is back ₦1,000.00 (₦23.25, the original charge, is the only cost), one move `wawu-ref-<id>`; the same on a second ask, from the sweep, and after settling (eight callers at the lease at once are in the release spec, and a release against a refund at the same moment: one wins, one move). WAWU's account paid the amount and the provider's charge on the refund (R-31). On Nuvion the refund is asked twice while Nuvion still has it `pending`: one transfer, settled when Nuvion says `successful`.

#### Decisions (Default (agent), owner may override)

1. A hold is created when the payment COMPLETES, in the same transaction, not at the claim. A payment sent to review (another amount, an untrusted charge) has no hold until a person completes it.
2. Release and refund are service calls by the owning feature (`WalletHoldService`), never client routes; the hold id is the movement's Idempotency-Key. They are not held to WAWU's per-person limits (`assertMayMove`) or the `fees_not_set` stop: they pay out or return money already held, and stopping them would strand a user's money. The provider's own refusals (its limits, a frozen wallet) wait and retry. A move above `MERCHANT_MAX_PER_TXN_KOBO` is refused to review, never split.
3. A release moves exactly the payee's rounded-down 85% (`payeeShareKobo`); a bill (no payee) or a share under a kobo ends with no move; the 15% never moves. A release or refund the provider charges for is paid by WAWU (R-31): the person gets the whole figure.
4. The destination is the person's current wallet of the running provider. No wallet: waits every minute with no review bound (R-11). Frozen: hourly, no bound (G-10). The payer's account deleted: review (nowhere to refund to).
5. The provider's record that a move FAILED starts a new try under a new reference (`-2`, `-3`); that it was completed and then REVERSED, or that another amount moved, is review, never retried. A refusal that moved nothing is retried under the same reference.
6. Ledger: the buyer's payment rows stay `purchase` (MONEY-17); the payee's row is `earning` with the payer as the other side, a refund's is `refund` with WAWU; no account number of the other side. The merchant-side charge is the provider's (its answer, else its record), else the schedule's; a later signed delivery that disagrees is a stop MONEY-16 reports.
7. The holds routes keep the wallet gate MONEY-04 declared, so a payee with no wallet cannot read the holds they are owed (G-449).
8. A second payment for one item (MONEY-17 D1.4) is not refunded: an ordinary payment has no hold, which of the two is the extra is a person's call, and its payee share may have landed (G-446).
9. N2: the cap is the lead's PROVISIONAL default (₦1,000), the review is sticky, and "a person releases it" is an operator step because no tool exists (G-448). The hold's own provider charge is recorded as the provider says; a negative one is not recorded as a figure and is noted.
10. One assertion of MONEY-17's `payment-units.spec.ts` was replaced, not weakened (SHARED-CHANGES MONEY-18 #4): it pinned "held kinds are refused until MONEY-18".

#### Checks run

- Typecheck `npx tsc --noEmit` 0; eslint (no `--fix`) on the 20 `.ts` files the branch changes from main: 0 problems.
- New specs, each on a freshly migrated database with the stand-in WAWU ID: `wallet-hold.contract.spec.ts` (Fintava double over HTTP) **23/23**, `wallet-hold-nuvion.contract.spec.ts` (Nuvion stand-in) **11/11**, `payment-follow-ups.contract.spec.ts` **11/11**, `payment-follow-ups-nuvion.contract.spec.ts` **8/8**. MONEY-17's own `wallet-payment.contract.spec.ts` **72/72** and `wallet-payment-nuvion.contract.spec.ts` **56/56** pass unchanged in meaning.
- Specs of every module touched (`src/money/**`, `src/account-purge`, `src/wallet-provider`, the Nuvion specs that mount `MoneyModule`): `src/money/payments, ledger, history, holds, balance, fees` **20 suites, 439 tests, 0 failed**; `src/money/tests, gate, limits`, `src/account-purge`, `src/wallet-provider` **11 suites, 146 tests, 0 failed** (after the two served-route lists were updated: SHARED-CHANGES MONEY-18 #3); opening, identity, pin, receipts, recipients, saved-accounts, statements, four Nuvion specs, `src/admin/identity-holds` **28 suites, 1,270 tests, 6 failed in 2 suites**, none of them this task's: `selfie-match.contract.spec.ts` passed 182/182 on a fresh migrated database (the polluted spec database timed out its table scan at 5 s), and `receipt-units.spec.ts` has the same 4 Unicode-digit failures on backend main `8e57981` on this machine (Node 22.22.0's Unicode tables), one more timing test (300 ms drawing bound) passed alone.
- **Protected route suite** `scripts/protected-routes/run.sh --fresh HEAD` (`49e68de`), lock `origin/main` `8e57981`, in a private network namespace (`unshare -n`, the stand-in WAWU ID on :4001, Postgres through a unix-socket bridge): **253/253, all 244 required, exit 0** (`protected.txt`).
- Gates `python3 scripts/gates/run.py`: main `8e57981` 1,096 files, 16 fail / 91 warn / 76 accepted; branch 1,105 files, **16 fail** / 92 warn / 76 accepted. The 16 FAIL lines are identical (`diff` empty); the one extra warning is `PROVISIONAL(PAYMENT-CHARGE-REVIEW-ABOVE-KOBO)`, the setting N2 asked for with a `why=`. `check_baseline.py`: 108 entries, every accepted violation has an owner and a reason.
- `npm run contract:build` twice: `contract/openapi.json` byte for byte the same; against main only the two holds operations differ (served now: no `x-wawu-served: false`, no path, schema or field added or removed). Synced to this repo (SHARED-CHANGES MONEY-18 #6): `npm run api -- --backend` copies backend `origin/main`, so the branch's file was copied in and `sync_contract.py` regenerated the types; `SOURCE_COMMIT` names the backend branch; `tsc` 0.
- **Mutants of mine** (`mut/mutants.py`, each applied to the source, the spec files that name it run, the file restored byte for byte from a backup and checked with `git status`: 26 runs): **22 killed**: release moves the whole price, refund adds the original charge, no lease at all, an unknown outcome read as a clean refusal, the claim ignoring an action already chosen (killed once the claim race spec was added), a new try keeping the old reference, a missing wallet sent to review, the payee share not marked paid, the ledger not written, a hold of another provider driven, a back-off ignored, a reversal retried, another amount completing, the self-destination guard off, the hold not created with the payment; D8-1's line removed, the sticky review removed, the cap compared with `>=`, the review leaving the payment in the sweep, an untrusted charge completing, the ledger row not marked, the cap setting ignored. **3 survive and are redundant or equivalent**: the lease without only its `sentAt` condition (the due-time condition alone still refuses the second caller; with both removed the mutant is killed), the sweep without its provider filter (`drive` refuses another provider's hold itself; with that removed it is killed), and N2 without `feeKobo < 0n` (a negative fee always makes the total fall under the amount, which is checked too). Two survivors of the first pass (the lease, the claim) led to two deterministic race specs (callers held at the lease by a barrier; a release and a refund held between reading the hold and claiming it).
- **Mobile** `npm run check` **EXIT 0** after main `9426060` (MONEY-17's mobile side and FIX-30 rounds 2 and 3) was merged in (the generated contract, types and PROGRESS regenerated, never hand-fixed): typecheck, lint 0 errors, 120 suites / 2,064 tests, gates 473 files 0 fail, 273 tasks (`mobile-check.log`). This branch changes no app code, only Markdown, the contract and its generated types. Before the merge, on `b04cbe6`, the first full run failed one test, `eventsScreens.test.tsx` "draws the gap before the featured card name" (a known flake under load, load average 14 to 18); alone it passed 46/46, the second full run was green with 2,039 tests (`mobile-check-1.log`, `mobile-check-2.log`).
- **Built Hub** (`hub/smoke.js`): `dist` of `49e68de` on :6061 with the stand-in WAWU ID on :6062 (its `/auth/register` and `/auth/login`), a migrated database, no provider keys: the real `AppModule` boots with the new providers; no wallet is `409 wallet_not_open`; a wallet and no hold is `{ items: [], nextCursor: null }` with `Cache-Control: no-store`; a hold (inserted as a feature's payment leaves it) is listed to its payer and to its payee and to nobody else, a stranger gets `404 not_found`, a bad cursor `400`; a release the feature asked for was picked up by the minute cron 44 seconds later and, the provider being unconfigured, left `held` with `waiting: provider` and nothing paid (`hub.log` has no stack trace).

#### Filed

- BACKEND_GAPS: G-445 (the selling features call release and refund), G-446 (WALLET-16 skips held payments; the duplicate-payment refund), G-447 (what MONEY-16 should check, `openTotals()`), G-448 (nothing clears a review), G-449 (a payee without a wallet cannot read their holds); G-10 notes the frozen-wallet behaviour.
- SHARED-CHANGES: MONEY-18 #1 (schema and migration), #2 (the contract), #3 (three spec lists), #4 (one assertion replaced), #5 (additive interface, module, purge map, env, docs), #6 (mobile contract and types).

#### NOT RUN (each with what unblocks it)

1. **A real release and refund at the Fintava sandbox** (R-20): no key on this machine and the common rules forbid the host. Unblocked by OPS-10 or a lead brief that allows the sandbox host with the key. It settles what the double assumes: that the merchant wallet can send `/transaction/wallet-to-wallet` under our reference (`naira-api.md` says it can), the charge it takes on that send (question 18, G-71), and how a move out of the merchant wallet shows in `/txn/merchant` (the reconcile fallback).
2. **A book transfer out of Nuvion's operational account** (G-440): NUV-05's `book.ts` answers `not_supported` on main and the key does not work yet. Unblocked by NUV-05 on main and a key the lead allows to be used. Until then Nuvion is the documented stand-in.
3. **A held kind through a real selling feature** (G-445): INBOX-17, EVENTS-07 and BILLS-04 are not on main, so the specs register stand-in handlers and the built Hub holds a hand-made row. Unblocked by each task registering its kind and calling `release`/`refund`.
4. **The real WAWU ID sign-in** for the built-Hub check: the stand-in's `/auth/login` was used (no wawu-id worktree or database was set up). Unblocked by the verifier's own run with wawu-id.
5. **A kill of the Hub between the lease and the provider's answer, and a second Hub process on the same database**: the lease and the reconcile are database-level and are held by the race specs inside one process; neither crash nor a second process was run.
6. **The whole backend suite as `deploy.yml` runs it**: I ran every suite of the areas above, not the other ~140 files (the lead's merge run does).
7. **Biometric approval on the payment route over HTTP (G-43) and V10**: unchanged, and no screen calls these routes.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
