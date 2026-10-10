---
id: JOIN-03
title: Event registration: claim the paid plan in the app with the access code
owner: YOU
area: WEB
order: 243
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: money-path
status: todo
depends_on: [JOIN-01, TIER-01]
decisions: [R-48, R-43, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# JOIN-03 · Event registration: claim the paid plan in the app with the access code

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, `docs/people/YOU.md`
- DECISIONS.md R-48 (the registration link and the owner's answers), R-43 (the tiers)
- `tasks/JOIN-01.md` (every round and verifier report: the access code, `failed` rows kept for refunds, notes N6 and the round 4 verifier's notes) and `tasks/JOIN-02.md` (the access code screen's words)

## Goal

A person who paid on wawuafrica.com/join gets what they paid for in the app. The owner's words on the access code
screen: "Your code is your key to redeeming your subscription discount when WHO MADE THIS? officially launches on
October 17, 2026. IMPORTANT: Without this code, you'll pay the standard subscription fee of ₦10,000."

## What the code redeems

R-48's answer, built as it stands: the code grants the plan the registration paid for (what Verify gives), its days
starting at claim. The access code screen's ₦10,000 line is what a person without a code pays at launch; it adds no
second price here. If the owner rules otherwise before this is built, the builder builds that.

## Scope (the parts that hold whatever the answer)

- Backend: a signed-in person claims a PAID registration with its access code; the claim proves the person holds the
  registration's verified phone or verified email (never the code alone); a `failed` (refund) row's code is refused;
  a code is claimed once; the claim records `claimedBy` and `claimedAt` and grants what the owner rules, starting at
  claim. The purge and data export maps updated.
- App: where a signed-in person enters the code (after sign-up and in the plan screen), the claim's answers in plain
  words, and what they now have.

## Capability checks

- [ ] A paid code claimed by the person holding its verified phone or email grants what the owner ruled, once.
- [ ] A code claimed by anyone else, a `failed` row's code, an unknown code and a second claim are each refused.
- [ ] The claim never shows another person's details.

## Owner sign-off
