# WEBAPP-07: the full walk of the web app before usewmt.com goes live. Lead brief, 9 Nov 2026

Three walkers, Sonnet, each a fresh agent that built none of the web work. **Read only: no code changes, no commits, no
pushes; findings only.** This is the walk on the exact code that deploys (DECISIONS R-127 point 5, owner hard rules 5
and 6).

**Code:** mobile `wmt/BATCH-WEBAPP1` at `ffdc271` (WEBAPP-01 to 06 merged, `npm run check` EXIT 0). Hub `main` at
`7dd5b22` (what the live server runs). Two Hub changes wait for the owner and are NOT on the stack: the tier upgrade after
a renewal (TIER-UPGRADE-FIX) and `Retry-After` exposed to the browser (WEBAPP-02). Do not report those two as new.

**Read:** `docs/WORKFLOW.md` (V5 to V9), `DECISIONS.md` R-127, R-128, R-44, R-47, R-86, R-101,
`docs/analysis/WEB-APP-READINESS.md`, `docs/WEB-DEPLOY.md`, `tasks/WEBAPP-01.md` to `WEBAPP-07.md`, and the known lows
in `tasks/history/WEBAPP-0*.md` on the batch branch (do not re-report them unless worse). Hub: `README.md`, "Local test
stack", and `scripts/dev/nuvion-tool.cjs` (a funded wallet, webhooks).

## Your stack
- A worktree of the batch: `git -C /home/user/wawu-wmt-mobile worktree add /home/user/wt/walk-<letter> ffdc271`, with
  `node_modules` a symlink to `/home/user/wawu-wmt-mobile/node_modules` (same lockfile). Not `STACK_NM_MOBILE`: walker C
  found an export from hard-linked modules bundles React twice and draws a blank page (to be explained; walker A builds the
  export the way Vercel does to settle it). Never work in
  the lead's clones (`/home/user/wawu-wmt-mobile`, `/home/user/WAWU-Backend`, `/home/user/wawu-id`); read from them only.
- Start it with the lock, so only one export builds at a time (`-o`: the stack's servers must not keep the lock; the
  first version of this line without it held the lock for as long as a stack was up):
  `flock -o /tmp/wmt-walk-stack2.lock env STACK_PG_URL=postgresql://postgres@127.0.0.1:14001 STACK_SCRATCH=/tmp/wmt-walk/<letter> /home/user/WAWU-Backend/scripts/dev/stack.sh up --name walk<letter> --ports <a>-<b> --with id,mobile --id /home/user/wawu-id --mobile /home/user/wt/walk-<letter>`
  plus the mail and storage stand-ins the README names, so a sign-up code can be read and an upload can be read back.
- Ports: walker A 16020-16039, B 16040-16059, C 16060-16079. Databases: only the stack's own `walk<letter>_*`.
- **The headers of the real site.** The stack's static server has the same fallback as `vercel.json` but not its headers.
  Also serve the same export with `vercel.json`'s headers (your own small server or Playwright route handling, in your
  scratch, never committed), the Content-Security-Policy changed only by swapping `https://api.wawuafrica.com` and
  `https://id.wawuafrica.com` for your stack's addresses. Walk at least one path per kind of user through it and report
  every CSP violation in the console.
- Browser: Playwright Chromium (pre-installed; never `playwright install`), with
  `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream` for the camera and the microphone.

## How to walk
Every path at **390 x 844** (phone) and **1440 x 900** (laptop: the phone column centred, nothing stretched), light and
dark, from a **cold start** (a new browser context) and from a **refresh** on the page you are on. Every picture looked
at; at 390 beside its board (`/usr/bin/python3 scripts/design/render_design.py <ID>` in your worktree; never pip
install). Watch the console and the network on every page: an error, a CSP block, a failed call or a request to a host
that is not the stack is a finding. Sign in only through the real sign-in on the stack (V9), never an injected token.
Write findings as you go to `/tmp/wmt-reports/walk-web-<letter>.md`, pictures in `/tmp/wmt-shots/walk-web-<letter>/`:
severity (**SERIOUS** stops a person, loses money or leaks private data; **MEDIUM** wrong but passable; **LOW** polish),
the steps, the picture, the expected (board, task, ruling) and the seen.

