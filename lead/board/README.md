# The owner's progress board

One facts file drives the page. Do not hand-edit board.html.
1. Edit `board.json` (needs, chains, columns, news, areas, merged, questions, prs). Move a card at every event.
2. Run `LEAD_SCRATCH=<folder> board/board-refresh.sh`. It reads GitHub (PR state, branch heads, app main), refuses
   stale facts, takes the time from `date -u`, renders at 390 and 1280 px and prints `OK v<n> <time>` or what failed.
3. Publish `$LEAD_SCRATCH/board/board.html` with the Artifact tool as the "Who Made This progress" artifact.
- The current artifact (https://claude.ai/artifact/2GCtXgV2hRKhpCpZEVexcU) belongs to the owner's first account. A lead
  on another account publishes a new one and writes its link in `lead/HANDOFF.md`.
- Files here: `board-gen.py` (generator), `head.html` (fonts and styles, ends at `</style>`), `pw-board.js` (pictures),
  `.version` (page number; the generator bumps it, commit it with board.json).
- Needs: python3, git, `gh` logged in with read access to the repos, node with Playwright (`PW_MODULE`, `PW_CHROMIUM`).
- Rebuild at least hourly, even when nothing happened.
