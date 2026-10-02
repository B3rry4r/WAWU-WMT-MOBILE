# WMT plan

Two people, you and one developer. Each owns whole features: the screens AND
the backend behind them. You set the pace; the order of each person's list is
the only schedule.

## Who owns what

**You:** running the build (Fintava, staging, the designer, reviews,
checkpoints, store submission). Features: the money core, Wallet, Bills,
Schools, Professionals, Legal, Ads. Details: `docs/people/YOU.md`.

**Developer:** verifying the setup, the app shell, the shared components.
Features: sign-up and sign-in, Settings, Me, Home, Explore, Events, Inbox.
Details: `docs/people/DEV.md`.

A feature's payment (tickets, unlocks, tips, credits, ticks) belongs to that
feature's owner, built on the money core.

## How the lists work

`tasks/INDEX.md` has one list per person. Work down it top to bottom:

- A task never comes before something it depends on. The checker enforces it.
- If a task needs the other person's work first, the list says so.
- Open decisions never block anything. Each has a default to build now
  (`DECISIONS.md`); numbers go into config, marked provisional.
- "After launch" tasks sit at the end of your list. They can wait.

Checkpoints sit in your list where they fall: CHECK-0 (safe to start), CHECK-1
(the app talks to the real backend), CHECK-2 (money moves correctly), CHECK-3
(full QA, nothing new built), then RELEASE-02 (QA fixes only, then submit).

## Handing out work

```
You are the BUILDER for task WALLET-02. Open tasks/WALLET-02.md and follow it.
You are the VERIFIER for task WALLET-02. Open tasks/WALLET-02.md and follow it.
```

Builder and verifier are always different sessions. For backend tasks, start
the session with the backend repo and this repo both attached.

## Needed from outside

**From Fintava (OPS-02):** API docs, sandbox keys, and these sandbox calls
saved in `docs/fintava/` (request and full response, keys and BVNs masked,
webhooks with their headers):

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
- Are dollar accounts, crypto and the card in our contract?

Until the sandbox arrives, money is built against the mock (MONEY-05) and
stays behind its flags.

**From you:** Apple Developer, Google Play and Expo accounts; the domain behind
`wawu/...` links; an SMS route for sign-up codes; a BVN and selfie vendor for
"Open your wallet" if Fintava doesn't cover them; Redis for live chat.
