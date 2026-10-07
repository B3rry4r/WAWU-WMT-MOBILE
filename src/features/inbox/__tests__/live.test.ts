import { ApiError } from '@/api/errors';

import type { LiveCatchUp, LiveEvent } from '../api';
import { LIVE_CLOSE, LIVE_TIMING, LiveClient, liveUrl, type LiveDeps, type SocketLike } from '../live';

/*
 * FakeSocket is a test double of the transport only (the WebSocket the phone opens). Everything the
 * client decides (what to send, when to reconnect, how to catch up) is the real LiveClient's. The
 * real socket against the real backend is covered by the V9 run, not here.
 */
class FakeSocket implements SocketLike {
  static all: FakeSocket[] = [];
  readyState = 0;
  sent: unknown[] = [];
  closedWith: number | null = null;
  onopen: SocketLike['onopen'] = null;
  onmessage: SocketLike['onmessage'] = null;
  onclose: SocketLike['onclose'] = null;
  onerror: SocketLike['onerror'] = null;
  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close(code = 1000) {
    this.closedWith = code;
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.({});
  }
  say(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }
  drop(code: number) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt = (expiresInSeconds: number) => `${b64({ alg: 'none' })}.${b64({ sub: 'me', exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.sig`;

const message = (id: string, cursor: string): LiveEvent =>
  ({ type: 'chat.message', cursor, message: { id, chatId: 'c1', senderWawuId: 'u2', mine: false, kind: 'text', text: id, attachment: null, clientMessageId: null, createdAt: '2026-10-07T10:00:00Z', readState: null } }) as LiveEvent;
const roomMessage = (id: string, cursor: string): LiveEvent =>
  ({ type: 'community.message', cursor, communityId: 'r1', message: { id } }) as unknown as LiveEvent;
const readMark = (cursor: string): LiveEvent =>
  ({ type: 'chat.read', cursor, chatId: 'c1', readerWawuId: 'u2', mine: false, lastReadAt: null, lastReadMessageId: null }) as LiveEvent;

let token: string | null;
let random: number;
let catchUp: jest.Mock<Promise<LiveCatchUp>, [string]>;
let refreshToken: jest.Mock<Promise<string | null>, [string]>;
let signOut: jest.Mock<Promise<void>, []>;

function make(over: Partial<LiveDeps> = {}) {
  const client = new LiveClient({
    url: 'wss://hub.test/api/hub/live',
    openSocket: (url) => new FakeSocket(url),
    getToken: async () => token,
    refreshToken,
    signOut,
    catchUp,
    random: () => random,
    now: () => Date.now(),
    ...over,
  });
  const events: LiveEvent[] = [];
  const synced = jest.fn();
  client.onEvent((event) => events.push(event));
  client.onSynced(synced);
  return { client, events, synced };
}

const last = () => FakeSocket.all[FakeSocket.all.length - 1] as FakeSocket;
const flush = async () => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
};
/** Lets the client open its socket, and the socket sign in and become ready. */
async function connectAndReady(cursor = 'c0') {
  await flush();
  last().open();
  last().say({ type: 'ready', wawuId: 'me', cursor });
  await flush();
}
const advance = async (ms: number) => {
  await jest.advanceTimersByTimeAsync(ms);
  await flush();
};

