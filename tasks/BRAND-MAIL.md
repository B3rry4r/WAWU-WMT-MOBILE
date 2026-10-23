---
id: BRAND-MAIL
title: Emails say Who Made This? (WAWU ID's mail and the Hub's campaign sender)
owner: YOU
area: OPS
order: -113
priority: launch
repo: all
type: ops
status: review
depends_on: []
decisions: [R-37, R-69, R-72, R-76]
passes: [V1, V3]
artboards: []
---
# BRAND-MAIL · Emails say Who Made This?

## Current state

As of 23 Oct 2026, review: the verifier's FIX (one medium) and four lows are built in a fix round (Sonnet builder, T1). No PR.
- **Branches:** WAWU ID `wmt/BRAND-MAIL` `603f09b` (on `0a23dce`); backend `wmt/BRAND-MAIL` `07a0ba7` (on `ffe53ab`); mobile `wmt/BRAND-MAIL` (this file and the records, on the verifier's `3a4de4d4`). Bases: WAWU ID `cdfa442`, backend `13e2753`, mobile `b1a460f3`.
- **Fix round (5 items):** (1) medium, WAWU ID `test/phone-signup.local.mjs:448`: the pattern is `/subject="(?!Your Who Made This\? verification)/` again, so "still gets its login alert" excludes the sign-up code mail; a `node -e` of the regex gives false for the line `subject="Your Who Made This? verification code"` and true for `subject="Was This You?"`. The local script was not run against a server. (2) low, backend `email-render.ts:187`: the campaign logo alt is "Who Made This?". (3) low, WAWU ID `mail.service.ts:374`: the stale comment says Who Made This?. (4) lead ruling, backend `legal-assistant-prompt.ts:66`: "You are the Who Made This? Legal assistant." (it was "the WAWU Legal assistant in the Who Made This app"), the same as the chat line; no spec pins either text, so no spec changed. (5) records: four em-dashes, not five (below); two new rows.
- **Passed in the first round (verifier):** only names changed (no address, domain, link, template variable or setting moved); all 13 WAWU ID emails and the Hub's campaign email say "Who Made This?"; both sender values give a valid From with the same address; `mail-brand.spec.ts` fails 2 of 3 on the old `mail.service.ts`; protected routes 253/253; gates 0 fail.
- **Em-dashes removed (4, all in `mail.service.ts`):** Ditto invite once ("price - the discount" is now "price. The discount"); Set your password three times ("something new:", "trust us,", "under a minute. Just tap").
- **Checks after the fix round:** WAWU ID `tsc --noEmit` EXIT 0; eslint (no --fix) on `mail.service.ts` EXIT 0; 4 mail suites (`mail-brand`, `mail.service`, `data-export-email`, `pin-reset-code-email`) 75 tests EXIT 0. Backend `tsc --noEmit` EXIT 0; eslint on the 2 changed files EXIT 0; `email-parts`, `email-campaign.contract`, `legal-assistant-prompt` in band 3 suites, 43 tests EXIT 0; gates EXIT 0 (0 fail). Mobile `check_tasks --write` EXIT 0 (397 tasks); gates EXIT 0 (10 run, 0 fail); `check_baseline.py` EXIT 0.
- **For the lead at release:** the campaign relay always sends from WAWU ID's `MAIL_FROM`; the live setting to change is WAWU ID's `MAIL_FROM` (the Hub's `EMAIL_CAMPAIGN_FROM` only applies to a Hub with its own `RESEND_API_KEY`). NOT RUN: a real send.
- **Next:** the verifier re-checks the regex line and the four small edits, then the lead merges the three branches together.

## Read first

- `DECISIONS.md` R-37, R-69, R-72, R-76
- `docs/WORKFLOW.md`, section 4; `docs/roles/BUILDER.md`
- `tasks/SWEEP-VOICE.md` (the form of this file)

## Goal

Every email a person receives names the product "Who Made This?" (with the question mark, R-69), never "WAWUAfrica" or "WAWU Africa" (R-76).

## Scope

WAWU ID's mail (`src/mail/mail.service.ts`: the shared layout and every template, the sign-up code, the wallet PIN reset code, the data export, the account closing warning, the welcome, password and login mails) and the Hub's campaign sender and legal assistant name. Only the product name as a person reads it. Not touched: addresses, domains, links, the header image file, any route, schema or protected route.

## Capability checks

- [x] No email template, subject, preheader, heading or text line says "WAWUAfrica" or "WAWU Africa" as the product (`mail-brand.spec.ts` sends each template to a local stand-in and checks, apart from the CEO signature below).
- [x] The sender is `Who Made This? <noreply@wawuafrica.com>` by default; the address and every link are unchanged (`mail-brand.spec.ts`, `email-parts.spec.ts`).
- [x] No em-dash in any email text a person reads (the four that were in `mail.service.ts`, one in the Ditto invite and three in Set your password, are now a colon, a comma or a full stop).

## Rows

| Repo | Email | Part | Before | After |
|---|---|---|---|---|
| WAWU ID | Sign-up code, wallet PIN reset code (R-72), phone change, any one-time code | subject | Your WAWUAfrica verification code | Your Who Made This? verification code |
| WAWU ID | the same | preheader | Your WAWUAfrica verification code (expires in N minutes). | Your Who Made This? verification code (expires in N minutes). |
| WAWU ID | Data export | subject | Your WAWUAfrica data is ready to download | Your Who Made This? data is ready to download |
| WAWU ID | Data export | text | Your copy of your WAWUAfrica data is ready to download. | Your copy of your Who Made This? data is ready to download. |
| WAWU ID | Account closing warning | subject | Your WAWUAfrica account closes in N hours | Your Who Made This? account closes in N hours |
| WAWU ID | Account closing warning | text | Your WAWUAfrica creator account has not been activated with a plan... | Your Who Made This? creator account has not been activated with a plan... |
| WAWU ID | Welcome | subject, preheader, text | You are In. Welcome to WAWUAfrica / You are now part of the WAWUAfrica community. / Welcome to WAWUAfrica. We are so glad... | You are In. Welcome to Who Made This? / You are now part of the Who Made This? community. / Welcome to Who Made This? We are so glad... |
| WAWU ID | Set your password (Africa is talking...) | preheader, text | ...the new WAWUAfrica Community / For years, WAWUAfrica has been a place... / something new - a place / trust us - the comments / a minute - just tap | ...the new Who Made This? Community / For years, Who Made This? has been a place... / something new: a place / trust us, the comments / a minute. Just tap (3 em-dashes gone) |
| WAWU ID | Password reset, login alert, account approved, Ditto invite | preheader or text | Reset your WAWUAfrica password. / ...on your WAWUAfrica account. / Your WAWUAfrica account has been approved. / Your WAWUAfrica plan... settings on WAWUAfrica too / Ditto's price - the discount | Reset your Who Made This? password. / ...on your Who Made This? account. / Your Who Made This? account has been approved. / Your Who Made This? plan... settings on Who Made This? too / Ditto's price. The discount (1 em-dash gone) |
| WAWU ID | Every email (shared layout) | page title, header image alt, footer | WAWUAfrica / WAWU / The WAWUAfrica Team / (c) year WAWUAfrica. All rights reserved. | Who Made This? / Who Made This? / The Who Made This? Team / (c) year Who Made This? All rights reserved. |
| WAWU ID | Every email | sender (default and `.env.example` MAIL_FROM) | WAWUAfrica <noreply@wawuafrica.com> | Who Made This? <noreply@wawuafrica.com> |
| Backend | Email campaigns | sender (default and `.env.example` EMAIL_CAMPAIGN_FROM) | WAWUAfrica <noreply@wawuafrica.com> | Who Made This? <noreply@wawuafrica.com> |
| Backend | Legal assistant chat (after payment) | how it names itself to a client | You are the WAWUAfrica Legal assistant. | You are the Who Made This? Legal assistant. |
| Backend | Legal assistant intake (before payment) | how it names itself to a client | You are the WAWU Legal assistant in the Who Made This app. | You are the Who Made This? Legal assistant. (fix round, lead ruling) |
| Backend | Email campaigns | logo alt text | Who Made This | Who Made This? (fix round) |

## Left as they are

- **Welcome mail signature "CEO, WAWUAfrica"** (`mail.service.ts`): it names the company the CEO leads, not the product. The lead rules it (a one-word edit; `mail-brand.spec.ts` names it as the one exception).
- **"WAWU" alone** (not WAWUAfrica or WAWU Africa): "signed up on a WAWU platform" in the campaign footer (`email-render.ts`), "Unsubscribe ... from WAWU emails?" (`email-unsubscribe.controller.ts`), the bank narrations ("WAWU transfer", "WAWU earning"), "WAWU's fee" on a receipt, and the money check report to the owner. R-76 names WAWUAfrica and WAWU Africa only; the lead decides whether these follow.
- **A text message** "Your WAWU code is ..." (`phone-signup.service.ts`): a text, not an email, and not sent at launch (R-72). The Fintava text provider's own spec is untouched.
- **Comments and internal text:** code comments, the admin guard's `WAWUAfrica-Dashboard` (a repo name), `wawuafricaAppUserId` and `WAWUAFRICA_API_URL` (field and setting names), the lawyers' brief instruction "lawyers at WAWUAfrica, a Nigerian legal service" (the company, read by no person), `prisma/seed.ts` sample copy and the old catalogue migrations (never edited), and test fixtures that use "WAWU Africa" as an employer.
- **The header image** (`email-header.png`, served from `wawuafrica.com`): a picture, not copy. Replacing it is the owner's artwork and a deploy; its alt text now says Who Made This?.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/BRAND-MAIL.md](history/BRAND-MAIL.md).

## Owner sign-off

_Owner: date, and "go" or what blocks it._
