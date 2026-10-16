# INBOX-12 · round history

Moved out of [tasks/INBOX-12.md](../INBOX-12.md) word for word, oldest first. The current state is in that file.

## Builder report

Builder (Sonnet), 16 Oct 2026. Backend `wmt/INBOX-12` `15ee7e9` (from main `56f94d0`), mobile `wmt/INBOX-12` (from `2f0ca33`, merged main since). Migration: none.
- **Backend files:** `src/direct-message/{paid-dm-settings.config,paid-dm-settings.service}.ts`, `dto/paid-dm-settings.dto.ts`, `paid-dm-view.type.ts`, `paid-dm.controller.ts`, `direct-message.module.ts`, `tests/paid-dm-settings.contract.spec.ts`, `contract/openapi.json` (+156 lines, none removed).
- **Mobile files:** `src/features/paid-messages/*` (+3 test files), `src/app/paid-message-settings.tsx`; entries in `InboxScreen`, `ServicesTab`, `MeScreen`, `ListingsScreen` and the three routes; contract and generated types (+105 lines, additions only).
- **I21 toggle, price (preset or typed), reply time, Save:** screen tests press each and read the PUT body in kobo; in a real browser against the Hub the saved row read back `true|2000|48`.
- **I22 Raise:** test and picture: Raise fills the field, Save sends 250000; the button and its sentence go when the Hub has no higher price.
- **I23:** switch, field, presets, reply times and Save are locked from the Hub's standing; a save refused with `paid_messages_paused` locks an open screen.
- **Figures:** nothing literal. Presets, reply times, bounds, share, lines, counts and dates come from the Hub; "You earn" follows a typed price from the Hub's share with the Hub's rounding down (the Hub also sends it for the saved price). Gaps: G-722, G-723, G-724.
- **Checks:** see Current state. Gate counts: backend gates 16 FAIL before and after (+1 warn); mobile `npm run gates` in the final check log.
- **Not done:** the web's `PATCH` still allows a paused creator to switch on (G-723). No picture of the P8 link (it needs an approved professional listing); it is tested by pressing it.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Hub entries this task adds (R-41)

The ME-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.


## Builder report, round 2

Builder (Sonnet), 16 Oct 2026. Backend `wmt/INBOX-12` `8f9688a` (main `18ac5f9` merged in), mobile `wmt/INBOX-12` (main already in). Migration: none. The lead's rulings, one by one:
- **1 (medium) null on the save:** before, `PUT {"enabled":true,"priceKobo":null}` gave 200 and price 0, and `responseHours: null` gave 200; after, both give 400 and the row is unchanged. `@IsOptional()` was replaced by `@ValidateIf` on "sent at all", so absent keeps the saved value and null is refused for `priceKobo` and `responseHours` (`enabled` already refused it). Specs (two new, in `paid-dm-settings.contract.spec.ts`): null for each field gives 400 with the row unchanged, a creator on 150000 kobo who sends null keeps 150000, a creator with no row gets no row, absent fields keep their values. Both failed on the old code (log `inbox-12-b2/logs/spec-old.log`: 2 failed, "expected 400, got 200") and pass now (29 of 29).
- **2 (R-21) earn from the Hub:** new `GET /paid-dm/settings/earn?priceKobo=` returns `{ priceKobo, creatorSharePct, earnPerMessageKobo }` with the share and rounding of the saved settings (one private function serves both) and the same validation as the PUT price (integer, 5000 to the maximum, whole naira, no extra query field). Six specs: 401 and 403, figures, equal to the saved settings' figure, 12 bad queries all 400 with the row unchanged, no row created, still answers while paused. App: `earnKobo` is deleted from `model.ts`; the screen shows the saved price's figure from the settings read, asks the route for a typed one after 350 ms of rest (one call per pause, never for an older or invalid price), and shows a dash until the Hub has answered for the typed price (no estimate, no stale figure); the preset label uses `formatMoney`. Six screen tests added or reworked with Hub figures that differ from any local sum (a share of 85 would give 2,000 to 1,700; the test answers 1,990). Declared in the contract (+59 lines each side) and in SHARED-CHANGES INBOX-12 #3; no spec lists routes or rate limits by path, so no inventory needed a row.
- **3 (low) stray file:** `contract/openapi.json.orig` deleted.
- **4 (low) sweep only:** added to `tasks/SWEEP-INBOX.md` (INBOX-12, finding 4) with the report path. No code change.
- **Checks:** backend `tsc --noEmit` EXIT 0, eslint on the five touched files EXIT 0, the settings spec 29 passed, `npm run contract:build` twice equal (59 lines added, none removed); GitHub on `8f9688a`: three suites, netns, deploy-test, contract, baseline and protected routes green, Executable gates red with the same 18 FAIL lines as main `18ac5f9` (none in `paid-dm*`). Mobile full check `(typecheck && lint && test --maxWorkers=2 && gates && tasks)` EXIT 0: 158 suites, 2874 tests, gates 0 fail 5 warn (none INBOX-12).
- **Pictures:** I21 at 390 px, light and dark, from the web export through the stack with the real WAWU ID: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/inbox-12-b2/shots/i21-{light,dark}-{saved,typed}.png`. Saved price: "You earn" ₦1,275 with no earn call. Typed ₦2,000: no figure right after typing, then ₦1,700 from the Hub after exactly one `GET /settings/earn?priceKobo=200000`.
- **Not done:** the reply-time-off-the-list display (finding 4) waits for the sweep and a ruling; G-723 and G-722 are as in round 1.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-12.md](history/INBOX-12.md).

