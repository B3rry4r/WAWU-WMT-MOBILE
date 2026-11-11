---
id: NUV-LIVE
title: A one-off command that retires every test-system Nuvion wallet record before the Hub moves to Nuvion live
owner: YOU
area: MONEY
order: 392
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [R-138, R-39, R-42, R-11, R-19]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# NUV-LIVE · A one-off command that retires every test-system Nuvion wallet record before the Hub moves to Nuvion live

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from R-138. No branch yet.
- **Why:** every Nuvion wallet on the live Hub was opened on Nuvion's test system (`api.nuvion.dev`). The Hub keeps no environment on its Nuvion rows, so on live keys a person with a test entity would still be treated as having a wallet: balance reads would hit live Nuvion with test ids (`not_found`), opening would refuse ("This BVN or phone number already has a wallet on another account", `wallet-opening.service.ts`), and any earning, refund or hold that came from test money could be paid from WAWU's live operational account.
- **Next:** a builder, then a T2 verifier with the money attacks.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-138 (this task), R-39 (one provider seam), R-42, R-11 (earnings wait for a wallet), R-19 (held money)
- tasks/NUV-10.md (the go-live checklist this task makes safe)
- wawu-backend: `scripts/ops/delete-test-account.ts` (its `proveTestProvider`), `scripts/ops/real-money-rows.ts`, `scripts/ops/clear-communities.ts` and `scripts/ops/room-money-rows.ts` (the pattern: dry run, typed phrase, one transaction per unit, row locked, money check repeated inside); `prisma/schema.prisma` (every Nuvion model and every model with a `provider` column); `src/nuvion/`, `src/wallet-provider/`, `src/money/` (opening, BVN claims, identity holds, balances, holds, payments, payouts, earnings and their sweep, cards, bills, FX, capital, reconcile and the nightly check)

## Goal

The owner runs one command on the server while it is still on Nuvion's test keys, sees every test wallet record it would retire, types the phrase, and afterwards, on live keys: nobody sees a test wallet, everyone can open a wallet again with the same BVN and phone, the Hub never calls live Nuvion with a test id, and no test money is ever paid out of a live account.

## Scope

- **`scripts/ops/nuvion-live-reset.ts`**, built by the deploy like `clear-communities.ts`, run the same way (`cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a; node dist/scripts/ops/nuvion-live-reset.js`).
- **It runs only on the test system.** It refuses unless `proveTestProvider` shows `WALLET_PROVIDER=nuvion` on Nuvion's sandbox host, so it can never touch a live wallet. It calls no provider at all (dry run and apply are database-only).
- **Dry run (default), writes nothing.** Counts, and per person an id (no name, email, phone, BVN or account number): Nuvion entities, accounts and account details, onboardings, documents, identity holds and BVN or phone claims, wallet and ledger rows of provider `nuvion`, holds, payments, transfers, payouts, refunds and fees in flight, earnings waiting or settling that came from Nuvion test money, cards, bills, FX, capital, book transfers, webhook events and reconcile findings; then what apply would do to each kind, totals, and the exact phrase (it carries the person count).
- **Apply:** `--apply --confirm "<phrase>"`. One transaction per person, the person's rows locked first and every check repeated inside. Retire, do not guess: for each kind, record in the task file whether it is deleted, closed (cancelled, refunded-as-test, no provider call) or relabelled so the live server never acts on it, and why that keeps every read working. Prefer keeping money history where a read can show it safely; prefer deleting what would make the Hub think a wallet exists. WAWU's own operational account references from the test system are retired the same way.
- **Test money never becomes real money (R-138 point 3).** After apply, no earning, refund, hold, payout, fee or host share that came from Nuvion test money can be paid from a live account, by any sweep, retry, reconcile or webhook. Earnings from real money (Flutterwave, store) that wait for a wallet (R-11) are untouched and still land when the person opens a live wallet.
- **What stays:** anything bought or unlocked with test money stays the buyer's; WAWU Credits and Studio points stay as counts; Flutterwave, Fintava, store and every real-money row are untouched. If the dry run finds a money row it cannot prove is Nuvion test money, that person is kept and listed, with no override (the OPS-DEL-TEST rule).
- **After apply, on live keys** (proven by specs with the provider stand-in on a production-shaped config): a reset person's wallet screen answers "no wallet yet" and opening starts from the beginning; the same BVN and phone are accepted; the money routes, the earnings sweep, the reconcile and the nightly check make no call with a test id; running the command again finds nothing.
- **Tests** (contract specs on the test database, stand-ins only, never a live provider): dry run writes nothing; the phrase must match; apply retires exactly what the dry run listed; a person with a real-money row is kept; a payment or hold in flight is closed with no provider call; a test-money earning is never paid on live (try the sweep, a retry, a webhook and the reconcile); a real-money earning still lands; the protected suite passes; a schema-walk spec fails if a model with a Nuvion id or a `provider` column is left unclassified.

## Capability checks

- [ ] The owner can run the dry run and see every test wallet record it would retire, with no personal data printed.
- [ ] After apply, a person who had a test wallet can open a wallet on live with the same BVN and phone.
- [ ] No test-money earning, refund, hold, payout or fee can be paid from a live account after apply, by any path.
- [ ] A person with a real-money row is kept and listed; nothing real is touched.
- [ ] The command refuses on live keys and calls no provider.

## Builder report

## Verifier report

## Owner sign-off
