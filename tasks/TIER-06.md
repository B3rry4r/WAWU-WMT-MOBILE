---
id: TIER-06
title: The new money figures as admin settings
owner: YOU
area: VERIFY
order: 262
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [TIER-03, NUV-07, POINTS-04]
decisions: [R-65, R-43, R-23]
passes: [V1, V2, V3, V4, V6, V9]
artboards: []
---
# TIER-06 · The new money figures as admin settings

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 1 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below. Nothing blocks it; ready to schedule.
- **History:** none yet. Reports go to tasks/history/TIER-06.md.

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
