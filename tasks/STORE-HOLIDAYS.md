---
id: STORE-HOLIDAYS
title: Public holidays are skipped by a store earning's 3 working days (Hub)
owner: YOU
area: IAP
order: -1260
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [STORE-BUY-HUB]
decisions: [R-5, R-11, R-19, R-39, R-47, R-101]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# STORE-HOLIDAYS · Holidays in the payout days (Hub)

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T2) in the STORE-PAYOUT bundle: backend `wmt/STORE-PAYOUT`, mobile records `wmt/STORE-PAYOUT`. Status verifying.

| # | Before | After |
|---|---|---|
| 1 | `availableAt` skipped weekends only (`addWorkingDays` took a holiday set and every caller passed none) | the admin plan setting `store.holidays` (dates `YYYY-MM-DD`, Lagos, one per line; checked: real dates, 2020 to 2100, each once, sorted) is skipped as weekends are; `StoreEarningService.record` reads the live list, so a change shows with no restart |
| 2 | no list | the seed holds Nigeria's fixed public holidays for 2026 and 2027 (1 Jan, 1 May, 12 Jun, 1 Oct, 25 Dec, 26 Dec); Eid, Good Friday, Easter Monday, the Prophet's birthday and a Monday given for a weekend holiday are added by an admin |
| 3 | an earning already recorded | keeps its `availableAt` when the list changes later (a spec) |

Files: `src/store/payout/store-holidays.ts`, `src/store/store-buy-rules.ts` (`payableAt` takes an optional set), `src/store/store-earning.service.ts`, `src/store/store.module.ts` (imports `PlanSettingsModule`), `src/plan-settings/plan-setting-registry.ts`, `src/plan-settings/plan-settings.defaults.json`. No migration.

Default (lead), owner may override: a holiday that falls on a weekend is not moved to the Monday by code; the admin adds that Monday.

Proof (27 Oct 2026, builder): `tsc` EXIT 0; `eslint` on every file changed clean except two prettier lines in `src/wallet/wallet-funding.service.ts` that were already unformatted on `origin/main` (not touched); gates EXIT 0 and `check_baseline` EXIT 0; `contract:build` EXIT 0 (277 lines added, none removed); both migrations' rollbacks run clean and refuse with data; 32 suites, 434 tests green on a test database (the store folder, price list, plan settings, the two route inventories, the account and export maps, the Nuvion earning spec). The tests were written after the code; the payout spec was shown red by breaking the code three ways (no netting, no balance check, no cancel at the lease) and the double-pay spec red by putting the old funding sweep back. Not run: Google or Apple (no credentials; local stand-ins), the Fintava-double specs (GitHub runs them), `test:protected` (no protected route changed).

## Read first

`DECISIONS.md` R-101 point 4; STORE-BUY-HUB (`payableAt`); backend `src/plan-settings/`.

## Goal

The 3 working days of a store earning skip the public holidays the admin keeps.

## Scope

`wawu-backend`: the files above. Records only in the app repo.

## Capability checks

- [x] A holiday is skipped as a weekend is; a sale on a holiday counts from the next day; the Lagos date decides.
- [x] The default list is the 12 fixed dates; an admin addition moves the next earning and no earlier one.
- [x] A bad list (a date that is not real, a repeat, a year out of range) is refused.
