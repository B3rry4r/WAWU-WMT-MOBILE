---
id: FIX-47
title: No blank page while Open your wallet sends the ID and address details
owner: YOU
area: FIX
order: 135
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: []
decisions: [R-6, R-39]
passes: [V1, V5, V6]
artboards: [A27, A31]
---
# FIX-47 · No blank page while Open your wallet sends the ID and address details

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-47.md`, verdict merge for its own change; the report's high finding is pre-existing and went to FIX-51). Stacked in batch 8 by MERGE-8. Branch `wmt/FIX-47` in the mobile repo only, from `origin/wmt/DV2-05` `960c40d` (DV2-05 round 2, checked, joins batch 7 next). No backend, wawu-id or migration change.
- **Id and order:** order 135 (renumbered at the batch 8 merge: 176 was also STACK-NUV's and FIX-48's, and 135 was the only free order below CHECK-3 (298) left once FIX-50 held 131 and FIX-48 took 0). It depends on nothing; its true place is just after DV2-05, which it is stacked on; the lead can move it.
- **Built:** the cause was not A5's restart alone. A27's first call (`POST /money/wallet/open`) puts the opening in the query cache, so A31 (under A5, A26, A27) read "belongs further on", swapped its step for the resume fallback and UNMOUNTED it; that unmount forgets the BVN and NIN A5 holds and removes the opening's queries, so A5's `lost` effect fired `restart` (`dismissTo('/open-wallet')`) about 70 ms after Submit and A27 went with the pop. Three changes: (1) `ReviewResume` keeps its step mounted while it is not the screen in front (`active` false); (2) A5 does not call `restart` while a send is in flight (`useOpeningSending`, DV2-05's `sending.ts`); (3) A31's fallback (`ResumeFallback`) draws a busy state (a line and two skeleton blocks) while a send is in flight, and the same empty frame as before otherwise.
- **Kept:** every DV2-05 round 2 behaviour (A6 when only the selfie is left, A28 otherwise, the loop guard, the poll, the taps); a flow with no opening on the Hub still restarts from A5 as before.
- **Checks:** new `duringSend.test.tsx` (7 tests, real A31, A5 and A27 stacked): 5 fail on `960c40d`'s code, all 7 pass now. Browser chain on the stack `fix_47`: see the builder report in tasks/history/FIX-47.md.
- **Open findings:** none. **Not run:** GitHub CI, a real device, a real Nuvion page.
- **Next:** a fresh verifier; the lead merges with batch 7 after DV2-05.
- **History:** tasks/history/FIX-47.md.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/DV2-05.md` and `tasks/history/DV2-05.md` (round 2 and the verifier's P1, which this closes)

## Goal

During A27's Submit the person stays on A27 with its busy state for the whole send, then moves on by the Hub's answer exactly as DV2-05 round 2 does (A6 when the selfie is next, A28 otherwise).

## Scope

`src/features/open-wallet/` and `src/app/open-wallet.tsx` only: `ReviewResume.tsx`, `ConfirmDetailsScreen.tsx`, new `ResumeFallback.tsx`, new `__tests__/duringSend.test.tsx`. No gate, baseline or existing test is changed.

## Capability checks

- [ ] Submit with the second upload held 2 s and 4 s (selfie due, and selfie off): A27 with a spinning Submit is on screen for every picture taken every 300 ms, then A6 or A28; no `history.go(-3)` before the release.
- [ ] A back press during the send lands on A26, the uploads finish, nothing redirects.
- [ ] A5 with nothing held and no opening on the Hub still restarts; A31 alone and asking draws only its frame.
