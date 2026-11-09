---
id: WEBAPP-08
title: The web walk's fixes (Phase 1 fix batch)
owner: YOU
area: WEB
order: 369
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: verifying
depends_on: [WEBAPP-07]
decisions: [R-127, R-128, R-47, R-86, R-94]
passes: [V1, V2, V3, V4, V5, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WEBAPP-08 · The web walk's fixes (Phase 1 fix batch)

## Current state

As of 9 Nov 2026.
- **Status:** built on `wmt/WEBAPP-08`, `npm run check` EXIT 0 (518 suites, 7732 tests passed, 5 skipped; gates 0 fail, 17 warn, 0 accepted). Waits for the T2 verifier.
- **Done:** F1 to F5, F7 to F11, F13, F15. F6 is the lead's ruling (no change). F12 and F14 are ruled in the report (the built screen already matches the board; nothing the music button covers is unreachable). F16 is report only.
- **Proof:** the web export (own TMPDIR, stack hosts baked in) holds the live purchase code ("nothing to buy", the sign-up draft, "See the tiers"); walked in Chromium behind `vercel.json`'s headers on stack fix08. See the report.
- **Next:** the T2 verifier with the money attacks; then the full walk on the new batch head.
- **History:** tasks/history/WEBAPP-08.md.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127, R-128, R-47, R-86, R-94
- `tasks/history/WEBAPP-07.md` (the three walk reports: steps, pictures, causes)
- `docs/release/WALK-WEB.md` (how the walk ran: the stack, the real site's headers)

## Goal

Every serious and medium finding of the web walk is fixed or ruled, so a guest, a new user, a wallet holder, a buyer and a creator can do on usewmt.com what they do on the phone. The phone app is unchanged (R-86) unless a row says otherwise.

## Scope

**The proof for anything web-only is the web export, not jest.** Build it as Vercel does (`npm run web:export` with its own `TMPDIR`, so Metro's cache is fresh) and show the change is in the bundle and works in a browser on a stack behind `vercel.json`'s headers (`docs/release/WALK-WEB.md`). Jest passing is not proof: F1 below passed jest.

| # | Finding (walker) | Fix |
|---|---|---|
| F1 | SERIOUS (B, C). Every web wallet purchase is a dead button: tier, upgrade, tick, points, WAWU Credits, community pass. `src/features/store/webwallet/useWebBuy.ts` (inert phone file) sits beside `useWebBuy.web.tsx`; Metro tries `.ts` before `.tsx`, so the web export bundles the inert one. Created by the batch's own fix (WEBAPP-06 fix 3). | The web export bundles the live hook and phones the inert one (for example `useWebBuy.tsx` live and `useWebBuy.native.ts` inert, or the same extension for both; say which and why). A guard test that fails for any platform pair in `src` whose extensions let Metro pick the generic file over the platform file. Proof: the live code's strings in the export; on a stack, through the app's own buttons, buy a tier, an upgrade, a tick, points, a credits pack and a community pass, each with the PIN: the wallet moves once and the thing is granted once (Hub ledger and the Nuvion stand-in), a double tap and a replay charge once. Phone jest unchanged. |
| F2 | SERIOUS (A; B and C). `vercel.json` `connect-src` lists `https://api.wawuafrica.com` but not `wss://api.wawuafrica.com`, so the live socket (`src/features/inbox/live.ts`) is refused on usewmt.com: chats, rooms and badges update only on a refresh. | Add `wss://api.wawuafrica.com`; the CSP guard test asserts it; `docs/WEB-DEPLOY.md` says it. Proof: behind the headers (hosts swapped for the stack), the socket connects and a message from a second person arrives without a refresh. |
| F3 | MEDIUM (A). `media-src` lacks `https://*.amazonaws.com`, which `img-src` and WEB-DEPLOY list. | Find where the bucket really serves video and audio from (the Hub's storage settings and the URLs it hands out) and make `media-src` cover exactly that. Say what you found. |
| F4 | MEDIUM (A). A person billed in dollars sees "No tiers on sale ... Try again later" on the tier offer. | On the web, what R-94 says: such a person is led to the tiers sheet that says what is open. Say whether the phone does the same; no phone change in this batch. |
| F5 | MEDIUM (A). A refresh in the middle of sign-up loses the code step, and the 30 s cooldown then blocks starting again. | On the web, a refresh keeps the sign-up step so the mailed code can still be entered (the address and step in the tab's session storage; never the password). |
| F6 | MEDIUM (A). A refresh inside Open your wallet loses the ID photos. | **Lead ruling: no change.** ID photos are never kept in browser storage; the plain "Add your ID first" message with Go back stays. |
| F7 | MEDIUM (B). On the shortfall sheet, "Add ₦N" opens Add money but the pay sheet stays open over the account number. | The sheet closes when it sends the person to Add money (web and phone, if the phone does the same; say which). |
| F8 | MEDIUM (B). After buying credits in a room the sheet says "You have 0 credits" and the header stays stale until a refresh. | The count refreshes from the Hub after a purchase. |
| F9 | MEDIUM (C). `/tiers` and `/verification` say "The store works out what moving up costs" on the web. | On the web, wallet words (R-128); the phone keeps its words. |
| F10 | LOW (C). A cold deep link (for example `/me`) lands on Home once the tier offer is closed. | It lands on the page asked for. |
| F11 | LOW (B). Enter does not send in a room's message box. | On the web, Enter sends and Shift+Enter makes a new line. |
| F12 | LOW (C). The profile content grid has no left gutter and fills two of three columns (390 and 1440). | As the board draws it. |
| F13 | LOW (B). The "Founding +10%" chip is unreadable in dark. | Readable in both themes (tokens only). |
| F14 | LOW (A, B). The floating theme-song button covers the right edge of card rows (the Wallet card row's chevron, Explore's last row). | Nothing it covers is unreachable, at 390 and in the 1440 column. |
| F15 | LOW (C). add-work Save opened cold (no history) lands on Home. | It lands on My works. |
| F16 | LOW (C), report only. A video goes up with its GPS location tag. | No code: say whether the phone does the same and the smallest fix (app or Hub), for the lead. |

Not in this batch (the lead carries them): the creator who cannot take a live piece down although the copy says "Take something down to make room" (phone too; its own task), the Terms page naming wawuafrica.com (the owner's text), the stack script's lock, module and Metro cache notes (Hub dev tooling), the lows listed in `tasks/SWEEP-WEB.md`.

## Capability checks

- [ ] A buyer on the web buys a tier, an upgrade, a tick, points, a WAWU Credits pack and a community pass with their PIN through the app's own buttons; each charges once and grants once, also under a double tap and a replay (V8).
- [ ] A person on usewmt.com sees a message from another person arrive in a chat and a room without refreshing.
- [ ] A person billed in dollars, a person who refreshes during sign-up, and a buyer short of money each get a way forward, never a dead end.
- [ ] Every screen this batch touches has pictures at 390 light and dark beside its board, and at 1440.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-08.md](history/WEBAPP-08.md).

## Owner sign-off

### T2 verifier report (9 Nov 2026), branch wmt/WEBAPP-08 head 63bdcf3, Hub main 7dd5b22, stack ver08 (ports 16040-16059)

**Verdict: FIX.** 1 high, 3 medium, lows. `npm run check` EXIT 0 (518 suites, 7732 passed, 5 skipped; gates 0 fail, 17 warn, 1685 files).

| Pass | Result | Evidence |
|---|---|---|
| V1 | passed | check.log EXIT 0 |
| V5 | passed with findings | pictures /tmp/wmt-shots/v-webapp08 (boards beside built, 390 L/D, 1440 L/D) |
| V8 | passed | below |
| V9 | passed | real wawu-id sign-in, values from Hub |
| V2/V3 | NOT RUN (CI) | |

**Findings**
1. HIGH (F5, defect): after Back from the code step and a refresh, the restored sign-up form shows the flag +1 / Country United States beside a restored +234 number, and submitting sends `countryCode:"US"` with `+2348031110006` (request captured). A Nigerian who refreshes silently gets a US country of residence (dollar billing, F4's state). Steps: fill sign-up with a +234 number, Continue, Back, refresh /sign-up, add password, agree, Continue. Fix: keep the country in the draft. Picture f5b-after.png.
2. MEDIUM (F11): in a chat (/chat/<id>) Enter inserts a newline and does not send; only the room box was changed (ChatComposer is a separate component). The lead asked for room and chat; Shift+Enter works in both.
3. MEDIUM (F3): `https://*.amazonaws.com` in media-src is unproven. Only Flixora posters are recorded on S3; no trailer host recorded; own bucket is DigitalOcean Spaces, already covered. The task said cover exactly what is found. CSP diff is otherwise only `wss://api.wawuafrica.com`.
4. MEDIUM (F4 way out): a dollar person on /tiers sees only "Buying is not open yet" with no title, close or button; only a tap on the backdrop leaves (to creator-setup). Not a hard dead end, but weak.
5. LOW (unclear): upgrade sheet and checkout button say "Upgrade to Founding Maker N9,999" while the pay sheet charges N7,000 (the difference); F9's new words ("You pay the difference") make it more visible.
6. LOW: F15 and F10 changes are not platform-gated for add-work (phone cold open also lands on works); not in the builder's phone-change list. Harmless.
7. LOW: the jest-expo/android preset cannot run here at all (SyntaxError in @react-native/jest-preset setup, same on base a9fe042), so "jest on android" is NOT RUN; phone proof is the full default jest (518 suites) plus diff read: phone changes are the Founding chip tone, credits line waiting for the fresh count, add-work no-history landing.

**Rows** F1 PASS (details below); F2 PASS (ws://localhost:16040/api/hub/live opens, no CSP violation, room and chat message arrived without refresh; control served without wss: CSP violation, no socket, message only after reload); F3 see 3; F4 PASS with 4; F5 FAIL see 1 (password never in storage: PASS; refresh on code step resumes: PASS); F6 PASS (sessionStorage, localStorage, IndexedDB, caches empty of ID photos through the ID, address steps and after refresh; "Add your ID first" with Go back shown); F7 PASS (pay sheet closes, account number visible, tiers, points, credits); F8 PASS ("120 credits added, You have 120 credits", header 120); F9 PASS (/tiers and /verification); F10 PASS (/me, /wallet, / land on the page after closing the offer; with a pending setup checklist the checklist comes first, Later lands on /me); F11 room PASS, chat FAIL; F12 agree no change (grid edge to edge, 3 across, matches M1); F13 PASS (chip readable dark); F14 agree no change (rows clear the buttons at scroll end at 390 and 1440, left of a covered row opens /cards); F15 PASS (cold Save lands on /works/<id>); F16 report accepted (redrawPhoto is photo only).

**F1 / V8 money (Hub ledger = Nuvion stand-in)**: through the app's buttons with the PIN, double tap on pay: tier Verify -299,900; upgrade to Founding -700,000 (difference); points pack -250,000 (+2,750 points); credits pack -100,000 (+120); community pass -100,000 (one pass row). Bo repeated tier, upgrade, credits (Ada's room), pass: one POST each. Replays of the captured request (same Idempotency-Key and body, and 5 in parallel): all 201, balance delta 0, for tier, upgrade, points, credits, pass. Tampered total: 409 (same key idempotency_key_reused, new key quote_changed). No PIN: 403. No key: 400. Same key other body: 409. Two tabs on one pack: 2 POSTs, one charge, second "Still confirming". Five wrong PINs: "4 tries left" to "PIN locked 29:58", 5 POSTs only, sixth typed digits sent nothing. Too little (N1,500): shortfall sheet "You have N1,500.00, top up N1,499" and Add closes the sheet (tier, points, credits); no POST. Reconciliation: ada 3,677,600, bo 3,585,100, cy 650,100, dee 4,750,000, ledger sums equal the stand-in balances. 85/15 seen (host +85,000 on a 100,000 pass). Guard test platformPairs fails when useWebBuy.ts is recreated, restored. Export holds "nothing to buy", "wmt.signupDraft", "See the tiers"; one React; hosts baked.

**Pictures**: 82 captures taken (390 L/D, 1440 L/D) of sign-up, tier offer (dollars), tiers (dollars, upgrade, highest), verification, checkout, pay-short, add-money, points (Cy, Verify, Founding), room, credits sheet, credits added, Me, wallet, Explore, beside boards A3, VF5a, VF5b, VF6a, VF14, I28, I29, PT4, M1, W1, X1. Looked at: the 390 pairs for VF6a L/D, I28 D, PT4 L, PT4 Founding D, A3 D, VF5a D, VF5a tiers L, VF5b D, VF14 L, I29 D, M1 D, wallet, Explore, the 1440 light contact sheet and Me 1440. Not individually looked at: the 390 dark and 1440 dark contact sheets (generated). Board differences seen are the web's wallet pay sheet (R-128) and the built sign-up fields, not this batch.

NOT RUN: android jest preset; real Flixora trailer host; a real phone; Safari and Firefox. Setup note: for the credits-added picture the test user's credit count was zeroed in my own test database.
