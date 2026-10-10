---
id: JOIN-01
title: Event registration link: register and pay the event fee (backend)
owner: YOU
area: WEB
order: 240
priority: launch
repo: wawu-backend
type: money-path
status: verifying
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

## Builder report

Builder, 10 Oct 2026. wawu-backend `wmt/JOIN-01` `d9d9c9f` (three commits on main `046444b`; the first, `5773fdb`, carried the
four routes' shapes and the regenerated contract within the first hour so the website builder could start); mobile
`wmt/JOIN-01` (this file, on main `00f84cc`). depends_on TIER-01 is `done`. No Flutterwave, Fintava, Nuvion,
wawuafrica.com or AI host was called: Flutterwave is stood in at its two seams in every spec, and a spy on `fetch` fails
a spec that reaches a network host.

**Built (backend).** `src/waitlist/`: `waitlist-public.controller.ts` (the four routes, one class-level `@Throttle`),
`waitlist.service.ts` (offer, register, verify, status, settle, admin list and rows), `waitlist-core.module.ts` (the
service, no routes) and `waitlist.module.ts` (routes and sweeps), `waitlist-sweep.service.ts` (the re-check and the
purge), `waitlist-payment-lookup.ts` (Flutterwave verify-by-reference), `waitlist-admin.controller.ts` and
`waitlist-export.ts` (list and CSV), `waitlist-error.ts` (13 `reason.code`s with their statuses), `waitlist-contact.ts`
(phone and email), `waitlist-config.ts` (throttle, re-check and purge settings, two `PROVISIONAL` markers),
`waitlist-view.type.ts`, `dto/waitlist.dto.ts`, and specs under `tests/`. `prisma/schema.prisma` + migration
`20261018100000_event_waitlist` (enum `WaitlistStatus`, table `WaitlistRegistration`, CHECKs, two partial unique
indexes). `src/plans/plans-config.ts` and `plans.config.json` (the `event_offers` list and its boot check, including real
calendar dates and a field written twice). `src/payment-webhook/` (one branch in `resolve()`, one import).
`account-data-map.ts`, `data-export-sections.ts`, `src/tests/hub-rate-limits.contract.spec.ts`, `src/app.module.ts`
(mounted on the branch), `contract/openapi.json` (regenerated). Mobile: this report, `SHARED-CHANGES.md` JOIN-01 #1 to #5,
`docs/LOG.md`.

**Routes (all under `/api/hub`, envelope `{ statusCode, message, data }`, errors with `reason.code`).**
`GET /waitlist/offers/current` (offer: id, name, `priceKobo`, `tierName`, `products`, `days`, `closesAt`; 404
`no_open_offer`). `POST /waitlist/registrations` body `{ offerId, fullName, phone, email, state?, makes?, consent }`
answers `{ reference, offerId, amountKobo, flutterwaveConfig { publicKey, txRef, amount (naira), currency "NGN",
customerName, customerEmail, customerPhone } }`; 400 `phone_invalid` `email_invalid` `name_invalid` `consent_required`,
404 `no_open_offer`, 409 `offer_closed` `already_registered`, 503 `payments_unavailable`. `POST /waitlist/registrations/verify`
body `{ reference, transactionId (digits) }` answers `{ reference, status "paid", firstName }`; 404 `not_found`, 409
`payment_not_confirmed` `transaction_already_used` `already_registered`, 422 `payment_mismatch`, 503
`payment_check_unavailable`. `GET /waitlist/registrations/{reference}` answers `{ reference, status, firstName }`, 404
`not_found` for every miss. Admin (superadmin, finance, support; reviewer 403; user token or none 401):
`GET /admin/waitlist/registrations?offerId&status&page&perPage` and `GET /admin/waitlist/registrations/export`
(`{ fileName, contentType, rowCount, content, generatedAt }`, the CSV inside the envelope as statements are). Contract
against main: six paths and eight schemas added; no existing path or schema changed; the existing paths keep their order.

**The "never came back" mechanism: both, and which does what.** The existing Flutterwave webhook
(`POST /webhooks/flutterwave`, `charge.completed`) is used as the brief says: a delivery whose tx_ref starts `wawu-join-`
reaches the registration through `PaymentWebhookService.resolve()` (flow `event-registration`) and is settled by the same
checks as a browser verify; this settles most of them at once. Under it, `WaitlistSweepService` (`@nestjs/schedule` is
already in the app) asks Flutterwave by reference every 5 minutes for `pending` rows 5 minutes to 48 hours old and settles
them by the same checks, because the webhook's single claim per `event:tx_ref` is used up by a failed first attempt
(a card declined, then a bank transfer that succeeds on the same reference), and that payer would otherwise wait for a
replay. No admin "re-check" route was added (nothing needs one).

**Capability checks** (`src/waitlist/tests/`, a real database, HTTP, Flutterwave stood in)
1. A new person registers and gets a reference and checkout whose amount and currency come from the file; changing
   `price_kobo` and booting again changes the amount with no code change: `waitlist.contract.spec.ts` ("registers a new
   person", "changing price_kobo and restarting"), reference `wawu-join-` + 36 hex = 144 bits, checked on 2,000 draws in
   `waitlist-config.spec.ts`.
2. Less than the fee, another currency, another tx_ref, an amount that is not whole kobo, or a transaction id already
   used: refused and the row stays `pending`; a correct payment marks it `paid`; verifying twice answers the same and asks
   Flutterwave once; a payment above the fee is accepted and the confirmed amount is recorded: same file, "POST
   /waitlist/registrations/verify" (12 tests) and the webhook spec (5).
3. A phone or email that already paid is refused before any charge in six phone forms and three email cases
   (`initCharge` never called); two simultaneous paid verifies for the same phone, and for the same email, leave one
   `paid` row; the second payment is kept as `failed` with its transaction id and amount, for a refund. The database
   refuses it by itself too (partial unique indexes, tested by writing directly).
4. A pending row whose payer never came back is found and marked paid, only if Flutterwave says succeeded, in naira, under
   this reference, for at least the fee: the webhook spec (signed deliveries) and "payers who never came back" (the sweep,
   five tests: window 5 minutes to 48 hours, one unreachable row does not stop the rest, idempotent).
5. A closed or not-yet-open offer refuses registration (409 `offer_closed`, nothing written); `GET offers/current` answers
   404 `no_open_offer` for closed, not yet open and none; with two open offers the one closing first.
6. The status route shows only reference, status and first name (the body is searched for the phone and `@`); an unknown
   reference, a malformed one and a 500-character one answer byte-identical 404s.
7. Admin list (paginated, by offer and status, newest first) and the CSV (byte-order mark, header, one line per row, naira
   with two decimals, a name starting `=` written with a quote in front); reviewer 403, user token and no token 401.
8. No Flutterwave host is called: the `fetch` spy in every spec; the real lookup answers null with no key or under
   `NODE_ENV=test`. Production refuses to boot without a real key (unchanged): a spec boots `WaitlistModule` with
   `NODE_ENV=production` and no key (and a placeholder key) and gets the `FLUTTERWAVE_SECRET_KEY is missing` refusal.
Also: unpaid `pending` rows older than 7 days are deleted and `paid`/`failed` rows of any age are kept; the throttle
(120 per route per address in 10 minutes, the 121st is 429 `retry-after-medium`, other routes still answer); the
purge deletes a claimed registration with its account and leaves others; the export carries only the claimed rows and no
reference or transaction id; the table's CHECKs refuse a short reference, an upper-case email, a `paid` row with no
transaction, a half claim, a zero fee and another currency.

**Numbers.** New specs: 86 passing in six files (`waitlist.contract` 45, `waitlist-config` 28, `waitlist-webhook` 5,
`waitlist-admin` 4, `waitlist-throttle` 2, `waitlist-data-maps` 2). tsc 0. eslint 0 on every new file and on
`plans-config.ts`; `payment-webhook.service.ts` has 7 older errors on lines this task did not touch (they are on main).
Protected suite `run.sh --fresh HEAD` on `d9d9c9f`, lock `origin/main` `046444b`: 253/253, 244 of 244 required; the lock
files are unchanged (`git diff` against main is empty). Gates: the same 16 FAIL lines as main (diffed line by line),
warnings 70 to 72 (the two deliberate `PROVISIONAL(WAITLIST-LIMITS ...)` and `PROVISIONAL(WAITLIST-RECHECK ...)`, each
with `why=`); `check_baseline.py` clean; tripwire on added lines empty; secret scan of the staged diffs (hex and base64
runs, `sk_`, `FLWSECK`, bearer tokens, key headers): nothing. `hub-rate-limits.contract.spec.ts` (host network) 22/22 with
the new routes listed. Full suite in a private network namespace (own :4001, fresh migrated and seeded
`bj01_ns_test`) on `7b36135` (plus a one-line spec edit): 229 suites, 5,843 passed, 4 skipped, 19 failed in three files, none touching this task:
`hub-rate-limits` 11 (needs a non-loopback interface; 22/22 on the host), `fintava-stall` 7 and `selfie-match` 1 (timeouts
at a load average near 7; both files 302/302 alone). After the last change (the route-free core module) the 43 suites
that boot `AppModule` or sit beside what changed (`src/common` incl. route shadowing, `src/admin`, `src/payment-webhook`,
`src/plans`, `src/data-export-request`, `src/account*`, `src/waitlist`, `src/openapi`, the money contract specs): 1,096/1,096.
`npm run contract:build`: regenerated; against main only additions (562 lines). `npm run api -- --backend
/home/user/wt/b-JOIN-01` on this branch: copies backend main (`046444b`), so only `SOURCE_COMMIT` is unchanged and no
type moves (the branch's routes are not on main); proved separately that the branch's `contract/openapi.json` generates the
six paths and the eight types with `openapi-typescript` (`WaitlistRegistrationStartView`, `WaitlistRegistrationStatusView`
with `status: "pending" | "failed" | "paid"`, and the rest).

Mobile `npm run check` exit 0 (typecheck, lint, jest 1,852/1,852 in 109 files, gates 0 fail, 271 tasks and 279 artboards), first run; the known load flake `eventsScreens.test.tsx` did not occur.

**Mutants** (each applied to the money checks, the specs run, `git restore`d, tree clean after each; all killed):
M1 amount (less than the fee accepted, 3 specs failed); M1b whole kobo (fraction accepted); M2 currency (any accepted, 4);
M3 tx_ref (another registration's accepted, 3); M3b status (not-successful accepted, 4); M4 reused transaction id (both
guards removed); M5 one paid per phone (phone dropped from the register-time check) and M5b (email dropped); M5c/M5d the
partial unique index dropped from the database for phone and for email (2 and 3 specs failed), index recreated; M6
idempotent verify (a paid row asked again); M7 the second payment not kept for a refund; M8 the status route showing the
phone; M9 the purge deleting paid rows; M10 the price not copied onto the row. Logs in the lead's scratchpad `join01/mut/`.

**Decisions** (each Default (agent), owner may override)
- The offer, its price, tier, days and dates are the lead's defaults in `event_offers`; the throttle (120 per route per
  address in 10 minutes), the re-check window (5 minutes to 48 hours, every 5), the purge age (7 days) are settings in
  `waitlist-config.ts` under `PROVISIONAL` markers. Arithmetic for the owner: a registration is about four calls
  (offer, register, verify, one or more status polls) and each route is counted apart, so one address can register 120
  people in 10 minutes but can poll the status route only 120 times; the page should poll sparingly. The global
  20 a second per route per address still applies; an override can only tighten (a spec enforces it), so a venue burst over
  20 calls to one route in one second is answered 429.
- The service sits in `WaitlistCoreModule` (no routes) because `AdminPaymentsModule` imports `PaymentWebhookModule`; had the
  webhook imported the route module, `GET /plans`, `GET /me/tier` and the waitlist routes would have been registered early.
  The first push had that order; it was caught by comparing the contract's path order with main's and fixed.
- A registration is reused when offer, phone and email all match a `pending` row (a different email is another person);
  its name, state, what they make and consent time are refreshed and its fee is set to the current price.
- Phone: Nigerian numbers in the four forms (spaces, dashes and brackets ignored) become `+234...`; any other number must
  carry `+` or `00` and is kept in E.164; a `234` number that is not a valid Nigerian mobile is refused. Email lower-cased.
  State and what they make: free text up to 60 characters, since the backend has no list of either.
- `offerId` is required in the register body so the fee the page showed is the fee asked; an unknown id is 404
  `no_open_offer`. Register answers 200 (it creates or reuses). The page's public key comes from the existing
  `FLUTTERWAVE_CLIENT.initCharge` (its tx_ref is ignored, the reference is ours, 144 bits where `initCharge` gives 122);
  an empty key is 503 `payments_unavailable` and writes nothing, so a broken checkout is never handed out.
- A payment Flutterwave does not confirm, or that does not match, leaves the row `pending` (never `failed`), so the
  payer can check again. `failed` means one thing: a second payment for someone already registered, kept with its
  transaction id and amount so it can be refunded, and never purged. A payment above the fee is accepted; `paidKobo`
  records what Flutterwave confirmed. A payment made after the offer closed still counts (verify ignores the window).
- The browser's verify with a paid registration answers the same result without asking Flutterwave again, whatever
  transaction id comes with it.
- Purge map: `WaitlistRegistration.claimedByWawuId` OWNED (JOIN-03 writes it; the column is named for the map's rule);
  an unclaimed registration names no account. Export: section `eventRegistrations` for claimed rows, without reference or
  transaction id. The admin export returns the CSV inside the envelope, like statements.
- Mounted in `app.module.ts` on the branch (SHARED-CHANGES JOIN-01 #1) instead of queued, because the contract only
  carries a route once it is mounted and the website builder was waiting; the other four rows are listed for the owner.

**Gaps and shared changes.** SHARED-CHANGES JOIN-01 #1 to #5. No BACKEND_GAPS row: nothing a screen needs is missing.

**NOT RUN**
- A real Flutterwave payment (card, bank transfer or USSD) end to end: the owner pays once on production after deploy.
  Unblocked when `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY` and `FLUTTERWAVE_SECRET_HASH` are set on the server and the
  dashboard's webhook points at `/api/hub/webhooks/flutterwave`; then `GET /api/hub/waitlist/offers/current` answers 200 and a
  paid registration shows `paid` in `GET /admin/waitlist/registrations`.
- Flutterwave's real answers for verify-by-reference (`GET /v3/transactions/verify_by_reference?tx_ref=`) and a real
  `charge.completed` payload: the shapes are read from the existing adapters and the Flutterwave documents, never
  called. Unblocked by one test-mode payment closed before the callback: the row must turn `paid` within 5 minutes with the
  webhook switched off, and at once with it on.
- The website page (JOIN-02) against these routes, and the claim in the app (JOIN-03): other tasks.
- The Nuvion and Fintava providers: this task does not touch them.
