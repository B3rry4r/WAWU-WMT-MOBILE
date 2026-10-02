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
- Rule what's still open in `DECISIONS.md` (D14 in OPS-07, D15 through the
  designer in OPS-04). Nothing waits on them.

## What you own

- **Outside contacts and setup:** Fintava docs and sandbox (OPS-02), staging
  (OPS-03), the designer (OPS-04).
- **Money:** the core every payment uses: the Fintava connection, accounts, the
  PIN, the ledger, the nightly check, pay-from-wallet with holds and refunds,
  and the PIN and pay sheets every payment screen reuses (MONEY-*). You hold
  the Fintava relationship, so you own what talks to it.
- **Open your wallet:** the BVN check, the selfie match, and the screens that
  open an account and set the PIN (KYC-*, MONEY-12, MONEY-13). It runs the
  first time someone taps Wallet or anything that moves money, never at
  sign-up (R-6).
- **Wallet** and **Bills** (WALLET-*, BILLS-*).
- **Schools**, **Professionals** and **Legal** (SCHOOLS-*, PROS-*, LEGAL-*).
- **Ads** (ADS-*), and the release (RELEASE-*). Only you have the Apple and
  Google accounts, so only you submit (`docs/BUILDS.md`).

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
- Build against the real Fintava sandbox, never a mock. Money launches with
  the app (R-20).
- Fees: the user pays Fintava's fee plus WAWU's on top (R-10).

Your list: `tasks/INDEX.md`, section "You".
