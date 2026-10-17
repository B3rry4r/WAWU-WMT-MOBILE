---
id: LEGAL-06
title: Legal: quote, pay to start, delivery, fixed price
owner: YOU
area: LEGAL
order: 120
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, LEGAL-02, LEGAL-04, LEGAL-05, UI-02]
decisions: [R-14, R-6, R-10, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [S21, S22, S23, S24, S26]
---
# LEGAL-06 · Legal: quote, pay to start, delivery, fixed price

## Current state

As of 17 Oct 2026, built (bundle S4, Sonnet builder), waiting for a verifier.
- **Status:** verifying. Same branch as LEGAL-04: mobile `wmt/S4` (on `origin/wmt/MERGE-8` `cc436a53`, `origin/wmt/B1` merged). No backend change, no migration, no PR.
- **Built** (`src/features/legal/matter`, `fixed`, `cards.tsx`; routes `legal-matter.tsx`, `legal-fixed.tsx`): **S21** (the quote, Read letter in a sheet from `GET /legal/requests/{id}/contract`, "Type your full name to sign", "Sign this agreement"); **S22** (page: Signed as, Price, "Bank charge", Total, Pay from wallet, "Pay ₦X to start", then the PIN sheet); **S23** (every delivered file with its pages, tap opens it); **S24** (the fixed-price card in the chat); **S26** (what the service is, Price, Bank charge, Total, "First name choice", "Continue · ₦X").
- **S24 and S26 are built and not reachable yet** (G-881): the Hub refuses a business name registration without documents, and S26 asks for none, so the card shows only for a fixed-price service the Hub lists as priced and needing no documents. None qualifies today. G-880 (the thread names no fixed-price service; the app holds the one matter-to-service join, `PROVISIONAL(LEGAL-FIXED-MATTERS)`).
- **Order differs from the board** (G-884): Continue starts the request and opens its matter at S21, then S22 pays, because the Hub refuses a fee until the letter is signed.
- **Attacks:** the pay path is LEGAL-04's (same hook, same screens): double tap, wrong PIN, short balance, lost answer then retry, a changed quote, a request cancelled before paying (live on the stack: PAY TO START debited the quote total once; the service quote before signing was refused `target_not_payable`). S26: Continue tapped twice starts one request (test).
- **Differs from the board, on purpose:** "Fee" is "Price" and the totals are the Hub's (BRIEF S22, S26); "Takes", "You'll need" are not drawn (G-882); S22's wallet card is drawn on the page by a local copy until the shared one is exported (SHARED-CHANGES LEGAL-06 #1).
- **Filed:** BACKEND_GAPS G-880, G-881, G-882, G-884. SHARED-CHANGES LEGAL-06 #1.
- **NOT RUN:** a live S24 and S26 (no service qualifies, so they were drawn from a stubbed catalogue in the browser); V10 is not in this task's passes.
- **Pictures:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s4-b/pics/`.
- **History:** `tasks/history/LEGAL-06.md`.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py S21 S22 S23 S24 S26` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md`: its entries for S22, S26 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **S21 · Quote and sign**: Quote ₦45,000 with 'Read letter', 'Type your full name to sign', Sign this agreement.
- **S22 · Pay to start**: 'Signed as Lennox Emmanuel', Price ₦45,000, Fintava's charge ₦15.75, Total ₦45,015.75, Pay from wallet, 'Pay ₦45,015.75 to start' (BRIEF S22), then PIN.
- **S23 · Delivered**: Documents delivered: 'Reviewed tenancy agreement.pdf · 12 pages', 'Consultant notes.pdf · 3 pages'; documents also land in chat and Notifications.
- **S24 · Fixed price, in chat**: In chat: 'I want to register my business name.' Assistant: fixed price, card 'Business name registration · CAC · 5–7 working days · ₦35,000', Start this request.
- **S26 · Fixed-price request**: 'Register your business name · With CAC. No lawyer needed. Takes 5–7 working days · You'll need ID, 2 name options, address · Price ₦35,000', Fintava's charge and Total ₦35,015.75 (BRIEF S26), First name choice 'Lennox Films', 'Continue · ₦35,015.75'; then PIN and tracked like S20.

## Brief changes (build these, not the canvas)

- **S22**: call the price row "Price" (so it isn't mistaken for the fee breakdown), add Fintava's charge ₦15.75, Total ₦45,015.75; button "Pay ₦45,015.75 to start". (Why: R-10 and the purchases default.)
- **S26**: on S26 itself, call the price row "Price", add Fintava's charge ₦15.75 and Total ₦35,015.75; button "Continue · ₦35,015.75" (it leads to the PIN, so it shows the total, rule 5). (Why: R-10 and the purchases default.)

## Capability checks

- [ ] **S21**: a user can Read letter; type name; Sign.
- [ ] **S22**: a user sees ₦45,000 + ₦15.75 = ₦45,015.75, taps "Pay ₦45,015.75 to start" and enters their PIN.
- [ ] **S23**: a user can open a document.
- [ ] **S24**: a user can Start this request (S26).
- [ ] **S26**: a user can enter name choices, see the price, Fintava's charge and the total, and tap "Continue · ₦35,015.75".
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] A user with no wallet who taps Pay lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **S21**: served.
- **S22**: missing. Missing: Service fee is Flutterwave checkout; needs wallet debit + PIN.
- **S23**: partial. Missing: Only ONE deliverable URL per request; board shows several files with page counts. Posting documents into the chat thread is not implemented.
- **S24**: partial. Missing: Assistant-in-chat surfacing (pre-payment) missing (see S14). Two CAC routes exist (legal catalogue entry with no price, and service-application CAC at ₦25,000); the board's ₦35,000 matches neither.
- **S26**: partial. Missing: CAC application and timeline exist under service-application, paid by Flutterwave at ₦25,000; needs wallet debit + PIN. The S24/S26 fixed-price legal route is canonical; the service-application CAC route stays for the web until after launch (additive); the price comes from admin (R-14).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S21: Quote ₦45,000 (tenancy agreement review)
- S21: Typed-name e-signature
- S22: Fee ₦45,000
- S24: Business name registration · CAC · 5–7 working days · ₦35,000
- S26: Fee ₦35,000
- S26: Takes 5–7 working days
- S26: Needs ID, 2 name options, address
- S26: 'No lawyer needed'

## Designer notes (⚠, unresolved)

- S21: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.
- S22: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.
- S24: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.
- S26: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.
- S26: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/LEGAL-06.md](history/LEGAL-06.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
