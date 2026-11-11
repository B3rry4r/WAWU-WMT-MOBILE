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
- **Status:** review. Dashboard branch `wmt/FEE-02` (from `origin/main` `163f1f5`, head `c6ac4b5`), pushed, no PR. Not switched to the real FEE-01 contract: `wmt/FEE-01` was not on the Hub remote when this was built.
- **Built:** `/finance/fees` (VAT switch and percentage on top, one row per fee kind with the fee in force, an off mark, a row that opens the Hub's preview and the full history, an editor that adds a new row) and `/finance/provider-rates` (confidential banner, history, editor). Two tabs on the finance strip and two sidebar entries; Provider rates is not drawn for a role other than superadmin and finance (strip tab and sidebar), and the page refuses them without sending a request.
- **Routes as called:** `GET` and `POST admin/money/fees`, `GET admin/money/fees/preview?kind&currency&amountMinor`, `GET` and `POST admin/money/provider-rates`, and the existing `GET`/`PATCH admin/plan-settings` for `tax.vat_on` and `tax.vat_percent`. Types and routes are hand-copied in `src/lib/api/contract/fees.ts` (like `settings-policies-featured.ts`), to be deleted when a generator reads FEE-01.
- **Guesses to check against FEE-01:** the roles of the fees routes (set to superadmin and finance, same as provider rates); the preview returns the fee in force only, so the editor cannot preview a draft; `startsAt` is sent as an ISO instant from a local date and time; a pass through is `{ passThrough: true }` with no percent.
- **Pictures:** `audits/FEE-02/` (18, 1440 wide, light and dark): fees list, preview and history, editor, after a save, VAT confirm, VAT on, provider rates, provider editor, support refused. Taken against a stand-in Hub in scratch, not the real one.
- **Next:** switch to the real FEE-01 shapes once pushed, then a verifier.
- **Was:** todo. Cut by the lead from R-139 points 1, 9 and 10. Waits for FEE-01's admin routes.
- **What exists:** the dashboard's settings page (`src/app/(app)/settings/page.tsx`, `components/settings/SettingsScreen.tsx`, `SettingEditor.tsx`) edits plan settings by group; `components/money/SettingSwitch.tsx` toggles; `finance/revenue` (`components/appmoney/AppRevenue.tsx`). No fee page, no locked area.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-139; tasks/FEE-01.md and its admin routes
- wawu-dashboard: `AGENTS.md` (this Next.js differs from training data; read `node_modules/next/dist/docs/`), the settings and money components above

## Goal

An admin changes any fee (percentage, minimum, maximum, currency, start date) on one page and sees every past change; only superadmin and finance open the Nuvion rates area, which is never linked for other roles; the VAT switch and percentage sit with the fees.

## Scope

- A "Fees" page under Finance: one row per fee kind with the fee in force, an editor (percentage, minimum, maximum, currency, start date, note), a preview ("NGN 100,000 is charged NGN 400") worked out by the Hub's own rule, and the full history with who changed it and when. Kinds switched off (swap, local dollar receiving) show as off.
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
