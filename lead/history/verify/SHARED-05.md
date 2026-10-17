# SHARED-05 verifier report (mobile wmt/SHARED-05 d5ee8b3, mobile only)

Verdict: merge. Nothing medium or worse.

## The two builder choices
(a) payoutAccountRoute.test.tsx lost its signed-out case: NOT a weakened test. The behaviour moved to the layout and is asserted there:
route-graph.test.tsx (real router, real root layout) lands /payout-account signed out on welcome and draws it signed in;
auth-guard.test.tsx (slow keystore: nothing drawn until the session is read) covers the "restoring" half. My own run with the REAL
route files (not stand-ins) for all 13: each lands on welcome and sends zero requests; a slow token store draws nothing, then welcome (signed out) or Settings (signed in).
(b) Settings in the (tabs) guard (also !offer.visible): acceptable. The offer is once-ever (settled the moment it is drawn, offerStep.ts), has Skip and Enter code, and never blocks;
there was no in-app path from the offer to Settings on main either (Settings is pushed from the Me menu, which is not drawn while the offer shows). Public About, Terms, Privacy policy are
reachable in every state. Needs-email: Settings is closed as SETTINGS-01 #3 (b) says, and the email step has "Later".

## Attacks (my tests, kept in scratch/shared-05-v/tests, not committed)
- 13 deep links x {signed out, email not confirmed, offer visible}: each lands on welcome / email step / offer, never the route. 39 pass.
- 3 public pages x same 3 states, readable: 9 pass. Cold start in each state opens welcome / email step / offer, never a public page: 3 pass.
- Restoring (slow token store) deep link to /settings then signed out / signed in; public page while restoring: 3 pass.
- Transitions: sign out on /settings -> welcome, Settings gone; same-account token swap keeps /settings/password open; sign-in from /terms ends on Home; offer + /settings link + Skip -> Home (link dropped).
- Theme with the REAL Appearance (fake native module, real useColorScheme; the RN jest preset stubs useColorScheme to 'light'): saved dark/light/system/nothing x phone dark/light: the first drawn
  screen reads the chosen scheme (6 pass). Slow store (4 s): nothing drawn, splash not hidden, then the right theme. Throwing store: opens, follows the phone.
  Negative control on main's layout: dark and light pins and the slow-store case fail, as they should.
- Regression: 19 suites / 334 tests (auth-guard, auth-signup, auth-sign-in, auth-welcome, session-cache, route-graph, claim, me routes, walletSettingsFlow, payoutAccountRoute) and
  38 suites / 681 tests (open-wallet, settings, profile-edit, wallet): all pass. typecheck, lint, gates (0 fail, 5 warn as on main), tasks: EXIT 0. No mobile CI exists (billing).
- No UI change (artboards: none), so no pictures. The phone itself was not run (the web build cannot pin a scheme).

## Findings (all low; sweep list)
1. Low. src/app/_layout.tsx:19-33: the theme read has no time bound, so a keystore that never answers holds the splash forever. Same exposure already exists in
   token restore (src/api/session.ts:151, same SecureStore, same render gate), so nothing new; JOIN-03's stores use a 1.5 s bound (claim/localStore.ts) if the lead wants one.
2. Low. src/__tests__/route-graph.test.tsx (theme cases, ~lines 168-226): `seenAtFirstDraw.scheme` is recorded but never asserted (the jest useColorScheme is a stub), so the test proves order
   (setColorScheme before first draw), not what the screen reads. My real-Appearance test shows it holds (RN 0.86 Appearance.js updates state synchronously). Its screens are stand-ins; the real route files are fine (see (a)).
3. Low. SHARED-CHANGES.md SETTINGS-01 #3 status cell says "signed-in group"; the guard is signedIn && !needsEmail && !offer.visible. Wording only.
4. Low, pre-existing, out of scope. 31 route files are still unlisted in _layout.tsx and so open signed out by link (wallet-settings, change-pin, reset-pin, transactions/*, bills/*, events/*,
   claim-code, tgif, schools/*, professional*, legal, c/[slug], community/[id], preview/*, dev/components). Open rows WALLET-06 R1, WALLET-04 R1 and others cover some.
5. Low, pre-existing. app.json splash backgroundColor is fixed #0B0A0D, so a Light user sees a dark native splash before the first (light) screen. Not this task's.

Checks: my tests 68 + 17 pass; 19 + 38 existing suites pass; typecheck, lint, gates, tasks EXIT 0. Servers started: none. Worktree /home/user/wt/v-shared-05-m removed.
