# FIX-19 verifier report (16 Oct 2026)

Verdict: merge. Backend wmt/FIX-19 2dbf748 (on main 56f94d0), mobile ec70d90 (docs only).

Findings
1. LOW, scope gap, open for the lead: the existing-row count is not a number. The builder had no production access and gave the query
   (tasks/history/FIX-19.md). Run on a local stack DB holding one control-character school name and one course title, it answered 1 and 1
   and did not match NBSP, accents, Han or emoji rows. Someone with production access must run it.
2. LOW, src/schools/tests/schools-admin-written.contract.spec.ts (D2 beforeAll, about line 225): the "one more than the maximum is refused"
   assertion (121 characters, 400 "shorter than or equal to 120") now runs only for the units name, not the bytes name. The same
   decorator covers both and the new spec still checks control characters. The describe title "a cursor for every name the admin accepts"
   no longer fits the bytes rows (written to the table). Sweep list, no round.

Changed test judgement: it keeps its purpose. Three mutants of src/schools/schools-cursor.ts (bytes-per-char 9 to 8, name bound 360 to 239
units for the bytes name, cursor name check made to refuse controls) each fail 2 of 10 cursor tests ("a walk at limit 1 ..." and
"a cursor longer than the longest ..."). Unmutated: 10 of 10 pass. The 1498-character cursor assertion is intact; the admin 400 is asserted.

Checks (stack fix_19, ports 7200-7207, real admin logins for all four roles)
- 256 requests with literal JSON \uXXXX escapes, all 64 code points (U+0001-1F, U+007F-9F), school name create and edit, course title create
  and edit: 256 of 256 are 400 with "name/title must not contain control characters"; DB unchanged.
- Raw DEL and raw C1 (UTF-8) in the JSON text, form-encoded %01, charset header: 400. text/plain: 400 (no parser, as before).
- PATCH with a bad name plus hidden, location and about: 400, row byte-identical (no partial write). Same on a course.
- Wrong role: support and finance get 403 on clean and dirty create, nothing saved; reviewer: clean 201, dirty 400.
- Wrong types (number, array, array holding a control character, object, null, boolean): 400 on all four routes.
- 40 parallel creates (20 clean, 20 dirty): 20 of 20 saved, 20 of 20 refused; 20 parallel edits likewise. DB holds 0 control-character
  names or titles after all attacks. NUL keeps its own message. 100 kB of controls: 413 (body limit).
- 15 real names (accents, Yoruba, Arabic, Chinese, Japanese, Cyrillic, Hindi, emoji and ZWJ sequences, NBSP, U+00A1, U+00FF, U+0100, ~):
  accepted and read back equal on all four routes. Plain spaces still trimmed.
- Legacy rows (written raw, with U+0085, U+0001, U+007F): public list, page 2 by cursor, detail and admin detail all 200; edits of
  other fields 200; editing a legacy name to a clean one 200; sending the legacy name back unchanged 400 (by design).
- CI on 2dbf748: 3 suite shards, netns, contract, baseline, deploy-test-in-sync success; protected routes 253 of 253; gates red with the
  same 16 FAIL lines as main's run 116742827298 (none in src/schools or src/admin/schools; diff of the sets is empty).
- eslint (no fix) and prettier on the 3 changed files: EXIT 0. Mobile branch changes only docs/LOG.md, docs/PROGRESS.md, tasks files.
- Pre-existing, not FIX-19: the rate limiter (20 per second, 200 per minute per IP) answers 429 to a burst; I varied X-Forwarded-For on
  the local stack only.

Cleanup: stack fix_19 down (Hub 14732 and mock-id 14719 stopped, database dropped), ports 7200-7207 have no listener, worktree
v-fix-19-be removed. Nothing pushed.
