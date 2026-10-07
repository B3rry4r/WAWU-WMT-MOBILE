---
id: HOME-09
title: TGIF reader
owner: YOU
area: HOME
order: 154
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [HOME-10, INBOX-06, UI-02]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [H29, H30, H31, H32, H34, H35]
---
# HOME-09 · TGIF reader

Taken over by the lead's agents on 7 Oct 2026 (Developer 1 at their usage limit; owner's instruction).


## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H29 H30 H31 H32 H34 H35` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for H29, H30, H31, H32, H34, H35, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H29 · Verse**: Full-screen TGIF card (TODAY'S VERSE) for Friday 26 September, series 'SONS, NOT SLAVES': Psalm 118:24 (KJV) quoted. With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'.
- **H30 · What it means**: Full-screen TGIF card (THE REALITY) for Friday 26 September, series 'SONS, NOT SLAVES': 'Today is not a leftover from yesterday…' With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'.
- **H31 · The line to carry**: Full-screen TGIF card (REMEMBER) for Friday 26 September, series 'SONS, NOT SLAVES': 'I don't have to earn today. I get to live it.' With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'.
- **H32 · Prayer**: Full-screen TGIF card (PRAYER) for Friday 26 September, series 'SONS, NOT SLAVES': prayer text with an inline Amen. With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'.
- **H34 · One thing to do**: Full-screen TGIF card (TAKEAWAY) for Friday 26 September, series 'SONS, NOT SLAVES': 'Before your first meeting, write down one thing today that you're glad for.' 'No streak to lose.' Done returns to Today. With Amen reaction (2.1K), a second count (3.4K), Share, 'Tap to continue'.
- **H35 · Share the verse**: From any TGIF card · Share: 'Share today's verse. Posted as an image with a link back to TGIF.' Preview image (TGIF · 26 SEP, verse, Psalm 118:24, wawu/tgif); targets WhatsApp, Story, WAWU chat, Save.

## Capability checks

- [ ] **H29**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H30**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H31**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H32**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H34**: a user can Amen (react); Share (H35); tap to continue.
- [ ] **H35**: a user can share to WhatsApp / Story; send in WAWU chat; save image.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states H35.

## What the backend serves today (from the analysis)

- **H29**: missing. Missing: The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking.
- **H30**: missing. Missing: The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking.
- **H31**: missing. Missing: The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking.
- **H32**: missing. Missing: The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking.
- **H34**: missing. Missing: The text exists only as a static web bundle (no server copy). No reaction model/route, no counts, no share tracking.
- **H35**: missing. Missing: No share-image renderer (client canvas or server OG image) and no wawu/tgif link resolver; WAWU chat target depends on free P2P chat.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H29: Amen 2.1K
- H29: 3.4K (unlabelled second count)
- H29: Psalm 118:24 (KJV) verse text
- H30: Amen 2.1K
- H30: 3.4K (unlabelled second count)
- H31: Amen 2.1K
- H31: 3.4K (unlabelled second count)
- H32: Amen 8.9K
- H32: 3.4K
- H34: Amen 2.1K
- H34: 3.4K (unlabelled second count)
- H35: link format wawu/tgif

## Designer notes (⚠, unresolved)

- None.

## Builder report

Built by the lead's agent (taken over from Developer 1, 7 Oct 2026). Mobile branch `wmt/HOME-09`, backend branch `wmt/HOME-09` (both pushed, no pull request). Backend base `6c0e435`. The migration stamp `20261008130000` was reserved and **not used: no table, no migration, no `schema.prisma` change.**

**What exists now.** The reader at `/tgif` (`src/app/tgif.tsx`): the five cards one at a time, a progress bar (one segment per step), Amen on every card and inline on the prayer, Share, "Tap to continue" (the words, the hint or the arrow), Done on the last card, close on every card. The share sheet (H35): the Hub's drawn card as the preview, WhatsApp, and Chat (the card and the link into one of the person's chats). Backend: `GET /tgif/{date}` (the day's text, the caller's first name in it) and `GET /tgif/{date}/share-image` (the verse on the card, PNG). HOME-10's react, take-back, read, share and stats routes are used as they are.

**Files, mobile.** `src/app/tgif.tsx`; `src/features/tgif/`: `TgifReader.tsx`, `ShareSheet.tsx`, `parts.tsx`, `CardBackdrop.tsx`, `look.ts`, `model.ts`, `useTgif.ts`, `api/tgif.ts`, `api/chat.ts`, three test files (42 tests). `contract/` and `src/api/schema.generated.ts` regenerated from the backend branch (`SOURCE_COMMIT` names it). `BACKEND_GAPS.md` G-240 to G-244, `SHARED-CHANGES.md` HOME-09 #1 to #4 and F1, `docs/LOG.md`, generated `tasks/INDEX.md` and `docs/PROGRESS.md`.
**Files, backend.** `src/tgif/content/` (the book reader and the name slot), `src/tgif/share/` (the card drawing and font widths), two routes on `src/tgif/tgif.controller.ts`, `src/tgif/tests/tgif-content.contract.spec.ts` (17 tests), `assets/tgif/` (365 days and two font files), `src/styles/tokens-tgif.ts`, `.env.example` (`TGIF_SHARE_LINK`), `contract/openapi.json` (+111 lines, 0 removed).

