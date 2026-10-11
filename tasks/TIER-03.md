---
id: TIER-03
title: Buy, renew or upgrade a tier from the wallet
owner: YOU
area: VERIFY
order: 209
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [TIER-01, POINTS-01, MONEY-17, MONEY-19]
decisions: [R-43, R-44, R-6, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# TIER-03 · Buy, renew or upgrade a tier from the wallet

## Lead note (8 Oct 2026): from TIER-01's verification

- **Fixing the billing currency (N3).** `BillingCurrencyService.fixAtFirstPurchase` inserts with `ON CONFLICT DO
  NOTHING` and reads the row back. At READ COMMITTED (what every transaction in `src/` uses) concurrent first
  purchases all get the winner's currency. At REPEATABLE READ or SERIALIZABLE the losers get Prisma `P2034` instead:
  keep the purchase transaction at READ COMMITTED, or retry the whole purchase on `P2034`. It now takes the token's
  `phone` and `country` (`{ wawuUserId, phone, country, purchaseRef }`).
- **Two states nothing may write (N7).** Never write a `PersonBilling` row with `fixedBy = 'first_purchase'` and no
  `purchaseRef`, and never write a `MakerTier` row whose `activeFrom` is in the future (a renewal moves
  `activeUntil`; an upgrade starts today).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (backend checks: `tsc`, eslint, the task's specs, the full suite, the protected suite 253/253, gates with the same 16 fail lines as main, `npm run contract:build`, then `npm run api -- --backend <worktree>` here).
- DECISIONS.md R-43 (the plan, and what it leaves open), R-44, R-5, R-10 and R-21
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/MONEY-17.md`, `tasks/MONEY-19.md` (the pay-from-wallet path every purchase uses)

## Goal

A person picks a tier (Founding Maker pre-selected, VF5) and pays from their wallet (VF6). Success sets the tier
and its dates, grants the bonus points as one lot with its expiry, issues the event pass and includes the first
Voice Intro, exactly once even when the payment's confirmation repeats (R-43, brief section 3).

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- ME-18 (todo, pay for a tick from the wallet): obsolete; tiers replace the verification tick (round 2 brief: M11 to M14 are replaced by VF5 to VF7).

## Scope

- New `POST /plans/purchases` (Idempotency-Key, the transaction PIN as MONEY-17 takes it): `kind` `tier`, `renew` or `upgrade`, `tierId`, optional `bump`, `method: wallet`; `GET /plans/purchases/:id`. The price comes from `plans.config.json` in the person's billing currency; the first purchase fixes that currency (TIER-01).
- Pays through MONEY-17's pay-from-wallet with new purposes `tier` and `tier_bump`, into WAWU's operational account; it is WAWU's own sale, so there is no seller split. MONEY-19's shortfall and still-confirming answers pass through.
- New `MakerPurchase` table (person, kind, item, currency, amount, status, payment reference unique, method).
- Grants, once per payment reference, in the same transaction that marks the purchase paid: the tier and its dates, the bonus points lot (POINTS-01 `grant`, expiry from config), the event pass, the first Voice Intro, and the bump's points lot (VF6 "Add 1,000 points for ₦800", from config).
- Rules, Default (agent), owner may override: renewing the same tier extends from its current end date; an upgrade pays the difference between the two config prices, starts the new tier's period on the day of the upgrade, keeps unused points and grants the difference in bonus points; no downgrade while a tier is active.
- Paying needs an open wallet (question 1 in `docs/PAYMENTS-PLAN.md`): a person with none gets the existing `no_wallet` answer (MONEY-13).
- Not in scope: paying by transfer (TIER-05), extra products (TIER-04), the Voice Intro itself.

## Lead note (8 Oct 2026)

From POINTS-01's verification (`tasks/POINTS-01.md`, "Lead rulings after the verifier"):

- **Every caller of the points service:** call `PointsService.grant` or `hold` last in your own transaction, and never wait on a provider while you hold a person's points lock. The service's own transactions use Prisma's 5 s default timeout, so any other points call for that person would fail meanwhile (POINTS-01 verifier, X3; backend `docs/contract/CONVENTIONS.md` section 16).

## Capability checks

- [ ] A person with enough money buys Founding Maker: one debit at the config price; the tier and dates, the bonus lot with its expiry, the event pass and the Voice Intro all show in `GET /me/tier` and `GET /me/points`.
- [ ] The same request twice, two taps at once, or a confirmation delivered twice debits once and grants once (V8).
- [ ] An upgrade from Verify to Founding Maker debits only the difference and grants the difference in bonus points; unused points stay.
- [ ] A person short of money gets the exact shortfall and nothing is granted; a still-confirming payment grants only once it confirms; a failed payment grants nothing.
- [ ] The first purchase fixes the billing currency; a naira-billed person pays the naira price and a dollar-billed person the dollar price (from a dollar wallet, NUV-09).
- [ ] A person without a wallet gets `no_wallet`; a wrong PIN five times locks as MONEY-09 does.

## Builder report

Builder, 11 Oct 2026 (Sonnet agent). wawu-backend `wmt/TIER-03` `3b14aa7` (on backend main `f11d307`, which holds MONEY-19, #114); this repo `wmt/TIER-03` (hash in the hand-back; on main `cdb528c`). `depends_on`: TIER-01, POINTS-01 and MONEY-17 are `done`; MONEY-19 is merged on backend main (its mobile task file still reads `todo` on mobile main). Stand-ins only: no Fintava, Nuvion, Flutterwave or wawuafrica.com host was called, and no screen was built or changed (`artboards: []`, R-47: the app calls none of these routes yet). Evidence is in the lead's scratchpad `tier03/` (`logs/`).

**Built (backend).**
- `src/plans/purchases/`: `POST /plans/purchases`, `GET /plans/purchases/quote` (the pay sheet; added because the app otherwise has to build the payment target itself) and `GET /plans/purchases/{id}`. The purchase pays through MONEY-17's pay from wallet as two new kinds, `tier` and `tier_bump` (the plan alone, or the plan with the checkout bump in ONE debit), into WAWU's own account with no seller split, not held (R-19 is for money owed to someone else). The provider's charge is on top (R-10). Registered with `PayableRegistry`; `resolve` prices from `plans.config.json` in the person's billing currency; `onCompleted` grants.
- The payment's `targetId` carries the terms and is frozen when the payment is claimed: `tier-<id>`, `renew-<id>`, `upgrade-<from>-<id>`. The same quote works at `GET /money/payments/quote`.
- Rules (Default (agent)): a first purchase only with no tier or an ended one; a renewal only of the tier held, any state, extending from its current end (from now if ended); an upgrade only from a running tier to one that costs more, paying the DIFFERENCE of the two config prices, starting today for the new tier's days, keeping unused points, granting the difference in bonus points as one lot with the new tier's expiry; no downgrade; the bump on any of them.
- Granted once per payment, in `onCompleted`, in one READ COMMITTED transaction: the tier lock, then the `MakerPurchase` row (key: the payment's id), then `fixAtFirstPurchase` (purchaseRef: the payment), then `TierGrantService.grant` or the new `upgrade` (the tier and its dates with `activeFrom` now, the event pass, the first Voice Intro, the bonus lot), then the bump's `bump` lot, last. A repeat, a second server, or the request and the sweep together find the row and write nothing.
- `MakerPurchase` + migration `20261021140000_maker_purchase`; purge map OWNED; data-export section; `PaymentKind` gains `tier` and `tier_bump` (history labels "Tier" and "Tier and points"); `WalletPaymentService.presentRoute` and `IdempotencyScope.answered` so the answer stored under the Idempotency-Key is the purchase and not the bare payment; `MoneyModule` exports `WalletPaymentService`; `docs/contract/PLANS.md` section 7, `WALLET.md`, `CONVENTIONS.md` section 4. The module is `PlanPurchasesModule`, beside `PlansModule` (importing the wallet into PlansModule would make every spec that only needs the prices boot the provider's settings); the mount is SHARED-CHANGES TIER-03 #1.

**Capability checks**
1. *One debit at the config price; the tier, dates, bonus lot with its expiry, event pass and Voice Intro show in `GET /me/tier` and `GET /me/points`: passed.* Spec `check 1` (Founding Maker, the dashboard rate: debit = config price, charge ₦15.75 on top, wallet fell by exactly both, payee null, WAWU share = price; `activeFrom` now, `activeUntil` = from + the tier's days, lot expiry = from + the bonus days). Built Hubs (two processes, `logs/live1.final.txt`): the same on the config's Founding Maker (₦5,000: one send of 500000 kobo + 1575 charge, wallet 50000000 -> 49498425, `/me/tier` `active`, `/me/points` one `tier_bonus` lot of 600, billing `NGN/first_purchase` with the payment's reference).
2. *Twice, at once, a confirmation twice: passed (V8).* Specs: the same key again is replayed (`Idempotent-Replayed: true`, identical body, wrong PIN costs no try); four taps with one key; three taps with three keys (one `201`, the rest `payment_in_progress` or `target_not_payable`); the handler run twice, then five at once, then with the pass row deleted (the purchase row is the gate). Built Hubs A (6203) and B (6204) on one database: six taps at once alternating Hubs with one key gave `201` + five `idempotency_in_progress`; six keys gave one `201` + five `payment_in_progress`; one send, one purchase row, two lots; and the sweep running on both Hubs afterwards changed nothing (`logs/live2.txt`).
3. *An upgrade debits only the difference and grants the difference in bonus points, unused points stay: passed.* Spec `check 3` and live: Verify then Founding: sends 100000 and 400000, the first lot (100) untouched, a second lot of 500 (= 600 - 100) expiring at the new tier's end, `activeFrom` now.
4. *Short: the exact shortfall, nothing granted; still confirming: granted only once it confirms; failed: nothing: passed.* `402 insufficient_funds` with `balanceKobo`, `totalKobo`, `shortfallKobo` (no payment, no key kept; the same key pays once after the top-up). Pending (the provider's answer lost, and on Nuvion its documented first answer): `201` `pending` with "We're still confirming this payment. Don't pay again; we'll let you know.", no tier, no points, no row, no currency fixed; a second tap or another plan is `409 payment_in_progress` with the payment's id; the poll stays `pending` while the record lags; once it shows, the sweep grants once (live: first sweep found nothing, `checks=1`, still pending; after the record showed, `paid` with both lots, one row, one transfer, still one of everything a minute later on both Hubs). Failed: the provider's FAILURE record makes it `failed` with the reason, nothing granted, and a new intent pays and grants. On Nuvion stood in: successful, pending, failed and reversed.
5. *The first purchase fixes the billing currency; a naira person pays naira: passed. A dollar person from a dollar wallet: NOT RUN (below).* The row is `NGN`, `first_purchase`, purchaseRef = the payment's id; a second purchase leaves it. A person fixed in USD is refused `target_not_payable` ("This isn't priced in naira...") on the quote and the purchase, nothing moves (live and spec); a payment confirmed after the currency was fixed another way is not granted and writes nothing.
6. *No wallet: `wallet_not_open`; five wrong PINs lock: passed.* `409 wallet_not_open` on the quote and the purchase whatever was sent, no key kept. Four wrong tries `403 pin_incorrect` with `triesLeft` 4 to 1, the fifth `423 pin_locked`, the right PIN locked too, nothing taken or granted (live and spec).

**Money safety.** The balance is read from the provider (MONEY-17); nothing here sums our records. Prices are the config's whole minor units; no figure is written in code (`plans-figures.spec.ts` passes unchanged). The grants and the purchase row are one transaction, so a failure leaves nothing half done; the points are granted last. `fixAtFirstPurchase` runs at READ COMMITTED (lead note N3) and always with the payment as its `purchaseRef` (N7); `activeFrom` is always now (N7). A purchase that no longer fits when it is confirmed (the person's tier changed while the payment confirmed, say an event code claimed in the app) is NOT granted: the delivery throws, the sweep retries with its backoff and sends it to review after `PAYMENT_REVIEW_AFTER_HOURS` with the money in WAWU's account (G-680).

**Decisions** (each Default (agent), owner may override)
- A purchase is identified by its payment: `GET /plans/purchases/{id}` takes the payment's id, and `MakerPurchase` holds only PAID purchases (key `paymentRef`, status `paid`); a pending, failed or reversed purchase is read from the payment. TIER-05 (a purchase waiting for a transfer) adds its own states.
- Two payment kinds, `tier` and `tier_bump`; the bump is bought only with a plan, in one debit.
- The terms are the payment's `targetId`; `upgrade-<from>-<to>` names the tier moved from, so a changed tier between the quote and the purchase is `quote_changed`.
- One plan payment at a time per person (checked inside the payment's claim); a plan payment that is paid and not opened blocks another until a person settles it.
- A renewal adds the tier's bonus points again (the one grant rule JOIN-03 already set); an upgrade forfeits the old period's remaining days; the bump's points last `points.bought_expiry_days` (`PLAN-BOUGHT-POINTS-DAYS`).
- The currency is resolved and fixed without the token's phone and country: a payer has an open naira wallet, which the rule reads first (NGN); a payer fixed in USD is refused until NUV-09.
- `GET /plans/purchases/quote` added (the thin pay sheet).
- The Founding Maker badge number (G-421) is NOT built: the task's scope does not list it; the row names TIER-03, so the lead may want it here (additive: nullable unique `badgeNumber` on `MakerTier`, allocated in `deliver`, served on `GET /me/tier`).

**Mutants** (each applied alone, the purchase specs run, the file put back from a saved copy, byte for byte): 21, all killed. M1 (the purchase-row gate skipped) and M18 (the tier lock not taken) SURVIVED the first suite; two specs were added (a repeat with the pass row deleted; twelve rounds of two purchases at once for a person whose currency is already fixed) and both are now killed. M2 currency never fixed (5 tests), M3 upgrade at full price (6), M4 upgrade grants the whole bonus (2), M5 no one-plan-at-a-time (2), M6 stored answer is the bare payment (2), M7 no bump points (5), M8 first purchase while a tier runs (2), M9 renew another tier (2), M10 downgrade (2), M11 failed read as pending (1), M12 anyone reads a purchase (1), M13 a purchase that no longer fits granted (4), M14 other currency granted (1), M15 bump inverted (18), M16 and M16b method unchecked (24 by removing the validator, 1 by naming `transfer`), M17 upgrade from another tier (1), M19 upgrade keeps the old end (1), M20 shortfall swallowed (4).

**Checks** (backend `3b14aa7`)
- `npx tsc --noEmit` 0. eslint (no `--fix`) on every changed `.ts` file 0. Prettier clean on them.
- This task's specs, `src/plans/purchases/tests` and `test/plans/tier-purchase-harness.ts`: 5 files, **73/73** at default timeouts on a fresh migrated and seeded database: `plan-purchase-terms` 23, `plan-purchase-rules` 14, `plan-purchase.contract` 22 (Fintava double, the real clients over a socket), `plan-purchase-delivery.contract` 10, `plan-purchase-nuvion.contract` 4 (Nuvion stood in). The existing wallet-gate and fees-not-set coverage specs, `money-contract` and `route-shadowing` pass with the new module mounted (their two exact route lists name the new routes; the rules they check are untouched and the routes pass them).
- Existing specs of the areas this touches (plans, points, money, purge map, data export) and the whole backend suite as `deploy.yml` runs it (one jest process, `--runInBand --forceExit`, a fresh migrated and seeded `bt03_full_test`, a private network namespace with the stand-in WAWU ID alone on :4001, `--testTimeout=120000` because the load average was 20 to 28 and the production-boot specs hit their 5 s hook limit at the default): **276 suites, 7,557 tests: 271 suites and 7,409 tests passed, 4 skipped, 144 failed in 5 suites, none in a file this task touches** (`logs/full.json`). `hub-rate-limits` (11): it needs a non-loopback interface, which a private namespace does not have; 22 of 22 on the host network. `receipt-units` (4): this container's Node 22.22 carries Unicode 16.0 and the receipts' digit table is checked against the runtime; `git diff f11d307 -- src/money/receipts` is empty, so main fails the same four. `shop.contract` (23) and `marketplace-save.contract` (6): both force `DATABASE_URL` to a name containing `wawu_hub_test` when it has none, and the namespace database was `bt03_full_test`; both pass (29 of 29) on a fresh migrated and seeded `bt03_wawu_hub_test`. `fintava-stall` (100 timing assertions at a load average of 20 to 28): 120 of 120 on its own. By area, files and tests: plans 11 and 175 (this task's five files are 73 of them), points 2 and 59, account purge 1 and 4, data export 3 and 24, all passed; money 57 and 1,363 with only those 4 failed.
- Protected suite `run.sh --fresh HEAD` (code `3b14aa7`, lock origin/main `f11d307`): **253 passed, 244 of 244 required**, lock unchanged.
- Gates: branch 1155 files, 16 fail / 95 warn / 76 accepted; main `f11d307` 1143 files, 16 / 95 / 76; the 16 FAIL lines and the 95 warnings are identical (`diff` empty); no new warning (the task adds no figure and no `PROVISIONAL`). `check_baseline.py` ok. CI tripwire on added lines: 0 em-dash in anything a user reads.
- `npm run contract:build` twice: byte-identical and equal to the committed file. Against main: +3 paths (`GET /plans/purchases/quote`, `POST /plans/purchases`, `GET /plans/purchases/{id}`), +4 schemas (`PlanPurchaseDto`, `PlanPurchaseQuoteView`, `PlanPurchaseView`, `PlanPurchaseGrantView`), `tier` and `tier_bump` added to the payment-kind enums of `PaymentDto`, `PaymentView`, `PaymentQuoteView`, `HoldView`, `TransactionLinkView` and the quote's `kind` parameter; nothing removed or retyped (a script comparing both files with keys and enums sorted found 0 removed, 18 changed all being those enum additions). The only other difference is the order of one property (`tier`) in the inline schema of an admin verification-review response, which the type checker reorders when new types exist: equal as a set, no meaning changed (the same kind of change as G-54). Mobile `contract/` copied from `wmt/TIER-03@3b14aa7` and `python3 scripts/api/sync_contract.py` run without `--backend`: `SOURCE_COMMIT` names the branch; the generated types gain the paths and schemas and nothing is removed.
- Mobile (`wmt/TIER-03`, on main `cdb528c`): `npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks` in one command, **EXIT 0** in its log: typecheck 0 (with the regenerated types), lint 0 errors (5 warnings, the same five as before the change), jest **150 suites, 2,646 tests passed**, gates 0 fail / 5 warn on 565 files (as before), 275 tasks and 279 artboards covered. No app code changed, only `contract/`, `src/api/schema.generated.ts` and docs. An earlier run of the same steps under a load average of 28 failed one test, `HomeScreen` H36 (a file and a screen this task does not touch; 34 of 34 alone); the run above is the clean one.
- **Built Hubs on the stand-ins** (the built `dist/`, two processes on :6203 and :6204 on one fresh migrated database; the stand-in WAWU ID's JWKS on :6201, tokens signed with its key; a Fintava stand-in on :6202 = the repo's own `FintavaDouble` with a book of wallets and an admin door): `logs/live1.final.txt` 25/25 and `logs/live2.txt` 11/11 (every capability check above; the cron sweeps ran on both Hubs).

**Gaps and shared changes.** BACKEND_GAPS G-680 (new: a paid purchase that cannot be granted has no admin action); G-421 left open (above). SHARED-CHANGES TIER-03 #1 (the mount, applied on the branch in its own commit `7970952`: drop that one commit if you would rather apply the row; the contract was regenerated with it), #2 (schema, migration, purge map and export), #3 (MONEY-17's `presentRoute`, `answered`, the `MoneyModule` export), #4 (the mobile contract sync).

**NOT RUN**
- A dollar-billed person paying the dollar price from a dollar wallet (check 5, second half): the payment service takes naira only (`PAYMENT_CURRENCY`), so such a person is refused until a dollar wallet exists. Unblocked when NUV-09 merges and `grep -n PAYMENT_CURRENCY src/money/payments/wallet-payment.service.ts` no longer pins every payment to `NGN`; the purchase then prices with `priceIn(..., currency)` already (the resolver and the `PersonBilling` check are in place).
- Against the real sandboxes (R-20, R-42): a tier bought with a real Fintava wallet-to-wallet or a real Nuvion book transfer. No provider key is on this machine. Unblocked by a sandbox key and a brief that allows the host (NUV-05's key check).
- `WALLET_PROVIDER=nuvion` on a built Hub: the Nuvion path ran in jest on `NuvionSeamStandIn`; the built Hubs ran under the default provider on a Fintava stand-in. Unblocked by NUV-10's settings and the Nuvion key.
- The tier gate (TIER-02) with this task: TIER-02 is on its own branch (`wmt/TIER-02`); a trial merge conflicts only in `contract/openapi.json`, which is regenerated.
- Screens (V5 to V7, V10): none in this task. VF5, VF6 and VF7 call these routes when cut.


## Verifier report

## Owner sign-off
