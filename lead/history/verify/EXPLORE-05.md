# EXPLORE-05 verifier report, round 3 (backend wmt/EXPLORE-05 ba55a42, main b32f9c0 merged in; mobile 27e3480)

Verdict: merge (nothing medium or worse). Round 2 finding 1 (medium) is closed by the allow-list: no number, link or
punctuated email form reaches the list. Four lows and two owner questions below.

## Findings
1. LOW, a lookalike-spelled public thing takes over the shown spelling of an organic entry.
   src/search-response/popular-name.ts LOOKALIKE_LATIN (U+0131 dotless i, U+0251, U+0261) is folded in the search but
   allowed in a shown name (NAME_PATTERN covers U+00F8 to U+02AF). Reproduced: live content "Zed Lookalike Show", 3 people
   search it; a creator makes the room "Zed Lookalıke Show" (dotless i); the list now shows the room's spelling
   (room beats title in the DISTINCT ON); searching that shown text finds 0 content. Fix: leave those three out of the
   fold, or out of the allowed letters (no Nigerian language needs them).
2. LOW (design limit, inherent to a ranking by people), 4 accounts and 8 public things fill the list. 8 rooms (one
   creator account) searched by the SAME 4 accounts push two organic entries of 3 people off (8 of 8 shown are the
   attacker's); with 7 rooms the organic one shows. Junk TEXTS cannot: 80,000 junk texts x 4 people (400,000 history
   rows at 5x scale) and the 2 real entries still show. Cheaper than round 2 (45 texts), same class; the shown text is
   the room's own name, so what an attacker can publish is any name that passes the character rule.
3. LOW, cost grows with the number of public names and history rows, all paid once per 60 s per process.
   The query folds every live content row's category (not distinct) and every title, room and handle, and every
   distinct history text. Measured on a seeded database: 6,000 rooms + 12,000 titles + 4,000 handles + 80,000 history
   rows = about 1.0 s per refresh (2,279 buffers); 5x that (30,000 + 60,000 + 20,000 + 400,000) = 3.2 to 4.5 s per
   refresh, linear. Calls arriving while it runs wait for it (they share the one query). Fine for launch; the lead may
   want `SELECT DISTINCT c.category` and a precomputed fold column when content passes about 100,000 rows.
4. LOW, a creator whose deletion is scheduled still has the handle on the list (and in GET /search tab=creators, which
   is the same on main): the profile stays public until the purge. Consistent with the rest of search, noted because the
   lead's rule 5 says "hidden or deleted".
5. LOW (copy), contract summary of GET /search/popular still says "What many different people searched lately", and does
   not say the entries are the names of public things. A client developer would think they are free text.
   Also: a typographic apostrophe (U+2019, the iPhone default) refuses "Chidinma’s Kitchen"; İ (U+0130) never matches
   (JS lower-case and the database differ). Both accepted costs of the Latin-only rule, listed so they are known.

## Owner questions (not findings, by the lead's ruling)
- Word-only texts pass when a room or title is named exactly so (3 searchers): "chidinma okafor gmail com", "chidinma
  gmail", "zero eight zero one two three four five six seven eight", "evil example", "hxxps evil example", "telegram me",
  "whatsapp me", "send money to my account", "Chidinma Okafor is a scammer".
- Letters standing in for digits pass the 4-digit rule: "OBOlZEAS6TB" (a leet spelling of a 11-digit number, 3 real
  digits) was listed. Same class.

## Attacks (all on the real stack, real routes for rooms, creators, searches, DELETE /account)
- (1) 102 texts (61 from round 2 finding 1, 41 new word-only, homoglyph and allowed-name texts) as exact room names, each posted by 3 accounts through POST /search/recent, read
  with the service on the real database in batches of 8: 35 digit-bearing phone forms (commas, colons, stars, plus,
  pipes, dashes, emoji between digits, keycaps, circled digits, Chinese numerals, Arabic and Devanagari, full-width,
  zero-width, homoglyph 08O1l34567B, 123456, +234): 0 listed. 21 email/link forms with punctuation ([.], (.), U+3002,
  @, (a), underscore, 10.0.0.1/evil, http, www, bit.ly, t.me, node.js, mr.beast): 0 listed; "chidinma-gmail" and
  "wedding at lagos" listed (words only). Only names of at most 4 digits pass: "Room 2026", "a1234", "Lagos 1234",
  "Call 0801" listed; "Top 20 songs 2026" (6 digits) refused. The same 7 forms as content title, as content category
  and as creator handle (SQL rows): only "Room 2026" listed.
