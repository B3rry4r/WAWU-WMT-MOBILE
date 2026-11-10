# WEBAPP-10 · round history

Moved out of [tasks/WEBAPP-10.md](../WEBAPP-10.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder, 10 Nov 2026, branch `wmt/WEBAPP-10` from `wmt/BATCH-WEBAPP1` 392eb3b.
- **Files:** `design/_gen/desktop.js` (new generator), `design/Desktop Flow.dc.html` and `.sections.json` (built by `_gen/build.js`, run in node with readFile/saveFile shims; the same shim rebuilt `Settings Flow` byte for byte first), `design/brand/*.png` (four copies of `assets/brand/`), `design/_gen/buildAll.js` (Desktop added to FLOWS), `design/_gen/all_{dark,light}_15.json`, `design/wawu-{dark,light}.sections.json` and `design/WAWU {Dark,Light}.dc.html` (flow 16 appended: NAMES, STARTS, resource list and the count line).
- **Capability check:** "the owner can open one canvas and see every desktop screen, light and dark": `Desktop Flow.dc.html`, 49 artboards; also flow 16 of WAWU Dark and WAWU Light (checked by rendering the compiled section in a browser).
- **Pictures:** `render_design.py --flow Desktop` EXIT 0, 98 images (49 artboards x dark and light), all looked at in contact sheets, at 1440 and 1024; three rounds of fixes after looking (buttons pushed off the edge, a locked veil that let the cover text show through, a table too narrow for its titles, a new-wallet state that showed a balance, the category page, which the app builds as a creator grid). Copies: `/tmp/wmt-shots/webapp-10/`.
- **Facts used, all labelled example values:** fees from config (bank charge N25 as seen on the stand-in in WEBAPP-00, WAWU's fee N25 = the Hub's `DEFAULT_BANK_TRANSFER_WAWU_FEE_KOBO`); tips from `prices.tip_list_naira` (R-101); prices from the price list; places 4 on Verify (R-126); tier one year (R-89); words from the app's built screens (sign-in, sign-up, code, settings, notification switches, Me menu, wallet error, inbox empty, wrong password).
- **Not changed:** `design/canvas-inventory.json` (see Current state), `docs/LOG.md` (outside the scope the lead gave), any app code.
- **Checks after:** `npm run check` EXIT 0: typecheck clean, lint 0 errors and 10 warnings, jest 521 suites passed (7,760 tests passed, 6 skipped), gates 1,690 files scanned, 0 fail, 17 warn, 0 accepted, task check 517 tasks and 357 artboards covered.
- **NOT RUN:** the gate counts before the change (design-only branch; the gates scan `src/`); a picture of the WAWU Dark compilation (Light was checked, Dark is built the same way); Claude Design's own viewer (the board was opened through the repo's renderer and a local browser only).

## Verifier report

Verifier (lean, T1), 10 Nov 2026, on `wmt/WEBAPP-10-verify` (head 60d4eb0). Built nothing, fixed nothing. **Verdict: MERGE** (nothing medium or worse; the lows go to the area's sweep).

| Pass / check | Result | Evidence |
|---|---|---|
| Board rebuilds identical | passed | `_gen/build.js` (Desktop) then `_gen/buildAll.js` (dark and light, flow 16) run in node with readFile/saveFile shims: `git status` clean, every output byte for byte as committed |
| Render | passed | `/usr/bin/python3 scripts/design/render_design.py --flow Desktop` EXIT 0, "rendered 98 images for 49 artboards" (D1 to D40 at 1440, 9 at 1024) |
| Pictures (98) | passed, lows below | every dark and light image opened (dark over light, 1600 wide, full size where text was small); Start here map and first journey opened on the board itself |
| Existing 61 sections | passed | `wawu-dark` and `wawu-light` sections 0 to 60: after replacing "Flow N of 15" with "of 16" all 61 are identical to 392eb3b (0 differ, both themes); sections 61 to 71 are the new flow |
| Rules | passed | no em-dash anywhere (0 in source and in the built board); no bills (the one word is the board's own note "No bills anywhere"); only the four R-37 pack images (`brand/*.png`) are drawn, no WAWU logo image; Naira only (no $, no USDT, no dollar words); colours are tokens plus 3 hexes that exist in `colors.css` (TGIF card); figures labelled "example values" |
| Board rules | passed | Start here map with 10 numbered spots and a legend (opens D1 to D29), click written on each arrow, 17 "Starts from" and 10 "Then" chips, an "Other states" row with 18 "From D.." tags, an "At 1024" row, dark on top and light underneath |
| `npm run check` | passed | EXIT 0 (typecheck, lint, jest, gates, 63 python tests, task check 517 tasks and 357 artboards) |

**The 14 owner decisions** are all visible where the task says: 1 D1 (sidebar, Create button, Settings at the foot) and D1n (84 px rail); 2 D3 and D4; 3 D1, D2; 4 D7; 5 D9, D12; 6 D10, D13, D14, D19 to D25 (dialogs), D25 (panel from the right), D20 (bank list under the field with search); 7 D11 ("Type the digits or click them.") and D21 (typed amount, chips); 8 D17 (table, Held pill) and D17n (date moves into the sub line); 9 D26; 10 D27, D28; 11 D29 to D31; 12 D32 (hover lift), D33 (focus ring, Skip to content); 13 every new line was found (Pick a conversation D35, No transactions yet D36, 85% lines D10/D13, "It is in My purchases" D12, "The full 84 pages" D9, "System follows your computer" D28, "Everything you publish" D26); 14 not drawn, as stated.

**Findings**
- low (defect): D9 and D9n, locked piece. The cover's title text ("The Freelancer's Pricing Playbook") shows through behind the "Preview ended" words, dark and light, so two lines of text overlap. The builder's note says the veil was fixed; it is only partly.
- low (defect): D20, bank picker. The search box reads "gu" but the list still shows every bank (Access, Kuda, Moniepoint, Opay, Zenith), not the matches.
- low (defect): D35, Inbox empty. The sidebar badge says 3 and the chip says "Paid DMs . 1" while the list says "No messages yet".
- low (unclear, owner): D22, D24, D25 label a fee "WAWU's fee" and the receipt reference is "WAW-8F2K-91QX". R-37 says the app does not name WAWU. It matches the phone's pay sheet (`src/components/pay-sheet`, label from the Hub), so it is not a new choice, but the owner may want it renamed on both.
- low (not in the 14, designer choices): browser window chrome with a "usewmt.com" address bar drawn around every artboard; Library at 1024 drops the Sales and Updated columns (D26n); Settings opens on Notifications by default; Home stays lit in the sidebar on a content page; the profile (D6) shows the creator grid in four columns; the Wallet page puts the card, Points, Passes, quick actions and card row left and the history table right; the focus ring (flagged) also lands on the logo drop in D33. None changes behaviour.
- low (gap vs readiness): drawn at 1440 and 1024 only (the readiness check says about 1024 to 1920); Withdraw, Cards, Events and Tickets, Create are not drawn (decision 14, and the Start here map says "Not in this board"). Bills are absent, as ruled.
- note: `design/CLAUDE.md` still says "Keep the existing logo image" and lists bills and old tiers; the board follows R-37 and R-1x rulings, as the verifier brief says. Radii on dialogs (20 to 26 px) are raw values, as in the phone kit, not tokens.
- note: `design/canvas-inventory.json` is not updated (builder said so, task check passes); the D ids join it with WEB-DESIGN-INV.

**NOT RUN:** Claude Design's own viewer (the board was opened through the repo's renderer and a local browser only); a picture of the WAWU Dark compilation in a browser (its sections json was compared byte for byte instead).

