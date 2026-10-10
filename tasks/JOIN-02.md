---
id: JOIN-02
title: Event registration link: the website page (wawuafrica.com/join)
owner: YOU
area: WEB
order: 242
priority: launch
repo: wawuafrica
type: web-port
status: building
depends_on: [JOIN-01]
decisions: [R-48, R-47]
passes: [V1, V3, V4, V5, V6, V7, V9]
artboards: []
---
# JOIN-02 · Event registration link: the website page (wawuafrica.com/join)

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, `docs/people/YOU.md`
- DECISIONS.md R-48 (this task) and R-47; `tasks/JOIN-01.md` (the routes and their answers)
- The website repo's `CLAUDE.md` in full, `docs/05_CONVENTIONS.md`, `docs/04_DESIGN_SYSTEM.md`, `src/lib/flutterwave.ts`
  (the checkout helper), `src/app/payment/return/page.tsx` (how a redirect back is handled), `src/components/ui/`
  (PhoneInput, Input, Button, StatusPill), `src/lib/geo.ts`, `src/lib/qr.ts`

## Goal

A person at an event scans a QR code or taps a shared link, lands on wawuafrica.com/join on their phone, fills in a short
form, pays the event fee by Flutterwave (card, bank transfer or USSD) and sees that they are registered. No sign-in, no
account, no password, no OTP. The website's sign-up page and auth pages are NOT touched (owner, 10 Oct 2026).

## Scope

- A new standalone route `/join` outside the app shell and the auth layout (no sign-in needed, no app navigation),
  phone first, also right at desktop width, light and dark, in the web design system (tokens only, shared UI from
  `src/components/ui/`, never forked; a needed variant is a prop).
- One screen, three states:
  1. The offer and the form: offer name and price from `GET /waitlist/offers/current` (never a literal price), full
     name, phone (Nigeria +234 default), email, state (optional), what you make (optional), a consent line with the
     privacy link, and one button "Pay ₦2,000" (the amount from the API).
  2. Paying: the Flutterwave modal; on its callback, verify with the backend; if the modal redirects instead, a
     `/join/paid` return that finishes the verify from the reference.
  3. Registered: the person's first name, the reference, and what happens next ("Sign up in the WAWU app with this
     phone number or email and your plan will be waiting"). No app store button until the app is in a store (R-47).
- Every refusal in plain words: already registered (no charge), offer closed, no offer open, payment cancelled ("You
  have not been charged"), payment not confirmed yet ("Checking your payment" with a retry of the CHECK, never a second
  charge once a transaction id exists), network failure.
- Only the reference is kept in the browser (sessionStorage) so a refresh resumes; no phone, email or name stored.
- Link preview tags (title, description) so the link looks right when shared on WhatsApp.
- A print-ready QR code PNG for https://wawuafrica.com/join for the event (scratch folder, named in the report).
- All calls through a new `src/lib/api/waitlist.ts`; types from the backend contract, never hand-written.

## Capability checks

- [ ] From a phone at 390 px: open /join, fill the form, pay (stood-in Flutterwave), see "registered" with the reference.
- [ ] The price shown and charged comes from the API: change the config and the page follows.
- [ ] An already-registered phone or email is told so before any payment; a closed or missing offer shows its state.
- [ ] Cancelling the modal returns to the form with "You have not been charged"; a payment whose check fails shows
      "Checking your payment" with a retry and never offers to pay again.
- [ ] A refresh on any state resumes it; no name, phone or email in localStorage, sessionStorage or cookies.
- [ ] The sign-up page and auth pages are unchanged (git diff shows no file under `src/app/(auth)/`).
- [ ] Pictures at 390 and 1280 px, light and dark, for every state.

## Builder report

