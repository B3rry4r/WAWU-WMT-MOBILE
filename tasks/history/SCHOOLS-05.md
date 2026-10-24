# SCHOOLS-05 · round history

Moved out of [tasks/SCHOOLS-05.md](../SCHOOLS-05.md) word for word, oldest first. The current state is in that file.

## Builder report

Built by a Sonnet builder, bundle B13, 24 Oct 2026. Dashboard `wmt/ADS-02` `0d16895`; mobile `wmt/ADS-02` (this file, `BACKEND_GAPS.md` G-1725 and G-1726, `SHARED-CHANGES.md` B13 #1, `docs/LOG.md`). **No backend change.**
- **Files (dashboard):** new `src/app/(app)/schools/page.tsx`, `schools/new/page.tsx`, `schools/[id]/page.tsx`; `src/components/schools/` (`SchoolForm`, `SchoolDetail`, `CourseModal`, `IntakeModal`, `SchoolBadges`, `schoolText.ts`); `src/lib/api/admin-schools.ts`, `schools-paging.ts` and `schools-paging.test.ts`; `src/components/layout/nav.ts` ("Schools" under Services); `scripts/generate-contract-types.mjs` (the ten routes keyed `adminSchools...`, the views, the seven DTOs, `SCHOOL_LIMITS`, the two enums) and the regenerated contract; `package.json` (`npm test` is `node --test` over the paging test) and `tsconfig.json` (`allowImportingTsExtensions`, so the test can import its module by file name).
- **Behaviour:** every limit is `SCHOOL_LIMITS` from the backend (text lengths, expertise items, weeks, list lines, seats, the fee ceiling, the founding year from 1800 to this year); a fee is typed in naira with at most two decimals and sent as whole kobo, and 0 is accepted; an edit sends only the fields that changed and is held when nothing has; an intake's seats cannot go below the seats taken (the server's 409 is shown in its words); hiding a school, course or intake asks first, showing is one press; nothing is deleted (there is no delete route, so no delete control). Roles are `ROUTE_ROLES`: superadmin and reviewer write, support reads with no controls and is told why, finance sees "Not your screen".
- **Defaults (agent), owner may override:** the list is a "Load more" over keyset pages with a count read so far and no total (the server sends none); hidden schools are listed, marked, because this is where they are brought back; the logo and the apply link are https links the admin pastes (no admin upload, G-195, G-1726); a new school opens on its own page to add its first course.
- **Dashboard checks:** `npm run check` exit 0, `npm run build` exit 0, `npm test` exit 0 (6 of 6), `python3 scripts/gates/run.py` 1 fail, 0 warn, 6 accepted (the same `finance/payouts/page.tsx:39` deferral as before). Before this bundle (main `c1dfca6` plus ADS-02): `npm run check` exit 0.
- **Not done:** paging past 25 schools was not driven live (one school exists on the stack); the append rule is covered by the unit test, and the control is a plain "Load more" over the server's cursor. Support and finance views were checked in code, not pictured.

## Verifier report

Verifier (Sonnet, T1, bundle B13, 24 Oct 2026): **PASS (merge).** dashboard `0d16895` (wmt/ADS-02) against dashboard main `c1dfca6`; backend main `b69aa7f` for the stack (the contract is pinned to `8fca5dd`); mobile `7b0b1590`. I built none of it.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npm run check` EXIT 0 pinned (EXIT 1 only on the pin header, N1), build EXIT 0, `npm test` EXIT 0 6 of 6, gates 1 fail identical to main |
| V6 | partly run | empty list, hide confirmation, hidden states pictured; Hub-down, 409 seats-below-taken and paging past 25 NOT RUN |
| V7 | passed | superadmin wrote; support read with 1 control (Back); finance "Not your screen" on the list (F1 for the detail page) |
| V9 | passed | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dash-b13-v/schools-1` to `schools-14`, `matrix.txt` |

