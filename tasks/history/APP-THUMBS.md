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
