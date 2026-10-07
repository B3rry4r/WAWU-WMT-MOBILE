---
id: WALLET-01
title: Wallet home: Naira account and its states
owner: YOU
area: WALLET
order: 155
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
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

Verified 7 Oct 2026 on mobile `wmt/WALLET-01` 972d411 (mobile origin/main a167415 is already merged into it). Independent session; I wrote none of this task's code and changed no product or test file. Hub from backend origin/main 3041887 (fresh migrated and seeded database `vw01_hub_test`, port 5405) and the real WAWU ID from wawu-id origin/main fb8717e (`vw01_id_test`, port 5406), both started with the backend's own `scripts/local/up.sh`; the Hub was then restarted with `CORS_ORIGIN` for the web port. Web export with a private `TMPDIR` and `npx expo export --clear`: the bundle holds `http://localhost:5405` and `http://localhost:5406` once each and no `wawuafrica.com` or `fintavapay.com` string; every browser session went only to 5405, 5406 and 5407 (`drive.jsonl`, `hosts`). Fintava: unset for W6 (no key: the Hub answers `503 provider_unreachable` itself, nothing sent), otherwise a stand-in on :5407 under `/fintava` that answers only `GET /customer/wallet/balance/{walletId}` (23 calls, all that path, `serve.log`). Every sign-in went through the app's own sign-in screen. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw01/` (`shots/`, `drive.py`, `drive.jsonl`, `serve.py`, `hub.sh`, `seed.sql`, `mutants/`, `check*.log`, `jest-*.log`, `probe/`). Servers stopped, databases `vw01_*` dropped, worktrees `vw01b` and `vw01id` removed.

