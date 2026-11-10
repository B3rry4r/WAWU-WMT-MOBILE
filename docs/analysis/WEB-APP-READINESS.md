# Web app readiness (WEBAPP-00)

Analysis only. Nothing in `src/` was changed. Facts for cutting the build tasks that put Who Made This on https://usewmt.com.
Phase 1 (Wed 11 Nov): the whole app works in a browser, phone layout centred on a laptop. Phase 2: a designed desktop layout.

Method. Mobile `origin/main` 446ed24 exported with `expo export --platform web` by the Hub's stack script (Hub 7dd5b22, mock WAWU ID,
Nuvion stand-in, own databases `webready_*`, ports 16000 to 16019). Chromium through Playwright, deviceScaleFactor 1, every request to a
non-local host aborted (so no real provider, no wawuafrica.com, no usewmt.com was reached). Sessions were put into localStorage for the
route walk (206 loads per user and size); the money and sign-in paths were driven through the real screens with a real sign-in.
Seeded with `prisma db seed` (3 mock users, 3 pieces, 1 room), two funded wallets from `scripts/dev/nuvion-tool.cjs seed`, one
hand-inserted event with two ticket types and one `MakerTier` row for the verified creator (stack data only).
Screenshots: `/tmp/wmt-shots/webready/` (failures, one sample per tab, and the money and frame pictures). Per-route data:
`docs/analysis/WEB-APP-READINESS-routes.csv` (2,412 rows: route, user, size, where it landed, text length, errors).

Stack limits that decide what could be run (not app faults): the mock WAWU ID has no sign-up routes (`/auth/signup/channel` and
`/auth/signup/email/start` answer 404), so the sign-up screens were NOT RUN end to end; no bills provider (`GET /bills/categories` 502);
no storage stand-in (the upload PUT goes to a host the stack blocks); the hosted selfie is off (`STACK_NUVION_LIVENESS` unset); no push,
store, microphone or video file. Chromium only: Safari and Firefox were not run.

## 1. Routes

201 route files in `src/app` (204 `.tsx` files less the two `_layout.tsx` and `+not-found.tsx`). Each was loaded cold by URL (this is
also the "refresh on any route" test). Dynamic ids: a real seeded id where one exists, otherwise a made-up uuid (events, schools,
professionals, movies, receipts have no seed data, so those routes were checked for their empty or not-found state only).
"Renders" means real text on screen, not blank and not the "Something went wrong" screen.

| User | Size | Routes | Render | Stay on the URL | Redirect (by design) | Blank | Generic error screen | Page errors | Routes with console errors | Routes with a 5xx or network failure | Routes with another 4xx |
|---|---|---|---|---|---|---|---|---|---|---|---|
| guest | 390 | 201 | 201 | 11 | 190 (to /welcome) | 0 | 0 | 0 | 2 | 0 | 2 |
| guest | 1440 | 201 | 201 | 11 | 190 | 0 | 0 | 0 | 2 | 0 | 2 |
| new, no wallet | 390 | 201 | 200 | 102 | 99 | 1 | 0 | 0 | 67 | 8 | 58 |
| new, no wallet | 1440 | 201 | 200 | 102 | 99 | 1 | 0 | 0 | 67 | 8 | 58 |
| wallet opened | 390 | 201 | 201 | 108 | 93 | 0 | 0 | 0 | 41 | 8 | 32 |
| wallet opened | 1440 | 201 | 201 | 108 | 93 | 0 | 0 | 0 | 41 | 8 | 32 |
| buyer | 390 | 201 | 200 | 102 | 99 | 1 | 0 | 0 | 66 | 8 | 57 |
| buyer | 1440 | 201 | 200 | 102 | 99 | 1 | 0 | 0 | 66 | 8 | 57 |
| creator | 390 | 201 | 200 | 115 | 86 | 1 | 0 | 0 | 69 | 8 | 60 |
| creator | 1440 | 201 | 200 | 115 | 86 | 1 | 0 | 0 | 69 | 8 | 60 |
| verified (see note) | 390 | 201 | 200 | 116 | 85 | 1 | 0 | 0 | 63 | 8 | 54 |
| verified (see note) | 1440 | 201 | 200 | 116 | 85 | 1 | 0 | 0 | 63 | 8 | 54 |

