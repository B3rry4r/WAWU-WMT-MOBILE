# FIX-47 · round history

Moved out of [tasks/FIX-47.md](../FIX-47.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Mobile `wmt/FIX-47` from `wmt/DV2-05` `960c40d`. Stack `fix_47` (backend `wmt/MERGE-7` `9c40478`, mobile web export of this branch, bundle ports checked by the stack), ports 7760 to 7767; the Hub's money routes fixtured in the browser as the DV2-05 verifier did (`chain2.py`, copied with its ports and a 300 ms picture loop).
- **Cause (the verifier's P1, found one step deeper):** `POST /money/wallet/open` fills the progress cache, so A31's `ReviewResume` (mounted under A5, A26, A27) swapped its step for the fallback and unmounted `OpenWalletScreen`. Its unmount effects forget the held BVN and NIN (`forgetKeptCheck`) and remove the opening's queries. A5 then read "nothing held" as lost and called `restart`, which pops to A31 (`history.go(-3)`), taking A27 with it.
- **Fix:** `ReviewResume` draws its step while `active` is false; A5's `lost` also needs no send in flight; A31's fallback draws a busy state while a send is in flight (`ResumeFallback`, the one route change in `src/app/open-wallet.tsx`).
- **Red then green (jest, screens stacked, a stack that pops as the router does):** `duringSend.test.tsx`, 7 tests. On `960c40d`'s three source files: 5 failed (selfie and off, back press, A31 in front during a send, A5 restart during a send), the 2 controls passed. Now 7 of 7. `src/features/open-wallet` and `src/app` together: 20 suites, 328 tests, EXIT 0.
- **Browser (`chain47.py`, light, pictures every 300 ms):** selfie held 2 s and 4 s, off held 2 s and 4 s: all four, A27 on screen in every picture before the release, Submit spinning, no blank page, trajectory `/open-wallet-address` then (release) `/open-wallet-selfie` or `/open-wallet-checking`; 1 open call, 2 document POSTs, 0 liveness POSTs; the only history call after Submit is the `go(-3)` of the final replace, after the release. Back press at 0.4 s (selfie and off, 2 s hold): the person is on A26 (`/open-wallet-id`), both uploads finish, 0 liveness POSTs, nothing redirects.
- **Not run:** a real device, GitHub CI, the dark theme in the browser (the change draws nothing new on A27; the busy view of A31 uses the same skeleton tokens as A27's own loading view).
