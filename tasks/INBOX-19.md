---
id: INBOX-19
title: Chat and send money in a chat
owner: YOU
area: INBOX
order: 142
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, INBOX-02, INBOX-06, WALLET-07, WALLET-02, UI-02, UI-03, INBOX-04]
decisions: [R-13, R-6, R-10, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9, V10]
artboards: [I12, I13, I14, I15]
---
# INBOX-19 · Chat and send money in a chat

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder in the S2 bundle: mobile `wmt/S2` from `origin/wmt/MERGE-8` `cc436a53`, `origin/wmt/INBOX-15` merged in. No backend change, no migration. Routes `/chat/[id]` and `/chat/send` added (no layout edit).
- **Built:** I12 (header, thread newest at the bottom and live, composer, text sent once per `clientMessageId`), I13 (Add to chat: Send money and Request money), I14 (W9's keypad, balance, note, the Bank charge + WAWU's fee, Total, "Femi gets ₦25,000", "Send ₦25,025.75", then the PIN), I15 ("You sent" with the note and "Delivered to Femi", read from the Hub's record of the send by id). The Inbox draws chat rows (preview, time, unread, tick) that open the chat. A person with no wallet is led to Open your wallet.
- **Not drawn (R-47), G-882:** Photo or video and File (nothing sends them yet), the "..." button, compose (no board for the person picker). "instant" and "PDF, up to 20 MB" are not printed. I15's bubble is kept on the sender's phone by the send's id (G-880): the person who got the money sees no bubble.
- **Decisions the builder took:** the line under the name reads "@handle · on Who Made This?" (R-69, the board); the provider's part is "Bank charge" (R-53); a send and a W10 review share one kept intent per person and amount (`send/intent`), so neither can send twice.
- **Attacks in tests:** double tap on Send (one fresh quote, one PIN sheet, one payment), wrong PIN, short wallet before and after the PIN (the shared pay sheet), a lost answer then the same request (same key and body, also after leaving the screen), no wallet, a send the provider has not confirmed (kept pending, not sent again), a failed send.
- **Attacks on the stack, once each:** the same key twice at once 201 and 409, one debit; the same key again 201, no second debit; wrong PIN 403, nothing moved; a send of ₦50,000 with ₦10,000 402 `insufficient_funds` with the shortfall. In the browser: A sent B ₦25,000 with a note through I14 and the PIN, and the chat showed I15's bubble.
- **Stack (backend `wmt/INBOX-15` `c803256` on the Nuvion stand-in, name `s2_test`, ports 7760 to 7767, taken down after):** the web export of `wmt/S2` ran against the real Hub with two funded wallets; pictures in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/s2-b/pics/` (`beside-<board>-<light|dark>.png`, board left, built right); the attacks below were run once each, results in `.../s2-b/logs/live-attacks.txt`.
- **Open:** G-880, G-882, G-883 (the stack's send took ₦100.00 where the quote said ₦110.00, WAWU's fee not collected); SHARED-CHANGES INBOX-19 #1. Flipped four assertions that pinned chat rows' and Money's absence in `InboxScreen.test.tsx` (chip list, two "no row nobody draws" tests now use a paid question as the undrawn kind).
- **Next:** a verifier (V1, V4, V5, V6, V7, V8, V9, V10). NOT RUN: V10.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py I12 I13 I14 I15` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md`: its entries for I14 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

The amount keypad is W9's, which WALLET-02 puts in `src/components` (SHARED-CHANGES request) so this task reuses it.

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-image-picker` (photo or video), `expo-document-picker` (PDF). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **I12 · Chat**: An ordinary free chat between two WAWU users (Femi Bankole, @femib · on WAWU) with text bubbles and a composer with +.
- **I13 · Add to chat**: Attachment sheet: Send money (from your Naira wallet · instant), Request money (Femi pays from their wallet), Photo or video, File (PDF, up to 20 MB).
- **I14 · Amount**: Send to Femi keypad (W9's keypad, reused from `src/components`, never copied): ₦25,000 with Naira balance and a note, the fee line (Fintava's ₦15.75 + WAWU's ₦10 = ₦25.75), "Send ₦25,025.75" and "Femi gets ₦25,000" (BRIEF I14), then PIN (W11).
- **I15 · Sent**: Chat with a money bubble "You sent ₦25,000.00 · For the shoot, thank you · Delivered to Femi 10:42".

## Brief changes (build these, not the canvas)

- **I14**: add a fee line above the button: Fintava's charge ₦15.75 + WAWU's fee ₦10 = ₦25.75, Total ₦25,025.75. The button shows the total, "Send ₦25,025.75", with a line "Femi gets ₦25,000", as on W10 (rule 5). (Why: R-10: sending to a WAWU user carries Fintava's charge plus WAWU's ₦10.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- I13: Request money (opens I16): added by INBOX-20

## Capability checks

- [ ] **I12**: a user can type and send a message; tap + for attachments/money.
- [ ] **I13**: a user can Send money; attach a photo or video; attach a PDF.
- [ ] **I14**: a user can enter an amount and a note; see ₦15.75 + ₦10 = ₦25.75, "Send ₦25,025.75" and "Femi gets ₦25,000"; enter their PIN.
- [ ] **I15**: a user can view bubble.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From I1 (INBOX-04), a user can tap a chat row or compose and reach I12 (this task adds them, as drawn).
- [ ] A creator who is tipped (HOME-13) sees the tip as a money bubble in the chat with the tipper (H28).
- [ ] A user with no wallet who taps Send money lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **I12**: missing. Missing: No free user-to-user messaging exists. Needs Conversation(participants) + ChatMessage(id, conversationId, senderWawuId, kind text|image|file|money_sent|money_request, body, attachmentUrl, createdAt, deliveredAt, readAt) and list/send/mark-read endpoints, respecting BlockedAccount. No real-time transport exists: grep of wawu-backend/src and package.json for WebSocketGateway|@SubscribeMessage|socket.io|@Sse|text/event-stream returned nothing; only @nestjs/schedule cron jobs run server-side. Web fetches once on mount (no setInterval/EventSource/WebSocket in src/lib or src/components messaging code).
- **I13**: missing. Missing: Attachments have an upload primitive (presign) but no chat to attach to and no PDF/video folder for chat; send/request money needs P2P wallet transfer and a money-request model (see I14-I19).
- **I14**: missing. Missing: No user-to-user transfer, no PIN. Depends on the wallet flow (W9/W11).
- **I15**: missing. Missing: Needs a money_sent chat message linked to a transfer ledger row, plus a delivery state; WalletEntryKind has no transfer kind.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I13: PDF, up to 20 MB
- I13: instant
- I14: ₦25,000
- I14: Naira balance ₦485,250.75
- I15: ₦25,000.00
- I15: Delivered to Femi 10:42

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-19.md](history/INBOX-19.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
