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
- **Status:** built on wawu-id `wmt/ID-LINKS` (79dd2b7); T1 verifier round 1 says MERGE (11 Nov 2026), lows only. Was: todo. Cut by the lead from R-133 point 4.
- **The gap** (wawu-id `origin/main` 7e7abf8):
  - the reset link is `${FRONTEND_URL ?? APP_URL ?? ''}/reset-password?token&email` (`src/auth/auth.service.ts` near 1248), so with neither setting it is a link with no host;
  - the "this was not me" link is `SECURITY_URL ?? (FRONTEND_URL ?? APP_URL)/forgot-password` (near 164), the same risk;
  - activation already falls back to `DEFAULT_APP_URL` `https://wawuafrica.com` (`src/provisioning/provisioning.service.ts`).
- **Not known:** which of FRONTEND_URL, APP_URL and SECURITY_URL are set on the live server. The lead has asked the owner for a read-only look. This task does not depend on the answer.
- **Next:** lead merges wawu-id `wmt/ID-LINKS`; the three lows go to the AUTH sweep.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/ID-LINKS.md](history/ID-LINKS.md).

