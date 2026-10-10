---
id: BILLS-01
title: Pay a bill: choose biller, meter and amount
owner: YOU
area: BILLS
order: 69
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [SHELL-02, UI-02, MONEY-06]
decisions: [R-20]
passes: [V1, V4, V5, V6, V9]
artboards: [S2, S3, S4, S10, S13]
---
On hold since 6 Oct 2026: the wallet provider is moving from Fintava to Nuvion, which has no bill payments. The owner decides whether bills stay (drop, or a separate bills provider).

# BILLS-01 · Pay a bill: choose biller, meter and amount

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV2).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py S2 S3 S4 S10 S13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/designer/BRIEF.md`: its entries for S2, S3, S13 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Bill payments move to Fintava. The catalogue (categories, billers, bundles, plans) and the meter preview come from Fintava through the backend's Fintava client (MONEY-06), served by the Hub; the app never talks to Fintava. That backend work is in this task. Airtime, Data and Cable TV on S2 are added by BILLS-03, and the Bill reminders banner by BILLS-05 (docs/WORKFLOW.md section 7).

## Artboards

- **S2 · Pay a bill**: Pay a bill home: Bill reminders banner '3 due in October · ₦38,200', categories Airtime / Data / Electricity / Cable TV, Recent (Ikeja Electric meter ₦10,500, MTN airtime ₦2,000, DStv Compact ₦15,700). Reached from S1 (Start-here: Home Pay bills, balance-card Bills, Wallet bills row).
- **S3 · Biller**: Electricity billers: Ikeja Electric, Eko Electricity, Abuja Electric, Ibadan Electric, Port Harcourt Electric with prepaid/postpaid notes.
- **S4 · Meter and amount**: Meter number with validated name AND address ('Chidinma Okoro · 14 Admiralty Way'), amount ₦10,000 with presets ₦2,000/₦5,000/₦10,000/₦20,000.
- **S10 · Meter not found**: 'We couldn't find this meter. Check the number.'
- **S13 · Not live yet**: 'Bill payments aren't switched on yet · You'll be able to pay airtime, data, electricity and cable from your wallet here soon.' Entered only by a real cause: the biller or Fintava's bills service reports unavailable (a biller listed `is_available: "No"`, or a purchase answered "service not currently available", as cable does today). No feature flag (R-20).

## Fintava facts

From the sandbox (`docs/fintava/sandbox/16-21`); a newer real response overrides it.

- Electricity billers, their prepaid and postpaid codes, and each disco's minimum and maximum come from
  `GET /billing/discos` (`16-bills-discos.md`): postpaid is listed; minimums run from ₦0 to ₦1,000, so never
  assume ₦500; hide any biller with `is_available: "No"`. Ikeja has two prepaid codes; which to use is Fintava's
  question 15 in `docs/fintava/naira-api.md`. The brief's S3 item ("every biller says Prepaid") predates the
  sandbox: S3 shows what the list returns.
- `POST /billing/preview-meter` returns the name on the meter; any 400 means "We couldn't find this meter" (S10,
  `17-bills-preview-meter.md`).
- Data bundles: `GET /billing/data-bundles/{network}`; 9mobile is `ETISALAT`; titles need cleaning; a bundle is
  network plus code (`20-bills-data.md`). Cable: `GOTV` and `DSTV` only (`21-bills-cable.md`).
- Purchases don't complete in the sandbox yet: airtime, data and electricity answer `400 "Unable to find customers"` and cable answers "service not currently available" (question 17 in `docs/fintava/naira-api.md`). The lists and the meter preview work.

## Brief changes (build these, not the canvas)

- **S2**: Data is built on S8's layout with the bundle list in place of the amount presets (BILLS-03). (Why: the tile is drawn; its screen is built in the canvas's own style.)
- **S3**: the billers Fintava lists, with their prepaid and postpaid codes as listed, each with its own minimum and maximum. (This item first said "Prepaid only, never below ₦500"; the sandbox corrected it.) (Why: Fintava fact from the sandbox (`docs/fintava/sandbox/16-bills-discos.md`): postpaid is listed, minimums run from ₦0 to ₦1,000, and some billers are unavailable and are hidden.)
- **S13**: shown only on a real cause: the biller or Fintava's bills service reports unavailable (a biller listed as unavailable, or a purchase answered "service not currently available", as cable does today). No switch. (Why: R-20: no feature flags.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- S2: Airtime, Data and Cable TV (opens S8): added by BILLS-03
- S2: the Bill reminders banner (opens S27): added by BILLS-05
- S4: Continue (opens S5): added by BILLS-02

## Capability checks

- [x] **From W1:** a user on the Wallet tab taps any bills tile and lands on S2 (this task replaces `unbuilt('BILLS-01')` in `src/features/wallet/home/`; COMPLETE-05). Passed on the real router in jest (`billsFlow.test.tsx`: Wallet tab, Power, `/bills`); the five tiles, W4's shapes, W5 and W6 are in the pictures; a tap in the browser was not driven.
- [x] **S2**: a user can pick Electricity (S3). **NOT RUN: repeat a recent bill** (G-640: nothing records a Fintava bill until BILLS-04, so Recent is not drawn).
- [x] **S3**: a user sees the billers Fintava lists, each with its prepaid or postpaid code, and can pick one (S4). Against the sandbox's own 22 rows through a stand-in; 20 rows show, Kaduna's postpaid code (`is_available: "No"`) is hidden.
- [x] **S4**: a user can enter a meter number and see the name on it; pick an amount within that disco's minimum and maximum. The name and address are read from a stand-in body that is a labelled guess (G-641): **NOT RUN against Fintava's real success body**, which no one has seen.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5). Pictures made, beside the artboards (scratchpad `bills01/pairs/`); the verifier decides.
- [x] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md` (G-640 to G-646).
- [x] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states S10, S13. Loading: the stand-in answers slowly. Error: it answers 500. Offline: the browser aborts the Hub's requests. S10: the stand-in's 400. S13: it lists every company "No", or refuses the key. Empty: a list with no company is S13, so there is no separate empty state.
- [x] A user sees S13 only when the biller or Fintava's bills service reports unavailable, never from a switch. **NOT RUN: cable's "service not currently available"** reaching it (a purchase answer; the pay path has no route yet, G-645).

