---
id: SWEEP-JOIN
title: Join sweep: the low findings of /join, referral codes and campaign mail
owner: YOU
area: SWEEP
order: 249
priority: launch
repo: all
type: backend-refactor
status: verifying
depends_on: []
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-JOIN · Join sweep: the low findings of /join, referral codes and campaign mail

## Current state

As of 21 Oct 2026, builder done (Sonnet builder, T1). Status: verifying.
- **Branches:** backend `wmt/SWEEP-JOIN` `c62eb21` on `origin/main` `2b461b5`; web `wmt/SWEEP-JOIN` `6ab8292` on `origin/main` `5b45d65`; this record on mobile `wmt/SWEEP-JOIN` from `origin/main` `905e391f`.
- **Rows:** all five fixed, none ruled "no". D3, D4, D5 and the EMAIL-02 JSDoc row are in backend `c62eb21`; r2-1 is in web `6ab8292`. Each row's proof is in the table below.
- **One existing assertion changed (sweep rule, 17 Oct):** `waitlist-referral.contract.spec.ts`, "does not count a second payment kept for a refund as a place", asserted that a person starting a second time under a limit-1 code is told the code is full (`applied` false). That was the D3 defect, so the line is now `true`; the rest of that test is unchanged and passes.
- **Settings added (PROVISIONAL marker REFERRAL-PROBE-LIMITS):** `REFERRAL_MISS_LIMIT` 30 and `REFERRAL_MISS_WINDOW_MS` 10 minutes in `src/waitlist/waitlist-config.ts`. The lead may change them.
- **Shared change filed:** SHARED-CHANGES row `SWEEP-JOIN #1` (the contract's text and one documented 429).
- **Open findings:** none known. The verifier checks each row (docs/roles/VERIFIER.md).
- **Next:** a verifier session; then the lead merges the backend and web branches and regenerates the mobile contract once.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SWEEP-JOIN.md](history/SWEEP-JOIN.md).

## Owner sign-off

_Owner: date, and "go" or what blocks it._
