---
id: JOIN-02
title: Event registration link: the website page (wawuafrica.com/join)
owner: YOU
area: WEB
order: 242
priority: launch
repo: wawuafrica
type: web-port
status: done
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

## Builder report, round 3 (10 Oct 2026)

Website `wmt/JOIN-02` at `69d3d2d` (three commits on the verifier's head `c522c9f`: `66896dd` the payment-return fixes, `e4dba93` site mode, `69d3d2d` the icon set), against backend `wmt/JOIN-01` `d26e1e6` (built locally, nothing changed there). The lead's rulings 1 to 13 and the owner's later instruction (production exposes only `/join`) are built; D13 and D15 are not mine. No Flutterwave, Nuvion, Fintava, wawuafrica.com or AI host was called (every harness aborts and records any other host: none). Nothing under `src/app/(auth)/` changed (`git diff c522c9f HEAD --stat -- "src/app/(auth)"` is empty, and empty against `origin/main`).

Scripts and logs: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02r3/` (`v/` the verifier's strict Flutterwave stand-in, copied with my ports and reused; `w/` the round 2 walk; `logs/before-*.log` each defect reproduced on the round 2 build FIRST, `logs/final-*.log` the same checks on the final build). Ports 6021 (website), 6023 (backend), database `bj02r3_test_join` (dropped).

### The one rule, as built
`src/app/join/components/JoinFlow.tsx` has one place that says "You have not been charged" (`notCharged`), reached only when Flutterwave said cancelled (or failed), no transaction id exists in the address, the callback or storage, AND the status route answered not paid. With an id the server is asked to verify it whatever status word came with it; without one, the status route is asked; every other result is "Checking your payment" (never the form, never Pay), which asks the status route by itself every 15 seconds for 5 minutes, then adds "Still checking. If money left your account, email support@wawuafrica.com with your reference XXXX XXXX." The stored reference is kept while the outcome is unknown.

### Each defect, reproduced then fixed
| D | Reproduced on `c522c9f` (log) | Fixed, and how proved on the final build |
|---|---|---|
| D1 | `before-t1`, `before-t4`: redirect with no id says "not charged", clears the reference, "Back to registration"; paying again made two transactions on one reference | `final-r3a`: no id: Checking your payment, no Pay, no Back, no Start again, reference kept; after the server sweep the page's own 15 s check shows registered with no refresh; the status route is called every 15 s (10 calls in 2.5 min, 20 in 5 min), stops after 5 min, the support line shows with the right short reference; `final-t4`: the "Back to registration" link no longer exists, so the second charge cannot happen |
| D2 | `before-t1`: `status=cancelled` with a real id says "not charged" | `final-r3a`: cancelled + id verified: registered; cancelled + an id Flutterwave does not confirm: Checking, never "not charged" |
| D3 | `before-t1`: callback `pending` with an id returns to the form with Pay | `final-r3a`: callback pending and failed WITH an id: verified, Checking your payment, no form; once Flutterwave confirms, Check again registers. Callbacks with NO id and status successful, completed, pending or unknown: status route, Checking, never "not charged" (`r3a-only`) |
| D4 | `before-t12`: a refunded duplicate (`failed`) says "not charged" and shows the form | `final-r3a`: "You're already registered. This extra payment will be refunded. Email support@wawuafrica.com with your reference XXXX XXXX." after a late callback (verify answers `already_registered`) and after a refresh (status `failed`); `final-t12` |
| D5 | `before-t9`: an underpaid payment shows the endless generic checking screen | `final-r3a`: `payment_mismatch` (a real 1000 against 2000), `transaction_already_used` (real error body shape, stubbed), `not_found` (a real unknown reference), `already_registered`: each plain words + the support line with the reference, no Check again; `refusalOf` has one case per reason code (13) and a `never` check, so a code added later stops the build |
| D6 | `before-join.html`: the body held only a bailout template | `after-join.html`: static HTML holds the logo, eyebrow, heading and the form skeleton (`/join/paid`: logo and "Checking your payment"); no Suspense and no search-params hook; slow 3G (400 kbit/s, 400 ms, CPU x4): heading at 0.77 s, interactive form at 6.7 to 7.1 s (verifier before: nothing until about 3 s, form about 8 s) |
| D7 | `before-t2`: phone field unnamed, no aria, focus stays on Pay | `final-r3b`: role textbox "Phone number"; all four fields `aria-invalid` and `aria-describedby` their own message (text equal to the visible one); an alert "4 fields need fixing: ..."; focus lands on the first invalid field on each invalid submit (name, phone, email, consent in turn) and on a field the SERVER refuses (the phone) |
| D8 | `before-t3`: five submits in one task made 5 calls and 5 windows | `final-r3b`/`final-t3`: one registration call, one window, one row (a ref lock set before anything is awaited) |
| D9 | `before-t16`: the window opened for 2500 after the button said 2000 | `final-r3c-d9`: real backend restarted at 250000 kobo: no window, the button becomes "Pay ₦2,500", "The fee is now ₦2,500. Tap Pay to continue.", fields kept, tapping Pay opens 2500 NGN and registers one row (config restored, backend tree clean) |
| D10 | `before-t11`: `+234...` and `234...` refused | `final-r3b`: `+2348...`, `2348...` and `08...` each register and store `+234...` |
| D11 | `before-t11`: h1 right edge 411 px at 320 | `final-r3b`: a 46-letter first name wraps inside its card at 320 and 360 px (h1 right 279 of 304; no sideways scroll); picture `26-longname` and `29-registered-long-name` |
| D12 | `before-t2`: fields 15 px, consent 41 px, link 17 px | `final-r3b`: at 390 px all six fields and selects 16 px (15 px from 1024 px up, unchanged), consent row 59 px, privacy link 44 px (its own row), Pay 56 px |
| D14 | `before`: title was the offer name | `final-r3a`: `customizations.title` is "WAWU" |
| D16 | `before-t9`: still "Opening secure payment" at 12 s | `final-r3b`: at 15.5 s "The payment window did not load. Check your connection and try again." with Try again; the registration is kept; Try again reuses the same reference (one row, one window, same tx_ref, paid) in both endings (script arrives late, request fails late) |
| D17 | `before`: "Wait a minute" copy, no retry | `final-r3b` (paused clock): first 429 "Busy right now. Trying again..."; retries by itself at 2, 4 and 8 s (4 calls in all), then a manual Try again with "Try again in a few seconds"; no further automatic calls; with two 429s then a 200 the form appears by itself |

### Site mode (owner: production exposes only the registration link)
`src/middleware.ts` + `src/lib/site-mode.ts`; `SITE_MODE=join-only|full`; unset: `join-only` when `VERCEL_ENV=production`, else `full`; a typo falls back to that default (closed on production). **Allowed in join-only, exactly:** `/join` and `/join/paid` (any query string); `/privacy/policy` (the consent link; it redirects to `/terms`, the one document that holds the privacy provisions, so `/terms` is open too: otherwise the link would end on `/join`); `/_next/static/*`; `/_next/image`; `/robots.txt`; files at the site ROOT ending `.png .jpg .jpeg .gif .webp .avif .svg .ico .woff .woff2 .ttf .otf` (the logo, link-preview image, favicon, icon, apple-icon). **Everything else, pages and any `/api/*` alike, gets a 307 to `/join`** (I chose redirect for all, not 404); nested files (`/icons/..`, the PDF, the mp3 and mp4) and a profile page whose handle ends in `.png` (`/wawu/john.png`) are redirected too. The `/join` page links only to the privacy link and a mailto; the logo is a picture. `fetch` walk (`v/sitemode.mjs`, production build, `next start`, Chromium at `http://localhost:6021`): with `VERCEL_ENV=production`: `/`, `/sign-in`, `/sign-up`, `/wallet`, `/payment/return`, `/admin`, `/api/anything`, `/home`, `/events`, `/about`, `/professionals` each answer 307 and end on `/join`; a POST to `/api/anything` and a client-side (RSC) request to `/wallet` also 307; `/join`, `/join/paid` and `/privacy/policy` (landing on `/terms#privacy-and-data-protection`) load with no broken request, no broken image and nothing redirected away; `/og-image.png`, favicon, icon, apple-icon and both logos answer 200; the link-preview tags (`og:title`, `og:description`, `og:image`, `twitter:card`, canonical, noindex) are served (41 assertions, 0 failed). The same build with `SITE_MODE=full` (29), `VERCEL_ENV` unset (29) and `VERCEL_ENV=preview` (29) serves the whole site as before (`/` 200, `/sign-in` 200, `/sign-up` 200, `/wallet` then the app's own sign-in redirect, `/admin` and `/api/x` 404 as before); `SITE_MODE=join-only` with `VERCEL_ENV` unset (41) and a typo with production (41) are closed. Logs `logs/final-sitemode-*.log`.

### Size of the first load of `/join`
Before (round 2 head, my build): 335 kB first load (Next's figure), 327.7 kB gzipped across the route's 14 scripts (144.3 kB of it the whole lucide library). After: 163 kB, 159.2 kB gzipped across 13 scripts (`logs/size-before.txt`, `logs/build-12.log`; `chunksize.py` sums the gzip of the route's manifest files). Done by the shared `Icon` (separate commit `69d3d2d`, revert it alone to undo): `scripts/build-icon-set.mjs` writes `icon-set.generated.ts`, the 175 lucide icons whose names are string literals anywhere in `src/`, imported one by one; a name that only exists at run time goes to `LateIcon`, which loads the full library after the page has rendered (probe page: kebab ids that resolve are drawn in the static HTML, an unknown-to-the-set name appears after hydration with no warning, a nonsense name draws nothing as before). The public pages (`/`, sign-in, sign-up, forgot and reset password, terms, privacy, join) are pixel-identical before and after at 390 and 1280 px, dark and light (35 of 35 deterministic shots; the landing page moves between two runs of the same code, so it is not a comparison). This is "the icons the app names", not "only the icons this page uses": a per-route minimum needs every file to register its own icons, which I did not do.

### Checks
Website: `npx tsc --noEmit` 0; `npm run lint` exit 0 (the repo's existing `<img>` and hook warnings only); `npm run build` exit 0 (`NEXT_PUBLIC_API_BASE_URL` set; `/join` and `/join/paid` static); `npm run check:copy` clean; `npm run check:icons` current; no em-dash in the added user-facing text; secret scan of every staged diff (a Flutterwave secret-key prefix, `sk_`, bearer tokens, private-key headers, 40+ hex, 60+ base64): no match; `git status` clean of stray files. Round 2 walk (`w/walk2.mjs`, round 2 stand-in) on the final build: 89 passed, 0 failed (the same 89). Round 3 scripts on the final build: `r3a` 34/0 and `r3a-only` 4/0 (payment returns), `r3b` 40/0 (D7, D8, D10, D11, D12, D16, D17), `r3c-d9` 5/0, the verifier's `t1`, `t3`, `t6`, `t11`, `t12`, `t15` all pass; the verifier's `t5` copy scan clean (no plan, days, offer name or closing line, the naira symbol only on the pay button and the two "not charged" form states). Two verifier checks changed on purpose and are not defects: `t13` expects the old 429 copy on the register call ("Too many attempts"), now "Busy right now. Wait a few seconds and try again. You have not been charged."; `t4` step 4 and `t9`'s "Check again" after a mismatch wait for buttons that no longer exist.

### Pictures
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02r3/pics/<state>-<390|1280>-<dark|light>.png`, full page, 2x, 104 files from the production build against the real backend; sheets `pics/sheet-<390|1280>-<dark|light>-<a|b>.png`. States: `01-loading` (heading and form skeleton), `02-form`, `03-form-filled`, `04-form-errors` (first field focused, messages tied), `05-paying`, `06-verifying`, `07-checking`, `08-registered`, `09-already`, `12-cancelled`, `13-declined`, `15-return-not-paid`, `17-server-field-error`, `18a-busy-retrying`, `18b-busy-manual`, `19-return-registered`, `20-still-checking`, `21-support-mismatch`, `22-support-used`, `23-support-missing`, `24-extra-payment`, `25-no-payment`, `26-window-timeout`, `27-fee-changed`, `28-checking-cancel-unknown`, `29-registered-long-name`. Unchanged states (closed, no offer, unreachable) are in the earlier folders. I do not say they match anything: there is no artboard.

### Decisions (Default (agent), owner or lead may override)
- `failed` is treated like `cancelled` (Flutterwave's two "no charge" words), always with the status route's confirmation and never when an id exists: a declined card with no id returns to the form ("Your payment did not go through ... You have not been charged"), as the verifier confirmed and round 2's walk expects. One line to change: `negativeOf` in `JoinFlow.tsx`. A callback with an id and status `failed` goes to Checking (ruling 1).
- Every Checking screen asks the STATUS route by itself (cheap, and the only route that shows the webhook and the server's re-check); "Check again" verifies when an id exists. Each poller is 4 calls a minute for 5 minutes against a limit of 600 reads per 10 minutes per address: more than about 25 payers stuck on Checking at once on one venue address would reach it (a 429 is read as "unknown", never as "not charged").
- "I have not paid. Start again" stays only for a refresh while the window was open (stored reference, no id, no word from Flutterwave); it is the person's own statement, and it is the only way the stored reference is cleared while the outcome is unknown. Every return from Flutterwave has no such button.
- `/join/paid` with no reference anywhere says "We couldn't find a payment" and names the support address; it makes no claim about money.
- D16: a stalled script request is NOT abandoned: the browser reuses a stalled request for the same address, so a second `<script>` only joins the first (seen: no second request left the browser). The retry waits on the same load again, or opens the window at once if the script arrived meanwhile. Whether a real stall behaves this way on Flutterwave's host is NOT RUN.
- The privacy link is its own 44 px row under the consent sentence (link text "Read the privacy policy"; same address, new tab).
- The shared files changed, each additive and off by default for every other caller: `Input` (prop `noZoom`; `aria-invalid`, `aria-describedby` and an id on the message under a field with an error or hint), `PhoneInput` (props `id`, `error`, `noZoom`; its label is now a real `label`), `Select` and `Checkbox` (new in this branch), `flutterwave.ts` (error classes `FlutterwaveNotConfirmedError` and `FlutterwaveScriptTimeoutError`, optional `scriptTimeoutMs`; the old message text is unchanged), and the shared `Icon` (see above). The sign-up page draws the same pixels.
- Redirect address: Next only takes an absolute URL in middleware and builds it from the request; on `next start` it names a loopback IP host "localhost", so walk the site as `http://localhost:PORT` (there the redirect is `Location: /join`, same origin); on a bare 127.0.0.1 it answers `http://localhost:PORT/join`. On Vercel it is the public host.

### NOT RUN
- A real Flutterwave payment: whether the real checkout calls the callback, redirects, or both, and with which status and id on a bank transfer or USSD; unblocked by one live card payment and one live bank-transfer payment watched in the address bar and the page.
- A real stalled checkout script (D16), and iPhone Safari on the 16 px fields (D12): need a phone on a throttled connection.
- The middleware on Vercel's Edge runtime: walked only on `next start`. Unblocked by one deploy of this branch to production and `curl -sI https://wawuafrica.com/sign-in` (307 to `/join`), `https://wawuafrica.com/join` (200), and `SITE_MODE=full` in Vercel reopening it after a redeploy.
- Pages inside `/terms` itself: the terms page keeps the app's header and links, which now redirect to `/join` in production; checked only that it loads and shows the privacy section.
- The WhatsApp preview and a real phone: as before (the tags are served).

## Verifier report, round 3 (10 Oct 2026)

Independent verifier (wrote none of this). Website `origin/wmt/JOIN-02` verified at `69d3d2d`; the branch then moved to `ac6679d`
(`git diff 69d3d2d ac6679d` is two comment lines at the top of `src/lib/site-mode.ts`, comment-only, confirmed) and website `main`
moved from `80c3671` to `233d6b1`, the merge of JOIN-02 (#24): `git diff 233d6b1 origin/wmt/JOIN-02` is empty, so what was verified is
what is on main. Backend `origin/main` `b5e7877` (JOIN-01 and its round 3), built locally on :6042 with its own database
(`vj02r3_test_join`, dropped), Flutterwave stood in at the DI seams (the round 1 strict stand-in: a transaction exists only if the
browser stand-in made it) and in the browser. Nothing outside 127.0.0.1/localhost was called (every other host aborted and recorded).
Scripts, logs and pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02r3/` (`mx.mjs` the payment matrix, `codes.mjs` and `codes2.mjs` the reason codes, `sm.sh` and `sm2.sh`
the site-mode attacks, `ic.mjs` the icon compare, `d.mjs`, `slow.mjs`, `sa.mjs`, the round 1 `t1` to `t15` re-run).

**Verdict: review. No blocker.** One should-fix that needs a lead decision (N1), the rest notes. Website typecheck, lint, build,
check:copy and check:icons all pass.

### D1 to D17

| D | Result | Evidence (this round) |
|---|---|---|
| D1 | CLOSED | `t1` unchanged: redirect `status=successful` with no `transaction_id` after a real charge: "Checking your payment", no Pay, no Back link, reference kept; `t4` steps 1 to 3: the server sweep marks it paid and a refresh shows registered; the "Back to registration" link that caused the double charge no longer exists on that screen (`t4` step 4 cannot click it) |
| D2 | CLOSED | `status=cancelled` with a real id: registered (verify decides) |
| D3 | CLOSED | callback `pending` and `failed` WITH an id: Checking your payment, no form, no "not charged" |
| D4 | CLOSED | `t12` unchanged: a kept duplicate (`failed`) after refresh: "You're already registered. This extra payment will be refunded. Email support@wawuafrica.com with your reference XXXX XXXX.", no Pay |
| D5 | CLOSED | all 13 codes x verify route and status route (`codes.mjs`) and register route (`codes2.mjs`): verify `already_registered` gives the refund sentence, `payment_mismatch`, `transaction_already_used`, `not_found` give support words + short reference, `payment_not_confirmed`, `payment_check_unavailable`, 429, 5xx, network and an unknown new code stay on Checking; register route: `no_open_offer`, `offer_closed`, `already_registered` have their own screens, the four field codes show under their field, `payments_unavailable` its own sentence, the rest (and 429/500/network) "Something went wrong/Busy/We couldn't reach WAWU ... You have not been charged" with the form and no window ever opened |
| D6 | CLOSED | static HTML holds the logo, "Register for WAWU" and the skeleton (no bailout template); `/join/paid` static HTML says "Checking your payment". Slow 3G (400 kbit/s, 400 ms, CPU x4): heading in the DOM at 0.76 s, first contentful paint 3.2 s (CSS and logo are the cost), input usable 7.2 s (round 1: about 8 s). No throttle: FCP 0.3 s, usable 0.7 s. Transfer 267 kB in 20 requests, scripts 165 kB gzipped; Next's first load 163 kB (335 kB before). `slow.mjs` |
| D7 | CLOSED | phone textbox named "Phone number"; four invalid fields carry `aria-invalid` and `aria-describedby` to their message; alert "4 fields need fixing: Full name, Phone number, Email, Consent."; focus lands on the first invalid field |
| D8 | CLOSED | 3 `requestSubmit` + 2 clicks in one task: 1 registration call, 1 window (`d.mjs`, `t3`) |
| D9 | CLOSED | offer shown as ₦1,900 against a server charging ₦2,000: no window, "The fee is now ₦2,000. Tap Pay to continue.", button becomes ₦2,000, second tap opens 2000 NGN and registers |
| D10 | CLOSED | `+2348031234567`, `2348031234567`, `08031234567` all accepted |
| D11 | CLOSED | a 46-letter first name fits at 320 (h1 right 279), 360 (319) and 390 (349), no sideways scroll |
| D12 | CLOSED | at 390 px all six fields 16 px, privacy link row 44 px, consent row 59 px, Pay 56 px. iPhone Safari itself NOT RUN |
| D13 | OPEN (not the builder's) | "your plan will be waiting" is still a promise nothing backs until JOIN-03 and an app release; unchanged |
| D14 | CLOSED | the window opens with `customizations.title` "WAWU" and `redirect_url` `<origin>/join/paid` |
| D15 | not the builder's | the merge into main happened (`233d6b1`); the WEBPAY-01 conflict is whoever merges second |
| D16 | CLOSED | a never-answered checkout script: still "Opening secure payment" at 14 s, "Payment did not start / The payment window did not load" with Try again at about 15 s; no "not charged" claim; the registration is reused on retry |
| D17 | CLOSED | 429 on the offer load: calls at 0.5, 2.5, 6.5, 14.5 s (initial + 2, 4, 8 s retries), then "Please wait a moment ... Try again in a few seconds"; manual Try again recovers |

### The one rule (payment return), attacked

`mx.mjs ret` (96 cases, each also refreshed and opened in a new tab: 288 loads): `/join/paid` with status in successful, completed,
pending, cancelled, failed, unknown, empty, absent, with and without a transaction id, status route paid, pending, failed, 404 (reason
code), 429, 500, network error, and verify paid, 409 not confirmed, 429, 500, network. `mx.mjs cb` (103 cases, the real register route,
the callback and the window closing, refreshed after): same grid. **0 violations in both.** "You have not been charged" appeared in
exactly the cases where Flutterwave said cancelled or failed, no id existed and the status route answered pending or `not_found`
(never on 429, 500, network, an unknown status word, an empty status, or any case with an id). A paid answer always gave the registered
screen, a `failed` row always the refund sentence, and no case with an id or an unknown outcome showed a Pay button, the form or
"Back to registration" (the one exception, the stored "Start again", is N1). Polling (`mx.mjs poll`, fake clock): status route every 15 s
(calls at 15, 30, 45, 60 ... 300 s), 20 calls in 5 minutes, no burst, then it stops and the support line with the short reference
appears; a 429, 500, network error and an HTML 404 are all read as unknown (still Checking, never "not charged"); a row that turns
paid at 40 s shows registered by itself without a refresh.

### Site mode (`VERCEL_ENV=production`, production build, `next start`)

About 190 raw requests (`curl --path-as-is`, `sm.sh`, `sm2.sh`, logs `logs/sm-*.log`) and a Chromium walk (`prodwalk.mjs`). Every path
outside the allowed list ended on 307 to `/join` or on a 404 that is not a page; **no bypass found, nothing but `/join`, `/join/paid`,
`/terms`, `/privacy/policy` and root static files ever rendered.** Tried: `/JOIN`, `/Join/` (308 then 307), `/join/` (308 to `/join`),
`/join/../wallet`, `/%6Aoin`, `/join%2F..%2Fwallet`, `//wallet`, `///wallet`, `/join/paid/../../admin` (plain and percent-encoded dots),
`/_next/data/<build>/wallet.json` (307; `/join.json` serves the join page), `/_next/static/../../wallet` (404), `/_next/image?url=/wallet`
(400), `/_next/staticx`, `/_next/image/..`, RSC, prefetch, `Next-Router-State-Tree`, `x-nextjs-data`, `x-middleware-subrequest` (the
CVE-2025-29927 header, Next 14.2.35 is patched: 307), `x-middleware-prefetch`, `x-matched-path`, `x-invoke-path`, Next-Action POST,
Host and X-Forwarded-Host changes, HEAD/POST/PUT/PATCH/DELETE/OPTIONS on `/wallet` and `/api/anything` (307; the same methods on
`/join` give 405 as a page does), `/api/*`, nested public files (`/icons/x.svg`, `/mock/x`, the PDF: 307), root files with encoded
slashes (`/wawu%2fjohn.png`, `/wallet%2fx.png`, `/admin%2f..%2fx.svg`: 404), `/wawu/john.png` (307), `/wallet.png` (404, no such file),
the reverse direction (`/wallet/../join`, `/wallet/%2e%2e/join`, `/home/./../join`: 404, never `/wallet`), `/terms/x.png` and
`/privacy/policy/x` (307), `/robots.txt` (open, there is no such file: 404), `/sitemap.xml` (307), query strings
(`/join?x=/wallet` serves `/join`). `/privacy/policy` is the app's own `redirect()` to `/terms#privacy-and-data-protection` (same
answer in full mode); in a browser the consent link opens `/terms#privacy-and-data-protection`. **`/terms` open: acceptable.** Its
rendered page has no navigation: no link at all except in-page anchors (header, nav, footer links none), so nothing on it leads
anywhere useful. `SITE_MODE=full` with `VERCEL_ENV=production`, `VERCEL_ENV` unset and `VERCEL_ENV=preview` all serve the whole site
(`/` 200, `/about` 200, `/wallet` 200, `/sign-in` 200, `/sign-up` 200, identical byte counts across the three; `/admin` and `/api/x`
404 as before). `SITE_MODE=jionly` (typo) with production stays closed; `SITE_MODE=JOIN-ONLY` (upper case) with no `VERCEL_ENV` is
closed. In the production-mode browser walk `/join` loaded with no broken request and no redirect.

### Sign-up and auth untouched

`git diff origin/main --stat -- 'src/app/(auth)'` is empty. The shared `Input` and `PhoneInput` (both used by the sign-up page) DID change
(additive props, `aria-invalid`, `aria-describedby`, ids on the message line, the phone label is now a real `<label for>`), so the
brief's literal "no shared auth component changed" is not met; see N3. Main against branch, production builds: sign-up (including the
details step that holds the six fields and the shared `PhoneInput`), sign-in, forgot-password and reset-password at 390 and 1280 px, dark
and light: 16 screenshots and the sign-up details step, all pixel-identical (the only difference is a 30 x 25 px region in one light
shot with 0 pixels above the visible threshold); DOM identical after ids are stripped.

### The shared Icon change (`69d3d2d`)

**Verdict: SHIP it today (no revert needed).** Main (`80c3671`) against the branch, both production builds with mock data and a signed-in
creator session, 390 px, dark: `/home`, `/wallet`, `/events`, `/settings`, `/notifications`, `/explore`, `/admin/notifications`,
`/communities`, `/earnings`, `/creator`, `/search`, `/messages`, `/profile/WAWU-0001`, `/learn`, `/tickets`, `/saved`, `/purchases`, `/about`,
`/shop`, `/content/1`, `/services`, `/professionals`, `/create` (23 pages, 3 to 56 icons each): the list of drawn `lucide` svgs (class
and path content) is identical on every page, the screenshots are identical in 22 and in `/earnings` differ in an 8 x 32 px area with no pixel
above the visible threshold; console messages identical (only my own blocked font request), no hydration message. A runtime-only name
(probe page in a throwaway worktree, deleted): names in the set (`shield-check`, `building-office`, `Check`) are in the server HTML; a valid name
not in the set (`Dog`, `Cat`) is not in the server HTML and appears after hydration (about 4 s in dev on a cold compile), a nonsense name draws nothing,
and the console holds no error or hydration warning. The icons that arrive late are only names no source file writes (the
backend-supplied `PartnerService.icon` is the one such path found); I could not drive those with real API data. Effect on `/join`: first load
163 kB (335 kB before).

### New defects

- **N1 (should fix; the lead decides whether it is a blocker). "I have not paid. Start again" after a reload while the payment window was open offers the form and Pay although money may have moved.** The brief's rule is "never the form once the outcome is unknown". Reproduction `sa.mjs`: Pay with the window open, the bank transfer lands at Flutterwave, the browser reloads the page (what a phone often does on return from a bank app): "Checking your payment ... If you finished paying, check again. If you did not pay, you can start again." with Check again and "I have not paid. Start again"; tapping the second shows the form with Pay; paying again made two successful transactions against one reference (the row records the second; the first is orphaned, no `failed` row, the sweep finds nothing, owed back by hand). The builder made this choice on purpose (the person's own statement; the copy is explicit) and round 1 accepted it as a note; I rate it should-fix because the only protection is the person reading the sentence, and because a second tab opened from the QR gets a clean form the same way (sessionStorage is per tab), so removing the button would not close the path alone. Cheap mitigation if wanted today: show "Start again" only after the 5-minute Checking period ends (the support line time), or ask for a second tap; the real fix is server side (refuse a second initCharge while the first transaction exists for the reference, or reconcile an orphaned transaction by reference).
- **N2 (note, deploy). The lock-down depends on Vercel exposing `VERCEL_ENV`.** If the project has "Automatically expose System Environment Variables" off, `VERCEL_ENV` is undefined and the site stays fully open (fail open). Set `SITE_MODE=join-only` explicitly in the Production environment (the code accepts it) and, after the deploy, check `curl -sI https://wawuafrica.com/sign-in` (307 to `/join`), `/wallet`, `/admin`, `/api/x`, and that `/join` is 200. The Edge runtime itself is NOT RUN.
- **N3 (note). Shared `Input` and `PhoneInput` changed.** Additive and off by default; the sign-up page is pixel-identical and DOM-identical (above); the visible behaviour difference is that tapping the phone label now focuses the phone field. If "do not touch the sign-up page" means zero changed shared files, this is the one thing to reconsider.
- **N4 (note). A status route `not_found` counts as "not paid".** `status=cancelled` with no id and a 404 `not_found` for a well-formed reference shows "You have not been charged". A bare 404 without `reason.code` (a wrong gateway) is read as unknown, so only the API's own answer reaches that screen. Defensible; recorded.
- **N5 (note). "You have not been charged" also appears before any window opens** (register route errors, closed offer, already registered, script unavailable). True by construction (the matrix shows the window never opened in each), outside the return rule.
- **N6 (note). Slow 3G first paint is still about 3.2 s** (the stylesheet and logo, 400 ms per round trip); the form is usable at about 7.2 s. Better than round 1, still a visible wait on a crowded venue network.
- **N7 (note). `/_next/static/*` stays open** (the build's script and style files, including those of blocked pages). Expected; no page or data.

### Checks

Website (worktree at `69d3d2d`, `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:6042`): `npx tsc --noEmit` 0 (26 s); `npm run lint` exit 0 (17 warnings, the repo's `<img>` and hook warnings, one in `JoinShell.tsx`); `npm run build` exit 0 (`/join` and `/join/paid` static, 163 kB first load, middleware 26.8 kB); `npm run check:copy` 0 ("copy rules: clean"); `npm run check:icons` 0 ("icon set: current (175 icons)"); no em-dash in any `src/app/join` file or `waitlist.ts`. Round 1 scripts re-run on this build: `t1`, `t3`, `t4`, `t6`, `t12`, `t15` pass (t4 step 4 and t9 wait for a button that no longer exists on purpose). Backend and mobile source unchanged by this branch.
Mobile `npm run check` on this report commit: exit 0 (typecheck, lint, jest 109 passed, 109 total; 1852 passed, 1852 total, gates 10 run, 445 files, 0 fail, 13 warn, 0 accepted, task check passes: 271 tasks, 279 artboards). The known `eventsScreens.test.tsx` flake did not occur. Log: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02r3/logs/mobile-check.log`. Secret scan of the staged diff (Flutterwave secret-key prefix, `sk_`, bearer tokens, private-key headers, 40+ hex or 60+ base64 runs): the only long hex strings are the website commit hashes quoted in the text; nothing else matched.

### NOT RUN

- A real Flutterwave payment, and which of callback or redirect, with which status and id, the real checkout sends for bank transfer and USSD. Unblocked by one live card payment and one live bank transfer watched in the address bar.
- The middleware on Vercel's Edge runtime (N2). Unblocked by the post-deploy `curl -sI` checks above.
- iPhone Safari on the 16 px fields, a real phone, the WhatsApp preview (the tags are served: `og:title`, `og:description`, `og:url`, `og:image` absolute, `twitter:*`, canonical, noindex), a phone camera on the printed QR. Unblocked by a phone on the live link.
- The icon compare at 1280 px, in light theme, and on pages that draw backend-supplied icon names; the Icon verdict rests on 23 pages at 390 px dark plus the sign-up and auth shots at both widths and themes.
- The full backend suite and the protected suite (no backend change here). The Flutterwave webhook path (the sweep `recheckPending` stood in for it).
- A stalled real checkout script on Flutterwave's host (D16 was driven with a never-answered stand-in).

## Lead merge note (10 Oct 2026)

Merged 10 Oct 2026 as website #24 (233d6b1), live on wawuafrica.com/join from 05:13 UTC on the owner's instruction before the round 3 verification ended; round 3 then came back review with no blocker (mobile 948a9d6): D1 to D12, D14, D16, D17 closed; site mode held against about 190 bypass attempts. N1 (Start again after a reload can charge twice) follows in JOIN-02 round 4. D13 (the claim) is JOIN-03.

## Brand change (builder, 10 Oct 2026)

Builder, Sonnet agent. Website branch `wmt/JOIN-02-brand` at `9bee60a` (from `origin/main` 233d6b1, the live page). Backend it was walked against: `origin/main` 0694ced, unchanged (a worktree, stood-in Flutterwave). Nothing under `src/app/(auth)/` changed. Status left as `done`: this is a post-merge change the lead merges, not a new build.

### What changed (owner, 10 Oct 2026, words kept exactly)
- **Top of `/join`** (every state shows the logo, the form state shows the whole block): the Who Made This horizontal lockup, "PRE-REGISTRATION / WAITLIST", "WHO MADE THIS?", "Get 50% OFF your subscription to WHO MADE THIS? the creator and professional monetization platform.", "LAUNCHING OCTOBER 17, 2026" as a small accent label (the shared Badge), "Register now. Create. Monetize. Grow." Then the form as it was.
- **Logo files** at the ROOT of `public/` (join-only mode serves only root-level static files): `who-made-this-white.png` and `who-made-this-ink.png`, byte-identical copies of `assets/brand/horizontal-white.png` and `horizontal-ink.png` (the white one on the dark page, the ink one when the page is in its light theme). The old `og-image.png` shows the WAWU smile, so `/join` and `/join/paid` use a new `who-made-this-og.png` (1200 x 630, the white lockup on the site's dark page colour with its purple glow). The rest of the site keeps `og-image.png`.
- **Page title and tags**: title "WHO MADE THIS? Pre-registration" (also `/join/paid`), description "Get 50% OFF your subscription to WHO MADE THIS?, the creator and professional monetization platform. Launching October 17, 2026.", `og:title`, `og:description`, `og:site_name` ("WHO MADE THIS?"), `og:image` and its alt, `twitter:title`, `twitter:description`, `twitter:image` all the owner's.
- **Screen after payment** (owner's later words, `/join` and `/join/paid`): logo, success tick, "YOUR WHO MADE THIS? LAUNCH ACCESS CODE", the code large (the short reference "XXXX XXXX"), a "Copy code" button, "Keep your unique ID safe! 🔐", the paragraph, the IMPORTANT line as a warning Callout, "Keep it safe. Don’t lose it. Your code, your discount!" The old "You're registered, <name>" heading, the "Your reference" label and the "Sign up in the ..." line are gone.
- **Copy code**: `navigator.clipboard.writeText` of the displayed code; the button says "Copied" only once the browser accepted it (back to "Copy code" after 2.5 s) and a status line announces it. If the clipboard is missing or refuses, the code text is selected instead and the button never says Copied.
- **Unchanged on purpose**: "Pay ₦2,000" (from the API), every payment state and its words, the consent line, support@wawuafrica.com, the Flutterwave line under the button, the sign-up and auth pages.

### Files (website, 12)
`public/who-made-this-white.png`, `who-made-this-ink.png`, `who-made-this-og.png`; `src/app/join/page.tsx`, `paid/page.tsx`, `components/JoinShell.tsx` (logo), `JoinHeading.tsx` (the block), `JoinFlow.tsx` (registered case, "already registered" app name), `LaunchAccessCode.tsx` (new), `StateCard.tsx` (new `wide` prop, `/join` only); `src/components/ui/Callout.tsx` (new `size` prop, `"sm"` stays the default so every other Callout is unchanged); `docs/03_USER_FLOWS.md` (section E now says what the page says). Tokens and shared UI only, no `style={}`, no hex, no em-dash in the diff.

### Proof
- `VERCEL_ENV=production` production build served with `next start`: `/join` and `/join/paid` 200; the visible logo image loads (complete, 1009 x 295, no 4xx or 5xx on the origin) at 360, 390 and 1280 px, `who-made-this-white.png` on dark and `who-made-this-ink.png` after `data-theme=light`; no horizontal overflow at any of the three widths; `/who-made-this-og.png` 200 `image/png` 1200 x 630. The lock-down still holds: `/`, `/sign-in`, `/sign-up`, `/wallet`, `/admin`, `/api/hub/waitlist/offers/current` and `/wawu/ada.png` all 307 to `/join`; `/join`, `/join/paid`, `/who-made-this-white.png` 200. Script `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02brand/prod.mjs`.
- Registered screen through the real flow (stood-in Flutterwave, real backend and database): callback success on `/join` and redirect return on `/join/paid` both end on the new screen with an `XXXX XXXX` code; the old heading and the sign-up line are not on the page; the five owner lines are on the page word for word (curly apostrophes, emoji, ₦10,000) and in the order top to bottom: heading, code, Copy code, Keep your unique ID safe, paragraph, IMPORTANT, closing line. Script `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02brand/copytest.mjs`, 17 checks, all pass.
- **Copy button, Playwright with clipboard permissions granted** (`clipboard-read`, `clipboard-write`): the clipboard held "before", one click on "Copy code", the button said "Copied", `navigator.clipboard.readText()` returned exactly the code shown, and the button went back to "Copy code" after about 3 s. With `writeText` stubbed to reject, and with `navigator.clipboard` removed, the code was selected (`getSelection().toString()` equals the code) and "Copied" never appeared.
- Head tags read from the served HTML (`curl`): title, description, `og:title`, `og:description`, `og:image` (absolute, `who-made-this-og.png`), `og:image:width` 1200, `og:image:height` 630, `twitter:card` `summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.

### Pictures (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02brand/pics/`)
- Form: `form-390-dark.png`, `form-1280-dark.png`, `form-390-light.png`, `form-1280-light.png`, `form-360-light.png`.
- Registered (the new screen): `registered-390-dark.png`, `registered-1280-dark.png`, `registered-390-light.png`, `registered-1280-light.png`, `paid-registered-390-dark.png` (on `/join/paid`), `copied-390-dark.png` (after the click).
- Checking: `checking-390-dark.png`, `checking-1280-dark.png`, `checking-390-light.png`, `checking-1280-light.png`.
- Link-preview image: `public/who-made-this-og.png` in the website branch.

### Checks
Website at `9bee60a`: `npm run typecheck` 0, `npm run lint` 0 (the repo's `<img>` warnings, the same two in `JoinShell.tsx` as before), `npm run build` 0 (`/join` and `/join/paid` static, 164 kB first load, middleware unchanged), `npm run check:copy` 0 ("copy rules: clean"), `npm run check:icons` 0 ("icon set: current (175 icons)"; `Copy` and `Check` were already in the set). Secret scan of the website diff (hex runs of 32 or more, `sk_`, `FLWSECK`, bearer tokens, private-key headers): nothing matched. Backend and mobile app source unchanged. Mobile `npm run check` (this branch changes only the task file, `docs/LOG.md` and the generated `docs/PROGRESS.md`): first run exit 1 with two 20 s test timeouts while the host load average was 34 (`OpenWalletScreen.test.tsx` A26 and `settingsScreens.test.tsx` Z3, neither near this change; the known `eventsScreens.test.tsx` flake did not occur); both files run alone passed (128 of 128, exit 0); the whole check run again: exit 0 (jest 113 suites, 1914 of 1914 passed, gates 10 run, 459 files, 0 fail, 16 warn, task check passes: 271 tasks, 279 artboards). Logs: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02brand/logs/mobile-check.log`, `mobile-alone.log`, `mobile-check2.log`.

### Decisions (Default (agent), owner or lead may override)
- The "You are already registered" screen also said "Sign up in the WAWU app". It names the same app as the registered screen, so it now says "the Who Made This app" (R-37). The brief named only the registered screen.
- Left as WAWU, because they name the company or a payment word the brief keeps: the consent line "I agree to WAWU contacting me about my registration.", "We couldn't reach WAWU", the Flutterwave window's title "WAWU", support@wawuafrica.com, the favicon and apple icon (not in the brief), and the site-wide `og-image.png` for every other page.
- The code is the short reference the page already showed (the first 8 characters of the random part, two groups of 4). The Copy button copies it as shown, with the space.
- The ₦10,000 in the IMPORTANT line is a literal in the page: the owner gave it in the copy ("write it as given"). It is not read from the price file, so it will not follow a change there. The Pay button still reads its amount from the API.
- "Callout" got a `size` prop and the access-code screen's StateCard a `wide` prop rather than a copy of either component (website convention). The warning tone is the design system's highlighted note.

### Findings for the lead
- The code the page shows is 8 characters (32 bits). JOIN-03's claim has to look a registration up by this short code and refuse a match that is not unique; this page only displays and copies it.
- `phase.registered` still carries `firstName` (the screen no longer shows it). Removing it needs the status and verify helpers to stop returning it; left alone to keep the change to words and layout.

### NOT RUN
- A real Flutterwave payment and a real phone: every payment here is the stand-in. Unblocked by one live card payment on the live link from a phone.
- iPhone Safari and in-app browsers (WhatsApp, Instagram) for the Copy button and the emoji font: only Chromium was driven, with the failure paths stubbed. Unblocked by a phone opening the live link and tapping Copy code.
- The WhatsApp or X link preview itself: the tags and the 1200 x 630 image are served and checked, the scrapers were not called. Unblocked by pasting the live link into a chat after the deploy.
- The middleware on Vercel's Edge runtime (JOIN-02 N2 still stands). Unblocked by `curl -sI https://wawuafrica.com/sign-in` (307 to `/join`) and `/who-made-this-white.png` (200) after the deploy.
- Light theme on a phone's own colour scheme: the page switches only by `data-theme="light"`, so the light pictures set that attribute.

## Brand change (verifier, 10 Oct 2026)

Verifier, Sonnet agent, independent of the builder. Website `origin/wmt/JOIN-02-brand` `9bee60a` against `origin/main` `233d6b1` (12 files, all read); backend `origin/main` `0694ced` (a worktree, local database, Flutterwave stood in by my own harness, never a real host). Mobile branch read at `c788efa`. Production build served with `VERCEL_ENV=production`. Nothing in the website or backend was changed or pushed.

**Verdict: MERGE. No blocker.** One should fix (V1, the payment window still says WAWU) and three notes. Every owner word, the code and the Copy button hold up under 18 pictures, 3 widths, both themes and 8 clipboard cases.

### Defects
| Id | Severity | What | Where | Reproduce |
|---|---|---|---|---|
| V1 | should fix | The Flutterwave payment window opened from the Pay button is still the old brand: title "WAWU", description "Event registration fee" (the old default copy), and the WAWU logo. The builder listed the title as left on purpose; the logo and the description were not mentioned. The logo is hard coded for every Flutterwave flow, so the fix is a new optional `logo` input on `openFlutterwaveCheckout`, not a change of the shared default. | `src/app/join/components/JoinFlow.tsx:497` (title, description); `src/lib/flutterwave.ts:390` (`logo: ${origin}/wawu-logo-white.png`) | Read from source. Not seen in a real window (stand-in only, see NOT RUN). |
| V2 | note | `/join/paid` sets only a title. Its description, `og:*` and `twitter:*` are the root layout's: "WAWUAfrica: get paid for what you know", `og-image.png` (the WAWU smile). Same on main, and nobody shares that address on purpose (it carries `tx_ref` and `transaction_id`, and is `noindex`), so no harm today. | `src/app/join/paid/page.tsx` | `curl http://localhost:PORT/join/paid`, read the `<meta>` tags. |
| V3 | note | The "You are already registered" screen shows no code and tells the person to sign up in the app. Someone who paid earlier and lost the code has no way to see it again on this page. Product call, belongs with the claim (JOIN-03). Its wording is now "the Who Made This app" (picture `already-360-dark.png`). | `JoinFlow.tsx` `already` case | Pay twice with the same phone and email. |
| V4 | note (cosmetic) | (a) The card is `role="status" aria-live="polite"` and holds a second `role="status"` line plus a button whose own label turns to "Copied": a screen reader can announce the copy twice. (b) The paragraph "Your code is your key..." leaves "2026." alone on its last line at 360 and 1280. (c) The eyebrow (12 px, accent-hover purple on the dark page) is about 3.6 to 1 by my calculation; it is the same token and size the old eyebrow used, so not new. | `LaunchAccessCode.tsx`, `JoinHeading.tsx` | `registered-360-dark.png`, `registered-1280-light.png`. |

Not defects, recorded so nobody chases them: `//sign-in` answers 308 to `/sign-in` (Next normalises the double slash) and then 307 to `/join`; `/who-made-this-og.png?x=1/../../sign-in` is 200 because the path is the PNG (the dots are in the query).

### Checks (CONFIRMED unless a defect is named)
1. **Top block words**: CONFIRMED. At 360, 390 and 1280, dark and light, "PRE-REGISTRATION / WAITLIST", "WHO MADE THIS?", "Get 50% OFF your subscription to WHO MADE THIS? the creator and professional monetization platform.", "LAUNCHING OCTOBER 17, 2026" and "Register now. Create. Monetize. Grow." are all in the page text, in that order, with `text-transform: none` on each (so the capitals are the source's, not CSS).
2. **After-payment words**: CONFIRMED. The heading is exactly "YOUR WHO MADE THIS? LAUNCH ACCESS CODE" (the only `h1`); the four owner lines are in the rendered text character for character, in order after the code and the button. Source code points match the owner's text: U+2019 twice, U+1F510, U+20A6. "₦10,000" is in the copy; "Pay ₦2,000" is on the button (offer `priceKobo` 200000 from the API).
3. **Old copy gone**: CONFIRMED for "Register for WAWU", "EVENT REGISTRATION", "You're registered", "Sign up in the WAWU app", "Your reference", "Join WAWU" and the old `og-image.png` in `/join` (rendered text and served HTML). Survivors, all named: V1; V2; the consent line "I agree to WAWU contacting me about my registration." (the company, kept by the brief); "We couldn't reach WAWU"; the "already registered" titles (payment states, kept by the brief).
4. **Presentation only**: CONFIRMED. `JoinFlow.tsx` diff is one import, one comment, the `already` sentence and the `registered` body (the latter now `LaunchAccessCode`); no state, effect, call or branch changed. 12 files, none under `src/app/(auth)/` (diff empty). `Callout`: `size` defaults to `"sm"`, which produces the same icon size (15) and the same class strings as before for the title and the body, so every other page renders identically. `StateCard`: `wide` defaults to false and gives the same class string as before.
5. **Production, logo and preview image**: CONFIRMED. `/join` and `/join/paid` at 360, 390, 1280, dark and light: exactly one visible logo (`who-made-this-white.png` on dark, `who-made-this-ink.png` on light, 1009 x 295 natural, 46 px high at phone width and 56 px at desktop), no 4xx or failed request, no horizontal overflow. `/who-made-this-og.png` is 200 `image/png`, 1200 x 630 (I looked at it: white lockup centred on the dark page colour with the purple glow). Logo files are byte-identical to `assets/brand/horizontal-white.png` and `horizontal-ink.png` (md5). Head tags: title, description, `og:title`, `og:description`, `og:site_name`, `og:image` (absolute), `og:image:width` 1200, `og:image:height` 630, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` all the owner's.
6. **Lock-down**: CONFIRMED. 307 to `/join`: `/`, `/sign-in`, `/sign-up`, `/wallet`, `/admin`, `/home`, `/api/hub/waitlist/offers/current`, `/api/anything`, `/wawu/ada.png`, `/%2e%2e/sign-in`, and four tricks on the new names (`/who-made-this-white.png/x`, `/who-made-this-ink.PNG`, `/images/who-made-this-white.png`, `/who-made-this-white.png.map`). 200: `/join`, `/join/paid`, `/terms`, the three new PNGs. `/privacy/policy` 307 (to `/terms`, as before). `src/lib/site-mode.ts` and `src/middleware.ts` are untouched, so the only new allowed paths are the three PNGs, which match the existing root-static rule.
7. **The code**: CONFIRMED on 7 real registrations (6 through the `/join` window callback, 1 through the `/join/paid` redirect return): the code shown equals the first 8 hex characters of the stored reference, upper case, 4 and 4, every time; after a reload of `/join/paid` the same screen and the same code come back.
8. **Copy code**: CONFIRMED. With clipboard permission: the clipboard held "before", one click, the button said "Copied", the live line said "Copied", `readText()` returned exactly the code as shown (with its space), the label returned to "Copy code" after about 2.5 s, double click stays "Copied". Failure paths, each with the text selected (`getSelection()` equals the code) and "Copied" never shown: `writeText` rejecting, `writeText` throwing, `navigator.clipboard` missing, `writeText` that never settles (no selection, label stays "Copy code"). Success then rejection: "Copied" then back to "Copy code". Tapping the code selects all of it. (Headless Chromium without a granted permission accepts the write, so that real run said "Copied".)
9. **Pictures and geometry**: CONFIRMED. 18 pictures (form, registered, checking at 360, 390, 1280, dark and light), each audited in the page: 0 text boxes past the viewport edge, 0 clipped boxes, 0 overlapping text boxes, scroll width equal to client width. I looked at `form-360-dark`, `registered-360-dark`, `form-1280-light`, `registered-1280-light`, `checking-360-light`, `copied-390-dark` and `copy-rejected-390-dark`: nothing clipped or overlapping, the logo is sharp at 2x. The other 11 were checked by the audit only. Extra: `already-360-dark.png`.
10. **No em-dash**: CONFIRMED. None in the rendered text of the form and registered states, none in the HTML of `/join` and `/join/paid`, none in any added line of the website diff (code, comments and `docs/03_USER_FLOWS.md`), none in `src/app/join` outside comments.
11. **Website checks at `9bee60a`**: typecheck 0; lint 0 (only the repo's `<img>` and hook warnings, the same two in `JoinShell.tsx` as before); `npm run build` 0 (built with `NEXT_PUBLIC_API_BASE_URL` set to my stand-in); `check:copy` 0 ("copy rules: clean"); `check:icons` 0 (175 icons, current). Added lines carry no `style=`, no hex, no em-dash.

### Pictures
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoin02brand/pics/`: `form-{360,390,1280}-{dark,light}.png`, `registered-{360,390,1280}-{dark,light}.png`, `checking-{360,390,1280}-{dark,light}.png`, `copied-390-dark.png`, `copy-rejected-390-dark.png`, `already-360-dark.png`. Scripts and logs in the same folder: `t-prod.mjs` (69 pass, 2 of my own bad test cases explained above, 1 real note V2), `t-flow.mjs` (102 pass, 0 fail), `t-copy.mjs` (18 pass, 0 fail), `t-already.mjs` (2 pass).

### Secret scan
My staged diff (this task file, `docs/LOG.md` and the generated progress files) was scanned for hex runs of 32 or more, `sk_`, `FLWSECK`, bearer tokens and private-key headers: nothing matched. No BVN, NIN or phone number is written in this report (the test phones are made up).

### NOT RUN
- A real Flutterwave window and a real card: every payment was the stand-in, so V1 is from source. Unblocked by one live payment from a phone, looking at the title, description and logo in the window.
- iPhone Safari and in-app browsers (WhatsApp, Instagram, Facebook) for Copy code and the lock emoji: only Chromium was driven. Unblocked by a phone opening the live link and tapping Copy code.
- The WhatsApp or X link preview itself: tags and the 1200 x 630 image were checked, no scraper was called. Unblocked by pasting the live link into a chat after the deploy.
- The middleware on Vercel's Edge runtime: only `next start`. Unblocked by `curl -sI https://wawuafrica.com/sign-in` (307 to `/join`) and `/who-made-this-white.png` (200) after the deploy.
- Pictures of the refund, support and "extra" screens: they draw through the same `JoinShell` (one logo, audited on the three other states), but I did not drive each one.
- Light theme from a phone's own colour scheme: the page switches only by `data-theme`, as the builder said; the light pictures set that attribute.
- Mobile `npm run check`: skipped on purpose (docs only); `npm run gates` and `npm run tasks` were run instead (below).

Merge preparation (builder, 10 Oct 2026): S1 closed, words only. Website `wmt/JOIN-02-r4` `c32eaa6` on `d172f0b`: `docs/03_USER_FLOWS.md` now says the Flutterwave window is titled "WHO MADE THIS?" with the description "Pre-registration" and the Who Made This logo; the comments in `JoinFlow.tsx` (the round 4 list and the one at the walked-away guard) and `join-session.ts` (`joinAbandoned`) now say the server gives every start a new reference and that the guard stays for the deploy window, when an older server reuses an unpaid registration. `git diff d172f0b` is 3 files, 15 added and 10 removed lines, every changed line in `src` a comment. Checks: typecheck 0, lint 0, build 0 (`NEXT_PUBLIC_API_BASE_URL` set), `check:copy` 0; em-dash and secret scans of the added lines nothing. NOT RUN: a page walk (no code changed; unblocked by the verifier's `w-double.mjs` and `w-held.mjs` if wanted).

## Lead merge note (10 Oct 2026)

Rounds 4 and 5 merged 10 Oct 2026 as website #26 (73c14eb) after backend #102 (7b4ffef) deployed: safe Start again, every start a new reference, the Who Made This payment window. Verifier: MERGE, no blocker.

## Owner sign-off

## Round 4 (builder) (10 Oct 2026)

One payment-safety fix on the live page (N1 of the round 3 verifier report), website only. Website `wmt/JOIN-02-r4` at `4a3f959` (one commit on `main` `233d6b1`: `src/app/join/components/JoinFlow.tsx` and `src/lib/join-session.ts`; nothing under `src/app/(auth)/`, no shared component, no backend or mobile source touched). Backend for the walk: `origin/main` `0694ced`, built locally on :6023 with its own database (`bj02r4_test_join`, dropped), Flutterwave stood in at the DI seams and in the browser with the verifier's strict stand-in (a transaction exists only if the browser stand-in made it). No Flutterwave, Nuvion, Fintava, wawuafrica.com or AI host was called. Scripts, logs, pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02r4/` (`v/r4.mjs` the new walk, `v/sa.mjs` the verifier's reproduction, `logs/`, `pics/`).

### What the lead ruled, as built
- The button is not drawn while the page is still checking. It appears only after the five minutes of asking the status route (every 15 s) have ended without a paid answer. Before that the words say "You started a payment on this device. We are checking whether it went through. Check again in a moment." (the old words promised a button that is no longer there).
- Tapping it asks once more: "Only start again if no money left your account. If it did, email support@wawuafrica.com with your reference XXXX XXXX." with two buttons, "Keep checking" (the main button, focus lands on it) and "Start again". "Keep checking" returns to the checking screen, asks once at once, and asks by itself for another five minutes (the button is gone again until those end; the support line stays).
- "Start again" asks the status route one last time first. Paid shows "You're registered". A kept duplicate (`failed`) shows the refund screen. An answer it cannot get (network, 429, 5xx) keeps the person on the question with "We could not check just now. Check your connection and try again." Only a plain "not paid" opens the form (the stored reference is cleared).
- Nothing else on the page changes (the return page, the callback paths, the polling cadence, the support line and every other screen are as in round 3).

### Finding for the lead: the backend does not give a new reference for the same details
"Starting again begins a new registration (a new reference)" cannot be delivered by the website alone. `WaitlistService.register` reuses the person's own unpaid row for the same offer, phone and email (`mine = findFirst({offerId, phone, email, status: pending})`, then `update`), so a new registration with the SAME details comes back with the SAME reference. That is how N1 happened: `sa.mjs` showed two successful transactions on one reference, the second invisible to the server. What the page does about it: the reference left behind by "Start again" is remembered (sessionStorage, references only, survives a reload) and if a registration comes back with it, NO payment window opens: the page goes to "Checking your payment" on that reference with "A payment you started with these details has not been settled yet, so we have not opened a new one." and the support line with the reference at once (picture `r4-04-held`). The same person with a different email gets a genuinely new reference and a window on it (`S3`). The cost: someone who really did not pay and starts again with the same name, phone and email is held on that screen until their unpaid row is paid or purged (a week) or they email support. The fix that makes "Start again" always a new reference is in the backend (mint a new reference when an unpaid row is reused, keeping the old one findable by the sweep and the webhook, or refuse `initCharge` for a reference that already has a successful transaction); the page's guard compares references, so it needs no change after that. This is JOIN-01 and not changed here. Default (agent), the lead may override: hold rather than open the window.

### N1 before and after (the verifier's `sa.mjs`, same stand-in)
| | Before (website `233d6b1`, `logs/sa-before.log`) | After (`4a3f959`, `logs/sa-after.log`) |
|---|---|---|
| Reload while the window was open, money moved | "Checking your payment ... If you did not pay, you can start again." with Check again AND "I have not paid. Start again" at once | only "Check again"; "You started a payment on this device. We are checking whether it went through." |
| Start again, then Pay | the form with Pay, same reference, paid again: 2 transactions at Flutterwave against one reference, one orphaned | no way to the form for five minutes; in that time the server's re-check (`/__ctl/sweep`) settles it and the page shows "You're registered" by itself; transactions against the reference: 1 |

### The new walk (`v/r4.mjs`, production build on :6021, page clock faked, 35 checks, 0 failed, `logs/final-r4.log`)
- S1 (reload, money moved, server re-check at 90 s): no Start again at reload nor at 90 s, registered by itself after the sweep, one transaction.
- S2 (money moved, server cannot see it for the whole time): no button at 4m45, drawn at 5m05 with the support line; the question's words and short reference exact; two buttons; focus on "Keep checking"; Keep checking removes the button, keeps asking (5 status calls in the next minute), button back after the next five minutes; Start again made one more status call before opening the form, cleared the stored reference; same details then Pay: the server returned the SAME reference, no window opened, still 1 transaction, no form and no Pay on that screen, support address and short reference shown; a reload there resumes checking.
- S2b: Start again, then a reload of the empty form, same details, Pay: still no window on the old reference, 0 charges by the second attempt.
- S3: Start again with a different email: new reference, window on it, registered; the old reference has no second transaction.
- S4: the row turns paid after the button appears but before the tap: Start again shows "You're registered", no form.
- S5: status route unreachable at the tap: stays on the question with the "could not check" line, both buttons still there; once reachable, a clean "not paid" opens the form.
- S6: the row turns `failed` before the tap: "You're already registered. This extra payment will be refunded." and no form.
- Round 3 walks on the new build: `t1` 9 of 9, `t12` 1 of 1, `t3` 15 of 15, `t6` 20 of 20, `t11` 4 of 4, `t15` 2 of 2 pass; `t2` (field audit) unchanged; `t4` steps 1 to 3 pass and step 4 waits for the "Back to registration" button that no longer exists on that screen, on purpose (as the round 3 verifier recorded). The verifier's `t1`, `t4`, `t12` are byte-identical to these.

### Decisions (Default (agent), the lead may override)
- "Keep checking" is the filled main button and "Start again" the quiet one (the safe answer is the easy one); the lead listed them in the other order.
- "Keep checking" starts another five minutes of asking and hides the button for them (the rule "not drawn while still checking" applies again); the support line stays once shown.
- The button appears when the last of the 20 asks has answered, not on a timer (a hung status route never shows it; the support line is on the timer as in round 3).
- A reload while on "Checking your payment" starts the five minutes again; the time is not stored.
- A second browser tab (for example the QR opened again) has its own sessionStorage and does not know the reference or the walked-away one: the real fix for that is server side (above), not here.

### Checks
Website (worktree at `4a3f959`): `npx tsc --noEmit` 0; `npm run lint` exit 0 (the repo's existing warnings only, none new); `npm run build` exit 0 (`/join` and `/join/paid` static, first load 164 kB, was 163 kB); `npm run check:copy` clean; `npm run check:icons` current (175 icons); `check:qr` and `check:tgif` pass; no em-dash in the added text; nothing under `src/app/(auth)/` changed (`git diff origin/main --stat -- "src/app/(auth)"` empty); secret scan of the staged diff (a Flutterwave secret-key prefix, `sk_`, bearer tokens, private-key headers, 40+ hex, 60+ base64 runs): no match.
Mobile (this report's commit): `npm run check` exit 0 (typecheck, lint, jest 113 suites and 1914 tests passed with the known `eventsScreens.test.tsx` flake not occurring, gates: 10 gates, 459 files, 0 fail, 16 warn, 0 accepted; task check passes, 271 tasks, 279 artboards). Log `join02r4/logs/mobile-check-1.log`. Secret scan of the staged diff: the only match is this paragraph's own sentence naming the patterns (`sk_`); no key-shaped string. The status moved from `done` to `verifying` because the page changed after its last verification; the lead may put it back.

### Pictures
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02r4/pics/<state>-390-<dark|light>.png` (full page, 2x, 390 px, production build against the real backend): `r4-01-checking-no-button` (right after the reload), `r4-02-checking-with-button` (after five minutes, with the support line), `r4-03-confirm`, `r4-04-held` (the registration came back with the walked-away reference), `r4-05-confirm-could-not-check`. No artboard exists for them; I do not say they match anything.

### NOT RUN
- A real Flutterwave payment, and whether a real bank transfer or USSD lands later than five minutes on a reference (the case the guard exists for). Unblocked by one live bank transfer watched in the Flutterwave dashboard and the page.
- A phone (iPhone Safari, a bank app returning to the page and reloading it), the page at 1280 px for these new states (390 px only, as ordered).
- The backend change that would make "Start again" always a new reference (above): not this task's repo; unblocked by the lead filing it against JOIN-01.
- The second-tab path (a clean form from the QR in another tab): only the server can close it.

## Round 5 (builder) (10 Oct 2026)

Website `wmt/JOIN-02-r4` at `d172f0b` (pushed on top of `4a3f959`: a merge commit `087e242` that brings in website `origin/main` `b4a2921`, the owner's brand copy and the launch access code screen, live; then one commit `d172f0b`, V1). Backend for the walks: `origin/wmt/JOIN-01-r4` `d317094` (every start gets a new reference, the access code is unique), built locally on :6023 with its own database (`bj02r5_test_join`, dropped), Flutterwave stood in at the DI seams and in the browser. No Flutterwave, Nuvion, Fintava, wawuafrica.com or AI host was called. Nothing under `src/app/(auth)/` changed (`git diff origin/main --stat -- "src/app/(auth)"` and the same against the round 4 head: empty). Website files changed against `origin/main`: `src/app/join/components/JoinFlow.tsx`, `src/lib/join-session.ts` (round 4) and `src/lib/flutterwave.ts` (V1). Scratch, scripts, logs, pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/join02r5/` (`v/` the walks, `logs/`, `pics/`).

### How `JoinFlow.tsx` was resolved
`git merge origin/main` into the round 4 head ran with no conflict: round 4 and the brand change touch different hunks of the file. Both are in the merged file. From round 4: the checking screen without the button, the "Start again?" question with "Keep checking" and "Start again", the last ask before the form, the walked-away reference kept, the held screen. From the brand change: the `LaunchAccessCode` import, the registered case (title "YOUR WHO MADE THIS? LAUNCH ACCESS CODE", the code, Copy code, the owner's lines), the "already registered" sentence naming the Who Made This app, and the state comment. Read as a diff: the merged file against `origin/main` shows only round 4 (`JoinFlow.tsx` and `join-session.ts`) plus V1; against the round 4 head it shows only the brand change plus V1. The 11 other brand files are byte-identical to `origin/main` (the stat against `origin/main` lists 3 files). Owner words: the rendered text of 13 states (the form at 390 and 1280, its field errors at both widths, registered by the window callback, registered by the `/join/paid` return, already registered, after a cancel, after a declined card, checking, and the head tags of `/join` and `/join/paid`) is identical between a build of `origin/main` and the merged build, character for character (codes and references normalised). Script `v/text.mjs`, outputs `logs/text-main.json` and `logs/text-merged.json`.

### V1: the Flutterwave window on /join says Who Made This
`openFlutterwaveCheckout` takes an optional `logo` (in the same object as `title` and `description`). Omitted, the logo is WAWU's `/wawu-logo-white.png` exactly as before, so no other flow changes. `/join` now passes title "WHO MADE THIS?", description "Pre-registration" and the logo `${window.location.origin}/who-made-this-ink.png` (the root file the brand change already ships, served in site mode). Proof (`v/v1.mjs`, the options object the stand-in received, `logs/v1.log`, `logs/v1-prod.log`, `v/fw-opts-join.json`, `v/fw-opts-ticket.json`):
- From /join, at 390 and 1280 px, dark and light: title "WHO MADE THIS?", description "Pre-registration", logo `http://127.0.0.1:6021/who-made-this-ink.png` (absolute, the page's own origin); nothing in the customizations says WAWU; the public key, tx_ref, amount (2000), currency, payment options and redirect URL are what they were. The logo URL answers 200 `image/png` and its bytes are `public/who-made-this-ink.png`.
- The event ticket checkout in full site mode (the real `/events/ev-creator-summit` page and `TicketPurchasePanel`, API answers stood in in the browser): title is the event's name, description "Regular · 1 ticket", logo `/wawu-logo-white.png` as before, no Who Made This word or file anywhere in the options. 31 of 31 checks pass.
- With `VERCEL_ENV=production` (production build, `next start`): the same /join checks pass (26 of 26; the ticket page is locked there by design).

### The held screen
Kept as a guard (it costs nothing). The new backend never triggers it: a start with the same details now returns a new reference, so the page's comparison with the walked-away reference never matches. The walk proves both halves: variant `new` (what really happens: the same details give a new reference, a window opens on it, the person sees the registered screen, and the server's re-check then leaves one `paid` row and the first payment `failed` and kept for a refund) and variant `guard` (the real start answer is rewritten in the browser to hand the old reference back: no window opens, no Pay button, the support line and short reference show, a reload resumes checking).

### Checks
- Round 4 walk `v/r4.mjs` against `d317094`: 54 of 54 (S1, S2 new, S2 guard, S2b, S3, S4, S5, S6). Edited from the round 4 original in two ways, both because the world moved: the registered screen is now recognised by the brand heading "YOUR WHO MADE THIS? LAUNCH ACCESS CODE" (the old "You're registered" is gone), and S2 and S2b assert what the new backend does (new reference) instead of the old held screen, which has its own forced variant. The round 3 walks on the merged page: `t1` 9 of 9, `t3` 15 of 15, `t6` 20 of 20, `t11` 4 of 4, `t12` 1 of 1, `t15` 2 of 2, `t2` the field audit unchanged; `t4` steps 1 to 3 pass and step 4 waits for the "Back to registration" button that no longer exists on that screen (as in round 4).
- Brand walks against the merged page: `copytest.mjs` 17 of 17 (full site mode and again with `VERCEL_ENV=production`), `prod.mjs` 19 of 19 in production mode (logo loads at 360, 390 and 1280 in both themes, no 4xx or 5xx, no overflow, `/join/paid` registered with the logo and the title, the 1200 x 630 link image).
- Lock-down with `VERCEL_ENV=production`: `/`, `/sign-in`, `/sign-up`, `/wallet`, `/admin`, `/home`, `/events/...`, `/tickets`, `/services`, `/wawu/ada.png` and `/api/hub/waitlist/offers/current` all 307 to `/join`; `/join`, `/join/paid`, `/terms` and the three Who Made This PNGs 200.
- Website at `d172f0b`: `npx tsc --noEmit` 0; `npm run lint` 0 (the repo's existing warnings only); `npm run build` 0 with `NEXT_PUBLIC_API_BASE_URL` set (`/join` and `/join/paid` static, first load 164 kB, as before; a build without that variable stops on the repo's own guard, on every branch); `npm run check:copy` 0 ("copy rules: clean"); `check:icons`, `check:qr`, `check:tgif` 0. No em-dash and no key-shaped string (hex 32+, base64 60+, `sk_`, `FLWSECK`, bearer, private-key header) in the added lines.
- Mobile (this branch changes only this file, `docs/LOG.md` and the generated progress files): `npm run check` exit 0 on the second run (typecheck, lint, jest 113 suites and 1914 of 1914 passed, gates: 10 gates, 459 files, 0 fail, 16 warn, 0 accepted; task check passes, 271 tasks, 279 artboards). The first run exited 1 with two 20 s test timeouts while the host load average was above 12 (`OpenWalletScreen.test.tsx` and `settingsScreens.test.tsx` Z3, neither near this change; the known `eventsScreens.test.tsx` flake did not occur); both files run alone passed (128 of 128, exit 0); the whole check run again: exit 0. Logs: `join02r5/logs/mobile-check-1.log`, `mobile-alone.log`, `mobile-check-2.log`.

### Decisions (Default (agent), the lead may override)
- The ink lockup, not the white one: Flutterwave's inline window is a light card, so the dark-ink lockup is the one that reads on it. This is from what the window is known to look like and was NOT seen in a real window (no real Flutterwave call is allowed here); the white file would be invisible on a light card and the ink file on a dark band. The change if it is the other way round is the one file name in `JoinFlow.tsx`.
- `logo` sits beside `title` and `description` in the `labels` argument rather than in the options argument, because it is another label of the same window. The hosted-link (redirect) path does not carry a logo; `/join` never uses it (it passes no return record).
- Description "Pre-registration" exactly as asked (the second half of the page title, "WHO MADE THIS? Pre-registration").
- The pictures `r5-guard-held` and `r5-new-reference-registered` (390 px, dark and light, in `pics/`) show the two outcomes of "Start again, then the same details". No artboard exists for them.

### NOT RUN
- A real Flutterwave window: every window here is the stand-in, so what the real window does with the logo (size, crop, background) is not seen. Unblocked by one live payment on the live link from a phone, looking at the title, description and logo in the window.
- The middleware on Vercel's Edge runtime (JOIN-02 N2): only `next start`. Unblocked by `curl -sI https://wawuafrica.com/sign-in` (307 to `/join`) and `https://wawuafrica.com/who-made-this-ink.png` (200) after the deploy.
- The production check of the migration behind the access code (JOIN-01 round 4, not this task): unblocked by the SELECT in that task's report before the backend merges.
- Pictures at 1280 px for the round 4 states, and a phone: as in round 4.

## Verifier report, rounds 4 and 5

Verifier, 10 Oct 2026 (independent session; wrote none of this). Website `origin/wmt/JOIN-02-r4` `d172f0b` (detached worktree `vw-JOINr4`) against website `origin/main` `b4a2921`
(the merge `087e242` brings main in; the branch changes 3 files against main: `JoinFlow.tsx`, `join-session.ts`, `flutterwave.ts`, 209 added and 16 removed); backend `origin/wmt/JOIN-01-r4` `d317094` for the
walks and backend `origin/main` `0694ced` for the deploy-window walk. Mobile `wmt/JOIN-02-r4` `7314b54`. Website main did not move during the run (checked at the start and before the push). Backend main moved at the end to `12e18e3` (INBOX-03, a new migration `20261019090000_push_tokens`); my trial merge of it into backend r4 is clean and JOIN-01's report has the one consequence (S1, restamp the access-code migration folder). The page walks ran against `d317094`, which has nothing from INBOX-03 in the waitlist or the page's routes. Nothing in the website or backend was changed or pushed.
Evidence, scripts, pictures: the lead's scratchpad `vjoinr4/` (`w-double.mjs`, `w-rules.mjs`, `w-oldpage.mjs`, `w-held.mjs`, `v1.mjs`, `text.mjs`, `out-*.txt`, `text-main.json`, `text-branch.json`, `pics/`).
Production builds served with `next start` (`NEXT_PUBLIC_API_BASE_URL` set to my backend, as the repo's own guard requires on every branch); real `AppModule` built from the backend branch, real Postgres,
Flutterwave stood in strictly in the backend and in the browser (a transaction exists only if the stand-in made it). No Flutterwave, Nuvion, Fintava, wawuafrica.com or AI host was called.

**Verdict: merge. No blocker.** Status `review`. One should-fix (S1, stale words in a doc and three comments) and four notes. Every round 4 and round 5 rule held in a real browser under my own walks (49 of 49 walk checks, and V1 31 of 31 and 26 of 26).

| Id | Severity | What | Where | Reproduce |
|---|---|---|---|---|
| S1 | should fix (low, words only) | Three places still say what is no longer true. `docs/03_USER_FLOWS.md` line 98: "The Flutterwave window is titled "WAWU"" (V1 made it "WHO MADE THIS?", description "Pre-registration", the Who Made This logo). `JoinFlow.tsx` lines 70 and 564 and `join-session.ts` line 90 say "the server reuses an unpaid registration for the same phone and email" (false once backend r4 merges; the guard they describe stays useful for the deploy window, only the sentence is stale). The website rule is that the docs stop disagreeing with the code | `docs/03_USER_FLOWS.md:98`, `src/app/join/components/JoinFlow.tsx:70,564`, `src/lib/join-session.ts:90` | `grep -n "titled \"WAWU\"\|reuses an unpaid" docs/03_USER_FLOWS.md src/app/join/components/JoinFlow.tsx src/lib/join-session.ts` |

### Round 4: the double charge and the page rules (CONFIRMED)

Backend `d317094`, my walks (`w-double.mjs`, `w-rules.mjs`), the page clock faked, five minutes walked in 15 second steps:

| Rule | Result | Evidence |
|---|---|---|
| Reload while a window is open, money moved, start again with the same details, pay again | CONFIRMED | W1: reload shows only "Check again" and "You started a payment on this device. We are checking whether it went through. Check again in a moment."; a new reference on the second start; the second window opens on the new reference (not the first); the registered screen shows the code of the PAID row; two references, two transactions; after the re-check the rows are `paid` and `failed` (the first, with its transaction id and 200000 kobo) |
| No "Start again" while checking | CONFIRMED | at the reload and at 4 minutes 45 seconds only "Check again" is drawn |
| It appears only after the 5-minute checking ended with not paid | CONFIRMED | at 5 minutes 25 seconds "I have not paid. Start again" is drawn next to "Check again" |
| The plain-words question | CONFIRMED | "Start again?" "Only start again if no money left your account. If it did, email support@wawuafrica.com with your reference XXXX XXXX." with "Keep checking" (main, focused) and "Start again" (`pics/v-question-390-light.png`, `-dark.png`) |
| The last status ask: PAID | CONFIRMED | R1: the server settles the first reference after the polling ended; "Start again" asks once more, shows the registered screen (code equals that row's `accessCode`), no form, one reference |
| The last status ask: FAILED | CONFIRMED | R2: another device paid first, the re-check made this reference `failed`; the tap shows "This extra payment will be refunded" with the short reference, no form, no Pay |
| The last status ask: UNREACHABLE | CONFIRMED | R3: request aborted, then a 500, then a 429: each stays on the question with "We could not check just now. Check your connection and try again.", both buttons, no form, the resume record kept; once reachable a plain not-paid answer opens the form and clears the resume record (the old reference is kept only in the walked-away list) |
| Keep checking | CONFIRMED | R4: back to the checking screen, one ask at once, the button gone, four asks in the next minute, the support line stays, the button returns after another five minutes |
| A new reference after starting again; storage | CONFIRMED | R5 and W1: a different reference on the second start; storage holds references only (no name, phone or email) |
| The re-check settles the first payment while the second window is open | CONFIRMED | W2: the second callback ends on "You're already registered. This extra payment will be refunded..." never on "registered" or "not charged"; the second row is `failed` with its id and 200000 kobo |
| Second tab and second device | CONFIRMED | W3: a second tab has empty storage and a clean form; a second device registers on its own reference; device 1 is told "extra payment will be refunded" by polling its own reference |
| Deploy order 1: the LIVE page (`main`) with the NEW backend | CONFIRMED | `w-oldpage.mjs`: the live page still offers Start again at once; the second start gets a new reference, the person is registered, rows end `paid` and `failed`; two transactions |
| Deploy order 2: the NEW page with the OLD backend (`main`, reuses the reference) | CONFIRMED | `w-held.mjs`: the same details come back with the same reference, no second window opens, the held screen with the support line shows, exactly one transaction on that reference, no Pay button; once the server's re-check settles it the page shows the registered screen by itself |

My own walk had one bad assertion (R3's last check asked for the old reference to be absent from all of sessionStorage; the walked-away list holds it on purpose); corrected in the script, the page was right.

### Round 5: words, V1, site mode, auth (CONFIRMED)

- **Owner's words, character for character.** I rendered website `main` `b4a2921` and the branch (production builds, same backend) and compared the visible text of 13 states: the form at 390 and 1280, its field errors at both widths, registered by the window callback, registered by the `/join/paid` redirect return, already registered, after a cancel, after a declined card, checking, and the head tags (`<title>`, description, `og:*`, `twitter:*`) of `/join` and `/join/paid`. All 13 are identical as code points (access codes and references normalised). The static HTML of `/join` and `/join/paid` differs only in hashed chunk file names. (`text.mjs`, `text-main.json`, `text-branch.json`.)
- **V1.** From `/join` at 390 and 1280, dark and light, the window options are title "WHO MADE THIS?", description "Pre-registration", logo `<own origin>/who-made-this-ink.png` (absolute, 200 `image/png`, the bytes of `public/who-made-this-ink.png`), nothing in the options says WAWU; key, tx_ref, amount 2000, NGN, payment options and redirect are as before. 31 of 31 (full site mode) and 26 of 26 (`VERCEL_ENV=production`). `logo` is an optional label: the only caller that passes it is `JoinFlow.tsx` (`grep "logo:" src`); the other 12 call sites get `${origin}/wawu-logo-white.png` as before. The event ticket checkout (the real page and `TicketPurchasePanel`, API answers stood in in the browser): title is the event's name, description "Regular · 1 ticket", logo `/wawu-logo-white.png` (200), no Who Made This word or file in its options.
- **Site mode locked with `VERCEL_ENV=production`** (same build): `/`, `/sign-in`, `/sign-up`, `/wallet`, `/admin`, `/home`, `/events/...`, `/tickets`, `/services`, `/wawu/ada.png`, `/api/hub/waitlist/offers/current`, `/api/anything`, `/%2e%2e/sign-in` all 307 to `/join`; `//sign-in` is Next's 308 to `/sign-in` and then 307, as before; `/join`, `/join/paid`, `/terms`, the three Who Made This PNGs and `/wawu-logo-white.png` 200. `src/lib/site-mode.ts` and `src/middleware.ts` are not in the diff.
- **Nothing under `src/app/(auth)/` changed** (`git diff origin/main..HEAD --stat -- 'src/app/(auth)'` empty; the branch changes 3 files).

### Checks

| Check | Result |
|---|---|
| website `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (17 warnings, all the repo's own `<img>` and hook warnings; none in the changed files; the two in `JoinShell.tsx` are unchanged) |
| `npm run build` (with `NEXT_PUBLIC_API_BASE_URL`) | exit 0; `/join` and `/join/paid` static, first load 164 kB |
| `npm run check:copy` | exit 0, "copy rules: clean" |
| `npm run check:icons` | exit 0, 175 icons, current |
| added lines: em-dash, `style={`, hex colour | 0, 0, 0 |
| backend `d317094` checks (tsc, eslint, 137 of 137, rate-limit 22 of 22, protected 253 of 253, gates, contract) | see JOIN-01's "Verifier report, round 4" |
| mobile `npm run gates` and `npm run tasks` (this commit is docs only; `npm run check` not run for that reason) | gates: 10 run, 459 files, 0 fail, 16 warn, 0 accepted, run after the status moved to `review` (the `unbuilt_entries` gate passes); task check passes, 271 tasks, 279 artboards |
| secret scan of my staged diff (hex runs of 32 or more, base64 runs of 60 or more, Flutterwave secret-key prefixes, bearer tokens, private-key headers) | nothing matched; no BVN, NIN or phone number is written here |

### Notes (none stops the merge)

- **N1 · note · V1 was seen only in the stand-in.** The ink lockup is the builder's choice for Flutterwave's light card; what the real window does with the logo (size, crop, background) is not seen (NOT RUN).
- **N2 · note · the refund screen's reference looks like the launch access code.** "reference 5F6C 15E4" has the shape of "XXXX XXXX", the same as the code on the registered screen; it is the extra payment's reference. JOIN-03's claim must refuse a code whose row is `failed` (see JOIN-01 round 4 N3). When the second payment is the one that wins, the person sees only the registered screen and is not told on it that the first will be refunded (the page cannot know then).
- **N3 · note · the held screen is unreachable with backend r4.** The backend never hands back a walked-away reference now; the guard stays for the deploy window (proved: `w-held.mjs`) and costs nothing. Its sentence ("A payment you started with these details has not been settled yet...") is still right in that window.
- **N4 · note · a second tab started from the QR while the first has a window open is not stopped, by design.** It gets its own reference and, if both pay, one is registered and the other is kept for a refund (W3). Nothing on the page can know about the other tab; the backend rule is what protects the money.

### Mutants

Backend mutants (20, 17 killed, 3 survived as test gaps, none breaking built behaviour) are in JOIN-01's report. Website: NOT RUN. The page has no unit spec (the builder's walks and mine are the tests), and a page mutant needs a 2 minute production build plus a walk each; unblocked by a spec file for `JoinFlow` (none exists) or time for four to six builds (start-again button drawn at once, the last ask skipped, an unreachable answer read as not paid, the walked-away guard removed, the logo omitted).

### Pictures

`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vjoinr4/pics/`: `v-checking-no-button-390-{dark,light}.png`, `v-checking-with-button-390-{dark,light}.png`, `v-question-390-{dark,light}.png`, `w1-registered-390.png`, `w2-extra-390.png`, `w3-device1-extra-390.png`. I looked at `v-question-390-light.png` and `w3-device1-extra-390.png`: nothing clipped, the logo and card as in round 3; the other pictures were not opened (the walks assert their text). No artboard exists for these states; I do not say they match one.

### NOT RUN

- A real Flutterwave window and a real card: every payment is the stand-in. Unblocked by one live payment from a phone, looking at the title, description and logo.
- iPhone Safari and in-app browsers (WhatsApp, Instagram), a bank app returning to the page and reloading it: only Chromium was driven. Unblocked by a phone opening the live link.
- The middleware on Vercel's Edge runtime (JOIN-02 N2 still stands): only `next start`. Unblocked by `curl -sI https://wawuafrica.com/sign-in` (307 to `/join`) and `https://wawuafrica.com/who-made-this-ink.png` (200) after the deploy.
- Pictures at 1280 px for the round 4 states, and the light and dark of every refund and held screen: 390 px for the question, the checking screens and the two refund screens, as ordered in round 4.
- The production collision check for the migration behind the access code (JOIN-01 round 4): unblocked by the SELECT in that report before the backend merges.
- Website mutants (above).

## Owner fix, 12 Oct 2026: the landing page shows

Owner: the landing page at wawuafrica.com must show; only the other parts stay closed. Website `wmt/WEB-LANDING` at `744b4ac` (one commit on `main` `6d507ac`). Nothing under `src/app/(auth)/`, no backend or app change.

**What changed.** In join-only mode `/` is open and renders as built. Files it needs are opened exactly: `/icons/services/<name>.png` and `/wawu-theme.mp3` (the sound button's track, fetched on a tap); `/wawu/ada.png`, `/icons/bills/*`, the videos and the PDF stay closed. Its links by mode: the sign-up and get-started buttons go to `/join`; Sign in, Creators, Resources, Learn more, Open app, the footer's app links are not drawn; the Legal, Events and Bills tiles keep their look and are not links (TileCard `inert`); `#pricing`, `#comparison` and `/terms` stay. Full mode is unchanged link for link. `/` is rendered per request and reads the mode with the middleware's own function, so `SITE_MODE` or `VERCEL_ENV` change it without a rebuild. `CreatorCarousel` is not mounted on the page, so it was left alone.

**Checks (production build, `next start`).** `VERCEL_ENV=production`: `/` 200, loading it makes 36 own requests all 200 at 390 and 1440 px (before: 307), 17 links all end on `/join`, `/terms` or an anchor (clicked: each lands on `/join`), 35 buttons clicked (scheduler days, FAQ, sound) go nowhere, a signed-in visitor sees no way into `/home`; `/home /explore /learn /sign-in /sign-up /admin /api/anything /wawu/ada.png /payment/return` still 307 to `/join`; `/join`, `/join/paid`, `/terms` are pixel-identical to main. `SITE_MODE=full`: all 30 links and 56 requests as on main, 0 pixels differ from main at 390 and 1440, light and dark. Same build, six environment settings, six behaviours. `npm run check:site-mode` (new): 180 pass, plus 259 and 219 against the two running builds. Typecheck, lint, copy check, icons, qr, tgif exit 0. The repo gates already fail on main (15 findings, `python3 scripts/gates/run.py`); the same 15 before and after, nothing added.

**Lines that contradict a ruling (not changed), `src/app/(marketing)/components/LandingContent.tsx` unless named.**
- R-43 (publishing needs a paid tier) and R-48 tiers: 254 "No fee to join or list"; 277 "no subscription"; 278 "publishing costs nothing"; 280 "Your first piece goes out at no charge"; 705 to 709 and 733 "Join at no charge, list at no charge ... no subscription"; 722 "List up to 5 products, pieces or services" (R-7: 5 uploads and 1 GB free, 25 with a tick).
- R-1, R-6, R-11, R-19 (wallets): 279 "paid to your own bank account once KYC clears, never held in a platform wallet"; 278 "KYC ... only gates when you can receive payouts"; "Instant payouts" at 252, 784, 787, 992, 995.
- R-2, R-9 (no Shop): `src/lib/platform-services.ts` 100 the Shop tile; 277, 742 "storefront sales"; 227 "Products"; 521 "commerce"; 556 "products"; the hero pictures `/wawu-hero-*.png` draw a Shop item in the app menu.
- R-47 (nothing drawn for unbuilt things): the dimmed Shop, Loans, BNPL, Pensions and Telemedicine tiles (`platform-services.ts` 100 to 157) and the greyed App Store and Google Play badges (`StoreBadges`, 149, used at 484 and 1168); R-42 Bills off at launch: the Bills Payment tile (114).
- R-37 (the app and /join are "Who Made This"): the page is branded WAWU and WAWUAfrica throughout (logo, 987, 1022, 1131).
- Invented figures and claims: 526 to 529 sample earnings (+₦4,999, +₦999, +₦2,000, +₦500); 791 "₦2.4M", 795 "₦860k", 809 "+124% YoY", 822 chart axis; 1028 "₦300" and the three named testimonials; 224, 950, 995 "Federal Government-approved", "Governments across Africa", "Nigerian Federal Ministries"; 1022 "Join Millions"; 31, 995 Banking, Healthcare, Travel, Financial Inclusion; 671 "No Hidden Fees" (R-10 fees apply).
- Header and footer on desktop show "Sign up" and "Join the Movement" side by side, both to `/join`, as ruled; dropping one is a one-line change.

**NOT RUN.** The middleware on Vercel's Edge runtime (only `next start`); iPhone Safari. Pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/web-landing/pics/` (`after-prod-{390,1440}-{dark,light}.png` join-only, `before-main-full-*` and `after-full-*` full mode, `frozen-*` for the pixel compare).
