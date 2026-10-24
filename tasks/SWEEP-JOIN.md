---
id: SWEEP-JOIN
title: Join sweep: the low findings of /join, referral codes and campaign mail
owner: YOU
area: SWEEP
order: 249
priority: launch
repo: all
type: backend-refactor
status: review
depends_on: []
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-JOIN · Join sweep: the low findings of /join, referral codes and campaign mail

## Current state

As of 21 Oct 2026, verifier re-check of round 2: PASS (Sonnet verifier, T1). Status: review.
- **Branches:** backend `wmt/SWEEP-JOIN` `6b66ea2` (round 1 `c62eb21`) on `origin/main` `2b461b5`; web `wmt/SWEEP-JOIN` `d57c0fd` (round 1 `6ab8292`) on `origin/main` `5b45d65`; this record on mobile `wmt/SWEEP-JOIN`.
- **Rows:** all five fixed, none ruled "no" (table below). Round 2 answers the verifier's M1, L1 and L2; L3 is left as a low.
- **M1 fixed (backend `6b66ea2`):** both held-place queries compare with `${since}::timestamp`, so the 30 minute hold no longer depends on the database session zone. New `waitlist-referral-zone.contract.spec.ts` (Pacific/Auckland and America/Los_Angeles sessions, zone proved with `SHOW timezone`): red before the change in both zones, green after.
- **L1 fixed (`6b66ea2`):** the code now matches the claim. Unpaid starts that share a phone or an email, or are linked through a chain of such starts, are one person (`referral-people.ts`, pure function, own spec). The comment and the abuse spec title say so. Someone who changes both phone and email every start is still many people; the per-address throttle bounds that.
- **L2 fixed (web `d57c0fd`):** a 429 with reason `referral_attempts_limited` shows the Hub's sentence (minutes), with the same words kept in the client for when the Hub sends none. Other 429s unchanged.
- **L3 left as a low:** past 20,000 tracked addresses `dropIdle` scans the whole map per miss and live entries are never dropped; it needs a hard cap (drop the oldest), more than a two-line change. Only reachable by one process seeing more than 20,000 addresses inside 10 minutes.
- **One existing assertion changed in round 1 (sweep rule):** `waitlist-referral.contract.spec.ts` line 623, `false` to `true`, the D3 defect.
- **Verifier re-check:** M1, L1 and L2 closed (report below). Open: blocker 0, high 0, medium 0; two lows for the next sweep (L3, and LR1 below).
- **Next:** the lead merges the backend and web branches and regenerates the mobile contract once (SHARED-CHANGES `SWEEP-JOIN #1`).

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
| REF-01 | D3 | Hold spam: the places of a limited code can be held up by repeated holds. | the lead's log, 14 Oct; the report text is not in the task file | FIXED, backend `c62eb21` and `6b66ea2`: held places are counted as people, never starts: unpaid starts that share a phone or an email, or are linked through a chain of such starts, are one person (round 2, L1; the round 1 rule of the larger of two counts is replaced), and a person's own earlier unpaid starts are left out when they start again. Round 2 (M1) also made the hold window independent of the database session zone. Proof: `waitlist-referral-abuse.contract.spec.ts` (4 D3 tests, real database) is red on `origin/main` (5 of 6 fail) and green on the branch; the team's list counts the same way. |
| REF-01 | D4 | Code probing: a guessable free code can be found with the public check, and nothing slows someone trying codes one after another. | the lead's log, 14 Oct; the report text is not in the task file | FIXED, backend `c62eb21`: an address that tried 30 codes we do not have in 10 minutes (settings) is refused on the check and on a registration that carries a code, 429 `referral_attempts_limited` with a plain sentence (the web shows that sentence since `d57c0fd`); a code we have never counts, a registration with no code is never refused by it. Proof: three service tests and one HTTP test in the same spec; the HTTP test gets 200 instead of 429 on `origin/main`. |
| REF-01 | D5 | `flutterwaveConfig` is optional in the contract. | the lead's log, 14 Oct; the report text is not in the task file | FIXED (text only), backend `c62eb21`: the 200 of `POST /waitlist/registrations` now says exactly one of `flutterwaveConfig` and `completed` is present (`flutterwaveConfig` whenever `amountKobo` is above 0). The field stays optional because the free path has none. `contract/openapi.json` regenerated with `npm run contract:build`; SHARED-CHANGES `SWEEP-JOIN #1`. |
| REF-01 | r2-1 | At 320 px a number with a leading zero scrolls before the field blurs. | the lead's log, 14 Oct, round 2; the report text is not in the task file | FIXED, web `6ab8292`: PhoneInput's opt-in `snug` prop (country picker 8 px narrower, 12 px side padding below 360 px) used by the /join form, with 16 px card padding below 360 px; nothing changes from 360 px up. Proof: `scripts/check-join-phone-320.mjs` in Chromium at 320 px: before scrollWidth 136 over clientWidth 124 (FAIL, scrollLeft 11), after 140 over 140, no scroll (OK); screenshot checked. |
| EMAIL-02 | JSDoc | The contract summary still says "409 when RESEND_API_KEY is unset"; the relay answers otherwise. Needs a SHARED-CHANGES row. Not a verifier finding. | the lead's log, 14 Oct, merge note; EMAIL-02 had no verifier session; the report text is not in the task file | FIXED, backend `c62eb21`: the start route's summary now says 409 when no email sender is set up (neither WAWU ID's relay nor the Hub's own RESEND_API_KEY), or in production no HUB_PUBLIC_URL, which is what `missingSetting()` does. `contract/openapi.json` regenerated; SHARED-CHANGES `SWEEP-JOIN #1`. |

