/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
jest.mock('expo-router', () => ({ ...jest.requireActual('expo-router'), useRouter: () => ({ canGoBack: () => false, back: jest.fn() }) }));
jest.mock('../leave', () => ({
  ...jest.requireActual('../leave'),
  useOpenWalletWay: () => ({ leave: jest.fn(), restart: jest.fn(), opened: jest.fn(), checking: jest.fn(), details: jest.fn() }),
}));
jest.mock('../SelfieScreen', () => {
  const { Text } = require('react-native');
  return { SelfieScreen: () => <Text>The camera step</Text> };
});

type Reply = { status: number; body: unknown };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000f6';
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
const review = (stage: string, over: Record<string, unknown> = {}) => ({ stage, reasons: [], canResubmit: false, canResubmitAt: null, decidedAt: null, ...over });
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

let sent: Sent[] = [];
let routes: Record<string, Reply[]> = {};
let fallback: Record<string, Reply> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  let body = '';
  try {
    body = request.method === 'GET' ? '' : await request.clone().text();
  } catch {
    body = '';
  }
  sent.push({ method: request.method, path, body });
  const key = `${request.method} ${path.replace(/^\/api\/hub/, '')}`;
  const answer = routes[key]?.shift() ?? fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

const clients: QueryClient[] = [];
/** What was appended to each multipart form, in order: the request's own body is not readable in this environment. */
const appended: { key: string; value?: string; name?: string; part?: unknown }[] = [];
const realAppend = FormData.prototype.append;
FormData.prototype.append = function append(this: FormData, ...args: unknown[]) {
  const [key, value, name] = args as [string, unknown, string | undefined];
  appended.push(typeof value === 'string' ? { key, value } : { key, name, part: value });
  return (realAppend as (...all: unknown[]) => void).apply(this, args);
} as typeof FormData.prototype.append;

async function mount(element: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{element}</SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { ...rtl, client };
}


const draft = () => require('../draft') as typeof import('../draft');
const calls = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === `/api/hub${path}`);
const picks = () => require('../documents/pick') as { pickIdPhoto: jest.Mock; pickProofFile: jest.Mock };

/** The hosted selfie as the Hub answers `GET` and `POST /money/identity/liveness` (IdentityLivenessView). */
const liveness = (over: Record<string, unknown> = {}) => ok({ enabled: true, state: 'not_started', url: null, startedAt: null, canStart: true, ...over });
const SECURE_PAGE = 'https://selfie.example.test/session/abc';

let opened: string[] = [];
let foreground: (state: string) => void = () => undefined;

beforeEach(() => {
  sent = [];
  appended.length = 0;
  routes = {};
  opened = [];
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = { 'GET /money/wallet': wallet(), 'GET /money/identity/documents': documents(), 'GET /money/identity/liveness': liveness() };
  draft().forgetDraft();
  (require('../keptCheck') as typeof import('../keptCheck')).forgetKeptCheck();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
  const rn = require('react-native') as typeof import('react-native');
  jest.spyOn(rn.Linking, 'openURL').mockImplementation(async (url: string) => {
    opened.push(url);
    return true;
  });
  jest.spyOn(rn.AppState, 'addEventListener').mockImplementation(((_: string, handler: (state: string) => void) => {
    foreground = handler;
    return { remove: () => undefined };
  }) as never);
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
  clients.splice(0).forEach((client) => client.clear());
  jest.restoreAllMocks();
});

async function hostedScreen() {
  const { HostedSelfieScreen } = require('../HostedSelfieScreen') as typeof import('../HostedSelfieScreen');
  const props = { onBack: jest.fn(), onContinue: jest.fn(), onDropped: jest.fn(), onDetails: jest.fn() };
  const app = await mount(<HostedSelfieScreen {...props} />);
  return { ...app, ...props };
}

