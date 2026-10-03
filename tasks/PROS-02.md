---
id: PROS-02
title: Professionals backend: the design's fields, city, reply time and price
owner: DEV3
area: PROS
order: 8
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# PROS-02 · Professionals backend: the design's fields, city, reply time and price

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

P1-P10 and H10 use field names and card details the backend doesn't have.

## Scope

Map the canvas's fields to the professional categories; city, usual reply time and message price on the professional response.

## Capability checks

- [ ] Filtering by a field on P1 returns professionals in that field.
- [ ] A card's 'usually replies in' comes from real reply times.

## Builder report

Builder, 3 Oct 2026. Backend branch `wmt/PROS-02` (`03cd1c8`, main `a055b4f` merged in `7ebdd2a`, contract regenerated `52c8716`).

- **Files (wawu-backend):** new `src/professional/professional-fields.ts` (the 7 canvas fields mapped to categories), `professional-reply-time.ts` (PROVISIONAL(PRO-REPLY-SAMPLE): median of the last 20 answered paid messages, none below 3), `dto/professional-directory.dto.ts`, `dto/update-professional-location.dto.ts`, `tests/professional-directory.contract.spec.ts` (19 tests); changed `professional.service.ts` (the web's `list` now reads through a shared `pageOf`, same answer), `professional.controller.ts`, `professional-categories.ts` (`engineering` added, not regulated), `account-purge/account-data-map.ts`; migration `20261003181500_professional_location` (new table `ProfessionalLocation`); `contract/openapi.json` regenerated.
- **Routes (new; GET /professionals and /professionals/:id unchanged):** `GET /professionals/fields`; `GET /professionals/directory?field=` and `/directory/{id}` (each listing with `field`, `city`, `usualReplyMinutes`, `answeredMessageCount`, `messagePriceKobo`; no `dmPrice`); `GET`, `PUT`, `DELETE /professionals/location` (creator only).
- **Field mapping (Default (agent), owner may override):** Accounting & Tax = finance; Legal & Compliance = legal_services; Design & Creative = entertainment_creative; Technology & IT = technology; Engineering = engineering (new category, no category stood for it); Healthcare = healthcare; Business & Consulting = professional_services (applications filed here) + business_entrepreneurship. Other categories have `field: null` and appear under All.
- **Check 1, filtering by field:** spec `a user filtering by a field gets the professionals in that field, and only them` (plus Engineering apply then list, empty field, refusals of `finance`, `ACCOUNTING_TAX`, unknown keys); live seam step 7/8 below. Passed.
- **Check 2, usual reply time from real replies:** spec tests median 60/180/240 min = 180, unanswered and refunded not counted, under 3 answered = null, only the latest 20, sub-minute = 1; live seam: three paid messages answered through the real `POST /dm/:id/respond`, directory and profile then read `usualReplyMinutes: 181`, `answeredMessageCount: 3`. Passed.
- **Live seam (V9 by the builder, mock WAWU ID :4121, Hub :4120 from `dist`):** `/tmp` script: login, `PATCH /creator/dm-settings`, apply in finance, admin approve, `PUT /professionals/location` " Ikeja " saved "Ikeja", directory shows Zainab Bello, Accounting & Tax, Ikeja, 181, 3, 500000 kobo; Technology & IT empty; the web's two routes return their old key sets; buyer city 403; `field=finance` 400. The DM rows were inserted as a confirmed payment writes them (a Flutterwave charge cannot run here).
- **Gates (backend):** before (main `48b9043`) 16 fail / 12 warn / 76 accepted, lint 3638 errors / 850 warnings; after (branch on `a055b4f`) 16 fail / 14 warn / 76 accepted against main `a055b4f` 16 / 13 / 76: the one new warn is PRO-REPLY-SAMPLE. Lint after 3601 / 850 (main `a055b4f` 3638 / 850). `tsc` 0. The 16 fails are main's own.
- **V3 (builder's run):** `scripts/protected-routes/run.sh --fresh` before (main `48b9043`) and after (`wmt/PROS-02` `52c8716`, lock `a055b4f`): 253/253, all 244 required, both.
- **Contract suite:** professional, admin professional review and account purge specs 46/46. The full suite's 7 suites that log in on a hard-coded :4001 (kyc-submission, notification, blocked-account, privacy-settings, saved-item, credits-state, account) fail with 401 here because another session's mock owns :4001; they fail the same on main (52 of 140 on `ad1e515`). Unblocked by running the suite where :4001 is this checkout's own mock.
- **Mobile:** `npm run check` before and after (main `68c68ba` merged): exit 0, 377 tests, gates 0 fail / 0 warn / 0 accepted, 98 files. No app code changed; the app's types come with `npm run api` once the backend merges (PROS-01, PROS-03 run it).
- **Filed:** SHARED-CHANGES `PROS-02 #1` (schema, migration, contract); BACKEND_GAPS G-53 (no screen writes a professional's city; M8 Location is the same fact, ME-05/ME-06), G-54 (the web has no label for `engineering`), G-55 (reply time reads `DirectMessage`; the wallet paid-message path must keep it, INBOX-10/MONEY-18).
- **NOT RUN:** V9 through the real wawu-id login (mock WAWU ID used); a paid message through a real payment (Flutterwave/Fintava keys absent: rows written as the confirm writes them). Unblocked by a local stack with `scripts/local/up.sh` and sandbox keys.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
