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

Verifier: T1 lean, own worktree (website f4ccc9ca against origin/main 03d0217, a clean `npm ci`, nothing from the builder's tree). 12 Nov 2026.

**Verdict: MERGE.** No FIX finding. Two low findings and two notes, below.

### Findings

1. **LOW, admin referral links are now dead ends** (`src/lib/api/referrals.ts:17-18`). `joinLinkFor` builds `https://wawuafrica.com/join?ref=<code>` (the query is `ref=`, not a bare code). It now answers 308 to `https://usewmt.com/` with the query dropped (live, both modes). The code is lost for a person who taps an old link. Severity is low because the code only ever priced the /join payment (R-125: LOGOART is a registration price, Verify only), and nothing sells a registration now. The Who Made This app has no place to take it: `src/app/r/[code].tsx` is the user-to-user referral (points, `/me/referrals`), a different code kind, and `claim-code` takes the access code of a paid registration, not a price code. Nothing the person paid for is lost, only a discount on a purchase that no longer exists. What stays wrong is the admin page (`/admin/referrals`) still offering these as share links, and `EmailSend.tsx:160` ("People who registered on /join"). Lead to rule: retire or relabel that admin page in its own task (admin routes are live, left alone here as the builder said).
2. **LOW, stale copy on a full-mode page** (`src/app/(auth)/sign-in/components/SignInForm.tsx:232`: "Paid on /join? Sign in with ..."). Only reachable in full mode (join-only sends /sign-in to usewmt.com), so no visitor of production sees it. Not touched by the task.
3. **NOTE, trailing slash is two hops** (`/join/` goes 308 to `/join`, then 308 to usewmt.com; same for `/activate/?token=...`, where Next keeps the query in hop one). Result is correct.
4. **NOTE, `@` becomes `%40`** when a link carries a raw `@` (`?email=a@b.com` arrives as `a%40b.com`): same value. Mail shapes (hex token, `%40`, `%2B`, `+`, `;`, `%25`) arrive byte for byte. As the builder said.

### Evidence

1. Redirects, production build (`VERCEL_ENV=production next start`, and `SITE_MODE=full`), curl: /join, /join?ref=abc, /who-made-this all 308 to https://usewmt.com/ in both modes. `/reset-password?token=<64 hex>&email=a%40b.com` 308 to `https://usewmt.com/reset-password?token=<64 hex>&email=a%40b.com`; `email=a%2Bb%40c.com` kept; `/activate?token=a+b&email=a%2Bb%40c.com` kept; `/forgot-password?email=a%40b.com` kept; bare `/forgot-password` and `/reset-password?` carry no query. Closed paths: /sign-in and /wallet 308 to the same path on usewmt.com, /random-thing 307 to https://usewmt.com/, /Join and /join/x 307 to usewmt.com. Still 200: /, /voices, /about, /partners, /press, /careers, /contact, /legal, /legal/privacy, /terms, /join/paid (with and without `tx_ref`), /admin/notifications, /robots.txt, /sitemap.xml, /.well-known/assetlinks.json. `/admin` is 404 and `/privacy/policy` is a page redirect: both pre-existing (no `admin/page.tsx`; `(app)/privacy/policy/page.tsx`). Links: every brand page's served HTML has only `https://usewmt.com` (and `/sign-in` on usewmt.com) as a Who Made This link; no `href` to /join or /who-made-this anywhere in the built output (only server code strings: the `/join/paid` route, the admin referrals link builder, an admin label, the sign-in sentence above). The sitemap lists the seven pages, none removed one.
2. `/join/paid`: `PaidReturn.tsx` reads `tx_ref`, `transaction_id`, `status` and the stored reference, then only calls `getRegistrationStatus` and `verifyRegistration`; no payment is ever opened and "never offers to pay again". Compared with the removed `JoinFlow` return branch on main: the same reference and id parsing, the same `anIdExists` rule for "not charged", the same status and verify outcomes, the same five-minute poll. Dropped on purpose: `joinAbandoned` and `joinTier.set` (only the start-again flow used them). `getRegistrationStatus`, `verifyRegistration`, `refusalOf`, `JoinShell`, `JoinSuccess`, `StateCard` and `join-session` stay. Open in both modes. Sole residual: a person whose tab was still on /join mid-payment loses the sessionStorage reference when /join forwards (different origin); the server's webhook still completes the registration, and the Flutterwave redirect lands on /join/paid with `tx_ref` anyway.
3. Referral links: see finding 1.
4. Checks (my worktree): `tsc --noEmit` 0; `next lint` 0; `check:copy` 0 (clean); `next build` 0; `check-site-mode.mjs` static 0 (1210 passed), `--mobile-src` 0 (1420), live join-only with `--mobile-src` 0 (1996), live full 0 (1818), `--app-json` 0 (1218). Gates: `run.py` exit 1 on the branch (16 fail, 8 warn, 42 accepted) and exit 1 on origin/main (17 fail). Diffing the failure lists: the 16 are all on main too, same files and lines; the one extra on main, `JoinLanding.tsx:346` ("we will message you"), went with the removed file. None is in a file this task changed. `check_baseline.py` 0 on both.
5. Changed assertions: I read the full `check-site-mode.mjs` diff against the table. Every old expectation that changed follows R-141 (points 1 and 4), and each removed check belongs to removed code. Added: 30 query-shape checks, the moved-page checks, live 308s, a check that no source links /join or /who-made-this, no payment provider named on a page. Two places are looser by design: "link lands on an open page" now also accepts https://usewmt.com (point 1), and `/.well-known/other` now expects the closed 307 to usewmt.com instead of "never sent to usewmt.com" (a closed path now goes there, point 1; `/_next/static/missing.js` keeps the never-redirect check). Not weaker than R-141 needs. The table matches the diff.
6. Pictures (audits/WEB-WMT-OFF/, 23 files, dark only; the site has no light theme): I opened home 390 and desktop, the Voices hero 390, /join/paid checking 390, and the footer 390. Home: the lead button reads "Open Who Made This" with an arrow, fits at 390 and desktop, header has the same label as a pill on desktop; no wrapping. Voices hero: the button reads "Open Who Made This" above a "Coming soon on the App Store and Google Play" line for VOICES (reads slightly odd under a Who Made This button, but it follows the task). /join/paid: a plain card, "Checking your payment", a "Check again" button, no provider name. Footer 390: apps list, "VOICES is coming soon" line, the button. The footer shot shows the logo bar twice (a sticky header caught in the full-page capture, not a layout bug in the served HTML; the DOM has one header). Rendered HTML of 8 pages in both modes: 0 em-dashes, 0 "Flutterwave"; the task's added strings have no em-dash.

### Exit codes and NOT RUN

tsc 0, lint 0, check:copy 0, next build 0, check-site-mode (5 runs) 0, gates run.py 1 (pre-existing: 16 of main's 17), check_baseline.py 0.
NOT RUN: a real Flutterwave return (no live provider, by rule), so `/join/paid` was proven by reading and by the page rendering its states against an API that is not reachable (shows "Checking", as designed); pictures of the removed pages (nothing to take); light theme (none exists); the live usewmt.com pages the redirects land on (the target's own routes were checked only against the app's source via `--mobile-src`).

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
