---
id: WEBPAY-01
title: Open your wallet on the website
owner: YOU
area: WEB
order: 216
priority: launch
repo: wawuafrica
type: web-port
status: verifying
depends_on: [NUV-02, NUV-03, NUV-04, MONEY-09]
decisions: [R-44, R-42, R-39, R-6]
passes: [V1, V3, V4, V5, V6, V7, V8, V9]
artboards: []
---
# WEBPAY-01 · Open your wallet on the website

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/PAYMENTS-PLAN.md` (the order of work, what waits for the Nuvion sandbox key, the owner questions and the defaults this task builds)
- This task changes `wawuafrica` (the website, Next.js). Start the session with that repo and `wawu-wmt-mobile` both attached; follow the web repo's CLAUDE.md: Tailwind tokens only, every call in `src/lib/api/`, shared UI from `src/components/ui/`, no em-dashes in anything a person reads. Sync the contract from a backend checkout that has the routes merged (`npm run contract:sync`, then `npm run contract:types`); never hand-write a response type.
- DECISIONS.md R-44 (the web's payment scope: same as the app, same Hub routes, no card), R-42 and R-43
- `docs/designer/CLAUDE-DESIGN-ROUND-2.md` sections 1 to 7 (tiers, VF, PT, RF, the wallet on Nuvion, open points) and the owner's Developer Brief v2.0 of 5 Oct (the lead's scratchpad `nuvion/brief-docx.txt`, sections 2, 3, 6 and 8)
- `tasks/NUV-02.md`, `tasks/NUV-03.md`, `tasks/NUV-04.md`, `tasks/NUV-09.md` (the routes and states)
- The app's Open your wallet screens (KYC-03, KYC-04, KYC-05) for the steps

## Goal

A person on the website with no wallet can open one with the same steps as the app (R-44): BVN and NIN (none for a
person outside Nigeria), an ID document and a proof of address, Nuvion's hosted selfie with its hand-off ("You'll
finish this on a secure page") and the return, "Checking your details", approved with the account number, rejected
with the reason and what to fix, then the transaction PIN. Every web payment screen sends a person with no wallet
here (the `no_wallet` answer, MONEY-13). Boards to compare with once exported: the round 2 Open your wallet steps.

## Scope

- New web routes for the opening steps (in the focused layout), a new `src/lib/api/money.ts` for the `/money/*` routes; the old Flutterwave `/api/hub/wallet` module and wallet page stay untouched until WALLET-30.
- The web's CLAUDE.md wallet note follows R-39 and R-42 (Nuvion; WAWU's operational account holds held money).

**V5 (picture):** the round 2 boards this screen follows are not in `design/` yet (R-43: tasks are cut from the new boards once exported). Build from the round 2 brief's text in the web's design system; V5 compares with the boards once the export lands, and is NOT RUN until `design/canvas-inventory.json` lists the ids named in the Goal. The backend runs locally with Nuvion stood in (no wawuafrica.com host, no Nuvion host).

**R-45 (8 Oct 2026):** naira first; NUV-09 (dollar wallets) is no longer needed before this task. The wallet page sends a person with no wallet into these steps.

## Capability checks

- [x] A signed-in person with no wallet can enter BVN and NIN, upload an ID (front and back) and a proof of address, finish the hosted selfie and land back on the same step, and see "Checking your details".
- [x] Approved: they see their account number, bank and name, and set a PIN. Rejected: they see the reason, fix it and submit again.
- [x] A file too large or of the wrong type is refused on the page, before upload, with the server's limit.
- [x] A person outside Nigeria is never asked for BVN or NIN.
- [x] No BVN or NIN stays in the browser after submit (storage and the network panel checked); on screen only the last 4 show.
- [x] Every step works at phone and desktop widths, light and dark, with no em-dash in any copy (`npm run check:copy`).

## Builder report

Builder (Sonnet), 10 Oct 2026. Website `wmt/WEBPAY-01` `511095f` (3 commits on web main `80c3671`: the contract, the feature, the notification route); this repo `wmt/WEBPAY-01` (this file, LOG, BACKEND_GAPS G-621 and G-622). Backend untouched: a local worktree of `origin/wmt/NUV-03` `78e8c2c` (carries NUV-02 round 2, NUV-04, main `a83496d`); NUV-02 round 3 had not pushed (`wmt/NUV-02` still `259e20a`), nothing merged. **Contract:** `contract/openapi.json` copied from that worktree, not from backend main (`contract:sync` reads main, which lacks the documents routes), then `npm run contract:types`; the website's contract was far behind, so the diff is large and typecheck stays 0.

**Pages built** (website, focused layout): `/wallet/open`, one route whose step is read from the server on every visit (`GET /money/wallet`, with `GET /money/identity/documents` and `/liveness` beside it while they matter), never remembered by the page: (1) Who you are: country first, details, BVN and NIN masked to the last 4 once typed, ID type and number, proof-of-address type; (2) Documents: ID front and back, proof of address, type and size checked on the page against the server's own `maxBytes` and `acceptedTypes`, every refusal's `reason.code` in plain words, `confirming`, `send_again`, `not_accepted` and `needs_new` drawn; (3) Selfie: drawn only when `GET /liveness` says enabled (R-47), "You'll finish this on a secure page", return to the same step; (4) Checking your details (reads again every 8 s); (5) approved: "on its way", then account number, bank and name once active, then the transaction PIN, then Your wallet is open; (6) rejected: reason, what to fix, correct and send again; stopped; the held-BVN answer (409) and the daily cap (429 with when it opens) in plain words. Also: `src/lib/api/money.ts` (new; types from the generated contract; no mock fallback on purpose); the wallet screen sends a person with no wallet to `/wallet/open` and offers the next step to one part way, and shows the account once the wallet is open and has its PIN; the `identity_review` notification now opens `/wallet/open` (the web's kind list did not name it, so a tap went nowhere); `client.ts` carries a refusal's `reason` and sends FormData; `FilePicker` gained a `hold` prop, `Select` is a new shared primitive, `/wallet/open` added to the own-header list; the web CLAUDE.md wallet note rewritten for R-39, R-42, R-44, R-45 (and its three copies synced); web `DECISIONS.md` D18. The old Flutterwave module and its screen are untouched.

**Walked in a real browser** (Playwright Chromium, the production build `next build` + `next start` on :6005, the built backend with `WALLET_PROVIDER=nuvion` behind the verifiers' preload (every non-loopback host refused) and Nuvion stood in with a copy of the NUV-03 verifier's stand-in plus the account-details routes; sign-in is the backend's **mock WAWU ID on :6004** (never :4001), the session written to `wawu-web-session` as the web's own sign-in writes it; ports 6001 to 6007 only; database `bwp01_hub_test`, dropped at the end). Scripts: `scratchpad/webpay-01/live/` (`serve.js`, `run-a.js` to `run-f.js`, copies of `lib.js`, `preload.js`, `h.js`); their logs `scratchpad/webpay-01/run-*.txt`. 70 checks, 0 failing: A 23, B 11, C 15, D 8, E 10, F 3.

**Pictures** (156 files, 390 and 1280 px, light and dark, `<id>-<390|1280>-<dark|light>.png`) in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/webpay-01/shots/`: a1 details empty, a2 details errors, a3 details filled, a4 documents empty, a5 documents refused on the page, a6 documents chosen, a7 checking, a8 approved on its way, a9 account ready, a10 PIN, a11 done, b1 rejected, b2 correct your details, b3 new ID asked for, b4 stopped, b5 held BVN, b6 daily cap, c1 outside Nigeria, c2 no Nigerian BVN, c3 more errors, c4 sides differ, c5 file not accepted, c6 lost answer (confirming), c6b send again, c7 not available (answer intercepted), c8 on hold (intercepted), c9 load error, c10 loading, d1 selfie, d2 selfie waiting, d3 checking with selfie done, d4 selfie not approved, e1 to e6 the wallet screen at each point, f1 notification.

**Capability checks, each proved** (all on the stand-in; the real Nuvion sandbox is NOT RUN)
1. No wallet to Checking your details (A, D): `/wallet` replaced to `/wallet/open`; details sent (one entity); the empty form refused field by field with nothing sent; ID front and back and a proof of address sent (stand-in: 2 documents, the ID with its back, ONE submission); with the selfie on (D, behind an https front on :6006 because the way back must be https): the opening is NOT sent while the selfie is to do, the secure page is started with the way back `<origin>/wallet/open`, a return before it is done lands on the same step, a pass moves on to Checking and the opening is sent once, a not-approved selfie can be tried again.
2. Approved (A, B, E): "on its way" while Nuvion's details are pending, then the number grouped, bank and name; two different PINs refused, then set, "Your wallet is open", a reload lands on the same step. Rejected (B): reason and what to fix, correct (numbers empty, the rest kept for the visit), only the refused ID asked for again (one upload), sent again once (2 submissions), approved with the account number. Stopped (B). Held BVN (B): 409 in plain words with contact support. Cap (B): three refusals then the fourth try shows "You've used today's tries ... in about 24 hours".
3. A GIF and a file 1 byte over 10 MB refused on the page with the server's limit and types, no upload request made (A); a PNG front with a JPG back refused on the page (C, the server refuses a mixed pair); Nuvion unable to read a file (C, 422 `document_not_accepted`: plain words, file dropped, the proof of address still went); a lost answer (C: `confirming`, then `send_again` from the server past its window, then the file sent again: one document there, one submission).
4. Outside Nigeria (C): country Ghana, "I don't have a Nigerian BVN" and a non-Nigerian phone all end at "Not available yet"; no BVN or NIN input is in the DOM (0 inputs) and no wallet-route request but GETs is made; Done goes to Home (not back into a loop).
5. After submit (A, final build): the BVN, NIN and ID number are in no localStorage, sessionStorage, cookie or IndexedDB name, in exactly ONE request of the whole network log (the POST body of `/money/wallet/open`, never a URL or header), and in no line of the hub, web-server or stand-in logs; on screen only `•••• ••• 1234` shows once typed; the PIN is in the body of `POST /money/pin` only. Network log `scratchpad/webpay-01/network-run-a.json`.
6. Light and dark at 390 and 1280 for every step above (the pictures); no em-dash in any added line a person reads (`npm run check:copy` 0 and a scan; the only hits are inside the generated contract's own descriptions).

**Website checks** (final commit): `npm run typecheck` 0, `npm run lint` 0 (15 warnings, none in a new or changed file's new lines; baseline files unchanged), `npm run build` 0, `npm run check:copy` 0. Mobile `npm run check` on this branch (on main `00f84cc`): exit 0 on the first run (109 suites, 1,852 tests, gates 0 fail and 13 warn on 445 files, 271 tasks, 279 artboards); no mobile source changed, so the flaky `eventsScreens` file did not come into it. Secret scan of the staged diff (`sk_`, `FLWSECK`, `nv_`, key headers, hex of 32+, base64 of 40+): none outside the generated contract; the contract commit has none either.

**Decisions** (Default (agent), owner may override)
- One route `/wallet/open` with the step read from the server, not one URL per step: a reload, a return from the hosted page and a second browser agree by construction; the back arrow goes where the person came from.
- `money.ts` has no mock fallback: a pretend opening that approves is a false success on a money path; with no backend the screens show the unreachable state.
- Country is asked first (the session carries none); outside Nigeria nothing is drawn for BVN or NIN. Order: documents, then the selfie. The ID number is masked like the BVN and NIN.
- The two sides of an ID are held in the page and sent together; they must be the same file type (checked on the page).
- The wallet screen redirects to `/wallet/open` only when nothing was sent and the old payout wallet has nothing to show; a creator with a payout wallet keeps it with the opening offered above it; the old "Wallets come with a creator account" callout is hidden where the money routes open wallets for anyone.
- The hosted selfie's way back is `<this origin>/wallet/open`; the server's allowlist (`NUVION_LIVENESS_REDIRECT_ORIGINS`) must list it (NUV-10).
- Copy never names the provider. "We'll send you a notification" is true because NUV-02 writes `identity_review`, and the web list now opens it.

**NOT RUN**
- V5 (picture against the boards): `design/canvas-inventory.json` lists only the round 1 Open your wallet boards (A1 to A26); unblocked when it lists the round 2 ids (the ID, proof of address, selfie hand-off, checking, approved and rejected steps).
- The real Nuvion sandbox (key): `GET https://api.nuvion.dev/bank-codes/NG` answering 200 with the key in the local `.env` and a lead brief allowing the host. Until then also unproven: whether Nuvion reads `file_back` (the page sends the back, U1 of NUV-03), a hosted selfie for a child entity, and what Nuvion does with a refused entity's corrected details (G-473).
- Sign-in through the web's own sign-in screen and the real wawu-id (the mock WAWU ID and a written session were used); unblocked by a `wawu-id` checkout with its own `npm ci` (about 600 MB) and `serve.js` pointed at it.
- "Not available right now" (`openingFlow` not `review`) and "on hold" (`state` frozen) were drawn from an intercepted answer (c7, c8), not a server in that state; unblocked by a hub with `WALLET_PROVIDER` unset or `fintava` and a frozen test wallet.
- The page behind the production nginx and `https://wawuafrica.com` (the TLS front here is a throwaway self-signed one).

## Verifier report

## Owner sign-off
