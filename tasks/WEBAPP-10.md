---
id: WEBAPP-10
title: Desktop screens drawn for the web app
owner: YOU
area: WEB
order: 370
priority: after-launch
repo: wawu-wmt-mobile
type: setup
status: review
depends_on: [WEBAPP-07]
decisions: [R-127]
passes: [V1]
artboards: []
tier: T1
---
# WEBAPP-10 · Desktop screens drawn for the web app

## Current state

As of 10 Nov 2026.
- **Status:** review (verifier: MERGE, lows only). Built on `wmt/WEBAPP-10` (from `wmt/BATCH-WEBAPP1` 392eb3b), design only. History: [history/WEBAPP-10.md](history/WEBAPP-10.md).
- **Board:** `design/Desktop Flow.dc.html` (+ `.sections.json`, source `design/_gen/desktop.js`, built with `_gen/build.js`). 49 artboards, each dark on top and light underneath: D1 to D40 at 1440 x 900, and D1n, D7n, D9n, D15n, D17n, D22n, D26n, D27n, D29n at 1024 x 768. Start here map (the shell with 10 numbered spots and a legend), journeys left to right with the click on each arrow, Starts from / Then chips, an Other states row and an At 1024 row.
- **Also in the canvas:** WAWU Dark and WAWU Light now carry it as flow 16, "Desktop (web)" (`_gen/buildAll.js` FLOWS gained one entry; the 61 existing sections are unchanged except "Flow N of 15" now reads "of 16"). The logo is the R-37 brand pack, copied to `design/brand/` (`<layout>-dark.png` = white or sticker art, `-light.png` = ink art); no WAWU logo image is used.
- **Drawn:** shell (sidebar, header with search, bell, avatar), Home Today and For you with a side rail, account menu, notifications panel, search results, Me, Explore, Categories, content detail (locked, unlocked), unlock, PIN, tip and share dialogs, Inbox with list and conversation (chat, paid DM), Wallet with the history table, Add money, Send (bank, bank picker, amount, review, PIN, receipt), transaction detail panel, My content table, Settings in two columns, theme picker, sign in, sign up, phone code; states: hover, keyboard focus, loading, Inbox empty, new wallet, wallet can't reach the account, feed didn't load, wrong password, amount over balance.
- **Pictures:** every artboard rendered with `scripts/design/render_design.py --flow Desktop` (98 images, EXIT 0) and looked at; copies and contact sheets in `/tmp/wmt-shots/webapp-10/` (`sheets/`).
- **Checks:** `npm run check` on this branch EXIT 0 (typecheck, lint 0 errors and 10 warnings, jest 521 suites and 7,760 tests passed with 6 skipped, gates 1,690 files scanned with 0 fail and 17 warn, task check 517 tasks). `render_design.py --flow Desktop` EXIT 0.
- **Not done, on purpose:** `design/canvas-inventory.json` is not updated. The task check fails any inventory artboard that is in no mobile-screen task and not listed as not built in `DECISIONS.md`, so the D ids join the inventory with the build tasks (readiness section 6: WEB-DESIGN-INV), or the lead lists them.

### Decisions for the owner to confirm (the phone design gave no answer)
1. The five tabs become a left sidebar (248 px; an 84 px icon rail at 1024), same order; Create (creators only) sits under them as a button, not a floating button; Settings sits at the foot of the sidebar (on the phone it is only in the Me menu).
2. Search, the bell and the avatar sit in a header on every signed-in page; the avatar opens the phone's Me menu as a dropdown, with Sign out added from Settings.
3. Home keeps Today / Following / For you; the balance card (Send, Add) and the services go in a right side rail; For you plays one piece in the middle with the actions beside it and up and down arrows (arrow keys).
4. Explore: slider and TGIF side by side, the categories in one row, "Who Made This?" and Categories as six-wide grids, the doors in one row.
5. Content detail: the preview on the left, details, Unlock, Tip, actions and comments on the right.
6. Every sheet becomes a centred dialog over a dimmed page; the transaction detail is a panel from the right so the table stays in view; the bank picker is a list under the field with a search box.
7. PIN: the keypad stays and can be clicked, and the digits can be typed; new line "Type the digits or click them." Send amount: typed into a field, no keypad; the quick amounts stay as chips.
8. Wallet history as a table: Description (type in the sub line), Date, Amount; a "Held" pill when not completed; at 1024 the date moves into the sub line.
9. My content as a table: Piece, Price, Sales, Status, Updated and a "..." menu; a "New piece" button (the phone has a Plus).
10. Settings: the list on the left, the page it opens on the right; Sign out and Delete account at the foot of the list.
11. Sign in, sign up and the code: split screen; the left half is the welcome page's dark side with the sticker mark and its one line.
12. Hover: a card lifts with an accent outline, rows and sidebar items take a fill. Keyboard focus: a 2 px accent ring with a 2 px gap; no focus token exists yet, so the build adds one. "Skip to content" is the first Tab stop.
13. New lines not on any phone screen: "Pick a conversation" / "Your messages, paid questions and communities open here."; "No transactions yet" / "Add money by bank transfer to your account number. It shows here the moment it lands."; "Kemi gets 85% of the price." and "of your tip."; "It is in My purchases, on the phone and on the web."; "The full 84 pages are one click away."; "System follows your computer"; "Everything you publish, with its price, sales and review."
14. Screens not drawn here (Create, Withdraw, Cards, points, tiers, events, schools, community rooms, the reader and player, Me's other tabs) keep the phone layout, centred inside the shell, until a later board draws them.

### Next
A verifier (lean, T1): the board opens, every artboard renders in both themes at both sizes, nothing drawn that is not built or ruled (R-47), no bills, no WAWU logo, no em-dash, Naira only. Then the owner reviews the board and the 14 decisions.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

Phase 2 starts from drawings: a desktop shell and the main screens at 1440 (and 1024) in light and dark, in the app's own design system, for the owner to review before anything is built.

## Scope

- `design/` only: a new desktop flow canvas. What it must draw (readiness section 6): the navigation shell and header, Home with a side rail, the Explore grid, content detail, Inbox list and thread side by side, the Wallet flows, the Library table, Settings in two columns, sign-in split screen, sheets as dialogs, with hover, focus, empty and error states. Who Made This branding only (R-37, `<BrandMark>`).

## Capability checks

- [ ] The owner can open one canvas and see every desktop screen, light and dark, and say yes or what to change.

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

## Owner sign-off
