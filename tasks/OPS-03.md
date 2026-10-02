---
id: OPS-03
title: Run the backend locally for testing
owner: YOU
area: OPS
order: 4
priority: launch
repo: wawu-backend
type: setup
status: todo
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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
