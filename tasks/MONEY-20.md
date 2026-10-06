---
id: MONEY-20
title: Wallet provider seam, one interface with Fintava behind a switch
owner: YOU
area: MONEY
order: 181
priority: launch
repo: wawu-backend
type: backend-refactor
status: verifying
depends_on: [MONEY-06, MONEY-07, MONEY-08, MONEY-09, MONEY-10, MONEY-11, MONEY-12, MONEY-13, MONEY-14, MONEY-15, WALLET-14, WALLET-15]
decisions: [R-39, R-1, R-19, R-20]
passes: [V1, V2, V3, V9]
artboards: []
---
# MONEY-20 · Wallet provider seam, one interface with Fintava behind a switch

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- DECISIONS.md R-39 (this task's ruling)
- The lead's Fintava inventory and Nuvion research (6 Oct 2026, lead's scratchpad `nuvion/FINTAVA-INVENTORY.md` sections 2, 7, 8, and `nuvion/NUVION-RESEARCH.md` with the raw docs in `nuvion/docs/`)

## Goal

Owner, 6 Oct 2026: Fintava is being replaced by Nuvion, and **"Fintava's removal should not be permanent but
something of an easy roll back"**. Today eight services in `src/money/` take `FintavaClient` directly and there is
no provider layer, so swapping providers would mean rewriting them, and rolling back would mean rewriting them
again. This task puts one provider-neutral interface between the money code and the provider, with Fintava as the
first adapter and one setting, `WALLET_PROVIDER`, choosing it at boot. Rollback is changing that setting and
restarting. Nothing a user, the app, the web or the dashboard sees changes.

Also covered (done, after-launch, so not in `depends_on`: a launch task may not depend on after-launch ones):
WALLET-18 (receipts) and WALLET-27 (statements). Neither calls the provider; their specs run unchanged in the
full suite.

## Scope

- wawu-backend only. New `src/wallet-provider/` (interface, neutral error, config, Nest module, specs); new
  Fintava adapter `src/fintava/fintava-wallet-provider.ts`; Fintava's delivery parser moved into `src/fintava/`;
  every `src/money` service that used `FintavaClient` re-pointed at `WALLET_PROVIDER` (or `OTP_SENDER`).
- No behaviour change: no route, field, status code, error code, migration or contract change. Existing money
  and Fintava specs pass unchanged in meaning (only imports and wiring may change).
- Keep every Fintava file. Do not rename or drop the Fintava-named tables.
- `WALLET_PROVIDER=nuvion` is reserved: a clear startup error until the Nuvion adapter task lands. Never call
  Nuvion or any Fintava host (stand-ins only).

## Capability checks

- [x] No file under `src/money/` (tests aside) imports anything under `src/fintava/`; a spec fails if one does.
- [x] `WALLET_PROVIDER` unset or `fintava` boots with the Fintava adapter; `nuvion` stops the server at boot with a message that says how to roll back; any other value stops it too.
- [x] Every existing money and Fintava spec passes with the same assertions; `contract/openapi.json` comes out unchanged.

## Builder report

## Verifier report

## Owner sign-off
