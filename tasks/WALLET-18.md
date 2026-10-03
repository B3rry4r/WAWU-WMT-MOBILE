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

### Builder round 2

Builder, 3 Oct 2026. Backend `wmt/WALLET-18` **2108141**: round-2 fixes in 2397eba, then backend main 1e6b807 (WALLET-15 fee quotes, INBOX-08 paid DMs) merged in. Conflicts were only in lists, so both sides were kept: `money.module.ts`, the two gate route lists, MONEY-04's served list. `contract/openapi.json` was regenerated with `contract:build`. Mobile: the verifier's b2d5aba, then main c733413 merged in. SHARED-CHANGES, BACKEND_GAPS and the sandbox README kept both sides' rows. PROGRESS was taken from main and regenerated, and the contract was copied from 2108141.
- **D1 (drawing unbounded, event loop blocked): fixed.**
  - Text is now measured from the fonts' own width tables (`receipt-font-metrics.ts`, read from `cmap`, `hmtx`, `hhea` and `head` at boot, with 3% allowed for kerning). Each character is measured once, in one pass; Resvg is never used to measure.
  - Every printed string is cut to `MAX_PRINTED` (160 characters) before anything is drawn.
  - The picture is drawn with `renderAsync` on the thread pool. The PNG is now encoded here (rows, then an async deflate) instead of by resvg's own encoder, which ran about 60 ms on the request thread. The PDF's RGB conversion runs 128 rows per tick, then an async deflate.
  - At the ledger's longest (500-letter names and bank name, 200-character reference), the PNG takes about 70 ms and the PDF about 150 ms, with the machine at a load average of about 6. These were 13.9 s and 6.2 s before.
  - Tests:
    - the median of 3 draws stays under 300 ms for each of the image and the PDF, with real Resvg;
    - with two PDFs and a PNG drawn at once, the event loop never stalls 100 ms (6 runs in a row green);
    - wrapping 500 characters takes under 20 ms and every line fits;
    - `clip` holds every string to 160 characters.
