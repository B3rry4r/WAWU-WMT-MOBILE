---
id: OPS-03
title: Run the backend locally for testing
owner: YOU
area: OPS
order: 4
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: [R-20]
passes: [V1, V9]
artboards: []
---
# OPS-03 · Run the backend locally for testing

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands. It also runs `wawu-id`, which the backend signs users in through.
- `docs/fintava/naira-api.md` (the Fintava settings the `.env` needs)

## Goal

Every task is tested on the builder's own machine. The live server is never touched while testing. Anyone (the owner, the developer, or an AI session) can start the whole backend locally from one page of instructions.

## Scope

`docs/LOCAL.md` in `wawu-backend`: Postgres (local install or Docker), `wawu-id` and the hub API running together, seeded test data, and how the phone reaches it (same Wi-Fi by LAN address, or a tunnel; Fintava's webhooks need the tunnel). `.env.example` gains the Fintava settings (`FINTAVA_BASE_URL`, `FINTAVA_API_KEY`, `FINTAVA_WEBHOOK_SECRET`) and the Cardex ones, empty. One command or a short script to start it all if that's simpler than steps. No change to how production deploys.

## Capability checks

- [ ] On a fresh clone, following `docs/LOCAL.md` alone, the backend and `wawu-id` start and the health endpoint answers.
- [ ] A user registered on the local `wawu-id` signs in and calls an authenticated hub route locally (V9 against the local backend).
- [ ] The mobile app, with `EXPO_PUBLIC_API_URL` pointed at the local backend, reaches it (web build is enough for this check).
- [ ] `.env.example` lists the Fintava and Cardex settings, empty, and no real key is committed.
- [ ] Production deploy files are unchanged (`git diff main -- deploy .github` is empty).

## Builder report

Builder, 2 Oct 2026. wawu-backend commit 6d634fa on `wmt/OPS-03`; wawu-id and mobile code unchanged (wawu-id is run, not edited).
- **Files (wawu-backend):** `docs/LOCAL.md` (new), `scripts/local/up.sh`, `down.sh`, `smoke.sh`, `seed-wawu-id.js` (new), `.env.example` (Fintava + Cardex, empty), `.gitignore` (`.local/`), `README.md` (link).
- **How it runs:** `scripts/local/up.sh` writes local-only `.env` files in both repos (fresh RS256 key, random shared service key), migrates and seeds both databases, builds, starts the real wawu-id (:3002) and the Hub (:3001), waits for health. The 3 `prisma/seed.ts` accounts get a wawu-id sign-in under the same ids. It refuses a non-local DATABASE_URL, NODE_ENV=production, Fintava's live URL and a non-`cdx_test_` Cardex key, and ignores DATABASE_URL/PORT exported in the shell. mock-wawu-id was not used.
- **Check 1 (fresh clone):** cloned both branches side by side into an empty dir, ran `up.sh` (HUB_DB/ID_DB/ports overridden to ops03_fresh_*/3301/4301, with a bogus DATABASE_URL and PORT exported): both health endpoints 200. Ctrl-C stopped both; `--detach` + `down.sh` too; second run reuses everything; port-in-use and all four refusals tested.
- **Check 2 (V9 locally):** `scripts/local/smoke.sh` exit 0 on the fresh clone: register on wawu-id, login refused before email confirm (EMAIL_NOT_VERIFIED), code read from the wawu-id log, confirm, real `/auth/login`, `GET /api/hub/users/me` 401 without token and 200 with it (same id), PATCH bio and read back, seeded `creator-pro@test.wawu.dev` signs in and the Hub returns accountType creator.
- **Check 3 (mobile):** the app has no screen that calls the API yet (only the boot screen), so its web export contains no API URL. Tested the app's own `src/api/client.ts` in a web export of a scratch copy with one throwaway route calling `api.GET('/api/hub/health')`, `EXPO_PUBLIC_API_URL=http://localhost:3301`, served at an origin in CORS_ORIGIN, loaded in headless Chromium: 200, `access-control-allow-origin` set. An origin not in CORS_ORIGIN is blocked (as the doc says). Nothing committed to mobile code. A jest run of the client is not usable (jest-expo replaces fetch).
- **Check 4:** `.env.example` has FINTAVA_BASE_URL/API_KEY/WEBHOOK_SECRET and CARDEX_BASE_URL/API_KEY/SIGNING_SECRET/WEBHOOK_SECRET, all empty; no key committed.
- **Check 5:** `git diff main -- deploy .github` empty in wawu-backend. wawu-id untouched (HEAD = origin/main; its local `main` branch is stale, so diff against `origin/main`).
- **Gates:** backend `scripts/gates/run.py` 523 files, 16 fail / 0 warn / 76 accepted before and after (pre-existing, none in files I touched; gates scan `src/` only); `tsc --noEmit` 0. Mobile `npm run check` exit 0 before and after.
- **Not run:** Docker Postgres route (no Docker daemon in this sandbox; local Postgres route tested). Tunnel (no cloudflared/ngrok here). Phone on Wi-Fi not tested on a device; both services were reached on the machine's non-loopback address. No Fintava/Cardex call: no Hub code reads those settings yet (MONEY-06, MONEY-07, WALLET-33).
- **Noted, not changed:** with FLUTTERWAVE_SECRET_KEY empty the existing Flutterwave mock approves charges locally; LOCAL.md says so. No gaps or shared-change rows filed.
- **Round 2 (wawu-backend 341201f):** findings 1-5 fixed, 6 filed as BACKEND_GAPS G-2, G-3. (1) Every `.env` read goes through `scripts/local/envfile.js` (each repo's own dotenv), so these are now refused, each tested in a fresh clone: `export`, indented, `KEY = v` and later-duplicate remote DATABASE_URL in either file, `?host=` in the URL, `NODE_ENV` set with `export`, an indented `cdx_live_` key, and FINTAVA_BASE_URL `LIVE.`/`Live.FintavaPay.com`/any non-sandbox host. Sandbox URL plus `cdx_test_` key still start (control). (2) Settings given on any run rewrite both `.env` files: first run with a wrong password failed in id-migrate with P1000 and printed the rerun line; rerun with only the right `LOCAL_PG_URL` updated both DATABASE_URLs (database names kept), started, and smoke.sh passed. `HUB_PORT`/`ID_PORT` on an existing setup moved both services and smoke.sh passed. (3) Deleting only `wawu-id/.env`, then only `wawu-backend/.env`, regenerated each with the other's service key and ports, and smoke.sh passed both times. LOCAL.md: settings table, B3rry4r clone URLs, Ubuntu 22.04 note, per-step logs, reset guidance, id-migrate/P1000/P1001/port rows. Gates 16/0/76 unchanged, tsc 0, deploy and .github diff empty.

## Verifier report

Verifier, 2 Oct 2026. Independent session; wrote none of this task's code. Checked wawu-backend `wmt/OPS-03` @ 6d634fa against origin/main @ 231cb64, and wawu-id origin/main @ 76d8b46, in fresh clones side by side in a scratch folder (`…/scratchpad/verify-ops03/`), own databases `ops03v_hub` / `ops03v_id`, ports 3501 (Hub) / 4501 (wawu-id). Every process started was stopped by pid; the `ops03v_` databases were dropped at the end.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend `python3 scripts/gates/run.py`: 9 gates, 523 files scanned, 16 fail / 0 warn / 76 accepted on the branch, and byte-identical output on origin/main 231cb64 (all pre-existing, none in a changed file; the diff touches nothing under `src/`, `test/` or `prisma/`). `npx tsc --noEmit` exit 0. `bash -n` on the three scripts ok. Mobile `npm run check` exit 0 (gates: 5 files scanned, 0 fail; jest 4/4). Backend contract test suite NOT RUN: no file it covers changed. Outputs: `verify-ops03/gates-branch.txt`, `gates-main.txt`, `mobile-check.txt` |
| V9 Live seam | passed | `scripts/local/smoke.sh` exit 0, all 10 PASS lines. By hand with curl, following LOCAL.md section 6: registered a new user on wawu-id :4501, login refused `403 EMAIL_NOT_VERIFIED`, code read from `.local/logs/wawu-id.log`, confirmed, real `/auth/login` returned an RS256 token (kid from the local key); `GET /api/hub/users/me` 200 with that id; `PATCH` bio and read back. Signed in as seeded `creator-basic@test.wawu.dev`: Hub returned `handle chidi-creates`, server `createdAt`, and `GET /api/hub/kyc` returned the seeded submission (`status pending`, masked BVN/NIN), values only the Hub database has. A token with the same claims signed by a different RSA key: 401 |

Capability checks, as written:

| Check | Result | Evidence |
|-------|--------|----------|
| 1. Fresh clone, LOCAL.md alone, both start, health answers | passed | `HUB_DB=ops03v_hub ID_DB=ops03v_id HUB_PORT=3501 ID_PORT=4501 scripts/local/up.sh --detach`, with a bogus `DATABASE_URL=…@db.example.com` and `PORT=9999` exported: 73 s, both databases created by migrate, Hub `/api/hub/health` and wawu-id `/health` 200 with exactly the bodies LOCAL.md prints; neither running process had `DATABASE_URL`/`PORT` in its environment. `down.sh` stopped both (pids confirmed gone). Second run reused everything. A real Ctrl-C through a pty stopped both and removed the pid files; SIGTERM too. Both answered on the non-loopback address (192.0.2.2). `git status` clean in both clones afterwards (all written files gitignored). Port overrides came from `up.sh --help`, not LOCAL.md (finding 4) |
| 2. Local wawu-id user signs in and calls an authenticated Hub route | passed | V9 above |
| 3. Mobile app with `EXPO_PUBLIC_API_URL` at the local backend reaches it (web) | passed, through a scratch probe route only | The unmodified app has only the boot screen and makes no API call, so the shipped app itself cannot be observed reaching anything. Reproduced independently in an uncommitted copy: one route `src/app/probe.tsx` using the app's own `@/api/client`, `EXPO_PUBLIC_API_URL=http://localhost:3501 npx expo export --platform web`, served at `http://localhost:8501` (added to `CORS_ORIGIN` as LOCAL.md section 7 says), headless Chromium: `GET /api/hub/health` 200, and after a browser sign-in on wawu-id `GET /api/hub/users/me` 200 (`zainab-pro`, creator), `access-control-allow-origin: http://localhost:8501`. From `http://127.0.0.1:8501` (not listed) the browser blocked it with the CORS error LOCAL.md describes. Screenshots `verify-ops03/probe-*.png`. Judged met: the app's client module and build pipeline reach the local backend; re-check through a real screen once one calls the API |
| 4. `.env.example` lists Fintava and Cardex settings, empty; no real key | passed | `FINTAVA_BASE_URL/API_KEY/WEBHOOK_SECRET`, `CARDEX_BASE_URL/API_KEY/SIGNING_SECRET/WEBHOOK_SECRET` all empty; diff scanned for live/test key patterns and private keys: none. URLs in the comments match `docs/fintava/reference/enviroments.md` and `docs/fintava/cardex.md` |
| 5. Production deploy files unchanged | passed | `git diff 231cb64 -- deploy .github` empty in the clone; `git diff main -- deploy .github` empty in the builder's worktree. Note the backend's local `main` is stale (aaa1d5b), so a clone of the worktree gets a stale `origin/main`; compared against 231cb64 explicitly |

Diff against the report: the 8 files in `git diff --stat origin/main...wmt/OPS-03` are exactly the builder's list (826 insertions, nothing else). No em-dash in the added lines.

Safety refusals, each run myself (one `.env` line changed, `up.sh` run, restored): non-local hub `DATABASE_URL`, non-local wawu-id `DATABASE_URL`, `127.0.0.2`, `NODE_ENV=production` in either `.env` and in the shell, Fintava live URL, `cdx_live_` and a non-Cardex key: all refused with exit 1 before touching anything, `.env` unchanged, no new log. Sandbox URL and a `cdx_test_` key passed the checks (controls). Harness: `verify-ops03/refusals.sh`.

### Findings

1. **defect.** The local-database guard can be walked past, and LOCAL.md section 4 (lines 102-104) promises it cannot. `up.sh` reads each `.env` with `grep -E "^KEY="` and keeps the last match (`scripts/local/up.sh` lines 43-49, used at 158-162), but the services, `prisma migrate deploy` and the seed load the file with dotenv 17, which also accepts `export DATABASE_URL=…` and an indented `  DATABASE_URL=…`, and lets the later line win. Appending `export DATABASE_URL="postgresql://u:p@db.example.invalid:5432/x"` (or the same line indented) to the hub `.env` passed every safety check (the run went on to the port check). I confirmed with the repo's dotenv that it resolves `DATABASE_URL` to the remote host for both forms, so migrate and seed would have written to it. The same textual match lets `FINTAVA_BASE_URL=https://LIVE.fintavapay.com/...` through (line 166-167 is case-sensitive). Low likelihood, but this guard is the task's "the live server is never touched".
2. **defect.** Fixing the Postgres address the way LOCAL.md says does nothing after a first failed run. Section 3 (lines 60-66) says to export `LOCAL_PG_URL`, and the troubleshooting row (line 291) says a migrate failure means "`LOCAL_PG_URL` is wrong". But `up.sh` uses `LOCAL_PG_URL`, `HUB_DB`, `ID_DB`, `HUB_PORT` and `ID_PORT` only when it first writes a `.env` (lines 103 and 133). A newcomer whose Postgres password is not `postgres` runs `up.sh`, gets the failure, exports the right `LOCAL_PG_URL` and reruns, and still fails. Reproduced in a second fresh clone: both `.env` files kept the old password and it failed again with `P1000: Authentication failed` in `id-migrate`. The table names only `hub-migrate`/`P1001`, and `id-migrate` runs first. LOCAL.md never says the overrides are first-run only (the `up.sh` header does).
3. **defect (minor, doc).** LOCAL.md line 284 says "To regenerate a `.env`, delete it and run `up.sh`". Doing that for `wawu-id/.env` alone makes `up.sh` write a new random service key that no longer matches the hub `.env`, so it refuses with "WAWU_ID_INTERNAL_SERVICE_KEY … differ" (lines 102-106, 173-174). With non-default ports it first refuses on the JWKS port instead. Reproduced both ways, then restored.
4. **defect (minor, doc).** LOCAL.md never mentions `HUB_PORT` / `ID_PORT`. The port-in-use row (line 289) offers only "stop what is on the port", so a newcomer with 3001 or 3002 taken has no documented way to move. They are only in `up.sh --help`.
5. **unclear (doc nits for the owner).**
   - Line 26-27 clone `https://github.com/<org>/…`: a newcomer reading only this page cannot fill `<org>`. The remotes are `B3rry4r/WAWU-Backend` and `B3rry4r/wawu-id`.
   - Line 49 `sudo apt install postgresql-16` works on Ubuntu 24.04 but not on 22.04 without the PGDG repo.
   - Lines 99-100 say a per-step log appears "if a step fails". Every step always writes one.
6. **unclear (outside this task, noticed while testing).**
   - wawu-id `/auth/register` returns an `accessToken` before the email is confirmed, so "login refused before email confirm" is not the whole gate.
   - The seeded `creator-basic` bio says "Basic tier, building my slots", which refers to the tiers that were removed (`prisma/seed.ts`).
   - Neither is caused by OPS-03.

NOT RUN: Docker Postgres route (no Docker daemon here), tunnel (no cloudflared/ngrok), a physical phone on Wi-Fi (both services answered on the machine's non-loopback address instead).

Verdict: capability checks 1-5 and V1, V9 pass. Findings 1-4 are open defects in the scripts and the page, so the status goes back to `building`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
