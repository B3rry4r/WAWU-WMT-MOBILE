---
id: WALLET-41
title: A person outside Nigeria opens a wallet without a BVN, in their own currency (R-87)
owner: YOU
area: WALLET
order: -141
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-87, R-83, R-84, R-85, R-6, R-10, R-39, R-47, R-29, R-20]
passes: [V1, V4, V5, V6, V8, V9]
artboards: []
tier: T2
---
# WALLET-41 · A wallet for a person outside Nigeria

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B29): backend `wmt/WALLET-41` `ff088fa` and mobile `wmt/WALLET-41`. Round 0 was `84c8ecc` on `wmt/WALLET-21-HUB`; round 1 (below) merged `origin/main` `53819c2`. Status verifying (round 1). A free negative order (-141): the task adds to R-87's list and changes nothing the web calls.

| # | Before (`wmt/WALLET-21-HUB`) | After |
|---|---|---|
| 1 | Open your wallet asked every person for a BVN and NIN; a foreign phone could not open | `POST /money/wallet/open` takes `countryCode` (not NG), `firstCurrency`, `nationality` and no BVN, NIN or check handle; the entity goes to Nuvion with that country's ID, no numbers; the same documents and hosted selfie follow |
| 2 | no choice of first account | `GET /money/world/options?country=XX` names the country's own currency (config table: US USD, GB GBP, euro countries EUR, CA CAD, AE AED, GH GHS, else USD), every currency that is on, the fee (0) and whether opening is available; `GET /money/world/countries` is the list to pick from |
| 3 | an approved person got a naira account | an approved person outside Nigeria gets their first account in the chosen currency (Nuvion's `entities.updated` handler, and `POST /money/world/first-account` as the backstop, which asks Nuvion for the entity's decision itself and lets them pick another currency when Nuvion declines one) |
| 4 | `GET /money/wallet` had no word for it | adds `world` (country, first currency, state); `state` is `open` once the first account is, `account` stays null; naira routes answer them `409 wallet_not_open`; every foreign-account route (read, open, swap, send) and the PIN, device and PIN-reset routes accept their wallet |
| 5 | no way to switch or watch it | switch `world.open.on` (default on), `WORLD_OPEN_FEE_<CODE>_MINOR` (0, R-10, quoted only), `WORLD_OPEN_DAILY_LIMIT`, `WORLD_BLOCKED_COUNTRIES`, `WORLD_FIRST_CURRENCY_MAP`; admin `GET /admin/money/world/openings` and `POST .../freeze`, `/unfreeze`, `/cancel` (superadmin and finance, one audit row each) |
| 6 | the app: BVN first for everyone | a number from outside Nigeria is asked where it lives first (A31's new first step); the details step takes a state or province typed; the ID screen offers passport, national ID, driver's licence; the open call carries the country and no BVN; the checking step opens the first account; "Your wallet is open" and the Wallet tab list the person's foreign accounts and add a currency |

One document is one wallet: a world opening claims the keyed hash of its ID document (the document's country, then the number; not the type, not where the account lives) in place of a BVN, held and let go exactly as a BVN's is. A refused opening names the fields Nuvion pointed at (`reason.fields`), never a value, so the person is asked for what Nuvion asks, not for a list of ours.

Real Nuvion DEV (`docs/nuvion/DEV-RESULTS.md`, WALLET-41): US, GB, GH, DE, CA, AE and KE people opened with no BVN and no SSN and were approved in about 5 s; first accounts opened in all six currencies; details active for GBP, GHS, EUR, pending or none for USD and CAD, refused for AED (UAE) and for USD (Kenya). Gaps G-WALLET-41-1 to 8.

Checks (backend, own DB `b29world_test`): tsc EXIT 0; eslint on changed files EXIT 0; contract:build EXIT 0 (7 operations, 2 served money, 5 admin or opening); new specs `world-config` 38, `world-wallet.contract` 19, `world-opening.contract` 9; `money-contract`, `wallet-gate-coverage`, `money-moving-coverage`, `account-data-map`, `data-export-map`, `publishing-gate-coverage`, `hub-rate-limits`, `plan-settings`, `nuvion-opening.contract`, `nuvion-opening-review`, `fx-contract`, `fx-money.contract` pass; migration `20261129090000_world_wallet` (restamped in round 1, and again by backend batch E) applied clean, rollback refuses with a row. Mobile: tsc EXIT 0; eslint on changed files 0 errors; 14 new tests in `worldOpening.test.tsx`; the open-wallet, wallet, home and delete-account folders 838 of 838; gates 0 fail. Driven on a local stack (Hub on the Nuvion stand-in, the web export of the app): a person in the UK signed up, opened with no BVN, uploaded the two documents, was approved, got a GBP account with active details, and the wallet read `world.state` `open`; the naira balance route answered `wallet_not_open`.

- **Verifier round 2 (24 Oct 2026): PASS** (status review): the round 1 high and four mediums are closed, see Verifier report, round 2; three new lows go to the sweep.
- **Verifier round 1 (24 Oct 2026): FIX.** Findings 1 to 13 are in the Verifier report below. The builder's round 1 answers them in the section after the Builder report; a second verifier checks again.
- **Next (after the fix round):** a verifier checks the Hub side and the screens; the lead sets a first-account fee and the country list when GEO-02 lands (G-WALLET-41-4, -5); Nuvion switches on AED and Kenya (G-WALLET-41-2); sends abroad from a foreign account (G-WALLET-41-3, when NUV-11 merges). NOT RUN: a phone, the hosted selfie through the app (Nuvion's session start was answered on dev for a UK entity, `scripts/nuvion/world-dev-check.ts`), a first real webhook (the stack's stand-in sends one).
- **History:** reports go to tasks/history/WALLET-41.md.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md`: R-87, R-83, R-84, R-85, R-6
- Backend `src/money/world/`, `src/money/opening/reviewed-opening.ts`, `src/nuvion/handlers/opening.handler.ts`; app `src/features/open-wallet/CountryStep.tsx`, `WorldFirstAccount.tsx`, `src/features/wallet/world/`

## Goal

A person whose country of residence is not Nigeria opens a wallet without a BVN: Nuvion checks them with their own country's ID and a liveness check, and their first account is in their country's currency or the one they choose. A person in Nigeria keeps the BVN naira wallet unchanged.

## Scope

Backend: `src/money/world/**`, additive changes in `src/money/opening/**`, `src/money/gate/wallet-gate.ts`, `src/money/fx/` (gate and a frozen check), `src/nuvion/areas/opening.ts`, `src/nuvion/handlers/opening.handler.ts`, `src/wallet-provider/`, the plan-settings registry, an additive migration, `scripts/dev/nuvion-standin.cjs` (foreign accounts). App: `src/features/open-wallet/` (new `CountryStep`, `WorldFirstAccount`, `api/world.ts`; world branches in A31, A5, A26, A28, A8), `src/features/wallet/world/`, the home model, and their tests. No board draws these (R-29): built from the form's own parts.

## Capability checks

- [x] A person with a number from outside Nigeria can choose the country they live in and the first account's currency (the country's own is already chosen; one that is off is not offered).
- [x] A person in a country Nuvion cannot serve is told so plainly and cannot continue; Nigeria goes on to the BVN as ever.
- [x] A person can open without a BVN: the details, the ID document and proof of address, then the review (the hosted selfie reused).
- [x] An approved person gets their first account without doing anything; if Nuvion declines the currency they see its words and pick another.
- [x] A person with an open world wallet can see each account's balance and receiving details and add a currency.
- [x] Support can list, freeze, unfreeze and cancel; each act writes one audit row.
- [ ] On a phone: NOT RUN (no device in this session).

## Builder report

Files and checks as in Current state. Defaults (lead), owner may override: the first-currency choices are the six fiat currencies (a coin needs a chain and is added afterwards, R-84); a fee for opening is quoted and not collected (nothing to debit at opening); the country step appears only for a number that is not +234 (G-WALLET-41-5); a cancel keeps no claim on the ID document; a freeze stops outflow and new accounts, money can still arrive.

## Builder report, round 1

Sonnet builder (T2, 24 Oct 2026), answering the verifier's FIX and the lead's rulings. Backend `wmt/WALLET-41` `ff088fa` (with `origin/main` `53819c2` merged, batch FX-A), mobile `wmt/WALLET-41`. Specs were written before the code for the key, the residence rule and the foreign swap and send. Status verifying.

| # | Finding or ruling | Fixed, and the proof |
|---|---|---|
| 1 | HIGH: deletion with foreign money | FX-A's `DELETION_BLOCKERS` (merged) count every foreign account. Live on the final build: a Ghana person holding USD 2,500.00 got `409 account_deletion_blocked`, blockers `fx_balance`, and the wallet stayed open. The false R-17 comment and the gap text are gone (G-WALLET-41-6 says what is left) |
| 2 | `forks` | one `Cursor`, exported from `fx-admin.service.ts` and imported by `world-admin.service.ts`; backend gates 0 fail, nothing baselined |
| 3 | one wallet per document | the claim is `world:<document country>:<number, letters and digits only, upper case>`, whatever the type (re-check: the country is the document's, see the paragraph after the table). Specs: a changed type, nationality, case or dashes still collides. Live: the same number sent as a national ID by another account is `409 identity_has_wallet` |
| 4 | residence decides | the Hub reads the account's `countryCode` claim; a world opening needs one that is not NG and the request must name it (`residence_not_set`, `residence_mismatch`, plain sentences); NG residents get the BVN path only; a +234 number abroad opens. Live: GB resident asking GB 200, asking US 409; NG resident asking GB 409; no country stored 409; a +234 number resident in GB 200. The app reads the same claim (Nigeria is not asked another country; another country is shown with no list) |
| 5 | `reason.fields` | the proof-of-address step marks exactly the fields it has with the Hub's sentence ("Check this and try again.") and lists the rest in plain words (`hubFields.ts`, 20 tests in `worldOpening.test.tsx`) |
| 6 | G-WALLET-41-3 | every `/money/fx/*` route and the PIN, device and PIN-reset routes take an open wallet of any kind; a naira side is `409 fx_account_not_open` ("You have no naira account. Swap between your other accounts."). `world.open.on` stays on. `world-fx.contract.spec`: USD to EUR swap, a USDC send, a frozen account refused, a pending swap swept. Live: PIN set, USD account opened beside GBP, the swap route answers `404 not_found` for a missing quote (the gate lets it through). NOT RUN live: a real swap (the dev stand-in has no FX quotes) |
| 7 | lows | the 4 eslint errors fixed (plus one in a spec the verifier did not list), eslint 0 on 67 changed backend files; the duplicate-ID refusal says "ID or phone number"; six parallel freezes write one audit row (the person's opening row is locked); the first-account backstop asks Nuvion through the seam (`readReview`) and records an approval as a delivery would |
| 8 | merge | `origin/main` merged with `--no-ff`; kept both sets of error codes; the Fx and export rows are FX-A's; CONVENTIONS section 31 (Capital is 28, the card 29, send abroad 30); the migration is `20261129090000_world_wallet`, later than every migration on every branch; the mock WAWU ID adds a `countryCode` claim only when sign-up names one (the protected-route lock holds, 253 of 253) |

Re-check ruling (24 Oct 2026, carried out in backend `1dc2dcf`): the claim in row 3 followed the account's residence, so a second account that said it lived elsewhere got a second wallet with the same passport. The key is now `world:<document country>:<number>`. The opening form collects no separate issuing country, so the document country is the `nationality` field (a passport's nationality; for a licence or national ID the same field) and the residence only when no `nationality` is sent. The app sent no `nationality`, so for an app request the key still fell back to residence; round 3 below closes that. Spec: the same passport from two accounts with different residences gives `409 identity_has_wallet` on the second, nothing is sent. Lows: a naira route answers a world person "You have no naira account. Use your other currency accounts."; cancelling an open world wallet is `409 wallet_already_open` (was `423 account_frozen`). No contract change, no migration change.

Round 3 (24 Oct 2026, lead ruling, owner may override; backend `wmt/WALLET-41` and mobile `wmt/WALLET-41`, `origin/main` merged into both): the passport loophole is closed now, because no world wallet is live and nobody is broken. Hub: a world opening with a passport and no `nationality` is `400 passport_country_required` ("Tell us which country issued your passport.", `reason.fields` `["nationality"]`), refused before anything is claimed, sent or counted; a licence or national ID keeps the fallback to the country of residence. App: on the ID step, when the document is a passport, "Country that issued your passport" opens the profile's CountryPicker (GEO-03), starts as the country they live in, and goes to the Hub as `nationality` (a licence or national ID sends none). Built as the lead ruled; the designer draws it (G-WALLET-41-10). Specs: the Hub refusal for a passport with no nationality (and a null one: no row, nothing sent), a licence still opens, the passport bodies of the opening specs name the country; the app shows the field for a passport only, opens the list, holds the pick, and the pick (and the prefilled country) is in the body of `POST /money/wallet/open`. The same merge moved CONVENTIONS to section 30 for the world wallet (main took 29 for the card), and the migration stamp is unchanged for the batch to restamp. Backend batch E then made it CONVENTIONS section 31 (send abroad took 30) and restamped the migration `20261129090000_world_wallet`.

Checks (EXIT 0): backend tsc; eslint 67 files; gates and check_baseline; contract:build; 18 suites 837 tests (account-data-map, data-export-map, money-contract, wallet-gate-coverage, money-moving-coverage and the rest, five world suites); test:protected 253 of 253. Mobile: tsc; eslint on the changed files; open-wallet, wallet, home and delete-account 56 suites 844 tests; gates; check_tasks. NOT RUN: a phone; a picture of the changed country step (about 2 GB free, no 390 px export); a live swap.

## Verifier report

Verifier (Sonnet, T2, 24 Oct 2026; built none of it). Backend `wmt/WALLET-41` `84c8ecc` on its base `d39a868` (the base branch has since moved to `51a8aa8`); mobile `d3c1a1c0` on `14da2683`. **Verdict: FIX.** One high, four medium, the rest low. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-41-v/` (`logs/*.log` end in an EXIT line; `a-stack.out`, `c-admin.out`, `e-live.out` are the live runs).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 gates and checks | failed | backend gates EXIT 1: `forks` 1 fail (finding 2); mobile gates 0 fail (10 gates, 1307 files); backend eslint EXIT 1 (finding 7) |
| V4 seam | partial | Hub to Nuvion DEV: entities made for a UK and a Ghana person, no BVN, uploads accepted. Decision and first account NOT RUN on DEV (finding 12); proven on the stand-in stack |
| V5 picture | NOT RUN | no 390 px export of my own (2.7 GB free, under the 4 GB rule); the builder's `wallet-41-b/pics` (country step, details, Wallet tab) read and match the built parts; no screen found wrong |
| V6 states | partial | switch off, blocked country, daily cap, frozen, cancelled and refused duplicate all answer in plain words on the Hub; the app never shows `reason.fields` (finding 5) |
| V8 money | partial | nothing is debited at opening; frozen blocks a new account; a deletion with a foreign balance is NOT blocked (finding 1) |
| V9 live seam | passed on the stack, partial on DEV | real login on the mock ID, UK opened and got GBP, Ghana picked USD and got USD, the naira balance answered `wallet_not_open` |

Checks (EXIT lines): backend tsc 0; eslint on 34 changed files 1 (4 errors); migrate deploy 0 (rollback.sql read, not run: its guard covers all seven columns and the audit table); world specs 3 suites 65 tests 0 (the report says 66); account-data-map, data-export-map, money-contract, wallet-gate-coverage, money-moving-coverage, publishing-gate-coverage, hub-rate-limits 7 suites 115 tests 0; contract:build 0 and `contract/` unchanged; check_baseline 0; test:protected 236 of 244 with 8 failed, the same 8 on the base `d39a868` (verification ticks and professionals, not this task's). Mobile: tsc 0; jest open-wallet and wallet 49 suites 731 tests 0; gates 0; check_baseline 0; check_tasks 1 only for a stale `docs/PROGRESS.md`, rewritten by this commit.

Live results (the stack with the stand-in, and a second Hub on Nuvion DEV with `WORLD_OPEN_DAILY_LIMIT=3`, `WORLD_BLOCKED_COUNTRIES=RU`): options GB GBP, GH GHS, DE EUR, KE USD, NG unavailable; the UK person opened with their licence and got GBP; the Ghana person picked USD and got USD (no pick: GHS); the Nigerian BVN path is unchanged (a body with no BVN is refused: `bvn must be 11 digits`); the same licence is refused with `identity_has_wallet` (also in lower case and with dashes); switch off gives `world_switched_off` and the options say `switched_off`; the 4th opening of the day gets `world_limit_reached` 429; Russia gets `country_not_supported` 422; `/admin/money/world/*` answers 200 for superadmin and finance, 403 for support and reviewer with no audit row, 401 without a token; freeze, unfreeze and cancel each wrote one audit row, a repeat wrote none, a blank reason is 400, a cancel of an open wallet is refused.

### Findings

1. **high, defect: a world person can delete the account while holding money (G-WALLET-41-6).** Live: the Ghana person funded with USD 2,500.00 on the stand-in, `DELETE /account` answered 200 `deletionScheduledAt` in 30 days, no `account_deletion_blocked`, and the account stayed `open` (not frozen). `AccountDeletionMoneyService` reads the naira wallet only; a world person has none. After the 30 days the purge removes the `FxAccount` pointers (OWNED) and the money stays at Nuvion with nothing at WAWU that says whose it is. The comment on the new `FxAccount` rows in `account-data-map.ts` ("deletion needs them empty first, R-17") and the gap row ("the Hub's own check stands") are both false. Fix: the deletion check counts every foreign account's balance as `wallet_balance`, and the request freezes the foreign accounts as it does the naira one; one spec with a funded foreign account.
2. **medium, defect: the backend `forks` gate fails.** `interface Cursor` is declared in `src/money/fx/fx-admin.service.ts:22` and again in `src/money/world/world-admin.service.ts:18`. The builder's record has app gates only. Fix: import the one, or rename the new one; do not baseline.
3. **medium, defect: one wallet per document is easy to get round.** The claim is `world:<country>:<type>:<number>` and the person types the country, the type and (for a passport) the nationality. Live: a second person sent the first one's licence number as `national_id` and opened (200). Fix: key on the issuing country and the normalised number only (or the number alone), and add a spec that a changed type or nationality still collides.
4. **medium, unclear (the lead rules): a +234 number can open a world wallet with no BVN.** Live: a person with a +234 number sent `countryCode: GB` and the Hub started a world opening (200). The BVN step for people in Nigeria is only the app hiding the country step (G-WALLET-41-5); the server takes the person's word on residence. Until GEO-02's profile country is the authority, the lead should rule whether the Hub refuses a `countryCode` other than NG for a +234 number (R-6).
5. **medium, defect: the refusal copy promises a pointer nothing draws.** The Hub answers a Nuvion refusal with `reason.fields` and the sentence "Check the details we point to and try again" (`WORLD_FIELDS_MESSAGE`); no app code reads `reason.fields` (grep), so nothing points. With G-WALLET-41-1 (Nuvion asks a US person for an SSN, and the app has no field) the person is told to check something unnamed and cannot send it. Fix: the app lists the fields named (plain words per field) on the details step, or the Hub's sentence stops promising a pointer until it does.
6. **gap weighed, G-WALLET-41-3 (swap and send need a naira wallet): not a blocker of R-87's words (open, first account in own currency, add others), but a trap together with finding 1.** The Wallet tab shows receiving details, so people can deposit, and nothing can move that money out or spend it on WAWU (earnings, paid DMs and tickets are naira). `world.open.on` defaults to on. The lead should either ship the follow-up that lets foreign accounts swap and send with this, or set the switch default to 0 until it does. G-WALLET-41-1 is real for production (dev never asks for an SSN) and belongs with finding 5.
7. **low:** eslint on changed files is not clean: 4 `no-unnecessary-type-assertion` errors at `scripts/nuvion/world-dev-check.ts:249`, `world-config.spec.ts:136`, `world-opening.contract.spec.ts:159`, `world-wallet.contract.spec.ts:29` (the report says EXIT 0).
8. **low:** the duplicate-document refusal reuses the BVN sentence ("We can't use this BVN or phone number for a new wallet") for a person who has no BVN.
9. **low:** six parallel freezes wrote four audit rows (one expected): `act()` reads then writes without a lock.
10. **low:** world specs total 65, the report says 66 (38 + 19 + 9).
11. **low:** a world person on a naira route is told "You don't have a wallet yet"; cancelling an open wallet answers `account_frozen` 423.
12. **low:** `POST /money/world/first-account` is called a backstop "for a delivery that never came", but it reads only the Hub's own entity status, so it cannot recover a lost `entities.updated`; on DEV (no webhook reaches a local Hub) both people stayed `opening` for 5 minutes.
13. **low (styling):** on the Wallet tab card the currency code sits against the card's top edge (`05-wallet-world-*.png`).

Inventories: the new `account-data-map` and `data-export-sections` rows are right in substance (Fx tables OWNED and excluded from export as pointers, `WorldAdminAudit` AUDIT) and their specs pass, except the false R-17 comment in finding 1. They are WALLET-21's rows, not this task's, and duplicate BATCH-FX-A's.

Merge: mobile merges clean onto `origin/main` (`DECISIONS.md` R-85 to R-87 text is identical on both). Backend onto `origin/main` is clean; onto `wmt/WALLET-21-HUB` `51a8aa8` only `docs/contract/CONVENTIONS.md` conflicts. Against `wmt/BATCH-FX-A` `d191e3d` these conflict: `src/account-purge/account-data-map.ts` (the same Fx rows, `FxAdminAudit` and `wawuFeeMinor` rows: keep FX-A's, keep `WorldAdminAudit`), `src/money/dto/money-enums.ts` and `src/money/money-contract.ts` (both append error codes at the end: keep both sets), `docs/contract/CONVENTIONS.md` (two new sections: renumber), `contract/openapi.json` (regenerate with `npm run contract:build`). FX-A has no Fx rows in `data-export-sections.ts`, so keep this branch's. Migration stamp `20261118090000` is later than every migration on the base and FX-A's `20261113100000`.

## Verifier report, round 2

Verifier (Sonnet, T2, 24 Oct 2026; built none of it, and a different pass from round 1's evidence). Backend `wmt/WALLET-41` `f815c68` (code `ff088fa`, `origin/main` merged); mobile `0e7b699e`. **Verdict: PASS** (status review). The high and the four mediums are closed with proof; no new medium. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet-41-r/` (`logs/*.log` end in an EXIT line; `a-stack.out`, `c-g3.out`, `e-live.out` are the live runs).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 gates and checks | passed | backend gates 0 fail (9 gates, 1886 files), baseline 0, eslint 0, tsc 0; mobile gates 0 fail (1308 files), tsc 0, check_tasks 0 |
| V4 seam | passed | Nuvion DEV: a UK person opened, the first-account backstop read Nuvion's decision itself and opened GBP (details active); a Ghana person got GHS; EUR added; a real GBP to EUR quote answered 201 |
| V5 picture | NOT RUN | no export (2.0 GB free, under the 4 GB rule); round 1's pictures stand, and the screens that changed are covered by jest (20 of 20 in `worldOpening.test.tsx`) |
| V6 states | passed | residence_not_set, residence_mismatch, switch, frozen, deletion blocked: each a plain sentence; the app names the Hub's fields (jest) |
| V8 money | partial | a world person set a PIN; a frozen wallet refuses a quote; a deletion with USD 2,500.00 is refused; a swap EXECUTION was not driven live (see G-3 below) |
| V9 live seam | passed | real login on the mock ID, then the routes below |

Checks (EXIT lines): backend tsc 0; eslint on 42 changed files 0; migrate deploy 0; world specs 4 suites 83 tests 0; account-data-map, data-export-map, money-contract, wallet-gate-coverage, money-moving-coverage, publishing-gate-coverage, hub-rate-limits and the FX deletion spec 8 suites 151 tests 0; contract:build 0 and `contract/` unchanged; gates 0; baseline 0; test:protected all 244 passed (round 1's 8 failures are gone with `origin/main`). Mobile: tsc 0; jest open-wallet and wallet 49 suites 736 of 737 once under heavy load, and the one that failed (`worldOpening.test.tsx`, first test, a field not found in time) passed 20 of 20 alone; gates 0; check_tasks 0.

Round 1 findings, each re-checked:
1. **closed (was high): deletion with foreign money.** Live: the Ghana person holding USD 2,500.00 got `409 account_deletion_blocked`, blockers `fx_balance`, accounts left `open`; the empty-GBP person's request was accepted (200, 30 days).
2. **closed: one Cursor.** `world-admin.service.ts` imports it from `fx-admin.service.ts`; the forks gate has 0 fail.
3. **closed: one wallet per document.** Key `world:<residence>:<normalised number>`. Live: the same licence number as `national_id`, as a passport with nationality IE, in lower case and with dashes, each refused `identity_has_wallet` (the sentence now says "ID", not "BVN").
4. **closed: residence decides.** GB-resident naming US: 409 `residence_mismatch`. A +234 number with residence NG naming GB: 409 `residence_mismatch`. No residence on the account (+44) naming GB: 409 `residence_not_set`. A +234 number with residence GB (a Nigerian abroad) opens GB. The NG-resident BVN path is unchanged (with or without `countryCode: NG`). A US resident opens US.
5. **closed: the fields.** The Hub's `reason.fields` is kept on the error and marked on A27 with the Hub's sentence, the rest listed in plain words (jest: 3 tests). A refusal with fields was not seen on DEV (dev never refused a world opening); the Hub side is the opening spec.
6. **G-3 closed in the code, execution proven by spec only.** Live on the stack as a world person: PIN set 201, verify 200, PIN reset start 201, device read 200, device challenge refused plainly (`device_approval_refused`); NGN to USD refused `fx_account_not_open` ("You have no naira account"); a send needs the device approval (403 `device_approval_refused`); a frozen wallet refuses a quote (423 `account_frozen`). Sweep of every non-admin `/money`, `/bills`, `/cards` and `/capital` route (90) and 30 more payment-like routes with empty bodies: no 5xx except the bills catalog (502 and 503, the stack has no bills provider and a Nigerian person gets the same), no money-moving 2xx, only `wallet_not_open`, `documents_closed`, `account_frozen`, `device_approval_refused` as refusals; the person has 0 naira ledger rows and 0 `FintavaWallet` rows. NOT RUN live: a funded swap and a send (the stand-in has no FX quote endpoint, `provider_declined`, and a DEV account cannot be funded from a script); the 9 cases in `world-fx.contract.spec.ts` (swap with no naira, naira side refused, send, frozen, pending swap, routes and PIN gates) pass in my run.
7. **closed: eslint** (0 on 42 files). 8. **closed: sentence** (see 3). 9. **closed: six parallel freezes wrote 1 audit row, one `changed: true`.** 10. n/a. 12. **closed: the backstop** reads Nuvion's review itself; on DEV both people opened with no webhook. 11 and 13 **still open, low**: a world person on a naira route is told "You don't have a wallet yet"; cancelling an open wallet answers `account_frozen`; the currency code sits against the card edge on the Wallet tab.

New findings (all low, to the sweep): (a) `worldOpening.test.tsx`'s first test timed out once under heavy CPU and passed alone; (b) the key carries residence, which each account declares at sign-up, so a second account declaring another country with the same number opens (live: a US-resident account with the licence number a GB-resident account used: 200) by the key's own definition; (c) the stand-in cannot quote a swap (no `fx/quotes` route), so a swap cannot be driven on the stack (G-WALLET-41-7).

Not a finding, logged for the lead (G-WALLET-41-6): the deletion sentence says "Swap it to naira and withdraw it" to a person who has no naira account.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
