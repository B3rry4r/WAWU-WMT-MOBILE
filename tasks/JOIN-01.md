---
id: JOIN-01
title: Event registration link: register and pay the event fee (backend)
owner: YOU
area: WEB
order: 240
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: [TIER-01]
decisions: [R-48, R-43, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# JOIN-01 · Event registration link: register and pay the event fee (backend)

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, `docs/people/YOU.md`
- DECISIONS.md R-48 (this task), R-43 (the tiers), R-47
- `tasks/TIER-01.md` (the price file, `MakerTier`, the schema check at boot)
- Backend: its `CLAUDE.md`, `docs/contract/CONVENTIONS.md`, `src/common/flutterwave/checkout-verifier.ts`,
  `src/common/flutterwave/require-payment-config.ts`, and one finished Flutterwave purchase to copy the pattern from
  (`src/verification/verification.service.ts` `startPurchase` / `verifyPurchase`, or `src/credit-purchase/`)

## Goal

People at a WAWU event open a link on their phone, register (name, phone, email) and pay the event fee (₦2,000 today)
by Flutterwave checkout. It is a waiting list, not an account: no WAWU ID account, password or OTP is created here, and
the website's sign-up is not touched. Each paid registration is later turned into the Verify plan when that person signs
up in the app with the same phone or email (JOIN-03). The team can list and export who registered and who paid.

## Scope

- Config, never literals: an `event_offers` list in `src/plans/plans.config.json` (id, name, `price_kobo` 200000, the
  tier it becomes (`verify`), `tier_days` (default the tier's own days), `open_from`, `open_until`), checked at boot by
  the TIER-01 schema check (bad or missing field stops boot naming it). Naira only.
- New table (additive migration) for registrations: offer id, full name, phone (E.164, Nigerian numbers normalised),
  email (lower-cased), state (optional), what they make (optional), consent time, a random reference (the tx_ref,
  at least 128 bits, unique), status `pending` / `paid` / `failed`, amount in kobo, currency, the Flutterwave
  transaction id (unique once set), paid time, claimed-by person and claimed time (both null until JOIN-03). At most
  one `paid` row per offer per phone and per offer per email (database constraint).
- Public routes (no sign-in), each with a named `@Throttle` that a whole event venue on one Wi-Fi address will not hit
  (default 120 per 10 minutes per address; listed in the rate-limit spec):
  - `GET /waitlist/offers/current`: the open offer (id, name, price in kobo, tier name, products, days, closes at), or
    404 `no_open_offer`.
  - `POST /waitlist/registrations`: validates, refuses with 409 `already_registered` (no charge) when that phone or
    email already paid for the offer, reuses that person's own unpaid row instead of piling up duplicates, and answers
    the reference plus the Flutterwave checkout config (public key, tx_ref, amount in naira, `NGN`, customer name,
    email and phone). Refuses when the offer is closed (`offer_closed`).
  - `POST /waitlist/registrations/verify` `{ reference, transactionId }`: re-checks the payment with Flutterwave
    server-side (status, tx_ref, amount, currency) before marking it paid, in one transaction; idempotent (a second
    call answers the same result); a transaction id is accepted once only.
  - `GET /waitlist/registrations/:reference`: status and first name only (no phone or email) for the website's
    "checking your payment" page.
- Payments that never came back (the phone closed after paying): re-check `pending` rows older than a few minutes and
  younger than 48 hours by tx_ref (Flutterwave's verify-by-reference, same checks), on a schedule if the backend has
  one, else through the admin route below. Unpaid rows older than 7 days are deleted (no personal data kept for people
  who did not pay).
- Admin (existing admin auth and permissions): list registrations by offer and status, paginated, and a CSV export.
- The purge and data export maps decide the new table. Contract regenerated.

## Capability checks

- [ ] A new person registers and is given a reference and a checkout config whose amount and currency come from the
      config file; changing `price_kobo` and restarting changes the amount with no code change.
- [ ] A payment for less than the fee, in another currency, with another tx_ref, or with a transaction id already used
      is refused and the row stays `pending`; a correct payment marks it `paid`, and verifying twice answers the same.
- [ ] A phone or email that already paid for the offer is refused before any charge (`already_registered`), in all four
      Nigerian phone forms and any email letter case; two simultaneous paid verifies for the same phone leave one paid row.
- [ ] A pending row whose payer never came back is found by the re-check and marked paid, and only if Flutterwave says
      it succeeded for the right amount.
- [ ] A closed or not-yet-open offer refuses registration; `GET /waitlist/offers/current` answers 404 with none open.
- [ ] The status route never shows phone or email; an unknown reference answers 404 without saying whether it exists.
- [ ] Admin list and CSV export show every paid and pending row for the offer; a non-admin is refused.
- [ ] No Flutterwave host is called in specs (stood in); production refuses to boot without a real key (unchanged).
