# POINTS-13 · round history

Moved out of [tasks/POINTS-13.md](../POINTS-13.md) word for word, oldest first. The current state is in that file.

## Builder report (STUDIO-1110 round)

Merged `origin/wmt/BATCH-1110` into `wmt/STUDIO-HOME` (a merge, no rebase). Conflicts and settlement as in Current state. Checks: typecheck, lint (0 errors, 10 existing warnings), full jest (533 suites, 7965 passed, 6 skipped), gates, tasks. Web export built by the local stack (`stack.sh --with mobile`); every new screen draws on the web, none hidden. Stand-in limits met on the stack, not product faults: the storage stand-in had no CopyObject or CORS (a patched copy was used for the stack only, Hub untouched). NOT RUN: a real provider, a real phone (PHONE CHECK lines stay), Dialogue, Podcast, Voice changer, Talking photo, Video, Photo edit, Split a song and Music for a video were shot at their input screens only.
