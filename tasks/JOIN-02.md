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