- (2) Room names with Cyrillic a, Greek alpha, full-width, math-bold, zero-width, soft hyphen, word joiner, curly
  apostrophe, dot, slash, underscore, colon, at, bang, hash, brackets, tab, newline: 18 of 18 refused. Searchers typing
  a name in 3 different spellings (full-width, upper case with triple spaces, Cyrillic lookalikes): the list shows the
  room's own name for all 5 kinds of thing (title, category, room, room, handle). One account typing 3 spellings counts
  once (not listed). Yoruba, Igbo, Hausa, Akan names, O'Neil-Smith & Sons, "École Lagos" listed.
- (3) cost and flood: see findings 2 and 3. 60 s cache: 40 parallel calls = 1 query (one scan of Community, one of
  UserProfile, two of ContentPiece and SearchHistory); 40 more inside the window = 0 scans; statuses 200 and 429 (global
  throttle), 2 distinct bodies from the 429s only.
- (4) 39 website calls: 171 website-shaped calls (3 callers, 10 queries x 5 tab and limit variants, suggestions,
  closest) on main b32f9c0 and the branch over ONE database, with 7 live pieces, 2 creators and 3 rooms seeded so the
  bodies are not empty (142,338 bytes): 141 x 200/200, 30 x 400/400, 0 differences, byte-identical. include probes
  behave as round 2 (opt-in only; unknown value 400 on both). Deleted-account rule: 3 people list a room; one calls
  DELETE /account (200) and it drops; that account posts again (201), still dropped; a 4th live person brings it back
  and the shown text is the room's name, not the deleted account's spelling; 2 more deleted, gone. SearchHistory is in
  the purge map (OWNED).
- (5) removed content (title and its only category), a deleted room: shown at +2 s (cache), gone at +61 s; the other
  room stays.
- CI on ba55a42: 3 suite shards, netns, contract, deploy-test-in-sync, Protected route suite, Baseline: success.
  Executable gates: failure, 18 FAIL lines, identical to main b32f9c0 (18), none in search code. Migration
  20261022190000 sorts after main's last folder 20261021340000 (stamp is 6 days ahead of today; lead renames at merge).
  Mobile 27e3480 vs 4d95eee: docs and task file only.
- Not run: the builder's specs (CI ran them), contract:build twice (CI contract job is green).

## Method notes
- GET /search/popular answers from a 60 s cache, so the matrix evaluated the same SearchHistoryService (compiled dist)
  against the stack database with a later clock; the HTTP route was used for the e2e, cache and burst checks.
- CreatorState rows for handle tests were inserted by SQL: the only code path that makes one is publishing content.

## Cleanup
Stack explore_05 down (database dropped), second Hub (main b32f9c0, port 7255, PID 23484) killed, ports 7250 to 7257
free, worktrees v-explore-05-be and v-explore-05-main removed, nothing pushed. Scratch:
/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/explore-05-v/ (lib3/ scripts, logs/).

---
# EXPLORE-05 verifier report, round 2 (backend wmt/EXPLORE-05 343e913, mobile 4d95eee)

Verdict: fix (1 medium, 1 medium-by-design-limit shown as low for the lead to rule, lows). Round 1's three mediums:
1 closed, 2 closed, 3 only partly closed.

## Findings

