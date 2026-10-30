---
id: POINTS-12
title: Studio: Receptionist, set-up, knowledge and text chat (app)
owner: YOU
area: POINTS
order: -41
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-06, POINTS-11, POINTS-13]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# POINTS-12 · Studio: Receptionist, set-up, knowledge and text chat (app)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T1. Bundle S2-APP-2. Order -41 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** S2-APP-2 (T1, app), tasks POINTS-16, POINTS-17, POINTS-18, POINTS-12 in that order, one builder, branch `wmt/POINTS-16` (it merges `wmt/POINTS-13` in), budget 180 steps; a lean T1 verifier, 65 steps.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-16` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Replaces the 23 Oct cut** (a set-up screen of text fields and a try-it chat, after launch, R-79 (a)). R-109 builds the Receptionist now. G-AITOOLS-06-1 is closed by R-109: the screens are PT2's frame and parts, no board (R-29).
- **Before:** nothing; the tile is not drawn (R-47) and stays undrawn until this task and AITOOLS-06 are built. The voice button joins this screen only when POINTS-19 is built.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

A creator sets up a Receptionist that knows their business from what they add, and chats with it by text.

## What a person does

- Sets it up: business name, what they offer, how it should reply, then adds what it knows: a typed text, a web link or a document (picked from the phone), and can remove any of them.
- Chats with it: types a message and reads the reply, 20 points a message, and can clear it all.

## Scope

- **A tile is drawn only for a tool the Hub lists AND the app has a screen for** (R-47): `studioModel.ts` maps the tool id to its icon in PT1's grid; nothing is drawn for a tool that is not built, and no inert entry (Create hub's Studio card included).
- **Run is the same path as VoiceOver:** `useJobCheck` (quote, then PT7, or PT3, PT3a, PT3b), then the tool's job route with one `Idempotency-Key` kept on the phone (the same key on a retry, a new one on "Try again"); working read every 2 seconds; done, or failed with the Hub's own sentence ("No points were taken"). A long job keeps working if the person leaves: reopening the tool resumes the running job (`voiceoverIntent`, one record per account and tool), and the `ai_job_ready` notification opens it (a row in `src/features/push/routes.ts` and `kinds.ts`).
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).
- **Set-up:** one screen of the app's existing text fields for the Hub's details (the Hub's limits as counters), Save, and Clear (a confirm). **What it knows:** a list of the added items (name, kind, size) with Remove, and an "Add" choice of text, link or document (document picker, the Hub's accepted types and size, a refused file says why). **Try it:** PT2's frame with the replies listed above a message box; each message runs `useJobCheck` and the message route; a reply that fails shows that no points were taken. The tile reads "20 a message" from the entry.
- **Not built, not drawn:** WhatsApp, phone numbers, calls, call lists, answering a person's real inbox; the voice entry (POINTS-19). No other account type than a creator sees the tile's set-up beyond what the Hub lists.

## Hub routes it calls

- `GET /ai-tools`, `POST /points/quote`, `PUT/GET/DELETE /ai-tools/receptionist`, `POST/DELETE /ai-tools/receptionist/knowledge`, `POST /ai-tools/receptionist/messages`, `POST /uploads/presign` and confirm (`ai/input-doc`).

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- 20 points a message (the PT1 tile's figure, the existing setting): **points cost: PROVISIONAL, owner sets.** Provider cost per message NOT KNOWN, so no figure is derived; AITOOLS-06's proof call measures one message. The owner reviews it before this app ships.

## Screens

- Set-up (fields, Save, Clear), What it knows (list, Add text, Add link, Add document, Remove), Try it (replies, message box, cost line "This uses 20 points"). Working, failed, short balance (PT3).
- States: nothing set up yet, details over the limit, a document refused (type or size), a link that is not https, a reply failing, cleared.
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] A creator saves details, adds a text, a link and a document, sends a message and reads a reply; 20 points are used and the balance shows it.
- [ ] A failed message shows that no points were taken and the balance is unchanged; details over the limit cannot be saved and say why; Remove and Clear remove what they say (jest, then V9 on the stack).
- [ ] A document picked from the phone uploads and is listed; a refused file says why and nothing is added.
- [ ] The tile is absent until the Hub lists the Receptionist and this screen exists; no entry anywhere names WhatsApp, a phone number or a call (grep).
- [ ] With too few points the PT3 sheets appear for the tool and nothing runs until confirmed; past the daily cap PT7 names the reset time (jest, the real cause).
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Studio (PT1) with the task's new tiles, beside PT1, dark and light at 390 px (the tile text is the Hub's).
- For each tool: input empty, input filled, working, done (the result shown), failed and the PT3 short-balance sheet once, each dark and light at 390 px beside PT2, PT2a, PT2b and PT2c (render them); the reports say "no board draws this tool: PT2 pattern".
- Run `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c M22`; every screenshot sits beside its artboard. Pictures NOT RUN is a FIX, never a MERGE.
- Set-up, What it knows (empty and with three items), Try it with a reply.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] A PDF picked from the phone's files app is added and appears in the list.
- [ ] The keyboard stays clear of the message box in Try it and the replies scroll with one thumb.
- [ ] The photo, video or audio pick opens the phone's own picker, the picked file uploads over mobile data and the Run button waits for it.
- [ ] The keyboard does not cover the text box or Run; scrolling the form and the result works with one thumb.
- [ ] Playback of the result works on the phone (sound out of the speaker, a video full screen and back), and the Android back button leaves from every state.
- [ ] Switching apps and coming back while a job is working keeps the job; going offline shows the offline words and nothing is held twice.

## Proof call (the one real provider call, only when the lead names it)

No provider call in this task (stand-in only); the real proof call is AITOOLS-06's. Expected credit cost: NOT KNOWN.

## History

None yet. Reports go to tasks/history/POINTS-12.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