Failing routes: 0 at 390 and 0 at 1440 for the generic error screen and for page errors. One route is blank for every signed-in
person without a wallet, at both sizes: `/send/abroad/new` (the screen draws nothing when `GET /money/abroad/corridors` answers 409
`wallet_not_open`; `src/app/send/abroad/new.tsx` and `NewRecipientScreen` in `src/features/abroad/screens`; the same on a phone).
Nothing differs between 390 and 1440 in what renders: the two sizes give identical counts. The difference is layout (section 5).

- "Redirect (by design)": a signed-in person is sent from a state-carrying route that has no state (`/send/receipt`, `/send/review`,
  `/withdraw/receipt`, `/tier-done`, `/fx-receipt`, `/checkout`, `/add-money/way` and the like) to its parent, and from the signed-out
  screens (`/sign-in`, `/sign-up`, `/forgot-password`, `/email-code` ...) to Home. A guest on any signed-in route lands on `/welcome`.
  Both happen the same on a phone. The 12 `dev/*` and `preview/*` routes land on `/welcome` or Home in this build (not reachable).
- The 8 "5xx" routes per user are `GET /bills/categories` 502 (bills screens; no bills provider on the stack).
- The "other 4xx" are made-up ids (events, schools, movies filters, receipts), `409` from `GET /capital/products`, `403` from
  `GET /paid-dm/settings` for a non-creator, and `POST /me/referrals/claim` 404 for a made-up invite code. All end in a drawn
  empty or not-found state, none in the generic error screen.
- Console: the only non-request console noise on every load is the warning
  "[expo-notifications] Listening to push token changes is not yet fully supported on web" (from importing the module).
- Verified user: the creator tick could not be granted on the stack (the mock WAWU ID tick PATCH does not reach the Hub's
  `/verification/me`; the admin or purchase path was not run). "Verified" here is the seeded approved-KYC professional with a Verify
  Plus tier row. Tick-only screens were therefore NOT RUN as ticked.
- The first full walk was thrown away: the Hub's limit (20 a second, 200 a minute per IP) returned 429 on `/money/wallet` for
  parallel browsers, and a `Choose your tier` gate (below) sat in front of every route. The numbers above are the second run, each
  job with its own `X-Forwarded-For` and the tier gate setting off.

Tab samples (390 and 1440) are `/tmp/wmt-shots/webready/wallet-_tabs__*-390.png` and `-1440.png`.

## 2. Native seams on the web

Works = same as the phone. Degrades = usable with less. Breaks = the person cannot finish the task. File and line are in
`wawu-wmt-mobile` unless named.

