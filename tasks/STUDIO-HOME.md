---
id: STUDIO-HOME
title: Studio home: one prompt box, chips, a tools grid with a More menu, and Recent (app)
owner: YOU
area: POINTS
order: -40
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [POINTS-12, POINTS-13, POINTS-14, POINTS-15, POINTS-16, POINTS-17, POINTS-18]
decisions: [R-113, R-109, R-47, R-65, R-68, R-61, R-27, R-29]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [PT1]
tier: T1
---
# STUDIO-HOME · Studio home: one prompt box, chips, a tools grid with a More menu, and Recent

## Current state

**Built 30 Oct 2026 (Sonnet builder, T1; mobile `wmt/STUDIO-HOME` on `origin/wmt/S2-APP-2` `43abe9a1`; app only, HELD: not merged into `wmt/STORE-BUY-APP` or main, not sent; no native change, fingerprints unchanged Android `c2474bd9`, iOS `240378f1`; status verifying).** R-113 (lead, from the owner's ElevenLabs screenshot, 30 Oct 2026): the Studio tab is a studio home.

| # | Before (`origin/wmt/S2-APP-2`) | After |
|---|---|---|
| 1 | the points card, a caption line, then a two-column list of tool cards each with its cost | the points card, a big centred two-line title "What would you like to make?", ONE rounded prompt box (several lines, placeholder from the chosen chip), chips under it |
| 2 | no way to start a tool from words | type, pick a chip, "Make": the tool's screen opens with the words in, at its quote (the home starts and charges nothing) |
| 3 | no way to start a tool from a file | "+" (Photo, Video or Audio, only kinds a listed tool takes) attaches a file; the chips become the tools that take it; "Make" opens the tool with the file already going up |
| 4 | every tool a tile with its cost | four to a line: Speech, Music, Image, Video, Dubbing, Talking photo, Voice changer, More (rounded squares, icon over one or two words); the Hub's name and cost stay in each tile's accessible name |
| 5 | no More | a pop-over menu anchored to More (not a screen): icon tile, the Hub's name and its one-line description for every other tool the Hub lists; tap outside and the Android back button close it |
| 6 | no history of what was made | "Recent": the last results (`GET /ai-tools/jobs`, newest first, up to 10) as cards (picture, a tile for a clip, a waveform for audio); a card opens that result's done view, where "Make it a piece" is |
| 7 | for Speech, the voice is chosen on the tool's screen | a round chip with the voice's first letter beside "+" opens a menu of the Hub's voices; the choice goes to the tool |

- **What is built where.** `studioHomeModel.ts` (what each chip, tile, row and card is, from what the Hub lists), `StudioPrompt.tsx` (title, box, "+", voice chip, chips, the attach and voice menus), `StudioGrid.tsx` (the grid and More), `StudioRecent.tsx`, `StudioPopover.tsx` (one pop-over for the three menus, on a transparent `Modal` so the Android back button is its `onRequestClose`), `studioHandoff.ts` (the words, the file and the voice travel to the tool in memory, taken once), `studioApi.ts` (`recentJobsQuery`), `StudioScreen.tsx` (the home). `ToolScreen.tsx` takes the hand-off when it opens (after it has looked for a job left running, which wins) and `useMediaInputs.ts` takes a photo handed over (the same upload path as a chosen photo). `PointsFrame` takes an optional `scrollRef` so the page can bring the box above the keyboard.
- **R-47, checked by tests.** A chip needs a listed, enabled, whole tool that takes words or a description; the "+" and each kind in its menu exist only when a listed tool takes that kind (from the Hub's own rule); a file's chips are the listed tools whose rule takes its type; a More row exists for each other drawn tool and the More tile only when there is one; no prompt tool, no box. With the seven launch tools only the home shows the Speech, Music and Sound effect chips and a working box, tiles Speech, Music and Dubbing, and More with Sound effect, Captions, Clean audio and Quick voice; none of Image, Video, Edit a photo, Talking photo or Voice changer is drawn.
- **Assertions changed (named, owner rule):** (1) `studio-line` ("Every AI voice tool, paid in points" and "Every AI tool, paid in points") is gone with the caption line in `studioFlow`, `mediaToolsFlow`, `studio2ToolsFlow`; the three assertions are removed. (2) A tool that is not one of the seven main tiles is now a row of the More menu, so `studioToolsFlow` (Quick voice, Sound effect), `fileToolsFlow` (Captions, Clean audio), `studio2ToolsFlow` (Split a song, the Receptionist, and the tools that must not be drawn) and the `pressTile` helper in `__helpers__/studio2Harness.tsx` open More before they look for the row; every name and cost assertion on those rows is unchanged. Nothing else in the 23 existing points suites changed.
- **Patch round 1 (30 Oct 2026, Sonnet builder, T1; on `d831d6fa`, held; the verifier's findings 1 to 3; fingerprints unchanged).** (1) HIGH, the More pop-over had no height cap, so with 11 or 12 tools its top left the screen: `placePanel` (`StudioPopover.tsx`) caps the panel to the room between its tile and the screen's safe edge (status bar and home bar, 16 clear), rises above the tile as ElevenLabs' menu does, drops below only when its rows do not fit above and there is more room below, and the rows scroll inside it (a `ScrollView`, `studio-more-menu-rows`); the tile is measured when the menu opens, so a scrolled page is handled. (2) MEDIUM, R-47 dead control: with a file in the box only Edit a photo ("Say what to change (optional)") and Music for a video, when the Hub lists its mood line ("Describe the mood (optional)"), show the words box; every other file chip hides it (the chip and Make stay), and Make passes no words for those chips. (3) LOW, a More row's description may take two lines.
- **Round 1 tests.** `studioPopover.test.ts` (7, pure): across 3 phones, 3 safe-area sets, every tile position and 3 row heights the capped panel is inside the safe edges and clear of its tile; the side choice; the corner before the phone answers. `studioHome.test.tsx` (+17): the words box per chip (recording: none for Dubbing, Captions, Clean audio and no words travel; photo: Edit a photo's box, none for Talking photo, words kept and delivered; clip: the mood box and none for Captions; no mood line listed: no box; file removed: box back); More at 390x844 and 390x667, page unscrolled and scrolled, with all 12 rows and with the four off (11 rows): the panel fits the window and every row is in the scroll list; drops below once the rows are laid out; Android (`Platform.OS` android) at 390x667 with the back button; the two-line descriptions. Assertions changed: none (the 15 above are untouched; the shared `SPECS` map gained the other tools' specs).
- **Round 1 pictures (390 px, dark and light, before / ElevenLabs / after / PT1):** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/sthome-p/pics/`.
- **Tests (`studioHome.test.tsx`, 15, "a user can"):** type a prompt, pick Image, Make: the image tool opens with the words in and its quote, no job route called; Make is off with nothing typed and the placeholder follows the chip; pick a voice for Speech and the tool opens with it; attach a photo: the chips are the photo tools and Make opens Edit a photo with the photo uploading and the words in; attach a recording: the chips are Dubbing, Captions and Clean audio and Captions opens at its quote; take the file out; a file no tool takes is refused with a note; open More and a tool; the launch-only home draws nothing new; a tool the Hub does not list has no tile, chip or row and no More with nothing for it; Recent newest first, a failed job and a tool the app does not draw are left out, a card opens its done view; Recent empty and Recent unreadable. Android (`Platform.OS` android, the real handlers): focusing the box scrolls it above the keyboard (`scrollTo` at the part's top less 8) and the page keeps taps for the chips and Make; the back button (the menu's `onRequestClose`) closes More; the attach picker opens the phone picker with the Hub's types and a picker closed with nothing changes nothing.
- **Pictures (owner hard rule 1), 390 px dark and light, beside PT1 and ElevenLabs' own home:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/sthome-b/pics/beside/` (each: before, theirs, after, PT1 artboard) and `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/sthome-b/pics/shots/` (the app alone): home empty, a prompt with the Image chip, Speech with the voice chip, the attach menu, a photo attached, the More menu, the voice menu, Recent filled, the launch-only home with its More menu, and the full page; taken from the dev web export over a local stand-in Hub (no real host: every non-local address is stopped). The "before" is the same build on `43abe9a1`.
- **NOT RUN by the builder (verifier's V9):** a real sign-in against the local stack with a Hub that lists the tools and holds jobs: the home was built and shot over a stand-in Hub (jest and the picture server); \`GET /ai-tools/jobs\` is typed by the contract (\`AiJobPage\`) and its Recent row is read with the same reader as one job.
- **Default (lead), owner may override:** (a) Make clears the box and the attached file once the tool has them; (b) the Recent strip scrolls sideways, cards 132 wide; (c) the tile's short word for Speech is "Speech" and for Music track "Music"; More rows use the Hub's names; (d) a result that is still working or failed is not a Recent card; (e) a listed tool that is switched off keeps its dimmed tile as before and has no chip.
- **Gaps for the designer (R-29):** G-STUDIO-HOME-1 in `BACKEND_GAPS.md` (no frame of a clip, so a clip's card is a tile with a play mark). No board draws the prompt box, the chips, the pop-over or Recent; they follow ElevenLabs' home as the owner showed it, in WAWU's tokens.

## Capability checks

- [ ] A person types a prompt, picks Image, presses Make, and the image tool opens with the words in and its quote; nothing is started or charged on the home.
- [ ] A person attaches a photo with "+", the chips become the tools that take a photo, and Make opens Edit a photo with the photo already going up and the words in.
- [ ] A person attaches a recording, picks Captions, and Make opens Captions with the recording in and the Hub's quote.
- [ ] A person opens More, sees every other tool the Hub lists with its description, and opens one; the Android back button closes the menu.
- [ ] A person opens a Recent card and its done view opens, with "Make it a piece" for a creator.
- [ ] With only the seven launch tools the home draws no picture, video or voice-changer tool and the box works for Speech, Music and Sound effect.
- [ ] A chip, tile, More row, the "+" and Recent exist only for what the Hub lists (R-47), checked by tests and a grep of the tile and chip maps.

## PHONE CHECK (owner hard rule 2: only a real phone proves these; they go to the owner before the update)

- [ ] The keyboard opens over the prompt box on the phone and the box stays in view with the chips and Make reachable; the multi-line box grows and scrolls with one thumb.
- [ ] "+" then Photo opens the phone's photo library, Video the video library, Audio the files app; the picked file shows in the box and Make opens the tool with it already uploading over mobile data.
- [ ] The More menu hangs from the More tile at the phone's real position (above it, inside the screen), a tap outside and the Android back button close it, on a short phone and on a tall one, with every tool listed and after the page was scrolled; its rows scroll with one thumb inside the menu and the last row (Quick voice) is reachable.
- [ ] With a recording or a clip attached, Dubbing, Captions and Clean audio show no words box; Edit a photo and Music for a video do.
- [ ] The voice chip's menu opens at the chip and the chosen voice is the one on the Speech screen.
- [ ] Recent's cards scroll sideways with a thumb without moving the page, a picture loads, and a card opens its result.
- [ ] Both themes on the phone: the tiles, the chips and the menus read as in the pictures.

## History

None yet. Reports go to tasks/history/STUDIO-HOME.md. NOT RUN is a valid result; leaving it out is not (CLAUDE.md rule 9).
