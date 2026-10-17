# INBOX-12 verifier report, round 2 (backend wmt/INBOX-12 8f9688a, mobile 37d43a0)

Verdict: MERGE (nothing medium or worse; three lows and one note).

## Findings
1. LOW. GET /paid-dm/settings/earn takes JS-Number spellings that are not plain integers: `0x1388`, `0005000`, ` 5000`,
   `+5000` all answer 200 with the correct figure for the parsed price (4250) and echo priceKobo 5000.
   Cause: `@Type(() => Number)` (src/direct-message/dto/paid-dm-settings.dto.ts:54). The PUT cannot receive these (JSON), so no
   divergence in what is saved; the app only sends plain digits. Repro: `GET .../earn?priceKobo=0x1388`. Sweep.
2. LOW. A failed earn call is made twice per typing pause (React Query `retry: 1`, src/features/paid-messages/PaidMessagesScreen.tsx:198):
   500, 429, 400, network abort each showed `reqs=2`. Success path is exactly one call. The Hub throttles 20 per second and
   200 per minute per IP across all routes (src/hub-throttlers.ts), so a 429's retry adds to that bucket. The screen shows a dash either way.
3. LOW (note, not a defect). R-21: the feature folder has no money arithmetic left. Remaining: `nairaToKobo(Number(digits))`
   (model.ts:32, 44), the R-21 helper for the naira the person types; `percentText` floors a percent; `windowLabel` divides hours.
   `earnKobo` and the `kobo / 100` accessibility label are gone (now `formatMoney`).
4. NOTE (harness). The stack's mock WAWU ID answers /auth/login without the `data` wrapper the app reads, so the web export
   cannot sign in against it ("Something went wrong on our side"). I wrapped the response in the browser route; the real wawu-id (`--with id`) needs no wrapper.

## Round 1 medium: fixed
PUT /paid-dm/settings with null, per field, on four creators (no row, saved 1500/48h on, no price off, paused 5 days):
48 bodies each (null enabled/price/hours alone and mixed, all null, wrong types for every field, old web shape, extra field,
12 raw bodies: duplicate key, __proto__, constructor.prototype, array/string/null/number, truncated, form-encoded, text/plain, no content type)
all 4xx, none 5xx, row text identical after every one, the no-row creator still has no row. Absent keeps the saved value
(enabled alone keeps price and hours; hours alone changes hours only); enabled true with no price anywhere is 400 and unchanged;
floor 5000 and ceiling 1000000000 save (4250 and 850000000 kept); plain user 403 and no token 401 with null write nothing; paused with a valid body 403 paid_messages_paused.

## The earn route
- Roles: no token 401, bad token 401, plain user 403 (also with a bad price: role first), creator with no row 200 and no row created,
  paused creator 200 (reads only, same as GET settings), POST/PUT/DELETE 404, settings route not shadowed.
- Validation: 41 query forms against the same value sent to PUT: accept/reject identical for every JSON-number value; messages match for non-whole naira.
  Missing, empty, abc, 5000.5, 4999, 5050, 1000000001, 9007199254740993, Infinity, NaN, arrays, `[a]`, extra param, wrong case, __proto__ nesting, 10000 digits: 400.
- Share and rounding: 74 prices (every 100 from 5000 to 7000, odd-looking ones, 13 spot prices, 40 pseudo-random up to the ceiling): earn figure, share and echoed price equal
  the PUT's saved view, equal GET settings, and equal floor(price*85/100). Share is a constant 85 and prices are whole naira, so the figure is always an integer.
- No write: 63 earn calls across a no-row creator, saved, paused, scratch: pg_stat deltas on every table empty, rows unchanged, counts unchanged.
- Rate: 30 in one second from one IP: 20 answer, 10 are 429 `ThrottlerException` (no 5xx); route answers again 2.5 s later. No per-route limit (the global one applies).
- Contract: backend 384e49c to 8f9688a: nothing removed or changed, only `PaidDmEarn` and the earn path added; mobile openapi.json and openapi.mobile.json
  likewise; earn path and schema equal in both repos; `.orig` deleted, no stray .orig/.rej in either tree.

## The app (web export, 390 px, light and dark; pictures in inbox-12-v/r2/shots)
27 checks in each theme, all pass: saved price shows the Hub's figure with no call; typing 2500 at 70 ms shows a dash, then ONE call (250000), dash while pending,
then 2125; slow typing asks only after valid pauses (12000, 120000) and shows the Hub's 1020; back to the saved price: no call; a price asked before: cache, no call;
below floor / above ceiling / empty: problem or dash, no call; preset tap: one call; newer answer wins while an older (3.5 s) is in flight and the late one does not overwrite it;
500, 429, 400, abort, answer for another price, float figure, null figure, empty data: all a dash, never an app-made figure; next price answers normally;
Save sends 550000, row 5500, no earn call after; empty creator dash then 595; locked creator shows the saved figure, no call. Console: no page errors.

## Other checks
- Jest paid-messages: 3 suites, 41 tests, EXIT 0. Backend CI on 8f9688a: 3 suite shards, netns, deploy-test, contract, baseline, protected routes green;
  Executable gates red 16 fail / 108 warn against main 18ac5f9 16 fail / 107 warn (none in paid-dm files; the extra warn is PROVISIONAL G-722). Both branches merge clean into main.
