---
id: FIX-P6
title: The two lows of the CHECK-3 sixth pass (Home names the currency being opened, a payment from a USD account is named by what it paid for)
owner: YOU
area: OPS
order: -158
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-87, R-91, R-19, R-53, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# FIX-P6 · The two lows of the CHECK-3 sixth pass

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/FIX-P6` from `origin/main` `b8e6df15`, backend `wmt/FIX-P6` from `origin/main` `74d1a02`. Source: `audits/CHECK-3/p6.md` (findings L1, L2; L3 is a stack note, not a defect).

| # | Row (source) | Cause and outcome | Commit |
|---|---|---|---|
| 1 | L1, R-87: Home before the wallet opens, for a person whose first account is USD, read "₦ / Naira / Your account is opening" (`08-home-opening.png`) | Cause: `MoneyCard` drew the Naira chip for every state, and `homeView` dropped the Hub's `world` block (its `firstCurrency`) when the wallet was `opening`. Fixed: the opening view carries `world`; `moneyCard` sets `currency` on the opening notice (the Hub's `world.firstCurrency`; `NGN` when the Hub sends no `world`, which is a Naira opening; `null` when it sends a `world` with no first currency yet); the chip draws that currency's flag and word (Dollar, Euro, Pound ...), and no chip when the Hub has not said (the row keeps its height). Nothing is read from the phone's country. Tests (fail before): `openingCurrency.test.tsx` (the model for USD, GBP, Naira and unsaid; the card for each) and two cases in `HomeScreen.test.tsx` that boot Home from `GET /money/wallet` | FIX-P6 commit |
| 2 | L2, R-91, R-19: the Dollar tab's row for a content unlock read "WAWU operational (held money)" | Cause: the Hub sends a foreign account's history straight from the provider's statement (`GET /money/fx/accounts/:id/transactions`, `counterpartyName` and `description` as the provider words them), and the provider names the other side of a payment by WAWU's own account. The app only draws what it is sent. Fixed at the source, in the Hub (backend `wmt/FIX-P6`, `src/money/fx/fx-own-lines.ts`, called from `FxAccountsService.month`): a line WAWU made (a payment `wawu-pay-<id>`, its conversion fee `-fee`, a refund `wawu-ref-<id>`) is named as the naira row is: "Who Made This" as the other side and "Unlock · the piece" (or Tip, Paid question, Event ticket, Refund, Conversion fee) under it, from the person's own payment or hold row; found by our reference (with or without the provider's `book-transfer-inflow-for-` prefix), by the transfer id our payment record holds, or by WAWU's own narration. A line whose record is gone or is another person's still reads "Payment", "Refund" or "Conversion fee", never the provider's account. Money from a person and swaps keep the provider's words. Additive: same fields, same types. App test pins the drawing (`fxTabs.test.tsx`) | FIX-P6 commit (backend and mobile) |

Other R-91 payments checked (L2): tip, paid question and event ticket debit the buyer's account under the same `wawu-pay-<id>` reference and a paid question's or ticket's refund credits it under `wawu-ref-<hold id>`; the Hub spec (`fx-own-lines.contract.spec.ts`, fails before) names each of them and the refund, and a whole page with unmatched lines carries no `operational`, `held money`, `WAWU purchase`, `WAWU fee` or `WAWU refund`. The unlock receipt and the sheets already name the paying account (PAY-FX round 4).

- **Round 2 (27 Oct 2026, verifier FIX, backend only; the app half is unchanged and accepted):** M1 the Hub trusted text a stranger writes: a credit from a person with the narration "WAWU refund", "WAWU purchase" or "WAWU fee", or a reference holding a `wawu-pay-<id>`, was relabelled "Who Made This". Now a line is WAWU's own only by the transfer id our own payment record holds (in that move's direction), or by our reference in the exact format WAWU writes and the matching direction (a payment and its `-fee` are debits, a hold's `wawu-ref-` is a credit), or by our narration of the matching direction, the last two only with WAWU's own account on the other side. M2 a WAWU line that matches nothing showed the provider's name ("WAWU operational (held money)", "WAWU merchant"): it now reads "Who Made This" with Payment, Refund or Conversion fee by direction; WAWU's own accounts are the names the adapter and its stand-ins use plus the operational account's display name as the provider reads it (so a person's own "WAWU USD 1a2b3c4d" is not one). Low: a payment line no longer loses its USD to NGN rate block; a swap's fee and a send's fee (`wawu-fx-`, `wawu-abroad-`) keep the provider's description as on main, only a payment's own fee reads Conversion fee. Changed assertions: none (the round 1 tests stand; 8 added in `fx-own-lines.contract.spec.ts`, 7 red on the round 1 head). A line that carries a rate block is still titled "Swap to Naira" by the app, as on main; the app is untouched.
- **Round 3 (27 Oct 2026, app only):** now that a payment line keeps the provider's rate block, the history row titled a USD unlock, tip, paid question, ticket or refund "Swap to Naira", though a payment is not a swap the person made. `fxRowOf` (`src/features/wallet/fx/parts.tsx`) now treats a line the Hub names "Who Made This" (what the Hub sends for a line WAWU made) as that payment: the Hub's title and what it was for stay, the rate is a detail line under them (`FxRowData.detail`), and the icon is the payment's. Only a line with a rate block and any other party, the person's own conversion, is "Swap to ..." with its rate, as before. Tests in `fxTabs.test.tsx`: five payment and refund lines with a rate block show the Hub's words, "Who Made This" and the rate, and no "Swap" (red before); a real swap in each direction still reads "Swap to Naira" and "Swap from Naira". No existing assertion changed. The marker is the Hub's name for the other side, so a real conversion whose other side the Hub names "Who Made This" would read as a payment; the Hub does that only for WAWU's own account.

Changed assertions: none. No existing test changed.

**NOT RUN:** the pictures at 390 (Home opening for a USD person; the Dollar tab after an unlock): the stack needed Nuvion DEV and this brief allows no real provider. The Hub spec uses the provider's statement lines as the audit saw them (counterparty "WAWU operational (held money)"). **Not known without dev:** whether Nuvion's real statement line echoes our reference; the spec proves the three other ways in (transfer id, narration) and the plain fallback, so no internal name shows either way, but a verifier on dev should look at the Dollar tab once after an unlock. A phone: NOT RUN.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `tasks/WALLET-41.md`, `tasks/PAY-FX.md`; `DECISIONS.md` R-87, R-91, R-19, R-53

## Goal

The two lows of the sixth CHECK-3 pass are fixed, each with a test that fails before.

## Scope

App: `src/features/home/MoneyCard.tsx`, `src/features/home/model.ts`, `src/features/wallet/home/model.ts`. Backend: `src/money/fx/fx-own-lines.ts`, `src/money/fx/fx-accounts.service.ts`, `src/money/fx/fx-view.type.ts` (comments only), the spec. Nothing Fintava; nothing the web calls changes behaviour.

## Capability checks

- [x] Home's card for a wallet that is opening names the currency the Hub says is opening: Dollar for a USD first account, Naira for a Naira opening, nothing when the Hub has not said.
- [x] A payment from a Dollar account (unlock, tip, paid question, ticket), its conversion fee and its refund read "Who Made This" and what they were for, never a WAWU internal account name.
- [x] Money from a person and a swap keep the provider's words.
- [ ] On a phone and on Nuvion DEV: NOT RUN.