## What the backend serves today (from the analysis)

- **S2**: missing: Fintava catalogue and meter preview behind the Hub. Today's data comes from Flutterwave; this app reads Fintava only (R-20), through MONEY-06. The reminders banner has no source until BILLS-06.
- **S3**: missing: Fintava catalogue and meter preview behind the Hub. Today's data comes from Flutterwave; this app reads Fintava only (R-20), through MONEY-06.
- **S4**: missing: Fintava catalogue and meter preview behind the Hub. Today's data comes from Flutterwave; this app reads Fintava only (R-20), through MONEY-06.
- **S10**: missing: Fintava catalogue and meter preview behind the Hub. Today's data comes from Flutterwave; this app reads Fintava only (R-20), through MONEY-06.
- **S13**: missing: S13's cause is Fintava's (a biller or the bills service reporting unavailable), served by the Hub in this task.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S2: 3 due in October · ₦38,200
- S2: Ikeja Electric ₦10,500
- S2: MTN airtime ₦2,000
- S2: DStv Compact ₦15,700
- S3: Billers: Ikeja Electric, Eko Electricity, Abuja Electric, Ibadan Electric, Port Harcourt Electric
- S4: Amount presets ₦2,000 / ₦5,000 / ₦10,000 / ₦20,000

## Designer notes (⚠, unresolved)

- None.

## Builder report

**Builder report (10 Oct 2026, Sonnet builder; branches `wmt/BILLS-01` in the mobile and backend repos).** The 6 Oct "on hold" line above is overtaken by R-45 (Fintava stays for bills) and the lead's brief of 10 Oct; it is left as written.

