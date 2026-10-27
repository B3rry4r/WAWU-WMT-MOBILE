# PRICE-LIST history

## Builder round 1 (27 Oct 2026)

Hub built and pushed (backend wmt/PRICE-LIST). Records on mobile wmt/PRICE-LIST. See the task file, Current state and Not done.

## Builder round 2 (27 Oct 2026)

Lead ruling: option A. The app sends X-Wawu-Client: app; the Hub applies the price list on POST /content, the draft publish, PUT /events/{id}/tickets and POST /events only with it. New specs were run red against 6fc302c (7 of 12 fail) and the round-1 specs red against origin/main 53f3cb3 (3 suites do not load) before the code. See the task file.
