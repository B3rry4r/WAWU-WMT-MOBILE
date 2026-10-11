/* eslint-disable @typescript-eslint/no-require-imports */
import { isEventId, readDoorResult } from '../doorApi';

const totals = { sold: 3, checkedIn: 1, stillToArrive: 2, remaining: 47 };
const ticket = { code: 'K7QX-4M2P-9WVA-3RTE', tierName: 'Regular', holderName: 'Chidi Umeh', checkedInAt: '2026-10-10T08:52:00.000Z', checkedInBy: { role: 'host', label: null } };
const body = (data: unknown) => ({ statusCode: 201, message: 'Created', data });

describe('reading the door answer', () => {
  it('takes a complete answer of each kind', () => {
    expect(readDoorResult(body({ outcome: 'valid', ticket, totals }))).toMatchObject({ outcome: 'valid' });
    expect(readDoorResult(body({ outcome: 'already_used', ticket, totals }))).toMatchObject({ outcome: 'already_used' });
    expect(readDoorResult(body({ outcome: 'invalid', ticket: null, totals }))).toMatchObject({ outcome: 'invalid' });
  });

  it('refuses an answer that is not whole: no verdict is drawn from it', () => {
    expect(readDoorResult(null)).toBeNull();
    expect(readDoorResult(body(null))).toBeNull();
    expect(readDoorResult(body({ outcome: 'maybe', ticket: null, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket: null, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'invalid', ticket, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'already_used', ticket: { ...ticket, checkedInAt: null }, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket, totals: { ...totals, checkedIn: 'x' } }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket, totals: { ...totals, stillToArrive: -1 } }))).toBeNull();
  });
});

describe('an event id in a link', () => {
  it('is a uuid, and nothing else is sent to the Hub', () => {
    expect(isEventId('e5000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isEventId('door')).toBe(false);
    expect(isEventId('')).toBe(false);
    expect(isEventId('e5000000-0000-4000-8000-000000000001/../x')).toBe(false);
  });
});

describe('the door call', () => {
  const EVENT = 'e5000000-0000-4000-8000-000000000001';
  type Api = typeof import('../doorApi');
  type Errors = typeof import('@/api/errors');
  /** The client takes `fetch` when it is made, so the stand-in is set before the modules are loaded. */
  function load(fetchImpl: typeof fetch): { api: Api; errors: Errors } {
    globalThis.fetch = fetchImpl;
    jest.resetModules();
    return { api: require('../doorApi') as Api, errors: require('@/api/errors') as Errors };
  }
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    jest.useRealTimers();
  });

  it('sends the scan\'s key as Idempotency-Key and the text as the code', async () => {
    const sent: Request[] = [];
    const { api } = load((async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      sent.push(request.clone());
      return new Response(JSON.stringify(body({ outcome: 'valid', ticket, totals })), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch);
    const result = await api.checkInAtDoor(EVENT, { code: 'K7QX-4M2P-9WVA-3RTE', key: 'scan-key-0001' });
    expect(result.outcome).toBe('valid');
    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe('POST');
    expect(new URL(sent[0].url).pathname).toBe(`/api/hub/events/${EVENT}/door/check-in`);
    expect(sent[0].headers.get('idempotency-key')).toBe('scan-key-0001');
    expect(await sent[0].json()).toEqual({ code: 'K7QX-4M2P-9WVA-3RTE' });
  });

  it('gives up on a request nobody answers after the time it is given, as a lost connection', async () => {
    jest.useFakeTimers();
    const { api, errors } = load((async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      return new Promise<Response>((_resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    }) as typeof fetch);
    let settled: unknown = 'waiting';
    void api.checkInAtDoor(EVENT, { code: 'K7QX-4M2P-9WVA-3RTE', key: 'scan-key-0001' }, 250).then(
      () => {
        settled = 'answered';
      },
      (error: unknown) => {
        settled = error;
      },
    );
    await jest.advanceTimersByTimeAsync(249);
    expect(settled).toBe('waiting');
    await jest.advanceTimersByTimeAsync(1);
    expect(settled).toBeInstanceOf(errors.ApiError);
    expect((settled as InstanceType<Errors['ApiError']>).kind).toBe('network');
  });

  it('does not give up on an answer that arrives in time', async () => {
    jest.useFakeTimers();
    const { api } = load((async () => new Response(JSON.stringify(body({ outcome: 'valid', ticket, totals })), { status: 201, headers: { 'content-type': 'application/json' } })) as typeof fetch);
    await expect(api.checkInAtDoor(EVENT, { code: 'K7QX-4M2P-9WVA-3RTE', key: 'scan-key-0001' }, 250)).resolves.toMatchObject({ outcome: 'valid' });
    await jest.advanceTimersByTimeAsync(1000);
  });
});
