---
id: TIER-06
title: The new money figures as admin settings
owner: YOU
area: VERIFY
order: 262
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [TIER-03, NUV-07, POINTS-04]
decisions: [R-65, R-43, R-23]
passes: [V1, V2, V3, V4, V6, V9]
artboards: []
---
# TIER-06 · The new money figures as admin settings

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder). Status: verifying.
- **Branches:** backend `wmt/TIER-06` `317f464` (code `c827262` plus a README note) on `origin/main` `a5e48fc`; mobile `wmt/TIER-06` on `origin/wmt/MERGE-5` `7de785d` (docs only: this file, history, SHARED-CHANGES rows, LOG, PROGRESS). wawu-id and web untouched.
- **Checks:** backend CI on `317f464`: Branch checks run 38987466960 green (contract, suite shards 1 to 3, netns, deploy-test-in-sync); Protected routes (V3) run 38987466864 green; Gates run 38987466793 red with the same 5 FAIL lines as main (admin-notifications x2, notification-event, flutterwave-wallet.gateway, content-piece.service). On the first push `c827262` (run 38986682069) shard 3 failed once on `pin-request-key.contract.spec.ts:202`, a random 4-digit PIN found inside a random hex digest (not touched by this task; passes on the next run and alone). Mobile full check (typecheck, lint, tests 184 suites and 3243 tests, gates, tasks) EXIT 0 on this branch.
- **Migration:** `20261024060000_plan_settings` (one table `PlanSetting`, two audit enum values). Additive; rollback `DROP TABLE "PlanSetting"`.
- **Built:** `GET` and `PATCH /api/hub/admin/plan-settings` (superadmin and finance change, support reads, reviewer refused, users 401). A null value puts a setting back to its default. One audit row per setting that changed (`AdminOpsAudit`, resource `plan_setting`, old and new value, who). 0, negative, decimals and wrong kinds are refused (400, naming the key); one bad value refuses the whole request.
- **How it follows a change:** `PLANS_CONFIG` is now the live plan (`src/plan-settings/`): `plans.config.json` plus `plan-settings.defaults.json` as the defaults, the saved rows laid over them, kept in memory. The saving process reloads at once; other processes within 15 seconds. `GET /plans`, `GET /plans/purchases/quote`, `GET /points/convert/quote`, the tier grant and the waitlist all read it with no reader changed. Other tasks read a setting with `PlanSettingsService.number(key)` / `.text(key)` / `.value(key)` (REF-02, POINTS-03, WALLET-37, EXPLORE-06, INBOX-22, HOME-16, WALLET-16).
- **G-804:** pass views (`GET /me/tier`, `GET /plans`) carry optional `benefits` and `eventDate`; left out until set (W44 then reads "Date to be announced").
- **Launch values in force:** tiers ₦1,000 / ₦3,000 / ₦5,000; add 5 products ₦1,500; 1,000 points = ₦500; every lot lasts 12 months; 5,000 points a day; referral ×1 to ×3, +500 at 5 verified, 7-day hold; name checks 30 an hour; popular communities 10 members; community credits 1 / 3 / 3; daily move floor ₦200; refused review 72 hours.
- **Changed from the file:** daily cap 10,000 to 5,000, and bonus lots (Verify 90 days, Verify Plus 180) now last 12 months like bought lots (R-65 "every lot"). 12 months = 365 days (lots are day-based).
- **Not built (not in this task):** the dashboard screens for these settings (follow-up row in the dashboard repo: list, edit, reset, show the provisional note and the audit); the `extra_products` and pack purchase routes (TIER-04, POINTS-02 read `plan.extra_products.*` and `plan.pack.*` from here).
- **Still only in the file (not admin settings):** dollar prices and USD pack points (wait for dollar accounts, R-16), `max_chars_per_job`, `max_audio_min_per_job`, `event_offers`, `preselected_tier`, `referral.one_level_only`, `referrer_must_be_verified`. The file goes 2 weeks after launch in a removal task.
- **Open findings:** none (not yet verified).
- **Next:** a verifier checks it; the lead merges backend and this branch together, and renames the migration stamp if it clashes.
- **For the lead (decision):** the board's three W44 lines ("Entry to the event and the maker area", "A table to show your work", "Priority when places are given out") are NOT loaded by default. `src/plans/tests/plans.contract.spec.ts:570` (TIER-01) pins `eventPass` to `{ id, name }` and I may not edit it. To load them: add the lines to `plan-settings.defaults.json` and widen that one expectation, or set them once in admin after launch (one PATCH).
- **History:** tasks/history/TIER-06.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-65, R-43, R-23 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The owner's launch figures live in admin settings that can change at any time without a deploy (R-65), instead of `plans.config.json` read at boot (G-744). The Fees row pattern (R-23, NUV-07) is the model: a settings row, an admin route with an audit entry, a cache that follows a change.

