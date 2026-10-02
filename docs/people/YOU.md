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
- Nothing is open in `DECISIONS.md` today (D14 and D15 closed by R-34 and
  R-35). Rule anything new there; nothing waits on it.

## What you own

Events, Schools, Professionals and Legal moved to Developer 3 on 2 Oct 2026
(`docs/people/DEV3.md`); Inbox, Bills and Ads to Developer 2
(`docs/people/DEV2.md`).


- **Outside contacts and setup:** Fintava docs and sandbox (OPS-02), the
  designer (OPS-04).
- **Money:** the core every payment uses: the Fintava connection, accounts, the
  PIN, the ledger, the nightly check, pay-from-wallet with holds and refunds,
  and the PIN and pay sheets every payment screen reuses (MONEY-*). You hold
  the Fintava relationship, so you own what talks to it.
- **Open your wallet:** the BVN check, the selfie match, and the screens that
  open an account and set the PIN (KYC-*, MONEY-12, MONEY-13). It runs the
  first time someone taps Wallet or anything that moves money, never at
  sign-up (R-6).
- **Wallet** (WALLET-*).
- **The release** (RELEASE-*). Only you have the store accounts, so only you
  submit (`docs/BUILDS.md`). Android launches first; iOS is RELEASE-03 (R-24).

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
- Fees: the user pays Fintava's fee plus WAWU's on top (R-10); WAWU pays Fintava's
  charge on its own movements (R-31).
- **Designs are final; changes come from the brief.** Check
  `docs/designer/BRIEF.md` for every artboard you build (R-29).
- **Links between screens:** a hub builds only the rows whose screen exists;
  the task that builds a screen adds its own way in, as drawn (R-27,
  `docs/WORKFLOW.md` section 7).

Your list: `tasks/INDEX.md`, section "You".