- **D2 (characters XML forbids gave a 500): fixed.** `printable()` drops C0 and C1 controls, U+FFFE, U+FFFF and lone surrogates, and turns tab and line breaks into spaces. Every drawn string and the page go through it (`escapeXml`). Tests: unit (the verifier's `ctrl` string, a lone surrogate, an emoji kept), a draw of the ctrl string with `& <Sons>` as both image and PDF, and an HTTP test where a ledger row named `Bad\u0001Name\u0008X \uFFFE & <Sons>` with bank `Opay\u0002` gives image 200, PDF 200 and a page showing "BadNameX".
- **D3 (spaced phone numbers shown whole): fixed.** `maskDigits` treats 5 or more digits joined by spaces, hyphens, dots, slashes or brackets, with or without `+`, as one run and keeps only its last 4. It now also covers the bank names on the public page. Tests:
  - unit, 11 forms (`0803 123 4567`, `0803-123-4567`, `0803.123.4567`, `+234 803 123 4567`, `+2348031234567`, `(0803) 123 4567`, `4501-2345-678/9`, the 5-digit edge `12345`, the 4-digit `1234` left alone);
  - a public receipt whose names and bank names all carry numbers, where no run on it has more than 4 digits;
  - HTTP: three biller rows (`MTN Airtime 0803 123 4567`, `Glo +234 805-123-4567`, `IKEDC 4501.2345.6789`) whose pages show `•••• <last 4>` and none of the number's 5-digit windows.
- **Test gaps closed:** an exact `escapeXml` test with `&` first, and the 5-digit edge.
- **Mutations:** 6 of 6 killed:
  - V1 (mask from 7 digits);
  - V2 (`escapeXml` without `&`);
  - unbroken runs only;
  - `printable` a no-op;
  - no `clip`;
  - the deflate made synchronous again.
- **Fonts (optional note 5):** `build-receipt-fonts.py` keeps the source's `head.modified`, so two rebuilds are byte-identical (md5 checked). The committed fonts changed in `head` only.
- **Finding 4:** the round-1 line about misses should read "one lookup for a code never issued". A code once issued whose row is gone runs 3 queries, as the verifier measured. Left as is (low risk, the code must already be held).
- **Correction:** round 1 claimed a test that a reference is never cut; it never landed. Round 2's "measuring is linear" test covers it: 500 characters wrapped with every character kept.
- **Runs (after the merge, 2108141):**

  | Check | Result |
  |---|---|
  | `tsc` | 0 |
  | eslint on changed `.ts` | 0 |
  | Focused suites (receipts, rate limits, gates, money contract, purge, fees) | 10 suites, 146 passed |
  | Full suite, fresh seeded `w18_full_test`, stand-in WAWU ID on :4001 | 139 suites, 3,335 passed, 3 skipped, 0 failed |
  | Protected `--fresh HEAD` (lock origin/main 1e6b807 unchanged) | 253/253 |
  | Tripwire | 0 added lines |
  | Gates | main 1e6b807 16 fail / 14 warn, branch 16 / 16 (the two receipt `PROVISIONAL`s) |
  | Key scan | 0 of 58 windows in each commit |
  | Mobile `npm run check` | exit 0: typecheck, lint, 28 suites 485 tests, gates 0 fail / 0 warn on 123 files, 205 tasks |

  The :4001 stand-in ran only once `lsof` showed the port free, and was stopped after.
- **No Fintava call this round:** the fix touches drawing and masking only.

### Builder round 1

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

Verifier, 3 Oct 2026. This is a fresh session that wrote none of this task's code. I checked wawu-backend `wmt/WALLET-18` `2729634` on main `fe1ec6c` (which has not moved) and mobile `wmt/WALLET-18` `dbdfd91` on main `e7dc879`. Each was in a fresh detached worktree: `/home/user/wt/vw18b` and `/home/user/wt/vw18m`. Mobile main has since moved to `42309b2` (KYC-05). Merging it conflicts in `SHARED-CHANGES.md` and `docs/PROGRESS.md` (`git merge-tree`), and that merge is left to the next round.
- **Databases:** my own `vw18_probe_test`, `vw18_full_test` and `vw18_protected_test`. All are dropped.
- **Ports:** Hub :4973 and the stand-in WAWU ID :4974. Port :4001 was used once, for the full suite, only after `lsof` showed it free. My mock there was stopped straight after, and `lsof` was empty again.
- **Fintava:** no call at all. The receipt routes never call Fintava, so the ledger rows came from the ledger's own writer (`LedgerService.record`), the stand-in this brief allows.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw18/` (below, `vw18/`).

**Verdict: 2 open defects (D1, D2) and 1 latent privacy defect (D3). Status is back to building.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | **Backend:** `tsc --noEmit` 0. eslint (no `--fix`) on every added or changed `.ts`: 0. Gates: 9 run, 657 files scanned, **16 fail / 15 warn** / 76 accepted. Main `fe1ec6c` is 16 / 13 on 645 files. The FAIL lines are identical, and the only added warnings are `PROVISIONAL(RECEIPT-LOOKUP-LIMITS)` and `PROVISIONAL(RECEIPT-RENDER-LIMITS)`. `check_baseline.py` passes (108 entries). **Mobile:** `npm run check` exit 0 (typecheck, lint, 26 suites / 431 tests, gates 9 run / 110 files / 0 fail / 0 warn, 205 tasks). | `vw18/tsc.txt`, `vw18/eslint.txt`, `vw18/gates-main.txt`, `vw18/gates-branch.txt`, `vw18/g-main.lst`, `vw18/g-branch.lst`, `vw18/baseline.txt`, `vw18/mobile-check.txt` |
| V2 Contract | passed | **Full suite as `deploy.yml` runs it:** a fresh migrated and seeded `vw18_full_test`; my mock from `mock-wawu-id/server.js` on :4001, with a keypair made as `deploy.yml` makes it; the CI admin secrets; `npx jest --runInBand --forceExit`. Result: **136 of 136 suites, 3,263 passed, 3 skipped, 0 failed** (21:25 to 21:30 UTC). **Contract:** `npm run contract:build` equals the committed `contract/openapi.json` (order aside). The mobile `contract/openapi.json` is byte-equal to it, `SOURCE_COMMIT` is `2729634`, and the 4 new paths are present. **Dependency:** `npm ci` from the lockfile into an empty `node_modules` installed cleanly (36 s). `@resvg/resvg-js` and the `linux-x64-gnu` binary are 2.6.2, MPL-2.0 (a file-level copyleft, acceptable unmodified). The lock diff is 216 added lines only, and `npm audit` is unchanged from main (11). | `vw18/full.txt`, `vw18/full-start.txt`, `vw18/lsof4001-after.txt`, `vw18/contract-build.txt`, `vw18/openapi.built.json` |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` (code `2729634`, lock `origin/main` `fe1ec6c`): **253/253, all 244 required**. No file of the lock or the suite is touched. CI tripwire over the 3,732 added lines outside the checker's files: 0 matches. `hub-rate-limits.contract.spec.ts` passes (in the focused run, 7 suites 93/93). | `vw18/protected.txt`, `vw18/tripwire.txt`, `vw18/focused-specs.txt` |
| V4 Field trace | passed | **`MoneyReceipt`:** written only by `ReceiptService.codeFor` (the three owner routes); read by `issue` and `lookup`; deleted by the purge (OWNED, `wawuUserId`). **The page:** every field comes from MONEY-15's `detail` on each ask, and nothing is copied or summed. Settling the pending bill row in the database turned the next open of its page from Pending to Completed. **Shared files** (`money.module.ts`, both gate route lists, MONEY-04's served list, the rate-limit spec, `.env.example`, `deploy/README.md`, the purge map): added entries only. Two existing `WALLET.md` lines were reworded to point at these routes, consistent with R-33. **Wallet gate:** runs on all three owner routes (gate specs; mutant V7 below). | `vw18/probe/v9-status-and-miss.txt`, `vw18/backend.diff` |
| V9 Live seam | passed (Fintava stand-in) | Built Hub on :4973. Three people registered on the stand-in WAWU ID and signed in through its `/auth/login` (no minted token). Their wallets and 12 ledger rows were written by the ledger's own writer. **Covered:** a send to a WAWU user, a bank send, money in from a bank, a tip from a handle-only user, an unlock purchase, two bills, the recipient's own `in` row, and 4 rows with hostile names. **Results:** every `POST .../receipt` returned 200, with image 200 `image/png` and PDF 200 `application/pdf`. Every page matched its row: amount, Lagos date, status, reference and masked sides. All 12 PDFs pass `pypdf` strict as one A4 page and render in PyMuPDF. The sandbox was not called; the builder's `docs/fintava/sandbox/39-wallet18-receipts.md` is the real-movement evidence. | `vw18/probe/` (`seed.js`, `probe.js`, `probe-out.txt`, `public-*.html`, `public-*.headers.txt`, `*.png`, `*.pdf`, `pdf-validate.txt`) |

**Capability checks**
- **A receipt's code opens a page that matches the transaction: passed.** For example, a bank send's page shows ₦25,000.00, Completed, 27 Sep 2026, 12:02 (Lagos), its reference, From "Lennox E. O." / "Loma Bank •••• 9001" and To "Chidinma O." / "GTBank •••• 6789". The code also opens typed in lower case, hyphenated, with O for 0 and L for 1 (`wmq7-bgll-3mtp`).
- **A made-up code shows 'not found', never someone else's receipt: passed.** I sent 300 made-up and 300 malformed codes (300 characters), plus 300 asks each for two stale codes: one whose wallet no longer matches and one whose ledger row is gone. All 1,200 got 404 with one byte-identical body (sha `8da1fc6353ce`).

**Focus results**
- **Privacy on the public page (5 transaction types plus the recipient's side):** I scanned the HTML (attributes, meta and title included) and the response headers. None of these appears:
  - any of the 3 wallets' full NUBANs, or the other sides' full accounts (`0123456789`, `2234567891`), a meter number or a phone;
  - the 3 people's emails or phones from the WAWU ID, their WAWU user ids, or the handle;
  - the note or the link title (`SECRETNOTE`, `SECRETTITLE`);
  - any surname.

  One exception is D3. The type is the kind only ("Unlock", "Tip", "Bill"), never what was bought. A received payment's image and PDF show the sender only as bank plus last 4. The owner's own full number appears on the owner's own image and PDF only (the builder's default), and never for the other side. The 404 and 200 pages send `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `<meta name="robots" content="noindex, nofollow">`, `Referrer-Policy: no-referrer` and helmet's CSP. There is no CDN in front (nginx only), and `no-store` keeps a future CDN from caching. The masking can't be reversed by combining fields: the public page never shows more than 4 digits of either account, and the owner's full number is only on the owner-shared image and PDF.
- **Codes:** 200,000 drawn from `newReceiptCode`: all 32 symbols, chi-square 29.4 on 31 degrees of freedom, all unique. Nothing is derived from an id or a time. 20 parallel `POST`s on one row made one code (one row in `MoneyReceipt`), and no code repeats across rows (unique index; 0 duplicates in the probe database).
- **Throttles:** sent through loopback as nginx sends them, with a varying client-written `X-Forwarded-For` and a fixed nginx-appended peer:
  - the public page's 11th ask in a minute is 429, misses included, and a fresh address is unaffected;
  - the image's 11th is 429;
  - the PDF has its own bucket (10 then 429).

  The left-hand `X-Forwarded-For` entries are never read (`hubTrustProxy` trusts only one loopback hop), so a client cannot spread its asks across made-up addresses. (`vw18/probe/throttle.txt`)
- **Miss timing:** the body and headers are identical apart from the date and rate-limit counters. Timing is not identical (300 each, medians, `vw18/probe/miss-timing.txt`):

  | Kind of ask | Median |
  |---|---|
  | made-up code | 3.0 ms |
  | malformed code | 3.0 ms |
  | stale: wallet no longer matches | 3.7 ms |
  | stale: ledger row gone | 7.0 ms |
  | a hit, for scale | 7.1 ms |

  So the builder's "after exactly one `MoneyReceipt` lookup" holds only for codes never issued. A code once issued whose row has since gone runs 3 queries. See finding 4.
- **Owner routes:** B asking for A's row by id got the same 404 body as a missing id, on all three routes. No token gets 401. A received payment's image and PDF show the sender's account as bank plus last 4 only.
- **Rendering safety:** `<script>`, `&`, both quote kinds, `</text><text>` and `<img onerror>` in a name and a bank name are escaped on the page and drawn as literal text in the PNG and PDF (`vw18/probe/hostile.png`). RTL and bidi-override characters render without spilling into other rows (`rtl.png`). See D1 and D2 for the failures.
- **Font:** the script rebuilt from the mobile repo's Alan Sans gives glyph tables byte-identical to the committed three (the naira glyph is identical). The only difference is `head.modified`, the build time, so the files are reproducible in content but not byte for byte (finding 5). The OFL licence is copied beside the fonts, the copyright and licence name records are kept, and the family is renamed (Alan Sans declares no Reserved Font Name, so the rename is extra care). `assets/receipt/submark.svg` is byte-identical to the brand pack's `assets/brand/source/submark.svg` (R-37). The receipt colours equal `design/_ds/wawu/tokens/colors.css` and the canvas's `rcpt` greys.
- **Mutations:** my own 9, none of the builder's 6, against the receipts, gate, rate-limit and money-contract specs (93 tests), each file restored by copy (`vw18/mut/`). **7 killed:**
  - masking removed entirely (V1b);
  - the public page's type is the whole description (what was bought shows);
  - `X-Robots-Tag` dropped;
  - dates in UTC;
  - the page's hourly limit 600;
  - the PDF route without the wallet gate;
  - the counterparty's full name on the page.

  **2 survived:**
  - V1, digit runs masked only from 7 digits (no test pins the 5-digit edge);
  - V2, `escapeXml` without `&`, so an `&` in a name would break the image and the PDF (no test draws a name with `&` or `<`).
- **Secret scan:** 0 of the key's 58 windows in either branch diff or in any evidence file (`vw18/keyscan.txt`).

**Findings**
1. **defect: drawing a receipt has no time bound, and it blocks the whole server while it draws.**
   - **Cause:** `wrap()` and `fit()` in `receipt-render.ts` measure every candidate cut with a fresh `Resvg` instance, one character at a time, synchronously on the event loop. The cost grows with the square of an unbroken string's length.
   - **Input:** the ledger keeps names and bank names up to 500 characters and references up to 200 (`ledger.service.ts` `clean`).
   - **Reproduction:** a ledger row whose counterparty name is 500 letters with no space, written with `LedgerService.record` (`vw18/probe/one-row.js 500 17`), then the owner's `GET .../receipt/pdf`.

     | First draw of the row | Time | `/health` asked meanwhile |
     |---|---|---|
     | PDF, 500-letter name | 13.9 s | waited 13.6 s |
     | image, same row (the width cache, cleared past 5,000 entries, was cold again) | 6.2 s | waited 5.9 s |
     | 200-letter name | 1.1 s | |
     | 200-character reference | 0.76 s | |
     | names of 60 or fewer letters | 0.12 to 0.13 s | |

     (`vw18/probe/render-timing.txt`)
   - **Why it matters:** every other request on the server waits that long. Ten asks a minute per address on each of two routes is enough to keep it busy.
   - **Close when:** a draw has a bound (cap or pre-cut the printed strings, measure in steps rather than one character at a time, or draw off the event loop), and a test pins it.
2. **defect: a printed name with a character XML forbids makes the image and the PDF answer 500.**
   - **Reproduction:** a received transfer whose counterparty name is `Bad\u0001Name\u0008X \uFFFE` (the `ctrl` row in `vw18/probe/seed.js`). `POST .../receipt` and the public page are fine (the page shows "BadNameX"), but `GET .../receipt/image` and `.../receipt/pdf` answer `500`. The log reads `SVG data parsing failed ... a non-XML character '\u{1}'`.
   - **Close when:** `escapeXml`, or the text it is given, drops or replaces characters outside XML 1.0's range, and a test draws one.
3. **defect (privacy, latent): a phone or meter number written with spaces or hyphens shows whole on the public page in a company's name.**
   - **Cause:** `maskDigits` masks only an unbroken run of 5 or more digits. A biller (or `wawu`) side keeps its whole name, so "MTN Airtime 0803 123 4567" is printed as is (`vw18/probe/public-bill.html`). The unbroken "IKEDC Prepaid 45012345678" is masked correctly.
   - **Why latent:** no writer records a biller row today. The bill tasks will.
   - **Close when:** digit groups joined by spaces, hyphens, dots or a leading `+` are masked as one run, and a test pins it (mutant V1 also shows that the 5-digit edge is unpinned).
4. **unclear (owner, low risk):** a stale code (a receipt whose ledger row is gone) takes as long as a hit, about twice a made-up code. Someone who already holds the code can tell it was once issued. Nobody can find a code to ask about (60 bits, 60 asks an hour per address), so I judge this harmless. The builder's report line "after exactly one `MoneyReceipt` lookup" should say it holds for codes never issued.
5. **Note:** `build-receipt-fonts.py` writes the build time into `head.modified`, so a rebuild is equal in every table but not byte-identical. Setting `SOURCE_DATE_EPOCH` or fixing the timestamp would make it reproducible.
6. **Note:** two surviving mutants (V1, V2 above) are test gaps. They are not defects in the code as built.

**Diff against the report:** the 33 backend and 11 mobile files match the builder's list. Nothing is missing or extra. No stand-in remains for anything main has.

**NOT RUN**
- **A bank send's receipt from the sandbox:** the sandbox refuses every payout (question 17). This is unblocked when a sandbox payout succeeds. Covered here from the ledger writer.
- **The receipt link on the live host:** unblocked when `RECEIPT_VERIFY_BASE_URL` is set on the droplet (G-67).
- **The prebuilt binary on the droplet:** unblocked by the first deploy (`GET .../receipt/image` answering 200 there).
- **V5 pictures:** they belong to WALLET-12's screens.
- **A real Fintava movement in this round:** the brief allowed only a few free GETs and the routes call none, so the builder's sandbox run (doc 39) stands.

**To close:** D1 (bound the draw and keep it off the event loop), D2 (drop non-XML characters before drawing), D3 (mask spaced and hyphenated digit groups), each with a test. Then merge mobile main `42309b2`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
