---
id: OPS-04
title: Designer: Shop to Schools, the ₦ glyph, real numbers
owner: YOU
area: OPS
order: 5
priority: launch
repo: design
type: ops
status: done
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-04 · Designer: Shop to Schools, the ₦ glyph, real numbers

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

The canvas still draws Shop, and its figures are placeholders. Screens built from it inherit both.

## Scope

Write `docs/designer/BRIEF.md`: every change the designer must make, one per artboard id, with the ruling or fact behind it. At least: Shop to Schools on the Home tile and Me menu (R-2); no profile Shop tab (M3, R-9); no "Move to wallet" (W39, W40, R-11); NIN and address fields in Open your wallet, and no "blink" or liveness wording on A6 (`docs/fintava/naira-api.md`); fee lines showing Fintava's charge plus WAWU's (R-10, `docs/fintava/fees.md`), including bills, which are not free; the bank and licence lines from config (Loma Bank, R-1); crypto without BTC and a 90-second quote (`docs/fintava/cardex.md`); the ₦ glyph (D15). The designs are not being redrawn (owner, 2 Oct 2026): every change in the brief is made in code, by the task that builds that screen.

## Capability checks

- [ ] `docs/designer/BRIEF.md` lists every change above by artboard id, each with its ruling or fact, in words the designer can act on without this repo.

## Builder report

Builder, 2 Oct 2026. Status `verifying` covers the brief only; checks 2 and 3 wait on the designer's new export.

- **Files:** added `docs/designer/BRIEF.md`; this report. Nothing in `design/` touched.
- **Check 1 (brief), ready for the verifier:** 60 entries grouped by flow (Everywhere 1, Home 4, Me 10, Shop 2, Schools 2, Open your wallet 7, Wallet 23, Bills 7, Events 1, Settings 3), each with artboard id, what's drawn now, what to show, and the ruling or Fintava/Cardex fact. Found by splitting `design/*.sections.json` per artboard and searching for Shop, Fintava MFB, CBN, No fee, Fee, blink, BTC, 30 seconds, Move to wallet. Rendered 61 artboards (H1 H36 M1-M7 M10 M29 M33 SH9 W39 W40 A3 A5-A8 A14 A16-A20 W1-W3 W5 W10-W12 W14-W17 W19-W23 W29 W30 W35 W41-W43 Z9 Z10 S3 S5 S6 S8 S9 S11 S12 S30 H14 E3 SC5) and looked at the light renders.
- **Check 2 (no Shop tile on H1, no My purchases to orders link): NOT RUN.** The new export doesn't exist yet.
- **Check 3 (inventory regenerated, changed artboards listed): NOT RUN.** Same reason.
- **Gates:** before, the first run exited 2 because the worktree had no `node_modules` (tsc couldn't find expo/jest/node types); with the main checkout's `node_modules` linked in (untracked, removed after), exit 0: tsc clean, lint clean, 4 of 4 tests, gates 9 run / 5 files / 0 findings, baseline 0, tasks 187 / 280 artboards. After: identical.
- **Can't be placed on one artboard:** the Home, Me, Schools, Shop and Settings "Start here" maps (no ids); D15 (₦ glyph) is the font, not an artboard.
- **For the owner, not ruled:** (1) whether a buyer pays Fintava's wallet-to-wallet charge on unlocks, tickets and school fees (H14, E3, SC5 draw a breakdown that must also work at ₦0); (2) what A17 to A20 become, now NIN and address are taken when the wallet opens and Fintava has no tiers; (3) if the designer deletes SH1-SH15, M3 or W40, the `not-built` list in DECISIONS.md needs updating with the new inventory.
- **No gaps or shared-change requests filed.**
- **Round 2 (after verifier, 58a6f8f):** brief now 95 entries (Everywhere 1, Home 9, Me 12, Shop 2, Schools 4, Open your wallet 10, Wallet 29, Bills and Legal 13, Inbox 6, Events 4, Settings 5). Fixed defects 1 to 7 and 10: Z1, Z2, I8, I23, Services and Events maps, the Wallet components sheet, flow notes and map, totals carried through H15-H17, E4, E11, SC6, SC7, S7, S12; A8 link, Auth notes and map, W33 tier note; rule 3 labels, W14, A6. Applied the coordinator's defaults for 8 and 9 as stated rules the owner can change (dollar hidden at launch, W2 provider line from config; purchases pay Fintava's charge, no WAWU fee: H26, H27, I3, I14, I28, I29, M12, M13, S19, S22, S26). Also found by a case-insensitive re-sweep: the cards flow note "Virtual cards are free". `npm run check` after: same counts as before.
- **Round 3 (after verifier round 2, cffee67; main merged in for R-10's purchase rule):** 109 entries (Everywhere 1, Home 14, Me 13, Shop 2, Schools 4, Open your wallet 10, Wallet 30, Bills and Legal 13, Inbox 13, Events 4, Settings 5). Fixed R2-1 to R2-6: I11 and its arrow, M18, the Earnings flow note (R-11); I6; I10 and the Paid DMs note (rule 6); rule 5 rewritten as one button rule (pay button and Approve show the total, the receiver's amount is its own line) and applied to W10, W11, W12, W16, W17, W19, W21, W30, H26, H28, I14; H18; I18; H10 Trust Score (R-18). Case-insensitive re-sweep (full, in full, move, trust, score, Approve ₦, left your wallet, Pay ₦, amount buttons) also added H19, H25, I21, I22. `npm run check` after: same counts.
- **Round 4 (after verifier round 3, 27d5f08):** 112 entries (Wallet 32, Events 5, rest unchanged). R3-1: W1 rows and new W26 and W27 entries (debits show the total that left the wallet, Out sums totals, charge visible on the detail). R3-2: S26's breakdown on S26 itself. Refund default stated (price back, not Fintava's charge; owner can change), new E25 entry, E11 aligned; I3, I6, I10 and the Paid DMs note already name the price. `npm run check` after: same counts.

