---
id: OPS-27
title: Admin screens: foreign currency and Capital (switches, every swap and send, one person's accounts, Capital orders)
owner: YOU
area: OPS
order: -2701
priority: launch
repo: wawu-dashboard
type: admin-screen
status: building
depends_on: []
decisions: [R-83, R-84]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-27 · Admin screens: foreign currency and Capital

## Current state

**Verifier (24 Oct 2026): FIX.** Backend `f702669` is red on GitHub (`fx-contract.spec.ts`, finding 1); the dashboard `19f0fcc` checks are green. Status back to building; findings in the Verifier report below.

**Fix round 1 (24 Oct 2026, same builder).** Heads: backend `wmt/OPS-27` `627a942` (origin/main `4e21f52` merged --no-ff; `contract/openapi.json` rebuilt, `contract:build` no diff); dashboard `wmt/OPS-27` `1293c85`, contract regenerated at `627a942`. Finding 1 fixed: `fx-contract.spec.ts` lists `GET /admin/money/fx/currencies` and names `OPS-27` as its built-by for that one route (no other assertion changed), and `AdminFxCurrencyView` carries a `currency` field beside its Minor figures; the spec was red first (2 of 4 failed), then green (4 of 4, with `admin-money-settings-reads.spec.ts` 9, 13 in all). Finding 7 fixed: the switch dialog drops the Hub label's "1 is on, 0 is off" clause and keeps the rest of its words. Finding 8 (no HTTP test of the reads) stays a note. Finding 2 (community spec): not touched; the branch now holds main `4e21f52`, CI re-runs it. Checks: backend tsc, eslint on changed files, route inventories (42), gates, `check_baseline` EXIT 0; dashboard `check`, `test`, `build`, gates EXIT 0. GitHub Branch checks on `627a942`, run 40124772263: green (all six jobs, shard 1 with the community spec included); Gates and Protected routes green.

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B30). Dashboard `wmt/OPS-27` `19f0fcc` on `origin/main` `ee23d21`; backend `wmt/OPS-27` `f702669` on `origin/main` `0811874` (three read-only admin routes, below); mobile records `wmt/OPS-27`. Status verifying. Owner, 24 Oct: "it needs to be properly controlled". The Hub routes are those of `fx-admin.controller.ts` (WALLET-21) and `admin-capital.controller.ts` (NUV-12), read on `origin/main`.

| # | Before | After |
|---|---|---|
| 1 | no screen for foreign accounts, swaps or sends; the nine currency switches and three product switches were only raw 0 and 1 boxes in Settings | `/finance/foreign`: each currency with its places, swap fee, send fee, daily limit and switch; the three product switches; each saves through the admin settings (`PATCH admin/plan-settings`) after a confirm that shows the Hub's own refusal |
| 2 | a swap or send could not be seen by an admin | the list (kind, status, one person; cursor page), each amount in its own currency symbol and the places the Hub counts for it (a coin as the Hub counts it), the provider and WAWU fee, the fee leg, the failure words; a row opens `operations/:id` |
| 3 | one account could not be frozen | one person's accounts with the provider's balance read now; Freeze and Let go ask for a reason (3 to 200, as the route requires); the Hub's refusal is shown as written |
| 4 | no screen for Capital | `/finance/capital`: the switch, the limits and WAWU's fee, and every order with Hold, Let go and Cancel (a reservation only); an optional note; a stale click shows the Hub's own "That order is not on hold." |
| 5 | the dashboard had no read of fees, limits or coin places | backend: `GET admin/money/fx/currencies`, `GET admin/capital/orders/settings` (read only; superadmin and finance); the dashboard's fourth generator `scripts/generate-money-contract.mjs` writes `money.generated.ts` |

Proof (local stack on the Nuvion stand-in, an admin signed in, 1440 px, each picture looked at): `scratchpad/dash-b30/foreign-*.png`, `capital-*.png`. Freeze, Let go, a switch off and on, a Hold, a cancel and a refusal all ran against the real Hub. Dashboard `npm run check`, `npm test`, `npm run build` and `python3 scripts/gates/run.py` EXIT 0; backend `admin-money-settings-reads.spec.ts` 9 passed, the two route inventories 42 passed, backend gates EXIT 0, `contract:build` EXIT 0.

