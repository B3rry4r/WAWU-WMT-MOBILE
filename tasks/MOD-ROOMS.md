---
id: MOD-ROOMS
title: The host of a room can delete a message and mute a member, and a block holds in rooms; there is no automatic word filter (Apple 1.2, Google Play UGC)
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
# MOD-ROOMS · Moderation for community rooms and the inbox (the host's tools and a block that holds; no word filter)

## Current state

Round 3 (31 Oct 2026, patch builder, T2): **the word filter is taken out completely.** Owner, 31 Oct 2026, verbatim: "Remove the bad words filter please" / "That's too much". R-122 item 6. There is NO automatic word filter anywhere. Moderation is Report, Block, the moderators' Reports queue (Remove, Remove and suspend) and the room host's tools. The filter was never deployed, so this is not a live removal. Hub `wmt/MOD-ROOMS` `e5f9574` (on round 2 `763e156`), app head in the hand-back (on round 2 `edf570fd`). Status verifying. Rounds 1 and 2 word for word: [history/MOD-ROOMS.md](history/MOD-ROOMS.md) (the filter parts there are history).

| Removed in round 3 | Where |
|---|---|
| The word list, the filter helper, `content_blocked` and its sentence, `GET /admin/moderation/words`, `MODERATION_EXTRA_WORDS`, the filter's spec (201 tests) | Hub `src/moderation/` deleted (5 files); `ModerationModule` out of `ugc-report.module.ts` |
| 15 call sites, each file now byte-identical to `origin/main` `37bbe96` | comment, chat (text and file name), community (name, description), content-piece controller and service, product draft, direct message (web question), `dm-reply-writer` (answer), `paid-dm-wallet` (wallet question), store intent (question), user profile, event (incl. speakers), tip note (`purchase.controller`, `wallet-payment`), transfer notes (`wallet-transfer`); plus the room message call inside `community-message.service.ts` |
| The app's `content_blocked` code, the chat bubble's Edit-for-refused-words, the comment box's Hub-sentence line, and their tests | 10 files back to `origin/wmt/STORE-BUY-APP`: `api/errors.ts`, chat (`Bubbles`, `ChatComposer`, `ChatScreen`, `useChatThread`, `hubDouble`, `chatThread.test`), `CommentsSheet`, `contentDetail.test`, `tipFlow.test` |

