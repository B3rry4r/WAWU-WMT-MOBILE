/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Linking, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { lightColors } from '@/theme/tokens.generated';

import type { DoorResult } from '../doorApi';
import { ANSWER_WAIT_MS, RESULT_HOLD_MS, SAME_CODE_QUIET_MS } from '../doorConfig';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));

type Permission = { granted: boolean; status: 'granted' | 'denied' | 'undetermined'; canAskAgain: boolean };
const mockCamera: { props: Record<string, unknown> | null; permission: Permission | null; request: jest.Mock; read: jest.Mock } = {
  props: null,
  permission: null,
  request: jest.fn(),
  read: jest.fn(),
};
jest.mock('expo-camera', () => {
  const { createElement } = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    CameraView: (props: Record<string, unknown>) => {
      mockCamera.props = props;
      return createElement(View, { testID: props.testID as string });
    },
    useCameraPermissions: () => [mockCamera.permission, mockCamera.request, mockCamera.read],
  };
});

/** `lost`: the Hub made the check and the answer never came back (the request was sent, the connection dropped). */
type Reply = { status?: number; body?: unknown; offline?: true; lost?: true; hold?: true; later?: true };
type Call = { method: string; path: string; body: { code?: string }; key: string | null };

const EVENT = 'e9000000-0000-4000-8000-000000000001';
const SENT_CODE = '7KQX-4M2P-9WVA-3RTE';
const OTHER_CODE = 'ZZZZ-ZZZZ-ZZZZ-ZZZZ';

let answers: Reply[] = [];
let calls: Call[] = [];
/** Answers the request that was sent with `later: true`. */
let release: (() => void) | null = null;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const text = await request.clone().text();
  calls.push({
    method: request.method,
    path: new URL(request.url).pathname.replace(/^\/api\/hub/, ''),
    body: text ? (JSON.parse(text) as { code?: string }) : {},
    key: request.headers.get('idempotency-key'),
  });
  const reply = answers.shift();
  if (!reply) throw new Error(`no answer for ${request.method} ${request.url}`);
  // A request nobody answers ends when the app gives up on it, as a real fetch does.
  if (reply.hold) {
    return new Promise<Response>((_resolve, reject) => {
      request.signal.addEventListener('abort', () => reject(new DOMException('The operation was aborted.', 'AbortError')));
    });
  }
  if (reply.later) {
    return new Promise<Response>((resolve) => {
      release = () => resolve(new Response(JSON.stringify(reply.body), { status: reply.status ?? 201, headers: { 'content-type': 'application/json' } }));
    });
  }
  if (reply.offline || reply.lost) throw new TypeError('Network request failed');
  return new Response(JSON.stringify(reply.body), { status: reply.status ?? 201, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: DoorResult): Reply => ({ status: 201, body: { statusCode: 201, message: 'Created', data } });
const fail = (status: number, message: string): Reply => ({ status, body: { statusCode: status, message, data: null } });

/** A moment on this phone's own clock, so the expected "09:52" holds in any time zone. */
const localIso = (h: number, m: number) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0).toISOString();
};
const totals = { sold: 64, checkedIn: 23, stillToArrive: 41, remaining: 56 };
const ticket = (over: Partial<NonNullable<DoorResult['ticket']>> = {}): NonNullable<DoorResult['ticket']> => ({
  code: SENT_CODE,
  tierName: 'Regular',
  holderName: 'Lennox Emmanuel',
  checkedInAt: localIso(9, 52),
  checkedInBy: { role: 'door_staff', label: 'Door 1' },
  ...over,
});
const letIn = ok({ outcome: 'valid', ticket: ticket(), totals });
const used = ok({ outcome: 'already_used', ticket: ticket(), totals });
const notValid = ok({ outcome: 'invalid', ticket: null, totals });

const clients: QueryClient[] = [];

async function boot(props: { eventId?: string; onClose?: () => void } = {}) {
  const { DoorScreen } = require('../DoorScreen') as typeof import('../DoorScreen');
  const onClose = props.onClose ?? jest.fn();
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity, retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <DoorScreen eventId={props.eventId ?? EVENT} onClose={onClose} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { onClose };
}

/** The camera reports a QR it sees; the phone reports it again every few hundred milliseconds while it stays in view. */
async function see(data: string) {
  const onScanned = mockCamera.props?.onBarcodeScanned as ((r: { type: string; data: string }) => void) | undefined;
  if (!onScanned) throw new Error('the camera is not scanning');
  await rtl.act(async () => {
    onScanned({ type: 'qr', data });
  });
}

