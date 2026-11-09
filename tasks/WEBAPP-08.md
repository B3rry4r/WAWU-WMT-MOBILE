---
id: WEBAPP-08
title: The web walk's fixes (Phase 1 fix batch)
owner: YOU
area: WEB
order: 369
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: todo
depends_on: [WEBAPP-07]
decisions: [R-127, R-128, R-47, R-86, R-94]
passes: [V1, V2, V3, V4, V5, V6, V7, V8, V9]
artboards: []
tier: T2
---
# WEBAPP-08 · The web walk's fixes (Phase 1 fix batch)

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-07 full walk (three walkers, all FAIL; reports in `tasks/history/WEBAPP-07.md`).
- **Next:** a builder on `wmt/WEBAPP-08` from `wmt/BATCH-WEBAPP1`; then a T2 verifier; then the full walk again on the new batch head.
- **History:** reports go to tasks/history/WEBAPP-08.md.

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

## Builder report

## Verifier report

## Owner sign-off