- Round 1 sweep rows exist (reply time saved off the list). Evidence: inbox-12-v/r2 (put.mjs, earn.mjs, extra.mjs, app.py, outputs), inbox-12-v/logs/r2-*.log.

---

# Round 1 (superseded by round 2 above)


Verdict: FIX (one medium).

## Findings
1. MEDIUM. PUT /paid-dm/settings accepts `priceKobo: null`. `@IsOptional()` lets null past @IsInt/@Min(5000)
   (src/direct-message/dto/paid-dm-settings.dto.ts:22-27), and the service tests `dto.priceKobo === undefined`
   (src/direct-message/paid-dm-settings.service.ts, `priceNaira` line) so null becomes 0/100 = 0.
   Repro (fresh creator, no price): PUT {"enabled":true,"priceKobo":null} -> 200, enabled true, priceKobo 0, DB dmPrice 0.
   Also wipes a saved price: creator on 1500 naira, PUT {"enabled":true,"priceKobo":null} -> 200, price 0.
   Bypasses the 5000 kobo floor and the "Set a price before you turn paid messages on" guard. The live PATCH
   /creator/dm-settings answers 400 to price 0 and to null. Fix: reject null (ValidateIf on !== undefined, or a service
   check), add a spec case. Contract also declares the field non-nullable.
2. LOW. contract/openapi.json.orig (50,281 lines) committed in 46bfbcc, a stray patch backup. Delete it.
3. LOW. R-21 ("a screen never multiplies or divides"): src/features/paid-messages/model.ts:49 earnKobo does
   floor(priceKobo*share/100) so "You earn" follows typing; parts.tsx:141 does `kobo / 100` in an accessibilityLabel.
   Values match the Hub's earnPerMessageKobo (same floor). Lead to rule or move to a quote.
4. LOW. A reply time saved off the list (web allows 1 to 336 h, e.g. 36) shows no selected window on I21; Save still
   works and keeps it (server accepts the unchanged value). Pictured: shots/off36-dark.png.
5. INFO (already G-723). Live PATCH /creator/dm-settings still lets a paused creator switch on; file byte-identical to main.

## Judged: the changed test (SHARED-CHANGES INBOX-12 #2)
listingsEntryReal.test.tsx T2 asserted "paid row has no chevron and is not a button", which the code comment says is the
pre-INBOX-12 state. New T2 asserts chevron plus accessibilityRole button; T3 presses it and expects push('/paid-message-settings').
Not weakened, logged. Accept.

## Checks
- Roles: no token 401 (GET, PUT); plain user 403 (GET, PUT), wrote nothing. Non-creator: no Inbox settings button, no
  paid row on Me, deep link shows the creator gate.
- Paused: PUT switch on / switch on without price / switch off / price / hours: all 403 paid_messages_paused, row unchanged;
  12 parallel PUTs all 403; invalid body still 400 first; pause ended -> 200; mid-edit pause -> Save refused, screen locks to I23.
- Validation: 18 bad bodies (non-whole naira, below min, above max, float, string, negative, old web shape, naira in kobo
  field, empty, bad hours, extra field, array, bad JSON) all 400, row unchanged. 25 parallel first writes: no 500 (429s are the global throttler); one row; final row one whole request.
- Live PATCH: controller, dto, service blob hashes identical to main 43a923a; web PATCH works and GET reads it.
- Config and kobo: every *Kobo integer; presets, windows from env (PAID_DM_*), floor 5000; share from commissionRate (85); earn rounds down.
- Screens 390 px light and dark beside artboards: I21, I22, I23 match (differences are the builder's listed ones plus brief wording); I1 button, M2 row, P8 link match; compose button not drawn (R-47). P8 link opens I21 and Back returns (dark persona with an application).
- States: loading skeleton while retrying, error with Try again (real network failure), retry loads, save failure keeps the form and shows the message, 500 shows the server message, double tap sends one PUT, empty creator, invalid price (Save disabled), Saved notice.
- Jest (mobile): paid-messages, me, inbox, pro-listing: 18 suites, 249 tests, EXIT 0. Mobile gates 0 fail 5 warn (none INBOX-12), baseline ok, tasks ok.
- Backend CI 15ee7e9: suites (3 shards), netns, protected routes, contract, deploy-test, baseline green; Executable gates red the same as main 43a923a (16 fail, none in paid-dm files; PROVISIONAL G-722 warn only).

Evidence: scratchpad/inbox-12-v/logs, shots, cmp (side by side).

## Sweep rows (round 2 lows, for tasks/SWEEP-INBOX.md)
- INBOX-12 | 4 | GET /paid-dm/settings/earn accepts `0x1388`, `0005000`, ` 5000`, `+5000` (Number coercion, paid-dm-settings.dto.ts:54); the figure is right and nothing is written. Tighten with a digits-only check if wanted. | verify/INBOX-12.md round 2, finding 1
- INBOX-12 | 4 | A failed earn read is made twice per typing pause (retry: 1, PaidMessagesScreen.tsx:198), and a 429 retry adds to the per-IP bucket. Set retry to 0 for this query. | verify/INBOX-12.md round 2, finding 2
