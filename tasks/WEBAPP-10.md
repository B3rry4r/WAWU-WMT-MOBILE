---
id: WEBAPP-10
title: Desktop screens drawn for the web app
owner: YOU
area: WEB
order: 370
priority: after-launch
repo: wawu-wmt-mobile
type: setup
status: verifying
depends_on: [WEBAPP-07]
decisions: [R-127]
passes: [V1]
artboards: []
tier: T1
---
# WEBAPP-10 · Desktop screens drawn for the web app

## Current state

As of 10 Nov 2026.
- **Status:** verifying. Built on `wmt/WEBAPP-10` (from `wmt/BATCH-WEBAPP1` 392eb3b), design only. History: [history/WEBAPP-10.md](history/WEBAPP-10.md).
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

## Owner sign-off
