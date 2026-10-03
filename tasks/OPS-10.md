---
id: OPS-10
title: Money on the production backend: live keys, webhook and charges
owner: YOU
area: OPS
order: 158
priority: launch
repo: wawu-backend
type: ops
status: todo
depends_on: [OPS-09, MONEY-07, MONEY-16, WALLET-15, WALLET-09]
decisions: [R-10, R-20, R-25]
passes: []
artboards: []
---
# OPS-10 · Money on the production backend: live keys, webhook and charges

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- wawu-backend `deploy/README.md` (step 4: the droplet's `/etc/wawu/hub-api.env`) and `.github/workflows/deploy.yml`
- `docs/fintava/fees.md`
- `docs/fintava/naira-api.md` (webhooks)

## Goal

Real money can move on the production backend: the DigitalOcean droplet that GitHub Actions deploys
(DECISIONS R-25; there is no staging). Until this is done, CHECK-2's small real payments cannot run.

## Scope

Owner actions, recorded here:
- Fintava's live key and webhook secret added to `/etc/wawu/hub-api.env` on the droplet (the list in wawu-backend
  `deploy/README.md` step 4); never committed, never in the app.
- The production webhook URL registered in Fintava's live dashboard.
- WAWU's merchant charges set in the live dashboard exactly as OPS-09 set them in the sandbox.
- The nightly check (MONEY-16) scheduled on the droplet and emailing the owner.

## Capability checks

- [ ] A ₦100 live bank send from a staff wallet shows the quoted total before the PIN, debits exactly that total, and the nightly check reports no mismatch the next morning.
- [ ] A live webhook from Fintava reaches the droplet and is processed once (MONEY-07).
- [ ] No Fintava secret appears in the repository, the app or the deploy logs.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off
