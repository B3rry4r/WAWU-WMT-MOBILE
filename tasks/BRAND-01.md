---
id: BRAND-01
title: The app icon fits the phone, the welcome page has a cover picture, and Settings has a way in
owner: YOU
area: SHARED
order: 235
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [SHARED-04]
decisions: [R-37, R-45]
passes: [V1, V2, V5, V6, V10]
artboards: [A1]
---
# BRAND-01 · The app icon fits the phone, the welcome page has a cover picture, and Settings has a way in

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, `docs/BUILDS.md`
- `CLAUDE.md` (the logo is drawn only with `<BrandMark>`; the app's own icon files are the exception this task fixes)
- The owner's phone screenshot (8 Oct 2026, Samsung One UI): the launcher icon shows the logo too large, with "WHO", the top of the P and the drip cut off by the icon shape.

## Goal

The owner tested build c8427c15 and found three things a person sees first:
1. **The launcher icon** is clipped. `assets/images/android-icon-foreground.png` holds the logo at 55% of the canvas and launchers that crop more than the 66% safe zone cut it.
2. **The welcome page (A1)** draws only a brand gradient where the canvas has a cover photo. A video will replace it later; until then it shows a picture from the website.
3. **Settings has no way in.** `src/app/settings/*` exists, but no screen opens it.

## Scope

- Icon: redraw the adaptive foreground so the whole logo, drip included, sits inside the circle safe zone with clear margin (about 40 to 45% of the canvas, centred on the logo's visual weight), on the brand purple background; regenerate `icon.png` and the monochrome icon the same way. Check it under circle, squircle and rounded-square masks (render each) and on a light and a dark wallpaper.
- Opening screen: the splash logo is shown at a sensible size (not 96 px on near-black) and does not shrink or zoom away as the app opens; follow Expo SDK 57's splash options.
- Welcome cover: a picture taken from the website (wawuafrica `public/` or its live landing images), saved in the app's assets, under the existing shade and words; light and dark as drawn. Note the file's source in the report.
- Settings: add the entry where the canvas draws it (find the artboard: the Me tab's header or rows, Z1/Z2 Settings flow), opening `/settings`.
- The rule (R-45): if any of these screens has a section whose task is not built, draw it as designed and leave its tap inert; never hide it.
- The icon and splash change native assets, so a new preview build is needed; the lead runs it after merge.

## Capability checks

- [ ] Icon renders uncut under circle, squircle and rounded-square masks (pictures in the report).
- [ ] The opening screen shows the logo at a sensible size with no zoom-out.
- [ ] A1 shows the website picture under the shade, light and dark, beside `render_design.py A1`.
- [ ] A user can reach Settings from where the canvas puts its entry, signed in.
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