const wait = (ms: number) =>
  rtl.act(async () => {
    jest.advanceTimersByTime(ms);
  });

/** What the person at the door does: opens the sheet, types a code, presses Check ticket. */
const typeCode = async (code: string) => {
  await rtl.fireEvent.press(rtl.screen.getByText('Type the code instead'));
  await rtl.fireEvent.changeText(await rtl.screen.findByTestId('door-code-input'), code);
  await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
};

/**
 * A check on its way with the typing sheet open. The button is not offered during a check (round 3), so the one
 * way to have both is a frame the camera had already reported when the sheet opened, reaching the screen after it.
 */
const checkUnderOpenSheet = async (data: string) => {
  const reported = mockCamera.props?.onBarcodeScanned as (r: { type: string; data: string }) => void;
  await rtl.fireEvent.press(rtl.screen.getByText('Type the code instead'));
  await rtl.screen.findByTestId('door-code-input');
  await rtl.act(async () => {
    reported({ type: 'qr', data });
  });
};

/** A check whose answer is held until `release()`. */
const later = (data: DoorResult): Reply => ({ later: true, status: 201, body: { statusCode: 201, message: 'Created', data } });

const noDashes = () => expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/—|Flutterwave/);

// The first load of the screen compiles every component under it; on a cold cache that outlasts a test's own limit.
beforeAll(() => {
  require('../DoorScreen');
}, 120_000);

beforeEach(() => {
  jest.useFakeTimers();
  answers = [];
  calls = [];
  release = null;
  mockCamera.props = null;
  mockCamera.permission = { granted: true, status: 'granted', canAskAgain: true };
  mockCamera.request.mockReset().mockResolvedValue(undefined);
  mockCamera.read.mockReset();
});

afterEach(async () => {
  await rtl.act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  clients.splice(0).forEach((c) => c.clear());
  jest.restoreAllMocks();
});

describe('E19 · At the door', () => {
  it('a user can scan a QR: the camera looks for QR codes, and the ticket is checked at this event', async () => {
    answers = [letIn];
    await boot();
    expect(rtl.screen.getByText('At the door')).toBeTruthy();
    expect(rtl.screen.getByText('Point at the ticket QR')).toBeTruthy();
    expect(mockCamera.props).toMatchObject({ facing: 'back', barcodeScannerSettings: { barcodeTypes: ['qr'] } });
    await see(` ${SENT_CODE} `);
    expect(calls).toEqual([{ method: 'POST', path: `/events/${EVENT}/door/check-in`, body: { code: SENT_CODE }, key: expect.stringMatching(/^[0-9a-f-]{36}$/) }]);
    expect(await rtl.screen.findByTestId('door-result')).toBeTruthy();
    noDashes();
  });

  it('a user can type the code instead: the field writes it as the ticket prints it, and the Hub gets that', async () => {
    answers = [letIn];
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByText('Type the code instead'));
    const input = await rtl.screen.findByTestId('door-code-input');
    expect(rtl.screen.getByText('Check ticket')).toBeTruthy();
    expect(rtl.screen.getByTestId('door-code-check').props.accessibilityState.disabled).toBe(true);
    await rtl.fireEvent.changeText(input, '7kqx 4m2p-9wva3rte');
    expect(rtl.screen.getByTestId('door-code-input').props.value).toBe(SENT_CODE);
    expect(rtl.screen.getByTestId('door-code-check').props.accessibilityState.disabled).toBe(false);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE]);
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    // The sheet is gone and the field is empty for the next one.
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
  });

  it('a typed code that is too short is not sent', async () => {
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByText('Type the code instead'));
    await rtl.fireEvent.changeText(await rtl.screen.findByTestId('door-code-input'), '7kq');
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
    expect(calls).toEqual([]);
  });

  it('the X leaves the door', async () => {
    const { onClose } = await boot();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('E20 · Let them in', () => {
  it('door staff a host added scan a valid ticket and see the tier, the holder\'s name and who is in the room', async () => {
    answers = [letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(rtl.screen.getByText('Regular · Lennox Emmanuel')).toBeTruthy();
    expect(rtl.screen.getByText('In the room 23')).toBeTruthy();
    expect(rtl.screen.getByText('Still to arrive 41')).toBeTruthy();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('door-result').props.style).backgroundColor).toBe(lightColors.positive);
    expect(rtl.screen.getByText('Point at the ticket QR')).toBeTruthy();
    noDashes();
  });

  it('a ticket with no name to give shows its tier alone', async () => {
    answers = [ok({ outcome: 'valid', ticket: ticket({ holderName: null }), totals })];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByTestId('door-result-line')).toHaveTextContent('Regular');
  });

  it('a result clears by itself after 3 seconds exactly (the value, not the constant), and the next ticket is read', async () => {
    expect(RESULT_HOLD_MS).toBe(3000);
    answers = [letIn, letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByTestId('door-result')).toBeTruthy();
    await wait(2999);
    expect(rtl.screen.getByTestId('door-result')).toBeTruthy();
    await wait(1);
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
    await see(OTHER_CODE);
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
  });

  it('a tap on the result clears it at once', async () => {
    answers = [letIn];
    await boot();
    await see(SENT_CODE);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
  });
});

