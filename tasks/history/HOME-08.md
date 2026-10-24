# HOME-08 · round history

Moved out of [tasks/HOME-08.md](../HOME-08.md) word for word, oldest first. The current state is in that file.

## Builder report

**Files.** The same as HOME-03 (one screen, `src/features/content-detail/`); `model.ts` (`mediaTag`, `metaLine`, `courseLength`, `layoutOf`), `Parts.tsx` (`LessonList`), `ContentDetailScreen.tsx` (the course foot and See all).
**Checks.** As HOME-03 (one run): tsc, eslint, gates, jest all EXIT 0. H24 and H25 each have a case in `contentDetail.test.tsx`: H24 shows Free with the length, no price, no Read now, a Tip and the 340 comments; H25 shows 12 lessons with the first Free and the rest locked, See all and Show fewer, the foot's unlock with the balance line.
**Not done.** The parent course row and per-lesson play (gaps above); the picture beside H24 and H25 on the stack.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

