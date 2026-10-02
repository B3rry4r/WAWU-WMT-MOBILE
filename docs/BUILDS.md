# Builds, testing and releases

Checked against Expo's docs on 2 Oct 2026. The Apple and Google accounts
belong to the company, not to a person on the team. **Only the owner has
them, and only the owner submits to the stores.** The developer has Expo
access only.

## Now: Android only

The owner tests on Android; nobody on the team has an iPhone yet. Until that
changes, every test build is Android (`eas build -p android --profile
preview`, an APK anyone installs from Expo's link). The iOS steps below stay
for when an iPhone tester joins; skip them until then.

- **Done:** the project is linked to Expo as `@moxnafrica/wawu-wmt`
  (project id in `app.json`), 2 Oct 2026.
- **Before the first preview build:** `eas.json` needs the real API and WAWU
  ID addresses in place of the `.invalid` placeholders (owner).

## Who has what

- **Owner:** Expo organization Owner, Apple (App Store Connect), Google Play
  Console. Creates the store records, approves new iPhones, submits builds,
  publishes production updates.
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
3. **Create the store records:**
   - App Store Connect: a new app with bundle id `africa.wawu.wmt`.
   - Play Console: a new app with package `africa.wawu.wmt`.
4. **Later, when an iPhone tester joins. Create the iOS signing credentials once:** run the first
   `eas build -p ios --profile preview` yourself, interactively, and sign in
   to Apple when asked. Expo generates and stores the certificate and
   profile. After that, the developer's iOS builds reuse them without Apple
   access.
5. **Android signing** needs nothing from you: Expo creates and keeps the
   upload key on the first Android build.
6. **Store submission keys stay with you.** Don't upload the App Store
   Connect API key or the Google service-account key to Expo, because the
   Developer role could then submit with them. Run `eas submit` from your
   own machine and give it the Apple login or the key file when it asks.

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
- **iPhone:** two ways.
  - **TestFlight (recommended):** you submit a build and add testers in App
    Store Connect. Apple reviews external testers' first build, usually
    within a day. Nobody needs a device id.
  - **Internal (ad hoc):** a tester registers their iPhone
    (`eas device:create` gives them a link). Each new iPhone then needs a
    build that you run signed in to Apple, because adding a device changes
    the Apple profile. Apple allows 100 iPhones a year, and on a new Apple
    membership a new device can take 24 to 72 hours to become installable.
- **Fixes without a rebuild:** `eas update --channel preview` sends a code
  change to every preview build on its next launch, as long as no native
  package changed.

## Releasing (owner)

1. `eas build -p all --profile production` (the developer can run this too).
2. `eas submit -p ios` goes to TestFlight; promote it to review in App Store
   Connect.
3. `eas submit -p android` creates the first release on Play's internal
   testing track (allowed from the first upload). The app stays a draft in
   Play until the store listing and policy forms are done (RELEASE-01).
4. Small fixes after launch: `eas update --channel production`, owner only.

## The profiles (`eas.json`, written in SHELL-03)

- `development`: `developmentClient: true`, internal distribution, the
  test backend's URL.
- `preview`: internal distribution, Android APK, channel `preview`, the test
  backend's URL.
- `production`: store builds (AAB and App Store), channel `production`,
  production API, and the build number managed by Expo
  (`appVersionSource: remote`, `autoIncrement`).

The API address goes in each profile's `env` as `EXPO_PUBLIC_API_URL`, and the
WAWU ID address as `EXPO_PUBLIC_ID_URL`. Secrets never go into the app at all.

`eas.json` is written. Its addresses are reserved placeholders ending in
`.invalid` until the owner supplies the real ones, which are owner inputs:

| Input | Where it goes |
|-------|---------------|
| Test backend (Hub API) address | `EXPO_PUBLIC_API_URL` in `development` and `preview` |
| Test WAWU ID address | `EXPO_PUBLIC_ID_URL` in `development` and `preview` |
| Production Hub API address | `EXPO_PUBLIC_API_URL` in `production` |
| Production WAWU ID address | `EXPO_PUBLIC_ID_URL` in `production` |

A `preview` build made before the placeholders are replaced cannot reach any
backend. The `EXPO_PUBLIC_` values are baked in at build time, so changing one
needs a new build; `eas update` takes the same variables from its own
environment when it publishes.

Over-the-air updates need `expo-updates`, an `updates.url` and a
`runtimeVersion` in `app.json`. `app.json` is fenced, so those are queued in
`SHARED-CHANGES.md`; `npx eas-cli update:configure` (run once by the owner or
developer, signed in to Expo) writes them.
