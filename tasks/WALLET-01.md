---
id: WALLET-01
title: Wallet home: Naira account and its states
owner: YOU
area: WALLET
order: 155
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-11, MONEY-12, MONEY-13, MONEY-15, UI-02, KYC-05]
decisions: [R-1, R-16, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [W1, W4, W5, W6]
---
# WALLET-01 · Wallet home: Naira account and its states

## Lead note (7 Oct 2026): built now, with what exists (R-41)

The owner asked for every tab to be built now. This hub is built before the tasks below; each entry on it that leads to one of their screens is left out here and added, exactly as drawn, by that task (R-27, R-41). Everything else on the artboards is built as drawn.

- WALLET-02 (Send to a WAWU user)
- WALLET-05 (Add money and withdraw)
- WALLET-06 (Wallet settings, change and reset the PIN)
- BILLS-01 (Pay a bill: choose biller, meter and amount)
- WALLET-04 (Transaction history and detail)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W1 W4 W5 W6` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W1, W5 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W1 · Wallet · Naira**: Naira account home: account tabs (Naira/Dollar/Crypto), balance with kobo, 'WAWU · ' and the bank name from the API (Loma Bank, BRIEF W1) with the NUBAN and Copy, Send / Add money / Swap, bills tiles (Airtime, Data, Power, TV, More), WAWU Verve card row, recent transactions. Entry map (section 0) numbers 10 hotspots.
- **W4 · Wallet · loading**: Skeleton of the real layout; account number hidden until the balance loads.
- **W5 · Wallet · new account**: First visit after account opening: ₦0.00, NUBAN ready to share, empty transactions with 'Send to 812 345 6789 from any Nigerian bank.'
- **W6 · Wallet · can't reach account**: Error state when the bank does not respond: no balance is shown, reassurance copy, Try again; bills tiles still visible.

## Launch scope

The Dollar and Crypto tabs, Swap, Scan and the WAWU card row are not built at launch (R-16; BRIEF W1 and "Three
defaults"). Each is added, as drawn, by the after-launch task that builds its screen (WALLET-21, WALLET-20,
WALLET-22). Debit rows show the total that left the wallet (BRIEF W1).

## Brief changes (build these, not the canvas)

- **W1**: "WAWU · " followed by the bank name as a slot the app fills. Sample "Loma Bank". Keep the Dollar tab drawn; the app hides it at launch. In the recent transactions, a debit row shows the total that left the wallet: "Chidinma Okoro · Transfer · GTBank −₦25,065.00" (₦25,000 + ₦65) and "Ikeja Electric · Prepaid −₦10,600.00" (₦10,500 + ₦100). The tip received stays +₦2,000.00. (Why: R-1 and a Fintava fact: the bank is Loma Bank, named by the API. R-16 for the Dollar tab. Rule 5 and R-10 for the debit rows.)
- **W5**: "WAWU · Loma Bank" (bank name slot, as W1). Dollar tab as W1. (Why: R-1.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W1: Swap and the Dollar and Crypto tabs (opens W20): added by WALLET-21 after launch; not built at launch (BRIEF, "Not built at launch")
- W1: Scan (opens W24): added by WALLET-20 after launch; not built at launch (BRIEF, "Not built at launch")
- W1: the WAWU card row (opens W29): added by WALLET-22 after launch; not built at launch (BRIEF, "Not built at launch")

**Lead note (4 Oct 2026, from KYC-04):** a money action here that answers `409 pin_not_set` opens A9 (route `open-wallet-pin`, KYC-04) and comes back to this screen once the PIN is set; it never shows the bare error.

## Capability checks

- [ ] **W1**: a user can copy the account number; Send (W7); Add money (W15); open Settings (W35); pay a bill from a bills tile (S2); See all transactions (W26).
- [ ] **W5**: a user can copy account number; Send; Add money.
- [ ] **W6**: a user can tap Try again; use bill tiles.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W4, W5, W6.
- [ ] A signed-in user with no wallet who taps the Wallet tab lands in Open your wallet (A26), and after A10 lands on W5.

## What the backend serves today (from the analysis)

- **W1**: partial. Missing: Balance and NUBAN exist but on a Flutterwave PSA, in whole naira, creator-only. Missing: multi-account (USD, crypto) summary, card summary, bank-record transactions, Fintava provider.
- **W4**: n/a. Missing: Client state only.
- **W5**: partial. Missing: Provisioning exists only for creator accounts and only at Flutterwave; canvas opens an account for everyone at sign-up (A8 'Tier 1 opens the wallet').
- **W6**: partial. Missing: Endpoint fails as a whole when the provider is down; no typed 'provider_unreachable' error code distinct from other failures, and it is Flutterwave, not Fintava.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W1: WAWU · Fintava MFB
- W1: Naira balance ₦485,250.75
- W1: account number 812 345 6789
- W1: Verve WAWU card Physical · ••4821 · Active
- W1: Amaka Nwosu Tip on your video +₦2,000.00
- W1: Ikeja Electric Prepaid · 45.2 kWh −₦10,500.00
- W1: Chidinma Okoro Transfer · GTBank −₦25,000.00
- W5: 'Send to 812 345 6789 from any Nigerian bank.'
- W5: ₦0.00
- W6: 'Your money is safe. This is a connection problem between us and the bank.' (custody claim)

## Designer notes (⚠, unresolved)

- W1: “⚠ I added the WAWU card row under bills, because it's the only way into Cards (W29–W34). ⚠ The Create button is hidden on Wallet so it never covers amounts. Confirm.” Resolved: the designs are final (DECISIONS, Authority); the card row is added after launch by WALLET-22.

## Builder report

Builder session, 7 Oct 2026, branch `wmt/WALLET-01` from main c5d3a94. Backend: none changed (money freeze); contract as on main (wawu-backend 3041887).

**Files.** New: `src/features/wallet/api/home.ts` (GET /money/wallet, the balance query from `@/api/money` with a no-retry rule for `provider_unreachable`, GET /money/transactions?limit=3; keys under `['money', ...]` and the signed-in account); `src/features/wallet/home/` `WalletScreen.tsx` (tab body, states, the no-wallet lead), `BalanceCard.tsx` (kit `Acct`), `RecentTransactions.tsx` (rows and W5's empty card), `WalletSkeleton.tsx` (W4), `model.ts` (state choice, bank line, row mapping, Lagos times); tests `src/features/wallet/__tests__/` `WalletScreen.test.tsx` (17), `walletHomeModel.test.ts` (13), `walletTabFlow.test.tsx` (2, real Expo Router). Changed: `src/app/(tabs)/wallet.tsx` (the placeholder replaced). Reused, not copied: `copyText`, `groupedAccountNumber`, `useOpenWalletEntry`, `useSessionAccount` (open-wallet), `hueFor` (feed), `gradientEnds` (MediaCard). Docs: BACKEND_GAPS G-310, G-311; SHARED-CHANGES WALLET-01 #1, #2; docs/LOG.md.

**Left out (R-41, R-27), each added as drawn by the task named:** W1 header Settings icon (opens W35): WALLET-06. W1 Send (W7): WALLET-02. W1 Add money (W15): WALLET-05. W1 bills tiles Airtime, Data, Power, TV, More (S2, Services flow), also on W5 and W6: BILLS-01 (and R-39: bills have no provider). W1 Transactions · See all (W26) and tapping a row (W27): WALLET-04 (rows are drawn, not pressable). After launch (BRIEF "Not built at launch"): W1 Scan icon (W24): WALLET-20; Naira/Dollar/Crypto tabs and Swap (W2, W3, W20): WALLET-21; WAWU card row (W29): WALLET-22. With Dollar and Crypto out, the one-segment tab row is left out too (Default (agent), owner may override: a tab row with one tab switches nothing). With Send, Add money and Swap all out, the action row is empty and not drawn. The skeleton (W4) draws only the blocks the screen shows. No entry on these artboards leads to a screen already built.

**Capability checks** (jest: the 32 new cases pass; browser: web export on :5377 against a local Hub from backend main 3041887 on :5375, made-up wallets and ledger rows seeded in `bw01_test`, stand-in WAWU ID and Fintava stand-in on :5376, signed in through the app's own A22, 390 px, light and dark):
- W1 copy account number: jest (digits as sent on the clipboard, "Copied") and browser (clipboard read back `8100000003`, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/W1-copied-*.png`). Send, Add money, Settings, bills tile, See all: left out (above), so NOT RUN here; each belongs to its task.
- W5 copy, Send, Add money: copy by jest; Send and Add money left out (WALLET-02, WALLET-05). W5 entered by its real cause: a wallet the stand-in answers ₦0 for, with no ledger rows (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/W5-*.png`).
- W6 Try again: jest (one ask, no automatic retry, then Try again asks again and shows W1) and browser (Hub with Fintava unset answers `503 provider_unreachable`; Try again asks again, still W6, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/W6-unreachable-*.png`). Bills tiles: left out (BILLS-01).
- Every value from the API or the user: balance (stand-in figure through MONEY-11), bank name ("Loma Bank", the Hub's `WALLET_BANK_NAME` default), account number, rows (ledger), W6 and frozen sentences (server's `reason.message`). Gaps: G-310 (W6 reassurance), G-311 (bill glyph and units).
- Loading, empty, error by real cause: W4 by a balance answer held 6 s at the stand-in (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/W4-loading-*.png`); empty is W5; wallet read error by stopping the Hub (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/wallet-error-hub-down-*.png`); "opening" by an opening row in `FintavaWalletOpening` (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/opening-*.png`). Frozen, unreadable balance and failed recent rows: jest only (NOT RUN in the browser: the Fintava stand-in has no frozen answer and the ledger read cannot be made to fail without breaking the Hub; unblocked by a stand-in answer in Fintava's frozen shape).
- No wallet: browser, seeded `user@` with no wallet taps Wallet and lands on A26 (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/nowallet-A26-*.png`); Back returns to the tab with "You don't have a wallet yet" and Open your wallet (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots/nowallet-back-on-tab-*.png`), whose button opens A26 again. After A10 lands on W5: jest on the real Expo Router (`walletTabFlow.test.tsx`, stand-in A26 to A10 steps); NOT RUN in the browser: a real opening needs a Fintava sandbox BVN that passes (KYC-04's question 11, G-25).
- Picture (V5): screenshots taken beside `build/design_shots/W1,W4,W5,W6-*.png`; the comparison is the verifier's.

**Gates.** Before (origin/main c5d3a94): tsc 0, lint 0, gates 9 run / 297 files / 0 findings, tasks 210; jest not run in full before (the full run was stopped at the 30 min limit on this shared machine; 939 `it(` cases counted in the source). After (branch with main a167415 merged): tsc 0, lint 0, gates 9 run / 306 files / 0 findings, tasks 210 (`check_tasks.py --write` run). Jest `--runInBand`, all suites: 66 suites, 1175 passed before the merge; after it 1174 passed and 1 failed, `settingsScreens.test.tsx` "shows the loading view ... then a retry" (SETTINGS-01's, a timing case under load on this shared machine), which passed alone right after (91 of 91). The three new files pass on their own (32 of 32). Jest prints "did not exit one second after the run" on full runs; the full run was stopped after its results were printed, so `npm run check` as one command was NOT RUN to its exit code here (unblocked by a run on a quiet machine or CI).

**Defaults (agent), owner may override:** no tab row (above); the balance can be hidden with the eye for the visit, not remembered; row times in Lagos time ("10:24", "Yesterday", weekday within 6 days, then "22 Sep"); a row's status shown before its time when not completed ("Pending · 10:24"); bill rows use Receipt (G-311); the bank's 503 is not retried automatically; no wallet: tapping the tab opens A26 once per visit, Back stays on the tab with a way in ("You don't have a wallet yet", "Open your wallet to continue.", copy not drawn, written in the canvas's tone); "Your account is opening / Check again in a moment." (A8's words) while the account is being made; "Your wallet is frozen" with the server's sentence; W5's "from any Nigerian bank" kept as drawn (the ledger already records `account_funded` bank transfers as `top_up`).

**Findings.** W6 shows the server's sentence, so "We could not reach your account" repeats the title (G-310). The design draws a status bar and the app's web build has none, as on every tab. A first version of `walletTabFlow.test.tsx` installed its `fetch` stand-in after the API client had kept jest's own `fetch`; jest's `fetch` is the Expo stub (a probe showed it answers without a network call), so nothing left the machine; the test now installs its stand-in first.

**Process.** Hub worktree `/home/user/wt/bw01-hub` (backend main 3041887, own `npm ci` because the shared node_modules lacked `ws`), database `bw01_test`; ports 5375, 5376, 5377 only; the export (`--clear`, private TMPDIR) held only `http://localhost:5375` and `:5376`, and every browser run recorded requests to those three local ports only. Processes, worktree and database removed at the end. No call to id.wawuafrica.com, api.wawuafrica.com or any fintavapay.com host. Logs: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/` (`drive.jsonl`, `drive.py`, `stand-in/`).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
