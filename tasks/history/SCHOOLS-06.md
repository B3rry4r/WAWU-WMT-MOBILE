# SCHOOLS-06 · round history

Moved out of [tasks/SCHOOLS-06.md](../SCHOOLS-06.md) word for word, oldest first. The current state is in that file.

## Builder report

Files (mobile only): `src/features/schools/` new `enrolApi.ts`, `enrolModel.ts`, `enrolIntent.ts`, `useEnrolPay.ts`, `enrolParts.tsx`, `EnrolScreen.tsx`, `EnrolmentScreen.tsx`; edited `CourseScreen.tsx` (Enroll, "One payment", the class-full bar, the apply link); routes `src/app/schools/enrol/[courseId].tsx`, `src/app/schools/enrolments/[id].tsx`, and `courses/[id].tsx` (gives `onEnroll`); test `__tests__/enrolFlow.test.tsx` (26 cases: SC4 6, pay 12, SC8 2, course page 4, plus the empty and closed states).
Capability checks: SC4 pick and Continue, SC5 total and Pay from the wallet, SC6 PIN, SC7 Share receipt (spy on `Share.share`: text and reference), SC11 Enroll for January, no wallet leads to Open your wallet: each is a test in `enrolFlow.test.tsx`; the attacks also ran once each on the stack (see Current state).
Decisions: Continue replaces SC4 with SC5 so Back lands on the course; closing the pay sheet leaves the screen (the place stays held); the PIN sheet hides the page's words as SC6 draws; a place held and unpaid opens the pay screen from My courses; "will contact you" stays, the two-day figure is out (G-850); a student with details not loaded cannot Continue (the disclosure names what is shared).
Gate counts: `npm run gates` before: 0 fail (MERGE-9); after: 0 fail, 0 accepted, 11 warn (one new PROVISIONAL). No assertion of another task's test was edited (SHARED-CHANGES SCHOOLS-06 #2).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

