---
id: STACK-NUV
title: The local test stack runs the Hub on Nuvion, with a local Nuvion stand-in
owner: YOU
area: OPS
order: 176
priority: launch
repo: wawu-backend
type: ops
status: review
depends_on: []
decisions: []
passes: [V1, V2]
artboards: []
---
# STACK-NUV · The local test stack runs the Hub on Nuvion, with a local Nuvion stand-in

## Current state


As of 25 Oct 2026.
- **Status:** review. Independent lean verifier (T2 check, 25 Oct): PASS, no open defect. Checked on backend `origin/main` `dcee8af`, the stack and tool as they are today (later tasks have grown them: NUV-12, WALLET-31, WALLET-41).
- **Id and order:** filed at launch priority, order 176 (see the earlier note in the history file).
- **Open findings:** none medium or worse. Two lows, for the lead to place in a sweep (see the history file).
- **History:** the builder report and the verifier report are in [history/STACK-NUV.md](history/STACK-NUV.md).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The backend README, "Local test stack", and `scripts/dev/stack.sh`

## Goal

Nuvion is the wallet provider (R-39, R-45) and Fintava is out. Before this task `scripts/dev/stack.sh` had no `WALLET_PROVIDER` switch: a stack Hub came up on the default settings (Fintava, pointed at a closed port) and the only Nuvion stand-ins were in-process test doubles. No builder or verifier could run a real Hub on Nuvion. Now the stack always runs `WALLET_PROVIDER=nuvion` against a local Nuvion stand-in, so every money path can be driven through the real Hub routes.

## Scope (dev tooling only; no product code, no Fintava file, no gate, baseline or test)

- `scripts/dev/stack.sh`: the Hub starts with `WALLET_PROVIDER=nuvion`, always. No Fintava option; the Fintava settings stay on the closed port. The stand-in takes the port below the mock WAWU ID (the range needs one more port). `status` names the provider and the stand-in's port; `down` stops it.
- `scripts/dev/nuvion-standin.cjs`: a small node server with the routes the Nuvion adapter calls, in the shapes of the in-process double (`test/nuvion/`), and webhooks signed the way the Hub verifies them, with a test secret the stack sets.
- `scripts/dev/nuvion-redirect.cjs`: the Hub refuses any `NUVION_BASE_URL` but Nuvion's two hosts, so the stack gives it the sandbox host and this preload (after `block-net.cjs`) sends that one host to the stand-in on 127.0.0.1. `block-net.cjs` is unchanged and still refuses everything else.
- `scripts/dev/nuvion-tool.cjs`: `seed` (a person with an approved, funded wallet through the Hub's routes) and `fire` (one signed webhook).
- README "Local test stack": the stand-in, the two commands.

## Capability checks

- [x] A fresh stack on its own ports comes up with `status` naming provider nuvion and the stand-in port; `down` stops all of it and closes the ports.
- [x] `nuvion-tool.cjs seed` ends with an approved wallet, an account number, a PIN and a balance that is the same on `GET /money/wallet/balance` and on the stand-in.
- [x] A WAWU Credits pack bought from that wallet, and a bank send with a name check, complete through the real routes; the balances match the stand-in after each.
- [x] `nuvion-tool.cjs fire --settle <id> --status reversed` on the bank send gives the money back (balance matches the stand-in).
- [x] The Hub log holds no call to the Fintava base URL (0), and `block-net.cjs` refused nothing.
- [x] Backend `tsc --noEmit` EXIT 0; CI gates unchanged.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/STACK-NUV.md](history/STACK-NUV.md).

## Owner sign-off

