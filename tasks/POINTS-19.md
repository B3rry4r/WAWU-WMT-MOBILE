---
id: POINTS-19
title: Studio: Talk to your Receptionist, a live voice conversation in the app (app, native audio)
owner: YOU
area: POINTS
order: -40
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [AITOOLS-06, POINTS-12]
decisions: [R-109, R-78, R-79, R-43, R-61, R-65, R-68, R-47, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V8, V9, V10]
artboards: []
tier: T2
---
# POINTS-19 · Studio: Talk to your Receptionist, a live voice conversation in the app (app, native audio)

## Current state

- As of 30 Oct 2026, cut (STUDIO2-CUT, lead, from the owner's R-109). Status: todo. Tier T2. Bundle standalone. Order -40 (launch, before CHECK-3); the build order is in `scratchpad/studio2/PLAN.md`.
- **Bundle:** Not bundled: POINTS-19 stands alone as T2 (a native audio capability and a build), budget 130 steps; a full T2 verifier, 90 steps. The lead names the day and asks the owner before any build.
- **Pushing (R-109 point 7):** this app task is built and verified on its own branch `wmt/POINTS-19` and is NOT merged into the phones' branch and NOT sent over the air until the owner has reviewed the pictures and the PHONE CHECK list below. `depends_on` here means built and verified on its branch, not merged; the bundle's branch carries its Hub tasks' contract (`npm run api -- --backend <worktree>`).
- **Credits are limited (lead, 30 Oct 2026).** Builders and verifiers test on the stand-in provider only. This task makes at most ONE real provider call per tool, at the smallest input that proves it, and only when the lead names that call in the brief. It is logged here with the credits it used, measured as the account's credits before and after (`docs/elevenlabs/API-FACTS.md`, "Credits are limited"). No real call is ever repeated to debug.
- **Why T2 and not bundled:** the phone must capture the microphone and play the agent's voice live. The app's audio package records to a file and plays files; whether it can stream both ways is NOT KNOWN here. If the answer is a native module (WebRTC with a token from `GET /v1/convai/conversation/token`, or a raw audio stream package), `package.json` changes, the Android fingerprint changes, and a new build is needed: the lead asks the owner first (the EAS quota is nearly used) and this task never runs `eas build`. A change that is not native ships over the air like the others.
- **Step one is a spike with a written answer** in this file's Current state before any screen: which supported Expo or SDK 57 audio capability streams microphone audio and plays chunks live (read `docs/EXPO-AGENTS.md` and the SDK 57 docs, not memory), whether it needs a native module, and the fingerprint if it does. If it needs one, stop after the spike and hand back with the fingerprint; do not build the screens on an unproven path.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows) and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `DECISIONS.md`: R-109 (this work; it outranks everything here), R-78, R-79 (b to d), R-43, R-61, R-65, R-68, R-47, R-27, R-29. Rulings outrank the boards, the brief and any older task text.
- `docs/elevenlabs/API-FACTS.md`: "Credits are limited", "What the account must have", the section for each tool this task builds, and "Points ratio". Every provider fact in this task comes from there or from a real response.
- `tasks/AITOOLS-01.md`, `tasks/AITOOLS-02.md` (the job pipeline, points hold then keep then give back), `tasks/POINTS-03.md` (hold, commit, release, caps)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md`. No board draws these tools: follow PT1, PT2, PT2a, PT2b, PT2c, PT3, PT3a, PT3b, PT7 (render with `python3 scripts/design/render_design.py PT1 PT2 PT2a PT2b PT2c PT3 PT7 M22` and LOOK, light and dark) and say so in the report (R-29).
- `tasks/POINTS-07.md`, `tasks/POINTS-08.md`, `tasks/POINTS-09.md` (the entry-driven tool screen: `src/features/points/ToolScreen.tsx`, `voiceoverIntent.ts`, `ResultPlayer.tsx`, `studioModel.ts`, `VoiceExtras.tsx`) and the Create flow `src/features/create/` (`draft.ts`, `PreviewScreen.tsx`)

## Goal

A creator taps "Talk" on their Receptionist and has a spoken conversation with it, paid by the minute, kept only for the minutes used.

## What a person does

- On the Receptionist screen taps "Talk", allows the microphone once, sees it connecting, then listening and speaking, can mute and end, and sees how many minutes and points it used.

## Scope

- A "Talk" row on POINTS-12's Receptionist screen, drawn only when this task is built (R-47). `POST /ai-tools/receptionist/voice-sessions` (holds the maximum, answers `{ id, signedUrl, conversationId, maxSeconds }`), the app opens the signed link, streams the microphone and plays the agent's audio, shows a countdown to `maxSeconds`, and on end (or at the maximum, or if the app is closed) calls `.../{id}/end`; the Hub settles the real minutes and gives the rest back (AITOOLS-06).
- States: asking for the microphone, refused (words and the way to settings), connecting, listening, the agent speaking, muted, ended with the minutes and points used, the maximum reached, the link failing or the connection dropping (one retry of the same session, never a second hold), offline. A phone call or another app taking the audio ends the session cleanly. The earpiece and the speaker both work; the person can choose the speaker.
- Phone paths are jest-proven on android with the real handlers where the package allows (permission flow, end-on-back, end-on-background, settle call once); the live audio is the PHONE CHECK.
- **Every value on screen is the Hub's or the person's:** names, costs, units, limits and options come from `GET /ai-tools` and the quote, never a literal; no provider or model maker's name (R-68); no em-dash (R-5); no board draws the screens, so each is PT2's frame and parts (R-29).

## Hub routes it calls

- `POST /ai-tools/receptionist/voice-sessions`, `POST /ai-tools/receptionist/voice-sessions/{id}/end`, `GET /ai-tools` (the Receptionist entry).

## Points (provisional figures: R-65, the owner sets and reviews them before the app ships)

- 400 points a minute (the existing `receptionist_voice_per_min`, in the plan config, not on a tile): **points cost: PROVISIONAL, owner sets.** Provider cost per voice minute NOT KNOWN (the language model and the voice are priced separately); no figure is derived. The owner reads one real conversation's credits (before and after, API-FACTS) from a phone test of a known length, then reviews the price before this app ships.

## Screens

- The voice screen on PT2's frame: a large state line (Connecting, Listening, Speaking), a level indicator, Mute and End buttons, the minutes and points line, the ended summary. Built from existing parts; no board (R-29).
- Gap rows G-STUDIO2-<n> in `BACKEND_GAPS.md` for the designer (R-29): no board draws this tool's input, working and done screens; they are PT2's frame built from the existing parts.

## Capability checks

- [ ] After the spike's written answer, a creator taps Talk, allows the microphone, speaks, hears the agent answer, ends, and sees the minutes and points used; the Hub holds the maximum and gives back what was not used (V8 on the stack, with a second `end` changing nothing).
- [ ] A refused microphone permission says so and leaves text chat working; the Android back button ends the session once and settles once; the app going to the background ends it cleanly.
- [ ] A dropped connection retries the same session once and never holds twice; a session never ended is settled by the Hub at the maximum.
- [ ] The Talk row is absent until this task is built and the Hub lists the Receptionist; no entry names WhatsApp, a phone number or a call (grep).
- [ ] The Android fingerprint is reported before and after (unchanged if the capability is not native); `package.json` and `app.json` changes are listed.
- [ ] A tool the Hub lists that the app has no screen for is not drawn, and a tool the Hub does not list is not drawn; nothing is drawn that is not built (R-47), checked by a grep of the tile map and the Create hub's card.
- [ ] A failed job shows "No points were taken" and the balance is unchanged; a double tap on Run sends one request.
- [ ] Against the local backend on the stand-in, a real sign-in runs one job of each tool the task builds and reads the result back (V9).
- [ ] VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio and Dubbing still pass their tests untouched; the Android back button leaves the tool from every state (jest, Platform.OS android).

## Pictures this task needs (owner hard rule 1)

- Every state of the voice screen (asking, refused, connecting, listening, speaking, muted, ended, maximum, dropped) dark and light at 390 px beside PT2, PT2a and PT2c; the Receptionist screen with the Talk row beside POINTS-12's.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

Phone paths are proven in jest on the native platform (`Platform.OS` android) with the real handlers: picks, uploads and FormData, the Android back button, the keyboard, offline. What only a real phone can prove is the PHONE CHECK list, and it goes to the owner before the update.

- [ ] A real spoken conversation on an Android phone and an iPhone: microphone prompt, the agent's voice out of the earpiece and the speaker, no echo or feedback, and Mute works.
- [ ] A Bluetooth headset, a phone call arriving mid-session, the screen locking, switching apps, and a weak connection each end or recover the session cleanly with the right points settled.
- [ ] One real conversation of a known length (for example 2 minutes) read against the account's credits before and after, so the voice minute's cost stops being NOT KNOWN.
- [ ] If a new build was needed: the build is installed first by the owner (the lead asks him; no agent starts it).

## Proof call (the one real provider call, only when the lead names it)

The owner's real conversation above is the proof; no agent makes a real voice call. AITOOLS-06's one proof call (text) is separate. Expected credit cost of a voice minute: NOT KNOWN.

## Gaps and defaults

- Default (lead), owner may override: the phone talks to the provider directly on a signed link the Hub minted; the Hub carries no audio and settles the minutes afterwards from the provider's own conversation record.

## History

None yet. Reports go to tasks/history/POINTS-19.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9). Owner questions go in this file's Current state, never in chat.

## Owner sign-off

_Owner: date, and "screenshots, PHONE CHECK list and evidence pack reviewed"._