| Seam | File | On the web | Smallest fix |
|---|---|---|---|
| Token storage | `src/api/tokenStore.ts:15-34` | WORKS but NOT SECURE. Access and refresh tokens (refresh lasts 30 days) sit in plain `localStorage` (`wawu.session.access`, `wawu.session.refresh`), readable by any script on usewmt.com. The same for every other "secure store" use (theme, send and buy intents, claim, device prefs): each has its own `onWeb` branch. A sign-in survives a reload (verified). | Keep for Phase 1. Ship no third-party script, set a strict CSP at the host. A httpOnly cookie needs WAWU ID changes (owner call). |
| Biometrics | `src/components/pin-sheet/biometric.ts`, `src/features/device-approval/store.ts:28` | DEGRADES. expo-local-authentication's web build reports no hardware, so no fingerprint or face key is offered and the PIN is the only way. | None. |
| Push | `src/features/push/PushBridge.tsx:27`, `registration.ts:114` | DEGRADES. The bridge draws nothing and registration answers `unsupported`; in-app notifications still work. Settings still draws the switches. One console warning per load. | None for Phase 1. Later: web push is a separate feature. |
| Haptics | none in `src` | N/A (never used). | |
| Camera, selfie (open wallet) | `src/features/open-wallet/selfie/capture.web.ts` | DEGRADES. No live view: a file chooser (a phone's browser opens its front camera, a laptop opens a file dialog); the photo is redrawn on a canvas and sent as a JPEG. On the stack the opening has no selfie step (hosted selfie off), so this path was NOT RUN. | None for Phase 1; word the step for a laptop. |
| Hosted selfie (when `NUVION_HOSTED_LIVENESS` is on) | `src/features/open-wallet/HostedSelfieScreen.tsx:155,177`, `src/lib/appLinks.ts:87` | BREAKS (by code, NOT RUN). The page opens with `Linking.openURL` after an awaited call (a popup blocker, and Safari, can drop it) and returns to `https://wawuafrica.com/selfie`, the website, not usewmt.com. | Web: open in the same tab, return to `https://usewmt.com/selfie`, add that origin to the Hub's `NUVION_LIVENESS_REDIRECT_ORIGINS`. T2. |
| Event door scanner | `src/features/events/door/DoorScreen.tsx`, `useDoorCamera.ts` | WORKS in a real browser by code (expo-camera has a web build with barcode scanning); the screen drew "Allow your camera". Camera not run (headless). The code can still be typed. | None. |
| Document and image pick | `open-wallet/documents/pick.web.ts`, `profile-edit/pickImage.web.ts`, `works/pickMedia.web.ts`, `create/pickFile.web.ts`, `chat/pickAttachment.web.ts`, `pro-listing/pickDocument.web.ts` | WORKS (file chooser; verified for the ID photo, proof of address and the create upload). BUT only the ID, proof and selfie pickers redraw the photo; profile photos, works, content and chat photos go up as the original `File`, with its Exif and GPS. `profile-edit/readPicked.ts` records the 8 Oct ruling that no photo carries where it was taken. | One shared canvas re-encode (as `pick.web.ts` does) used by the four pickers. T1. |
| Media upload (FormData or uri vs Blob) | `src/features/create/upload.ts:19-33`, `features/verify/voiceApi.ts:158-167` | WORKS in the page: a web `File` is a `Blob`, presign then a cross-origin XHR PUT to the bucket (the presign call and the PUT were seen). The PUT itself needs the bucket's CORS (section 4); on the stack the host is blocked, so completion is NOT RUN. No FormData upload is used except `POST /money/identity/documents` (seeded through the app's own path: works). | Bucket CORS (ops). |
| Voice recording (Voice Intro) | `src/features/verify/voiceRecorder.ts`, Hub `src/storage/dto/presign-upload.dto.ts:198` | BREAKS in Chrome and Firefox by code (NOT RUN, no microphone): the browser records WebM; the Hub's `voice/sample` folder takes only mp4, aac, mpeg and wav. Safari records mp4 and passes. | Hub adds `audio/webm` to that folder (additive; check the voice provider takes it) or the page converts to WAV. T1. |
| Audio and video players | `src/features/feed/player/index.web.tsx`, `music/themeMusic.ts`, `music/themeTrack.web.ts:2` | WORKS by code (browser `<video>` and `<audio>`; muted start when the browser refuses sound). NOT RUN: the seeded media host is blocked. The theme track is `https://wawuafrica.com/wawu-theme.mp3`, a hard dependency on the website. | Host the track on usewmt.com or confirm the website keeps it. |
| PDF reader | `src/features/feed/reader/index.web.tsx` | WORKS by code (iframe). NOT RUN. | |
| In-app purchase | `src/features/store/iap.web.ts`, `useStore.ts:60` | BREAKS for tiers, points, ticks, credit packs and community passes bought through the store (R-86): every call answers `store_unavailable` and the screens (`/tiers`, `/checkout`, `/points-buy`, `/tier-offer`) say "Buy in the app, where the store can take your payment". The wallet path for unlocks, tips, paid questions, paid DMs, tickets stays on the web (`store/testing/webPath.ts`); verified. R-44 says the web buys a tier and points through the Hub; the app code has no wallet path for them. | Owner ruling, then a wallet path to `plans/purchases` and `credits/purchase/wallet` for web builds. T2. |
| Share | about 30 `Share.share` calls (e.g. `addmoney/AddMoneyScreen.tsx:181`, `send/ReceiptScreen.tsx:66`, `content-detail/ShareSheet.tsx:91`, `me/MeScreen.tsx:176`) | DEGRADES. react-native-web calls `navigator.share`, which is missing in desktop Chrome and Firefox: the promise rejects and the screen says "Sharing isn't available on this device" (seen on Add money and the transaction receipt). Where it exists it resolves to `undefined`, and the code that reads `result.action` (`AddMoneyScreen.tsx:182`, `ShareSheet.tsx:92`) throws and shows the failure line after a good share. | One `shareText()` helper: `navigator.share` if present, else copy to the clipboard and say "Copied"; never read `result.action` on web. T1. |
| Clipboard | `open-wallet/copy.web.ts`, `wallet/fx/CryptoSendScreen.tsx` | WORKS (Add money Copy put the name on the clipboard). A browser can refuse without a tap. | None. |
| File downloads | `tgif/cardFile.web.ts`, `referral/cardPicture.web.ts`, `points/subtitleFile.web.ts`, `content-detail/ContentDetailScreen.tsx:194` | DEGRADES. Receipts are text shares (no file exists). The invite card Save and Share throw and show "could not save/share"; TGIF cards draw only the WhatsApp and Chat rows; the subtitles row is not drawn; "open the file" is `Linking.openURL` (a new tab, after awaits). | Invite card: canvas `toBlob` download for web. T1. |
| Deep links | `src/app/*` (file routes), `src/lib/appLinks.ts` | WORKS. Every app-link path exists as a route (`/r`, `/selfie`, `/activate`, `/reset-password`, `/receipt`, `/u`, `/c`, `/content`) and loads on a cold URL. BUT a signed-out visitor is sent to `/welcome` and after sign-in lands on Home, not on the link (verified with `/content/<id>`); only `/r/<code>` is remembered. `wawu://` URLs mean nothing in a browser. | Remember the return path through sign-in. T1. |
| Payment returns | `features/bills/CheckoutModal.tsx`, `add-money/way.tsx:31`, Hub `add-money-return-page.ts:13`, `payment-link.service.ts:55` | Bills BREAK (next row). Add money by bank transfer has no return step (works). Card, Apple Pay, USSD and bank-checkout rails (off at launch, R-124) open a hosted page whose return page opens `wawu://add-money/status`, dead in a browser (the status screen polls and still reads the result). Hosted payment links must return to an origin in the Hub's `CORS_ORIGIN`. | Only if those rails go on. |
| Bills payment window | `src/features/bills/CheckoutModal.tsx:4,55-66` | BREAKS. It is a `react-native-webview` holding Flutterwave's inline checkout; on the web that package renders a red "React Native WebView does not support this platform." inside the modal. | `CheckoutModal.web.tsx` that loads `https://checkout.flutterwave.com/v3.js` in the page and posts the same events. T2, needs the real sandbox (the stack has no Flutterwave). |
| Forgot password link | `src/app/reset-password.tsx`, `src/app/forgot-password.tsx` | WORKS on the app's own URL: `/reset-password?token=...&email=...` showed New password, saved, and said "Password changed" (verified against the mock). The email WAWU ID sends carries `FRONTEND_URL`, which is wawuafrica.com (section 4), so the link lands on the website, not here. | Owner/ops: decide `FRONTEND_URL`. |
| App update or store prompts | none in `src` (`expo-updates` is a dependency, unused in code); `features/about/links.ts:24` | WORKS (the About store link opens a new tab). Over-the-air updates do not exist on the web: a deploy is the update. | |
| "Not available on web" throws | none found | The only visible one is the WebView text above. | |
| PIN and amount keypads | `src/components/pin-sheet/Keypad.tsx`, the amount keypad on `/send/amount` | DEGRADES on a laptop: they take clicks and taps only. Typing `1234` into the PIN screen gave "0 of 4 digits entered". | Listen for key events on web. T2 (it is the PIN). |
| Phone-only chrome | `useSystemBack`, keyboard lift, StatusBar, `AppState` | Harmless no-ops. Browser Back and Forward work. | |
| Response headers | Hub `hub-app-config.ts:46`, app `src/api/errors.ts:101-139` | DEGRADES: the Hub exposes no response headers to a browser, so `Retry-After` is unreadable; the app falls back to the body field. | Add `exposedHeaders: ['Retry-After']` to the Hub's CORS. T1, backend. |

