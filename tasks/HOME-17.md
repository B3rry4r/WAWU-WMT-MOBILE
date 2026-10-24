---
id: HOME-17
title: Settings move into admin (TGIF time, two thresholds, 30-day clean-up)
owner: YOU
area: HOME
order: 294
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [HOME-16, TIER-06, WALLET-37, EXPLORE-06]
decisions: [R-59, R-65, R-43]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-17 · Settings move into admin (TGIF time, two thresholds, 30-day clean-up)

## Current state

As of 17 Oct 2026. Built, and checked by an independent Sonnet verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/HOME-17.md`): verdict merge, nothing medium or worse; its lows 1 and 2 and its info line 3 are in `tasks/SWEEP-INBOX.md` and `tasks/SWEEP-MONEY.md`.
- **Status:** merging (lead). Backend branch `wmt/HOME-17` (`94f90c6`, built on batch 7 `wmt/MERGE-7` 850369a); mobile branch `wmt/HOME-17` (this file, a record only; built on `wmt/MERGE-7` ef8c23e). No PR. Backend CI run 39005543454 on `94f90c6`: contract, protected routes, baseline, netns, deploy-test-in-sync and the three suite shards all pass; "Executable gates" shows the one FAIL that is on main (`content-piece.service.ts:67`), nothing from this change.
- **Migration:** `20261024220000_tgif_notice_retention_index` (one partial index on `Notification` for `kind = 'tgif_daily'`, rollback in its header). The lead renames at merge if the stamp is taken.
- **The four settings** (TIER-06's registry, each with today's value as the default, so nothing changes until an admin edits it): `tgif_notification_time` 07:00 Lagos; `name_check_per_hour` 30 (1 to 1,000, WALLET-37's old bound kept); `popular_community_min_members` 10 (1 or more); `tgif_notice_retention_days` 30 (new row, 1 or more). Edits go through `PATCH /admin/plan-settings`: validated, audited (old and new value), reloaded on the saving server at once and on another within 15 seconds.
- **Env vars retired (nothing reads them any more):** `TGIF_NOTIFICATION_TIME` (HOME-16), `NAME_CHECK_PER_HOUR` (WALLET-37), `POPULAR_COMMUNITY_MIN_MEMBERS` (EXPLORE-06). The registry is the one source. `.env.example` and `docs/contract/CONVENTIONS.md` say so.
- **TGIF time:** read on every 5-minute look. One notice per person per Lagos day is the `TgifDailyNotice` marker, so a change on a day the notices went out sends nobody a second one, and the next day goes out at the new time. A change made before the day's notices went out moves that day's too (nothing was sent yet).
- **Thresholds:** `NameCheckBudget` reads the limit at every check. `GET /search/popular` reads the figure on every call, and its 60-second kept answer is dropped the moment the figure differs from the one it was built with.
- **Clean-up:** `TgifNoticeRetentionService`, daily at 02:17 server time. It deletes only `Notification` rows of kind `tgif_daily` older than the days kept, 1000 at a time, oldest first, each batch one `DELETE ... FOR UPDATE SKIP LOCKED` statement (no transaction between batches, no network call, a 4-minute budget). `NotificationTarget` goes with each row (cascade). Two servers at once share the rows, each deleted once. Every other notification kind, and a `tgif_daily` notice younger than the days kept, is untouched. The once-a-day marker is not touched, so a cleared notice is never made again.
- **Specs added:** `src/plan-settings/tests/home-17-settings.contract.spec.ts` (rows, defaults, validation, audit, reset, name check read live), `src/scheduler/tests/tgif-time-and-retention.contract.spec.ts` (time change both ways, retention scope, bounds, budget, two servers, marker kept). Specs I changed because the env behaviour they tested is retired (HOME-16 units and contract specs, WALLET-37 `name-check-budget.spec.ts`, EXPLORE-06 `search-popular-members.contract.spec.ts`): only the construction and the env-driven cases; every other case is as written.
- **Shared changes filed:** HOME-17 #1 and #2 in `SHARED-CHANGES.md`. `contract/openapi.json` is unchanged (no route added or changed).
- **Not done / for the lead:** (1) PushDelivery rows for a cleared notice are left to their own retention (outside this scope). (2) The admin dashboard has no screen change: the four rows list in the existing settings page (`unit` time, count, days). (3) `tgif_notification_time` is no longer marked provisional (owner answer 32 named 07:00). (4) The 10 `search-response.contract.spec.ts` cases that failed on the local stack need the seeded database CI has; they pass in CI.
- **Next:** the lead merges it with batch 7.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-59 (the daily TGIF notice), R-65 (design figures are admin settings), R-43 (no figure in code).
- `tasks/HOME-16.md`, `tasks/TIER-06.md`, `tasks/WALLET-37.md`, `tasks/EXPLORE-06.md` (the four things that moved).

## Goal

Owner answer 32 (17 Oct 2026): the daily TGIF notification goes out at 07:00 Lagos time, changeable in admin, and TGIF notices older than 30 days are cleared. Owner answer 24 (R-65): design figures are admin settings. So the TGIF time, the two thresholds (name checks an hour, members a community needs to be called popular) and the retention are rows in TIER-06's registry that an admin can edit with no deploy and no restart.

## Scope

1. Registry rows, each with today's value as the default: the TGIF daily notice time (07:00, Africa/Lagos, a validated time of day); `NAME_CHECK_PER_HOUR` (30); `POPULAR_COMMUNITY_MIN_MEMBERS` (10); TGIF notice retention in days (new, 30, at least 1). Each env var stops being read once its row exists. Changing the time takes effect on the next day's run without a restart and never sends a second notice on the day it is changed.
2. A scheduled job that clears `tgif_daily` notices older than the retention, in bounded batches, never holding a transaction across batches, running once even with two servers. Only the `tgif_daily` rows HOME-16 added: every other notification the web or the app shows stays untouched (additive only).
3. Specs for the rows (defaults, validation, audit), the time change, the three thresholds read live, and the retention.

## Capability checks

- [ ] An admin edits the TGIF time; the next day's notice goes out at the new time, and nobody gets a second notice on the day it was changed.
- [ ] An admin edits the name checks an hour or the popular-community members; the next request follows it with no restart.
- [ ] TGIF notices older than the days kept are gone; younger ones and every other notification kind are still there.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-17.md](history/HOME-17.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
