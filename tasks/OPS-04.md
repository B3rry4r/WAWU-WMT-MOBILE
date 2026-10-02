---
id: OPS-04
title: Designer: Shop to Schools, the ₦ glyph, real numbers
owner: YOU
area: OPS
order: 5
priority: launch
repo: design
type: ops
status: building
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

Write `docs/designer/BRIEF.md`: every change the designer must make, one per artboard id, with the ruling or fact behind it. At least: Shop to Schools on the Home tile and Me menu (R-2); no profile Shop tab (M3, R-9); no "Move to wallet" (W39, W40, R-11); NIN and address fields in Open your wallet, and no "blink" or liveness wording on A6 (`docs/fintava/naira-api.md`); fee lines showing Fintava's charge plus WAWU's (R-10, `docs/fintava/fees.md`), including bills, which are not free; the bank and licence lines from config (Loma Bank, R-1); crypto without BTC and a 90-second quote (`docs/fintava/cardex.md`); the ₦ glyph (D15). Then the owner sends it, and when the new export arrives: replace `design/`, re-run `render_design.py --inventory`, and record the changed hashes.

## Capability checks

- [ ] `docs/designer/BRIEF.md` lists every change above by artboard id, each with its ruling or fact, in words the designer can act on without this repo.
- [ ] The new export has no Shop tile on H1 and no 'My purchases → orders' Shop link.
- [ ] design/canvas-inventory.json is regenerated and the changed artboards are listed in the PR.

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
