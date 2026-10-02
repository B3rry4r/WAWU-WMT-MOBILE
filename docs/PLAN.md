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

**From Fintava (OPS-02):** sandbox keys, put straight into the backend's
environment secrets (never into a chat or a commit). Their published docs are
already in `docs/fintava/reference/`, and `docs/fintava/naira-api.md` says
what they mean for us. These sandbox calls get saved in `docs/fintava/`
(request and full response, keys and BVNs masked, webhooks with their
headers):

1. Check a BVN, then a selfie against it
2. Create a customer (with BVN, NIN and address) and read back its wallet
3. Get the balance
4. Get transaction history, for a customer and for WAWU
5. Bank list
6. Check an account name, at another bank and at Fintava
7. Send to a bank (one success, one failure, one reversal)
8. Look up a transaction by reference
9. Move money between two customers
10. Move money from a customer to WAWU's wallet, and back
11. Pay a bill (electricity with meter preview, and airtime)
12. Freeze and unfreeze a wallet
13. Webhooks: money received, wallet transfer, bank transfer, reversal

The questions for Fintava are at the end of `docs/fintava/naira-api.md`.
Crypto runs through Cardex, their partner: `docs/fintava/cardex.md`.

Until the sandbox arrives, money is built against the mock (MONEY-05). Then
it's tested on the sandbox and launches with the app (R-20).

**From you:** the Apple, Google Play and Expo accounts exist; you invite the
developer to Expo only and do the store steps in `docs/BUILDS.md`. Also: the domain behind
`wawu/...` links; an SMS route for sign-up codes (Fintava sells SMS); a liveness
provider if you want one (Fintava only matches the face); Redis for live chat.
