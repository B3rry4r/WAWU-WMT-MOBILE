---
id: OPS-11
title: Rate limits behind nginx (Flutterwave webhook throttle, trust proxy)
owner: YOU
area: OPS
order: 54
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: [MONEY-07]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# OPS-11 · Rate limits behind nginx (Flutterwave webhook throttle, trust proxy)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `BACKEND_GAPS.md` G-20 (found by the MONEY-07 verifier, 2 Oct 2026)
- Backend: `src/hub-throttlers.ts` (`HUB_THROTTLERS`, `SKIP_EVERY_HUB_THROTTLER`, from MONEY-07),
  `src/payment-webhook/payment-webhook.controller.ts`, `src/main.ts`, `src/hub-app-options.ts`,
  `deploy/provision.sh` and the nginx config it writes

## Goal

The live backend's rate limits count each caller separately, and no payment provider's
webhook is ever turned away with a 429.

## Scope

1. The Flutterwave webhook skips every registered throttler by name, as the Fintava one does
   (`@SkipThrottle(SKIP_EVERY_HUB_THROTTLER)`). Today its bare `@SkipThrottle()` skips only a
   throttler named `default`, which does not exist.
2. `trust proxy` is set to exactly the hops in front of the app (nginx on the droplet), so the
   throttler tracks the real client address, not nginx's. It is only safe if the app port is
   reachable from nginx alone: confirm that from `deploy/provision.sh` (listen address, firewall)
   before setting it, and record the evidence. If the app port is reachable from outside, bind it
   to 127.0.0.1 in the same change instead of trusting a header anyone could forge.

## Capability checks

- [ ] A burst of more than 20 signed Flutterwave deliveries in one second, through the real global
      ThrottlerGuard, all get 2xx (the old bare decorator fails the test).
- [ ] Two clients behind the proxy get separate rate-limit buckets; one client's burst does not
      throttle the other (test with `X-Forwarded-For` through the real guard).
- [ ] A forged `X-Forwarded-For` from a direct (non-proxy) connection cannot pick another client's
      bucket, or the app port is not reachable except through nginx.
- [ ] Every other route keeps the same 20/s and 200/min limits as before.

## Builder report

