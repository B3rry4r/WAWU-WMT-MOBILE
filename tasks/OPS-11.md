---
id: OPS-11
title: Rate limits behind nginx (Flutterwave webhook throttle, trust proxy)
owner: YOU
area: OPS
order: 54
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
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

_Filled in by the builder (docs/roles/BUILDER.md)._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
