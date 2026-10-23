---
id: AITOOLS-06
title: Receptionist: a person's own text agent, paid by the message (backend)
owner: YOU
area: POINTS
order: -121
priority: launch
repo: wawu-backend
type: third-party
status: todo
depends_on: [AITOOLS-02]
decisions: [R-78, R-43, R-61, R-65, R-68, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# AITOOLS-06 · Receptionist: a person's own text agent, paid by the message (backend)

## Current state

As of 23 Oct 2026, cut (lead, from the owner's "build this thing", R-78). Status: todo. Tier T2 (third-party, spends points). About 60 minutes of building; if it runs past that, push what is done and hand back what remains.
- **Real prerequisites (not in `depends_on`):** AITOOLS-01 (backend) and POINTS-03 are merged to backend main. They sit at orders 267 and 213, and every order in the launch band below CHECK-3 is taken, so this task uses a negative order (like FIX-nn) and `depends_on` lists only the tasks cut with it. Both are on backend main as of 23 Oct 2026 (`src/ai-tools/`).
- **Pattern:** not a file and not one audio result: a conversation, paid a message at a time. The design draws only the tile ("Receptionist, 20 a message"); no board shows what it does for a creator (G-AITOOLS-06-1). This task builds the engine and a try-it chat, and nothing that answers a person's real messages.
- **Owner decision needed before the app task:** what the Receptionist is for. The lead starts this task with the assumption in Scope; the report says what the owner changes.
- **Provider:** the AI voice provider, through the one seam `AI_VOICE_PROVIDER`. NOT RUN against the real provider until a run with the owner's key on the Hub (its read-only access was checked 23 Oct 2026: `docs/elevenlabs/API-FACTS.md`). Built and tested against `scripts/dev/voice-standin.cjs`.
- **Next:** a builder session (Sonnet) on branch `wmt/AITOOLS-06`; then a verifier.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `docs/elevenlabs/API-FACTS.md` (the provider's routes, limits and what the free read calls showed: every provider fact in this task comes from it or from a real response)
- `DECISIONS.md`: R-78, R-43, R-61, R-65, R-68, R-47 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/AITOOLS-01.md` (the job and points flow this task reuses) and `tasks/POINTS-03.md` (hold, commit, release, caps)
- Backend `src/ai-tools/` (`ai-job.service.ts`, `voice/ai-voice-provider.ts`, `voice/http-voice-provider.ts`, `tests/ai-tools.contract.spec.ts`) and `scripts/dev/voice-standin.cjs`
- `design/Points Flow.dc.html` board PT1 (the Receptionist tile) and PT3, PT7 (shared sheets)
- `docs/elevenlabs/API-FACTS.md` section "Agents (Receptionist)"
- Backend `src/account/` deletion and purge code (the agent holds a person's words, so deleting the account deletes the agent)

## Goal

A person tells their Receptionist what they offer and how to answer, then chats with it to try it; each message the Receptionist answers costs 20 points (the board's figure, PROVISIONAL), kept only when it answers.

## Scope

- **The agent.** One provider agent per person, text only (`conversation_config.conversation.text_only`), created on first setup (`POST /v1/convai/agents/create`) and updated when the person edits their details (the update route in the agents reference). A table keeps `wawuUserId`, the provider's agent id and the details (name of the business, what they offer, prices and hours as free text, how to reply), with an additive migration and rollback. The details are limited by a setting. The agent and its stored details are deleted when the account is deleted (the account-purge spec lists them), and when the person clears their Receptionist.
- **A message.** Seam method `askAgent` (the conversation over the provider's socket, text only: send the person's `user_message`, read the `agent_response`). Route `POST /ai-tools/receptionist/messages` (`message`, `quoteToken`, `Idempotency-Key`; the answer is the reply, synchronous because one reply is quick). Plan action `receptionist_message` (20 a message, flat). Hold, ask, store the reply, COMMIT; any failure releases. The conversation's earlier turns are kept by the Hub (a bounded number, a setting) and replayed so the reply has context: the builder records how in the report.
- **Set-up routes.** `PUT /ai-tools/receptionist` (the details) and `GET /ai-tools/receptionist`, `DELETE /ai-tools/receptionist`, owner only.
- **Catalogue entry** with `input.kind: chat`, listed only when the provider is configured.
- **Not built, and not to be assumed:** answering a person's real inbox, DMs, comments or phone calls; the voice price (`receptionist_voice_per_min`, 400 a minute, is in the plan file and not on the tile).
- **The stand-in** gets an agent create, update and delete route and a text conversation that echoes a fixed reply, with the failure markers.
- If this runs past about 60 minutes, split the agent upkeep (set-up routes, purge) from the message route, push the first and report.

## Provisional figures (R-65: the owner confirms, an admin changes them any time)

- `points.action.receptionist_message` 20 a message: the PT1 tile's figure (exists; PROVISIONAL `DV2-BOARD-FIGURE`).
- `ai.receptionist_details_max_chars` and `ai.receptionist_history_turns`: product limits no board or provider page gives; the builder adds them as PROVISIONAL settings with the lead's pick and reports them.
- Owner questions for the report: what the Receptionist does for a creator (G-AITOOLS-06-1), and whether voice (400 a minute) is wanted.

## Capability checks

- [ ] `GET /ai-tools` lists Receptionist at "20 points a message" before anyone uses it (only when the provider is configured).
- [ ] A person saves their details, sends a message, and gets a reply; 20 points are held, then kept on the reply, and given back when it fails.
- [ ] The same `Idempotency-Key` twice sends one message and holds once; two messages at once never take points below zero.
- [ ] Details over their limit are refused with nothing created at the provider.
- [ ] Deleting the account (and clearing the Receptionist) removes the agent and the stored details, shown by the stand-in's state.
- [ ] Another person's Receptionist is never readable or usable.
- [ ] Every earlier tool still passes its specs untouched.

## History

None yet. Reports go to tasks/history/AITOOLS-06.md.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
