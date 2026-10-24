# FIX-28 · round history

Moved out of [tasks/FIX-28.md](../FIX-28.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/FIX-28` (one commit on main 56f94d0). Files: `src/schools/tests/schools-collation.contract.spec.ts` (+24), `src/community/community.service.ts` (+6 -2: the order and its comment), `src/community/tests/community-list-order.contract.spec.ts` (new). No other file; schools-order.ts is untouched.

| Capability check | Result | How |
|---|---|---|
| `lower(` to `upper(` in `schools-order.ts` fails a spec | passed | all four `lower(` turned to `upper(`: `schools-collation` 6 failed, 2 passed of 8; restored, tree clean |
| Two communities with the same name never repeat or go missing across pages | passed | new spec, 7 rows on 2 names, ids falling as made, walked at page sizes 1 to 7 and 9 and compared with one big page; with the `id` taken out of the order: 3 of 3 fail (seven communities seen, five distinct) |
| Protected suite 253/253; full suite green | in CI | pushed to `wmt/FIX-28`; run id in the hand-back |

Local: `tsc --noEmit` 0; eslint on the three files 0 problems; `src/community` and `src/schools` 204 of 205 pass on a seeded stack database. The one failure, `community-rooms` "a member sees the last message" (sender name `""` for `"Rooms Spec host"`), is in code this change does not touch (`/communities/mine`, the sender name comes from the identity lookup).

Decisions (Default (agent), owner may override). D1: four names, not two (`AB School`, `A_B School`, `_Under First`, `` `Quote First``) plus an explicit test on their places, so the order does not rest on `expectedOrder` alone. D2: the communities spec goes through the HTTP route and the guard (the route is protected), not the service. D3: SCHOOLS-03 gets the `nextCursor` note in its Read first; the screen already continues on `nextCursor`.

Not done: nothing open. Mobile `npm run check` ran on this file-only branch (see the hand-back).

## Verifier report

_Not started._