## Verifier report

Verifier, 2 Oct 2026, fresh session (did not build this task). Branch `wmt/OPS-04` at 5697a2f, worktree `/home/user/wt/m-OPS-04`.

`passes` is empty (type `ops`), so the rows below are the gate run plus the task's three capability checks and the brief checks the verifier prompt asked for.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates (`npm run check`, re-run by the verifier) | passed | Exit 0. tsc clean, `expo lint` clean, jest 4 of 4, gates 9 run / **5 files scanned** / 0 fail, 0 warn, 0 accepted, baseline 0, tasks 187 (You 101, Developer 86) / 280 artboards covered. Ran with `/home/user/wawu-wmt-mobile/node_modules` symlinked in; symlink removed afterwards, not committed. Same counts as the builder's. |
| Diff against builder report | passed | `git diff --stat main...wmt/OPS-04`: `docs/designer/BRIEF.md` (+553) and `tasks/OPS-04.md` only, as reported. `git diff main...wmt/OPS-04 -- design/` is empty. 60 entries (61 `###` headings including the example-values table), as reported. |
| Capability check 1: brief lists every change by artboard id, with ruling or fact, actionable without the repo | **failed** | Every item the Scope names is present with the right ids, but the independent canvas search found changes the brief misses or misplaces (defects 1 to 6 below). |
| Capability check 2: new export has no Shop tile on H1 and no "My purchases → orders" link | NOT RUN | The designer has not made the new export yet. |
| Capability check 3: `design/canvas-inventory.json` regenerated, changed artboards listed in the PR | NOT RUN | Same reason: no new export exists. |
| Accuracy sample (render and compare "Now" + id) | passed | `python3 scripts/design/render_design.py H1 H14 M1 M7 A3 A5 A6 A8 W10 W14 W20 W3 W22 W23 W39 W35 S3 S11 S30 E3 SC5 Z9 Z10 W41 Z1 Z2 I8` (54 images, `build/design_shots/`, gitignored). Opened the light renders of all 27. The 24 brief entries sampled (Home, Me, Auth, Wallet, Bills, Events, Schools, Settings) all have the right id and a "Now" that matches the picture. Z1, Z2 and I8 were rendered to confirm defects 1 to 3. |
| Reasons and figures | passed | Every R- and D- id cited exists in DECISIONS.md and says what the brief says (R-1, R-2, R-6, R-7, R-9, R-10, R-11, R-16, R-19, D15). Every figure traces: fee table to `docs/fintava/fees.md` and R-10; 90 s, USDC networks, fee on top to `docs/fintava/cardex.md`; NIN + address, no tiers, prepaid only and ₦500 floor, Loma Bank legal name to `docs/fintava/naira-api.md`; samples (₦2,523.25, ₦7,515.75, ₦150,015.75, ₦25,065, ₦25,025.75, ₦50,065, ₦10,100, ₦3,900, ₦10,600, ₦15,800, 121 USDT, "Holds 1:28") are arithmetic on those plus canvas figures; "about 143 artboards" = 143 non-Shop artboards that carry ₦ (154 with Shop). No invented number found. |
| No em-dashes; nothing in `design/` changed | passed | 0 U+2014 in the brief (one en-dash, inside quoted canvas text "3–5 working days"). `design/` diff empty. |

