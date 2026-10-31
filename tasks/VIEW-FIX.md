---
id: VIEW-FIX
title: A video and a picture open full screen, the typing box rides above the keyboard, every player shows its loading state, and a titled piece keeps playing on lock whichever screen started it (R-117)
owner: YOU
area: APP
order: -10977
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47, R-29, R-115, R-117]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# VIEW-FIX · Full screen, the keyboard, the loading state and the lock screen (R-117)

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/VIEW-FIX` on `origin/wmt/COVERS-APP` `10cdbf6b`. App only: no new package, no `app.json` change, no native change. Fingerprints stay android `e871fe1a`, ios `e8e7de85` (checked with `npx fingerprint fingerprint:generate` before and after). Ships over the air to store builds 5 and 7. Status verifying.

| Part | Owner's words (31 Oct 2026) | Before | After |
|---|---|---|---|
| A video | "No full screen view for any of the contents?????" | none | a round 44 full-screen button on the piece page's video (and a course lesson) and on the Home feed's video post (top right, where the photo set draws its counter); it asks the player's own view for the phone's full-screen video (`enterFullscreen`, any rotation), same player so same position and play state; a locked piece holds only its preview |
| A picture | same | a photo was drawn, a tap did nothing | one `PictureViewer` (`src/features/feed/PictureViewer.tsx`): black, pinch, drag, double tap, swipe between pictures, close X, Android back (`Modal onRequestClose`); opened from the piece page's photo and the feed's photo set; a frame the Hub gave no address for (locked) is never offered |
| A book, audio | same | book: full-screen reader already; audio: cover drawn whole | book: confirmed (non-transparent modal page, `flex: 1`, black) and now a test; audio: no full screen (R-117 point 1) |
| B keyboard | "on comment the input field remains at the bottom and my keyboard sits upon it" | `KeyboardAvoidingView` with no behavior on Android (edge to edge: nothing moves) | `behavior="padding"` on `CommentsSheet`, `paid-answers/PaidThreadScreen`, `HearNameScreen`, `VoiceIntroScreen`; `RequestSheet` (a bottom sheet) adds the keyboard height under its last row; `useKeyboardLift` answers on Android (the tip and ask sheets use it); the comment box drops the bottom inset while the keyboard is up |
| C loading | "there's not proper loading state for when the audio is still downloading or buffering" | pause showing, nothing heard | one prop on the shared player, `onLoad('waiting' / 'ready' / 'failed')`, read from `expo-audio` (`isLoaded`, `isBuffering`, `error`) and `expo-video` (`status`); the play button keeps its place and shows the spinner; "Couldn't play this. Tap to try again." and stop when the file fails or 15 s pass with no sound; wired into the feed audio and video posts, the piece page (video, audio, course lesson), the Bio player and the Studio result player |
| D lock | "when I play from my own content it doesnt work" | see below | the player takes a titled piece off the lock screen only while it is the one on it |

**Part D, what was found and what was ruled out.** In jest on Android and iPhone (`viewFixLock.test.tsx`: real `AudioSource`, real piece page, real AppState handlers, a stand-in that keeps ONE lock screen the way each phone answers "hide"): the owner's exact path (feed audio played, left by a tab change, then his own audio piece played from `/content/[id]`) plays, takes the content mode before `play()`, shows with its title and goes on when the app goes to the background and comes back, on both phones. So on Android the JS path is correct; ruled out: the title missing on that path (`Media` passes `piece.title`), a focus or AppState pause (none in the feed, the page or `Media`), a hold count or mode order (feed to Me to piece leaves `titled` 1 and `CONTENT_MODE` on the phone), a stale `useAudioPlayer` source. **One real defect found and fixed (iPhone):** `expo-audio` iOS `setActiveForLockScreen(false)` clears the app's one now-playing entry for whoever asks (`MediaController.setActivePlayer(nil)`), so a player let go of AFTER another took over (the feed's post under the stack, a piece paused a moment after the next started) took the new piece off the lock screen. `showOnLockScreen` / `hideFromLockScreen` now track the owner and hide only for it. The test fails on iPhone with that guard removed (proof in the log) and passes on both with it. The Android cause of the owner's report is NOT reproduced in jest; PHONE CHECK 1 and 2 below carry it.

**Proof the ruling is carried out everywhere** (greps on `wmt/VIEW-FIX`): `grep -rn "Platform.OS === 'ios' ? 'padding'" src` (non-test) finds 0; `<FullscreenButton` is used by the piece page and the feed video post, `<PictureViewer` by the piece page and the feed photo set; pictures in `scratchpad/view-fix/shots/`.

**Pictures** (390 px, dark and light, beside the boards H19, H24, H3, H21 rendered with `render_design.py`): `scratchpad/view-fix/shots/video-{dark,light}.png` (piece page video with the full-screen button), `viewer-{dark,light}.png` (the picture viewer), `comments-{dark,light}.png` and `comments-keyboard-{dark,light}.png` (the comment box above a 336 high keyboard), `request-{dark,light}.png` and `request-keyboard-{dark,light}.png` (the request sheet with the keyboard up), `board-*.png` (the artboards). They come from a web export of the dev-only `/preview/view-fix` page, which runs the app's real Android code path in the browser (`Platform.OS` reads android, the keyboard listeners are caught and told `keyboardDidShow`); react-native-web draws `KeyboardAvoidingView` as a plain view, so the page gives it the phone's own `padding` rule while open. The phone's real `KeyboardAvoidingView` is what `viewFixKeyboard.test.tsx` runs. No board draws the full-screen button, the viewer, the spinner or the failure line (lead default, owner may override).

**Checks** (EXIT lines in the hand-back): tsc, eslint on changed files, jest for content-detail, feed, chat, paid-answers, verify, me, points and `src/__tests__`, gates, check_tasks. New tests: `content-detail/__tests__/viewFix.test.tsx` (13), `viewFixKeyboard.test.tsx` (4), `feed/__tests__/viewFixFeed.test.tsx` (7), `viewFixPlayer.test.tsx` (6), `viewFixLock.test.tsx` (4); added to `verify/__tests__/voice.test.tsx` (2) and `paid-answers/__tests__/paidAnswers.test.tsx` (1). **Changed assertions: none.** `src/__tests__/route-guard.test.tsx` gained one map entry (`preview/view-fix`, development only) as every earlier preview route did. Mutations that make the new tests fail: the four `KeyboardAvoidingView`s back to iOS-only `padding` (4 fail), the lock-screen owner guard removed (1 fails, iPhone).

**Not changed, listed (R-117 point 3 says every player; the brief named five):** the loading state is not yet wired into `TrailerScreen`, `VoiceExtras` (sample play), `WorkCover`, `HearNameScreen` and `VoiceHearScreen` (they use the same `AudioSource` / `VideoSurface`, which now report `onLoad`; each screen only has to read it). Typing screens that still have no `KeyboardAvoidingView` or lift and a fixed layout: `community-host/NewCommunityScreen`, `events/organiser/CancelSheet`, `legal/fixed/FixedPriceScreen`, `library/EditDetailsScreen`, `verify/DraftFormScreen` (ShopFrame); scrolling screens with a field near the foot (`create/DetailsScreen`, `events/host/*`, `wallet/BankSheet`, `works/WorkFields`, `search/SearchScreen`) scroll but do not lift. Sweep rows for the lead.

## Capability checks

- [x] A user can press the full-screen button on a video (piece page and Home feed) and the player's view is asked for the phone's full-screen video once per press, with any rotation allowed; a locked piece holds its preview only (`viewFix.test.tsx`, `viewFixFeed.test.tsx`, `viewFixPlayer.test.tsx`, Android).
- [x] A user can tap a picture, see it on black, pinch, double tap, swipe between the pictures they may see, close it with the X and with the Android back button (`viewFix.test.tsx`, `viewFixFeed.test.tsx`); a book opens in a full-screen reader.
- [x] A user's typing box sits on the keyboard on Android: the comment sheet, the paid thread, Hear your name, Voice Intro (the real `KeyboardAvoidingView` padded by the phone's `keyboardDidShow`), the request sheet and `useKeyboardLift` (`viewFixKeyboard.test.tsx`, `voice.test.tsx`, `paidAnswers.test.tsx`).
- [x] A user sees the spinner in place of pause while a file is coming in and the pause the moment it runs, on the piece page, the feed's audio and video posts, the Bio and Studio result players; a file that will not load says so and a tap tries again (`viewFix.test.tsx`, `viewFixFeed.test.tsx`, `viewFixPlayer.test.tsx`).
- [x] The owner's own-content path on Android and iPhone plays, is on the lock screen with its title and goes on in the background; a player let go of late does not take another's lock screen (`viewFixLock.test.tsx`).
- [ ] On a phone: NOT RUN (no device); see PHONE CHECK.

## PHONE CHECK (the owner's phone list, before the update reaches him)

1. Android, own content: Me, Content, an audio piece, press play, lock the screen: it keeps playing, the lock screen and the notification show the piece's name; leave it 5 minutes. Then the same from the Home feed. If the own-content one stops and the feed one does not, send the time it stopped and whether the notification showed.
2. Android: play an audio piece in the feed, go to Me, open your own audio piece from the Content tab, play it, lock: it keeps playing and the controls are for this piece (not the feed's).
3. Android and iPhone: a video piece: the full-screen button opens the phone's full-screen video at the same moment and the same play or pause state; turn the phone sideways, it fills the screen; close it, the piece page is as it was (position kept). A locked video: full screen shows the preview only.
4. Android and iPhone: a photography piece: tap the picture, pinch, drag when zoomed, double tap, swipe to the next picture, the X closes it, the Android back button closes it.
5. Android and iPhone: open a piece's comments, tap the box: the box sits right above the keyboard (not under it); the same in a paid thread, Hear your name, Voice Intro, and the Request sheet in a chat (the field above the keyboard); close the keyboard, they drop back.
6. Android: a slow connection (airplane mode then a weak signal): press play on an audio post and a video: the spinner shows in place of pause until the sound or picture runs; pull the connection mid-play: the spinner comes back while it buffers. A dead link says "Couldn't play this. Tap to try again." and a tap tries again.
7. iPhone: play an audio piece from the feed, then open another from a piece page and play it: the lock screen shows the second one.
8. Older Android (10 to 13), if one is at hand: the comment box and the Request sheet are not lifted twice (a gap of a keyboard's height).
