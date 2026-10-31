---
id: MOD-ROOMS
title: Objectionable words are refused where people write, the host of a room can delete a message and mute a member, and a block holds in rooms (Apple 1.2, Google Play UGC)
owner: YOU
area: APP
order: -1289
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [REPORT-UGC, USER-SUSPEND]
decisions: [R-27, R-29, R-47, R-121, R-122]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# MOD-ROOMS · Moderation for community rooms and the inbox, not only comments

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T2). Hub `wmt/MOD-ROOMS` (on `origin/main` `37bbe96`), app `wmt/MOD-ROOMS` (on `origin/wmt/STORE-BUY-APP` `2a9dadcb`); heads in the hand-back. Status verifying. Owner, 31 Oct: "What of moderation for community chats and inbox too??? Not just comments" (R-122). Default (lead), owner may override: everything below that the owner did not say.

| # | Gap (found by grep, verified) | After |
|---|---|---|
| a | No automatic filter of objectionable words anywhere | `src/moderation/` (Hub): refused with `content_blocked`, nothing saved, at every field listed below |
| b | A room's host had no tools in their own room | delete any message, mute and unmute a member (Hub routes + the host's press-and-hold menu) |
| c | "Blocking may not hide messages in a shared room" | **Already there**: the list, "my communities" (preview and unread), live events, catch-up and the push notice all leave out a blocked person either way (SETTINGS-04). Now proven by `mod-rooms.contract.spec.ts`. The inbox chat refuses a blocked person either way (proved in the same spec) |

### Where the filter runs (hard rule 3; each is posted a listed word in `mod-rooms.contract.spec.ts` and nothing is saved)
Comment (`CommentService.create`), room message (`CommunityMessageService.store`, after the mute check), chat message and file name (`ChatService.send`), paid question: web (`DirectMessageService.sendInit`), wallet (`PaidDmWalletService.ask`), store (`StoreIntentService.prepare`); paid answer (`DmReplyWriter.post`, which the reply and respond routes share); profile name, handle, bio, headline, company (`UserProfileService.upsertMe`); piece title and description (`ContentPieceController.create` before any upload work, `ContentPieceService.create` and `updateMine`, `ProductDraftService.create` and `update`); event (`EventService.create` and `update`: name, description, host, host bio, ticket tier names on create); community name and description (`CommunityService.create`, which a room goes through, and `update`). Not filtered, on purpose: the profile's places, skills and links, experience and education lines, a school course, a professional's post, a shop product (the Shop is closed, R-2), a support message and the legal assistant's thread (a person writes to staff there, not to others).

### The filter
- **List**: 171 entries (words, phrases and endings counted as written; `moderationWordList().total`) in 5 languages and 5 categories: English slurs, vulgar sexual words, abuse and threats; Pidgin threats and insults; a short Yoruba, Igbo and Hausa set (needs a native speaker's review); a Hausa word used as a slur. `MODERATION_EXTRA_WORDS` adds words without a release. Moderators read it at `GET /admin/moderation/words`; editing it from the dashboard is NOT built (nothing drawn that is not built).
- **Action**: 400, `reason.code` `content_blocked`, "That has words we don't allow on Who Made This. Change them and try again." (the product's name is "Who Made This", R-37; the brief's "This?." was its own punctuation). The word is never named.
- **False hits**: whole words only. Spec-listed safe words: Scunthorpe, class, classic, assess, assassin, assume, massive, passage, glass, bass, as, ass, cocktail, peacock, Hancock, Dickson, Moby Dick, shiitake mushrooms, analysis, therapist, grape, rapeseed oil, Essex, Sussex, Middlesex, Penistone, cockatoo, bitcoin, title, Niger, Nigeria, Nigerian, snigger, Igbo, Hausa, Yoruba, Fulani, magna cum laude, cumin, "a chink in the armour", "kill the process", "this workout will kill you", "I want to kill time", "go diet", a phone number, "A B C D E F G". Words with an everyday meaning (ass, cock, dick, hoe, cum, rape alone) are not listed on purpose.
- **Not covered, said plainly**: WAWU ID (the sign-in service) holds the name given at sign-up; the Hub filters the name when it is saved through the Hub (`PATCH /users/me`), not at WAWU ID's own sign-up form.

### The host's tools (Hub routes, all new)
`GET /communities/:id/moderation` (`{ muted, mutedMembers }`: the host sees who is muted, a member sees only whether they are), `DELETE /communities/:id/messages/:messageId`, `PUT` and `DELETE /communities/:id/mutes/:userWawuId`. Only the room's host (403 for a member or a stranger). The host cannot mute themselves (400) and only a joined member can be muted (404). A repeat of a mute or an unmute writes nothing new. Tables `CommunityMute` and `CommunityModerationLog` (migration `20261230090000_community_moderation`); every act is logged in the same transaction (who, what, when; a deleted message's id, kind and writer, never its words). A muted send is `403`, `reason.code` `muted_in_room`, "The host has muted you in this room."; nothing is stored or spent; reading is unchanged; a mute survives leaving and rejoining; the host is never muted. Muting reads and writes no pass, credit, refund or wallet.

