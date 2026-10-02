---
id: KYC-01
title: BVN check when someone opens a wallet
owner: YOU
area: KYC
order: 31
priority: launch
repo: wawu-id
type: backend-endpoint
status: todo
depends_on: [OPS-02]
decisions: [R-6]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# KYC-01 · BVN check when someone opens a wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Identity is checked when someone first opens a wallet or touches money, never at sign-up (R-6). The BVN confirms who they are and fills in their details (A5).

## Scope

BVN lookup (Fintava or the R-6 vendor), prefill name, date of birth and gender, store when it was verified plus a hash and the last 4 digits only. The full BVN and NIN go to account opening (MONEY-12) in the same flow and are never stored in full.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`GET /compliance/verify/bvn?bvn=` returns name, date of birth, phone, gender and a photo. State and occupation are not in it: the user types them on A5. Fintava also needs the **NIN and a full address** to open the account (MONEY-12), so this step collects them.

## Capability checks

- [ ] A valid sandbox BVN fills the A5 details.
- [ ] The full BVN is never stored or logged.
- [ ] A BVN whose phone differs from the one entered gives the A14 state.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
