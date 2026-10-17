---
id: HOME-16
title: Daily TGIF notification
owner: YOU
area: HOME
order: 260
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SETTINGS-01, HOME-11, INBOX-03]
decisions: [R-59]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-16 · Daily TGIF notification

## Current state

As of 17 Oct 2026. Built; a fresh session verifies, the builder does not.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/HOME-16.md`): verdict merge, nothing medium or worse. Stacked in batch 6 (backend and mobile `wmt/MERGE-6`). Backend branch `wmt/HOME-16` (`f3090ea`, off main a5e48fc); mobile branch `wmt/HOME-16` (`2965dbd`, off wmt/MERGE-5 7de785d). No PR. Backend CI on `f3090ea`: Branch checks run 38988169052 (3 suite shards, contract, netns all green), Protected routes run 38988169121 green, Gates run 38988169026 red only on the same five lines as main.
- **Migration:** `20261024080000_tgif_daily_notice` (one new table `TgifDailyNotice`, rollback in its header). The lead renames at merge if the stamp is taken.
- **What a person gets:** every morning from 07:00 Lagos, one in-app notice per person with TGIF on ("TGIF: Sons, Not Slaves" / "Today's TGIF is ready. Romans 8:15 (NIV)."), and the phone push through INBOX-03. Tapping either opens the reader on that day (`/tgif?date=`); a notice more than a day old opens today's.
- **Settings:** `GET` and `PATCH /settings/tgif` unchanged in shape and values. The switch is read in three places: the job (at the claim), `NotificationService.emit` and the push sender (just before sending).
- **Shared changes filed:** HOME-16 #1 to #3 in `SHARED-CHANGES.md` (schema and migration, `contract/openapi.json`, the app's copy of the contract not regenerated).
- **Gap:** G-806 carries a "Served by HOME-16" note with the defaults below.
- **Defaults (agent), owner may override:** (1) the time is the environment key `TGIF_NOTIFICATION_TIME` (HH:MM, Lagos), default 07:00; the admin-settings row waits for TIER-06's pattern to merge; (2) the job looks every 5 minutes and makes the day's notices from the set time until 4 hours later (PROVISIONAL TGIF-NOTICE-CATCH-UP), so a hub that was down still sends a morning notice and nothing is sent in the afternoon; (3) the notice title is the day's series in title case with "TGIF: " in front, the body names the day's verse; (4) markers are kept 3 days (PROVISIONAL TGIF-NOTICE-KEEP).
- **Not done, and why:** no card or toggle is changed on Today or in Settings (DV2-RM, DV2-06). The in-app list row (M31) does not exist yet: `GET /me/notifications` serves `target: null` for this kind (its enum is unchanged), so that row routes by `kind` later. Pictures: this task draws no screen (no artboard).
- **Open question for the owner (via the lead):** one in-app row per person per day, for ever: nothing prunes `Notification` rows. Does the owner want a retention window (for example 90 days) for `tgif_daily`?
- **Next:** the lead merges it with batch 6.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-59 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

People who keep "TGIF each morning" on (Z2) get a notification every morning; tapping it opens the TGIF reader (H29). The Home TGIF card is gone, so this is how TGIF reaches Home (R-59, H36).

## Scope

- A scheduled job (the existing scheduler, `src/scheduler/`) creates one `tgif_daily` notification per opted-in person each morning, with the title of that day's TGIF, and sends the phone push through INBOX-03. The time of day is a setting (`tgif_notification_time`, PROVISIONAL, default 07:00 Africa/Lagos, owner may override). Idempotent per person per day.
- `GET` and `PATCH /settings/tgif` keep their shape; the switch now means "send me TGIF each morning". Existing values are kept.
- App side: tapping the notice or the push opens the reader route (`src/app/tgif.tsx`); H36 draws it as a notification over Today. No card is drawn on Today (that removal is DV2-RM).

## Capability checks

- [ ] A person with TGIF on gets exactly one notice a day; turning it off in Settings stops the next one.
- [ ] Tapping the notice opens that day's reader.
- [ ] A day with no TGIF sends nothing.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-16.md](history/HOME-16.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
