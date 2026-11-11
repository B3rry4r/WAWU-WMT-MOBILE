# HUB-THUMBS · round history

Moved out of [tasks/HUB-THUMBS.md](../HUB-THUMBS.md) word for word, oldest first. The current state is in that file.

## Builder report

Hub `wmt/HUB-THUMBS` `fd6b776`. Files: `src/storage/thumbs/{thumb-keys,make-thumbs,ensure-thumbs,remove-thumbs}.ts` (new), `storage.service.ts` (ensureThumbs, thumbsFor, pieceThumbs, sweepThumbs, removeThumbsOf, putThumb), `storage-sweep.service.ts`, `upload-release.ts`, `late-file-sweep.ts`, `own-image.ts`, `account-purge.service.ts`, serving in `feed-cards`, `explore`, `creator-discovery`, `user-profile`, `content-piece`, `search-response`, `me-purchases`, `me-saved`; `scripts/backfill-thumbs.ts`; `src/storage/tests/thumbs.spec.ts` (20 tests); `package.json`, lockfile.
1. Key families copied, each public: `avatars` (shown to everyone), `profile/cover` (profile header), `content/cover` (R-114, public like the preview), `content/preview` (what a non-buyer sees; R-118 makes a picture preview the creator's own 640 px copy). Never `content/full`, chat, kyc, ai, legal, event, community, profile/work, ads. Tests: closed list, 20 refused keys, no request at all for a paid full file, the sweep query names only the four folders.
2. Writes: one PutObject, in `StorageService.putThumb` (the purge-files spec allows only that file; a new spec checks `thumbs/` has none). Copies share the owner prefix and have a row of the owner (folder `thumbs`), so the account purge finds them. They are deleted when the original is (release of a cover or preview, the late-file sweep). Account purge: copies of a cover or preview a kept piece names are added to `soldKeys`, so they stay with it (R-130). A take-down changes the piece, not the files, so nothing is deleted then and buyers keep both original and copies. Avatars and profile covers are never deleted today when replaced (unchanged); their copies go with the account.
3. EXIF/GPS: test builds a JPEG with Make, orientation 6 and a GPS block, proves the input has them, then both copies have no exif, icc, xmp, orientation, and no 'GPS'/'EXIF' bytes; the 300x100 sideways picture comes out upright (100x300).
4. Limits: input over 25 MB (not read), over 50 megapixels (refused from the header; a 20000x20000 PNG of under 200 bytes is refused in under 2 s), `failOn: error` (truncated JPEG left), animated WebP (first frame), 8 s work limit (test with 1 ms), confirm waits at most 2.5 s, 2 at once and 40 waiting then skip, failures remembered 30 min / 6 h. Every path logs and returns; nothing throws.
5. Links go through `readUrlFor` / read-link.ts (test: equal to the direct link, identical on two reads). Fields appear only when `isAppRequest()`; test: no header, `site`, and `pieceThumbs` give nothing. Stack proof: upload with GPS, confirm in 129 ms, bucket held original + `.t96.webp` + `.t640.webp` (96x64 and 640x427 WebP, no exif), `GET /users/me` with the app header had both links, without it no `avatarThumbs` key.
6. Deploy: `.github/workflows/deploy.yml` runs `bash deploy/deploy.sh`, which runs `npm ci --include=dev --no-audit --no-fund` (no `--omit=optional`), so sharp's `@img/sharp-linux-x64` and libvips arrive with it. Clean `npm ci` in an empty folder from the lockfile: 971 packages, `node -e "require('sharp')"` gives 0.34.5 / vips 8.17.3 and a WebP encodes. No workflow or server change.
Checks: see the EXIT lines in the hand-back. Backfill estimate: about 40 minutes per 10,000 pictures averaging 500 KB at 2 at once (`count` mode prints the real figure from the database; not run).
Filed: SHARED-CHANGES `HUB-THUMBS #1`. Gap: no contract types yet, so the app cannot read the fields until it is applied.

## Verifier report


### Round 2 (11 Nov): shared change applied, memory question

- Applied SHARED-CHANGES HUB-THUMBS #1 on Hub `385bf16`: `ThumbLinks` and the optional fields `previewThumbs`, `coverThumbs` (content-piece type) and `avatarThumbs`, `coverThumbs` (profile types); `npm run contract:build`; `git diff origin/main -- contract/openapi.json` is 110 added lines, 0 removed (ThumbLinks schema plus the new optional properties on the feed card, strip, Explore, suggestion, profile and piece schemas).
- Checks (own `hth_test_hub` on 14001, mock on 16318): tsc 0, eslint on changed files 0, gates 0, baseline 0, protected + openapi + the contract-shape specs 289/289 EXIT 0, `src/me` 72/72 EXIT 0, `src/search-response` 260/261 EXIT 1 (only `popular-name.contract.spec.ts`, which fails the same way on a clean `origin/main`), `notice-events` + thumbs spec EXIT 0 (the earlier 1 ms `pin_changed` failure was a flake).
- Memory question: 5 confirms at once with 10 MB photos (4000x3000 JPEG), measured as extra RSS: 90 MB if all 5 ran together on 4 sharp threads, 20 MB on 1 thread, 9 MB with the Hub's own limit of 2 at once (the other 3 wait). All under 400 MB, so `sharp.concurrency` is left at its default. Caveat: shrink-on-load keeps JPEG small; a 12 MB PNG or WebP near the 50 megapixel cap decodes to up to about 200 MB each, so 2 at once could reach about 400 MB. If that matters, lower `MAX_THUMB_SOURCE_PIXELS` (one constant); `concurrency(1)` would not help that case and would only slow a batch (about the same time with 2 at once in the measurement).

## Verifier report, round 0 (11 Nov 2026; recorded by the lead from the verifier's hand-back: the verifier ran out of steps before writing it here)

Verdict: **FIX**. Hub `wmt/HUB-THUMBS` 385bf16, records 17c93ac4.

1. **HIGH (memory).** Two confirms at once of a 49-megapixel interlaced 16-bit RGBA PNG (a 4 MB file, under the 25 MB upload cap, so anyone can send it) raised the Hub's RSS by 1634 MB (563 to 2197 MB). The live droplet has 4 GB, shared (deploy/README.md). `make-thumbs.ts` decodes the picture once per size, so the limit of 2 at once means 4 decodes at once. Other peaks: 5 concurrent 12 MB JPEGs +46 to 71 MB; 2 near-50 MP 8-bit RGB PNGs +114 MB; 2 near-50 MP WebPs +9 MB. Fix ideas: lower `MAX_THUMB_SOURCE_PIXELS` to about 25 MP; decode once and make 96 px from the 640 px result; refuse interlaced or 16-bit input above a lower pixel count.
2. Uploads never fail (pass). These each confirmed 200 and the upload succeeded: a truncated JPEG (no copies, logged), a 50 MB JPEG (over the cap, left), a 20000x20000 PNG (refused from its header), CMYK, a 16-bit PNG, an animated WebP (copies made), and a fake HEIC named .jpg (left). HEIC itself cannot be tried (only jpg, png and webp names are, and sharp's prebuilt does not decode it). A 12 MB photo's confirm took 21 to 32 ms on main and 360 to 430 ms on the branch. Five at once took 0.7 to 1.5 s on the branch, against under 55 ms on main. Both are inside the 2.5 s limit on a local stand-in; real Spaces read time adds to the branch figure.
3. Paid pictures (pass). `thumbSourceOk` was run on 43 keys. Only avatars, profile/cover, content/cover and content/preview (picture extensions) get copies. It refuses content/full, chat, KYC, AI, legal, event, community, profile/work, ads, `..`, `%2e`, absolute paths, doubled slashes, a trailing newline, `.t96.webp` copies, a video preview and a PDF preview. The same key as both preview and full is rejected for paid pieces (`content-piece.service.ts:974`).
4. Storage rows (pass by reading). Copies are written only in `StorageService.putThumb`, as `thumbs` folder rows. The allowance and My uploads count only CONTENT_FOLDERS. The reconcile and the sweeps filter by status and folder. Copies are deleted only through `removeThumbs`, after the original is gone. The account purge keeps a kept piece's copies (R-130). Not run: the purge specs.
5. Additive (pass). Main and branch builds were run on one database. /content/public/featured, /users/me, /search and /feed are byte-identical with no header and with `X-Wawu-Client: site`. With the app header, the answer equals main once the *Thumbs keys are removed. The links are day-stable through readUrlFor. The contract diff has 0 removed lines. Explore, content detail, purchases and saved returned empty or an error and were not compared.
6. EXIF and GPS (pass). No exif, icc, xmp or orientation in either copy. A rotated photo comes out upright. The original keeps its GPS (unchanged by this task).
7. Deploy (pass). The lockfile carries `@img/sharp-linux-x64` 0.34.5 and `@img/sharp-libvips-linux-x64` 1.2.4. A fresh `npm ci` plus `require('sharp')` works. deploy.sh needs nothing else.
8. Tests, partial. src/storage 382/382 and src/me 58/58 pass. Failing on both main and branch: feed-cards.contract, creator-discovery, profile-work-owner, search-people and popular-name (environment). **Failing only on the branch:** search-response.contract, "finds the seeded creator by a substring of their bio". Unresolved: possibly state left by a killed run. Re-run on a fresh database. NOT RUN: tsc, eslint, the gates, check_baseline, the protected suite, account-purge, and the other suites that grep for StorageObject.
9. The backfill's count mode only reads.

### Round 1 (11 Nov): fix for the verifier's HIGH (memory)

Hub `646cb678`. Levers used, all four: (1) decode ONCE: the 640 px copy comes from the original, the 96 px copy from the 640 px result; (2) `sequentialRead` kept; (3) the pixel cap is now 25 MP, and a header-only memory estimate (pixels x channels x bytes per sample, doubled for an interlaced PNG) is refused above 120 MB, so 16-bit and interlaced pictures get a lower pixel allowance; (4) ONE copy job at a time in the whole process (queue, 40 waiting, then skipped to the sweep). A refused picture still uploads and just gets no copies (logged). The test fixtures in round 0 were not really 16-bit or interlaced (sharp ignores `interlace`; the option is `progressive`, and 16-bit needs `toColourspace('rgb16')`); this round's fixtures were checked against their PNG headers.

Rise of peak RSS (fresh process per row; "old" = round 0 code, all N at once; "new" = round 1 code, N calls through the one-at-a-time queue):

kind|MP|depth|interlace|conc|code|rise MB|ms|result
PNG RGBA|49|16|yes|2|old(parallel)|1716|997|ok
PNG RGBA|49|16|yes|2|new(serial)|2|3|refused
PNG RGBA|49|16|yes|5|old(parallel)|1717|2626|ok
PNG RGBA|49|16|yes|5|new(serial)|3|5|refused
PNG RGBA|25|16|yes|2|old(parallel)|918|639|ok
PNG RGBA|25|16|yes|2|new(serial)|1|2|refused
PNG RGBA|25|16|yes|5|old(parallel)|987|1566|ok
PNG RGBA|25|16|yes|5|new(serial)|1|4|refused
PNG RGBA|25|8|yes|2|old(parallel)|481|309|ok
PNG RGBA|25|8|yes|2|new(serial)|0|3|refused
PNG RGBA|25|8|yes|5|old(parallel)|519|839|ok
PNG RGBA|25|8|yes|5|new(serial)|1|4|refused
PNG RGBA|25|8|no|2|old(parallel)|140|262|ok
PNG RGBA|25|8|no|2|new(serial)|56|422|ok
PNG RGBA|25|8|no|5|old(parallel)|265|605|ok
PNG RGBA|25|8|no|5|new(serial)|102|1076|ok
PNG RGBA|15|8|yes|2|old(parallel)|297|253|ok
PNG RGBA|15|8|yes|2|new(serial)|89|406|ok
PNG RGBA|15|8|yes|5|old(parallel)|316|597|ok
PNG RGBA|15|8|yes|5|new(serial)|102|1038|ok

Also measured (new code, N=2 and 5): JPEG 25 MP progressive 83 and 147 MB; a 10 MB 12 MP phone photo 33 and 46 MB, 328 ms for two (about 165 ms each, far under the 2.5 s confirm wait). Worst picture accepted: 25 MP 8-bit RGBA PNG (100 MB decoded), rise 56 to 102 MB; worst refused ones cost under 3 MB. Round 0's 49 MP 16-bit interlaced RGBA PNG: old 1716 MB, new refused with 2 MB. Cost: photos above 25 MP (a 48 MP camera original, uploaded unresized from the web) now get no copies and are served full as before; a spec covers the refusal and the one-at-a-time queue (`thumbs.spec.ts`, 23 tests).

search-response "finds the seeded creator by a substring of their bio": not reproduced. On a fresh database `src/search-response` is 260/261 on the branch with only `popular-name.contract.spec.ts` failing, and that spec fails the same on a fresh main.

Suites on fresh `hth_test_` databases (own mock on 16316), each `--runInBand`: protected + openapi 253/253 EXIT 0; account-purge + account 374/380 EXIT 1 (6 failures in `account-deletion.contract` and `account-deletion-reason-route.contract`); community-message 145/145 EXIT 0; admin 895/895 EXIT 0; search-response 260/261 EXIT 1; the other 97 specs that grep for StorageObject, storageObject, PutObject or purge: 712 + 950 + 576 tests, one failure (`movies.contract`). Branch-only failures: none. On a fresh `origin/main` the same four specs (`account-deletion`, `account-deletion-reason-route`, `movies`, `popular-name`) fail the same 8 tests. tsc EXIT 0, eslint on changed files EXIT 0, gates EXIT 0, check_baseline EXIT 0.

## Verifier report, round 1 (11 Nov 2026; T1 verifier, draft 1 pushed after checks 1 and 2)

Hub `wmt/HUB-THUMBS` 646cb678 against main cb9a037. Stack: own database `htv3_test_*` on 14001, storage stand-in 16339, Hubs 16320 (branch) and 16321 (main), a FRESH Hub process per memory row, RSS sampled every 5 ms from /proc. Fixture headers checked byte for byte (PNG IHDR): 49 MP = 7000x7000 bit depth 16, colour type 6 (RGBA), interlace 1; 25 MP = 5000x5000 depth 16 RGBA, interlace 0; 24.9 MP = 4990x4990 depth 8 RGBA.

### Check 1, memory (PASS)

kind|MP|N at once|peak RSS rise MB|copies made|confirm status
PNG RGBA 16-bit interlaced|49|2|49|0 (refused)|200
same|49|5|47|0|200
PNG RGBA 16-bit|25|2|52|0 (refused)|200
same|25|5|31|0|200
PNG RGBA 8-bit|24.9|2|86|2|200
same|24.9|5|125|5|200
JPEG|24|2|48|2|200
same|24|5|73|5|200
JPEG|12|2|17|2|200
same|12|5|56|5|200
JPEG|50|2|59|0 (over the 25 MP cap)|200
same|50|5|35|0|200
WebP|24.9|2|22|2|200
same|24.9|5|75|5|200

Worst accepted picture: +125 MB (5 at once, 24.9 MP 8-bit RGBA PNG). Limit 300 MB. Round 0's attack (49 MP, 16-bit, interlaced): +47 to +49 MB, was +1634 MB. The refused rows rise 30 to 50 MB, not the builder's 2 MB, because the Hub reads the original (up to 10 MB each) and a cold process warms up; this is noise-level and unrelated to decoding. Fifty confirms of a 4.7 MB 24 MP JPEG at once (check 2): +115 MB.

### Check 2, queue (PASS with one MEDIUM)

- A waiting job holds only `(deps, key)`: the file is read inside `run()` after the job gets the slot (`ensure-thumbs.ts`). Measured: 50 confirms of a 4.7 MB JPEG, peak rise 115 MB; had the bytes been held that is 235 MB plus the decodes.
- 50 confirms in a burst (from 8 loopback addresses to pass the 20-per-second throttle): all 50 returned 200 `confirmed`; the slowest took 2.97 s (the 2.5 s wait plus request overhead); the work carried on after the answer. 41 pictures got copies (1 running + 40 waiting); 9 were skipped as `busy` with no log line and left to the sweep. About 12 s for the 41.
- Bounded: 1 running + 40 waiting, then skipped. Memory stays flat. A restart loses the queue (SIGKILL after 1.5 s of a 70 burst left 42 pictures without copies); the 10-minute sweep (`sweepThumbs`) is the only thing that picks them up.
- Sweep and backfill: the sweep goes through the same one-slot queue as confirm (`ensureThumbs ... background:true`), one picture at a time, so it can sit in front of a confirm for at most one job (a few hundred ms); it cannot starve confirm. The backfill is a separate process with its own queue.
- MEDIUM, sweep depth: see the section "Sweep starvation" below.

### Sweep starvation (MEDIUM, found in check 2)

`sweepThumbs(limit = 20)` reads the 60 newest public pictures of the last 2 hours and stops after LOOKING at 20 (`looked += 1` is counted before `ensureThumbs`, so a picture that already has copies uses up a place). Measured: after a 50 burst and a 70 burst (queue overflow plus a SIGKILL), 51 good 24 MP JPEGs had no copies. The 02:40 sweep repaired 7 (the newest 7 of the 20 it looked at; the other 13 already had copies), the 02:50 sweep repaired 0, and the 51 were still missing 10 minutes later. Once the newest 20 pictures have copies, no older picture is ever reached, until it ages out of the 2-hour window; then it is never repaired (only the backfill, which is not run). On the live server any restart during uploads, or any burst over 41, leaves pictures permanently without copies (served full size: no harm, but the feature quietly fails). Fix: do not count a picture that already has copies (ask for the rows first and skip those), or look at 20 pictures that LACK copies.

### Check 3, upload time (MEDIUM, for the lead to rule)

Confirm of a 12 MP (2.3 MB) JPEG, on main and branch, same database, warm: main single 21 to 43 ms; branch single 160 to 340 ms. Five at once: main 50 to 63 ms each; branch 171 to 755 ms (they queue one at a time). 24.9 MP 8-bit RGBA PNG, five at once: confirm answers at 0.6, 1.2, 1.7, 2.2 and 2.6 s. Fifty at once: up to 2.97 s. So the 2.5 s wait is real and the later pictures in a burst pay all of it. Every confirm returned 200 `confirmed` (also for the three refused picture kinds: 49 MP 16-bit interlaced, 25 MP 16-bit, 50 MP JPEG: 78 to 232 ms, no copies). Inside the task's own 2.5 s rule; but a 5 to 10 times slower normal confirm is the "slower upload" the brief calls a blocker. Options: wait 300 to 500 ms at most and let the rest carry on (the copies then reach the app from the next read), or no wait at all. Needs the lead's ruling.

### Check 4, round 0 passes (PASS)

- Paid pictures: `thumbSourceOk` run on 50 keys (7 allowed, 43 refused): content/full (jpg, png), video, pdf and audio previews, chat, kyc, ai, legal, event(s), community, profile/work, ads, `..`, `%2e%2e`, leading and doubled slash, trailing newline, `.t96/.t640` copies, wrong extensions, other folders, a URL. One note: `avatars/not-a-uuid/<uuid>.jpg` passes the key test, but `run()` also needs a row of that owner whose id equals the folder, so nothing is copied; not a leak. Only the four public families can be copied.
- EXIF: a JPEG with Make, GPS block and orientation 6 (900x300): both copies have no exif, icc, xmp, orientation, and no `Exif`, `GPS` or the camera name in their bytes; the copies are 213x640 and 32x96 (upright).
- Website and dashboard answers: main and branch run on one database; `/users/me`, `/search`, `/feed`, `/content/public/featured`, `/me/purchases`, `/me/saved`, `/users/me/profile-stats` byte-identical with no header and with `X-Wawu-Client: site`. With `app`, equal to main once `*Thumbs` keys are removed; `avatarThumbs` appears only with `app` (real signed links to `.t96.webp` and `.t640.webp`). Not compared: public-profile, visitor-profile, explore, creators/suggestions (404 at the paths I guessed); those rest on the builder's specs.
- Contract diff: openapi.json 110 added, 0 removed; package.json one line (`sharp` 0.34.5).

### Check 5, tests

- tsc (alone, 4 GB) EXIT 0. eslint on the 22 changed `.ts` files EXIT 0. gates EXIT 0 (9 gates, 2241 files, 0 fail, 139 warn, 88 accepted). check_baseline EXIT 0.
- Fresh databases, `--runInBand`, branch vs main (same specs, same failing test names, diff 0 in all):
  - thumbs spec: branch 23/23 EXIT 0.
  - src/storage: branch 385/385 EXIT 0 (main 362/362).
  - src/account-purge: branch 119/119 EXIT 0 (main 119/119).
  - src/account/account-deletion*: 24 failed of 232 EXIT 1 on BOTH (`account-deletion`, `account-deletion-reason-route`): same on fresh main, as the builder said.
  - src/movies: 1 failed of 30 on BOTH.
  - src/search-response: 12 failed of 261 on BOTH (popular-name, search-people, search-response). More than the builder's 1: my mock WAWU ID has no seeded accounts, so I cannot call this a clean pass; but it is identical on main, no branch-only failure.
  - protected-routes: 13 failed of 253 on BOTH (WAWU ID 401, "invalid service key" in my mock setup). NOT a clean pass in my environment; identical to main. The builder's 253/253 is not reproduced here.

### Not done / limits

The `within` 8 s timeout releases the queue slot but does not stop a sharp decode that is still running, so a stuck decode could overlap the next job (low; needs a picture that takes over 8 s). Real Spaces read time is not in any figure. Explore/suggestions bodies not compared. Hub restart on a real droplet not tried.

### Verdict: FIX

1. MEDIUM sweep starvation (above). Small change in `sweepThumbs`.
2. MEDIUM confirm latency (check 3): ruling or a shorter inline wait.
3. LOW timeout does not cancel the decode.

Memory (the HIGH of round 0) is fixed: worst accepted picture +125 MB, the 49 MP 16-bit interlaced PNG is refused for about +48 MB (not 2 MB, but not decoded). No paid picture is copied.

### Round 2 (11 Nov): the verifier's three findings

Hub `b02aa106` (on `646cb678`). Code change outside tests: 26 added and 32 removed non-comment lines in `storage.service.ts` and `thumbs/ensure-thumbs.ts` (`git diff --stat HEAD~1`: storage.service.ts 46, tests/thumbs.spec.ts 125, thumbs/ensure-thumbs.ts 25; 138 insertions, 58 deletions).
1. Sweep starvation: `sweepThumbs` now reads up to 10 x limit candidates, asks one query which already have both copies, and spends its looks (default raised from 20 to 60, about 12 s of work) only on the rest.
2. Confirm never waits for copies (lead ruling 11 Nov): `THUMB_INLINE_WAIT_MS` and the inline race are removed; `ensureThumbs` queues the job and returns; only the sweeps and the backfill pass `background: true`, which awaits the job. A comment says so.
3. Queue slot: the slot is released only when the decode promise truly settles; the 8 s limit only stops waiting.
Tests that fail on 646cb678 and pass now (thumbs.spec.ts, 25 tests): "a confirm never waits for copies" (returns in under 300 ms with a 1.5 s read), "a sweep spends its 20 looks only on pictures that still need copies" (50 with copies ahead of 5 without), "keeps the queue slot until the decode truly ends" (two decodes never overlap). Checked by putting the 646cb678 files back: those 3 fail, 22 pass.
Confirm time, 12 MP noisy JPEG (10 MB) avatar, local stack with the storage stand-in, ms: single main 37, branch 40; 5 at once main [46,52,44,43,56] max 56, branch [66,46,74,44,42] max 74.
Burst: 50 confirms returned in 331 ms (10 users, presigns spaced for the throttler); the Hub was killed with `kill -9`; at that point 40 of 50 had copies; ONE `sweepThumbs()` from a fresh StorageService looked at only the 10 that needed them (754 ms) and the bucket then held 50 originals and 100 copies, every picture done.
Checks: tsc EXIT 0, eslint on changed files EXIT 0, gates EXIT 0, check_baseline EXIT 0, `src/storage` (with thumbs spec) on a fresh database 387/387 EXIT 0.