Capability check, driven in the browser as a superadmin signed in at `/login`, each step read back from the public routes (a user token, `GET /schools` and `GET /schools/:id`):
- Add school: `GET /schools` went from empty to "Lagos Design Academy", courseCount 0. Add course (₦150,000, 12 weeks, online): courseCount 1, fromPriceKobo 15000000. Add intake (14 Nov 2026, 30 seats): the course's `nextIntake` appears (seatsLeft 30).
- Edit: the place changed to "Lekki, Lagos" and shows on the public school; the course fee changed to ₦175,000 (fromPriceKobo 17500000); the intake seats changed to 40 (nextIntake capacity 40).
- Hide and show: hiding the school asks first ("Nothing is deleted"), the public list is empty and `GET /schools/:id` is 404; showing brings it back. Hiding the intake removes `nextIntake`; showing restores it. Hiding the course gives courseCount 0 and no price; showing restores both.
- Roles over HTTP: `GET /admin/schools` none 401, user 401, reviewer 200, support 200, finance 403, superadmin 200. In the UI support has no write controls.
- Pictures at 1440 px light and dark (`schools-1` list empty, `-2` create filled, `-3` school with no course, `-4` course modal, `-5` course with no intake, `-6` intake modal, `-7` school with course and intake light and dark, `-8` edit school, `-9` hide confirmation, `-10` school hidden, `-11` edit course, `-12` intake hidden, `-13` course hidden, `-14` list). Compared with the builder's `schools-8` (and the others): the same layout and copy; only the data differs.

Findings:
- **F1 (low, defect):** finance opening a school's page sees "Could not load this school ... Your account is missing the permission" (`src/components/schools/SchoolDetail.tsx:97`), while the list shows "Not your screen" (`src/app/(app)/schools/page.tsx:60`). The builder's report says finance sees "Not your screen". Repro: sign in as finance, open `/schools/<id>`. Goes to the sweep list.
- **N1 (note):** the contract pin, as in LEGAL-07 N1.
- NOT RUN: paging past 25 schools (the append rule is covered by the unit test, 6 of 6); the 409 for seats below seats taken.

Checks I ran (dashboard worktree on `0d16895`, `npm ci` first; logs in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dash-b13-v/`):
- `npm run check` with `HUB_API_REF=b69aa7f` (backend main): EXIT 1, "contract types are STALE", for both generators. I regenerated in a scratch copy at `b69aa7f`: the only difference in `generated.ts` and `ops.generated.ts` is the header line "Source of truth ... @ 8fca5dd", so the content equals backend main (see finding N1). With `HUB_API_REF=8fca5dd`: EXIT 0 (contract 71 files, ops contract 14 files, tsc 0, eslint 0 errors and 1 warning, invariants clean on 155 files, contrast 58 pairs).
- `npm run build`: EXIT 0 (routes `/ads`, `/ads/new`, `/ads/[id]`, `/legal/prices`, `/schools`, `/schools/new`, `/schools/[id]`).
- `npm test`: EXIT 0, 6 of 6.
- `python3 scripts/gates/run.py`: EXIT 1, 1 fail, 0 warn, 6 accepted, 155 files. On dashboard main `c1dfca6` the same command: EXIT 1, 1 fail, 0 warn, 6 accepted, 128 files, and the FAIL block is identical: `src/app/(app)/finance/payouts/page.tsx:39` "known dead code left as prose". That file is not in the branch diff, so the failure is inherited, not new.
- `CONSULTATION_FEES` and `CONSULTATION_FEE_OPTIONS`: no match anywhere on the branch, in backend main, the web or mobile; the generator's `extractConsultationFees` and its output block are gone and nothing imports `ConsultationFeeOption`. The legal queue footer reads "Consultation and service prices are set on the Legal prices screen." (no 25,000 or 45,000).
- Diff against the report: `git diff --stat c1dfca6 0d16895` is 42 files, each in a builder list; nothing extra or missing. No stand-in copies of main's components found.
Stack: the brief's ports 8280-8287 were blocked (8284 held by another session's next-server), so the stack ran on 7920-7927 (name `v13dash`, own database, Hub on the Nuvion stand-in, mock WAWU ID). The stack's Hub allows only its own origin, so I restarted my Hub once with `CORS_ORIGIN` adding the dashboard's origin (my process only). The dashboard was the production build on :7921. The four admin roles were signed in through `/login` in the browser; reviewer, support and finance rows were inserted by SQL with the superadmin's password hash. A user token came from the mock WAWU ID.

