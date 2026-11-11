# APP-THUMBS history

## Builder report, round 0 (11 Nov 2026, Sonnet builder, T1)

Mobile `wmt/APP-THUMBS`, contract from Hub main `bf3f4a3b`.

**Changed (small copy drawn through `src/lib/thumbs.ts`):** `Avatar` (`thumbs`), `MediaCard` (`imageThumbs`), `PositionedImage` (`thumbs`, `drawn`), `pictureCandidates(.., small)`. Callers: feed rail avatar (`feed/parts.tsx`), creator-card work tiles (`FeedCreatorCard`), Explore `CreatorCard`, Today `CreatorRail`, profile `NameBlock` (own `MeScreen`, visitor `VisitorProfileScreen`), `FollowScreen`, content-detail `MakerRow`, Me grid tiles (`ContentGrid`), search content rows (`ContentRow`).

**Left full, by design:** a piece's own page and media (`content-detail/Media`), `PictureViewer` zoom, full-screen feed posts (`TemplatePost`, `PhotoSetPost`), portraits of `FeedCreatorCard`/`FeedProfessionalCard`, profile covers (full width), photo-position and edit-profile screens.
**Left full, no typed field in the contract:** search people rows, known-follower faces, Saved and Purchases tiles (the Hub serves `*Thumbs` there but the contract does not declare them), chat and community avatars, professionals directory, send payees.

**Rule:** w96 up to 96 device px, w640 up to 640, else full; device px = points x `PixelRatio.get()`; size unknown gives w640; the `#wmt-pos` fragment is carried onto the copy; a failed copy gives the full picture once (`useCopy`).

