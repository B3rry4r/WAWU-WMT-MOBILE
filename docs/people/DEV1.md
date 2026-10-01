# Dev 1 · Money

You own money end to end: the backend that talks to Fintava, and the screens
where people see and move their money.

## What you own

- **The money core** that every other feature's payments call: the Fintava
  connection and webhooks, accounts for new and existing users, the PIN, the
  ledger, the nightly check, and pay-from-wallet with holds and refunds
  (MONEY-*). Others build their own payment paths on top of it; you keep it
  correct.
- **The PIN sheet and the pay sheet** that every payment screen reuses.
- **Wallet**: home, send to a user, send to a bank, add money and withdraw,
  history, PIN settings, earnings, payout bank (WALLET-*).
- **Bills**: airtime, data, cable, electricity, and their payment path (BILLS-*).

## Rules that matter most for you

- **Fintava's balance is the truth.** Never add up our records and show that as
  a balance.
- **Money is in kobo**, as integers. No floats anywhere.
- **Every debit needs a PIN and an Idempotency-Key.** The same request twice
  charges once.
- **Webhooks are verified and processed once,** however often they arrive.
- **Additive only.** The web keeps using Flutterwave until after launch; the
  protected-route suite (MONEY-01) must stay green.
- **Facts come from Fintava (`docs/fintava/`), never from the design.** Fees,
  limits and rates on the canvas are placeholders.
- **No Fintava sandbox on Day 0?** Build against the mock (MONEY-03); every path
  stays behind its flag until access arrives.

Your tasks: `tasks/INDEX.md`, section "Dev 1".
