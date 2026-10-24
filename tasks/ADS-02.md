---
id: ADS-02
title: Admin screens: ads
owner: YOU
area: ADS
order: 43
priority: launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: [ADS-06, ADS-05]
decisions: [R-15]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# ADS-02 · Admin screens: ads

## Current state

As of 24 Oct 2026, verified by a Sonnet verifier (T1, bundle B13): PASS. Dashboard `wmt/ADS-02` `0d16895`; status review; nothing is merged or live.

- R-59 holds end to end: no picture means no save (422, and the form holds Save), no schedule, no resume (422, and the page offers neither); the "Needs a picture" badge and the Picture filter are there; adding a picture then lets it resume.
- Roles agree with the screens. No finding at low or above. One note (N1: re-pin the contract at merge).
- Not re-driven: views and taps from a live window (builder round 1 covers it), Hub-down states, a real picture preview.
- **Next:** the merge agent (one dashboard PR for ADS-02, LEGAL-07 and SCHOOLS-05).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Staff book, schedule and report on ads.

## Scope

Dashboard screens over ADS-06.

## Capability checks

- [ ] An admin can schedule a sponsored card for a date and later see its views and taps.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/ADS-02.md](history/ADS-02.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