| Pass | Result | Evidence |
|---|---|---|
| V1 Gates | passed for the gates, with D3 (jest exit) | First `npm run check` (load 12 to 19 on 4 cores) exit 1: tsc 0, lint 0, jest 66 suites, 1173 of 1175, the 2 failures 20 s timeouts on the first test of `open-wallet/OpenWalletScreen.test.tsx` and `settings/settingsScreens.test.tsx` (not this task's); both files rerun alone: 128 of 128 (`check1.log`). Final run on the report commit: see the line under this table. Jest (parallel workers) exited on its own after its results in both runs: no hang in `npm run check`. In band it is different: D3. Scope fence: the diff is `src/features/wallet/home/`, `src/features/wallet/api/home.ts`, `src/app/(tabs)/wallet.tsx`, three new tests, `tasks/WALLET-01.md`, `BACKEND_GAPS.md`, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`; `_layout.tsx`, `src/components`, `src/theme`, `src/api`, `package.json` untouched; no shared test changed. No em-dash and no hex or rgb literal in the screen code (the one dash hit is a test asserting its absence; `#16151B` is in a comment). Diff matches the builder's file list. No copy of a `src/components` part; `fetchWalletHome` is a near copy of open-wallet's `fetchOpenedWallet` (note, not a defect). |
| R-41 rule | passed | Built entries: eye, Copy, the recent rows (drawn, not pressable). Left out, each in the builder's table with its task, none with a screen in `src/app/` or a done task: Scan (W24, WALLET-20, todo), Settings icon (W35, WALLET-06, todo; `src/app/settings` is Z2, not W35), Naira/Dollar/Crypto tabs and Swap (W2, W3, W20, WALLET-21, todo, R-16), Send (W7, WALLET-02, todo), Add money (W15, WALLET-05, todo), bills tiles (S2, BILLS-01, todo; and bills are off at launch, R-42: no bills entry appears on W1, W5 or W6), WAWU card row (W29, WALLET-22, todo), See all and a row's detail (W26, W27, WALLET-04, todo). No button opens nothing; no "coming soon" (grep). |
| V4 Data trace | passed | API (curl with a real WAWU ID token) and screen agree, `drive.jsonl`. Seed 1 (non-canvas): account 8100000417, bank from the Hub default ("Loma Bank"), stand-in balance 73,914.06, ledger rows tip in 3,750.00, bank send 12,300.00 + 40.00 + 25.00, unlock 1,500.00 + 10.75, an older top-up 99,000.00. Screen: `₦73,914.06`, "WAWU · Loma Bank", "810 000 0417", Copy put `8100000417` on the clipboard; rows "+₦3,750.00", "−₦12,365.00", "−₦1,510.75" (the ledger's `totalKobo`, amount plus both fees, as the BRIEF W1 rule and W27's breakdown have it), the older row not shown (limit 3, `?limit=3` sent), times in Lagos ("16:09", "Yesterday", "Sun"). The balance is the provider's figure, not a sum: our rows would add up to 88,874.25. Seed 2 (changed): `WALLET_BANK_NAME=Ekiti Trial MFB`, account 8100000999, stand-in 1234.5, the send's fee changed to 77.00: screen "WAWU · Ekiti Trial MFB", "810 000 0999", clipboard `8100000999`, `₦1,234.50`, "−₦12,377.00" (`shots/V4changed-*`). creator-basic's own wallet shows its own number (8100000528). The eye masks only the balance (`₦••••••`), number and rows stay. Nothing from the artboard is hard-coded in the screen code. |
| V5 Picture | failed (D2); otherwise every difference classified below | Canvas left, build right: `shots/compare-W{1,4,5,6}-{light,dark}.png` (390 px, 2x). Built alone `shots/W*-{light,dark}-390x844.png`; 320 x 568 `shots/W{1,4,5,6}-light-320x568.png`. Balance width at 320 and 390: `shots/large6-*`, `large7-*`, `large-balance-*`. |
| V6 States | passed except D1 | Light and dark, each by its cause: W4 (stand-in holds the balance 8 s; skeleton, no number), W5 (creator-basic, stand-in 0.00, no ledger rows), W6 (Hub with Fintava unset; one balance ask, Try again asks once more, `before 1, after 2`), wallet still opening (a `FintavaWalletOpening` row `opening`: "Your account is opening"), frozen (stand-in answers Fintava's own "Please confirm both customer accounts are active", the Hub maps it to `423 wallet_frozen`: "Your wallet is frozen" with the server's sentence), failed wallet read (Hub stopped mid-session, and the wallet request cut in the browser: "We couldn't load your wallet"), balance read cut ("We couldn't load your balance", no connection), failed recent rows (ledger table renamed: Hub 500 on `/money/transactions`; the balance card stays, "Couldn't load your transactions." with Try again), unreadable balance (browser-side stand-in, said so: a 200 with `availableKobo: 12.5`, which this Hub never sends: "Your balance could not be read", never a 0). No wallet: the tab opens A26 once; Back stays on the tab with "You don't have a wallet yet"; Home then Wallet opens A26 again. But D1. Back with the wallet opened at the server while A26 was up: the tab shows W5 for the new account (`shots/back-with-new-wallet-W5-*`). |
| V9 Live seam | passed (balance from a stand-in, said so) | Real WAWU ID, real sign-in screen, Hub from main on a fresh migrated and seeded database; the account number, bank name, wallet state and recent rows on screen are the Hub's answers for the signed-in person (three people, three different screens); the balance is the Hub's answer through its own provider seam, fed by the Fintava stand-in because no sandbox balance for a seeded wallet exists. |
| Mutants | 10 of 14 killed | `mutants/results.json` (wallet tests, 32 cases, each mutant restored byte for byte, `git diff` clean after). Killed: debit shown without fees, W6 shown as a generic error, the bank's 503 retried, no-wallet lead pushing A26 repeatedly, a still-loading balance shown as 0, four rows, no fresh read on return, empty card with rows, frozen shown as W6, the card's Open your wallet doing nothing. Survived: M5 bank line hard-coded to "Loma Bank", M6 funding line hard-coded to "812 345 6789", M9 an account without its bank name accepted, M11 the weekday window one day short. D4. |

Final `npm run check` on the report tree (before committing; `check2.log`): exit 0 in 2 min 44 s, tsc 0, lint 0, jest 66 suites, 1175 of 1175, gates 9 run / 306 files scanned / 0 findings, baseline 0, tasks 210. Jest exited by itself right after its results.

### V5, what differs from the canvas
- Missing header icons (Scan, Settings), account tabs, Send / Add money / Swap, bills tiles, WAWU card row, See all: differs-for-recorded-reason (R-41, R-27; R-16 and BRIEF "Not built at launch" for tabs, Swap, Scan, card row; R-42 for bills). With them gone the card sits right under the title, as built. W4's skeleton draws only the blocks the screen shows: same reason.
- "WAWU · Loma Bank" where the canvas says "WAWU · Fintava MFB": differs-for-recorded-reason (BRIEF W1, W5; R-1). The bank name is the Hub's slot (V4).
- Debit rows are totals with fees: BRIEF W1 (rule 5, R-10). Figures, names and times differ because they are the seeded data's.
- W6's line under the title reads the server's "We could not reach your account. Your money is safe. Try again in a moment.", so its first sentence repeats the title; the canvas has "Your money is safe. This is a connection problem between us and the bank.": unclear (owner wording; recorded as G-310 and in the task's "not facts" list, the custody claim cannot be written by the app).
- No status bar in the web build: platform, every tab.
- W5's line wraps one word later than the canvas ("...any Nigerian / bank." against "...any / Nigerian bank."): minor.
- Everything else (card gradient and glow in both themes, label, figure with smaller kobo, divider, bank line, number, Copy pill, eye, row avatars and icons, amounts in green and ink, empty card, W6 card, skeleton blocks, spacing) matches.
- **D2** below.

### Findings
- **D1 defect (Back loops once).** With no wallet, after Back from the A26 the tab opened, tapping the card's "Open your wallet" and then Back on A26 does not return to the tab: the tab opens A26 again at once, and a second Back is needed. Reproduction: browser, user@ with no wallet: Wallet tab, A26 opens; Back, "You don't have a wallet yet"; Open your wallet, A26; Back: still on `/open-wallet` (`drive.jsonl`, scenario `nowallet`, step "Back from button-opened A26": `a26_visible 1`, light and dark; `shots/nowallet-back-after-button-*`). Jest probe (`probe-back-loop.test.tsx.txt`, the screen test's own setup): pushes `["/open-wallet","/open-wallet","/open-wallet"]` after that one Back. Cause: `useLeadToOpenWallet` clears `led` on the first return; the card's button calls `entry.open` without setting it, so the next return finds `led` false and opens A26 again. The builder's test "coming back without opening one ... the next visit opens A26 again" expects 3 pushes but cannot tell that the third came from Back rather than from the new visit.
- **D2 defect (balance cut off).** The balance figure is one line at 42 px and is ended with "…" when it does not fit, so the person cannot read their balance: at 320 px "₦612,345.67" shows as "₦612,345.…" (the kobo gone; the canvas's own ₦485,250.75 is this size), "₦4,852,507.75" as "₦4,852,5…", "₦98,765,432.10" as "₦98,765,…" (`shots/large6-balance-W1-light-320x568.png`, `large7-balance-W1-light-320x568.png`, `large-balance-W1-light-320x568.png`); at 390 px seven digits still fit (`large7-balance-W1-light-390x844.png`). W1 is "balance with kobo". Cause: `BalanceCard` draws `<Money size={ACCT.figure}>` and `Money` is `numberOfLines={1}` with no shrink.
- **D3 defect (tests, not seen by a user).** `WalletScreen.test.tsx` keeps jest alive for about five minutes after it ends when jest runs in band: alone, its 17 tests take 6.3 s and the process exits at 308 s with "Jest did not exit one second after the test run has completed" (`jest-alone-WalletScreen.test.tsx.log`; the three wallet files together: 10 s, exit at 306 s; `walletTabFlow` 8 s and the model test 4 s exit at once). Cause (`probe/longtimers.js`, `probe/longtimers.out`): one React Query garbage-collection timer of 300 000 ms (`Query.fetch` then `scheduleGc`) is set after the file's `afterAll` empties the cache, by a fetch still in flight when it was emptied; 972d411 ("empty the query cache after the tests") does not stop it. `npm run check` runs jest in workers and is not held up; the builder's `--runInBand` run is what looked hung.
- **D4 test gap (no product defect).** Mutants M5 and M6 survive because the fixtures use the canvas's own sample values ("Loma Bank", 8123456789), so a screen that hard-codes the canvas figures passes every test; M9 (an account with no bank name) and M11 (a row six days old) have no case. The product code itself is not hard-coded (V4, two seeds of non-canvas values).
- **Notes, no action asked.** A failed or reversed debit shows its minus total with "Failed ·" or "Reversed ·" before the time (builder default). The bills row glyph and units line wait on G-311. `fetchWalletHome` repeats most of `fetchOpenedWallet` (`src/features/open-wallet/api/wallet.ts`) rather than reusing it.

### NOT RUN
- A real A10 in the browser ending on W5: needs a wallet opened through a Fintava sandbox opening with a BVN that passes (KYC-04 question 11, G-25). Covered by `walletTabFlow.test.tsx` on the real router and, in the browser, by a wallet opened at the server while A26 was up (Back then shows W5).
- A balance read from the Fintava sandbox: no sandbox wallet tied to a seeded account; unblocked by a sandbox wallet id with documented example data. The stand-in uses Fintava's documented answer shape.
- V10 on a phone (safe areas, font scaling, the real clipboard): no device; unblocked by an Android tester build pointed at a local backend.
- The capability checks Send, Add money, Settings, bills tile, See all: their entries are left out (R-41); each is the named later task's check.

Status: back to `building` with D1, D2, D3 open (D4 is a test gap to close with them).

## Builder report, round 2

Builder session, 7 Oct 2026, on `wmt/WALLET-01` with the verifier's report (bd29c48) and main 47e1f07 merged in. SHARED-02 (the `--shadow-money` token, WALLET-01 #1) is still `todo` on main, so the card keeps its named constants and the row stays open.

- **D1 fixed.** `useLeadToOpenWallet` now returns the one `open` the tab uses for every way into A26 (on its own and the card's Open your wallet); each marks the tab as under the flow, so the Back that uncovers the tab always stays on it. New jest case "a Back from the A26 the card's Open your wallet opened lands on the tab, every time" (two rounds of button, then Back): fails on 972d411's `WalletScreen.tsx` (pushes `["/open-wallet","/open-wallet","/open-wallet"]`, the verifier's probe result) and passes now. Browser: user@ with no wallet, tab, A26, Back, then Open your wallet and Back twice: each Back lands on `/wallet` with the card, A26 not shown (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/drive.jsonl`, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots-r2/nowallet-back-after-button-*.png`).
- **D2 fixed (lead ruling).** `BalanceCard` measures the figure at the design's 42 with a hidden copy and the row's width, and `fitFigureSize` (model.ts) picks the largest size, in steps of 2 down from 42, at which the whole figure, kobo included, is one line; floor 18 (wallet.js line 118, W26's month totals, the flow's other figure on a card). Until both widths are known the figure is drawn invisibly, so a cut figure never shows. The shared `Money` is untouched (no prop needed). Proved at 320, 360 and 390 px, light and dark, with ₦0.00, ₦485,250.75, ₦4,852,507.75 and ₦98,765,432.10 against the local Hub (stand-in balance): every figure whole, never ellipsised, page never wider than the screen; sizes 320: 42 / 40 / 34 / 32, 360: 42 / 42 / 40 / 36, 390: 42 / 42 / 42 / 40 (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/fit.jsonl`; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots-r2/fit-<figure>-<width>-<theme>.png`, 24 shots). Four jest cases cover `fitFigureSize` (fits, steps, floor, unmeasured). If a figure did not fit even at 18 it would stay at 18 (the shared `Money` is one line); at 320 px that takes about 20 characters, a balance above ₦100 trillion.
- **D3 fixed.** `WalletScreen.test.tsx` gives the app's cache `gcTime: 0`, makes its held answers abortable, and cancels and empties the cache after each test; `walletTabFlow.test.tsx` does the same. In band: the three WALLET-01 files run 39 tests and the process ends 13 s after it starts. `npx jest --runInBand src/features/wallet` still takes about 310 s, because of `payoutAccountScreen.test.tsx` (WALLET-11's file, not this task's): alone it ends its tests in about 10 s and exits at 306 s. Filed as SHARED-CHANGES WALLET-01 #3 with the same fix; I did not edit another task's test.
- **D4 closed.** Fixtures now use values the canvas never shows ("Ekiti Trial MFB", 810 000 0417 and 810 000 0528), so a screen drawing "Loma Bank" or "812 345 6789" fails (M5, M6). New cases: an open wallet whose account has no bank name is the wallet error, never half a card (M9); a row exactly six days old shows its weekday ("Thu") and seven days old its date (M11).

**Checks.** `npm run check` as one command, run to its exit code: exit 0 in 115 s (tsc 0, lint 0, jest 66 suites, 1182 of 1182, gates 9 run / 306 files / 0 findings, baseline 0, tasks 211); log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/check-r2.log`. New and changed tests: WalletScreen 19, walletHomeModel 18, walletTabFlow 2 (39, all pass). Local stack for the browser runs: backend main 3041887 worktree, database `bw01_test`, ports 5375 to 5377, export with `--clear` and a private TMPDIR holding only `http://localhost:5375` and `:5376`; every browser request went to those three ports. Processes, worktree and database removed after.

## Verifier report, round 2

Narrow re-check, 7 Oct 2026, of mobile `wmt/WALLET-01` 2c91287 (my bd29c48 and main 47e1f07 merged in), same independent session as round 1; nothing fixed. Hub from backend origin/main 3041887 (fresh `vw01_hub_test`, :5405, `node_modules` hard-linked from the shared copy: its generator writes `generated/prisma` inside the worktree, not `node_modules`), real WAWU ID from wawu-id origin/main fb8717e with its own `npm ci` (`vw01_id_test`, :5406), web export with a private `TMPDIR` and `--clear` (bundle holds only `localhost:5405` and `:5406`; every browser request went to 5405, 5406 or 5407). Fintava stand-in on :5407 answering only the balance read (41 calls, all that path); W6 with Fintava unset. Sign-ins through the app's own screen. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw01/` (`drive-r2.jsonl`, `fit-r2.jsonl`, `shots-r2/`, `mutants-r2/`, `check-r2-*.log`, `r2-jest-*.log`, `probe/`). Servers stopped, databases dropped, worktrees `vw01b`, `vw01id`, `vw01t` removed.

| Item | Result | Evidence |
|---|---|---|
| D1 Back loop | closed | Browser, user@ with no wallet, light and dark: the tab's own A26 then Back, then three rounds of the card's Open your wallet then Back, then Home and Wallet (a new visit, A26 opens) and the same four Backs again: 8 of 8 Backs land on `/wallet` with the no-wallet card and A26 gone, each theme (`drive-r2.jsonl`, scenario `backloop`; `nowallet` too). My round-1 jest probe on the new code: 2 pushes after the Back, passes (`probe-back-loop-r2.test.tsx.txt`). |
| D2 balance cut off | closed for the settled figure; D5 below | `fit.py`, light and dark, 320 / 360 / 390 px, ₦0.00, ₦485,250.75, ₦4,852,507.75, ₦98,765,432.10, ₦999,999,999.99 (30 cases): every settled figure whole, kobo shown, never ellipsised (`scrollWidth` ≤ `clientWidth`), the page never wider than the screen. Sizes 320: 42 / 40 / 34 / 32 / 28; 360: 42 / 42 / 40 / 36 / 34; 390: 42 / 42 / 42 / 40 / 38 (floor 18 never reached); the card gets shorter with the figure (192 to 178 at 320). A big figure on first arrival is drawn invisibly until measured: no cut frame (98,765,432.10 and 999,999,999.99 at 320, rAF watcher over about 90 frames). Card shots `shots-r2/fit-<figure>-<width>-<theme>.png`, stacked in `fit-strip.png`. |
| Measuring copy and screen readers | passed on the phone build; web build note | The hidden copy carries `accessibilityElementsHidden` (iOS) and `importantForAccessibility="no-hide-descendants"` (Android); Testing Library treats it as hidden, so `getByLabelText('485,250 naira 75 kobo')` finds exactly one in `WalletScreen.test.tsx`. In the web build those props do not become `aria-hidden`: the DOM has the label twice and the page text reads the balance twice (note, web build only, not a launch surface). |
| Font scaling 1.3 | NOT RUN | The web build has no OS font scale. From the code: both copies are the same `Money` with the same props, so a font scale enlarges both alike and the ratio `fitFigureSize` uses still holds; the card has no fixed height. Unblocked by: an Android build with font size set to 130%. |
| D3 jest exit | closed | `npx jest --runInBand` on the three WALLET-01 files: 39 tests, process ends 17 s after start (13 s of tests; `r2-jest-inband3.log`). `payoutAccountScreen.test.tsx` alone in band: 15 tests in 5.6 s, process exits at 307 s; the probe 15 s after the file shows 5 live 300 000 ms timers, all `Mutation.scheduleGc` from `MutationObserver.onUnsubscribe` (`probe/longtimers-payout-r2.out`). Diagnosis confirmed: WALLET-11's file (last changed in dbd990a, "WALLET-11 round 2"), not WALLET-01. One correction for SHARED-CHANGES WALLET-01 #3: the timers there are mutation timers, so the copied fix also needs `mutations: { gcTime: 0 }`, not only the query default. |
| D4 test gap | closed | `mutants-r2/results.json`: round-1 survivors M5, M6, M9, M11 now killed; new N1 `fitFigureSize` rounds up, N2 ignores the floor, N3 the card button bypasses the shared `open` (round-1 D1), N4 an empty bank name accepted, N5 keeps 42 when the figure does not fit: all killed. 9 of 9. Worktree clean after. |
| Regression | passed | `npm run check` as one command on 2c91287: exit 0 in 1 min 58 s (66 suites, 1182 of 1182, gates 9 / 306 files / 0 findings, baseline 0, tasks 211; jest exited by itself). V5 pairs `shots-r2/compare-W{1,4,5,6}-{light,dark}.png` classify exactly as round 1 (left-outs R-41, R-27, R-16, R-42; bank line BRIEF W1; W6 sentence G-310 unclear; no status bar). W6 by Fintava unset: one ask, Try again asks once more. Trial merge with mobile main 5fec168 (ME-01): three conflicts, all appended table rows or the generated page (`BACKEND_GAPS.md` G-310/G-311 beside G-290 to G-292, `SHARED-CHANGES.md` WALLET-01 rows beside ME-01 rows, `docs/PROGRESS.md`); kept both sides and regenerated: `npm run check` exit 0 (69 suites, 1222 of 1222, gates 9 / 318 files / 0 findings, tasks 211). No code conflict. The merge stayed local and was deleted. |

### Findings
- **D5 defect (low; a cut figure still shows for a frame).** When the balance changes under a mounted card, or on Show after Hide, the new figure is drawn at the old size and is cut with "…" until the hidden copy is measured again. Reproduction: creator-pro at 320 px, balance ₦0.00, go to Home, the bank's figure becomes ₦98,765,432.10, back to Wallet: a painted frame shows "₦98,765,…" before it settles at 32 px (`shots-r2/flash-cut-frame-320.png`, three of the four screencast frames). The rAF watcher records one cut frame in every case where the size must step down (18 of 30 in `fit-r2.jsonl`, e.g. ₦485,250.75 at 42 px in 236 px at 320), and on the eye: ₦4,852,507.75 at 320, Hide then Show, one frame at 42 px, then 34 (`fit-r2.jsonl`, "eye hide then show"). Cause: `measured` in `FittedBalance` is true from the first figure on, so a new figure is shown at once at the previous figure's size; the new width arrives only with the hidden copy's next `onLayout` (on the web after a ResizeObserver and a `setTimeout` in `UIManager.measure`, so after a paint).
- **Note (web build only).** The measuring copy is read twice by a browser screen reader (no `aria-hidden` on the web); the phone builds hide it.
- **Note.** SHARED-CHANGES WALLET-01 #3's suggested fix covers query timers; the payout file's are mutation timers.

### NOT RUN
- Font scale 1.3 on a device (see the table). Unblocked by: an Android tester build with the system font at 130%.
- Screen readers on a device (TalkBack, VoiceOver). Unblocked by: the same build.

Status: `building` with D5 open (low). D1 to D4 are closed.

## Builder report, round 3

Builder session, 7 Oct 2026, on `wmt/WALLET-01` with the verifier's round-2 report (da73833) and main 5fec168 merged in, merge commits only. The merge of main conflicted in `BACKEND_GAPS.md` and `SHARED-CHANGES.md` (WALLET-01's rows beside ME-01's); both sides are kept (5e2f112, before anything was pushed). SHARED-02 is still `todo` on main, so the card keeps its named shadow constants and WALLET-01 #1 stays open.

- **D5 fixed.** `FittedBalance` keys its measurement to the figure (its text, or "hidden" while masked): the width the hidden copy reported counts only for the figure it measured, so a new balance, and Show after Hide, stays invisible until the hidden copy has measured that figure, and no frame paints it at the old size. The hidden copy is remounted per figure (`key`), so it always reports its layout, even when the new figure is as wide as the old.
- **Screen readers on the web.** The hidden measuring copy now carries `aria-hidden` beside `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`.
- **Tests.** New `src/features/wallet/__tests__/BalanceCard.test.tsx` (4 cases, layouts sent by hand): invisible until measured, then the fitted size; a new figure invisible until it is measured; Show after Hide waits for a new measurement; one `aria-hidden` measuring copy, also hidden natively. On round 2's `BalanceCard.tsx` three of the four fail (a new figure and Show after Hide are shown at once; no `aria-hidden`); all four pass now.
- **Frame watcher, re-run** (the verifier's `fit.py`, adapted to this stack as `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/fit3.py`: same rAF watcher, the balance changed under a mounted card by leaving and coming back to the tab, plus Hide then Show twice on ₦4,852,507.75), at 320 px, light and dark, against a local Hub from backend main 3041887 (`bw01_test`, stand-in balance on :5376, web on :5377): **0 cut frames** in all 14 cases: ₦0.00 at 42, ₦485,250.75 at 40, ₦4,852,507.75 at 34, ₦98,765,432.10 at 32, ₦999,999,999.99 at 28, and both Hide/Show rounds at 34; no page overflow; the measuring copy `aria-hidden`, the shown figure not. Log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/fit-r3.jsonl`, card shots `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/shots-r3/`.

**Checks.** `npm run check` as one command, run to its exit code: exit 0 in 179 s (tsc 0, lint 0, jest 70 suites, 1226 of 1226, gates 9 run / 319 files / 0 findings, baseline 0, tasks 211); log `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bw01/check-r3.log`. Processes, worktree and `bw01_test` removed after the run; only ports 5375 to 5377 were used, the export held only the two localhost addresses, and every browser request went to those ports.

## Verifier report, round 3

Narrow re-check, 7 Oct 2026, of mobile `wmt/WALLET-01` 15691dd (my da73833 and main 5fec168 merged in), same independent session; nothing fixed. Hub from backend origin/main 3041887 (`vw01_hub_test`, :5405; its generator writes `generated/prisma` in the worktree), real WAWU ID from wawu-id origin/main fb8717e with its own `npm ci` (`vw01_id_test`, :5406), web export with a private `TMPDIR` and `--clear` on :5407 (bundle holds only `localhost:5405` and `:5406`). Fintava stand-in answering only the balance read (112 calls, all that path). Sign-ins through the app's own screen. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw01/` (`fit3.py` and `fit3-verifier.jsonl`, my own frame watcher, not the builder's copy; `fit3-summary.txt`; `shots-r3/`; `drive-r3.jsonl`; `mutants-r3/`, `mutants-r2-again/`; `r3-*.log`; `check-r3.log`). Servers stopped, databases dropped, worktrees `vw01b` and `vw01id` removed.

| Item | Result | Evidence |
|---|---|---|
| D5 cut frame | closed | `fit3.py`, 320 / 360 / 390 px, light and dark, every animation frame watched (cut means visible with `scrollWidth` above `clientWidth`, or wider than the card): (A) first mount of ₦0.00, ₦485,250.75, ₦4,852,507.75, ₦98,765,432.10, ₦999,999,999.99, a fresh session each; (B) the balance changed under the mounted card by leaving for Home and coming back; (C) the balance changed while the tab stays open (the browser's `visibilitychange` makes the cache ask again; the page never leaves `/wallet`), 0 to 98,765,432.10 to 485,250.75 to 999,999,999.99; (D) a change of the same width while open (73,914.06 to 73,914.07: it appears, it does not stay invisible); (E) Hide then Show twice on ₦4,852,507.75. 108 of 108 cases pass: 0 cut frames, 0 ellipses, 0 page overflow. Sizes as round 2 (320: 42 / 40 / 34 / 32 / 28). Cards `shots-r3/B-*.png`. |
| Measuring copy and screen readers | passed | Every case: the copy carrying the balance label sits under `aria-hidden="true"`, the shown one does not (`fit3-verifier.jsonl`, `copies`). Chrome's accessibility tree (CDP `Accessibility.getFullAXTree`, not ignored nodes) holds exactly one balance node: "4,852,507 naira 75 kobo" when shown, "Balance hidden" when hidden, beside the three row amounts. Natively: `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` on the same view (BalanceCard.test.tsx case 4). |
| BalanceCard.test.tsx | passed | With round 2's `BalanceCard.tsx` (2c91287) put back for the run: 3 of 4 fail (a new figure shown at once, Show after Hide shown at once, no `aria-hidden`); with 15691dd's: 4 of 4 pass (`r3-balancecard-on-r2.log`). Worktree restored, `git status` clean. |
| Mutants on the keyed measurement | 3 of 4 killed | `mutants-r3/results.json` (four wallet test files, 43 cases): K1 the measured width counted for any figure: killed; K3 the key ignores hiding: killed; K4 the copy loses `aria-hidden`: killed. K2 the hidden copy not remounted per figure: survives, because jest sends layouts by hand and cannot show a ResizeObserver staying quiet. In the browser case D above (same-width change) shows the remount works. Test gap, not a defect. |
| Merge history | passed | `git grep -nE '^(<<<<<<<|>>>>>>>)'` on 15691dd: nothing. Every table row of `BACKEND_GAPS.md` and `SHARED-CHANGES.md` from both parents of e0eff58 (da73833 and 5fec168) is in the head. Two branch-side rows differ (`ME-06 #5`, `ME-11 #4`), and those carry main's newer text: the branch never changed them (identical to the merge base 47e1f07), and the head equals 5fec168's. |
| D1 to D4 still closed | passed | D1: 8 of 8 Backs from A26 land on the tab, light and dark (`drive-r3.jsonl`). D2: case A above. D3: `npx jest --runInBand` on the four WALLET-01 test files, 43 tests, ends 17 s after start. D4: the 9 round-2 mutants (M5, M6, M9, M11, N1 to N5) all still killed (`mutants-r2-again/results.json`). |
| Regression | passed | Trial merge: mobile origin/main is still 5fec168, already an ancestor of 15691dd, so the merge is a no-op. `npm run check` as one command: see the line under this table. |

`npm run check` as one command on the report tree (code identical to 15691dd; `check-r3.log`): exit 0 in 3 min 9 s, tsc 0, lint 0, jest 70 suites, 1226 of 1226, gates 9 run / 319 files scanned / 0 findings, baseline 0, tasks 211; jest exited by itself.

### Findings
- **Test gap (no product defect).** Mutant K2 survives jest; the browser shows the behaviour it guards.
- No defect open.

### NOT RUN
- Font scale 1.3 and TalkBack or VoiceOver on a device. Unblocked by: an Android tester build with the system font at 130%.

Status: `review`. D1 to D5 are closed.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
