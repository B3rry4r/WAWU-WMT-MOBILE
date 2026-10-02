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

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
