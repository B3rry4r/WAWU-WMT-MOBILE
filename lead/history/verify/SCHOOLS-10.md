# SCHOOLS-10 verifier report (16 Oct 2026, Sonnet)

Verdict: MERGE. Backend wmt/SCHOOLS-10 a3b0f9f (one commit on 3797fb2). No blocker, high or medium finding.

## Checks
- Live Hub from the branch (stack schools_10, 26 seeded schools, real HTTP): plain, javascript:, data:, relative, //host,
  mailto:, ftp:, empty, null, credentials, localhost, 10.x, 169.254.x, redirect parameter, existing ref, three ref
  parameters, fragment, IDN, hidden school, hidden course. Non-web or hidden: 404 and no click, no SchoolLink row.
  Web addresses: link carries only `ref=wawu-XXXX`; existing ref(s) replaced by one; fragment kept after the query.
- Person data: authed and public GET give the same url; POST with a spoofed body and query (userWawuId, schoolId,
  clickedAt, ref) writes the token's own sub and a server time; nothing about the person in url, code or body.
- Auth: POST without token, with a garbage token: 401, no row. GET on apply-click and POST on apply-link: 404. Bad uuid
  and SQL text: 400. Unknown uuid: 404.
- Race: 800 requests (400 GET, 400 POST, distinct client addresses) on 20 schools with no code: 800 x 200, no 500, 20
  SchoolLink rows, 20 codes, one code per school in every response, 400 click rows. Five parallel taps by one person: 5
  rows (recorded decision 3).
- Lifecycle: hide school or course: 404 on both; unhide: same code. Course deleted: clicks kept with courseId null.
  School deleted: SchoolLink and clicks cascade. applyUrl changed: new host, same code.
- Purge and export (own jest spec, kept at scratchpad/schools-10-v/v10-attack.spec.ts.keep): export of person A lists
  exactly A's 3 rows (schoolId, courseId, clickedAt); a person with none gets []; purge(A) deletes 3, leaves B's row and
  every SchoolLink; a second purge deletes 0. account-data-map and data-export-map drift specs pass. 10/10.
- Builder specs: school-link 18, schools-public, schools-schema: 33/33. tsc 0. eslint on the 8 changed files clean.
  `npm run contract:build` regenerates a byte-identical contract/openapi.json. prisma migrate diff: only the
  ContentPiece_specializations_idx drop, not this branch (also on main). migrate status: up to date.
- Protected routes: scripts/protected-routes/run.sh --fresh a3b0f9f against origin/main (b32f9c0) lock: 244 of 244, EXIT 0.
  Only routes added, no existing path changed.
- Migration 20261022230000_school_link_clicks sorts after main's last (20261021340000) and after wmt/FIX-22 7d3c86d's
  last (20261022130000). WATCH: wmt/ME-04 carries 20261023100000; if it merges first, this folder must be renamed
  to sort after it (for example 20261023110000).
- Branch CI on a3b0f9f: Branch checks, Protected routes, baseline, contract, deploy-test-in-sync, suite shards 1-3,
  netns green. Gates red with 16 FAIL lines, all in files this branch does not touch (flutterwave, wallet,
  notification, community, admin notifications), same as main.

## Findings (all low)
1. src/schools/school-link.ts:46-50 trackedUrl: `searchParams.set` rewrites the school's whole query, not just `ref`.
   `?name=Jos%E9&flag` becomes `?name=Jos%EF%BF%BD&flag=&ref=...`; `a=1&&b=2;c=3` loses the empty part and encodes `;`.
   A signed or legacy-encoded query would break. Repro: node -e with the URL class on those strings. Fix: append `ref`
   to the raw query text. Not blocking: ordinary apply pages have plain queries.
2. src/schools/school-link.ts:27-34 isWebAddress: a URL with credentials (https://admin:xxxxxx@school.example.com/..),
   a private IP (10.x, 169.254.x) or http://localhost is served as the link. Not a server-side fetch (the phone opens it),
   and only the dashboard can write applyUrl, but its validator (src/schools/school-admin.dto.ts:148 isURL, https only)
   lets credentials and IP hosts through. Hardening: refuse a URL with username or password in isWebAddress.
3. A `ref` inside a hash route (https://spa.example.com/#/apply?ref=old) gets the code in the real query and keeps the
   stale ref in the fragment. Edge case, school-chosen address.
4. Pre-existing, not this branch: AccountPurgeService.purge has no caller in src (account.service.ts comment says so), so
   no OWNED table, SchoolLinkClick included, is purged by a live path today; and a token of an account in its 48 h
   deletion window can still tap. Same on main. RELEASE-01 / DATA-SAFETY item for the lead.
5. School deletion cascades its SchoolLinkClick rows (the commission count for SCHOOLS-12 goes with the school). Decide
   at SCHOOLS-12 whether that is wanted.