Builder, 10 Oct 2026. Website branch `wmt/JOIN-02` at `e3ae2f7` (from `origin/main` 80c3671). Backend it was built and walked against: `origin/wmt/JOIN-01` at `5773fdb` (first push; the contract in the website was copied whole from that branch, `contract/openapi.json`, then `npm run contract:types`; the website's pinned copy was stale, so that diff is large and only the four `/waitlist` routes and their views are new to the page). No backend change, no mobile app change.

### Pages
- `/join`: the offer and the form, then paying, checking, registered and every refusal. `/join/paid`: where a payment that left the page comes back to; it finishes the server check from `tx_ref` and `transaction_id` in the address, or from the stored reference.
- Both outside every route group: root layout only (no app shell, no auth layout, no session provider), the WAWU mark as a picture (not a link), no navigation. Light and dark through the site's tokens (the site switches theme with `data-theme="light"`; dark is the default).
- Share card: title "Join WAWU", description "Register for WAWU at the event. Pay once, then sign up in the WAWU app and your plan will be waiting.", `og:title`, `og:description`, `og:url`, `og:image` (`/og-image.png`), `twitter:*`, canonical `/join`; read from the built page's HTML (`curl`).

### Files (website)
- New: `src/app/join/page.tsx`, `src/app/join/paid/page.tsx`, `src/app/join/components/{JoinFlow,JoinForm,JoinShell,StateCard}.tsx`, `src/app/join/components/join-fields.ts` (field rules), `src/lib/api/waitlist.ts` (the four calls, types from the contract, one `refusalOf` that switches on `reason.code`), `src/lib/join-session.ts` (the sessionStorage record), `src/components/ui/Checkbox.tsx` and `Select.tsx` (new shared primitives, in the barrel).
- Small additive edits to shared files: `src/lib/api/client.ts` (`ApiError.code` also reads `reason.code`; a top-level `code` still wins, so WAWU ID's `EMAIL_NOT_VERIFIED` read in the sign-in form is unchanged), `src/lib/flutterwave.ts` (optional `redirectUrl` on the charge config, passed to Flutterwave as `redirect_url`; callers that omit it behave as before), `src/lib/format.ts` (`formatNairaFromKobo`), `src/components/ui/index.ts`, `docs/03_USER_FLOWS.md` (section E), `contract/openapi.json`, `src/types/api.generated.ts`.
- NOT touched: nothing under `src/app/(auth)/`, no sign-up or auth component, not `PhoneInput` (its phone error is drawn by the form under it). `git diff origin/main --stat -- "src/app/(auth)"` is empty.

### Checks before the push
Mobile `npm run check` on this branch: exit 0 (jest 109 suites and 1852 tests, gates 0 fail, task check passes; the known `eventsScreens.test.tsx` load flake did not occur; the first run failed only because `docs/PROGRESS.md` was stale after a LOG edit, regenerated, run again). No mobile source changed.
`npm run typecheck` 0; `npm run lint` exit 0 (warnings are the repo's existing `<img>` and hook warnings); `npm run build` exit 0 (run with `NEXT_PUBLIC_API_BASE_URL` set, as the site's own production guard requires; `/join` and `/join/paid` are static, 335 kB first load because the shared `Icon` imports the whole lucide set); `npm run check:copy` clean; gates `python3 scripts/gates/run.py`: 15 fail and 8 warn on main, the same 15 and 8 on the branch (no new finding, compared by key); secret scan of the staged diff (FLWSECK, `sk_`, private-key headers, bearer tokens, 40+ hex, 60+ base64): no match; no em-dash in any new file.

### Capability checks, how each was proved
The walk is `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02/walk2.mjs` (Playwright Chromium from `/opt/pw-browsers`, 390 px phone context, 13 scenarios, 70 assertions, last full run all PASS, log in `walk2-final.log` beside it). It drives the PRODUCTION build (`next start` on :6021) against the real JOIN-01 backend built from `5773fdb` on :6023 with a local database (`bj02_test_join`, dropped). The backend runs through `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02/be-main.cjs`, which boots `AppModule` as `src/main.ts` does and stands Flutterwave in at its two DI seams (`FLUTTERWAVE_CLIENT`, `WAITLIST_PAYMENT_LOOKUP`); the browser's `https://checkout.flutterwave.com/v3.js` is routed to a stand-in that calls the callback with a transaction id, cancels, declines, or redirects. Every request to any other host is aborted and recorded; none was made.

| Check | Proved by |
|---|---|
| From a phone at 390 px: open, fill, pay, see registered with the reference | `happy`: form filled, pay, "You're registered, Ada", reference `wawu-join-<hex>` shown; the database row is `paid`, 200000 kobo paid, transaction id set, phone stored as `+234...`, email lower case; no phone or email appears anywhere on the registered page |
| Price shown and charged comes from the API; change the config and the page follows | `priceFollowsConfig`: `price_kobo` 250000 in the local `plans.config.json`, backend restarted: button "Pay ₦2,500", the payment window opened with `amount` 2500 `NGN`, the row asked for and recorded 250000 kobo. (Default run: "Pay ₦2,000", window 2000 NGN, 200000 kobo.) Config restored from a saved copy; `git status` of the backend worktree clean |
| Already registered is told before any payment; closed or missing offer shows its state | `already`: a paid person made through the API; the same phone typed with a leading zero (other email) and the same email in capitals (other phone) both give "You are already registered" with NO payment window and NO payment check; "Use different details" keeps the fields. `closedMidway`: form open while the offer's `open_until` passes, submit gives "Registration has closed", no payment window, no row; refresh gives "Registration is not open right now". `noOffer`: offer opens in December, the page shows "Registration is not open right now" with Check again, also after a refresh |
| Cancelling returns to the form with "You have not been charged"; a failed check shows "Checking your payment" with a retry and never offers to pay again | `cancel`: notice shown, fields kept, stored reference cleared, row still `pending`, refresh gives a clean form, paying afterwards reuses the person's unpaid row (one row). `declined`: "Your payment did not go through ... You have not been charged", row `pending`. `retry`: Flutterwave says not confirmed (409 `payment_not_confirmed`), then the service is unreachable (503), then a refresh (the page re-checks the stored transaction itself and is refused once more), then Check again: registered. In every step no Pay button and no "Start again"; the window opened exactly once; the same transaction id was re-checked 4 times; the row ended `paid` once |
| A redirect back through `/join/paid` | `redirect`: the stand-in sends the browser to `/join/paid?status=successful&tx_ref=...&transaction_id=...`: registered; refresh on that address: registered; a NEW tab with empty storage opened on that address: registered. `redirectCancel`: `status=cancelled` shows "Payment not completed ... You have not been charged", Back to registration returns to the form |
| A refresh on any state resumes it; no name, phone or email in localStorage, sessionStorage or cookies | Refresh walked on: registered (same reference), no offer, closed, cancelled (clean form), checking, paying (becomes "Checking your payment" with Check again and "I have not paid. Start again"), `/join/paid`. Storage read in the page after typing, after paying and after each refresh: `localStorage` empty, cookies empty, `sessionStorage` holds one key, `wawu.join.registration`, with only the reference and the transaction id; a search of all three for the typed name, phone digits, email and its local part found nothing |
| Network and rate-limit | `unreachable`: every call aborted gives "We couldn't reach WAWU" and Try again recovers; a 429 on the offer gives "Please wait a moment" with Try again |
| Form rules | `validation`: an empty submit shows four errors (name, phone, email, consent) and sends nothing; a leading 0 is accepted; a Canadian "+1 123456" passes the page but the server refuses it (`phone_invalid`): its sentence shows under the phone field, no window opens, no row is stored, and editing the phone clears it |
| The privacy link | opens in a new tab, `/privacy/policy`, which lands on `/terms` with no sign-in wall; clicking it does not tick the box |
| Sign-up and auth pages unchanged | `git diff origin/main --stat -- "src/app/(auth)"` empty; no auth or sign-up component in the diff |
| Pictures at 390 and 1280 px, light and dark, for every state | below |

### Pictures
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02/pics/final/<state>-<390|1280>-<dark|light>.png`, full page, 2x, 76 files, taken from the production build against the real backend (the Alan Sans font file routed in locally; the page asks no other host). States: `01-loading`, `02-form`, `03-form-filled`, `04-form-errors`, `05-paying`, `06-verifying`, `07-checking` (Checking your payment with Check again), `08-registered`, `09-already`, `10-closed` (a real closing: four forms open, the offer closes, all four submitted), `11-no-offer`, `12-cancelled`, `13-declined`, `14-unreachable`, `15-return-not-paid`, `16-resume-checking` (refresh while paying), `17-server-field-error`, `18-busy` (429), `19-return-registered` (`/join/paid`). Contact sheets for a quick look: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02/pics/sheet-final-390-c.png`, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02/pics/sheet-final-1280-b.png`. I do not say they match anything: there is no artboard for this page (`artboards: []`).

### The QR code
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02/join-qr.png`: 1200 by 1200 px PNG of `https://wawuafrica.com/join`, plain black on white, error correction Q, four-module quiet zone, 32 px modules (a whole number, so the edges are sharp), no logo. Decoded back with jsQR (a separate decoder) at 1200, 600, 300 and 200 px: `https://wawuafrica.com/join` each time. Made with the mobile repo's `qrcode` package (scratch only, nothing added to the website).

### Decisions (Default (agent), owner may override)
- One column at every width (a card at most 520 px wide, centred on a laptop); the page follows the site's themes (dark by default; the site has no theme switch, so a phone on a light setting sees dark, as the whole site does).
- Both pages are `noindex` (an event link stops meaning anything when the offer closes); the logo is a picture, not a link.
- The form shows what the API says the fee covers ("Includes the Verify plan for 30 days.", from `tierName` and `days`), never the plan's own price and not the product count.
- Name needs two letters, phone a Nigerian mobile (`[789][01]` then 8 digits, the backend's pattern; a leading 0 is dropped) or 6 to 14 digits for another country, email a valid shape, consent ticked; the server's own refusal of a field is shown under that field.
- Kept in sessionStorage: the reference and, once Flutterwave returns one, the transaction id (so a refresh can re-check it itself). Neither identifies anyone. A cancelled or declined payment clears it, so a refresh then shows a clean form.
- A refresh while the window was open (no transaction id known) shows "Checking your payment" with Check again AND "I have not paid. Start again". Once a transaction id exists there is no way to start again.
- The window is opened with `redirect_url` = `/join/paid`, so a payment that leaves the page (a bank app, 3-D Secure, USSD) comes back and finishes. Whether the real checkout calls the callback, redirects, or both is NOT RUN (below); either way the end state is the same because the server check is idempotent.
- `reason.code` is read in `client.ts` (shared) rather than a second fetch wrapper in `waitlist.ts`.

### Findings for the lead
- JOIN-01's stock mock Flutterwave (what runs with no `FLUTTERWAVE_SECRET_KEY`) can never approve a waitlist payment: `MockFlutterwaveAdapter.verifyCharge` only knows tx_refs it made itself in `initCharge`, and the waitlist's reference is its own, so a verify answers `payment_not_confirmed`. Production is not affected (real adapter). It matters only for anyone walking this page against a local backend; I stood Flutterwave in at the DI seam instead (`be-main.cjs`). The JOIN-01 builder may want to know.
- The per-address limit is 120 per 10 minutes per route; each page load is one `GET /waitlist/offers/current`, so a venue where more than 120 people open the page inside 10 minutes would see "Please wait a moment" (the page handles it).
- Production needs the website built with `NEXT_PUBLIC_API_BASE_URL` (the site refuses to build without it) and the Hub's `CORS_ORIGIN` to include `https://wawuafrica.com` (it must already, for the rest of the site).

### NOT RUN
- A real Flutterwave payment (owner pays once on production, after the backend is deployed with its real key and the website with the real public key): unblocked by that payment; what to look at is whether the page ends on "You're registered" through the callback or through `/join/paid`.
- A real phone and the WhatsApp link preview (V10): the tags are in the page HTML (above); the preview itself needs the page live at `https://wawuafrica.com/join` and the link pasted into WhatsApp.
- The real Flutterwave checkout script (stood in); card, bank transfer and USSD screens inside it.
- A backend newer than `5773fdb`: JOIN-01 had not pushed again when this was written; if its contract changes, re-copy `contract/openapi.json`, run `npm run contract:types` and `npx tsc --noEmit`, and re-run `walk2.mjs`.

## Round 2 (builder, 10 Oct 2026)

Website `wmt/JOIN-02` `c522c9f` (one commit on `e3ae2f7`), against backend `wmt/JOIN-01` `d26e1e6`. Owner rulings of 10 Oct 2026,
and nothing else changed. No Flutterwave, Nuvion, Fintava, wawuafrica.com or AI host was called (the walk aborts and records any
other host; none was reached).

**What changed**
- No offer card. `/join` is the logo, the "EVENT REGISTRATION" eyebrow, the "Register for WAWU" heading, then the form. The
  price (from the API) is on the pay button only ("Pay ₦2,000"). The page no longer names the offer, says what the fee
  includes, how long the plan lasts or when it starts, or when registration closes, and it reads no `days` or `closesAt`
  (the API still sends them), so a link with no closing date needs no special case. The unused code and copy are gone:
  `OfferSummary` and `summariseOffer` (replaced by `offerPrice`, the formatted fee), the card in `JoinForm.tsx`, and the
  card's skeleton in the loading state. This replaces the earlier round 2 copy ("for 30 days, starting when you join" and
  then "Includes the Verify plan."): the card is gone, nothing replaces it.
- A short reference on the registered screen, under "Your reference": the first 8 characters of the random part of the
  reference, upper-cased, in two groups of 4 (for example `A698 DA83`). `shortReference` in `src/lib/join-session.ts`. The full
  reference stays in sessionStorage, in the `/join/paid` address and in every API call, and starts with the short form, so
  support can match it in the admin export. No backend change.
- Contract re-copied from backend `d26e1e6` (`closesAt` is `string | null`), `npm run contract:types`; `docs/03_USER_FLOWS.md`
  section E updated. Files: `src/app/join/components/JoinFlow.tsx`, `JoinForm.tsx`, `src/lib/api/waitlist.ts`,
  `src/lib/join-session.ts`, `contract/openapi.json`, `src/types/api.generated.ts`, `docs/03_USER_FLOWS.md`. Nothing under
  `src/app/(auth)/` changed (`git diff` against the round 1 head is empty there).

**How proved**
- `typecheck` 0, `lint` exit 0 (the repo's existing `<img>` and hook warnings only), `npm run build` exit 0 with
  `NEXT_PUBLIC_API_BASE_URL` set to the local backend (`/join` and `/join/paid` static, 335 kB), `check:copy` clean, no
  em-dash and no key-shaped string in the diff.
- `walk2.mjs` (copied to the lead's scratch `joinr2/`, ports 6011 and 6021, database `bjr2_test_walk`, Flutterwave stood in at
  the backend's DI seams and in the browser as in round 1) against the production build and the round 2 backend with the
  shipped config (no closing date): 15 scenarios, 89 assertions, 0 failed (log `joinr2/walk2-run1.log`). New: the registered
  screen shows `A698 DA83` for `wawu-join-a698da83...` (upper-case, two groups of 4, equal to the first 8 of the checkout's
  tx_ref), the full reference is not drawn anywhere on it, sessionStorage holds the full reference, the verify call used the
  full reference, a refresh shows the same short form, and on `/join/paid` the address carries the full `tx_ref` while the screen
  shows the short one; `noOfferCard` at 390 and 1280 px: only the eyebrow, heading and form, no offer name, no "Includes", no
  plan, no days, no closing line, "₦2,000" once (on the button), the form starts one flex gap below the heading, and a person
  still registers and pays with an offer whose `closesAt` is null; with `open_until` set the API answers the date and the page
  still draws no closing line; `priceFollowsConfig` (₦2,500 appears once, on the button; the window opened with 2500 NGN).
  All round 1 scenarios still pass (already registered, cancel, declined, retry, redirect, redirectCancel, hang, validation,
  unreachable, no offer, closed midway).
- Pictures, 390 and 1280 px, dark and light, the states that showed the card or the reference, from the production build:
  `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/joinr2/pics/final/<state>-<390|1280>-<dark|light>.png`,
  36 files: `01-loading`, `02-form`, `03-form-filled`, `04-form-errors`, `08-registered`, `12-cancelled`, `13-declined`,
  `17-server-field-error`, `19-return-registered`. The other round 1 states (paying, checking, already, closed, no offer,
  unreachable, busy, resume) never drew the card and are unchanged in `join02/pics/final/`. I do not say they match anything:
  there is no artboard.

**Decisions (Default (agent), owner may override)**
- The short form is for the eye only; a person reading "A698 DA83" to support is matched by prefix against the full reference
  in the admin export. The reference is `wawu-join-` and 36 hex characters in the backend, not 64; only the first 8 are shown.
- The registered screen's reference is set large (28 px, monospaced, letter-spaced) because it is the one thing read aloud.

**NOT RUN**
- A real Flutterwave payment, a real phone and the WhatsApp preview: as in round 1.
- The Flutterwave modal's own title still carries the offer name (`WAWU event registration`) inside Flutterwave's window; the
  page does not draw it. Unblocked if the owner wants it changed: it is `title: offer.name` in `JoinFlow.tsx`.

## Verifier report

Independent verifier (did not write any of this), rounds 1 and 2, 10 Oct 2026. Website `origin/wmt/JOIN-02` at
`c522c9fe947d23c368cfa225ce30c893850ff867` (two commits on `origin/main` `80c3671`; main had not moved, so a merge into main is a
fast-forward). Backend `origin/wmt/JOIN-01` at `d26e1e6`, built and run locally on :6042 with its own database (`vj02_test_join`,
dropped), the website's production build on :6041, Flutterwave stood in at the backend's DI seams and in the browser (the
checkout script, variants: callback, redirect with and without a transaction id, cancel, decline, pending, hang). My stand-in is
stricter than the builder's: a transaction exists only if the checkout stand-in created it, and verify answers from that table.
Nothing outside 127.0.0.1 was called (every other host is aborted and recorded: none). Scripts and pictures:
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/` (`vlib.mjs`, `vbe.cjs`, `t1.mjs` to `t16.mjs`, `shots.mjs`, `t8.mjs`).

**Verdict: building. Four blockers (D1 to D3 are one code path in the payment-return handling, D4 is the same lie in another
path), the rest should-fix and notes.** What the owner asked for (a registration link, the sign-up page untouched) is met; what is
not met is the brief's payment-safety rule that a person who has a transaction id is never told "You have not been charged" and
never offered Pay again.

### Passes

| Pass | Result | Evidence |
|---|---|---|
| V1 Gates | passed for the website, with defects D6 to D12 as should-fix and notes | website `npm run typecheck` 0, `npm run lint` 0 (existing `<img>` and hook warnings only, none in a `/join` file except the `<img>` logo in `JoinShell.tsx`), `npm run build` 0 with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:6042` (`/join` and `/join/paid` static), `npm run check:copy` 0 ("copy rules: clean"), website `python3 scripts/gates/run.py`: 15 fail, 8 warn, 42 accepted on main and on the branch, every finding the same by key; logs `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/typecheck.log`, `lint.log`, `build.log`, `copy.log`, `gates-main.out`, `gates-branch.out`. House rules on the new files: no `style={{}}`, no hex, no `fetch(` in `src/app/join` or `join-session.ts`, no em-dash in any new file or in the built `/join` chunks, `Checkbox` and `Select` use tokens only and are not a fork of any `ui/` component (main has no `Select` or `Checkbox`). Mobile `npm run check` on the report commit: exit 0 (see "Mobile check" below). |
| V3 Regression (sign-up and auth untouched; every shared edit judged for every other caller) | passed | below |
| V4 Field trace (what the person writes reaches the row, nothing else) | passed | name, phone (typed `0803...`, `803...`, spaces, dashes, all stored as `+234...`), email (lower case), state, makes reach the `WaitlistRegistration` row; the price on the button, the window amount and the row's `amountKobo` agree (default 200000 kobo, and 250000 after a config change); the first name and the short reference on the registered screen come from the status/verify answer |
| V5 Picture | NOT RUN against a design (no artboard, `artboards: []`); pictures taken for every state | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/pics/` (list below). Unblocked by: the owner naming a reference for this page |
| V6 States | passed except where D1 to D5 say otherwise | every state reached through its real cause (list below) |
| V7 Flow walk | failed (D1 to D4) | the payment return paths |
| V9 Live seam | passed | the page talks to the real JOIN-01 backend and database; the only stand-in is Flutterwave (DI seams, see above); a row only turns `paid` after the stand-in's own transaction table agrees (amount, currency, reference), hand-made wrong payments (an underpaid 1000 against 2000, one Flutterwave did not confirm, a made-up reference with a made-up id) were refused or left `pending` |

### Capability checks, as written in the task

| Check | Result | Proof |
|---|---|---|
| From a phone at 390 px: open, fill, pay, see registered with the reference | CONFIRMED (callback path, and redirect path with a transaction id, and callback then redirect together) | `t1.mjs`: callback success, `/join/paid?status=successful` and `status=completed` with `transaction_id`, "both": all end on "You're registered, Ada" with `XXXX XXXX`, row `paid`, 200000 kobo, transaction id equal to the one in the address; a cold browser (empty storage) opened on `/join/paid?status=successful&tx_ref=..&transaction_id=..` registers (`t15.mjs`) |
| The price shown and charged comes from the API | CONFIRMED, with D9 | `t8.mjs`: `price_kobo` 250000 and a restart: button "Pay ₦2,500", window `amount` 2500 `NGN`, row 250000 kobo paid; the page shows the price once, on the button (naira symbol count 1 on the form, 0 on every other state) |
| Already registered is told before any payment; a closed or missing offer shows its state | CONFIRMED | `already`: two pages, the second with the same phone and another email: "You are already registered", no window; closed: a real closing (config `open_until` two minutes ahead, four forms open, the offer closes, all four submitted): "Registration has closed", no window, no row; reload: "Registration is not open right now" with Check again, which keeps the state |
| Cancelling returns to the form with "You have not been charged"; a payment whose check fails shows "Checking your payment" with a retry and never offers to pay again | CONFIRMED for a cancel with no transaction id and for a failed check after a transaction id from the callback (409 unconfirmed, 503, refresh, back, 5 re-checks of the same id, then registered; window opened once); BROKEN where the return address or callback carries a transaction id with an unexpected status, and where the row is `failed`: D1, D2, D3, D4 |
| A refresh on any state resumes it; no name, phone or email in localStorage, sessionStorage or cookies | CONFIRMED, with D4 for a `failed` row | refresh on form (clean), paying (becomes checking), checking, registered, `/join/paid`, closed (becomes not open), none; back and forward across `/join/paid`; `t6.mjs` for callback, redirect, unconfirmed, cancel and hang: `localStorage` empty, cookies empty, `sessionStorage` has one key `wawu.join.registration` holding the reference and the transaction id only; no name, phone, digits, email or its local part in storage, in any address visited, in the browser console, in IndexedDB or caches, in the website's server log or in the API calls' headers (no Authorization, no Cookie sent: `t14.mjs`); the backend's own log stayed one line in this harness (nothing to leak) |
| The sign-up page and auth pages are unchanged | CONFIRMED | `git diff origin/main --stat -- "src/app/(auth)"` empty; the 18 files changed are exactly the builder's list (no extra, none missing) and none is an auth or sign-up file; under `src/components/ui` only `Checkbox.tsx`, `Select.tsx` and two barrel lines are added, `Input`, `PhoneInput`, `Button` are byte-identical to main |
| Pictures at 390 and 1280 px, light and dark, for every state | DONE | list below |

### The shared-file edits, judged for every other caller

- `src/lib/api/client.ts` (`ApiError.code` also reads `reason.code`): every reader of `.code` on an `ApiError` found by search.
  `SignInForm.tsx:49` branches on `e.code === "EMAIL_NOT_VERIFIED"`: WAWU ID answers a top-level `code`, which still wins, so sign-in is
  unchanged. `communities.ts:443` builds its own synthetic code from status 402 and nothing reads it by `.code`. `wallet.ts` checks
  `e.status`. `errors.ts` only mentions `code` in comments. Behaviour changes for no caller; the only response whose `.code`
  goes from undefined to a value is a Hub refusal that has `reason.code`, and nothing else reads `.code` of such a response.
  CONFIRMED safe.
- `src/lib/flutterwave.ts` (`redirectUrl`): the only caller that passes it is `JoinFlow.tsx`; the hosted-checkout path in the same
  file keeps its own `redirectUrl` body field; every other caller omits it and the options object is built the same as before.
  CONFIRMED safe.
- `src/lib/format.ts` (`formatNairaFromKobo`): a new function, one caller.
- `contract/openapi.json` and `src/types/api.generated.ts` (about 50,000 changed lines, the whole backend contract at `d26e1e6`
  replaces a stale pin): the only module that imports the generated types besides `waitlist.ts` is `src/lib/api/wallet.ts`, which
  uses `WalletController_get`, `_history`, `_resolve`, `_withdraw` and schemas `Bank`, `WithdrawDto`. I diffed each of those blocks
  between main and the branch: `_get`, `_resolve`, `_withdraw`, `Bank`, `WithdrawDto` are identical; `_history` differs only in the
  order of the members of two string unions (`"earning" | "reversal" | "withdrawal"` against `"earning" | "withdrawal" | "reversal"`,
  `"pending" | "completed" | "failed"` against `"pending" | "failed" | "completed"`), the same types. 321 schemas and 230
  operations are added, none removed; 37 schemas and 30 operations differ from main but no website module imports them.
  CONFIRMED: no other page's type changes. (Merge note D15.)

### Flutterwave v3 inline as configured (`redirect_url` set)

| Case (stand-in) | Page | Result |
|---|---|---|
| callback `successful` with id | registered | CONFIRMED |
| redirect `status=successful` with `transaction_id` | `/join/paid` verifies with the id from the address: registered; refresh, back, forward, cold tab all registered | CONFIRMED |
| redirect `status=completed` with id | registered | CONFIRMED |
| callback and then redirect | registered | CONFIRMED |
| redirect `status=successful`, NO `transaction_id`, money charged (stood in) | "Payment not completed. You have not been charged." with "Back to registration", stored reference cleared, no status route used | DEFECT D1 (blocker) |
| redirect `status=cancelled` with a transaction id | same "not charged" screen | DEFECT D2 (blocker) |
| redirect `status=cancelled` or `failed`, no id | "not charged", form on Back | CONFIRMED |
| callback `status=pending` with an id (bank transfer or USSD) | "Your payment did not go through. You have not been charged.", reference cleared, form with Pay | DEFECT D3 (blocker) |
| callback `status=failed` with an id | the same, form with Pay (a failed charge, so "not charged" is right) | note |
| callback `failed` with no id, cancel (window closed) | "did not go through, not charged" / "not charged" | CONFIRMED |

### Defects

- **D1 (blocker). A person charged, whose Flutterwave redirect address has no `transaction_id`, is told they were not charged and is offered to pay again.**
  `/join/paid?status=successful&tx_ref=wawu-join-...` (no id): the page shows "Payment not completed / You have not been charged. You can go back and
  try again." with "Back to registration", clears the stored reference and never asks the status route. Reproduction `t4.mjs`: stand-in charge exists for the
  reference; the server's 5-minute re-check then marks the row `paid` (sweep answered `{checked, paid: 1}`, row `paid` with the transaction id) while a refresh of the page
  still says "You have not been charged"; following "Back to registration" and paying again made two successful transactions against one reference
  (`wawu-join-004b2f2d...`, ids ending 909 and 910), one of them orphaned and owed back. Picture `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/pics/D1-redirect-noid-390-dark.png`.
  Cause: `JoinFlow.tsx`, the `mode === "return"` branch settles only when `isTransactionId(transactionId) && finished`; every other address falls to `notPaid`.
  The brief and the builder's own note both say a missing id must fall back to the status route (`checking`, never Pay) until the webhook or the
  re-check marks it paid.
- **D2 (blocker). `status=cancelled` (or any status the page does not call finished) WITH a `transaction_id` also says "You have not been charged".**
  Same branch: `/join/paid?status=cancelled&tx_ref=..&transaction_id=<real successful transaction>` shows the "not charged" screen and clears the stored record.
  The brief: that sentence only when no transaction id exists. Reproduction `t1.mjs` ("redirect cancel WITH id"). Same fix region as D1.
- **D3 (blocker by the brief's rule; the trigger in real Flutterwave is NOT RUN). A callback that carries a transaction id with a status other than successful or completed returns the person to the form with Pay.**
  `flutterwave.ts` rejects such a callback ("Flutterwave did not confirm the payment"), `JoinFlow.tsx` then clears the reference and shows "Your payment did not go through. You have not been charged." with the
  form. With a callback `status: "pending"` and a real transaction id (a bank transfer or USSD that has not landed yet) the person is told they are not charged and can pay again (reproduction `t1.mjs`
  "callback pending WITH id"; the server would answer `payment_not_confirmed` and settle it later). The brief: once a transaction id exists there is no path back to Pay. Unblocked by one real bank-transfer test payment
  watched in the browser: whether the callback ever arrives with `pending`. Fix direction: when an id is present, always ask the server (`settle`) and let it decide.
- **D4 (should fix, a false statement about money). A registration that is `failed` (a second payment kept for a refund) is shown as "You have not been charged".**
  JOIN-01 keeps a duplicate payment as `failed` with its transaction id and amount for a refund. When that person refreshes (or the page resumes), `resume()` sees `failed`, clears the reference and shows
  "Your last payment did not go through. You have not been charged." with the form. Reproduction `t12.mjs`: a bank transfer pending in tab 1 (landed at Flutterwave, page not told), the same phone with a corrected email paid
  in tab 2 (registered), the server re-check then settled tab 1's payment as `failed` (kept, 200000 kobo); tab 1's refresh says "not charged" and offers Pay (a further payment would be refused as already registered, so no third charge).
  The verify call answered `already_registered` and the page swallowed it into "Checking your payment" first (D5).
- **D5 (should fix). Verify refusals other than "not confirmed yet" are not mapped: they all become the endless "Checking your payment ... Check again" screen.**
  `settle()` catches every error. Unmapped on the verify route: `payment_mismatch` (422, the server's sentence says "contact support with your reference"), `transaction_already_used` (409), `already_registered` (409, the
  duplicate case), `not_found` (404, only mapped on resume). Reproduction `t9.mjs`: a payment of 1000 against a 2000 fee shows "We have not confirmed your payment yet. If money left your account it is safe, and you will not be charged
  twice. Check again in a moment." on every Check again, never support or a reference to quote. Mapped and correct: on the register route `no_open_offer`, `offer_closed`, `already_registered`, `name_invalid`, `phone_invalid`,
  `email_invalid`, `consent_required`, `payments_unavailable`, 429 and 5xx; on verify `payment_not_confirmed` and `payment_check_unavailable` (to the checking screen, which is right for them).
- **D6 (should fix). The page is a blank screen until the JavaScript loads.** The static HTML body is empty (`BAILOUT_TO_CLIENT_SIDE_RENDERING`: `useSearchParams` under a `Suspense` whose fallback is `null`), no logo, no `noscript`.
  Slow 3G (400 kbit, 400 ms) with a 4x slower CPU (`t7.mjs`): empty page at 0.5 s and 1.5 s, logo and skeleton at 3 s, the form at about 8 s. Usable, but a venue Wi-Fi with a crowd looks like a dead link for the first seconds.
  Pictures `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/pics/slow3g-390-1500ms.png`, `slow3g-390-5000ms.png`.
- **D7 (should fix, accessibility). The phone field has no accessible name, and no field error is tied to its field or announced.** The `type=tel` input has an empty accessible name (its label is a `span`; every other field is named);
  field errors (name, phone, email, consent) are plain text with no `aria-describedby`, no `aria-invalid`, no live region, and focus stays on the Pay button after an invalid submit (`t2.mjs`). Keyboard completion works (Tab, Space on the box, Enter on Pay,
  a visible 2 px focus ring on every stop, `t9.mjs`). The shared `PhoneInput` and `Input` are untouched by this branch, so the fix is a prop on them.
- **D8 (note). The double-submit guard is state only.** A real double tap (`dblclick`) opens one window and makes one registration (one call, one row). Five submits inside one JS task (`requestSubmit` three times and two button clicks) made 5 registration calls and 5
  windows for the same reference (still one row). A ref lock would close it. `t3.mjs`.
- **D9 (should fix). The price on the button is read once at page load.** `t16.mjs`: the page loaded at "Pay ₦2,000", the fee was raised to ₦2,500 and the backend restarted, the person tapped Pay: the window opened for 2500 NGN and the row holds 250000
  kobo. The server is right to charge its current price; the page never compares the amount it was handed with the price it showed, so a person agrees to one price and meets another.
- **D10 (note). A phone pasted with the country code is refused.** `+2348031234567` and `2348031234567` give "Enter a Nigerian mobile number, for example 803 123 4567." (the field strips the plus and keeps the 234); `0803...`, `803...`, spaces and dashes are accepted. `t11.mjs`.
- **D11 (note). A very long single-word first name overflows the registered heading.** A 46-letter first name is clipped at 320 and 360 px (no horizontal scroll, the shell clips it). Names of ordinary length fit. `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/pics/longname-360.png`.
- **D12 (note). Tap sizes and font size.** At 390 px inputs are 52 px, the Pay button 56 px, secondary buttons 48 px; the consent row is 41 px high and the "privacy policy" link is 17 px high (an inline link). Inputs and selects are 15 px, which makes iPhone Safari zoom
  the page on focus (shared `Input`, `PhoneInput`, `Select`; not run on an iPhone). `t2.mjs`.
- **D13 (unclear, needs the owner or the lead before people pay). The registered screen, the already-registered screen and the link preview promise "your plan will be waiting".** That is the claim JOIN-03 will build; there is no `tasks/JOIN-03.md` and no route writes the
  `claimedBy*` columns yet. The sentence is the owner-approved copy in the task and R-48, so it is not a builder error, but until JOIN-03 and an app release ship it is a promise nothing backs.
- **D14 (note). Flutterwave's own window still names the offer** (`title: offer.name` is "WAWU event registration", description "Event registration fee"); the page itself draws no offer name, which is what round 2 asked. The builder listed it as an open choice.
- **D15 (note for the lead). `origin/wmt/WEBPAY-01` conflicts with this branch.** A trial merge (aborted, nothing kept) conflicts in `contract/openapi.json`, `src/types/api.generated.ts`, `src/lib/api/client.ts` (WEBPAY-01 adds `ApiError.reason`; this branch maps
  `reason.code` into `.code`), `src/components/ui/index.ts`, and an add/add of `src/components/ui/Select.tsx` (this branch: `options: readonly string[]`; WEBPAY-01: `options: readonly {value,label}[]`). Whichever merges second must reconcile; there will
  be one `Select`.
- **D16 (note). If Flutterwave's `v3.js` request hangs, the page sits on "Opening secure payment" with no button.** No timeout (12 s and 25 s tried, `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/pics/script-hang-12s-390.png`); a refresh then shows "Checking your payment" with "I have not paid. Start again". A blocked script is handled
  ("We couldn't open the payment window", back on the form, not charged, `t9.mjs`).
- **D17 (note, venue). The backend's global per-second limit is hit before the per-10-minute one.** 40 parallel loads of the offer route from one address: 20 answered 200 and 20 answered 429 (the app's `short` limit of 20 a second per route). The page handles it ("Please wait a moment"), and Try again works at
  once, but the copy says "Wait a minute" while the wait is a second. A crowd scanning one QR code together can see it.

### States, each through its real cause (pictures)

`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/pics/<state>-<390|1280>-<dark|light>.png`, full page, 2x: `01-loading` (the offer call held for 6 s), `02-form`, `03-form-filled`, `04-form-errors` (empty submit), `05-paying` (window open), `06-verifying` (verify held for 8 s), `07-checking` (callback successful but Flutterwave says not confirmed),
`08-registered` (short reference `XXXX XXXX`), `09-already` (a paid person, then the same phone with another email), `10-closed` (a real closing, above), `11-no-offer` (after the closing, a real 404), `12-cancelled`, `13-declined`, `14-unreachable` (the offer call refused), `15-return-not-paid`, `16-busy-429` (a 429 with the real
throttle body, status only), `17-server-field-error` (a +1 number the server refuses), `19-return-registered` (`/join/paid` with an id). Contact sheets: `sheet-390-dark-a.png`, `sheet-390-dark-b.png`, `sheet-390-light-a.png`, `sheet-390-light-b.png`, `sheet-1280-dark-a.png`, `sheet-1280-light-a.png`, `sheet-closed-none-390.png`, `sheet-closed-none-1280.png`.
No horizontal overflow in any of the 4 sizes (320 and 360 px also checked for the form with errors and the registered screen). Round 2 text rule: across form, errors, paying, checking, registered, cancelled, declined, not paid and return-registered, the page text and attributes hold no plan length, no day count, no start
date, no "Includes", no closing line, no offer name, no tier word, no dollar sign, no em-dash; the naira symbol appears once, on the Pay button, in every state that shows the form (form, errors, cancelled, declined) and nowhere in the others, never as a big price; with `open_until` set the page still draws no date (`t5.mjs`, `t8.mjs`).

### Also checked, no defect

Double tap (real), two tabs (the tab that did not pay is told "already registered" and no window opens), back and forward across `/join/paid`, refresh on every state, junk addresses (`/join/paid`, `?tx_ref=abc`, a script tag in `tx_ref` renders as plain refusal text, an unknown reference with an id shows "Checking your payment"), a network failure on register
(form kept, "not charged", recovers and pays once) and on verify after paying (checking, then registered), 429 on register and on verify, the privacy link (opens `/terms#privacy-and-data-protection` in a new tab, does not tick the box), link preview tags in the built HTML (`og:title`, `og:description`, `og:url`, `og:image` absolute, `twitter:*`, canonical `/join`,
`robots: noindex, nofollow`, `lang="en"`, the image is the site's 1200 by 630 card, 21 KB), no CSP or middleware on the site that could block the checkout script. The QR `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/../join02/join-qr.png` (1200 by 1200) decodes to exactly `https://wawuafrica.com/join` with jsQR at 1200, 800, 600, 400, 300, 200 and 150 px and
after a blur at 300 px (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/qr/dec.cjs`; only one decoder was available offline).

### NOT RUN

- A real Flutterwave payment (the owner pays once on production): decides D3 (does the callback or redirect ever carry `pending` with an id, or no id), and shows whether the real checkout redirects, calls the callback, or both. Unblocked by one live bank-transfer payment and one card payment watched in the browser address.
- A real phone and the WhatsApp preview (needs the page live at `https://wawuafrica.com/join`), iPhone Safari zoom on 15 px inputs (D12), the browser's Back from a bank or 3-D Secure page into a restored page (bfcache), and a phone camera on the printed QR.
- The Flutterwave webhook path (`charge.completed` for a `wawu-join-` reference) against these routes: JOIN-01's own specs cover it; I used the 5-minute re-check (`recheckPending`) as the server-side catch-up.
- The full backend suite and the protected suite: not this task's pass (backend `d26e1e6` unchanged by this branch).
- V5 against a design: no artboard.

### Mobile check

`npm run check` in the mobile worktree at this branch with this report: exit 0 (typecheck, lint, jest 109 suites and 1852 tests passed, the known `eventsScreens.test.tsx` flake did not occur, gates: 10 gates, 445 files scanned, 0 fail, 13 warn, 0 accepted; task check passes, 271 tasks, 279 artboards). Log:
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02/mobile-check.log`. No mobile source changed by this branch or by this report. Secret scan of the staged diff (a Flutterwave secret-key prefix, `sk_`, bearer tokens, private-key headers, long hex or base64 runs): the only 40-hex string is the website commit hash `c522c9f...` quoted at the top; nothing else matched.
