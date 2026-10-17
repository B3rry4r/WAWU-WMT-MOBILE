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

As of 17 Oct 2026, round 2 built by a Sonnet builder (T1). Status: verifying. Web `wawuafrica` and mobile only: no backend, wawu-id or migration change.
- **Branches:** web `wmt/LINKS-01` (from `origin/main` `5b45d65`; round 2 on `239cbcf`); mobile `wmt/LINKS-01` (from `origin/wmt/MERGE-8` `cc436a53`; round 2 on `c72a062b`). Hashes are in the builder report.
- **Order:** 298 (taken by moving CHECK-3 and the 12 tasks after it up one, front matter only). The lead may renumber at merge.
- **Audit:** 22 links, 9 landed nowhere that works, 8 are fixed (W1, W2, A1, R1 in round 1; W3, H6, A2, A3 in round 2). H1 is left for **FIX-53** (the privacy export email is never sent: wawu-id has no `data-export` route; the lead queues it). Table under "The audit".
- **Six app paths, no more:** `/r/<code>`, `/selfie`, `/activate`, `/receipt/<code>`, `/u/<handle>`, `/c/<slug>`. Website: each is a small dark "Open in the WAWU app" page; both `.well-known` files and the join-only middleware list exactly these; a segment of the wrong shape is a 404. `/reset-password` and `/forgot-password` are open again in join-only mode and draw no link into the closed sign-in page. `/join` and everything else are as they were.
- **App:** `app.json` registers `applinks:wawuafrica.com` and one verified Android filter with the six paths (a spec checks it against `src/lib/appLinks.ts` and that each path has a route file). `/activate` opens sign-in (signed in: Home). `/receipt/<code>` opens the wallet history (signed out: welcome); the app has no screen that finds a receipt by code. `/u/<handle>`: own handle opens Me, anyone else's opens that person's works (M34 takes a handle; a full profile of someone else is not built). `/c/<slug>` opens the room (already built). The profile Share sends `https://wawuafrica.com/u/<handle>`, the invite `https://wawuafrica.com/r/<code>`, A6 `https://wawuafrica.com/selfie`.
- **Owner values missing (never invented):** the Apple team id and the Android signing fingerprint(s); Hub `NUVION_LIVENESS_REDIRECT_ORIGINS=https://wawuafrica.com/selfie` (whenever `NUVION_HOSTED_LIVENESS` is on); Hub `RECEIPT_VERIFY_BASE_URL=https://wawuafrica.com/receipt` (receipts then print the new address, G-67); wawu-id `FRONTEND_URL=https://wawuafrica.com`.
- **For the lead:** the website's `/receipt/<code>` only hands off to the app (it reads nothing from the Hub). The Hub's own public check page stays at `/api/hub/r/<code>` on the API host, so a person with no app who taps a receipt link sees the fallback page, not the check. Say if the check should live at the website address (then that page reads the Hub: a separate task).
- **Edit profile hint:** M8's preview under the handle now reads `wawuafrica.com/u/<handle>` (it was `wawu/<handle>`), so it matches what Share sends; its test assertion was updated with it.
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

