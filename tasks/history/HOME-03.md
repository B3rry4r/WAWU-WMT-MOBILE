# HOME-03 · round history

Moved out of [tasks/HOME-03.md](../HOME-03.md) word for word, oldest first. The current state is in that file.

## Builder report

**Files.** New: `src/features/content-detail/` (`api.ts`, `model.ts`, `usePage.ts`, `ContentDetailScreen.tsx`, `Media.tsx`, `Parts.tsx`, `CommentsSheet.tsx`, `ShareSheet.tsx`, `RateSheet.tsx`, 2 test files), `src/app/content/[id].tsx`. Edited (entries, optional props): feed `Byline`/`PostFrame`/`FeedScreen`, `HomeScreen`, the Home tab, Search `ContentRow`/`SearchScreen`, `src/app/search.tsx`. Backend: `content-detail.service.ts` (+ `creator`), its contract spec, `contract/openapi.json`.
**Checks.** `npx tsc --noEmit` EXIT 0; eslint on changed files EXIT 0; jest content-detail 22 tests EXIT 0 (new); home+feed+search+explore+unlock+tips 14+7 suites EXIT 0 after the merge fix; gates before 0 fail 11 warn, after 0 fail 11 warn (10 gates, 0 accepted). Backend: tsc EXIT 0, eslint EXIT 0, `content-detail.contract.spec.ts` 29 of 30 pass (the new case passes; "a user sees when a piece was made, and the date moves when the creator edits it" fails with a 403 on `PATCH /content/{id}`, a route this task did not touch).
**Tests.** A user sees H19 (preview tag, meta, maker line, price card, balance), unlocks with one key and one debit and the page then reads as bought (H20), likes/saves/follows, reads comments with an indented reply, replies (`replyToId` sent), fails a post (words kept) and posts again, sees the empty comments, likes a comment, rates once ("Thanks for rating", "Rated 4"), is told "Only people who bought this can rate it", shares (link copied, sent to one chat once with one `clientMessageId`), sees H24 (Free, no price, Tip) and H25 (Free lesson, locks, See all, "Unlock course").
**Not done.** The pictures beside the boards on the stack (see the hand-back); ME-07's library entry (not in this base); a lesson opens nothing (G-HOME-08-2); the parent-course row (G-HOME-08-1).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