beforeEach(() => {
  jest.useFakeTimers();
  FakeSocket.all = [];
  token = jwt(3600);
  random = 0;
  catchUp = jest.fn(async (cursor: string) => ({ events: [], cursor, hasMore: false }));
  refreshToken = jest.fn(async (_rejected: string): Promise<string | null> => jwt(3600));
  signOut = jest.fn(async (): Promise<void> => undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the live connection', () => {
  it('opens /api/hub/live with the token in the first frame and never in the address', async () => {
    const { client } = make();
    client.retain();
    await flush();
    expect(last().url).toBe('wss://hub.test/api/hub/live');
    expect(last().url).not.toContain(String(token));
    last().open();
    expect(last().sent).toEqual([{ type: 'auth', token }]);
    expect(liveUrl('https://api.example.com/')).toBe('wss://api.example.com/api/hub/live');
    expect(liveUrl('http://10.0.2.2:3001')).toBe('ws://10.0.2.2:3001/api/hub/live');
  });

  it('does not open a socket until something needs it, and closes it when nothing does', async () => {
    const { client } = make();
    await flush();
    expect(FakeSocket.all).toHaveLength(0);
    const release = client.retain();
    await connectAndReady();
    expect(client.status).toBe('live');
    release();
    expect(last().closedWith).toBe(1000);
    expect(client.status).toBe('off');
  });

  it('does not connect when nobody is signed in', async () => {
    token = null;
    const { client } = make();
    client.retain();
    await flush();
    expect(FakeSocket.all).toHaveLength(0);
    expect(client.status).toBe('halted');
  });

  it('a user sees a new message the moment it arrives, and a repeat of it is dropped', async () => {
    const { client, events } = make();
    client.retain();
    await connectAndReady();
    last().say(message('m1', 'c1'));
    last().say(message('m1', 'c1'));
    last().say(roomMessage('m1', 'c2'));
    last().say(readMark('c3'));
    last().say(readMark('c3'));
    expect(events.map((e) => e.type)).toEqual(['chat.message', 'community.message', 'chat.read', 'chat.read']);
  });

  it('answers the server only with auth and ping, and drops a socket that stops answering ping', async () => {
    const { client } = make();
    client.retain();
    await connectAndReady();
    const first = last();
    await advance(LIVE_TIMING.pingEveryMs);
    expect(first.sent).toEqual([expect.objectContaining({ type: 'auth' }), { type: 'ping' }]);
    first.say({ type: 'pong' });
    await advance(LIVE_TIMING.pongWithinMs + 1);
    expect(client.status).toBe('live');
    await advance(LIVE_TIMING.pingEveryMs - LIVE_TIMING.pongWithinMs - 1);
    expect(first.sent.filter((frame) => (frame as { type: string }).type === 'ping')).toHaveLength(2);
    await advance(LIVE_TIMING.pongWithinMs);
    expect(first.closedWith).toBe(1000);
    await advance(LIVE_TIMING.baseMs * 4);
    expect(FakeSocket.all.length).toBeGreaterThan(1);
  });

  it('gives up on a socket that never says ready and tries again', async () => {
    const { client } = make();
    client.retain();
    await flush();
    last().open();
    await advance(LIVE_TIMING.readyWithinMs);
    expect(FakeSocket.all[0]?.closedWith).toBe(1000);
    await advance(LIVE_TIMING.baseMs * 2);
    expect(FakeSocket.all).toHaveLength(2);
  });
});

describe('reconnecting', () => {
  it('waits between tries, longer each time and never zero, even when the dice say zero', async () => {
    random = 0;
    const { client } = make();
    client.retain();
    await flush();
    const waits: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const before = FakeSocket.all.length;
      last().drop(1006);
      let waited = 0;
      while (FakeSocket.all.length === before && waited < 60_000) {
        await advance(100);
        waited += 100;
      }
      waits.push(waited);
    }
    expect(waits.every((w) => w >= LIVE_TIMING.minWaitMs)).toBe(true);
    expect(client.waitFor(0)).toBe(LIVE_TIMING.minWaitMs);
  });

  it('doubles the ceiling each failure up to the cap, with the whole range used by the jitter', () => {
    const { client } = make();
    random = 1;
    expect([0, 1, 2, 3, 4, 5, 6, 7, 20].map((n) => client.waitFor(n))).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000, 30000]);
    random = 0.5;
    expect(client.waitFor(3)).toBe(Math.round(LIVE_TIMING.minWaitMs + 0.5 * (8000 - LIVE_TIMING.minWaitMs)));
  });

  it('keeps backing off while the server accepts and drops it straight away, and only resets after a stable connection', async () => {
    random = 1;
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(4503);
    // 4503 starts at least two steps up: 4 s ceiling.
    await advance(3_999);
    expect(FakeSocket.all).toHaveLength(1);
    await advance(2);
    expect(FakeSocket.all).toHaveLength(2);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'c0' });
    await flush();
    last().drop(1001);
    // The connection did not stay up long enough to count, so the wait keeps growing (8 s).
    await advance(7_999);
    expect(FakeSocket.all).toHaveLength(2);
    await advance(2);
    expect(FakeSocket.all).toHaveLength(3);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'c0' });
    await advance(LIVE_TIMING.stableAfterMs);
    last().drop(1001);
    await advance(1_001);
    expect(FakeSocket.all).toHaveLength(4);
  });

  it.each([
    ['1001 the server is restarting', 1001],
    ['4408 too slow', 4408],
    ['4503 the feed is down', 4503],
    ['1006 the connection broke', 1006],
  ])('reconnects after %s', async (_name, code) => {
    random = 1;
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(code);
    await advance(LIVE_TIMING.capMs);
    expect(FakeSocket.all).toHaveLength(2);
  });

  it('after 4401 on a token that has run out it refreshes the session and reconnects with the new token', async () => {
    token = jwt(-5);
    const fresh = jwt(3600);
    refreshToken.mockResolvedValue(fresh);
    const { client } = make();
    client.retain();
    await connectAndReady();
    const old = token;
    token = fresh;
    last().drop(LIVE_CLOSE.unauthenticated);
    await flush();
    expect(refreshToken).toHaveBeenCalledWith(old);
    await advance(LIVE_TIMING.baseMs * 2);
    last().open();
    expect(last().sent).toEqual([{ type: 'auth', token: fresh }]);
  });

  it('after 4401 on a token that is still good it does not spend a refresh the first time, and does the second', async () => {
    random = 1;
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(4401);
    await advance(2_000);
    expect(refreshToken).not.toHaveBeenCalled();
    expect(FakeSocket.all).toHaveLength(2);
    last().open();
    last().drop(4401);
    await flush();
    expect(refreshToken).toHaveBeenCalledTimes(1);
  });

  it('stops when the refresh is refused: the session is over', async () => {
    token = jwt(-5);
    refreshToken.mockResolvedValue(null);
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(4401);
    await advance(60_000);
    expect(FakeSocket.all).toHaveLength(1);
    expect(client.status).toBe('halted');
  });

  it('keeps trying when the refresh cannot be reached (offline)', async () => {
    token = jwt(-5);
    refreshToken.mockRejectedValue(new ApiError('network', 0, 'No connection.'));
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(4401);
    await advance(LIVE_TIMING.capMs);
    expect(FakeSocket.all.length).toBeGreaterThan(1);
  });

  it('on 4403 (a token that is another person) stops and signs out', async () => {
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(4403);
    await advance(60_000);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(FakeSocket.all).toHaveLength(1);
  });

  it('on 4409 does not fight the newer socket, and tries again when the app comes back to the foreground', async () => {
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(4409);
    await advance(120_000);
    expect(FakeSocket.all).toHaveLength(1);
    client.setActive(false);
    client.setActive(true);
    await flush();
    expect(FakeSocket.all).toHaveLength(2);
  });
});

