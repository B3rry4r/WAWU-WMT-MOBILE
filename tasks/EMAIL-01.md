---
id: EMAIL-01
title: WAWU ID sends the notice emails the Hub asks for, once each, and the account emails are reworded (POST /internal/mail/notice, facts box, plain text)
owner: YOU
area: AUTH
order: -2704
priority: launch
repo: wawu-id
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-5, R-10, R-11, R-17, R-53, R-54, R-69, R-72, R-76, R-101]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# EMAIL-01 · The notice emails, and the account emails reworded

## Current state

As of 29 Oct 2026, built by a Sonnet builder (T2): WAWU ID `wmt/EMAIL-01` `a67af26` (three commits: the route `a5063de`, the account mails `0af8a08`, round 1 `a67af26`) on `origin/main` `a9180a5`. Records: mobile `wmt/EMAIL-01`. Status verifying (round 1 answers the verifier's FIX, items 1 to 4 below). The contract the Hub builds to (EMAIL-02) is the lead's `emails-contract.md` of 29 Oct 2026; nothing was changed in it.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | WAWU ID could relay a finished mail (`POST /internal/mail/send`) and nothing else; the Hub wrote its own notices | `POST /internal/mail/notice` `{ wawuId, kind, data, idempotencyKey }`, same `X-Service-Key` guard. WAWU ID finds the proven address, writes the mail and sends it once per key |
| 2 | no table remembered a send | `mail_notices` (migration `20261029120000`, `rollback.sql` refuses while any row is under 7 days old). The insert is the claim: two calls with one key send once; a failed send gives the key back; a claim over 2 minutes old is taken over; the provider also gets the key |
| 3 | every mail went as html only, with no facts box | every mail also goes as plain text (made from the same html); a facts box of label and value rows draws money and dates |
| 4 | no password-changed mail | after a change in the app and after a reset (link or code), to the person's own proven address |
| 5 | the welcome went on the web's email proof only | also at the end of the app's sign-up (`SignupSequenceService.complete`, the step that sets `completedAt`), once, only to a proven email |
| 6 | sign-in alert "Was This You?" | "New sign-in to your account", on every sign-in, with the time in Lagos time and no device or place |
| 7 | "Good News. You are Officially Part Of The Ecosystem" (account approved) | "You're verified" (the method keeps its name) |
| 8 | (round 1) no mail for a community pass sold or a paid message answered | kinds `pass_sold` { communityName, buyerName|null, earnedMinor, currency, paidWhen } and `question_earned` { fromName|null, earnedMinor, currency, paidWhen }; the earning is told the way a sale is |
| 9 | (round 1) a failed bank send said "We returned" | "Your ₦X is on its way back to your wallet." (the Hub marks the send failed before the reversal lands); the fact row reads "Coming back to your wallet" |
| 10 | (round 1) the sign-in alert went on a password sign-in only | also on a phone-code sign-in (`otpVerify`) and on the session a reset by code starts, once per sign-in, one helper for all three; a reset by link starts no session and sends none |
| 11 | (round 1) the header picture read "WAWUAfrica" (the web's image) | WAWU ID's own 1200 x 300 picture, the app's submark and "Who Made This?", served at `GET /assets/email-header.png` (public, cached a day) and used by the layout; `EMAIL_HEADER_URL` still overrides; copied into the build by `nest-cli.json` `assets`; the web's old image is untouched |

### The route

Answers: `200 { sent: true }`, `200 { sent: false, replayed: true }`, `200 { sent: false, reason: "no_email" }`, `400` (unknown kind, or data that does not fit its kind: the message names `data.<field>`), `401` no key, `409` `IDEMPOTENCY_KEY_REUSED`, `502` the provider refused, `503` try again. Kinds (16): pin_changed, account_deletion_started, account_deleted, money_in, bank_send_completed, bank_send_failed, sale_made, tip_received, pass_sold, question_earned, paid_message_received, refund_processed, purchase_receipt, ticket_confirmed, event_cancelled, bill_paid. Amounts are minor units with a currency code (`₦5,000.00`, `$12.50`, `GHS 10.00`); times show in Lagos time. No mail has a button: the notice data carries no address of an app screen. The words state no figure the Hub did not send; an earning says "paid into your wallet automatically", "in 3 working days" or "kept safe until you open your wallet" (R-11, R-55, R-101).

### Defaults (lead), owner may override

(a) A `wawuId` with no account answers `no_email` (not 404): there is nobody to mail, and the Hub must not retry. (b) `no_email` claims nothing, so the same key sends once the address is proven. (c) An address the provider calls invalid answers `no_email` and gives the key back. (d) The two deletion mails go to an account in its 30 days (its address is still on file); every other notice skips one. (e) The password-changed mail also reaches an account in its 30 days, because the person changed the password themselves. (f) A bank send shows "Total from your wallet" only when there is a fee, and never a "No fee" line (designer brief, rules 3 and 4); a bill shows "ending 3645", not the whole meter or phone number. (g) A free ticket (R-8) reads "Paid: Free".

### For the verifier and the Hub builder

- `account_deleted` can only reach a person BEFORE the Hub calls `DELETE /internal/users/:id?mode=anonymize` (that call clears the address). The Hub sends it first, or it answers `no_email`.
- The route is not counted by `MAIL_RELAY_DAILY_CAP` (that guards `/internal/mail/send`). No new setting.
- NOT RUN: a real send through Resend (the provider is a local stand-in in every spec; the sample mails are in `emails-out/`), the Hub caller (EMAIL-02), and the header's live address: the default `https://id.wawuafrica.com/assets/email-header.png` needs the host to send `/assets/` to WAWU ID (`deploy/ENV.md`); check it after the deploy.
- Round 1 changed one assertion in a spec it did not write: `mail-brand.spec.ts` pinned the old header address `https://wawuafrica.com/email-header.png`; it now names the new one (the lead's ruling of 29 Oct).
- Open lows, for `tasks/SWEEP-APP.md`: (i) the guide's other emails (verification, uploads, points, referral, nudges) have no event in the system and are not built; (ii) the old mails (code, reset, verification, Ditto, unpaid warning, data export, money check) keep their words and gain only the plain-text part; (iii) `CEO, WAWUAfrica` stays in the welcome sign-off by the owner's ruling of 29 Oct.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- WAWU ID `src/mail/` (`mail.service.ts`, `mail-notice.service.ts`, `notice/`), `src/auth/signup-sequence.service.ts`

## Goal

The Hub names a person and what happened; WAWU ID writes the email in the app's name, "Who Made This?", and sends it once. The account emails say what is true and no more.

## Scope

`wawu-id` only: `src/mail/`, `src/auth/` (the password-changed and welcome calls), `prisma/` (one table), and their specs. Mobile: this file, `docs/LOG.md`, `tasks/INDEX.md`.

## Capability checks

- [x] The Hub can ask for any of the 16 notices and the person gets one mail with the headline, the facts and a plain-text part (`notice.spec.ts`, `mail-layout.spec.ts`, `mail-notice.spec.ts`: every kind, against a stand-in provider and a real Postgres).
- [x] A repeat of the same key, and eight calls at once with one key, send once (`mail-notice.spec.ts`).
- [x] A person with no proven email, a mobile sign-up whose email was never proven, an account in its 30 days and an unknown id get `no_email` and nothing is sent.
- [x] A password change or reset sends "Your password was changed"; the end of the app's sign-up sends the welcome once (`account-mails.spec.ts`).
- [x] No mail says "by WAWU" or holds an em-dash, in the html or the text.
- [x] A phone-code sign-in and a reset by code each send one sign-in alert; the header picture is 1200 x 300, served with no key, and the layout points at it (`account-mails.spec.ts`, `email-header.spec.ts`).
- [ ] A real mail through Resend: NOT RUN.
