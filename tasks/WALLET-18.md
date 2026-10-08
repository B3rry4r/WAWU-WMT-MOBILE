---
id: WALLET-18
title: Receipts
owner: YOU
area: WALLET
order: 240
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: done
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

### Builder round 5

Builder, 4 Oct 2026. Backend `wmt/WALLET-18` **5008664**. In order: backend main 95d8bd4 (KYC-03) merged in (9412423, clean); the fix (**295aa30**); backend main c4d17bb (FIX-05) merged in (5008664, clean). Mobile: main 26cf830 merged in (2796b99). PROGRESS was regenerated and the contract was copied from 5008664. `contract:build` gives the same bytes, and the contract did not change in either merge. Only D3 finding 1 was worked on.

**D3, finding 1: the 12 digits added after Unicode 14. Fixed two ways, by the lead's ruling.**
- **1. The table now comes from Unicode 17.0.0, the runtime's version.**
  - `scripts/receipt/build-digit-table.py` no longer uses Python's `unicodedata` (14.0 on Python 3.11, 15.1 on 3.13). It reads `UnicodeData.txt` 17.0.0 from unicode.org and checks it against a pinned SHA-256 (`2e1efc1d...d96470c`, the same file the round 4 verifier downloaded). The URL and checksum are in the generator and in the generated file's header. A file with another checksum is refused and nothing is written. The output is the same byte for byte from a download, from a local copy, and under Python 3.10 or 3.11.
  - `OTHER_DIGITS` has 511 entries: the 499 it had, all unchanged, plus exactly the 12 from the finding (Kaktovik 0 to 9, U+1D2C0 to U+1D2C9; Yangqin signs U+16FF4 = 1 and U+16FF6 = 2).
  - New `OTHER_NUMBERS`: the other 643 `No`/`Nl` characters (fractions and numbers of 10 or more), stored as 81 ranges. These are known not to be digits.
  - **Test:** fails when `UNICODE_DIGIT_VERSION` is older than `process.versions.unicode`.
  - **Test:** the table's 1,154 characters are exactly the runtime's `\p{No}` and `\p{Nl}`, with none missing and none extra.
- **2. Fail closed.**
  - A character the runtime calls a number (`\p{N}`) is treated as a digit of unknown value when it is not a decimal digit and is not in either table list. In practice that means a character from a newer Unicode than the table. This check runs before NFKC and again after it.
  - An unknown digit counts toward its number like any other digit, so five of them still make a number. It is never shown.
  - **Default (agent), owner may override:** an unknown digit that falls in the last four, or in a number shorter than 5 digits, shows as `•`. It keeps its place, and no other digit moves up to fill it.
    - With Kaktovik 1 and 5 removed from the table, the mixed row shows `•••• 4•67`, where the real last four are 4567.
    - A number ending in an unknown digit shows `•••• 456•`.
    - `Flat` followed by one unknown digit shows `Flat •`.
    - Only digits whose value the table knows are ever shown.
  - **Masking marker:** while masking, an unknown digit is held as the noncharacter U+FDD0. Unicode reserves these for a program's internal use. A U+FDD0 already present in a name is first replaced with U+FFFD, so it can never be read as a digit.
  - **For testing:** `digitMasking(table)` builds the fold and the mask over any table. `foldDigits` and `maskDigits` are the same functions as before, built over the shipped table.
- **Unchanged:**
  - Values of 10 or more still never fold to one digit: `⑩ ⑪` become `10 11`, `Ⅻ` becomes `XII`, Kaktovik 10 and 19 stay as written.
  - The page's own amount is untouched (₦1,234.56 on all 73 probe rows).

**Proving tests (`receipt-units.spec.ts`, new block "the digit table keeps up with the runtime (round 5)", 5 tests; `d3-forms.ts`, 6 new rows)**

| Test | What it proves |
|---|---|
| Version not older than the runtime | `17.0.0` against Node's `17.0`. The comparison itself is checked too: `14.0.0` against `17.0` is older, and `17.0.0` against `17.0.1` is older. |
| The table equals the runtime's No/Nl set | 1,154 characters, 0 missing, 0 extra. None is unknown today. |
| The 12 characters | Each is in the table with its value, folds to that value, and six in a row mask as `•••• dddd`. Kaktovik 10 and 19 stay as written. |
| Fail closed, worked cases | A table with Kaktovik 1 and 5 removed. All Kaktovik 11 digits give `•••• 4•67`. Digits mixed with outlined digits give `•••• 4•67`. An unknown digit in the middle gives `•••• 4567`. An unknown last digit gives `•••• 456•`. Six unknown digits give `•••• ••••`. Short numbers give `Flat •, Shop 12•`. A U+FDD0 in the input becomes U+FFFD. |
| Fail closed, every character | For each of the 1,154 No/Nl characters, a table without it hides that character alone (`MTN •`) and inside a number (`MTN •••• 4567`). |
| D3 forms (unit and HTTP) | 6 new rows from the verifier's finding: all Kaktovik, `0803` then Kaktovik, a GTBank name in Kaktovik 0 to 9, Yangqin at the end, mixed Kaktovik and outlined, and Yangqin plus Kaktovik. Each gives its exact masked output and at most 4 visible digits, in the unit test and through `LedgerService.record` and the public page in the HTTP test. |

**Mutations:** 6 of 6 killed:
- M1: the old UCD 14 table (6 tests fail).
- M2: only the version string set back to 14.0.0 (the version test fails).
- M3: no fail closed (2 tests fail).
- M4: unknown digits dropped from the shown four, so other digits move up (1 test fails).
- M5: an unknown digit guessed as 0 (2 tests fail).
- M6: the final hide of short-number unknowns removed (2 tests fail).

**The verifier's probes, rerun on this build**
- **Unit probe:** `vw18r4/probe/d3unit.js`, pointed at this build's `dist`. 0 of 29 cases show more than 4 digits, against 3 in round 4. Only the 4 finding rows changed. For example, the mixed row now shows `•••• 4567` (round 4: `𝋀•••• 3467`), and the Yangqin row shows `•••• 4512`.
- **HTTP probe:** `seed4.js` and `d3r4.js`, pointed at this build's Hub on :4971 and the stand-in on :4972.
  - All 73 D3 rows, on the public page and in the owner's image and PDF lines: 0 show more than 4 digits, against 4 in round 4.
  - Diffed against `vw18r4/probe/d3-results.txt`, only the 5 finding rows changed (4 biller rows and the GTBank bank name). The other 68 rows are identical.
  - The amount is ₦1,234.56 on all 73 rows.
  - The seed's only error is the `nul` row, which Postgres refuses. Round 4 had the same error.

