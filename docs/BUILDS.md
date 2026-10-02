# Builds, testing and releases

Checked against Expo's docs on 2 Oct 2026. The Apple and Google accounts
belong to the company, not to a person on the team. **Only the owner has
them, and only the owner submits to the stores.** The developer has Expo
access only.

## Now: Android only

The owner tests on Android; nobody on the team has an iPhone yet. Testing and
the first store release are Android (DECISIONS R-24): every test build is
Android (`eas build -p android --profile preview`, an APK anyone installs from
Expo's link). The iOS steps are in "Later: iPhone" at the end; they belong to
RELEASE-03, after launch.

- **Done:** the project is linked to Expo as `@moxnafrica/wawu-wmt`
  (project id in `app.json`), 2 Oct 2026.
- **Updates only reach a build that can run them.** `runtimeVersion` uses
  the `fingerprint` policy: a change to native code (a new `expo-*` package,
  `app.json` plugins) changes the fingerprint, so the next update waits for a
  new build instead of crashing the old one. After merging such a change, run
  a new preview build.
- **Addresses:** every profile points at the live services the web uses,
  `https://api.wawuafrica.com` and `https://id.wawuafrica.com`. There is no
  staging server, and nothing runs on Railway.
- **What runs where (DECISIONS R-25):** tester builds on phones talk to the
  live services; they are not pointed at a local backend, and there is no standing tunnel. A task's phone check (V10) runs on a tester build once the backend it needs is deployed to the droplet; until then V10 is NOT RUN with that reason. A development build on the same Wi-Fi as the local backend (`docs/LOCAL.md`, OPS-03) may run it earlier. Money and identity checks that charge (BVN, selfie) never run against live Fintava before OPS-10.
  Every check and verification runs against the local backend (wawu-backend
  `scripts/local/up.sh`) with the Fintava sandbox, through `npm run web` or an
  emulator. Money paths are exercised on a phone only once OPS-10 has put the
  live Fintava setup on the droplet.

## Who has what

- **Owner:** Expo organization Owner, Google Play Console, and Apple (App
  Store Connect, used from RELEASE-03). Creates the store records, submits
  builds, publishes production updates.
- **Developer:** Expo organization member with the **Developer** role. Can
  build, publish updates and use the signing credentials stored on Expo, but
  never logs into Apple or Google.

Expo's Developer role can also publish updates to any channel. Expo only
enforces "production is owner-only" on its Enterprise plan, so here it is a
team rule: the developer publishes to `preview` only.

## One-time setup (owner)

1. **Invite the developer:** expo.dev, your organization, Members, Invite,
   role **Developer**.
2. **Link the project** (SHELL-03): done 2 Oct 2026 (`@moxnafrica/wawu-wmt`).
3. **Create the Play record:** Play Console, a new app with package
   `africa.wawu.wmt`. (The App Store record waits for RELEASE-03.)
4. **Android signing** needs nothing from you: Expo creates and keeps the
   upload key on the first Android build.
5. **Store submission keys stay with you.** Don't upload the Google
   service-account key (or, later, the App Store Connect API key) to Expo,
   because the Developer role could then submit with them. Run `eas submit`
   from your own machine and give it the key file when it asks.

## Every day (developer)

- **The development build** (profile `development`, with `expo-dev-client`):
  installed once on the developer's own phone. After that,
  `npx expo start` reloads every code change instantly. A new build is only
  needed when a native package changes.
- **Quick checks:** `npm run web` in a browser, or an Android emulator.
- **Picture checks** for verification still use the design renders
  (`scripts/design/render_design.py`).

## Testers

- **Android:** a `preview` build makes an APK. Anyone opens the link Expo
  gives and installs it. No Google account is involved.
- **Fixes without a rebuild:** `eas update --channel preview` sends a code
  change to every preview build on its next launch, as long as no native
  package changed.

## Releasing (owner)

1. `eas build -p android --profile production` (the developer can run this too).
2. `eas submit -p android` creates the first release on Play's internal
   testing track (allowed from the first upload). The app stays a draft in
   Play until the store listing and policy forms are done (RELEASE-01).
3. Small fixes after launch: `eas update --channel production`, owner only.

## The profiles (`eas.json`, written in SHELL-03)

- `development`: `developmentClient: true`, internal distribution, the live
  services.
- `preview`: internal distribution, Android APK, channel `preview`, the live
  services.
- `production`: store builds (AAB now; App Store with RELEASE-03), channel
  `production`, the live services, and the build number managed by Expo
  (`appVersionSource: remote`, `autoIncrement`).

The API address goes in each profile's `env` as `EXPO_PUBLIC_API_URL`, and the
WAWU ID address as `EXPO_PUBLIC_ID_URL`. Secrets never go into the app at all.

`eas.json` points every profile at the live services:
`https://api.wawuafrica.com` (Hub API) and `https://id.wawuafrica.com` (WAWU
ID), the same ones the web calls. There is no staging server; local work
uses the local backend through `.env`. The `EXPO_PUBLIC_` values are baked in
at build time, so changing one
needs a new build; `eas update` takes the same variables from its own
environment when it publishes.

Over-the-air updates need `expo-updates`, an `updates.url` and a
`runtimeVersion` in `app.json`; they are in place (SHARED-CHANGES.md, Applied
row 4).

## Later: iPhone (RELEASE-03)

Nothing here runs before launch (R-24). When an iPhone tester joins:

- **Create the store record:** App Store Connect, a new app with bundle id
  `africa.wawu.wmt`.
- **Create the iOS signing credentials once:** run the first
  `eas build -p ios --profile preview` yourself, interactively, and sign in
  to Apple when asked. Expo generates and stores the certificate and
  profile. After that, the developer's iOS builds reuse them without Apple
  access.
- **iPhone testers:** two ways.
  - **TestFlight (recommended):** you submit a build and add testers in App
    Store Connect. Apple reviews external testers' first build, usually
    within a day. Nobody needs a device id.
  - **Internal (ad hoc):** a tester registers their iPhone
    (`eas device:create` gives them a link). Each new iPhone then needs a
    build that you run signed in to Apple, because adding a device changes
    the Apple profile. Apple allows 100 iPhones a year, and on a new Apple
    membership a new device can take 24 to 72 hours to become installable.
- **Release:** `eas build -p ios --profile production`, then `eas submit -p ios`
  goes to TestFlight; promote it to review in App Store Connect.
