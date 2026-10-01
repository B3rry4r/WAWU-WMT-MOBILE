# WMT plan

Who builds what, in what order, and what is still needed from outside the
team. How each task is built and checked is in `docs/WORKFLOW.md`. Every task
is a file in `tasks/`; `tasks/INDEX.md` lists them by person with status.

## The team

Four people: the owner plus three developers. The owner also runs the project,
so their lane has the least building in it.

| Lane | Person | Owns | Days |
|------|--------|------|------|
| `YOU` | Owner | Decisions, Fintava, the designer, reviews and merges, stage sign-off, store submission. Builds Schools, ads, TGIF server state, admin screens, staging and feature flags | 44.5 |
| `MONEY` | Dev 1 | Backend: the Fintava connection, sign-up with BVN, wallets, PIN, ledger, every payment path, transfers, earnings; plus paid-DM threads, the reply-rate penalty, communities and live chat updates | 96 |
| `MOBILE-A` | Dev 2 | Mobile: app shell, session, PIN and pay sheets, sign-up and sign-in, settings, wallet, bills, legal, events, professionals; plus the backend gaps behind those screens | 95.5 |
| `MOBILE-B` | Dev 3 | Mobile: design-system components, Home, TGIF, Explore, Me and Create, Inbox, Schools; plus the backend gaps behind those screens | 95.5 |

Days are planning estimates from the analysis (`docs/analysis/`), not quotes.

**Why the owner doesn't take the money lane:** money is the critical path and
everything waits on it, so it needs someone full-time. The owner's lane is the
one nothing else waits on.

## Timeline

Stages and their exit gates are in `docs/WORKFLOW.md` section 7. With about 96
days in each developer lane and stages overlapping, store submission lands
around **week 22**, if the Fintava docs and sandbox arrive in week 1. The web
port (Stage 9) follows. Every week of delay on Fintava moves Stages 5 and 6.

## Handing out work

One line per session. The task file tells it what to read:

```
You are the BUILDER for task M-04. Open tasks/M-04.md and follow it.
You are the VERIFIER for task M-04. Open tasks/M-04.md and follow it.
```

Builder and verifier are always different sessions. Backend tasks: start the
session with both `wawu-backend` (or `wawu-id`) and `wawu-wmt-mobile`
attached.

## What is needed from outside the team

### From Fintava (task Y-02)

API docs:
- **Basics:** authentication and request signing, sandbox URL, IP allow-list,
  webhook signature check, idempotency rules, error codes, rate limits.
- **Accounts:** create a customer; open a Naira account at Tier 1 (which
  fields; is BVN required?); upgrade tiers with NIN and address; read each
  tier's limits.
- **ID checks:** do they do BVN, NIN and liveness, or do we need a vendor?
- **Balance and history,** and stamped statements.
- **Transfers:** bank list, name check, send to a bank, move money between two
  Fintava accounts and to and from WAWU's own account, check a transfer's
  status, webhooks for success, failure and reversal.
- **Holding money** on an account and releasing it (paid DMs, tickets).
- **Adding money:** incoming transfer webhook, card top-up with 3-D Secure,
  USSD.
- **Bills:** airtime, data, TV, electricity (does the token come back?).
- **PIN:** do they manage one, or do we?
- **Only if in the contract:** cards, dollar accounts and FX, crypto, QR.

Sandbox calls to run and save in `docs/fintava/` (request and full response;
mask keys and BVNs; webhooks with headers):

1. Create a customer
2. Open a Naira account at Tier 1
3. Get the balance
4. Get transaction history
5. Bank list
6. Check an account name
7. Send to a bank: one that succeeds, one that fails
8. Check a transfer's status
9. Move money between two customers
10. Move money from a customer to WAWU's account
11. Hold money, then release it
12. Validate and pay a bill
13. Webhooks: money received, transfer succeeded, failed, reversed
14. Upgrade a tier with NIN

Questions for Fintava:
- Fee schedule and settlement times
- Tier limits
- Can a school that isn't a WAWU user be paid? (KYB)
- Reconciliation reports
- The exact licence wording for "Banking by Fintava MFB · Licensed by the CBN" (Z9)
- Are dollar accounts, crypto and the Verve card covered by their licence and our contract?

### From the owner

- Apple Developer and Google Play accounts; an Expo account for builds and push
  (task A-03).
- The domain behind `wawu/...` links, so links open the app.
- An SMS route for sign-up codes (the design says SMS; WAWU ID uses WhatsApp
  today).
- A BVN, NIN and selfie-check vendor if Fintava doesn't cover them (Smile ID,
  Prembly and Dojah are common choices).
- Redis for live chat (task M-54).
- Rulings D1 to D15 in `DECISIONS.md`. D1 to D4 are needed before Stage 2.
