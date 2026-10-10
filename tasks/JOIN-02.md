---
id: JOIN-02
title: Event registration link: the website page (wawuafrica.com/join)
owner: YOU
area: WEB
order: 242
priority: launch
repo: wawuafrica
type: web-port
status: verifying
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