Backend `wmt/OPS-11` a0eb924, main fdd9716 merged as 0067351, then main 14a7fb2 as 70db9f0. Files: `src/payment-webhook/payment-webhook.controller.ts` (`@SkipThrottle(SKIP_EVERY_HUB_THROTTLER)`), `src/hub-app-options.ts` (`hubTrustProxy`, `applyHubHttpSettings`), `src/main.ts` (applies it), `deploy/README.md`, new specs `src/payment-webhook/tests/payment-webhook-throttle.contract.spec.ts` and `src/tests/hub-rate-limits.contract.spec.ts`. Mobile: this file, G-20.
- Proxy evidence (repo, not the droplet): `deploy/provision.sh:102-106` enables ufw with only OpenSSH and 'Nginx Full' (22, 80, 443) allowed, 3001 not opened; `deploy/install-services.sh:97,101` nginx `proxy_pass http://127.0.0.1:3001` and `X-Forwarded-For $proxy_add_x_forwarded_for`; `src/main.ts` `app.listen(port)` has no host, so the app listens on every interface (the boot shows `*:4751`). So the port is closed to the internet by ufw alone.
- Default (agent), owner may override: `trust proxy` is the function `hubTrustProxy`: exactly one hop, and only when the TCP peer is loopback (nginx). Through nginx `req.ip` is the address nginx appended; any non-loopback connection's `X-Forwarded-For` is ignored, so a forged header cannot pick a bucket even if ufw were off. The app is NOT rebound to 127.0.0.1: the evidence says nginx-only, and a 127.0.0.1 bind would break a phone on the same Wi-Fi reaching a local backend (`scripts/local/up.sh` prints the LAN URL). A CDN in front of nginx would add a hop (noted in `deploy/README.md`).
- Check 1: 30 signed Flutterwave deliveries in under 1 s from one sender, through the real global ThrottlerGuard: 30 x 200, 30 receipts. With main's bare `@SkipThrottle()` on the same controller the same burst gets 20 x 200 and 10 x 429 (a test asserts this, and swapping the decorator in the file makes 2 tests fail).
- Check 2: two clients via nginx in the same second: one gets 20 x 200 and 5 x 429, the other 20 x 200.
- Check 3: a client writing another's address into `X-Forwarded-For` through nginx is counted as itself, both ways (cannot escape its own bucket, cannot spend the victim's). A direct connection from the machine's non-loopback address is counted by its own address whatever the header says. With no trust (main today) 4 tests fail; with a plain hop count of 1 the direct-connection test fails.
- Check 4: `HUB_THROTTLERS` unchanged (short 20/1 s, medium 200/60 s), AppModule registers them behind the global guard, only the two webhooks carry `@SkipThrottle`, only admin login/refresh carry `@Throttle` (unchanged); one client via nginx: the 21st in a second is 429 (`retry-after-short`), the 201st in a minute is 429 (`retry-after-medium`).
- Live build: `dist/src/main.js` with `NODE_ENV=production` and no FINTAVA_* setting boots on :4751 (one FINTAVA_BASE_URL warning), `/api/hub/health` 200; per-caller remaining counts 19, 18 / 19 / forged 19 / direct 19; 30 Flutterwave deliveries at once 30 x 200.
- Checks after merging 14a7fb2: tsc 0; eslint clean on the 5 changed .ts files; new specs 12/12; full `test:contract` on fresh `o11_contract_test`, mock WAWU ID on :4752: 101/104 suites, 1996 passed, 3 skipped, 35 failed, all `ECONNREFUSED :4001` in `kyc-submission`, `privacy-settings`, `credits-state` (hardcoded :4001, a port this session may not use: NOT RUN, as for MONEY-07). Before the merges: 99/102, 1955 passed, the same 35. The live-build check was repeated on 70db9f0. Protected `run.sh --fresh` on `o11_protected_test`: 253/253 (244 required), lock identical to main. Gates before 16 fail / 3 warn / 76 accepted, after the same 16 fail / 4 warn (the new warn is main's `CHAT-LIMITS`) / 76.
- Behaviour change to know: admin login's 5/min (and every limit) was one bucket shared by every caller behind nginx; it is now per caller.
- NOT RUN: the droplet's live `ufw status` and nginx config (no droplet access; fact that unblocks: OPS-10 or the owner reading them); V10 (no app screen).

## Verifier report

Verifier, 2 Oct 2026, a fresh session that wrote none of this task's code. Checked wawu-backend `wmt/OPS-11` `70db9f0` and mobile `wmt/OPS-11` `2c20e01`, each in a fresh detached worktree (`/home/user/wt/vo11b`, `/home/user/wt/vo11m`). **Main moved during verification** (backend `14a7fb2` -> `d27ad37`, mobile `ca6d6cb` -> `bfdd584`: KYC-01 merged, #32), so the backend was also checked as it will land: `d27ad37` merged into `70db9f0` locally (merge `8ca7898`, clean, not pushed), and mobile `bfdd584` merged in a scratch worktree (not pushed). My own databases `vo11_*` (dropped afterwards), ports 4781 (built Hub, and the mock WAWU ID while the Hub was down) and 4782 (a real nginx 1.24.0, the Ubuntu 24.04 package, unpacked from the `.deb` and run as my own process), plus :4001 for one full contract run only after `lsof -i :4001` showed it free (my own mock, stopped straight after). Everything I started is stopped. **Verdict: 2 defects, status back to building.** The trust rule, the deploy evidence and both webhooks are right; the defects are in the branch's tests (one goes red once main is merged, one is load-sensitive).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed (see defect 2 for the suite) | Backend as it will land (`8ca7898`): `tsc --noEmit` 0; eslint (no `--fix`) on the 5 changed `.ts` files 0; gates 9 run / 586 files scanned / 16 fail / 6 warn / 76 accepted, against main `d27ad37` 16 / 6 / 76 on 584 files: the FAIL and WARN lines are main's, line for line (as pushed, `70db9f0`: 16 / 4 / 76 on 578, the same 16). Mobile as pushed: `npm run check` exit 0 (typecheck, lint, 16 suites / 285 tests, gates 9 run / 75 files scanned / 0 fail, task check). Mobile with main `bfdd584` merged (scratch, conflicts resolved as in merge note A): exit 0, 289 tests, 77 files scanned, 201 tasks. |
| V2 Contract | failed (defects 1, 2) | Full `test:contract` on fresh, migrated and seeded databases, mock WAWU ID on :4001: **as it will land** (`8ca7898`): 107 suites, 106 passed, **2065 passed, 1 failed** (defect 1), 3 skipped; **main `d27ad37`** on the same machine and mock: 105 suites, 2054 passed, 0 failed, 3 skipped (2065 + 1 = 2054 + the 12 new tests); **as pushed** (`70db9f0`): 104 suites, 2030 passed, **1 failed** (defect 2), 3 skipped. The builder's 35 `ECONNREFUSED :4001` failures all pass with a mock on :4001. Unexpected formats: 20 X-Forwarded-For shapes (below). An earlier run on an unseeded database failed ~290 tests on main and branch alike (the suite needs `db:seed`); not counted. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh 8ca7898` on `vo11_protected_test`, lock `origin/main` `d27ad37`: **253/253, all 244 required**. `.pipeline/`, `src/protected-routes/`, `test/protected-routes/` unchanged (0 diff lines against both mains). Rule 6: `dist/src/main.js` with `NODE_ENV=production`, no `FINTAVA_*`, no `IDENTITY_HASH_KEY` (dummy `CORS_ORIGIN`, `FLUTTERWAVE_SECRET_KEY`, `WAWU_ID_INTERNAL_SERVICE_KEY`, which main already requires) boots on both `70db9f0` and `8ca7898`, `/api/hub/health` 200 directly and through nginx. |
| V4 Field trace | passed | The one field is the caller's address. Writer: nginx (`$remote_addr`, appended last by `$proxy_add_x_forwarded_for`). Reader: Express `req.ip` through `hubTrustProxy` (proxy-addr 2.0.7, Express 5.2.1). Users: the global ThrottlerGuard's default tracker (`req.ip`, @nestjs/throttler 6.5.0) on every route, and KYC-01's `bvnCheckTracker` (pass 4). Storage: the throttler's in-memory store (per process). Nothing else in `src` reads `req.ip`, `req.ips`, `req.protocol`, `req.secure` or `req.hostname` (grep), which `trust proxy` also changes. |
| V9 Live seam | passed (no sign-in) | The seam this task changes is nginx -> app, before authentication. The production build behind the real nginx (config below) answered per-caller `X-RateLimit-Remaining-*` values only the server computes, for 9 trust cases, both webhooks and 5 limit cases (below). No sign-in was made: no route's behaviour after login changes here. |

**Pass 1: the trust rule.** nginx on :4782 with the `location /` block of `deploy/install-services.sh` `write_site` copied verbatim (`proxy_pass http://127.0.0.1:4781`, `X-Real-IP`, `X-Forwarded-For $proxy_add_x_forwarded_for`, `X-Forwarded-Proto`, Upgrade, `client_max_body_size 25m`); clients are real sockets from distinct 127.x addresses through nginx, and the machine's only non-loopback address (192.0.2.2) straight to :4781. All 9 passed, on `70db9f0` and again on `8ca7898`:
1. Two clients through nginx in the same second: A 25 -> 20 x 200 + 5 x 429, B 20 -> 20 x 200.
2. A client writing a throttled victim's address into X-Forwarded-For through nginx is counted as itself (200, 19 left), and 25 such requests throttle only the forger (victim's first: 19 left).
3. One client rotating 20 shapes (one address, three, 60 entries, `garbage`, `not-an-ip, , ,,`, `,`, a space, trailing comma, `unknown`, `2001:db8::1`, `::1`, `::ffff:127.0.0.1`, `[2001:db8::1]:443`, quoted, tab, 4000 characters, `0.0.0.0`, `999.999.999.999`): 20 x 200 + 5 x 429, and the three addresses it named still have full buckets.
4. Two X-Forwarded-For header lines from the client: nginx joins them and appends; still the client's own bucket.
5. Direct non-loopback connection naming a throttled client: 200, counted as itself; 25 direct with rotating forged headers (including `127.0.0.1`, `::1`): 20 x 200 + 5 x 429, the named client untouched.
6. A client reaching nginx from 192.0.2.2 shares one bucket with 192.0.2.2 direct: it is tracked by its real address.
7. A loopback peer (a process on the box) gets exactly one hop: `X-Forwarded-For: B, T` counts T, never B.
`::1`, `::ffff:127.0.0.1` and other IPv6 peers: this container has no IPv6 (no `/proc/net/if_inet6`; Node listens on 0.0.0.0), so those peers were set on the socket per request inside a real Nest app with the real `applyHubHttpSettings`, real Express `req.ip` and the real global guard (`scratchpad peers.js`): `::ffff:127.0.0.1`, `::1`, `::FFFF:127.0.0.9` -> the right-most entry; `::1` with an IPv6 client -> that client; `::ffff:192.0.x.77`, `2001:db8:x::9`, `::ffff:128.x.0.1`, `1270:x::1`, `::ffff:127x.0.0.1` -> themselves, header ignored. 9/9. NOT RUN on a real IPv6 socket.
**Mutation check:** every case above is killed by at least one mutant. Through nginx (9 cases): no `trust proxy` (main today) 2/9 pass; hop count `1` 7/9 (direct cases fail); `true` 1/9; `'loopback'` 4/9; loopback at any hop 4/9; hop 0 any peer 7/9; two loopback hops 4/9; hop count `2` 1/9. Peer rule (9 cases): no `::ffff:` handling 7/9; no `::1` 7/9; any `::ffff:` trusted 6/9; `startsWith('127')` without `isIPv4` 7/9; any IPv6 trusted 4/9. The real rule: 9/9 and 9/9.

