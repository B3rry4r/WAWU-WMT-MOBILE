# WEBAPP-07 history: the full walk (9 Nov 2026)

Three Sonnet walkers on mobile ffdc271 and Hub main 7dd5b22 (brief docs/release/WALK-WEB.md). All three FAIL; the fixes are WEBAPP-08. The reports follow as the walkers wrote them (paths under /tmp are the build machine's).

---

# WEBAPP-07 walker A (arriving: guest, new user, no wallet). Mobile ffdc271, Hub 7dd5b22

Verdict: FAIL (1 SERIOUS, 4 MEDIUM, several LOW). Pictures: /tmp/wmt-shots/walk-web-a/ (165 files; 390 and 1440, light and dark).

## How it was built and served (what I changed)
- Fresh clone of the mobile repo at ffdc271, `npm ci` (real node_modules), then the vercel.json build command with
  EXPO_PUBLIC_API_URL=http://localhost:16020 EXPO_PUBLIC_ID_URL=http://localhost:16021, under `flock -o /tmp/wmt-walk-stack2.lock`.
- First build ignored the two env vars (the export still called api.wawuafrica.com): Metro's shared /tmp cache from earlier exports.
  Rebuilt with its own TMPDIR (as stack.sh does) and it baked localhost:16020/16021 only. That was MY build artifact, not an app bug,
  but it means a Vercel build (empty cache) is fine and a build machine reusing a cache could bake wrong hosts.
- Bundle check: ONE React (react.production.js once), page draws. Walker C's double-React was a hard-linked node_modules artifact
  (and probably the same shared cache); the clean `npm ci` export has one React.
- Served by my own https server (self-signed, scratch) with vercel.json's headers and rewrites; CSP changed only by swapping the two
  hosts for http://localhost:16020 and :16021. Origin https://localhost:16022. The Hub refuses http return addresses
  (NUVION_LIVENESS_REDIRECT_ORIGINS "must list https addresses"), so the web origin had to be https.
- Restarted ONLY my Hub (pid in /tmp/wmt-walk/a/hub2.pid) with the stack's own environment copied, two values changed:
  CORS_ORIGIN=http://localhost:16020,https://localhost:16022 and NUVION_LIVENESS_REDIRECT_ORIGINS=https://localhost:16022/selfie.
- Nuvion stand-in's hosted selfie page is https://verify.example.invalid/capture/<id>: I mapped it to a TLS proxy of mine (port 16032)
  in Chromium only. The stand-in page does not redirect back by itself, so after "Take my selfie" I navigated the same tab to /selfie
  (the return address the Hub handed the stand-in, checked in /__standin/liveness).
- Seeded demo content into MY database only: the Hub's prisma/seed.ts compiled in my scratch (3 people, 3 pieces, a community) and one
  published event by SQL. Media URLs in the seed (storage.seed.local) are a seed artifact, not findings.
- Browser: Playwright Chromium, fake camera/mic, proxy env removed, every non-local request aborted and logged (none were attempted).

## SERIOUS
S1. The live connection (WebSocket) is blocked by the site's CSP, on every signed-in page.
- Steps: sign in, open Home (or any page). Console on every load: `Connecting to 'ws://localhost:16020/api/hub/live' violates ... connect-src`.
- vercel.json `connect-src` lists `https://api.wawuafrica.com` only. I proved in this Chromium (test page, scratch) that
  `connect-src https://host` blocks `wss://host`, and `wss://host` in the list allows it. So on usewmt.com the app's live socket
  (`src/features/inbox/live.ts`: inbox, chats, community rooms, legal chat, unread badges) will never connect and retries forever.
- Seen: sending in a room still works (POST 201, own message shown) but nothing from other people arrives without a refresh.
- Expected: R-127 "every screen works" and live messaging as on the phone. Fix: add `wss://api.wawuafrica.com` to connect-src
  (and `https://*.digitaloceanspaces.com` is already there).

## MEDIUM
M1. Dollar-billed person sees "No tiers on sale ... Try again later" on the tier offer.
- Steps: sign up with country United States (or Nigeria but the phone could not be saved: "Another account already has that number").
  Hub /plans says currency USD; the offer screen draws only tiers the store sells, so it shows an error-style empty state with "Try again".
- Expected (R-94): a person billed in dollars is led to the tiers sheet, which says what is open. Seen: a message that says it is temporary.
  Close X works and lands on the next step, so it is passable. Pictures: su-step-p-l.png, ref-b-tier-offer0-l-d.png.
M2. Refresh in the middle of sign-up loses the form and the code step, and the cooldown then blocks restarting.
- Steps: sign up, reach "Verify your email", refresh. Back on an empty /sign-up; submitting again: "A code was just sent. Wait 0:30 before
  sending another, or enter the one we sent." but there is nowhere to enter it after the refresh. Ends after the cooldown. (Likely the same
  on the phone after a kill; LOW there, MEDIUM on web where refresh is easy.)
