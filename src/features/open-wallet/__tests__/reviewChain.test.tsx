/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * KYC-07: the review opening's chain from A31 to A26. Under it the Hub has no BVN check (it answers `step_not_used`),
 * so A31 holds the BVN and NIN in memory, the details step takes the name, and Submit sends them all in the open call.
 */
const mockVault = new Map<string, string>();
const mockStored: string[] = [];
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStored.push(`${key}=${value}`);
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

type Reply = { status: number; body: unknown };
type Sent = { method: string; path: string; body: string };

const OWNER = '00000000-0000-4000-8000-0000000000b7';
const BVN = '22190000111';
const NIN = '70190000999';
let sent: Sent[] = [];
let fallback: Record<string, Reply> = {};

const ok = (data: unknown): Reply => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const me = { wawuUserId: OWNER, phone: '+2348031234412', email: 'ada@example.com', firstName: 'Ada', lastName: 'Eze' };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  sent.push({ method: request.method, path, body: await request.clone().text() });
  const answer = fallback[`${request.method} ${path.replace(/^\/api\/hub/, '')}`];
  if (!answer) throw new Error(`no answer for ${request.method} ${path}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { OpenWalletScreen } = require('../OpenWalletScreen') as typeof import('../OpenWalletScreen');
const { ReviewDetailsForm } = require('../ReviewDetailsForm') as typeof import('../ReviewDetailsForm');
const kept = require('../keptCheck') as typeof import('../keptCheck');
const submit = require('../submit') as typeof import('../submit');
const person = require('../reviewDetails') as typeof import('../reviewDetails');

const clients: QueryClient[] = [];
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};

function serve(flow: 'review' | null) {
  fallback = {
    'GET /users/me': ok(me),
    'GET /money/wallet': ok(flow ? { state: 'not_open', openingFlow: flow, review: null, accountNumberStatus: 'none' } : { state: 'not_open' }),
    'GET /money/identity': ok({ bvn: null, ninLast4: null, occupation: null, checksLeft: 3 }),
  };
}

async function boot(child: (onContinue: jest.Mock, onClose: jest.Mock) => ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  const onClose = jest.fn();
  const onContinue = jest.fn();
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        {child(onContinue, onClose)}
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { ...rtl, onClose, onContinue };
}

beforeAll(async () => {
  const warm = await rtl.render(<></>);
  warm.unmount();
});

beforeEach(() => {
  sent = [];
  mockStored.length = 0;
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  kept.forgetKeptCheck();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A31 under the review opening', () => {
  it('Continue sends no BVN check, holds the two numbers in memory only, and goes on to the details step', async () => {
    serve('review');
    const logged = [jest.spyOn(console, 'log'), jest.spyOn(console, 'warn'), jest.spyOn(console, 'error'), jest.spyOn(console, 'info')];
    const app = await boot((onContinue, onClose) => <OpenWalletScreen onClose={onClose} onContinue={onContinue} />);
    await rtl.fireEvent.changeText(await app.screen.findByTestId('open-wallet-bvn'), BVN);
    await rtl.fireEvent.changeText(app.screen.getByTestId('open-wallet-nin'), NIN);
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));

    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(sent.filter((s) => s.method === 'POST')).toHaveLength(0);
    expect(kept.readNumbers(OWNER)).toEqual({ bvn: BVN, nin: NIN });
    expect(kept.readNumbers('someone-else')).toBeNull();
    // Never on the phone's storage or in the console.
    expect(mockStored.join('\n')).not.toContain(BVN);
    expect(mockStored.join('\n')).not.toContain(NIN);
    logged.forEach((spy) => {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(BVN);
      expect(JSON.stringify(spy.mock.calls)).not.toContain(NIN);
      spy.mockRestore();
    });
    // They go with every forget.
    kept.forgetKeptCheck();
    expect(kept.readNumbers(OWNER)).toBeNull();
  });

  it('KYC-07 L2: back from the next step the fields show only the last 4, Continue goes on with the held numbers, and touching a field empties both', async () => {
    serve('review');
    const app = await boot((onContinue, onClose) => <OpenWalletScreen onClose={onClose} onContinue={onContinue} />);
    await rtl.fireEvent.changeText(await app.screen.findByTestId('open-wallet-bvn'), BVN);
    await rtl.fireEvent.changeText(app.screen.getByTestId('open-wallet-nin'), NIN);
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    // A31 stays under A5: what Back shows is the masked numbers, not the digits.
    const shown = () => [app.screen.getByTestId('open-wallet-bvn').props.value, app.screen.getByTestId('open-wallet-nin').props.value] as string[];
    expect(shown()).toEqual([`•••• ••• ${BVN.slice(-4)}`, `•••• ••• ${NIN.slice(-4)}`]);
    expect(JSON.stringify(app.screen.toJSON())).not.toContain(BVN);
    expect(JSON.stringify(app.screen.toJSON())).not.toContain(NIN);
    // Continue again: on, with the numbers held, nothing typed again.
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(2));
    expect(kept.readNumbers(OWNER)).toEqual({ bvn: BVN, nin: NIN });
    // Touching a field: both are empty, to be typed again.
    await rtl.fireEvent(app.screen.getByTestId('open-wallet-bvn'), 'focus');
    expect(shown()).toEqual(['', '']);
  });

  it('a number that is not 11 digits is refused on the form and nothing is held', async () => {
    serve('review');
    const app = await boot((onContinue, onClose) => <OpenWalletScreen onClose={onClose} onContinue={onContinue} />);
    await rtl.fireEvent.changeText(await app.screen.findByTestId('open-wallet-bvn'), '2219');
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    expect(await app.screen.findByText('Enter the 11 digits of your BVN.')).toBeTruthy();
    expect(app.screen.getByText('Enter the 11 digits of your NIN.')).toBeTruthy();
    expect(kept.readNumbers(OWNER)).toBeNull();
    expect(app.onContinue).not.toHaveBeenCalled();
  });

  it('with an older Hub (no opening flow) Continue still runs the BVN check', async () => {
    serve(null);
    fallback['POST /money/identity/bvn'] = { status: 503, body: { statusCode: 503, message: 'No.', data: null, reason: { code: 'provider_unreachable', message: 'No.' } } };
    const app = await boot((onContinue, onClose) => <OpenWalletScreen onClose={onClose} onContinue={onContinue} />);
    await rtl.fireEvent.changeText(await app.screen.findByTestId('open-wallet-bvn'), BVN);
    await rtl.fireEvent.changeText(app.screen.getByTestId('open-wallet-nin'), NIN);
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-continue'));
    await rtl.waitFor(() => expect(sent.filter((s) => s.method === 'POST' && s.path.endsWith('/money/identity/bvn'))).toHaveLength(1));
    expect(kept.readNumbers(OWNER)).toBeNull();
  });
});

describe('the details step under the review opening', () => {
  const held = () => {
    const ticket = kept.ticketFor(OWNER);
    expect(kept.keepNumbers(ticket, { bvn: BVN, nin: NIN })).toBe(true);
    return { ticket, view: { numbers: { bvn: BVN, nin: NIN }, person: null, address: null } };
  };

  it('asks for the name, date of birth, gender, town and state, says what is missing, and keeps what is typed beside the numbers', async () => {
    const { view } = held();
    const app = await boot((onContinue, onClose) => <ReviewDetailsForm owner={OWNER} held={view} onBack={onClose} onContinue={onContinue} />);
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));
    expect(app.screen.getByText('Enter your first name.')).toBeTruthy();
    expect(app.screen.getByText('Enter your last name.')).toBeTruthy();
    expect(app.screen.getByText('Enter your date of birth.')).toBeTruthy();
    expect(app.screen.getByText('Choose your gender.')).toBeTruthy();
    expect(app.screen.getByText('Enter your city or town.')).toBeTruthy();
    expect(app.screen.getByText('Choose your state.')).toBeTruthy();
    expect(app.screen.getByText('Tick the box to agree before you continue.')).toBeTruthy();
    expect(app.onContinue).not.toHaveBeenCalled();

    await rtl.fireEvent.changeText(app.screen.getByTestId('open-wallet-first-name'), 'Ada');
    await rtl.fireEvent.changeText(app.screen.getByTestId('open-wallet-last-name'), 'Eze');
    await rtl.fireEvent.changeText(app.screen.getByTestId('open-wallet-birth'), '04101992');
    expect(app.screen.getByTestId('open-wallet-birth').props.value).toBe('04/10/1992');
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-gender'));
    await rtl.fireEvent.press(await app.screen.findByTestId('open-wallet-gender-female'));
    await rtl.fireEvent.changeText(app.screen.getByTestId('open-wallet-city'), 'Ikeja');
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-state'));
    await rtl.fireEvent.press(await app.screen.findByText('Lagos'));
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-consent'));
    await rtl.fireEvent.press(app.screen.getByTestId('open-wallet-details-continue'));

    expect(app.onContinue).toHaveBeenCalledTimes(1);
    expect(kept.readPerson(OWNER)).toEqual({ firstName: 'Ada', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' });
    expect(kept.readAddress(OWNER)).toEqual({ street: '', city: 'Ikeja', state: 'Lagos' });
    expect(sent.filter((s) => s.method !== 'GET')).toHaveLength(0);
  });

  it('Submit gets the whole open call from what is held: the numbers and the typed details, never a check handle', async () => {
    held();
    expect(submit.keptDetailsHeld(OWNER)).toBe(false);
    expect(kept.keepPerson(kept.ticketFor(OWNER), { firstName: 'Ada', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' }, { street: '', city: 'Ikeja', state: 'Lagos' })).toBe(true);
    expect(submit.keptDetailsHeld(OWNER)).toBe(true);
    const body = submit.detailsFromKept(OWNER, { address: '14 Admiralty Way', postalCode: '106104', idType: 'drivers_license', idNumber: 'ABC12345', proofType: 'utility_bill' });
    expect(body).toEqual({
      firstName: 'Ada',
      lastName: 'Eze',
      dateOfBirth: '1992-10-04',
      gender: 'female',
      address: '14 Admiralty Way',
      postalCode: '106104',
      idType: 'drivers_license',
      idNumber: 'ABC12345',
      proofOfAddressType: 'utility_bill',
      city: 'Ikeja',
      state: 'Lagos',
      bvn: BVN,
      nin: NIN,
    });
    expect(body).not.toHaveProperty('checkHandle');
    kept.forgetKeptCheck();
    expect(submit.keptDetailsHeld(OWNER)).toBe(false);
    expect(submit.detailsFromKept(OWNER, { address: 'x', postalCode: '', idType: null, idNumber: '', proofType: null })).toBeNull();
  });

  it('a ticket from before a forget cannot hold anything', () => {
    const ticket = kept.ticketFor(OWNER);
    kept.forgetKeptCheck();
    expect(kept.keepNumbers(ticket, { bvn: BVN, nin: NIN })).toBe(false);
    expect(kept.readNumbers(OWNER)).toBeNull();
  });
});

describe('the typed details', () => {
  it('reads a date of birth as day, month and year and refuses one that is not real or not yet', () => {
    const now = new Date('2026-10-17T10:00:00Z');
    expect(person.groupBirth('14031994')).toBe('14/03/1994');
    expect(person.birthToIso('04/10/1992', now)).toBe('1992-10-04');
    expect(person.birthToIso('31/02/1992', now)).toBeNull();
    expect(person.birthToIso('04/10/2027', now)).toBeNull();
    expect(person.birthToIso('04/10/1899', now)).toBeNull();
    expect(person.isoToBirth('1992-10-04')).toBe('04/10/1992');
  });

  it('accepts names the open call accepts and refuses digits and symbols', () => {
    const now = new Date('2026-10-17T10:00:00Z');
    const good = { firstName: "N'gozi-Ada", lastName: 'Ọkọ', birth: '04/10/1992', gender: 'female' as const };
    expect(person.personProblems(good, now)).toEqual({});
    expect(person.personProblems({ ...good, firstName: 'Ada1' }, now).firstName).toBe('Use letters only for your first name.');
    expect(person.personProblems({ ...good, lastName: '<b>' }, now).lastName).toBe('Use letters only for your last name.');
  });
});

describe('R-95 · Powered by Nuvion on the details step under the review opening', () => {
  const about = (bankName: string): Reply => ok({ bankName, licenceLine: null, supportEmail: null });
  const aboutAsked = () => sent.filter((s) => s.method === 'GET' && s.path.endsWith('/about')).length;
  // The line reads the Hub's /about through the app's own query client, which keeps the answer for minutes: each test starts it empty.
  const emptyAppClient = () => (require('@/api/query') as typeof import('@/api/query')).queryClient.clear();
  // The route component, not the form: a held review is what makes A5 draw ReviewDetailsForm in place of its own form.
  const renderConfirmDetails = () => {
    const { ConfirmDetailsScreen } = require('../ConfirmDetailsScreen') as typeof import('../ConfirmDetailsScreen');
    expect(kept.keepNumbers(kept.ticketFor(OWNER), { bvn: BVN, nin: NIN })).toBe(true);
    return boot((onContinue, onClose) => (
      <ConfirmDetailsScreen onBack={onClose} onContinue={onContinue} onRestart={jest.fn()} onLeave={jest.fn()} />
    ));
  };

  it('draws the line once under a Nuvion /about', async () => {
    emptyAppClient();
    serve('review');
    fallback['GET /about'] = about('Nuvion');
    const app = await renderConfirmDetails();
    expect(await app.screen.findByTestId('open-wallet-details')).toBeTruthy();
    expect(app.screen.getByTestId('open-wallet-first-name')).toBeTruthy();
    expect(await app.screen.findByText('Powered by Nuvion')).toBeTruthy();
    expect(app.screen.getAllByText('Powered by Nuvion')).toHaveLength(1);
  });

  it('draws nothing under another bank', async () => {
    emptyAppClient();
    serve('review');
    fallback['GET /about'] = about('Loma Bank');
    const app = await renderConfirmDetails();
    expect(await app.screen.findByTestId('open-wallet-details')).toBeTruthy();
    await rtl.waitFor(() => expect(aboutAsked()).toBe(1));
    expect(app.screen.queryByText('Powered by Nuvion')).toBeNull();
  });
});
