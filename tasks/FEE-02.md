---
id: FEE-02
title: Dashboard: fee settings with history, and Nuvion's rates in a locked area
owner: YOU
area: MONEY
order: 395
priority: after-launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: [FEE-01]
decisions: [R-139]
passes: [V1, V3, V5, V6, V7, V9]
artboards: []
tier: T1
---
# FEE-02 · Dashboard: fee settings with history, and Nuvion's rates in a locked area

## Current state

As of 11 Nov 2026. Built by a Sonnet builder against the agreed FEE-01 shapes; not verified yet.
- **Status:** review, verified round 1: MERGE (lows only, in `tasks/history/FEE-02.md`, Verifier report round 1). Dashboard `wmt/FEE-02` head `8e5fcf8`. Merge only after Hub FEE-01 is on the Hub's main (the money contract check reads the fee controller). The three other contract checks fail the same on dashboard main.
- **Built:** `/finance/fees` (VAT switch and percentage on top, one row per fee kind with the fee in force, an Off mark, a row that opens the Hub's preview and the full history, an editor that adds a new row; read-only for support) and `/finance/provider-rates` (confidential banner, history, editor; superadmin and finance only, not linked for others). Two tabs on the finance strip and two sidebar entries.
- **Types:** generated, not hand-copied: the money generator now also reads `src/money/fees/engine/admin-fees.controller.ts` (`HUB_API_REF=origin/wmt/FEE-01 npm run gen:money-contract`). `contract/fees.ts` only aliases them. Run `check:money-contract` with that ref until FEE-01 merges.
- **Routes and roles as the Hub has them:** `GET admin/money/fees` and `/fees/preview` (superadmin, finance, support); `POST admin/money/fees` (superadmin, finance, 201); `GET` and `POST admin/money/provider-rates` (superadmin, finance, 201); `GET`/`PATCH admin/plan-settings` for `tax.vat_on` and `tax.vat_percent` (text).
- **Pictures:** `audits/FEE-02/` (20, 1440x900, light and dark), against a stand-in Hub in scratch.
- **Next:** a verifier.
- **Was:** todo. Cut by the lead from R-139 points 1, 9 and 10. Waits for FEE-01's admin routes.
- **What exists:** the dashboard's settings page (`src/app/(app)/settings/page.tsx`, `components/settings/SettingsScreen.tsx`, `SettingEditor.tsx`) edits plan settings by group; `components/money/SettingSwitch.tsx` toggles; `finance/revenue` (`components/appmoney/AppRevenue.tsx`). No fee page, no locked area.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-139; tasks/FEE-01.md and its admin routes
- wawu-dashboard: `AGENTS.md` (this Next.js differs from training data; read `node_modules/next/dist/docs/`), the settings and money components above

## Goal

An admin changes any fee (percentage, minimum, maximum, start date; the currency belongs to the kind) on one page and sees every past change; only superadmin and finance open the Nuvion rates area, which is never linked for other roles; the VAT switch and percentage sit with the fees.

## Scope

- A "Fees" page under Finance: one row per fee kind with the fee in force, an editor (percentage, minimum, maximum, start date, note; add money in naira is a pass through), a preview ("NGN 100,000 sent: fee NGN 400 ... they receive NGN 100,000") worked out by the Hub's own rule, and the full history with who changed it and when. Kinds switched off (swap, local dollar receiving) show as off.
- A locked "Provider rates" area: Nuvion's rates with history and an editor, visible only to superadmin and finance (route guard and hidden nav), marked confidential.
- VAT: the on switch and the percentage, with a plain note that it stays off until the tax adviser confirms.
- Pictures at desktop width, light and dark, of every state (fees list, editor, preview, history, locked area, a role without access).

## Capability checks

- [ ] An admin can change the naira withdrawal fee with a start date and see the change in its history.
- [ ] A support admin cannot open Nuvion's rates.
- [ ] An admin can switch VAT on and set its percentage.

## Builder report

See [tasks/history/FEE-02.md](history/FEE-02.md).

## Verifier report

## Owner sign-off