M3. Refresh inside Open your wallet loses the collected ID photos.
- Steps: complete BVN/NIN, details, ID photos, then refresh on the address step: "Add your ID first / Go back and take the photos of your ID."
  Handled with a message (no crash). Within one session the whole opening, hosted selfie and PIN works.
M4. The site CSP `media-src` omits `https://*.amazonaws.com` while `img-src` and WEB-DEPLOY name Amazon S3 "for pictures and video".
- A video/audio file served from an S3 URL would be blocked (images are not). Not reachable on the stack (seed host), so unproven; check
  where the bucket really serves media from.

## LOW
- L1. Console 4xx on first paint for a person without a wallet: 409 on /money/wallet/balance, /money/cards, /money/abroad/corridors,
  /money/recipients/recent; 404 on /users/<plain user>/visitor-profile ("This profile is not available" screen is fine). Noise only.
- L2. A 401 on POST /money/identity/liveness once on the selfie return (session refresh), then success.
- L3. Sign-up form on the web has First/Last name, Username, Country (board A3 draws email, phone, password); account-type step comes first.
  Looks like later rulings than the board; flag only.
- L4. Terms text says "website (wawuafrica.com)" on usewmt.com (content, owner's).
- L5. The floating play button (theme song) sits over the right edge of cards (Wallet "Who Made This? card" chevron, Explore last row).
- L6. Welcome screen is dark in light mode (probably by design).

## Passed (checked and fine)
- Cold start and refresh on /, every tab and deep link signed out -> /welcome; `/r/<code>` and `/join` signed out -> welcome, code kept,
  claimed after sign-up (Brought count went up for the inviter); signed-in /r/<code> and /join -> Home.
- Shared link signed out -> sign in -> lands back on the piece (after closing the tier offer); refresh keeps it.
- Sign-up through WAWU ID with the mailed code typed on the keyboard; onboarding (tier offer with close X, interests, follows, Home);
  tier offer shown once per browser session (not on refresh); shows again in a new session until onboarding is done.
- Explore, search (results, none, recent after refresh), piece, creator profile, community (join, send text, Buy credits sheet), event.
- Settings: 7 notification switches PATCH and persist after refresh; Privacy, Password, Your tier, Access code, Wallet and PIN, TGIF,
  Legal, Blocked all open; invite card has only Share (no dead Save). Share on a piece (Copy link -> "Copied"/"Link copied", clipboard
  correct), on a creator profile ("Link copied"), invite card. Terms and Privacy open signed out and signed in.
- `/send/abroad/new` and `/send`, `/add-money` without a wallet -> Open your wallet (dollar person) ; Wallet tab before opening goes to
  the BVN step; after opening: wallet, accounts, add money details, transactions all load.
- Open a wallet from a fresh account: BVN/NIN, details, ID photos (file chooser), proof of address, hosted selfie leaves in the SAME tab
  (one page) and the return to /selfie lands on "Selfie done"; account number appeared; PIN typed on the keyboard (twice), the PIN never in
  page text or HTML; Home then shows the wallet.
- Sign out (one tap) and back in: wrong password message, right one lands on the earlier deep link (/wallet).
- No CSP violation other than S1 (and seed media). No request left localhost.

## NOT RUN
- Share on a receipt (no transaction without funding: walker B's). The Studio "subtitles" row (needs points and a file; not reached).
- Every picture individually: 165 taken; about 30 looked at one by one, the rest checked by page text and the console log; 390 pictures
  compared with boards for A3, A30, W1, H24 only.
- Safari and Firefox; a real phone browser for the hosted selfie (PHONE CHECK); the deployed Hub's real CORS and the real bucket.

---

# WEBAPP-07 walker B (money) - findings as found
Code: mobile ffdc271 (worktree /home/user/wt/walk-b), Hub 7dd5b22, stack walkb ports 16040-16045, my header server on 16043 (vercel.json headers, CSP with stack addresses).
Users: Bola (funded NGN 50,000, PIN 4829), Chidi (NGN 1,000, PIN 1357), both signed up through WAWU ID, wallets seeded by nuvion-tool.

## SERIOUS-1: every web wallet purchase (tier, points, credits, pass, extra products) is a dead button in the export
Steps: sign in as Bola (wallet holder, NGN 50,000) on the stack's web export (390x844, also tried without my headers). /tier-offer, Subscribe to Verify, /checkout, tap "Buy - N2,999". Same on /points-buy (tap Buy). Also by keyboard Enter and a raw mouse click.
Seen: nothing happens. No pay sheet, no quote request, no network call at all, no console error. Pictures: 10-tier-click.png, 11-pin-sheet.png, 15-pay-sheet.png.
Cause (read from the shipped bundle, entry-*.js): module for `src/features/store/webwallet/useWebBuy` is the phone stub `useWebBuy.ts` (INERT: `begin: () => {}`, `sheets: null`), not `useWebBuy.web.tsx`. Metro resolves the `.ts` sibling before the `.web.tsx` one. The string "nothing to buy" and askWebQuote's quote route are not in the bundle. It is the only `*.web.tsx` with a same-named `.ts` sibling (the 17 others are `.web.ts` over `.ts`, or tsx over tsx, and work).
Expected: R-128, WEBAPP-06: the web pays a tier, points, credits and a pass from the wallet with the PIN.
Impact: nothing R-128 built is reachable on usewmt.com; jest passes because jest resolves differently. `npm run web:export` is the same command as the stack's, so the deploy will be the same.
Fix idea (not done, read only): rename the web file so no `.ts` sibling shares its name (for example useWebBuy.web.ts{x} -> useWebBuy.web.tsx with the stub renamed useWebBuy.native.ts, or make the stub `useWebBuy.native.ts`), then re-export and grep the bundle for "nothing to buy".
After this, the rest of the purchase checks were run on a scratch export in which only `useWebBuy.ts` was deleted (copy in /tmp/wmt-walk/b/fix, not the worktree): see below.

(After SERIOUS-1: everything below ran on a scratch export in /tmp/wmt-walk/b/dist-fix, built from a copy of ffdc271 with only `useWebBuy.ts` deleted, served on the stack's web port with vercel.json's headers. The Hub, Nuvion stand-in and WAWU ID are the stack's own. Pictures in /tmp/wmt-shots/walk-web-b/, boards in art/, board pairs pair-*.png.)

## MEDIUM-1: the live socket is blocked by the page's Content-Security-Policy
Steps: sign in, open any page that connects (Community room, Wallet, Me, Home) at 390 or 1440, console.
Seen (every user, every run): `Connecting to 'ws://localhost:16040/api/hub/live' violates the following Content Security Policy directive: "connect-src 'self' data: blob: http://localhost:16040 http://localhost:16041 https://*.digitaloceanspaces.com https://fastly.jsdelivr.net"`. The page's rule lists the Hub as `https://api.wawuafrica.com`; per CSP3 a source with scheme https matches https requests only, not `wss://`, so on usewmt.com `wss://api.wawuafrica.com/api/hub/live` is blocked the same way (the stack's http source blocking ws is the same rule; not proven against the real host).
Expected: WEB-DEPLOY section 4 says the CSP allows the Hub; the live socket is a Hub call.
Fix idea: add `wss://api.wawuafrica.com` to connect-src in vercel.json.
Other CSP lines seen were stack-only: images from the storage stand-in (127.0.0.1:16051) are refused because the real CSP names Spaces/S3; not a finding.

## MEDIUM-2: "Add" on the pay sheet leaves the sheet open on top of the Add money page
Steps: Dayo (wallet N1,500) /checkout?kind=tier&tier=verify, Buy, "Not enough in your Naira wallet", tap "Add N1,499".
Seen: the route moves to /add-money?short=149900 but the pay sheet (shortfall, Add, Cancel) stays up over it and hides the account number; Cancel is needed first. Picture 41-short-add.png (beside 40-short-light.png). Expected (task WEBAPP-06 F1): Add takes the person to the account details to finish.

## MEDIUM-3: after buying WAWU Credits in a community room the room still says 0 credits
Steps: Bola in an open room with 0 credits, "Buy credits", 120 credits, PIN. Wallet -N1,000 once, Hub says 120 credits.
Seen: the success sheet says "120 credits added" and "You have 0 credits."; behind it the header says "0 credits" and "You're out of credits" stays. A refresh shows 120. Pictures 38-credits-done.png, 39-after-credits-refresh.png. Expected: I29 "Credits added" shows the new balance.

## LOW
- Upgrade page text "The store works out what moving up costs." on /tiers (web has no store; wording from the phone). Picture 51-tiers.png.
- Enter in the community message box does not send on the web (the Send button does). 34-sent.png.
- Second tab paying for a tier already paid in tab 1 reads "A payment for this is still being confirmed. Check your wallet activity before you pay again." (Hub 409); the tier was already granted. 50-tabs-tab2.png.
- The floating play button (theme song) sits over the card row and "See all" on the 390 Wallet. m_wallet-390-l.png vs board W1.
- "Founding +10%" chip on /points-buy is unreadable in dark mode. 97-pin-1440-d.png.
- A failed bank send shows three history rows (the failed transfer, "WAWU's fee" -N25 and "WAWU's fee given back" +N25); net zero.
- Chrome console warning on every tier purchase: Animated useNativeDriver is not supported (web fallback).
- Unrelated to money: after real sign-in a fresh account lands on /tier-offer once, then after a refresh on /interests (onboarding order differs); Walker A's area.

## What passed (evidence in the stack's ledger and the Nuvion stand-in's balance, not the screen)
Fee quotes read from the Hub (WAWU transfer: provider 0 + WAWU N10; bank: N25 + N25) equal the screen. Reconciliation at the end: sum of each person's Hub transactions = Hub balance = stand-in balance (Bola 22 rows, Chidi 7, Dayo 5; `recon.js`).
- Send to a WAWU person: double tap = one POST, one debit (N1,510), recipient +N1,500, operating account +N10. Send to a bank: one POST, N1,050 out, +N25 to operating; after the stand-in failed it, the Hub reversed all N550 (fee included) and balance equals the stand-in; replayed `outflows.failed` x2 and a late `outflows.completed` changed nothing.
- PIN typed on the keyboard (digits, Backspace, Enter swallowed, letters ignored): no input element, PIN not in the page text, DOM, URL, request body, console, localStorage, sessionStorage or cookie; it travels only as X-Transaction-Pin. Five wrong PINs: "4 tries left" down to "PIN locked, try again in 29:58", no sixth request; Forgot PIN: the mailed code and a new PIN unlocked it (triesLeft 5). Card: Get virtual card with PIN (-N657.72), Details with PIN shows the card, Freeze works.
- Purchases from the wallet at list price with PIN (scratch export): points pack (-N2,500, +2,750 points), tier Verify (-N2,999), upgrade to Founding (-N7,000 the difference), community pass (-N2,000, host +N1,700 now, operating +N300), WAWU Credits (-N1,000, 120 credits), paid DM (-N500 held in the operating account until answered; after the reply the host's earning waits for the daily payout, known), ticket (-N1,500, one ticket), paid piece (-N700, purchase row). Each: wallet moved once, thing granted once. Prices in the sheet equal GET /plans, /credits/packs, the pass and ticket prices.
- Shortfall: "Not enough in your Naira wallet, This costs N2,999. You have N1,500.00, Top up at least N1,499, Add N1,499" (see MEDIUM-2 for the Add step). Add money is bank-transfer details only (card, Apple Pay, USSD off, R-124); an inflow of N2,000 and N4,000 credited once each, three replays of the same event credited nothing more.
- V8 on the Hub's routes: same Idempotency-Key twice = one debit and the same answer (transfer, points pack, credits, ticket pay); parallel x5 same key = one 201, rest 409; same key other body = 409 idempotency_key_reused; no key = 400; wrong expectedTotal or forged quoteToken = 409 quote_changed; no PIN = 403. Two tabs paying for the Verify tier at once: one charge. Response lost on the wire (connection reset after the server took it): UI says "We didn't get an answer. Try again: it will only happen once."; retrying used the same key and charged once. A purchase held pending: payer debited at once, nothing granted, a second try 409 "still confirming"; when the stand-in failed it the money came back and no points were granted. Forged webhook (no signature, wrong signature, stale timestamp): 401 each.
- Bills: no entry anywhere (Home, Wallet, Explore, Me, Inbox, Wallet settings, Transactions, Search, Settings); every /bills/* deep link (index, airtime, data, electricity, cable, items, number, review, receipt/abc) lands on Home: no dead or blank page.
- 1440 x 900: the phone column is centred, sheets stay inside it, no horizontal scroll on any of 20 pages. Boards compared at 390: H15, H17, I27 to I30, PT4, VF6, W1, W7 to W10 (pairs pair-*.png); differences are the web's recorded ones (no Dollar/Crypto tabs, no biometrics).

---

# WEBAPP-07 walker C: making (creator, verified). Walked 9 Nov 2026
Code: mobile ffdc271 (wmt/BATCH-WEBAPP1), Hub main 7dd5b22. Stack walkc, ports 16060-16069 (+16070 storage stand-in, 16071 mail stand-in).

## How it was walked (what I changed on the stack)
- The stack's own mobile export (hard-linked node_modules from STACK_NM_MOBILE) bundles React twice (modules 14 and 820) and every page is blank
  (TypeError reading useSyncExternalStore of null; the ErrorScreen crashes too). Same code exported with node_modules a symlink to the lead's
  node_modules gives one React and works. Stack artifact, NOT an app finding. I walked the symlinked export (/tmp/wmt-walk/c/dist3, same code, same
  EXPO_PUBLIC_* the stack uses). Other walkers using STACK_NM_MOBILE will meet the blank page (note left in /tmp/wmt-walk/NOTE-from-walker-c.txt).
- The browser opens `https://usewmt.com` (routed to my export by Playwright, with vercel.json's headers; CSP changed only by api/id -> http://localhost:16060/16061
  plus the storage stand-in http://127.0.0.1:16070 added to connect-src, img-src, media-src; nothing else). Every non-local host is aborted and logged.
  Chromium run with --disable-features=LocalNetworkAccessChecks (a public https page may not call loopback otherwise; real usewmt -> public api is unaffected).
- Hosted selfie: the Hub only accepts https return addresses, so http://localhost:16063 cannot be listed. I restarted only my own Hub (kill 5509, same env,
  same command) with TWO settings changed: NUVION_LIVENESS_REDIRECT_ORIGINS = `https://wawuafrica.com/selfie,https://usewmt.com` (was the first only) and
  CORS_ORIGIN = `http://localhost:16060,http://localhost:16063,https://usewmt.com` (was the first two; needed so the usewmt.com page may call the Hub, as WEB-DEPLOY step 3 says).
  Nothing else changed.

## Findings

### SERIOUS-1. Every web wallet purchase button is dead: tier, points, credits, pass (WEBAPP-06 / R-128)
Steps: sign in as a creator with a funded wallet and a PIN, Create > Content > Image > upload (402 "needs a tier") > /tiers > pick Verify > Continue > /checkout > tap "Buy · ₦2,999".
Expected (R-128, WEBAPP-06): pay sheet with the quote, then the PIN, wallet debited once, tier granted. Seen: nothing at all. No request leaves the page (Playwright request log empty
after the tap), no sheet, no message, no console error; calling the button's onClick by hand does nothing either. Pictures: checkout-click.png, checkout-pin.png.
Cause (read from the code and the bundle, not guessed): `src/features/store/webwallet/` holds `useWebBuy.ts` (the inert phone version) beside `useWebBuy.web.tsx` (the live web one).
Metro tries `.ts` before `.tsx`, so `useWebBuy.web.tsx` is never picked: the string "nothing to buy" (only in the .web.tsx) is absent from the export, and `begin` is the inert `() => undefined`.
It is the only `.ts` + `.web.tsx` pair in src. "WEBAPP-06 fix 3: split the web wallet hook by platform" created it. Fix: give both files the same extension (`useWebBuy.web.ts`/`.ts` or `.web.tsx`/`.tsx`).
Effect: a creator with no tier can never publish on the web (upload says "needs a tier" and the only way to get one is this button); points, WAWU Credits packs and community passes bought on the web are equally dead.
Workaround used to continue the walk (stated plainly): the tier "Verify" (₦2,999) was bought for walker C's creator by calling the Hub's own routes with the PIN
(GET /plans/purchases/quote, POST /plans/purchases, Idempotency-Key, X-Transaction-Pin), after a real sign-in. Everything after this was walked with the tier held.

### MEDIUM-1. The CSP blocks the live WebSocket, so messages and badges do not arrive live
Steps: sign in, open any page; the console shows on every page load: "Connecting to 'ws://localhost:16060/api/hub/live' violates ... connect-src". On the real site the same:
`connect-src` lists `https://api.wawuafrica.com` which does not cover `wss://api.wawuafrica.com/api/hub/live` (a host source with scheme https matches https only).
Expected (src/features/inbox/live.ts, LIVE.md): socket for inbox, chat, room messages, unread. Seen: blocked on every load, so those only update on a reload (reconnect loop retries and is blocked each time).
Fix: add `wss://api.wawuafrica.com` to connect-src in vercel.json. (WEB-DEPLOY's CSP paragraph does not list it either.)

### LOW-1. A cold deep link to `/me` (any non-link route) lands on Home after the tier offer is closed
Steps: new browser context, signed in with no tier, open https://usewmt.com/me. The tier offer opens; Close lands on Home, not on /me. Expected: the page asked for.

(The Join button of a paid community (R-128 community pass) is dead for the same reason: c3 opened /c/rooftop-makers, tapped "Join · ₦1,000", no request, nothing happens.
The "Upgrade instead" button on the 4 of 4 limit sheet and /tiers "Upgrade" lead to the same dead checkout.)

### MEDIUM-2. Web copy still talks about "the store" (R-128: the web pays from the wallet)
/tiers (signed in with a tier): "You're on Verify until 9 Nov 2027. The store works out what moving up costs..." and /verification: "Move up a tier: The store works out what moving up costs".
Expected on the web: wallet wording (R-128). Pictures: r390-tiers.png, verification-1.png. There is no store on usewmt.com.

### MEDIUM-3. "Take something down to make room" and "You can edit it while it waits" promise actions that no screen offers
Steps: use all 4 uploads (Verify tier), open Create. Banner "Your 4 uploads are used. Take something down to make room for a new one. [Open library]". In My content only a Rejected piece opens
(`LibraryScreen.tsx` PieceRow: "Only a turned-down piece opens something"); live and in-review rows do nothing, and a live piece's own page (/content/<id> as its owner) has no edit, delete or take-down.
So a creator with four live pieces has no way to make room except Upgrade (dead on the web, SERIOUS-1). The review screen also says "You can edit it while it waits": there is no screen for that.
Same on the phone by code (R-47 comments), listed because the web has no other door. Pictures: fifth-upload.png, library-1.png, video-review.png.

### LOW
- LOW-1 above (deep link to /me after the tier offer lands on Home).
- Video files go up untouched: the stored MP4 is byte-identical to the file and keeps its `location` tag (+06.4542+003.3925). Photos are clean (below). R "no photo carries where it was taken" is about photos; flagged in case video is meant too.
- Profile content grid (Me and another person's profile, 390 and 1440): tiles sit flush against the left edge of the column with no side gutter and only two of three columns filled (l1440-me.png, v4-profile-2pieces.png).
- Wizard refresh: a refresh on /create-upload, /create-details, /create-preview or /create-price returns to /create-format (the draft lives in memory). A refresh on /create-review goes to /create.
- Cold start with an access token older than 15 minutes shows 2 to 3 red 401 lines in the console (GET /auth/signup/progress, GET /money/wallet, POST /auth/refresh) before the refresh succeeds. Same with a revoked session on /sign-in.
- Console on every upload: warning "expo-file-system is not supported on web". On every page: "[expo-notifications] Listening to push token changes..." (known).
- add-work Save lands on Home when the page was opened cold (no history) instead of My works/profile.
- The create-limit pages call GET /plans/purchases/quote?kind=extra_products on every load and the Hub answers 409 pack_not_allowed (a red console line on /create-format at the limit). The screen copes.
- Voice Intro: the first one is free ("firstVoiceIntroIncluded"); a second costs 200 points and a creator with 100 sees "You don't have enough points for this" (correct, noted as seen).

## What passed (walked, pictures looked at)
- Become a creator: welcome > Create an account > "I want to earn" > sign-up through WAWU ID (mailed code read from the mail stand-in) > tier offer (Close) > Set up your account (A11) > Home.
- Profile photo (JPEG with Make, Model, GPS): stored object has no Exif, no GPS (readback.sh). Cover for a piece, event banner, community picture, a work: each read back from the storage stand-in: no Exif, no GPS.
- Piece upload (image, photo with GPS): stored `content/full/...jpg` re-encoded, no Exif/GPS. Paid piece at ₦2,500 ("You earn ₦2,125", 85%); Free piece through the Paid/Free tab (R-8): stored accessType free, price 0. Another account (c3) saw ₦2,500 and the Unlock sheet, and the free one with "Download / Tip".
- Voice Intro recording in Chromium (fake mic): stored `voice/sample/...wav` = PCM s16le, 22,050 Hz, mono, 30.1 s, 1.33 MB (WEBAPP-04). (Needs AI_VOICE_* on the Hub: see "what I changed".)
- Limits: Products 4 of 4 on Verify; Create shows "Your 4 uploads are used" and the limit sheet (MEDIUM-3). No storage-in-GB line is drawn anywhere I could find (NOT RUN: storage line).
- My uploads: In review / Live / Rejected filters, edit details of a rejected piece (price to Free, cover from a GPS photo), Send again, delete (piece goes to `removed`, "Delete this piece?" confirm).
- Hosted selfie: Open your wallet > ... > Selfie step "Continue to secure page" leaves on the same tab to the (stand-in) hosted page, the Hub handed Nuvion `redirect_url = https://usewmt.com/selfie` (read from the stand-in's session list), "Take my selfie" approved,
  then the same tab opened https://usewmt.com/selfie and landed on the Selfie done screen. The stand-in page does not redirect by itself, so the redirect hop was done by me navigating the same tab to /selfie. Account number arrived after about two minutes, funded by a signed inflow webhook (nuvion-tool fire), PIN created with the keyboard (4829) and accepted.
- Verified-only: Host an event with a tier held (basics, when and where with pickers, banner, ticket type ₦2,500 x 50, Send for review); a buyer without a tier sees "Hosting needs a tier. See tiers"; after approval a second account sees the event with the ticket at ₦2,500.
- Earnings: c3 (funded, PIN typed on the keyboard) unlocked the piece for ₦2,500 (wallet 20,000 to 17,500, once); the creator's wallet went 47,001.00 to 49,126.00 (85%, about one minute later) and /earnings shows ₦2,125 under Unlocks.
- Paid questions: creator set ₦500 (earns ₦425), c3 asked from the profile (pay sheet, PIN), creator answered in Inbox > Paid DMs, the thread says answered and "₦425 is on its way to your wallet. Earnings reach your wallet once a day." Earnings page shows ₦2,550 total.
- Community as owner: created a private community at ₦1,000 with a cover, link shown as usewmt.com/c/rooftop-makers, posted a message as host (appears at once). A second account sees the join page (price ₦1,000 for 30 days) but cannot join (SERIOUS-1).
- Second account (c3) saw the same price, title, pieces, services tab ("Paid messages ₦500 a message") and works on the creator's profile (V4).
- Console and network over every creator page: no page error, no foreign host, no CSP violation except the WebSocket (MEDIUM-1). Pages swept cold at 1440 light (16), 390 dark (15), 390 light refresh/deep links (10); every one drew text and stayed on its URL except the wizard steps.

## NOT RUN
- The "Face does not match" and "Camera problem" selfie results, and a refresh while on the hosted page.
- A tick purchase and every wallet purchase through the app's own button (dead, SERIOUS-1): tier, tick, points, credits, community pass. The tier was bought by a direct Hub call (see above); the community join, points and credits were not completed.
- Admin approval: pieces, the event and a rejection were moved with direct updates to this stack's own Hub database (ContentPiece.status live/rejected, Event.status published) because no admin session exists on the stack. A rejection made that way does not return the creator's slot, so
  "Uploads 3 of 4 used" after Send again and 4 of 4 after the delete are artifacts of that, not findings.
- Live socket delivery of chat and paid answers (blocked by MEDIUM-1; each page was read after a fresh load).
- A creator-owned video's preview in the viewer, a PDF/audio/course piece, the storage GB line, other browsers.
- Daily payout of paid DM earnings (copy says once a day; the unlock earnings landed in about a minute).

## Harness notes (not app findings)
- My first video upload stored 0 bytes: the Playwright route I used to add the bucket's CORS headers (route.fetch) drops a File request body. I replaced it with a small CORS proxy (127.0.0.1:16073, headers as WEB-DEPLOY step 3 asks) and re-ran; the stored video is byte-identical to the source. Earlier image/voice readbacks were valid (non-empty, decoded).
- Concurrent runs on one saved session consumed its rotating refresh token once and signed the creator out; I signed back in through the real sign-in screen.
- Tokens were read from my own scratch only to call the Hub's tier purchase and the seed tool for the buyer's funded wallet (nuvion-tool seed with the buyer's real sign-in token); never typed into the app.
