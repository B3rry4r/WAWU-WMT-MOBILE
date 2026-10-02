---
id: MONEY-04
title: Money conventions and the wallet contract
owner: YOU
area: MONEY
order: 13
priority: launch
repo: wawu-backend
type: contract
status: todo
depends_on: [OPS-02]
decisions: []
passes: [V1]
artboards: []
---
# MONEY-04 · Money conventions and the wallet contract

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Mobile builds wallet screens against an agreed contract before Fintava is connected.

## Scope

docs/contract/CONVENTIONS.md (money in kobo, phone in +234 normalised by the server, one error shape, Idempotency-Key header, how the PIN is sent, cursor pages). Contract entries for wallet, PIN, transfers, pay-from-wallet, holds and history in the backend's registry, from Fintava's docs (OPS-02). Also: named schemas instead of the duplicated inline response shapes (BACKEND_GAPS G-1).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Fintava amounts are naira decimals (`2.75`, `"100.00"`), not kobo. The contract stays in kobo integers; conversion happens only inside the Fintava client (MONEY-06), by parsing the decimal string, never through a float. Fintava has no Idempotency-Key: ours is enforced by our backend, and our `CustomerReference` goes to Fintava where it is accepted.

## Capability checks

- [ ] Every wallet artboard's data needs (docs/analysis evidence, flow wallet) maps to a contract entry.
- [ ] Conflicts between the canvas and Fintava's real behaviour are listed for the owner, not resolved.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
