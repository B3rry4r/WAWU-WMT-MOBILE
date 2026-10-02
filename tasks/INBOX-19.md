---
id: INBOX-19
title: Chat and send money in a chat
owner: DEV2
area: INBOX
order: 157
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [INBOX-06, WALLET-07]
decisions: [R-13]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I12, I13, I14, I15]
---
# INBOX-19 · Chat and send money in a chat

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py I12 I13 I14 I15` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I12 · Chat**: An ordinary free chat between two WAWU users (Femi Bankole, @femib · on WAWU) with text bubbles and a composer with +.
- **I13 · Add to chat**: Attachment sheet: Send money (from your Naira wallet · instant), Request money (Femi pays from their wallet), Photo or video, File (PDF, up to 20 MB).
- **I14 · Amount**: Send to Femi keypad (same as Send W9): ₦25,000 with Naira balance and a note, Send ₦25,000 then PIN (W11).
- **I15 · Sent**: Chat with a money bubble "You sent ₦25,000.00 · For the shoot, thank you · Delivered to Femi 10:42".

## Capability checks

- [ ] **I12**: a user can type and send a message; tap + for attachments/money.
- [ ] **I13**: a user can Send money; Request money; attach photo/video; attach PDF.
- [ ] **I14**: a user can enter amount; add note; Send; enter PIN.
- [ ] **I15**: a user can view bubble.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
