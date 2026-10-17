---
id: KYC-07
title: Complete your account: the flag on Home, and BVN and NIN as step 1 of 4
owner: YOU
area: KYC
order: 281
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [KYC-06, HOME-01, KYC-05]
decisions: [R-6, R-47]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A30, A31]
---
# KYC-07 · Complete your account: the flag on Home, and BVN and NIN as step 1 of 4

## Current state

As of 17 Oct 2026, builder round 1 done (Sonnet builder); waiting for a verifier.
- **Status:** verifying. Branch `wmt/KYC-07` in the mobile repo only, from `origin/wmt/KYC-06` `96f92d7` (it builds on KYC-06 round 2, not merged yet). No backend, wawu-id or migration change.
- **Built:** A30 `CompleteAccountFlag` above Home's balance card while `GET /money/wallet` `state` is `not_open` or `opening` (gone once open); it opens `/open-wallet`. A31 is that route's `OpenWalletScreen`: header "Complete your account" with "1 of 4" (`AuthFrame` `navStep`), "Verify your identity", hints "Dial *565*0# to get it" and "Dial *346# to get it", the lock line, Continue only; the phone mismatch (A14) is the board's banner over the form. The phone field and the "I don't have a Nigerian BVN" link are gone because A31 does not draw them.
- **The chain (real, end to end):** the Hub's `openingFlow` (read with `GET /money/wallet`) picks it. `review` (Nuvion, the Hub has no BVN check there): A31 holds the BVN and NIN in memory (`keepNumbers`), A5 (`ReviewDetailsForm`) takes name, date of birth, gender, town and state, then A26, A27 and A28 follow with no selfie before them (G-471); Submit sends `bvn`, `nin` and every typed field in the one open call (`detailsFromKept`). Anything else (the Hub with the BVN check): A31 runs the check, A5, A6, A7, A8 as before. The numbers and the typed details live only in `keptCheck.ts`, drop on every forget, are never stored or logged, and are shown nowhere but in A31's own fields.
- **Also:** the "voter's card" words are gone from A26. `npm run icons` added the canvas's `Flag` (and the other new canvas icons) to `src/components/icon/icons.generated.ts` (fenced: SHARED-CHANGES KYC-07 #2). No app name or licence line is printed by anything built here (R-67, R-69).
- **Checks:** see the builder report. Pictures (V5) of A30 and A31 at 390 px, light and dark, beside the boards, from a web export through stack `kyc_07`.
- **Open:** G-824 (under the review opening nothing on the phone knows the person's name, so A5 asks for it; owner may redraw), G-825 (the phone check happens inside the bank's review, so A14 cannot show before Submit there). KYC-06's G-820 is closed by this chain.
- **Next:** a verifier re-runs V1, V4, V5, V6, V7, V9 on this branch.

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

## Builder report

Builder (Sonnet), 17 Oct 2026.

**Files.** New under `src/features/open-wallet/`: `CompleteAccountFlag.tsx` (A30), `ReviewDetailsForm.tsx`, `reviewDetails.ts`, `ConsentBox.tsx` (the consent box A5 had inline, shared). Changed: `OpenWalletScreen.tsx` (A31), `ConfirmDetailsScreen.tsx` (picks the review form when numbers are held), `keptCheck.ts` (`keepNumbers`, `keepPerson`, `readNumbers`, `readPerson`, `useHeldReview`), `submit.ts` (`detailsFromKept` and `keptDetailsHeld` read both openings), `IdDocumentScreen.tsx` (copy), `entry.ts` (comments); `src/features/home/TodayScreen.tsx` (the flag), `src/features/auth/AuthFrame.tsx` (`navStep`), `src/app/open-wallet.tsx` and `open-wallet-details.tsx` (A5 goes on to A26 under the review opening). Fenced: `src/components/icon/icons.generated.ts` regenerated by `npm run icons` (SHARED-CHANGES KYC-07 #2).

**Checks (each a named test).** `reviewChain.test.tsx`: under the review opening A31's Continue sends no BVN check and holds the numbers in memory only (not in secure store, not in the console, gone on a forget); a number that is not 11 digits is refused and nothing is held; an older Hub still runs the check; A5's review form says what is missing, keeps what is typed beside the numbers and sends nothing; `detailsFromKept` builds the whole open call (numbers, typed details, never a handle); a ticket from before a forget holds nothing. `HomeScreen.test.tsx` (two new tests): A30 shows with no wallet and while opening, opens `/open-wallet`, and is gone once the account is open. `OpenWalletScreen.test.tsx`: A31 as drawn (title, "1 of 4", hints, lock line, no phone field, no link).

**Tests of KYC-05 I changed (the board changed what they assert).** `OpenWalletScreen.test.tsx`: the form-is-shown marker moved from the phone field (not drawn on A31) to the BVN field; four tests that read the phone's value now check that the form shows only after the signed-in account's own reads answer; the A14 tests read the board's banner instead of the Hub's sentence on the phone field; the "I don't have a Nigerian BVN" link test keeps its Hub-ended half (`phone_not_nigerian`).

**Not run.** The open call and the documents against a Hub (there is no Nuvion sandbox on this machine; the stack's Hub points at a closed port): the chain is proved by tests against stubbed routes and by pictures from the export. The date-of-birth and gender fields have no board.

**Recorded differences from the boards.** A30's card shows the Wallet tab's notice for a person with no wallet, not a hidden balance (no figure exists; R-47). A31's values are not letter-spaced (`TextField` has no such prop).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
