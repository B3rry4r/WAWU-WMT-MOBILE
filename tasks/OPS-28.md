---
id: OPS-28
title: Admin screens: the WAWU virtual cards (every card by account id, hold, let go, block, the card switch and fees)
owner: YOU
area: OPS
order: -2702
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: []
decisions: [R-84]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-28 · Admin screens: the WAWU virtual cards

## Current state

As of 24 Oct 2026, built by the OPS-27 builder (T1, bundle B30). Dashboard `wmt/OPS-27` `19f0fcc`; backend `wmt/OPS-27` `f702669` (one read route); mobile records `wmt/OPS-27`. Status verifying. The Hub routes are those of `admin-cards.controller.ts` (WALLET-31) on `origin/main`: list, freeze, unfreeze, cancel; none takes a reason.

| # | Before | After |
|---|---|---|
| 1 | no screen for cards; the `cards.enabled` switch was a raw 0 or 1 box | `/finance/cards`: the card switch with a confirm; the Hub's card fee, WAWU's fee on top, and the two counts, shown as the Hub has them |
| 2 | support could not see or stop a card | every card by account id (no number, expiry, CVV, name or phone is read or shown): state, who held it, made and blocked times; filter by state or one person |
| 3 | no hold, let go or block | Hold (active), Let go (held), Block for good (any card not already blocked or failed); each asks for a confirm only, because the Hub takes no reason; the Hub's refusal is shown as written |
| 4 | the card fee had no read | backend `GET admin/money/cards/settings` (read only; superadmin and finance) |

Proof: `scratchpad/dash-b30/cards-1.png`, `cards-2-block-dialog.png` (1440 px, looked at); the list, the switch and the filter ran against the real Hub on the Nuvion stand-in. Checks as OPS-27 (same branches, same EXIT 0 lines).

Default (lead), owner may override: Block for good is a danger button with the words "The provider deletes the card. This cannot be undone"; it is offered on a card in `creating` or `unknown` as well, because the Hub's route accepts any card that is not already gone.

Open low: the three card acts leave an audit row on the Hub but ask for no reason (G-OPS-27-2).

## Read first

- `DECISIONS.md` R-84; backend `src/money/cards/admin-cards.controller.ts`
- Dashboard `src/components/money/WawuCards.tsx`, `src/lib/api/admin-cards.ts`

## Goal

Support can list every card, hold one, let it go or block it for good, and see the card switch and fees in force.

## Scope

`wawu-dashboard`: `src/components/money/WawuCards.tsx`, `src/lib/api/admin-cards.ts`, the page `src/app/(app)/finance/cards`. `wawu-backend`: `GET admin/money/cards/settings`.

## Capability checks

- [x] An admin can list cards, narrow by state or person, and see no card number or name.
- [x] An admin can hold, let go of and block a card, each after a confirm; a refusal shows the Hub's words.
- [x] An admin can switch new cards off and on.
- [ ] A real card made through Nuvion: NOT RUN (the stand-in's card was not driven; the rows were seeded).