- **General fixes kept, said plainly: none.** Both round-1 picture fixes were keyed on `content_blocked` (the comment box showed the Hub's sentence only for that code; the chat bubble offered Edit only for it), so both were filter-specific and went with it. The room's own Edit on a refused 400 (`needsEdit = kind === 'validation'`) is older than this task and was never changed.
- **Proof the routes are as on main.** `git diff origin/main` of the 15 call-site files is empty. The protected suite (253 tests) gives 245 passed and 8 failed on this branch and the same 245 and the same 8 on `origin/main` (the 8 are verification and professionals routes answering 502 on the local stack; identical names, `diff` of the two failure lists is empty). `chat` and `community-rooms` specs: the same 4 failures on main (names from the mock WAWU ID). The Hub specs that import the Fintava double (`tip-wallet`, `wallet-transfer`) were not run here; their code is byte-identical to main and CI runs them.
- **Kept exactly (rounds 1 and 2, the verifier held them).** The host's delete and mute and unmute in their room (host only, every send path); live `community.message.removed` and `community.mute.changed` with the catch-up; a moderator's Remove sending the live removal (L2); block in rooms; `CommunityMute`, `CommunityModerationLog` and migration `20261230090000_community_moderation` (rollback refuses to lose rows); no removal of members (R-122 item 4).
- **Tests.** Hub: `mod-rooms.contract.spec.ts` 14 (was 20: the 9 filter tests are replaced by 3 "there is no word filter" tests, a room message, a comment, a chat message and a profile bio with the old refused words are saved as typed, and the old word-list route is 404), `mod-rooms-r2` 1 (was 6: the 5 L1 filter tests removed; L2 stays), `mod-rooms-migration` 3, `live-room-delete` 5, `live-room-mute` 5: 28 of 28. App: `roomModeration.test.tsx` has one new test per platform in place of the filter test ("there is no word filter": the words are posted as typed, no refusal line, no Edit); the rest of the app tests are back to base.
- **Changed or removed assertions, each named.** Hub removed: all of `content-filter.spec.ts`; `mod-rooms.contract.spec.ts` describe "the word filter" (9 tests: room, comment, chat, paid question, wallet and store question, profile, piece and draft, event and community, admin list) and the `blocked(await say(host, BAD))` line of the muted test (now `say(host, GOOD)` and `say(cat, GOOD)` both 201; the test is renamed "a muted member cannot send and the host is never muted; unmuting restores the member"); `mod-rooms-r2.contract.spec.ts` describe L1 (5 tests: wallet tip, wallet and bank send, web tip, store tip, event speakers). App removed: `chatThread.test.tsx` "a chat message with words the Hub does not allow" (android, ios), `contentDetail.test.tsx` "a comment the Hub refuses for its words", `tipFlow.test.tsx` "a note with a word the Hub does not allow" (and its `note_refused` mode), `roomModeration.test.tsx` "a message with a word the Hub does not allow" (replaced). Each tested only the filter. No assertion about host tools, mute, live events, block or money was touched. `inbox/__tests__/live.test.ts` keeps its round-2 branch for the mute event (not filter-specific).
- **Contract.** `npm run contract:build` on the Hub (the file is 62 lines shorter than round 2: the words route is gone; against main it is +242 lines, all the host's tools and moderation routes); copied into the app (`contract/openapi.json`, `SOURCE_COMMIT` `e5f9574`); `npm run api` regenerated nothing else (the words route is Admin, excluded from the app's client). SHARED-CHANGES MOD-ROOMS #1 and #2 updated, no filter.
- **Pictures (round 3, hard rule 1)**, `scratchpad/mod-rooms/shots-r3/`, 390 x 844, dark and light, local stack (Hub from `e5f9574`, the app's web export, mock sign-in), each read: `01-room-message-with-rough-words-sent` (a room message with the words the filter used to refuse is sent and stays), `02-comment-with-rough-words-posted`, `03-chat-message-with-rough-words-sent` (a normal purple bubble, no refusal line), `04-host-menu-report-delete-mute`, `05-host-confirm-mute`, `06-muted-member-calm-line` (the muted member's open room), and `beside-board-*` of each beside boards I25 (room), I12 (chat) and H21 (comments). The host menu has no board (R-29, as before). Nothing was wrong.
- **Records.** R-122 item 6 (items 1 and 5 a, b and d marked withdrawn, history kept); `docs/LOG.md`; `tasks/INDEX.md` by `check_tasks --write`.
- **Fingerprints, computed** with `npx fingerprint fingerprint:generate`: android `e871fe1a`, ios `e8e7de85`. JS only; no package, no native change.
- **PHONE CHECK (no filter items).** (1) Press and hold a member's message as the host: the menu opens, Delete and Mute each show their confirm sheet, and the Android back button closes the sheet. (2) After Mute, the muted phone shows the calm line where the composer was (second phone). (3) A deleted message is gone from the host's screen at once and, with the socket up, from every member's open room (two phones; watch the second) and from a phone that was away. (4) TalkBack and VoiceOver: the host's message offers "Message options". (5) Two phones in one room: mute the other; its composer becomes the calm line with no reopening and comes back on unmute (keyboard up while it happens: the keyboard closes with the composer). (6) Put the muted phone to sleep, mute and unmute from the host, wake it: the line matches the last thing the host did. (7) Send a message with rough words in a room, a comment and a chat on a phone: nothing refuses it.

## Capability checks

- [x] There is no automatic word filter (R-122 item 6): a room message, a comment, a chat message and a profile bio with the words the earlier filter refused are saved as typed (Hub spec, app jest on android and ios, pictures in `shots-r3`), and `GET /admin/moderation/words` is gone (404).
- [x] Every route the filter touched behaves as on `origin/main` `37bbe96`: the 15 call-site files are byte-identical to main and the protected suite gives the same results as main (245 of 253; the same 8 fail there).
- [x] The host of a room can delete any message in it and mute and unmute a member; a member or a stranger cannot (Hub spec, app tests on android and ios).
- [x] A muted member reads the room, cannot send, sees one calm line, and no money moves (Hub spec, app tests).
- [x] If A blocked B, neither sees the other's messages in a shared room, and the room still works for everyone else (Hub spec).
- [x] Every act of a host is logged (who, what, when) and the migration's rollback refuses to lose rows (Hub specs).
- [x] Pictures at 390 px, dark and light, beside the room, chat and comments boards (round 3, `shots-r3`; round 1 and 2 pictures of the host's tools stay in `shots` and `shots-r2`).
- [x] A host's delete leaves every member's open room at once and the catch-up carries it (Hub specs with real sockets, jest on android and ios, and a two-browser picture with no reload).

## Follow-ups
- (Round 1) Live removal on other members' open screens is built: `community.message.removed`. A pre-existing gap seen in the same code, not touched: the Hub's `parseSignal` in `src/live/live-listener.service.ts` has no branch for `money_request.updated`, so a money request's change reaches an open chat only through the catch-up; its own task.
- (Round 3) The word filter is withdrawn; the follow-ups about its list (a native speaker's review, dashboard editing) are void.
- Removing a member already exists (INBOX-25, R-71); nothing here changes it.
