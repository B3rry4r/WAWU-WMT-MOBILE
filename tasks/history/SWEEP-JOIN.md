# SWEEP-JOIN · round history

Moved out of [tasks/SWEEP-JOIN.md](../SWEEP-JOIN.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/SWEEP-JOIN` `c62eb21`; web `wmt/SWEEP-JOIN` `6ab8292`; mobile records only. Files: backend `src/waitlist/` (`referral.service.ts` held places as people, `referral-probe.ts` new, `waitlist.service.ts`, the public controller, config, error table, core module, the team's list), the email controller's JSDoc, `contract/openapi.json`, a new spec and one changed assertion; web `PhoneInput.tsx`, `JoinForm.tsx`, `scripts/check-join-phone-320.mjs` (new).
Capability checks: each row is fixed with a measurement that fails without the fix (table above); none ruled no. No protected route changed: `/waitlist` is not in the registry, and `npm run test:protected` is 253/253 on a seeded database.
Checks (EXIT 0 unless noted): backend `tsc`; eslint and prettier on the changed files; the referral, referral-admin, throttle and waitlist specs in band (142 tests, 1 red before the assertion change, 0 after) and the three email specs (75 tests); gates 0 fail, 131 warn, 88 accepted, baseline ok; web `tsc`, `next lint` (warnings are old), `check-copy` clean, `join-referral.test.ts` 6 of 6; mobile `check_tasks`, gates.
Gaps: the D3 fix counts people, so a rotating set of fake names, phones and emails still holds places for 30 minutes each, bounded only by the per-address throttle (300 registrations in 10 minutes). Closing that needs the address stored on the registration (a schema change, fenced); not done. The D4 counter lives in the process, like the app's own rate limits. Both are for the verifier and lead to rule.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

