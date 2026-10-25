# CHECK-3 audit, area 1 (sign-up and profile), fourth pass

Auditor: Claude Sonnet 5.5 session, findings only. Independence: built none of these files; this branch holds only this report and its pictures. Base: mobile origin/main 044f465c (R2-AUTHME3 shipped), backend origin/main d54b3e0 (includes R2-AUTHME3 PR 216 and IAP-03), wawu-id origin/main a9180a5. Earlier pass: audits/CHECK-3/auth-me-p3.md on origin/wmt/CHECK-3-auth-me-p3.

Method: the app's web build at 390x844 (playwright, one browser at a time), light and dark, boards from scripts/design/render_design.py, picture next to picture (board 2x, scaled to 390). Stack: Hub, real WAWU ID with mailed sign-up codes (mail stand-in), the Nuvion stand-in with the hosted selfie on, storage and voice stand-ins, no Fintava, no live host. The Nuvion stand-in was the third pass's scratch copy (it decides a review: rejected with a phone reason, held pending, or approved), overlaid in my own detached backend worktree and never committed. The one outside call was to the real voice provider for VF10a, key from agent-keys, never printed: HTTP 401 (the relay log line is "real call -> 401").

Pictures (built only, 390 px wide, 18 files) are in audits/CHECK-3/auth-me-p4/. Board files are rendered into build/design_shots by the script and are not committed. A person who wants the pairs runs the script for A14 A28 VF15 VF15a VF12a VF10a M10 M8.

## Counts

| | |
|---|---|
| Rows given | 6 (A14, A28, VF15, VF15a, VF12a, VF10a) |
| Reached | 6 of 6 |
| Conforms with both pictures | 0 |
| Differs | 6 (each difference listed below; four are recorded gaps or rulings, two are new) |
| Re-checks on main | D-p3-2 resolved, M10 resolved |
| Defects | high 0, medium 0, low 9 |
| Still unreachable | none; two things were not captured (VF12a dark, VF10a on the Settings entry), see the end |

## Rows

| ID | Result | Files and what differs |
|---|---|---|
| A14 Phone doesn't match BVN | differs | Board Auth Flow A14 vs A14-built-rejected-light.png and A14-built-rejected-dark.png. Walk: real sign-up (Nigeria), Open your wallet, BVN and NIN (A14-board-state-never-drawn-A31-form.png is that step, no banner), details, ID document, proof of address, hosted selfie finished by hand, Submit, review rejected by the stand-in with a phone reason. The board's state (the "Verify your identity" step with the red banner "Your phone doesn't match your BVN record" and the BVN field outlined) is never drawn on this Hub: the phone sentence arrives on the refusal screen as "We couldn't open your wallet", "This isn't the number on your BVN.", card "What to do: Use the phone number on your BVN.", button "Upload again". This is the recorded gap G-825 (owner). Words and card match the A29 board. |
| A28 Checking your details | differs | Board A28 vs A28-built-light.png and A28-built-dark.png (stand-in held the review pending, the Hub stays in "opening"). Ring (88 px, purple arc on a faint track) and title as drawn. The line reads "This usually takes a few minutes." where the board says "Your account number arrives in a few moments." (recorded, G-821). The block sits 34 px higher than drawn on the web build (insets are 0 on web; check on the phone). |
| VF15 Identity check | differs | Board VF15 vs VF15-built-light.png and VF15-built-dark.png (creator with a Verify tier, draft saved, Publish pressed while the opening is checking). Words match ("Checking your identity", "BVN and NIN, as when you opened your wallet. A few minutes."). Differences: the board draws a 96 px ring with "70%" and no header, the build draws a 36 px spinner (the 70% is recorded, G-VERIFY-04-1) under the Publish header with its back button, and the title is 28 px where the board's source says 22 (design/_gen/verify.js line 111). |
| VF15a Passed | differs | Board VF15a vs VF15a-built-light.png and VF15a-built-dark.png (stand-in approved the entity while the person watched VF15; the Hub took about 100 s to show it open, then the screen changed by itself). Mark (88 px green tint), title, line and the Continue button match. Differences: the Publish header and back button, and the block sits 59 px lower than the board's. Continue leads to the publish form. |
| VF12a Uploading | differs | Board VF12a vs VF12a-built-light-32pct.png and VF12a-built-light-72pct.png (the file row after the storage upload was slowed by a scratch front, 12 MB, "Uploading · 32%" then "· 72%"). The file row (44 px icon tile, name, "Uploading · NN%", bar) is as drawn and the Publish button is disabled while it runs. Differences: the build draws the "Pick a category" chips (28 chips, recorded, G-R2-AUTHME-12 and VERIFY-04) above the preview, so the uploading rows sit below the fold, the board's header subtitle (draft name) and the "0 of N used" row sit in the scroll area, and the file row carries its own bar under the line where the board has the bar on the preview only. Dark not captured. |
| VF10a Intro failed | differs | Board VF10a vs VF10a-built-light.png and VF10a-built-dark.png, produced by the real provider failure (HTTP 401 on the text-to-speech call through the scratch relay; the person had 800 points granted in the database, 200 are asked and none were taken). Mark, title and button match. The build says "That didn't work. No points were taken. Try again." where the board says "No points were taken. Try again." (one extra sentence, two lines). |
| D-p3-2 Country after Save (re-check on main) | resolved | M8-country-after-save-light.png and M8-country-after-save-dark.png: a person signed up with Nigeria, Edit profile (cold open), bio and city changed, Save, reopened by URL and again by Me, Edit profile: Country stays "Nigeria", State shows its picker. |
| M10 Saved (re-check on main) | resolved | M10-built-light.png and M10-built-dark.png: after Save the person is on the profile (Me tab) with the toast "Profile saved" over it, dark pill in light mode and light pill in dark mode as drawn, from a cold open of Edit profile and from Me, Edit profile. Not tried: Edit profile opened from Settings (it keeps its own notice by design). |