## Verifier report (round 2 re-check)

Verifier: Sonnet, T1, 21 Oct 2026. Backend `6b66ea2`, web `d57c0fd`, mobile `b520ec80`. Own database, own worktrees, nothing pushed to the backend or web.

**Verdict: PASS.**

| Item | Result | Evidence |
|---|---|---|
| M1 session zone | closed | Both held queries use `${since}::timestamp`. The Pacific/Auckland repro (`ALTER DATABASE ... SET timezone`) now passes the referral, abuse and admin specs: 3 suites, 53 tests, EXIT 0 (`auckland`). `waitlist-referral-zone.contract.spec.ts` (Auckland and Los Angeles, zone proved with `SHOW timezone`): green on `6b66ea2`, red on `c62eb21` (2 of 4 fail, the hold tests; `zone-old`). |
| L1 people counting | closed | `referral-people.ts` is a union-find over phone and email nodes. Checked: 2000 random sets against a brute-force merge, with and without a requester, all equal. In the real database: a phone fix then an email change is one person (list 1; a stranger gets the second place; a third is told `full`; the same person starting again is never blocked by their own starts); two people sharing neither are two (limit 1: the second is `full`). Comment in `referral.service.ts` and the abuse spec title now match what they assert. Probe kept in the verifier's scratch folder. |
| L2 web 429 words | closed | `refusalOf` in `src/lib/api/waitlist.ts`: only `e.code === "referral_attempts_limited"` takes the Hub's sentence (fallback words kept in the client, in minutes). In Chromium on /join, a 429 with that reason shows the sentence and not "Busy right now"; a plain throttler 429 still shows "Busy right now. Wait a few seconds". |
| L3 | accepted as a low | The reason in the record holds: it needs more than 20,000 distinct addresses with a live miss inside 10 minutes in one process. |

Runs (each with its EXIT line in the verifier's scratch logs): waitlist specs (17 files) plus the new `referral-people.spec.ts` and the 3 email specs, none importing the Fintava double: 20 suites, 298 tests, EXIT 0 (`wl2`). `npm run test:protected` after `db:seed`: 253/253, EXIT 0 (`protected`). Backend `tsc --noEmit` EXIT 0; eslint (no fix) on the 5 changed files EXIT 0; `gates/run.py` 0 fail, 131 warn, 88 accepted, GATES PASSED, EXIT 0; `check_baseline.py` EXIT 0 (the diff touches no gate or baseline). Web: `check:copy` clean, `typecheck`, `next lint`, `check:site-mode` (190 passed) all EXIT 0; the builder's /join 320 px check OK (`join320`).

### Findings

**LR1 (low, differs, by design and written in `countPeople`):** a start that carries one held person's phone and another held person's email is admitted even when the code is full, joins those two into one person, and so frees a place for the next stranger: on a limit-2 code, X, Y, the linker and one stranger were all admitted (probe `C`). It needs another two people's details, and a linker whose phone or email is already paid is refused at payment. No fix needed now; if the lead wants it shut, count a requester's start that links two or more held people as a separate start instead of merging them.

**L3 (low, carried):** `referral-probe.ts` `dropIdle`, as in the builder's note. Related and also only at high volume: `usage` now reads the distinct phone and email pairs of a code's unpaid starts and counts them in the process while the code's row is locked; the throttle bounds the pairs.

Environment notes: port 7860 was still held by a listener that is not the verifier's; the mock WAWU ID ran on 7861 and the web dev server on 7862.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SWEEP-JOIN.md](history/SWEEP-JOIN.md).

## Owner sign-off

_Owner: date, and "go" or what blocks it._
