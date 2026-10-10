---
id: BILLS-01
title: Pay a bill: choose biller, meter and amount
owner: YOU
area: BILLS
order: 69
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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
**Checks.** Backend: `tsc --noEmit` 0; eslint on the changed files 0; `src/bills-catalogue` 53 tests (unit, HTTP over a socket to the Fintava double with the sandbox's 22 disco rows, the client's owner reading), plus `src/fintava`, `src/bill-payment` and `src/common/tests` green; 14 mutants of my own, 14 killed; gates 16 FAIL as on main (my three `PROVISIONAL` lines carry owner and why), `check_baseline` clean; `contract:build` twice byte-identical. Mobile: 72 new tests (`src/features/bills/__tests__`: model, screens, routes, a real-router walk) and the three edited files; 18 mutants of my own, 18 killed; `npm run check` below. The mutant scripts are in the scratchpad (`bills01/mutants_be.py`, `mutants_mob.py`).
**Live seam (V9).** wawu-id's real login (:6141), the local Hub (:6142), a Fintava stand-in (:6143, the sandbox's disco list, a guessed preview body), the web export (:6144), at 390 px light and dark, signed in through the app's own sign-in screen: `bills01/live-seam.txt` (requests and answers) and `bills01/pairs/*.png` (artboard left, build right: S2, S3, S4, S10, S13, H1, W4, W5, W6) and `bills01/shots/` (every state: S2 loading, error and offline, S3 loading, S4 empty, below the minimum, above the maximum and check failed, S13 for no company available and for a refused key). The export was made with its own Metro cache and holds only `localhost:6141` and `localhost:6142`; zero outside requests, zero page errors.
**NOT RUN, and what unblocks each.** Everything against Fintava's real sandbox: this machine has no key and calls no provider (common rules); unblocked by the lead running the Hub with the sandbox key. Within that, the preview's real success body (G-641: a sandbox meter number, question 11). Repeat a recent bill (G-640: BILLS-04). A purchase's "service not currently available" reaching S13 (G-645: BILLS-04 and BILLS-02). V7, V8 and V10: this task moves no money and needs no phone check; the phone run waits for a deployed Hub (R-25).
**Filed.** BACKEND_GAPS G-640 to G-646; SHARED-CHANGES BILLS-01 #1 (TextField props), #2 (backend contract), #3 (mobile contract copied from the backend branch, which merges first).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The HOME-01 and WALLET-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