**Runs (backend 5008664 unless marked)**

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 |
| eslint on the changed `.ts` | 0 |
| Receipts, gate, money contract and rate-limit specs (fresh `w18r5_focus_test`, stand-in on :4972) | 7 suites, 141 passed. At 295aa30, before FIX-05 added rate-limit tests, it was 130: round 4's 125 plus the 5 new tests. |
| Full suite, fresh seeded `w18r5_full_test`, stand-in on :4001 (free right before start, confirmed as the listener, alive to the end, stopped after) | **145 suites: 3,504 passed, 3 skipped, 0 failed.** |
| Protected `--fresh HEAD` (lock unchanged) | 253/253, all 244 required. The lock was read at origin/main 030d789; its files are the same at c4d17bb and on this branch. |
| Tripwire | 0 matches in 6,025 added lines (branch against main c4d17bb, the protected suite's own files excluded) |
| Gates | Branch 16 fail / 27 warn. The FAIL lines are identical to main's. Against main 95d8bd4 (16 / 24), the only added warnings are the three receipt `PROVISIONAL`s, as in round 4. Main has since gained 6 of its own (statement and data export), so main dfaa53b reads 16 / 30. `check_baseline.py` passes. |
| `contract:build` | byte-equal to the committed contract |
| Key scan | 0 of 58 windows in 295aa30, both merges (9412423, 5008664), the whole branch diff, the mobile merge and the mobile report commit |
| Mobile `npm run check` | exit 0: 36 suites, 666 tests, gates 0 fail / 0 warn on 171 files, 206 tasks. An earlier attempt timed out `OpenWalletScreen` A26 at 20 s, with the load average at 12 from my backend suite; this run was at load 4. |

**Full suite, for the record:** four runs.
1. At 295aa30, on the host: 2 failures in `fintava-stall.spec.ts` (1,214 ms against a 1,000 ms bound, with the load average at 12 from my mobile check). That suite then passed 120/120 alone.
2. At 295aa30, in its own network namespace (the `vw18r4` scripts), after another session's stand-in took :4001: 144 suites passed. Only `hub-rate-limits` failed, since it needs a non-loopback interface.
3. At 5008664, on the host: 1 failure, the round 2 bound "drawing ... under 300 ms" at 303 ms (load 12 from other sessions). That test draws an already-built document, so no masking code runs in it. It then passed 3 of 3 alone.
4. At 5008664, the run in the table: 0 failed. For that run, :4001 was free right before start (read from `/proc/net/tcp`), my PID was the listener, and the stand-in was alive at the end and stopped after.

**Fintava:** no call.

**Mains moved again during the round:** backend main is now 030d789 (after dfaa53b: WALLET-27 statements, SETTINGS-04, HOME-06) and mobile main is 6de2fd9. This branch has c4d17bb and 26cf830, as the coordinator named. A trial merge of backend dfaa53b conflicts in 5 files: `src/money/money.module.ts`, `docs/contract/WALLET.md`, the two wallet-gate specs and the rate-limit spec. Mobile `BACKEND_GAPS.md` conflicts too. Not merged here.

**NOT RUN:**
- As round 1: a bank send's receipt from the sandbox, the live host's link, the binary on the droplet, V5.
- No Hub run was done with a table older than its runtime. Fail closed is proven at the function level, by injecting a table.
- The verifier's two probes ran at 295aa30. Between 295aa30 and 5008664 only FIX-05's three files changed (`app.module.ts`, the throttler store and its spec), so the masking code was the same.

### Builder round 4

Builder, 4 Oct 2026. Backend `wmt/WALLET-18` **23c4ed3**. The fixes are in d8bc16b; 4f27119 rewords one test helper's comment that the deferrals gate read as prose; then backend main e6bd701 (HOME-05) was merged in cleanly. Mobile: main 2874688 merged in. BACKEND_GAPS kept both sides' rows (G-100 to G-113 are other tasks'), PROGRESS was regenerated, and the contract was copied from 23c4ed3.

**D3: every Unicode digit, by the lead's ruling. Fixed.**
- **A digit is any character whose Unicode numeric value is a whole number from 0 to 9.**
  - Every `\p{Nd}` digit is folded by its value.
  - Every `No` and `Nl` character with such a value is folded from a table generated from the Unicode Character Database. This covers circled, negative circled, double circled, dingbat, sans-serif dingbat, Ethiopic, Roman numerals and so on.
  - The table is generated by `scripts/receipt/build-digit-table.py` (Python's `unicodedata`, UCD 14.0.0) into `src/money/receipts/unicode-digits.generated.ts`: 499 characters, never edited by hand.
  - These are folded first, then NFKC, then the decimal digits.
  - **Gap:** an `No` digit added in Unicode 15 to 17 is not in the table until it is regenerated with a newer Python. Decimal digits use the runtime's own Unicode (Node 22, Unicode 17).
- **x-split numbers:** digit groups joined by any run of non-letters, which may also hold `x` or `X` once or more, count as one number. So `0803 x 123 x 4567`, `0803xx123xx4567`, `0803 X 123-4567` and `0803x 1234567` all become `•••• 4567`. By the ruling, digits split by any other letter stay separate numbers (`MTN 0803 Ada 1234567` shows `MTN 0803 Ada •••• 4567`).
- **Tests:**
  - **Generated:** every `\p{Nd}` code point in the runtime (over 600) and every one of the 499 table entries folds to its value. Six of each in a row are masked as `•••• dddd`. The table also holds no fraction and no number of 10 or more.
  - **Unit:** all of round 3's `d3b_*` forms are added to `tests/d3-forms.ts` (42 forms now), each with its exact output and the verifier's "at most 4 visible digits" measure.
  - **HTTP:** the same forms through `LedgerService.record` and the public page (46 rows: 37 biller, 5 bank name, 4 person), including the negative-circled person name.

**D5: the PDF always fits its page. Fixed.**
- The receipt is placed at 1.25 times its drawn size, 72 pt from the top. If that would leave less than 36 pt under it, it is scaled down to fit (`pdfPlacement`). The whole receipt (the 200-character reference's last line, the footer and its link) is on the one A4 page.
- **Tests:**
  - the verifier's `refWide` receipt (an out row, both names 500 wide letters, a 200-W reference): the picture's box read from the PDF's own content stream is inside the page, and so is the footer's link;
  - an ordinary receipt keeps 1.25 and 72 pt.

**Test gaps closed**
- **R3 (per-line clip):** a pixel test. A line of characters the font lacks (the verifier's emoji value) leaves both side margins of the image blank. With the clip removed, the test fails.
- **R4 (Retry-After):** an HTTP test makes a real 503. One slot is held and the wait is 100 ms. Both the image and the PDF answer 503 with `Retry-After: 5` and the busy sentence, and the next request after the slot frees answers 200 without the header.

**Mutations:** 5 of 5 killed:
- the per-line clip removed;
- the 503 sent without `Retry-After`;
- no UCD table;
- x joining only directly between digits;
- no fit on the page.

**Memory, 20 bursts:** 30 PDFs each, 2 drawing slots, no forced garbage collection. This was run in the renderer's own process; the Hub itself was not measured.

| | Range over 20 bursts |
|---|---|
| Peak per burst | 311 to 335 MB |
| Memory 3 s after each burst | 285 to 335 MB, in no order (285, 317, 304, 327, ..., 335, 287, 294, 297, 296) |

It plateaus; there is no steady climb (`vw18r3`'s 394 to 470 MB over 7 bursts was measured in the whole Hub).

**Runs (23c4ed3, after the HOME-05 merge; the same checks also passed at 4f27119: full suite 143 suites, 3,444 passed)**

| Check | Result |
|---|---|
| `tsc` | 0 |
| eslint on changed `.ts` | 0 |
| Receipts, rate limits, gates, money contract, purge | 129 passed |
| Full suite, fresh seeded `w18_full_test`, stand-in WAWU ID on :4001 (checked free with `lsof` right before starting, confirmed as the listener, alive to the end, stopped after) | 144 suites, 3,469 passed, 3 skipped, 0 failed |
| Protected `--fresh HEAD` (23c4ed3, lock origin/main e6bd701 unchanged) | 253/253 |
| Tripwire | 0 added lines |
| Gates | main e6bd701 16 fail / 24 warn, branch 16 / 27 (only the three receipt `PROVISIONAL`s are new) |
| `contract:build` | run after the merge |
| Key scan | 0 of 58 windows in each commit |
| Mobile `npm run check` | exit 0: 33 suites, 602 tests, gates 0 fail / 0 warn on 157 files, 205 tasks |

**Fintava:** no call.

**A lost run, for the record:** one full-suite run after a container restart answered 497 failures, all `401`. Another session's stand-in WAWU ID (from `wt/b-WALLET-27`, a different keypair) took :4001 during my run's migrate and seed, after my `lsof` check and before my stand-in started, so mine never listened. The run script now checks the port right before starting, confirms its own PID is the listener, and checks the stand-in is still alive at the end. The re-run above passed.

### Builder round 3

Builder, 4 Oct 2026 (resumed after a container restart; the worktrees were intact). Backend `wmt/WALLET-18` **f1a9d59**: the round-3 fixes are in 066b1eb. Backend main was merged in twice, cleanly both times: aa11bcc (INBOX-09, at 25de8bb), then 9a370c0 (ME-05, ME-09, HOME-04, at f1a9d59). Main's new migration `20261004020000_content_engagement` sorts after this task's `20261003202940_money_receipts`; both are additive. Mobile: the verifier's f4d0ddb, then main d60edd3 and 9a0c1be merged in.
- **Merge conflicts (mobile):** BACKEND_GAPS kept both sides' rows (G-74 to G-94 are other tasks'; G-66 and G-67 stay this task's). PROGRESS was taken from main and regenerated, and the contract was copied from f1a9d59.

**D3: phone and account numbers in names. Fixed at the root.**
- **Digits are folded first** (`foldDigits`): NFKC, so full-width, superscript, circled and mathematical digits become ordinary ones. Then every other Unicode decimal digit (`\p{Nd}`: Arabic-Indic, Persian, Devanagari, ...) becomes 0 to 9 by its value.
- **One number:** digits joined by anything that is not a letter count as one number. That covers spaces, NBSP, underscores, commas, dashes, dots, colons, middle dots, zero-width and format characters, and any symbol. A single `x` or `X` between two digits joins them too. With 5 or more digits, only the last 4 show (`•••• 4567`).
- **Where it applies:**
  - on the public page, every name, bank name and biller name (and so the person-name initials path);
  - on the owner's image and PDF, the other side's name, its bank name and the headline.
  - The page's own amount, date and reference are never passed through it, so they always show as recorded.
- **Out of scope:** digits split by letters other than a single x or X (`0803ab123ab4567`, `acct 0803 ref 1234567`) are separate numbers.
- **Decision:** a date or an amount written into a name is reshaped as a number (`IKEDC token 2026-10-03 ₦5,000.00 Ref 12` becomes `IKEDC token •••• 0000 Ref 12`). Default (agent), owner may override.
- **Tests:**
  - unit, all 24 forms the round-2 verifier listed (`tests/d3-forms.ts`), each checked for its exact output and with the verifier's metric (at most 4 digits visible once digits are folded and letters ignored);
  - the three person-name forms;
  - the date decision;
  - the other side masked on the owner's view;
  - HTTP: the verifier's `d3_*` rows written through `LedgerService.record`, 27 rows (biller names, bank names, person names), each one's public page checked on its From and To fields, with the amount still `₦1,234.56`.

**D4: stacked combining marks. Fixed.**
- `printable()` now applies NFC and keeps at most 2 combining marks (`\p{M}`) on any one character.
- Each drawn line is clipped to its own box: the content width, from 1.15 em above the baseline to 0.4 em below.
- **Tests:**
  - unit, the marks limit;
  - pixels: the image's first 60 points (mark, title, date) are byte-identical with and without the verifier's `combining` name;
  - HTTP: that row's image and PDF answer 200, and its page has no run of 3 marks.

**Memory: drawings capped at 2 at once.**
- A process-wide `DrawLimiter` runs at most `RECEIPT_RENDER_CONCURRENCY` draws at once. The setting defaults to 2 (1 to 8; `PROVISIONAL(RECEIPT-RENDER-CONCURRENCY)`, in `.env.example` and `deploy/README.md`).
- Other requests wait first come, first served, for up to 10 s, then get 503 "Receipts are busy right now. Try again in a few seconds." with `Retry-After: 5`, documented on both routes.
- The PDF now rasterises the receipt only. The A4 page and its hairline edge are drawn by the PDF itself, which halves the pixels.
- **Measured** (10 PDFs at once, 3 bursts, with a garbage collection between):

  | Draws allowed at once | Peak memory | After each burst |
  |---|---|---|
  | 10 | 363 MB | 302 to 357 MB |
  | 2 | 273 MB | 243 to 250 MB |

  The server was 164 MB at rest after the first draw. Memory does not grow from burst to burst. The roughly 80 MB above rest that stays is the native allocator's retained arenas, not live buffers.
- **Tests:**
  - unit: at most 2 at once and first come, first served; a request with no slot within the wait gets the 503 busy refusal; a failed draw frees its slot; the setting is 2, 1 to 8, and anything else stops the app;
  - HTTP: 8 at once (4 PDFs, 4 images) all answer 200 with a peak of exactly 2.

**Test gaps closed**
- N2: the cap test asserts the literal 160.
- N4: 7 samples drawn by resvg (`tests/drawn-width.ts`, the ink's bounding box). The width table is never narrower, and within 15% for Latin text.
- **Reference:** the 200-character reference is now drawn whole, on as many lines as it takes. Round 2 cut it after 3 lines. Tested.
- **Event-loop test:** made robust to a busy machine. It takes the best of 3 tries, so a drawing on the event loop still fails every try.
- **Mutations:** 8 of 8 killed: N2 (cap 2000), N4 (allowance 0.8), no NFKC, ASCII separators only, no x join, marks unlimited, no draw cap, the other side unmasked on the image.

**Emoji:** characters the font lacks still draw as the font's empty box, but each line is now clipped at the content edge, so nothing overruns. Recorded rather than fixed: no writer produces such names today.

**Runs (after the last merge, f1a9d59; the same checks also passed at 25de8bb: full suite 140 suites, 3,382 passed)**

| Check | Result |
|---|---|
| `tsc` | 0 |
| eslint on changed `.ts` | 0 |
| Receipts, rate limits, gates, money contract, purge | 123 passed |
| Full suite, fresh seeded `w18_full_test`, stand-in WAWU ID on :4001 (each time `lsof` showed it free first; once another session held it about 25 minutes; stopped after) | 143 suites, 3,438 passed, 3 skipped, 0 failed |
| Protected `--fresh HEAD` (lock origin/main 9a370c0 unchanged) | 253/253 |
| Tripwire | 0 added lines |
| Gates | main 9a370c0 16 fail / 21 warn, branch 16 / 24 (the three receipt `PROVISIONAL`s; `RECEIPT-RENDER-CONCURRENCY` is new) |
| `contract:build` | run after each merge |
| Key scan | 0 of 58 windows in each commit |
| Mobile `npm run check` | exit 0: 29 suites, 556 tests, gates 0 fail / 0 warn on 135 files, 205 tasks |

**Fintava:** no call this round.

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

### Verifier report, round 2

Verifier, 3 Oct 2026. This is the same session as the round-1 report: a verifier that wrote none of this task's code. It was a narrow round on backend `wmt/WALLET-18` `2108141` (fixes in `2397eba`, then main `1e6b807` merged in) and mobile `04d2626` (main `c733413` merged in). Both mains are unmoved, and I used fresh detached worktrees `/home/user/wt/vw18b2` and `/home/user/wt/vw18m2`.
- **Databases:** `vw18r2_*` (all contain `test`). All are dropped.
- **Ports:** Hub :4973 and the stand-in WAWU ID :4974. Port :4001 was used once, for the full suite, only after `lsof` showed it free. My mock there was stopped straight after, and `lsof` was empty again.
- **Sign-in:** people registered and signed in at the stand-in's `/auth/login`; no token was minted.
- **Ledger rows:** written by `LedgerService.record`.
- **Fintava:** no call.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw18r2/` (below, `vw18r2/`).

**Verdict: D1 and D2 are closed. D3 is still open (privacy, latent), and one new minor defect (D4) was found. Status is back to building.**

| Check | Result | Evidence |
|-------|--------|----------|
| D1 time bound | **closed** | **Single draws** at the ledger's longest values (500-letter name, 500-letter bank name, 200-character reference), each the first draw of that row: PDF 200 in 314 ms, with `/health` pinged every 10 ms meanwhile at a 5.6 ms median and 79 ms max. Image 200 in 150 ms, with `/health` at most 5.8 ms. These were 13.9 s and 6.2 s in round 1. **10 at once** (10 different maximum-length rows, first draws): 10 PDFs in 1.04 s with `/health` at most 128 ms; 10 images in 0.58 s with `/health` at most 62 ms. No probe crashed, and every answer was 200. **Cap and width tables:** I tried 500 full-width Ｗ, 500 W, 300 U+FDFD, emoji ZWJ families and flags, 495 combining marks, RTL with bidi overrides, 500 zero-width characters, CJK, and mixed wide words. Every image and PDF answered 200 in 56 to 206 ms. Nothing was inked in either 55 px side margin except the emoji row (finding 3). **Metrics:** the measured width is never below the drawn ink in 11 samples (ratio 0.35 to 0.99; Latin about 0.95). | `vw18r2/probe/d1-timing.txt`, `d1d2-rows.txt`, `margins.txt`, `metrics-vs-drawn.txt`, `*.png` |
| D2 forbidden characters | **closed** | **Through the ledger** (rows with every C0 control but NUL, DEL and C1, U+FFFE, U+FFFF, lone high and low surrogates, and a mix, in the name, the bank name and the reference): image 200, PDF 200, page 200. No forbidden character appears raw in the page source. "Bad N. S.", "BadName" and "REF X" are shown, and `&`, `<` and `>` are escaped. NUL cannot reach a row at all: Postgres refuses it at the ledger write. Lone surrogates arrive as U+FFFD after the database round trip, so I also called `receiptPng`, `receiptPdf` and `receiptPage` directly with every class in every field (including unpaired `\uD800`, `\uDBFF`, `\uDC00`, `\uDFFF`). Results: PNG and PDF produced, the page carries no forbidden character, and no raw `<b>`. | `vw18r2/probe/d1d2-rows.txt`, `d2-direct.txt`, `public-c0.html` and others |
| D3 masking | **still open** (finding 1) | 33 rows checked on the public page: 20 biller names, 4 bank names, 3 person names, 2 legitimate texts, and others. **Masked correctly:** spaces, NBSP, hyphens, dots, slashes, brackets, `+234 (0) 803 123 4567`, two numbers side by side (one mask, only the second's last 4), `O8O3 l23 4567`, an account inside a bank name (`GTBank 0123456789` and `012 345 6789`), and a phone first in a person's name. **Not masked:** see finding 1. | `vw18r2/probe/d3-public.txt`, `public-d3_*.html` |
| The merge | passed | `money.module.ts`, both gate route lists, MONEY-04's served list, the schema, the purge map and the rate-limit spec were each diffed against both parents. Against main `1e6b807`, the only changes are WALLET-18's additions. Against `2397eba`, the only changes are main's additions (WALLET-15's fee quote, INBOX-08's `DmReply`). The removed lines are only the old test titles, merged into one. The receipts migration still sorts last. Mobile: `SHARED-CHANGES.md`, `BACKEND_GAPS.md`, `LOG.md` and the sandbox README against `c733413` are additions only. | `vw18r2/backend.diff`, `vw18r2/mobile.diff` |
| V1 Gates | passed | `tsc` 0. eslint on changed `.ts`: 0. Gates: 9 run, 669 files, **16 fail / 16 warn** against main `1e6b807`'s 16 / 14 on 656 files. The FAIL lines are identical, and the only added warnings are `PROVISIONAL(RECEIPT-LOOKUP-LIMITS)` and `PROVISIONAL(RECEIPT-RENDER-LIMITS)`. `check_baseline.py` passes. Mobile `npm run check`: exit 0 (28 suites / 485 tests, gates 9 run / 123 files / 0 fail / 0 warn, 205 tasks) on the second run. The first run timed out once in main's KYC-05 `OpenWalletScreen` test (5 s, load average about 4); that is not this task's code. | `vw18r2/gates-*.txt`, `g-*.lst`, `mobile-check.txt`, `mobile-check2.txt` |
| V2 Contract | passed | **Full suite as `deploy.yml` runs it:** fresh migrated and seeded `vw18r2_full_test`; my mock from `mock-wawu-id/server.js` on :4001, with a keypair made as `deploy.yml` makes it; the CI admin secrets. Result: **139 of 139 suites, 3,335 passed, 3 skipped, 0 failed** (22:11 to 22:16 UTC). **Contract:** `npm run contract:build` output is byte-equal to the committed `contract/openapi.json`. The mobile copy is byte-equal too, with `SOURCE_COMMIT` `2108141`. | `vw18r2/full.txt`, `vw18r2/openapi.built.json` |
| V3 Regression | passed | `run.sh --fresh HEAD` (code `2108141`, lock `origin/main` `1e6b807`): **253/253, all 244 required**. The lock and suite files are untouched. Tripwire over 4,182 added lines: 0 matches. | `vw18r2/protected.txt`, `vw18r2/tripwire.txt` |
| Mutations | 4 of 6 killed | **Round 1's survivors are now killed:** V1 (mask from 7 digits) and V2 (`escapeXml` without `&`). **My 4 new ones:** N1 (`printable` keeps lone surrogates) and N3 (the PDF page drawn synchronously on the event loop) were killed. Two survived, both test gaps: N2 (`MAX_PRINTED` 160 to 2000: the `clip` test reads the constant it checks) and N4 (`KERNING_ALLOWANCE` 1.03 to 0.8: no test compares the width table with what resvg draws, because "every line fits" is measured with the same table). | `vw18r2/mut/summary.txt`, `*.log` |
| V9 seam | passed | **Real sign-in at the stand-in:** A asking for C's row by id on all three routes got 404 with a body identical to a missing id. A made-up code got 404 "Receipt not found". A's own PDF got 200. | `vw18r2/probe/cross-owner.txt` |
| Key scan | passed | 0 of 58 windows across both branch diffs, the round-2 diffs and all 127 evidence files. | `vw18r2/keyscan.txt` |

**Findings**
1. **defect (privacy, latent): D3 is narrower but still open.** These forms of a phone or account number show whole on the public page (`vw18r2/probe/d3-public.txt`):
   - **Separators outside the mask's set** (`[\s.\-/()]`):
     - underscore: `0803_123_4567`;
     - comma: `0803,123,4567`;
     - en dash: `0803 – 123 – 4567`;
     - middle dot: `0803·123·4567`;
     - colon: `0803:123:4567`;
     - zero-width space between groups.
   - **Digits that are not ASCII** (`\d` matches only 0 to 9):
     - full-width: `０８０３１２３４５６７`;
     - Arabic-Indic: `٠٨٠٣١٢٣٤٥٦٧`;
     - Persian: `۰۸۰۳۱۲۳۴۵۶۷`;
     - Devanagari;
     - superscript;
     - circled;
     - mathematical bold.
   - **Same in other places:** a bank name (`GTBank ０１２３４５６７８９`) and the first word of a person's name (`０８０３１２３４５６７ J. D.`, `0803_123_4567 J.`).
   - **Groups split by letters:** `0803x123x4567` and `acct0123x456x789` also show whole (each group is under 5 digits). The owner may judge that form out of scope.
   - **Why latent:** no writer records a biller row yet, and today's bank and person names come from NIBSS and BVN records.
   - **Close when:** digits are folded first (NFKC plus `\p{Nd}`), any run of non-letters (punctuation, symbols, format characters) between digit groups joins them, and the unit test gains these forms.
2. **defect (minor, new): a name with stacked combining marks is drawn over the rest of the receipt.**
   - **Reproduction:** a received transfer whose sender name is `A` plus 495 combining accents (the `combining` row in `vw18r2/probe/seed2.js`).
   - **Result:** the marks rise from the headline and the From row up through the date, "TRANSACTION RECEIPT" and "Transfer", past the top edge (`vw18r2/probe/combining.png`).
   - **Why:** the width table bounds each line's width, but nothing bounds a line's height.
   - **Realism:** bank and BVN names do not carry such marks.
   - **Close when:** marks beyond one or two per base character are dropped (or each value is clipped to its row), and a test pins it.
3. **Note:** the emoji row's value runs about 16 pt past the right content edge into the card's padding (still inside the card), and characters the font lacks are drawn as solid boxes (`emoji.png`, `wideFull.png`, `bismillah.png`). This is cosmetic, and no writer produces such names today.
4. **Note:** 10 PDFs drawn at once raised the Hub's memory from 173 MB to about 640 MB (about 45 MB per PDF in flight), and it stayed there afterwards. No limit caps how many draws run at once across addresses. It is worth sizing against the droplet.
5. **Note:** masking also reshapes numbers that are not personal, but only inside names (`IKEDC token 2026-10-03 ₦5,000.00` shows as `•••• 1003 ₦5,•••• 0000`). The page's own amount, date and reference are never masked: every row showed ₦1,234.56 and 1 Oct 2026, 11:00.
6. **Note:** the two surviving mutants (N2, N4) are test gaps, not defects in the code.

**NOT RUN:** as round 1 (a bank send's receipt from the sandbox, the live host's link, the binary on the droplet, V5). No Fintava call was needed: round 2 changes drawing and masking only.

**To close:** D3 (fold digits and join groups across any non-letter separator) and D4 (bound mark stacking or clip each row), each with a test; and pin `MAX_PRINTED`'s value and the width table against the drawn width (N2, N4).

### Verifier report, round 3

Verifier, 4 Oct 2026. This is the same verifier session as rounds 1 and 2, and it wrote none of this task's code. It was a narrow round on backend `wmt/WALLET-18` `f1a9d59` (fixes in `066b1eb`, main `9a370c0` merged in) and mobile `604c066` (main `9a0c1be` merged in). Both mains are unmoved, and I used fresh detached worktrees `/home/user/wt/vw18b3` and `/home/user/wt/vw18m3`.
- **After the container restart:** I started my own processes. These were Hub :4973 and the stand-in WAWU ID :4974, each tracked by PID and checked by working directory before it was stopped. Port :4001 was used once, for the full suite, only after `lsof` showed it free; my mock there was stopped straight after, and `lsof` was empty again.
- **Databases:** `vw18r3_*`. All are dropped.
- **Sign-in:** through the stand-in's `/auth/login`.
- **Ledger rows:** written by `LedgerService.record`.
- **Fintava:** no call.
- **Disk:** the disk filled during this round (other sessions' data). I removed only my own earlier-round worktrees (`vw18b`, `vw18m`, `vw18b2`, `vw18m2`, `vw18bmain*`) and my Python venv to free room. Their evidence stays in `vw18/` and `vw18r2/`.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw18r3/` (below, `vw18r3/`).

**Verdict: D4 and the memory finding are closed. D3 is narrower again but still open (latent), and a new minor defect D5 (the PDF cut off at the page) was found. Status is back to building.**

| Check | Result | Evidence |
|-------|--------|----------|
| D3 masking | **still open, narrower** (finding 1) | 51 rows checked on the public page and in the owner's printed lines (headline and the other side, which the image and PDF draw): every round-2 `d3_*` row plus 22 new ones. Counted by folding every character that has a Unicode digit value (788 of them, any category) and ignoring letters. **Masked correctly (at most 4 digits visible):** all round-2 forms; digits with combining marks between them; RLM, RLO and bidi isolates between or around groups; mixed scripts (`٠٨٠3 １２３ ४५६७`, `0٨0۳-१２3–4⁵67`); `0803X123X4567`; `+ 234 803 …`; `0803½1234567`; `0803…123…4567`; a 500-digit run; a 500-character comma-separated run; two numbers side by side. **Not masked:** see finding 1. The page's amount (₦1,234.56) and date are untouched on every row. | `vw18r3/probe/d3-results.txt`, `seed3.js`, `d3r3.js`, `public-d3*.html` |
| D4 marks | **closed** | `A` plus 495 combining marks: image 200, PDF 200, page 200. The page's longest run of marks is 2, and the picture keeps the marks inside the From row; nothing reaches the header or date (`vw18r3/probe/combining.png`). Emoji, RTL, zero-width, CJK and full-width rows leave no ink in either 55 px side margin (the round-2 emoji overrun is gone). | `vw18r3/probe/d4-ref.txt`, `d4-ref-geometry.txt` |
| Draw cap | **passed** | **Ordering:** one PDF alone took 200 ms. In a burst of 10 PDFs at once, all answered 200 in 1.23 s, finishing in pairs (344/350, 564/580, 796/806, 1012/1034, 1220/1229 ms), so 2 draw at a time. **Load:** 3 bursts of 30, then 120, then 3 more of 30 all answered 200. 220 at once gave 142 x 200 and 78 x 503, the 503s answered at 10.77 to 10.79 s with `Retry-After: 5` and the body "Receipts are busy right now. Try again in a few seconds.". There was no 500 in any burst and no error line in the Hub log. **`/health`:** median 1.3 to 6 ms during the bursts, max 9.6 to 87.6 ms, and 160 ms with 220 queued. **Memory:** peaks per 30-burst were 461, 470, 458, 489, 488 and 481 MB, and 498 MB for 120. Three seconds after each burst the Hub held 394, 417, 440, then 444, 443 and 470 MB. Peaks do not grow burst over burst (round 2 reached about 640 MB with 10 at once), though what stays after a burst drifts up slowly (note 4). **A failed draw frees its slot:** checked directly on `DrawLimiter` (4 failing draws leave 0 in flight, then 3 draws run; a third request with two slots held 800 ms and a 500 ms wait gets `ReceiptBusyError` 503), and mutant R1 below. | `vw18r3/probe/cap.txt`, `cap503.txt`, `limiter-direct.txt` |
| 200-character reference | **image passed; PDF fails** (finding 2) | **Image:** the whole reference (200 W's) is drawn on 11 lines inside the card, with no ink in either side margin (`refWide.png`). The page shows all 200 characters. **PDF:** the same receipt runs off the bottom of the A4 page (image box 72 to 984.5 pt on an 842 pt page), so the end of the reference and the "Check it at wawu/r/<code>" footer are cut (`refWide-pdf-page.png`). | `vw18r3/probe/d4-ref-geometry.txt`, `pdf-overflow-threshold.txt` |
| The merge | passed | `money.module.ts`, both gate lists, MONEY-04's list, the schema, the purge map, the rate-limit spec, `.env.example` and `deploy/README.md`: against main `9a370c0`, the only removed lines are the old test titles, merged into one; against `066b1eb`, nothing is removed. Main's `20261004020000_content_engagement` sorts after `20261003202940_money_receipts`. A database built from main `9a370c0`'s migrations, then deployed from this branch, applies only `money_receipts` and gets the table. Mobile's merge against `9a0c1be` keeps both sides. | `vw18r3/backend.diff`, `vw18r3/mobile.diff` |
| V1 Gates | passed | `tsc` 0. eslint on the branch's changed `.ts`: 0. Gates: 9 run, 690 files, **16 fail / 24 warn** against main `9a370c0`'s 16 / 21 on 673 files. The FAIL lines are identical, and the only added warnings are `PROVISIONAL(RECEIPT-LOOKUP-LIMITS)`, `(RECEIPT-RENDER-LIMITS)` and `(RECEIPT-RENDER-CONCURRENCY)`. `check_baseline.py` passes. Mobile `npm run check`: exit 0 (29 suites / 556 tests, gates 9 run / 135 files / 0 fail / 0 warn, 205 tasks). | `vw18r3/gates-*.txt`, `g-*.lst`, `mobile-check.txt` |
| V2 Contract | passed | **Full suite as `deploy.yml` runs it:** fresh migrated and seeded `vw18r3_full_test`; my mock on :4001 with a keypair made as `deploy.yml` makes it; the CI admin secrets. Result: **143 of 143 suites, 3,438 passed, 3 skipped, 0 failed** (02:15 to 02:21 UTC). **Contract:** `npm run contract:build` output is byte-equal to the committed `contract/openapi.json`. The mobile copy is byte-equal too, with `SOURCE_COMMIT` `f1a9d59`. | `vw18r3/full.txt`, `contract-build.txt` |
| V3 Regression | passed | `run.sh --fresh HEAD` (code `f1a9d59`, lock `origin/main` `9a370c0`): **253/253, all 244 required**. Tripwire over 4,825 added lines: 0 matches. | `vw18r3/protected.txt`, `tripwire.txt` |
| Mutations | 2 of 4 killed | Focused baseline 7 suites, 119/119. **Killed:** R1 (a failed draw keeps its slot) and R2 (masking only from 6 digits). **Survived, both test gaps:** R3 (the per-line `clipPath` removed: no test needs it now that marks are limited) and R4 (the 503 sent without `Retry-After`: no HTTP test makes a real 503; the header works, as measured above). | `vw18r3/mut/` |
| Key scan | passed | 0 of 58 windows across both branch diffs, the round-3 diff and all 130 evidence files. | `vw18r3/keyscan.txt` |

**Findings**
1. **defect (privacy, latent): D3 still shows some numbers whole.** On the public page and the owner's image and PDF:
   - **Digit characters `foldDigits` does not fold.** These are Unicode "other number" (`No`) digits that NFKC leaves alone, 69 characters in all:
     - negative circled `⓿❶ … ❾`;
     - circled sans-serif `➀ … ➈`;
     - negative circled sans-serif `➊ … ➒`;
     - double circled `⓵ … ⓽`;
     - Ethiopic `፩ … ፱`.

     Examples: `MTN ⓿❽⓿❸❶❷❸❹❺❻❼` and a person `⓿❽⓿❸❶❷❸❹❺❻❼ Ada Obi` show all 11 digits, and a bank name `GTBank ⓿❶❷❸❹❺❻❼❽❾` shows all 10.
   - **x-split numbers outside the one form the code joins** (a single x directly between digits). With spaces (`MTN 0803 x 123 x 4567`) or doubled (`0803xx123xx4567`), the whole number shows. `0803x 1234567` shows as `0803x •••• 4567`. The ruling keeps x-split digits in scope but does not say whether spaces or a doubled x around it count, so that boundary is for the owner.
   - **Why latent:** no writer produces biller rows yet, and bank and BVN names do not carry these characters.
   - **Close when:** any character with a Unicode digit value is folded (for example a table for the `No` digits, or counting every `\p{N}` as a digit for the mask), the x join tolerates spaces and repeats if the ruling covers them, and the unit forms gain these cases.
   - **Out of scope by ruling:** digits split by other letters (`0803 Ada 1234567` shows `0803 Ada •••• 4567`). A number deliberately split across fields (first name `0803`, bank name `123 Bank`, account ending 4567) shows each field's group, never more than 4 digits in one; groups that are separate in the record cannot be known to be one number.
2. **defect (minor, new): in the PDF, a long reference pushes the receipt off the bottom of the A4 page.** The reference is now drawn whole (up to 200 characters) and the card grows with it, but the PDF places it at 72 pt from the top at a fixed 1.25 scale with no fit.
   - **What is lost:** the end of the reference and the "Check it at wawu/r/<code>" footer (and the licence line).
   - **Thresholds** for a money-out receipt (card height from `receiptCard`):
     - normal names: the bottom goes off the page from 170 alphanumeric characters (200 reach 878 of 842 pt);
     - wide letters: from 115 characters;
     - a three-line name with an alphanumeric reference: from 115 characters.
   - **Reproduction:** an out row with `customerReference` of 200 `W` (`refWide` in `vw18r3/probe/seed3.js`), then `GET .../receipt/pdf`; see `vw18r3/probe/refWide-pdf-page.png`. The PNG of the same row is complete.
   - **Why latent:** real references are about 30 characters, but the ledger keeps up to 200.
   - **Close when:** the PDF scales the card to fit the page (or adds a page), with a test at the ledger's longest reference.
3. **Note:** the masking decision for dates and amounts written into a name (`IKEDC token •••• 0000 Ref 12`) is recorded as the builder's default, and the page's own fields are untouched.
4. **Note, memory:** with 2 drawing slots, peaks are flat (about 460 to 500 MB in this run, starting from 378 MB after earlier probes). What the Hub keeps after a burst crept from 394 to 470 MB over 7 bursts with no forced garbage collection. That is not a leak I could show, but it is worth watching on the droplet.
5. **Note:** the two surviving mutants (R3, R4) are test gaps.

**NOT RUN:** as round 1 (a bank send's receipt from the sandbox, the live host's link, the binary on the droplet, V5).

**To close:** finding 1 (fold every Unicode digit value; ask the owner about spaced or doubled x), finding 2 (fit the card on the PDF page), and tests for R3 and R4.

### Verifier report, round 4

Verifier, 4 Oct 2026. This is the same verifier session as rounds 1 to 3, and it wrote none of this task's code. It was a narrow round on backend `wmt/WALLET-18` `23c4ed3` (fixes `d8bc16b`, comment `4f27119`, main `e6bd701` merged in) and mobile `ebf1085` (main `2874688` merged in). Both mains are unmoved, and I used fresh detached worktrees `/home/user/wt/vw18b4` and `/home/user/wt/vw18m4`.
- **Processes:** my own Hub (:4973) and stand-in WAWU ID (:4974), each checked by PID and working directory before it was stopped.
- **Databases:** `vw18r4_*`. All are dropped.
- **Sign-in:** through the stand-in's `/auth/login`.
- **Ledger rows:** written by `LedgerService.record`.
- **Fintava:** no call.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw18r4/` (below, `vw18r4/`).

**Verdict: D5, R3, R4 and the memory question are closed. D3 is down to 12 characters added after Unicode 14 (finding 1), so one latent privacy defect stays open. Status stays building.**

| Check | Result | Evidence |
|-------|--------|----------|
| D3 masking | **open, 12 characters** (finding 1) | **Rows:** 73 on the public page and in the owner's printed lines: all 52 round-2 and round-3 rows plus 21 new ones. **How counted:** with my own table of every character with a numeric value 0 to 9 in **UCD 17.0** (1,294; `UnicodeData.txt` from unicode.org), not the builder's. **All 52 earlier rows** show at most 4 digits: the round-3 leaks (negative circled, dingbat, sans-serif dingbat, double circled, Ethiopic, dingbat person and bank names, `0803 x 123 x 4567`, `0803xx123xx4567`, `0803x 1234567`) are now `•••• 4567`. **Also masked:** Roman numerals (Nl), upper and small; Hangzhou numerals; post-14 decimal digits (outlined, Garay, Kawi, Tolong Siki; these come from Node 22's own Unicode 17); No and Nd mixed in one run; `xXx` runs; full-width `ｘ`; small Roman ten `ⅹ` as the joiner. **Values of 10 or more do not fold to a digit:** `⑩ ⑪` become `10 11`, `Ⅻ` becomes `XII`, Kaktovik 10 and 11 stay as they are. **Not masked:** the 4 rows in finding 1. **Out of scope by ruling:** Cyrillic `х` as a joiner and CJK ideographs (letters, note 2). The page's amount is ₦1,234.56 on all 73 rows. **Builder's table:** every one of its 499 entries agrees with UCD 17. | `vw18r4/probe/d3-results.txt`, `d3-unit.txt`, `post14.txt`, `seed4.js`, `d3r4.js`, `d3unit.js` |
| D5 PDF page | **closed** | **Method:** read from the PDF's own content stream and link annotation, with the Hub given a public host (`RECEIPT_VERIFY_BASE_URL`) so the link is drawn. **`refWide`:** one page; the receipt box spans 72.0 pt from the top to 36.0 pt above the bottom, at scale 1.005; the link rect (y 58.9 to 74.0) sits on the "Check it at" line. `refWideSpaces` (1.054) and `refFull` (1.238) behave the same. **Short receipts** keep 1.25 and 72 pt (`refPlain`, `max`, `combining`). The page drawn from the PDF shows the whole 200-character reference and the footer (`refWideL-pdf-page.png`). | `vw18r4/probe/pdf-geometry.txt`, `pdfgeo.py` |
| R3, R4 and new mutants | **6 of 6 killed** | Focused baseline 7 suites, 125/125. **Killed:** R3 (the per-line clip removed); R4 (503 without `Retry-After`); and four of my own: M5 (PDF fit with no room under it), M6 (footer link placed at the old 1.25 scale), M7 (Nl letter numbers left out of the fold), M8 (only a lowercase x joins). | `vw18r4/mut/run.txt`, `mut/*.log` |
| Memory, whole Hub | **plateaus** | **Setup:** a fresh `node dist/src/main.js` with RSS read from the Hub's own PID, 20 bursts of 30 PDFs, no forced garbage collection. **Results:** all 600 answered 200. Idle RSS was 247 MB. Peaks per burst were 415 to 444 MB, with no trend. Three seconds after each burst the Hub held 361 to 428 MB, in no order (425, 415, 370, 362, 399, ..., 428, 400, 381, 399). Thirty seconds after the last burst it was back to 322 MB. `/health` median 1.7 to 5.4 ms, max 81 ms. No error line in the Hub log. | `vw18r4/probe/mem20.txt`, `mem20.js` |
| The merge | passed | Against main `e6bd701`, the only removed lines in the shared files are the old test titles. **Migrations:** main's new `20261004100000_content_frames` sorts after `money_receipts`. A database built from `e6bd701`'s migrations, then deployed from this branch, applies only `money_receipts` and gets the table. **Mobile:** contains main `2874688`. | `vw18r4/backend.diff`, `mobile.diff` |
| V1 Gates | passed | `tsc` 0. eslint on the branch's changed `.ts`: 0. Gates: 9 run, 697 files, **16 fail / 27 warn** against main `e6bd701`'s 16 / 24 on 679 files. The FAIL lines are identical, and the only added warnings are the three `PROVISIONAL(RECEIPT-*)` lines. `check_baseline.py` passes. | `vw18r4/gates-*.txt`, `g-*.lst` |
| V2 Contract | passed | **Full suite as `deploy.yml` runs it:** fresh migrated and seeded `vw18r4_full_test`, the stand-in on :4001 with an `openssl` keypair, and the CI admin secrets. **144 suites: 3,469 passed, 3 skipped, 0 failed.** **How it ran:** :4001 was held for over an hour by an orphaned stand-in from another session (`wt/vk03b3`, PPID 1), which I left alone. So the suite ran in its own network namespace (`unshare -n`, Postgres through a relay), where :4001 could only be mine: empty before the start, my PID as the listener at the start and after jest, empty after stop. 143 suites passed there. The one that needs a non-loopback interface (`hub-rate-limits`, 10 tests) cannot run in a loopback-only namespace and passed 10/10 on the host network. **Contract:** `contract:build` output is byte-equal to the committed `contract/openapi.json`. The mobile copy is byte-equal too, with `SOURCE_COMMIT` `23c4ed3`. **Mobile `npm run check`:** exit 0 (33 suites / 602 tests, gates 9 run / 157 files / 0 fail / 0 warn, 205 tasks). The first attempt timed out one unrelated test (`OpenWalletScreen` A26, 20 s, load average 17 from other sessions); alone it passed 34/34. | `vw18r4/full.txt`, `port4001.txt`, `full-ratelimits-host.txt`, `fullsuite-ns.sh`, `fullsuite-inner.sh`, `mobile-check*.txt` |
| V3 Regression | passed | `run.sh --fresh HEAD` (code `23c4ed3`, lock `origin/main` `e6bd701`): **253/253, all 244 required**. Tripwire over 5,627 added lines: 0 matches. | `vw18r4/protected.txt`, `tripwire.txt` |
| Key scan | passed | 0 of 58 windows in `d8bc16b`, `4f27119`, `23c4ed3`, both branch diffs, the round-4 diff and all evidence files. | `vw18r4/keyscan.txt` |

**Findings**
1. **defect (privacy, latent, narrow): 12 digit characters from Unicode 15 to 17 are still shown whole.**
   - **The gap:** the table is built from Python 3.11's UCD 14.0, but the runtime is Unicode 17. These 12 `No`/`Nl` characters have a digit value in UCD 17 and are missing from it:
     - Kaktovik numerals zero to nine, U+1D2C0 to U+1D2C9;
     - Yangqin signs U+16FF4 (1) and U+16FF6 (2).

     The builder named this gap in round 4; the ruling covers every Unicode digit, and the runtime already treats these as numbers.
   - **Examples:**
     - `MTN 𝋀𝋈𝋀𝋃𝋁𝋂𝋃𝋄𝋅𝋆𝋇` shows all 11 digits on the public page and in the image and PDF lines;
     - `MTN 0803𝋁𝋂𝋃𝋄𝋅𝋆𝋇` shows 11;
     - a bank name `GTBank 𝋀…𝋉` shows 10;
     - `MTN 080312345𖿴𖿶` shows `•••• 2345𖿴𖿶` (6).

     Mixed with other digits, the mask is also wrong: `MTN 𝋀8𜳰3𝋁2𜳳4𝋅6𜳷` shows `𝋀•••• 3467`, where the real last four are 4567.
   - **Why latent:** no writer produces biller rows yet, and a reader needs a font that draws these glyphs.
   - **Close when:** the table is built from UCD 17 (or the same Unicode version as the runtime, for example from a pinned `UnicodeData.txt`), with a test that fails when `UNICODE_DIGIT_VERSION` is older than `process.versions.unicode`. Add Kaktovik and Yangqin rows to the unit forms.
2. **Note, out of scope by ruling (for the owner):**
   - A Cyrillic `х` between groups (`0803 х 123 х 4567`) keeps the groups apart, since it is "another letter", though it looks like x.
   - CJK numerals are letters (Lo) and are never folded (`〇八〇三一二三四五六七` shows as written). Only `〇` (U+3007, Nl) folds. Masking them would also change ordinary Chinese names.
3. **Note:** the coordinator's warning holds. :4001 was taken by another session's orphaned stand-in for this whole round. A run inside its own network namespace makes :4001 private to that run, so this cannot happen. Only the rate-limit suite then needs the host network.

**NOT RUN:** as round 1 (a bank send's receipt from the sandbox, the live host's link, the binary on the droplet, V5).

**To close:** finding 1 (regenerate the table from UCD 17 and add the version test).

### Verifier report, round 5

Verifier, 4 Oct 2026. Same verifier session as rounds 1 to 4, and it wrote none of this task's code. Scope: D3 (digits shown whole) and its round 5 fix, against backend `wmt/WALLET-18` `5008664` (main `c4d17bb` merged) and mobile `be87619` (main `26cf830` merged). Fresh detached worktrees `/home/user/wt/vw18b5` and `/home/user/wt/vw18m5`; one more backend worktree for mutants and one at `c4d17bb` for the gates comparison, all removed at the end.
- **Processes:** my own Hub (:4973) and stand-in WAWU ID (:4974), each checked by PID, command line and working directory before it was stopped. The protected suite ran with the stand-in stopped, so it started its own on :4974. Nothing touched :4001.
- **Databases:** `vw18r5_probe_test`, `vw18r5_focus_test`, `vw18r5_protected_test`. All are dropped.
- **Sign-in:** through the stand-in's `/auth/login`. Ledger rows written by `LedgerService.record`.
- **Fintava, id.wawuafrica.com, api.wawuafrica.com:** no call. One download of `UnicodeData.txt` from www.unicode.org, to check the pinned checksum.
- **Phones, BVN, NIN:** masked to the last 4 digits below. The probe numbers are made-up test values.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vw18r5/` (below, `vw18r5/`).

**Verdict: D3 is closed. No defect is open. Status review.** One residual note (N1, below) is for the lead to rule on; it needs a future Unicode character that does not exist today.

| Check | Result | Evidence |
|-------|--------|----------|
| D3, the 73 round-4 rows (Hub built from `5008664`) | **closed, 0 of 73 show more than 4 digits** | **Method:** the round-4 probes `seed4.js` and `d3r4.js` unchanged except for ports and paths, on the public page and in the owner's printed lines, counted with my own table of every character with a numeric value 0 to 9 in UCD 17.0 (not the builder's). **Result:** 68 rows are identical to round 4's output; the 5 that changed are the finding's rows, and each now shows the real last four (`MTN 0803` then Kaktovik 1 to 7 gives `MTN •••• 4567`; `MTN 080312345` then the two Yangqin signs gives `•••• 4512`, the real last four; the GTBank name in Kaktovik 0 to 9 gives `GTBank •••• 6789`). The page's amount is ₦1,234.56 on all 73. The unit probe `d3unit.js`: 0 of 29 cases above 4 (round 4: 3). | `vw18r5/probe/d3-results.txt` (before: `vw18r4/probe/d3-results.txt`), `d3-unit.txt`, `seed4.js`, `d3r4.js`, `d3unit.js` |
| Attack rows through the whole stack | **0 of 234 fail** | **Rows (through the ledger, the page, the image and the PDF):** 234 names. Each of the 32 noncharacters U+FDD0 to U+FDEF, U+FFFE, U+FFFF, U+1FFFE, U+10FFFF and U+FFFD, and 31 more separators (bidi controls U+202A to U+202E, U+2066 to U+2069, LRM, RLM, ALM; ZWSP, ZWNJ, ZWJ, word joiner, BOM, soft hyphen, CGJ; variation selectors U+FE0E, U+FE0F, U+E0100; a tag character; combining marks; the keycap U+20E3; fraction slash; ideographic space; newline and tab), each as a separator in `0803 x 123 x 4567`, after every digit of an 11-digit number, and inside a 10-digit bank name (3 rows each); also: 11 U+FDD0 alone, mixed, in a bank name and a person name, 500 of them, and `1` + U+FDD0 repeated 250 times; Kaktovik and Yangqin with combining marks, bidi override, variation selector and ZWJ; NFKC forms (circled, parenthesised, digit-full-stop, telegraph hours, keycaps, digit-comma, fractions, super and subscripts, full-width, mathematical, segmented digits, mixed). **Result:** every row 200 on the receipt view, the public page, the PNG and the PDF; 0 above 4 digits on the page or in the printed lines; **no U+FDD0 in any page or printed line** (an input U+FDD0 comes out as U+FFFD); the amount is ₦1,234.56 on all. I read two of the PNGs (sentinel in the middle of a number; Kaktovik with combining marks): `MTN •••• 4567`. Of the 163 biller rows, my independent scanner agrees with the page on 160; the 3 others are the page's own clean-up (it drops U+FFFE and U+FFFF) and the ledger's 500-code-unit cap (a 255-character Kaktovik name is stored as 250). | `vw18r5/probe/seed5.js`, `check5.js`, `check5-results.txt`, `oracle73.js`, `img5-*.png`, `doc5-*.pdf` |
| Fail closed on a real Hub | **passed** | **Method:** the builder's NOT RUN item. A Hub built from `5008664` with the 12 characters of the finding taken out of the table (a runtime one Unicode version ahead of its table), on :4973, with the 73 D3 rows and the 234 attack rows rerun. **Result:** 0 above 4 digits; 0 sentinel; all 234 PNG and PDF 200; the 5 finding rows now fail closed: `MTN •••• ••••` (Kaktovik 0 to 7), `MTN •••• 45••` (the Yangqin row, real last four 4512), `MTN •••• 4•67` (mixed with outlined digits), the GTBank name `•••• ••••`. Combining marks, bidi override, variation selector and ZWJ on all-unknown Kaktovik: `MTN •••• ••••` plus the same trailing mark. | `vw18r5/probe/d3-results-behind.txt`, `check5-results-behind.txt` |
| Differential fuzz, shipped table | **0 of 1,050,000** | **Method:** random strings from a 144-piece alphabet (ASCII, full-width, circled, dingbat, parenthesised, superscript and subscript digits, `⑩ ⑪ ⑳`, Roman, Kaktovik, Yangqin, Arabic-Indic, mathematical, fractions, joiners, bidi controls, variation selectors, keycap, combining marks, `x`, `×`, Cyrillic `х`, noncharacters U+FDD0 to U+FDEF, U+FFFE, U+10FFFF, lone surrogates, NUL), compared with an oracle I wrote by hand (values from my own parse of UCD 17, a hand scanner instead of the builder's regex). **Result:** 0 crashes, 0 sentinels, 0 outputs above 4 digits, 0 differences. | `vw18r5/probe/fuzz.js`, `fuzz-1.txt` to `fuzz-5.txt` |
| Differential fuzz, fail closed | **0 of 612,000** | **Method:** 10,200 tables with random No and Nl characters removed (all of them; half of them; 1 to 12), 60 strings each, the same alphabet plus the removed characters; oracle counts a removed character as one unknown digit. **Result:** 0 crashes, 0 sentinels, 0 outputs above 4 digits, 0 removed characters in any output, 0 differences. | `vw18r5/probe/fuzz2.js`, `fuzz2-7.txt` |
| Table against UCD 17.0 | **passed** | **Method:** my own parse of `UnicodeData.txt` 17.0.0. **Result:** `OTHER_DIGITS` has 511 entries and all 511 match (code point and value, category No or Nl, numeric value a whole number 0 to 9); the 12 characters of D3 are there with the right values (Kaktovik U+1D2C0 to U+1D2C9 = 0 to 9, Yangqin U+16FF4 = 1, U+16FF6 = 2). `OTHER_NUMBERS` has 643 characters in 81 sorted, merged ranges and matches the other 643 No and Nl characters exactly; none of them has a value 0 to 9, none of the 511 is missing from the digits. All 770 `Nd` characters fold to their `UnicodeData` decimal value. The runtime's `\p{N}` is 1,924 characters (Node 22.22.2, Unicode 17.0, ICU 78.2) and all 1,924 are in the UCD data. 16 CJK compatibility ideographs have a numeric value but are letters (Lo), out of scope by ruling (round 4, note 2). | `vw18r5/probe/tablecheck.js`, `tablecheck.txt` |
| Generator | **passed** | **Pinned checksum:** 4 inputs refused with exit 1 and nothing written: one digit's value changed, a trailing newline, 100 bytes cut off, an empty file; the message gives the checksum found and the one expected. **Source:** downloaded from unicode.org, the file has the pinned SHA-256 `2e1efc1d...d96470c`. **Deterministic:** a local copy, a second run and the download each give the committed `unicode-digits.generated.ts` byte for byte (Python 3.11). **Recorded:** version, URL and checksum are in the script and in the generated header. | `vw18r5/gen/`, `probe/UnicodeData-17.txt` |
| Version test | **passed** | `UNICODE_DIGIT_VERSION` set to `16.0.0` fails "the table's Unicode version is not older than the runtime's" (mutant MV14). The test compares against `process.versions.unicode` (`17.0`) and its comparison is itself checked on `14.0.0`, `17.0.0` and `17.0.1`. | `vw18r5/mut/MV14_version_old.log` |
| Mutants of my own | **17 killed, 2 survived** | **Killed (unit spec, `receipt-units.spec.ts`, 43 tests):** MV1 sentinel not scrubbed from the input; MV2 fail closed only above U+FFFF; MV3 unknown digits not counted in their number; MV4 threshold 6 instead of 5; MV5 last 5 shown instead of 4; MV6 `foldDigits` leaks the sentinel; MV7 only digits known (non-digit numbers unknown); MV8 sentinel scrub after the fold; MV9 Yangqin 2 given the value 3; MV10b `⑦` given the value 8; MV11 Kaktovik 9 left out of the table; MV12 final hide of unknown digits removed; MV14 table version 16.0.0; MV15 each range loses its last character; MV16 a number cannot start with an unknown digit; MV17 final hide not global; MV18 an unknown digit among the last 4 shown as 0. **Survived:** MV10 (`①` given the value 7): the unit and HTTP specs both pass (21/21), because `①` is never among the shown last four in their rows, so its value is not asserted; the shipped value is right (table check above). MV13 (the second, post-NFKC pass narrowed to decimal digits): equivalent today, since no character's NFKC output contains a non-decimal number character (checked for all 1,114,112 code points). | `vw18r5/mut/mutate.py`, `run.txt`, `*.log`, `MV10-contract.log` |
| V1 Gates | passed | `tsc` 0 (needs `@resvg/resvg-js` 2.6.2, which the main checkout's `node_modules` lacks; I linked it from the builder's worktree, versions match `package.json`). eslint on the 4 changed `.ts` files in `receipts/`: 0. Gates: 9 run, 700 files, **16 fail / 27 warn** against main `c4d17bb`'s 16 / 24 (682 files). The FAIL lines are identical; the only added warnings are `receipt-config.ts:15, 29, 44`: `PROVISIONAL(RECEIPT-RENDER-CONCURRENCY, RECEIPT-LOOKUP-LIMITS, RECEIPT-RENDER-LIMITS)`. `check_baseline.py` passes on both. | `vw18r5/gates-vw18b5.txt`, `gates-vw18b5c.txt`, `baseline-*.txt` |
| V2 Contract | passed | **Focused specs** (receipts, gate, money contract, rate limits; fresh migrated and seeded `vw18r5_focus_test`, stand-in on :4974): 7 suites, **141/141**. `contract:build` output is byte-equal to the committed `contract/openapi.json`; the mobile copy is byte-equal, `SOURCE_COMMIT` `5008664`. **Full suite:** not run (not required this round; the diff outside the masking code is FIX-05's three files, which the focused run includes). **Mobile `npm run check`:** exit 0, 36 suites / 666 tests, gates 0 fail / 0 warn on 171 files, 206 tasks. | `vw18r5/focused.txt`, `contract-build.txt`, `mobile-check*.txt` |
| V3 Regression | passed | `run.sh --fresh HEAD` (code `5008664`, lock `origin/main` `030d789`): **253/253, all 244 required**. The lock's files (`src/protected-routes`, `test/protected-routes`, `.pipeline/protected-registry.json`) are identical on the branch to both `origin/main` and `c4d17bb`. Tripwire (added lines outside those files matching `test/protected-routes|src/protected-routes|compareShape|protected-registry`, branch against `c4d17bb`, and against `030d789`): 0. | `vw18r5/protected.txt`, `tripwire.txt` |
| Key scan | passed | 0 of 58 windows (every 8-character window of the Fintava key) in the backend and mobile branch diffs (three-dot and `log -p` against `origin/main`) in this report, the LOG line and the PROGRESS page, and in all 403 text files of `vw18r5/`. | `vw18r5/keyscan.txt` |

**Findings**
1. **Note N1 (for the lead; not a defect under the rulings): an unknown number character is counted as exactly one digit.**
   - **Where:** fail closed turns the unknown character into one placeholder before NFKC, so its compatibility decomposition is never read. The ruling holds (an unknown character is hidden, counted, and never one of the shown digits; at most 4 digits ever show; 0 of 612,000 fuzz strings broke it).
   - **What it costs:** if the unknown character would really fold into 2 or more digits (a fraction `½`, a number of 10 or more such as `⑩`), the count is short and one digit that is really fifth from the end can show. Function level, with that one character taken out of the table: `MTN 12345⑩` shows `MTN •••• 345•` (shipped table: `•••• 4510`; the `3` is not among the real last four), `Flat 123⑩` shows `Flat 123•` (shipped: `•••• 2310`).
   - **How far it reaches:** in 90,000 single-number fuzz cases, 720 showed such a digit, and every one contained an unknown character with a multi-digit decomposition; none did with unknown characters of 0 or 1 digits.
   - **Why it is not reachable now:** it needs a runtime newer than Unicode 17 and a newly assigned number character with a compatibility decomposition into 2 or more digits. Of the 133 number characters assigned after Unicode 14, the only ones with a decomposition are the 10 outlined digits (one digit each, and decimal digits, so they never reach this path). The version test fails before such a Node reaches CI.
   - **Hardening, if wanted:** count an unknown character as 2 digits for the position of the shown four, or show only digits that lie at least 2 places before the end when an unknown is in the number. Ruling needed; not done.
2. **Note N2 (test strictness):** "the table holds exactly the No and Nl characters of the runtime" compares sizes both ways, so on a Node 22 older than the Unicode 17 update (before ICU 78) it fails because the table is ahead, which is not a privacy risk. CI uses `node-version: 22` (latest 22.x, Unicode 17.0 today), so it passes there. `>=` on the missing side only would be enough.
3. **Note N3 (test strength):** the unit and HTTP specs assert the value of the 12 new characters and the shown last four of each form, not the value of each of the other 499 entries (MV10 survived). The generator's pinned checksum is what guards them; no test re-runs it or hashes the generated file.
4. **Note N4 (merge state):** `origin/main` is now `030d789` (backend) and `7c6c7b2` (mobile), ahead of the `c4d17bb` and `26cf830` merged here. A trial merge (`git merge-tree`) conflicts in 5 backend files (`docs/contract/WALLET.md`, the two wallet-gate specs, `money.module.ts`, the rate-limit spec) and in mobile in `BACKEND_GAPS.md`, `contract/SOURCE_COMMIT`, `docs/PROGRESS.md` and `docs/fintava/sandbox/README.md`. Matches the builder's note for the backend. Not part of this verification.
5. **Carried from round 4, still out of scope by ruling:** a Cyrillic `х` between groups keeps them apart; CJK numerals are letters and are never folded (only `〇` folds).

**NOT RUN:**
- **A real Node with Unicode newer than 17.0:** none exists today (`process.versions.unicode` is `17.0` on Node 22.22.2). Replaced by the Hub with 12 characters taken out of its table, above. Unblocks when: a Node build reports `process.versions.unicode` above `17.0`; then the version test should fail first.
- **The full suite:** not required this round. Unblocks when: the lead asks for it, or a change outside the masking code and FIX-05's files lands (the last full run is the builder's, 145 suites, at `5008664`).
- **A bank send's receipt from the sandbox, the live host's link, the binary on the droplet, V5:** as round 1. Unblock when: the Fintava sandbox account has a funded wallet, the Hub is reachable at its public host, and the droplet is given.

**To close:** nothing. Rule on N1.

## Lead merge note (4 Oct 2026)

Merged to main by the lead. Backend PR #64 (38bbe4c). Lead changes on the
backend branch while merging main 030d789 (WALLET-27, SETTINGS-04, HOME-06):
five files where both tasks added to the same places kept both sides
(`money.module.ts`, the two wallet-gate specs, the rate-limit spec,
`docs/contract/WALLET.md`); the migration was renamed from
`20261003202940_money_receipts` to `20261004124500_money_receipts` because it
sorted before three migrations already applied on production; and
`MoneyReceipt` was decided in SETTINGS-04's data export (excluded: it holds the
account number, and wallet transactions are not exported, G-130). Full suite on
the merged tree in its own network namespace: 149 of 151 suites; the export
map and `hub-rate-limits` pass on the host network (27/27). Mobile contract
synced from backend main 38bbe4c. Verifier round 5 finding N1 (an unknown
number character is counted as one digit, so a future character that folds to
two digits could show the fifth-from-last digit) is accepted by the lead as a
follow-up: unreachable on Unicode 17, the version test fails first, and at most
4 digits ever show. N3 (no test hashes the generated table) is a follow-up too.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
