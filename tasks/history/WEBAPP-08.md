# WEBAPP-08 history: builder report (9 Nov 2026)

Branch `wmt/WEBAPP-08` from `wmt/BATCH-WEBAPP1` a9fe042. Stack fix08 (ports 16020 to 16031), Hub main 7dd5b22 unchanged, no Hub code changed. Pictures: /tmp/wmt-shots/webapp-08/ (boards in boards/).

## Rows
- **F1 done.** `useWebBuy.ts` renamed `useWebBuy.tsx` (inert phone file), beside `useWebBuy.web.tsx`: same extension for both, so Metro has no `.ts` to prefer. (`.native.ts` was not chosen: Metro does not look for `.native` on web, and the existing 18 platform pairs all use one extension.) Guard `src/__tests__/platformPairs.test.ts`: every `x.web|native|ios|android.<ext>` in `src` must share its extension with any plain `x.*` beside it; it fails on the old layout (checked by re-creating `useWebBuy.ts`). Export: `nothing to buy` is in `entry-*.js` (it was absent). Walked through the app's own buttons as a wallet holder with the PIN, double tap on the pay button each time: tier Verify (-N2,999, one POST), upgrade to Founding (-N7,000, the difference, one POST), points pack (-N2,500, +2,750 points), credits pack (-N1,000, 120 credits), community pass x2 (-N1,000 each), and again as a second person (tier). Hub ledger rows = stand-in transfers = 7 debits of 299,900, 250,000, 700,000 and 4 x 100,000; Hub balance 3,350,100 = stand-in 3,350,100. Replays with the same Idempotency-Key and body (points, upgrade, pass, credits; credits through a fresh quote): same answer, balance delta 0. A "tick" is the tier purchase on the web (Your tier / Verification lead to /tiers): same route as the tier, covered. Phone jest unchanged.
- **F2 done.** `wss://api.wawuafrica.com` in `connect-src` (`vercel.json`), asserted in `webCsp.test.ts`, said in `docs/WEB-DEPLOY.md`. Behind the headers (hosts swapped to the stack, `ws://localhost:16020`) the socket opens (`ws://localhost:16020/api/hub/live`, no CSP violation) and a room message from a second person (posted through the Hub as that person) appeared with no refresh.
- **F3 done.** Found: the Hub's bucket is DigitalOcean Spaces (`wawu` in SFO3, `deploy/README.md`), already covered by `https://*.digitaloceanspaces.com`. The only other video played in the app is the movie partner's trailer file (`TrailerScreen`, url passed through from Flixora, whose pictures are on `flixora-...amazonaws.com`). `media-src` now also has `https://*.amazonaws.com`. The trailer host itself was never recorded (only the posters'), so that part is unproven.
- **F4 done (web).** A person billed in dollars sees the tiers sheet's own words ("Buying is not open yet") and a "See the tiers" button that closes the offer and opens /tiers; the X stays. The phone keeps its screen (a phone's offer comes from the store, so it is not empty for this person). Walked with a US sign-up.
- **F5 done (web), partly not reproduced.** A refresh ON the code step already resumed in this build (3 tries, also after 40 s, also a US number and a number another account holds). What reproduced: Back from the code step, then refresh on /sign-up: empty form, no link to the sent code, cooldown blocks. Now the tab's session storage keeps the typed details (never the password, never the tick) and the link "Enter the code we sent" returns after a refresh; cleared when the code is confirmed. Walked.
- **F6 ruled by the lead, no change.**
- **F7 done (web purchase pay sheet).** Add closes the sheet then goes to Add money (walked: /add-money?short=..., account number visible, no sheet). Other pay sheets (tips, unlock, ask, send) have the same Add and a Modal on the phone too; not changed, because several of them use Cancel to leave the screen (the send review). For the lead.
- **F8 done.** The web hook did not read the Hub again after a grant (only the phone path did). It now does when the Hub says paid; the "Credits added" line waits for the fresh count. Walked: "120 credits added, You have 120 credits", header 120.
- **F9 done (web).** /tiers and /verification say "You pay the difference from your wallet" on the web; the phone keeps its words.
- **F10 done (web).** The address a page load opened on is kept and the tier offer's bridge returns to it once the offer is closed. Walked: cold /me, close the offer, lands on /me.
- **F11 done (web, room box).** Enter sends, Shift+Enter makes a new line (not while an input method is composing). Walked. The chat box is a different component and was not touched.
- **F12 ruled, no change.** Board M1 draws the grid edge to edge, 3 across, 4 apart; the built Me screen matches it at 390 and 1440 with 7 pieces (pictures me-grid-*). With two pieces two of three columns are filled by design.
- **F13 done.** New pill tone `accentReadable` (accent tint, `accentFg` ink: the same colour in light, readable in dark) used by the Founding chip. The shared `accent` tone is unchanged (a test pins it). Picture points-buy-390-d.
- **F14 ruled, no change.** At scroll end the last row clears the button at 390 and 1440 (explore-bottom, wallet pictures); at the top the button covers a card row's chevron but the row stays tappable on its left and scrolls clear. No code.
- **F15 done.** add-work Save with no history lands on the person's own works (`/works/<wawuId>`); with history it goes back as before.
- **F16 report only.** The phone does the same: photos are redrawn in the app (`redrawPhoto`), a video file is sent as it is, so its `location` tag goes up on both. Smallest fix: the Hub strips metadata from a video after upload (`ffmpeg -map_metadata -1 -c copy`) before it is served; no app change.

## Tests changed or added
Added: platformPairs, webCsp (3), seeTiers (2), seeTiersStep, returnPathCold (3), signupDraft (2), webWallet F7 (1). Edited: a comment in webWallet.test.tsx; no assertion changed.

## Checks
`npm run check` EXIT 0 (typecheck, lint 0 errors, jest 518 suites, gates 0 fail, tasks).

## NOT RUN
Pictures at 1440 for sign-up, credits sheet and pay sheet are 390 light only for some (see the folder); dark and 1440 exist for tier offer (dollars), tiers, verification, points, pay-short, add-money. A real Flixora trailer host; a real phone for F7 and F14; a second tab race; chat box Enter.

## Builder report

See `tasks/history/WEBAPP-08.md` for the full report (rows, proof, pictures, NOT RUN). Short: every row done or ruled; F1 and F2 proved in the web export on a stack; checks EXIT 0.

## Verifier report

