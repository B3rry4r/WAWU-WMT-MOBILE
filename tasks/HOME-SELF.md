---
id: HOME-SELF
title: The viewer's own card draws no Follow, on Home and on every other creator list
owner: YOU
area: APP
order: -1253
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# HOME-SELF · Your own card has no Follow

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/HOME-SELF` on `origin/wmt/STORE-BUY-APP` `0d730a7a`. App code only: `app.json` and `package.json` untouched; fingerprints android `e871fe1a`, ios `e8e7de85` (unchanged).

Found live by the lead (31 Oct, the owner's account): `GET /api/hub/creators?page=1` returns the viewer, and Home's "Who Made This?" rail drew his own card with Follow. Cause in the app: Home hid the viewer only once `GET /users/me` had answered, and the rail drew before it did (the old HomeScreen test said so in a comment), so for a moment (and for ever if that read failed) the viewer's card had a Follow.

| # | Before | After |
|---|---|---|
| 1 | Home rail and the Following-empty rail dropped the viewer's card once their id was known, and drew Follow on it before | the viewer's own card stays (it opens their profile, which is the Me tab) and draws no Follow, exactly as Explore does |
| 2 | while the viewer's id was not yet read, every card drew Follow, the viewer's too | until the id is known no card draws Follow (one rule, `canFollow` in `home/model.ts`, the same as a feed post's `PostFrame`); Follow appears the moment the id is read |
| 3 | the same race on Explore, All creators (X4), Search people and the piece page's maker row; A13 and the feed's creator card had no own check at all | all use `canFollow`; A13's own row and the feed creator card's own card draw no Follow |

Default (lead), owner may override: the viewer's card stays in a list (a rail that holds only the viewer's card is not the empty state), and no Follow while the id is unknown.

### Grep proof (owner hard rule 3): every Follow button in `src`

Search: `grep -rnE "setFollowing|onToggleFollow|'Follow'|follow.toggle" src` (tests apart), each hit read.

| Surface | File | Verdict |
|---|---|---|
| Home "Who Made This?" rail | `home/CreatorRail.tsx`, `home/TodayScreen.tsx` | FIXED: `canFollow`, own card stays, no Follow |
| Following tab, nobody followed yet (H12) rail | `feed/FollowingEmpty.tsx` (same `CreatorRail`) | FIXED |
| Explore featured creators | `explore/ExploreScreen.tsx` | FIXED: had an own check, now `canFollow` (closes the unknown-id gap) |
| All creators (X4) and category lists | `explore/CategoriesScreen.tsx` | FIXED: as Explore |
| Search people rows | `search/SearchScreen.tsx` (`PersonRow`) | FIXED: as Explore |
| A13 People to follow | `after-signup/FollowScreen.tsx` | FIXED: reads the viewer's id; own row has no Follow |
| Feed creator card ("Follow" / "Following") | `feed/FeedCreatorCard.tsx`, `feed/FeedScreen.tsx` | FIXED: `myId` passed, own card has no Follow |
| Piece page maker row | `content-detail/ContentDetailScreen.tsx` | FIXED: had `own`, now also waits for the id |
| Feed posts' Follow | `feed/PostFrame.tsx` (`canFollow`) | KEPT: already `myId !== null && myId !== creator`, the same rule |
| Visitor profile Follow | `visitor/VisitorProfileScreen.tsx`, `app/profile/[wawuId].tsx` | KEPT: the Hub says own and the route replaces it with the Me tab (`onOwn`), so Follow is never drawn for oneself |
| Professional feed card | `feed/FeedProfessionalCard.tsx` | KEPT: no Follow (Message is already hidden for the viewer's own card) |

### Tests changed (the old behaviour is the defect)

- `home/__tests__/model.test.ts`: `discoverable` ("never offers the viewer") is replaced by `canFollow` cases (other: yes; own, unknown, empty: no).
- `home/__tests__/HomeScreen.test.tsx` "never themselves": now asserts the viewer's card is there with no `today-follow-<me>` and another card's Follow is; "with no creators to suggest" now gives an empty list (it used a list holding only the viewer, which is no longer empty).
- `after-signup/__tests__/afterSignup.screens.test.tsx`: the A13 test answers `GET /users/me` and waits for Follow (it appears once the id is read); new: the viewer's own row has no Follow.
- `__tests__/sharedToastFollow.test.tsx`: the four `CreatorRail` renders pass `myId="viewer"` (Follow needs a known id now); no assertion changed.
- New `home/__tests__/selfCard.test.tsx` on Platform.OS android: own card has no Follow, another card's Follow sends `POST /creators/<id>/follow`; with the id unknown no card draws Follow.
- Not unit-tested: the feed creator card's own-card hide (covered by tsc and the existing feed suite; rule is the one tested).

## Capability checks

- [x] The viewer's own card on Home draws no Follow, and another creator's Follow works (jest, Android).
- [x] No card draws Follow until the viewer's id is known.
- [x] Every Follow surface in `src` is listed above as fixed or kept with why.
- [x] Screenshots at 390 wide, dark and light, beside the H1 board.

## Pictures

`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/home-self/shots/`: `rail-dark-vs-H1.png`, `rail-light-vs-H1.png` (the rail with the id known, with the id unknown, then board H1), single shots `home-rail-{dark,light}.png`, `home-rail-idunknown-{dark,light}.png`, boards `H1-{dark,light}.png`. Method: web export, Chromium 390 by 844 at 2x, the real `CreatorRail` with the viewer's card, an Adaeze card and a followed Tife card, drawn through a temporary dev route (not committed), no Hub, every non-local request refused. Only the rail is drawn, not the whole Home screen; the board shows the whole screen.

## PHONE CHECK (what only a real phone proves)

- On the owner's own account on a phone: Home's "Who Made This?" shows his own card without Follow, and other cards' Follow still works.
- The viewer's id reads quickly; on a slow link the cards show without Follow for a moment, then Follow appears.

## Read first

- `DECISIONS.md` R-27, R-47; `docs/designer/BRIEF.md` H1.
