---
id: WALLET-18
title: Receipts
owner: YOU
area: WALLET
order: 184
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-15]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-18 · Receipts

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W12, W27, W41-W43: a receipt with a short code anyone can verify at wawu/r/<code>, as image or PDF.

## Scope

Short code, public verification page, PNG and PDF rendering.

## Capability checks

- [ ] A receipt's code opens a page that matches the transaction.
- [ ] A made-up code shows 'not found', never someone else's receipt.

## Builder report

Builder, 3 Oct 2026. Backend `wmt/WALLET-18` **2729634** on main fe1ec6c (unmoved); mobile `wmt/WALLET-18` on main e7dc879 (unmoved).
- **Built (backend, additive, `src/money/receipts/`):** `POST /money/transactions/{id}/receipt` (`ReceiptView`: the code, `wawu/r/<code>`, the MONEY-15 `TransactionView`, headline, both sides, Bank, licence line, the printed rows), `GET .../receipt/image` (white PNG, 1080 px wide, W42) and `GET .../receipt/pdf` (one A4 page, W43), all behind MONEY-13's gate and read through MONEY-15's `detail`, so someone else's row is 404; public `GET /r/{code}` (HTML, no sign-in, no script, `no-store`, `noindex`, `no-referrer`). Table `MoneyReceipt` (migration `20261003202940_money_receipts`, purge map OWNED). The receipt reads the ledger row on every ask, so a status Fintava moves shows as it stands; nothing calls Fintava, nothing is summed. Small edits in others' files: `money.module.ts` (2 controllers, 2 providers), the two MONEY-13 gate route lists and MONEY-04's served list gain the 3 routes, `hub-rate-limits` spec gains the 3 overrides with their exact limits.
- **Codes:** 12 characters of Crockford base 32 from `randomBytes` (60 bits), unique, one per row, made on first ask (10 taps at once make one); typed codes read any case, hyphens, O as 0, I/L as 1. Every miss (made-up, malformed, 300 characters, a row no longer on its owner's wallet) is the same 404 page byte for byte after exactly one `MoneyReceipt` lookup (a malformed code is looked up as `-`). Throttle `RECEIPT_LOOKUP_THROTTLE` 10 a minute, 60 an hour per address; image and PDF `RECEIPT_RENDER_THROTTLE` the same; both PROVISIONAL.
- **Public page shows only:** type, amount, status, date (Lagos), reference, each side as first name plus initials ("Lennox E. O.", a handle becomes "Someone on Who Made This", 5+ digit runs keep 4), an account only as bank plus last 4. Never a full account number, phone, email, BVN, NIN, handle, note or what was bought (spec checks each).
- **Rendering:** one new dependency, `@resvg/resvg-js` 2.6.2 (MPL-2.0, prebuilt binary for the droplet's Ubuntu 24.04 x64 glibc, 4 MB, no system fonts or libraries; SHARED-CHANGES WALLET-18 #2). The PDF is written here (page, deflated image, a link over "Check it at" when the host is set; validated strict by pypdf and rendered by PyMuPDF). Fonts: Alan Sans with a naira sign drawn from its own N (resvg sets a whole line in a fallback font when one glyph is missing), renamed "WMT Receipt Sans" per OFL, `scripts/receipt/build-receipt-fonts.py`. Mark: the brand pack's submark (R-37). Colours from `src/styles/tokens-receipt.ts` (the gates' token layer). PNG about 0.1 s, PDF about 0.3 s.
- **Check 1, a receipt's code opens a page that matches the transaction:** passed. Spec (15 HTTP tests): tip and bank send pages show amount, Completed, `26 Sep 2026, 10:24`, the reference, masked sides; a reversal shows Reversed on the next open. Sandbox (`docs/fintava/sandbox/39-wallet18-receipts.md`, 20 calls, ₦10 round trips, balances unchanged, 0 key windows): the page for a real send shows Fintava's own amount, `SUCCESS` as Completed, the reference Fintava finds it by and Fintava's minute.
- **Check 2, a made-up code shows 'not found', never someone else's receipt:** passed. Spec: 6 kinds of miss give the identical 404 page and headers, one lookup each; sandbox: a made-up code is 404 with no figure. Mutation-checked (6, all killed): names unmasked, full owner account on the page, a malformed code skipping the lookup, no wallet match, a new code per ask, the default throttle.
- **Runs:** tsc 0; eslint 0 on every changed `.ts`; receipts unit 13 and HTTP 15; full suite on fresh seeded `w18_full_test` (stand-in WAWU ID on :4001 once `lsof` showed it free, stopped after): 136 suites, 3,263 passed, 3 skipped, 0 failed; protected `--fresh HEAD` 253/253, lock origin/main fe1ec6c unchanged; tripwire 0 added lines; gates main 16 fail / 13 warn, branch 16 / 15 (the two added are `PROVISIONAL(RECEIPT-LOOKUP-LIMITS)` and `PROVISIONAL(RECEIPT-RENDER-LIMITS)`); `contract:build` run, mobile contract copied from 2729634 (SHARED-CHANGES WALLET-18 #3). Mobile `npm run check`: main gates 0 fail / 0 warn on 110 files; branch exit 0 (typecheck, lint, 26 suites 431 tests, gates 0 fail / 0 warn on 110 files, 205 tasks).
- **Gaps filed:** G-66 (W12's `TransferView` names no ledger row, so W12, W19, S7, SC7 cannot ask for their receipt by id: WALLET-07, WALLET-12); G-67 (no public host for `wawu/r/`: `RECEIPT_VERIFY_BASE_URL` unset, `url` null, no link in the PDF; owner names the host).
- **NOT RUN:** a bank send's receipt from the sandbox (every sandbox payout is refused, question 17; covered from the ledger writer in the spec); the link opening on the live host (unblocked when `RECEIPT_VERIFY_BASE_URL` is set on the droplet, G-67); the binary on the droplet itself (unblocked by the first deploy of this branch: `GET .../receipt/image` answering 200 there); V5 pictures belong to WALLET-12's screens.
- **Defaults (agent), owner may override:** the code is made only when the owner shares (no code exists for an unshared row); 12 characters, not the canvas's 4 (`T1P9` is a sample, and 4 is guessable); the image and PDF show the owner's own account number in full (W41 draws it) but the other side only by last 4 (as MONEY-15 serves it); the page names a WAWU user without an account; amounts are the amount moved, a send's PDF adds Fintava's charge, WAWU's fee and Total paid (brief W12, R-10); the PDF's text is part of its picture (not selectable); the page carries the licence line only from `WALLET_LICENCE_LINE` and no custody wording; 10 a minute, 60 an hour for the page and each render route.
- **Copy the canvas does not draw (for the owner to read):** "Receipt not found" / "No receipt has this code. Check the code on the receipt you were sent and try again."; "Receipt wawu/r/<code> on Who Made This."; status words Completed, Pending, Failed, Reversed; "Naira wallet" when an owner's account has no name on record.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
