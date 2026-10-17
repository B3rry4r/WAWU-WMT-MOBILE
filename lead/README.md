# lead/ : the hand-over folder for the lead of this build

This folder lets a fresh lead session, on any account, pick up the work where it stands. It lives on the long-lived
branch `lead` (never merged to main; the lead updates it often without the owner's approval).
Start at `HANDOFF.md`: how to start, what is live, what is ready, what is in flight, what waits on the owner.
This is docs and small tools only; no product code. Files changed here never touch the app or the backend.
Then `RUNBOOK.md`: how to lead (the owner's rules, the build loop, merging, the board, the hand-off ritual).
- `tools/`: brief generator (`mk.py`), templates, common rules, CI and deploy waiters. Set `LEAD_SCRATCH` for your folder.
- `board/`: the owner's progress board generator and its facts file. `history/`: check reports, merge notes, owner answers.
- `LESSONS.md`: what the first 16 days of the build taught. No keys or tokens are kept here; the owner re-issues them.
