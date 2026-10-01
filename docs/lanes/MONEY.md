# Lane: MONEY (Dev 1)

Backend. You connect Fintava and move every payment in the product onto it.
You own sign-up with BVN, because opening a Fintava account needs it. You also
own the messaging backend that sits next to paid DMs (M-51 to M-54).

## Repos

`wawu-backend` (NestJS, Prisma, Postgres) and `wawu-id` (sign-up and
sign-in). Task files live in `wawu-wmt-mobile/tasks/`. Start each session
with the repos the task names, plus `wawu-wmt-mobile`.

## Rules that matter most in this lane

- **Fintava's balance is the truth.** Never add up our records and show that
  as a balance (M-16). The nightly check (M-18) finds any difference.
- **Money is in kobo**, as integers, everywhere. No floats.
- **Every debit needs a PIN and an Idempotency-Key.** The same request twice
  charges once (V8 on every money task).
- **Webhooks are verified and processed once,** however many times they
  arrive (M-05).
- **Additive only.** The web still uses Flutterwave until Stage 9. Every
  change keeps the protected route suite (M-01, V3) green.
- **Facts come from Fintava, never from the canvas.** Fees, limits and FX on
  the design are placeholders (the designer says so). Use `docs/fintava/` and
  the D5 ruling.
- **Payments move one at a time,** behind a flag: staging with the sandbox,
  staff with real money, then everyone on mobile (docs/WORKFLOW.md section 6).

## Order

M-01 (protected routes) in Stage 0. M-02 and M-03 (contract and mock) in
Stage 1, so Dev 2 can build wallet screens early. M-51 to M-54 in Stage 4
while Fintava access is set up. Then Stage 5 (M-04 to M-18) and Stage 6
(M-19 to M-42).

Your tasks: `tasks/INDEX.md`, section "Dev 1".
