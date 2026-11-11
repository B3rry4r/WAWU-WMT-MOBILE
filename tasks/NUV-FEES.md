---
id: NUV-FEES
title: Nuvion's live fees charged exactly (percentages with a minimum and maximum, the card's dollar fee at the day's rate) and WAWU's own card fee on top
owner: YOU
area: MONEY
order: 393
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [R-138, R-10, R-42, R-84]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# NUV-FEES · Nuvion's live fees charged exactly, and WAWU's own card fee on top

## Current state

**Stopped by the lead: superseded by the owner's fee and routing brief of 11 Nov.** Work in progress on Hub `wmt/NUV-FEES` (tsc clean; specs, gates, contract build and protected suite NOT RUN). Built: `src/money/fees/percent-fee.ts` and the `pct:0.2,min:5000,max:50000` shape in `nuvion-fee-config.ts` (half-up rounding, PROVISIONAL, no Nuvion evidence); `CARD_ISSUE_FEE_USD_CENTS` with `card-fee-rate.service.ts` (Nuvion merchant FX quote through the seam, `409 rate_unavailable` when none). WAWU's card fee (G-WALLET-31-1) was already built and closed (`collectFee`, charged only after the card exists). Add-money option hiding not built.

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead when the owner sent Nuvion's live commercials (11 Nov 2026) and said: cards stay on and WAWU makes money on them ("We are still supposed to make money from that"); card top-up stays off (Nuvion told the owner it is down).
- **Why:** the Hub's Nuvion fee settings (`src/money/fees/nuvion-fee-config.ts`, `src/money/cards/card-config.ts`) take only a flat kobo figure or `from:fee` step bands, written when Nuvion had published no fees. Nuvion's live fees are percentages with a minimum and a maximum, and the card's is in dollars. WAWU's own card fee (`WAWU_FEE_CARD_KOBO`) is not built: above 0, making a card answers `503 fees_not_set` (gap G-WALLET-31-1).
- **Next:** a builder, then a T2 verifier with the money attacks.

## Nuvion's live fees (owner's copy of Nuvion's commercials, effective 1 Jun 2026; the facts this task builds on)

| Service | Nuvion's fee |
|---|---|
| Payout to a Nigerian bank (NGN payout) | 0.2% of the amount, minimum NGN 50, maximum NGN 500 |
| Payout to a Nuvion user (book transfer) | free |
| Receive a domestic transfer (local rail, NGN) | 0.2% of the amount, minimum NGN 50 (the maximum is printed only in USD, GBP and EUR: 200) |
| Virtual card issuance | USD 1.00 per card |
| Card monthly maintenance | USD 2.50 per card per month |
| Card decline | USD 1.00 per declined transaction |
| Local card acquiring | 3% + USD 0.30 (not used: card top-up is off) |
| Monthly account maintenance | NGN 100 per additional account per currency (WAWU's cost) |

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-10 (the person pays the provider's fee plus WAWU's), R-42, R-84 (the card), R-138
- wawu-backend: `src/money/fees/` (fee-config.ts, nuvion-fee-config.ts, the fee quote service and the fees-set guard), `src/money/cards/`, `src/money/add-money/`, `src/nuvion/areas/fx.ts` and `src/nuvion/areas/cards*`, `src/money/limits/`, the nightly money check

## Goal

On Nuvion live, every fee a person is quoted equals what Nuvion takes plus WAWU's own fee, to the kobo, for any amount; making a card charges Nuvion's dollar fee at the day's rate plus WAWU's card fee, and WAWU's fee reaches WAWU's operational account; card top-up is not offered.

## Scope

- **Percentage fee rules.** The Nuvion fee settings also accept a percentage with an optional minimum and maximum in kobo (a written shape the task file records, for example `pct:0.2,min:5000,max:50000`), next to today's flat and band shapes, which keep working unchanged. Rounding is recorded and matches how Nuvion rounds (read it from a dev `applicable_fee` already recorded in docs/nuvion/DEV-RESULTS.md or the stand-in's recorded answers; never call Nuvion). Bank payout and inflow use it; book transfer stays a flat 0.
- **The card's dollar fee.** Making a card quotes Nuvion's USD 1.00 in naira at the rate Nuvion itself gives at that moment (its FX quote, through the provider seam), and the person sees and pays that. If no rate can be had, making a card refuses plainly (no guess). The card's monthly USD 2.50 and decline fee are taken by Nuvion, not quoted by WAWU: record how they show in the person's history (or that they do not) and leave them to Nuvion.
- **WAWU's own card fee on top (R-10).** Build the fee-only charge (G-WALLET-31-1): when `WAWU_FEE_CARD_KOBO` is above 0, making a card moves WAWU's fee from the person's wallet to WAWU's operational account by book transfer, once (Idempotency-Key), and gives it back if the card is not made. The figure comes from config only.
- **Card top-up off.** With the card top-up fee unset, the add-money options do not offer the card (or Apple Pay) at all, rather than offering it and answering `fees_not_set`.
- **Additive only:** no route, answer shape or word the app or the web reads changes, unless additive and in the contract; no schema change unless a ledger row truly needs one (then it is an additive migration with a rollback that refuses to lose data, named in this file).
- **Tests** (stand-ins only, never a live provider): every fee shape at the band edges (NGN 50 floor, NGN 500 cap, just under and over 25,000 and 250,000 naira); a quote equals the stand-in's recorded `applicable_fee` plus WAWU's; a card made with a rate from the stand-in, the person debited Nuvion's naira fee plus WAWU's fee once, WAWU's fee in the operational account; a failed card gives WAWU's fee back; no rate means no card and no charge; card top-up absent from the options; the protected route suite passes.

## Capability checks

- [ ] A user sending money to a bank is quoted Nuvion's 0.2% (between NGN 50 and NGN 500) plus WAWU's fee, to the kobo.
- [ ] A user making a card pays Nuvion's USD 1.00 at the day's rate plus WAWU's card fee, and WAWU's fee lands in WAWU's operational account.
- [ ] A user adding money sees only the ways that work (no card top-up).
- [ ] Nothing the app or the web reads changes shape.

## Builder report

## Verifier report

## Owner sign-off
