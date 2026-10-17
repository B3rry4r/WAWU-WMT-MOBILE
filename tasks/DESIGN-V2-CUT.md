---
id: DESIGN-V2-CUT
title: Cut the 16 Oct 2026 designs and answers into rulings and tasks
owner: YOU
area: DESIGN
order: 253
priority: launch
repo: wawu-wmt-mobile
type: ops
status: done
depends_on: []
decisions: [R-50, R-51, R-52, R-53, R-54, R-55, R-56, R-57, R-58, R-59, R-60, R-61, R-62, R-63, R-64, R-65, R-66, R-67, R-68, R-69]
passes: []
artboards: []
---
# DESIGN-V2-CUT · Cut the 16 Oct 2026 designs and answers into rulings and tasks

## Current state

As of 16 Oct 2026. Docs work only: `DECISIONS.md`, `tasks/`, `design/canvas-inventory.json`, `BACKEND_GAPS.md`, `SHARED-CHANGES.md`. No product code.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Branch `wmt/DESIGN-V2-CUT` (from `wmt/DESIGN-V2` 7dfa914, main 74b1edb). A fresh session verifies; the builder does not.
- **Rulings:** R-50 to R-69 hold all 28 owner answers of 16 Oct (map below). Old rows carry "Updated by" pointers; none deleted.
- **Tasks:** 38 new task files, 2 re-cut (ME-12, INBOX-14), 1 cancelled (WALLET-36, file removed), 28 todo files updated in place (14 only get one copy line), this file. Of the 78 added boards, 75 are claimed and 3 dollar variants are not built (VF5a, VF13a, PT4a).
- **Orders:** the block is 253 to 293; CHECK-3, RELEASE-02 and every after-launch task moved up by 45 (CHECK-3 is 298). ME-12 and INBOX-14 moved into the block (new dependencies).
- **Merge note for the lead:** MERGE-5 files FIX-40, FIX-41, FIX-42 (orders 290 to 292) and FIX-43 (284). Those orders now belong to the block or the tail. Give them orders after the tail's last (334) when merging.
- **Next:** verify (counts, `npm run tasks` EXIT 0, rulings read against the answers), then the lead dispatches by wave below.

## Answers to rulings to executing task

1 R-50 SETTINGS-06 r7 | 2, 6 R-51 WALLET-37 | 3, 4 R-52 BILLS-04 r2 and DV2-RM | 5, 16 R-53 WALLET-02, DV2-COPY | 7 R-57 EXPLORE-06 | 8, 9, 15 R-58 DV2-01 and none
10, 11, 21 R-59 DV2-01, EXPLORE-07, HOME-16, ADS-07, DV2-RM | 12 R-54 WALLET-39 | 13, 27 R-55 WALLET-16 (file updated) | 14 R-60 GATES-02 | 17 R-61 DV2-01, POINTS-07, DV2-RM
18 R-62 INBOX-22, INBOX-23, INBOX-13 | 19 R-63 INBOX-24, INBOX-14 | 20 R-64 HOME-13, ME-08 | 22 R-65 TIER-06 | 23 R-66 DV2-COMP, VERIFY-03 | 24 R-67 DV2-COPY | 25 R-68 DV2-COPY | 26 R-69 DV2-COPY | 28 R-56 NUV-08

## Tasks by wave (dispatch order inside a wave is the order column)

Wave 1: nothing open blocks it. Wave 2 and up: waits for an earlier wave or for a task now building or verifying (the "after" column names them). Pass: wave = a screen wave; backend = a backend wave; shared-change, removals and flow are the named serial passes (law 6).