## 3. Money on the web (tried on the stack, Nuvion stand-in, real screens, real PIN)

| Path | Result |
|---|---|
| Open a wallet (identity check) | COMPLETES. New account: BVN and NIN, details (date, gender, state, city, agreement), ID type and number, front photo (file chooser), proof of address (file chooser), Submit. The account number came about two minutes later (webhook tick) and the "Your wallet is open" screen drew. No selfie step on this stack (hosted selfie off): the selfie path is NOT RUN. The draft lives in memory only: a refresh mid-flow restarts at BVN. |
| Create and use the PIN (`X-Transaction-Pin`) | COMPLETES. Create (enter twice) set the PIN (`pin.isSet` true). The header passed the browser's preflight; used 5 times (send, ticket, DM, unlock, card). Click-only keypad (section 2). Change PIN and Forgot PIN (a texted code) NOT RUN. |
| Add money (bank transfer) | COMPLETES. Account name, number, bank, Copy (works), Share details (says sharing is unavailable). A signed inflow webhook of ₦3,000 reached the Hub; the Home balance read ₦3,000.00. Other rails are off at launch. |
| Send to a bank | COMPLETES. Bank list, name check ("STANDIN HOLDER"), amount keypad, review (bank charge ₦25 plus WAWU fee ₦25, total ₦1,550), PIN. The screen said "Still confirming" until the 30 second webhook tick, then the transfer was `completed` (transaction detail shows reference, fees, Share receipt). The Send receipt screen is keyed by transfer id. |
| A bill | DOES NOT COMPLETE. The stack has no bills provider (`GET /bills/categories` 502, "Bills didn't load"). Independent of that, the payment window is a WebView that does not draw on the web (section 2). |
| Card screens | COMPLETES. Get virtual card (₦657.72, PIN) made a card; Details with PIN showed number, expiry and CVV on the page; Freeze and Block not run. |
| Ticket purchase | COMPLETES. Free ticket and a ₦2,000 ticket from the wallet (quote, PIN); the ticket page draws its QR. Add to calendar not run. |
| Paid DM | COMPLETES. ₦300 question: quote, PIN, thread shows "paid, held by Who Made This, 24 hours". |
| Unlock a piece (extra) | COMPLETES. ₦1,500 from the wallet, "Unlocked", balance fell by ₦1,500. |
| Tier, points, tick, credit pack | DO NOT COMPLETE on the web ("Buy in the app"). |
| Withdraw, tip, community pass, send abroad, swap, crypto | NOT RUN (the screens render). |