### Findings

Search method: split every `design/*.sections.json` per artboard (and the flow notes, "Start here" maps and component sheets between artboards), stripped tags, and searched for Shop, Fintava, CBN, licence, NDIC, No fee, every Fee row, free, blink, liveness, BTC, Bitcoin, 30 seconds / 0:28, Move to wallet, tier, slots, postpaid, dollar account; then read the "Figures on these artboards are not facts" / "Designer notes" sections of all 73 task files that have them.

1. **defect: Z1 · Me menu is missed; the brief puts the change on a map with "no artboard id".** Z1 (Settings flow) itself reads "My content · 4 of 7 slots" (render `build/design_shots/Z1-light.png`; also listed in the Settings task's figures as "Z1: 'My content 4 of 7 slots'"). BRIEF.md section 10 only says "Settings flow, 'Start here' map (no artboard id)", and the builder report lists the Settings map as something that "can't be placed on one artboard". It should be an entry for Z1 (plus the map phone), R-7.
2. **defect: Z2 · Settings carries tier wording the brief doesn't touch.** The "Wallet and PIN" row's subtitle is "Tier 2 · W35" (`Z2-light.png`; the Settings task's figures list "Z2: 'Tier 2' on Wallet and PIN row"). The brief removes tiers from A8 and W35 (no tiers in Fintava's API) but leaves Z2 promising one.
3. **defect: Inbox copy still sells a shop.** I8 · Creator has paid messages off: "You can still follow, tip and buy from Tolu's shop." (`I8-light.png`). I23 · Switched off for 7 days: "Publishing, communities, tips and your shop all keep working." Neither is in the brief; R-2 retires Shop and R-9 removes the profile Shop tab.
4. **defect: Shop is still drawn on two more "Start here" maps.** Services flow map: the Home phone shows the Shop tile, and hotspot 5 reads "Shop · Shop flow · Flow SH". Events flow map: the Home phone shows the Shop tile. The brief covers the Home, Me and Shop maps only (R-2).
5. **defect: Wallet flow licence, bank and fee lines outside the numbered artboards are missed.** The Wallet flow's "For approval · New components in this flow" sheet draws a Banner "Your money is held at Fintava MFB · Licensed by the CBN. Deposits insured by NDIC." (a bank name, a licence line and a deposit-insurance claim, none from config; R-1) and a "KeyValue rows (review, receipt)" sample with "Fee ₦10.00" (single-number fee, R-10). Also on the Wallet canvas: the flow note "these are full bank accounts at Fintava MFB", and the Wallet "Start here" map rows "Crypto tab · Receive and send USDT, BTC" and "Creator earnings, move to wallet · Opens W39" (Cardex: no BTC; R-11).
6. **defect: the fee change is not carried through the screens that follow H14, E3 and SC5.** The brief raises the totals on H14 (₦2,523.25), E3 (₦7,515.75) and SC5 (₦150,015.75), and for bills it carries the new total onward (S6 "Approve ₦10,100", S11 "Add ₦3,900", S5 button). For the other three it doesn't, so a designer following it draws flows that disagree with themselves: H14 button "Unlock · ₦2,500", H15 "Approve ₦2,500 to Chidi Eze", H16 "Paid ₦2,500.00", H17 "This costs ₦2,500 … Add ₦1,300"; E3 button "Pay ₦7,500", E4 "Approve ₦7,500"; SC5 button "Pay ₦150,000", SC6 "Approve ₦150,000", SC7 "Paid ₦150,000". The same gap after S5: S7 "₦10,000 paid" and S12 "Amount ₦10,000" (reversal). And E11 "₦7,500 is back in your Naira wallet" is the refund W14 is told to make a slot.
7. **defect (minor): Auth tier and sign-up wording outside A8 and A17 to A20.** A8's "Raise your limits" link is described under "Now" but the "Instead" never says whether it stays. The Auth flow notes still say "Email, phone and BVN first … Tier 1 opens the wallet" and "CBN tiers. Tier 1 is done at sign-up", and the Auth "Start here" map has "Wallet settings · Tier · Raise your limits · Opens A17". W33's note says "The real caps depend on your KYC tier". These contradict R-6 and "no tiers in the API" the same way A3 and A8 do.
8. **unclear: the Dollar account.** W2 · Wallet · Dollar prints "USD account · Fintava"; W1, W3 and W5 carry a Dollar tab; W15 offers "From your Dollar account · $1 = ₦1,580.00"; the Wallet map has "Dollar tab · Dollar account · Opens W2". R-16 says there is no dollar account yet (it comes when Fintava sends the API). The brief fixes "Dollar account" only on W20 and W21. The owner should say whether W2 and the Dollar tab stay as drawn for after launch, and whether "USD account · Fintava" is a provider line that must come from config like the bank name (R-1).
9. **unclear: purchases with no fee row at all.** The brief adds a fee line to S8 and S30 because "the fee is always shown before paying" (R-10), but not to other wallet payments that show none: H26 tip, I3 paid DM (moves into WAWU's wallet, R-19), I14 send money in chat (R-13; R-10 sets WAWU's ₦10 to a WAWU user), I28 credits, M12 tick, S19 and S22 legal, S26. This is the owner question the builder already raised (whether the buyer pays Fintava's wallet-to-wallet charge on purchases); the brief should apply the answer to these screens too, not only to H14, E3 and SC5.
10. **unclear (wording):** Ground rule 3 says "Row labels are your call too: the owner decides whether the first part says 'Fintava' or …", which reads as both the designer's and the owner's decision. W14 asks for a note that doesn't promise "every charge came back", but its example "₦25,065 is back in your Naira wallet" returns the full total including Fintava's charge, and the heading "Nothing was taken" (same promise) is not mentioned. A6 states "Fintava has no liveness check" as a fact; `naira-api.md` says only that liveness isn't in the API, and its question 6 asks Fintava whether they offer it (the instruction to drop "blink" stands either way).

No differs-for-recorded-reason findings.

**Verdict:** defects 1 to 7 are open, so status goes back to `building`. Checks 2 and 3 stay NOT RUN until the designer's export arrives.

### Round 2

Verifier, 2 Oct 2026, same fresh session, against c110f2d (brief now 95 entries, 97 `###` headings including "Two defaults" and the example table). R-10's purchase default was read from mobile `main` (`git -C /home/user/wawu-wmt-mobile show main:DECISIONS.md`, commit 98eb933); this branch's own DECISIONS.md predates it.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates (`npm run check`, re-run) | passed | Exit 0. tsc and lint clean, jest 4 of 4, gates 9 run / **5 files scanned** / 0 findings, baseline 0, tasks 187 / 280 artboards. node_modules symlinked in and removed afterwards, not committed. |
| Diff | passed | `main...wmt/OPS-04`: `docs/designer/BRIEF.md` and `tasks/OPS-04.md` only; `design/` diff empty. |
| Capability check 1 | **failed** | Round-1 defects 1 to 7 are closed, but the re-sweep finds more misses and one self-contradiction (R2-1 to R2-6). |
| Capability checks 2 and 3 | NOT RUN | No new export yet (expected). |
| Accuracy, round-2 entries | passed | Rendered H14 H15 H16 H17 E3 E4 E11 SC5 SC6 SC7 S7 S12 Z1 Z2 I8 I23 A8 I3 I14 I28 M12 S22 W2 H26 W11 (plus I6 I10 I11 M18 H10 for the findings below) into `build/design_shots/` and opened the light renders. Every round-2 "Now" matches its picture and the id is right. Auth note "Starts from A8 · Raise your limits, or Wallet settings", Wallet map hotspots 3, 4, 5 and the earnings row, and the Cards note "Virtual cards are free" also match the canvas text. |
| Figures | passed | Every new figure traces to fees.md + R-10 (main) + canvas: H17 ₦2,523.25 − ₦1,200 = ₦1,323.25; I14 ₦15.75 + ₦10 = ₦25.75, total ₦25,025.75; H26 and M12 ₦2,000 + ₦23.25; I3 ₦1,523.25; I28 and I29 ₦1,023.25; S19 ₦15,015.75; S22 ₦45,015.75; S26 ₦35,015.75; S7 ₦10,100; W14 and S12 sample returns equal the amount sent; purchase rows in the example table equal fees.md's balance-transfer charges with no WAWU fee (R-10 on main). |
| Em-dashes, `design/` | passed | 0 U+2014; `design/` unchanged. |

**Round-1 findings:** 1 (Z1) closed; 2 (Z2) closed; 3 (I8, I23) closed; 4 (Services and Events maps) closed; 5 (Wallet components banner, KeyValue fee, flow note, map rows) closed; 6 (totals carried through H14 to H17, E3, E4, E11, SC5 to SC7, S7, S12) closed; 7 (A8 link, Auth notes and map, W33) closed. Unclear 8 closed by the stated Dollar default (W2 and the Dollar tab drawn, hidden at launch, provider line from config; consistent with R-16 "no dollar account yet", though "hidden at launch" itself is not written in DECISIONS.md). Unclear 9 closed by R-10's purchase default on main (H26, H27, I3, I14, I28, I29, M12, M13, S19, S22, S26 added). Unclear 10 closed (rule 3 labels, rule 6 and W14, A6 now "Fintava's API").

**Round-2 findings** (from a fresh case-insensitive sweep of artboards, maps, flow notes and component sheets; I also searched "trust", "moves to your wallet", "from earnings", "full amount", "in full", ads, deletion and the R-13 thresholds):

- **R2-1 defect: earnings still "move to the wallet" in two places (R-11).** I11 · Answered: "₦1,275 added to your earnings. Replied in 49 minutes. It moves to your wallet from Earnings (W39)." plus its flow arrow "Earnings move to the wallet from W39". M18 · Creator dashboard: the Earnings row's subtitle "Move to your wallet (W39)". Neither is in the brief (renders `I11-light.png`, `M18-light.png`). My round-1 sweep searched "move to wallet" and missed this wording.
- **R2-2 defect: I6 · Not enough in wallet is not carried through, although I3 is.** I6 repeats I3's "No reply in time, your ₦1,500 comes back in full" (rule 6), and its shortfall "You need ₦1,500. You have ₦900.00." / "Add ₦600" ignores I3's new total ₦1,523.25 (rule 5: "You need ₦1,523.25", "Add ₦623.25").
- **R2-3 defect: I10 · Reply still promises "the full amount".** "That's 85% of ₦1,500. Miss it and Bisi gets the full amount back." Rule 6 forbids "the full amount" for a payment that carried a charge; the Inbox flow note "Paid DMs" says the same ("the full amount comes back").
- **R2-4 defect: rule 5 contradicts W10, W11, I14 and H26.** Rule 5 says the button and the PIN sheet's "Approve" line use the review's total. W10 and I14 say "The button still shows the amount the person receives", H26 allows "keep 'Tip ₦2,000'", and W11's sheet "Approve ₦25,000 to Chidinma Okoro" (`W11-light.png`) is not mentioned, so the designer can't tell which line is meant to show ₦25,000 and which ₦25,065. Rule 5 needs the send-money exception written into it, and W11 needs its Approve line stated.
- **R2-5 defect (minor): two more money screens keep the old amount.** H18 · Couldn't confirm: "₦2,500 left your wallet" after an unlock the brief now totals at ₦2,523.25 (rule 5). I18 · Request from someone: "Pay ₦12,000", then the W11 PIN, with no fee line. Paying a request is a send to a WAWU user, which the brief's own I14 entry charges ₦15.75 + ₦10 (R-10).
- **R2-6 defect: H10 · Professional card still shows a Trust Score (R-18).** "4.9 · 212 reviews · **91 Trust Score** · ~3h usual reply" (`H10-light.png`); the canvas note also lists "Trust Score". R-18 ("No Trust Score on professional cards. A number nothing calculates never ships.") is an owner ruling the canvas contradicts, and the brief doesn't carry it. My round-1 sweep did not search for it, so this is new in round 2.
- **unclear (housekeeping):** the brief cites "R-10 and the purchases default", which is in R-10 on `main` (98eb933) but not in this branch's DECISIONS.md. Bring the branch up to `main` before merge so the citation reads true in the PR.

No differs-for-recorded-reason findings.

**Round-2 verdict:** defects R2-1 to R2-6 are open, so status goes back to `building`. This would be a third fix round, so under `docs/WORKFLOW.md` (step 5, "At most 2 rounds, then the task goes to the owner", and section 9) the owner decides whether the builder fixes these or accepts them. Checks 2 and 3 stay NOT RUN until the export arrives.

### Round 3

Verifier, 2 Oct 2026, same session, against d7d7526 (after a7f63e1 merged `main`, so this branch's DECISIONS.md now carries R-10's purchase rule). Brief: 109 entries (111 `###` headings). `git diff main...wmt/OPS-04` is still `docs/designer/BRIEF.md` and `tasks/OPS-04.md` only.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates (`npm run check`, re-run) | passed | Exit 0. tsc and lint clean, jest 4 of 4, gates 9 run / **5 files scanned** / 0 findings, baseline 0, tasks 187 / 280 artboards. node_modules symlinked in and removed afterwards, not committed. |
| Capability check 1 | **failed** (minor) | R2-1 to R2-6 are closed; two small rule-5 gaps remain (R3-1, R3-2). |
| Capability checks 2 and 3 | NOT RUN | No new export yet (expected). |
| Accuracy, round-3 entries | passed | Rendered I3 I6 I10 I11 M18 W10 W11 W12 H10 H18 H19 H25 H26 I18 I21 I22, plus W1 W26 S26 E25 for the findings, into `build/design_shots/` and opened the light renders. Every new or changed "Now" matches the picture and the id: H10 "91 Trust Score", H18 "₦2,500 left your wallet", H19 "Unlock · ₦3,000", H25 "Unlock course · ₦8,000", H28 "₦2,000 sent to Tife", I18 "Pay ₦12,000", I21 and I22 "On · fans pay ₦1,500 to ask you", W12 "Fee ₦10.00" under "₦25,000 sent". The Inbox note "Paid DMs · I2–I8" and the Wallet note "Earnings · W39–W40" quote the canvas exactly. |
| Figures | passed | W11 ₦25,000 + ₦65 = ₦25,065; I18 ₦12,000 + ₦15.75 + ₦10 = ₦12,025.75 (send to a WAWU user, ₦5,000 and over); H19 ₦3,000 + ₦23.25 = ₦3,023.25; H25 ₦8,000 + ₦15.75 = ₦8,015.75; H28 ₦2,023.25; I6 ₦1,523.25 − ₦900 = ₦623.25; W17 and W19 ₦50,065; I14 ₦25,025.75. All from fees.md, R-10 and canvas amounts. |
| Em-dashes, `design/` | passed | 0 U+2014; `design/` unchanged. |

**Round-2 findings:**
- R2-1 closed: new entries for I11 (text and arrow), M18, and the Wallet note "Earnings · W39–W40".
- R2-2 closed: new I6 entry (refund line, ₦1,523.25, "Add ₦623.25").
- R2-3 closed: I10 and the Inbox "Paid DMs" note.
- R2-4 closed: rule 5 is now one rule. The paying button and the Approve line show the total, the amount received is its own line, and a button that only opens the review shows the price. W10, W11, I14 and H26 now follow it, and the canvas's W10 note is told to change.
- R2-5 closed: H18 and I18 added.
- R2-6 closed: H10 added (R-18).
- Housekeeping closed: R-10's purchase rule is in the branch's DECISIONS.md.

**Rule 5 consistency check.** Every entry that names a button, Approve line, success line or shortfall now matches rule 5: H14 to H18, H26 to H28, M12, M13, SC5 to SC7, E3, E4, S5 to S7, S11, S19, S22, S30, I3, I6, I14, I18, I28, I29, W10 to W12, W16, W17, W19, W21 and W30. H19 and H25 state both cases (review-opening button keeps the price; a direct-to-PIN button shows the total). Buttons not in the brief that only open a review ("Message · ₦1,500", "Ask a follow-up · ₦1,500", S18 "Pay ₦15,000" opening S19, E2 tickets) are covered by rule 5's last sentence. The chat bubbles "₦1,500 paid" on I4, I5 and I7 and "You sent ₦25,000" on I15 and I20 are covered by "a chat bubble shows the amount sent". Two places still don't fit:

- **R3-1 defect (minor): the transaction lists still show debits without the fee.** W1's recent rows and W26 · Transaction history show "Chidinma Okoro · Transfer · GTBank −₦25,000.00", "Ikeja Electric · Prepaid −₦10,500.00" and "MTN airtime −₦2,000.00", plus the "Out · September ₦96,820.50" total (`W26-light.png`, `W1-light.png`). Rule 5 says "any 'money left your wallet' line ... use[s] the same total", so these rows should read −₦25,065.00 and −₦10,600.00, or show the charge as its own row. Neither the W1 entry nor any W26 entry says which.
- **R3-2 defect (minor): S26 contradicts rule 5's last sentence.** S26 tells the designer to put the breakdown "here or on the pay step that follows" and fixes the button at "Continue · ₦35,015.75". If the breakdown goes on the following pay step, Continue only opens the review, and rule 5 says such a button shows the price ("Continue · ₦35,000"). S26 should say: total on Continue only if the breakdown is on S26 itself, otherwise the price.

**Final sweep** (case-insensitive over every artboard, map, flow note and component sheet: shop, Fintava, CBN, licence, NDIC/insured, no fee, free, blink, liveness, BTC/Bitcoin, 30 seconds/0:28, move to wallet and its variants, tier, slots, postpaid, dollar, in full/full amount/nothing was taken, Trust Score, fee, Approve ₦, Paid ₦, left your wallet, Add ₦/Top up, every pay-button form, comes back/is back/refund). Every hit is either covered by a brief entry or is not a change:
- "Free" on free content, free hosting, free reading and free setup (R-8, R-5).
- "licence" on professional credentials (P2, P3, P6, P8, P9).
- "fee per matter" on S18 and S25.
- Designer notes naming Fintava as the provider (W6, W38, and the swap and NQR notes).
- The Me notes' "slot meter".
- R-13's 20% and 30% thresholds, which match I22 and I23.

One wording item for the owner:

- **unclear:** E25 · Call it off tells the organiser "This refunds real money. All 64 buyers get their money back." That avoids rule 6's banned phrases. It still implies each buyer gets back everything they paid (₦7,515.75 with Fintava's charge), which is the same unconfirmed question rule 6 and E11 leave as a slot.

**Round-3 verdict:** R3-1 and R3-2 are open, so status stays `building`. Both are one-line wording fixes in the brief, not missing coverage. This is past the two fix rounds `docs/WORKFLOW.md` allows (step 5 and section 9), so the owner decides whether to accept them as known or have the builder fix them before the brief is sent. Checks 2 and 3 stay NOT RUN until the designer's export arrives.

### Round 4

Verifier, 2 Oct 2026, same session, redone from the start after a container restart, against fe41d62. No partial Round 4 was in the file. The brief has 112 entries (114 `###` headings, counting "Three defaults" and the example table). `git diff main...wmt/OPS-04` still touches only `docs/designer/BRIEF.md` and `tasks/OPS-04.md`, and `design/` is unchanged. The refund default was read from mobile `main` (`git -C /home/user/wawu-wmt-mobile show main:DECISIONS.md`, commit 22d95dc, R-10: "A refund returns the price; Fintava's charge isn't returned").

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates (`npm run check`, re-run) | passed | Exit 0. tsc and lint clean, jest 4 of 4, gates 9 run / **5 files scanned** / 0 findings, baseline 0, tasks 187 / 280 artboards. `node_modules` was symlinked in for the run and removed afterwards; it is not committed. |
| Capability check 1 | passed | R3-1 and R3-2 are closed, and the refund wording is consistent everywhere it appears. No open defects. |
| Capability checks 2 and 3 | NOT RUN | The designer's new export doesn't exist yet. Run both when it arrives (replace `design/`, `render_design.py --inventory`, record changed hashes). |
| Accuracy, round-4 entries | passed | Rendered W1 W26 W27 S26 E11 E25 into `build/design_shots/` and opened the light renders. Each "Now" matches its picture: W1 and W26 debit rows "−₦25,000.00" (Chidinma, GTBank), "−₦10,500.00" (Ikeja Electric), "−₦2,000.00" (MTN airtime) and "Out · September ₦96,820.50"; W27 a tip received, +₦2,000.00; S26 "Fee ₦35,000", "Continue · ₦35,000"; E11 "₦7,500 is back in your Naira wallet."; E25 "All 64 buyers get their money back." |
| Figures | passed | W1 and W26: ₦25,000 + ₦40 + ₦25 = ₦25,065.00; ₦10,500 + ₦100 = ₦10,600.00; airtime ₦2,000 + ₦0 (fees.md: airtime ₦0). W27: ₦25,065.00. S26: ₦35,000 + ₦15.75 = ₦35,015.75. E11 and E25 use the canvas's ticket price ₦7,500. Every figure traces to fees.md, R-10 or the canvas. |
| Em-dashes, `design/` | passed | 0 U+2014; `design/` unchanged. |

**Round-3 findings:**
- **R3-1 closed.** The W1 entry now covers the recent-transaction debit rows. New W26 entry: debits show the total, and Out is the sum of those totals. New W27 entry: a debit's detail shows the amount, Fintava's charge, WAWU's fee and the total.
- **R3-2 closed.** S26 now puts the breakdown on S26 itself, and "Continue · ₦35,015.75" leads to the PIN. That matches rule 5 (the canvas's own flow is "Pay · PIN").
- **E25 unclear closed** by the refund default: "All 64 buyers get the ticket price back."

**Refund rule consistency.** The brief has three refund cases, and they don't conflict:
- **Refunds of a purchase.** The refund default says the price comes back. It covers I3, I6, I10, the "Paid DMs" note, E11 and E25. Each names the price ("your ₦1,500 comes back", "her ₦1,500 back", "the price of the message comes back", "the ticket price back"), and none says "in full" or "everything you paid".
- **Failed sends and bills.** W14 and S12 stay under rule 6: the returned amount is a slot, because it isn't confirmed whether Fintava returns its charge on a reversal. The default bullet says this carve-out in so many words.
- **Canvas lines not in the brief.** These already name only the price: I4 ("Your ₦1,500 ... comes back to your wallet"), I7 ("you got ₦200 back"), H10 ("your ₦1,500 comes back"), M31 ("her ₦1,500 is refunded"), I20 ("Refunded ₦200") and P2 ("you're refunded automatically").

**Housekeeping (not a designer defect):**
- **unclear:** this branch's DECISIONS.md predates 22d95dc, so it doesn't carry the refund default. The brief's "refund default" also doesn't name R-10, unlike the other two defaults. Merge `main` into the branch again before the PR so the evidence pack's DECISIONS.md backs E11 and E25.

No open defects.

**Round-4 verdict:** capability check 1 passes, V1 passes, and checks 2 and 3 stay NOT RUN until the designer's export arrives. Status set to `review`. The owner now reviews the brief, sends it to the designer, and does checks 2 and 3 when the export comes back.

## Owner sign-off

Owner, 2 Oct 2026: no new design export; the brief is applied in code.