**Built (backend, additive).** `src/bills-catalogue/`: `GET /bills/electricity/billers` (the companies Fintava lists as available, one row per company and plan with its code, its own minimum and maximum in kobo and the quick amounts that fit them; `available: false` is S13) and `POST /bills/electricity/meter-preview` (`{ code, meterNumber }`, answers the name and address, `422 meter_not_found` is S10, `503 bills_unavailable` is S13, `503 provider_unreachable`, `429 bills_rate_limited`, `404 biller_not_found`). Mounted by `BillPaymentModule`, so `app.module.ts` is untouched; reads Fintava through its client (MONEY-06), never through the wallet seam (R-45), outside `src/money/`. The Fintava client's `previewMeter` also reads the owner's name and address (its `details` drops address fields on purpose). Settings with `PROVISIONAL` markers: `BILLS_AMOUNT_PRESETS_KOBO`, `BILLS_CATALOGUE_CACHE_SECONDS` (60), `BILLS_PREVIEW_PER_MINUTE` (30) (`.env.example`). No table, no migration; `contract/openapi.json` +186 lines, none removed.
**Built (app).** `src/features/bills/` and `src/app/bills/`: S2 `/bills` (Electricity tile, S13 note with the tile greyed), S3 `/bills/electricity` (one row per company and plan), S4 `/bills/electricity/<code>` (chips, meter box that checks once five digits are typed and 600 ms pass, name and address line, amount box in whole naira with the Hub's quick amounts and each company's own limits), S10 on a meter Fintava does not know. Hub entries added as drawn (R-41): the five bills tiles on W1, W4, W5 and W6 (restored from COMPLETE-05's version), Bills on H1's balance card (alone, packed from the left), Pay bills first in H1's services row (`[Pay bills][Events][Legal][Schools]`, the canvas's four). `Banner` gained an `info` tone (S13's Clock note).
**Not drawn (R-47).** The Bill reminders banner (BILLS-05), the Airtime, Data and Cable TV tiles (BILLS-03), Continue (BILLS-02), and Recent (G-640).
**Decisions (Default (agent), owner may override).** (1) S3 lists a row per company and plan, each saying "Prepaid" or "Postpaid", not the canvas's "Prepaid and postpaid" (BRIEF S3). (2) S13 also covers a server with no Fintava key or base URL, a refused key and an inactive merchant: Fintava's bills service cannot be used and a retry cannot help; Fintava not answering is a failure with Try again, never S13. (3) The meter check waits for five digits and 600 ms (app constants; Fintava and the Hub decide what a number is). (4) The company names, Ikeja's code, the quick amounts: G-642, G-644, G-643. (5) S4's two fields are `BillField` and `HintLine` in `parts.tsx` until `TextField` has the props (SHARED-CHANGES BILLS-01 #1). (6) Bills run on Fintava whichever `WALLET_PROVIDER` runs; under Nuvion the fee quote for kind `bill` stays `409 target_not_payable` until BILLS-04. (7) Three existing test files asserted that no bills entry was drawn (R-47's absence checks on Home and the Wallet tab); each now asserts the entry this task adds and everything else still absent: `HomeScreen.test.tsx`, `WalletScreen.test.tsx`, `walletTabFlow.test.tsx`.
**New copy the design does not draw (owner to read).** "Checking this meter"; "Meter found" (a found meter whose answer names no owner); "The least you can pay is ₦1,000." and "The most you can pay is ₦500,000." (the company's own figures); "Bills didn't load", "Couldn't load electricity companies", "Couldn't load this company" with "We could not reach the bills service. Try again in a moment."; the Hub's own sentences ("Bill payments are not available right now. Try again in a moment.", "You have checked a lot of meters. Wait a moment, then try again.", "That electricity company is not available now. Pick one from the list."). The S10 and S13 sentences are the canvas's, word for word.
**Checks.** Backend: `tsc --noEmit` 0; eslint on the changed files 0; `src/bills-catalogue` 53 tests (unit, HTTP over a socket to the Fintava double with the sandbox's 22 disco rows, the client's owner reading), plus `src/fintava`, `src/bill-payment` and `src/common/tests` green; 14 mutants of my own, 14 killed; gates 16 FAIL as on main (my three `PROVISIONAL` lines carry owner and why), `check_baseline` clean; `contract:build` twice byte-identical. Mobile: 72 new tests (`src/features/bills/__tests__`: model, screens, routes, a real-router walk) and the three edited files; 18 mutants of my own, 18 killed. `npm run check` EXIT 0 on the branch with mobile main `90bdbfc` (NUV-03) and backend `wmt/BILLS-01` `6226316` (backend main `181ee5d` merged in) merged: typecheck 0, lint 0 errors (7 warnings, all in `eventsFocus`, `ticketsRefetchFails` and professionals `screens` tests, not mine), 124 suites / 2095 tests, gates 10 run, 488 files scanned, 0 findings, 1 warn, task check 273 tasks (`bills01/check3.log`; the check before it, `check2.log`, failed one test in `eventsScreens` under load, which passed alone (`events-alone.log`, 46 of 46) and in this run; before, no gate count moved: 0 findings on main as on the branch; the tests before this branch are the after figure less the 72 and the 6 added to existing files). Backend after the same merge, on a fresh migrated and seeded database: `src/bills-catalogue`, `src/fintava`, `src/bill-payment` and `src/common/tests` 19 suites / 877 tests (one run had `fintava-stall.spec` fail 10 timing tests while the machine was loaded, and the same file passed alone and in the clean rerun); protected suite 253 of 253 against main's lock (`run.sh --fresh HEAD`, in a private network namespace with its own loopback and Postgres reached over its unix socket); gates the same 16 FAIL lines as main (compared line by line); `check_baseline` clean; `contract:build` twice byte-identical and equal to the committed file (+186 lines against main, none removed). The mutant scripts are in the scratchpad (`bills01/mutants_be.py`, `mutants_mob.py`).
**Live seam (V9).** wawu-id's real login (:6141), the local Hub (:6142), a Fintava stand-in (:6143, the sandbox's disco list, a guessed preview body), the web export (:6144), at 390 px light and dark, signed in through the app's own sign-in screen: `bills01/live-seam.txt` (requests and answers) and `bills01/pairs/*.png` (artboard left, build right: S2, S3, S4, S10, S13, H1, W4, W5, W6) and `bills01/shots/` (every state: S2 loading, error and offline, S3 loading, S4 empty, below the minimum, above the maximum and check failed, S13 for no company available and for a refused key). The export was made with its own Metro cache and holds only `localhost:6141` and `localhost:6142`; zero outside requests, zero page errors.
**NOT RUN, and what unblocks each.** Everything against Fintava's real sandbox: this machine has no key and calls no provider (common rules); unblocked by the lead running the Hub with the sandbox key. Within that, the preview's real success body (G-641: a sandbox meter number, question 11). Repeat a recent bill (G-640: BILLS-04). A purchase's "service not currently available" reaching S13 (G-645: BILLS-04 and BILLS-02). V7, V8 and V10: this task moves no money and needs no phone check; the phone run waits for a deployed Hub (R-25).
**Filed.** BACKEND_GAPS G-640 to G-646; SHARED-CHANGES BILLS-01 #1 (TextField props), #2 (backend contract), #3 (mobile contract copied from the backend branch, which merges first).

## Verifier report

**Verifier report (10 Oct 2026, independent Sonnet verifier; mobile `wmt/BILLS-01` at `868dfe7`, backend `wmt/BILLS-01` at `6226316`; I wrote none of this).** Verdict: **not ready, status back to `building`.** Four defects block it (D1 to D4 below, two of them in money and trust, all small to fix). The backend routes are right against the sandbox's own disco list, the app matches the artboards apart from what R-47 and the later tasks own, and nothing in the protected suite moved. Scratch, scripts and pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vbills01/` (`pairs/` artboard beside build, `pics/` every state, `logs/`, `standin/fintava.cjs`, `mut/`). Everything below ran against my own local stand-in for Fintava (the sandbox's 22 disco rows parsed from `docs/fintava/sandbox/16-bills-discos.md`; the preview's success body is a guess, as the builder's was), wawu-id's real login (:6141), a Hub built from the branch (:6142), and a web export made with its own Metro cache (:6144; bundle holds only `localhost:6141` and `localhost:6142`, no `wawuafrica.com`). Zero outside requests and zero page errors in every browser run.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` as the same steps with two jest workers, on the branch (which holds current main `90bdbfc`): **EXIT 0**; typecheck 0; lint 0 errors (7 warnings, none in this task's files); **124 suites, 2095 tests**; gates 10 run, **488 files scanned**, 0 findings, 1 warn; task check 273 tasks. Run after the status was set to `building`, so the `unbuilt_entries` flip has not been exercised (a later `review` must be followed by one more run). `logs/check-final.log` |
| V4 Field trace | passed | Nothing a person writes is stored by this task. Traced the values that cross screens: the company `code` and plan (Fintava list, Hub row, S3 row, route param, S4 chip "Eko Electricity · Postpaid", Fintava gets `{meternumber, disco: "Eko_Postpaid", planType: "postpaid"}`), the company's own limits in kobo (list, S4's limit sentences: Eko prepaid "least ₦1,000", Port Harcourt "most ₦100,000", Ibadan minimum ₦0 takes ₦1), the quick amounts (Hub, chips). `logs/shoot-states.json`, `check_billers.py` |
| V5 Picture | passed with findings D8, D9 and the recorded differences below | `pairs/*-light.png` and `pairs/*-dark.png`: S2, S3, S4, S10, S13 (no company available, refused key, inactive merchant), H1, W1 against W5, W6, W4 |
| V6 States | passed | Loading (a list that answers after 7 s), error (500), offline (the browser aborts the Hub's requests), S10, S13 by three real causes, S4 check failed (500) with Try again that recovers, 429, a company that stops being listed: `pics/`, `pairs/states-*.png`, `logs/shoot-states.json` |
| V9 Live seam | passed | Signed in through the app's own sign-in screen on wawu-id's real login (no injected token); values only the Hub could give (the company list with its limits, the meter's name, the wallet balance from the Hub's read) |
| V2, V3 (backend half) | passed | Contract and regression checks below |

**Checks (all rerun by me).**
- Trial merge of mobile origin/main (`90bdbfc`) and backend origin/main (`181ee5d`) into the branches, in throwaway worktrees: "Already up to date" on both, **0 conflicts** (both branches already contain current main).
- Backend (the branch is the merged tree): `tsc --noEmit` exit 0. `src/bills-catalogue`, `src/fintava`, `src/bill-payment` on a fresh migrated and seeded database in a private network namespace: 17 suites, 817 tests; 16 suites pass, `fintava-stall.spec` failed 3 timing tests under load (load average 20 to 39) and passes alone, 120 of 120 (`logs/be-specs.log`, `logs/be-stall.log`); `src/bills-catalogue` alone 3 suites, 53 of 53. Protected suite `run.sh --fresh HEAD` against origin/main's lock: **253 of 253** (`logs/protected.log`). Note: my first run failed 28 of 253 (`logs/protected-run1-keymismatch.log`): my own local `.env` held a random WAWU ID service key that the mock read and the archived code did not; not the branch. Rerun with the default key: 253 of 253. Gates: **the same 16 FAIL lines as main** (diffed line by line, `logs/gates-branch.txt` against `logs/gates-main.txt`; the branch adds 3 `provisional` warnings and 11 files scanned: 1095 against 1084); `check_baseline` clean (108 entries). `npm run contract:build` twice: byte-identical to each other and to the committed file (sha256 `1cad8d44...e884f`); against main **+186 lines, 0 removed**; the mobile copy of `contract/openapi.json` is byte-identical to the backend's. No fenced file touched except `contract/**` (SHARED-CHANGES BILLS-01 #2); no file under `src/protected-routes`, `test/protected-routes`, `.pipeline`, `prisma`, `src/common`, `src/app.module.ts`.
- Nothing reaches Fintava except through `FintavaClient` (R-45): the module imports `FintavaModule` and the client only; no `http`, `fetch` or `axios` in `src/bills-catalogue`; it imports `PersonWindowLimiter` from `src/money` (allowed direction). The Hub's log holds none of the name, address or meter number I sent.

**Backend routes, CONFIRMED** (live, `check_billers.py`, `preview_battery.py`, `shoot.py`):
- `GET /bills/electricity/billers`: 22 rows in, **20 out**: Kaduna postpaid (`No`) hidden, `Ikeja_Token_Purchase` collapsed under Ikeja's first code. For all 20: code, plan, `minimumKobo` and `maximumKobo` equal naira times 100 from the list (0 differences; Ibadan 0 stays 0; a `1000.50` minimum is 100050), quick amounts only those inside the company's limits. `available: false` (S13) for: every row `No`, an empty list, no Fintava key, no key and no base URL, a refused key (401), an inactive merchant (403). `503 provider_unreachable` with `retryAfterSeconds: 30` for: a 500, a refused connection, a non-array body, an HTML body. A new code in Fintava's list (`Yola_Disco_Postpaid`) is listed as "Yola Electricity", postpaid, with its limits, without a deploy.
- `POST /bills/electricity/meter-preview`: name and address from the guessed body; `422 meter_not_found` for Fintava's bare 400, a 404 and its validation-shaped 400; `503 bills_unavailable` for 401, 403 and no key; `503 provider_unreachable` for a 500, a truncated body, an HTML body, a Fintava 429 and a 400 "Unable to find customers"; `429 bills_rate_limited` on the 6th check with the limit at 5, body `retryAfterSeconds`, `Cache-Control: no-store`, another person unaffected (but see D5); `404 biller_not_found` for an unknown, an unavailable and the collapsed Ikeja code, with nothing sent to Fintava; `400` for letters, 21 digits, an empty number or an extra property; `401` with no token on both routes; spaces and dashes in the number are removed; postpaid codes are previewed as `postpaid`.
- Ikeja: first code listed wins; with the first `No`, the second is the row (`Ikeja_Token_Purchase`); with both `No`, Ikeja is gone (19 rows).

**G-641 (the preview's success body is a guess): ruling.** The Hub and the app **do not crash** on any body I sent (24 shapes: no data, `data` null, a string, an array, nested owner, a number for a name, 5000 characters, a script tag, truncated JSON, an HTML page: each is 200 with nulls, 422, or 503; the app drew text, never threw, 0 page errors). They **do not fail safe against a wrong confirmation** (D2): a body without an owner is drawn as a green "Meter found", including Fintava's own failure style (a 2xx with `"service not currently available"`, which is how cable answers today, and a 200 whose body says `status: 400, "Meter not found"`), and a generic key such as `name` that holds the company's name is drawn as the owner.

**Defects.** Blockers first.
- **D1 (medium, blocker, money input). A decimal point in the amount box multiplies the amount by 100.** `amountDigits` keeps every digit, so typing or pasting `1,500.50` gives **₦150,050** and `10,000.00` gives **₦1,000,000** (accepted without a word when the company's maximum is high: Eko postpaid allows ₦300,000,000). `pics/amount-decimal-light.png`; reproduce on S4: `amount.fill('10,000.00')`. BILLS-02 will pay this number. Fix: read only what comes before the first `.`.
- **D2 (medium, blocker, a promise nothing backs). "Meter found" with a green check is drawn for an answer that names no one, and a wrong name can be drawn as confirmed.** Reproduce with my stand-in: meter numbers starting `0418` (201 `service not currently available`), `0419` (200, `status: 400`, "Meter not found"), `0420` (`data` a string), `0414` (`data` empty) all draw "Meter found"; `0417` (`data.name` is "IKEJA ELECTRIC") draws **IKEJA ELECTRIC** as the owner (`pics/g641-*-light.png`; the stand-in's answers are the `PREVIEWS` table in `standin/fintava.cjs`). The builder's test "answers a found meter whose success body has no data object as found, with no owner" locks the first behaviour in. VERIFIER.md check 6 (a promise on screen nothing backs). Fix: the Hub answers a found meter only for a `data` object that carries an owner (otherwise `provider_unreachable` or `meter_not_found`), and the key list is cut to the keys a real answer has when G-641 closes; or the app draws no confirmation for a meter with no owner.
- **D3 (medium, blocker, a behaviour the task states). The 600 ms wait is not pinned by any test.** Mutant M1 (`METER_CHECK_DELAY_MS` 600 to 0) survives all 4 suites in `src/features/bills` (72 of 72 pass), and the tests use the constant itself, so no test types digits faster than the wait and counts one request. The product is right (browser: 11 digits typed 70 ms apart send exactly 1 check; four digits send none), so this is a test gap on a stated behaviour. Test that would kill it: type digit by digit with 100 ms between keys and assert one preview request, and that a change at 599 ms of silence has asked for nothing.
- **D4 (low, blocker only because VERIFIER.md check 2 names it). `BillField` and `HintLine` in `src/features/bills/parts.tsx` are local look-alikes of `TextField` and its hint, with SHARED-CHANGES BILLS-01 #1 deferring the swap.** Mitigation: `TextField` is fenced and has no `valueSize`, `mono` or positive hint, the row is filed and BUILDER.md allows a stand-in until main has the props. Lead to rule whether this stays; I count it as a defect because the verifier checklist says so.
- D5 (low). The 429 is documented with a `Retry-After` header (controller comment and the contract's summary text), and **no header is sent** (`curl -i`: only `Cache-Control`); the sibling routes (recipients, receipts) do send it. The app does not read it.
- D6 (low). When the meter check answers `bills_unavailable` while the Hub still holds its list (60 s) as available, S4 sends the person to S2 and S2 draws the normal screen, not S13, for up to a minute: tap Electricity, pick a company, type a meter, bounce again. The Hub does not drop its kept list when a check answers "not switched on". Reproduced on the API with the default cache.
- D7 (low). One malformed row in Fintava's list (`minimum_value: null`) makes the whole list `503 provider_unreachable` ("Try again in a moment") for everyone, for as long as the row is there; skipping the row would keep the other 21.
- D8 (low, picture). The ₦ in the amount box is drawn in the browser's serif fallback on the web export (`pics/S4-light.png`, crop `tmp/amount-crop.png`); the chips use `Money`, which sets the platform font for it (D15). Not checked on a phone (NOT RUN).
- D9 (low). Text from the provider is not capped: a 5000-character name with no spaces runs off S4's right edge (`pics/g641-5000-chars-light.png`); names with spaces wrap.

**Unclear (needs the lead or the owner).**
- U1. The Airtime, Data and TV tiles on W1, W5 and W6 open S2, which draws only Electricity (`logs/shoot-flows.json`). The task's W1 check says "any bills tile lands on S2" and COMPLETE-05's verifier agreed, but R-47 says a part whose task is not done is not drawn; BILLS-03 owns Airtime, Data and TV. Draw Power and More only until BILLS-03, or keep all five?
- U2. Ikeja's two codes (G-644, Fintava's question 15). The code names say `Ikeja_Token_Purchase` is the token (prepaid) purchase and `Ikeja_Electric_Bill_Payment` a bill (postpaid) payment, while the Hub lists only the "Bill Payment" one, as prepaid, and so Ikeja postpaid cannot be chosen. The only support for the choice is that Fintava's preview page uses that code. Nothing in the repo can settle it; it needs Fintava's answer before BILLS-02 pays.
- U3. The check starts at five digits, and meter numbers are 11 or 13: a person who pauses 600 ms after the fifth to tenth digit sees the red "We couldn't find this meter" while still typing (reproduced: `99999`, S10 after 0.6 s; the sentence clears when the next digit is typed). Decision 3 records the constants; whether S10 may flash mid-typing is the owner's.

**Differs-for-recorded-reason.** S2 has no Bill reminders banner (BILLS-05), no Airtime, Data or Cable TV tiles (BILLS-03), no Recent (G-640, BILLS-04); S4 and S10 have no Continue (BILLS-02); S13 greys only Electricity; H1's balance card has Bills alone and the services row is Pay bills, Events, Legal, Schools, with no Send, Add, Scan, search, bell or See all (R-47; WALLET-02, WALLET-05, WALLET-20, EXPLORE-02); W1 lacks scan, settings, tabs, Send, Add money, Swap, the card row and See all (R-47). S3 says "Prepaid" or "Postpaid" per row where the canvas says "Prepaid and postpaid" (BRIEF S3: codes as listed, each with its own limits). S3's order is alphabetical (the brief does not fix one). Every sentence on S10 and S13 is the canvas's. No em-dash in anything a person reads.

**Rulings on the builder's decisions.** (1) One row per company and plan: accepted (BRIEF S3). (2) S13's causes (no company available, no key or base URL, a refused key, an inactive merchant; Fintava not answering is an error with Try again): accepted and each reproduced; D6 is the one gap. (3) Five digits and 600 ms: accepted as the recorded default; D3 and U3. (4) Names (G-642), presets (G-643: configured, cut to each company's limits; the sandbox's data never makes the cut bite, mutant B5 proves the unit test does), Ikeja's code (G-644): accepted as defaults, U2 open. (5) `BillField` and `HintLine`: D4. (6) Bills on Fintava whichever `WALLET_PROVIDER` runs: accepted (R-45). (7) The three edited tests: **each change is legitimate.** `HomeScreen.test.tsx` removes `Bills` and `Pay bills` from its absent list and adds presence and navigation tests (Bills alone on the card, Pay bills first, four tiles, the loading view's four shapes) while `Send`, `Add`, `Scan`, `Shop` and `See all` stay asserted absent; `WalletScreen.test.tsx` takes the five tiles and `wallet-bills` ids out of the not-built lists and narrows one regexp from `Airtime` to the words still absent, adds a test that each of the five opens `/bills`, and keeps Scan, settings, Send, Add money, Swap, the card row and See all asserted absent; `walletTabFlow.test.tsx` renames one test and asserts the five tiles beside the same absent list. No assertion was weakened beyond the entry this task adds.

**Capability checks, each as written.** W1 tile to S2: passed in the browser for all five tiles (and Home's Bills and Pay bills). S2 to S3 to S4: passed (`logs/shoot-flows.json`; the chips' X go to S2 and S3, browser back works, an unlisted code returns to S3). S3 lists what the Hub lists (20 rows, Kaduna postpaid hidden): passed. S4 name and address under the number and amounts inside the company's limits: passed against the stand-in's guessed body (the real body is NOT RUN, G-641). Pictures: V5 above. Values from the API: no money amount or four-digit literal in `src/features/bills` outside tests and comments (grep; the full check's gates say the same). States: V6. S13 only from a real cause: passed; cable's "service not currently available" reaching S13 is NOT RUN (no pay route, G-645).

**Request counts and stale answers (browser, `logs/shoot-typing-stale.json`).** Eleven digits typed 70 ms apart: 1 check. Four digits and a pause: 0. Paste of `0412 3456-789abc`: digits only, 11. 26 digits: cut to 20. Five digits unknown, one deleted, one retyped: 2 checks and S10 cleared while the number was four digits. A slow answer (1.5 s) for number A followed by a fast answer for number B typed 0.75 s later: B's name shown from 0.5 s on, A's never shown, even after its answer arrived. B, then A (slow), then B again: A never shown. A slow check, then the number cut to four digits: nothing appears later.

**Mutants of my own (`mut/`, one edit each, original restored and sha256-checked each time).** Backend, `src/bills-catalogue` suites: 13 applied, **13 killed** (B1 limits read as kobo, B2 `available` always true, B3 an unavailable company listed, B4 inactive merchant no longer S13, B5 quick amounts not cut to limits, B6 no rate limit, B7 postpaid previewed as prepaid, B8 Ikeja's later code wins, B9 `meter_not_found` as 400, B10 refused key not S13, B11 an unreachable list drawn as S13, B12 kept list never refreshed, B13 address answered as the name). Mobile, `src/features/bills` screen and model suites plus the Home and Wallet files for their entries: 20 applied, **18 killed, 1 survived (M1, D3), 1 equivalent (M20)**. Killed: M2 check from 1 digit, M3 line not waiting for the settled number, M4 one cache key for every number (stale answers), M5 maximum refused (`>=`), M6 S13 never drawn, M7 an Airtime tile drawn early, M8 any failure drawn as S10, M9 amount to kobo times 10, M10 a failed check retried twice, M11 Home's Bills opens S3, M12 every row says Prepaid, M13 an unreadable row dropped, M14 the canvas's amounts instead of the Hub's, M15 Wallet tiles open S3, M16 the chosen chip never shown, M17 a limit below the minimum not refused, M18 letters accepted in the meter box, M19 `bills_unavailable` not asking the list again. M20 (`amountOk` without `kobo > 0`) cannot be reached: the box strips leading zeros, so zero is never typed; `amountOk` is exported and used by no screen yet (for BILLS-02).

**NOT RUN.** Everything against Fintava's real sandbox (no key on this machine; the common rules forbid a provider call); the preview's real success body (G-641); repeating a recent bill (G-640); cable's "service not currently available" reaching S13 (G-645); a phone or simulator (D8 and the keyboards: whether the number pad offers a decimal point on a device); V7, V8, V10 (not in this task's passes); the web's protected route list beyond the suite's 253 (the dashboard's routes are not in the registry yet, MONEY-01).

## Hub entries this task adds (R-41)

The HOME-01 and WALLET-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
