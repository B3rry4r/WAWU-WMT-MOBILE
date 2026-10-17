# FIX-09 verifier report (16 Oct 2026)

Verdict: merge. Nothing medium or worse. Two low findings for the sweep list.
Branches: backend wmt/FIX-09 5df5420, web wmt/FIX-09 2148c7d, mobile wmt/FIX-09 ef4d635. Main moved to bac39c4 (NUV-06) after the builder; checked against it.

## Findings
1. low - Stored notification text from before 21 Sep still carries a dash. Notification.body for the paid-DM refund was
   "Your N has been refunded <dash> the creator did not reply within 24 hours." until commit 259e6c5 (21 Sep).
   The migration rewrites only ServiceApplication. Rows written earlier (if prod had any refund before 21 Sep) still show the dash.
   Fix (2 lines, same migration or a new one):
   UPDATE "Notification" SET body = replace(body, ' has been refunded ' || chr(8212) || ' the creator did not reply within 24 hours.', ' has been refunded. The creator did not reply within 24 hours.') WHERE body LIKE '%has been refunded ' || chr(8212) || '%';
2. low - The report calls the refund adapter message "logs only". src/direct-message/dm-refund.service.ts:263 and :281 store
   it in DirectMessage.refundError, which admin payments returns (admin-payments.service.ts:317). Only an unreadable 2xx
   refund answer ever wrote it, so rows are very unlikely; a rewrite of old rows is optional.
Not findings (checked): the spec skips every migration, so a future migration that INSERTs text with a dash is not caught
(by design); String.fromCharCode(8212) and a URL-encoded dash evade it (contrived); .mjml/.ejs/.sql/.tsx/.js/.mts files and
prisma/*.json are not scanned and none exist in served paths today.

## Checks
- Web: diff is 8 files under public/tgif only (02,03,04,05,06,09,10,12). Each is valid JSON; 18 dashes removed (matches the
  report); the only changes are dash to comma/colon/full stop in `quote` fields (character-level diff, 0 other edits); 8 of 8
  identical to the backend book assets/tgif; 01,07,08,11 untouched. src/app/join and middleware do not reference tgif, so a
  /join visitor sees nothing different.
- Migration, live-shaped rows (Postgres 16, 128 earlier migrations replayed, 3,011 rows: 3,000 bulk + 11 hand-built):
  run 1 updated 1,002 labels and 1,505 timelines (2,005 distinct rows differ), 0.17 s; run 2 UPDATE 0 and 0, tables byte-equal
  to run 1 (idempotent). Against a model of the intended rewrite: 0 deviations over 3,011 rows. Other columns, other
  timeline entries, key order of entries, empty/null/object/scalar timelines, a note typed by an admin, a nature containing
  a dash: all untouched. Known limits (rare, not findings): a registrationType containing a dash or colon (web sends only
  business_name or limited_company) is rewritten at its own dash or left alone. `prisma migrate deploy` on a fresh DB
  applies all 129 migrations, new one recorded finished.
- Spec: 10 of 10 on the branch and on main bac39c4 merged with the branch (clean merge, spec still 10 of 10, so main's new
  code has no dash). Mutation test (20 planted cases in new files, all removed): caught a template head, middle, tail, no-substitution
  template, nested template, tagged template, the literal em-dash, \u{2014}, &mdash;, &#8212;, &#x2014;, &MDASH;, a property key, a
  join/replace argument, concatenation piece, a dash in .json, .html, .txt (src) and assets/ .html and .json (with escape).
  Not caught: computed (fromCharCode, %E2%80%94), files in dirs named tests/test, .sql/.mjml/.ejs/.tsx/.js/.mts, prisma/*.json.
  Comments, JSDoc and regex literals are not flagged (correct).
- Changed answers: whole non-test src diff read (34 files). Only strings changed, plus one equivalent rewrite
  (plans-config guard, includes('(em-dash)') to /(em-dash)/.test). Status codes and shapes unchanged. Old texts are referenced
  nowhere else (backend specs/docs, web src, mobile src: 34 fragments, 0 hits). Protected lock stores shapes only
  (`string`), CI "Protected route suite" green on 5df5420. Clients use statusLabel and the legal labels as display only;
  option `value`s are unchanged.
- CI on 5df5420: suite 3 of 3, netns, contract, baseline, deploy-in-sync, protected routes green; Executable gates red with
  18 lines, identical (diff empty) to main bac39c4's 18 lines, so pre-existing.
- Live stack fix_09 (branch, DB seeded, service key exported): admin events 37/37 (first run timed out in beforeAll under load,
  passes with --testTimeout=30000), content review, payments, service application, legal intake, community: all passed;
  kyc-submission contract spec fails ECONNREFUSED :4001 (hard-coded mock port, pre-existing, not this change). Live GETs
  (legal matters, tgif, communities, plans): 0 dashes.
- Cleanup: stack fix_09 down (ports 7190 and 7197 closed, DB dropped), my two migration DBs dropped, both worktrees removed.