describe('E23 · Already used', () => {
  it('the same ticket scanned twice shows Already used with the time and the door', async () => {
    answers = [letIn, used];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    await wait(RESULT_HOLD_MS);
    // The ticket leaves the camera's view, then comes back.
    await wait(SAME_CODE_QUIET_MS);
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('ALREADY USED')).toBeTruthy();
    expect(rtl.screen.getByText('Checked in at 09:52 by Door 1')).toBeTruthy();
    expect(rtl.screen.getByText('In the room 23')).toBeTruthy();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('door-result').props.style).backgroundColor).toBe(lightColors.warning);
    expect(calls).toHaveLength(2);
    noDashes();
  });

  it('a ticket the organiser let in themselves says so', async () => {
    answers = [ok({ outcome: 'already_used', ticket: ticket({ checkedInBy: { role: 'host', label: null } }), totals })];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('Checked in at 09:52 by the organiser')).toBeTruthy();
  });
});

describe('E24 · Not a valid ticket', () => {
  it('a ticket for another event shows Not a valid ticket, with the event\'s own counts', async () => {
    answers = [notValid];
    await boot();
    await see(OTHER_CODE);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
    expect(rtl.screen.getByText("This code isn't for this event")).toBeTruthy();
    expect(rtl.screen.getByText('In the room 23')).toBeTruthy();
    expect(rtl.screen.getByText('Still to arrive 41')).toBeTruthy();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('door-result').props.style).backgroundColor).toBe(lightColors.danger);
    noDashes();
  });

  it('a QR that is not a ticket at all (a link) is sent whole and answered Not a valid ticket, never an error', async () => {
    const link = `https://example.com/${'menu/'.repeat(24)}`;
    answers = [notValid];
    await boot();
    await see(link);
    expect(calls.map((c) => c.body.code)).toEqual([link]);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-problem')).toBeNull();
  });

  it('a QR the Hub would not take (3 characters, 501 characters) is answered NOT A VALID TICKET at once and never sent, with no count drawn', async () => {
    await boot();
    await see('42');
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
    expect(rtl.screen.getByText("This code isn't for this event")).toBeTruthy();
    expect(rtl.screen.queryByText(/In the room/)).toBeNull();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('door-result').props.style).backgroundColor).toBe(lightColors.danger);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-result'));
    await see('a'.repeat(501));
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-problem')).toBeNull();
    expect(rtl.screen.queryByText(/must be shorter|validation|characters/i)).toBeNull();
    expect(calls).toEqual([]);
    noDashes();
  });

  it('the edges, by value: 3 characters and 501 are answered here, 4 and 500 are sent', async () => {
    answers = [notValid, notValid];
    await boot();
    await see('abc');
    expect(calls).toHaveLength(0);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    await see('b'.repeat(501));
    expect(calls).toHaveLength(0);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    await see('c'.repeat(500));
    expect(calls.map((c) => c.body.code?.length)).toEqual([500]);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    await see('abcd');
    expect(calls.map((c) => c.body.code?.length)).toEqual([500, 4]);
  });

  it('characters are counted as the Hub counts them: 300 emoji are 300 characters and are sent, 501 are not', async () => {
    answers = [notValid];
    await boot();
    await see('😀'.repeat(300));
    expect(calls).toHaveLength(1);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    await see('😀'.repeat(501));
    expect(calls).toHaveLength(1);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
    // Two emoji are 2 characters (4 UTF-16 units), which the Hub would refuse: answered here.
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-result'));
    await see('😀😀');
    expect(calls).toHaveLength(1);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
  });

  it('a ticket of this event that was voided because the event was called off reads "This ticket was cancelled"', async () => {
    answers = [ok({ outcome: 'invalid', reason: 'cancelled', ticket: null, totals })];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
    expect(rtl.screen.getByText('This ticket was cancelled')).toBeTruthy();
    expect(rtl.screen.queryByText("This code isn't for this event")).toBeNull();
    expect(rtl.screen.getByText('In the room 23')).toBeTruthy();
    noDashes();
  });
});

