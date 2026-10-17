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

