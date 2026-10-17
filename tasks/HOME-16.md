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
- **Status:** verifying. Backend branch `wmt/HOME-16` (`f3090ea`, off main a5e48fc); mobile branch `wmt/HOME-16` (`2965dbd`, off wmt/MERGE-5 7de785d). No PR. Backend CI on `f3090ea`: Branch checks run 38988169052 (3 suite shards, contract, netns all green), Protected routes run 38988169121 green, Gates run 38988169026 red only on the same five lines as main.
- **Migration:** `20261024080000_tgif_daily_notice` (one new table `TgifDailyNotice`, rollback in its header). The lead renames at merge if the stamp is taken.
- **What a person gets:** every morning from 07:00 Lagos, one in-app notice per person with TGIF on ("TGIF: Sons, Not Slaves" / "Today's TGIF is ready. Romans 8:15 (NIV)."), and the phone push through INBOX-03. Tapping either opens the reader on that day (`/tgif?date=`); a notice more than a day old opens today's.
- **Settings:** `GET` and `PATCH /settings/tgif` unchanged in shape and values. The switch is read in three places: the job (at the claim), `NotificationService.emit` and the push sender (just before sending).
- **Shared changes filed:** HOME-16 #1 to #3 in `SHARED-CHANGES.md` (schema and migration, `contract/openapi.json`, the app's copy of the contract not regenerated).
- **Gap:** G-806 carries a "Served by HOME-16" note with the defaults below.
- **Defaults (agent), owner may override:** (1) the time is the environment key `TGIF_NOTIFICATION_TIME` (HH:MM, Lagos), default 07:00; the admin-settings row waits for TIER-06's pattern to merge; (2) the job looks every 5 minutes and makes the day's notices from the set time until 4 hours later (PROVISIONAL TGIF-NOTICE-CATCH-UP), so a hub that was down still sends a morning notice and nothing is sent in the afternoon; (3) the notice title is the day's series in title case with "TGIF: " in front, the body names the day's verse; (4) markers are kept 3 days (PROVISIONAL TGIF-NOTICE-KEEP).
- **Not done, and why:** no card or toggle is changed on Today or in Settings (DV2-RM, DV2-06). The in-app list row (M31) does not exist yet: `GET /me/notifications` serves `target: null` for this kind (its enum is unchanged), so that row routes by `kind` later. Pictures: this task draws no screen (no artboard).
- **Open question for the owner (via the lead):** one in-app row per person per day, for ever: nothing prunes `Notification` rows. Does the owner want a retention window (for example 90 days) for `tgif_daily`?
- **Next:** a verifier runs V1 to V4 and V9, with the capability checks below.

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

## Builder report

Built 17 Oct 2026. Backend `f3090ea`, mobile `2965dbd`.
- **Backend files:** `src/scheduler/tgif-daily-notice.service.ts` (the job: Lagos clock, one claim-and-write transaction per 500 people, prune) and `.config.ts` (the PROVISIONAL figures); `src/scheduler/scheduler.module.ts` (two providers); `src/notification/notification-event.ts` (kind `tgif_daily`, copy, target kind `tgif_day`, `tgifSeriesTitle`); `src/notification/notification.service.ts` (`emitTgifDaily` batch, `SwitchName`, `tgifDaily` read in `isSwitchOff`); `src/push/push-policy.ts` (`tgif_daily: 'send'`, gate `tgifDaily`); `prisma/schema.prisma` + migration `20261024080000_tgif_daily_notice`; purge map and export list; wording of the `settings/tgif` comments and DTO; `contract/openapi.json` (rebuilt: one description line, and the `TgifCard` enum order moves because the build's type order shifts with new files).
- **Mobile files:** `src/features/push/routes.ts` (`tgif_daily` opens `/tgif`, with `date` from the target), `src/app/tgif.tsx` (reads `date`), `src/features/tgif/TgifReader.tsx` and `model.ts` (`readerDay`: that day when it is yesterday to tomorrow, else today).
- **Tests added:** backend `src/scheduler/tests/tgif-daily-notice-units.spec.ts` (11) and `tgif-daily-notice.contract.spec.ts` (18, real Postgres, real routes, Expo stand-in); mobile `tgifRoute.test.ts`, `readerDay.test.ts`, `TgifReaderNoticeDay.test.tsx`, `src/__tests__/tgif-route.test.tsx` (15). One existing spec extended: `src/push/tests/push-policy.spec.ts` got one `tgif_daily` entry in `EVENTS` (the spec requires an example for every pushed kind); nothing removed or relaxed; it is its own commit.
- **Capability checks:** (1) one notice a day: the spec runs the job at 07:00, 07:30 and 08:10 and two instances at once, and counts one row per person (also across 1,042 people, more than two chunks of 500); turning TGIF off with the real `PATCH /settings/tgif` gives none the next morning, and turning it off after the notice makes no second. (2) tapping opens that day's reader: `routeForPush` and the route and reader tests above (the tap itself needs a phone: NOT RUN). (3) a day with no TGIF: a content service that cannot give the day writes no notice and no marker. The push: a registered phone gets one message with the notice words and `target { tgif_day, date }`; with the switch off after the notice was written it is skipped as `switch_off`.
- **No network or long lock:** the job is database work in 30 s transactions of at most 500 people; the spec asserts the job makes no request to Expo.
- **Checks:** backend `tsc` clean, eslint 0 errors on the changed files, gates 5 fail (the same five as main) and 122 warn (119 on main: my three PROVISIONAL markers), CI runs 38988169052, 38988169121, 38988169026 (above). Mobile full check on `2965dbd` plus the docs: typecheck clean, lint 0 errors (6 old warnings, none in my files), 188 suites and 3,258 tests pass, gates 0 fail, `npm run tasks` EXIT 0 after `--write` regenerated `docs/PROGRESS.md`.
- **Gaps and shared changes:** G-806 note; SHARED-CHANGES HOME-16 #1 to #3.
- **NOT RUN:** a real phone push (Expo's hosts are not reachable; the stand-in follows its documented wire shape); pictures (no screen).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
