# Lessons from the WMT build (wawu-backend, wawuafrica, wawu-id, wawu-wmt-mobile), 1 to 15 Oct 2026

How the build ran: one lead session (Opus) orchestrates and merges and writes no task code. Every task is built by a
Sonnet builder agent and checked by a separate Sonnet verifier agent; findings go back as fix rounds. Briefs are files
in a scratch folder; a shared `common-rules.md` holds machine and safety rules. Four repos: a NestJS/Prisma backend
(live, people paying), a Next.js website (live), an identity service (live), an Expo mobile app (the product, unreleased).
Measured numbers below come from the 126 agent transcripts of 10 to 14 Oct (agents $1,936, lead $177 at API prices).

## A. Cost (measured)
A1. Cost is steps x context. Every step re-reads the whole context. 66% of agent spend was re-reading earlier command
    output. Cost per step: $0.038 under 100 steps (182k context), $0.062 at 100-199, $0.092 at 200-299, $0.098 at 300+
    (726k context). 57 of 126 runs went past 200 steps.
A2. Subagents cache for 5 minutes. An agent idle longer than that has its whole context written again at the expensive
    rate: 314 times, $275, 14% of agent spend. Long sleeps, long test runs waited on in the foreground, Monitor waits.
A3. Tests and waiting were 45%: builder AND verifier each ran the full 290-suite backend run locally (2,286 test
    launches) and polled for it. The same suite already ran in CI, but only after merge.
A4. Fix rounds: round 1 50%, round 2 22%, round 3 11%, rounds 4-6 17%. Round 3+ mostly fixed low findings and test
    gaps. One task went to round 6 ($201).
A5. Task files grew to 50-73k tokens because every round appended its record; every later agent re-read them (9%).
A6. Every agent hand-built its own test stack (Hub, mock identity service, database, web build, payment stand-in): 6%,
    plus setup mistakes that cost rebuilds.
A7. A lean brief (exact cases to test, a file map, a step budget, no optional extras) gave a full payment-path task
    (2 builds, 2 verifies, nothing above low) for $28, against $93-$201 for comparable tasks.
A8. The fixed start context was 59k tokens a step (rules, tool lists, brief): 14%.
A9. 9 agents on 4 CPUs and 15 GB: out-of-memory kills, jest workers killed, timing tests flaking, then re-runs. Cap
    heavy parallel agents (about 3) or move suites to CI.
A10. Opus agent fleets burned the owner's plan in two days. Rule: every agent is Sonnet; the lead (Opus) only
    orchestrates; a resumed agent keeps its model, so never resume an Opus agent.
A11. Plan facts (checked 12 Oct): the $200 plan's 5-hour window is 4x the $100 plan's, but the weekly allowance is
    only about 1.7x. Three $100 plans beat one $200 plan for weekly volume. Never assume plan sizes; look them up.

## B. Accuracy (what checking caught and what got through)
B1. Independent verifiers caught, before anything went live: 2 blockers (two deletes at the same moment freed extra
    places; erasing an account kept its phone marked verified), 1 high (a phone number released before it was
    proven), mediums (a double charge when a read failed; a provider webhook ignoring the charge it reported), and a
    live layout bug on the payment page. A lean verifier costs $1-$5; a median one $13.
B2. The only user-facing bug that went live came from a page merged without a verifier "for speed": the payment page
    ran 13 px past the screen on every phone for about 2 days. Small UI work still gets a verifier.
B3. Three deploys were stopped by the full suite, which only ran after merge (a contract spec on a kobo field, a real
    regex stack overflow, an undeclared rate-limit entry in an inventory spec). Live stayed on the old build; each
    needed a hotfix and blocked other merges. Run the deploy's test job before merge.
B4. A verifier compares against main: "same on main" separates a pre-existing defect from a new one. A pre-existing
    defect that users hit still gets fixed, in its own small round.
B5. Gates already fail on main (16 FAIL lines). The check is "the same FAIL lines as main", not zero. Same for web.
B6. Lead mistakes were scope readings, not code: the owner said other parts of the site should not show and the lead
    also hid the landing page; wrong plan arithmetic; claiming to know an external account's plan it could not see.
    Fix: quote the owner's words in the brief; ask when a phrase can be read two ways; never claim what you cannot see.
B7. UI shown to roles that cannot use it (create and edit controls for read-only admins) is a dead control.
B8. Numbers an agent invents (a daily email cap of 5,000) are marked PROVISIONAL with an owner and surfaced to the owner.
B9. Builder self-reports are claims to test. Verifier briefs list the builder's claims and say "test, do not trust".

## C. Changing a live system with paying users
C1. Additive only: new tables, nullable columns, new routes. A protected-route suite checked against the base branch's
    lock. For a changed endpoint, a spec proves the old request gets a byte-for-byte identical answer.
