# TIER-06 · round history

Moved out of [tasks/TIER-06.md](../TIER-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/TIER-06` `c827262`. Files: `prisma/schema.prisma`, migration `20261024060000_plan_settings`; new `src/plan-settings/` (registry, types, defaults loader, service, live config, module, `plan-settings.defaults.json`) and `src/admin/plan-settings/` (controller, module, DTO); `src/plans/` (module wiring, pass view, config comment, `plans.config.json` launch values); `src/waitlist/waitlist-core.module.ts`; `src/app.module.ts`; `contract/openapi.json`. Mobile: this file, SHARED-CHANGES (TIER-06 #1 to #3), LOG, INDEX.

Keys (renamed from the proposals): tier ids follow the file (`verify`, `plus`, `founding`), so `plan.tier.<id>.price_kobo|days|products|bonus_points|pack_bonus_pct`; money keys end `_kobo`; `points.cash_rate_kobo_per_1000`, `points.cash_out_minimum_points`, `points.price_kobo_per_1000`, `points.expiry_months`, `points.daily_cap`, `points.action.<id>`, `plan.pack.<id>.points|price_kobo`, `plan.checkout_bump.*`, `plan.extra_products.count|price_kobo`, `plan.tier_ending_days`, `plan.event_date`, `plan.event_pass.<id>.benefits`, `referral.multipliers|milestones|hold_days|claim_days|base_points.<tier>`; the other rulings keep their proposed names (`name_check_per_hour`, `popular_community_min_members`, `community_credit_cost_photo|video|voice`, `tgif_notification_time`, `earnings.daily_move_floor_kobo`, `earnings.refused_review_hours`). 62 settings (44 carry a provisional note); `GET /admin/plan-settings` lists each with `usedBy`, `default`, `source` and its provisional note.

Capability checks (all green, real database, stack `tier_06`):
- Add-5 price change shows on the next `GET /plans` (add-on), tier quote and convert quote with no restart, and writes an audit row: `src/plan-settings/tests/plan-settings-readers.contract.spec.ts` (4 tests; the extra-products quote route itself is TIER-04's, so its price is checked on `GET /plans`).
- Non-admin: no token and a bad token 401, reviewer 403 on both routes, support reads (200) but PATCH is 403: `src/admin/plan-settings/tests/admin-plan-settings.contract.spec.ts` (24 tests).
- Zero, negative, decimal, text, huge, unknown key, whole-request refusal, nothing stored and no audit on a refusal: same spec, plus 25 registry and cache tests in `src/plan-settings/tests/plan-settings.spec.ts` (older load never replaces a newer, bad stored row ignored, failed load keeps the plan).
- Related existing specs rerun: `src/plans/tests` (13 files) and `waitlist-config.spec.ts`: 336 tests pass in total. `tsc --noEmit` 0, eslint 0 on changed files, `scripts/gates/run.py` 5 FAIL lines (the same 5 as main), `check_baseline.py` ok, `contract:build` additions only.

Per figure, the screens that print it (full list per key in the Hub's `usedBy`):
- Tier price (₦1,000 / 3,000 / 5,000): VF5, VF5b (difference), VF6, VF14, E21 ("From"), `GET /plans`, `GET /plans/purchases/quote`.
- Tier length, products, bonus points, pack bonus: VF5, VF6, VF12 to VF14, VF1, VF7, PT4 (Founding bonus), `GET /plans`.
- Add 5 products (₦1,500, 5): VF13, TIER-04 purchase, `GET /plans`.
- Cash rate (1,000 points = ₦500) and minimum: PT6, PT6a, W1 "To cash", `GET /points/convert/quote`.
- Lot expiry (12 months): PT4, PT5 lots, VF1, VF7; bonus lots (tier grant), bought lots (POINTS-02), referral lots (REF-02).
- Daily cap (5,000): PT7, `points_cap_reached` (POINTS-03), `GET /plans`.
- Packs, checkout offer, AI tool costs: PT4, VF6 offer, POINTS-02; PT1, PT2.
- Referral multipliers, milestones, hold, claim, base points: RF1, RF3, RF3a, RF4, REF-02.
- Pass lines and event date: W44 (WALLET-38) via `GET /me/tier`.
- Other rulings: WALLET-37 (name checks), EXPLORE-06 (popular), INBOX-22 (I24 to I28, I38 credits), HOME-16 (TGIF time), WALLET-16 (move floor, review hours).

PROVISIONAL, for the owner (board value; the owner named none of these): tier lengths 30 days / 6 months / 12 months, products 3 / 6 / 10, bonus points 100 / 300 / 600, pack bonus 0 / 0 / 10 percent; packs S 1,000 points ₦1,000, M 2,750 points ₦2,500, L 6,000 points ₦5,000; checkout offer 1,000 points ₦800; the 12 AI tool costs on PT1 (the brief's); referral base points 100 / 300 / 500 and milestones 5 to 500, 10 to 1,500, and 25 to 5,000 (RF1 does not draw the third; confirm or remove it); referral claim window 7 days (no source; matches the hold); tier ending 7 days; cash-out minimum 1,000 points; shortfall price per 1,000 points ₦1,000; TGIF 07:00 Lagos. Also the W44 lines (not loaded, see Current state) and the event date (unset).

Gaps: dashboard screens not built (follow-up row); dollar prices left as the file has them. A lag of up to 15 seconds exists only for a second Hub process. Local mobile check: see the log line in docs/LOG.md.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._


## Builder report, round 2

Backend `wmt/TIER-06` `361df74` on `317f464` (main still `a5e48fc`). Each verifier finding was written as a failing test first (`src/plan-settings/tests/plan-settings-round2.contract.spec.ts`, 19 tests, and `plan-settings-round2.spec.ts`, 2): the first run had 12 and 1 failing for the right reasons (a stale cash-out paid 201; a changed bump and tier paid 201 and granted the new goods; 3 milestones; no cross check; 5 distinct audit "from"s of 12; the second migration run refused), the same files are green after the fix.
- **1 HIGH, cash-out bound to its quote.** `GET /points/convert/quote` now carries a signed `quoteToken` and `expiresAt` (HMAC under the fee-quote key with its own context). `POST /points/convert` requires `quoteToken`; a changed rate, minimum, cap, cash or fee, a token for other points or another person, one made up, or one past its end is `409 quote_changed` with the new quote in `reason.pointsQuote`, before the PIN, nothing paid. No token is the plain 400. The figures that were checked are the figures paid (one read). The app does not call these routes yet (no `/points/convert` in `src/`; POINTS-05 is todo), so the token is required with no old body kept. The POINTS-04 helper `h.convert` in `test/points/cash-out-harness.ts` now fetches the quote and sends its token (same token for a repeated key), so the six POINTS-04 convert specs pass unedited; that helper is the only existing test file touched.
- **2 MEDIUM, goods bound to the quote.** A purchase's goods are the payment's `terms` (`PayableTarget.terms`): the quote token's subject includes their digest (a changed plan is `quote_changed` like a price), and the claim stores them in the new nullable `WalletPayment.terms` (migration `20261024060100_wallet_payment_terms`). The grant, the upgrade and the bump lot read the stored goods. A payment claimed before the column has none and is granted from the plan as it stands.
- **3 MEDIUM.** The 25-verified, 5,000-point step is out of the default list (`plans.config.json`); an admin can still add it.
- **4 (from finding 7) MEDIUM.** The cash rate may not exceed the price per point of ANY way points are sold: the three packs, the checkout offer and the shortfall rate, judged exactly (rate x points against price x 1,000) on the plan a request would leave, so either setting may be the one changed and one request may move both. A 400 names both settings. A request that touches none of them is never held up. The seed is checked at boot too.
- **5 LOW (finding 4).** A save takes one advisory lock and reads the saved rows inside it, so each audit row's `from` is the value really in force (12 parallel saves leave one unbroken chain; before, 5 distinct links).
- **6 LOW (finding 6).** `ADD VALUE IF NOT EXISTS` in `20261024060000_plan_settings`; schema comment names `plan-settings.defaults.json`.
- **7 LOW (finding 5).** A reload that fails after a save is logged as an error naming the saved keys; the 15 second tick retries.
- Checks: `tsc` 0, eslint 0 on the touched files; `src/plan-settings`, `src/admin/plan-settings`, `src/plans`, `src/points` and `src/money/payments` 41 suites and 776 tests pass, and `src/money/payments`, `src/money/limits` and `src/money/gate` 20 suites and 397 tests, `contract:build` twice identical, gates 5 FAIL as main, baseline ok. CI: Branch checks run 38991756551 green (contract, suite shards 1 to 3, netns, deploy-test-in-sync, baseline); Protected routes (V3) run 38991756560 green; Gates run 38991756561 red with the same 5 FAIL lines as main (admin-notifications x2, notification-event, flutterwave-wallet.gateway, content-piece.service), none in this task's files.
- For the lead: (a) the pack bonus percent (Founding +10 percent) is a display figure nothing applies yet, so the cash rule ignores it; when POINTS-02 applies it, the rule must use the bonus points. (b) Quotes given before the deploy are stale once (a payment quote's subject now carries the terms): one re-quote. (c) The rule covers every sale of points, wider than "the cheapest pack" in the ruling; narrowing it is one function (`pointsSales` in `plan-setting-rules.ts`).
