# Fintava

- `naira-api.md`: what Fintava's Naira API does, what that changes in our
  tasks, and the questions still open for Fintava. Start here.
- `cardex.md`: Cardex, their crypto partner, and how crypto is built on it.
- `reference/`: Fintava's published API pages, saved on 2 Oct 2026
  (`reference/INDEX.txt` lists them).
- Real sandbox calls go here too (task OPS-02): one file per call, request
  and full response, keys and BVNs masked; webhooks with their headers.

Nothing in the money lane is built from guesses about Fintava's API. A real
sandbox response beats the published docs; when they differ, correct
`naira-api.md`. Keys go in the backend's `.env`, never committed here.
