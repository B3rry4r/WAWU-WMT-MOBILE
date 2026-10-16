# FIX-19 · round history

Moved out of [tasks/FIX-19.md](../FIX-19.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/FIX-19` 2dbf748 (on main 56f94d0). Mobile `wmt/FIX-19`: this file, the task file, `docs/LOG.md`, `docs/PROGRESS.md`.
- **Files:** `src/schools/school-admin.dto.ts` (`hasControlCharacter`, `HasNoControlCharacters`, `trimmedName` on `CreateSchoolDto.name`, `UpdateSchoolDto.name`, `CreateCourseDto.title`, `UpdateCourseDto.title`); new spec `src/admin/schools/tests/admin-schools.control-chars.contract.spec.ts`; edited spec `src/schools/tests/schools-admin-written.contract.spec.ts`. No migration, no fenced file, no SHARED-CHANGES row.
- **The rule:** C0 (U+0001 to U+001F, tab and line breaks included), DEL (U+007F) and C1 (U+0080 to U+009F) are refused in a school's `name` and a course's `title`, on create and on edit, 400 `name must not contain control characters` (or `title ...`), nothing saved. NUL (U+0000) keeps the existing `IsCleanText` message. The check is a loop over UTF-16 code units, not a regex, so the lint rule against control characters in a pattern has nothing to flag.
- **Checked as it came:** `trimmedName` leaves a value that holds a control character untrimmed, so `"Acme\n"` and `"\tAcme"` are refused. Before, `trim()` removed a leading or trailing tab, line break, vertical tab, form feed or carriage return and the name saved as typed minus those. Plain spaces are still trimmed (`"   Padded Name   "` saves as `Padded Name`). To confirm: the task says "refuses C0 controls ... and save nothing", so a name with an edge control is a 400, not a trimmed 200.
- **Scope read:** "every school and course name field" is the school `name` and the course `title`. Not changed (still accept controls): school `location`, `about` (line breaks are normal there), `expertise` items, course `syllabus` and `outcomes` items, intake `schedule` and `location`. If the owner wants a single-line rule on `location`, `schedule` and the lists, that is one decorator on each field.
- **Existing rows (not counted on production):** this session has no production database and may not call the production Hub, so the count of stored names and titles that hold a control character is not known. Run on the production database (read-only):
  ```sql
  SELECT 'School.name' AS field, count(*) AS rows_with_control_chars
    FROM "School" WHERE "name" ~ '[\x01-\x1F\x7F-\x9F]'
  UNION ALL
  SELECT 'SchoolCourse.title', count(*)
    FROM "SchoolCourse" WHERE "title" ~ '[\x01-\x1F\x7F-\x9F]';
  ```
  The pattern matched U+0001, U+007F, U+0085 and U+009F and did not match a space, `~`, U+00A0, `e` with acute, a Han character or an emoji (checked in Postgres 16). On the fresh test database of the stack it answers 0 and 0, which says nothing about production. No row was changed; changing stored names needs a lead ruling.
- **Cursor bound (SCHOOLS-04 round 3, decision 2):** left as it is. `SCHOOL_LIMITS.name` is 120, so the bounds stay at 360 name units and 1498 cursor characters. The admin can no longer produce the worst case (a control character plus U+FE0F per counted character), so the bound is larger than needed, which is safe, and a row stored before this change with controls in its name still pages.
- **The spec I changed:** `schools-admin-written.contract.spec.ts` wrote two schools through the admin route with the name `('\u0001' + U+FE0F) x 120` (and x 119 + a Han character) to reach the longest cursor. The admin refuses those now. The spec now asserts that refusal (400 `name must not contain control characters`) and writes those two rows straight to the table with Prisma, as rows stored before this change are; the `units` rows (a flag, no control) still go through the admin route. Every assertion about the cursor (1498 characters, 360 units, the walk at limit 1, the 1499-character refusal) is unchanged and passes. The collation spec writes with Prisma already and needed no change.
- **New spec (12 tests):** the check as a unit over every code point of the three ranges (true) and over NUL, printable ASCII, U+00A0 to U+00FF, U+200B, U+2028, U+FEFF (false); then, for school `name` and course `title`: 12 characters (first and last of each range, backspace, tab, line feed, vertical tab, carriage return, escape, next line) in 4 places (inside, start, end, alone) on create (400, count unchanged) and on edit (400, row unchanged); the exact messages and that NUL keeps its own; 11 real names (accents, Yoruba combining marks, Arabic, Chinese, emoji with ZWJ and a flag, NBSP, soft hyphen, U+2028, zero-width space) accepted and read back as sent on create and edit; spaces still trimmed; `about` with a blank line still saved. Mutant: C1 range ended at U+009E: 5 of 12 fail; restored.
- **Live check:** a Hub built from the branch (stack `fix_19`, ports 7200 to 7207, a real admin login). 328 requests: all 64 code points inside a name on the four routes, 9 of them also at the start and the end: every one 400 naming the field. 6 real names accepted on all four routes (201 or 200, read back equal). NUL 400. The database holds 0 names or titles with a control character afterwards. The Hub throttles at 200 requests a minute, so the probe was paced.
- **Checks:** `npx tsc --noEmit` EXIT 0. eslint and prettier on the three files: clean. `npm run test:contract -- src/admin/schools src/schools`: 9 suites, 107 tests, EXIT 0. `contract:emit` and `contract:enrich`: `contract/openapi.json` unchanged. CI on 2dbf748: suite (3 shards), netns, contract, baseline, deploy-test-in-sync and branch checks green; protected routes 253 of 253 (run 38903140624); gates (run 38903140703) red only on the 16 FAIL lines main already has (flutterwave files, admin notifications, community guard, content-piece), none in `src/schools` or `src/admin/schools`. No protected route's code or lock is touched (these are admin routes).
- **Not done:** the production row count (above). Nothing else open.
- **Memory:** the machine killed `tsc`, eslint and the Hub build several times for memory (exit 137); each was repeated until it finished. No code was skipped for that.

## Verifier report

_Not started._
