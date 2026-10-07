import { AppState } from 'react-native';

import { apiBaseUrl } from '@/api/env';
import { isApiError } from '@/api/errors';
import { getAccessToken, onSessionEnd, refreshAccessToken, signOut } from '@/api/session';

import { fetchCatchUp, type LiveCatchUp, type LiveEvent } from './api';

/**
 * The app's live connection: one WebSocket to `/api/hub/live` per signed-in phone, shared by the
 * inbox and every chat screen (wawu-backend `docs/contract/LIVE.md` is the protocol).
 *
 * What it does, in the order a connection lives:
 *  1. Opens the socket and sends the first frame `{ type: 'auth', token }`. The token is never in
 *     the URL, and a first frame works in the browser build too, where a WebSocket cannot set a header.
 *  2. On `ready` it asks `GET /live/catch-up` from the newest cursor it holds, again while `hasMore`
 *     is true, so a reconnect loses nothing. Socket first, catch-up second: no gap.
 *  3. Hands every event to its listeners. A message already seen (by id) is dropped; a read mark is
 *     state, so it is passed on every time.
 *  4. Pings every PING_EVERY_MS and drops a socket that does not answer, so a half-open phone
 *     connection is noticed.
 *  5. Reconnects after a close, by the code: see `onClose`. Waits are exponential with full jitter,
 *     never under MIN_WAIT_MS, so a server restart or a 429 on the upgrade (20 sockets per address
 *     not yet signed in) never becomes a tight loop. The wait resets only after a socket has stayed
 *     up for STABLE_AFTER_MS.
 *  6. Closes when the app goes to the background and reconnects (with a catch-up) when it returns.
 *
 * Anything that wants to react subscribes with `onLiveEvent`; anything that wants to know the feed
 * is whole again (a fresh connection after a catch-up) subscribes with `onLiveSynced`.
 */

/** Waits are technical settings, not product figures. */
export const LIVE_TIMING = {
  /** The first wait after a failure is drawn from MIN_WAIT_MS up to this. */
  baseMs: 1_000,
  /** No wait is longer than this. */
  capMs: 30_000,
  /** No wait is shorter than this, whatever the dice say. */
  minWaitMs: 500,
  /** A socket that stays open this long after `ready` counts as healthy and resets the wait. */
  stableAfterMs: 10_000,
  /** The server closes a socket that has not signed in within 5 s; we give up on `ready` after twice that. */
  readyWithinMs: 10_000,
  /** The server pings every 30 s itself; this is the app's own check that the path still carries bytes. */
  pingEveryMs: 25_000,
  pongWithinMs: 10_000,
  /** An access token this close to its end is refreshed before it is sent again. */
  expirySlackMs: 30_000,
} as const;

/** Close codes the Hub uses (LIVE.md section 2). */
export const LIVE_CLOSE = {
  normal: 1000,
  goingAway: 1001,
  /** No token in time, a bad token, or a token that ran out. */
  unauthenticated: 4401,
  /** The token's person is not the one the socket was opened for. */
  wrongPerson: 4403,
  /** Too slow reading what was sent. */
  tooSlow: 4408,
  /** A newer socket from the same person took this one's place. */
  replaced: 4409,
  /** The server lost its own feed. */
  feedDown: 4503,
  /** Ours: `ready` never came. */
  readyTimeout: 4000,
} as const;

const SEEN_LIMIT = 500;
const WS_OPEN = 1;

