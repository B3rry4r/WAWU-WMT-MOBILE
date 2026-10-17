---
id: FIX-50
title: The BVN step names no checker
owner: YOU
area: FIX
order: 131
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: []
decisions: [R-6]
passes: [V1, V5, V6]
artboards: [A31]
---
# FIX-50 · The BVN step names no checker

## Current state

As of 17 Oct 2026.
- **Status:** verifying (builder round 1, Sonnet). Branch `wmt/FIX-50` in the mobile repo only, from `origin/wmt/FIX-47` `0626e38` (DV2-05 and FIX-47, the newest open-wallet code; both join batch 7).
- **Id and order:** order 131 is the lowest free launch slot on this base (135 is the other). FIX-48 also claims 176, FIX-47's: the lead renumbers at merge.
- **Built:** the owner's ruling on Q-36 (17 Oct 2026): "BVN steps should not say check with nothing." The lock line under the BVN and NIN fields no longer says who checks the number.
- **Open findings:** none. **Not run:** GitHub CI, a real device.
- **Next:** a fresh verifier; the lead merges with batch 7.
- **History:** [history/FIX-50.md](history/FIX-50.md).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/FIX-47.md` (the newest open-wallet code this stacks on)

## Goal

The BVN step (A31) says "Never shown on your profile." under the two number fields, with no NIBSS, bank or provider named as the checker.

## Scope

`src/features/open-wallet/OpenWalletScreen.tsx` (the `LOCK_LINE` constant) and the one assertion in `src/features/open-wallet/__tests__/OpenWalletScreen.test.tsx` that pins that line. No gate, baseline or other test.

## Capability checks

- [ ] A31 shows "Never shown on your profile." and no "NIBSS" anywhere on the step.
- [ ] `grep -rn -i -E "checked with|NIBSS|verified by" src` finds no user-facing string on a BVN or NIN step.
- [ ] The open-wallet tests, typecheck, lint on the two files, `npm run gates` and `npm run tasks` exit 0.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-50.md](history/FIX-50.md).

## Owner sign-off
