# HOME-16 · round history

Moved out of [tasks/HOME-16.md](../HOME-16.md) word for word, oldest first. The current state is in that file.

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

