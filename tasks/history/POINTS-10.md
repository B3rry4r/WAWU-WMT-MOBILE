# POINTS-10 · round history

Moved out of [tasks/POINTS-10.md](../POINTS-10.md) word for word, oldest first. The current state is in that file.

## Verifier report

Verifier (Sonnet, T1 lean; built none of this). Mobile `origin/wmt/POINTS-10` `8b7a6f4c` against `origin/main` `55e92734`; backend `origin/main` `c3a2c7a` (AITOOLS-04 merged).

**Verdict: PASS (merge).** No blocker, high or medium. Three lows (below).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Checks | passed | tsc EXIT 0; eslint (no --fix) on the 15 changed `.ts`/`.tsx` files EXIT 0; jest `src/features/points`, `settings`, `create`: 17 suites, 379 tests, 378 pass and 1 timed out at 20 s under machine load (load average 40 to 55): `create.test.tsx` "a user can pick Content, Event or Service, or close"; that file alone: 58/58 pass, so a load flake and not a finding; gates run 10, files scanned 1240, 0 fail, 18 warn, 0 accepted, EXIT 0; `check_baseline` EXIT 0; `check_tasks` EXIT 0 |
| Contract | passed | `npm run api -- --backend` against backend `origin/main` `c3a2c7a`: every AITOOLS-04 path and schema is byte-identical to the branch's copy (no change). The files gain only SIGNUP-NAMES additions from other merges (paths `/users/handle-available`, `/users/me/handle`, `/users/me/identity`; schemas `ChangeHandleDto`, `CompleteIdentityDto`, `HandleAvailabilityView`, `IdentityView`); nothing removed or retyped. Restored afterwards, nothing committed from it |
| V4 Field trace | partly passed | "Use wallet": switch on sent `PUT /me/points/settings`, the Hub's `PointsSetting.useWallet` was `t`, and Settings read it back on after a full reload. PT3's wallet offer as the reader was NOT RUN live (tests only) |
| V5 Picture | passed, with recorded differences | PT2, PT2b and Z2 beside the built screens, 390 px, light and dark: `scratchpad/points-10-v/shots/cmp-pt2-dark.png`, `cmp-pt2-light.png`, `cmp-pt2b-dark.png`, `cmp-pt2b-light.png`, `cmp-settings-dark.png`, `cmp-settings-light.png` (each state alone beside them). Frame, header, "Points: N", cost line and Run match PT2; the player and "N points used · N left" match PT2b. The file row, limits line, transcript card and share row are no board's (G-POINTS-10-1). The Use wallet row is the TGIF row's own look in the same group |
| V6 States | passed | live: wrong type ("That file type is not accepted here. Choose MP3, WAV, M4A, AAC, MP4, MOV or WEBM."), empty file, a recording over the cap (the Hub's sentence: "One job can run up to 10 minutes. This one is 11 minutes."), too few points (PT3a sheet: costs 30, has 10, short by 20), a failed job ("That didn't work. No points were taken. Try again." and the balance back to 5,170). Each drew no cost and held nothing. A file over the byte cap was NOT RUN live (my browser driver cannot hand a 501 MB file to the browser; the phone's check is on the file's size; `fileToolsFlow` covers it) |
| V7 Flow walk | passed | pick, quote ("About 2 minutes", "This uses 30 points" for Captions, "This uses 800 points" for Clean audio), Run, working, done: Captions shows the transcript (selectable text) and "30 points used" with the balance 6,000 to 5,970; Clean audio shows the player (1:30) and "800 points used · 5,170 left"; both again in light. No Share subtitles row on the web (as stated). VoiceOver screen: no "Your voice", no play button, no Save or Use in a product (R-47). Studio lists exactly VoiceOver, Quick voice, Sound effect, Music track, Captions, Clean audio |
| V9 Live seam | passed | local stack `vpt10` (backend `origin/main` `c3a2c7a` on the Nuvion stand-in, voice and storage stand-ins, web export 390 x 844), real sign-in through the sign-in form (mock WAWU ID), the balance 6,000 read from the Hub, a 90 s WAV through presign, bytes, confirm, the Hub's reading and quote, jobs, the transcript. Quick voice run live: 125 points, "125 points used · 5,055 left", player. SHARED-CHANGES #1 and #2: the points, settings and create suites pass untouched (Sound effect, Music and VoiceOver by tests only, not run live) |

Findings:
- **low, defect** `src/features/points/ToolScreen.tsx:405` (with `:402`): once a job is done (or failed) the limits line ("MP3, WAV, ... Up to 500 MB and 10 minutes.") and the "Choose another" row stay above the result; PT2b draws the box and count line and nothing about limits. Repro: run Captions to done. To the POINTS sweep.
- **low, unclear** `contract/SOURCE_COMMIT` says `4dac644 (wmt/AITOOLS-04, backend not merged yet)`, a branch commit. Now that AITOOLS-04 is on `origin/main`, the merge agent syncs once (`npm run api -- --backend`); the AITOOLS-04 part will not change, the SIGNUP-NAMES additions will appear.
- **low, test-gap** not run live: a file over the byte cap, the daily cap, Share subtitles on a phone, Sound effect and Music and VoiceOver runs. Their tests pass (`fileToolsFlow`, `toolFlow`, `studioToolsFlow`).

