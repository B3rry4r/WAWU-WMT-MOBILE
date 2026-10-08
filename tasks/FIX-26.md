---
id: FIX-26
title: The limits lock always runs in a real transaction, and the money-route checks pin what they read
owner: YOU
area: FIX
order: 234
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [FIX-21]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-26 · The limits lock always runs in a real transaction, and the money-route checks pin what they read

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/FIX-21.md` (its verifier report: F1, F2, F3), `tasks/NUV-07.md`, `BACKEND_GAPS.md` G-410

## Goal

FIX-21's verifier found:
- **F3.** `assertMayMove` called without `tx` takes no lock and checks no level. Two movements of 600 both passed a daily 1,000 in 20 of 20 rounds. Passing the service's own client as `tx` compiles, passes the level check, and the lock ends with its own statement: also over the limit every round. No caller does either today.
- **F2.** Four mutants survive the specs: a guard instance not counted as its class; the walk ignoring a dynamic module's imports; class guards read with `getOwnMetadata` (inherited class guards missed); the level checked after the per-transaction limit.
- **F1.** Route shapes the coverage spec cannot see: a controller listed only in a dynamic module's `controllers`; a subclass of the PIN guard given by class; error codes documented on the class with `@ApiResponse`; global guards; a debit that documents nothing and carries no PIN guard.

## Scope

- `assertMayMove` takes `tx` as required (typed so the root client is refused at compile time where possible) and refuses at run time when `tx` is the service's own client; every caller passes its transaction.
- Specs that kill the four F2 mutants.
- The coverage spec walks dynamic modules' controllers and imports, counts guard subclasses as their base, reads class-level `@ApiResponse` codes, and, for the last F1 case, keeps a deny-by-default list: every non-GET route under `money/` must be either money-moving (and guarded) or named with a reason.
- No change to any answer a person can get today.

## Capability checks

- [ ] `assertMayMove` without a real transaction refuses; with one, 50 rounds of parallel movements never pass a limit.
- [ ] The four F2 mutants and each F1 shape fail the spec.
- [ ] Protected routes 253/253 with the lock unchanged.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
