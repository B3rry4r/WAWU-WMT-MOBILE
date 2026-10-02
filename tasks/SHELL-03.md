---
id: SHELL-03
title: Tester builds
owner: DEV
area: SHELL
order: 17
priority: launch
repo: wawu-wmt-mobile
type: setup
status: done
depends_on: [SHELL-01]
decisions: []
passes: [V1, V10]
artboards: []
---
# SHELL-03 · Tester builds

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)

## Goal

Testers and the owner install real builds, not Expo Go.

## Scope

Follow `docs/BUILDS.md`. `npx expo install expo-dev-client`; `eas.json` with the three profiles it lists; the owner runs `eas init` and the first iOS build (only they have Apple). Android preview is an APK anyone can install. iPhones get builds through TestFlight, submitted by the owner. Updates from this task go to the `preview` channel only.

## Capability checks

- [ ] A preview build installs on a real Android phone and a real iPhone and reaches the test backend.
- [ ] The developer can run `eas build --profile preview` for both platforms without an Apple or Google login.
- [ ] `eas update --channel preview` reaches an installed preview build without a rebuild.

## Builder report

**Files:** `eas.json` (new: development, preview, production; `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` in every profile's env, which covers SHELL-02's request), `package.json` and `package-lock.json` (`expo-dev-client ~57.0.19`), `docs/BUILDS.md` (owner-input table, update note), `SHARED-CHANGES.md` (rows 1 and 2), `docs/LOG.md`.
**Install note:** `npx expo install expo-dev-client` failed here (api.expo.dev refused by the sandbox proxy), so I ran `npm install expo-dev-client@~57.0.19`, the version in `node_modules/expo/bundledNativeModules.json` for SDK 57. Owner can confirm with `npx expo install --check`.
**Placeholders:** every address in `eas.json` is a `.invalid` placeholder; real test and production Hub API and WAWU ID addresses are owner inputs (table in `docs/BUILDS.md`). Nothing was invented.
**Checks (all NOT RUN, none faked, no build URL exists):**
- Preview installs on a real Android phone and iPhone and reaches the test backend: NOT RUN. Needs `eas login`, owner's `eas init`, the owner's first `eas build -p ios --profile preview` (Apple login), `eas build -p android --profile preview`, the real test addresses in `eas.json`, and the two phones.
- Developer builds preview for both platforms without Apple or Google login: NOT RUN. Needs an Expo login with the Developer role, and the owner's first iOS build to have stored the signing credentials.
- `eas update --channel preview` reaches an installed build: NOT RUN. Needs `expo-updates`, `runtimeVersion` and `updates.url` in `app.json` (SHARED-CHANGES row 1, via `eas update:configure`), an installed preview build and a phone.
**Ran offline:** `eas.json` parses as JSON and has the three profiles with the channels and env BUILDS.md lists (the EAS schema could not be fetched, so not schema-validated; `eas-cli` could not be downloaded). `npx expo config --type public` resolves. `EXPO_PUBLIC_API_URL=... npx expo export --platform android` succeeds. `expo-doctor` 19 of 21 passed; the 2 failures are network lookups refused by the proxy.
**Counts before -> after:** tests 7 -> 7, gates 9 run, 16 files scanned, 0 findings -> same, tasks 187 -> 187.
**Gaps:** `app.json` `owner` and `extra.eas.projectId` come from the owner's `eas init`. `expo-updates` is outside this task's stated install, so it is queued.

## Verifier report