## Walker A: arriving (guest, new user, no wallet)
A guest on `/`, Explore, a piece, a profile, a community, an event, search; a shared usewmt.com link opened signed out,
then sign in, and land back on it; `/r/<code>` and `/join`; sign up as a new person through WAWU ID (the mailed code);
onboarding; the tier offer (once per browser session, not on every refresh); Settings (no control that does nothing,
R-47: push switches, invite card Save, subtitles row); Share on a piece, a profile and a receipt ("Link copied", no false
failure); legal pages; open a wallet from a fresh account (the hosted selfie leaves and comes back to `/selfie` on the
same tab); `/send/abroad/new` without a wallet; the Wallet tab before and after opening; sign out and back in; a deep
link to every tab while signed out.

## Walker B: money (wallet holder, buyer)
Seed a funded wallet. Add money (the payment return); send to a WAWU person and to a bank (the fee quote is config:
read it from the Hub, not a design); the PIN typed on the keyboard (digits, Backspace, Enter; nothing reaches another
field; the PIN never in the page text or a log); five wrong PINs lock as on the phone; the card unlock; buy from the
wallet on the web (R-128): a tier, a tick, points, WAWU Credits, a community pass, each at list price with the PIN,
the wallet moving once and the thing granted once; too little in the wallet (the shortfall and the way to add money);
bills (an entry that works or no entry, never a dead one); a paid message, a ticket, a paid piece; receipts, history,
the ledger against the provider's balance on the stand-in. **Every V8 attack:** the same request twice, a double tap,
two tabs paying at once, a replayed and a forged webhook, a failed transfer reversing.

## Walker C: making (creator, verified)
Become a creator; upload a photo (a JPEG with GPS: read the stored file back from the storage stand-in, no Exif and no
GPS), a piece with a price and a free piece where the app allows it, a voice in Chromium (the stored file is AAC-MP4 or
WAV 22,050 Hz mono, read it back); the 5-item limit and the storage line; My uploads, edit, delete; profile, works,
services; verification (the hosted selfie on the web), then verified-only things (hosting an event, a tick's limits);
earnings and the wallet they land in; paid questions in the Inbox; a community as its owner; another person (walker C's
second account) sees the creator's price and pieces the same way (V4).

## Hand back
Ten lines: verdict PASS (no SERIOUS) or FAIL; every SERIOUS and MEDIUM with its steps; counts of paths walked and
pictures looked at; anything NOT RUN and why. Clean up: `stack.sh down` with the same scratch, your worktree
(`git worktree remove`), your servers and browsers. Kill only what you started.

## The walk again, after WEBAPP-08 (lead, 9 Nov 2026)
The same three walkers' paths on the new batch head the lead names (WEBAPP-08 merged). The first walk's reports are in
`tasks/history/WEBAPP-07.md` and its fixes in `tasks/WEBAPP-08.md`: re-check every WEBAPP-08 row in your area, and do not
re-report what is listed there as ruled or carried elsewhere (CREATOR-TAKEDOWN, VIDEO-PRIVACY, SWEEP-WEB).
- **Every picture you take is looked at, and counted.** The first walk looked at about 20 to 60 of about 200 each.
- **The export:** build it yourself as Vercel does (`npm run web:export` with your own TMPDIR so Metro's cache is fresh,
  EXPO_PUBLIC_API_URL / EXPO_PUBLIC_ID_URL set to your stack); walker A from a fresh clone with `npm ci`, as Vercel does.
  Not the stack's `--with mobile` export with `STACK_NM_MOBILE` (hard-linked modules gave two Reacts).
- **The harness notes that worked in the first walk** (tasks/history/WEBAPP-07.md): serve the export over https with
  vercel.json's headers (the CSP's two hosts swapped for your stack); restart only your own Hub with your page's origin
  in CORS_ORIGIN and `https://<your origin>/selfie` in NUVION_LIVENESS_REDIRECT_ORIGINS, and say so; a small CORS
  proxy for the storage stand-in; Chromium with LocalNetworkAccessChecks off when an https page calls localhost.
- Walker B buys every wallet purchase through the app's own buttons (tier, upgrade, points, credits, pass) and repeats
  every V8 attack, checked on the Hub ledger and the Nuvion stand-in.
