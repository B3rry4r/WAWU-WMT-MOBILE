---
id: NUV-10
title: Nuvion on the production backend: live key, webhook, operational account, fees and limits
owner: YOU
area: MONEY
order: 221
priority: launch
repo: wawu-backend
type: ops
status: todo
depends_on: [NUV-01, NUV-02, NUV-03, NUV-04, NUV-05, NUV-06, NUV-07, NUV-08, NUV-09]
decisions: [R-39, R-42, R-25]
passes: []
artboards: []
---
# NUV-10 · Nuvion on the production backend: live key, webhook, operational account, fees and limits

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- DECISIONS.md R-25 (no staging), R-39, R-42
- `tasks/OPS-10.md` (the Fintava version this replaces)
- wawu-backend `deploy/README.md`

## Goal

Real money can move on Nuvion on the production backend (the droplet GitHub Actions deploys; R-25). This is the
one task that truly waits for Nuvion: a working sandbox key first, then the live key and Nuvion's written NGN
fees and limits.

**Replaces or rewires** (PLAN-PAY, 8 Oct 2026; nothing is deleted):

- OPS-10 (money on the production backend: Fintava live keys, webhook and charges): obsolete; this is its Nuvion version.
- OPS-09 (Fintava merchant charges): obsolete (NUV-07).

## Scope

- Owner actions, recorded here: a sandbox key that works (`GET https://api.nuvion.dev/bank-codes/NG` answers 200); Nuvion's written NGN fees and limits; the live key, webhook secret, operational account id and the `NUVION_WALLET_*` bank, licence and deposit-insurance lines in `/etc/wawu/hub-api.env`; never committed.
- Lead actions: every (key) check of NUV-01 to NUV-09 run locally against the sandbox and recorded in those task files; `POST /entity-webhooks` for `https://<host>/api/hub/webhooks/nuvion`; `WALLET_PROVIDER=nuvion` and a restart; the nightly check (MONEY-16) scheduled.

## Capability checks

- [ ] Every (key) check in NUV-01 to NUV-09 has been run against the sandbox and recorded in its task file.
- [ ] Every fee and limit setting is filled from Nuvion's written answer, cited in this file.
- [ ] The production webhook is registered, and a `POST /webhook-tests` delivery is stored once on the droplet.
- [ ] Rollback rehearsed on the droplet: `WALLET_PROVIDER=fintava` and a restart boots, health 200, and no Nuvion row is touched.

## Builder report

## Verifier report

## Owner sign-off
