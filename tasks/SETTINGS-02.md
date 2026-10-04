---
id: SETTINGS-02
title: About, terms and privacy policy
owner: DEV
area: SETTINGS
order: 93
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [SHELL-01, UI-02]
decisions: [R-1, R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [Z9, Z10, Z11]
---
# SETTINGS-02 · About, terms and privacy policy

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py Z9 Z10 Z11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for Z9, Z10 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

The bank name and licence line come from config, filled in by the owner (R-1). Terms and Privacy text are the owner's legal text, served by the backend with their date; the canvas text is layout only (owner input).

## Artboards

- **Z9 · About**: About WAWU: Version 2.4.0; description '...get paid for what they know, with a real bank account built in.'; 'Banking by' and the bank name, then the licence line, both from config filled in by the owner (R-1, BRIEF Z9); Contact support support@wawuafrica.com; Rate the app.
- **Z10 · Terms**: Terms, Updated 1 September 2026: Using WAWU (18 or over, true details, one account per person); Money (payments move through your WAWU wallet, held at the bank named by config (Loma Bank, BRIEF Z10); fees shown before you pay); What you sell (you own your work; WAWU may show it to buyers).
- **Z11 · Privacy policy**: Privacy policy, Updated 1 September 2026: What we collect (details, BVN check result, in-app activity); What we never do (sell data, show BVN/NIN/balance); Your choices (download or delete from Privacy).

## Brief changes (build these, not the canvas)

- **Z9**: "Banking by" + the bank name slot (sample "Loma Bank"), and the licence line as a slot filled from config by the owner (rule 7). (Why: R-1.)
- **Z10**: "held at Loma Bank" (bank name slot). The terms text itself is the owner's legal text and will be replaced; keep the layout. (Why: R-1.)

## Capability checks

- [ ] **Z9**: a user can contact support; rate the app; open Terms (-> Z10).
- [ ] **Z10**: a user can read; go to Privacy policy.
- [ ] **Z11**: a user can read.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **Z9**: n/a.
- **Z10**: served. Missing: Content itself is a legal matter; the board text is a placeholder summary.
- **Z11**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- Z9: 'Version 2.4.0'
- Z9: 'Banking by Fintava MFB'
- Z9: 'Licensed by the CBN'
- Z9: 'a real bank account built in'
- Z9: support@wawuafrica.com (bundle rule says emails stay @wawu.africa)
- Z10: 'Updated 1 September 2026'
- Z10: 'You need to be 18 or over'
- Z10: 'One account per person'
- Z10: 'held at Fintava MFB'
- Z10: 'Fees are shown before you pay'
- Z11: 'Updated 1 September 2026'
- Z11: 'your BVN check result' is collected
- Z11: never show 'your BVN, NIN or balance'

## Designer notes (⚠, unresolved)

- None.

## Builder report

**Files.** Mobile: `src/features/about/` (`api.ts`, `AboutFrame.tsx`, `AboutScreen.tsx`, `PolicyScreen.tsx`, `format.ts`, `links.ts`, tests), routes `src/app/about.tsx`, `terms.tsx`, `privacy-policy.tsx`, regenerated contract and types, `BACKEND_GAPS.md` G-140 to G-143, `SHARED-CHANGES.md` (SETTINGS-02 #1 to #3, R1), `docs/LOG.md`. Backend, branch `wmt/SETTINGS-02` (worktree `/home/user/lanes/s02/wawu-backend`, uncommitted): `LegalDocument` table and migration, `src/about/` (public `GET /about`, `GET /policies/:slug`), `src/admin/legal-documents/` (superadmin `PUT /admin/policies/:slug`), `app.module.ts` (two imports), `.env.example`, `contract/openapi.json`.

**Capability checks.** Z9 contact support, rate, open Terms and Privacy policy; Z10 read and go to Privacy policy; Z11 read: jest `src/features/about/__tests__` (22 tests, real fetch seam, mail and store links through a stubbed `openLink`), plus a web build against a local Hub (own DB `s02_dev`, Hub :3802, mock WAWU ID :4802, web :8802) with screenshots light and dark beside `render_design.py Z9 Z10 Z11` in `build/s02_compare/`. Values on screen: version from `expo-constants`, bank, licence line, support address and legal text from the Hub; nothing typed in a screen. States captured in `build/s02_shots/state-*`: loading, not available yet, offline, server error, long text scrolled, no licence line, no support address, long licence line wrapping whole. Backend: `src/about/tests/about.contract.spec.ts` (7 tests: nothing served until filled in, 404 on an unknown slug, superadmin only, validation, round trip with date, config read).

**Counts.** Mobile `npm run check` after: exit 0, tsc 0, lint 0 errors, 38 suites / 688 tests, gates 9 / 182 files / 0 fail, task check 206 tasks. Backend after: tsc 0; contract 7/7 new; protected and route-shadowing 312/313 (the one failure, `POST /payments/hosted-link`, is identical on a clean main worktree); gates 16 fail / 24 warn / 76 accepted, identical on main (none in my files); baseline check passes. Before-counts for mobile were not recorded before editing (NOT RUN).

**Defaults (agent), owner may override.**
1. Description reads "Who Made This helps African creators and professionals get paid for what they know." The canvas's "with a real bank account built in" is a claim about the system and is listed as not-a-fact, so it is left out.
2. Z9 and Z10 draw no way to Terms and Privacy policy, but the checks need them: Z9 has a second card (Terms, Privacy policy) and Z10 a "Read the privacy policy" button. Settings (SETTINGS-01) still adds its own rows as Z2 draws them. Both extras are the only differences from the render besides R-37 (mark, title), the version value and the Hub's values.
3. The Banking row is read-only (no chevron: it opens nothing); the licence line wraps whole; local `BankRow` until SHARED-CHANGES #2.
4. Support address has no default and no invented one: the row says "Not available yet" and opens nothing until `SUPPORT_EMAIL` is set. Rate the app: Play URL from the Android package; no row on iPhone (G-142).
5. Bank name reuses the existing wallet config (`WALLET_BANK_NAME`, default "Loma Bank", already PROVISIONAL); the owner writes the bank into the Terms text, so there is no bank placeholder inside legal text.
6. Terms, Privacy and About are public routes, so a person can read the Terms before sign-up; `available: false` is a 200, not an error.
7. Local screenshots used the canvas's wording as fixtures in the local `s02_dev` database only; nothing from the canvas is in the repo or seeded.

**Owner inputs (NOT RUN until given; rule 9).** Terms and Privacy text with dates (G-140); support address (G-141); Play listing live and App Store id (G-142); licence wording and confirmation of the bank name (G-143). Each is a one-time config or one `PUT`.

**NOT RUN.** V10 on a device (mail app, Play page, font scaling and safe areas on a phone); the web has no Rate row (no Android package on web); iPhone behaviour; the Settings rows that open these screens (SETTINGS-01, not built); `npm run api` against merged backend main (SHARED-CHANGES #3); the live deploy (V9 against the droplet).


### Builder report (round 2, 4 Oct 2026, after the verifier's FAIL)

**Fixed (backend `wmt/SETTINGS-02`, uncommitted).** 1: the date is strictly a real calendar date that reads back unchanged (`2026-13-45`, `0000-00-00`, `2026-02-30`, `2027-02-29` now 400). 2: NUL and text that is empty after trimming are 400; the document is capped at 60000 bytes of text (400 "too long"); the 60000-byte cap keeps an accepted document far under the parser's limit. 4 (finding 6): `links.test.ts` tests `rateUrl` (Android Play URL, iPhone null, no package null) and `appVersion` (config only, null without it) with no mock of `links`. 7: Banking and Contact support are now `WrapRow`: no line limit, selectable, wraps whole at 1.6x zoom (`build/s02_shots/zoom-1.6-about.png`); the nav title may wrap. 8: `SUPPORT_EMAIL` added to `deploy/README.md`. 9: the protected suite is 244/244 on a fresh seeded database (SHARED-CHANGES text corrected).

**Defaults (agent), owner may override.** A document's date is 2000-01-01 to 2100-12-31 (`PROVISIONAL(POLICY-LIMITS)` in `src/admin/legal-documents/policy-input.ts`); text limit 60000 bytes (title, headings and bodies together; each body 20000 characters, 100 sections). Defect 3 / finding 5 (local row instead of `ListRow`): stays until SHARED-CHANGES #2 is applied. Finding 3 (no audit or history when a document is overwritten): NOT built; it needs a second migration and the admin id passed through, so it is recorded here: owner decides whether to keep earlier versions or an `updatedBy`. Finding 4: with `WALLET_BANK_NAME` unset About says "Banking by Loma Bank" (the existing PROVISIONAL default, named by the BRIEF); owner decides whether it should say "Not available yet".

**Note (Default (agent), low, owner may override).** A body over the global 100 kB parser limit answers 500 on every route today (KYC-02 #3 open); this task does not change that. `all-exceptions.filter.ts` is back to origin/main's content.

**Revert proofs (each fails the named test when the fix is removed, passes restored).** Real-date check removed: 2026-02-30 and 2027-02-29 tests fail. NUL/trim check removed: the NUL and empty-text tests fail. Size check removed: the 60000-byte test fails. iPhone rule removed: "on an iPhone is null" fails. `appVersion` hard-coded: 2 tests fail. `selectable`/no-limit removed from the address line: the wrap test fails.

**Re-run.** Backend: tsc 0; `src/about` 19/19; `src/protected-routes src/common/tests src/about` 332/332 on fresh DB `s02_prot_test`; `contract:build`: only the removal of a regex `pattern` from my own new schema property (additive otherwise). Mobile `npm run check` exit 0: 39 suites / 694 tests, gates 9 / 183 files / 0 fail.

### Builder report (round 3, 4 Oct 2026, after the round-2 verifier's FAIL)

**Fixed (backend, uncommitted).** 1: `sections` must be a list of plain objects with exactly a string `heading` and a string `body` (arrays, null, strings, missing, extra or wrong-typed keys are 400, nothing stored), checked in the DTO (`IsPlainSections`) and again in `PoliciesService.put`, so a document that would read "Not available yet" can never replace a live one. 2: a lone UTF-16 surrogate in the title, a heading or a body is 400 (a real emoji pair is accepted and reads back unchanged). Spec titles are now "a user can ..." / "a superadmin cannot ...". Mobile: every row on About (Contact support, Rate the app, Terms, Privacy policy, Banking) is the wrapping `WrapRow`, so "Privacy policy" is not cut at 1.6x; test "wraps every row title whole".

**Revert proofs.** Lone-surrogate check removed: the 3 surrogate tests fail. Plain-section check removed from both the DTO and the service: the 3 array-shaped section tests fail (either layer alone keeps them green, by design). `numberOfLines={1}` put back on the row title: the wrap test fails.

**Note (Default (agent), low).** JSON nested about 2000 levels deep answers 500 from the global ValidationPipe on every route (also `POST /admin/auth/login`); it belongs with the KYC-02 #3 default above, and this task does not change it.

**Re-run.** Backend `src/about` 32/32; protected + shadowing + about 345/345 on a fresh seeded DB; tsc 0; `contract:build` only additions against main (208 inserted, 0 removed). Mobile `npm run check` exit 0: 39 suites / 695 tests, gates 9 / 183 files / 0 fail.

## Verifier report

**Verdict: FAIL** (verifier session, 4 Oct 2026; nothing fixed, nothing committed). Open defects: 1 to 4. Own stack: Postgres `s02v_*`, Hub :3812, mock WAWU ID :4812, web :8812, evidence in `/home/user/lanes/s02v/` (`shots/`, logs). Main compared in `/home/user/lanes/s02v/main` (origin/main c4d17bb).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | Mobile `npm run check` exit 0 (38 suites, 688 tests, gates 9 / 182 files / 0 fail, 206 tasks), `mobile_check.log`. Backend `tsc --noEmit` 0; new spec 7/7; `contract:build` regenerates `openapi.json` byte for byte; diff vs main is +3 paths, 0 removed, 0 changed. Protected suite `run.sh --fresh` 244/244 on the branch (`prot_branch.log`) AND 244/244 on clean origin/main (`prot_main.log`). Full `test:contract`: 443 failed / 44 suites on BOTH branch and main with the identical failing suite list (environment, my fresh DB; includes admin-events, admin-notifications, fintava-stall, protected-routes.regression), branch +7 passing (the new spec); `ct_br.log`, `ct_ma.log`. Migration `20261004120000_legal_documents` applies on a fresh DB, `DROP TABLE "LegalDocument"` removes exactly that one table (105 to 104), re-apply works; `migrate diff` shows only the pre-existing ContentPiece index drift, same on main. Mutations (copy aside, restored, tree clean): role guard removed, `available: true`, invented licence line, slug check removed each fail the backend spec; removing the "not available" branch and the mail `onPress` fail mobile tests; removing the iOS rule in `rateUrl` does NOT (finding 6). |
| V4 | passed with defects | Writer (superadmin PUT, config) to storage (`LegalDocument`, env) to readers (`GET /about`, `GET /policies/:slug`, Z9 to Z11) walked with a real Hub. Defects 1 to 3 are on the writer side. |
| V5 | passed | `shots/cmp-Z9|Z10|Z11-light|dark.png` (design left, built right), 390 and 360 wide, light and dark. Order, spacing, copy, icons match; differences are the recorded ones below. |
| V6 | passed | Real causes, no mocked responses: empty (no row, no config: "Not available yet" on Z10/Z11, "Not available yet" under Contact support, no licence line), filled, loading (Hub process SIGSTOPped), server error (table renamed, real 500: "This could not be loaded" + Try again), offline (Hub stopped: "No connection" + Try again), very long text (20k-char bodies, 400-char unbroken word) scrolls and wraps at 360, dark mode. `shots/states.png`, `Z11-long-360-*`. |
| V9 | partly | Signed out: `/about`, `/terms`, `/privacy-policy` open with no session; values only the server has (TEST bank, TEST licence line, TEST support address, TEST legal text and date written with `PUT /admin/policies/:slug`) appear on screen. Signed in through the real login: NOT RUN (the sign-in form returned "Something went wrong on our side" against the mock WAWU ID; not caused by this task, not investigated). |
| V10 | NOT RUN | Device, Android only; iOS not applicable. Also NOT RUN: real OS font scaling (approximated with 1.6x browser zoom), mail app and Play page opening, Rate row (absent on web by design). |

**Hard rule (no invented text).** Pass. Grep of both diffs: no legal wording, fee, licence line, bank or support address in app, backend, seeds, fixtures or i18n. Licence line from `WALLET_LICENCE_LINE`, support from `SUPPORT_EMAIL` (no default), version from `expo-constants` (shows 0.1.0), legal text only from the DB; nothing seeded. No em-dash in user-visible text, no "Flutterwave", icons through `IconTile`/`IconButton`, no colour literals. The one fallback to a literal is the bank name (finding 4).

**Backend security.** `GET /about` and `/policies/:slug` public; `/about` carries only the three config values (no env leak). Slug: `TERMS`, `Terms`, `..%2f..`, `%00`, `__proto__`, `constructor`, `;x` all 404; a 100k-char slug 431 from Node. No Cache-Control (ETag only), sensible. `PUT /admin/policies/:slug`: no token 401, WAWU user token 401, reviewer/finance/support 403, tampered signature 401, forged `role: superadmin` payload 401, `alg none` 401, unknown slug 404, extra field 400, body over 20000 chars 400, over 100 sections 400. `<script>` and `<img onerror>` stored and returned as plain strings, shown as text in the app. Repeat PUT is idempotent (same body, same result).

**Findings**
1. defect: `PUT /admin/policies/:slug` date handling. `2026-13-45` and `0000-00-00` return 500; `2026-02-30` is accepted and stored as `2026-03-02`, so the Terms would show a date the owner never gave. The regex checks shape, not that it is a calendar date. (`put-policy.dto.ts`, `policies.service.ts`.)
2. defect (low): other bad input becomes a 500 instead of a 400/413: a NUL character in a body (Postgres 22P05), and any request body over about 100 kB (the DTO allows 100 x 20000 characters, which can never arrive). Whitespace-only `title` and `body` are accepted and make the document "available" with blank text. Legal text of normal size is unaffected.
3. unclear (owner): no audit trail and no earlier versions. A PUT overwrites the Terms with no record of who or when beyond `updatedAt`; admin events, notifications and KYC writes keep an audit row. "Replaces the whole document" is by design, but for legal text the owner may want a history.
4. unclear (owner): with `WALLET_BANK_NAME` unset the app says "Banking by Loma Bank" (`DEFAULT_WALLET_BANK_NAME`, the existing PROVISIONAL default, which the BRIEF names as the sample). It is not from this diff and G-143 records it, but it is a fallback to a literal where the check asked for none; the owner decides whether About should say "Not available yet" instead. Related: the Terms text carries the bank name as owner-typed words, so it can drift from `WALLET_BANK_NAME` (builder default 5).
5. defect (low, VERIFIER check 2): local `BankRow` in `AboutScreen.tsx` stands in for `ListRow`, with SHARED-CHANGES SETTINGS-02 #2 deferring the swap. Mitigation: main's `ListRow` cannot show a multi-line subtitle, so the local row is needed until that row is applied; the lead may accept it at merge.
6. low: `rateUrl()` (iOS rule, Play URL from the package) and `appVersion()` are mocked in the screen tests and have no direct test; deleting the iOS rule keeps 22/22 green. Backend spec names do not start "a user can" (the mobile ones for contact, rate, terms, read do).
7. low, default (agent), owner may override: at 1.6x text the Contact support title and the address are cut with an ellipsis (shared `ListRow`, one line), so the address cannot be read; the nav title is cut after two lines. Real font scaling on a phone is NOT RUN.
8. low, default (agent), owner may override: `SUPPORT_EMAIL` is in `.env.example` but not in `deploy/README.md` beside `WALLET_BANK_NAME`.
9. note: SHARED-CHANGES SETTINGS-02 #1 says protected suite 243/244 with `POST /payments/hosted-link` failing the same on main. Not reproduced: `--fresh` gives 244/244 on both. The builder's number came from another run mode; the row text is inaccurate, not harmful.

**Builder defaults judged (all default (agent), owner may override).** Dropping "a real bank account built in" (a system claim, listed as not-a-fact): fine. Terms and Privacy card on Z9 and "Read the privacy policy" on Z10: fine, needed for the checks. Banking row without chevron: fine (opens nothing). Rate the app Android only: fine (G-142). "Not available yet" copy: no placeholder legal text. Description sentence "helps African creators and professionals get paid for what they know" is brand copy from the canvas, kept.

**NOT RUN.** V10 device; signed-in walk through real login; OS font scaling; `npm run api` against merged main; live droplet.

## Verifier report (round 2)

**Verdict: FAIL** (fresh verifier session, 4 Oct 2026; nothing fixed, nothing committed). Open defects: 1 and 2 below (both new, found by hostile input). Defects 1, 2 (NUL, trim, cap, dates) and 4 of round 1 are fixed as specified. Own stack: Postgres `s02w_*` (dropped after), Hub :3822, own mock WAWU ID :4822 (the :4001 one was not touched), web :8822.

| Pass | Result | Evidence |
|------|--------|----------|
| Round-1 defect 1 (dates) | passed | PUT with 2026-13-45, 0000-00-00, 2026-02-30, 2027-02-29, 1999-12-31, 2101-01-01, 2026-1-5, ISO datetimes, trailing space/newline, Arabic-Indic digits, 2026-09-31, 2026-04-31, '', 123, 20260901, null, true, [], ['2026-09-01'], {}, 1e999, missing: all 400 `{statusCode,message,data:null}`, stored row unchanged each time. 2028-02-29, 2024-02-29, 2000-01-01, 2100-12-31 round-trip unchanged. |
| Round-1 defect 2 (input) | partly, see findings 1 and 2 | NUL (raw and `\u0000`) in title, heading, body: 400. Empty or whitespace-only title, heading, body: 400. Exactly 60000 bytes: 200; 60001: 400; 3 x 5000 emoji (60000 bytes) 200 and 4 x: 400; 100 sections 200, 101: 400. Emoji, RTL, zero-width, ZWJ family, control chars round-trip inert. Invalid JSON, empty body, array, null, text/plain: 400. `__proto__`, `constructor`, duplicate keys: no effect. Body 130 kB and 1 MB: 500 (KYC-02 #3, as stated). `git diff origin/main -- src/common` is empty (all-exceptions.filter.ts untouched). |
| Round-1 defect 4 (links test) | passed | Copy aside, restore, never checkout: iPhone rule removed fails "on an iPhone is null" (1 failed); `appVersion` hard-coded fails 2; restored 5/5. |
| 1.6x zoom layout | passed with finding 4 | Web build, 360 wide, 1.6x, light and dark (`shots/tall-about-*.png`, `tall-terms-light.png` in the scratchpad): Banking name and licence line wrap whole, Contact support title and address wrap whole (address breaks mid-word, it is one unbroken word), nav title wraps, Terms and Privacy text wraps, horizontal overflow 0 on all three screens at 360 and 1.6x, light and dark. Rows are selectable (round-2 jest test). |
| Round-1 regressions | passed | Empty (privacy row deleted: "Not available yet / has not been published yet"), filled, offline (Hub unreachable: "No connection" + Try again, light and dark). No invented legal text (nothing seeded; all text above is my own TEST fixtures). PUT: no token 401, WAWU user token (from the mock) 401, tampered signature 401, forged payload signed with another secret 401, reviewer 403, superadmin 200. Public GET /about and /policies/terms, /privacy 200; unknown, `TERMS`, `..%2f..%2fabout`, `%00`, `__proto__` 404. |
| V1 gates | passed | Backend: `tsc --noEmit` 0; `npm run test:contract -- src/about` 19/19; `contract:build` byte-identical to the working file and `git diff origin/main` of `contract/openapi.json` has 0 removed lines; protected suite `scripts/protected-routes/run.sh --fresh` on fresh DB: "all 244 required tests passed" (253/253). Mobile `npm run check` exit 0: 39 suites / 694 tests, gates 9 / 183 files / 0 fail, 206 tasks. Migration: fresh apply 105 tables, `DROP TABLE "LegalDocument"` and record delete gives 104, re-apply 105. |
| Backend revert proofs | passed | Calendar check removed: 4 fail; NUL/trim removed: 2 fail; size check removed: 1 fail; restored 19/19. |

**Findings**
1. defect: `PUT /admin/policies/:slug` accepts `sections` made of arrays. `[[]]`, `[[{"heading":"h","body":"b"}]]` and arrays nested up to about 1000 deep return 200 and replace the live document with no readable section, so the Terms or Privacy policy flips to "Not available yet". `[{ok},[]]` returns 200 and stores an empty `{}` entry beside the good one. `@ValidateNested` accepts an array element as an "object or array". Needed: each section must be a plain object (e.g. `@IsObject`-style check or reject arrays) so it is a 400 and nothing is stored. Write a spec "a superadmin cannot save sections that are not objects".
2. defect (low): a lone UTF-16 surrogate (`"\ud800"`) in a heading or body returns 500 (Postgres refuses it in jsonb); in the title it returns 200 and is stored as U+FFFD, not as given. Same family as the NUL fix. Needed: 400 for text containing a lone surrogate.
3. note (pre-existing, not this task's code): nesting of about 2000 levels or more answers 500 (RangeError in the global ValidationPipe); it also answers 500 on `POST /admin/auth/login`, a route this diff does not touch. Same area as KYC-02 #3; nothing for this task to fix.
4. low, default (agent), owner may override: at 1.6x the second card on About shows "Privacy..." (the title is cut with an ellipsis by the shared one-line `ListRow`). Not clipped at the page edge and still opens Privacy; "Terms" is whole. Round 2 covered Banking and Contact support only.
5. low, default (agent), owner may override: only the round-2 backend specs are named "a superadmin can/cannot ..."; the round-1 ones ("rejects a malformed document", "serves nothing for ...") are not written as "a user can ...". Not worth a rebuild alone.
6. note: repeated runs showed the Hub throttles (20 requests per second per caller); not a defect. Builder default 2000-01-01 to 2100-12-31 and 60000 bytes accepted as default (agent), owner may override. Earlier round-1 findings 3 (no audit trail), 4 (bank name fallback) and 5 (local BankRow) stay with the owner/lead as recorded.

**NOT RUN.** V10 on a device (real OS font scaling approximated with browser zoom 1.6x); signed-in walk through the real login; `npm run api` against merged main; live droplet; the web build's baked API address was the builder's :3802 and was redirected to my Hub :3822 in the browser (same requests, real responses).

## Verifier report (round 3)

**Verdict: PASS after re-check** (originally FAIL on finding 1, which was merge-induced and is closed: backend 6efd84c commits the regenerated contract, mobile 1f2986b regenerates the client; re-check: `git show HEAD:contract/openapi.json` has `/about` and `/policies/{slug}`, `contract:build` leaves no diff, mobile `npm run check` exit 0 with 695 tests, `git diff origin/main -- src/common` empty). Findings 2 and 3 stay as Default (agent), owner may override. Original note: fresh verifier session, 4 Oct 2026; nothing fixed, nothing committed; one defect, a merge artifact, not the builder's round-3 code). State under test: backend cce8aaa, mobile 23f2286 (clean trees). Own stack: Postgres `s02x_*` (dropped), Hub :3832, own mock WAWU ID :4832 (the :4001 one untouched), web :8832; evidence in `/home/user/lanes/s02x/` (`atk2.js`, `atk3.js`, `shots/`, logs).

| Pass | Result | Evidence |
|------|--------|----------|
| Round-2 defect 1 (sections shape) | passed | Raw JSON PUT, document read back before and after each case, reseeded between: `[[]]`, `[[[]]]`, `[null]`, `[{}]`, `["x"]`, extra key, numbers, array and object as heading or body, duplicate keys, blank headings/bodies, `[]`, `""`, `null`, `true`, `5`, an object instead of a list, `{"0":{..}}`, `[{ok},[]]`, `[{ok},null]`, only heading, only body, null values, 101 sections, 500 levels of nesting, `sections` missing: all 400 in `{statusCode,message,data}`, document unchanged. An empty or all-blank document can never replace a live one. |
| Round-2 defect 2 (surrogates) | passed | JSON-escaped `\ud800`, `\udc00`, `\udc00\ud800`, `a\ud83dz`, `x\ude00` in title, heading and body: 15/15 400, nothing stored. Lone surrogate in `effectiveDate` 400. Slug `%ED%A0%80` (raw bytes) 400. Emoji, ZWJ family, flag, Hebrew, Arabic, combining mark and RTL override read back byte-identical; escaped pair `\ud83d\ude00` reads back as U+1F600 (f09f9880). |
| Lows | passed | Web build (scratch copy of the mobile tree with regenerated types), 360 wide, 1.6x zoom, light and dark: Banking name and licence line, Contact support title and a 56-char address, Terms, Privacy policy all wrap whole (Privacy policy is 2 lines, no ellipsis; no element with text-overflow ellipsis or line clamp; horizontal overflow 0). `shots/about-*.png`. Rate row absent on web by design. Spec titles: 31 of 32 read "a user/superadmin/reviewer can/cannot ..." (see finding 3). |
| Revert proofs | passed | Copy aside, restored, trees clean. Backend: lone-surrogate check removed, 3 fail; plain-section check removed from DTO and service, 3 fail; DTO alone or service alone, 32/32 green (two layers, as stated). Mobile: `numberOfLines={1}` back on the row title, 1 fails ("wraps every row title whole"); restored 29/29. |
| V1 backend | passed | `tsc --noEmit` 0; `src/about` 32/32; `run.sh --fresh` on a fresh DB "all 244 required tests passed"; `git diff origin/main -- src/common` empty; `contract:build` regenerated against main is additive (208 inserted, 0 removed) but see finding 1. |
| V1 mobile | failed as committed, passed with the right contract | As committed: `npm run check` exit 2 at typecheck (`AboutView`, `PolicyView`, `/api/hub/policies/{slug}` missing from the generated types). With the backend contract regenerated into a scratch copy: exit 0, 39 suites / 695 tests, gates 9 / 183 files / 0 fail, 207 tasks (`mobile_check2.log`). |

**Findings**
1. defect: the merge commits dropped the SETTINGS-02 routes from the contract. `contract/openapi.json` at backend cce8aaa has no `/api/hub/about`, `/api/hub/policies/{slug}` or `AboutView`/`PolicyView` (0 matches); `contract:build` on that tree produces them (+208 lines, nothing removed) and leaves the file modified. Mobile `contract/openapi.json`, `contract/openapi.mobile.json` and `src/api/schema.generated.ts` at 23f2286 are therefore without them and `npm run check` exits 2 with 6 type errors in `src/features/about/`. Needed: commit the regenerated backend contract, then `npm run api` in mobile, and re-run `npm run check`. (I restored the committed backend file after generating; my copy is `/home/user/lanes/s02x/openapi.generated.json`.)
2. low, default (agent), owner may override: extra `__proto__` and `constructor` keys inside a section return 200 and are silently dropped (the stored section is clean `{heading, body}`, no prototype pollution), where every other extra key is 400. Harmless; stated as a 400 in the check list.
3. low: the spec "a document just under the limit is accepted" does not read "a ... can/cannot ...".
4. note (pre-existing, KYC-02 #3): a body over the 100 kB parser limit (20000 sections) answers 500; client bytes that are invalid UTF-8 (CESU encoding of a surrogate) are decoded by the parser to U+FFFD and stored as such. Not this task's code.

**NOT RUN.** V10 on a device (OS font scaling approximated with 1.6x browser zoom); signed-in walk through real login; `npm run api` against merged main (the verifier does not fix); live droplet; full `test:contract` (rounds 1 and 2 showed it environment-bound, identical on main).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
