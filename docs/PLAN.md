# WMT plan

A five-day build, then two days of QA. Four people. Each person owns whole
features: the screens AND the backend behind them.

## Who owns what

| Person | Owns, end to end |
|--------|------------------|
| **You** | Running the build (decisions, Fintava, staging, reviews, checkpoints, store submission). Features: Schools, Professionals, Legal |
| **Dev 1 · Money** | The money core every payment uses (Fintava, accounts, PIN, ledger, pay-from-wallet). Features: Wallet, Bills |
| **Dev 2 · Account, Me, Events** | App shell and session. Features: sign-up and sign-in, Settings, Me (profile, create, ticks), Events (including tickets) |
| **Dev 3 · Feed and Inbox** | Design-system components. Features: Home (feed, TGIF, unlock, tips), Explore, Inbox (paid questions, chat, money in chat, communities, credits, push) |

The payment path for a feature belongs to that feature's owner, built on Dev
1's money core. Details for each person: `docs/people/`.

## The week

| Day | What happens |
|-----|-------------|
| 0 | Setup verified, staging, protected routes, D1 to D4 ruled, Fintava sandbox. **CHECK-0** |
| 1 | App shell, components, PIN and pay sheets, wallet contract and mock, feature flags |
| 2 | Screens on today's backend and the backend gaps behind them; Fintava core. **CHECK-1** |
| 3 | More screens; sign-up with BVN; wallets; pay-from-wallet core |
| 4 | Every payment path; send money; bills; events door; inbox money; schools payment. **CHECK-2** |
| 5 | Verification and QA only. **CHECK-3** |
| 6 | QA fixes only, re-verified; store submission. **RELEASE-02** |

Each developer runs several Claude sessions in parallel: builders on their
day's tasks, and separate verifier sessions checking yesterday's. Day 4 is the
heaviest day. Every day's task list is in `tasks/INDEX.md`.

**The one outside dependency:** anything that moves real money needs Fintava
sandbox access on Day 0. Without it, money screens are built against the mock
and stay off behind their flags until access arrives.

## Handing out work

```
You are the BUILDER for task WALLET-02. Open tasks/WALLET-02.md and follow it.
You are the VERIFIER for task WALLET-02. Open tasks/WALLET-02.md and follow it.
```

Builder and verifier are always different sessions. Backend tasks: start the
session with the backend repo and this repo both attached.

## Needed from outside the team

**From Fintava (OPS-02), Day 0:** API docs, sandbox keys, and these sandbox
calls saved in `docs/fintava/` (request and full response, keys and BVNs
masked, webhooks with headers):

1. Create a customer
2. Open a Naira account at Tier 1
3. Get the balance
4. Get transaction history
5. Bank list
6. Check an account name
7. Send to a bank (one success, one failure)
8. Check a transfer's status
9. Move money between two customers
10. Move money from a customer to WAWU's account
11. Hold money, then release it
12. Validate and pay a bill
13. Webhooks: money received, transfer succeeded, failed, reversed
14. Upgrade a tier with NIN

Questions for Fintava:
- Do they handle BVN, NIN and liveness checks themselves?
- Do they manage a transaction PIN, or do we?
- What are their fees and tier limits?
- Can we pay a school that isn't a WAWU user?
- What exact licence wording should the app use?
- Are dollar accounts, crypto and the card in the contract?

**From you:** Apple Developer, Google Play and Expo accounts (SHELL-03,
RELEASE-01); the domain behind `wawu/...` links; an SMS route for sign-up
codes; a BVN and selfie vendor if Fintava doesn't cover it; Redis for live
chat; rulings D1 to D15 (D1 to D4 on Day 0).
