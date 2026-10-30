/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * OPEN-UPLOAD (29 Oct 2026): A27 on the phone when the opening is saved and the photos do not go up. The owner's Android
 * build showed "No connection" with nothing on the wire, and the postal code and the document type were gone afterwards.
 * Here the phone's files carry a `uri`, a `stillThere` check and a `discard`, as the pickers give them; the Hub is a
 * fetch that can fail the way a phone's does (a throw, no answer).
 */

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

type Reply = { status: number; body: unknown } | 'network';
type Sent = { method: string; path: string };

const OWNER = '00000000-0000-4000-8000-0000000000a1';
const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const row = (kind: string, state: string, sides: string[] = []) => ({ kind, state, sides, uploadedAt: null });
const documents = () =>
  ok({
    required: true,
    open: true,
    documents: [row('identity', 'confirming', ['front', 'back']), row('proof_of_address', 'confirming', ['front'])],
    selfie: 'not_used',
    submitted: false,
    submittedAt: null,
    waitingFor: [],
    maxBytes: 10485760,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
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

let sent: Sent[] = [];
let routes: Record<string, Reply[]> = {};
let fallback: Record<string, Reply> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  sent.push({ method: request.method, path });
  const key = `${request.method} ${path.replace(/^\/api\/hub/, '')}`;
  const answer = routes[key]?.shift() ?? fallback[key];
  if (!answer) throw new Error(`no answer for ${key}`);
  // What a phone does when the request never gets an answer.
  if (answer === 'network') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

/** A file the way the pickers hand it back on the phone: its bytes, its copy's uri, the check that the copy is there, and the way to delete it. */
function phoneFile(name: string, contentType = 'image/jpeg') {
  const state = { there: true, discards: 0 };
  return {
    state,
    file: {
      blob: new Blob([new Uint8Array(2048)], { type: contentType }),
      name,
      contentType,
      uri: `file:///data/user/0/app/cache/ImageManipulator/${name}`,
      stillThere: () => state.there,
      discard: () => {
        state.discards += 1;
      },
    },
  };
}

const clients: QueryClient[] = [];
async function mount(element: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{element}</SafeAreaProvider>
    </QueryClientProvider>,
  );
  return rtl;
}

const draft = () => require('../draft') as typeof import('../draft');
const picks = () => require('../documents/pick') as { pickIdPhoto: jest.Mock; pickProofFile: jest.Mock };
const posts = (path: string) => sent.filter((s) => s.method === 'POST' && s.path === `/api/hub${path}`);

beforeEach(() => {
  sent = [];
  routes = {};
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-a1');
  fallback = { 'GET /money/wallet': wallet({ review: null }), 'GET /money/identity/documents': documents() };
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
  clients.splice(0).forEach((client) => client.clear());
});

function keepDetails() {
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  const ticket = kept.ticketFor(OWNER);
  kept.keepCheck(ticket, {
    identity: {} as never,
    prefill: { firstName: 'Ada', lastName: 'Eze', dateOfBirth: '1994-03-14', gender: 'female' } as never,
    checkHandle: 'v1.handle',
  });
  kept.keepAddress(ticket, { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
}

async function addressScreen() {
  const { ProofOfAddressScreen } = require('../ProofOfAddressScreen') as typeof import('../ProofOfAddressScreen');
  const props = { onBack: jest.fn(), onSubmitted: jest.fn(), onChecking: jest.fn(), onOpened: jest.fn(), onDetails: jest.fn() };
  const app = await mount(<ProofOfAddressScreen {...props} />);
  return { ...app, ...props };
}

/** The ID's two sides and a bill held on the phone, the details kept, and the form filled in; Submit not pressed yet. */
async function fill(app: Awaited<ReturnType<typeof addressScreen>>) {
  const front = phoneFile('id-front.jpg');
  const back = phoneFile('id-back.jpg');
  const proof = phoneFile('proof-of-address.pdf', 'application/pdf');
  draft().setIdSide(OWNER, 'front', front.file);
  draft().setIdSide(OWNER, 'back', back.file);
  picks().pickProofFile.mockResolvedValueOnce(proof.file);
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-type'));
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-type-utility_bill'));
  await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-postal'), '106104');
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-add'));
  await app.screen.findByText('proof-of-address.pdf');
  await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-address-field'), 'Somewhere');
  return { front, back, proof };
}

describe('A27 · the opening is saved and the photos do not go up', () => {
  it('says the details are saved and the photos did not upload (never "No connection"), keeps what was typed on view, and offers Try again', async () => {
    keepDetails();
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    routes['POST /money/identity/documents'] = ['network', documents()];
    const app = await addressScreen();
    const files = await fill(app);

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));

    expect(await app.screen.findByText('Your details are saved')).toBeTruthy();
    expect(app.screen.getByText("Your photos didn't upload. Check your internet and tap Try again.")).toBeTruthy();
    expect(app.screen.queryByText(/No connection/)).toBeNull();
    // The postal code and the document type did not go: they stay, read only, with what was entered.
    expect(app.screen.getByTestId('open-wallet-postal').props.value).toBe('106104');
    expect(app.screen.getByTestId('open-wallet-postal').props.editable).toBe(false);
    expect(app.screen.getByLabelText(/Document type/)).toBeTruthy();
    expect(app.screen.getByText('Utility bill')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-address-field').props.value).toBe('Somewhere');
    expect(app.screen.getByText('Try again')).toBeTruthy();
    // The files stay alive for the next try: nothing deleted, all still held.
    expect([files.front.state.discards, files.back.state.discards, files.proof.state.discards]).toEqual([0, 0, 0]);
    expect(draft().readDraft(OWNER).idFront).toBe(files.front.file);
    expect(draft().readDraft(OWNER).proof).toBe(files.proof.file);
    expect(app.onSubmitted).not.toHaveBeenCalled();
  });

  it('Try again sends only the photos (the details are not sent twice), and the files are deleted once they are up', async () => {
    keepDetails();
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    routes['POST /money/identity/documents'] = ['network', documents(), documents()];
    const app = await addressScreen();
    const files = await fill(app);
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));
    await app.screen.findByText('Your details are saved');

    await app.fireEvent.press(app.screen.getByText('Try again'));

    await rtl.waitFor(() => expect(app.onSubmitted).toHaveBeenCalledTimes(1));
    expect(posts('/money/wallet/open')).toHaveLength(1);
    // The first try's ID upload failed; the second sends the ID, then the bill.
    expect(posts('/money/identity/documents')).toHaveLength(3);
    expect([files.front.state.discards, files.back.state.discards, files.proof.state.discards]).toEqual([1, 1, 1]);
  });

  it('keeps the Hub\'s own sentence about a refused file, and says beside it that the details are saved', async () => {
    keepDetails();
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    routes['POST /money/identity/documents'] = [{ status: 422, body: { statusCode: 422, message: 'That file is not a PDF, a JPG or a PNG.', reason: { code: 'document_file_invalid', message: 'That file is not a PDF, a JPG or a PNG.' } } }];
    const app = await addressScreen();
    await fill(app);

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));

    expect(await app.screen.findByText('That file is not a PDF, a JPG or a PNG.')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-address-saved')).toBeTruthy();
    expect(app.screen.getByText('Your details are saved.')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-postal').props.value).toBe('106104');
  });
});