1. MEDIUM, GET /search/popular can still publish phone numbers, email and link spellings the builder did not list.
   src/search-response/popular-search-text.ts (SEPARATORS line ~50, PHONE_RUN, BRACKETED_WORD, DOMAIN, spelledOutEmail).
   The rule removes only `\s . / _ ( ) -` before it looks for 7 digits in a row, and recognises an email only by
   "@", "(at)"-style brackets or the word at/dot between two words. Reproduced on the stack with 3 accounts and a
   public room named with the text (4 real accounts, real routes, see "How the gate is met" below). Reached the list:
   - phone: 0801,234,5678  0801:234:5678  0801*234*5678  0801+234+5678  0801|234|5678  0801#234#5678  0801~234~5678
     0801'234'5678  0801;234;5678  0801x234x5678  0801 en dash/em dash/minus sign/middle dot 234 ... 5678; digits with
     an emoji between (08🔥01🔥234🔥5678); keycap digits (0️⃣8️⃣0️⃣1️⃣...); digits with variation selectors or a combining
     mark (0̷8̷0̷1̷...); 0,8,0,1,2,3,4,5,6,7,8; circled digits ❶❷❸ and ⓿; Chinese numerals; homoglyph letters 08O1l34567B;
     digits spelled out ("zero eight zero one two three ..."); 123456.
   - email: "chidinma gmail", "chidinma okafor gmail com", chidinmagmailcom, chidinma_gmail_com, "gmail", "yahoo mail",
     "chidinma (a) gmail (.) com", Cyrillic o in "dot" ("chidinma dоt com"), "chidinma-gmail".
   - link: evil。example (U+3002), evil[.]example, evil(.)example, "hxxps evil example", "evil example com", evil·example,
     evil,example, evil;com, 10.0.0.1/evil, "telegram me", "whatsapp me", "instagram chidinma_okafor".
   Real-route proof (POST /users/me accountType creator, POST /communities {name: text}, 3 x POST /search/recent, GET
   /search/popular): "Call me 0801,234,5678", the keycap number, "evil[.]example/claim-your-prize", "chidinma okafor
   gmail com" and "Pay 08O1l34567B now" were each listed. Held back correctly: 0801.234.5678, (0801) 234 5678,
   0801/234/5678, 0801_234_5678, Arabic and Devanagari digits, full-width digits, zero-width characters, +234 forms,
   chidinma@gmail.com, "(at)", "[at]", "{at}", "at ... dot", http/https/www/bit.ly/t.me, evil.example.
   Fix: take out every character that is not a letter or digit (and map No-category digits such as ❶ and ⓿) before the
   digit test, or count digits across the whole text (7 or more), and read the 7-digit rule on that; fold confusables
   (Cyrillic and Greek lookalikes) before the at/dot word test; refuse "[.]", "(.)", U+3002, and a provider word
   (gmail, yahoo, outlook, hotmail, icloud) next to a word. False refusals the lead should weigh when choosing: today
   "node.js course", "next.js tutorial", "asp.net core", "mr.beast" (link rule), "wedding photographers at lagos",
   "polka dot dress" (email rule), "call of duty 2026 2025" and "top 20 songs 2026 2025" (8 digits after spaces go) are
   all refused. A total-digit rule would refuse more of the last kind.

2. LOW (design limit, the lead may rule it medium). The "must return a public result" gate does not stop deliberate
   abuse. Any account can PATCH /users/me {accountType:"creator"} and POST /communities {name:<any 3-80 characters>};
   a room whose name contains the text is a public result, so a private person's name or a sentence reaches every
   Search landing with 3 accounts. Reproduced end to end with the real routes: "Chidinma Okafor is a scammer" listed
   (room created by a fresh creator, 3 other accounts searched it). Without a room the gate holds: 0 of 45 phone forms,
   0 of 22 email forms, 0 of 25 link forms and "send money to my account" were listed with no matching room. The
   gate therefore stops organic noise, not an attacker; the text rules in finding 1 are the only barrier for numbers,
   emails and links. A name or sentence needs a moderation or a "the matching thing is older than N days / has real
   activity" rule, which is a product call.

3. LOW, a flood can starve the real entries. The cap of 40 probes holds exactly (measured: 40 queries each on
   ContentPiece, Community and UserProfile per call; 200 refused texts cost no probe, only the 4 candidate pages and one
   spelling query). But 45 junk texts with 4 searchers each push a real text with 3 searchers out of the list
   (empty answer); with 30 junk texts the real one shows. Needs about 2 x the organic count in sockpuppets. Note the
   route is public and every call runs up to 160 ILIKE '%q%' queries; a short cache (60 s) would remove the load.

4. LOW, private history of a deleted account is still not erased (rows stay until the purge, which has no caller on
   main; SETTINGS-06 adds it). Popular no longer counts or spells it (closed, below). Carried by the builder as "stay
   until the purge"; confirm SETTINGS-06's purge runs the map.

5. LOW (carried), recent cap under parallel POST and blocked accounts counted in popular: sweep rows V1-4, V1-5,
   not re-tested here by ruling. Migration stamp 20261022190000 is 6 days ahead of today (lead renames at merge); it
   sorts after main's last folder 20261021320000_webhook_body_retention.