**Checks:** tsc EXIT 0; lint EXIT 0 (0 errors); gates EXIT 0; `npm run tasks -- --write` EXIT 0; 32 new tests pass (`src/lib/__tests__/thumbs.test.tsx`, `src/components/__tests__/thumbsDrawn.test.tsx`, web, android, ios). Unique string in the export: `avatarThumbs` (5 chunks in this build, 0 in main's).

**Measurement** (Hub `bf3f4a3b`, own Postgres 16529, storage stand-in 16528; production exports served with `vercel.json` headers, CSP hosts swapped; 7 avatars of 5 MB noise JPEGs, the worst case for size; viewer signed in through the real sign-in; cold browser context each run; the pictures' transfer time is modelled as bytes over 200 kB/s, because delaying the route handler hung the browser; the JS bundle is not throttled):

| build/width/page | pictures | picture bytes | small copies | time to last picture at 1.6 Mbps (bytes / 200 kB/s, modelled) |
|---|---|---|---|---|
| mine/390/today | 6 | 761 KB | 6 | 3.9 s |
| mine/390/explore | 6 | 761 KB | 6 | 3.9 s |
| mine/390/creators | 6 | 761 KB | 6 | 3.9 s |
| mine/390/profile | 0 | 0 KB | 0 | 0.0 s |
| mine/390/piece | 2 | 2423 KB | 1 | 12.4 s |
| mine/1440/explore | 6 | 761 KB | 6 | 3.9 s |
| mine/1440/profile | 0 | 0 KB | 0 | 0.0 s |
| base/390/today | 6 | 29602 KB | 0 | 151.6 s |
| base/390/explore | 6 | 29602 KB | 0 | 151.6 s |
| base/390/creators | 6 | 29602 KB | 0 | 151.6 s |
| base/390/profile | 0 | 0 KB | 0 | 0.0 s |
| base/390/piece | 2 | 7360 KB | 0 | 37.7 s |
| base/1440/explore | 6 | 29602 KB | 0 | 151.6 s |

Reading: Explore, Today and creators draw 6 avatars: main 30,313 KB (151.6 s modelled), this build 780 KB (3.9 s). The piece page: main 7,537 KB, this build 2,482 KB with one small copy (the maker's avatar) and the full preview picture still fetched. Profile (`/profile/<id>`): 0 pictures on both builds, NOT a result.

**Seeded (setup only, by SQL on my own database):** accounts through the real sign-up; avatars through presign, PUT and PATCH (copies made by the Hub); the 6 creators' accountType and one live picture piece each by SQL, their piece pictures uploaded through the avatars folder (a content upload answers 402 without a tier); two pieces set to paid at 2,500. Handles set through `PUT /users/me/handle`.

**NOT RUN:** full `npx jest -w 2` to a summary line (the run was paused during the measurement, resumed afterwards, log `/tmp/at-jest.log`; no suite was named as killed); the profile page measurement; the 390/1440 light and dark pictures of Explore, Today, a profile and a piece page, and the side-by-side avatar sharpness check (the pictures in /tmp/wmt-shots/app-thumbs/ from the first runs are of the Set up your account screen, not of these pages, and were not looked at as proof); in the browser: the forced null field, the forced 404 copy and the piece page network log (the first two are proved in jest only; the third by the table above); a feed card on Today (the stack's Today showed the creators rail only); a viewer holding a tier. Phone check: none needed beyond the owner's update.

**Full jest (`npx jest -w 2`, whole run, paused during the measurement and resumed):** Test Suites: 546 passed, 546 total. Tests: 6 skipped, 8087 passed, 8093 total. EXIT 0. No suite failed or was killed.
## Verifier report, round 0 (11 Nov 2026, T1 verifier)

**Verdict: FIX.** The pictures are NOT RUN, so by hard rule 1 this cannot be MERGE.

**Why the pictures are NOT RUN (blocker for this verification, not a code finding):** the Postgres the stack needs (127.0.0.1:14001) was not running on this machine (nothing listening on 14001 or 5432), and starting a system service is forbidden to this role. No Hub stack, no seeds, no browser walk. A second gap: the only photo files on the machine (/tmp/w12v/seed/img) are blurred colour blobs, which cannot show a sharpness loss. A re-run needs Postgres up and a real photo.

**Ran, each to an EXIT line (worktree at 2c1299f9):**
- tsc (4 GB heap): EXIT 0. `npm run lint`: EXIT 0 (0 errors, 16 warnings). `npm run gates`: EXIT 0 (63 gate tests OK). `check_tasks.py`: EXIT 0.
- helper and component tests (thumbs.test.tsx, thumbsDrawn.test.tsx): 32 passed, EXIT 0.
- builder's own full jest log (/tmp/at-jest.log): 546 suites passed, 8087 passed, 6 skipped, EXIT 0.
- my full `npx jest -w 2`: see the line below.
- Tests diff against main: only two new test files (172 added lines); no existing test, gate or baseline file touched. Nothing weakened.

**Findings (code read only):**
- MEDIUM: a copy that stalls (request never errors) is never replaced. `useCopy` reacts only to `onError`; there is no timeout, so a hung copy leaves the avatar or card on its placeholder indefinitely. A 404 or network error is handled once, with no loop (tests prove it in jest; the browser 404 count is NOT RUN).
- Not verified in a browser: sharpness at 3x and 1x, the network table per screen, a null field in the browser, the paid-piece card network, the places left full. The helper logic (44 pt at 3x = 132 px = w640; null gives the full picture; `#wmt-pos` carried onto the copy) reads correct.
- Paid piece: copies are taken only from `coverThumbs` and the preview's thumbs (`previewThumbs`, `thumbnailThumbs`); the code never builds a copy from the locked full file. Not seen on the wire.
- my full `npx jest -w 2` (first try killed by a 10 minute limit, re-run alone): Test Suites 546 passed, Tests 8087 passed, 6 skipped, 8093 total, EXIT 0.

## Builder report, round 1 (11 Nov 2026; fix for the verifier's MEDIUM, lead ruling 11 Nov)

Merged the verifier report (444e9e8f) into the branch. `useCopy` (`src/lib/thumbs.ts`) now also gives up on a copy that has not loaded within 8 s (`COPY_TIMEOUT_MS`) and switches to the full picture once, as on an error. The timer is set only while a copy is the source and has not loaded, cleared by the effect cleanup on load, on switch and on unmount; a load after the switch is ignored (the source is already the full picture); no copy, no timer; a full picture that then fails goes to the caller's `onError` (the screen's own placeholder or mark), as before. `PositionedImage` passes its image `onLoad` to `copy.onLoad()`. Code change: 21 added lines in `src/lib/thumbs.ts` and `src/components/PositionedImage.tsx` (comments included), 10 removed.
Tests (`src/lib/__tests__/thumbs.test.tsx`, android and web, fake timers): a stall switches at 8 s (not at 7.999 s); a load at 7.9 s does not switch; an unmount before 8 s clears the timer; a late load after the switch is ignored and nothing switches again; no copy sets no timer. On the old hook (6ac5bb65) 8 of the 37 tests fail; on the new one 37 of 37 pass.
Checks: tsc EXIT 0; eslint on the changed files EXIT 0; `npm run gates` EXIT 0; thumbs and component tests (14 suites, 185 tests) EXIT 0; `npm run tasks -- --write` EXIT 0. Full jest left to the verifier.

## Verifier report, round 1 (11 Nov 2026, T1 verifier, tree 95ab5cfc)

**Verdict: MERGE.** The pictures ran this time, in a browser, against a real local Hub. No finding is medium or worse. Evidence: `/tmp/wmt-shots/app-thumbs-verify2/` (screenshots, `pair-*.png` branch left and main right, `fallback-*.png`, `net/*.json`).

**Setup.** Hub `bf3f4a3b` in its own worktree (`npm ci`, sharp present), `scripts/dev/stack.sh` name `atv2`, ports 16540-16543, the repo's storage stand-in on 16545, database `atv2_wawu_hub_test` on 14001. Five creators, avatars through presign, PUT, confirm, PATCH: 10 `.t640.webp` and 10 `.t96` copies exist in the stand-in (5 old, 5 re-uploaded), plus copies for 8 piece previews. Every creator holds a tier (SQL, setup only) and the pieces were made with `POST /content` (4 paid and 1 free picture pieces for the first creator, one paid each for the rest; set live by SQL). Two production web exports with the `vercel.json` headers, behind a proxy to the Hub: branch (`avatarThumbs` in 5 chunks) and main b62e2ae4 (0). The viewer's tokens came from a real login on the stack's mock ID and were put in localStorage (not typed into the sign-in screen). Browser: 390 at device scale 3 and 1440 at scale 1, light and dark.

**Setup note (not a finding about the code).** `design/_ds/wawu/assets/mock/p1.jpg` to `p5.jpg` are NOT real portraits: they are the generic purple silhouette illustration, identical to the app's own placeholder, so they cannot show a sharpness loss (my first run could not tell a drawn avatar from the placeholder). I used the real JPEG scenes `e1 e2 e3 w5 w6` as the five avatars and `w1 w2 w3 w4 w5 w6 e1 e2 e3` as previews, covers and full files.

| Pass / check | Result | Evidence |
|---|---|---|
| 1 Pictures, 390 and 1440, light and dark, branch and main | passed (Explore, Today rail, Following and For you posts, profile, Me grid, piece page, search content rows, search people, `/creators`) | `pair-me.png`, `pair-megrid.png`, `pair-piece.png`, `pair-390-light-today-rail.png`, `pair-390-dark-today-rail.png`, `pair-x1440-*.png`. Looked at: nothing softer on the branch; the 44 px avatar at 3x loads `.t640.webp` (Today and Explore network lists) and is as sharp as main. |
| 2 Network per screen | passed, one miss (below) | table below |
| 3 Fallback in the browser | passed | below |
| 4 Paid | passed | no request to `content/full` in any of the 72+ loads; paid tiles in the Me grid draw the blurred preview copy on both builds; Following and For you draw `content/preview` only |
| 5 Places left full | passed for search people (full, same bytes as main); Saved, Purchases, chat and community avatars, directory, send payees NOT RUN in a browser (no seeded saved items, chats or payees); none of their files is in `git diff --name-status origin/main...HEAD` |
| 6 Tests | passed | below |

**Network, light, 390 (branch / main), picture bytes on the wire (copies vs full):**
| screen | branch | main |
|---|---|---|
| today | 5 copies 140,610 B | 5 full 284,579 B |
| explore | 5 copies 140,610 B | 5 full 284,579 B |
| creators (See all) | 0 copies, 5 FULL 284,579 B | 5 full 284,579 B |
| profile (visitor) | 2 copies 94,656 B | 2 full 163,601 B |
| me | 5 copies 121,642 B | 5 full 261,751 B |
| piece | 1 copy (maker avatar) 13,432 B + 1 full preview 48,611 B | 2 full 85,894 B |
| search content | 1 copy 19,542 B | 1 full 48,611 B |
| search people | 0 pictures | 0 pictures |
1440 is the same except `/creators` draws 5 copies (140,610 B). Dark equals light. The piece page loads the full preview, and the maker row the copy. Following and For you: the rail avatar is a copy, the full-screen post is the full preview, as designed. The sizes are small because the test photos are 800 px wide; with the 5 MB photos of round 0 the saving is the builder's 30 MB to 0.8 MB.

**Fallback (explore, 390, `fb.js`):** null fields (response rewritten): 5 requests, all the full picture, none for a copy. A copy answering 404: each copy requested once at 1.0 s, then the full picture once at 1.1 s, nothing more (5 and 5). A copy never answered (route held): the copy requested once at 1.0 s, the full picture once at 9.0 s (the 8 s timeout), no loop; the held copies released at 11.2 s (a late answer) caused no further request and the screen kept the full picture (`fallback-stall.png`).

**Tests, each to an EXIT line (worktree at 95ab5cfc):** tsc (4 GB) EXIT 0. `npm run lint` EXIT 0 (0 errors, 16 warnings, no file changed). `npm run gates` EXIT 0 (63 gate tests OK). `check_tasks.py` EXIT 0. thumbs.test.tsx and thumbsDrawn.test.tsx: 42 passed, EXIT 0. Full `npx jest -w 2`: Test Suites 546 passed, 546 total; Tests 6 skipped, 8097 passed, 8103 total; EXIT 0. Test diff against 2c1299f9: `src/lib/__tests__/thumbs.test.tsx` +73 lines, nothing removed; against main: two new test files only (+245), no gate, baseline or existing test touched. Nothing weakened.

**Findings:**
- LOW (differs-for-recorded-reason, owner may want to know): `/creators` ("See all") at 390 on a 3x phone fetches the FULL picture for each card, not a copy. The card is about 180 by 270 points, so its long side is about 810 device pixels, above 640, and the rule gives the full picture (a 640 copy would be drawn 1.27 times larger and soft). At 1440 and on Explore and Today cards (under 640) it draws copies. Same bytes as main, so no regression; but the capability check "fetch only small copies" is not met on this one screen, and the builder's table (6 copies at 390 on creators) did not reproduce here. A bigger copy from the Hub would fix it; that is a Hub task, not this one.
- LOW: the Today feed creator card (`FeedCreatorCard` work tiles) was not on screen: for the seeded viewer, Today showed the creators rail, and Following and For you showed full-screen posts. Its work tiles are covered by the jest tests and by the code diff only, NOT RUN in the browser.
- LOW (test-gap note): none new.

No blocker, high or medium. Round 0's MEDIUM (a stalled copy never replaced) is fixed and seen on the wire.