describe('one ticket is one scan', () => {
  it('a ticket held in front of the camera is sent once, even after its result has cleared', async () => {
    answers = [letIn];
    await boot();
    // The phone reports it every 300 ms for ten seconds.
    for (let t = 0; t < 10_000; t += 300) {
      await see(SENT_CODE);
      await wait(300);
    }
    expect(calls).toHaveLength(1);
    // It leaves the view, and a second ticket is read.
    answers = [notValid];
    await wait(SAME_CODE_QUIET_MS);
    await see(OTHER_CODE);
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
  });

  it('while a check is on its way nothing else is sent, and the screen says it is checking', async () => {
    answers = [{ hold: true }];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('Checking the ticket')).toBeTruthy();
    await see(OTHER_CODE);
    expect(calls).toHaveLength(1);
  });

  it('while a result is up another ticket is not read, and a tap clears it for the next one', async () => {
    answers = [letIn, notValid];
    await boot();
    await see(SENT_CODE);
    await see(OTHER_CODE);
    expect(calls).toHaveLength(1);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    await see(OTHER_CODE);
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
  });

  it('a reading with nothing in it is ignored', async () => {
    await boot();
    await see('   ');
    expect(calls).toEqual([]);
  });
});

describe('what is not a verdict', () => {
  it('offline: a ticket is neither let in nor turned away, and Try again sends the same code', async () => {
    answers = [{ offline: true }, letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    expect(rtl.screen.queryByText('NOT A VALID TICKET')).toBeNull();
    expect(rtl.screen.queryByText('LET THEM IN')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-retry'));
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, SENT_CODE]);
    expect(rtl.screen.queryByTestId('door-problem')).toBeNull();
    noDashes();
  });

  it('Cancel on a problem leaves the scanner ready', async () => {
    answers = [{ offline: true }, notValid];
    await boot();
    await see(SENT_CODE);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-problem-dismiss'));
    expect(rtl.screen.queryByTestId('door-problem')).toBeNull();
    await see(OTHER_CODE);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
  });

  it('too many scans at once (429) is a wait, never a verdict', async () => {
    answers = [fail(429, 'ThrottlerException: Too Many Requests'), letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('Too many scans at once')).toBeTruthy();
    expect(rtl.screen.getByText('Wait a moment, then try again. The ticket was not checked in.')).toBeTruthy();
    expect(rtl.screen.queryByText(/Throttler/)).toBeNull();
    expect(rtl.screen.queryByText('NOT A VALID TICKET')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-retry'));
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
  });

  it('a server error is not known to be a refusal: it says it could not confirm, and offers Try again', async () => {
    answers = [fail(500, 'Internal server error')];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    expect(rtl.screen.queryByText(/not checked in/i)).toBeNull();
    expect(rtl.screen.queryByText(/Internal server error/)).toBeNull();
    expect(rtl.screen.getByTestId('door-problem-retry')).toBeTruthy();
  });

  it('an answer that cannot be read is not drawn as a verdict, and the Hub may have made the check: could not confirm', async () => {
    answers = [{ status: 201, body: { statusCode: 201, message: 'Created', data: { outcome: 'valid', ticket: null } } }];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    expect(rtl.screen.queryByText('LET THEM IN')).toBeNull();
    expect(rtl.screen.getByTestId('door-problem-retry')).toBeTruthy();
  });

  it('a 400 from the Hub shows no validator sentence and offers no Try again that cannot work', async () => {
    answers = [fail(400, 'code must be shorter than or equal to 500 characters')];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByTestId('door-problem')).toBeTruthy();
    expect(rtl.screen.queryByText(/shorter than/)).toBeNull();
    expect(rtl.screen.queryByTestId('door-problem-retry')).toBeNull();
    expect(rtl.screen.getByText('This code could not be checked. The ticket was not checked in.')).toBeTruthy();
  });

  it('a person who is not the organiser or door staff is told so, with the Hub\'s sentence, and can only go back', async () => {
    answers = [fail(403, 'Only the organiser or their door staff can check tickets in.')];
    const { onClose } = await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("You can't check tickets in here")).toBeTruthy();
    expect(rtl.screen.getByText('Only the organiser or their door staff can check tickets in.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-problem-retry')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-back'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('an event the Hub does not know is not scanned at', async () => {
    answers = [fail(404, 'Event not found')];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We can't find this event")).toBeTruthy();
    expect(rtl.screen.getByTestId('door-problem-back')).toBeTruthy();
  });

  it('a link that is not an event id never reaches the Hub, and the camera is not opened', async () => {
    const { onClose } = await boot({ eventId: 'door' });
    expect(rtl.screen.getByText("We can't find this event")).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-camera')).toBeNull();
    // Nothing to type a code into: no button that does nothing is drawn (R-47).
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-back'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([]);
  });
});