Sign-in through the real form worked (mock WAWU ID; V9 for sign-in), and the session survived a reload.

## 4. What the deploy needs outside the code

1. Hub `CORS_ORIGIN` (`src/hub-app-config.ts:35-46`) must list `https://usewmt.com` (exact origin; production refuses to start without a list). The same list is the redirect allow-list for hosted payment links (`src/payment-link/payment-link.service.ts:55-72`).
2. WAWU ID allowed origins: the browser calls it directly (`src/api/identity.ts:32`, base `src/api/env.ts:15`), so its CORS list needs `https://usewmt.com`. The variable is `ALLOWED_ORIGINS` in the Hub repo's stack scripts (`scripts/dev/stack.sh:463`, `scripts/local/up.sh:167`); wawu-id's own source is not on this machine, so whoever owns it confirms the name.
3. Build-time addresses: `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` are baked into the bundle (`src/api/env.ts:14-15`; the fallbacks are the live hosts). No web export script or host file exists in the repo (`package.json` has only `expo start --web`; `app.json` says `web.output: "single"`). The stack builds it with `npx expo export --platform web --output-dir <dir>`.
4. Static hosting: one `index.html`, one hashed JS file `_expo/static/js/web/entry-*.js` (8.9 MB, 2.1 MB gzipped), 32 asset files (1.4 MB). It needs a single-page fallback (every path that is not a file returns `index.html`; the stack's `scripts/dev/static-serve.cjs` does this and all 201 routes loaded cold through it), compression, long cache on the hashed files and no cache on `index.html`. The title is the same on every route ("Who Made This?").
5. Object storage CORS (set at the storage provider, not in a repo; the Hub only reads `STORAGE_*`, `src/storage/storage-client.ts`): browser PUT with `Content-Type` from `https://usewmt.com`, and reads for images and video.
6. Email links: WAWU ID writes `FRONTEND_URL` (reset password, activation, "Secure my account") and `src/lib/appLinks.ts:25-37` and `tasks/LINKS-01.md` rows W1 to W3 say it is `https://wawuafrica.com`. Those links open the website, not usewmt.com. Every shared link the app writes also uses `LINK_ORIGIN = https://wawuafrica.com` (`src/lib/appLinks.ts:25`): invites `/r`, profiles `/u`, rooms `/c`, content `/content`, receipts. The Invite screen shows `wawuafrica.com/r/<code>`.
7. Payment and selfie returns: the hosted selfie returns to `https://wawuafrica.com/selfie` and the Hub accepts only origins in `NUVION_LIVENESS_REDIRECT_ORIGINS` (`tasks/LINKS-01.md:26`); the add-money return page (`ADD_MONEY_RETURN_URL`, Hub `src/money/add-money/add-money-return-config`) opens `wawu://add-money/status`.
8. A Content Security Policy, if the host sets one, must allow the Hub, WAWU ID, the storage host, `https://checkout.flutterwave.com` (bills) and `https://wawuafrica.com` (theme track).
9. The Hub's limit is 20 a second and 200 a minute per client IP (`src/hub-throttlers.ts:10-11`; one nginx hop is trusted, `src/hub-app-options.ts:44-49`). A busy home screen makes several calls; many people behind one shared IP will hit 429. Three parallel browsers on one IP did.
10. Plan setting `tier_offer.every_start_on` defaults ON (`src/plan-settings/plan-setting-registry.ts:1741-1750` in the Hub). On the web every page load is a start, so a person with no tier sees "Choose your tier, Buy in the app" before any tab (verified on `/explore`). It does not touch the app-link routes (`/content/...`, `/profile/...`). An admin can turn it off.
11. usewmt.com has its own storage origin: nobody is signed in from wawuafrica.com, and sign-in starts fresh.

## 5. The laptop view today

At 1440 by 900 the phone layout is stretched to the full width: the Wallet balance card, the buttons, the tab bar and the welcome
buttons are each about 1,400 px wide (`wallet-_tabs__wallet-1440.png`, `guest-welcome-1440.png`). There is no max width anywhere in
the screens; only the bottom sheet caps itself (`src/components/BottomSheet.tsx:169`, `layout.screenW`).

One place for a centred phone-width frame: the root layout, `src/app/_layout.tsx` (the `RootLayout` return: `QueryClientProvider`,
`StatusBar`, `Stack`). It is a fenced shared file (WORKFLOW section 4), so the task asks through `SHARED-CHANGES.md`. On the web only,
wrap the `Stack` in a view that is `width: 100%`, `maxWidth: layout.screenW` (390 or up to 430), centred, with a page colour behind it.
A second route that touches no existing file: a new `src/app/+html.tsx` with `#root { max-width: 430px; margin: 0 auto }` and a page
colour (the stack serves `output: single`).

I tried the CSS version on the built pages at 1440 (injected style, nothing committed). Explore, Edit profile, the event pay sheet, the
tab bar and the floating button all stayed inside the frame (`frame-css-*.png`). What it does not fix: 18 files read the window size
(`useWindowDimensions` or `Dimensions`, for example `explore/ExploreSlider.tsx`, `ExploreSkeleton.tsx`, `profile-edit/PhotoPositionScreen.tsx`,
`feed/PictureViewer.tsx`, `wallet/BankSheet.tsx`, `tgif/TgifReader.tsx`, `verify/TiersScreen.tsx`); inside a frame they still read 1440,
so the slider and the photo stage size from the wrong width. The frame task has to feed them the frame's width (one shared hook) and
check each. An iframe shell that centres the app avoids all of that, but the address bar, links and refresh then belong to the parent
page and need mirroring. Recommendation: wrapper in `_layout.tsx` plus a shared width hook.

## 6. Proposed task cut

Passes are from `docs/WORKFLOW.md` section 5 by task type; the tier sets how far a verifier goes (section 4a). T0 needs V1 on the
affected files only and the lead reads the diff. A bundle holds one tier.

Phase 1 (by Wed 11 Nov; today is Mon 9 Nov, so bundles A and B first, C only for what the owner rules in)

| Bundle | Tier | Tasks | Passes |
|---|---|---|---|
| A. Ship it | T0 | WEB-HOST: an `export:web` script with the two addresses, the host's single-page fallback and cache and compression rules, title, description and favicon. WEB-OPS: the config rows of section 4 (Hub `CORS_ORIGIN`, WAWU ID `ALLOWED_ORIGINS`, bucket CORS, `tier_offer.every_start_on` decision, `FRONTEND_URL` decision). WEB-LINKS: `LINK_ORIGIN` chosen by build (needs the owner's answer on share and email links). | `setup` V1 |
| B. Phone frame and seams | T1 | WEB-FRAME (root layout plus width hook; a `SHARED-CHANGES.md` row). WEB-SHARE (one share helper, about 30 call sites). WEB-EXIF (canvas re-encode for four pickers). WEB-RETURN (return to the link after sign-in; the blank `/send/abroad/new`; a refresh inside a flow). WEB-VOICE (webm; Hub allow-list, additive). | `mobile-screen` V1 V4 V5 V6 V9 (screens, seam on the stack once per bundle); WEB-VOICE `backend-endpoint` V1 V2 V3 V4 V9 |
| C. Money on the web | T2 | WEB-PINKEYS (keyboard digits on the PIN and amount keypads). WEB-BILLS (a web checkout window; needs the Flutterwave sandbox). WEB-TIERPAY (tier, points, tick by wallet on the web, only after the owner reconciles R-86 and R-44). WEB-SELFIE (same-tab hosted selfie and return, only if hosted liveness is on in production). | `money-path` V1 V2 V3 V4 V6 V7 V8 V9, full verifier, own stack |
| D. Walk | T1 | WEB-WALK: a fresh walk of the whole app as each user type at 390 and in the 1440 frame, light and dark, on the batch head (owner hard rules 1, 5 and 6), by an agent that built none of A to C. | `flow` V1 V6 V7 V9 |