C2. Migrations: a stamp registry for in-flight branches; the lead renames a branch's migration at merge so it sorts
    after main's last one. A widened CHECK constraint is tested on live-shaped rows (old pending, paid, failed rows):
    every old row unchanged, and the constraint refuses for old-style rows exactly what it refused before. A
    rollback.sql that refuses while it would lose data.
C3. Money: the settle step compares against the row's own amount; the last place under a limit is taken inside a
    transaction that locks the counter row (SELECT ... FOR UPDATE); a held place expires; Idempotency-Key on writes;
    concurrency specs with real parallel requests.
C4. Deploy order: server first, a read-only live check (a public GET, a page render; never a payment), then the web.
C5. Owner-given data the feature needs on day one (a referral code at a price and a limit) is seeded by the migration
    with ON CONFLICT DO NOTHING, so it exists the moment the deploy lands.
C6. Before asking the owner for a key or a new service, check what the system already has (the identity service
    already sent email with its own key: the new feature relays through it instead of needing a second key).
C7. Inventory specs (rate limits, routes, kobo fields) fail the deploy when a new item is undeclared. Declaring a real
    new entry with a reason is allowed; editing a test to pass is not.
C8. Email: an unsubscribe GET only confirms (link scanners follow GETs); POST unsubscribes; one-click headers. A send
    claims each recipient before sending so a retry cannot mail anyone twice; stay under the provider's rate limit.
C9. Agents never call live providers or production hosts; stand-ins only. The lead alone does read-only live checks.

## D. Machine and process hygiene
D1. Worktree per agent, detached; never change the checked-out branch of the shared clones; remove worktrees at the end.
D2. Never stash, reset --hard, checkout -- ., clean, rebase, amend or force-push. Never pkill or pgrep -f; kill by PID
    (the node PID, not a wrapper's). Removing a worktree does not stop its servers: 17 orphans were found once.
D3. Shared caches leak between agents (a bundler cache baked another agent's ports into a build). Per-agent cache dirs;
    grep the build for ports before trusting pictures.
D4. Ports and database prefixes are assigned per agent in the brief.
D5. Gate every push on the check log's own last line (EXIT 0), never on a background job's exit code.
D6. Merge through a PR with the protected suite green, a merge commit, a comment stating the gate comparison, then
    watch the deploy to "success" and the health endpoint.
D7. The lead's waiting is done by shell scripts that cost no tokens until they finish (wait for CI, wait for deploy).

## E. The owner
E1. The owner does not read write-ups. Pages for the owner are visual (bars, boards, steppers) with short labels, in
    the brand's design (here: Alan Sans, one purple accent #9411C9, dark first).
E2. Show only what is built: no placeholder rows or do-nothing buttons for unfinished work (R-47).
E3. Every ruling is recorded where rulings live (DECISIONS.md) with who and when; a ruling outranks code comments.
E4. Fees, prices, legal text and limits come from the owner or config, never from a design or an agent's guess.
E5. Short status lines while work runs; never a fabricated result; say plainly what was not run (no real payment, etc.).
D8. (16 Oct) Two agents wrote the same log name (mobile-check.log) in a shared scratch folder; one read the other's
    results. Every agent writes under its own folder named after its task and role.
D9. (16 Oct) With 13 builders compiling at once on 4 CPUs and 15 GB, available memory fell to 1-2 GB, load reached 35,
    and every mobile full check failed on timeouts and a memory kill that passed when run alone. The cap formula
    (min(CPUs + 1, GB / 2.5) = 5 here) was right; launching past it cost reruns. Builders are heavy for most of their run.
E6. (16 Oct) The owner had to ask twice for the progress board to be updated. The board moves with every verdict, launch and deploy, in the same step as the merge-notes line, not saved up for a batch.
E7. (16 Oct) Two money-adjacent tasks each needed an extra round because they held a transaction and a lock across a
provider or bucket call. The rule went into common-rules.md so builders start from it, and verifiers measure pool
starvation with a slow stand-in.
E8. (16 Oct) Two PRs that touched the same files cost the owner a conflict on merge. Stack each batch on the previous
batch's head, and open the next PR only after the previous one merges.
E9. (16 Oct) The owner saw a stale board twice: answered questions still listed, merged work still "ready", old news,
a hand-typed time ahead of the clock. Cause: the lead stopped using the board generator and hand-edited only the card
each event touched. Rule: the board is generated whole from one facts file; facts that GitHub can confirm (merged,
open, branch heads) are read from GitHub at build time; answered questions cannot render; the time comes from date -u;
the build refuses to publish when a check fails; an hourly rebuild runs even without events.
