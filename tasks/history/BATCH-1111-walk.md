# BATCH-1111 walk (wmt/BATCH-1111 ac738fc3)

Verdict: PASS, with one owner check before the deploy (M1). Walker built none of it and fixed nothing.

Stack: Hub = origin/main cb9a037 (worktree), wawu-id main, Nuvion stand-in, storage, voice/AI and mail stand-ins; ports 16400-16412; databases walk1111_*. Export built by stack.sh (own Metro cache); it holds `install-overlay` (_layout chunk), `wmt.invalid/session-open` (__common chunk and wmt-sw.js), `your-tier-renew` and the Studio strings (Talking photo, Split a song). Served on :16403 behind vercel.json's headers (CSP: two api hosts swapped for the stack, storage stand-in added). 12 `ai.listed.*` switches and `ai.podcast_studio_api_ok` set to 1 in this stack only. Accounts: Bola (buyer, N500,000 wallet), Chidi (Verify bought through POST /plans/purchases, tick by SQL, wallet), Dayo. Made by API or SQL, not buttons: accounts (wawu-id register, email_verified by SQL), handles, 3 picture pieces (API upload, set live by SQL), tier dates.

## Findings
- M1 (owner check, not a code fault): the picture worker keeps a picture only if the picture host answers its fetch with CORS (`mode: cors`). The stock storage stand-in sends none: then every visit hit the host 4 times for 2 pictures and nothing was kept (the worker falls back quietly, pictures still show). With CORS added to a scratch copy of the stand-in: cold 2 host requests, second and third visit 0. Real Spaces must allow GET from https://usewmt.com (WEBAPP-12 already lists real Spaces CORS as NOT RUN).
- L1: loading with a saved but expired sign-in logs two 401 console errors (GET auth/signup/progress, GET money/wallet) before the app refreshes; nothing shows on screen.
- L2: Studio More at 375x667 shows 11 rows and the last needs a scroll (chevron shown, as designed).
- NOT A DEFECT, stand-in gap: "Make it a piece. Into Create" answered 503 (Hub log: "Could not copy a result into content: S3 aborted request"); the storage stand-in has no CopyObject. The app showed its own "We couldn't open it in Create" message. NOT RUN.

## Passed
1. Install (Chromium, user agents set, vs real display-mode via init script because CDP emulation did not take): Android offer (synthetic beforeinstallprompt, headless Chromium fires none): Install calls prompt, accepted and cancelled both land on the app, Continue lands on it; Android with no offer: steps card; computer with offer: Install at 1440; computer with no offer and Firefox: app at once, no blank; iPhone steps, Instagram "Open this link in Safari" with Copy link, light and dark; standalone (navigator.standalone, matchMedia) shows no screen. Deep links /join and /r/CODE as a guest land on /welcome after Continue (as in earlier walks).
2. Pictures: tab sign-out: both tabs on /welcome, picture cache 0 entries. Offline: Wallet, Inbox and Explore (unvisited routes) show "Something went wrong" with Try again and Go to Home.
3. Studio: home and More at 375x667, 390x844, 1440x900 (dark too): 4 grid tools plus 11 rows; the API lists all 12 new tools enabled. Image failure ([[fail]]): hold -100, release +100, balance 100. Image success: hold -100 kept; lots 0 = ledger sum 0 = Studio shows 0 ("100 points used, 0 left").
4. Tier (Chidi, dates set in the stack): Verify mid-year: Upgrade, no Renew; ending (3 days) and ended: Renew and Upgrade; Founding Maker active: no buy button. 390 and 1440, light and dark.
5. Smoke: sign-in and sign-out through the buttons; Bola unlocked Walk piece 1 (N1,500) with the PIN: one POST, wallet N498,500 = Hub 49,850,000 kobo = stand-in 49,850,000; Chidi Me and My content show 3 of 25 and 3 live pieces (one with 1 sale).

## NOT RUN
New-user sign-up with the mailed code; upload and publish through the buttons; double tap on Make; Studio tools other than Image (and any Studio failure through the buttons); Studio picture into Create; paid message or ticket; signed-in deep link after Continue; Home/Explore pictures of Explore (it shows people cards only); real beforeinstallprompt, real Spaces CORS, a phone.

Pictures: /tmp/wmt-shots/walk-1111/ (in-*, pic-*, offline-*, studio-*, tier-*, pay-*, me-*).