## Defects

### High
None.

### Medium
None.

### Low

- **L-p4-1** VF15 and VF15a draw the Publish header and back button; the boards draw neither (full-bleed state). VF15-built-light.png, VF15a-built-light.png. Repro: Publish on a draft while the wallet opens, or while it passes.
- **L-p4-2** VF15's checking mark is a 36 px spinner and the title is 28 px; the board draws a 96 px ring and a 22 px title. The number inside the ring is recorded (G-VERIFY-04-1); the ring size and title size are not. A28's own 88 px ring shows the app can draw it at size. VF15-built-light.png.
- **L-p4-3** Vertical placement: VF15a 59 px lower than the board, A28 34 px higher (web build, 844 px, no insets). Check on the phone before fixing.
- **L-p4-4** A28's line differs from the board (recorded, G-821). A28-built-light.png.
- **L-p4-5** A14's board state is never drawn on the Nuvion Hub; the phone sentence shows on the refusal screen (recorded, G-825, owner). Needs the owner's call: accept A29 as the place, or have the Hub check the phone before the documents.
- **L-p4-6** VF10a carries an extra opening sentence, "That didn't work." VF10a-built-light.png.
- **L-p4-7** VF12a differs from its board by the category chips, the header subtitle and the extra bar (see row). Also the board's sample file is "brand-deck.pdf" under a Template draft while the app refuses a PDF for Template ("That file type is not accepted here. Choose XLSX, DOCX, PPTX, CSV or ZIP."): the board's sample contradicts the product rule, so a ruling or a redrawn sample is needed.
- **L-p4-8** M8's handle line reads "wawuafrica.com/u/<handle>"; the board draws "wawu/<handle>" and design/CLAUDE.md says links stay wawu/. M8-country-after-save-light.png. (Country, State and City instead of the board's one Location row follow R-85.)
- **L-p4-9** A29 (seen while reaching A14): the title breaks "We couldn't open your / wallet" where the board breaks "We couldn't open / your wallet". A14-built-rejected-light.png.

## Stack notes (not app defects)

- The storage stand-in answers OPTIONS with 405 and no CORS headers, so a browser PUT to a presigned address on a web build fails ("No connection. Check your internet and try again." on a preview, seen first). That is a stack limit, not a phone problem. The upload rows were reached with a scratch CORS front that also slows the body. It is the likely reason the third pass's "Use this" showed no change on VF10a; I did not test the voice upload without the front.
- Opening a wallet on the web build keeps the BVN and NIN in memory, so a reload on any later step returns to the first step (by design, R-6).
- The hosted selfie opens a second tab on the https address; with no host there it ends on a browser error, and the session was finished with the stand-in's control route, then the app showed "Selfie done, Back from the secure page. Your selfie is approved."

## Not captured

VF12a in dark; the Settings entry of Edit profile for M10. Neither blocks a verdict.

## Housekeeping

Databases p4a_wawu_hub_test and p4a_wawu_id_test, worktrees /home/user/wt/p4a-mobile, p4a-be, p4a-id, the stack on 9710 to 9716 and the stand-ins on 9720 to 9724 are removed at the end (ports checked with lsof). PostgreSQL was started by me (it was down) and left running. No code, test, gate or baseline was edited.
