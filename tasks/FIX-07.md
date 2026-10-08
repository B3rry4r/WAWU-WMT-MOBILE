---
id: FIX-07
title: Search answers 400, not 500, for a NUL in the query
owner: YOU
area: FIX
order: 187
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-07 · Search answers 400, not 500, for a NUL in the query

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/SCHOOLS-04.md` (both verifier reports: `GET /search?q=%00`)

## Goal

`GET /search?q=%00` answers 500 on the tabs all, content and creators, on main and every branch (Postgres refuses a NUL in a text parameter). `tab=schools` already answers 400. A bad query is the caller's fault and gets a 400 naming `q`, never a 500.

## Scope

Refuse a `q` with a NUL (and any other character Postgres cannot take in text) with 400 naming `q` on every `/search` tab and on suggestions, before the query runs. `/search` is a protected route: every answer that is not a 500 today stays byte-identical, and the protected suite's lock changes only if it captured the 500 (then the PR needs the relock-approved label).

## Capability checks

- [ ] `q=%00`, `q=a%00b` and a lone surrogate answer 400 naming `q` on every tab.
- [ ] Every other `/search` answer is byte-identical to main on the same data (a recorded sweep).
- [ ] Protected routes 253/253.

## Builder report

Builder, 8 Oct 2026. wawu-backend `wmt/FIX-07` `4f4e4ee` (from `origin/main` `3041887`, which has not moved); mobile `wmt/FIX-07` (from `origin/main` `4faa136`). Lead-owned fix.

**Built.** `GET /search` (every tab) and `GET /search/closest` refuse a `q` holding a NUL or a lone UTF-16 surrogate with `400 {"statusCode":400,"message":"q must have text in it, with no null characters or broken characters","data":null}`, thrown in the handler after the global ValidationPipe and before any query runs (was 500 on tabs all, content, creators, no tab, and on closest). The rule is `isCleanText` (`src/admin/legal-documents/policy-input.ts`), the one SCHOOLS-04's `tab=schools` uses, less its blank half, and the text is word for word SCHOOLS-04's, so every tab agrees.

**Files (backend).** `src/search-response/searchable-query.ts` (new: `isSearchableQuery`, `refuseUnsearchableQuery`), `src/search-response/search-response.controller.ts` (one call in `search` and one in `closest`, line comments only: the swagger plugin copies controller JSDoc into the contract), `src/search-response/tests/searchable-query.contract.spec.ts` (new, 41 tests). None of SCHOOLS-04's files touched; `git merge-tree` with `origin/wmt/SCHOOLS-04` is clean, and with every other `origin/wmt/*` branch no conflict comes from these files. Mobile: this file, `docs/LOG.md`, regenerated `tasks/INDEX.md` and `docs/PROGRESS.md`.

**The lock (checked before changing anything).** `.pipeline/protected-registry.json` on `origin/main` holds no NUL, `%00` or surrogate escape anywhere; its search probes are `GET /search?q=Protected` (no tab), `GET /search/closest?q=Protectd suite` and `GET /search/suggestions` (no query), all 200. So the lock is unchanged and no relock is needed.

**Capability checks.**
- `q=%00`, `q=a%00b` and a lone surrogate answer 400 naming `q` on every tab: spec, exact body, for `%00`, `a%00b`, `%00%20`, `makeup%00`, `%20%00%20` on no tab, all, content, creators, communities, anonymous and signed in, and on closest; the service spy is never called. A lone surrogate cannot arrive in a query string (Express 5's parser turns `%ED%A0%80` into three U+FFFD, `%uD800` stays literal text), so the spec calls the handlers as Nest does with `\uD800`, `a\uD800b`, `\uDC00`, `x\uDBFF`, `\uDC00\uD800`: same 400 on every tab and on closest, service never called; a whole pair is searched. On the built Hub, `GET /search?q=%00` answers the 400 above.
- Every other answer is byte-identical to main on the same data: recorded sweep, main's Hub (`3041887`, :5511) and this branch's (:5512) on one seeded database (prisma seed plus 9 content pieces, 5 profiles, 2 blocks with `%`, `_`, `\`, accents, emoji, a pending piece, a creator with no state), 504 paths (54 terms x 8 `tab` values incl. none, `bogus`, empty, `ALL`; closest per term; suggestions with and without `q`; repeated, bracketed and unknown keys) x 5 callers (anonymous, buyer, two creators, a malformed token) = 2,520 requests per build, main asked twice. Main answered twice the same 2,520 of 2,520. 2,365 byte-identical (1,410 x 200, 955 x 400; 583 of the 200s carry rows; 69 paths answer the buyer differently from anonymous). 155 differ, every one a NUL term answered with exactly the refusal: 130 were 500, 25 were the `tab=communities` 200 (decision 1). Branch 500s: 0. Evidence: `scratchpad/bf07/sweep.json`, `sweep.log`, script `bf07/py/sweep.py`.
- Protected routes: `scripts/protected-routes/run.sh --fresh HEAD` (code `4f4e4ee`, lock `origin/main` `3041887`): 253/253, all 244 required (`bf07/protected2.log`).

**Mutants** (each applied, `src/search-response` specs run, `git restore`): 10 of 10 killed. No refusal in `search` (7 tests fail); none in `closest` (3); rule always accepts (20); blank `q` refused too (5); NUL only (9); surrogate only (11); only `''` counts as blank (4); message names another field (8); refusal after the search started (2); 422 instead of 400 (9). `bf07/mutants.json`.

**Checks.** `npx tsc --noEmit` 0; eslint clean on the 3 files; `src/search-response` 62/62 (41 new, 21 existing); full backend suite in a private network namespace (mock WAWU ID on its own :4001): 180 of 181 suites, 4,669 passed, 4 skipped, the 11 failures all `hub-rate-limits` (needs a non-loopback interface), which passes 22/22 on the host network; gates 16 fail, 58 warn, 76 accepted, the same fail and warn lines as `origin/main`; `check_baseline.py` ok; tripwire: no added line matches; `npm run contract:build` leaves `contract/openapi.json` unchanged, and mobile `contract/openapi.json` already equals it (`SOURCE_COMMIT` `3041887`), so `npm run api` was not needed and no SHARED-CHANGES row; mobile `npm run check` exit 0 before and after (76 suites, 1,377 tests, gates 0 fail). Staged diffs scanned for key-shaped strings: none.

**Decisions** (Default (agent), owner may override):
1. `tab=communities` is refused too. That tab runs no query, so a NUL there answered 200 with three empty lists; capability check 1 names every tab, so it is now the same 400. It is the only non-500 answer that changes; the lock does not capture it and the web never sends `tab` (`src/lib/api/search.ts` calls `/search?q=` only). Any tab added later (EXPLORE-05's communities search) is covered because the refusal runs before the service.
2. "Suggestions" read as `GET /search/closest`, the other route that takes `q` (500 before). `GET /search/suggestions` takes no `q` (no DTO, the handler reads none), so a `q` sent there is ignored and still 200, as the spec checks; refusing it would change a 200.
3. A blank `q` (`%20`) stays a search, 200, as on main; only `isCleanText`'s NUL and surrogate halves apply.
4. A `q` with a NUL and another fault (over 100 characters, repeated, a bad `tab`, an unknown key) keeps the 400 it had: the pipe answers first.

**NOT RUN.** V9 from the app: no app screen calls `/search` yet; unblocked when EXPLORE-02 (search screen) calls it. The live droplet answer: unblocked when this branch is merged and deployed (`GET /api/hub/search?q=%00` answers 400 with the body above); agents do not call the live host.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