Verified 2 Oct 2026 on branch `wmt/SHELL-03` (cut from `origin/main` ab2df44, current), uncommitted working tree. Evidence directory: `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-03/`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. File list matches `git status` exactly (7 modified, `eas.json` new; plus the regenerated `docs/PROGRESS.md`, which the report omits and the workflow requires). `npm run check` exit 0: typecheck, lint, jest 3 suites / 7 tests (7 before), gates 9 run, 16 files scanned, 0 findings, baseline 0, tasks 187. | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-03/check.txt` |
| V1 package change | passed with a note. `package.json` adds only `expo-dev-client ~57.0.19`; it equals `bundledNativeModules.json` for SDK 57. Lockfile adds expo-dev-client plus its 6 dependencies (dev-launcher, dev-menu, dev-menu-interface, json-utils, manifests, updates-interface). One unrelated lockfile line changed (`eslint-config-expo` `^57.0.2` to `~57.0.2`): it syncs the lock to the existing `package.json`, harmless. `npx expo install --check` NOT RUN to a result (api.expo.dev refused by the proxy, exit 1). | `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-03/install-check.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-03/lockdiff.txt` |
| V10 Device | NOT RUN. Needs an Expo login, the owner's `eas init`, a build URL, a real Android phone and a real iPhone, and real backend addresses. Offline parts below were checked. | none possible |

### Offline checks run for V10

- `eas.json` parses as JSON. Profiles `development`, `preview`, `production` exist. Channels `preview` and `production` match `docs/BUILDS.md`. `preview` is an internal APK, `production` is an app-bundle with `autoIncrement` and `appVersionSource: remote`, as BUILDS.md lists. `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` are in all three profiles. No secret or real address is committed.
- Schema validation of `eas.json` NOT RUN: the EAS schema is not reachable (schemastore returns 404) and `eas-cli` is not installed. Every key used (`cli.version`, `cli.appVersionSource`, `developmentClient`, `distribution`, `channel`, `autoIncrement`, `android.buildType`, `env`) is a documented EAS key from my knowledge, but this was not checked against a schema or the docs offline.
- `npx expo config --type public` exit 0. `npx expo export --platform android` (to scratchpad) exit 0, one hbc bundle. `npx expo-doctor` 19 of 21; the 2 failures are network lookups refused by the proxy (config schema, React Native Directory). `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-03/config.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-03/export.txt`, `/tmp/claude-0/-home-user/96e62beb-c0ce-5c90-a589-b6d7920b563f/scratchpad/SHELL-03/doctor.txt`.
- `expo-dev-client` needs no `app.json` plugin or entry change: `expo config --type introspect` lists it in autolinked modules, its config plugin (`app.plugin.js`) is applied automatically, and the export works. The builder's decision not to touch `app.json` is right.
- OTA gap confirmed: `app.json` has no `expo-updates`, `runtimeVersion` or `updates.url`, and `expo-updates` is not installed. This is exactly what SHARED-CHANGES row 1 queues, so capability check 3 cannot pass until that row is applied.

### Capability checks

| Check | Result | Evidence / unblocking fact |
|-------|--------|----------------------------|
| A preview build installs on a real Android phone and a real iPhone and reaches the test backend | NOT RUN | Needs: owner's `eas init`, owner's first iOS preview build (Apple login), an Android preview build, real test addresses replacing the `.invalid` placeholders, two phones. |
| The developer can run `eas build --profile preview` for both platforms without an Apple or Google login | NOT RUN | Needs: a Developer-role Expo login and the owner's first iOS build to have stored the signing credentials. |
| `eas update --channel preview` reaches an installed preview build without a rebuild | NOT RUN | Needs: `expo-updates`, `runtimeVersion`, `updates.url` in `app.json` (SHARED-CHANGES row 1), an installed preview build, a phone. |

### Findings

1. unclear. Placeholder safety. `.invalid` never resolves (RFC 2606), so a build shipped with it fails on every request, and `src/api/client.ts` already falls back to the same `staging.invalid` (SHELL-02's `src/api/env.ts` documents this as "fails loudly"). But the failure is a network error on every call, not a build-time stop: nothing in `eas.json`, the gates or `npm run check` stops `eas build --profile production` or `eas update` from using `production.invalid` or the fallback. The risk is worst for `eas update --channel preview` run from a machine without `EXPO_PUBLIC_API_URL` set: it would bake the `.invalid` fallback into the update and break every installed preview build. Owner to decide whether a guard (a gate scanning `eas.json` for `.invalid` before a release, or a note in BUILDS.md) is wanted. Not a defect against the task as written.
2. unclear. `docs/BUILDS.md` new sentence "`eas update` takes the same variables from its own environment when it publishes": I could not verify this against Expo docs offline (no network). I believe `eas update` does not read the build profile `env` from `eas.json`, which makes the sentence true only in the sense of "not the same", but it is vague. Mark unverified; the owner should confirm against the current EAS Update docs before relying on it.
3. unclear. `eas.json` sets `channel: development` on the development profile. `docs/BUILDS.md` lists channels only for `preview` and `production`. Also all three profiles set `channel` while `expo-updates` is not installed; whether EAS Build accepts or warns on that could not be checked offline. Expected to be moot once SHARED-CHANGES row 1 is applied.
4. unclear. SHARED-CHANGES merge collision with `origin/wmt/SHELL-02`. SHELL-02's branch adds rows 1 to 3 in the same table (row 1 `src/app/_layout.tsx`, row 2 `eas.json` `EXPO_PUBLIC_ID_URL`, row 3 `docs/BUILDS.md` line 90). A three-way `git merge-file` of this branch's `SHARED-CHANGES.md` against SHELL-02's gives 1 textual conflict, and the merged result would have duplicate row numbers 1 and 2. Content overlaps too: SHELL-03 row 2 says the ID URL "covers the request SHELL-02 made" and this branch's `BUILDS.md` already names `EXPO_PUBLIC_ID_URL` (SHELL-02 row 3), so SHELL-02 rows 2 and 3 become already-done but stay `open` on merge. Whoever merges second must renumber (this branch's rows to 4 and 5) and mark SHELL-02 rows 2 and 3 applied. `docs/LOG.md` also conflicts textually but `.gitattributes` unions it. `BUILDS.md`, `package.json`, `package-lock.json` merge cleanly.
5. unclear. `npx expo install` rule: the builder used `npm install expo-dev-client@~57.0.19` because api.expo.dev is blocked. The deviation is reasonable: the version equals `bundledNativeModules.json` for SDK 57 and the lockfile is consistent. But CLAUDE.md says to use `npx expo install`, and `npx expo install --check` could not run here, so compatibility is confirmed only by the bundled version file. The owner (or anyone with network) should run `npx expo install --check` once.
6. unclear (minor). The builder's report omits `docs/PROGRESS.md` from its file list. It is regenerated by `npm run tasks -- --write`, so this is expected.

No em-dashes, literals or TODO-style comments were found in `eas.json`, `docs/BUILDS.md` or `SHARED-CHANGES.md` edits. No defects open. Status set to `review`; V10 and all three capability checks remain NOT RUN and need the owner's inputs above before sign-off.

## Owner sign-off

Owner, 2 Oct 2026: merged from wmt/SHELL-03. Device checks stay NOT RUN until the owner runs `eas init`, the first iOS build and supplies the real addresses (SHARED-CHANGES rows 4 and 5).