## Scope

- A settings store for the figures below (additive migration) with `GET` and `PATCH /admin/plan-settings` (admin role, audit row per change) and the screens in the dashboard repo as a follow-up row. `GET /plans`, `/plans/purchases/quote`, `/points/convert/quote` and the points service read from it. The file stays as the seed for 2 weeks, then a removal task takes it out.
- Launch values (owner, 16 Oct 2026): tiers ₦1,000 Verify, ₦3,000 Verify Plus, ₦5,000 Founding Maker (dollar prices stay unset until dollar accounts exist, R-16); add 5 products ₦1,500 (used by VF13, TIER-04, and it answers TIER-02's D9 and the 5-place pack price); 1,000 points = ₦500 (PT6 and the convert quote); points last 12 months (every lot expiry: bonus, bought); 5,000 points a day cap (PT7, POINTS-03 caps); referral multipliers ×1 to ×3 with +500 points at 5 verified and a 7-day hold (RF1, RF3, RF4, REF-02). 85/15 is not a setting; it stays the one split (R-5).
- Figures the owner did not name but the boards draw (pack sizes and prices on PT4, the "Add 1,000 points for ₦800" offer, tier lengths 30 days, 6 months and 12 months, 3, 6 and 10 products, bonus points per tier, AI action costs on PT1) load as PROVISIONAL settings with the board's value. List each in the Builder report for the owner. Never a literal in code.
- W44 also needs the event pass benefit lines and the event date: add nullable `benefits` and `eventDate` to the pass view (G-804). The date stays "Date to be announced" until the owner sets it.
- Every figure shown in the app is read from these routes; the report lists, per figure, the screens that print it.

## Settings and where each is used

Keys are proposals; the builder may rename them and records why. 85/15 is not a setting (R-5).

- `plan.tier.verify`, `.verify_plus`, `.founding_maker` price (₦1,000, ₦3,000, ₦5,000): VF5, VF5b (the difference), VF6, VF14, E21 ("From" the lowest), `GET /plans/purchases/quote`.
- `plan.extra_products` price (₦1,500) and count (5): VF13, `POST /plans/purchases` kind `extra_products` (TIER-04).
- `points.cash_rate` (1,000 points = ₦500): PT6, PT6a, the W1 "To cash" button, `GET /points/convert/quote` (POINTS-04).
- `points.expiry_months` (12): the end date of every lot (tier bonus TIER-03, packs POINTS-02, referral REF-02); PT5 lots; the VF1 and VF7 copy.
- `points.daily_cap` (5,000): PT7 and `points_cap_reached` (POINTS-03).
- `referral.multipliers` (×1 to ×3), `referral.milestones` (+500 at 5 verified, the others RF1 draws), `referral.hold_days` (7), `referral.claim_days`: RF1, RF3, RF3a, RF4 and REF-02.
- Same store, from other 16 Oct rulings: `name_check_per_hour` 30 (R-51, WALLET-37), `popular_community_min_members` 10 (R-57, EXPLORE-06), `community_credit_cost_photo`, `_video`, `_voice` 1, 3, 3 (R-62, INBOX-22; I24 to I28, I38), `tgif_notification_time` (HOME-16), `earnings.daily_move_floor` ₦200 and `earnings.refused_review_hours` 72 (R-55, WALLET-16).

## Capability checks

- [ ] Changing the add-5-products price in admin changes the next quote without a restart and writes an audit row.
- [ ] A non-admin cannot read or change the settings.
- [ ] The convert quote, a pack quote and a tier quote all read the stored values; a stored value of 0 or negative is refused.
- [ ] The report names, for each launch figure, the screens that print it.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/TIER-06.md](history/TIER-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
