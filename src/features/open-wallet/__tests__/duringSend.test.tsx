/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { useLayoutEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// FIX-47: A27's send keeps A27 on screen. The screens are STACKED the way the app stacks them (A31, A5, A26, A27 all
// mounted, only the top one focused), with the real A31, A5 and A27 and a stack that pops the way the router does.

const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('../documents/pick', () => ({ pickIdPhoto: jest.fn(), pickProofFile: jest.fn() }));

/** The stack the app has: names bottom to top. `set` is the router, `focus` tells a screen whether it is the top one. */
const mockHost = { stack: [] as string[], set: (_next: string[]) => undefined as void };
jest.mock('expo-router', () => {
  const React = require('react');
  const FocusContext = React.createContext(true);
  return {
    ...jest.requireActual('expo-router'),
    useRouter: () => ({
      canGoBack: () => mockHost.stack.length > 1,
      back: () => mockHost.set(mockHost.stack.slice(0, -1)),
      push: jest.fn(),
    }),
    useIsFocused: () => React.useContext(FocusContext),
    useLocalSearchParams: () => ({}),
    __FocusContext: FocusContext,
  };
});
// The ways out of A5 and A27 do what the real ones do to the stack: restart pops down to A31, the others replace every screen.
const mockWay = {
  leave: jest.fn(() => mockHost.set(['home'])),
  restart: jest.fn(() => mockHost.set(['a31'])),
  opened: jest.fn(() => mockHost.set(['a8'])),
  checking: jest.fn(() => mockHost.set(['a28'])),
  details: jest.fn(),
  selfie: jest.fn(() => mockHost.set(['a6'])),
  needsDocuments: jest.fn(() => mockHost.set(['a26'])),
  rejected: jest.fn(() => mockHost.set(['a29'])),
  uploadAgain: jest.fn(),
};
jest.mock('../leave', () => ({
  ...jest.requireActual('../leave'),
  useOpenWalletWay: () => mockWay,
  useDropDraftOnExit: () => undefined,
}));

type Reply = { status: number; body: unknown };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000f7';
const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

const row = (kind: string, state: string, sides: string[] = []) => ({ kind, state, sides, uploadedAt: state === 'uploaded' ? '2026-10-16T09:00:00.000Z' : null });
const documents = (over: Record<string, unknown> = {}) =>
  ok({
    required: true,
    open: true,
    documents: [row('identity', 'missing'), row('proof_of_address', 'missing')],
    selfie: 'not_used',
    submitted: false,
    submittedAt: null,
    waitingFor: ['identity', 'proof_of_address'],
    maxBytes: 10485760,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    ...over,
  });
const review = (stage: string) => ({ stage, reasons: [], canResubmit: false, canResubmitAt: null, decidedAt: null });
const wallet = (over: Record<string, unknown> = {}) =>
  ok({
    state: 'not_open',
    account: null,
    limits: null,
    pin: { isSet: false, changedAt: null, triesLeft: 5, lockedUntil: null },
    bankTransfers: { allowed: false, blockedBy: null },
    beneficiaryCount: 0,
    accountNumberStatus: 'none',
    openingFlow: 'review',
    review: review('needs_documents'),
    ...over,
  });
const liveness = (over: Record<string, unknown> = {}) => ok({ enabled: true, state: 'not_started', url: null, startedAt: null, canStart: true, ...over });
const me = ok({ wawuUserId: OWNER, phone: '+2348031234412', email: 'ada@example.com', firstName: 'Ada', lastName: 'Eze' });

let sent: Sent[] = [];
let routes: Record<string, Reply[]> = {};
let fallback: Record<string, Reply> = {};
let holds: Record<string, Promise<void>[]> = {};
/** Until the open call is made the Hub has no opening, whichever screen asks (A31's step, A27 and the resume check read the same route). */
let noOpeningYet = false;
let openMade = false;
/** The Hub's documents answer is half-way until the second upload is in, whoever reads it and whenever. */
let uploads = 0;
let uploadsIn = false;

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  sent.push({ method: request.method, path, body: '' });
  const key = `${request.method} ${path.replace(/^\/api\/hub/, '')}`;
  if (key === 'POST /money/wallet/open') openMade = true;
  if (key === 'POST /money/identity/documents') uploads += 1;
  const answer =
    key === 'GET /money/wallet' && noOpeningYet && !openMade
      ? wallet({ review: null })
      : key === 'GET /money/identity/documents' && noOpeningYet && !uploadsIn
        ? documents()
        : (routes[key]?.shift() ?? fallback[key]);
  if (!answer) throw new Error(`no answer for ${key}`);
  const held = holds[key]?.shift();
  if (held) await held;
  if (key === 'POST /money/identity/documents' && uploads === 2) uploadsIn = true;
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];
const draft = () => require('../draft') as typeof import('../draft');
const kept = () => require('../keptCheck') as typeof import('../keptCheck');
const calls = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === `/api/hub${path}`);
const picks = () => require('../documents/pick') as { pickIdPhoto: jest.Mock; pickProofFile: jest.Mock };
const focus = () => (require('expo-router') as unknown as { __FocusContext: React.Context<boolean> }).__FocusContext;

