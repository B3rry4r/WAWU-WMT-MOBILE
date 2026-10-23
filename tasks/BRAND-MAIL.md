---
id: BRAND-MAIL
title: Emails say Who Made This? (WAWU ID's mail and the Hub's campaign sender)
owner: YOU
area: OPS
order: -113
priority: launch
repo: all
type: ops
status: verifying
depends_on: []
decisions: [R-37, R-69, R-72, R-76]
passes: [V1, V3]
artboards: []
---
# BRAND-MAIL · Emails say Who Made This?

## Current state

As of 23 Oct 2026, verifying: built by a Sonnet builder (T1, copy only). No PR.
- **Branches:** WAWU ID `wmt/BRAND-MAIL` `0a23dce` on `origin/main` `cdfa442`; backend `wmt/BRAND-MAIL` `ffe53ab` on `origin/main` `13e2753`; mobile `wmt/BRAND-MAIL` (this file, DECISIONS R-76, the records) on `origin/main` `b1a460f3`.
- **Rows:** 12 below, each with its before and after. Only the product name changed: no address, domain or link moved (the sender stays `noreply@wawuafrica.com`, the header image and the links stay on `wawuafrica.com`).
- **Specs updated to the new words (the ruling):** WAWU ID `src/auth/data-export-email.spec.ts` (1 subject), `src/auth/pin-reset-code-email.spec.ts` (2 subjects), `test/phone-signup.local.mjs` (1 subject pattern); backend `src/admin/notifications/email/tests/email-parts.spec.ts` and `email-campaign.contract.spec.ts` (the default sender). New: WAWU ID `src/mail/mail-brand.spec.ts` (3 cases; fails 2 of 3 on the old `mail.service.ts`).
- **Left, with the reason:** see "Left as they are" below.
- **Live value:** WAWU ID's `MAIL_FROM` and the Hub's `EMAIL_CAMPAIGN_FROM` on the servers are settings the lead changes with the owner; the code defaults and `.env.example` now say `Who Made This? <noreply@wawuafrica.com>`.
- **Next:** the lead merges the three branches together; a verifier reads the diff and runs the mail specs.

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
- [x] No em-dash in any email text a person reads (the five that were in `mail.service.ts` are now a colon, a comma or a full stop).

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
| WAWU ID | Set your password (Africa is talking...) | preheader, text | ...the new WAWUAfrica Community / For years, WAWUAfrica has been a place... | ...the new Who Made This? Community / For years, Who Made This? has been a place... |
| WAWU ID | Password reset, login alert, account approved, Ditto invite | preheader or text | Reset your WAWUAfrica password. / ...on your WAWUAfrica account. / Your WAWUAfrica account has been approved. / Your WAWUAfrica plan... settings on WAWUAfrica too | Reset your Who Made This? password. / ...on your Who Made This? account. / Your Who Made This? account has been approved. / Your Who Made This? plan... settings on Who Made This? too |
| WAWU ID | Every email (shared layout) | page title, header image alt, footer | WAWUAfrica / WAWU / The WAWUAfrica Team / (c) year WAWUAfrica. All rights reserved. | Who Made This? / Who Made This? / The Who Made This? Team / (c) year Who Made This? All rights reserved. |
| WAWU ID | Every email | sender (default and `.env.example` MAIL_FROM) | WAWUAfrica <noreply@wawuafrica.com> | Who Made This? <noreply@wawuafrica.com> |
| Backend | Email campaigns | sender (default and `.env.example` EMAIL_CAMPAIGN_FROM) | WAWUAfrica <noreply@wawuafrica.com> | Who Made This? <noreply@wawuafrica.com> |
| Backend | Legal assistant chat | how it names itself to a client | You are the WAWUAfrica Legal assistant. | You are the Who Made This? Legal assistant. |

## Left as they are

- **Welcome mail signature "CEO, WAWUAfrica"** (`mail.service.ts`): it names the company the CEO leads, not the product. The lead rules it (a one-word edit; `mail-brand.spec.ts` names it as the one exception).
- **"WAWU" alone** (not WAWUAfrica or WAWU Africa): "signed up on a WAWU platform" in the campaign footer (`email-render.ts`), "Unsubscribe ... from WAWU emails?" (`email-unsubscribe.controller.ts`), the bank narrations ("WAWU transfer", "WAWU earning"), "WAWU's fee" on a receipt, and the money check report to the owner. R-76 names WAWUAfrica and WAWU Africa only; the lead decides whether these follow.
- **A text message** "Your WAWU code is ..." (`phone-signup.service.ts`): a text, not an email, and not sent at launch (R-72). The Fintava text provider's own spec is untouched.
- **Comments and internal text:** code comments, the admin guard's `WAWUAfrica-Dashboard` (a repo name), `wawuafricaAppUserId` and `WAWUAFRICA_API_URL` (field and setting names), the lawyers' brief instruction "lawyers at WAWUAfrica, a Nigerian legal service" (the company, read by no person), `prisma/seed.ts` sample copy and the old catalogue migrations (never edited), and test fixtures that use "WAWU Africa" as an employer.
- **The header image** (`email-header.png`, served from `wawuafrica.com`): a picture, not copy. Replacing it is the owner's artwork and a deploy; its alt text now says Who Made This?.

## Builder report

- **WAWU ID:** `src/mail/mail.service.ts`, `src/mail/mail-brand.spec.ts` (new), `src/auth/data-export-email.spec.ts`, `src/auth/pin-reset-code-email.spec.ts`, `test/phone-signup.local.mjs`, `.env.example`.
- **Backend:** `src/admin/notifications/email/email-config.ts`, `src/legal-intake/legal-chat.service.ts`, two email specs, `.env.example`. No schema, migration, route or protected route changed.
- **Mobile:** this file, `DECISIONS.md` (R-76), `tasks/INDEX.md` and `docs/PROGRESS.md` (check_tasks --write), `docs/LOG.md`.
- **Test setup:** database `brandmail_hub_test` (migrated and seeded, dropped at the end); no server was started and no port used; the mail specs run against a local stand-in for Resend on a random local port.

## Verifier report

_Not yet verified._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
