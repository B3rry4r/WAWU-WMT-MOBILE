---
id: CHECK-1
title: Checkpoint 1: the app talks to the real backend, screens match the design
owner: YOU
area: CHECK
order: 130
priority: launch
repo: all
type: ops
status: review
depends_on: [CHECK-0, SHELL-03, AUTH-01, HOME-02]
decisions: [R-24, R-25]
passes: [V11]
artboards: []
---
# CHECK-1 · Checkpoint 1: the app talks to the real backend, screens match the design

## Current state

As of 16 Oct 2026. The audit was written on 7 Oct (mobile main f0b81c9, backend 6c0e435, wawu-id 4715d17); all three have moved a long way since.
- **Status:** review. The audit is done and waits for the owner's sign-off. No branch of its own, nothing to merge.
- **Result:** check 1 passed against the real backend (sign-in, expired-token refresh, read back of an edited bio). Check 2: 33 artboards compared picture against picture, 16 match, 17 differ, 237 were unbuilt that day. V10 (a phone) not run: the owner's step.
- **Open findings, graded by the auditor on 7 Oct.** Whether each still stands today: unknown, ask the lead. Only F-3 is visibly closed (tasks/AUTH-07.md exists now and is done).
  - blocker: none. high: F-2 (R-38 names the bottom bar Home, Communities, Explore, Messages, Settings; the app and the canvas use Home, Explore, Inbox, Wallet, Me; needs the owner's ruling).
  - medium: F-3 (no task carried R-39's AUTH-07; now closed), F-4 (five placeholder tabs; a consequence of task order), F-5 (wawu-id refresh checks every stored token with argon2 and nothing prunes them; no open task).
  - low, in sweeps: F-1 and F-7 in tasks/SWEEP-APP.md, F-6 and F-8 in tasks/SWEEP-AUTH.md. Info: F-9 to F-12 (recorded, no action).
- **Next:** the lead says which of F-2, F-4 and F-5 still stand; the owner signs off; status becomes done.
- **Records:** the whole audit (sections 1 to 11, 297 artboard rows) is in [history/CHECK-1.md](history/CHECK-1.md).

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/AUDITOR.md`
- `docs/people/YOU.md`

## Goal

Prove the app talks to the real backend, signed in for real, and that the screens built so far match the
design. It gates nothing; payment work continues alongside.

## Scope

Dispatch an AUDITOR session over everything marked done so far.

## Capability checks

- [ ] A tester signs in against the backend running locally from wawu-backend's `scripts/local/up.sh` (OPS-03) with seeded data, through the web build or an emulator, with the real login, and sees a seeded creator's real content (V9).
- [ ] Every screen built so far is compared picture against picture in the audit, or listed as not reachable with a reason.
- [ ] A preview build runs on the owner's Android phone and signs in against the live services (`https://api.wawuafrica.com`, `https://id.wawuafrica.com`), as every tester build does (V10, Android only; R-24, R-25). Tester builds are not pointed at the local backend; money paths wait for OPS-10.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/CHECK-1.md](history/CHECK-1.md).

## Owner sign-off

_Owner: date, and "go" or what blocks it._