Phase 2 (after Phase 1; a designed desktop layout). There is no desktop design in `design/` today (the canvas is the phone set only), so
Phase 2 starts with a design task, then build tasks.

| Bundle | Tier | Tasks | Passes |
|---|---|---|---|
| E. Desktop design | T0 for the records, owner-signed | WEB-DESIGN: draw the desktop set. WEB-DESIGN-INV: add it to `design/canvas-inventory.json` and the brief. | none (design records) |
| F. Shell | T1 | WEB-SHELL (breakpoint, side or top navigation replacing the bottom tabs, header with search and notifications, the creator Create action, page width rules), WEB-SHEETS (sheets as centred dialogs, PIN and pay dialogs with keyboard focus), WEB-AUTH (the signed-out screens). | `component` V1 V5 V6; `flow` V1 V6 V7 V9 |
| G. Screens | T1 | WEB-HOME-EXPLORE (feed, rails, grid), WEB-CONTENT (player, details, comments side by side), WEB-INBOX (list and thread panes), WEB-ME-LIBRARY (profile, creator library as a table), WEB-EVENTS-SCHOOLS (lists, detail, ticket). | `mobile-screen` V1 V4 V5 V6 V9 |
| H. Money screens | T2 | WEB-WALLET-DESKTOP (balance, history, add, send, withdraw, cards, bills as centred flows). | `money-path` full list |

What the Phase 2 design must draw: the shell (navigation for Home, Explore, Inbox, Wallet, Me; header with search, notifications and
the creator Create action; content width and gutters from about 1024 to 1920; hover, focus and keyboard states); then the screens that
change shape most: Home feed with a side rail, Explore grid, content detail (player beside details and comments), Inbox as list and
thread panes, Wallet (balance, history, actions) with Send, Add money, Withdraw, Cards, Bills as centred flows, creator Library as a
table with Create and uploads, Profile, Settings as two columns, Events and Tickets, the signed-out screens as a split layout; and the
sheets (pay, PIN, share, pickers) as dialogs, with empty, loading and error states for each. A table needs no new product facts: it is
the same Hub data in a wider frame.
