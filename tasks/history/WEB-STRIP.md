# WEB-STRIP · round history

Moved out of [tasks/WEB-STRIP.md](../WEB-STRIP.md) word for word, oldest first. The current state is in that file.

## Builder report
- Files (wawuafrica): `src/lib/app-redirects.ts` (new), `src/lib/site-mode.ts`, `src/middleware.ts`, `src/app/activate/**` (new), `src/app/forgot-password/**` (moved from `(auth)`), `src/app/reset-password/components/ResetPasswordForm.tsx`, `src/app/join/components/{JoinLanding,JoinSuccess}.tsx`, `src/app/(site)/_components/{SiteHeader,SiteFooter}.tsx`, `src/lib/api/{auth,uploads}.ts`, `src/types/auth.ts`, `src/components/ui/FilePicker.tsx` (WEB-UPLOAD's additions reversed), `SignInForm`/`SignUpFlow` (`uploadOnly` removed), `CLAUDE.md`, `scripts/check-site-mode.mjs`. Deleted: `src/app/upload-site`, `src/components/site-upload`, `src/lib/site-upload` (with its test), `src/lib/api/site-upload.ts`.
- Capability checks: (1) activation: Playwright on the production build with WAWU ID faked; POST goes to `/auth/activate` with `activationToken`, `email`, `password`; success links to `https://usewmt.com/sign-in`. (2) reset: same, done state links to usewmt.com sign in. (3) closed pages: live crawl, `/sign-in`, `/sign-up`, `/create/new`, `/create/library` answer 308 to usewmt.com. (4) old links: live 308 for profile, piece, receipt, `/wawu/ada`, `/u/ada?x=1` and the table in the check. (5) `/.well-known/*`, `/admin/notifications`, `/join` answer 200 and are never redirected.
- check-site-mode expectations changed because R-133 changed which pages open: the five R-126 pages are no longer in the open lists, `/activate` moved from closed to open, the rewrite block became a "nothing left of the upload pages" block, and the live crawl expects the 308s. Nothing else was edited to pass.
- Gate counts: check-site-mode before 898 passed; after 1154 static, 1364 with the mobile routes, 2140 live join-only, 1696 live full (0 failed). Lint: warnings only, none in changed files. Not run: the wawuafrica jest-less node tests under `src/lib` other than the deleted `site-upload` one.
- Pictures (not in git, `build/` is ignored): `/home/user/wt/web-strip-scratch/shots/`.
- Gaps: none filed; no shared-change rows (no fenced file touched in this repo).

## Verifier report
- Round 1 addendum (lead's call, R-133 point 4, R-134): `src/lib/app-links.ts` no longer claims `/activate` or `/reset-password` (iOS AASA now lists `/r/ /selfie /receipt/ /u/ /c/ /content/` only; `UNCLAIMED_PASSWORD_PATHS` names the three password pages) and check-site-mode asserts none is claimed; assetlinks.json names no paths, so the Android claim comes from the app's own intent filters, which phones parked under R-134 keep.