## Round 1 mediums
- M1 protected routes: CLOSED. 171 website-shaped calls (3 callers: signed out, signed-in A with 4 recent searches,
  signed-in B; 10 queries x 5 variants of tab/limit, suggestions, closest) on main 3797fb2 and the branch over ONE
  database, paced under the 200 per minute limit: 141 x 200/200 and 30 x 400/400, 0 differences, bodies byte-identical,
  with 5 matching rooms and recent searches present (communities [] and recentSearches [] on both). The first run was
  discarded: it hit the 20 per second limit and both sides answered 429; the rerun is paced and checks status pairs.
  Web: src/lib/api/search.ts (origin/main) calls /search?q=, /search/suggestions and /search/closest?q= with no
  `include`, and nothing else under src calls /api/hub/search. Opt-in works: include=communities fills 1 room on
  tab=all and tab=communities, [] on tab=content and tab=creators; include=recent gives the caller's list, [] signed
  out. Unknown, empty, upper-case, repeated or comma include is 400 (main answers 400 to include=communities too:
  "property include should not exist"). Registry and lock unchanged (lock sha 755ce4fa... both sides; .pipeline diff empty).
- M2 deleted account: CLOSED for popular. 3 accounts search one text, listed; one calls DELETE /account (200), gone;
  that account posts again after deletion, still gone; a 4th live account brings it back and the shown spelling is
  the newest live one.
- M3 privacy: PARTLY (finding 1). The round-1 forms are closed; the class is not.
- Round 1 low (wrong sentence for a non-text q): CLOSED ("q must be text", "q is required"; 101 characters and empty
  keep their messages; extra field 400; signed out 401).

## Checks (counts)
- Website calls: 171 (above) + 294 first-run calls discarded (429s). include probes: 7 values x 4 routes.
- Popular attacks: 107 texts through the text rules with a room (phone 45, email 22, link 25, ordinary 15), the same
  107 without a room, 12 false-refusal probes, 5 real-route end-to-end texts, 1 sentence end to end, deleted account 1,
  blocked account 1 (block call 404: the target had no profile row; counted as designed).
- Cost: 4 floods (empty, 200 refused, 200 no-result, 45+1 and 30+1 starvation).
- CI on 343e913: 3 suite shards, netns, contract, deploy-test-in-sync, Protected route suite, Baseline: success.
  Executable gates: failure, 18 FAIL lines, text identical to main 3797fb2 (18), none in search code.
- contract:build twice: byte-identical (md5 dec4ed46...), equals the committed file and the mobile copy.
- Migration order: after main's last folder. Mobile 4d95eee: docs and generated types only.
- Not run: the builder's specs (CI ran them; spent steps on attacks).

## Cleanup
Stack explore_05 down, database dropped, second Hub (main 3797fb2 on port 7255, started by hand over the same database
because stack.sh starts one Hub; PID 30145) killed, ports 7250-7257 free, worktrees v-explore-05-be and
v-explore-05-main removed, nothing pushed. Scratch: /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/explore-05-v/
(scripts in lib/, logs in logs/).

---
# Round 1 (kept for the sweep rows V1-4 and V1-5 that cite this file; backend 9e6b4bc, mobile 8c93c8f)

Verdict then: fix (3 medium). Findings: 1 MEDIUM protected routes changed behaviour undeclared (GET /search filled
`communities`, GET /search/suggestions filled `recentSearches`; 27 of 39 website calls differed); 2 MEDIUM a deleted
account's searches stayed in popular (DELETE /account never ran the purge); 3 MEDIUM popular could publish phone
numbers (0801.234.5678, (0801) 234 5678, 0801/234/5678, 0801_234_5678, Arabic-Indic digits, a zero-width character),
obfuscated emails, any name, a URL and a sentence.
4. LOW (V1-4), the cap of 20 is not held under parallel requests: 18 parallel POST /search/recent after 19 rows left 27
   rows (the check runs in READ COMMITTED transactions that do not see each other). The next single POST trims to 20;
   Recent shows 10 regardless. Same-text parallel x15: all 201, one row. Fix: a per-person advisory lock in the
   transaction.
5. LOW (V1-5), blocked accounts are counted in popular (one global list, no per-viewer filter, as designed).
6. LOW, POST /search/recent with a number, array, null or missing `q` answered "q must be shorter than or equal to 100
   characters"; POST answers HTTP 201 with envelope statusCode 200 (the repo's other POST routes do the same).
Judged then: the two edited hunks in search-response.contract.spec.ts were legitimate (stubs for Wave 3); recent is
private per person; Clear removes a person's text from popular; odd input 400 or stored as plain text; export section
`recentSearches` returns only the caller's rows; migration 20261022190000 additive (one table, 2 indexes), rollback
`DROP TABLE "SearchHistory"` leaves main's routes answering 200; community rows carry the same fields as GET
/communities, blocked either way hides the host's room, `%` `_` `\` match literally.
