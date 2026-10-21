---
id: SWEEP-JOIN
title: Join sweep: the low findings of /join, referral codes and campaign mail
owner: YOU
area: SWEEP
order: 249
priority: launch
repo: all
type: backend-refactor
status: building
depends_on: []
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-JOIN · Join sweep: the low findings of /join, referral codes and campaign mail

## Current state

As of 21 Oct 2026, verifier FIX (Sonnet verifier, T1). Status: building. One medium finding; the five rows themselves hold.
- **Branches:** backend `wmt/SWEEP-JOIN` `c62eb21` on `origin/main` `2b461b5`; web `wmt/SWEEP-JOIN` `6ab8292` on `origin/main` `5b45d65`; this record on mobile `wmt/SWEEP-JOIN`.
- **Rows:** D3, D4, D5, the EMAIL-02 JSDoc and r2-1 behave as the rows say. Backend waitlist and email specs green, protected suite 253/253, contract rebuild gives no diff, the 320 px field no longer scrolls.
- **Open findings:** blocker 0, high 0, medium 1 (M1: the held-place count depends on the database's session time zone), low 3 (L1 to L3, in the Verifier report below).
- **Next:** a builder round for M1 on backend `wmt/SWEEP-JOIN` (two lines and one spec); then a short re-check; then the lead merges the backend and web branches and regenerates the mobile contract once.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

The /join page, referral codes, the waitlist and campaign mail: JOIN, REF and EMAIL tasks. Web, backend and wawu-id. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report | Closed by |
|---|---|---|---|---|
| REF-01 | D3 | Hold spam: the places of a limited code can be held up by repeated holds. | the lead's log, 14 Oct; the report text is not in the task file | FIXED, backend `c62eb21`: held places are counted as people (the larger of the distinct phones and the distinct emails among the unpaid starts), never starts, and a person's own earlier unpaid starts are left out when they start again. Proof: `waitlist-referral-abuse.contract.spec.ts` (4 D3 tests, real database) is red on `origin/main` (5 of 6 fail) and green on the branch; the team's list counts the same way. |
| REF-01 | D4 | Code probing: a guessable free code can be found with the public check, and nothing slows someone trying codes one after another. | the lead's log, 14 Oct; the report text is not in the task file | FIXED, backend `c62eb21`: an address that tried 30 codes we do not have in 10 minutes (settings) is refused on the check and on a registration that carries a code, 429 `referral_attempts_limited` with a plain sentence; a code we have never counts, a registration with no code is never refused by it. Proof: three service tests and one HTTP test in the same spec; the HTTP test gets 200 instead of 429 on `origin/main`. |
| REF-01 | D5 | `flutterwaveConfig` is optional in the contract. | the lead's log, 14 Oct; the report text is not in the task file | FIXED (text only), backend `c62eb21`: the 200 of `POST /waitlist/registrations` now says exactly one of `flutterwaveConfig` and `completed` is present (`flutterwaveConfig` whenever `amountKobo` is above 0). The field stays optional because the free path has none. `contract/openapi.json` regenerated with `npm run contract:build`; SHARED-CHANGES `SWEEP-JOIN #1`. |
| REF-01 | r2-1 | At 320 px a number with a leading zero scrolls before the field blurs. | the lead's log, 14 Oct, round 2; the report text is not in the task file | FIXED, web `6ab8292`: PhoneInput's opt-in `snug` prop (country picker 8 px narrower, 12 px side padding below 360 px) used by the /join form, with 16 px card padding below 360 px; nothing changes from 360 px up. Proof: `scripts/check-join-phone-320.mjs` in Chromium at 320 px: before scrollWidth 136 over clientWidth 124 (FAIL, scrollLeft 11), after 140 over 140, no scroll (OK); screenshot checked. |
| EMAIL-02 | JSDoc | The contract summary still says "409 when RESEND_API_KEY is unset"; the relay answers otherwise. Needs a SHARED-CHANGES row. Not a verifier finding. | the lead's log, 14 Oct, merge note; EMAIL-02 had no verifier session; the report text is not in the task file | FIXED, backend `c62eb21`: the start route's summary now says 409 when no email sender is set up (neither WAWU ID's relay nor the Hub's own RESEND_API_KEY), or in production no HUB_PUBLIC_URL, which is what `missingSetting()` does. `contract/openapi.json` regenerated; SHARED-CHANGES `SWEEP-JOIN #1`. |

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

## Owner sign-off

_Owner: date, and "go" or what blocks it._