| w | order | task | size | boards | after | pass |
|---|---|---|---|---|---|---|
| 1 | 254 | GATES-02 | S | none | - | backend |
| 1 | 260 | HOME-16 | M | H36, Z2 | - | backend |
| 1 | 261 | WALLET-39 | M | W46 | - | backend |
| 1 | 262 | TIER-06 | M | W44, VF*, PT* | - | backend |
| 1 | 263 | TIER-07 | M | M1, M5-M7, VF7a | - | backend |
| 1 | 280 | KYC-06 | M | A26-A29 | - | wave |
| 2 | 255 | WALLET-37 | S | A21 (copy) | WALLET-09 | backend |
| 2 | 256 | EXPLORE-06 | S | X5 | EXPLORE-05 | backend |
| 2 | 257 | ADS-07 | M | X1, H1 | ADS-01 | backend |
| 2 | 258 | INBOX-22 | L | I24-I28 | INBOX-16, WALLET-17 | backend |
| 2 | 259 | INBOX-24 | L | I30-I32 | WALLET-17, INBOX-16 | backend |
| 2 | 264 | REF-02 | M | RF1-RF4 | TIER-06 | backend |
| 2 | 265 | EVENTS-12 | M | E21 | TIER-07, EVENTS-11 | backend |
| 2 | 266 | VOICE-01 | L | VF3-VF11 | POINTS-03 | backend |
| 2 | 267 | AITOOLS-01 | L | PT1, PT2 | TIER-06, POINTS-03 | backend |
| 2 | 268 | DV2-COMP | M | M1, VF11, VF14, M19, PT5 | SHARED-06 | shared-change |
| 2 | 281 | KYC-07 | M | A30, A31 | KYC-06 | wave + flow |
| 2 | 285 | WALLET-38 | S | W44 | TIER-06 | wave |
| 2 | 291 | DV2-06 | S | Z2, Z3, Z9, Z10 | HOME-16 | wave |
| 3 | 269 | VERIFY-01 | M | VF1, VF2, VF2a, VF2b | DV2-COMP, ME-04 | wave + flow |
| 3 | 270 | ME-12 | L | VF5, VF5b, VF6, VF6a-d, VF7, VF7a (re-cut from M11-M14) | DV2-COMP, ME-04, TIER-05, WALLET-05 | wave |
| 3 | 275 | POINTS-05 | M | PT5, PT5a, PT6, PT6a-b | DV2-COMP | wave |
| 3 | 279 | REF-03 | M | RF1, RF1a-b, RF2, RF3, RF3a, RF4 | REF-02, DV2-COMP | wave |
| 3 | 282 | EXPLORE-07 | M | X16, X17 (+X1) | ADS-07, HOME-16, ADS-01 | wave |
| 3 | 283 | INBOX-23 | M | I38 (+I24-I26) | INBOX-22, INBOX-13 | wave |
| 3 | 284 | INBOX-14 | L | I30-I34, I37 (re-cut) | INBOX-24, WALLET-17, AUTH-06, ME-04, ME-07 | wave |
| 3 | 286 | DV2-01 | M | H1, H36, H29-H34 | HOME-16, DV2-COMP, ADS-01, ME-04 | wave |
| 3 | 288 | DV2-03 | M | M1, M2, M4, M10 | DV2-COMP, ME-04 | wave |
| 3 | 290 | DV2-05 | M | A3, A4, A6-A8, A14, A15 | KYC-07 | wave |
| 4 | 271 | VERIFY-02 | M | VF3, VF3a-b, VF4, VF4a-b | VERIFY-01, VOICE-01, ME-12, DV2-COMP | wave |
| 4 | 273 | VERIFY-04 | M | VF12, VF12a-c, VF15, VF15a-b | VERIFY-01, ME-12, ME-04 | wave |
| 4 | 274 | VERIFY-05 | M | VF13, VF14, VF14a-b | ME-12, TIER-07, DV2-COMP, TIER-04 | wave |
| 4 | 276 | POINTS-06 | M | PT4, PT4b, PT4c | POINTS-05, DV2-COMP, POINTS-02, TIER-05 | wave |
| 4 | 287 | DV2-02 | M | W1, W5, W6, W26, W28, W35 | DV2-COMP, POINTS-05 | wave |
| 4 | 289 | DV2-04 | S | M19, E21 | EVENTS-12, ME-12, DV2-COMP, ME-04 | wave |
| 5 | 272 | VERIFY-03 | L | VF8, VF9, VF9a-c, VF10, VF10a, VF11 | VERIFY-02, VOICE-01, DV2-COMP, ME-12 | wave |
| 5 | 277 | POINTS-07 | L | PT1, PT1a, PT3, PT3a-b, PT7 | AITOOLS-01, POINTS-06, DV2-COMP, POINTS-03, ME-04 | wave |
| 5 | 292 | DV2-COPY | M | 49 restyled boards | DV2-01, DV2-02, DV2-05, DV2-06 | copy sweep |
| 5 | 293 | DV2-RM | M | H1, W1, M1, Z2 (drops) | DV2-01, DV2-02, DV2-03, DV2-06, EXPLORE-07 +1 | removals |
| 6 | 278 | POINTS-08 | M | PT2, PT2a-c | POINTS-07, AITOOLS-01, VERIFY-01 | wave |

## Also changed

- **Re-cut / updated in place:** ME-12 (VF5 to VF7), INBOX-14 (pay to join), WALLET-05 (W15 transfer-only, W45 and W46 added here, BILLS-02 dropped), INBOX-13, HOME-13, ME-08, ME-02, ME-03, HOME-07, EVENTS-08, WALLET-12, WALLET-19, WALLET-16; CHECK-2, ME-07 and ME-13 lose the ME-12 dependency; a copy line on 14 more todo tasks.
- **Cancelled:** WALLET-36 (W16 removed, R-16, R-42). **Also cancelled, file removed at the batch 5 merge (MERGE-5):** ME-18 (TIER-03 replaced it).
- **Not built (DECISIONS list):** W16, M11 to M14, VF5a, VF13a, PT4a, plus the standing SH, M3, W40, W18. ME-04, ADS-01, WALLET-02, EXPLORE-02, SHARED-07 and the other building tasks are not edited: DV2-01, DV2-04, EXPLORE-07 and DV2-COPY pick up what changed for them.
- **Finding:** REF-01 is `done`, but what it merged is the /join referral codes; the in-app referral points its scope describes (`GET /me/referrals`, claim) were never built. REF-02 builds them. CHECK-2 still lists REF-01; its order is below REF-02's, so it cannot list both.
- **Needs the owner:** the licence and CBN words (R-67); the fifth gate line (GATES-02); the `relock-approved` label for INBOX-22; an AI voice provider key (VOICE-01, AITOOLS-01); F8 (WALLET-16, a count on the live database); a board for community video and voice composers (G-807); whether private rooms keep any host approval (INBOX-14 default: none).

## Capability checks

- [ ] Every one of the 28 answers is in R-50 to R-69 or named as needing no build, each with an executing task that exists.
- [ ] `python3 scripts/tasks/check_tasks.py` ends clean: every added board is in exactly one mobile-screen task or on the not-built list, and every dependency has a smaller order.
- [ ] `npm run gates` and `npm run tasks` end EXIT 0; no gate, test or baseline was edited; no em-dash in any text added.

## Builder report

_Written by the builder in the hand-back to the lead._

## Verifier report

_Filled in by the verifier._

## Owner sign-off

_Owner: date._