describe('catching up', () => {
  it('after a reconnect asks from the newest cursor, page after page until hasMore is false, and hands over what it finds once', async () => {
    random = 1;
    const { client, events, synced } = make();
    client.retain();
    await connectAndReady('ready0');
    expect(catchUp).not.toHaveBeenCalled();
    last().say(message('m1', 'live1'));
    last().drop(1006);
    catchUp
      .mockResolvedValueOnce({ events: [message('m1', 'p1'), message('m2', 'p1')], cursor: 'page1', hasMore: true })
      .mockResolvedValueOnce({ events: [roomMessage('r1', 'p2'), readMark('p2')], cursor: 'page2', hasMore: true })
      .mockResolvedValueOnce({ events: [message('m3', 'p3')], cursor: 'page3', hasMore: false });
    await advance(LIVE_TIMING.capMs);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'ready1' });
    await flush();
    await flush();
    expect(catchUp.mock.calls.map((c) => c[0])).toEqual(['live1', 'page1', 'page2']);
    expect(events.map((e) => (e.type === 'chat.read' ? 'read' : e.message.id))).toEqual(['m1', 'm2', 'r1', 'read', 'm3']);
    expect(synced).toHaveBeenCalledTimes(2);

    // The next reconnect starts from where this catch-up ended.
    last().drop(1006);
    await advance(LIVE_TIMING.capMs);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'ready2' });
    await flush();
    expect(catchUp.mock.calls[3]?.[0]).toBe('page3');
  });

  it('keeps a socket event that arrived during the catch-up as the newest cursor', async () => {
    random = 1;
    const { client } = make();
    client.retain();
    await connectAndReady();
    last().drop(1006);
    let finish: (page: LiveCatchUp) => void = () => undefined;
    catchUp.mockImplementationOnce(() => new Promise<LiveCatchUp>((resolve) => (finish = resolve)));
    await advance(LIVE_TIMING.capMs);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'r' });
    await flush();
    last().say(message('m9', 'socket9'));
    finish({ events: [], cursor: 'older', hasMore: false });
    await flush();
    last().drop(1006);
    await advance(LIVE_TIMING.capMs);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'r2' });
    await flush();
    expect(catchUp.mock.calls[1]?.[0]).toBe('socket9');
  });

  it('when the server refuses the cursor (400) it starts from now and still tells listeners to read again', async () => {
    random = 1;
    const { client, synced } = make();
    client.retain();
    await connectAndReady();
    last().drop(1006);
    catchUp.mockRejectedValueOnce(new ApiError('validation', 400, 'Bad cursor'));
    await advance(LIVE_TIMING.capMs);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'fresh' });
    await flush();
    expect(synced).toHaveBeenCalledTimes(2);
    expect(client.status).toBe('live');
    last().drop(1006);
    await advance(LIVE_TIMING.capMs);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'x' });
    await flush();
    expect(catchUp.mock.calls[1]?.[0]).toBe('fresh');
  });

  it('when the catch-up itself fails it drops the socket and tries the whole connection again from the same cursor', async () => {
    random = 1;
    const { client, synced } = make();
    client.retain();
    await connectAndReady('c0');
    last().drop(1006);
    catchUp.mockRejectedValueOnce(new ApiError('server', 500, 'Boom'));
    await advance(LIVE_TIMING.capMs);
    const failing = last();
    failing.open();
    failing.say({ type: 'ready', wawuId: 'me', cursor: 'r' });
    await flush();
    expect(failing.closedWith).toBe(1000);
    expect(synced).toHaveBeenCalledTimes(1);
    await advance(LIVE_TIMING.capMs);
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'r' });
    await flush();
    expect(catchUp.mock.calls.map((c) => c[0])).toEqual(['c0', 'c0']);
    expect(synced).toHaveBeenCalledTimes(2);
  });
});

describe('the app in the background', () => {
  it('closes the socket when the app goes to the background and reconnects, with a catch-up, when it comes back', async () => {
    const { client } = make();
    client.retain();
    await connectAndReady('c0');
    const first = last();
    client.setActive(false);
    expect(first.closedWith).toBe(1000);
    await advance(120_000);
    expect(FakeSocket.all).toHaveLength(1);
    client.setActive(true);
    await flush();
    last().open();
    last().say({ type: 'ready', wawuId: 'me', cursor: 'c1' });
    await flush();
    expect(FakeSocket.all).toHaveLength(2);
    expect(catchUp).toHaveBeenCalledWith('c0');
  });

  it('forgets the cursor and everything seen when the session ends, so the next person starts clean', async () => {
    const { client, events } = make();
    client.retain();
    await connectAndReady('c0');
    last().say(message('m1', 'c1'));
    client.reset();
    await flush();
    last().open();
    last().say({ type: 'ready', wawuId: 'other', cursor: 'o0' });
    await flush();
    expect(catchUp).not.toHaveBeenCalled();
    last().say(message('m1', 'o1'));
    expect(events.filter((e) => e.type === 'chat.message')).toHaveLength(2);
  });
});
