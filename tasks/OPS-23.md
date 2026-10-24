---
id: OPS-23
title: Admin dashboard: support threads (staff read and answer people's support threads)
owner: YOU
area: OPS
order: -150
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: []
decisions: [R-30, R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-23 · Support threads

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B15), dashboard `wmt/OPS-23` on `origin/main` `c1dfca6`, Hub read at `origin/main` `3d33a05`. Status verifying. The pictures are at 1440 px under `dash-b15/` in the builder's scratchpad (light and dark), taken against a local stack (Nuvion stand-in, seeded test rows). No Hub change: the three routes were already served.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | The Hub served `GET /admin/support/threads`, `GET /admin/support/threads/:chatId/messages` and `POST` on the same path (SUPPORT-01, R-30); the dashboard had no screen for them | Support threads (`/support`, Support section): the threads newest activity first, a "Waiting for a reply" tab (the Hub's own `lastMessage.mine` is false) and an "All threads" tab, a person's name, avatar and last words, "Load more threads" while `nextCursor` is set |
| 2 | Staff could not read a person's thread | Opening a thread shows the messages oldest at the top (text, photo, video, file and money request lines), "Load earlier messages", and the person's name and handle |
| 3 | Staff could not answer | A text box "Reply as WAWU Support", Send reply; the reply lands in the person's own chat. The same `clientMessageId` is reused only for the same words, so a retry never posts twice; the Hub's refusal is shown in a toast in its own words |
| 4 | no way from a thread to the person's other records | "Creator lookup" opens `/creators/<wawuId>`; "Identity hold" opens `/finance/oversight?account=<wawuId>` (OPS-25), which pre-fills the account id |
| 5 | a reviewer or finance admin who opened the route got a 403 | the role list is read off the handler (`superadmin`, `support`); any other role sees "Your role cannot read support threads" and no request is sent |

Wire types are derived, never written: `src/lib/api/contract/oversight.generated.ts` comes from `scripts/generate-oversight-contract.mjs` (route table, roles, `ChatSummaryPage`, `ChatMessagePage`, the reply DTO), with `npm run check:oversight-contract` in `npm run check`.

Default (lead), owner may override: the thread list polls every 30 seconds and an open thread every 20 seconds; there is no "resolved" mark because the Hub has none (a thread leaves "Waiting" when support's reply is its last message).

Not done, for `tasks/SWEEP-APP.md`: (a) attachments in a reply (the Hub refuses them); (b) the list and thread do not mark a message read for the person (the Hub's read route is the person's own); (c) NOT RUN on a phone: that the person's app shows the reply live (the Hub's chat service is the one the app uses).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `wawu-dashboard`'s `CLAUDE.md`, `AGENTS.md` and the guide in `node_modules/next/dist/docs/`
- `scripts/generate-oversight-contract.mjs` (how the wire types of these screens are derived from the Hub source)
- `src/components/support/SupportThreads.tsx`, `src/lib/api/admin-support.ts`
- Hub `src/admin/support/admin-support.controller.ts`, `src/chat/chat-view.type.ts` (`origin/main` `3d33a05`)

## Goal

Staff read and answer the support threads from the dashboard.

## Scope

`wawu-dashboard` only: `src/components/support/`, `src/app/(app)/support/`, `src/lib/api/admin-support.ts`, the oversight generator and its generated file, one nav entry, and `src/lib/api/contract/index.ts` (it merges the oversight routes into the client's route table).

## Capability checks

- [x] A support admin can open the threads, see who is waiting, read a conversation and send a reply that appears in it (live, local stack: a reply to a seeded thread, the thread left the waiting tab).
- [ ] A role the Hub refuses sees a plain refusal and no request is made: NOT RUN live (only a superadmin was signed in); the screen gates on the handler's role list (`routeAllowsRole`).
- [ ] A reply the Hub refuses (too long) shows the Hub's words and keeps the draft: NOT RUN live; the error toast shows `serverMessageOf` and the draft is cleared only on success (code read).
- [ ] On a phone: NOT RUN (no device in this session).
