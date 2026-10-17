# SCHOOLS-08 · round history

Moved out of [tasks/SCHOOLS-08.md](../SCHOOLS-08.md) word for word, oldest first. The current state is in that file.

## Builder report

Files (mobile only): `src/features/schools/MyCoursesScreen.tsx`, `ApplySheet.tsx`, `enrolApi.ts` (list, apply-link, apply-click calls); `src/app/schools/mine.tsx`; edits `src/features/me/MeMenuSheet.tsx`, `MeScreen.tsx` and `src/app/(tabs)/me.tsx` (one optional `onOpenCourses`, SHARED-CHANGES SCHOOLS-08 #1); tests in `enrolFlow.test.tsx`.
Capability checks: SC8 switch Current/Finished and open a row (test), empty per tab and error (test); SC9 Continue records one click and opens the Hub's link, Enroll instead leads to SC4 (test; the click and link calls on the stack in the SCHOOLS-10 task's own run).
Gaps filed: G-851 (progress), G-852 (row picture), G-854 (menu line). No backend change.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

