# LINKS-01 · round history

Moved out of [tasks/LINKS-01.md](../LINKS-01.md) word for word, oldest first. The current state is in that file.

## Builder report

17 Oct 2026, Sonnet builder, T1. Web `wmt/LINKS-01` `239cbcf` on `origin/main` `5b45d65`; mobile `wmt/LINKS-01` `bf541fd8` on `origin/wmt/MERGE-8` `cc436a53`.
- **Web files:** `src/lib/app-links.ts` (+ test), `site-mode.ts`, `middleware.ts`, `src/app/r/[code]/page.tsx`, `src/app/selfie/page.tsx`, `src/app/.well-known/{apple-app-site-association,assetlinks.json}/route.ts`, `src/components/open-in-app/OpenInApp.tsx`, `(auth)/reset-password` and `forgot-password` pages and forms (a `signInHref` prop, default unchanged), `scripts/check-site-mode.mjs` (only additions, and a resolve hook for the new import), `.env.example`.
- **Mobile files:** `src/lib/appLinks.ts`, `app.json`, `src/app/selfie.tsx`, `referral/{api,parts,ShareCard}`, `open-wallet/api/liveness.ts`, specs `appLinks`, `selfieLink`, `referralLink` (https cases added); `SHARED-CHANGES` row LINKS-01 #1; `BACKEND_GAPS` G-812 and G-827 resolved in the app, G-67 clash noted.
- **Checks (EXIT):** web typecheck 0; web lint on 11 changed files 0 (one `<img>` warning, as elsewhere on the site); web `app-links` test 10 pass; `check:copy` clean; production build 0; `check:site-mode` static 233 pass 0, live join-only on `next start` 333 pass 0, live full 295 pass 0. Mobile typecheck 0; eslint `--max-warnings 0` on 12 changed files 0; jest 12 suites, 145 tests pass; gates 0 fail (9 warn, none in changed files) 0; baseline 0; `npm run tasks` 0.
- **Pictures (390 px, dark, no sideways scroll):** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/links-01-b/shots/` `invite-390-dark.png`, `selfie-390-dark.png`, `reset-390-dark.png`, `forgot-390-dark.png` (join-only build).
- **Tests whose assertion changed with the behaviour (nothing weakened):** `hostedSelfie.test.tsx` (empty body is now `{ redirectUrl }`), `InviteScreen.test.tsx` and `ShareCardScreen.test.tsx` (the link shown, copied and shared).
- **Decisions (agent, owner may override):** the app builds the shared invite from the code, so no Hub change; RF1 and the card show `wawuafrica.com/r/<code>`, copy and share carry the https link. `/selfie` is the return path. The fallback pages take a button to `wawu://...` because a phone does not hand a same-site or redirected link to the app. `/forgot-password` is reopened with `/reset-password` (the sign-in alert links to it). Both pages draw no link into the closed sign-in page and say to open the app. With no signing value set, each `.well-known` file is valid and names no app. The `/join` registration page, the closed videos and every other route are untouched.
- **Found, not changed:** W3, H1, H6, A2, A3 (audit); the forgot-password page says 30 minutes while the token lasts 1 hour (copy, low); wawu-id's `.env.example` sets `APP_URL` to its Railway address, so `FRONTEND_URL` must be set in production.
- **NOT RUN:** GitHub CI on either branch; a phone with a signed build (V10: the owner's two signing values are missing); the real Hub, wawu-id or website; Vercel serving the `.well-known` routes; a real universal-link round trip.


## Builder report, round 2 (W3, H6, A2, A3; H1 left for FIX-53)

Lead rulings of 17 Oct (the owner may override). T1, Sonnet builder. Web `wmt/LINKS-01` `252ae11` (on `239cbcf`); mobile `wmt/LINKS-01` is the commit carrying this file, on `c72a062b`.
- **Web:** `src/lib/app-links.ts` lists six app paths (added `/activate`, `/receipt/<code>`, `/u/<handle>`, `/c/<slug>`; one shape check per segment, the receipt code is never the invite path). New pages `src/app/activate`, `receipt/[code]`, `u/[handle]`, `c/[slug]` use the existing `OpenInApp` page with their own `wawu://` button; a wrong shape is a 404. Middleware, both `.well-known` files and the join-only list follow the one list. `/activate` reads and forwards nothing.
- **App:** `app.json` filter has the six paths. Routes `activate.tsx` (sign-in, or Home), `receipt/[code].tsx` (wallet history, or welcome), `u/[handle].tsx` (own handle Me, else that person's works, else Home), `c/[slug].tsx` unchanged but its comment. `profileShareText` and the Edit profile hint use `https://wawuafrica.com/u/<handle>`; `PROFILE_LINK_PREFIX` is gone. `roomLink(slug)` is the one place for a room's https address (no screen shows a room link yet).
- **Audit table:** W3, H6, A2, A3 fixed, H1 marked FIX-53, counts 22 / 9 / 8 fixed / 1 left. A3's row corrected: the app shows no room link today.
- **Assertions changed with the behaviour (not to pass a check):** `me/model.test.ts` and `MeScreen.test.tsx` (the Share text), `editProfile.test.tsx` (the hint under the handle). Nothing else in a test I did not write.
- **Web checks (all EXIT 0):** typecheck; lint (warnings only, the existing `<img>` ones); `check:copy` clean; `check:site-mode` 292 passed offline, 419 live join-only, 378 live full (built with `NEXT_PUBLIC_USE_MOCKS=true`, ports 7920 and 7921, both stopped); app-links tests 13 (round 1: 10).
- **Pictures:** `/activate`, `/receipt/<code>`, `/u/<handle>`, `/c/<slug>` at 390 px dark, no horizontal scroll: `.../scratchpad/links-01-r2-b/shots/*-390-dark.png`.
- **Mobile checks (all EXIT 0):** typecheck; eslint on every changed file; affected jest 26 suites, 260 tests (new `appLinkRoutes.test.tsx` 12, `appLinks.test.ts` 11); gates 0 fail, 9 warn (existing PROVISIONAL), baseline check; `npm run tasks`.
- **Gaps and requests:** SHARED-CHANGES LINKS-01 #1 extended (the six paths). G-67 notes the path now exists. No new gap. Not done: H1 (FIX-53). Not run: GitHub CI, a real phone.
- **For the lead:** the website `/receipt/<code>` only hands off to the app; the Hub's check page stays on the API host (Current state).
