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

type Reply = { status: number; body: unknown };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000f6';
const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string): Reply => ({ status, body: { statusCode: status, message, reason: { code, message } } });

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
const file = (name: string, contentType = 'image/jpeg', size = 2048) => ({ blob: new Blob([new Uint8Array(size)], { type: contentType }), name, contentType });

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

const picks = () => require('../documents/pick') as { pickIdPhoto: jest.Mock; pickProofFile: jest.Mock };
const draft = () => require('../draft') as typeof import('../draft');
const calls = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === `/api/hub${path}`);
const disabled = (node: { props?: { accessibilityState?: { disabled?: boolean } } } | null) => Boolean(node?.props?.accessibilityState?.disabled);

beforeEach(() => {
  sent = [];
  appended.length = 0;
  routes = {};
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = { 'GET /money/wallet': wallet(), 'GET /money/identity/documents': documents() };
  picks().pickIdPhoto.mockReset();
  picks().pickProofFile.mockReset();
  draft().forgetDraft();
  (require('../keptCheck') as typeof import('../keptCheck')).forgetKeptCheck();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
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
});

async function idScreen() {
  const { IdDocumentScreen } = require('../IdDocumentScreen') as typeof import('../IdDocumentScreen');
  const props = { onBack: jest.fn(), onContinue: jest.fn(), onChecking: jest.fn(), onOpened: jest.fn(), onLeave: jest.fn(), onDetails: jest.fn() };
  const app = await mount(<IdDocumentScreen {...props} />);
  return { ...app, ...props };
}

