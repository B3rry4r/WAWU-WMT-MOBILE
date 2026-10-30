# WALK-FIX · round history

Moved out of [tasks/WALK-FIX.md](../WALK-FIX.md) word for word, oldest first. The current state is in that file.

## Builder report

None yet.

## H4 wording list (moved from the task file)

Only a throw on the phone changes; a refusal from the Hub, a real network failure and a write that got no answer read as before. The change is at the source (`src/api/client.ts` wraps every `api.*` call; `src/api/errors.ts` has `failureOf`) and in the places that told any throw "No connection": the wallet-opening `send` wrappers (`open-wallet/api/documents.ts`, `review.ts`, `world.ts`, `liveness.ts`), WAWU ID's call (`api/identity.ts`), and the upload PUTs of community cover, event banner, community photo, professional document, featured work, profile picture, TGIF card, chat attachment and voice recording (the voice recording keeps its own "upload was slow" line).

- Screens that print the error's own sentence now print the client line instead of "No connection": the wallet-opening screens (documents, review, world, liveness: `documentCopy` and `checkFailure` banners, ConfirmDetails, Selfie), settings and profile edit (`settings/failure.ts`, `profile-edit/failure.ts`), claim, works, pro-listing, community host, events host, chat attachments, TGIF card share, voice intro, profile picture, featured works.
- Screens that branch on `kind === 'network'` for an offline look (about, add money, bills, capital, chat, communities, community pass, confirm email, events tickets and door, explore, inbox, legal, movies, paid answers and messages, points, professionals, referral, schools, search, send, store, TGIF, verification, verify, visitor, wallet home, FX, history, earnings, pass, statements, withdraw, works) now show their existing non-network line for a client-kind error; none shows "No connection" for it.
- Reworded explicitly (they would have said "our side"): sign-in, the reset request, the phone and email code steps and sign-up Continue now read "Something went wrong on this phone" / "Try again, and if it keeps happening, tell us." (`auth/signInFailure.ts`, `auth/signupFailure.ts`, `auth/__tests__/phoneSideFailure.test.ts`).
- Every money screen's handling of `network` is unchanged (`isApiError(e) && e.kind === 'network'` still matches a real network failure and the "no answer" write error).

