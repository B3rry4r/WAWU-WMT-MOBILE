---
id: WALLET-04
title: Transaction history and detail
owner: YOU
area: WALLET
order: 113
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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

**Checks.** CHECKLINE

**An edit to a test I did not write.** WALLET-01's `WalletScreen.test.tsx` asserted that See all is not drawn and a row is not pressable until WALLET-04, which this task makes untrue. `expectNothingUnbuilt` no longer lists See all (it still refuses it where there are no rows: W4, W5, W6 and the states without a balance); the two button lists on W1 gain See all and the two row buttons; "a transaction row ... is not pressable because its detail is not built" became "... a user can tap it to open that transaction (W27)", with two new tests for See all. Nothing else in the file changed.

**Defaults (agent), owner may override.** (1) The list is the whole history and the summary is this month (Lagos): W28 says "No bill payments yet" where the canvas says "in September" (the Hub's `month` filter is not used: no month picker is drawn, and a list cut at the month would hide older rows). (2) A grouped row ("Unlock · piece", "3 buyers") opens the unlocks it stands for, the same list without search, chips or totals (`/transactions?group=<key>`); the canvas draws no such screen, the alternative is a row that opens nothing. (3) A debit's parts sit in their own card under the canvas's card; the labels are the brief's, "Fintava's charge" and "WAWU's fee" (G-721: R-45 makes the provider Nuvion), one constant, `FEE_LABELS`; WAWU's fee is left out when it is 0, the provider's charge is kept at ₦0.00. (4) W27's From and To show a person's name, not "@handle" (G-720). (5) The Type line is the first part of the Hub's description, as the Hub's own receipt reads it. (6) Copy the canvas does not draw: "No results", "Nothing matches “…”. Try a name, a reference or what it was for.", "No money in yet", "No money out yet", "No content payments yet", "No transactions yet / Money you send, receive and pay shows up here.", "Couldn’t load your transactions", "Couldn’t load this month’s totals.", "Sharing isn’t available on this device.", "We couldn’t find that transaction", and the share text ("Who Made This receipt", the headline, the status, each line, the parts, the date, the reference). (7) Search waits 350 ms after the last key (the schools' wait), asks from two characters (the Hub's minimum), and the search key asks at once. (8) A row shows its amount whatever its status, with "Pending", "Failed" or "Reversed" before its time; the month's totals leave those out (the Hub's rule).

**Not drawn (R-47):** the export icon beside the title (statements, WALLET-35), Report a problem (SUPPORT-01 adds it, as drawn), a bill's glyph per kind and its units (G-311).

**NOT RUN, and what unblocks each.** (a) A phone or simulator: the real share sheet, pulling the list down with a finger (jest pins `onRefresh`; the web export has no pull), the keyboard; unblocked by a development build on the same Wi-Fi as a local Hub or a tester build (V10, RELEASE-03). (b) Against the real wallet provider: the history reads the ledger only (no provider call), but these rows were written by SQL to the ledger's columns, not by a real delivery, and W1's balance came from a stand-in; unblocked by recorded deliveries (OPS-10, or Nuvion's sandbox once its deliveries are recorded). (c) The statements icon and Report a problem: WALLET-35 and SUPPORT-01.

No server of mine is left running: the Hub, wawu-id, the Fintava stand-in and the static server were stopped by PID (checked with `lsof` on 6431 to 6434), and the worktrees are removed.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The WALLET-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