Default (lead), owner may override: (a) the money screens sit in the Money strip beside Revenue and Oversight, superadmin and finance only (the routes' own roles). (b) Fees and daily limits are the Hub's configuration, shown and not edited: G-OPS-27-1. (c) The generated contract is read at backend `f702669` (the branch); regenerate at the merged head: `HUB_API_REF=<head> npm run gen:contract gen:ops-contract gen:oversight-contract gen:money-contract` (the refs are baked into the files).

Open low: the foreign list shows no person's name (the Hub names accounts by WAWU id); the provider balance shows "could not be asked" for a person with no wallet on the running provider.

## Read first

- `DECISIONS.md` R-83, R-84, R-85; `docs/WORKFLOW.md`
- Backend `src/money/fx/fx-admin.controller.ts`, `src/capital/admin-capital.controller.ts`, `docs/contract/CONVENTIONS.md` sections 27 and 28
- Dashboard `src/components/money/`, `src/lib/api/admin-fx.ts`, `admin-capital.ts`

## Goal

An admin can see and control every foreign currency, coin and Capital order the Hub serves: switch them, read every swap and send, freeze one account, hold or cancel a Capital order, each with a reason where the Hub takes one.

## Scope

`wawu-dashboard`: `src/components/money/*` (ReasonDialog, SettingSwitch, FxCurrencySwitches, FxOperations, FxAccounts, ForeignCurrency, CapitalOrders), `src/lib/api/admin-fx.ts`, `admin-capital.ts`, `src/lib/format.ts` (`formatMinor`), the Money strip and the sidebar, the money generator. `wawu-backend`: two read routes only.

## Capability checks

- [x] An admin can switch a currency or a product off and on, and the Hub's own refusal shows if it says no.
- [x] An admin can read every swap and send, narrow it to one person, and open one.
- [x] An admin can freeze and let go of one foreign account with a reason; a reason under 3 characters is not sent.
- [x] An admin can hold, let go of and cancel a Capital order; the Hub's refusal is shown.
- [ ] A balance read from a real provider account: NOT RUN (the stand-in has no funded account for the seeded person).

## Verifier report

Verifier: a Sonnet agent that built none of it, 24 Oct 2026. Verdict **FIX** for the bundle (OPS-27, OPS-28, OPS-29). Heads: backend `wmt/OPS-27` `f702669` (merge-base `0811874`), dashboard `wmt/OPS-27` `19f0fcc` (merge-base `ee23d21`), mobile `8435c62e`. Findings 1, 2, 7 and 8 sit on this task; the rest are shared.

| Check | Result | Evidence |
|---|---|---|
| Backend tsc, eslint (changed files, no --fix) | passed, EXIT 0 and 0 | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/logs/be-tsc.log`, `be-eslint.log` |
| `admin-money-settings-reads.spec.ts` + `publishing-gate-coverage.spec.ts` + `hub-rate-limits.contract.spec.ts` | passed, 3 suites, 51 tests, EXIT 0 | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/logs/be-spec.log` |
| `test:protected` (own DB, `db:seed` first) | passed, 2 suites, 253 tests, EXIT 0 | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/logs/be-protected.log` |
| `contract:build` | EXIT 0, no diff in the worktree | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/logs/be-contract-build.log` |
| Backend gates / `check_baseline` | EXIT 0 (0 fail, 136 warn, 88 accepted) / EXIT 0 (124 entries) | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/logs/be-gates.log`, `be-baseline.log` |
| `fx-contract.spec.ts` (reads `contract/openapi.json` only; no Fintava) | FAILED, 2 of 4 | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/logs/be-fx-contract.log` |
| Dashboard `npm run check` (with `WAWU_WEB_PATH`, `HUB_API_PATH`, `HUB_API_REF=f702669`), `npm test`, `check:money-contract`, `npm run build`, gates | all passed, EXIT 0 (gates: 211 files, 0 fail, 0 warn, 6 accepted) | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/logs/dash-check.log`, `dash-test.log`, `dash-money-contract.log`, `dash-build.log`, `dash-gates.log` |
| GitHub Branch checks on `f702669` (run 40120649986) | RED: shard 1 of 3 failed (2 suites, 3 tests); Protected routes (698) and Gates (926) green | https://github.com/B3rry4r/WAWU-Backend/actions/runs/40120649986 |

### Findings, ranked

1. **high, defect (CI red, `fx-contract.spec.ts` fails 2 of 4).** Backend `src/money/fx/tests/fx-contract.spec.ts:32` pins the Fx route list and `:55-57` pins `x-wawu-built-by` to `WALLET-21` for every `/money/fx` route; the new `GET /admin/money/fx/currencies` (`src/money/fx/fx-admin.controller.ts:51-52`, `@BuiltBy('OPS-27')`) is not in the list and is not built by WALLET-21. `:112-114` requires every `Fx...` schema holding a `...Minor` field to hold a `...currency` field; `AdminFxCurrencyView` (`src/money/fx/fx-view.type.ts:298`: `swapFeeMinor`, `sendFeeMinor`, `dailyLimitMinor`) names its currency `code`. Repro: `npm run contract:build`, then `npx jest --runInBand src/money/fx/tests/fx-contract.spec.ts` gives 2 failed (also CI run 40120649986, job "suite (shard 1 of 3)"). The builder ran only 3 specs and not this one. Fix by the sweep rule (a named defect is the ruling): add the route to the list, let the built-by check accept OPS-27 for it, and either add a `currency` field to the view or make the Minor rule read `code`; update those assertions and say so.
2. **unclear, not attributable to this branch.** The same shard also failed `src/community/pass/tests/community-pass-removal-refund.contract.spec.ts:546` (`refundNotes(member)` length 0, expected 1). The branch touches nothing in community or notices. The spec names Fintava, so it was not run here (rule). Re-run shard 1 after finding 1 is fixed; if it fails again on the same line, send it to its own owner.
3. **low, defect.** Dashboard `src/components/money/WawuCards.tsx:280` offers "Block for good" on a card in state `used` (and `creating`, `unknown`). On `used` the Hub's route answers 200 and changes nothing (the card stays `used`, no `cancelledAt`), yet the dashboard says "Done. The card is updated and the act is on record." and the Hub writes a `wallet_card_cancelled` audit row (`stateBefore` and `stateAfter` both `used`). Repro: seed a card with state `used`, click Block, confirm. Hide Block on `used` (the list filter also lacks `used`, which is the Hub's `ADMIN_CARD_STATES`).
4. **low, defect (copy).** `WawuCards.tsx:70` "A card support held works again." is shown for every frozen card; the Hub also lifts a card the person froze (`frozenBy: person`). Say "A held card works again."
5. **low, defect (copy).** `src/components/places/PlacesScreen.tsx:146` and `:143` write "1 creators" when the count is 1; use a plural helper.
6. **low.** Eleven compiled `scripts/gates/__pycache__/*.cpython-311.pyc` files were committed (main already tracks the `cpython-312` ones); running the gates modifies them. Add `__pycache__/` to `.gitignore` and remove them from the index.
7. **low (copy).** `src/components/money/SettingSwitch.tsx:87` shows the setting's own label in the dialog, so it reads "1 is on, 0 is off" to an admin.
8. **test-gap notes.** `admin-money-settings-reads.spec.ts` checks the roles through decorator metadata only; nothing over HTTP checks 401/403/200 on the three new reads (this verifier did, below). A user token is 401 on every admin route (AdminAuthGuard), the new reads included, not 403 as the brief wrote; same as `admin/plan-settings`.

### What was run live (local stack `vops27`, Nuvion stand-in, an admin signed in through the real login, dashboard production build on 8791)

- The three reads: superadmin and finance 200, reviewer and support 403, no token 401, user token and a garbage token 401. No key, secret or provider id in any body. Row counts of every table before and after six calls: no difference (the one moving counter was `CommunityNoticeCursor`, which a background tick also moves with no call); the stand-in's log gained no line. The code reads config and plan settings only.
- Switches: AED off in the dashboard sent `PATCH /admin/plan-settings {"settings":{"fx.currency.AED.on":0}}`, the user's `POST /money/fx/accounts {currency:AED}` answered 409 `fx_switched_off` "Opening AED accounts is switched off for now.", and on again restored it. The same for `cards.enabled` (user `GET /money/cards/quote` `enabled` false then true), `capital.enabled` (user `GET /capital/availability` `available` false then true) and a product switch. Each leaves a `plan_setting_set` audit row.
- Foreign freeze and let go: `POST admin/money/fx/accounts/:id/freeze` and `/unfreeze` with `{"reason": "<trimmed>"}`; the button stays off under 3 trimmed characters, the box stops at 200; the rows and one `FxAdminAudit` row followed. Capital hold with a note, let go, cancel, and the stale clicks showed the Hub's "That order is not on hold." and "Only a reservation can be cancelled. Hold an invested order instead." in the dialog. Card hold, let go and block send `POST admin/money/cards/:id/{freeze,unfreeze,cancel}` with no body; the stand-in serves no card, so the Hub's own refusal ("We could not do that with your card right now...") was shown; a real card made through Nuvion: NOT RUN.
- Amounts: `formatMinor` run on 13 cases (dollar, euro, pound, Canadian dollar, cedi, dirham and a coin at 0, 2, 6 and 8 places, a negative, a naira kobo): each its own symbol or code and places, no naira sign on a dollar amount. Credits appear nowhere on these screens.
- Country and region (40 seeded accounts: NG-LA 10, NG-FC 5, NG-OY 3, GH-AA 6, US-CA 4, US-NY 2, GB-ENG 4, 6 none): `/admin/geo/counts` equals the database (40 total, 13 creators, 6 unknown with 1 creator); `admin/creators` returned 40, 18 (NG), 10 (NG-LA), 5, 6, 2, and the content queue 6, 3, 2, 1, 1, 1, 0 for the matching filters; a person with no country matches none; `ZZ`, `NG-ZZ`, `NG` with `GH-AA`, a quote-and-dash string and a 300-character code are 400 with the Hub's words, never 500; a blank code is no filter. In the dashboard a country with no regions (Aland) shows no region box.
- Roles in the dashboard: finance sees and can switch every screen; support and reviewer see the Hub-role refusal on the three money pages with no Hub call; reviewer sees the refusal on Places; support reads Places. The 500 and aborted-call states show the Hub's text and a retry. Pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ops-27-v/work/shots/` (foreign-top, foreign-person, foreign-frozen, foreign-detail, cards-top, cards-block-dialog, capital-top, capital-stale-letgo, capital-stale-cancel, places-top, creators-lagos, content-lagos, err-finance-*) against the builder's `dash-b30/` pictures: same layout and copy.
