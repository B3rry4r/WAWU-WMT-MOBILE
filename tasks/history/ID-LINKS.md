# ID-LINKS · round history

Moved out of [tasks/ID-LINKS.md](../ID-LINKS.md) word for word, oldest first. The current state is in that file.

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

Verifier round 1, 11 Nov 2026, wawu-id `wmt/ID-LINKS` 79dd2b7 against `origin/main` 7e7abf8. **Verdict: MERGE** (no finding medium or worse; the lows go to the AUTH sweep).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 diff vs report | passed | 4 files (`auth.service.ts`, `provisioning.service.ts`, `mail/app-url.ts`, `mail/app-url.spec.ts`), matches the report; no schema, route or gate change |
| V2 every link | passed | grep of `mail.service.ts`, `src/mail/`, every `mail.send*` caller in `src/` (table below) |
| V3 old behaviour kept | passed | explicit FRONTEND_URL, APP_URL, SECURITY_URL read in the same order as main (see below) |
| V4 specs bite | passed | `app-url.spec.ts` run against main's code: 2 of 6 fail (reset link unset, reset link with a trailing slash); the other 4 pass |
| V9 live seam | NOT RUN | no server, no real mail, by rule |

**Every link, re-derived (not from the builder's list)**
- Reset (`auth.service.ts:1242`, `sendPasswordReset`): `appBaseUrl`. Host always present.
- Sign-in alert and password changed (`auth.service.ts:164-166`, `secureUrl()` feeding lines 188 and 212): `securityUrl`. Host always present unless SECURITY_URL itself is set to a hostless value (explicit setting, as on main).
- Activation: `provisioning.service.ts` 279 (resend), 312 (create), 380 (`sendActivation`): `appBaseUrl`. The only other `FRONTEND_URL|APP_URL|SECURITY_URL` readers in `src/` are `app-url.ts` and comments; `DEFAULT_APP_URL` is now one constant.
- Data export, Ditto invite, unpaid warning: absolute by validation (`data-export-link.ts` demands https, or http on localhost outside production; the two DTOs use `@IsUrl` with a required protocol). Not touched, correct.
- `sendEmailVerification` and `sendProfileIncomplete`: no caller in `src/` (grep). Relayed and notice mails (`mail-relay.service.ts:54`, `mail-notice.service.ts:96`) carry Hub-written bodies and build no link here.
- Header image: absolute default. No other link anywhere. Answer to "can any link still come out with no host": no, apart from a Hub-supplied or SECURITY_URL value that is itself hostless.

**Behaviour against main**
- Same order everywhere: FRONTEND_URL, then APP_URL, then the default; SECURITY_URL beats the forgot-password page. Explicit settings give the same links as main.
- Differences, all in cases that were broken or odd on main (low, accepted): (a) reset and secure links now trim a trailing slash (main emitted `https://host//reset-password`); (b) a blank FRONTEND_URL or SECURITY_URL now falls through (main's reset and secure links used `??`, so a blank value gave a hostless link; provisioning already used `||`); (c) values are `trim()`med.

**Commands**
- `npx tsc --noEmit`: exit 0.
- `npx jest src/auth src/mail src/provisioning`: exit 1. 43 of 44 suites pass; `src/auth/phone-signup.service.spec.ts` fails 4 to 5 tests (different names each run: sign-up replace, secret, resend gap, wrong-code budget). Re-run alone on the branch: 5 failed, 70 passed. Re-run alone on `origin/main` 7e7abf8 (scratch worktree, spec file for this task removed): 5 failed, 70 passed. Identical count on main and not near any mail code, so pre-existing and unrelated; the builder's "828 passed" did not reproduce (I saw 824 passed, 41 skipped on the full run).
- `npx jest src/mail/app-url.spec.ts`: all 6 pass on the branch.
- Mutation: that spec on main's code: 2 failed, 4 passed (exit 1), as wanted.

**NOT RUN**: full `npx jest` (suites outside auth, mail and provisioning; would not fit the time), eslint/prettier (the 5 `provisioning.service.ts` errors are accepted as identical on main), any real mail send, any check of which settings are set on the live server (owner's read-only look pending).

**Findings**
1. low, `src/mail/app-url.spec.ts` (test gap): the "this was not me" link is only tested through the helper (`securityUrl`) with settings unset; the service path (`auth.service.ts:164`, the mails at 188 and 212) is covered only with FRONTEND_URL set (`src/auth/account-mails.spec.ts:19,92,345`). A mutant that bypassed `securityUrl` in `secureUrl()` and went back to an empty fallback would survive. Test that kills it: `account-mails.spec.ts` with FRONTEND_URL, APP_URL and SECURITY_URL all unset, expect `https://wawuafrica.com/forgot-password`.
2. low, `src/mail/app-url.spec.ts` (test gap): activation is tested through `sendActivation` (`provisioning.service.ts:380`) only; the resend (279) and create (312) call sites are not exercised. All three call the same helper, so the risk is small. Test that kills it: drive `create`/resend with settings unset and read the mailed link.
3. low, pre-existing: `phone-signup.service.spec.ts` is failing or flaky on main (above). Not this task's; give it to the AUTH sweep.
4. note: the three behaviour differences above (trailing slash, blank, trim) are not mentioned in the builder report. Harmless, recorded here.

Open defects: none. Status stays `review`.
