---
id: DV2-COPY
title: Brand copy sweep: "Who Made This?", "Bank charge", "Banking by Nuvion"
owner: YOU
area: DESIGN
order: 292
priority: launch
repo: wawu-wmt-mobile
type: component
status: review
depends_on: [DV2-01, DV2-02, DV2-05, DV2-06]
decisions: [R-69, R-53, R-67, R-68, R-37]
passes: [V1, V4, V5, V6]
artboards: [A2, E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, X5, X14, X15, H22, H35, I1, I3, I6, I12, I13, I15, I16, I17, M33, P2, P3, SC4, SC9, S14, S15, S16, S17, S24, S27, S28, S29, S31, Z3, W7, W8, W24, W25, W29, W31, W32]
---
# DV2-COPY · Brand copy sweep: "Who Made This?", "Bank charge", "Banking by Nuvion"

## Current state

As of 17 Oct 2026, built by a Sonnet builder (T0 copy); accepted by the lead.
- **Status:** merging (lead). Accepted by the lead (T0, 17 Oct 2026). Stacked in batch 11 by MERGE-11 inside OPS-R1 (mobile `af5a2760`, which OPS-R1 `9e69b451` holds). Branch `wmt/DV2-COPY` in the mobile repo only, from `origin/wmt/MERGE-10` `4b854ee4`. Copy only: no layout, colour or behaviour change; no backend change.
- **Built:** the app's name is one constant, `APP_NAME_COPY` = "Who Made This?" in `src/lib/appName.ts`, and every string that names the app builds from it. The provider's part of a fee reads "Bank charge" on the pay sheet preview, the receipt, history detail and the send screens (`FEE_LABELS.provider`). The legal chat header is "Who Made This? Legal" (S14 to S17).
- **Already right on this base, checked and left:** Z9 "Banking by <bank the Hub names>", A3 "I agree to the terms and privacy policy", the licence and deposit-insurance lines (the Hub's `licenceLine` and `depositInsuranceLine` print only when the Hub sends words, and it sends none), no CBN, "held at Nuvion" or "Tier 1" line, no ElevenLabs, no sample advertiser, no Instagram card (the phone's share sheet only).
- **Done by OPS-R1:** SHARED-CHANGES DV2-COPY #2 (fenced): `BrandMark.tsx` `APP_NAME` and `app.json` `expo.name` now say "Who Made This?", with `brand.test` and `auth-welcome.test`. The launcher name shows from the next development build.
- **For the owner, not changed:** the 16 Oct boards print "Who Made This? Credits" (S-series Buy Credits sheet) and "Who Made This? card", but this task and R-37's "where WAWU stays" keep WAWU Credits and the WAWU card. `HostedSelfieScreen` says "Our banking partner, Nuvion, takes your selfie" (A6, not in this task's boards; Nuvion is the bank R-67 shows).
- **Next:** the batch 11 pull request.

Status set to review by the records sync, 25 Oct 2026: merged as app 170f8f56, lead acceptance in this file (accepted by the lead, T0).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-69, R-53, R-67, R-68, R-37 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Every built screen and string that names the app says "Who Made This?" with the question mark (R-69), the provider's part of a fee says "Bank charge" (R-53), the bank line says "Banking by Nuvion" (R-67), and no outside brand name remains (R-68). Licence and CBN lines stay hidden until the owner confirms their words.

## Scope

- Copy only; no layout, colour or behaviour changes. The restyled boards in the artboards list differ from the old canvas only by this wording (the REPORT's 49). Done tasks covered: AUTH-02, EVENTS-01, EVENTS-03, FIX-30, INBOX-04, LEGAL-02, PROS-01 and the in-flight EXPLORE-02, SHARED-07, WALLET-02 once merged. Todo tasks that print the name carry a dated line in their Current state and build it right; this task re-checks them last.
- Where the name lives: find every string with `grep -rn "Who Made This" src` and `"WAWU"` in user-facing copy (R-37's "where WAWU stays" list is unchanged: WAWU Credits, WAWU ID, WAWU Africa in legal text, the WAWU card). Prefer one constant for the app name if the codebase has none (a `src/lib/` file, not a fenced path).
- Fee labels: "Fintava's charge" and "Nuvion's charge" become "Bank charge" in the pay sheet, the receipt and history detail (`src/components/pay-sheet/`, `src/features/wallet/history/`). That path is shared: SHARED-CHANGES row DV2-COPY #1.
- Z9: "Banking by Nuvion". A3: "I agree to the terms and privacy policy". Hidden until confirmed (R-67): "licensed by the CBN" (W41 to W43), "Limits set by the CBN" (A17, A19), "held at Nuvion" (Z10), "Tier 1 · Nuvion". The Hub's `licenceLine` and `depositInsuranceLine` stay empty and unprinted.
- The ad and share-card samples ("Kora Foods", Instagram) are drawings; the app prints real campaign data and the phone's share sheet only (R-68).

## Capability checks

- [ ] A search of the shipped strings finds no "Who Made This" without the question mark where the app names itself, and no "WAWU" where R-37 says the app is named.
- [ ] The pay sheet, the receipt and history detail label the provider's part "Bank charge".
- [ ] No screen prints a licence or CBN line, and none prints ElevenLabs, Instagram or a sample advertiser.
- [ ] Jest snapshots and copy checks are updated by the task and still pass (`npm run check` EXIT 0); no test is weakened.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/DV2-COPY.md](history/DV2-COPY.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