const MARKERS = new Set(['a26', 'a6', 'a28', 'a8', 'a29', 'home']);
const ROUTES: Record<string, string> = { a31: '@/app/open-wallet', a5: '@/app/open-wallet-details', a27: '@/app/open-wallet-address' };

function Screen({ name }: { name: string }) {
  if (MARKERS.has(name)) return <Text testID={`at-${name}`}>{name}</Text>;
  const Component = (require(ROUTES[name]) as { default: () => React.ReactElement }).default;
  return <Component />;
}

/** Every screen of the stack stays mounted, as in the app; only the top one is in front. */
function Stack({ initial }: { initial: string[] }) {
  const [names, setNames] = useState(initial);
  useLayoutEffect(() => {
    mockHost.stack = names;
    mockHost.set = setNames;
  }, [names]);
  const Focus = focus();
  return (
    <>
      {names.map((name, index) => (
        <Focus.Provider key={name} value={index === names.length - 1}>
          <Screen name={name} />
        </Focus.Provider>
      ))}
    </>
  );
}

async function mount(initial: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <Stack initial={initial} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return rtl;
}

beforeEach(() => {
  sent = [];
  routes = {};
  holds = {};
  noOpeningYet = false;
  openMade = false;
  uploads = 0;
  uploadsIn = false;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = {
    'GET /users/me': me,
    'GET /money/wallet': wallet(),
    'GET /money/identity': ok({ bvn: null, ninLast4: null, occupation: null, checksLeft: 5 }),
    'GET /money/identity/documents': documents(),
    'GET /money/identity/liveness': liveness(),
  };
  draft().forgetDraft();
  kept().forgetKeptCheck();
  (require('../selfieDrop') as typeof import('../selfieDrop')).forgetSelfieDrop();
  Object.values(mockWay).forEach((fn) => fn.mockClear());
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
  jest.restoreAllMocks();
});

const idle = (ms: number) =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

