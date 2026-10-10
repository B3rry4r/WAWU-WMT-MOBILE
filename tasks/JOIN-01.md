---
id: JOIN-01
title: Event registration link: register and pay the event fee (backend)
owner: YOU
area: WEB
order: 240
priority: launch
repo: wawu-backend
type: money-path
status: done
depends_on: [TIER-01]
decisions: [R-48, R-43, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# JOIN-01 · Event registration link: register and pay the event fee (backend)

Round 3 follow-up: wmt/JOIN-01-r3
Round 4 follow-up: wmt/JOIN-01-r4

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

## Round 2 (builder, 10 Oct 2026)

Backend `wmt/JOIN-01` `d26e1e6` (one commit on `d9d9c9f`). Three owner rulings of 10 Oct 2026, nothing else touched. No
Flutterwave, Fintava, Nuvion, wawuafrica.com or AI host was called.

**What changed**
- The link stays open until the owner says: `open_until` is optional in `event_offers` (absent or `null` is no closing
  date; a value is checked exactly as before, including "must be after open_from"). The shipped `event-oct-2026` offer
  has none. `closesAt` in `GET /waitlist/offers/current` is `string | null` (null: no closing date), and the contract
  carries it as `nullable`. An offer with no `open_until` is open from `open_from` for ever; before `open_from` it is
  still not open (404 `no_open_offer`, 409 `offer_closed`). Closing later is a config change (set `open_until`) and a
  restart. Of two open offers the one closing soonest still comes first; one with no closing date comes last.
- Throttles, per address per 10 minutes, each route counted apart: `GET /waitlist/offers/current` and
  `GET /waitlist/registrations/:reference` 600; `POST /waitlist/registrations` and `POST /waitlist/registrations/verify`
  300 (was 120 each, one class-level override). Now one `@Throttle` per route (`WAITLIST_THROTTLE_READ`,
  `WAITLIST_THROTTLE_WRITE` in `waitlist-config.ts`, still under `PROVISIONAL(WAITLIST-LIMITS ...)` with its new reason).
- Files: `src/plans/plans-config.ts`, `src/plans/plans.config.json`, `src/waitlist/waitlist.service.ts`,
  `waitlist-config.ts`, `waitlist-public.controller.ts`, `waitlist-view.type.ts`, three waitlist specs,
  `src/tests/hub-rate-limits.contract.spec.ts`, `contract/openapi.json`.

**How proved**
- `src/waitlist`: 6 files, 91 of 91 (was 86): the config spec now holds the shipped offer with no closing date, absent and
  null `open_until`, and a dated one still checked; the contract spec holds closesAt null over HTTP for both spellings,
  open a century on (service called with that moment, a registration then taken), not open before `open_from`, and two
  offers (the dated one first, the open-ended one once it has closed); the existing closed and not-yet-open specs pass
  unchanged. The throttle spec now fills the routes side by side: 300 registers then the 301st is 429 on that route only
  (header limit 300), the offer and status routes 600 then 429, verify 300 then 429.
- `src/tests/hub-rate-limits.contract.spec.ts` (host network): 22 of 22. It lists the four overrides with their exact
  figures (`@Throttle(` four times in the controller file, one per handler).
- tsc 0; eslint 0 on every changed file; `npm run contract:build`: against the round 1 contract only
  `closesAt` gained `"nullable": true`.
- Protected suite `run.sh --fresh HEAD` on `d26e1e6` in a private network namespace, lock `origin/main` `046444b`: 253 of
  253 (244 of 244 required), lock files unchanged. Gates: the same 16 FAIL lines as main (compared line by line after
  stripping colour), 72 warnings as in round 1. Tripwire on added lines empty. Secret scan of the staged diff: nothing.
  No em-dash added.
- Namespace run (own :4001, fresh migrated and seeded database, `src/plans`, `src/payment-webhook`, `src/openapi`,
  `src/common`, `src/admin`, `src/data-export-request`, `src/account`, `src/waitlist`): 39 suites, 1,037 of 1,037. The
  full suite was not re-run (see NOT RUN).
- The website walk (JOIN-02 round 2) ran against this backend with the shipped config (no closing date): the offer answered
  `closesAt: null`, registrations and payments worked, and with `open_until` set the answer carried the date.

**Decisions (Default (agent), owner may override)**
- Findings for the lead: 600 and 300 are above the app's own `medium` count of 200 a minute, so the "an override can only
  tighten" check in the rate-limit spec could not hold for these four routes as written. The spec still requires every other
  override to tighten as before; for these four it now requires that the sustained rate over the window (600 in 600 s is 1 a
  second, 300 in 600 s is 0.5) be no higher than `medium`'s (200 in 60 s is 3.3 a second) and that `short` (20 a second) is
  untouched. A burst of up to 600 calls inside one minute from one address is therefore allowed on the two read routes, bounded
  by `short`.
- `open_until: null` written out is accepted the same as leaving it out.
- The reference is `wawu-join-` and 36 hex characters (144 bits), not 64; the website's short form is the first 8 of those.

**NOT RUN**
- The full backend suite on this head (only the 39 related suites and the protected suite ran): unblocked by one run of the
  lead's namespace runner with no test filter; round 1's full run on `7b36135` had 19 failures in three files, none touching
  this task.
- A real Flutterwave payment and a real throttle under a venue's load: as in round 1; the throttle figures are held by specs
  at the app's guard, not by a load test.

## Verifier report (independent, rounds 1 and 2)

Verifier, 10 Oct 2026 (independent session; wrote none of this). Backend `wmt/JOIN-01` `d26e1e6` (detached worktree
`/home/user/wt/vb-JOIN-01`); backend `origin/main` `046444b`, which is also the branch's merge base: main has not moved
since the builder branched, so a trial merge is the branch itself (nothing to merge). Mobile `wmt/JOIN-01` `c65b526`
(the builder's report) and mobile main `00f84cc` (unmoved). Evidence: the lead's scratchpad `vjoin01/` (`out-*.txt`, `mut/`, `ns/`).
No Flutterwave, Fintava, Nuvion, wawuafrica.com or AI host was called. Flutterwave was stood in at the two DI seams
(`FLUTTERWAVE_CLIENT` and `WAITLIST_PAYMENT_LOOKUP`) on the REAL `AppModule` built from the branch (`dist/`), real
Postgres (`vj01_` databases), real admin login (argon2 and HS256) and a genuine RS256 user token from the mock WAWU ID,
every call over HTTP. My own driver scripts, not the builder's specs, produced the numbers below; the builder's specs
were also run (`src/waitlist` 6 files, 91 of 91).

**Verdict: review. No blocker.** Every money check held under my own attack: a payment below the fee, in another
currency, under another tx_ref, with a spent transaction id or with a Flutterwave status other than `successful` is
refused and the row stays `pending`; one paid row per offer per phone and per email held at 2 and 6 concurrent verifies;
a second payment for the same person is kept `failed` with its transaction id and amount and is visible to the admin.
Three should-fix defects (D1 to D3) and ten notes are below. D1 (the re-check's 200-row limit) should be fixed before the
event unless the Flutterwave webhook is confirmed live first.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 (40 s). eslint `--no-fix` on the 27 changed `.ts` files: 0 errors on 26; `payment-webhook.service.ts` has 7 errors, the same 7 as origin/main's copy (linted from stdin, line numbers shifted by 3), none on a line this task touched. `scripts/gates/run.py`: branch 16 fail and 72 warn, main 16 fail and 70 warn; the sorted FAIL lines are identical (`diff` empty); the two extra warnings are `PROVISIONAL(WAITLIST-LIMITS)` and `PROVISIONAL(WAITLIST-RECHECK)`, both with `why=`. Tripwire on added lines: empty. Secret scan of the whole diff (hex runs, base64 runs, `sk_`, `FLWSECK`, bearer, key headers): only `$ref` strings in the contract. No em-dash added outside code comments. |
| V2 Contract | passed (D2 on odd input) | `npm run contract:build` exit 0 and `contract/openapi.json` identical to the branch's (`git diff` empty). Against main: 6 paths and 8 schemas added, none removed or changed, the existing paths keep their order (python comparison), `WaitlistOfferView.closesAt` is `{type: string, nullable: true}`. Phones in four Nigerian forms plus spaced, dashed and bracketed spellings, and 8 email spellings, behave (C1, C2 below). Odd input: a NUL byte gives 500 (D2). |
| V3 Regression | passed | Protected suite `scripts/protected-routes/run.sh --fresh HEAD` in a private network namespace: 253/253, "all 244 required tests passed", code `d26e1e6`, lock `origin/main` `046444b`; lock files unchanged (`git diff origin/main..HEAD` on `src/protected-routes`, `test/protected-routes`, `.pipeline/protected-registry.json` is empty). Full suite in a private network namespace (own :4001, checked before, after start and after the run; fresh migrated and seeded `vj01_ns_test`): 229 suites, 5,856 passed, 4 skipped, 11 failed, all 11 in `hub-rate-limits.contract.spec.ts` ("needs a non-loopback IPv4 interface", as the common rules say), which is 22 of 22 on the host network; 993 s; no timing flake this time. The other purchases' webhook behaviour: `src/payment-webhook/tests/payment-webhook.contract.spec.ts` and `payment-webhook-throttle.contract.spec.ts` are inside those 228 passing suites; the new branch is last in `resolve()` and entered only for a `wawu-join-` reference. |
| V4 Field trace | passed | Name, phone, email, state, "what you make", consent time: written by `register` (normalised), read by the admin list and CSV (full), the checkout config (returned only to the caller who sent them: on the reuse path the row's phone and email equal the request's and the name is overwritten by it, so nobody else's data comes back), `firstName` only on the status route, the data export (claimed rows only, no reference or transaction id) and the purge map (`claimedByWawuId` OWNED). Phone and email appear in no log line (grep of the app log over every driver run: only `***1234` masks). |
| V6 States | passed | Each state from its real cause on the built server: no open offer (404; config with a future `open_from`), closed (409 `offer_closed`; config with a past `open_until`), `payments_unavailable` (503; production mode, empty public key), `payment_check_unavailable` (503; Flutterwave throws), `payment_not_confirmed` (409), `payment_mismatch` (422), `transaction_already_used` (409), `already_registered` (409), `consent_required` (400), 429 on each of the four routes. |
| V7 Flow walk | passed | New person: register, pay, verify, status. Phone closed after paying: the webhook settles; webhook consumed by a failed first attempt: the sweep settles; payment verified after the offer closed. The same person twice (sequential, 2 and 6 concurrent, four phone forms): one paid, the rest `failed`. Resume by reference only (the status route). |
| Mobile check | exit 0 on the second run | `npm run check` run after the status was set to `review` (the `unbuilt_entries` gate reads it): first run exit 1, three suites timed out at 20 s with the machine at load average 5 to 6 (`eventsScreens.test.tsx`, the known flake, plus `OpenWalletScreen.test.tsx` and `settingsScreens.test.tsx`); run alone they pass, 175 of 175; second full run exit 0: 109 suites, 1,852 tests, gates 0 fail on 445 files, 271 tasks and 279 artboards. This task changes only the task file, `docs/LOG.md` and the generated progress files on this branch. |
| V8 Money attack | passed | Below. |
| V9 Live seam | passed for the Hub; NOT RUN for Flutterwave | Real server, real database, real admin and user tokens (the RS256 user token is 401 on both admin routes). Flutterwave itself was never called: see NOT RUN. |
| Mutants | 22 run, 17 killed, 5 survived | Below. |

### Money attack (V8), my reproductions

Built server, Flutterwave scripted per transaction id (`vj-boot.cjs`). Drivers: `t-money.mjs` 37 of 37, `t-person.mjs` 24 of 24,
`t-webhook.mjs` 18 of 18, `t-sweep.mjs` 7 pass and 2 fail (the two fails are the D1 probe), `t-overlap.mjs` 2 of 2, `t-admin.mjs` 29 pass
and 1 fail (D2), `t-throttle.mjs` 6 of 6, `t-boot.sh` 7 of 7 plus the two refused boots, `t-prod.sh` 5 cases as described.
- **Refused, row stays `pending`, no transaction id stored** (422 `payment_mismatch` unless stated): amount 1999.99, 0.01,
  1999.999 (a fraction of a kobo), -2000, 0, 1e12 (over the integer column) and the string "2000"; currency USD, "ngn" and empty;
  the tx_ref of another registration and an empty tx_ref; status `failed`, `pending`, `cancelled`, `SUCCESSFUL`, `success` and empty
  (409 `payment_not_confirmed`); Flutterwave unreachable (503 `payment_check_unavailable`); a transaction id already used by
  another registration (409 `transaction_already_used`, Flutterwave not asked); a payment made for registration A presented on B (422).
  Extra body fields (`amountKobo`, `status`) are refused 400 by the whitelist pipe.
- **Correct payment**: paid, `paidKobo` 200000, transaction id stored; verifying again with the same or another id
  answers the identical body and Flutterwave is asked once (call log).
- **Amount ABOVE the fee (judged): acceptable, and the right call.** ₦2,500.50 against a ₦2,000 fee marked the row paid and
  recorded `paidKobo 250050`. Flutterwave's `amount` is the amount the checkout asked for, so more than the fee happens only
  when the payer edits the amount in the browser; refusing it would leave a charged payer unregistered. The excess is
  visible to the team (Fee and Paid columns, `paidKobo` in the list) but nothing flags it (N1).
- **Payment after the offer closed (judged): honoured, correct.** With `open_until` 80 s ahead: after it passed,
  `offers/current` was 404, register 409 `offer_closed` (nothing written), a verify for a row registered before the close
  answered paid, and the sweep settled a payer who never came back. The person was charged on a link that was open when
  they registered; refusing would keep their money.
- **One paid per offer per phone and per email**: after one paid registration, eight phone spellings (`0…`, without the 0,
  `234…`, `+234…`, spaced, bracketed and dashed, padded) with a new email, and four email spellings (upper case,
  surrounding spaces, first letter capital, trailing newline) with a new phone, each answered 409 `already_registered`,
  `initCharge` was never called and no row was written. Concurrent verifies of separate rows (separate references, each with a
  valid payment): same phone 2 and 6, same email 2 and 6, the same phone in four forms 4: every time exactly one HTTP 200, one `paid`
  row and the others `failed` with their transaction id and `paidKobo` (money to refund). The same reference and id verified 6
  at once: six identical 200s and one paid row. Two references paid in turn for one phone: the second is 409 and `failed`,
  verifying it again stays 409, the status route says `failed`, and the admin list (`status=failed`) shows it with its
  transaction id and amount (I7).
- **Webhook**: no `verif-hash`, a wrong one, one character short and an empty one: 401, no receipt written, row `pending`.
  A signed delivery whose payload claims 99999 while Flutterwave says 1000: `rejected`, row `pending`. A signed delivery whose
  payload says `failed` and 1 while Flutterwave says successful 2000: `settled` (the payload is never consulted). Replay:
  `duplicate`, row unchanged. Flutterwave unreachable: 503, receipt `failed` (reclaimable), and a redelivery then settles. A
  `wawu-join-` reference with no registration: `unmatched`. A tx id used by another registration: `rejected`. `charge.failed`:
  `ignored`. A failed first attempt consumes the single `event:tx_ref` claim, so the later successful delivery is `duplicate` and
  the row stays `pending` (as the builder said); the sweep then settles it from the reference (W16, W17) and so does a browser verify with the good id (W18).
- **Sweep**: rows at 2 min, 4.5 min, 49 h and 3 days are not looked up; 6 min and 47 h are, by reference, and paid. Flutterwave
  answering failed, 1999, USD, another tx_ref, an empty tx_ref or 2000.004: nothing marked, no transaction id stored. One
  unreachable lookup marks nothing and the rest of the run goes on. A second run is harmless. Two sweeps started together over the
  same 5 rows (what a run longer than 5 minutes on one server, or two servers, would do): all five paid exactly once, no
  `failed` row, no error; the only cost is each row asked twice. The cron has no `waitForCompletion` and no lock, so the two
  copies CAN overlap on one server (a run is up to 200 rows at up to 10 s each) and on two; the conditional write makes that
  safe (N2). The sweep's batch limit is D1.
- **Purge**: `pending` older than 7 days deleted (8 days, 7 days 1 minute), `pending` at 6 days kept, `paid` and `failed` of 30 and 8 days kept.
- **Status route**: only `reference`, `status`, `firstName`, never phone, email, transaction id or amount. Unknown, an upper-cased
  real reference, `wawu-join-` alone, 500 characters, an SQL-ish string, a path-ish string and an encoded `₦` all answer
  byte-identical 404 bodies with identical headers; verify with an unknown or malformed reference answers the same 404; the one
  exception is a NUL byte (D2). The reference is `wawu-join-` plus 18 bytes from `node:crypto` `randomBytes` (144 bits; no
  `Math.random` in the module); 40 draws in my run were all distinct. `Cache-Control: no-store` on all four routes.
- **Boot**: production mode with the REAL Flutterwave adapter (no stand-in; a minimal module, because a full production boot
  needs live Fintava and Nuvion settings and calling those hosts is forbidden): an empty or unset `FLUTTERWAVE_PUBLIC_KEY` gives
  503 `payments_unavailable` on register and the row count did not move (26 before and after); with a public key it answers 200
  with that key; no secret key, and a placeholder secret key, refuse to boot with the existing "FLUTTERWAVE_SECRET_KEY is
  missing or a placeholder" message. A malformed `event_offers` stops a real boot naming the field
  (`event_offers[0].price_kobo ... (it is 0)`, `event_offers[0].open_until ... (it is "garbage")`). The parse check over 27
  variants: `open_until` absent and `null` accepted, a valid date accepted; before or equal to `open_from`, garbage, empty
  string, `false`, `0`, no offset and 31 February refused; `price_kobo` 0, -1, 1.5, a string, missing and 3e9 refused; unknown
  tier, `tier_days` 0, upper-case id, duplicate id, unknown field, missing and non-list `event_offers` and an empty name
  refused; an empty list accepted (the link is then simply closed).

### Round 2

- **Open-ended offer**: the shipped offer answers 200 with `closesAt: null`. Before `open_from` it is 404 `no_open_offer`
  (current) and 409 `offer_closed` "has not opened yet" (register); at the instant `open_from` it opens; in 2090 it is still
  open. A dated offer is open at the closing instant and closed 1 ms later. With two open offers the dated one comes first,
  and the open-ended one remains after it closes. A present `open_until` is still validated at boot (above).
- **Throttles** (one address, the four routes at once): offer and status read 600 times and the 601st is 429; register and
  verify 300 and the 301st is 429; `x-ratelimit-limit-medium` says 600 and 300; the routes are counted apart (another route from
  the same address still answers, another address is untouched). `hub-rate-limits.contract.spec.ts` on the host network: 22 of 22,
  and the four routes are listed there with their exact figures.
- **The relaxed rate-limit rule (judged): acceptable.** Only a handler named `WaitlistPublicController.<method>` can use
  the new allowance, and the same spec pins the per-file count of `@Throttle(` (4 in that controller) and the exact figures of
  each of the four, so a fifth override, another route or a changed figure fails. My mutants: read limit 6000 (killed), `short:
  1000 a second` added to the write routes (killed), a 1000-a-minute `@Throttle` on `GET /plans` (killed by the count test).
  `short` is untouched: 60 offer reads in one instant from one address gave 20 answers and 40 429s. A burst of 600 in one
  minute from one address is therefore bounded by `short` (about 30 seconds to spend the 10-minute allowance); the offer read touches
  no database and the status read is one indexed lookup, so I judge it acceptable. What a venue will feel is the `short` limit (N3).

### Admin list and CSV

superadmin, finance and support: list 200 and export 200; reviewer 403 on both; the RS256 user token 401 on both; no token 401.
Paging: `perPage=2` pages 1 and 2 do not overlap, newest first, `pagination` block present; `page=0`, `-1`, `1001`, `abc`,
`perPage=0`, `101`, `1.5` and `status=bogus` all 400. `status=paid` returns only paid; the failed second payment is listed with
its transaction id and `paidKobo`. **CSV formula injection**: names, state and "what you make" of `=HYPERLINK(...)`, `+1+1`,
`-2+3`, `@SUM(1+1)`, a leading TAB, a leading CR, `=cmd|' /C calc'!A0`, and an email beginning `=`, read back with a quote-aware
parser: no data cell starts with `=`, `+`, `-`, `@`, TAB or CR (each is written with a `'` in front); the BOM, header and
`rowCount` match the lines. **Phone: the full number is the right choice** for the team that calls people back (only
superadmin, finance and support can read it); a masked phone would make the call-back impossible. The CSV writes every phone as `'+234…` (N4).

### Mutants (22 applied; each run against the specs that should catch it; `git restore`d; tree clean after)

Killed (17): V1 one kobo short of the fee accepted; V2 the webhook settles from the payload without asking Flutterwave; V3
sweep without its 48 hour bound; V4 sweep without its 5 minute floor; V5 purge keeps 1 day not 7; V6 reference of 8 bytes
(36 specs); V7 reviewer allowed on the admin list; V8 names not formula-guarded in the CSV; V10 status route returns the full
name; V11 an offer with no `open_until` treated as closed; V12 open before `open_from`; V13 read throttle 6000; V14 `short`
raised on the write routes; V15 another route loosened (`GET /plans`); V16 email not lower-cased; V17 Nigerian phone not
normalised (10 specs); V22 a failed lookup treated as paid in the sweep.
**Survived (5): all test gaps; the behaviour is right on the built server (checked by hand above).**
- V9 state and "what you make" not formula-guarded in the CSV. Kill it: put `=HYPERLINK(...)` into `state` and `makes` in `waitlist-admin.contract.spec.ts`.
- V18 `settle` stores the id the browser sent, not the one Flutterwave returned. Kill it: a stand-in whose `verifyCharge` returns another `transactionId` than asked; assert the stored one.
- V19 the paid write has no `status: pending` in its WHERE. Kill it: two concurrent verifies of one reference with two different valid ids; assert the first id and `paidAt` are kept.
- V20 the pre-write transaction-id check removed (the unique index and the post-write holder check remain): equivalent, defence in depth.
- V21 reusing a person's own pending row does not refresh the fee. Kill it: change `price_kobo`, register the same person again, assert the new amount.

### Defects

- **D1 · should fix (before the event, unless the webhook is confirmed live) · the re-check can leave a payer unregistered for two days.**
  `recheckPending` takes `RECHECK_BATCH` = 200 rows ordered by `createdAt` ascending and keeps no cursor or last-checked
  time. Once more than 200 `pending` rows sit in the 5 minute to 48 hour window, the same oldest 200 are looked up on every
  run and a newer payer is not reached until older rows are paid or leave the window. Reproduction (`t-sweep.mjs`, E8 to E10):
  205 abandoned pending rows plus one payer who paid and never came back (10 minutes old; Flutterwave scripted to say
  successful): run 1 `checked=200 paid=0`, run 2 the same, and still unpaid after the 205 were aged by 28 hours. Abandoned
  registrations are what a people-at-an-event form produces, and the sweep is the only net for a payer whose first webhook
  attempt failed or whose webhook is not set up. Impact: not lost (the pending row with phone and email stays 7 days and shows in
  the admin list), but unregistered for about 45 hours, and after a registration burst a payer can miss their window entirely. Fix: page through all
  due rows with a cursor inside one run (or order by a `lastCheckedAt`), keep the 10 second timeout, and add `waitForCompletion: true` to the cron.
- **D2 · should fix (low) · a NUL byte gives 500, not 404 or 400.** `GET /waitlist/registrations/wawu-join-<36 hex>%00` and
  `POST /waitlist/registrations/verify` with a NUL in `reference` answer 500 "Something went wrong" instead of the same 404 as every
  other miss; a NUL in `fullName`, `state`, `makes` or `email` on register is also a 500 (Postgres refuses `0x00`). Each writes a
  20-line ERROR stack (no phone or email in it). Reproduction: `t-nul.mjs` N1 to N6. Fix: `byReference` returns null unless the
  reference matches `^wawu-join-[0-9a-f]{36}$`, and a text field containing `\u0000` is refused 400 or stripped in `tidy`.
- **D3 · should fix (copy) · "You have not been charged again" is untrue after a second payment.** `refuseDuplicate` and the
  verify of a `failed` row answer 409 `already_registered` with "You are already registered for this event. You have not been
  charged again." For a payer whose second payment was just kept for a refund that is false: they were charged. At register time the sentence is right. Fix: a distinct
  message or code on the verify path ("You are already registered. This second payment will be refunded; contact support with
  your reference"), and JOIN-02 must not show "no charge" for an `already_registered` that comes back from verify.

### Notes (none stops the release)

- **N1** An overpayment is accepted and recorded (`paidKobo` above `amountKobo`); nothing flags it for a refund, the team compares two columns.
- **N2** The two crons have no overlap guard (`waitForCompletion`, a lock); safe because the write is conditional (proved with two sweeps at once). The other crons in this backend have none either.
- **N3** `short` (20 a second per route per address) is untouched, so a venue of several hundred people scanning at once behind
  one Wi-Fi address gets 429 on `GET /waitlist/offers/current` above 20 page loads a second. A scan spread over 30 to 60 seconds is under
  that; "scan now" from a stage may not be. JOIN-02's page should retry a 429 after a short random wait. Unclear whether the owner wants `short` relaxed for the offer read (it needs another change in the rate-limit spec).
- **N4** The CSV writes every phone as `'+2348…` with a leading apostrophe (the formula guard treats `+` as dangerous). The phone
  is server-normalised to `+` and digits so it cannot be a formula, but the apostrophe shows in Excel and Sheets and is copied into a dialer. Cosmetic.
- **N5** Six simultaneous registers of one person (a double tap) produced 3 pending rows and 3 references (no unique key on pending). Harmless: whichever is paid wins; a second paid one is kept `failed` for refund.
- **N6** A paid registration is claimable by phone or email and neither is proven at payment: anyone can pay for another person's phone or email, and the real owner is then told `already_registered`. JOIN-03's claim must verify the claimer holds that phone or email.
- **N7** A foreign number written with a bracketed trunk zero (`+44 (0)7700…`) normalises to a different E.164 than `+44 7700…`, so one-per-phone is bypassed for those; the email check still holds. `00234…` for a Nigerian number is refused as invalid (the person retypes).
- **N8** The existing webhook logs the full `wawu-join-` reference in its error and warn lines (`Webhook <event>:<reference> failed (retryable)`). It is not personal data but it is the key to the status and verify routes. No phone or email is logged anywhere (grep).
- **N9** Every verify of a `pending` reference asks Flutterwave once (300 a 10 minutes per address); a known pending reference can be used to spend Flutterwave API calls. Low.
- **N10** The mock Flutterwave adapter (non-production, no key) keys its charges by its own `initCharge` tx_ref, but this task uses its own reference, so on a dev box without a stand-in a registration can never be confirmed. Production refuses the mock. Only an EMPTY public key is guarded (503); a placeholder public key would be handed to the page.

### NOT RUN

- A real Flutterwave payment and a real `verify_by_reference` answer. Unblocked by one test-mode payment with `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY` and `FLUTTERWAVE_SECRET_HASH` set on the server and the dashboard webhook pointing at `/api/hub/webhooks/flutterwave`. One question matters most: when one tx_ref has a failed attempt and then a successful one, does `GET /v3/transactions/verify_by_reference` return the successful one? The sweep (and so D1's cost) depends on it. Unblocked by paying once with a declined card and then a transfer on the same reference, with the webhook switched off.
- A full production boot of `AppModule`: it needs live Fintava and Nuvion settings and would risk those hosts. Run instead: the real `WaitlistModule` with the real Flutterwave adapter in production mode (above).
- A load test of the venue case (N3). Unblocked by a script firing 200 page loads in 10 seconds from one address at the deployed server.
- The JOIN-02 page and the JOIN-03 claim: other tasks.

## Lead merge note (10 Oct 2026)

Merged 10 Oct 2026 as backend #99 (9311447) on the independent verifier's review (mobile bd51855, no blocker). Should-fix D1 (the 5-minute re-check pages only the oldest 200 pending rows), D2 (a NUL byte answers 500) and D3 (verify-time already_registered copy) follow in JOIN-01 round 3 before the event. Owner answers of 10 Oct folded in: the link stays open until the owner says (no open_until), the plan's days start at claim in the app (JOIN-03), the page shows no plan length.

## Round 3 (builder, 10 Oct 2026)

Backend `wmt/JOIN-01-r3` `f38bfcd` (two commits on main `9311447`), mobile `wmt/JOIN-01-r3` (this file, on main `ed5eb3f`).
The verifier's three should-fix defects, and the five surviving mutants; nothing else. No route, contract shape or
throttle moved, and `contract/openapi.json` is byte-identical after `npm run contract:build` (no message string of these
three is in the contract). No Flutterwave, Fintava, Nuvion, wawuafrica.com or AI host was called. Status stays `done`.

| | Closed by | Proved by (the verifier's drivers, same built server, before then after) |
|---|---|---|
| D1 | `recheckPending` walks ALL due pending rows (5 minutes to 48 hours old) in one run, `RECHECK_PAGE` (200) at a time, with a keyset cursor on (createdAt, id); a lookup error on one row is logged and the run goes on; the cron has `waitForCompletion: true`; the paid write is still conditional, so two servers stay safe | `t-sweep.mjs` E8 to E10 on the unfixed build: `checked=200 paid=0` in run 1 and run 2, payer still pending. Fixed build: `checked=206 paid=1`, payer paid in the FIRST run, run 2 `checked=205 paid=0`. Own driver `t-d1.mjs`, 205 abandoned rows plus a payer on page 1 and one on page 2, once with spread created times and once with one shared created time: 207 rows looked up once each, both payers paid in run 1, one unreachable lookup in the middle of page 1 did not stop it. Real scheduler (`ScheduleModule`) with a slow sweep: 3 ticks during one run start 1 run with the option, 3 without |
| D2 | `byReference` answers null (no query) unless the reference is `^wawu-join-[0-9a-f]{36}$`; a character below U+0020 (NUL included, no exception) in `fullName`, `email`, `state` or `makes` is a 400 in plain words | `t-nul.mjs` N1 to N6 failed on the unfixed build (500 each); all pass on the fixed build. `t-d2.mjs`: 12 odd references (NUL, upper case, 35 and 37 hex digits, non-hex, trailing newline, leading space, 500 characters) on the status route, and the 11 within the 100-character limit on the verify route, are byte-identical to the unknown-reference 404; register with NUL, bell, tab, line feed, carriage return, U+001F in each of the four fields is 400; emoji, accents and an ordinary name still 200 |
| D3 | `alreadyRegistered()` (verify-time, a payment already taken) now says "You're already registered. This extra payment will be refunded. Email support@wawuafrica.com with your reference."; the register-time sentence is unchanged | `t-d3.mjs` on both builds: before, the second payer's verify answered "You have not been charged again"; after, the new words in `reason.message` and `message`, again on a second ask, and register still gives the old sentence |

**Specs (src/waitlist, 7 files, 111 of 111: the 91 plus 20 new).** Mutants, each run against the spec that should catch it, source restored from a copy after, tree clean:

| Mutant | Result |
|---|---|
| D1 stop after the first page | killed (4 tests) |
| D1 cursor drops the id tie-break (rows with one created time skipped) | killed (2) |
| D1 cursor by id only | killed (4) |
| D1 offset paging (`skip`) instead of a cursor | killed (4) |
| D1 cursor re-reads the last row (`gte`) | killed (4) |
| D1 one row's error stops the run | killed (4) |
| D1 cron without `waitForCompletion` | killed (the new `waitlist-sweep-cron.spec.ts`) |
| D2 old guard (prefix and length only); guard without the end anchor | killed (3 each) |
| D2 no control check on name, email, state or makes (four mutants); tab, line feed, carriage return let through; U+001F let through | killed (6, 6, 6, 6, 3, 1) |
| D3 old message back | killed (1) |
| V9 CSV state, and makes, not formula-guarded | killed (1 each) |
| V18 stored transaction id is the browser's, not Flutterwave's | killed (1) |
| V19 paid write without the `pending` pre-state | killed (1) |
| V21 reused row keeps the old fee | killed (1) |
| V20 pre-write transaction-id check removed | survives, equivalent as the verifier said: the unique index and the holder check give the same 409; the only difference is one more `verify` call at Flutterwave. Left as asked |

**Decisions** (Default (agent), owner may override)
- "A control character" is any character below U+0020 with no exception, as the brief says. A tab, line feed or carriage return in a
  name, email, state or makes is now a 400; before, the name's white space was collapsed and the email trimmed (the verifier's
  "trailing newline" email spelling is now `email_invalid`). A browser text field cannot send these.
- The name answers `name_invalid` and the email `email_invalid`, which the contract already lists. State and makes answer a plain
  400 with no `reason.code` (the contract's "a malformed body has no `reason`"), because a new code would change the contract text.
  JOIN-02 must not depend on a code for those two fields.
- `POST /waitlist/registrations/verify` with a reference over 100 characters or empty still gets the body validation's 400, not
  the 404: `reference` is `minLength 1, maxLength 100` in the contract and this round moves no contract shape. It reveals nothing
  about any registration. The status route has no such limit and answers the 404 for any length.
- `RECHECK_BATCH` is renamed `RECHECK_PAGE` (it is a page size now, not a cap on the run).

**Checks.** `tsc --noEmit` 0. eslint 0 and prettier clean on the 7 changed files. `src/waitlist` 111/111; `src/payment-webhook`
17/17; `hub-rate-limits.contract.spec.ts` 22/22 on the host network. Protected suite `run.sh --fresh HEAD` 253/253 ("all 244
required tests passed") at `f38bfcd`, lock `origin/main` `9311447`, lock files untouched, tripwire 0 added lines. Gates: 16 fail and
72 warn on main and on the branch, the sorted FAIL lines identical (the first run showed a 17th: the paging note said "is never
read", which the deferrals gate takes for dead code; reworded). `npm run contract:build` exit 0, `contract/openapi.json`
unchanged. Secret scan of the diff: no key-shaped string. No em-dash added.

**NOT RUN**
- The full backend suite (229 suites): not in this round's check list; the touched code is reached only from `src/waitlist` and the
  webhook's `wawu-join-` branch, both run above. Unblocked by `npm run test:contract` in a private network namespace.
- Two servers running the cron at once: unchanged from round 1 (the verifier ran two sweeps together over the same rows, all paid
  exactly once). The paid write was not touched.
- A real Flutterwave `verify_by_reference` answer (round 1's open question): unchanged, needs one test-mode payment.

## Verifier report, round 3

Verifier, 10 Oct 2026 (independent session; wrote none of this). Backend `wmt/JOIN-01-r3` `f38bfcd` (detached worktree `/home/user/wt/vb-JOIN-01r3`)
on `origin/main` `9311447`, which did not move during the run (checked at the start and again before the push). Mobile `wmt/JOIN-01-r3` `98be230`.
Evidence: the lead's scratchpad `vjoin01r3/` (`out-*.txt`, `mut-run*.txt`, `mut/`, driver `.mjs` files). The real `AppModule` built from the branch
(`dist/`), real Postgres (`vj01r3_` databases, dropped at the end), Flutterwave stood in at the two DI seams, every call over HTTP. No Flutterwave,
Nuvion, Fintava, wawuafrica.com or AI host was called. The diff against main is 7 files, all in `src/waitlist` (611 added, 40 removed), exactly the
builder's list; no migration, no controller, no DTO, no contract file.

**Verdict: merge. No blocker.** D1, D2 and D3 are CLOSED on the built server under my own layouts. One new should-fix (low, N1), six notes (N2 to N7), and
three surviving mutants (test gaps; the built behaviour is right for all three).

| Defect | Result | Evidence |
|---|---|---|
| D1 the re-check reaches every due row | CLOSED | round 1's `t-sweep.mjs` E8 unchanged: `checked=206 paid=1` in run 1 (was `checked=200 paid=0`), E9 run 2 `checked=205 paid=0`. My layouts (`v-d1.mjs`, `v-d1b.mjs`, `v-d1c.mjs`): 1,000 rows with distinct created times and 5 unreachable lookups at the page edges and middle; 1,000 rows with ONE shared created time; 801 rows in clusters of 200 per created time; 650 rows with odd ids (mixed case, hyphen, underscore) at one time; 0, 199, 200, 201 and 400 rows. Every row looked up exactly once (counted per reference at the stand-in), exactly the payers paid, nothing `failed` |
| D1 during the run | CLOSED | 600 rows stretched to about 20 s: five registrations made during the run are not looked up (too young); a due row inserted ahead of the cursor is looked up in the same run; one inserted behind it is not reached (no loop back) and is paid by the next run; a row paid by the browser mid-run on a page not yet read is not looked up; on the page already in memory it is looked up once and stays paid with the browser's transaction id, no `failed` twin; a row deleted mid-run and a lookup that throws do not stop the run |
| D1 no overlap, paid write | CLOSED | three sweeps at once over 1,048 rows with 40 payers: all 40 paid exactly once, 40 distinct transaction ids, 200000 kobo each, no `failed` row (round 1's `t-overlap.mjs` 2 of 2 as well). The real `waitlist-recheck-pending` job object (`waitForCompletion: true`, `*/5 * * * *`): four ticks during one run started one run (30 lookups, never 2 in flight), the next tick after it ended ran again. Real scheduler, no fire-by-hand: 200 rows at 4 s each, run 04:10:00 to 04:23:20, the 04:15 and 04:20 ticks started nothing (smallest gap between lookups 4,000 ms, 1 in flight at most), the 04:25 tick began a new run |
| D2 references | CLOSED | `v-d2.mjs`: 33 odd references (NUL at the end, start and middle, NUL alone, upper-case hex, upper-case prefix, a real reference upper-cased, 35 and 37 hex, a real reference plus or minus one digit, non-hex, Cyrillic, fullwidth and Arabic-Indic digits, Unicode and non-breaking hyphens in the prefix, trailing LF, CRLF, space, tab, leading space, 100, 101, 500, 3,000 and 12,000 characters, prefix only, quote, `%`, `_`, `/`) on the status route (plus 3,000 and 12,000 characters; `..` is rewritten into another URL by the HTTP client, so it is not counted) are 404 and byte-identical to the unknown-reference answer; the same on verify, except empty and over 100 characters, which are the documented 400. Raw `%00`, `%2500`, `%0A`, `%2F`, `%5C` are the same 404. Database scan counters on `WaitlistRegistration` (index and sequential) before and after the whole batch: 1272 and 1272 (a control request for a well-formed unknown reference moved it to 1274). Round 1's `t-nul.mjs` N1 to N11 all pass |
| D2 text fields | CLOSED | `v-d2b.mjs`: each of 12 control characters (NUL, 01, bell, backspace, tab, LF, VT, FF, CR, ESC, 1C, 1F) at the start, middle and end of fullName, email, state, makes: all 400 with plain words, none 500 (name `name_invalid`, email `email_invalid`, state and makes no `reason`). A NUL last in a 100-character name, a 254-character email and a 60-character state or makes: 400. Ordinary names (Yoruba tonal marks, umlaut, Cyrillic, Chinese, apostrophe, hyphen) still 200 |
| D3 words | CLOSED | `v-d3.mjs` and round 1's `t-person.mjs` D7: the second payer (same phone, then same email) gets 409 `already_registered` with the new sentence in `message` and `reason.message`, on the first ask and on every later ask (also with a made-up transaction id), the row kept `failed` with its transaction id and 200000 kobo; four simultaneous taps, the sweep path and a double tap staggered to reach the lost-race branch all give the new words or end `failed`; a declined or short payment is NOT told "refunded" (`payment_not_confirmed`, `payment_mismatch`); the register-time refusal is unchanged to the word. The address `support@wawuafrica.com` is the live support address (`docs/release/PLAY-LISTING.md` lines 19, 78, 138) |

**Round 1's drivers, unchanged, against the fixed build.** `t-sweep` E1 to E9 pass (E10 is info), `t-nul` 11 of 11, `t-overlap` 2 of 2, `t-money` 37 of 37,
`t-webhook` 18 of 18 (my copy had the old hash string; fixed in the driver, not the server), `t-throttle` all pass (600 and 300 in the window, the next call 429,
`x-ratelimit-limit-medium` 600 and 300, another route and another address untouched, `short` still 20 a second), `t-admin` 30 of 30. `t-person` passes except C2:
an email written with a trailing newline is now 400 `email_invalid` (it was trimmed and accepted). That is the builder's disclosed choice, judged below.

**The builder's choices, judged.**
- A character below U+0020 refused with no exception (tab, LF, CR too): acceptable, it is what the brief asked for and it is the only rule that cannot be argued around. Cost: it is asymmetric with spaces. A trailing or leading space in the email or the name is still trimmed, but a trailing tab or newline from a paste is a 400, and for the email the words are only "Enter a valid email address.", which does not say why a visually correct address fails (N5).
- State and makes answer a plain 400 with no `reason.code`: acceptable (the contract already says a malformed body has no `reason`); the words differ per field ("Your state has..." and "What you make has...") so a page can show the right one.
- Verify with an empty or over-100-character reference stays the validation 400: acceptable, it reveals nothing and no contract shape moves.

### Checks

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| eslint on the 7 changed files; prettier | 0 problems; clean |
| `src/waitlist` and `src/payment-webhook` | 9 suites, 128 of 128 (111 and 17) |
| `hub-rate-limits.contract.spec.ts` (host network) | 22 of 22 |
| protected suite `run.sh --fresh HEAD` (code `f38bfcd`, lock `origin/main` `9311447`) | 253 of 253, "all 244 required tests passed" |
| gates | 16 fail on main and on the branch, the sorted FAIL lines identical (file and line), 72 warn on both; files scanned 1036 and 1037 |
| `npm run contract:build` | exit 0; `contract/openapi.json` byte-identical to before and to main |
| tripwire, em-dash, key scan on the added lines | 0 added lines match the tripwire; 0 em-dashes; no key-shaped string (the long strings are URL paths) |
| migrations | none |
| mobile `npm run check` (this branch with the report) | exit 0 on the first run: 109 suites, 1,852 tests, gates 0 fail; the known `eventsScreens` flake did not occur |

### New findings

- **N1 · should fix (low) · a payer who tries again after 48 hours is outside the re-check, and a row re-registered a moment ago can be purged.** Registering again with the same phone and email reuses the person's pending row and keeps its first `createdAt`. The re-check window (5 minutes to 48 hours) and the purge (7 days) both count from that first time. Reproduction (`v-reuse.mjs`): a pending row backdated 3 days, the same person registers again (same reference), Flutterwave says paid by reference, the sweep answers `checked=0` and the row stays `pending` (U2); a row backdated 8 days and re-registered seconds ago is deleted by the next purge (U3). It is not from this round (main has it) and I found it hunting for an input that makes the run skip a row. It bites only when the payer closes the page after paying AND the webhook fails or is not set up, the same condition as D1, and only for someone returning after 2 days. Fix: set `createdAt` to now when a pending row is reused (the admin list stays newest first), or window the sweep and the purge on `updatedAt`.
- **N2 · note · the lookup treats every 4xx as "no transaction yet", silently.** `waitlist-payment-lookup.ts` returns null for any status from 400 to 499 with no log, so a rate limit (429) or a revoked key (401, 403) reads as `checked=N paid=0`. Not changed this round, but D1 raised the exposure: one call per due row per run, up to 576 runs in the 48 hours (an abandoned row is asked about about 576 times). Unblocked by Flutterwave's published limit for `verify_by_reference` on this account (NOT RUN); a small fix is to throw on 429, 401 and 403 so the existing per-row warning appears.
- **N3 · note · a run now takes as long as the walk.** The lookups are one after another. Measured: 200 rows at 4 s is 13 min 20 s per run, the ticks inside it are skipped. At about 0.5 s a real call, 1,000 due rows is about 8 minutes, and a payer registered 5 minutes ago is reached near the end. Fine at event scale; a small pool of 5 lookups, or skipping rows looked at in the last few runs, if abandoned rows reach thousands.
- **N4 · note · more of the NUL class on routes the round did not list.** A signed webhook delivery with a NUL in `tx_ref` or `data.id` is 500 from `payment-webhook.service.ts` (the receipt write; Flutterwave cannot send one, a caller needs the shared secret). `GET /admin/waitlist/registrations` and `/export` with `offerId=%00` are 500 (admin tokens only). Neither is a registration route.
- **N5 · note for JOIN-02 · trim before sending.** The page should trim the fields or use an email input (a browser strips surrounding white space and line breaks from one), because a tab or newline from a paste is now a 400 and the email words do not name the cause.
- **N6 · note · the phone still accepts tab, LF, VT, FF and CR** (stripped as white space, the stored phone is digits and `+` only; every other character below U+0020 in the phone is 400). Harmless; the only text field with a different rule. Characters from DEL up (DEL, C1 controls, zero-width space, right-to-left override, line and paragraph separators) are accepted in name, state and makes and none gives a 500.
- **N7 · note · the refund promise is manual.** "This extra payment will be refunded" is backed by the `failed` row in the admin list with its transaction id and amount and a warning line in the log; nothing tells the team when one appears. The status route answers 200 `status: "failed"` with the first name for such a row, so JOIN-02 must show the sentence, not an error, and must show the 46-character reference with a copy button. Also: a bad percent escape on the status route (`%`, `%ED%A0%80`) is the framework's 400 "Failed to decode param", not the 404 (same on every route in the app, reveals nothing).

### Mutants (18 of my own, applied one at a time to the source, run against `waitlist.contract.spec.ts` and `waitlist-sweep-cron.spec.ts`, `git checkout`ed after; tree clean)

Killed (15): P1 cursor id tie-break reversed (`id < cursor`; would never end) ; P2 cursor loses the later-created-time branch ; P3 a lookup error ends the rest of its page (`break` in the catch) ; P4 cursor taken from the second-last row ; P6 `checked` counts only rows whose lookup did not fail ; P7 a page of exactly 200 ends the run ; P8 pages after the first forget the due filter ; P9 the first page ignores the status filter ; C1 the cron loses `waitForCompletion` ; G1 control check skips the last character ; G3 reference accepts upper-case hex ; G4 reference accepts 36 or 37 digits ; G5 state checked with makes' value ; G6 reference trimmed before the shape test ; D3a the failed-row path in verify keeps the old words.

**Survived (3), all test gaps; the built behaviour is right for each (checked by hand above).**
- P5 window floor inclusive (a row exactly 48 hours old is looked up). Boundary only. Kill it: seed a row created exactly `RECHECK_UNTIL_MS` before the `now` passed to `recheckPending`; assert it is not looked up.
- G2 control check reads only the first 60 characters. Would bring back the 500 for a NUL late in a 100-character name or a 254-character email. Kill it: a NUL as the last character of a maximum-length name and email in `waitlist.contract.spec.ts`. The built server answers 400 (`v-long.mjs`, 7 of 7).
- D3b the lost-race path in `settle` (`updateMany` count 0, row now `failed`) keeps the old "not charged again" words. It is reachable by a real double tap: with a mutant build, two verifies of one second-payer reference 150 ms apart and a 400 ms Flutterwave answer gave the second tap the OLD sentence (`v-d3race.mjs`); the branch as built gives the new one. Kill it: use the harness's `holds` to put one verify behind another and assert both sentences.

### NOT RUN

- The full backend suite (229 suites): not in this brief's list. Unblocked by `npm run test:contract` in a private network namespace.
- Paging on a database with a locale collation (en_US). This machine has only `C`, `C.utf8` and `POSIX` (`locale -a`); my databases are `C.UTF-8`. The cursor and the order both use the column's own collation, so they agree under any collation, but it was not run. Unblocked by a Postgres with `en_US.utf8` and `v-d1.mjs` layouts B and D.
- A real Flutterwave `verify_by_reference` answer, including how it answers a rate limit (N2) and how long one call takes (N3): needs one test-mode payment and a timed call.
- Two server processes each running the cron: I ran three sweeps at once on one server over one database, which is the same race on the same conditional write; the claim is not different, but a second process was not started.
- Round 1's open question (a failed attempt then a successful one on one tx_ref): unchanged, needs a test-mode payment.

## Round 4 (builder, 10 Oct 2026)

Backend `wmt/JOIN-01-r4` `d317094` (two commits on main `0694ced`: `e708227` the new reference, `d317094` the unique access code), mobile
`wmt/JOIN-01-r4` (this file, on main `e43ec89`). One payment-safety change: `POST /waitlist/registrations` never reuses a pending row, so
every checkout has its own reference; and the lead's addition of the same round, the launch access code unique across all registrations
(its own section below). Status stays `done`. No Flutterwave, Fintava, Nuvion, wawuafrica.com or AI host was called (Flutterwave stood in at
the two DI seams in the specs and in the walk). Files: `src/waitlist/waitlist.service.ts` (the reuse lookup and its update are gone;
`register` always creates, and redraws on a taken access code), `src/waitlist/waitlist-public.controller.ts` (the route's doc comment),
`src/waitlist/tests/*` (the contract spec, the admin spec, the harness), `contract/openapi.json`, and for the access code `prisma/schema.prisma`,
the migration `20261018140000_waitlist_access_code`, `waitlist-random.ts`, `waitlist-config.ts`, `waitlist-contact.ts`, `waitlist-core.module.ts`,
`waitlist-export.ts`, `waitlist-view.type.ts`. No route, status code, reason code, throttle or config moved.

**Why.** A reused reference could carry two Flutterwave transactions (the person pays, the page is reloaded, they start again with
the same details, and the checkout runs on the same tx_ref). The re-check finds a payment by its reference, so it could settle one
and never show the other, and the second charge was invisible to the server (round 3's N1 for the page, JOIN-02 round 4's finding for
the backend). With a new reference per start each transaction has its own reference: the re-check, the webhook and the browser's verify
find it, and the existing rule decides what happens when one person has two successful payments.

**What stays as it was, and is still held by specs.** A phone or email that already PAID is refused before any charge (409
`already_registered`, `initCharge` never called). At most one `paid` row per offer per phone and per email (the two partial unique
indexes). A second successful payment by the same person becomes `failed` with its transaction id and amount, is kept (never purged) and
shows in the admin list. The 5-minute re-check walks every due pending row (5 minutes to 48 hours, all pages). Pending rows older than 7
days are deleted. Verify, status, webhook, sweep, purge code are untouched.

**Round 3's N1 is gone with the reuse code.** N1 was: a reused pending row kept its FIRST `createdAt`, so a person who started again
after 48 hours was outside the re-check window and a row re-registered seconds ago could be purged (8 days after the first start). No row
is reused now, so every row's re-check window and 7-day purge age count from its own start. A spec holds it: the first row is byte for byte
unchanged (fields and times) after a second start with the same details.

**Contract text (first commit, and why).** The register operation's `summary` in `contract/openapi.json` said "Reuses this person's own
unpaid registration (same offer, phone and email) rather than adding another." That sentence would now be false, so it reads "Every call
that passes the checks adds a new registration with a new reference, even for the same offer, phone and email, so each checkout has its
own reference." (It comes from the controller's doc comment.) No path, schema, status code or reason text moved with it. The access code
adds one field (next section). `npm run api -- --backend` copies backend main (`0694ced`), so mobile's copy is unchanged until the
backend merges; no type moves on this branch.

### The launch access code is unique across all registrations (the lead's addition, `d317094`)

The short reference each payer sees ("XXXX XXXX", the first 8 hex characters after `wawu-join-`) is what they redeem their launch discount
with, so no two registrations may share it. Built as asked, with one choice of mechanism (below):
- **Migration `20261018140000_waitlist_access_code`** (sorts after main's newest, `20261018100000_event_waitlist`; additive; `rollback.sql`
  beside it and the same steps in its header): `WaitlistRegistration.accessCode`, a stored column Postgres computes as
  `upper(substr(reference, 11, 8))`, and the unique index `WaitlistRegistration_accessCode_key`. `prisma/schema.prisma` declares it
  `String @unique @default(dbgenerated())`; `prisma migrate diff` of the migrated database against the schema shows nothing for it.
- **Backfill:** adding a generated column fills every existing row (no UPDATE; no code anyone holds is rewritten). **If any existing rows
  already share a code, the migration stops** with an exception ("N code(s) are shared by M existing registration(s), P of them paid.
  Nothing was changed. Report this to the lead") and changes nothing; it never picks a winner. The check to run against production before
  merging: `SELECT upper(substr("reference", 11, 8)) AS code, count(*), count(*) FILTER (WHERE "status" = 'paid') AS paid FROM
  "WaitlistRegistration" GROUP BY 1 HAVING count(*) > 1;` (not run here: no production access; an empty result means the migration passes).
- **Collision retry:** `register` inserts the row with a fresh random reference; if the database refuses it (a unique violation: the
  derived code, or the reference itself, is taken) nothing was written and a new reference is drawn, up to `REFERENCE_ATTEMPTS` (5), then
  503 "We could not start your registration just now. Please try again in a moment." with nothing written (no new reason code; the contract's
  503 text is unchanged). Each draw collides with probability (rows / 2^32), so the 503 cannot happen in practice. The random source is
  injectable (`WAITLIST_RANDOM`, default `crypto.randomBytes`) so a spec can force the collision.
- **Admin:** the list item gains `accessCode` ("XXXX XXXX") and the CSV an "Access code" column, formatted the same, just before
  "Reference". Nothing else in either changes; the page derives the code from the reference as it does now.
- **Migration proven by hand on a scratch database** (`join01r4/logs/migration-proof.log`): rollback drops index and column; two old rows
  sharing a code (one paid) make the migration stop, naming 1 shared code, 2 rows, 1 paid, and the column is absent afterwards; with the
  collision removed it applies and backfills (`AAAA1111`, `BBBB2222`); a second row with the taken code is refused (23505), also when only
  the case differs; a row inserted without naming the column (the previous app version) gets its code; writing the column is refused
  ("can only be updated to DEFAULT"); rollback then apply again is clean.
- **Specs** (`the launch access code is unique across all registrations`, 5 tests in `waitlist.contract.spec.ts`, plus the admin spec):
  the stored code is the first 8 characters, upper-case; a scripted random source makes the second start's first draw carry a taken code
  and the second draw a free one: 3 draws, the colliding reference was never stored, the checkout carries the stored reference; a code
  taken by a PAID registration is taken too; five taken draws in a row give 503 with nothing written (exactly `REFERENCE_ATTEMPTS`
  draws); the database refuses two rows with one code (tail differs, case differs) and refuses a written code. The admin spec checks
  `accessCode` on every listed row and the CSV header and cell.
- **Mechanism choice (Default (agent), the lead may override):** a GENERATED column rather than a column the app writes. The lead's
  example was "a stored accessCode column, upper-case, with a unique index"; this is that, and in addition it cannot disagree with the
  reference, backfills itself, and keeps the app version still running during a deploy working (a NOT NULL column the old version does not
  know would fail every registration until the new one is live; a nullable one would leave those rows outside the uniqueness). Cost: the
  table is rewritten once when the column is added (a table of a few thousand rows, a lock for the length of that rewrite).

### Before and after: the JOIN-02 reproduction (`sa.mjs`), on the round 4 page

The page is the website at `origin/wmt/JOIN-02-r4` (`4a3f959`), production build, against the real `AppModule` built from each backend
(`dist/`), real Postgres (`bj01r4_test_join`), Flutterwave stood in strictly (a transaction exists only if the browser stand-in made it).
`sa.mjs` itself stops at its first check on this page: since round 4 the page does not draw "Start again" for five minutes (that is the
page's fix), so the same story is `sa4.mjs` (same steps, page clock faked: reload with the window open and money moved, five minutes,
Start again, confirm, the same details, Pay). Scripts and logs: the lead's scratchpad `join01r4/` (`v/sa4.mjs`, `v/s20.mjs`, `logs/sa4-before.log`,
`logs/sa4-after.log`, `logs/sa4-after-2.log`, `logs/s20-after.log`, `logs/s20-after-2.log`, `logs/migration-proof.log`, `logs/r4-regress.log`).

| | Before (backend `0694ced`) | After (backend `e708227`, and again on `d317094`) |
|---|---|---|
| The same details registered twice over HTTP | one reference both times, one pending row | two references, two pending rows |
| B: reload with the window open, money moved (1 transaction on A), 5 minutes, Start again, same details, Pay | the server answers reference A again; the page's guard opens no window ("A payment you started with these details has not been settled yet, so we have not opened a new one"); 1 reference, 1 transaction (A); the person is held until A is paid by the re-check | a window opens on a NEW reference B; the person pays; verify of B is paid and the page shows "You're registered"; references 2, transactions 1 on A and 1 on B; the re-check then finds A: rows `paid` (B) and `failed` (A, 200000 kobo and its transaction id kept for a refund) |
| C: the same, but the re-check settles A while B's window is open | not reachable (no second window) | A `paid`, B `failed`; the page, polling B, shows "You're already registered. This extra payment will be refunded. Email support@wawuafrica.com with your reference ..." |
| Money truth | the round 3 page (`233d6b1`) on this backend charged twice against one reference: 2 transactions, the second invisible to the server (JOIN-02 round 4 builder's `sa-before.log`, not re-run here) | two references, two transactions, one `paid` row, one `failed` row in the refund list; the person sees "You're registered" or the refund screen, never a silent second charge |

`sa4.mjs` after: 11 of 11 checks pass (A1, A2, B1 to B6, C1 to C3; B6 reads the stored access code and finds it on the page and on one row only;
run again on the final build, `sa4-after-2.log`). Before: the 10 checks it had then all fail, by design (they state the after behaviour); the
printed lines in `sa4-before.log` are what happened.

**20 starts by one person (`s20.mjs`, same server):** 20 starts give 20 different references and 20 pending rows; the re-check (one run)
looked up each of the 20 by its own reference exactly once (20 lookups, 20 distinct); the one that Flutterwave had as paid was settled
and the other 19 stayed pending; with the 19 aged 8 days the purge deleted 19 and kept the paid row. 5 of 5 checks (again on the final
build, with the access-code migration applied: 5 of 5).

**The round 4 page's own walks on the new backend (`r4.mjs s1 s3 s4 s5 s6`):** 14 of 14 pass (re-check settles a late payer, Start
again with another email, paid between the button and the tap, status route unreachable at the tap, a kept duplicate shows the refund screen).
`s2` and `s2b` assert the page's held screen for a reference the server hands back again; with this change the server never does, so
that screen cannot be reached from the backend and those two were not re-run (the page compares references, so it needs no change).

### Specs (`src/waitlist`, `src/payment-webhook`: 9 suites, 137 of 137; `waitlist.contract.spec.ts` 75, was 66)
- Rewritten: "reuses this person's own unpaid row" is now "every start is a new registration": the same details twice give two rows and two
  references (`wawu-join-` + 36 hex), each checkout's `txRef` is its own reference, the second start's corrected name and state are on the
  second row only, the first row is unchanged (the N1 check), another email is another person as before. "A person's own unpaid row is
  charged today's fee" is now "a start after the price was changed asks today's fee on its own new row, and the earlier row keeps the
  fee it asked", and a short payment against the new row is 422.
- New (`starting again with the same details`): a person who pays on two references is registered once (verify A 200, verify B 409 with the
  refund words, A `paid`, B `failed` with its transaction id and 200000 kobo, the status route says `failed`); both payments reaching the
  re-check leave one `paid` and one `failed`, each found by its own reference; a payment on the first reference, never confirmed, is found
  by that reference after the person started again, and a third start is then refused before any charge; 20 starts leave 20 pending rows,
  the re-check looks up each by its own reference, the paid one is settled, the purge removes the 19 unpaid after 7 days and keeps the paid one.
- New (`the launch access code is unique across all registrations`, 5 tests), described above. The sweep spec's burst helper now gives every
  direct-insert row its own access code (its references used to share their first 8 characters).

### Mutants (each applied alone, the contract spec and, for the A mutants, the admin spec run, source restored, tree clean after; logs `join01r4/mut-*.log`)
| | Result |
|---|---|
| M1 the reuse code brought back (same details answer the same pending row) | killed (6 tests) |
| M1b the reference derived from phone and email (same details, same reference) | killed (6) |
| M2 the paid-uniqueness indexes dropped (phone and email), recreated after | killed (6) |
| M3 the second payment not kept as `failed` (left pending) | killed (3) |
| M4 the unique violation on the paid write not turned into the kept-for-refund path | killed (4) |
| M5 the re-check looks up one row per phone only | killed (6) |
| M6 the purge keeps unpaid rows 30 days, not 7 | killed (2) |
| A1 the access-code unique index dropped, recreated after | killed (4) |
| A2 no retry: a taken code is thrown, not redrawn | killed (3) |
| A3 the retry bound is one too many | killed (1) |
| A4 the CSV has no Access code column | killed (1) |
| A5 the code shown without the space | killed (2) |
| A6 the stored code computed lower-case (column regenerated with `lower()`, restored after) | killed (3) |

### Checks
`npx tsc --noEmit` exit 0. eslint (`--no-fix`) 0 problems on every changed `.ts` file; prettier clean. `src/waitlist` and `src/payment-webhook`
137 of 137 (above), and with `src/tests/hub-rate-limits.contract.spec.ts` on the host network 159 of 159 (22 of 22 for the rate-limit spec; no throttle
moved). Protected suite `scripts/protected-routes/run.sh --fresh HEAD` in a private network namespace on `d317094` (the fresh database applies the new
migration), lock `origin/main` `0694ced`: 253 of 253, "all 244 required tests passed"; `git diff origin/main..HEAD` on `src/protected-routes`,
`test/protected-routes` and `.pipeline/protected-registry.json` is empty. Gates `python3 scripts/gates/run.py`: 16 fail, 72 warn on the branch and on main
(`git archive` of `origin/main`), the sorted FAIL lines identical (`diff` empty). `npm run contract:build` exit 0, run again on the final head with no
change; against main: the register summary sentence and the `accessCode` property of `AdminWaitlistRegistrationView` (4 lines), nothing else.
Migration folder `20261018140000_waitlist_access_code` sorts after main's newest. Tripwire on added lines: 0. Em-dashes added: 0. Secret scan of the
staged diffs (hex and base64 runs, `sk_`, `FLWSECK`, bearer tokens, key headers): nothing. The website worktree was never pushed.
Mobile `npm run check`: typecheck and lint pass; jest 112 of 113 suites, 1,913 of 1,914 tests; the one failure is the known
`src/features/events/__tests__/eventsScreens.test.tsx` ("a user sees when a tier ended and when one opens in the event's zone", D8: "Unable to
find an element with text: Ended 6 Oct"). It failed on the first run (26.8 s), failed ALONE (145 ms, so not load this time) and failed on the second
full run. This branch changes only `tasks/JOIN-01.md`, `docs/LOG.md`, `SHARED-CHANGES.md` and the generated progress files (no `src/` line), so the
failure is main's own (the fixture holds fixed 2026 dates; the same file passed on 10 Oct earlier in the day in the JOIN-02 round 4 report). Because
`npm run check` stops at a failed jest step, the two steps after it were run on their own and pass: `npm run gates` (10 gates, 459 files, 0 fail, 16
warn, 0 accepted, baseline clean) and `npm run tasks` (271 tasks, 279 artboards).

### Decisions (Default (agent), the lead may override)
- No cap on pending rows per person. The register route's throttle (300 a 10 minutes per address) bounds how many a person can add, the
  re-check cost is one lookup per due row per run, and the purge removes them after 7 days. Said plainly: a venue address can now add up to
  300 pending rows in 10 minutes where a repeating person added none.
- The admin list and the CSV show every pending row, so a person who started three times shows as three pending rows (and the unpaid rows
  go after 7 days as before). A starting-again person's earlier pending row keeps the values typed then and the fee asked then; a pending row
  from before a price change can still be paid at the old price, since that is what its checkout asked.
- The access code is a database-computed column (above), not a column the app writes.

### NOT RUN
- The production collision check for the migration (the SELECT above): no production access here. Unblocked by running it against the production database before the backend merges; an empty result means the migration applies, a row means stop and tell the lead.
- A real Flutterwave payment, and how the real `verify_by_reference` answers when one tx_ref has several attempts: unchanged from round 1
  (needs one test-mode payment); this change makes it less likely to matter, since a reference now has one checkout.
- The full backend suite (229 suites) and the wider suites that boot `AppModule` or read the table (`src/data-export-request`, `src/account*`, `src/openapi`, `src/plans`, `src/admin`, `src/common`): not in this round's list; the touched code is reached from `src/waitlist` (run above) and the schema change is one derived column. Unblocked by `npm run test:contract` in a private network namespace.
- `sa.mjs` unchanged on the round 3 page (`233d6b1`): not rebuilt; the double charge it showed is in the JOIN-02 round 4 builder's `sa-before.log`.
- Two servers running the cron at once, and a phone or bank app returning to the page: as in earlier rounds.

## Owner sign-off
