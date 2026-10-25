---
id: KYC-07
title: Complete your account: the flag on Home, and BVN and NIN as step 1 of 4
owner: YOU
area: KYC
order: 281
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [KYC-06, HOME-01, KYC-05]
decisions: [R-6, R-47]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A30, A31]
---
# KYC-07 · Complete your account: the flag on Home, and BVN and NIN as step 1 of 4

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder); waiting for a verifier.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/KYC-07.md`): verdict merge, nothing medium or worse. Stacked in batch 7 (backend and mobile `wmt/MERGE-7`). Branch `wmt/KYC-07` in the mobile repo only, from `origin/wmt/KYC-06` `96f92d7` (it builds on KYC-06 round 2, not merged yet). No backend, wawu-id or migration change.
- **Built:** A30 `CompleteAccountFlag` above Home's balance card while `GET /money/wallet` `state` is `not_open` or `opening` (gone once open); it opens `/open-wallet`. A31 is that route's `OpenWalletScreen`: header "Complete your account" with "1 of 4" (`AuthFrame` `navStep`), "Verify your identity", hints "Dial *565*0# to get it" and "Dial *346# to get it", the lock line, Continue only; the phone mismatch (A14) is the board's banner over the form. The phone field and the "I don't have a Nigerian BVN" link are gone because A31 does not draw them.
- **The chain (real, end to end):** the Hub's `openingFlow` (read with `GET /money/wallet`) picks it. `review` (Nuvion, the Hub has no BVN check there): A31 holds the BVN and NIN in memory (`keepNumbers`), A5 (`ReviewDetailsForm`) takes name, date of birth, gender, town and state, then A26, A27 and A28 follow with no selfie before them (G-471); Submit sends `bvn`, `nin` and every typed field in the one open call (`detailsFromKept`). Anything else (the Hub with the BVN check): A31 runs the check, A5, A6, A7, A8 as before. The numbers and the typed details live only in `keptCheck.ts`, drop on every forget, are never stored or logged, and are shown nowhere but in A31's own fields.
- **Also:** the "voter's card" words are gone from A26. `npm run icons` added the canvas's `Flag` (and the other new canvas icons) to `src/components/icon/icons.generated.ts` (fenced: SHARED-CHANGES KYC-07 #2). No app name or licence line is printed by anything built here (R-67, R-69).
- **Checks:** local full check EXIT 0 (typecheck, lint 0 errors, jest 187 suites and 3307 tests, gates 10 run, 702 files, 0 fail, 5 warn as on main, `npm run tasks`). Pictures (V5) of A30 and A31 (and A14) at 390 px, light and dark, beside the boards, from a web export through stack `kyc_07`: the flag and the form match; the one difference is A30's card (below).
- **Open:** G-824 (under the review opening nothing on the phone knows the person's name, so A5 asks for it; owner may redraw), G-825 (the phone check happens inside the bank's review, so A14 cannot show before Submit there). KYC-06's G-820 is closed by this chain.
- **Next:** the lead merges it with batch 7.

Status set to review by the records sync, 25 Oct 2026: merged as app 353c0009, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-6, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Until the wallet is open, Home shows a "Complete your account" flag that starts the identity steps, and the BVN and NIN step reads "1 of 4" (A31); the flag is an extra way in beside the first tap on Wallet (R-6).

## Scope

- New files under `src/features/open-wallet/` and a small change to Home's wallet card (HOME-01's `MoneyCard.tsx`, fenced to this task by the entry rule). A30: while `GET /money/wallet` `state` is not open the card shows "Complete your account / Verify your identity to get your account number"; it goes when the account is open (the flag stays until KYC is done).
- A31: the BVN and NIN step (KYC-05's fields) under the "Complete your account" header with "1 of 4", then the selfie hand-off, the ID document (A26) and the proof of address (A27). `POST /money/identity/bvn` and `GET /money/identity` are unchanged. The phone-does-not-match case still reaches A14.
- Route-graph row in SHARED-CHANGES queue 4: sign-up no longer asks for the BVN (A3, DV2-05).

## Capability checks

- [ ] A person with no wallet sees the flag on Home, taps it, and reaches A31.
- [ ] A person who has opened their wallet no longer sees the flag.
- [ ] A31 shows step 1 of 4 and moves to the next step with a matching BVN.
- [ ] Each board above (A30, A31) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/KYC-07.md](history/KYC-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
