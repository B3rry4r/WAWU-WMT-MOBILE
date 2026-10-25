---
id: FIX-63
title: Signed-in screens are guarded (every route that needs a session sits in the signed-in group)
owner: YOU
area: FIX
order: -63
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
tier: T1
depends_on: []
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-63 · Signed-in screens are guarded

## Current state

As of 18 Oct 2026, merging (lead): accepted on a diff read and stacked in batch 16.
- **Status:** merging (lead). The lead read the list and the test (`delete-account/scheduled` is reached signed in and signs out itself). Stacked in batch 16 by MERGE-16 (mobile `wmt/MERGE-16`); not on main.
- **Merge (MERGE-16):** the test fails on any route file that is neither listed nor public, so MERGE-16 listed the 7 signed-in route files batches 15 and 16 added (`community/new`, `community/created/[id]`, `community/pass/[id]`, `community/requests/[id]` from INBOX-14; `paid-questions/[wawuId]` from INBOX-18; `profile/[wawuId]` from ME-02, signed in only, its app link stays `/u/<handle>`, already public; `studio-tool` from POINTS-07/08) and put `+not-found` (SWEEP-APP-1, CHECK-1 F-1) on the public list: it is the router's answer to an address no screen has, so it cannot sit behind a session, and it leaves to welcome (signed out) or Home. No assertion changed. SWEEP-APP rows SCHOOLS-10 L4, SHARED-05 L4 and ADS-01 L4 carry this task's cells beside SWEEP-APP-1's marks.
- **Status:** verifying (round 1). Built by a Sonnet builder (tier T1). Mobile `wmt/FIX-63` from `origin/wmt/MERGE-14` `d76612f6`. No backend, contract, migration or Fintava change; no new route; no auth logic.
- **Found by:** SWEEP-APP-1's check (SWEEP-APP row 51, SHARED-05 L4): route files not listed in `_layout.tsx` open to a signed-out visitor or a deep link. 84 were unlisted; 81 of them already sent a signed-out visitor to `/welcome` from their own route file, and 3 had no such redirect (`community/[id]` draws its own sign-in prompt signed out; `legal` and `tgif` drew their screen).
- **Built:** the 84 are listed in the signed-in group that already holds Settings, Edit profile and Open your wallet (`signedIn && !gate.needsEmail && !offer.visible`), so the layout is the one place that sends a signed-out visit to the welcome screen (the existing pattern; their own redirects are left). SHARED-CHANGES FIX-63 #1 (the layout is fenced); it also applies the two open queue 4 rows WALLET-06 R1 and WALLET-04 R1.
- **Public list (not guarded, each on its own sending a signed-out visitor on):** `about`, `terms`, `privacy-policy`; the seven app links `r/[code]`, `selfie`, `activate`, `receipt/[code]`, `u/[handle]`, `c/[slug]`, `content/[id]`; `claim-code`; the development-only `dev/components` and `preview/*` (8). `r/[code]` is "the invite route"; `invite`, `invite-card` and `invite-rules` (Invite and earn) are signed-in screens and are guarded.
- **Return path:** the app has one, `/claim-code` (signed out goes to sign-in and the sign-in comes back, JOIN-03 round 3 N14), so it stays outside the group: the access-code step pushes it while the group is closed. Every other guarded route lands a signed-out visit on the welcome screen, as the group already did; nothing new remembers a visit.
- **Test:** `src/__tests__/route-guard.test.tsx`. Static: every route file is in a signed-in group, the signed-out set or the written public list (fails with the file names: shown by adding a stray route file and by removing `tgif` from the layout, both red); no name in the layout without a file; no public route also guarded; each route in one group; each app link in `src/lib/appLinks.ts` has its public route; dev screens use `LeaveDevRoute`; `claim-code` keeps its own guard. Runtime: the real layout with a stand-in per plain signed-in route, read from the layout (105): signed out lands on the welcome screen and shows nothing of it, signed in shows it.
- **Records:** SWEEP-APP rows 46 (SCHOOLS-10 L4, ruled no, reason corrected: `purge` is called at `src/account/account-deletion-sweep.service.ts:677`, `SchoolLinkClick` is OWNED at `src/account-purge/account-data-map.ts:113`), 51 (this fix) and 61 (ADS-01 L4, ruled no: the chip is the fixed word SPONSORED); the comment above `advertiser` in `src/features/ads/api.ts` says so. The Hub's own comment (`wawu-backend` `src/ads/ads-text-limits.ts:18`, "SPONSORED · <advertiser>") says the opposite and is the backend's to change.
- **Checks:** jest, the whole run once: 270 suites, 4649 tests, EXIT 0 (the new `route-guard.test.tsx` 219 of 219, with `route-graph`, `shell`, `appLinkRoutes`, `auth-guard`, the claim, invite and open-wallet route tests among them); `tsc --noEmit` EXIT 0; eslint EXIT 0 on `_layout.tsx`, `route-guard.test.tsx` and `ads/api.ts`; gates passed (0 fail, 15 warn, none new) and baseline ok; `check_tasks` ok after `--write`. Code `452c08fc`.
- **NOT RUN:** a phone (V10); mobile CI (not pushed to a PR).
- **Next:** the verifier. A lead merge of batch 15 takes `_layout.tsx` and `SHARED-CHANGES.md` (a conflict there is a union of rows).

Status set to review by the records sync, 25 Oct 2026: merged as app 3e43f77c, lead acceptance in this file (accepted on a diff read).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `src/app/_layout.tsx` (the header comment), `src/__tests__/route-guard.test.tsx`, SHARED-CHANGES FIX-63 #1

## Goal

A signed-out person, or a deep link, never lands on a screen meant for a signed-in person, and a screen added later cannot be left open by accident.

## Capability checks

- [x] A signed-out visit to any route that needs a session lands on the welcome screen and draws nothing of that route (105 routes, real layout).
- [x] A signed-in visit to the same routes draws them.
- [x] The seven app links, About, Terms and Privacy policy, `/claim-code` and the development screens stay open as before (appLinkRoutes, route-graph, claim tests green).
- [x] A route file that is neither listed in a signed-in group nor on the public list fails a test.

## Owner sign-off

Not needed.