describe('one scan, one key (a lost answer never says "not checked in")', () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('every scan carries a key, and two scans carry two', async () => {
    answers = [letIn, letIn];
    await boot();
    await see(SENT_CODE);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    await see(OTHER_CODE);
    expect(calls).toHaveLength(2);
    expect(calls[0].key).toMatch(UUID);
    expect(calls[1].key).toMatch(UUID);
    expect(calls[0].key).not.toBe(calls[1].key);
  });

  it('a typed code carries a key too', async () => {
    answers = [letIn];
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByText('Type the code instead'));
    await rtl.fireEvent.changeText(await rtl.screen.findByTestId('door-code-input'), SENT_CODE);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(calls[0].key).toMatch(UUID);
  });

  it('the verifier\'s case: the Hub checked the ticket in and the answer was lost; the screen does not say it was not checked in, and Try again, with the same key, shows LET THEM IN with the holder\'s name', async () => {
    // The Hub answers the repeat of a key with the first verdict; the first answer is what the lost one was.
    answers = [{ lost: true }, letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    expect(rtl.screen.queryByText(/not checked in/i)).toBeNull();
    expect(rtl.screen.queryByText('ALREADY USED')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-retry'));
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(rtl.screen.getByText('Regular · Lennox Emmanuel')).toBeTruthy();
    expect(calls).toHaveLength(2);
    expect(calls[1].key).toBe(calls[0].key);
    expect(calls[1].body).toEqual(calls[0].body);
    noDashes();
  });

  it('Try again keeps the key of its scan however many times it is pressed', async () => {
    answers = [{ lost: true }, { status: 500, body: { statusCode: 500, message: 'x', data: null } }, { lost: true }, letIn];
    await boot();
    await see(SENT_CODE);
    for (let i = 0; i < 3; i += 1) {
      await rtl.fireEvent.press(await rtl.screen.findByTestId('door-problem-retry'));
    }
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(new Set(calls.map((c) => c.key)).size).toBe(1);
    expect(calls).toHaveLength(4);
  });

  it('a new scan, even of the same ticket after Cancel, gets a new key', async () => {
    answers = [{ lost: true }, used];
    await boot();
    await see(SENT_CODE);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-problem-dismiss'));
    await wait(SAME_CODE_QUIET_MS);
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('ALREADY USED')).toBeTruthy();
    expect(calls).toHaveLength(2);
    expect(calls[1].key).not.toBe(calls[0].key);
  });

  it('a double press of Try again in one frame sends one request', async () => {
    answers = [{ lost: true }, { hold: true }];
    await boot();
    await see(SENT_CODE);
    const retry = await rtl.screen.findByTestId('door-problem-retry');
    // Both presses are made before the screen has drawn again: the same frame.
    const click = (retry.props as { onClick: (event: unknown) => void }).onClick;
    const event = { stopPropagation: () => undefined, preventDefault: () => undefined, nativeEvent: {} };
    await rtl.act(async () => {
      click(event);
      click(event);
    });
    expect(calls).toHaveLength(2);
  });
});

