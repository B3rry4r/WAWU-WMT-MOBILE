---
id: ID-LINKS
title: Every link WAWU ID mails has a host, even when a setting is missing
owner: YOU
area: AUTH
order: 387
priority: after-launch
repo: wawu-id
type: backend-endpoint
status: review
depends_on: []
decisions: [R-133]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# ID-LINKS · Every link WAWU ID mails has a host, even when a setting is missing

## Current state

As of 11 Nov 2026.
- **Status:** built on wawu-id `wmt/ID-LINKS` (79dd2b7), awaiting T1 verifier. Was: todo. Cut by the lead from R-133 point 4.
- **The gap** (wawu-id `origin/main` 7e7abf8):
  - the reset link is `${FRONTEND_URL ?? APP_URL ?? ''}/reset-password?token&email` (`src/auth/auth.service.ts` near 1248), so with neither setting it is a link with no host;
  - the "this was not me" link is `SECURITY_URL ?? (FRONTEND_URL ?? APP_URL)/forgot-password` (near 164), the same risk;
  - activation already falls back to `DEFAULT_APP_URL` `https://wawuafrica.com` (`src/provisioning/provisioning.service.ts`).
- **Not known:** which of FRONTEND_URL, APP_URL and SECURITY_URL are set on the live server. The lead has asked the owner for a read-only look. This task does not depend on the answer.
- **Next:** T1 verifier.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md` (mobile repo)
- DECISIONS.md R-133
- wawu-id: `src/auth/auth.service.ts` (reset and secure links), `src/provisioning/provisioning.service.ts` (`DEFAULT_APP_URL`), `src/mail/mail.service.ts` and every mail template that carries a link, the README's settings list

## Goal

Every link in every WAWU ID mail is a full address to a page that exists, whatever the server's settings.

## Scope

- One helper that gives the password pages' host: FRONTEND_URL, then APP_URL, then `https://wawuafrica.com` (the same default activation uses), with trailing slashes trimmed. Reset, "this was not me" and activation all use it. SECURITY_URL still overrides the secure link when set.
- List every link in every mail WAWU ID sends (grep the templates and `mail.service.ts`), with the page it opens, in this file's Builder report. Any other link that can come out with no host gets the same fix.
- Specs: each link is absolute with every setting unset, and an explicit setting still wins. Never send a mail from a test.

## Capability checks

- [ ] With FRONTEND_URL and APP_URL unset, a reset mail's link is `https://wawuafrica.com/reset-password?...`.
- [ ] With FRONTEND_URL set, the link uses it (today's behaviour kept).
- [ ] The Builder report lists every mailed link and the page it opens.

## Builder report

Built on wawu-id `wmt/ID-LINKS` (head 79dd2b7). Additive, no route or schema change.

**What changed**
- New `src/mail/app-url.ts`: `appBaseUrl(config)` = FRONTEND_URL, then APP_URL, then `https://wawuafrica.com`, trailing slashes trimmed, an empty or blank setting counts as unset. `securityUrl(config)` = SECURITY_URL when set, else `<host>/forgot-password`.
- `auth.service.ts`: the reset link and the secure link use them (the reset link used `??` and an empty-string fallback, so it could come out with no host).
- `provisioning.service.ts`: the three activation links (resend, create, `sendActivation`) use `appBaseUrl`; the private `DEFAULT_APP_URL` constant is gone (one default, in the helper).
- Spec `src/mail/app-url.spec.ts` (6 tests): helper with nothing set, blank settings, FRONTEND_URL over APP_URL, slash trimming, SECURITY_URL override; the reset mail's link and the activation mail's link with every setting unset and with explicit settings. Mailer is a stand-in; nothing is sent.

**Every link WAWU ID mails, and the page it opens**

| Mail (method) | Link | Page | Host |
|---|---|---|---|
| Password reset (`sendPasswordReset`) | `/reset-password?token&email` | reset-password | helper (fixed) |
| Sign-in alert (`sendLoginAlert`) | SECURITY_URL, else `/forgot-password` | forgot-password | helper (fixed) |
| Password changed (`sendPasswordChanged`) | SECURITY_URL, else `/forgot-password` | forgot-password | helper (fixed) |
| Activation / set password (`sendPasswordCreation`, `sendActivation`) | `/activate?token&email` | activate | helper (3 call sites) |
| Data export (`sendDataExportLink`) | Hub download link | `/api/hub/settings/privacy/export/download?token` | already absolute: `parseDataExportLink` demands https (or localhost outside production) and rebuilds the link |
| Ditto invite (`sendDittoDistributionInvite`) | `signupUrl` from the Hub | Ditto Music signup | already absolute: DTO `@IsUrl` require_protocol, https only |
| Unpaid deletion warning (`sendUnpaidDeletionWarning`) | `planUrl` from the Hub | plan page | already absolute: DTO `@IsUrl` require_protocol, https only |
| Email verification (`sendEmailVerification`) | `verifyUrl` | n/a | no caller in the code; link would be whatever a caller passes |
| Profile incomplete (`sendProfileIncomplete`) | `completeUrl` | n/a | no caller in the code |
| Mail header image (all mails) | `EMAIL_HEADER_URL` or `https://id.wawuafrica.com/assets/email-header.png` | image, not a page | already absolute |
| Hub campaign relay, notices, PIN reset code, money-check report | no links built here (body comes from the Hub or has none) | n/a | n/a |

**Capability checks**
- [x] Reset link with FRONTEND_URL and APP_URL unset is `https://wawuafrica.com/reset-password?...` (spec).
- [x] With FRONTEND_URL set, the link uses it (spec); APP_URL alone also works.
- [x] This table.

**Commands (wawu-id worktree)**
- `npx tsc --noEmit`: exit 0
- `npx jest src/auth src/mail src/provisioning`: exit 0 (44 suites, 828 passed, 41 skipped)
- `npx eslint` on the 4 changed files: exit 1, 5 prettier errors, all on lines this task did not touch in `provisioning.service.ts` (153, 245, 317, 330, 334); not fixed, to avoid unrelated churn. The new files are clean.

**NOT RUN**: full `npm test` (only affected suites), e2e/local scripts, a real mail send, any live server check of which settings are set (owner read-only look pending).

## Verifier report
