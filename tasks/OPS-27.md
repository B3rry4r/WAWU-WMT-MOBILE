---
id: OPS-27
title: Admin screens: foreign currency and Capital (switches, every swap and send, one person's accounts, Capital orders)
owner: YOU
area: OPS
order: -2701
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: []
decisions: [R-83, R-84]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-27 · Admin screens: foreign currency and Capital

## Current state

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