describe('A27 · a photo the phone no longer holds', () => {
  it('asks for the ID photo again before anything is sent, in plain words, and never says "No connection"', async () => {
    keepDetails();
    const app = await addressScreen();
    const files = await fill(app);
    files.front.state.there = false;

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));

    expect(await app.screen.findByText('Take the photo of your ID again')).toBeTruthy();
    expect(app.screen.queryByText(/No connection/)).toBeNull();
    // Nothing went out, not even the details: the opening is not half made.
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
    // The photo that is gone is no longer held (the ID step shows it to be taken again); the others stay.
    expect(draft().readDraft(OWNER).idFront).toBeNull();
    expect(draft().readDraft(OWNER).idBack).toBe(files.back.file);
    expect(draft().readDraft(OWNER).proof).toBe(files.proof.file);
    expect(app.onSubmitted).not.toHaveBeenCalled();
  });

  it('asks for the bill again when that file is the one that is gone', async () => {
    keepDetails();
    const app = await addressScreen();
    const files = await fill(app);
    files.proof.state.there = false;

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));

    expect(await app.screen.findByText('Choose your bill or statement again')).toBeTruthy();
    expect(sent.filter((s) => s.method === 'POST')).toEqual([]);
    expect(await app.screen.findByTestId('open-wallet-proof-add')).toBeTruthy();
  });

  it('notices a photo lost while the details were going up, sends no file, and keeps the details on view', async () => {
    keepDetails();
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    const app = await addressScreen();
    const files = await fill(app);
    // The phone has it when Submit is pressed and has lost it by the time the details are in.
    let looks = 0;
    const real = files.front.file.stillThere;
    files.front.file.stillThere = () => (++looks > 1 ? false : real());

    await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));

    expect(await app.screen.findByText('Take the photo of your ID again')).toBeTruthy();
    expect(posts('/money/wallet/open')).toHaveLength(1);
    expect(posts('/money/identity/documents')).toHaveLength(0);
    expect(app.screen.getByTestId('open-wallet-postal').props.value).toBe('106104');
  });
});
