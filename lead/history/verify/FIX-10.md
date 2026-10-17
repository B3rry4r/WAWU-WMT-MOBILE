# FIX-10 verifier report (backend wmt/FIX-10 ad2b3c0, mobile 9b5f6eb)

Verdict: merge (nothing medium or worse). SHARED-CHANGES FIX-10 #1 (fenced src/common/auth) still needs the lead's approval at merge.

## Checks (stack fix_10, Hub built from ad2b3c0; a stand-in in front of the mock WAWU ID on 7156 with modes: no headers, headers then frozen body, chunked body that never ends, 1 byte per 200 ms, slow 200, 500; plus a real SIGSTOP of the stand-in)
- Lookup route GET /settings/privacy/blocked, 40 at once x 4 stall modes: all 200 at 3.0 to 3.25 s (handles), /health 2 to 250 ms during it; Hub to WAWU ID sockets 0 within 3 s of the end (default 5 s keep-alive on the far side); healthy body byte-identical afterwards; Hub RSS 318292 kB before and after, fds 25.
  (40 at once is cut to about 20 by the Hub's own 429 throttle; the 500-at-once case below is on the client.)
- Real SIGSTOP of the stand-in mid-body and before headers: lookup 200 at 3.02 s both times, write 502 at 8.01 s, sockets back to baseline after SIGCONT.
- Writes through PATCH /users/me (name): no headers, frozen body, trickle, 200 after 12 s: 502 at 8.0 s with the message a failed write already gives; exactly 1 request reaches WAWU ID per call (no retry, none 6 s later); 10 at once all 502 at 8 s, 10 requests, sockets 0 in 3 s. 200 after 2 s: 200. WAWU ID 500: 502 at once.
- Client on dist, same modes: 250 ids = 1 request, 3.0 s; 500 lookups at once 3.2 s; setVerification, elevateVerificationTier, updateName 8.00 s each with WawuIdTimeoutException 502; after 4.5 s no timers or sockets left, 0 unhandled rejections; answers landing at 2.9, 2.99, 3.0, 3.01, 3.1 s: no unhandled rejection; refused connection: empty map at once.
- Retry safety by reading: the three writes send absolute values (dates, tier, name) computed from the local mirror, so a re-send after an applied-but-timed-out write ends in the same state; the tick payment path leaves the purchase pending, so the person retries.
- Specs: wawu-id-timeout.spec.ts 21 of 21 (EXIT 0). CI on ad2b3c0: suite 3 of 3, contract, baseline, netns, deploy-test-in-sync, protected route suite green; Executable gates red with the same 18 FAIL lines as main 56f94d0 (diffed, none in wawu-id files). No em-dashes in strings.

## Findings
1. LOW. A lookup that times out returns the empty map, so the two existence checks read a stall as "not found": POST /chats {wawuId} for a real person with no Hub profile answers 404 "We could not find that account." at 3.01 s (healthy 200). Same code in event-running personById. src/chat/chat.service.ts:476-486, src/event-ticketing/event-running.service.ts:683-692. Same answer main gives when WAWU ID returns 500; the task text expected a clear answer for a timeout. Repro: stall mode no-headers, POST /chats. Follow-up: let these two callers ask for the typed timeout (503/502 "try again").
2. LOW. `redirect: 'error'` is new on all four calls (wawu-id-exchange.ts:172); main followed redirects. Not named in the SHARED-CHANGES row ("no healthy answer changes"). wawu-id has no redirect today; if a platform host ever redirects, lookups fall back to handles and writes answer 500 (TypeError). The Hub already does this for Nuvion, Fintava and the OTP sender.
3. LOW. No floor on the override: WAWU_ID_READ_TIMEOUT_MS=1 gives 1 ms, "0x10" gives 16 ms (wawu-id-exchange.ts:32-41).
4. LOW. One bound per lookup call, not per route: a healthy chat open makes 2 lookups, so a slow WAWU ID can cost up to 6 s.

Not this task: WawuIdAccountClient and the JWKS fetch (lead filed). Also unbounded in body only: data-export-mailer, nuvion-otp-sender and the email relay use AbortSignal.timeout (headers-only pattern FIX-01 found unreliable). contract specs such as privacy-settings hard-code the mock at 127.0.0.1:4001, so they fail on any other port (environment, CI uses 4001).

Cleanup: stack down, Hub and stand-in killed by PID, worktree removed, no listener on 7150-7157, database dropped.
