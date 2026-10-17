# WALLET-38 verifier report (Sonnet verifier, 17 Oct 2026)

Mobile `wmt/WALLET-38` e9db0bf on `wmt/MERGE-6` 70a7895; backend `wmt/MERGE-6` fbf391f unchanged. Verdict: **merge** (nothing medium or worse).

| Pass | Result | Evidence |
|---|---|---|
| V1 Gates | passed | typecheck 0; lint 0 errors (6 warnings, all in files this branch does not touch); `gates run: 10, files scanned: 685, 0 fail, 5 warn (the batch's PROVISIONAL), 0 accepted`; baseline 0; `npm run tasks` ok (330 tasks); jest passFlow + walletTabFlow + route-graph 56 passed. `logs/check.log` |
| V1 mutants | passed | 7 mutants, all killed by passFlow.test.tsx (lines guard, date line, undefined-as-no-pass, tier name, line order, card always drawn, error state). `logs/mut-*.log` |
| V4 Field trace | passed | pass name, tier name, `plan.event_date`, `plan.event_pass.<id>.benefits`: admin setting or config -> real Hub `GET /me/tier` -> W44 (all four) and W1 tile (name, date). Another account's `/me/tier` has `eventPass: null`; no token is 401; the cache is cleared on sign-out and keyed by account. |
| V5 Picture | passed | `pics/v-w44-full-{dark,light}-compare.png`, `pics/v-w1-full-{dark,light}-compare.png` (board left, app right, 390 px at 2x). Card radius, padding, type, label and row rhythm (52/56 px), tile height 174 vs 175 and gaps (41 vs 40, 42 vs 42) match. Only the recorded differences show. |
| V6 States | passed | each by its real cause: loading (Hub holds the answer, both themes), empty (`eventPass: null`), error (Hub 500 x3, and a network failure with the WifiOff icon), retry then pass, no tier, pass without a tier row, malformed body (no `eventPass`, blank name) is the error state and never "no pass", bad date reads "Date to be announced", non-string lines dropped. `pics/sheet1-dark.png`, `sheet2-dark.png`, `sheet3.png`, `s*-{dark,light}.png` |
| V9 Live seam | passed, with two limits | App sign-in form used (no injected token) against the stack's mock WAWU ID; the real Hub's `/me/tier` answered with rows and settings seeded in the stack database (Hub value on screen: pass name, tier name "Verify Plus", day "Sun 20 Dec 2026", three lines in order); tap Passes -> `/pass` -> back to `/wallet`. Limits: the mock answers `/auth/login` without the `{data}` envelope the app requires, so a browser route wrapped it (the app's own form still signed in); `/api/hub/money/*` is stubbed in the browser because Fintava is closed on the stack (nothing in this task reads it). |

Capability checks: all five pass (pass holder taps Passes and sees W44; no tier means no card; picture against picture; values from the Hub, G-814 filed; loading, empty, error exist).

Attacks that held: failed read on W1 draws no card and no error; double tap on the tile opens one W44 and one Back returns to Wallet; the day does not move in Kiritimati, Pago Pago or Los Angeles zones; a pass arriving or leaving while the app is open shows on returning to the tab; signed-out `/pass` goes to `/welcome`; no horizontal scroll at 320 px; a 51-character pass name wraps on W44 and ends with an ellipsis on the tile; 18 benefit lines scroll. Copy: no em-dash, no dollars, no brand name in the new files.

## Findings
1. low, unclear (no change needed now): W44 is reachable only from the Passes card, which is drawn only in the wallet's `ready` state (`WalletScreen.tsx` Body, case 'ready'). A pass holder whose wallet is frozen, unreachable or not opened has no way to W44. The board draws the card on W1 only, and a tier is bought from the wallet, so this is consistent with the board; the lead may want the owner to see it.
2. low, differs-for-recorded-reason: no status bar, eyebrow or QR (G-814, R-47), the Hub's tier name ("Verify Plus") where the board says "Founding Maker · priority", the tile is full width (DV2-02), date line stands where the event name is. As recorded by the builder.
3. low, PRE-EXISTING on MERGE-6, not this task: the balance card line reads "WAWU · <bank>" (`src/features/wallet/home/model.ts:110`, `bankLine`), where the board and R-69 read "Who Made This? · <bank>". Same on main; belongs to DV2-COPY.
4. note: the error body prints the Hub's own message (the app-wide convention), so the wording is the Hub's.

No stand-ins: the glow is drawn per card as in `BalanceCard`, `CardBackdrop` and `CardGlows` (no shared glow component exists). Diff stat matches the builder's list (12 files, plus PROGRESS and the task history); no backend, schema or layout change.

Machine: stack `wallet_38` 7540-7547 brought up, `down` run (3 PIDs stopped, database dropped, ports closed, nothing of mine listening). Worktrees v-wallet-38-m and v-wallet-38-be removed. The disk was at 99 percent (458 MB free) during the run; not mine.