- Web (`wmt/LINKS-01`): `src/lib/app-links.ts`, `src/lib/site-mode.ts`, `src/middleware.ts`, `src/app/r/[code]`, `src/app/selfie`, `src/app/activate`, `src/app/receipt/[code]`, `src/app/u/[handle]`, `src/app/c/[slug]`, `src/app/.well-known/*`, `src/components/open-in-app`, the two auth pages and their forms, `scripts/check-site-mode.mjs`, `.env.example`.
- Mobile (`wmt/LINKS-01`): `src/lib/appLinks.ts`, `app.json` (SHARED-CHANGES LINKS-01 #1), `src/app/selfie.tsx`, `src/app/activate.tsx`, `src/app/receipt/[code].tsx`, `src/app/u/[handle].tsx`, `src/app/c/[slug].tsx` (comment), `src/features/referral` (link source and display), `src/features/me/model.ts` (profile share), `src/features/profile-edit` (the hint under the handle), `src/features/open-wallet/api/liveness.ts`.
- Not touched: `/join` (still the registration campaign), every other website route, any Hub or wawu-id code.

## The audit

How to read it: **Today** is where the link lands before this task, **Now** after it. Broken means it lands nowhere that works. Links WAWU never sends (listed under the table) are not counted.

| # | Link | Sent by | Today | Now |
|---|------|---------|-------|-----|
| W1 | "Reset Password" button: `FRONTEND_URL/reset-password?token&email` | wawu-id email | Web page exists; join-only sends it to /join. **Broken** | Page open in join-only, unchanged; no link into closed sign-in (says to open the app). **Fixed** |
| W2 | "Secure My Account" in the sign-in alert: `SECURITY_URL` or `FRONTEND_URL/forgot-password` | wawu-id email (every sign-in) | Page exists; join-only sends it to /join. **Broken** | `/forgot-password` open, same treatment. **Fixed** |
| W3 | "Set My Password" activation: `FRONTEND_URL/activate?token&email` | wawu-id email (admin provisioning only) | The web has no /activate page: 404, or /join. **Broken** | `/activate` is an app link: the app opens sign-in (token and email are not read), or the fallback page "Open in the WAWU app". **Fixed** (round 2) |
| W4 | Email header picture `https://wawuafrica.com/email-header.png` | wawu-id, every email | Root file, open. Works | Unchanged |
| H1 | Privacy export download `HUB_PUBLIC_URL/api/hub/settings/privacy/export/download?token` | Hub, through wawu-id | The link is on the API host and works, but the email is never sent: wawu-id has no `/internal/users/:id/data-export` route (the Hub's call gets 404, the request stays pending). **Broken** | Unchanged here. **FIX-53** (lead queues it: the wawu-id `data-export` route and the Hub's call) |
| H2 | Campaign unsubscribe `HUB_PUBLIC_URL/api/hub/email/unsubscribe?t=` | Hub campaign email | API host. Works | Unchanged |
| H3 | Campaign "Join" button `https://wawuafrica.com/join` | Hub campaign email | Open. Works | Unchanged |
| H4 | Campaign logo `https://wawuafrica.com/who-made-this-white.png` | Hub campaign email | Root file, open. Works | Unchanged |
| H5 | Test-send unsubscribe `https://wawuafrica.com/unsubscribe-preview` | Hub campaign test send | Goes to /join; a preview address that does nothing by design. Works as designed | Unchanged |
| H6 | Receipt check `wawu/r/<code>` printed on receipts (no scheme, `url` null until `RECEIPT_VERIFY_BASE_URL`) | Hub receipt PNG and PDF | Text only, opens nothing. **Broken**. It is also the invite path, so `https://wawuafrica.com/r/<code>` would hand a receipt code to the invite claim | `https://wawuafrica.com/receipt/<code>` is its own app link (never `/r/`): the app opens the wallet history, or the fallback page. **Fixed on the website and app** (round 2). Prints on receipts once the Hub setting `RECEIPT_VERIFY_BASE_URL=https://wawuafrica.com/receipt` is set (owner, OPS-10; G-67) |
| P1 | Push `data.actionHref` (`/profile/verification`, `/communities/<id>`, `/legal/requests/<id>`, the admin campaign list `/home` ...) | Hub push | Never followed: the app routes by `kind` and `target` (`src/features/push/routes.ts`), a kind with no row opens the app where it is. Works as designed | Unchanged |
| A1 | Invite link (RF1 copy, share, the card, share text): `wawu/r/<code>` | App share | No scheme, so no chat app makes it tappable; no https address opens the app. **Broken** | `https://wawuafrica.com/r/<code>` copied and shared; the card prints `wawuafrica.com/r/<code>`. Opens the app (claims after sign-in) or the fallback page. **Fixed** |
| A2 | Profile share `wawu/<handle>` (Me, Share) | App share | Text with no scheme; the app has no such route; the website's `/wawu/<handle>` is closed. **Broken** | `https://wawuafrica.com/u/<handle>` shared (Me, Share) and shown under the handle in Edit profile. Opens the app (own handle: Me tab; anyone else's: that person's works, the one page of another person built), or the fallback page. **Fixed** (round 2) |
| A3 | Room link `wawu/c/<slug>` (the Hub's `link` on a room) | Hub issues; the app shows none today | Text with no scheme; the app route `/c/<slug>` exists for `wawu://c/<slug>` only. **Broken** | `https://wawuafrica.com/c/<slug>` opens the room (app route `/c/<slug>` already existed), or the fallback page; the one link-building helper is `roomLink(slug)`. The app shows no room link today (nothing to change on screen), the Hub's `link` field still says `wawu/c/<slug>`. **Fixed** (round 2) |
| A4 | A work's own link in its share | App share | The creator's own address, or none. Works as typed | Unchanged |
| A5 | TGIF "WhatsApp" `https://wa.me/?text=` | App | Outbound to WhatsApp. Works | Unchanged |
| R1 | Hosted selfie return (Nuvion `redirect_url`) | Hub, from the app | None sent (G-827): the person switched back by hand. **Broken** | `https://wawuafrica.com/selfie`: opens the app on the selfie step, or the fallback page with an "Open the app" button. **Fixed** once the Hub lists it |
| R2 | Join checkout return `${origin}/join/paid` | Web, to Flutterwave | Open. Works | Unchanged |
| R3 | Web checkout return `${origin}/payment/return` | Web, to Flutterwave | Closed in join-only, but every web flow that starts it is closed too | Unchanged (web paused, R-49) |
| R4 | Policy record `url` `https://wawuafrica.com/privacy` (wawu-id seed) | wawu-id data | Closed, and it is the privacy settings page, not the policy. Nothing in the app or the web reads it | Unchanged (low) |
| R5 | `wawu://...` custom scheme (`wawu://r/<code>`, `wawu://selfie`, any route) | Buttons on the fallback pages | Opens the app. Works | Used by the fallback buttons |
| R6 | Consent line `/privacy/policy` then `/terms` | Web /join | Open. Works | Unchanged |

**Counts:** 22 links, 9 broken today (W1, W2, W3, H1, H6, A1, A2, A3, R1), 8 fixed here (W1, W2, A1, R1 in round 1; W3, H6, A2, A3 in round 2), 1 left: H1 (FIX-53).

**Not sent today (not counted):** `sendEmailVerification` and `sendProfileIncomplete` buttons (defined in wawu-id, never called: email is proved with a code), the Ditto invite and unpaid-deletion warning (no caller), `TGIF_SHARE_LINK` (unset, the app leaves the link out), event, school and receipt shares (text with no link), the welcome, approval, code and statement emails (no link).

## Capability checks

- [x] An emailed reset or sign-in-alert link opens the website page in join-only mode, and the page draws no link into the closed sign-in page (live check, both modes).
- [x] `/r/<code>`, `/selfie`, `/activate`, `/receipt/<code>`, `/u/<handle>` and `/c/<slug>` answer 200 with the "Open in the WAWU app" page at 390 px, dark; `/join` and every other route answer as before (live check: 419 passed join-only, 378 full).
- [x] `/.well-known/apple-app-site-association` and `/assetlinks.json` answer 200 as JSON, no redirect, and list only the six app paths (the Apple and Android values come from settings; empty until set).
- [x] An invite is copied and shared as `https://wawuafrica.com/r/<code>`; `app.json` and `src/lib/appLinks.ts` agree and name only the six paths, each with a route file (spec).
- [x] `https://wawuafrica.com/selfie` and `wawu://selfie` reach the selfie step signed in, the welcome screen signed out (spec).
- [x] `/activate`, `/receipt/<code>`, `/u/<handle>` and `/c/<slug>` open the screen named above, signed in and signed out (spec, `src/__tests__/appLinkRoutes.test.tsx`).
- [ ] On a phone with the signed build the links open the app (V10): NOT RUN, needs the owner's signing values and a build.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/LINKS-01.md](history/LINKS-01.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

