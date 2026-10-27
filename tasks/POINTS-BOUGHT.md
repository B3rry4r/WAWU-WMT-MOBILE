---
id: POINTS-BOUGHT
title: Bought points never expire and can never be cashed out (R-101 point 7)
owner: YOU
area: POINTS
order: -1266
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: []
decisions: [R-43, R-86, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# POINTS-BOUGHT · Bought points never expire and can never be cashed out

## Current state

As of 27 Oct 2026. Round 1 by a Sonnet builder (T2): backend `wmt/POINTS-BOUGHT` `3c557e6` on `origin/main` `53f3cb3`, mobile `wmt/POINTS-BOUGHT` on `origin/main` `4dccecae`. Ruling R-101 point 7 (owner, 27 Oct 2026: "Bought points cannot be cashed out ... it can't expire ... This applies for the Play Store build too"); R-101 is not in `DECISIONS.md` yet, the lead adds it.

- **What is bought:** lot sources `pack` (a points pack paid by the wallet, by bank transfer or in a store, its bonus points included), `bump` (the checkout bump) and `shortfall` (a top-up). `tier_bonus` and `referral` are earned and bonus points and keep today's rules (a set end, cash-out at the set rate). `returned` is never granted today and counts as earned.
- **No end:** a bought lot is stored with the "never" end `POINTS_NEVER_EXPIRES` (2099-12-31 23:59:59.999 UTC, `src/points/points-bought.ts`) whatever end a caller gives; the column stays NOT NULL and the CHECK stays, the expiry job never reaches it, and every view answers its end as `null`. Widened for the app, the only caller: lot `expiresAt`, pack grant `expiresAt`, shortfall grant `expiresAt` and pack quote `expiryDays` are nullable.
- **Migration** `20261211090000_points_bought_never_expire`: clears the end of existing bought lots with no lapse time, keeps the old dates in `PointLotExpiryChange`; `rollback.sql` restores them and refuses (saying so) if a lot was spent after its old end or still holds points with its old end passed. The trigger that holds a lot's end fixed is switched off for that one update inside the migration.
- **Cash-out:** the quote, the checks before the PIN and the hold use only earned and bonus lots. `GET /me/points` and the quote answer `cashablePoints`, each lot answers `cashable`, the quote can block as `not_cashable`, and `POST /points/convert` for more than the cashable points is `422 points_not_cashable` (`balancePoints`, `cashablePoints`, `neededPoints`).
- **Spend order (AI tools):** before, the soonest end across all lots, bought ones included (they ended after `bought_expiry_days`). Now lots that end, soonest end first (then oldest grant, then lot id), then the lots that never end, oldest first. Store refunds still take back only the unspent part of the refunded lot.
- **App:** Convert (PT6) shows only the cashable points and says once "Points you bought can't be turned into cash." (only when the person holds bought points); PT4 says "Points you buy never expire."; PT5 draws a bought lot as "never expires" and the spend line says bought points go last.
- **Round 2 (verifier findings):** (M) the data export no longer shows the "never" date: `pointLots` exports a bought lot's end as `null` (spec added). (L) A person with only bought points who asks a no-amount quote is blocked as `not_cashable` (`cashablePoints` 0), not `below_minimum`; PT5 hides the round Convert button when `cashablePoints` is 0 and says "Points you bought can't be turned into cash." under the balance when the person holds bought points. Three dangling day-in-milliseconds comments removed; two controller jsdocs no longer say bought points end.
- **Not done:** the plan setting `points.bought_expiry_days` is left in place (plan settings belong to PRICE-LIST), it no longer ends any lot; the Hub specs that use the Fintava double were edited but not run here (CI runs them).

## Read first

- `DECISIONS.md` R-43, R-86, R-5; `docs/WORKFLOW.md`; `tasks/POINTS-01.md`; `tasks/POINTS-04.md`

## Goal

Points a person bought never expire and can never be turned into cash, on every platform. Earned and bonus points keep their rules.

## Capability checks

- [x] A new bought lot (pack, bump, shortfall) has no end; an existing one has its end cleared and the old date kept; the rollback restores it or refuses.
- [x] Cash-out uses only earned and bonus points; asking for more is refused in the house shape (`points_not_cashable`).
- [x] Spending takes lots that end soonest first and bought lots last.
- [x] A store refund takes back only the unspent part.
- [x] App: Convert offers only the cashable points and says the note once; no screen says bought points expire.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/POINTS-BOUGHT.md](history/POINTS-BOUGHT.md).
