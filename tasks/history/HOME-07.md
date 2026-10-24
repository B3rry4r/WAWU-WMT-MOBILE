# HOME-07 · round history

Moved out of [tasks/HOME-07.md](../HOME-07.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: mobile `src/features/feed/` (new `CoursePost`, `TemplatePost`, `CardFrame`, `FeedCreatorCard`, `FeedProfessionalCard`, `FollowingEmpty`; edited `model`, `look`, `parts`, `PostFrame`, `VideoPost`, `FeedScreen`, `api`), `src/features/home/HomeScreen.tsx` and `CreatorRail.tsx`, `src/features/unlock/model.ts`, `src/app/(tabs)/index.tsx`, contract and generated types; backend `feed-cards.service.ts`, `professional-reply-time.ts` (`replyTimesFor`, shared with the directory), `professional.service.ts`, `contract/openapi.json`.
Checks (a user can ...): H7 see a course's free lesson, its lessons and price, and the bar opens the unlock sheet (HOME-12); play the lesson (the preview file plays in the frame; no per-lesson files, G-HOME-08-2). H8 tap the bar and swipe on. H9 Follow (the Hub's answer, put back with a line when refused), swipe the strip, open a piece (`/content/<id>`). H10 open Profile (P2), read rating, reviews and usual reply, no Trust Score. H12 Find people to follow (X4) and Follow from the rail. H13 Try again (real aborted calls, then the Hub's posts). Each by jest (`FeedScreen.test.tsx` 24 tests, `model.test.ts`) and against the real Hub on stack `home07` (ports 7890 to 7897, Nuvion stand-in) in a 390 px browser, light and dark.
Two tests of HOME-02's said a course and a template were "left to HOME-07"; they are replaced by the new ones (the task is what they waited for).
Counts: `tsc --noEmit` clean; eslint (no fix) clean on 19 changed files; feed, home and unlock jest 9 suites, all pass (before: 8 suites, 132 tests; after: 167 tests with the unlock suite); gates before 928 files, 0 fail, 11 warn; after 934 files, 0 fail, 11 warn, 0 accepted. Backend: `feed-cards`, `professional` specs pass (the three suites on a seeded database); tsc and eslint clean; contract regenerated, two properties added.
NOT RUN: a device, the real video player on a phone (web export plays stills only: the course preview in the seed is a picture), the H9 hue fallback picture (no portrait), the full mobile check and CI (the lead's batch).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The HOME-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

