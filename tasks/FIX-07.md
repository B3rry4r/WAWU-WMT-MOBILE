---
id: FIX-07
title: Search answers 400, not 500, for a NUL in the query
owner: YOU
area: FIX
order: 188
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
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

Verifier, 8 Oct 2026. An independent session that wrote none of FIX-07's code. Checked: wawu-backend `wmt/FIX-07` `4f4e4ee` on `origin/main` `3041887` (main did not move between the start and the end of this check), mobile `wmt/FIX-07` `a333743`. Fresh detached worktrees, each with its own `npm ci`: `/home/user/wt/vf07b` (branch), `/home/user/wt/vf07main` (main), `/home/user/wt/vf07t` (trial merge: a local merge commit `0ceaa90` of `4f4e4ee` into `origin/main`, tree identical to `4f4e4ee`, never pushed, deleted) and `/home/user/wt/vf07m` (mobile). Databases `vf07_sweep_test`, `vf07_spec_test`, `vf07_prot_test` and `vf07_full_test`, all dropped. Ports: main's Hub :5551, the branch's Hub :5552, mock WAWU ID :5553, the protected suite's own mock :5554; :4001 only inside a private network namespace. No call went to a wawuafrica.com host, Fintava, Nuvion, Flutterwave or an AI provider (the provider keys were empty, and the other-routes probe below skipped the bills, wallet, assistant and money-movement routes). Evidence: the lead's `scratchpad/vf07/`.

