/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

let mockConfig: { version?: string } | null = { version: '9.8.7' };
jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return mockConfig; } } }));

const mockOpen = jest.fn<Promise<boolean>, [string]>();
const mockRate = jest.fn<string | null, []>();
jest.mock('../links', () => ({
  ...jest.requireActual('../links'),
  openLink: (url: string) => mockOpen(url),
  rateUrl: () => mockRate(),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  sent.push(path);
  const answer = answers[path]?.[0];
  if (answers[path] && answers[path].length > 1) answers[path].shift();
  if (!answer) throw new Error(`no answer for ${path}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const clients: QueryClient[] = [];

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

const about = { bankName: 'Test Bank', licenceLine: 'Licence line the owner wrote', supportEmail: 'help@example.test' };

async function bootAbout() {
  const { AboutScreen } = require('../AboutScreen') as typeof import('../AboutScreen');
  const props = { onBack: jest.fn(), onOpenTerms: jest.fn(), onOpenPrivacy: jest.fn() };
  await render(<AboutScreen {...props} />);
  return props;
}

async function bootPolicy(slug: 'terms' | 'privacy', withOther = false) {
  const { PolicyScreen } = require('../PolicyScreen') as typeof import('../PolicyScreen');
  const props = { onBack: jest.fn(), onOpenOther: withOther ? jest.fn() : undefined };
  await render(<PolicyScreen slug={slug} {...props} />);
  return props;
}

beforeEach(() => {
  mockConfig = { version: '9.8.7' };
  answers = {};
  sent = [];
  mockOpen.mockReset().mockResolvedValue(true);
  mockRate.mockReset().mockReturnValue('https://play.google.com/store/apps/details?id=test.app');
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('Z9 · About', () => {
  it('shows the app version from the app config, and the bank, licence line and support address the Hub serves', async () => {
    answers['/about'] = [ok(about)];
    await bootAbout();
    expect(await rtl.screen.findByText('Banking by Test Bank')).toBeTruthy();
    expect(rtl.screen.getByText('Licence line the owner wrote')).toBeTruthy();
    expect(rtl.screen.getByText('help@example.test')).toBeTruthy();
    expect(rtl.screen.getByText('About Who Made This?')).toBeTruthy();
    expect(rtl.screen.getByText('Version 9.8.7')).toBeTruthy();
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/WAWU|Fintava|CBN|Flutterwave|—/);
  });

  it('shows no version line when the build carries none', async () => {
    mockConfig = null;
    answers['/about'] = [ok(about)];
    await bootAbout();
    await rtl.screen.findByText('Banking by Test Bank');
    expect(rtl.screen.queryByTestId('about-version')).toBeNull();
  });

  it('leaves the licence line out when the owner has not filled it in', async () => {
    answers['/about'] = [ok({ ...about, licenceLine: null })];
    await bootAbout();
    expect(await rtl.screen.findByText('Banking by Test Bank')).toBeTruthy();
    expect(rtl.screen.queryByTestId('about-licence')).toBeNull();
  });

  it('DV2-06 · shows "Banking by Nuvion" from the Hub, and draws no licence, CBN, tier or "held at" line while the owner has not confirmed one', async () => {
    answers['/about'] = [ok({ bankName: 'Nuvion', licenceLine: null, supportEmail: 'help@example.test' })];
    await bootAbout();
    expect(await rtl.screen.findByText('Banking by Nuvion')).toBeTruthy();
    expect(rtl.screen.queryByTestId('about-licence')).toBeNull();
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/CBN|[Ll]icen[cs]e|Tier|held at|WAWU|—/);
  });

  it.each(['', '   '])('DV2-06 · a blank licence line (%j) counts as empty and is not drawn', async (blank) => {
    answers['/about'] = [ok({ bankName: 'Nuvion', licenceLine: blank, supportEmail: null })];
    await bootAbout();
    expect(await rtl.screen.findByText('Banking by Nuvion')).toBeTruthy();
    expect(rtl.screen.queryByTestId('about-licence')).toBeNull();
  });

  it('DV2-06 · draws no "Banking by" row while the Hub has no bank name (the Nuvion name is not set yet)', async () => {
    answers['/about'] = [ok({ bankName: '  ', licenceLine: 'A line', supportEmail: 'help@example.test' })];
    await bootAbout();
    expect(await rtl.screen.findByText('Contact support')).toBeTruthy();
    expect(rtl.screen.queryByTestId('about-bank')).toBeNull();
    expect(rtl.screen.queryByText(/Banking by/)).toBeNull();
  });

  it('DV2-06 · names the app with its question mark in the title and the description (R-69)', async () => {
    answers['/about'] = [ok({ bankName: 'Nuvion', licenceLine: null, supportEmail: null })];
    await bootAbout();
    await rtl.screen.findByText('Banking by Nuvion');
    expect(rtl.screen.getByText('About Who Made This?')).toBeTruthy();
    expect(rtl.screen.getByText('Who Made This? helps African creators and professionals get paid for what they know.')).toBeTruthy();
  });

  it('a user can contact support: the mail app opens on the support address', async () => {
    answers['/about'] = [ok(about)];
    await bootAbout();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-support'));
    expect(mockOpen).toHaveBeenCalledWith('mailto:help@example.test');
    expect(rtl.screen.queryByTestId('about-problem')).toBeNull();
  });

  it('says so when no mail app opens, and keeps the address on screen', async () => {
    answers['/about'] = [ok(about)];
    mockOpen.mockResolvedValue(false);
    await bootAbout();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-support'));
    expect(await rtl.screen.findByTestId('about-problem')).toBeTruthy();
    expect(rtl.screen.getByText('help@example.test')).toBeTruthy();
  });

  it('wraps a long licence line and a long support address whole and lets them be selected, so a large font never cuts them', async () => {
    answers['/about'] = [ok({ ...about, licenceLine: 'L'.repeat(300), supportEmail: `${'a'.repeat(60)}@example.test` })];
    await bootAbout();
    for (const id of ['about-licence', 'about-support-address']) {
      const line = await rtl.screen.findByTestId(id);
      expect(line.props.numberOfLines).toBeUndefined();
      expect(line.props.selectable).toBe(true);
    }
  });

  it('wraps every row title whole, so "Privacy policy" and "Contact support" are never cut with an ellipsis at a large font', async () => {
    answers['/about'] = [ok(about)];
    await bootAbout();
    await rtl.screen.findByText('Banking by Test Bank');
    for (const title of ['Contact support', 'Rate the app', 'Terms', 'Privacy policy', 'Banking by Test Bank']) {
      expect(rtl.screen.getByText(title).props.numberOfLines).toBeUndefined();
    }
  });

  it('without a support address the row says it is not available and opens nothing', async () => {
    answers['/about'] = [ok({ ...about, supportEmail: null })];
    await bootAbout();
    await rtl.screen.findByText('Banking by Test Bank');
    expect(rtl.screen.getByText('Not available yet')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('about-support'));
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it('a user can rate the app: the store page opens', async () => {
    answers['/about'] = [ok(about)];
    await bootAbout();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-rate'));
    expect(mockOpen).toHaveBeenCalledWith('https://play.google.com/store/apps/details?id=test.app');
  });

  it('shows no Rate the app row where there is no store page to open', async () => {
    mockRate.mockReturnValue(null);
    answers['/about'] = [ok(about)];
    await bootAbout();
    await rtl.screen.findByText('Banking by Test Bank');
    expect(rtl.screen.queryByTestId('about-rate')).toBeNull();
  });

  it('a user can open the Terms and the Privacy policy from here', async () => {
    answers['/about'] = [ok(about)];
    const props = await bootAbout();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-terms'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('about-privacy'));
    expect(props.onOpenTerms).toHaveBeenCalledTimes(1);
    expect(props.onOpenPrivacy).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state, then an offline state that retries into the page', async () => {
    answers['/about'] = ['offline', ok(about)];
    await bootAbout();
    expect(await rtl.screen.findByTestId('about-error')).toBeTruthy();
    expect(rtl.screen.getByText('No connection')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByText('Banking by Test Bank')).toBeTruthy();
  });

  it('the back button goes back', async () => {
    answers['/about'] = [ok(about)];
    const props = await bootAbout();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('about-back'));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});

const terms = {
  slug: 'terms',
  available: true,
  title: 'Terms',
  effectiveDate: '2026-09-01',
  sections: [
    { heading: 'Heading one', body: 'First paragraph.\n\nSecond paragraph.' },
    { heading: 'Heading two', body: 'Only paragraph.' },
  ],
};

describe('Z10 · Terms and Z11 · Privacy policy', () => {
  it('a user can read the owner\'s text with its date, paragraph by paragraph', async () => {
    answers['/policies/terms'] = [ok(terms)];
    await bootPolicy('terms');
    expect(await rtl.screen.findByText('Heading one')).toBeTruthy();
    expect(rtl.screen.getByText('Updated 1 September 2026')).toBeTruthy();
    expect(rtl.screen.getByText('First paragraph.')).toBeTruthy();
    expect(rtl.screen.getByText('Second paragraph.')).toBeTruthy();
    expect(rtl.screen.getByText('Heading two')).toBeTruthy();
    expect(sent).toEqual(['/policies/terms']);
  });

  it('reads the privacy policy from its own document', async () => {
    answers['/policies/privacy'] = [ok({ ...terms, slug: 'privacy', title: 'Privacy policy' })];
    await bootPolicy('privacy');
    expect(await rtl.screen.findByText('Heading one')).toBeTruthy();
    expect(rtl.screen.getByText('Privacy policy')).toBeTruthy();
    expect(sent).toEqual(['/policies/privacy']);
  });

  it('says it is not available yet, and shows no wording, until the owner has filled it in', async () => {
    answers['/policies/terms'] = [ok({ slug: 'terms', available: false, title: null, effectiveDate: null, sections: [] })];
    await bootPolicy('terms');
    expect(await rtl.screen.findByTestId('policy-terms-unavailable')).toBeTruthy();
    expect(rtl.screen.getByText('Not available yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('policy-updated')).toBeNull();
    expect(rtl.screen.queryByTestId('policy-section-0')).toBeNull();
  });

  it('DV2-06 · until the owner confirms the words, the Terms screen draws no provider, licence or tier line of its own', async () => {
    answers['/policies/terms'] = [ok({ slug: 'terms', available: false, title: null, effectiveDate: null, sections: [] })];
    await bootPolicy('terms');
    await rtl.screen.findByTestId('policy-terms-unavailable');
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/Nuvion|CBN|[Ll]icen[cs]e|Tier|held at|WAWU|—/);
  });

  it('shows a loading state while the text is on its way', async () => {
    answers['/policies/terms'] = ['hold'];
    await bootPolicy('terms');
    expect(rtl.screen.getByTestId('policy-terms-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('policy-terms-error')).toBeNull();
  });

  it('shows an error with Try again when the Hub cannot be reached', async () => {
    answers['/policies/terms'] = ['offline', ok(terms)];
    await bootPolicy('terms');
    expect(await rtl.screen.findByTestId('policy-terms-error')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByText('Heading one')).toBeTruthy();
  });

  it('a user can go from the Terms to the Privacy policy', async () => {
    answers['/policies/terms'] = [ok(terms)];
    const props = await bootPolicy('terms', true);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('policy-open-privacy'));
    expect(props.onOpenOther).toHaveBeenCalledTimes(1);
  });

  it('the Privacy policy has no onward link', async () => {
    answers['/policies/privacy'] = [ok({ ...terms, slug: 'privacy' })];
    await bootPolicy('privacy');
    await rtl.screen.findByText('Heading one');
    expect(rtl.screen.queryByTestId('policy-open-privacy')).toBeNull();
  });
});
