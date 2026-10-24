/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * WALLET-41 round 3 (lead ruling): a person outside Nigeria who uses a passport says which country issued it, with the
 * profile's CountryPicker, prefilled with the country they live in, and it goes to the Hub as `nationality`.
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

type Reply = { status: number; body: unknown };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000c3';
const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const GEO = ok({
  items: [
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', exampleNumber: '', exampleNational: '', hasRegions: false },
    { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', exampleNumber: '', exampleNational: '', hasRegions: false },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', exampleNumber: '', exampleNational: '', hasRegions: true },
  ],
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
    review: null,
    ...over,
  });
const documents = () =>
  ok({
    required: true,
    open: true,
    documents: [
      { kind: 'identity', state: 'missing', sides: [], uploadedAt: null },
      { kind: 'proof_of_address', state: 'missing', sides: [], uploadedAt: null },
    ],
    selfie: 'not_used',
    submitted: false,
    submittedAt: null,
    waitingFor: ['identity', 'proof_of_address'],
    maxBytes: 10485760,
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  });

let sent: Sent[] = [];
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
  const answer = fallback[`${request.method} ${path.replace(/^\/api\/hub/, '')}`];
  if (!answer) throw new Error(`no answer for ${request.method} ${path}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const file = (name: string, contentType = 'image/jpeg', size = 2048) => ({ blob: new Blob([new Uint8Array(size)], { type: contentType }), name, contentType });

const clients: QueryClient[] = [];
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
const kept = () => require('../keptCheck') as typeof import('../keptCheck');
const calls = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === `/api/hub${path}`);

/** A person who lives in the United States, mid-way through opening (the details typed, the country and currency held). */
function holdWorld(country = 'US', currency: 'USD' | 'GBP' = 'USD') {
  const ticket = kept().ticketFor(OWNER);
  kept().keepWorld(ticket, { country, currency });
  kept().keepPerson(ticket, { firstName: 'Alex', lastName: 'Johnson', dateOfBirth: '1990-04-12', gender: 'male' }, { street: '', city: 'New York', state: 'New York' });
}

beforeEach(() => {
  sent = [];
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  fallback = { 'GET /money/wallet': wallet(), 'GET /geo/countries': GEO, 'GET /money/identity/documents': documents() };
  picks().pickIdPhoto.mockReset();
  picks().pickProofFile.mockReset();
  draft().forgetDraft();
  kept().forgetKeptCheck();
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
/** A26 and then A27 in one tree, as the flow has them, so what the person picked on the first is still held on the second. */
async function idThenProof() {
  const { IdDocumentScreen } = require('../IdDocumentScreen') as typeof import('../IdDocumentScreen');
  const { ProofOfAddressScreen } = require('../ProofOfAddressScreen') as typeof import('../ProofOfAddressScreen');
  const onSubmitted = jest.fn();
  const noop = jest.fn();
  function Flow() {
    const [step, setStep] = useState<'id' | 'proof'>('id');
    return step === 'id' ? (
      <IdDocumentScreen onBack={noop} onContinue={() => setStep('proof')} onChecking={noop} onOpened={noop} onLeave={noop} onDetails={noop} />
    ) : (
      <ProofOfAddressScreen onBack={noop} onSubmitted={onSubmitted} onChecking={noop} onOpened={noop} onDetails={noop} />
    );
  }
  const app = await mount(<Flow />);
  return { ...app, onSubmitted };
}

async function addressScreen() {
  const { ProofOfAddressScreen } = require('../ProofOfAddressScreen') as typeof import('../ProofOfAddressScreen');
  const props = { onBack: jest.fn(), onSubmitted: jest.fn(), onChecking: jest.fn(), onOpened: jest.fn(), onDetails: jest.fn() };
  const app = await mount(<ProofOfAddressScreen {...props} />);
  return { ...app, ...props };
}

/** Everything A26 and A27 hold before Submit, for a document of this type. */
function seedDraft(idType: 'international_passport' | 'drivers_license') {
  const d = draft();
  d.setIdSide(OWNER, 'front', file('id-front.jpg'));
  if (idType !== 'international_passport') d.setIdSide(OWNER, 'back', file('id-back.jpg'));
  d.setIdType(OWNER, idType);
  d.setIdNumber(OWNER, 'P123456789');
}

async function submitDetails(app: { fireEvent: typeof rtl.fireEvent; screen: typeof rtl.screen }) {
  picks().pickProofFile.mockResolvedValueOnce(file('bill.pdf', 'application/pdf', 4096));
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-type'));
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-type-utility_bill'));
  await app.fireEvent.changeText(await app.screen.findByTestId('open-wallet-postal'), '10024');
  await app.fireEvent.press(await app.screen.findByTestId('open-wallet-proof-add'));
  expect(await app.screen.findByText('bill.pdf')).toBeTruthy();
  await app.fireEvent.changeText(app.screen.getByTestId('open-wallet-address-field'), '210 West 77th Street');
  await app.fireEvent.press(app.screen.getByTestId('open-wallet-address-submit'));
}

describe('the passport country on the ID step', () => {
  it('a passport asks which country issued it, starting as the country the person lives in', async () => {
    holdWorld('US');
    draft().setIdType(OWNER, 'international_passport');
    const app = await idScreen();
    expect(await app.screen.findByLabelText('Country that issued your passport, United States')).toBeTruthy();
  });

  it('a driving licence or a national ID does not ask', async () => {
    holdWorld('US');
    draft().setIdType(OWNER, 'drivers_license');
    const app = await idScreen();
    expect(await app.screen.findByTestId('open-wallet-id-number')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-passport-country')).toBeNull();
    draft().setIdType(OWNER, 'national_id');
    expect(app.screen.queryByTestId('open-wallet-passport-country')).toBeNull();
  });

  it('a Nigerian opening does not ask', async () => {
    const ticket = kept().ticketFor(OWNER);
    kept().keepNumbers(ticket, { bvn: '22190000111', nin: '70190000999' });
    draft().setIdType(OWNER, 'international_passport');
    const app = await idScreen();
    expect(await app.screen.findByTestId('open-wallet-id-number')).toBeTruthy();
    expect(app.screen.queryByTestId('open-wallet-passport-country')).toBeNull();
  });

  it('opens the profile\'s country list, and a country picked from it is the one held', async () => {
    holdWorld('US');
    draft().setIdType(OWNER, 'international_passport');
    const app = await idScreen();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-passport-country'));
    const sheet = await app.screen.findByTestId('open-wallet-passport-country-sheet-list');
    expect(sheet).toBeTruthy();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-passport-country-sheet-row-GB'));
    expect(draft().readDraft(OWNER).passportCountry).toBe('GB');
    expect((await app.screen.findByTestId('open-wallet-passport-country')).props.accessibilityLabel).toBe('Country that issued your passport, United Kingdom');
  });
});

describe('the passport country on the wire', () => {
  it('the country picked in the list goes to the Hub as nationality, beside the country they live in', async () => {
    holdWorld('US');
    seedDraft('international_passport');
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    fallback['POST /money/identity/documents'] = documents();
    const app = await idThenProof();
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-passport-country'));
    await app.fireEvent.press(await app.screen.findByTestId('open-wallet-passport-country-sheet-row-GH'));
    expect(draft().readDraft(OWNER).passportCountry).toBe('GH');
    await app.fireEvent.press(app.screen.getByTestId('open-wallet-id-continue'));
    await submitDetails(app);
    await rtl.waitFor(() => expect(app.onSubmitted).toHaveBeenCalledTimes(1));
    const body = JSON.parse(calls('POST', '/money/wallet/open')[0].body);
    expect(body).toMatchObject({ countryCode: 'US', idType: 'international_passport', nationality: 'GH' });
    expect(body).not.toHaveProperty('bvn');
  });

  it('left as it starts, the country they live in goes as nationality', async () => {
    holdWorld('US');
    seedDraft('international_passport');
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    fallback['POST /money/identity/documents'] = documents();
    const proof = await addressScreen();
    await submitDetails(proof);
    await rtl.waitFor(() => expect(proof.onSubmitted).toHaveBeenCalledTimes(1));
    const body = JSON.parse(calls('POST', '/money/wallet/open')[0].body);
    expect(body).toMatchObject({ countryCode: 'US', idType: 'international_passport', nationality: 'US' });
  });

  it('a driving licence sends no nationality', async () => {
    holdWorld('US');
    seedDraft('drivers_license');
    fallback['POST /money/wallet/open'] = wallet({ review: review('needs_documents') });
    fallback['POST /money/identity/documents'] = documents();
    const proof = await addressScreen();
    await submitDetails(proof);
    await rtl.waitFor(() => expect(proof.onSubmitted).toHaveBeenCalledTimes(1));
    const body = JSON.parse(calls('POST', '/money/wallet/open')[0].body);
    expect(body).toMatchObject({ countryCode: 'US', idType: 'drivers_license' });
    expect(body).not.toHaveProperty('nationality');
  });
});
