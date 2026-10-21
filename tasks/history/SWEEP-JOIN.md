# SWEEP-JOIN · round history

Moved out of [tasks/SWEEP-JOIN.md](../SWEEP-JOIN.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/SWEEP-JOIN` `c62eb21`; web `wmt/SWEEP-JOIN` `6ab8292`; mobile records only. Files: backend `src/waitlist/` (`referral.service.ts` held places as people, `referral-probe.ts` new, `waitlist.service.ts`, the public controller, config, error table, core module, the team's list), the email controller's JSDoc, `contract/openapi.json`, a new spec and one changed assertion; web `PhoneInput.tsx`, `JoinForm.tsx`, `scripts/check-join-phone-320.mjs` (new).
Capability checks: each row is fixed with a measurement that fails without the fix (table above); none ruled no. No protected route changed: `/waitlist` is not in the registry, and `npm run test:protected` is 253/253 on a seeded database.
Checks (EXIT 0 unless noted): backend `tsc`; eslint and prettier on the changed files; the referral, referral-admin, throttle and waitlist specs in band (142 tests, 1 red before the assertion change, 0 after) and the three email specs (75 tests); gates 0 fail, 131 warn, 88 accepted, baseline ok; web `tsc`, `next lint` (warnings are old), `check-copy` clean, `join-referral.test.ts` 6 of 6; mobile `check_tasks`, gates.
Gaps: the D3 fix counts people, so a rotating set of fake names, phones and emails still holds places for 30 minutes each, bounded only by the per-address throttle (300 registrations in 10 minutes). Closing that needs the address stored on the registration (a schema change, fenced); not done. The D4 counter lives in the process, like the app's own rate limits. Both are for the verifier and lead to rule.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._


## Builder report (round 2)

Backend `6b66ea2` on `c62eb21`; web `d57c0fd` on `6ab8292`; mobile records. Files: backend `src/waitlist/referral/referral.service.ts`, new `referral-people.ts`, new `referral-people.spec.ts`, new `waitlist-referral-zone.contract.spec.ts`, the abuse spec's connected-person tests; web `src/lib/api/waitlist.ts`.
M1: `::timestamptz AT TIME ZONE 'UTC'` replaced by `::timestamp` in both queries. The zone spec boots the app with `PGOPTIONS=-c timezone=<zone>` and asserts `SHOW timezone`; before the change it fails in both zones (the place is not given back, the team's list still counts the hold after 31 minutes), after it passes (4 of 4). L1: the people count is connected starts by phone or email; 5 unit tests and 2 database tests (a chain of corrections is one person; a stranger still gets the second place). L2: one branch in `refusalOf`. L3: not done, see Current state.
Checks (EXIT 0): backend `tsc`, prettier and eslint on changed files; waitlist specs in band (referral-people, zone, abuse, referral, referral-admin, throttle, waitlist: 7 suites, 152 tests); `npm run test:protected` after `db:seed` 253/253; gates 0 fail, 131 warn, 88 accepted, baseline ok. Web `tsc`, `next lint`, `check-copy` clean, `join-referral.test.ts` 6 of 6. Mobile `check_tasks --write`, gates.

## Verifier report

Verifier: Sonnet, T1, 21 Oct 2026. Backend `c62eb21` against `origin/main` `2b461b5`; web `6ab8292` against `5b45d65`. Own database `sweepjoinv_test`, own worktrees, nothing pushed to the backend or web. Logs: the verifier's scratch folder `sweep-join-v/logs/` (each run ends in an EXIT line).

**Verdict: FIX** (one medium).

| Check | Result | Evidence |
|---|---|---|
| D3 held places count people | passed, with M1 | Real database, HTTP-level service calls: limit-1 code, first start applied, same person again applied, a different person told `full`, team list held = 1. Limit-2 code, one person starting 5 times then 1 other person: the other gets it, a third is told `full`, list = 2. Paid + held sum counts (paid 1 + held 1 on limit 2 is full), the person's own starts are left out. Hold edge: 29 minutes still held, 31 minutes released. Probe `zz-verify-probe.spec.ts` (7 tests, EXIT 0, log `probe2`). |
| D3 flipped assertion | judged: pins only the D3 defect | `waitlist-referral.contract.spec.ts` line 623, `false` to `true`. The rest of that test (first start paid, second row set failed, the check says `full`, only one paid place counts) is unchanged and green. Allowed by the sweep rule; nothing else weakened. |
| D4 probing limit | passed | HTTP through the real trust-proxy setting: 60 checks of a real code never counted; 29 unknown codes then the 30th still 404; the next call is 429 `referral_attempts_limited` with the plain sentence, on the check and on a registration that carries a code (real or unknown code); a registration with no code or a blank code answers 200; another address is untouched; a left-hand spoofed `X-Forwarded-For` entry is ignored; a registration with unknown codes counts the same; shape-invalid codes count; an inactive code does not count. Window edge: still blocked 1 ms before the window ends, free 1 ms after. Both figures come from `REFERRAL_MISS_LIMIT` and `REFERRAL_MISS_WINDOW_MS` in `waitlist-config.ts`, no literal in `referral-probe.ts`. Normal use cannot reach it: the web check is debounced after the last key. Log `probe2`. |
| D5 and EMAIL-02 JSDoc | passed | `npm run contract:build` on the branch: EXIT 0 and `git status` clean (no diff). The diff to main is summaries, descriptions and two documented 429 responses only. The new summary matches `missingSetting()` (no sender through WAWU ID or RESEND_API_KEY, or in production no HUB_PUBLIC_URL). Log `contract`. |
| r2-1 at 320 px | passed | Chromium, dev servers on base and branch, the /join form with `08031234567` typed. 320 px: before scrollWidth 137 over clientWidth 124, scrollLeft 13; after 140 over 140, scrollLeft 0, no page overflow. 360, 390, 768, 1024 and 1280 px: every measure identical before and after (card padding, input padding, country picker width, widths). 340 and 359 px change by design (below 360). Non-snug PhoneInput class string is byte-identical. No inline style in the diff; Tailwind classes only. Screenshots `shots/before-320.png`, `shots/after-320.png`. |
| Web checks | passed | `check:copy` clean, `typecheck` EXIT 0, `next lint` on the two changed components clean (logs `web-copy`, `web-tsc`, `web-lint`). The builder's own `check-join-phone-320.mjs` fails on base and passes on the branch. |
| Protected suite | passed | `npm run test:protected` after `npm run db:seed`: 2 suites, 253/253, EXIT 0 (log `protected`). The branch touches no lock or registry file. |
| Waitlist and email specs | passed | 18 waitlist spec files and the 3 email spec files, none importing the Fintava double: 289 tests, all green (`wl-branch` 17 suites green; `wl-claim2` 36/36 with the mock WAWU ID up). |
| Typecheck and lint | passed | backend `tsc --noEmit` EXIT 0; eslint (no fix) on the 8 changed source files EXIT 0. |
| Red on main for D3 and D4 | NOT RUN | The builder's claim (5 of 6 fail on main) was not re-run; the probe above exercises the same behaviour on the branch instead. |

### Findings

**M1 (medium, defect, latent): the held-place count is wrong when the database session time zone is not UTC.** `src/waitlist/referral/referral.service.ts` lines 77-90 (`usage`) and 100-112 (`heldByCode`): `"createdAt" > (${since}::timestamptz AT TIME ZONE 'UTC')`. The Prisma pg adapter sends a Date as `YYYY-MM-DD HH:MM:SS` with no zone (adapter-pg `formatDateTime`), so `::timestamptz` reads it in the session zone and `AT TIME ZONE 'UTC'` then shifts it again; the old Prisma-client query was immune. Repro: `ALTER DATABASE sweepjoinv_test SET timezone TO 'Pacific/Auckland'`, then run `waitlist-referral.contract.spec.ts -t "holds the place for 30 minutes"`: green on `origin/main`, red on the branch (the place is not given back after the hold); the new `still gives a held place back after the hold ends` test fails the same way. Green under UTC. Whether production's session zone is UTC is not known to the verifier. Fix: compare with `${since}::timestamp` (a UTC wall time, which is what the column holds) in both queries, and add a spec that runs the count under a non-UTC session zone.

**L1 (low, defect): the "changing only the phone does not make a new person" claim is false.** `referral.service.ts` doc block lines 28-34 and the abuse spec title at line 148. The count is the larger of distinct phones and distinct emails, so one person who corrects their phone and keeps the email shows as 2 held places to everyone else (probe: same email, 2 phones, list held 2; limit-2 code, a stranger is told `full` after one person varied the phone once). The person's own re-start is unaffected. Fix the comment and the test title, or count the smaller of the two if the lead prefers that.

**L2 (low, differs): the web shows the wrong words for the new 429.** `wawuafrica/src/lib/api/waitlist.ts` line 274: an unrecognised 429 reason falls to "Busy right now. Wait a few seconds and try again", and the check falls to "unchecked"; the backend's plain sentence says to wait a few minutes. The web follows after merge; a one-line row for the web's next sweep.

**L3 (low, defect): the in-memory guard's size bound does not bound.** `referral-probe.ts` lines 57-61: past 20,000 addresses `dropIdle` scans the whole map on every miss, and entries with a live miss are never dropped, so many addresses inside 10 minutes make each miss O(n). Needs a hard cap (drop the oldest) if it matters.

Environment notes: port 7860 was already listening (not mine, not visible to lsof), so the mock WAWU ID ran on 7861 and the web servers on 7862 and 7863; `mock-wawu-id/private.pem` and `public.pem` (gitignored test keys) were copied from `/home/user/wt/shared-be` into the verifier's backend worktree.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SWEEP-JOIN.md](history/SWEEP-JOIN.md).

