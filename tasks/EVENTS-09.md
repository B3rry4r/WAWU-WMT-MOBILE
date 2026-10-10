---
id: EVENTS-09
title: At the door: scan, let in, already used, not valid
owner: YOU
area: EVENTS
order: 58
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [EVENTS-05, EVENTS-03, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [E19, E20, E23, E24]
---
# EVENTS-09 · At the door: scan, let in, already used, not valid

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV3).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py E19 E20 E23 E24` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for E19, E20, E23, E24, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-camera` (E19 scanner). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **E19 · At the door**: Camera scanner: 'Point at the ticket QR', 'Type the code instead'.
- **E20 · Let them in**: Green result: 'LET THEM IN · Regular · Lennox Emmanuel · In the room 23 · Still to arrive 41'.
- **E23 · Already used**: Amber result: 'ALREADY USED · Checked in at 09:52 by Door 1'.
- **E24 · Not valid**: Red result: 'NOT A VALID TICKET · This code isn't for this event'.

## Capability checks

- [ ] **E19**: a user can scan QR; type code.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E20, E23, E24.
- [ ] Door staff a host added can let a valid ticket in and see the holder's name (E20).
- [ ] The same ticket scanned twice shows Already used with the time and the door (E23).
- [ ] A ticket for another event shows Not valid (E24).

## What the backend serves today (from the analysis)