**Diff against the builder's report.** `git diff --stat 3041887..4f4e4ee` is exactly the three files listed (388 insertions, no deletions). No local copy of anything main has: the rule imports main's `isCleanText` from `src/admin/legal-documents/policy-input.ts` rather than copying it.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npx tsc --noEmit` 0; eslint on the 3 changed files 0; gates 16 fail, 58 warn, 76 accepted (887 files scanned), every fail and warn line identical to main's (885 files); `check_baseline.py` ok; tripwire: no added line matches; `npm run contract:build` leaves `contract/openapi.json` byte-equal to main's; mobile `npm run check` exit 0 on `a333743` and again with this report (76 suites, 1,377 tests, gates 0 fail on 346 files). `tsc-b.log`, `eslint-b.log`, `gates-b.txt`, `gates-main.txt`, `contract-build.log`, `mcheck-before.log`, `mcheck-after.log` |
| V2 recorded sweep | passed | My own script (`sweep.py`, `analyze.py`). Main's Hub and the branch's Hub, both built, on one database: prisma seed plus 10 content pieces (one pending; titles and descriptions with `%`, `_`, `\`, accents, emoji, a tab, U+0001, U+0007, U+001F, U+007F, U+200B, U+FFFD, U+FFFE, U+FFFF), 4 more creators (one with no CreatorState, one whose bio holds U+0001 and U+007F) and 2 blocks (the buyer blocked one creator, another blocked the buyer), so content, creators, closest and suggestions all return rows (communities never has rows). 2,156 paths x 4 callers (anonymous, buyer, creator, malformed token) = 8,624 requests per build, each from its own `X-Forwarded-For` so no answer is a 429. Paths: 190 terms on 9 `tab` values (none, all, content, creators, communities, `bogus`, empty, `ALL`, `schools`), on closest and on suggestions; the terms put a NUL in every position (start, middle, end, at character 100 and 101, after `%`, `_`, `\`, a tab, emoji, `%C0%80` and U+FFFD), double and triple it (`%00%00`, `%%00`), and cover `%2500`, `%u0000`, overlong NUL (`%C0%80`, `%E0%80%80`, `%F0%80%80%80`), U+FFFD, U+FFFE, U+FFFF, every control character U+0001 to U+001F and U+007F alone and between letters, broken UTF-8 and surrogates as bytes, and `q` of 100, 101, 1,000, 5,000 and 12,000 characters; plus 66 more paths (repeated `q`, `q[]`, `q[0]`, `q[a]`, `q.x`, `Q`, `q` with no value or no `=`, `q` with a bad, repeated or NUL `tab`, unknown keys, `__proto__`, `constructor`, `toString`, `;`, missing `q`, trailing slashes, upper case, `%00` in the path). Main asked twice: 8,624 of 8,624 identical. Main against the branch: 7,692 byte-identical (4,260 x 200, 3,424 x 400, 8 x 404; 1,646 of the 200s carry rows; 310 paths answer the buyer differently from anonymous, so blocks and unlock state were exercised). 932 differ, every one exactly the refusal body: 784 were 500 (196 paths: `/search` with no tab 43, all 36, content 37, creators 36, closest 41, and `/search/`, `/SEARCH` and `/search/closest/`) and 148 were the `tab=communities` 200 (37 paths, decision 1). Nothing else differs. Branch 500s: 0. The branch's Hub logged no ERROR line through the sweep and the fuzz below. `sweep.json`, `sweep-summary.txt`, `sweep-analysis.json` |
| V4 odd input | passed | Every BMP code point (all 65,536; the 2,048 surrogates sent as their 3-byte form) and 4,084 astral ones, alone and between two letters, on `/search?tab=all` (both queries run) and on closest: 278,480 requests per build. Branch: 278,476 x 200 and 4 x 400 (the refusal), only for U+0000. Main: the same 278,476 x 200 and 4 x 500, only for U+0000. So NUL is the only character Postgres refuses here (the database is UTF8, and a JS string always reaches the driver as valid UTF-8, a lone surrogate as U+FFFD). No other `q` answers 500 on the branch. A surrogate cannot arrive in a query string: sent as bytes it arrives as three U+FFFD and is searched for (200 on both builds, byte-identical). Closest with up to 8,000 whitespace-separated tokens: 200 on both (2.6 s each, see the note below); past Node's header limit, 431 on both. `allchars-branch.json`, `allchars-main.json` |
| V3 protected | passed | `scripts/protected-routes/run.sh --fresh HEAD` on the trial merge (code `0ceaa90`, lock `origin/main` `3041887`): 253/253, all 244 required (`protected.log`). A first attempt pointed the suite at my own mock on :5553, whose internal service key differs from the suite's pinned empty one, and 28 WAWU ID calls answered 502 (`protected-run1-wrongmock.log`); with a free port the suite started its own mock and ran green. A harness mistake of mine, not a code fault. |
| V3 full suite | passed (no failure from this task) | The trial merge `0ceaa90` in a private network namespace (copies of the lead's `t3ns/ns2.sh` and `inner2.sh` with my paths, my own mock on :4001 inside it, a fresh migrated and seeded `vf07_full_test`), `--testTimeout=60000` for the machine's load: 181 suites, 179 passed; 4,665 tests passed, 4 skipped, 15 failed. The 15: 11 `hub-rate-limits` (the namespace has no non-loopback interface, as expected; 22/22 on the host, next row) and 4 `fintava-stall` timing tests (a 300 ms window, load average 4 to 6 at the time), which pass 120/120 run alone, twice. Neither touches search. A first attempt with default timeouts was stopped after 7 suites, all of them timeouts under load (`ns/run1-aborted-full.txt`). `ns/full.txt`, `fintava-stall-alone-1.log`, `fintava-stall-alone-2.log` |
| V3 `hub-rate-limits` on the host network | passed | 22/22 on the trial merge (`ratelimits-host.log`). |
| Mutants | 10 of 11 killed | My own 11, each applied to `vf07b`, `src/search-response` specs run (62 tests), the file restored byte for byte, tree clean after: NUL only at the start (9 tests fail); only the first 50 characters checked (**survived**); U+FFFD refused too (3); control characters refused too (4); lone low surrogate accepted (5); message one letter off (8); `search` checks `tab` instead of `q` (7); communities tab skipped (3); closest checks only its first token (1); closest refuses only anonymous callers (1); search refuses only signed-in callers (7). `mutants.json`, `mutant-V*.log` |
| V9 live seam | NOT RUN | No app screen calls `/search` (nothing in mobile `src/` but the generated types). Unblocked when EXPLORE-02 (All creators and search) calls `GET /search` from the app. |

**Capability checks.**
- `q=%00`, `q=a%00b` and a lone surrogate answer 400 naming `q` on every tab: passed. Over real HTTP for NUL on no tab, all, content, creators and communities and on closest, for all four callers. A lone surrogate cannot arrive over HTTP (V4); the spec drives the handlers with one and they refuse it.
- Every other `/search` answer is byte-identical to main on the same data: passed (V2).
- Protected routes 253/253: passed (V3).

**Findings.**
- No defect.
- **Spec gap (minor, not a defect):** the mutant that checks only the first 50 characters survives. Every NUL in the spec sits within the first 10 characters, while `/search` takes 100 and closest has no limit. The behaviour is right live: a NUL at character 100, and after 1,000 and 5,000 characters on closest, is the refusal in the sweep. A spec case with a NUL at the end of a 100-character `q` (search) and of a 5,000-character `q` (closest) would pin it.
- **The rule against SCHOOLS-04's (`wmt/SCHOOLS-04` `807a6b8`, not merged): they agree, but merged they are two copies.** Both call the same predicate, main's `isCleanText`. SCHOOLS-04's `searchTab` trims, returns `[]` for a blank term and refuses a non-blank one that fails `isCleanText`; FIX-07 lets a blank term through and refuses a non-blank one that fails `isCleanText`. Trimming never removes a NUL or a surrogate, so for every non-blank term both refuse exactly the same strings with the same sentence. `git merge-tree` of the two branches is clean, and in the merged tree (`e86d9e5`) the check runs in the controller (FIX-07) and again in `SchoolsPublicService.searchTab` (SCHOOLS-04), and the sentence is written in three places (`UNSEARCHABLE_QUERY_MESSAGE`, the literal in `searchTab`, and `IsCleanText`'s `$property` message). `searchTab` has one caller, `SearchResponseService.search`, which only runs after the controller's refusal, so SCHOOLS-04's check becomes unreachable code free to drift. What should happen: one shared helper, FIX-07's `refuseUnsearchableQuery` / `isSearchableQuery` in `src/search-response/searchable-query.ts`, which already wraps the one predicate. SCHOOLS-04 owns removing its copy: it is `building` (D2, D3 open) and will merge after this task, so in its next round `searchTab` keeps only its blank-term `[]` and drops its own `isCleanText` check and sentence (or calls `refuseUnsearchableQuery`), with a spec that `GET /search?tab=schools&q=%00` answers this task's body. If SCHOOLS-04 merges first instead, this task removes the copy when it merges main: whichever merges second.
- **Decisions** (the builder's four):
  1. `tab=communities` 200 to 400: agree. It is the only non-500 answer that changes (148 of 8,624, all `tab=communities` with a NUL); the lock holds no NUL, `%00` or surrogate; the web's `src/lib/api/search.ts` sends `/search?q=` with no `tab`, and the app does not call `/search`. It makes capability check 1 true on every tab and covers EXPLORE-05's communities search before it exists, where a NUL would otherwise become a 500.
  2. Suggestions untouched: agree. `GET /search/suggestions` has no query DTO and reads no `q`, so a `q` there is ignored (all 195 suggestions paths x 4 callers byte-identical, `q=%00` included); refusing a parameter the route does not read would change a 200 on a protected route. Closest, the other route that takes `q`, is covered.
  3. A blank `q` stays a search: agree. `q=%20` answers 200 on main and must stay byte-identical on a protected route, and it holds nothing the NUL rule is for. (SCHOOLS-04 treats a blank term as no term; that route is new.)
  4. A NUL with another fault keeps its old 400: agree. Every such path in the sweep is byte-identical to main and still names a real fault (`%00` x 101: the 100-character message; `tab=bogus`: the `tab` message; `q[]=%00`: `property q[] should not exist`; `q=%00&q=a`: main's own odd length message, unchanged).
- **Not this task: 23 other GET routes still answer 500 for a NUL on main.** Built main's Hub on the same database; each NUL request was compared with the same request carrying clean text, and every one below is clean-text 200 or 404 and NUL 500 (Postgres `22021`), `otherroutes.json`. For a follow-up:
  - Public, anonymous: `GET /api/hub/shop/products?search=%00` (and `?subcategory=%00`), `GET /api/hub/shop/%00`, `GET /api/hub/creators?category=%00`, `GET /api/hub/learn/guides?country=%00`, `GET /api/hub/users/public/%00`, `GET /api/hub/content/public/creator/%00/content`.
  - Signed in (any user token): `GET /api/hub/events?host=%00` (events search), `GET /api/hub/me/purchases?q=a%00b` (purchases search; `q=%00` alone is caught by its 2-character minimum), `GET /api/hub/content?category=%00`, `GET /api/hub/feed?category=%00`, `GET /api/hub/feed/entries?category=%00`, `GET /api/hub/services?category=%00`, `GET /api/hub/services/mentors?category=%00`, `GET /api/hub/users/%00/public-profile` (also `/profile-fields` and `/content`), `GET /api/hub/legal/requests/%00` (also `/contract`).
  - Admin (any admin token): `GET /api/hub/admin/creators?q=%00`, `GET /api/hub/admin/finance/wallets?q=%00`, `GET /api/hub/admin/finance/wallets/%00`, `GET /api/hub/admin/shop/products?search=%00`, `GET /api/hub/admin/payments/receipts?txRef=%00` (also `?flow=%00`).
  - Not 500: the professional directory, admin events and admin schools (uuid validation, 400), the inbox (opaque cursor, 400), policies (404). The money searches (`/money/transactions?q=`, `/money/recipients?q=`) strip a NUL in code (`transaction-history.service.ts`, `recipient-query.ts`) but answer 409 `wallet_not_open` before any query for every seeded account, so they were not exercised live. The code base has no single NUL rule (stripped in money and AI text, refused in legal documents, the assistant and profile audience, replaced by U+FFFD in the Fintava webhook); the follow-up should pick one.
  - Two 500s that are not about NUL, seen on the way: `GET /api/hub/shop/categories/business/subcategories` (any category outside the enum) and `GET /api/hub/admin/shop/orders` with an unknown `fulfilment` or a non-numeric `page` or `perPage` (Prisma validation errors).
- **Not this task, for a follow-up: `GET /search/closest` has no length limit.** `ClosestSearchQueryDto` has no `MaxLength`, though `SearchQueryDto` caps `q` at 100 for exactly this reason (an unbounded ILIKE scan is cheap, arbitrary database work). A `q` of 8,000 tokens (`a+a+...`, 16 KB) answers 200 after 2.6 s on 13 content rows, on main and on the branch alike; each token adds three ILIKE conditions. No 500, so not a FIX-07 defect.

Status: `review` (no open defect).

## Lead merge note (7 Oct 2026)

Merged after the independent verifier (report 090275f) and backend PR #85 (merge 965280e): /search on every tab and /search/closest refuse a NUL with 400 instead of 500; the sweep (2,156 paths x 4 callers, and all 278,480 code points) changed only former 500s plus tab=communities with a NUL; protected suite 253/253. Follow-ups filed as FIX-17: 23 other GET routes that still answer 500 for a NUL, two enum and paging 500s, and no length cap on closest. Spec gap noted: a NUL past the 50th character (right live).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