/** The review opening: the BVN and NIN typed on A31 and the name typed on A5 are held; the ID is in the draft; the Hub has no opening yet. */
function arrange(mode: 'selfie' | 'off') {
  const ticket = kept().ticketFor(OWNER);
  kept().keepNumbers(ticket, { bvn: '22190000111', nin: '70190000999' });
  kept().keepPerson(ticket, { firstName: 'Ada', lastName: 'Eze', dateOfBirth: '1994-03-14', gender: 'female' }, { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
  draft().setIdType(OWNER, 'national_id');
  draft().setIdNumber(OWNER, '12345678901');
  draft().setIdSide(OWNER, 'front', { blob: new Blob([new Uint8Array(2048)], { type: 'image/jpeg' }), name: 'id-front.jpg', contentType: 'image/jpeg' });
  draft().setIdSide(OWNER, 'back', { blob: new Blob([new Uint8Array(2048)], { type: 'image/jpeg' }), name: 'id-back.jpg', contentType: 'image/jpeg' });
  const left = mode === 'selfie' ? { selfie: 'needed', waitingFor: ['selfie'] } : { selfie: 'not_used', waitingFor: [] };
  const both = [row('identity', 'uploaded', ['front', 'back']), row('proof_of_address', 'uploaded', ['front'])];
  noOpeningYet = true;
  fallback['GET /money/wallet'] = wallet({ review: review('needs_documents') });
  fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
  fallback['GET /money/identity/documents'] = documents({ ...left, documents: both });
  routes['POST /money/identity/documents'] = [
    documents({ documents: [row('identity', 'uploaded', ['front', 'back']), row('proof_of_address', 'missing')], waitingFor: ['proof_of_address'], selfie: mode === 'selfie' ? 'needed' : 'not_used' }),
    documents({ ...left, documents: both }),
  ];
}

/** Fills A27 and presses Submit with the second upload held; resolves with the app and the function that lets it go. */
async function submitHeld(stack: string[]) {
  let release: () => void = () => undefined;
  holds['POST /money/identity/documents'] = [Promise.resolve(), new Promise<void>((resolve) => (release = resolve))];
  const app = await mount(stack);
  picks().pickProofFile.mockResolvedValueOnce({ blob: new Blob([new Uint8Array(4096)], { type: 'application/pdf' }), name: 'bill.pdf', contentType: 'application/pdf' });
  await rtl.fireEvent.press(await rtl.screen.findByTestId('open-wallet-proof-add'));
  await rtl.screen.findByText('bill.pdf');
  await rtl.fireEvent.press(await rtl.screen.findByTestId('open-wallet-proof-type'));
  await rtl.fireEvent.press(await rtl.screen.findByTestId('open-wallet-proof-type-utility_bill'));
  await rtl.fireEvent.changeText(rtl.screen.getByTestId('open-wallet-postal'), '106104');
  await rtl.fireEvent.changeText(rtl.screen.getByTestId('open-wallet-address-field'), '14 Admiralty Way, Lekki Phase 1, Lagos');
  await rtl.fireEvent.press(rtl.screen.getByTestId('open-wallet-address-submit'));
  await rtl.waitFor(() => expect(calls('POST', '/money/identity/documents')).toHaveLength(2));
  return { app, release };
}

const busy = () => rtl.screen.getByTestId('open-wallet-address-submit').props.accessibilityState?.busy === true;

describe('FIX-47 · A27 stays on screen with its busy state for the whole send', () => {
  it.each([
    ['selfie', 'at-a6'],
    ['off', 'at-a28'],
  ] as const)('%s: A5 does not restart the flow when the opening is put on the Hub, A27 stays busy, then %s', async (mode, end) => {
    arrange(mode);
    const { release } = await submitHeld(['a31', 'a5', 'a26', 'a27']);
    // The opening is on the Hub and the second upload is held: this is when A31 gave up its step and A5 popped A27.
    await idle(300);
    expect(mockWay.restart).not.toHaveBeenCalled();
    expect(mockHost.stack).toEqual(['a31', 'a5', 'a26', 'a27']);
    expect(rtl.screen.getByTestId('open-wallet-address')).toBeTruthy();
    expect(busy()).toBe(true);
    expect(rtl.screen.queryByTestId('open-wallet-resume')).toBeNull();
    // The details A31 and A5 hold are still held (the retry of a failed upload needs them nowhere, but A5 shows them).
    expect(kept().readNumbers(OWNER)).not.toBeNull();
    await idle(300);
    expect(busy()).toBe(true);
    expect(calls('POST', '/money/wallet/open')).toHaveLength(1);
    release();
    await rtl.waitFor(() => expect(rtl.screen.getByTestId(end)).toBeTruthy());
    expect(mockWay.restart).not.toHaveBeenCalled();
    expect(mockWay.needsDocuments).not.toHaveBeenCalled();
    expect(mockWay[mode === 'selfie' ? 'selfie' : 'checking']).toHaveBeenCalledTimes(1);
    expect(calls('POST', '/money/identity/liveness')).toHaveLength(0);
  });

  it('a back press during the send leaves A27 for A26, the send finishes in the background, and nothing pops the person', async () => {
    arrange('selfie');
    const { release } = await submitHeld(['a31', 'a5', 'a26', 'a27']);
    await idle(100);
    await rtl.act(async () => {
      mockHost.set(['a31', 'a5', 'a26']);
    });
    expect(rtl.screen.getByTestId('at-a26')).toBeTruthy();
    release();
    await idle(300);
    expect(mockWay.restart).not.toHaveBeenCalled();
    expect(mockHost.stack).toEqual(['a31', 'a5', 'a26']);
    expect(calls('POST', '/money/identity/documents')).toHaveLength(2);
  });

  it('A31 in front while A27 still sends draws a busy state, not an empty page, then routes by the Hub answer', async () => {
    arrange('selfie');
    const { release } = await submitHeld(['a31', 'a5', 'a26', 'a27']);
    await idle(100);
    // Back, back, back: the person walks down to A31 while the upload is still going.
    await rtl.act(async () => {
      mockHost.set(['a31']);
    });
    await idle(150);
    expect(rtl.screen.getByTestId('open-wallet-resume-sending')).toBeTruthy();
    expect(rtl.screen.getByText('Sending your details and documents')).toBeTruthy();
    expect(mockWay.needsDocuments).not.toHaveBeenCalled();
    expect(mockWay.selfie).not.toHaveBeenCalled();
    release();
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('at-a6')).toBeTruthy());
    expect(mockWay.needsDocuments).not.toHaveBeenCalled();
    expect(mockWay.selfie).toHaveBeenCalledTimes(1);
  });

  it('A31 in front and only asking (no send) still draws nothing but its frame', async () => {
    fallback['GET /money/wallet'] = wallet({ review: review('needs_documents') });
    fallback['GET /money/identity/documents'] = documents();
    await mount(['a31']);
    expect(rtl.screen.queryByTestId('open-wallet-resume-sending')).toBeNull();
    await rtl.waitFor(() => expect(mockWay.needsDocuments).toHaveBeenCalledTimes(1));
  });
});

describe('FIX-47 · a flow that is really lost still restarts', () => {
  it('A5 with nothing held and no opening on the Hub restarts, once', async () => {
    fallback['GET /money/wallet'] = wallet({ review: null });
    await mount(['a31', 'a5']);
    await rtl.waitFor(() => expect(mockWay.restart).toHaveBeenCalledTimes(1));
  });

  it('A5 with nothing held waits while a send is on its way, and restarts when none is and the details are still gone', async () => {
    fallback['GET /money/wallet'] = wallet({ review: null });
    const { beginOpeningSend } = require('../sending') as typeof import('../sending');
    const end = beginOpeningSend();
    await mount(['a31', 'a5']);
    await idle(150);
    expect(mockWay.restart).not.toHaveBeenCalled();
    await rtl.act(async () => {
      end();
    });
    await rtl.waitFor(() => expect(mockWay.restart).toHaveBeenCalledTimes(1));
  });
});
