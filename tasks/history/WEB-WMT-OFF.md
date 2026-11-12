# WEB-WMT-OFF · round history

Moved out of [tasks/WEB-WMT-OFF.md](../WEB-WMT-OFF.md) word for word, oldest first. The current state is in that file.

## Builder report
- Branches: wawuafrica `wmt/WEB-WMT-OFF` f4ccc9ca; records `wmt/WEB-WMT-OFF` (this note, history, pictures in audits/WEB-WMT-OFF/).
- `/join/paid` is called only by Flutterwave's return (`redirectUrl` set in the old JoinFlow when the person paid): a payment made before this task can still come back, so it stays open as a return-only page (`src/app/join/paid/PaidReturn.tsx`: status and verify, never a payment window). Nothing opens a payment now.
- Redirects: `movedPageTarget` (`src/lib/app-redirects.ts`) used by `src/middleware.ts` before the mode check: 308 for /join, /who-made-this (to the home) and the three password pages (same path, query kept); other closed paths 307 to usewmt.com.
- Links: `WMT_HREF` replaces `REGISTER_HREF`; header, footer, home, Voices, conference band, app tile and nav all open usewmt.com ("Open Who Made This"); `signUpHref` in join-only returns usewmt.com.
- Removed: the join page and its form, plans, referral and share code, `src/lib/join-tiers*`, `join-referral*`, the Who Made This page, the password pages and their API calls, two public pictures (conference poster, Who Made This link preview), the `who-made-this` store entry.
- Checks (exit codes): tsc 0; lint 0 (warnings only); check:copy 0; check-site-mode 0 (1210 static, 1420 with mobile routes, 1786 live join-only, 1608 live full); `next build` 0; gates `run.py` 1 (16 fail, none in a file this task touched; `check_baseline.py` 0).
- Pictures: audits/WEB-WMT-OFF/ (dark only: the brand site has no light theme, light shots were byte-identical).
- Not done: `scripts/check-join-phone-320.mjs` (a SWEEP-JOIN script for the removed form) is left in place; it has no page to open and is not in any check. Query byte-for-byte holds in the function and the live mail-shaped links (hex token, `%40`, `%2B`); exotic characters are re-encoded by Next.

## Verifier report


## Changed assertions (scripts/check-site-mode.mjs, wawuafrica f4ccc9ca)

No middleware spec file exists in the repo; the one gate that held these rules is `scripts/check-site-mode.mjs`. Every change below is a rule R-141 changed. Nothing else was loosened. New checks (not in this table): `movedPageTarget` for /join, /who-made-this and the three password pages (30 query shapes, byte for byte, in the function), the live 308s with a mail-shaped query, removal of the page code, no source link to /join or /who-made-this, no password API calls left, no em-dash, inline style or hex in the changed pages.

| File | Check | Old | New | R-141 point |
|------|-------|-----|-----|-------------|
| scripts/check-site-mode.mjs | `open:` /join, /join/ | open in join-only | closed (not served) | 1 |
| same | `open:` /who-made-this, /who-made-this/ | open | closed | 1 |
| same | `open:` /reset-password, /forgot-password, /activate (with and without slash) | open | closed | 4 (lead's widening) |
| same | `page:` /who-made-this is a page | true | false (now in the not-a-page list with /join) | 1 |
| same | `page:` /reset-password, /forgot-password, /activate are pages | true | false | 4 |
| same | `public/` open files list | included /who-made-this-conference.webp and /wawu-og-who-made-this.png | both removed with their pages | 1 |
| same | `join:` hero picture named in join-content.ts, exists, is open | 3 checks on the join page's hero | replaced by one check that the two pictures are gone | 1 |
| same | `brand:` the pages the site lists (SITE_PAGES) | 8 pages with /who-made-this | 7 pages without it | 1 |
| same | `brand:` /who-made-this is a page open, has its page file | 2 checks | removed (page gone) | 1 |
| same | `brand:` link WHO MADE THIS? lands on an open page | true for /who-made-this | true for https://usewmt.com (open page or usewmt.com) | 1 |
| same | `brand:` Register is the registration link | REGISTER_HREF = "/join" | WMT_HREF = "https://usewmt.com", and the two config links named WHO MADE THIS? are usewmt.com | 1 |
| same | `brand:` the header's links | first is /who-made-this | first is https://usewmt.com | 1 |
| same | `brand:` the apps the store config knows | voices, who-made-this | voices | 1 |
| same | `brand:` the link-preview pictures | three, incl. wawu-og-who-made-this.png | two | 1 |
| same | `join-only:` sign-up buttons go to /join | "/join" | "https://usewmt.com" | 1 |
| same | `join-only:` /join, /forgot-password, /activate, /reset-password stay (landing links) | kept | not drawn (moved to the closed list) | 1, 4 |
| same | `strip:` forgot-password page is its own page file; activate, reset and forgot page files exist | exist | moved into the "is removed" list | 4 |
| same | `links:` sign in goes to usewmt.com in the password forms, JoinLanding | listed files | those files are gone; JoinSuccess, SiteHeader, SiteFooter stay | 1, 4 |
| same | `links:` no em-dash, inline style, hex in the activate, forgot, reset pages | those files | PaidReturn.tsx and JoinSuccess.tsx | 1, 4 |
| same | `activate:` page calls activateAccount; activateAccount posts to /auth/activate; no session kept | 3 checks | replaced by one check that the three API calls are gone | 4 |
| same | `mobile:` app routes not mapped | the pages wawuafrica.com keeps | same list, message now "keeps or moves with their query" | 4 |
| same | live: `/who-made-this/x` and other closed paths | 307 to /join | 307 to https://usewmt.com/ | 1 |
| same | live: /join answers 200 and is not redirected | 200 | 308 to https://usewmt.com/ (also with a query) | 1 |
| same | live: /.well-known/other, /_next/static/missing.js "never sent to usewmt.com" | neither redirects to usewmt.com | /.well-known/other is the closed 307 to usewmt.com home; /_next/static/missing.js still never redirected | 1 |
| same | live: /activate, /forgot-password answer 200, link to no closed page, activate page has its title and form | 200 | 308 to the same path on usewmt.com, query kept | 4 |
| same | live: /reset-password with and without query answers 200 in both modes, its title and form | 200 | 308 to usewmt.com in both modes | 4 |
| same | live: brand pages answer 200 | 8 pages | 7 pages | 1 |

Live runs: join-only 1786 passed 0 failed, full 1608 passed 0 failed (production builds, `next start`, API and WAWU ID base URLs at 127.0.0.1:9, no live service called).

## Pictures

audits/WEB-WMT-OFF/, 390 px and 1440 px, dark (the brand site has no light theme; light renders were byte-identical, so not kept): home, voices, about, partners, press, careers, contact, /join/paid with no payment and with a reference (checking), plus home apps tiles, footer, Voices hero at 390 and the header at 768. Each was opened and looked at: the "Open Who Made This" buttons fit the header at 390, 768 and 1440 without wrapping.