### The app
`RoomScreen`: the host's press and hold on a message opens `HostMessageMenu` (Report this message for another person's, Delete message, Mute {name} or Unmute {name}); Delete and Mute/Unmute each ask once more in a confirm sheet (Cancel sends nothing; a request the Hub did not take says "Could not do that. Try again." and keeps the sheet). A deleted message leaves the host's screen at once. A member's press and hold still opens the report sheet straight away. A muted member sees one calm line in place of the composer ("The host has muted you in this room. You can still read it."); a send refused as muted removes its bubble and brings the line up. A send refused for a listed word shows the Hub's sentence under the "Not sent" bubble with Edit (the words go back in the field). New: `src/features/communities/HostMessageMenu.tsx`, `api.ts` (4 calls), `useRoomMessages.remove`, `MessagePost` `holdLabel`, icon `VolumeX` (SHARED-CHANGES #3).

### Proof
- **Hub specs** (`src/moderation/tests/content-filter.spec.ts` 89 tests; `src/community-message/tests/mod-rooms.contract.spec.ts` 19; `mod-rooms-migration.contract.spec.ts` 3): every field refuses with `content_blocked` and saves nothing; clean text is unchanged; the safe words pass; host delete and mute work and only for the host (member and stranger get 403, nothing changes); a muted send is refused and a photo does not get round it; unmute restores; leave and rejoin does not lift a mute; the audit rows (actor, target, message id, kind; no words); block hides room messages both ways, in the list and in "my communities"; the migration applies, its checks hold, the rollback refuses while a mute is in force and while the log holds a row, and up, down, up works. Run on a seeded database with the protected suite (253 tests, none changed), `account-data-map`, `data-export-map`, `publishing-gate-coverage` and `hub-rate-limits`.
- **App tests** (`src/features/communities/__tests__/roomModeration.test.tsx`, 9 tests on Platform.OS android and 9 on ios, real handlers): the host menu rows for another person's and the host's own message; the Android back button (`requestClose`) closes it; Delete and Mute ask first and Cancel sends nothing; the DELETE and PUT requests; the menu says Unmute after a mute; a failed delete keeps the sheet and the message; a member gets the report sheet at once; the muted member's line; a muted send's bubble leaves; a refused word shows the Hub's sentence and Edit puts the words back.
- **Changed assertions**: none in existing app tests (the new GET for the moderation state is not a POST, so the room's "writes" assertions hold). Hub: none.
- **Fingerprints**: JS only, no native change, no package: android `e871fe1a`, ios `e8e7de85`.

### NOT RUN (said plainly)
- **Pictures (owner hard rule 1)**: the 390 px dark and light screenshots beside the room and chat boards (host menu, the two confirm sheets, the muted line, a refused message in a comment, a room and a chat) were NOT RUN: the builder reached its step budget before the local stack and web export. This is a FIX for the verifier or the next round, not a MERGE. Folder: `scratchpad/mod-rooms/shots/` (empty).
- Hub tests that need a mail stand-in (`data-export`, 16 tests) fail on `origin/main` too on this machine; `store-question` refund tests read every deduction in a shared database and failed after other suites left rows; one run of `event.contract.spec.ts` after other suites saw 403 and passes alone (54 of 54). CI runs the full suite on a fresh database.

### PHONE CHECK
(1) Press and hold a member's message as the host: the menu opens, Delete and Mute each show their confirm sheet, and the Android back button closes the sheet. (2) After Mute, the muted phone shows the calm line where the composer was (open the room on a second phone). (3) The keyboard: a message with a listed word shows the Hub's sentence under the bubble and Edit puts the words back, with the keyboard still up. (4) A deleted message is gone from the host's screen at once and from another member's phone the next time they open the room. (5) TalkBack and VoiceOver: the host's message offers "Message options" in the actions menu.

## Capability checks

- [x] A word the Hub does not allow is refused with `content_blocked` and nothing is saved, in every field listed above (Hub spec).
- [x] Clean text, and the listed safe words, pass unchanged (Hub spec; the protected suite, 253 tests, none changed).
- [x] The host of a room can delete any message in it and mute and unmute a member; a member or a stranger cannot (Hub spec, app tests on android and ios).
- [x] A muted member reads the room, cannot send, sees one calm line, and no money moves (Hub spec, app tests).
- [x] If A blocked B, neither sees the other's messages in a shared room, and the room still works for everyone else (Hub spec).
- [x] Every act of a host is logged (who, what, when) and the migration's rollback refuses to lose rows (Hub specs).
- [ ] Pictures at 390 px, dark and light, beside the room and chat boards (NOT RUN: step budget; see NOT RUN).

## Follow-ups
- Live removal on other members' open screens needs a new live event type; it is not built here.
- A native speaker reviews the Yoruba, Igbo and Hausa part of the list; the dashboard editing the list is its own task.
- Removing a member already exists (INBOX-25, R-71); nothing here changes it.
