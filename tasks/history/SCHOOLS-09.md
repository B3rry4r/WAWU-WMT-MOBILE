# SCHOOLS-09 · round history

Moved out of [tasks/SCHOOLS-09.md](../SCHOOLS-09.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files:** backend `prisma/schema.prisma` (model `SchoolEnrolmentReport`), migration `20261025130000_school_enrolment_report`, `src/schools/enrolment/` (`school-report.ts`, `school-report.service.ts`, `school-enrolment-list.ts`, changes to the service, controller, DTO, view types and module), `src/schools/schools-public.module.ts`, `src/account-purge/account-data-map.ts`, `contract/openapi.json`, `test/schools/school-nuvion-harness.ts`, `src/schools/enrolment/tests/school-report.contract.spec.ts`. Mobile: contract copy and API types.
- **Check 1** (the school's report address gets one email with the right details): tested end to end in the spec on a course with no fee and on a paid course through the real quote and payment; parallel and replayed sends make one mail.
- **Check 2** (My courses shows the enrolment with its intake date): tested over HTTP, including the tabs, the cursor and another student's rows.
- **Gate counts:** the backend gates and baseline were green on the base and on this head (Gates run, Baseline entries job); no baseline or gate edited.
- **Gaps:** none filed. Not done: the app screens (SCHOOLS-08).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

