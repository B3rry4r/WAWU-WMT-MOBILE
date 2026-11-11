# BATCH-1111b walk (wmt/BATCH-1111b e98a5673, Hub origin/main bf3f4a3b)

Verdict: FAIL for completeness only (items 3 and 4 not proven, step budget spent). No code defect found in what ran: no blank box, broken or wrong picture, no failed chunk, page error or 4xx/5xx on any page walked.

Setup: Hub bf3f4a3b own worktree (npm ci, sharp present), stack.sh name walk1111e on ports 16570-16579 with the real wawu-id, Nuvion stand-in; storage stand-in scratch copy with CORS and CopyObject (16580); branch export (`avatarThumbs` in 5 chunks, `install-overlay` 1, `wmt.invalid/session-open` 2) on 16581 and origin/main export (b62e2ae4) on 16582, both behind vercel.json headers (CSP hosts swapped). Hub CORS list given the two page ports (scratch edit). Seeded through the Hub's own routes (presign, PUT, confirm, PATCH for avatars, previews, covers, community image, real JPEG scenes w1-w6 e1-e3); SQL only for MakerTier rows, pieces pending to live, email_verified. Accounts: Ada, Chidi, Ngozi (creators holding Verify, 4 + 2 + 2 live priced picture pieces), Bola (Nuvion wallet N500,000, PIN, saved payee Ada, follows all three, saved a piece and a creator), Dayo; community "Lagos Lens" with 4 members and messages; chats Bola-Ada and Dayo-Bola. Sign-in tokens came from a real login put in localStorage (not the buttons). Browser: Chromium, 390 at scale 3 light and 1440 scale 1 dark, new context per screen (cold). Pictures: /tmp/wmt-shots/walk-1111b2/.

## Item 1: pictures (branch, Bola unless noted; copies / FULL counts and bytes)
| screen | 390 light | 1440 dark | main 390 |
|---|---|---|---|
| Home (Today, Following, For you) | 3 t640 + 3 FULL (full-screen posts) | 2 t96, 3 t640, 3 FULL | 3 FULL 179,947 B |
| Explore | 3 t640 87,886 B | same | 3 FULL 179,947 B |
| Creators (See all) | 3 FULL 179,947 B (LOW L1) | 3 t640 | 3 FULL |
| Search pieces | 3 t640 | 3 t96 | |
| Search people | not driven at 390 | 3 t96 + 1 FULL (the person's avatar) | 4 FULL 236,102 B |
| Profile of Ada (visitor) | 5 t640 127,752 B | 1 t96 + 4 t640 | 5 FULL 273,079 B |
| Piece page | 1 t640 (maker) + 1 FULL (the piece) | t96 + FULL | 2 FULL |
| Me | 1 t640 | 1 t96 | 1 FULL |
| Purchases | nothing bought (NOT RUN with a tile) | | |
| Saved | 2 FULL (no field) | 2 FULL | 2 FULL |
| Inbox | 3 FULL (no field) | 3 FULL | |
| Chat | 1 FULL | 1 FULL | |
| Community room | 3 FULL | 3 FULL | |
| Wallet, Notifications | no pictures | | |
| Send (payee search "ada") | | 1 FULL | |
| Ada as creator: Home, Me, own profile, Explore | 3 / 5 / 5 / 3 t640, 0 FULL | | |
| Studio home | no pictures | | |
| Ada My content (Library) | 4 FULL 224,468 B (LOW L2) | | |
| Ada Inbox | 2 FULL | | |
Signed out: every route (/, /explore, /content/<id>, /profile/<id>, /creators) at 390 and 1440 lands on /welcome, no picture requests. Looked at every screenshot sheet: no blank box, no wrong picture; avatars, tiles, community image, chat faces and blurred paid previews are the right scene in light and dark. Side by side crops of Explore cards and a profile at 390 x3, branch against main: no visible softness.

## Item 2: new upload: PASS
Chidi, through the buttons: Content, Image, file chooser (w3.jpg 100%), Cover (automatic), title, description, category, price N2,500, "Send for review" ("Sent for review", Uploads 3 of 4). The Hub made the preview's .t96 and .t640 copies. After setting it live by SQL, Chidi's Me and a visitor's view of his profile draw the new tile (first, N2,500) from `.t640` copies, 4 copies and 0 full, none blank.

## Item 3: money smoke: NOT RUN
My driver could not get past the piece page's Unlock/Pay buttons (clicks did nothing, no payment row, balance stayed N500,000). Not read as a code fault; needs a retry with correct selectors.

## Item 4: regressions: INCONCLUSIVE
A synthetic beforeinstallprompt on a Chromium Android user agent, signed in as Bola on /explore, showed no install screen in my run (the event may have fired before the app listened, or a signed-in tab may not offer it); second visit in the same context made 3 requests to the picture host (not 0), but my counter may include the worker's own fetches. The service worker was active. Sign-out clearing NOT RUN. Treat the install latch and the 0-request second visit as unproven here; the previous walk proved them on the same code lines.

## Item 5: console and network
No failed chunk, blank page, error screen, page error or 4xx/5xx on any page walked (one 409 on plans/purchases/quote for Ada at 4 of 4 products, expected).

## Findings
- LOW L1 (known, recorded): Creators at 390 on a 3x phone draws the full picture (card long side above 640); at 1440 it draws copies.
- LOW L2: Ada's My content (Library) tiles draw the full picture (224 KB for 4 small test photos), not listed under changed or left-full in the task file.
- LOW L3: search people, Saved, Inbox, chat, community and send payee faces draw the full file (task lists these as left full, no field in the contract).
- Observation: the Following and For you tabs showed the same single post for Bola (one live post by a followed creator).
## NOT RUN
Money smoke, install latch, worker second visit, sign-out clearing, Purchases tile, 1440 dark of Ada's creator screens, Studio tools.
