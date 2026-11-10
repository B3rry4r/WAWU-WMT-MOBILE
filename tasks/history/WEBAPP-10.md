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

