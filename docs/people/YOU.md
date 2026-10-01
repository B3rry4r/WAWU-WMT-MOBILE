# You

You run the build and own these features end to end: the screens AND the
backend behind them.

## Running the build

- Hand out tasks with the one-line prompts in `tasks/INDEX.md`. Builder and
  verifier are always different sessions, including for your own tasks.
- Apply `SHARED-CHANGES.md` between rounds of work.
- Review each pull request's evidence and look at the screenshots yourself
  before merging.
- Sign the checkpoints: CHECK-0 (safe to start), CHECK-1 (the app talks to the
  real backend), CHECK-2 (money moves correctly), CHECK-3 (full QA), then
  RELEASE-02 (QA fixes and store submission).
- Confirm or change the decision defaults in `DECISIONS.md` (OPS-01). Nothing
  waits on them.

## What you own

- **Outside contacts and setup:** Fintava docs and sandbox (OPS-02), staging
  (OPS-03), the designer (OPS-04), feature flags (OPS-06).
- **Money:** the core every payment uses: the Fintava connection, accounts, the
  PIN, the ledger, the nightly check, pay-from-wallet with holds and refunds,
  and the PIN and pay sheets every payment screen reuses (MONEY-*). You hold
  the Fintava relationship, so you own what talks to it.
- **Wallet** and **Bills** (WALLET-*, BILLS-*).
- **Schools**, **Professionals** and **Legal** (SCHOOLS-*, PROS-*, LEGAL-*).
- **Ads** (ADS-*), and the release (RELEASE-*).

## Rules that matter most for money

- Fintava's balance is the truth. Never add up our records and show that as a
  balance.
- Money is in kobo, as integers. No floats anywhere.
- Every debit needs a PIN and an Idempotency-Key. The same request twice
  charges once.
- Webhooks are verified and processed once, however often they arrive.
- Additive only: the web keeps using Flutterwave until after launch, and the
  protected-route suite (MONEY-01) must stay green.
- Facts come from Fintava (`docs/fintava/`), never from the design.
- No Fintava sandbox yet? Build against the mock (MONEY-05); every path stays
  behind its flag until access arrives.

Your list: `tasks/INDEX.md`, section "You".