describe('A26 · Your ID document', () => {
  it('a user can take both sides of an ID, and Continue opens only once both are in', async () => {
    picks().pickIdPhoto.mockResolvedValueOnce(file('id-front.jpg')).mockResolvedValueOnce(file('id-back.jpg'));
    const app = await idScreen();
    expect(await app.screen.findByTestId('open-wallet-id-front')).toBeTruthy();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(true);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-front'));
    expect(await app.screen.findByLabelText('Front, Done')).toBeTruthy();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(true);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-back'));
    expect(await app.screen.findByLabelText('Back, Done')).toBeTruthy();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(false);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-continue'));
    expect(app.onContinue).toHaveBeenCalledTimes(1);
    // Nothing is sent from this step: the sides wait in memory for A27's Submit.
    expect(sent.filter((s) => s.method !== 'GET')).toEqual([]);
  });

  it('a user coming back sees the sides the Hub already holds as Done, without taking them again', async () => {
    fallback['GET /money/identity/documents'] = documents({ documents: [row('identity', 'uploaded', ['front', 'back']), row('proof_of_address', 'missing')] });
    const app = await idScreen();
    expect(await app.screen.findByLabelText('Front, Done')).toBeTruthy();
    expect(app.screen.getByLabelText('Back, Done')).toBeTruthy();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(false);
  });

  it('a user whose ID the bank did not accept is asked for new photos, not shown the old ones as done', async () => {
    fallback['GET /money/identity/documents'] = documents({ documents: [row('identity', 'needs_new', ['front', 'back']), row('proof_of_address', 'uploaded', ['front'])] });
    const app = await idScreen();
    expect(await app.screen.findByLabelText('Front, Tap to take a photo')).toBeTruthy();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(true);
  });

  it('a user before any details were sent still sees the step (the Hub has no documents to list yet)', async () => {
    fallback['GET /money/wallet'] = wallet({ review: null });
    fallback['GET /money/identity/documents'] = refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const app = await idScreen();
    expect(await app.screen.findByLabelText('Front, Tap to take a photo')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-id-error')).toBeNull();
  });

  it('a user is told a file is too big, in the size the server named, and nothing is kept', async () => {
    picks().pickIdPhoto.mockResolvedValueOnce(file('id-front.jpg', 'image/jpeg', 2 * 1024 * 1024));
    fallback['GET /money/identity/documents'] = documents({ maxBytes: 1024 * 1024 });
    const app = await idScreen();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-id-front'));
    expect(await app.screen.findByText('That file is too big')).toBeTruthy();
    expect(app.screen.getByText('Choose a file under 1 MB.')).toBeTruthy();
    expect(draft().readDraft(OWNER).idFront).toBeNull();
  });

  it('a user is sent on when the bank is already checking, and told when no documents are needed', async () => {
    fallback['GET /money/wallet'] = wallet({ state: 'opening', review: review('checking') });
    const checking = await idScreen();
    await rtl.waitFor(() => expect(checking.onChecking).toHaveBeenCalled());
    await rtl.cleanup();

    fallback['GET /money/wallet'] = wallet({ openingFlow: 'check', review: undefined });
    fallback['GET /money/identity/documents'] = documents({ required: false, open: false });
    const none = await idScreen();
    expect(await none.screen.findByText('Nothing to add here')).toBeTruthy();
    await none.fireEvent.press(none.screen.getByTestId('open-wallet-end-action'));
    expect(none.onLeave).toHaveBeenCalledTimes(1);
  });

  it('a user can retry when the step could not load, and the error says what the server said', async () => {
    fallback['GET /money/wallet'] = { status: 503, body: { statusCode: 503, message: 'The bank is not answering.', reason: { code: 'provider_unreachable', message: 'The bank is not answering.' } } };
    const app = await idScreen();
    expect(await app.screen.findByTestId('open-wallet-id-error')).toBeTruthy();
    expect(app.screen.getByText('The bank is not answering.')).toBeTruthy();
  });
});

async function addressScreen() {
  const { ProofOfAddressScreen } = require('../ProofOfAddressScreen') as typeof import('../ProofOfAddressScreen');
  const props = { onBack: jest.fn(), onSubmitted: jest.fn(), onChecking: jest.fn(), onOpened: jest.fn(), onDetails: jest.fn() };
  const app = await mount(<ProofOfAddressScreen {...props} />);
  return { ...app, ...props };
}

/** A passed BVN check kept in memory for the account (what A5 and A6 leave behind). */
function keepDetails(withAddress = true) {
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  const ticket = kept.ticketFor(OWNER);
  kept.keepCheck(ticket, {
    identity: {} as never,
    prefill: { firstName: 'Ada', lastName: 'Eze', dateOfBirth: '1994-03-14', gender: 'female' } as never,
    checkHandle: 'v1.handle',
  });
  if (withAddress) kept.keepAddress(ticket, { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
}

async function chooseProofType(app: { fireEvent: typeof rtl.fireEvent; screen: typeof rtl.screen }, value: 'utility_bill' | 'bank_statement') {
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-type'));
  await app.fireEvent.press(await app.screen.findByTestId(`open-wallet-proof-type-${value}`));
}

async function chooseIdType(app: { fireEvent: typeof rtl.fireEvent; screen: typeof rtl.screen }, value: 'international_passport' | 'drivers_license' | 'national_id') {
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-id-type'));
  await app.fireEvent.press(await app.screen.findByTestId(`open-wallet-id-type-${value}`));
}

function seedDraft(withId = true) {
  const d = draft();
  if (withId) {
    d.setIdSide(OWNER, 'front', file('id-front.jpg'));
    d.setIdSide(OWNER, 'back', file('id-back.jpg'));
  }
}

async function fillAndSubmit(app: Awaited<ReturnType<typeof addressScreen>>, address = '14 Admiralty Way, Lekki Phase 1, Lagos') {
  picks().pickProofFile.mockResolvedValueOnce(file('ikeja-electric-sep.pdf', 'application/pdf', 4096));
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-add'));
  expect(await app.screen.findByText('ikeja-electric-sep.pdf')).toBeTruthy();
  await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-address-field'), address);
  await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));
}

describe('A27 · Proof of address', () => {
  it('a user can add a bill and an address and submit: the ID goes first, then the bill, and no details are sent again', async () => {
    seedDraft();
    fallback['POST /money/identity/documents'] = documents();
    const app = await addressScreen();
    expect(await app.screen.findByTestId('open-wallet-address-submit')).toBeTruthy();
    await fillAndSubmit(app);
    await rtl.waitFor(() => expect(app.onSubmitted).toHaveBeenCalledTimes(1));
    const posts = sent.filter((s) => s.method === 'POST').map((s) => s.path);
    expect(posts).toEqual(['/api/hub/money/identity/documents', '/api/hub/money/identity/documents']);
    expect(calls('POST', '/money/wallet/open')).toHaveLength(0);
    // The ID's two sides go in ONE request (front as `file`, back as `file_back`); the bill is a request of its own.
    expect(appended.map((part) => `${part.key}:${part.name ?? part.value}`)).toEqual([
      'kind:identity',
      'file:id-front.jpg',
      'file_back:id-back.jpg',
      'kind:proof_of_address',
      'file:ikeja-electric-sep.pdf',
    ]);
    // Sent files are dropped from memory; the address stays for another try.
    expect(draft().readDraft(OWNER).idFront).toBeNull();
    expect(draft().readDraft(OWNER).proof).toBeNull();
  });

  it('a user with no opening yet has the details sent first, from the kept check, the address typed and the new fields', async () => {
    seedDraft();
    draft().setIdType(OWNER, 'international_passport');
    draft().setIdNumber(OWNER, ' A01234567 ');
    const kept = require('../keptCheck') as typeof import('../keptCheck');
    const ticket = kept.ticketFor(OWNER);
    kept.keepCheck(ticket, {
      identity: {} as never,
      prefill: { firstName: 'Ada', lastName: 'Eze', middleName: 'Ngozi', dateOfBirth: '1994-03-14', gender: 'female' } as never,
      checkHandle: 'v1.handle',
    });
    kept.keepAddress(ticket, { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
    fallback['GET /money/wallet'] = wallet({ review: null });
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    fallback['POST /money/identity/documents'] = documents();
    const app = await addressScreen();
    await chooseProofType(app, 'bank_statement');
    await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-postal'), ' 106104 ');
    await fillAndSubmit(app);
    await rtl.waitFor(() => expect(app.onSubmitted).toHaveBeenCalledTimes(1));
    const order = sent.filter((s) => s.method === 'POST').map((s) => s.path.replace('/api/hub', ''));
    expect(order).toEqual(['/money/wallet/open', '/money/identity/documents', '/money/identity/documents']);
    const body = JSON.parse(calls('POST', '/money/wallet/open')[0].body);
    expect(body).toEqual({
      firstName: 'Ada',
      lastName: 'Eze',
      middleName: 'Ngozi',
      dateOfBirth: '1994-03-14',
      gender: 'female',
      address: '14 Admiralty Way, Lekki Phase 1, Lagos',
      city: 'Lekki',
      state: 'Lagos',
      postalCode: '106104',
      idType: 'international_passport',
      idNumber: 'A01234567',
      proofOfAddressType: 'bank_statement',
    });
    // A passport has one side: the ID goes up as `kind` and `file`, with no `file_back`.
    expect(appended.map((part) => part.key)).toEqual(['kind', 'file', 'kind', 'file']);
    // The ID number is not kept once it is sent.
    expect(draft().readDraft(OWNER).idNumber).toBe('');
  });

  it('a user whose details are no longer held is sent to the step that collects them, with nothing sent', async () => {
    seedDraft();
    fallback['GET /money/wallet'] = wallet({ review: null });
    const app = await addressScreen();
    await chooseProofType(app, 'utility_bill');
    await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-postal'), '106104');
    await fillAndSubmit(app);
    expect(await app.screen.findByText('We need your details again')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-details'));
    expect(app.onDetails).toHaveBeenCalledTimes(1);
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
    expect(app.onSubmitted).not.toHaveBeenCalled();
  });

  it('a user whose file the bank refused sees the server sentence and stays here to choose another', async () => {
    seedDraft();
    fallback['POST /money/identity/documents'] = refusal(422, 'document_file_invalid', 'That file is not a PDF, a JPG or a PNG.');
    const app = await addressScreen();
    await fillAndSubmit(app);
    expect(await app.screen.findByText('That file is not a PDF, a JPG or a PNG.')).toBeTruthy();
    expect(app.onSubmitted).not.toHaveBeenCalled();
  });

  it('a user whose opening was already sent is taken on, not shown an error', async () => {
    seedDraft();
    fallback['POST /money/identity/documents'] = refusal(409, 'documents_closed', 'Your documents are with the bank.');
    const app = await addressScreen();
    await fillAndSubmit(app);
    await rtl.waitFor(() => expect(app.onSubmitted).toHaveBeenCalledTimes(1));
  });

  it('a user is asked for an address the Hub can take before anything is sent', async () => {
    seedDraft();
    const app = await addressScreen();
    picks().pickProofFile.mockResolvedValueOnce(file('bill.pdf', 'application/pdf'));
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-add'));
    await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-address-field'), '12');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
    // The reason is on screen: the button is never a silent dead end.
    expect(await app.screen.findByText('Enter your home address: street, town and state.')).toBeTruthy();
  });

  it('a user can take the bill back out and choose another', async () => {
    seedDraft();
    picks().pickProofFile.mockResolvedValueOnce(file('old.pdf', 'application/pdf'));
    const app = await addressScreen();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-add'));
    expect(await app.screen.findByText('old.pdf')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-proof-remove'));
    expect(await app.screen.findByTestId('open-wallet-proof-add')).toBeTruthy();
    expect(draft().readDraft(OWNER).proof).toBeNull();
  });
});

describe('Sending a file from the phone', () => {
  it('a phone sends each file by where its own copy is, with its name and type, never as raw bytes', async () => {
    const { Platform } = require('react-native') as typeof import('react-native');
    const { uploadDocument } = require('../api/documents') as typeof import('../api/documents');
    const original = Platform.OS;
    Platform.OS = 'android';
    fallback['POST /money/identity/documents'] = documents();
    try {
      await uploadDocument('identity', { ...file('id-front.jpg'), uri: 'file:///cache/id-front.jpg' }, { ...file('id-back.png', 'image/png'), uri: 'file:///cache/id-back.png' });
    } finally {
      Platform.OS = original;
    }
    expect(appended.map((p) => p.key)).toEqual(['kind', 'file', 'file_back']);
    expect(appended[1].part).toEqual({ uri: 'file:///cache/id-front.jpg', name: 'id-front.jpg', type: 'image/jpeg' });
    expect(appended[2].part).toEqual({ uri: 'file:///cache/id-back.png', name: 'id-back.png', type: 'image/png' });
    expect(calls('POST', '/money/identity/documents')).toHaveLength(1);
  });
});

describe('G-SWEEP-APP-6-1 · the documents are not asked for before the opening exists', () => {
  const asked = () => calls('GET', '/money/identity/documents');

  it('A26 with no details sent yet draws its step and never reads the documents (the Hub would refuse with 409)', async () => {
    fallback['GET /money/wallet'] = wallet({ review: null });
    fallback['GET /money/identity/documents'] = refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const app = await idScreen();
    expect(await app.screen.findByLabelText('Front, Tap to take a photo')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-id-error')).toBeNull();
    expect(asked()).toHaveLength(0);
  });

  it('A27 with no details sent yet draws its fields and never reads the documents', async () => {
    fallback['GET /money/wallet'] = wallet({ review: null });
    fallback['GET /money/identity/documents'] = refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const app = await addressScreen();
    expect(await app.screen.findByTestId('open-wallet-postal')).toBeTruthy();
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(asked()).toHaveLength(0);
  });

  it('A26 and A27 with an opening read the documents once each, for the limits and for what the Hub already holds', async () => {
    const id = await idScreen();
    await id.screen.findByLabelText('Front, Tap to take a photo');
    expect(asked()).toHaveLength(1);
    await rtl.cleanup();
    sent = [];
    const address = await addressScreen();
    await address.screen.findByTestId('open-wallet-address');
    await rtl.waitFor(() => expect(asked()).toHaveLength(1));
  });

  it('an older opening (the check, not the review) still reads the documents, so a wallet that takes none is told so', async () => {
    fallback['GET /money/wallet'] = wallet({ openingFlow: 'check', review: null });
    fallback['GET /money/identity/documents'] = documents({ required: false, open: false });
    const app = await idScreen();
    expect(await app.screen.findByText('Nothing to add here')).toBeTruthy();
    expect(asked()).toHaveLength(1);
  });
});

describe('A28 · Checking your details', () => {
  async function boot() {
    const { CheckingScreen } = require('../CheckingScreen') as typeof import('../CheckingScreen');
    const props = { onOpened: jest.fn(), onRejected: jest.fn(), onNeedsDocuments: jest.fn(), onLeave: jest.fn() };
    const app = await mount(<CheckingScreen {...props} />);
    return { ...app, ...props };
  }

  it('a user waiting sees Checking your details, and nothing moves while the bank is still checking', async () => {
    fallback['GET /money/wallet'] = wallet({ state: 'opening', review: review('checking') });
    const app = await boot();
    expect(await app.screen.findByText('Checking your details')).toBeTruthy();
    expect(app.screen.getByText('This usually takes a few minutes.')).toBeTruthy();
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(app.onOpened).not.toHaveBeenCalled();
    expect(app.onRejected).not.toHaveBeenCalled();
  });

  it('a user reaches Approved only when the Hub says the account number is active', async () => {
    fallback['GET /money/wallet'] = wallet({ state: 'opening', accountNumberStatus: 'on_its_way', review: review('approved') });
    const waiting = await boot();
    await waiting.screen.findByText('Checking your details');
    expect(waiting.onOpened).not.toHaveBeenCalled();
    await rtl.cleanup();
    fallback['GET /money/wallet'] = wallet({ state: 'open', accountNumberStatus: 'active', review: review('approved') });
    const done = await boot();
    await rtl.waitFor(() => expect(done.onOpened).toHaveBeenCalledTimes(1));
  });

  it('a user whose check was refused is taken to what to fix', async () => {
    fallback['GET /money/wallet'] = wallet({ review: review('rejected', { reasons: [{ code: 'id_document_not_verified', message: 'We could not verify your ID document.', fix: 'Upload a clear photo.' }], canResubmit: true }) });
    const app = await boot();
    await rtl.waitFor(() => expect(app.onRejected).toHaveBeenCalledTimes(1));
  });

  it('a user whose documents are asked for again is sent back to A26', async () => {
    fallback['GET /money/wallet'] = wallet({ review: review('needs_documents') });
    const app = await boot();
    await rtl.waitFor(() => expect(app.onNeedsDocuments).toHaveBeenCalledTimes(1));
  });

  it('checkingNext follows the Hub for every stage', () => {
    const { checkingNext } = require('../CheckingScreen') as typeof import('../CheckingScreen');
    const base = { flow: 'review' as const, accountNumberStatus: 'none' as const };
    const at = (state: 'not_open' | 'opening' | 'open' | 'frozen', stage: string | null, number: 'none' | 'on_its_way' | 'active' = 'none') =>
      checkingNext({ ...base, state, accountNumberStatus: number, review: stage === null ? null : (review(stage) as never) });
    expect(at('opening', 'checking')).toBeNull();
    expect(at('opening', 'approved', 'on_its_way')).toBeNull();
    expect(at('open', 'approved', 'active')).toBe('opened');
    expect(at('not_open', 'rejected')).toBe('rejected');
    expect(at('not_open', 'stopped')).toBe('rejected');
    expect(at('not_open', 'expired')).toBe('rejected');
    expect(at('not_open', 'needs_documents')).toBe('documents');
    expect(at('not_open', null)).toBe('documents');
  });
});

describe('A29 · Rejected', () => {
  async function boot(props: Partial<{ onUploadAgain: jest.Mock; onLeave: jest.Mock }> = {}) {
    const { RejectedScreen } = require('../RejectedScreen') as typeof import('../RejectedScreen');
    const all = { onUploadAgain: jest.fn(), onLeave: jest.fn(), onOpened: jest.fn(), onChecking: jest.fn(), ...props };
    const app = await mount(<RejectedScreen {...all} />);
    return { ...app, ...all };
  }
  const proofReason = { code: 'proof_of_address_not_verified', message: 'Your proof of address is older than 3 months.', fix: 'Upload a bill or statement from July or later' };
  const idReason = { code: 'id_document_not_verified', message: 'We could not verify your ID document.', fix: 'Upload a clear photo of an ID that has not expired.' };

  it("a user sees the Hub's reason and its fix, and Upload again goes to the proof of address when that was the reason", async () => {
    keepDetails();
    fallback['GET /money/wallet'] = wallet({ review: review('rejected', { reasons: [proofReason], canResubmit: true }) });
    const app = await boot();
    expect(await app.screen.findByText("We couldn't open your wallet")).toBeTruthy();
    expect(app.screen.getByText('Your proof of address is older than 3 months.')).toBeTruthy();
    expect(app.screen.getByText('What to do')).toBeTruthy();
    expect(app.screen.getByText('Upload a bill or statement from July or later')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByText('Upload again'));
    expect(app.onUploadAgain).toHaveBeenCalledWith('address');
  });

  it('Upload again goes to the ID document for an ID reason or a mix', async () => {
    keepDetails();
    fallback['GET /money/wallet'] = wallet({ review: review('rejected', { reasons: [proofReason, idReason], canResubmit: true }) });
    const app = await boot();
    await app.fireEvent.press(await app.screen.findByText('Upload again'));
    expect(app.onUploadAgain).toHaveBeenCalledWith('id');
    expect(app.screen.getByText(/Your proof of address is older than 3 months\. We could not verify your ID document\./)).toBeTruthy();
  });

  it('a user who cannot try again yet is not offered Upload again, and is told when from the Hub time', async () => {
    const at = new Date(Date.now() + 25 * 60_000).toISOString();
    fallback['GET /money/wallet'] = wallet({ review: review('rejected', { reasons: [idReason], canResubmit: false, canResubmitAt: at }) });
    const app = await boot();
    expect(await app.screen.findByTestId('open-wallet-rejected-wait')).toBeTruthy();
    expect(app.screen.queryByText('Upload again')).toBeNull();
    await app.fireEvent.press(app.screen.getByText('Done'));
    expect(app.onLeave).toHaveBeenCalledTimes(1);
  });

  it('uploadAgainTarget and resumeTarget follow the reasons and the stage', () => {
    const { uploadAgainTarget } = require('../RejectedScreen') as typeof import('../RejectedScreen');
    const { resumeTarget } = require('../ReviewResume') as typeof import('../ReviewResume');
    expect(uploadAgainTarget([])).toBe('id');
    expect(uploadAgainTarget([proofReason])).toBe('address');
    expect(uploadAgainTarget([proofReason, idReason])).toBe('id');
    const at = (flow: 'check' | 'review' | null, stage: string | null) =>
      resumeTarget({ state: 'not_open', flow, accountNumberStatus: 'none', review: stage === null ? null : (review(stage) as never) });
    expect(at('review', 'needs_documents')).toBe('documents');
    expect(at('review', 'checking')).toBe('checking');
    expect(at('review', 'approved')).toBe('checking');
    expect(at('review', 'rejected')).toBe('rejected');
    expect(at('review', 'stopped')).toBe('rejected');
    expect(at('review', null)).toBeNull();
    expect(at('check', 'checking')).toBeNull();
    expect(at(null, null)).toBeNull();
  });

  it('no screen of the last steps writes an em-dash', async () => {
    fallback['GET /money/wallet'] = wallet({ review: review('rejected', { reasons: [proofReason], canResubmit: true }) });
    const app = await boot();
    await app.screen.findByText('Upload again');
    expect(JSON.stringify(app.screen.toJSON())).not.toContain('—');
  });
});

describe('Round 2 · a rejected person can upload again (finding 1)', () => {
  const idReason = { code: 'id_document_not_verified', message: 'We could not verify your ID document.', fix: 'Upload a clear photo.' };
  const rejected = () => wallet({ review: review('rejected', { reasons: [idReason], canResubmit: true }) });

  it('after the app was closed, Upload again leads to the step that collects the details, never to a screen that bounces back', async () => {
    fallback['GET /money/wallet'] = rejected();
    const { RejectedScreen } = require('../RejectedScreen') as typeof import('../RejectedScreen');
    const props = { onUploadAgain: jest.fn(), onLeave: jest.fn(), onOpened: jest.fn(), onChecking: jest.fn() };
    const app = await mount(<RejectedScreen {...props} />);
    await app.fireEvent.press(await app.screen.findByText('Upload again'));
    expect(props.onUploadAgain).toHaveBeenCalledWith('details');
  });

  it('A27 under a refusal with no details held says so up front and leads to the details step, with nothing sent', async () => {
    fallback['GET /money/wallet'] = rejected();
    const app = await addressScreen();
    expect(await app.screen.findByText('We need your details again')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-proof-add')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onDetails).toHaveBeenCalledTimes(1);
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
  });

  it('A26 under a refusal with no details held says so up front too', async () => {
    fallback['GET /money/wallet'] = rejected();
    const app = await idScreen();
    expect(await app.screen.findByText('We need your details again')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-id-front')).toBeNull();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-end-action'));
    expect(app.onDetails).toHaveBeenCalledTimes(1);
  });

  it('with the details held, A27 sends them first and then the new documents', async () => {
    keepDetails();
    seedDraft();
    draft().setIdType(OWNER, 'national_id');
    draft().setIdNumber(OWNER, '12345678901');
    fallback['GET /money/wallet'] = rejected();
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    fallback['POST /money/identity/documents'] = documents();
    const app = await addressScreen();
    await chooseProofType(app, 'utility_bill');
    await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-postal'), '106104');
    await fillAndSubmit(app);
    await rtl.waitFor(() => expect(app.onSubmitted).toHaveBeenCalledTimes(1));
    const order = sent.filter((s) => s.method === 'POST').map((s) => s.path.replace('/api/hub', ''));
    expect(order).toEqual(['/money/wallet/open', '/money/identity/documents', '/money/identity/documents']);
  });

  it('the first step does not send a person who chose to add their details back to the review', async () => {
    const { ReviewResume } = require('../ReviewResume') as typeof import('../ReviewResume');
    fallback['GET /money/wallet'] = rejected();
    const { Text } = require('react-native') as typeof import('react-native');
    const props = { onDocuments: jest.fn(), onChecking: jest.fn(), onRejected: jest.fn(), fallback: <Text>waiting</Text> };
    const skipped = await mount(
      <ReviewResume {...props} skip>
        <Text>the first step</Text>
      </ReviewResume>,
    );
    expect(await skipped.screen.findByText('the first step')).toBeTruthy();
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(props.onRejected).not.toHaveBeenCalled();
    await rtl.cleanup();
    const resumed = await mount(
      <ReviewResume {...props}>
        <Text>the first step</Text>
      </ReviewResume>,
    );
    await rtl.waitFor(() => expect(props.onRejected).toHaveBeenCalledTimes(1));
    expect(resumed.screen.queryByText('the first step')).toBeNull();
  });
});

describe('Round 2 · the photos and the bill are dropped on every way out (finding 2)', () => {
  it('leaving the last screen that holds them drops them, whichever way the person left', async () => {
    const { useDraftLifetime } = require('../draft') as typeof import('../draft');
    const { Text } = require('react-native') as typeof import('react-native');
    function Holder({ label }: { label: string }) {
      useDraftLifetime();
      return <Text>{label}</Text>;
    }
    function Stack({ a, b }: { a: boolean; b: boolean }) {
      return (
        <>
          {a ? <Holder label="A26" /> : null}
          {b ? <Holder label="A27" /> : null}
        </>
      );
    }
    const settle = () =>
      rtl.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    draft().setIdSide(OWNER, 'front', file('id-front.jpg'));
    draft().setProof(OWNER, file('bill.pdf', 'application/pdf'));
    const view = await rtl.render(<Stack a b />);
    // Back from A27 to A26: A26 still holds them, so the photos stay.
    await view.rerender(<Stack a b={false} />);
    await settle();
    expect(draft().readDraft(OWNER).idFront).not.toBeNull();
    expect(draft().readDraft(OWNER).proof).not.toBeNull();
    // Back from A26 too: nothing holds them any more.
    await view.rerender(<Stack a={false} b={false} />);
    await settle();
    expect(draft().readDraft(OWNER).idFront).toBeNull();
    expect(draft().readDraft(OWNER).proof).toBeNull();
  });

  it('A26 and A27 hold them while they are on screen and let go when they close', async () => {
    seedDraft();
    const id = await idScreen();
    await id.screen.findByTestId('open-wallet-id-front');
    expect(draft().readDraft(OWNER).idFront).not.toBeNull();
    await rtl.cleanup();
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
    expect(draft().readDraft(OWNER).idFront).toBeNull();
    expect(draft().readDraft(OWNER).idBack).toBeNull();
  });

  it('a screen that is not part of the flow on top of A26 or A27 is a way out too', () => {
    const { leavesFlow } = require('../leave') as typeof import('../leave');
    expect(leavesFlow({ routes: [{ name: '(tabs)' }, { name: 'open-wallet-id' }] })).toBe(false);
    expect(leavesFlow({ routes: [{ name: '(tabs)' }, { name: 'open-wallet-id' }, { name: 'open-wallet-address' }] })).toBe(false);
    expect(leavesFlow({ routes: [{ name: '(tabs)' }, { name: 'open-wallet-id' }, { name: 'about' }] })).toBe(true);
    expect(leavesFlow({ routes: [{ name: '(tabs)' }] })).toBe(true);
  });
});

describe('Round 2 · the fields the open call needs (G-820)', () => {
  it('A26 asks for the ID type and number when the open call will carry them, and holds them for A27', async () => {
    keepDetails();
    picks().pickIdPhoto.mockResolvedValueOnce(file('id-front.jpg')).mockResolvedValueOnce(file('id-back.jpg'));
    fallback['GET /money/wallet'] = wallet({ review: null });
    fallback['GET /money/identity/documents'] = refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const app = await idScreen();
    await chooseIdType(app, 'drivers_license');
    expect(await app.screen.findByLabelText(/ID type, Driver/)).toBeTruthy();
    await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-id-number'), 'ab-12345');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-front'));
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-back'));
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-id-continue'));
    expect(app.onContinue).toHaveBeenCalledTimes(1);
    expect(draft().readDraft(OWNER)).toMatchObject({ idType: 'drivers_license', idNumber: 'ab-12345' });
  });

  it('A26 does not let a person go on with an ID number the Hub would refuse, and says which', async () => {
    keepDetails();
    picks().pickIdPhoto.mockResolvedValueOnce(file('id-front.jpg')).mockResolvedValueOnce(file('id-back.jpg'));
    fallback['GET /money/wallet'] = wallet({ review: null });
    fallback['GET /money/identity/documents'] = refusal(409, 'wallet_not_open', 'Open your wallet first.');
    const app = await idScreen();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-id-front'));
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-back'));
    await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-id-number'), '12');
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-id-continue'));
    expect(app.onContinue).not.toHaveBeenCalled();
    expect(await app.screen.findByText('Choose the type of your ID.')).toBeTruthy();
    expect(app.screen.getByText('Enter the number on your ID: 5 to 30 letters, numbers or dashes.')).toBeTruthy();
  });

  it('A26 shows no number field to a person the Hub already holds the details of', async () => {
    const app = await idScreen();
    expect(await app.screen.findByTestId('open-wallet-id-type')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-id-number')).toBeNull();
  });

  it('A27 shows no postal code or document type to a person the Hub already holds the details of', async () => {
    seedDraft();
    const app = await addressScreen();
    await app.screen.findByTestId('open-wallet-address-field');
    expect(app.screen.queryByTestId('open-wallet-postal')).toBeNull();
    expect(app.screen.queryByTestId('open-wallet-proof-type')).toBeNull();
  });

  it('A27 asks for the postal code and the document type before it sends the details, and says which is missing', async () => {
    keepDetails();
    seedDraft();
    draft().setIdType(OWNER, 'national_id');
    draft().setIdNumber(OWNER, '12345678901');
    fallback['GET /money/wallet'] = wallet({ review: null });
    const app = await addressScreen();
    await fillAndSubmit(app);
    expect(await app.screen.findByText('Choose the type of document.')).toBeTruthy();
    expect(app.screen.getByText('Enter your postal code: letters, numbers, spaces or dashes.')).toBeTruthy();
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
  });
});

describe('Round 2 · a passport has one side (G-822)', () => {
  it('with a passport chosen no back is asked for and Continue opens after the front', async () => {
    picks().pickIdPhoto.mockResolvedValueOnce(file('passport.jpg'));
    const app = await idScreen();
    expect(await app.screen.findByTestId('open-wallet-id-back')).toBeTruthy();
    await chooseIdType(app, 'international_passport');
    expect(app.screen.queryByTestId('open-wallet-id-back')).toBeNull();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(true);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-front'));
    expect(await app.screen.findByLabelText('Front, Done')).toBeTruthy();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(false);
  });

  it('choosing a passport after a back was taken drops the back, so it is never sent', async () => {
    seedDraft();
    const app = await idScreen();
    await chooseIdType(app, 'international_passport');
    expect(draft().readDraft(OWNER).idBack).toBeNull();
    expect(draft().readDraft(OWNER).idFront).not.toBeNull();
  });

  it('a person whose one-sided ID the Hub already holds is not asked for a back', async () => {
    fallback['GET /money/identity/documents'] = documents({ documents: [row('identity', 'uploaded', ['front']), row('proof_of_address', 'missing')] });
    const app = await idScreen();
    expect(await app.screen.findByLabelText('Front, Done')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-id-back')).toBeNull();
    expect(disabled(app.screen.getByTestId('open-wallet-id-continue'))).toBe(false);
  });
});

describe('Round 2 · the ends of the last steps (G-821, findings 4 and 6)', () => {
  it('A28 says it usually takes a few minutes', async () => {
    fallback['GET /money/wallet'] = wallet({ state: 'opening', review: review('checking') });
    const { CheckingScreen } = require('../CheckingScreen') as typeof import('../CheckingScreen');
    const props = { onOpened: jest.fn(), onRejected: jest.fn(), onNeedsDocuments: jest.fn(), onLeave: jest.fn() };
    const app = await mount(<CheckingScreen {...props} />);
    expect(await app.screen.findByText('This usually takes a few minutes.')).toBeTruthy();
    expect(app.screen.queryByText(/few moments/)).toBeNull();
  });

  it('A28 that could not load has a way out beside Try again', async () => {
    fallback['GET /money/wallet'] = { status: 503, body: { statusCode: 503, message: 'The bank is not answering.', reason: { code: 'provider_unreachable', message: 'The bank is not answering.' } } };
    const { CheckingScreen } = require('../CheckingScreen') as typeof import('../CheckingScreen');
    const props = { onOpened: jest.fn(), onRejected: jest.fn(), onNeedsDocuments: jest.fn(), onLeave: jest.fn() };
    const app = await mount(<CheckingScreen {...props} />);
    expect(await app.screen.findByTestId('open-wallet-checking-error')).toBeTruthy();
    expect(app.screen.getByText('Try again')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-checking-leave'));
    expect(props.onLeave).toHaveBeenCalledTimes(1);
  });

  it('A29 that could not load has a way out beside Try again', async () => {
    fallback['GET /money/wallet'] = { status: 503, body: { statusCode: 503, message: 'The bank is not answering.', reason: { code: 'provider_unreachable', message: 'The bank is not answering.' } } };
    const { RejectedScreen } = require('../RejectedScreen') as typeof import('../RejectedScreen');
    const props = { onUploadAgain: jest.fn(), onLeave: jest.fn(), onOpened: jest.fn(), onChecking: jest.fn() };
    const app = await mount(<RejectedScreen {...props} />);
    expect(await app.screen.findByTestId('open-wallet-rejected-error')).toBeTruthy();
    expect(app.screen.getByText('Try again')).toBeTruthy();
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-rejected-leave'));
    expect(props.onLeave).toHaveBeenCalledTimes(1);
  });

  it('A27 with a short address says why on Submit, and the error clears when it is fixed', async () => {
    seedDraft();
    const app = await addressScreen();
    await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-address-field'), '12');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));
    expect(await app.screen.findByText('Enter your home address: street, town and state.')).toBeTruthy();
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
  });

  it('A27 without a bill says that on Submit', async () => {
    seedDraft();
    const app = await addressScreen();
    await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-address-field'), '14 Admiralty Way, Lekki, Lagos');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));
    expect(await app.screen.findByText('Add your bill or statement')).toBeTruthy();
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
  });
});
