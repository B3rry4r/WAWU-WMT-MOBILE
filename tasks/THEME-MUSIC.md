---
id: THEME-MUSIC
title: The WAWU theme plays in the app from a round button above Create, and the Sound row says what it does (R-99)
owner: YOU
area: OPS
order: -166
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-99, R-47, R-37]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# THEME-MUSIC · The WAWU theme plays in the app from a round button above Create

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/THEME-MUSIC` from `origin/main` `564c8c28`. Not verified yet. No task before it is needed, so `depends_on` is empty.

| # | What (source) | Outcome | Where |
|---|---|---|---|
| 1 | One theme player for the whole app, outside React (R-99; the website's `src/lib/sound.ts`) | Built. `expo-audio` `createAudioPlayer`, `loop = true`. The song is fetched with `expo-file-system` on the first tap only, into the app's documents folder (the phone does not empty it, so a person who left the music on hears it again without a second 8.7 MB download), downloaded beside its name and moved into place whole. Silence is the default. It pauses when the app leaves the screen (AppState) and plays again on return if it was on. Nothing is set for the background: `app.json`, `package.json` and the audio modes are untouched | `src/features/music/themeMusic.ts`, `themeTrack.ts` (`themeTrack.web.ts` plays the address in the browser build) |
| 2 | On or off is remembered on the phone only | `loadMusic` and `saveMusic` beside Theme and Alert sound in `devicePrefs.ts` (key `wmt.pref.music`). The app resumes only if it was left on and the song is still on the phone; it never downloads at open | `src/features/settings/devicePrefs.ts` |
| 3 | A piece with sound starting stops the song and the button shows off | Every piece plays through the feed's `VideoSurface` and `AudioSource`; both tell `pieceSound.ts` when `playing` turns on, and the theme player listens. It also cancels a start that was still downloading. Stopping this way is remembered as off | `src/features/feed/player/index.tsx`, `index.web.tsx`, `src/features/music/pieceSound.ts` |
| 4 | The round button above Create | 44 across (`layout.tapMin`; the website's is 44 beside a 56 Create, the app's Create is 58): the Create button's circle family in the chrome surface with the hairline edge and the secondary ink, the accent only on the icon while it plays. Play when off, Pause when on, from the app's icon set; "Play music" and "Pause music"; a spinner while the first download runs; a failed download says so in a toast and the button stays on Play. It stands above Create on Create's vertical line with `space.md` between; with no Create (a member, or the Wallet tab) it is centred in Create's slot. Not drawn on Inbox, a piece's page, a chat or paid thread, a community, schools or the library | `src/features/music/MusicButton.tsx`, mounted by `src/app/(tabs)/_layout.tsx` (SHARED-CHANGES THEME-MUSIC #1) |
| 5 | Settings rows (R-99) | "Sound / Taps and alerts" is now "Alert sound" / "When something arrives while you're in the app" (same switch, same `wmt.pref.sound`, `installPushHandler` still reads it); new "Music" / "Our theme song" row (R-37: the app never names WAWU; the failed-download toast says "Our theme song" too) holds the button's state | `src/features/settings/SettingsScreen.tsx` |
| 6 | A lone button at the foot of a feed card, for a viewer with no Create button (lead ruling, 27 Oct 2026: R-99 updates SWEEP-R3's full-row rule) | Fixed. `ButtonRow` always stops short (70 clear), as it does for a creator and beside Message, so a lone Profile never runs under the music button in Create's slot; the member's Profile button is 280 wide (x 20 to 300) and the music button starts at 321. The `useIsCreator` check in `CardFrame.tsx` is gone. `DECISIONS.md` R-99 carries "*Updated by R-99: a lone button stops short of the music button.*" (DECISIONS has no separate SWEEP-R3 line) | `src/features/feed/CardFrame.tsx` |

Changed assertion (one, by the lead's ruling): `ProfessionalMessage.test.tsx`, "a viewer with no Create button gets a lone Profile across the whole row" is now "... gets a lone Profile that stops short too, clear of the music button in Create's slot (R-99)" and expects `marginRight: 70` where it expected `0` (the comment above it says why). No other existing test changed. `settingsScreens.test.tsx` (R-37: "names the app, not WAWU") is as on main and passes unedited; the Music line is "Our theme song" (lead ruling, 27 Oct 2026: R-37 wins over the first wording of R-99).

Pictures (web export at 390 by 844, dark; the Hub and the track were stood in by a harness that is not committed, and the track was a local copy served in place of the wawuafrica.com address): `music-creator-off.png`, `music-creator-on.png`, `music-member.png`, `settings-sound.png`, plus `music-member-feed.png` (a member's For you card with a lone Profile button), all in the builder's folder `scratchpad/theme-music-b/`. Measured on the page: the creator's button is 44 across at x 321, y 624, Create is 58 at x 314, y 680, so the centres are on one line (343) with a 12 gap; the member's button is centred in Create's slot (y 687 to 731 against 680 to 738). One tap on the creator's button played the song in the browser build (looping, advancing, 229 s long).

Checked after the fix: `music-member-feed2.png` shows the lone Profile button stopping 21 short of the music button (buttons row 280 wide, music at x 321). Today's creator rail: the music button is a 44 circle on the right edge over the half-visible third card, which swipes clear; Create already covers that card the same way in the unscrolled page, so no change was made. One difference, for a creator scrolled to the end of Today: Create then clears the cards and the music button (56 above Create) overlaps the bottom-left of that third card's Follow button; the page's own end padding (`bodyBottomCreator`) clears Create only.

**NOT RUN:** a phone (sound on a real device; the player is proved against a stand-in for `expo-audio`). A real fetch of `wawuafrica.com/wawu-theme.mp3` (no agent calls that host). The full `npm run check` (the merge agent runs it once per batch).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`; `DECISIONS.md` R-99, R-47
- The website's own build, read only: `src/lib/sound.ts`, `src/components/layout/SoundToggle.tsx` in wawuafrica

## Goal

The WAWU theme plays in the app the way it does on the website, from a button above Create, and Settings says what its sound rows do.

## Scope

`src/features/music/**` (new), `src/features/feed/player/index.tsx` and `index.web.tsx` (one call each), `src/features/feed/CardFrame.tsx` (the lone button row), `src/features/settings/devicePrefs.ts` and `SettingsScreen.tsx`, `src/features/push/registration.ts` (a comment), `src/app/(tabs)/_layout.tsx` (SHARED-CHANGES THEME-MUSIC #1), `DECISIONS.md` R-99.

## Capability checks

- [x] A person taps the round button on Home and the WAWU theme plays on a loop; the song is fetched on that first tap only and played from the phone afterwards.
- [x] While the song downloads the button shows it is working; a failed download says so in a toast and the button stays on Play.
- [x] A person who left the music on hears it again the next time the app opens; one who left it off, or never turned it on, hears nothing.
- [x] The song pauses when the app leaves the screen and plays again on return if it was on; it never plays in the background.
- [x] A piece with sound starting stops the song and the button shows Play.
- [x] The button stands above Create on the same vertical line; for a person with no Create button it takes Create's place.
- [x] The button is not drawn where a person reads or talks.
- [x] Settings has an "Alert sound" row (still the switch push notifications read) and a "Music" row that holds the button's state.
