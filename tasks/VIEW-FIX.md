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

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/VIEW-FIX` on `origin/wmt/COVERS-APP` `10cdbf6b`. App only: no new package, no `app.json` change, no native change. Fingerprints stay android `e871fe1a`, ios `e8e7de85` (checked with `npx fingerprint fingerprint:generate` before and after). Ships over the air to store builds 5 and 7. Status verifying. **Round 1 (proof everywhere) is the last section of this state.**

| Part | Owner's words (31 Oct 2026) | Before | After |
|---|---|---|---|
| A video | "No full screen view for any of the contents?????" | none | a round 44 full-screen button on the piece page's video (and a course lesson) and on the Home feed's video post (top right, where the photo set draws its counter); it asks the player's own view for the phone's full-screen video (`enterFullscreen`, any rotation), same player so same position and play state; a locked piece holds only its preview |
| A picture | same | a photo was drawn, a tap did nothing | one `PictureViewer` (`src/features/feed/PictureViewer.tsx`): black, pinch, drag, double tap, swipe between pictures, close X, Android back (`Modal onRequestClose`); opened from the piece page's photo and the feed's photo set; a frame the Hub gave no address for (locked) is never offered |
| A book, audio | same | book: full-screen reader already; audio: cover drawn whole | book: confirmed (non-transparent modal page, `flex: 1`, black) and now a test; audio: no full screen (R-117 point 1) |
| B keyboard | "on comment the input field remains at the bottom and my keyboard sits upon it" | `KeyboardAvoidingView` with no behavior on Android (edge to edge: nothing moves) | `behavior="padding"` on `CommentsSheet`, `paid-answers/PaidThreadScreen`, `HearNameScreen`, `VoiceIntroScreen`; `RequestSheet` (a bottom sheet) adds the keyboard height under its last row; `useKeyboardLift` answers on Android (the tip and ask sheets use it); the comment box drops the bottom inset while the keyboard is up |
| C loading | "there's not proper loading state for when the audio is still downloading or buffering" | pause showing, nothing heard | one prop on the shared player, `onLoad('waiting' / 'ready' / 'failed')`, read from `expo-audio` (`isLoaded`, `isBuffering`, `error`) and `expo-video` (`status`); the play button keeps its place and shows the spinner; "Couldn't play this. Tap to try again." and stop when the file fails or 15 s pass with no sound; wired into the feed audio and video posts, the piece page (video, audio, course lesson), the Bio player and the Studio result player |
| D lock | "when I play from my own content it doesnt work" | see below | the player takes a titled piece off the lock screen only while it is the one on it |

The round 0 detail (Part D found and ruled out, the proof greps, the first pictures, the first checks) is in `tasks/history/VIEW-FIX.md`. Round 0 changed assertions: none.

**Round 1 (31 Oct 2026, owner hard rule 3: proof everywhere).** Continued from `e27fbaea`. Item 1, the keyboard: every screen and sheet where a person types now keeps the field and its button above the keyboard. The five screens the first round listed are done: community-host/NewCommunityScreen, library/EditDetailsScreen and create/DetailsScreen through `CreateFrame`, verify/DraftFormScreen through `ShopFrame`, legal/fixed/FixedPriceScreen through `LegalFrame`, events/organiser/CancelSheet through `useKeyboardLift`; and the scrolling ones: events/host/*, wallet/BankSheet, works/WorkFields (through `ScreenFrame`), search/SearchScreen. The full grep then found three more sheets with a field under the keyboard (the door's type-code sheet, the wallet's country sheet, the pro listing's add-a-service sheet) and fixed them. One new file `src/components/FieldScroll.tsx` (a ScrollView that scrolls the focused field into view, with `useFootBottom` and `useAnnounceFocus`); no native module, no `app.json` change. Item 2, the loading state: TrailerScreen, points VoiceExtras (sample play), works WorkCover, verify HearNameScreen and VoiceHearScreen now read `onLoad` through the shared `usePlayerLoad` (`src/features/feed/player/useLoad.ts`) and show the same spinner and failure line.

**Every file that holds a text field** (`grep -rlE 'TextInput|<TextField|<PhoneField' src`, tests and the preview page left out): **64 files, 63 handled, 1 not needing** (60 screens, sheets and parts on a frame or a sheet that rides above the keyboard, 3 shared field components, 1 dev gallery).

| Count | Frame or sheet | How it keeps the field above the keyboard | Files |
|---|---|---|---|
| 20 | AuthFrame | AuthFrame, `behavior="padding"` on both phones (set before this task); the form scrolls the focused field into view | abroad/NewRecipientView.tsx, abroad/views.tsx, addmoney/WayScreen.tsx, auth/AuthField.tsx, auth/CodeScreen.tsx, auth/IdentityScreen.tsx, auth/SignInScreen.tsx, auth/SignUpScreen.tsx, bills/parts.tsx, bills/useKeepCaret.ts, chat/ChatSendScreen.tsx, delete-account/ConfirmDeletionScreen.tsx, open-wallet/OpenWalletScreen.tsx, send/AmountScreen.tsx, send/BankRecipientScreen.tsx, send/parts.tsx, settings/ChangePasswordScreen.tsx, wallet/PayoutAccountScreen.tsx, wallet/fx/CryptoSendScreen.tsx, withdraw/WithdrawScreen.tsx |
| 5 | CreateFrame | `CreateFrame` is now a `KeyboardAvoidingView` (padding), its body a `FieldScroll`, its foot drops the bottom inset while the keyboard is up. Covers create/DetailsScreen, community-host/NewCommunityScreen, library/EditDetailsScreen, create price and upload, purchases | community-host/NewCommunityScreen.tsx, create/DetailsScreen.tsx, create/LessonCard.tsx, library/EditDetailsScreen.tsx, purchases/PurchaseSearch.tsx |
| 1 | ShopFrame | `ShopFrame` padded the same way (the product draft form) | verify/DraftFormScreen.tsx |
| 2 | LegalFrame keyboard | `LegalFrame` with `keyboard` pads the whole screen, foot included (the foot used to sit under the keyboard: it was outside the padded part) | legal/fixed/FixedPriceScreen.tsx, legal/matter/parts.tsx |
| 6 | ScreenFrame keyboard | `ScreenFrame keyboard` was already padded; its body is now a `FieldScroll` (scrolls the focused field into view) | capital/ProductScreen.tsx, profile-edit/AboutSections.tsx, profile-edit/EditProfileScreen.tsx, profile-edit/RoleScreen.tsx, profile-edit/SocialLinksScreen.tsx, works/WorkFields.tsx |
| 3 | PointsFrame / ProFrame | padded, body a `FieldScroll`, foot on the keyboard | points/ToolScreen.tsx, points/parts.tsx, pro-listing/ApplyScreen.tsx |
| 7 | own KeyboardAvoidingView padding | `KeyboardAvoidingView` `padding` added (events host screens and shared links with a `FieldScroll` body and the foot on the keyboard; search, schools directory and wallet history, whose search field sits at the top: the list ends at the keyboard) | events/host/HostScreen.tsx, events/host/SentBackScreen.tsx, events/host/hostParts.tsx, events/organiser/SharedLinksScreen.tsx, schools/parts.tsx, search/parts.tsx, wallet/history/HistoryParts.tsx |
| 8 | own KeyboardAvoidingView padding | `KeyboardAvoidingView` `padding` (round 0, or the chat and room screens before it) | chat/ChatComposer.tsx, communities/Composer.tsx, content-detail/CommentsSheet.tsx, legal/parts.tsx, paid-answers/PaidThreadScreen.tsx, paid-ask/parts.tsx, verify/HearNameScreen.tsx, verify/voiceParts.tsx |
| 8 | bottom sheet that adds the keyboard under its last row | a bottom sheet is a modal the keyboard covers: `useKeyboardLift` adds its height under the last row (list sheets also shorten the list). Round 1 added BankSheet, CancelSheet, CountryPicker, the country sheet in CountryStep, DoorScreen type-code sheet (its `KeyboardAvoidingView` inside the sheet measured against the sheet, not the window, and moved nothing) | components/CountryPicker.tsx, chat/RequestSheet.tsx, events/door/DoorScreen.tsx, events/organiser/CancelSheet.tsx, open-wallet/CountryStep.tsx, paid-ask/AskSheets.tsx, tips/TipSheets.tsx, wallet/BankSheet.tsx |
| 3 | shared field component | not a screen: the field components; `TextField` tells the `FieldScroll` it sits in when it takes the focus (`AreaField` and the points convert field do too) | components/FieldScroll.tsx, components/PhoneField.tsx, components/TextField.tsx |
| 1 | development gallery | not needing: the dev-only component gallery, no user reaches it | showcase/Showcase.tsx |

Other sheets that hold no text field, so need nothing: events host ChoiceSheet and WhenSheet, events FilterSheet, legal LetterSheet, open-wallet ChoiceField and StatePicker, EditProfile and Role discard and remove sheets, CryptoSend review sheet, create category and course sheets, the PIN sheet (`PinEntry` is a keypad, no `TextInput`), comments and bills `Modal`s (no field). Proof: `src/__tests__/viewFixRound1.test.tsx` (50 cases: the frames, the sheets, the scroll and the players on both phones, the source inventory, and a grep that no `KeyboardAvoidingView` is iOS-only) and `src/__tests__/viewFixRound1b.test.tsx` (6 cases: the door, country and pro-listing sheets, Android and iPhone).

**Every player** (`grep -rnE '<(AudioSource|VideoSurface)\b' src` and every `expo-audio` / `expo-video` import): **13 uses of the shared players in 10 files, 12 wired, 1 not needing; plus 4 other uses of the libraries, none needing.**

| Player | File | Loading state and failure line |
|---|---|---|
| Feed audio post | feed/AudioPost.tsx | wired (round 0) |
| Feed video post | feed/VideoPost.tsx | wired (round 0) |
| Piece page video, audio, course lesson (3) | content-detail/Media.tsx | wired (round 0) |
| Bio player | me/BioPlayer.tsx | wired (round 0) |
| Studio result player | points/ResultPlayer.tsx | wired (round 0) |
| Trailer | movies/TrailerScreen.tsx | wired (round 1): spinner in place of pause, words over the picture, Play asks again |
| Voice sample play | points/VoiceExtras.tsx | wired (round 1): spinner in the 32 button, the words under it |
| Work video cover | works/WorkCover.tsx | wired (round 1): spinner in the middle, the words, the screen is told to stop |
| Hear your name | verify/HearNameScreen.tsx | wired (round 1): the disc's busy state, the failure line, a press asks the Hub again |
| Hear yourself (Voice Intro) | verify/VoiceHearScreen.tsx | wired (round 1): the pill's loading and error rows |
| Frame grabber of the piece page | content-detail/Media.tsx (`playing={false}`) | not needing: nothing plays, no button |
| Welcome video | auth/WelcomeScreen.tsx | not needing: a muted background loop, no play button |
| Theme music | music/themeMusic.ts | not needing: background music, no player on screen |
| Frame extraction, voice recorder | create/frames.ts, verify/voiceRecorder.ts | not needing: no listening, no button |

Proof of the players: `src/__tests__/viewFixRound1.test.tsx` (each of the five, Android and iPhone: spinner on `waiting`, the line on `failed`) and `voice.test.tsx` (Hear your name).

**Pictures (round 1)**, 390 px, dark and light, the keyboard up (336 high, simulated as round 0 did, from `/preview/view-fix?state=...`), beside their boards, in `scratchpad/view-fix/shots-r1/`: `community-keyboard-{dark,light}.png` (board I32), `bank-keyboard-{dark,light}.png` (the sheet's own list; board A21 draws the bank field), `details-keyboard-{dark,light}.png` (board M23), `search-keyboard-{dark,light}.png` (board X5), `trailer-{dark,light}.png` (the spinner in the play button's place, board MV3), `trailer-failed-{dark,light}.png` (the failure line), and `board-<ID>-{dark,light}.png`. The search picture shows the page's own no-Hub state (the preview has no Hub); no board draws the keyboard, the spinner or the failure line (lead default, owner may override). The scroll-into-view of a focused field and the real keyboard are PHONE CHECK 9 to 12.

**Changed assertions (round 1): none.** The new tests only add cases. Mutations that fail the new tests: `CreateFrame` back to a plain `View` (the frame cases fail on both phones), `DoorScreen` without the lift (the door case fails).

## Capability checks

- [x] A user can press the full-screen button on a video (piece page and Home feed) and the player's view is asked for the phone's full-screen video once per press, with any rotation allowed; a locked piece holds its preview only (`viewFix.test.tsx`, `viewFixFeed.test.tsx`, `viewFixPlayer.test.tsx`, Android).
- [x] A user can tap a picture, see it on black, pinch, double tap, swipe between the pictures they may see, close it with the X and with the Android back button (`viewFix.test.tsx`, `viewFixFeed.test.tsx`); a book opens in a full-screen reader.
- [x] A user's typing box sits on the keyboard on Android: the comment sheet, the paid thread, Hear your name, Voice Intro (the real `KeyboardAvoidingView` padded by the phone's `keyboardDidShow`), the request sheet and `useKeyboardLift` (`viewFixKeyboard.test.tsx`, `voice.test.tsx`, `paidAnswers.test.tsx`).
- [x] A user sees the spinner in place of pause while a file is coming in and the pause the moment it runs, on the piece page, the feed's audio and video posts, the Bio and Studio result players; a file that will not load says so and a tap tries again (`viewFix.test.tsx`, `viewFixFeed.test.tsx`, `viewFixPlayer.test.tsx`).
- [x] The owner's own-content path on Android and iPhone plays, is on the lock screen with its title and goes on in the background; a player let go of late does not take another's lock screen (`viewFixLock.test.tsx`).
- [x] A user's field and its button sit above the keyboard on every screen and sheet that has one (64 files listed below, Android and iPhone: `viewFixRound1.test.tsx`, `viewFixRound1b.test.tsx`).
- [x] A user sees the spinner and the failure line on the trailer, the voice sample, the work video, Hear your name and Hear yourself, as on the rest (`viewFixRound1.test.tsx`, `voice.test.tsx`).
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
9. Android and iPhone: type in the screens round 1 added: New community (name, then the description: the Create button sits on the keyboard), the Details step of an upload, Edit details of a piece, the product draft form, the fixed-price request (legal), Host an event and its Ticket types, Sent back, Shared links, Edit work, Edit profile, the convert and Studio screens, the pro-listing form: the field you type in is above the keyboard, the page scrolls to it when it is low, and the button under the form sits on the keyboard.
10. Android and iPhone: the sheets with a field: Cancel an event (the reason), Choose your bank (search), Choose your country (search), the door's Type the ticket code, Offer your services > Add something you take on: the field and the button are above the keyboard and the list is shorter, not hidden.
11. Android: tap a second field while the keyboard is already up (Title, then Description): the page follows to the new field. Search: type in the box at the top, the results end at the keyboard.
12. Android: the trailer, a voice sample, a work video and Hear your name on a weak connection: the spinner shows, then the sound or picture; a dead link says "Couldn't play this. Tap to try again." and a tap tries again.