describe('A6 · Selfie hand-off and A7 · Back from the secure page', () => {
  it('a person with the selfie due sees the hand-off, is sent to the secure page, and on coming back sees A7 and goes on', async () => {
    routes['POST /money/identity/liveness'] = [liveness({ state: 'pending', url: SECURE_PAGE })];
    const app = await hostedScreen();
    expect(await app.screen.findByText("You'll finish this on a secure page")).toBeTruthy();
    expect(app.screen.getByText('Our banking partner, Nuvion, takes your selfie. It must match your BVN photo. You come straight back here.')).toBeTruthy();
    expect(app.screen.getByText('Continue to secure page')).toBeTruthy();
    await rtl.act(async () => {
      rtl.fireEvent.press(app.screen.getByTestId('open-wallet-selfie-continue'));
    });
    await rtl.waitFor(() => expect(opened).toEqual([SECURE_PAGE]));
    // No return address is sent: the app has no https one (G-827); the body is empty.
    expect(JSON.parse(calls('POST', '/money/identity/liveness')[0].body)).toEqual({});
    // The person finishes there and switches back to the app: the result is read.
    fallback['GET /money/identity/liveness'] = liveness({ state: 'passed' });
    await rtl.act(async () => {
      foreground('active');
    });
    expect(await app.screen.findByText('Selfie done')).toBeTruthy();
    expect(app.screen.getByText('Back from the secure page. Your face matched your BVN.')).toBeTruthy();
    await rtl.fireEvent.press(app.screen.getByText('Continue'));
    expect(app.onContinue).toHaveBeenCalledTimes(1);
  });

  it('a person who has already passed is shown A7 straight away, and nothing is started', async () => {
    fallback['GET /money/identity/liveness'] = liveness({ state: 'passed' });
    const app = await hostedScreen();
    expect(await app.screen.findByText('Selfie done')).toBeTruthy();
    expect(calls('POST', '/money/identity/liveness')).toHaveLength(0);
  });

  it('R-39: when the Hub says the selfie is not part of this opening the step is dropped and A28 is next', async () => {
    fallback['GET /money/identity/liveness'] = liveness({ enabled: false, state: 'not_in_use', canStart: false });
    const app = await hostedScreen();
    await rtl.waitFor(() => expect(app.onDropped).toHaveBeenCalledTimes(1));
    expect(app.screen.queryByText("You'll finish this on a secure page")).toBeNull();
    expect(opened).toEqual([]);
  });

  it('R-39: when Nuvion will not start a selfie for this person the step is dropped, never a dead end', async () => {
    routes['POST /money/identity/liveness'] = [{ status: 409, body: { statusCode: 409, message: 'No selfie is needed.', reason: { code: 'selfie_not_available', message: 'No selfie is needed.' } } }];
    const app = await hostedScreen();
    await rtl.act(async () => {
      rtl.fireEvent.press(await app.screen.findByTestId('open-wallet-selfie-continue'));
    });
    await rtl.waitFor(() => expect(app.onDropped).toHaveBeenCalledTimes(1));
    expect(opened).toEqual([]);
  });

  it('a selfie that did not pass says so and offers a new page, which opens', async () => {
    fallback['GET /money/identity/liveness'] = liveness({ state: 'not_passed' });
    routes['POST /money/identity/liveness'] = [liveness({ state: 'pending', url: SECURE_PAGE })];
    const app = await hostedScreen();
    expect(await app.screen.findByText("We couldn't match your face")).toBeTruthy();
    expect(app.screen.getByText('It must match your BVN photo. Good light, no glasses or cap')).toBeTruthy();
    await rtl.act(async () => {
      rtl.fireEvent.press(app.screen.getByText('Try again'));
    });
    await rtl.waitFor(() => expect(opened).toEqual([SECURE_PAGE]));
  });

  it('a page that could not be made says why, keeps the button, and opens nothing', async () => {
    routes['POST /money/identity/liveness'] = [{ status: 503, body: { statusCode: 503, message: 'The bank is not answering.', reason: { code: 'provider_unreachable', message: 'The bank is not answering.' } } }];
    const app = await hostedScreen();
    await rtl.act(async () => {
      rtl.fireEvent.press(await app.screen.findByTestId('open-wallet-selfie-continue'));
    });
    expect(await app.screen.findByText("We couldn't reach the secure page")).toBeTruthy();
    expect(app.screen.getByText('The bank is not answering.')).toBeTruthy();
    expect(app.screen.getByText('Continue to secure page')).toBeTruthy();
    expect(opened).toEqual([]);
    expect(app.onDropped).not.toHaveBeenCalled();
  });

  it('an address that is not https is never opened', async () => {
    routes['POST /money/identity/liveness'] = [liveness({ state: 'pending', url: 'http://selfie.example.test/x' })];
    const app = await hostedScreen();
    await rtl.act(async () => {
      rtl.fireEvent.press(await app.screen.findByTestId('open-wallet-selfie-continue'));
    });
    expect(await app.screen.findByText("We couldn't open the secure page")).toBeTruthy();
    expect(opened).toEqual([]);
  });

  it('a person with no opening at the Hub (a reload, a link) is sent to the first step', async () => {
    fallback['GET /money/identity/liveness'] = { status: 409, body: { statusCode: 409, message: 'Open your wallet first.', reason: { code: 'wallet_not_open', message: 'Open your wallet first.' } } };
    const app = await hostedScreen();
    await rtl.waitFor(() => expect(app.onDetails).toHaveBeenCalledTimes(1));
  });

  it('a read that fails shows the error with Try again, and the secure page is not offered', async () => {
    fallback['GET /money/identity/liveness'] = { status: 503, body: { statusCode: 503, message: 'The bank is not answering.', reason: { code: 'provider_unreachable', message: 'The bank is not answering.' } } };
    const app = await hostedScreen();
    expect(await app.screen.findByTestId('open-wallet-selfie-error')).toBeTruthy();
    expect(app.screen.queryByText('Continue to secure page')).toBeNull();
    fallback['GET /money/identity/liveness'] = liveness();
    await rtl.fireEvent.press(app.screen.getByText('Try again'));
    expect(await app.screen.findByText("You'll finish this on a secure page")).toBeTruthy();
  });

  it('while the page is open the result is asked for again by itself', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    try {
      routes['POST /money/identity/liveness'] = [liveness({ state: 'pending', url: SECURE_PAGE })];
      const app = await hostedScreen();
      await rtl.act(async () => {
        rtl.fireEvent.press(await app.screen.findByTestId('open-wallet-selfie-continue'));
      });
      fallback['GET /money/identity/liveness'] = liveness({ state: 'passed' });
      await rtl.act(async () => {
        jest.advanceTimersByTime(5100);
      });
      expect(await app.screen.findByText('Selfie done')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('A6 under either opening (SelfieStep)', () => {
  async function step() {
    const { SelfieStep } = require('../SelfieStep') as typeof import('../SelfieStep');
    return mount(<SelfieStep />);
  }

  it('the review opening (Nuvion) gets the hosted hand-off', async () => {
    const app = await step();
    expect(await app.screen.findByText("You'll finish this on a secure page")).toBeTruthy();
    expect(app.screen.queryByText('The camera step')).toBeNull();
  });

  it('the older opening (the BVN check, kept for the rollback) keeps the camera step and asks nothing of the selfie routes', async () => {
    fallback['GET /money/wallet'] = wallet({ openingFlow: 'check', review: null });
    const app = await step();
    expect(await app.screen.findByText('The camera step')).toBeTruthy();
    expect(calls('GET', '/money/identity/liveness')).toHaveLength(0);
  });
});

describe('A27 and the way back in: the selfie is next only while it is all that is left', () => {
  const none = { selfie: 'not_used', waitingFor: [] as string[] };
  const selfieLeft = { selfie: 'needed', waitingFor: ['selfie'] };

  async function addressScreen() {
    const { ProofOfAddressScreen } = require('../ProofOfAddressScreen') as typeof import('../ProofOfAddressScreen');
    const props = { onBack: jest.fn(), onSubmitted: jest.fn(), onChecking: jest.fn(), onOpened: jest.fn(), onDetails: jest.fn(), onSelfie: jest.fn() };
    const app = await mount(<ProofOfAddressScreen {...props} />);
    return { ...app, ...props };
  }
  async function submit(app: Awaited<ReturnType<typeof addressScreen>>) {
    picks().pickProofFile.mockResolvedValueOnce({ blob: new Blob([new Uint8Array(4096)], { type: 'application/pdf' }), name: 'bill.pdf', contentType: 'application/pdf' });
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-add'));
    expect(await app.screen.findByText('bill.pdf')).toBeTruthy();
    await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-address-field'), '14 Admiralty Way, Lekki Phase 1, Lagos');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));
  }
  function seedId() {
    draft().setIdSide(OWNER, 'front', { blob: new Blob([new Uint8Array(2048)], { type: 'image/jpeg' }), name: 'id-front.jpg', contentType: 'image/jpeg' });
    draft().setIdSide(OWNER, 'back', { blob: new Blob([new Uint8Array(2048)], { type: 'image/jpeg' }), name: 'id-back.jpg', contentType: 'image/jpeg' });
  }

  it('Submit with the hosted selfie still to take goes to A6, not A28', async () => {
    seedId();
    fallback['POST /money/identity/documents'] = documents({ ...selfieLeft, documents: [row('identity', 'uploaded', ['front', 'back']), row('proof_of_address', 'uploaded', ['front'])] });
    const app = await addressScreen();
    await submit(app);
    await rtl.waitFor(() => expect(app.onSelfie).toHaveBeenCalledTimes(1));
    expect(app.onSubmitted).not.toHaveBeenCalled();
  });

  it('Submit when the Hub needs no selfie (R-39: not in use) goes to A28 as before', async () => {
    seedId();
    fallback['POST /money/identity/documents'] = documents({ ...none, documents: [row('identity', 'uploaded', ['front', 'back']), row('proof_of_address', 'uploaded', ['front'])] });
    const app = await addressScreen();
    await submit(app);
    await rtl.waitFor(() => expect(app.onSubmitted).toHaveBeenCalledTimes(1));
    expect(app.onSelfie).not.toHaveBeenCalled();
  });

  it('a person who comes back to the first step with both documents in and only the selfie left lands on A6', async () => {
    fallback['GET /money/identity/documents'] = documents({ ...selfieLeft });
    const { ReviewResume } = require('../ReviewResume') as typeof import('../ReviewResume');
    const props = { onDocuments: jest.fn(), onChecking: jest.fn(), onRejected: jest.fn(), onSelfie: jest.fn() };
    const app = await mount(
      <ReviewResume {...props} fallback={null}>
        {null}
      </ReviewResume>,
    );
    await rtl.waitFor(() => expect(props.onSelfie).toHaveBeenCalledTimes(1));
    expect(props.onDocuments).not.toHaveBeenCalled();
    expect(app.client).toBeTruthy();
  });

  it('a person who comes back with a document still missing lands on A26, even with the selfie also due', async () => {
    fallback['GET /money/identity/documents'] = documents({ selfie: 'needed', waitingFor: ['proof_of_address', 'selfie'] });
    const { ReviewResume } = require('../ReviewResume') as typeof import('../ReviewResume');
    const props = { onDocuments: jest.fn(), onChecking: jest.fn(), onRejected: jest.fn(), onSelfie: jest.fn() };
    await mount(
      <ReviewResume {...props} fallback={null}>
        {null}
      </ReviewResume>,
    );
    await rtl.waitFor(() => expect(props.onDocuments).toHaveBeenCalledTimes(1));
    expect(props.onSelfie).not.toHaveBeenCalled();
  });

  it('A28 never sends a person with the selfie still to take back to A26: it goes to A6', async () => {
    fallback['GET /money/identity/documents'] = documents({ ...selfieLeft });
    const { CheckingScreen } = require('../CheckingScreen') as typeof import('../CheckingScreen');
    const props = { onOpened: jest.fn(), onRejected: jest.fn(), onNeedsDocuments: jest.fn(), onSelfie: jest.fn(), onLeave: jest.fn() };
    await mount(<CheckingScreen {...props} />);
    await rtl.waitFor(() => expect(props.onSelfie).toHaveBeenCalledTimes(1));
    expect(props.onNeedsDocuments).not.toHaveBeenCalled();
  });

  it('A28 still sends a person with no document in to A26', async () => {
    const { CheckingScreen } = require('../CheckingScreen') as typeof import('../CheckingScreen');
    const props = { onOpened: jest.fn(), onRejected: jest.fn(), onNeedsDocuments: jest.fn(), onSelfie: jest.fn(), onLeave: jest.fn() };
    await mount(<CheckingScreen {...props} />);
    await rtl.waitFor(() => expect(props.onNeedsDocuments).toHaveBeenCalledTimes(1));
    expect(props.onSelfie).not.toHaveBeenCalled();
  });
});