**Pass 2: the deploy assumption.** Confirmed from the repo: `deploy/provision.sh:101-107` `ufw allow OpenSSH`, `ufw allow 'Nginx Full'`, `ufw --force enable` (3001/3002 never opened; ufw denies other incoming by default); `deploy/install-services.sh:96-107` `proxy_pass http://127.0.0.1:${port}` (3001 for the Hub) and `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for` (overwrites whatever the client sent, after appending to it). `src/main.ts` `app.listen(port)` with no host: every interface. wawu-id (the other service on the droplet) never calls the Hub (grep: no `3001`, `HUB_API`, `api/hub`), so nginx is the only loopback peer apart from an operator on the box.
**Ruling on not binding to 127.0.0.1: accepted.** The ticket asks for the bind only "if the app port is reachable from outside", and the repo says it is not. More to the point, the trust rule does not depend on the firewall: a non-loopback peer's X-Forwarded-For is ignored (cases 5, mutants hop-count 1 and hop-0-any-peer), so even with ufw off a forged header picks no bucket. An open port would only bypass nginx's TLS and 25 MB cap, which is how main is today and not this task's change; a bind would break a phone on the same Wi-Fi reaching a local backend. Optional hardening for later (not a defect): a `HUB_API_HOST` setting, default every interface, set to `127.0.0.1` in `/etc/wawu/hub-api.env`.
**What OPS-10 must confirm on the droplet** (NOT RUN here, no droplet access):
1. `sudo ufw status verbose`: active, `Default: deny (incoming)`, only 22 and 80/443 (`Nginx Full`) allowed, the same in the `(v6)` rows, no 3001 or 3002 rule; `/etc/default/ufw` has `IPV6=yes`.
2. From outside the droplet, `nc -vz <droplet IPv4> 3001` (and the droplet's IPv6 address, if it has one) does not connect; any DigitalOcean Cloud Firewall does not open 3001.
3. `/etc/nginx/sites-enabled/wawu-hub-api` after certbot's edits: the 443 block still has `proxy_pass http://127.0.0.1:3001;` and `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`; no other site or `stream` block proxies to 3001; no `real_ip_header` / `set_real_ip_from` rewriting `$remote_addr`.
4. The API domain's DNS is not behind a proxying CDN (for example Cloudflare's orange cloud). If it is, every caller is counted by the CDN's edge address and `hubTrustProxy` must change with it (`deploy/README.md` says so).
5. After the deploy, `curl -sI https://<api>/api/hub/health | grep -i ratelimit-remaining-short` from two different networks shows two independent counts.

