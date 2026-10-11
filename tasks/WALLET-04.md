---
id: WALLET-04
title: Transaction history and detail
owner: YOU
area: WALLET
order: 113
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [MONEY-15, UI-02, BILLS-01]
decisions: [R-10, R-33]
passes: [V1, V4, V5, V6, V9]
artboards: [W26, W27, W28]
---
# WALLET-04 · Transaction history and detail

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W26 W27 W28` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W26, W27 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W26 · Transaction history**: Full ledger with search, filter chips (All, Money in, Money out, Bills, Content), a monthly In/Out summary, rows grouped by day, tap to open a receipt.
- **W27 · Transaction detail**: Receipt for one transaction: type, source content, from, to, date, reference, Completed; Share receipt (the phone's share sheet at launch, R-33); Report a problem opens support chat with the reference (added by SUPPORT-01).
- **W28 · History · no results**: Empty filter result (Bills in September) with 'Pay a bill' CTA.

## Brief changes (build these, not the canvas)

- **W26**: each debit row shows the total that left the wallet: Ikeja Electric −₦10,600.00, the GTBank transfer −₦25,065.00, MTN airtime −₦2,000.00 (its charge is ₦0). "Out · September" is the sum of those totals (keep it an obvious sample). (Why: rule 5 and R-10: the money that left the wallet includes the charges.)
- **W27**: keep it. For a debit, the detail shows the amount, Fintava's charge, WAWU's fee (if any) and the total, so the charge behind each W26 row is visible here. If you draw a debit example, use the GTBank send: ₦25,000 + (₦40 + ₦25) = ₦25,065.00. (Why: R-10: the charges must be visible somewhere the person can check.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W27: Report a problem (opens the support chat): added by SUPPORT-01

## Capability checks

- [ ] **From W1:** a user on the Wallet tab taps See all and lands on W26, and taps a recent row and lands on W27 (this task replaces `unbuilt('WALLET-04')` in `src/features/wallet/home/`; COMPLETE-05).
- [ ] **W26**: a user can search transactions; filter by All/Money in/Money out/Bills/Content; tap a row to open W27.
- [ ] **W27**: a user can see each debit's parts (amount, Fintava's charge, WAWU's fee, total; BRIEF W27) and Share receipt through the phone's share sheet (the receipt's text and reference; the W41 image and PDF come after launch, WALLET-12).
- [ ] **W28**: a user can Pay a bill.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W28.

## What the backend serves today (from the analysis)

- **W26**: partial. Missing: History is WAWU's own instruction ledger, not the bank's record: it misses money paid directly into the NUBAN, bills, buyer-side unlocks/tips, and has no counterparty, description, category, search, filter, monthly summary or pagination cursor (take<=200). Amounts are whole naira, canvas shows kobo.
- **W27**: missing. Missing: No transaction-by-id endpoint, no counterparty/linked content, no support ticket route.
- **W28**: missing. Missing: No category filter on history.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W26: In · September ₦212,400.00
- W26: Out · September ₦96,820.50
- W26: Unlock · Lighting night shoots 3 buyers +₦7,500.00
- W26: MTN airtime −₦2,000.00
- W26: Ikeja Electric Prepaid · 45.2 kWh −₦10,500.00
- W27: Reference WAW-T1P9-7ZQA

## Designer notes (⚠, unresolved)

- None.

## Builder report

**Builder report, 11 Oct 2026 (Sonnet builder, one session).** Mobile `wmt/WALLET-04` from main 610cc57, with main 4743a40 (NUV-05) merged in (one conflict, `BACKEND_GAPS.md`, both sides kept). **Backend: not changed, no backend branch.** MONEY-15's routes already serve everything these screens read (`GET /money/transactions` with `filter`, `q`, `group`, `cursor`; `/summary?month=`; `/{id}` with the fee parts), and `contract/` is the one on backend main f2b6bf6, unchanged, so no contract regeneration and no backend gates.

**Files.** New: `src/features/wallet/api/history.ts` (the three reads and their keys); `src/features/wallet/history/` `lagosTime.ts`, `model.ts` (pure), `TxRow.tsx`, `HistoryParts.tsx` (search, month card, load-failed), `HistoryScreen.tsx` (W26, W28), `DetailScreen.tsx` (W27); routes `src/app/transactions/index.tsx` and `[id].tsx`; tests `historyModel` (28), `historyScreens` (38), `historyFlow` (6, the real router). Changed: `home/RecentTransactions.tsx` (See all, rows open W27), `home/WalletScreen.tsx` (the two pushes), `home/model.ts` (rows and times now come from `history/`; `rowTime` re-exported), `api/home.ts` (three exports), `WalletScreen.test.tsx` (below). Docs: BACKEND_GAPS G-720, G-721; SHARED-CHANGES WALLET-04 #1 and R1; LOG.

**Capability checks.** Evidence in the builder's scratch `w04/` (`pairs/` artboard left and build right at 390 px, `shots/`, `logs/shoot.log`, `logs/check*.log`): wawu-id's real login (:6431), the Hub built from backend main f2b6bf6 (:6432) with 49 seeded ledger rows (money in and out, bills, content unlocks, a pending, a failed, a reversed), a Fintava balance stand-in (:6433, W1 needs a balance), the web export (:6434) made with its own Metro cache (the bundle holds only `localhost:6431` and `localhost:6432`), signed in through the app's own sign-in screen, no injected token (V9).
- [x] **From W1:** See all opens W26 (`url after See all` = `/transactions`), a recent row opens W27 (`url row->W27`), in the browser and in jest on the real router (`historyFlow`). The two entries are drawn as the canvas draws them (`W1-*.png`).
- [x] **W26:** search ("Chidinma" finds her transfer; one character asks nothing; "zzzzz" says No results), each chip asks the Hub (`filter=money_in`, `money_out`, `bills`, `content`), a row opens W27, three pages with a day continuing under one label, In and Out are the Hub's sums for the month (`W26-*.png`).
- [x] **W27:** the tip (`W27`), the debit with its parts, ₦25,000.00 + ₦40.00 + ₦25.00 = ₦25,065.00 (`W27-debit`), a pending one (`W27-pending`), copy the reference, Share receipt (jest: the phone's `Share.share` gets the text with the reference; the browser has no share sheet, so the screen says so, `W27-share-unavailable`).
- [x] **W28:** an account with a wallet and no bills: the Bills chip draws the card, Pay a bill opens S2 (`W28-*.png`, `S2-from-W28-*.png`).
- [x] **Pictures, light and dark, each beside its artboard** (`pairs/W1`, `W26`, `W27`, `W28`; V5 is the verifier's). They differ in data (names, times, the month's name), the status bar (a browser has none), the two things not drawn (below), "yet" for "in September" and a name for "@amaka" (defaults 1 and 4).
- [x] **States by their real cause (V6):** loading (the real Hub's answer held: `W26-loading`, `W27-loading`), error (the browser cannot reach the Hub: `W26-offline`), the totals failing alone (`W26-summary-error`), no wallet (creator-basic, `W26-no-wallet`, `W27-no-wallet`), not found (`W27-missing`), empty (`W26-search-none`, `W28`); the first-use empty is in jest.
- [x] **V4 field trace:** every field is one ledger row (written by the money core and the paying features into `FintavaLedgerEntry`) read by `GET /money/transactions`: amount and total (W1 row, W26 row, W27 figure and parts), the fee parts (W27), counterparty name and avatar (W1, W26, W27), link title (W26's grouped title, W27's On), note and reference (W27, the share text), status (W1 and W26 word, W27 pill), time (Lagos: W1, W26 label and clock, W27 date). The seeded GTBank row reads −₦25,065.00 on W26 and W27.

**Checks.** Mobile `npm run check` run as its steps with two jest workers (`logs/check2.log` in the scratch), `EXIT 0` on `f20a778`: typecheck 0, lint 0, **155 suites / 2828 tests passed** (before, on main: 152 suites / 2754 tests; +3 suites and +74 tests: 28 + 38 + 6 new, and 2 net in `WalletScreen.test.tsx`), gates **0 fail / 5 warn on 581 files** (before: 0 / 5 on 569, the same five PROVISIONAL warns), `check_baseline.py` clean, 275 tasks. Main then moved again (JOIN-03 round 5, docs only: its report, LOG and a regenerated PROGRESS) and was merged in as `359be98`; `npm run tasks`, `npm run typecheck` and the gates were run again after it, all clean, and the suite was not (no code arrived). Backend: not changed, so its tsc, eslint, specs, protected suite, gates, `contract:build` and `npm run api` are not run (`contract/SOURCE_COMMIT` is backend main f2b6bf6, which is what the Hub for the pictures was built from).

**An edit to a test I did not write.** WALLET-01's `WalletScreen.test.tsx` asserted that See all is not drawn and a row is not pressable until WALLET-04, which this task makes untrue. `expectNothingUnbuilt` no longer lists See all (it still refuses it where there are no rows: W4, W5, W6 and the states without a balance); the two button lists on W1 gain See all and the two row buttons; "a transaction row ... is not pressable because its detail is not built" became "... a user can tap it to open that transaction (W27)", with two new tests for See all. Nothing else in the file changed.

**Defaults (agent), owner may override.** (1) The list is the whole history and the summary is this month (Lagos): W28 says "No bill payments yet" where the canvas says "in September" (the Hub's `month` filter is not used: no month picker is drawn, and a list cut at the month would hide older rows). (2) A grouped row ("Unlock · piece", "3 buyers") opens the unlocks it stands for, the same list without search, chips or totals (`/transactions?group=<key>`); the canvas draws no such screen, the alternative is a row that opens nothing. (3) A debit's parts sit in their own card under the canvas's card; the labels are the brief's, "Fintava's charge" and "WAWU's fee" (G-721: R-45 makes the provider Nuvion), one constant, `FEE_LABELS`; WAWU's fee is left out when it is 0, the provider's charge is kept at ₦0.00. (4) W27's From and To show a person's name, not "@handle" (G-720). (5) The Type line is the first part of the Hub's description, as the Hub's own receipt reads it. (6) Copy the canvas does not draw: "No results", "Nothing matches “…”. Try a name, a reference or what it was for.", "No money in yet", "No money out yet", "No content payments yet", "No transactions yet / Money you send, receive and pay shows up here.", "Couldn’t load your transactions", "Couldn’t load this month’s totals.", "Sharing isn’t available on this device.", "We couldn’t find that transaction", and the share text ("Who Made This receipt", the headline, the status, each line, the parts, the date, the reference). (7) Search waits 350 ms after the last key (the schools' wait), asks from two characters (the Hub's minimum), and the search key asks at once. (8) A row shows its amount whatever its status, with "Pending", "Failed" or "Reversed" before its time; the month's totals leave those out (the Hub's rule).

**Not drawn (R-47):** the export icon beside the title (statements, WALLET-35), Report a problem (SUPPORT-01 adds it, as drawn), a bill's glyph per kind and its units (G-311).

**NOT RUN, and what unblocks each.** (a) A phone or simulator: the real share sheet, pulling the list down with a finger (jest pins `onRefresh`; the web export has no pull), the keyboard; unblocked by a development build on the same Wi-Fi as a local Hub or a tester build (V10, RELEASE-03). (b) Against the real wallet provider: the history reads the ledger only (no provider call), but these rows were written by SQL to the ledger's columns, not by a real delivery, and W1's balance came from a stand-in; unblocked by recorded deliveries (OPS-10, or Nuvion's sandbox once its deliveries are recorded). (c) The statements icon and Report a problem: WALLET-35 and SUPPORT-01.

No server of mine is left running: the Hub, wawu-id, the Fintava stand-in and the static server were stopped by PID (checked with `lsof` on 6431 to 6434), and the worktrees are removed.

## Verifier report

**Verifier report, 11 Oct 2026 (Sonnet verifier, fresh session; wrote none of this code).** Branch `wmt/WALLET-04` at 67865ed. Backend: none changed. Hub built from backend origin/main **51b02c5** (the builder used f2b6bf6; `git diff f2b6bf6 51b02c5` is empty on `src/money/history` and on `contract/openapi.json`, so the routes these screens read are the same). wawu-id from main bda1aa6. Web export made with my own Metro cache (`TMPDIR=<scratch>/tmp`, `--clear`), bundle grepped: only `localhost:6431` and `localhost:6432`, no other host. Ports 6431 to 6434, databases `vw04_hub_test` and `vw04_id_test`, no provider host (a stand-in answers the balance read on :6433). Signed in through the app's own sign-in screen on a real wawu-id login, no injected token. Evidence in the verifier's scratch `vw04/`: `shots/` (every state, light and dark, 390 px), `pairs/` (artboard left, build right), `logs/`, `mut/` (mutants).

**Verdict: `building`. One defect blocks (D1, W1's grouped row opens the wrong receipt); three smaller ones (D2 to D4).** Everything else is CONFIRMED.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed on the merged tree (below): typecheck 0, lint 0, 155 suites / 2,830 tests, gates 0 fail / 5 warn on 581 files, `check_baseline` clean, 276 tasks, EXIT 0 | `logs/check-merged.log` |
| V4 Field trace | passed: every figure on W1, W26 and W27 equals the ledger row in kobo (60 of 60 rows on screen against the Hub's own pages; the month's In and Out against my own SQL over the rows) | `logs/shoot.log`, "figure mismatches: 0" |
| V5 Picture | passed, light and dark, with the differences listed below | `pairs/W1`, `W26`, `W27`, `W28`, `W27-debit`, `W26-bills` (each `-light`, `-dark`) |
| V6 States | passed: loading, offline, totals failing alone, a failing later page, no wallet, not found, no results, first use, each entered by its real cause | `shots/*-loading`, `-offline`, `-summary-error`, `-more-error`, `-no-wallet`, `-missing`, `-search-none`, `-first-use`; `pairs/states-*` |
| V9 Live seam | passed: sign-in screen to a value only the server has (my seeded rows, kobo, Lagos times, the Hub's In and Out) | as V4 |

**Capability checks (each run as written)**
- **From W1: CONFIRMED.** Wallet tab, See all lands on `/transactions` (W26); a recent row lands on `/transactions/<id>` (W27); Back returns to the tab (light and dark). **Exception: D1, a grouped row.**
- **W26 search: CONFIRMED.** One character asks nothing; "Ch" asks nothing at 150 ms and asks `q=Ch` after the wait; the search key asks at once (Enter at 120 ms); two spaces ask no `q`; "  Ch  " asks `q=Ch`; 70 typed characters stop at 60; "a%" is searched literally (0 rows); a note ("Rent"), a reference ("VW4-GTB") and a name each find their row; "zzzzz" says No results (and "under Money in" when a chip is on).
- **W26 chips: CONFIRMED.** Each chip asks `filter=money_in|money_out|bills|content` and draws exactly the Hub's first page for it (same ids, same order); Bills drew 2 rows, which is the 2 bill rows in the database.
- **W26 paging and days: CONFIRMED.** 3 pages (cursor sent back as given), 60 rows, ids and order equal to the Hub's; 37 day labels for the 37 Lagos days in the data, each label once; "Thu, 1 Oct" carries from page 1 to page 2 under one label. Rows either side of Lagos midnight (23:20Z and 22:40Z the same UTC day) sit under Today and Yesterday; two unlocks of one piece at 22:30Z and 23:30Z are two days and are not grouped. The same list was drawn with the device clock in Africa/Lagos, Pacific/Auckland and America/Los_Angeles: identical labels and clocks.
- **Month's In and Out: CONFIRMED.** "In · October ₦83,300.00, Out · October ₦43,504.56" equals my SQL over completed rows by Lagos month (a row at 23:30Z on 30 Sep counts in October, one at 22:30Z does not); after I added three unlocks, ₦90,800.00 (+₦7,500.00). Nothing is summed in the app (no `reduce`, no `+=` over kobo in the new code).
- **W27: CONFIRMED.** For 11 kinds of row (tip, GTBank send, bill with a ₦100 charge, airtime with ₦0, pending, failed, reversed, refund, a legacy debit with no stored split, a split that does not add up, a long note) every line, the signed total, the status word and the Lagos date equal the Hub's row. The GTBank send reads ₦25,000.00 + ₦40.00 + ₦25.00 = ₦25,065.00; WAWU's fee is left out at ₦0 and the charge kept at ₦0.00. Share receipt: with `navigator.share` present the sheet got the receipt text with the reference (list of lines, parts, date, reference); copying the reference put it on the clipboard.
- **W28: CONFIRMED.** On an account with a wallet and no bills the Bills chip draws the card with Pay a bill; Pay a bill opens `/bills` (S2). Other empty chips have their own words and no button.
- **Figures: CONFIRMED.** A debit row shows the total that left (−₦25,065.00, −₦10,600.00, −₦2,000.00); parts and totals are the Hub's, including a row whose parts the Hub had to fall back on (₦70.00 charge, total ₦1,070.00).
- **Account switch: CONFIRMED.** Signing out and signing in as another account in the same page showed none of the first account's rows.
- **R-47: CONFIRMED.** No export icon, no Report a problem, no per-kind bill glyph (generic receipt glyph; G-311 files why), no placeholder rows. SHARED-CHANGES WALLET-04 #1 (search field) and R1 (route registration) are present; `src/app/_layout.tsx`, `src/components/**`, `src/api/**`, `src/theme/**` are untouched; the new search pill is feature-local like the schools one (no shared search component exists in `src/components/` to be forked), so this is not the "copy of what main has" defect. No em-dash or en-dash in any new file; no hex or colour literal; the three `style={{}}` hold computed values and pass the gate.

**Findings**
- **D1 · defect, medium: a grouped row on W1 opens the wrong receipt.** Repro: Hub with three completed unlocks of one piece today (₦2,500.00 each). W1 draws "Unlock · Today group piece / 3 buyers / +₦7,500.00"; tapping it goes to `/transactions/<id of the newest unlock>` and W27 reads "Unlock from Group Buyer Three, +₦2,500.00": a different figure from the row tapped and no way to reach the other two. W26's same row correctly opens the group's list (`/transactions?group=<key>`). Cause: `RecentTransactions` always calls `onOpen(shown.id)`; `recentRow` drops `group.key`; `WalletScreen` pushes `/transactions/[id]`. The builder's report says "a grouped row opens the unlocks it stands for", true on W26 only; no W1 test covers it (mutant M23 only proves a press fires). Fix: carry `group.key` through `recentRow` and push the group list from W1 as W26 does, with a test on W1. Evidence: `shots/W1-group-row-*`, `W27-from-W1-group-row-*`, `logs/shoot.log` ("tap the grouped row on W1").
- **D2 · defect, low (test gap on a money figure): the debit total could be summed on the phone and no test would notice** (M09: `Total = amount + charge + fee` survives). The code is right today (it draws `totalKobo`). A fixture whose `totalKobo` is not amount + parts, expecting Total to read `totalKobo`, kills it.
- **D3 · defect, low (test gap): the search wait and the search key are not pinned** (M13 `useDebounced(typed, 0)` and M14 `onSubmit` removed both survive). Both behave correctly live (above). Tests that kill them: two changes inside 350 ms ask once; nothing is asked before the wait; the search key asks before the wait has passed.
- **D4 · defect, low: W27's Account line loses the last four digits for a long bank name.** "First City Monument Bank Limited ••5678" is cut at the end ("First City Monument Bank Limited •..."), so the only identifying digits are the part that is dropped; the headline above shows the full name. `shots/W27-long-*`.
- note (not a defect): a person known to the Hub only by handle has the handle as name, and the avatar's initial is "@" (`shots/W27-handle-*`); a malformed deep link shows the Hub's words ("Validation failed (uuid is expected)") and a Hub 500 shows "Internal server error", through the same helper W1 uses; at 390 by 844 a debit that carries WAWU's fee has its Total row below the fold (it scrolls clear of the Share button; measured at 390 and 320 wide).
- **unclear (owner): "Fintava's charge" (G-721).** The brief and the Hub's own receipt say it, but R-45 (8 Oct) makes Nuvion the wallet provider, so a person on a Nuvion wallet would read another company's name beside their charge. A person would notice it only if they know the provider. Recommend the owner picks a neutral label before wallets move to Nuvion; the constant is one line (`FEE_LABELS`).

**Differences from the artboards (V5), all accounted for.** Status bar (a browser has none); the export icon (R-47, WALLET-35 is after launch) and Report a problem (SUPPORT-01, so Share receipt stands full width until it is added); the month's name and the numbers (data); bill glyphs (G-311); "Tip · How I light a night shoot" for "Tip on your video" and "Bill · Prepaid · 45.2 kWh" for "Prepaid · 45.2 kWh" (the Hub's description; its words differ from the canvas's); "From Amaka Nwosu" for "@amaka" (G-720); the debit's parts card under the canvas's card (the brief, R-29); "No bill payments yet" for "in September" (below). Spacing, chips, summary card, day labels, rows, avatars and both themes otherwise match picture to picture.

**Rulings on the builder's decisions** (all Default (agent), owner may override)
1. W28 "No bill payments yet" for "in September": accept. The list is the whole history, and an empty Bills chip means none at all, so "in October" would be wrong. A person would notice the wording differs from the canvas, nothing more.
2. The grouped row's list: accept for W26 (a row that opens nothing is worse, R-47; "tap to open a receipt" cannot work for a sum of three). D1 is the W1 side of the same decision. A person would notice that the group's list is headed only "Transactions".
3. Debit parts in their own card, labels from the brief: accept (R-29, R-10); see the owner item on the label above.
4. Names for "@handle": accept (G-720; the Hub sends no handle field). Not noticed unless compared with the canvas.
5. The Type line is the description's first part: accept; it matches the Hub's receipt headline.
6. The undrawn copy: accept; canvas tone, no em-dash; "Fintava's" and "WAWU's" use a straight apostrophe where the other copy uses a curly one (cosmetic). A person would notice "No results / Nothing matches “…”. Try a name, a reference or what it was for." and "No money in yet" and similar first.
7. Search waits 350 ms, from two characters, search key at once: accept, confirmed live (D3 is only the missing test).
8. A row shows its amount whatever its status, with Pending, Failed or Reversed before the time; the month's totals leave those out: accept. A person may notice a failed transfer drawn as "−₦3,000.00 Failed", and that Out is not the sum of what is listed.

**The edit to WALLET-01's `WalletScreen.test.tsx`: the minimum.** Five hunks, each an assertion this task made untrue: See all left the not-built lists; the two button lists on W1 and the narrow-phone list gain See all and the two row buttons; "not pressable" became "tap opens W27", with two new See all tests. W4 to W6 still refuse See all: `expectNothingUnbuilt` refuses it by default and the three calls that pass `{ rows: true }` are the three tests that draw rows; a new test pins "no See all and no row to open" on W5. Nothing else in the file changed.

**Mutants (30, each alone in a scratch worktree, the file restored by copy, tree clean after): 27 killed, 3 survived.** Killed: M01 In shows Out; M02 summary asks a fixed month; M03 Lagos offset 0; M04 clock reads UTC hours; M05 Yesterday off by one; M06 provider charge dropped; M07 WAWU fee drawn at ₦0; M08 debit row shows the amount; M10 chips swapped; M11 filter never sent; M12 search from one character; M15 no next page; M16 cursor never sent; M17 Pay a bill removed; M18 Pay a bill to the wrong route; M19 share sends only the headline; M20 duplicates not dropped; M21 a day label on every row; M22 Pending word dropped; M23 W1 row opens nothing; M24 grouped row opens a receipt; M25 group key never sent; M26 search text never sent; M27 See all opens nothing; M28 credit sign flipped; M29 no-wallet drawn as a generic error; M30 search not capped at 60. Survived: **M09** (D2), **M13** and **M14** (D3). No kill was a timeout (`mut/results.log`).

**Trial merge of mobile origin/main (15a8c2c, FIX-32: tests and docs):** one conflict, `docs/PROGRESS.md` (generated; main's taken and regenerated with `check_tasks.py --write`); nothing else. **Full check on the merged tree, two jest workers: EXIT 0** (`logs/check-merged.log`): typecheck 0, lint 0, 155 suites / 2,830 tests passed (builder: 2,828, before FIX-32's two), gates 0 fail / 5 warn / 581 files (the same five PROVISIONAL warns), `check_baseline` clean, 276 tasks. One timeout in `WalletScreen.test.tsx`'s first test when I ran four wallet files together while a web export was building (load); it passed in the full run.

**NOT RUN.** (a) A phone or simulator: the real share sheet (the browser run stubbed `navigator.share`), the pull-down gesture, the soft keyboard's search key, Android back; unblocked by a development build on the Hub's Wi-Fi (V10, RELEASE-03). (b) The real wallet provider: the history reads the ledger only, my rows were written by SQL and the balance on W1 came from a stand-in; unblocked by recorded deliveries (OPS-10). (c) Backend checks: no backend change. (d) V7 and V8 are not in this task's passes.

No server of mine is left running: the web server (5195), the balance stand-in (26965), the Hub (27250) and wawu-id (23496) were stopped by PID, `lsof` on 6431 to 6434 is empty; the worktrees and my two databases are removed.

## Hub entries this task adds (R-41)

The WALLET-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
