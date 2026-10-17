---
id: LINKS-01
title: Every link WAWU sends lands somewhere that works
owner: YOU
area: FIX
order: 298
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [REF-03, DV2-05]
decisions: [R-47, R-48, R-49]
passes: [V1, V6, V7, V9]
artboards: []
---
# LINKS-01 · Every link WAWU sends lands somewhere that works

## Current state

As of 17 Oct 2026, built by a Sonnet builder (T1). Status: verifying. Web `wawuafrica` and mobile only: no backend, wawu-id or migration change.
- **Branches:** web `wmt/LINKS-01` (from `origin/main` `5b45d65`, the only web files are this task's); mobile `wmt/LINKS-01` (from `origin/wmt/MERGE-8` `cc436a53`). Hashes are in the builder report.
- **Order:** no free launch slot existed on this base (0 to 338, only 311 free, after CHECK-3). CHECK-3 and the 12 tasks after it moved up one (front matter `order:` only) so this task takes 298, just before CHECK-3. The lead may renumber at merge.
- **Audit:** 22 links WAWU sends or receives today, 9 landed nowhere that works, 4 are fixed here (W1, W2, A1, R1), 5 need a ruling (below). The CLAUDE.md line "Links are written `wawu/...`" is overridden for the invite link by the lead's ruling of 17 Oct (shared as https). Table under "The audit".
- **Built (web):** `/r/<code>` and `/selfie` are app links with a small dark "Open in the WAWU app" page; `/.well-known/apple-app-site-association` and `/assetlinks.json` list only those paths; `/reset-password` and `/forgot-password` are open again in join-only mode and draw no link into the closed sign-in page. Everything else is as it was. Settings, never typed: `APPLE_TEAM_ID`, `ANDROID_SHA256_CERT_FINGERPRINTS` (empty file until set).
- **Built (mobile):** `app.json` registers `applinks:wawuafrica.com` and one verified Android intent filter (`/r/`, `/selfie`); an invite is shared as `https://wawuafrica.com/r/<code>`; `/selfie` opens the selfie step; A6 sends `https://wawuafrica.com/selfie` as the hosted selfie's return address.
- **Owner values missing (never invented):** the Apple team id and the Android signing fingerprint(s). Also the Hub setting `NUVION_LIVENESS_REDIRECT_ORIGINS=https://wawuafrica.com/selfie` (needed whenever `NUVION_HOSTED_LIVENESS` is on) and wawu-id's `FRONTEND_URL=https://wawuafrica.com`.
- **Needs a ruling (not changed):** W3 the activation email lands on a page the web never had; H1 the privacy export email is never sent (wawu-id has no `data-export` route); H6 receipts print `wawu/r/<code>`, the same path as invites; A2 profile and A3 room shares are text with no scheme.
- **Needs a build or store release:** `app.json` changed native config (fingerprint runtime), so links open the app only from the next development or store build.
- **Open findings:** none graded yet. **Not run:** GitHub CI, a real phone, the real Hub or website.
- **Next:** a verifier; then the lead merges web and mobile.
- **History:** [history/LINKS-01.md](history/LINKS-01.md).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `BACKEND_GAPS.md` G-812 and G-827 (the two links this task closes), G-67 (the receipt link)

## Goal

Every address WAWU puts in an email, a share or a provider's return lands on something that works. With the website in join-only mode (JOIN-02) only /join is open, so the reset email, the invite link and the selfie return all ended on the registration page or on nothing.

## Scope

- Web (`wmt/LINKS-01`): `src/lib/app-links.ts`, `src/lib/site-mode.ts`, `src/middleware.ts`, `src/app/r/[code]`, `src/app/selfie`, `src/app/.well-known/*`, `src/components/open-in-app`, the two auth pages and their forms, `scripts/check-site-mode.mjs`, `.env.example`.
- Mobile (`wmt/LINKS-01`): `src/lib/appLinks.ts`, `app.json` (SHARED-CHANGES LINKS-01 #1), `src/app/selfie.tsx`, `src/features/referral` (link source and display), `src/features/open-wallet/api/liveness.ts`.
- Not touched: `/join` (still the registration campaign), every other website route, any Hub or wawu-id code.

## The audit

How to read it: **Today** is where the link lands before this task, **Now** after it. Broken means it lands nowhere that works. Links WAWU never sends (listed under the table) are not counted.

| # | Link | Sent by | Today | Now |
|---|------|---------|-------|-----|
| W1 | "Reset Password" button: `FRONTEND_URL/reset-password?token&email` | wawu-id email | Web page exists; join-only sends it to /join. **Broken** | Page open in join-only, unchanged; no link into closed sign-in (says to open the app). **Fixed** |
| W2 | "Secure My Account" in the sign-in alert: `SECURITY_URL` or `FRONTEND_URL/forgot-password` | wawu-id email (every sign-in) | Page exists; join-only sends it to /join. **Broken** | `/forgot-password` open, same treatment. **Fixed** |
| W3 | "Set My Password" activation: `FRONTEND_URL/activate?token&email` | wawu-id email (admin provisioning only) | The web has no /activate page: 404, or /join. **Broken** | Unchanged. Ruling needed: build the page or end the email |
| W4 | Email header picture `https://wawuafrica.com/email-header.png` | wawu-id, every email | Root file, open. Works | Unchanged |
| H1 | Privacy export download `HUB_PUBLIC_URL/api/hub/settings/privacy/export/download?token` | Hub, through wawu-id | The link is on the API host and works, but the email is never sent: wawu-id has no `/internal/users/:id/data-export` route (the Hub's call gets 404, the request stays pending). **Broken** | Unchanged. Backend and wawu-id task needed |
| H2 | Campaign unsubscribe `HUB_PUBLIC_URL/api/hub/email/unsubscribe?t=` | Hub campaign email | API host. Works | Unchanged |
| H3 | Campaign "Join" button `https://wawuafrica.com/join` | Hub campaign email | Open. Works | Unchanged |
| H4 | Campaign logo `https://wawuafrica.com/who-made-this-white.png` | Hub campaign email | Root file, open. Works | Unchanged |
| H5 | Test-send unsubscribe `https://wawuafrica.com/unsubscribe-preview` | Hub campaign test send | Goes to /join; a preview address that does nothing by design. Works as designed | Unchanged |
| H6 | Receipt check `wawu/r/<code>` printed on receipts (no scheme, `url` null until `RECEIPT_VERIFY_BASE_URL`) | Hub receipt PNG and PDF | Text only, opens nothing. **Broken**. It is also the invite path, so `https://wawuafrica.com/r/<code>` would hand a receipt code to the invite claim | Unchanged. Ruling needed: receipts take another path or the API host before G-67 is set |
| P1 | Push `data.actionHref` (`/profile/verification`, `/communities/<id>`, `/legal/requests/<id>`, the admin campaign list `/home` ...) | Hub push | Never followed: the app routes by `kind` and `target` (`src/features/push/routes.ts`), a kind with no row opens the app where it is. Works as designed | Unchanged |
| A1 | Invite link (RF1 copy, share, the card, share text): `wawu/r/<code>` | App share | No scheme, so no chat app makes it tappable; no https address opens the app. **Broken** | `https://wawuafrica.com/r/<code>` copied and shared; the card prints `wawuafrica.com/r/<code>`. Opens the app (claims after sign-in) or the fallback page. **Fixed** |
| A2 | Profile share `wawu/<handle>` (Me, Share) | App share | Text with no scheme; the app has no such route; the website's `/wawu/<handle>` is closed. **Broken** | Unchanged. Ruling needed: one more app path |
| A3 | Room link `wawu/c/<slug>` (shown and copied) | Hub issues, app shows | Text with no scheme; the app route `/c/<slug>` exists for `wawu://c/<slug>` only. **Broken** | Unchanged. Ruling needed: one more app path |
| A4 | A work's own link in its share | App share | The creator's own address, or none. Works as typed | Unchanged |
| A5 | TGIF "WhatsApp" `https://wa.me/?text=` | App | Outbound to WhatsApp. Works | Unchanged |
| R1 | Hosted selfie return (Nuvion `redirect_url`) | Hub, from the app | None sent (G-827): the person switched back by hand. **Broken** | `https://wawuafrica.com/selfie`: opens the app on the selfie step, or the fallback page with an "Open the app" button. **Fixed** once the Hub lists it |
| R2 | Join checkout return `${origin}/join/paid` | Web, to Flutterwave | Open. Works | Unchanged |
| R3 | Web checkout return `${origin}/payment/return` | Web, to Flutterwave | Closed in join-only, but every web flow that starts it is closed too | Unchanged (web paused, R-49) |
| R4 | Policy record `url` `https://wawuafrica.com/privacy` (wawu-id seed) | wawu-id data | Closed, and it is the privacy settings page, not the policy. Nothing in the app or the web reads it | Unchanged (low) |
| R5 | `wawu://...` custom scheme (`wawu://r/<code>`, `wawu://selfie`, any route) | Buttons on the fallback pages | Opens the app. Works | Used by the fallback buttons |
| R6 | Consent line `/privacy/policy` then `/terms` | Web /join | Open. Works | Unchanged |

**Counts:** 22 links, 9 broken today (W1, W2, W3, H1, H6, A1, A2, A3, R1), 4 fixed here (W1, W2, A1, R1), 5 left for a ruling (W3, H1, H6, A2, A3).

**Not sent today (not counted):** `sendEmailVerification` and `sendProfileIncomplete` buttons (defined in wawu-id, never called: email is proved with a code), the Ditto invite and unpaid-deletion warning (no caller), `TGIF_SHARE_LINK` (unset, the app leaves the link out), event, school and receipt shares (text with no link), the welcome, approval, code and statement emails (no link).

## Capability checks

- [x] An emailed reset or sign-in-alert link opens the website page in join-only mode, and the page draws no link into the closed sign-in page (live check, both modes).
- [x] `/r/<code>` and `/selfie` answer 200 with the "Open in the WAWU app" page at 390 px, dark; `/join` and every other route answer as before (live check: 333 passed join-only, 295 full).
- [x] `/.well-known/apple-app-site-association` and `/assetlinks.json` answer 200 as JSON, no redirect, and list only `/r/*` and `/selfie` (the Apple and Android values come from settings; empty until set).
- [x] An invite is copied and shared as `https://wawuafrica.com/r/<code>`; `app.json` and `src/lib/appLinks.ts` agree and name only the two paths (spec).
- [x] `https://wawuafrica.com/selfie` and `wawu://selfie` reach the selfie step signed in, the welcome screen signed out (spec).
- [ ] On a phone with the signed build the three links open the app (V10): NOT RUN, needs the owner's signing values and a build.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/LINKS-01.md](history/LINKS-01.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