**Capability checks** (each is `[ ]` until the verifier passes it; how each was tested is here).
- **H29 to H34, a user can Amen.** Jest (reader, 22 tests): the count moves at once while the Hub has not answered; the Hub is told the card on screen (`verse`, `reality`, `prayer`); the pill shows it is theirs; taking it back sends the `DELETE`; a refused save puts the count back and says so; the inline Amen on the prayer and the pill under it are the same Amen. In the browser against the real Hub: Amen on the reality card 12 to 13 and back to 12, the prayer's inline Amen 8.9K to 9K and back; the rows are in Postgres and gone after the take-back.
- **A user can share (H35) and tap to continue.** Jest: the arrow, the words and the hint each move on; the last card is not left by a tap and Done leaves; close works from any card. Browser: all five cards, light and dark.
- **H35, WhatsApp and Chat.** WhatsApp opens `wa.me` with the verse, where it is from and the link (jest, and `Linking` refused in the browser gives the problem line and no share is counted). Chat: the picture is uploaded to the storage slot the Hub signs and sent with the link (jest; and against the real Hub, two sends left two image messages of 169,732 bytes with the link as text, and one share counted for the day). **Story and Save are not built** (G-242, SHARED-CHANGES HOME-09 #2): they need `expo-sharing` and `expo-media-library`, which `package.json` (fenced) does not have. NOT RUN until then.
- **Every value is the API's or the user's.** The text, the series, the reference and the link come from `GET /tgif/{date}`; the counts from `/stats`; the date header from the phone's day. The only literals are the card labels, the controls' words and the sheet's own copy, as the canvas draws them. The 2.1K, 3.4K, Psalm 118:24 and `wawu/tgif` on the artboards are not in the code (a test greps the rendered tree for WAWU and em-dashes).
- **Loading, empty and error (V6), entered by their real cause.** Loading: the day's request held unanswered; the card preview held; the chat list held; the upload held (spinner on the row). Error: the browser's request refused (No connection), the Hub answering 500 (the Hub's own sentence), the numbers failing (the card reads, Amen without a count), the Amen refused (the line, the count back), the card's picture refused (retry), the chat list refused (retry), a chat refusing the upload (the Hub's sentence). Empty: a person with no chats ("No chats yet", with Open Messages). **The reader itself has no empty state:** the Hub holds a card for every day it serves, so there is no real cause to enter; an answer with no verse is treated as an error (tested).

**Screenshots** (390 wide, 2x, light and dark, from the web export served on :8281 against the Hub on :5281; all in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bh09/shots/`): `reader-1-verse` to `reader-5-takeaway`, `reader-loading`, `reader-error-network`, `reader-error-server`, `reader-numbers-failed`, `reader-amen-before`, `reader-amen-said`, `reader-amen-taken-back`, `reader-amen-failed`, `reader-prayer-inline-said`, `share-loading`, `share-sheet`, `share-whatsapp-failed`, `share-preview-error`, `chat-loading`, `chat-list`, `chat-send-failed`, `chat-sending`, `chat-sent`, `chat-error`, `chat-empty`, each `-light.png` and `-dark.png` (50 files), and `compare-H29`, `H30`, `H31`, `H32`, `H34`, `H35` with the design render on the left and the built screen on the right. The design renders are `build/design_shots/` in the worktree. I do not say they match; the verifier decides.

**Checks.** Mobile `npm run check` exit 0: typecheck and lint clean, jest 49 suites and 839 tests (main: 46 and 797; +3 and +42, all mine), gates 229 files scanned and 0 findings (main: 216 and 0), tasks check 208 tasks. On main, before any change, a load-sensitive wallet test (`OpenWalletScreen`, 20 s timeout) failed once in a full run beside a backend suite and passed alone, 37 of 37. Backend: `tsc` 0; eslint and prettier clean on every file touched; the tgif specs 26 of 26 (HOME-10's 9 and mine 17); gates 16 fail, 56 warn (the same 16 as main, none in `tgif`); the tripwire finds none; `contract:build` leaves the committed file as built, +111 lines, 0 removed; protected suite `run.sh --fresh` on `44b2820`: 253 of 253 jest tests, "all 244 required tests passed", lock unchanged. Full backend suite in its own network namespace (fresh migrated and seeded `bh09_full_test`, stand-in on :4001 inside the namespace): 174 suites, 169 passed, 5 failed (21 of 4537 tests); the five are all outside what this task touches: `hub-rate-limits` (needs a non-loopback interface) and `receipt-units` (timing under load) pass alone on the host (65 of 65), and `selfie-match`, `selfie-image` (money identity) and `fintava-stall` (timing) fail alone on the branch and on a separate `origin/main` worktree with the same 178 failing tests by name (354 run). No failure in `src/tgif`, the purge and export maps, the contract and route-registry specs. Not done: a by-name comparison of the whole full run against a whole run of main.
Revert proofs, mobile (each line broken in turn, the named file must fail): no optimistic count 2 failed; no rollback 1; read counted on every render 1; a tap on the words does not continue 2; the last card's tap leaves 2; WhatsApp counted when it failed 1; a new message id on every try 1; a blocked chat pressable 1; a count rounded up 2; long text not stepped down 1. Backend: no first name 3 failed; no 40 character cap 1; 29 February not folded 2; no break inside a long word 1; the day route reading like a write 4.

**V9 (real seam).** Hub from backend `67dd240` built and run on :5281 with a fresh migrated and seeded database `bh09_hub_test`, the stand-in WAWU ID on :5282, the web export on :8281 (which also stands in for object storage at `/storage`, PUT only). Signed in through the app's real sign-in screen (the stand-in's `POST /auth/login` is called; **the stand-in answers flat where the real service wraps in `{statusCode, message, data}`, so Playwright wraps the browser's answer; nothing else is injected**). A value only the server has: today's verse, the series and the Amen counts (2.1K on the verse, 8.9K on the prayer, rows I put in the test database) and the reader's own first name in the reality card. Created and read back: an Amen (a `TgifReaction` row, then gone after the take-back), a read (one `TgifRead` per person), a share (one `TgifShare`, counted once for two sends), two chat messages with the card as an image and the link.

**Gaps and rows filed.** BACKEND_GAPS G-240 (the second count, owner question G-160), G-241 (the text is a file the Hub ships, no admin edit; 31 December's closing note not served), G-242 (Story, Save, the picture on WhatsApp), G-243 (`TGIF_SHARE_LINK` and nothing resolves the link), G-244 (the translation on the card; the Chat label). SHARED-CHANGES HOME-09 #1 (card colours as tokens), #2 (`expo-sharing`, `expo-media-library`), #3 (the backend branch, for approval), #4 (the contract after the merge), F1 (HOME-01 opens `/tgif` and reads the same stats).

**Decisions (Default (agent), owner may override).**
1. The text moves server-side as a file (`assets/tgif`, a copy of the web's `public/tgif`), not a table: no migration, and the 365 days are a book. A reader's first name goes where the book has a slot, from the sign-in token's `firstName`; with none, "Be strong" and not "friend, be strong" (as the web does). 29 February reads 28 February (as the web does). Closing note of 31 December not served.
2. The second pill (a heart and a count) is left out of every card (G-240): a pill with no figure has nothing to show or do. Amen counts are written 640, 2.1K, 12.4K, cut down never rounded up; no number on a zero.
3. An Amen the person has said is a white pill (as Done is); the prayer's inline Amen turns glass. The canvas draws only the unsaid look.
4. A long text steps down in size by length (verse 32, 28, 24, 21; the rest 26, 23, 20, 18) and the body scrolls if a phone's font is larger still. The real text runs to 409 characters where the canvas draws 90.
5. The loading and error views are the themed page, not the dark card (the shared error view is drawn for the page).
6. The card colours are the nearest tokens (HOME-09 #1); the card is dark in both themes, as the light artboards draw it.
7. The shared card is drawn by the Hub (resvg, the receipts' Alan Sans cut) so the preview is the picture that goes out. It keeps the translation in the reference (G-244). The link is the Hub's `TGIF_SHARE_LINK`, left out while unset (G-243), never typed in the app.
8. WhatsApp sends the verse, where it is from and the link as text through `wa.me` (G-242); the sheet's "Posted as an image" is the canvas's line and is true of Chat only until the modules land. The target is called "Chat" (R-37) and lists the person's existing chats (G-244).
9. The reader counts the person as a reader when the cards appear, and a share when WhatsApp has opened or the chat has taken the card; neither refetches the numbers while a person is tapping.
10. The font reader in `src/tgif/share/font-widths.ts` copies the receipts' on purpose: the money code is frozen. No new `@Throttle`: the card is drawn once per day of the year, two at a time.
11. `readerSteps()` in `model.ts` is the one list the progress bar, the arrow and Done read; ADS-01 adds the sponsored card there.

**NOT RUN.**
- A phone: the Android app was not run (V10 is not in this task's passes). Unblocked by: a development build on a phone on the same network as a Hub (docs/LOCAL.md). What only a phone shows: the system status bar over the card, the `wa.me` link opening WhatsApp, `FileReader` turning the card into the preview, the quotation mark glyph (a 120 point glyph in a 50 high box), the Android back button.
- Story, Save and the picture on WhatsApp: not built (G-242). Unblocked by: SHARED-CHANGES HOME-09 #2 applied and a new development build.
- The real WAWU ID sign-in: the stand-in was used (envelope wrapped by Playwright). Unblocked by: the real wawu-id running locally (`scripts/local/up.sh`).
- The second count (3.4K): not drawn (G-240). Unblocked by: the owner answering G-160.
- An exact colour match of the cards (HOME-09 #1).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
