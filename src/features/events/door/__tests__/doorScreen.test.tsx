/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Linking, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { lightColors } from '@/theme/tokens.generated';

import type { DoorResult } from '../doorApi';
import { RESULT_HOLD_MS, SAME_CODE_QUIET_MS } from '../doorConfig';

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

type Reply = { status?: number; body?: unknown; offline?: true; hold?: true };
type Call = { method: string; path: string; body: { code?: string } };

const EVENT = 'e9000000-0000-4000-8000-000000000001';
const SENT_CODE = '7KQX-4M2P-9WVA-3RTE';
const OTHER_CODE = 'ZZZZ-ZZZZ-ZZZZ-ZZZZ';

let answers: Reply[] = [];
let calls: Call[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const text = await request.clone().text();
  calls.push({ method: request.method, path: new URL(request.url).pathname.replace(/^\/api\/hub/, ''), body: text ? (JSON.parse(text) as { code?: string }) : {} });
  const reply = answers.shift();
  if (!reply) throw new Error(`no answer for ${request.method} ${request.url}`);
  if (reply.hold) return new Promise<Response>(() => undefined);
  if (reply.offline) throw new TypeError('Network request failed');
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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

const noDashes = () => expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/—|Flutterwave/);

// The first load of the screen compiles every component under it; on a cold cache that outlasts a test's own limit.
beforeAll(() => {
  require('../DoorScreen');
}, 120_000);

beforeEach(() => {
  jest.useFakeTimers();
  answers = [];
  calls = [];
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
    expect(calls).toEqual([{ method: 'POST', path: `/events/${EVENT}/door/check-in`, body: { code: SENT_CODE } }]);
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

  it('a result clears by itself after a few seconds, and the next ticket is read', async () => {
    answers = [letIn, letIn];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByTestId('door-result')).toBeTruthy();
    await wait(RESULT_HOLD_MS - 1);
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

  it('a QR shorter than the door takes is sent padded, and answered the same way', async () => {
    answers = [notValid];
    await boot();
    await see('42');
    expect(calls[0].body.code).toBe('42  ');
    expect(await rtl.screen.findByText('NOT A VALID TICKET')).toBeTruthy();
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
    expect(await rtl.screen.findByText('No connection')).toBeTruthy();
    expect(rtl.screen.getByText(/The ticket was not checked in/)).toBeTruthy();
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

  it('a server error says it did not check the ticket in, and offers Try again', async () => {
    answers = [fail(500, 'Internal server error')];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't check that ticket")).toBeTruthy();
    expect(rtl.screen.getByText('Internal server error The ticket was not checked in.')).toBeTruthy();
    expect(rtl.screen.getByTestId('door-problem-retry')).toBeTruthy();
  });

  it('an answer that cannot be read is not drawn as a verdict', async () => {
    answers = [{ status: 201, body: { statusCode: 201, message: 'Created', data: { outcome: 'valid', ticket: null } } }];
    await boot();
    await see(SENT_CODE);
    expect(await rtl.screen.findByText("We couldn't check that ticket")).toBeTruthy();
    expect(rtl.screen.queryByText('LET THEM IN')).toBeNull();
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
    expect(rtl.screen.getByTestId('door-type').props.accessibilityState.disabled).toBe(true);
    await rtl.fireEvent.press(rtl.screen.getByTestId('door-problem-back'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([]);
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