- **E19**: served. Missing: Only the host's own account may scan (scan() throws 'Only the organiser can check tickets in.'); no door-staff delegation.
- **E20**: partial. Missing: Returns buyerWawuId, not the holder's display name the board prints; needs a profile join.
- **E23**: partial. Missing: 'by Door 1' needs named scanners/doors: no door-staff model, scan restricted to host, checkedInBy not returned.
- **E24**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- None recorded.

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Builder session, 10 Oct 2026 (Sonnet). Mobile branch `wmt/EVENTS-09`, backend branch `wmt/EVENTS-09` (3dbe7e0, on backend main `181ee5d`). Own databases `be09_*`, ports 6171 to 6174, every process stopped and database dropped at the end. Nothing was sent to a payment or identity provider or to any wawuafrica.com host. Pictures and logs: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wallet06/events09/` (`side/` has each artboard beside the app, `shots/` has every state)._

- **Built.** Route `/events/door/<event id>` (`src/app/events/door/[id].tsx`, signed in only) and `src/features/events/door/`: `DoorScreen` (E19 with the result panels E20, E23, E24 over it), `DoorParts` (panels), `useDoorCamera` (expo-camera permission and mount), `doorApi` (the one call, `POST /events/{id}/door/check-in`, answer checked before anything is drawn), `doorCode` (typed-code writing and the scan gate), `doorFormat` (the three results), `doorConfig` (two PROVISIONAL times). 5 test files, 62 tests; 15 one-line mutants of the source, all killed (`mutants.json`). Backend (additive): the door route takes any scanned text (`DoorScanDto`, 4 to 500 characters) and answers text a ticket code can never be with `invalid` plus the live counts, where it was a 400 for anything over 40 characters; a new spec (5 tests, 2 mutants killed). The protected host-only scan is untouched (a spec pins its 41-character 400).
- **E19 a user can scan a QR and type the code: passed on the web build, V10 NOT RUN.** Real sign-in (wawu-id, the seeded Door 1 account added by the host through `POST /door-staff`), Chromium's fake camera playing a QR of a real ticket, expo-camera's web scanner (zxing-wasm, the one file it fetches from jsDelivr was served from `node_modules`, nothing else left the machine) read it, the real Hub answered: "LET THEM IN, Regular, Lennox Emmanuel, In the room 23, Still to arrive 41" (`shots/scan-fresh0-dark.png`). Typed: "Type the code instead" opens a sheet, the field writes `0dys 7x0g-98jz wnx8` as `0DYS-7X0G-98JZ-WNX8` (look-alike letters O, I, L read as 0, 1, 1), "Check ticket" sends it (`E19-type-*`).
- **Door staff a host added let a valid ticket in and see the holder's name (E20): passed live.** Door 1 is a plain account the host added; the name is wawu-id's (`E20-light.png`, `E20-dark.png`).
- **The same ticket twice shows Already used with the time and the door (E23): passed live,** by typing and by the camera ("Checked in at 18:01 by Door 1", the Hub's time on this machine's Lagos clock; `E23-*`, `scan-used-dark.png`).
- **A ticket for another event shows Not valid (E24): passed live,** typed and by camera (`E24-*`, `scan-other-dark.png`), and a QR that is not a ticket at all (a 100-character link) is answered Not valid with the counts instead of a 400 (`scan-junk-link-dark.png`).
- **V5.** Eight pictures at 390 px, each artboard beside the app, light and dark (`side/E19|E20|E23|E24-light|dark-design-left-app-right.png`); the app's pictures come from the same real answers as above. The differences I can see: the device's status bar and home bar are not in a web export; the camera picture is the artboard's own photo played by the fake camera, 2 px blur not applied; the glass X is the shared `IconButton`'s `glass` tone (dark theme's scrim is darker than the canvas's 40%); the red is the danger token `#D93A3A` where the canvas paints `#D63B3B`. I do not say it matches: the verifier decides.
- **V6 states, each entered by its real cause** (`shots/state-*`): loading "Checking the ticket" (the request held, light and dark); offline (the network refused it; "No connection ... The ticket was not checked in", then Try again sends the same code and the Hub's verdict shows); too many scans (the Hub's own 429: another scanner behind the same address used up its 20 a second; EVENTS-05's U3 says a 429 is never a verdict, and it is not); not allowed (403 for an account the host never added, the Hub's sentence, Back only); no such event (404, and a link that is not an event id sends nothing); the camera asking, refused, none on the machine, and allowed but not starting. Empty: none (the screen has no list; with nothing to show it draws nothing). "Camera turned off for this app and the phone will not ask again" cannot be reached in a browser: covered in jest, NOT RUN on a phone.
- **One ticket is let in once, under two scanners at once.** Twelve simultaneous scans of one ticket (host and Door 1): 1 valid, 11 already used. Two phones pressing "Check ticket" together: one LET THEM IN, one ALREADY USED. A ticket held in front of the camera for 12 seconds is sent once; the result clears on its own and the ticket is not read again.
- **V4 field trace (writer, storage, reader).** Holder name: wawu-id's account name, looked up by the Hub for the ticket's buyer, `holderName`, E20. Tier: the host's ticket tier name (`EventTicketType.name`, set by `PUT /events/{id}/tickets`), `tierName`, E20. Time and door of E23: written by the first scan (`EventTicket.checkedInAt` and `checkedInBy`), the door's label written when the host adds staff (`EventDoorStaff.label`, `POST /events/{id}/door-staff`), `checkedInAt` and `checkedInBy`, E23. Counts "In the room" and "Still to arrive": the same `ticketTotals` the organiser dashboard uses, `totals`, on every result. After the walk the host's `GET /events/{id}/dashboard` read 64 sold and `checkedIn` 27, equal to the 27 tickets the Hub's database holds as `checked_in` and to what the walk let in (22 by the seed through Door 1, 5 during the walk; `dashboard-after.json`).
- **Decisions (Default (agent), owner may override).** (1) E19's four corner marks are in the markup but cancelled by its own `border-width:0`, so the render draws none and neither does the app. (2) The live camera sits under a 55% veil of the page colour (the canvas draws its photo at 45%). (3) A result stays 3 s or until tapped, and the same code is not read again until it has been out of view 1.5 s, both PROVISIONAL in `doorConfig.ts`; a code first seen while a result is up is read the moment it clears. (4) "Checked in at" is this phone's clock, with the day named when it was not today; "by the organiser" when the host scanned it. (5) The typing screen is not drawn: a sheet (title, field, "It is printed under the QR on the ticket.", Check ticket) in the canvas's tone. (6) The problem states are not drawn: copy is the result panel's shape in the page's card colour (listed in `DoorScreen.tsx` `problemOf`). (7) Backend: the door route now answers every scan (above); a reading shorter than the 4 characters the route takes is padded with spaces, which the Hub trims, so it too gets a verdict. (8) The route only: E18's "At the door" button is EVENTS-08's to add (R-27); no entry was drawn here (R-47).
- **Filed.** SHARED-CHANGES EVENTS-09 #1 (backend contract), #2 (mobile contract, regenerated from the backend branch with `scripts/api/sync_contract.py`; mobile main's contract was byte-identical to backend main so the diff is exactly #1), #3 (`app.json` camera text, open). BACKEND_GAPS G-650 (no screen for door staff to find their door or for the host to add staff; both served by the Hub) and G-651 (a freed "Door 1" label can go to another person, EVENTS-05 N1).
- **Counts.** Mobile gates before (main `90bdbfc`): 472 files, 0 fail, 1 warn; after: 485 files, 0 fail, 3 warn (the two PROVISIONAL markers). Backend gates before and after: 16 fail, 88 warn, 76 accepted, the same 16 FAIL lines as main `181ee5d` (1,084 and 1,085 files); `check_baseline.py` ok. Backend: `tsc` 0, eslint on the 4 changed files 0, `src/event-ticketing` and `src/event` 6 suites 133 tests on a fresh migrated database (in a private network namespace), protected suite `run.sh --fresh HEAD` 253/253 and 244 required passed, `contract:build` the same md5 `9bbe1048` three times. Mobile `npm run check`: EXIT 0 in its log (125 suites, 2080 tests, gates 485 files 0 fail 3 warn, 273 tasks). The first run, on a machine at load average 24 to 28 (666 s), timed out five files at the 20 s limit (auth-signup, eventsScreens, HomeScreen, MeScreen, schoolsScreen: eventsScreens is a known flake, the other four are new to that list); the five passed alone (198 tests) and the whole check then passed.
- **NOT RUN.** V10 on an Android phone (the real back camera and its ML Kit decode, the permission prompt and the permanently refused state, the sheet's keyboard on edge-to-edge Android, the hold times at a real door): unblocked by the lead's preview build (row 8's modules are in) on an Android phone and a Hub with this change deployed (backend `wmt/EVENTS-09` merged and on the droplet). The full backend suite (`npm run test:contract` on everything): only the touched modules and the protected suite ran; unblocked by the namespace harness over all suites. A paid ticket through Flutterwave or Fintava: not touched. EVENTS-05's U4 (a later block does not end door access) is unchanged and not mine.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
