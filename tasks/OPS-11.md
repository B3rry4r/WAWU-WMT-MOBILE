---
id: OPS-11
title: Rate limits behind nginx (Flutterwave webhook throttle, trust proxy)
owner: YOU
area: OPS
order: 54
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

Backend `wmt/OPS-11` a0eb924, main fdd9716 merged as 0067351. Files: `src/payment-webhook/payment-webhook.controller.ts` (`@SkipThrottle(SKIP_EVERY_HUB_THROTTLER)`), `src/hub-app-options.ts` (`hubTrustProxy`, `applyHubHttpSettings`), `src/main.ts` (applies it), `deploy/README.md`, new specs `src/payment-webhook/tests/payment-webhook-throttle.contract.spec.ts` and `src/tests/hub-rate-limits.contract.spec.ts`. Mobile: this file, G-20.
- Proxy evidence (repo, not the droplet): `deploy/provision.sh:102-106` enables ufw with only OpenSSH and 'Nginx Full' (22, 80, 443) allowed, 3001 not opened; `deploy/install-services.sh:97,101` nginx `proxy_pass http://127.0.0.1:3001` and `X-Forwarded-For $proxy_add_x_forwarded_for`; `src/main.ts` `app.listen(port)` has no host, so the app listens on every interface (the boot shows `*:4751`). So the port is closed to the internet by ufw alone.
- Default (agent), owner may override: `trust proxy` is the function `hubTrustProxy`: exactly one hop, and only when the TCP peer is loopback (nginx). Through nginx `req.ip` is the address nginx appended; any non-loopback connection's `X-Forwarded-For` is ignored, so a forged header cannot pick a bucket even if ufw were off. The app is NOT rebound to 127.0.0.1: the evidence says nginx-only, and a 127.0.0.1 bind would break a phone on the same Wi-Fi reaching a local backend (`scripts/local/up.sh` prints the LAN URL). A CDN in front of nginx would add a hop (noted in `deploy/README.md`).
- Check 1: 30 signed Flutterwave deliveries in under 1 s from one sender, through the real global ThrottlerGuard: 30 x 200, 30 receipts. With main's bare `@SkipThrottle()` on the same controller the same burst gets 20 x 200 and 10 x 429 (a test asserts this, and swapping the decorator in the file makes 2 tests fail).
- Check 2: two clients via nginx in the same second: one gets 20 x 200 and 5 x 429, the other 20 x 200.
- Check 3: a client writing another's address into `X-Forwarded-For` through nginx is counted as itself, both ways (cannot escape its own bucket, cannot spend the victim's). A direct connection from the machine's non-loopback address is counted by its own address whatever the header says. With no trust (main today) 4 tests fail; with a plain hop count of 1 the direct-connection test fails.
- Check 4: `HUB_THROTTLERS` unchanged (short 20/1 s, medium 200/60 s), AppModule registers them behind the global guard, only the two webhooks carry `@SkipThrottle`, only admin login/refresh carry `@Throttle` (unchanged); one client via nginx: the 21st in a second is 429 (`retry-after-short`), the 201st in a minute is 429 (`retry-after-medium`).
- Live build: `dist/src/main.js` with `NODE_ENV=production` and no FINTAVA_* setting boots on :4751 (one FINTAVA_BASE_URL warning), `/api/hub/health` 200; per-caller remaining counts 19, 18 / 19 / forged 19 / direct 19; 30 Flutterwave deliveries at once 30 x 200.
- Checks after the merge: tsc 0; eslint clean on the 5 changed .ts files; new specs 12/12; full `test:contract` on fresh `o11_contract_test`, mock WAWU ID on :4752: 100/103 suites, 1981 passed, 3 skipped, 35 failed, all `ECONNREFUSED :4001` in `kyc-submission`, `privacy-settings`, `credits-state` (hardcoded :4001, a port this session may not use: NOT RUN, as for MONEY-07). Before the merge: 99/102, 1955 passed, the same 35. Protected `run.sh --fresh` on `o11_protected_test`: 253/253 (244 required), lock identical to main. Gates before 16 fail / 3 warn / 76 accepted, after the same 16 fail / 4 warn (the new warn is main's `CHAT-LIMITS`) / 76.
- Behaviour change to know: admin login's 5/min (and every limit) was one bucket shared by every caller behind nginx; it is now per caller.
- NOT RUN: the droplet's live `ufw status` and nginx config (no droplet access; fact that unblocks: OPS-10 or the owner reading them); V10 (no app screen).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