describe('a check nobody answers (D3)', () => {
  it('after 10 seconds the screen stops waiting: could not confirm, with Try again, and the same scan is sent again', async () => {
    expect(ANSWER_WAIT_MS).toBe(10_000);
    answers = [{ hold: true }, letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText('Checking the ticket')).toBeTruthy();
    await wait(9_999);
    expect(rtl.screen.getByText('Checking the ticket')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-problem')).toBeNull();
    await wait(1);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    expect(rtl.screen.queryByText('Checking the ticket')).toBeNull();
    expect(rtl.screen.queryByText(/not checked in/i)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-retry'));
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(calls).toHaveLength(2);
    expect(calls[1].key).toBe(calls[0].key);
    noDashes();
  });

  it('the X still leaves the door while a check is waiting, and after it gave up', async () => {
    answers = [{ hold: true }];
    const { onClose } = await boot();
    await see(SENT_CODE);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await wait(10_000);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('an answer that comes in time is not cut off', async () => {
    answers = [{ later: true, status: 201, body: { statusCode: 201, message: 'Created', data: { outcome: 'valid', ticket: ticket(), totals } } }];
    await boot();
    await see(SENT_CODE);
    await wait(9_000);
    await rtl.act(async () => {
      release?.();
    });
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    await wait(5_000);
    expect(rtl.screen.queryByText("We couldn't confirm")).toBeNull();
  });
});

describe('a code typed while a check is on its way', () => {
  // Round 3: the button is not offered during a check, so a person cannot open the sheet then. What is left is a
  // sheet that was already open when a check began (a frame the camera had already reported), and these tests
  // start from there.
  const typeUnderOpenSheet = async (code: string) => {
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('door-code-input'), code);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
  };

  it('waits for it: the sheet closes, the screen says so, nothing is sent yet, and it is sent when the result has cleared', async () => {
    answers = [later({ outcome: 'valid', ticket: ticket(), totals }), notValid];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    expect(await rtl.screen.findByText('Checking the ticket')).toBeTruthy();
    await typeUnderOpenSheet(OTHER_CODE);
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
    expect(rtl.screen.getByText('Then the code you typed.')).toBeTruthy();
    expect(calls).toHaveLength(1);
    await rtl.act(async () => {
      release?.();
    });
    // The first ticket's result is read first and is not pushed off by the typed code.
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(calls).toHaveLength(1);
    await wait(2999);
    expect(calls).toHaveLength(1);
    await wait(1);
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
    expect(calls[1].key).not.toBe(calls[0].key);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
    expect(rtl.screen.queryByText('Then the code you typed.')).toBeNull();
    // It was sent once: the scanner is ready again after this result and sends nothing more.
    await wait(3000);
    expect(calls).toHaveLength(2);
  });

  it('a second code cannot be typed meanwhile: the sheet is shut and the button to open it is not offered until the check is done', async () => {
    answers = [later({ outcome: 'valid', ticket: ticket(), totals }), notValid];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    await typeUnderOpenSheet(OTHER_CODE);
    expect(rtl.screen.getByText('Then the code you typed.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
    await rtl.act(async () => {
      release?.();
    });
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    await wait(3000);
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    await wait(3000);
    expect(calls).toHaveLength(2);
    expect(rtl.screen.getByTestId('door-type')).toBeTruthy();
  });

  it('waits through a check that gave up: it is sent when the problem is dismissed, and never lost', async () => {
    answers = [{ hold: true }, notValid];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    await typeUnderOpenSheet(OTHER_CODE);
    expect(calls).toHaveLength(1);
    await wait(10_000);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    expect(calls).toHaveLength(1);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-dismiss'));
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
  });

  it('is dropped with the screen: the X leaves, and nothing is sent after', async () => {
    answers = [{ hold: true }];
    const { onClose } = await boot();
    await checkUnderOpenSheet(SENT_CODE);
    await typeUnderOpenSheet(OTHER_CODE);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
  });
});

describe('the camera\'s quiet time, by value', () => {
  it('a ticket out of view for less than 1.5 seconds is not read again, and at 1.5 seconds it is', async () => {
    expect(SAME_CODE_QUIET_MS).toBe(1500);
    answers = [letIn, used];
    await boot();
    await see(SENT_CODE);
    // The phone keeps reporting it while the result is up (noted, never sent), and the result clears at 3 s.
    await wait(1000);
    await see(SENT_CODE);
    await wait(1000);
    await see(SENT_CODE);
    // 1499 ms after the last report it is reported again: it never left, so it is not read.
    await wait(1499);
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
    await see(SENT_CODE);
    expect(calls).toHaveLength(1);
    // Then nothing for 1500 ms: it was away, so the next report is a new ticket.
    await wait(1500);
    await see(SENT_CODE);
    expect(calls).toHaveLength(2);
  });
});

describe('where the aim line sits (D4)', () => {
  const lift = () => StyleSheet.flatten(rtl.screen.getByTestId('door-middle').props.style).paddingBottom;

  it('is lifted 60 with the button row under it, and 280 with a result up, where the canvas draws it (E20, E23, E24)', async () => {
    answers = [letIn];
    await boot();
    expect(lift()).toBe(60);
    expect(rtl.screen.getByTestId('door-type')).toBeTruthy();
    await see(SENT_CODE);
    expect(await rtl.screen.findByTestId('door-result')).toBeTruthy();
    expect(lift()).toBe(280);
    // The canvas draws no button row beside a result.
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    expect(rtl.screen.getByText('Point at the ticket QR')).toBeTruthy();
    await wait(3000);
    expect(lift()).toBe(60);
    expect(rtl.screen.getByTestId('door-type')).toBeTruthy();
  });

  it('is lifted the same way for a problem panel, which has the result panel\'s shape', async () => {
    answers = [{ lost: true }];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByTestId('door-problem')).toBeTruthy();
    expect(lift()).toBe(280);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-dismiss'));
    expect(lift()).toBe(60);
  });
});

describe('the camera, before it is on', () => {
  it('opening the screen asks once for the camera, and says so meanwhile', async () => {
    mockCamera.permission = { granted: false, status: 'undetermined', canAskAgain: true };
    await boot();
    expect(rtl.screen.getByText('Opening the camera')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-camera')).toBeNull();
    expect(mockCamera.request).toHaveBeenCalledTimes(1);
  });

  it('a person who let the question go is asked again by a button, and can type the code meanwhile', async () => {
    mockCamera.permission = { granted: false, status: 'denied', canAskAgain: true };
    await boot();
    expect(rtl.screen.getByText('Allow your camera')).toBeTruthy();
    expect(mockCamera.request).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByText('Allow camera'));
    expect(mockCamera.request).toHaveBeenCalledTimes(1);
    expect(rtl.screen.getByText('Type the code instead')).toBeTruthy();
  });

  it('a camera turned off for this app offers the phone\'s settings, and the code can still be typed', async () => {
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    mockCamera.permission = { granted: false, status: 'denied', canAskAgain: false };
    answers = [letIn];
    await boot();
    expect(rtl.screen.getByText('Allow your camera')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Open settings'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(mockCamera.request).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByText('Type the code instead'));
    await rtl.fireEvent.changeText(await rtl.screen.findByTestId('door-code-input'), SENT_CODE);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    noDashes();
  });

  it('a camera that did not start says so, and the code can still be typed', async () => {
    await boot();
    expect(rtl.screen.getByTestId('door-camera')).toBeTruthy();
    await rtl.act(async () => {
      (mockCamera.props?.onMountError as () => void)();
    });
    expect(await rtl.screen.findByText("We can't open your camera")).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-camera')).toBeNull();
    expect(rtl.screen.getByText('Type the code instead')).toBeTruthy();
  });

  it('while the code is being typed the camera reads nothing', async () => {
    await boot();
    await rtl.fireEvent.press(rtl.screen.getByText('Type the code instead'));
    await rtl.screen.findByTestId('door-code-input');
    expect(mockCamera.props?.onBarcodeScanned).toBeUndefined();
  });
});

describe('D5 · a verdict that arrives while the typing sheet is open is never lost (round 3)', () => {
  it("the verifier's case: a typed code answered after 3 seconds, and nothing to tap at 0.7 seconds that could hide the answer; the verdict is then seen for its full 3 seconds", async () => {
    answers = [later({ outcome: 'valid', ticket: ticket(), totals })];
    await boot();
    await typeCode(SENT_CODE);
    expect(await rtl.screen.findByText('Checking the ticket')).toBeTruthy();
    await wait(700);
    // Round 2 still drew "Type the code instead" here; a tap on it opened the sheet over the coming verdict.
    expect(rtl.screen.queryByText('Type the code instead')).toBeNull();
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    await wait(2300);
    await rtl.act(async () => {
      release?.();
    });
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
    await wait(2999);
    expect(rtl.screen.getByText('LET THEM IN')).toBeTruthy();
    await wait(1);
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
    expect(rtl.screen.getByTestId('door-type')).toBeTruthy();
  });

  it('a check has no button row beside it, as a result has none, and the aim words stay where they were', async () => {
    answers = [later({ outcome: 'valid', ticket: ticket(), totals })];
    await boot();
    expect(rtl.screen.getByTestId('door-type')).toBeTruthy();
    await see(SENT_CODE);
    expect(await rtl.screen.findByTestId('door-checking')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    await rtl.act(async () => {
      release?.();
    });
    expect(await rtl.screen.findByTestId('door-result')).toBeTruthy();
    expect(rtl.screen.queryByTestId('door-type')).toBeNull();
    await wait(RESULT_HOLD_MS);
    expect(rtl.screen.getByTestId('door-type')).toBeTruthy();
  });

  it('a verdict that lands under the open sheet waits there: it is still up long after 3 seconds, and its 3 seconds begin when the sheet is closed', async () => {
    answers = [later({ outcome: 'valid', ticket: ticket(), totals })];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    expect(rtl.screen.getByTestId('door-checking')).toBeTruthy();
    await wait(1000);
    await rtl.act(async () => {
      release?.();
    });
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    // Round 2: the hold ran out behind the sheet at 3 s and the verdict was gone before anyone saw it.
    await wait(RESULT_HOLD_MS + 4000);
    expect(rtl.screen.getByTestId('door-code-input')).toBeTruthy();
    expect(rtl.screen.getByText('LET THEM IN')).toBeTruthy();
    // The sheet closes: now it is seen, and it stays for its full hold.
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-type-sheet-close'));
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
    expect(rtl.screen.getByText('LET THEM IN')).toBeTruthy();
    await wait(RESULT_HOLD_MS - 1);
    expect(rtl.screen.getByText('LET THEM IN')).toBeTruthy();
    await wait(1);
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
    expect(rtl.screen.getByTestId('door-type')).toBeTruthy();
  });

  it.each([
    ['ALREADY USED', { outcome: 'already_used', ticket: ticket(), totals } as DoorResult],
    ['NOT A VALID TICKET', { outcome: 'invalid', ticket: null, totals } as DoorResult],
  ])('%s is held that way too', async (title, data) => {
    answers = [later(data)];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    await rtl.act(async () => {
      release?.();
    });
    expect(await rtl.screen.findByText(title)).toBeTruthy();
    await wait(RESULT_HOLD_MS * 2);
    expect(rtl.screen.getByText(title)).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-type-sheet-close'));
    await wait(RESULT_HOLD_MS - 1);
    expect(rtl.screen.getByText(title)).toBeTruthy();
    await wait(1);
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
  });

  it('a code typed over a verdict nobody has seen does not replace it: it waits, the verdict is seen for its hold, then the code is checked', async () => {
    answers = [later({ outcome: 'valid', ticket: ticket(), totals }), notValid];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    await rtl.act(async () => {
      release?.();
    });
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('door-code-input'), OTHER_CODE);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
    // Round 2 sent it at once and drew its answer over the first verdict, which nobody had read.
    expect(calls).toHaveLength(1);
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
    expect(rtl.screen.getByText('LET THEM IN')).toBeTruthy();
    await wait(RESULT_HOLD_MS - 1);
    expect(calls).toHaveLength(1);
    expect(rtl.screen.getByText('LET THEM IN')).toBeTruthy();
    await wait(1);
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
    expect(calls[1].key).not.toBe(calls[0].key);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
  });

  it('a problem that lands under the open sheet is there, with Try again, when the sheet closes', async () => {
    answers = [{ lost: true }];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-type-sheet-close'));
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
    expect(rtl.screen.getByTestId('door-problem-retry')).toBeTruthy();
  });
});

describe('EVENTS-09 N2 · the two gaps the verifier named in round 3', () => {
  it('a code typed over a problem nobody has seen does not replace it: the problem stays, and the code is checked when it is dismissed', async () => {
    answers = [{ lost: true }, notValid];
    await boot();
    await checkUnderOpenSheet(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('door-code-input'), OTHER_CODE);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-code-check'));
    expect(calls).toHaveLength(1);
    expect(rtl.screen.queryByTestId('door-code-input')).toBeNull();
    // A problem has no hold: it is still there, with its own buttons, long after a verdict's 3 seconds.
    await wait(RESULT_HOLD_MS * 2);
    expect(calls).toHaveLength(1);
    expect(rtl.screen.getByText("We couldn't confirm")).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-dismiss'));
    expect(calls.map((c) => c.body.code)).toEqual([SENT_CODE, OTHER_CODE]);
    expect(calls[1].key).not.toBe(calls[0].key);
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
  });

  it('a verdict cleared by a tap leaves no timer behind: the next scan inside 3 seconds is held for its own 3 seconds', async () => {
    answers = [letIn, used];
    await boot();
    await see(SENT_CODE);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('door-result'));
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
    await wait(1000);
    await see(OTHER_CODE);
    expect(await rtl.screen.findByText('ALREADY USED')).toBeTruthy();
    // The first verdict's 3 seconds would end here (2 seconds after the second scan): the second is still up.
    await wait(2100);
    expect(rtl.screen.getByText('ALREADY USED')).toBeTruthy();
    await wait(899);
    expect(rtl.screen.getByText('ALREADY USED')).toBeTruthy();
    await wait(1);
    expect(rtl.screen.queryByTestId('door-result')).toBeNull();
  });
});

describe('a 422 on this route (round 3)', () => {
  it('reads "We couldn\'t confirm" with Try again, like any answer the app cannot be sure about; only a 400 says the ticket was not checked in', async () => {
    answers = [fail(422, 'Unprocessable Entity'), letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't confirm")).toBeTruthy();
    expect(rtl.screen.queryByText(/not checked in/i)).toBeNull();
    expect(rtl.screen.queryByText(/Unprocessable/)).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-retry'));
    expect(await rtl.screen.findByText('LET THEM IN')).toBeTruthy();
    expect(calls[1].key).toBe(calls[0].key);
    noDashes();
  });
});