/** The part of a WebSocket the client uses: the browser's, React Native's and the tests' fake all have it. */
export type SocketLike = {
  readyState: number;
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: ((event: { code: number }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
};

export type LiveDeps = {
  url: string;
  openSocket: (url: string) => SocketLike;
  getToken: () => Promise<string | null>;
  /** Returns the token to use now, or null when the session is over. Rejects when it could not be tried (offline). */
  refreshToken: (rejected: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  catchUp: (cursor: string) => Promise<LiveCatchUp>;
  random: () => number;
  now: () => number;
};

export type LiveStatus = 'off' | 'connecting' | 'live' | 'waiting' | 'halted';

type Listener = (event: LiveEvent) => void;

/** The `exp` claim of an access token (a JWT), in ms, or null when it cannot be read. */
function expiryOf(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    const exp = typeof claims === 'object' && claims !== null ? (claims as Record<string, unknown>).exp : undefined;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** The key a message is counted by, so one that arrives twice (socket and catch-up) is handled once. Read marks have none. */
function seenKey(event: LiveEvent): string | null {
  if (event.type === 'chat.message') return `chat:${event.message.id}`;
  if (event.type === 'community.message') return `room:${event.message.id}`;
  return null;
}

export function liveUrl(base: string): string {
  return `${base.replace(/\/+$/, '').replace(/^http/i, 'ws')}/api/hub/live`;
}

export class LiveClient {
  private retained = 0;
  private foreground = true;
  private halted: 'replaced' | 'ended' | null = null;

  private socket: SocketLike | null = null;
  private socketToken: string | null = null;
  private generation = 0;
  private attempt = 0;
  private fourOhOnes = 0;
  private cursor: string | null = null;
  /** The cursor of the newest socket event that arrived while a catch-up was running. */
  private pendingCursor: string | null = null;
  private catchingUp = false;
  private seen = new Set<string>();
  private state: LiveStatus = 'off';

  private waitTimer: ReturnType<typeof setTimeout> | null = null;
  private readyTimer: ReturnType<typeof setTimeout> | null = null;
  private stableTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;

  private listeners = new Set<Listener>();
  private syncListeners = new Set<() => void>();

  constructor(private readonly deps: LiveDeps) {}

  get status(): LiveStatus {
    return this.state;
  }

  /** Someone needs the feed (the signed-in shell). Returns the release; the socket closes when the last one lets go. */
  retain(): () => void {
    this.retained += 1;
    if (this.retained === 1 && this.halted === 'ended') this.halted = null;
    this.evaluate();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.retained -= 1;
      this.evaluate();
    };
  }

  /** The app is in the foreground (true) or not (false). */
  setActive(active: boolean) {
    if (this.foreground === active) return;
    this.foreground = active;
    if (active) this.halted = this.halted === 'ended' ? 'ended' : null;
    this.evaluate();
  }

  onEvent(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Called each time a connection is up and its catch-up is done (and when the first one is up). */
  onSynced(listener: () => void): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /** The signed-in session ended: nothing held for that person is kept. */
  reset() {
    this.teardown();
    this.cursor = null;
    this.pendingCursor = null;
    this.catchingUp = false;
    this.seen.clear();
    this.attempt = 0;
    this.fourOhOnes = 0;
    this.halted = null;
    this.evaluate();
  }

  private get wanted(): boolean {
    return this.retained > 0 && this.foreground && this.halted === null;
  }

  private evaluate() {
    if (!this.wanted) {
      this.teardown();
      this.setState(this.halted ? 'halted' : 'off');
      return;
    }
    if (!this.socket && !this.waitTimer) void this.connect();
  }

  private setState(next: LiveStatus) {
    this.state = next;
  }

  private clearTimers() {
    if (this.waitTimer) clearTimeout(this.waitTimer);
    if (this.readyTimer) clearTimeout(this.readyTimer);
    if (this.stableTimer) clearTimeout(this.stableTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.waitTimer = this.readyTimer = this.stableTimer = this.pongTimer = null;
    this.pingTimer = null;
  }

  private detach(socket: SocketLike | null) {
    if (!socket) return;
    socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
    try {
      socket.close(LIVE_CLOSE.normal);
    } catch {
      // A socket that is already gone cannot be closed again.
    }
  }

  /** Stops everything this client has running. Whatever callbacks are still in flight see an older generation and do nothing. */
  private teardown() {
    this.generation += 1;
    this.clearTimers();
    this.detach(this.socket);
    this.socket = null;
    this.socketToken = null;
    this.catchingUp = false;
  }

  private async connect() {
    const generation = ++this.generation;
    this.setState('connecting');
    let token: string | null;
    try {
      token = await this.deps.getToken();
    } catch {
      token = null;
    }
    if (generation !== this.generation || !this.wanted) return;
    if (!token) {
      // Signed out: the shell lets go when the session ends, and a sign-in retains again.
      this.halted = 'ended';
      this.setState('halted');
      return;
    }
    let socket: SocketLike;
    try {
      socket = this.deps.openSocket(this.deps.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    this.socketToken = token;
    socket.onopen = () => {
      if (!this.current(socket, generation)) return;
      socket.send(JSON.stringify({ type: 'auth', token }));
      this.readyTimer = setTimeout(() => this.fail(socket, generation), LIVE_TIMING.readyWithinMs);
    };
    socket.onmessage = (event) => {
      if (this.current(socket, generation)) this.onMessage(socket, generation, event.data);
    };
    socket.onclose = (event) => {
      if (this.current(socket, generation)) void this.onClose(event.code);
    };
    socket.onerror = () => {
      // A failed socket always closes next; the close handler does the work.
    };
  }

  private current(socket: SocketLike, generation: number): boolean {
    return socket === this.socket && generation === this.generation;
  }

  /** A socket that stopped answering or never became ready: drop it and try again after a wait. */
  private fail(socket: SocketLike, generation: number) {
    if (!this.current(socket, generation)) return;
    this.teardown();
    this.scheduleReconnect();
  }

  private onMessage(socket: SocketLike, generation: number, data: unknown) {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    let frame: unknown;
    try {
      frame = JSON.parse(String(data));
    } catch {
      return;
    }
    if (typeof frame !== 'object' || frame === null) return;
    const type = (frame as { type?: unknown }).type;
    if (type === 'ready') {
      void this.onReady(socket, generation, (frame as { cursor?: unknown }).cursor);
    } else if (type === 'chat.message' || type === 'chat.read' || type === 'community.message') {
      const event = frame as LiveEvent;
      if (this.catchingUp) this.pendingCursor = event.cursor;
      else this.cursor = event.cursor;
      this.deliver(event);
    }
  }

  private deliver(event: LiveEvent) {
    const key = seenKey(event);
    if (key) {
      if (this.seen.has(key)) return;
      this.seen.add(key);
      if (this.seen.size > SEEN_LIMIT) this.seen.delete(this.seen.values().next().value as string);
    }
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // One listener's failure never stops the others or the connection.
      }
    });
  }

  private async onReady(socket: SocketLike, generation: number, readyCursor: unknown) {
    if (this.readyTimer) clearTimeout(this.readyTimer);
    this.readyTimer = null;
    this.fourOhOnes = 0;
    this.setState('live');
    this.stableTimer = setTimeout(() => {
      this.attempt = 0;
    }, LIVE_TIMING.stableAfterMs);
    this.pingTimer = setInterval(() => this.ping(socket, generation), LIVE_TIMING.pingEveryMs);

    const fresh = typeof readyCursor === 'string' ? readyCursor : null;
    if (this.cursor === null) {
      this.cursor = fresh;
    } else {
      this.catchingUp = true;
      this.pendingCursor = null;
      try {
        let from = this.cursor;
        for (;;) {
          const page = await this.deps.catchUp(from);
          if (!this.current(socket, generation)) return;
          page.events.forEach((event) => this.deliver(event));
          this.cursor = page.cursor;
          if (!page.hasMore) break;
          from = page.cursor;
        }
      } catch (error) {
        if (!this.current(socket, generation)) return;
        this.catchingUp = false;
        if (isApiError(error) && error.kind === 'validation') {
          // The server does not know this cursor: what was missed cannot be replayed, so start from now and let listeners refetch.
          this.cursor = fresh;
        } else {
          this.fail(socket, generation);
          return;
        }
      }
      this.catchingUp = false;
      if (this.pendingCursor) this.cursor = this.pendingCursor;
      this.pendingCursor = null;
    }
    if (!this.current(socket, generation)) return;
    this.syncListeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // See deliver.
      }
    });
  }

  private ping(socket: SocketLike, generation: number) {
    if (!this.current(socket, generation) || socket.readyState !== WS_OPEN || this.pongTimer) return;
    try {
      socket.send(JSON.stringify({ type: 'ping' }));
    } catch {
      this.fail(socket, generation);
      return;
    }
    this.pongTimer = setTimeout(() => this.fail(socket, generation), LIVE_TIMING.pongWithinMs);
  }

  /**
   * What each close means (LIVE.md section 2):
   *  1001 the server is restarting, 4408 we were too slow, 1006 and anything else: wait, reconnect.
   *  4503 the server's feed is down: wait at least a few steps, reconnect.
   *  4401 no token, a bad one or one that ran out: refresh it when it is out of date, reconnect.
   *  4409 a newer socket from this person replaced this one: do not fight it; the next return to the
   *       foreground connects again.
   *  4403 the token is another person's: stop and sign out.
   */
  private async onClose(code: number) {
    const token = this.socketToken;
    this.teardown();
    if (code === LIVE_CLOSE.wrongPerson) {
      this.halted = 'ended';
      this.setState('halted');
      await this.deps.signOut().catch(() => undefined);
      return;
    }
    if (code === LIVE_CLOSE.replaced) {
      this.halted = 'replaced';
      this.setState('halted');
      return;
    }
    if (code === LIVE_CLOSE.unauthenticated && token) {
      this.fourOhOnes += 1;
      const outOfDate = (expiryOf(token) ?? 0) - this.deps.now() < LIVE_TIMING.expirySlackMs;
      if (outOfDate || this.fourOhOnes >= 2) {
        try {
          const fresh = await this.deps.refreshToken(token);
          if (!fresh) {
            this.halted = 'ended';
            this.setState('halted');
            return;
          }
        } catch {
          // Offline: the wait below tries again with the same tokens.
        }
        if (!this.wanted) return;
      }
    }
    this.scheduleReconnect(code === LIVE_CLOSE.feedDown ? 2 : 0);
  }

  /** Exponential with full jitter, floored so it never spins. */
  waitFor(attempt: number): number {
    const ceiling = Math.min(LIVE_TIMING.capMs, LIVE_TIMING.baseMs * 2 ** attempt);
    return Math.round(LIVE_TIMING.minWaitMs + this.deps.random() * Math.max(0, ceiling - LIVE_TIMING.minWaitMs));
  }

  private scheduleReconnect(atLeast = 0) {
    if (!this.wanted || this.waitTimer) return;
    this.attempt = Math.max(this.attempt, atLeast);
    const wait = this.waitFor(this.attempt);
    this.attempt += 1;
    this.setState('waiting');
    this.waitTimer = setTimeout(() => {
      this.waitTimer = null;
      this.evaluate();
    }, wait);
  }
}

let shared: LiveClient | null = null;

/** The app's one connection. It starts nothing until something retains it. */
export function liveClient(): LiveClient {
  if (!shared) {
    const client = new LiveClient({
      url: liveUrl(apiBaseUrl),
      openSocket: (url) => new WebSocket(url) as unknown as SocketLike,
      getToken: getAccessToken,
      refreshToken: refreshAccessToken,
      signOut,
      catchUp: fetchCatchUp,
      random: Math.random,
      now: Date.now,
    });
    // Only 'background' closes the socket: iOS passes through 'inactive' (a call, the app switcher) on its way there or back.
    client.setActive(AppState.currentState !== 'background');
    AppState.addEventListener('change', (next) => client.setActive(next !== 'background'));
    onSessionEnd(() => client.reset());
    shared = client;
  }
  return shared;
}

/** Keeps the connection up while the caller needs it. Returns the release. */
export function retainLive(): () => void {
  return liveClient().retain();
}

/** Every chat and room event, as it arrives or is caught up. Returns the unsubscribe. */
export function onLiveEvent(listener: Listener): () => void {
  return liveClient().onEvent(listener);
}

/** The connection is up and caught up: whatever a listener holds may have missed something and should be read again. */
export function onLiveSynced(listener: () => void): () => void {
  return liveClient().onSynced(listener);
}
