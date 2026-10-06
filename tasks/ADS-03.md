---
id: ADS-03
title: Ads data model
owner: DEV2
area: ADS
order: 27
priority: launch
repo: wawu-backend
type: migration
status: verifying
depends_on: []
decisions: [R-15]
passes: [V1, V3, V4, V9]
artboards: []
---
# ADS-03 · Ads data model

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

H33 and H36 need sponsored cards with a schedule and a placement.

## Scope

Additive: AdCampaign and AdCreative (advertiser, headline, subline, CTA label, CTA destination from an allow-list, artwork, placement tgif_card or today_slot, start and end, status, weight).

## Capability checks

- [ ] The migration applies on a fresh local database built from every existing migration (`prisma migrate deploy`) and on the OPS-03 seeded database, and adds only new tables or nullable columns.
- [ ] V3 regression suite unchanged.

## Builder report

Backend branch `wmt/ADS-03` (2468204): `prisma/schema.prisma` (block appended at the end), migration `20261006090000_ads_data_model`, `src/ads/tests/ads-data-model.contract.spec.ts`. Mobile: this file, `SHARED-CHANGES.md` row ADS-03 #1, `docs/LOG.md`. No routes; `contract/openapi.json` unchanged (`npm run contract:build` leaves no diff).
- **Model:** `AdCampaign` (advertiser, placement, status, startsAt, endsAt, weight) and `AdCreative` (one per campaign: headline, subline, CTA label, CTA destination + id, artwork URL). Nothing beyond what H33 and H36 draw; no price or payment column (R-15); no personal data, so `account-data-map.ts` needs no entry (its drift spec passes untouched).
- **Allow-list:** the Postgres enum `AdCtaDestination`, today `event` only (the one destination H33 and H36 draw). ADS-06 checks it in its DTO and that the event exists; ADS-04 that it is still open. A new kind is `ALTER TYPE ... ADD VALUE` in the task that needs it. Decided and recorded: one creative per campaign (unique `campaignId`, cascade); variants would be a later additive change.
- **Check 1, applies and adds only new objects:** (a) fresh database from all 91 migrations: `prisma migrate diff` against schema.prisma shows only the known `DROP INDEX "ContentPiece_specializations_idx"`; (b) database built from main's 90 migrations and seeded with `npm run db:seed`, plus rows added to Event and NotificationCampaign: migration applied, per-table `pg_dump --schema-only` of all 107 existing tables byte-identical, whole-schema dump 0 lines removed, data dump 0 lines removed, existing row counts equal, neighbour rows intact; re-running `migrate deploy` applied nothing.
- **Check 2, V3:** `scripts/protected-routes/run.sh --fresh` 244/244 before and after; full contract suite after: 153 suites, 3700 passed, 1 suite failing (see below) as on main.
- **Model spec (42 tests):** valid rows, defaults, bad placement, bad status, end before or equal to start, weight 0, -1, 101, 1000, blank text, bad destination, artwork `javascript:`, `data:`, `ftp:`, creative without campaign, a second creative, cascade, and the serving query plus its index in the plan. Cleans up after itself and checks every table's row count equals its start; passed alone twice, in the middle of the full suite and last, and counts equal the fresh seed afterwards.
- **Gates before then after (main a94f338 on its own checkout and npm ci, then the branch):** tsc 0 and 0; eslint (no --fix) 4514 problems both; gates 16 fail / 34 warn / 76 accepted both (main's own); check_baseline exit 0 both; contract suite 152 suites / 3658 passed before, 153 / 3700 after; the one failing suite both times is `money/receipts/tests/receipt-units.spec.ts` (Node Unicode table, environment only; `data-export.contract.spec.ts` passes with `ADMIN_JWT_SECRET` set). Mobile `npm run check` exit 0 on main's tree (754 tests; OpenWalletScreen did not time out); after exit 0, same 43 suites / 754 tests, gates 0 fail.
- **PROVISIONAL(ADS-WEIGHT-RANGE):** weight 1 to 100, no ruling gives it; it is a CHECK in the migration, not config. Owner to confirm.
- **Not done:** no admin audit columns (ADS-06 may add an audit table); no view, tap or skip tables (ADS-05 adds them, and classifies its per-viewer column in `account-data-map.ts`). No gaps filed.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
