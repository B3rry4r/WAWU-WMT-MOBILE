# WAWU WMT mobile — analysis agent brief

You are ONE of seven read-only analysis agents. Each owns a disjoint set of
design flows. **You do not build, edit, commit, or push anything, in any repo.**
Your only output is one evidence file. A script assembles the seven files; it
counts rows, so a row you skip is a visible hole, not a silent omission.

## What is happening

WAWU is a Nigerian creator marketplace. It has a shipped web app and a shipped
backend. A NEW mobile app ("WMT", Who Made This) is being designed and is now
the **authoritative product**. The web will adapt to it; the backend changes to
fit it. Your job: for every artboard in your flows, establish what it needs and
how far the current backend and web are from providing it.

## Inputs (read these; everything is under ANALYSIS=
`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wmt-analysis`)

- `$ANALYSIS/flows/<flow>.txt` — the design boards for your flows, extracted to
  text. Each `SECTION` is one journey row. Screens are labelled by artboard id,
  e.g. `W7 Send · to a WAWU user`. Rows carry "Starts from" / "Then" chips and
  an "Other states" row with "From Wxx" tags.
- `$ANALYSIS/flows/MANIFEST.json` — the artboard ids a regex found per flow.
  **Every id listed for your flows must appear in your output exactly once.**
  The regex is imperfect: some ids are cross-references to another flow, some
  may be noise. Classify them rather than dropping them.
- `$ANALYSIS/ref/backend-routes.txt` — all 271 live backend routes.
- `$ANALYSIS/ref/backend-models.txt` — all 75 Prisma models.
- `$ANALYSIS/ref/web-routes.txt` — all 83 web routes.
- `$ANALYSIS/ref/current-product-rules.md` — how the product works TODAY.
- `$ANALYSIS/ref/design-bundle-rules.md` — the designer's standing rules.
- Source, read-only: backend `/home/user/wawu-backend/src`, schema
  `/home/user/wawu-backend/prisma/schema.prisma`, web
  `/home/user/wawuafrica/src`. Grep them to confirm; never edit them.
- Rendered artboards if you need to SEE a screen: the `.dc.html` files in
  `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/wmt-design`.

## Laws

1. **Design is authoritative for UI. It is NOT authoritative for fact.** Any
   money amount, fee, rate, limit, FX rate, interest, licence claim, bank or
   provider name, legal or KYC requirement, or statutory text drawn on a board
   is an UNVERIFIED NUMBER. Record it under `facts_on_canvas`. Never treat it as
   a requirement and never as wrong. A human rules on it.
2. **"missing" is a claim you must earn.** Before marking backend `missing`,
   search backend-routes.txt, backend-models.txt and grep `src/`. Cite what you
   searched. `served` must cite a real route. `partial` must say exactly what
   is absent.
3. **Capture every designer warning verbatim.** Boards contain notes marked
   `⚠` (e.g. "⚠ I added the WAWU card row … Confirm."). These are open
   questions from the designer. Every one goes into `designer_questions`,
   word for word, with its artboard id. Missing one is the worst error you can
   make here.
4. **Conflicts with the current product are rulings, not decisions.** Where a
   board contradicts `current-product-rules.md` (payments provider, free
   content, upload limits, nav, anything), record it under `conflicts` with
   both sides quoted. Do not pick a winner.
5. **Absence is not removal.** If your flow's area exists on the web but a
   capability appears nowhere on your boards, list it under
   `web_features_absent_from_canvas`. Do not conclude it was cut.
6. Be concrete. "Needs a user search endpoint" beats "needs backend work".
   Name fields. Name the third party. Name the route that is close but wrong.

## Output — write exactly one file

`$ANALYSIS/evidence/<your-agent-id>.json`, valid JSON, this shape:

```json
{
  "agent": "A1",
  "flows": ["wallet"],
  "artboards": [
    {
      "id": "W7",
      "flow": "wallet",
      "title": "Send · to a WAWU user",
      "kind": "screen | state | entry-map | cross-reference | noise",
      "journey": "Send money",
      "what_it_shows": "one or two sentences",
      "user_actions": ["search by name/@handle/phone", "pick a recent recipient"],
      "data_needed": ["recent recipients list", "user search returning handle, name, tick kind"],
      "backend": {
        "status": "served | partial | missing | n/a",
        "evidence": ["GET /api/hub/search ... (searched: backend-routes 'search', grep 'recipient')"],
        "gap": "exactly what is absent; empty when served"
      },
      "web": {
        "status": "exists-matches | exists-differs | missing | n/a",
        "evidence": ["/wallet"],
        "delta": "how the web differs; empty when n/a"
      },
      "third_party": ["Fintava: name enquiry"],
      "facts_on_canvas": ["fee ₦10.75 per transfer", "limit ₦5,000,000/day"],
      "conflicts": [],
      "designer_questions": []
    }
  ],
  "designer_questions": [
    {"artboard": "W1", "quote": "⚠ I added the WAWU card row under bills, because it's the only way into Cards (W29–W34). ⚠ The Create button is hidden on Wallet so it never covers amounts. Confirm."}
  ],
  "conflicts": [
    {"topic": "payments provider", "canvas": "quote", "current": "quote", "artboards": ["W1"]}
  ],
  "facts_on_canvas": [
    {"artboard": "W1", "fact": "WAWU · Fintava MFB", "kind": "provider/licence"}
  ],
  "backend_build_list": [
    {"item": "Fintava account provisioning per user", "why": "W1 shows a NUBAN per user", "artboards": ["W1","W2"], "size": "S|M|L|XL", "depends_on": ["Fintava API docs", "KYC tier"]}
  ],
  "third_party_apis_needed": [
    {"provider": "Fintava", "capability": "name enquiry", "artboards": ["W8"]}
  ],
  "web_features_absent_from_canvas": ["…"],
  "summary": "5-8 sentences: what this area is, how far backend and web are, the biggest risk."
}
```

`size`: S = under a day, M = 1-3 days, L = 3-7 days, XL = over a week or
blocked on an external party. Size honestly; do not pad and do not shrink.

## Done means

- The file parses as JSON.
- Every id in MANIFEST.json for your flows appears in `artboards` exactly once.
- Every `⚠` in your flow text appears in `designer_questions`.
- Your final message is ONLY: the file path, the artboard count, and the count
  of designer questions, conflicts, and backend_build_list items. Nothing else.
