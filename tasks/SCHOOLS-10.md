---
id: SCHOOLS-10
title: Link to a school's own site, with the click recorded
owner: YOU
area: SCHOOLS
order: 76
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SCHOOLS-04]
decisions: [R-12, R-33]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-10 · Link to a school's own site, with the click recorded

## Current state

As of 16 Oct 2026, after the first build (builder, Sonnet).
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SCHOOLS-10.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/INBOX-12` (this branch contains it); API types regenerated from backend `wmt/SCHOOLS-10` (a45a87a).
- **Branches:** wawu-backend `wmt/SCHOOLS-10` (from main `3797fb2`). Mobile `wmt/SCHOOLS-10` holds only this file, SHARED-CHANGES rows and the log line. wawu-id and the web: untouched.
- **Migration:** `20261022230000_school_link_clicks` (two new tables, additive; rollback line in the file).
- **Built (backend, all new):**
  - `GET /schools/courses/{id}/apply-link`: public; the school's `applyUrl` with `ref=wawu-XXXX` added; records nothing. SC9 prints this.
  - `POST /schools/courses/{id}/apply-click`: needs an account; writes one `SchoolLinkClick` (user, course, time), then answers with the same link. The app opens `url` in the phone's browser (R-33).
  - The code is per school, made the first time a link is asked for (`SchoolLink`, unique), `wawu-` plus four of `A-Z2-9` without `I` and `O`. A race or a taken code is retried.
  - The link carries the code only. No user id, no name, nothing else (DATA-SAFETY AA-10 lead check).
  - A hidden course or school, a school with no `applyUrl` or one that is not http(s): 404 and no click.
  - Account purge deletes a person's clicks (OWNED); the data export lists them (`schoolLinkClicks`).
- **Not built, on purpose:** the school's sign-ups, conversion reports and the commission (SCHOOLS-12, after launch). A real 302 GET: the tap needs the person, and a browser opened by the phone carries no token, so the app calls the POST and opens the answer.
- **For SCHOOLS-08 (SC9):** call `apply-link` for the sheet and `apply-click` on Continue, then open `url`. Never open the raw `applyUrl` that `GET /schools/{id}` and `GET /schools/courses/{id}` still serve: it has no code and records nothing. Run `npm run api -- --backend ../wawu-backend` first (SHARED-CHANGES SCHOOLS-10 #2).
- **For RELEASE-01:** DATA-SAFETY AA-10 and D13 can now say the click is collected (user, course, time) and the school sees only the per-school code.
- **Records:** tasks/history/SCHOOLS-10.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 5 (the tracked link rewrites the school's whole query, a link with credentials or a private address is served, a ref inside a hash route, the purge has no caller, a school delete removes its click rows). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

SC9: a user can apply on the school's own site through a WAWU link, and the click is recorded. Built at launch (R-33); the school's sign-ups and the commission are SCHOOLS-12, after launch.

## Scope

Per-school link code and a redirect endpoint that logs the click (user, course, time).

## Capability checks

- [ ] Tapping 'Apply on their site' records one click and lands on the school's URL with the WAWU code.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SCHOOLS-10.md](history/SCHOOLS-10.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