**Pass 3: the webhooks** (production build, real nginx, one sender per burst):
- Flutterwave: 30 signed deliveries in one second, 30 x 200 (`unmatched`) in 664 ms; then 230 more in the same minute (past `medium`'s 200), 230 x 200; 260 receipts in the database. Mutant (bare `@SkipThrottle()` in the compiled controller): 20 x 200 + 10 x 429.
- Fintava (MONEY-07): with no `FINTAVA_*`, 30 in one second, 30 x 401 from the signature guard, 0 x 429; with only `FINTAVA_WEBHOOK_SECRET` set, 30 signed (HMAC-SHA512 of the raw body) in 414 ms, 30 x 200, then 230 more in the minute, 230 x 200. Mutant (bare `@SkipThrottle()`): 20 x 401 + 10 x 429.
- Every other route: `/api/hub/health`, `/api/hub/events`, `/api/hub/legal/catalogue`: 21 in one second -> 20 answered + 1 x 429 with `retry-after-short`, `x-ratelimit-limit-short 20`, `-medium 200`, and another client in the same second answered. 10 x 20 a second, then the 201st -> 429 with `retry-after-medium` and no `retry-after-short`. Admin login's own `@Throttle` (5 a minute): 401 x 5 then 429, another client 401; admin refresh (20 a minute): the 21st 429. `HUB_THROTTLERS` unchanged; only the two webhooks carry `@SkipThrottle`.

**Pass 4: overlap with KYC-01** (now on main, `d27ad37`). `bvnCheckTracker` reads `req.ip` first, and only from a loopback peer (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) the last X-Forwarded-For entry. Once `trust proxy` is `hubTrustProxy`, `req.ip` is already the last entry for a loopback peer, so the tracker returns `req.ip`: **still correct, now redundant**. Evidence: 200,000 random peers x headers (loopback, mapped, 127.0.0.2, non-loopback, IPv6; empty, malformed, multi-entry headers): the tracker fed Express's `req.ip` equals `req.ip` in every case. KYC-01's own `identity-throttle` spec passes on the merge, 5/5, and a copy of it with `applyHubHttpSettings` applied passes 5/5. Through the real nginx on the merged build, `POST /money/identity/bvn` (3 a minute): client A 401, 401, 401, 429; client B 401; client C forging A 401 (2 left, its own bucket); 192.0.2.2 direct forging another address is counted as itself. It would only become wrong under a looser rule (`true` or a hop count), which this branch does not use.

**Findings**
1. `defect` (as it will land): `src/tests/hub-rate-limits.contract.spec.ts` › "only the two payment webhooks skip the limits; the one other override (admin login and refresh) is unchanged" fails once main `d27ad37` is merged: main's `src/money/identity/money-identity.controller.ts` now carries `@Throttle(BVN_CHECK_THROTTLE)` (KYC-01), so the list is `admin/auth/admin-auth.controller.ts` plus that file. The only failure in the merged full run (106/107 suites). Unblocks with: merge `origin/main`, add the identity controller to the expected `@Throttle` list and the test's title.
2. `defect` (flaky check): `src/payment-webhook/tests/payment-webhook-throttle.contract.spec.ts` › "30 different signed deliveries in the same second" asserts the whole burst takes under 1000 ms, and the timed burst includes the fresh app's first requests (database connection). It failed in the as-pushed full contract run (1051 ms) and in 6 of 6 runs of the spec alone at load average ~7.5 on 4 cores (1005 to 1848 ms); it passed 3 of 3 at load ~4 and in the merged full run. A red CI run on a busy runner blocks every merge. Unblocks with: warm the app (one delivery or health call) before timing, and time only the burst; the same for the bare-decorator control, which asserts the same window.
3. Merge note A (mobile, for the builder's next main merge): `bfdd584` adds a sentence to the G-20 row in `BACKEND_GAPS.md` (KYC-01's `bvnCheckTracker` "can go once trust proxy is set"); it conflicts with this branch's G-20 edit: keep both sentences. `docs/PROGRESS.md` conflicts: regenerate (`npm run tasks -- --write`). Checked in a scratch merge: `npm run check` exits 0. Backend `d27ad37` merges cleanly (only defect 1 to fix).
4. Merge note B (KYC-01): `bvnCheckTracker`'s comment in `src/money/identity/identity-config.ts` says "The app sets no `trust proxy` (BACKEND_GAPS G-20)", which is false once this lands. Not a defect: the tracker stays correct. Whoever merges second (now this branch) should update that comment, or drop the tracker in a follow-up (G-20 already says it can go).
5. `unclear` (owner/lead, not a defect): IPv6 callers are counted per full address, so a phone with an IPv6 /64 can rotate addresses for more buckets; wawu-id counts a /64 as one (G-14). Before this branch every caller shared one bucket, so this is still a large improvement. A tracker that groups IPv6 by /64 would close it.
6. Note: with `trust proxy` set, `req.hostname` would honour a client-sent `X-Forwarded-Host` (nginx neither sets nor strips it) and `req.protocol` honours `X-Forwarded-Proto` (nginx overwrites it, so that one is sound). Nothing in `src` reads either today; any future code that does should not trust `req.hostname`, or nginx should set `X-Forwarded-Host $host`.
7. Accepted, as the builder flagged: admin login's 5 a minute (and every limit) is now per caller instead of one bucket for everyone behind nginx.

Files checked against the report: backend 6 files (`deploy/README.md`, `src/hub-app-options.ts`, `src/main.ts`, the Flutterwave controller, the two new specs) and mobile 4 (`BACKEND_GAPS.md`, `docs/LOG.md`, `docs/PROGRESS.md`, this file) match the builder's list; nothing missing or extra. No secrets in either diff (the specs' `test-webhook-secret-hash-o11` is a fixture).

NOT RUN: the droplet's `ufw status` and live nginx config (no droplet access; OPS-10, list above); real IPv6 sockets and an nginx `[::]` listener (no IPv6 in this container; covered by injected peer addresses through the real guard); V10 (not in this task's passes, no app screen).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
