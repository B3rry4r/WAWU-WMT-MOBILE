/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * LEGAL-DOCS (owner, 26 Oct 2026): the Legal list of the owner's nine documents, and each one opening in the policy reader by its slug.
 * Public screens: no session is involved.
 */
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

/** The Hub's list in its own shape (`GET /policies`): the owner's order, a title and a date each, no text. */
const NINE = [
  { slug: 'privacy', title: 'PRIVACY POLICY: WHO MADE THIS? (WMT)', effectiveDate: '2026-10-26' },
  { slug: 'terms', title: 'TERMS OF SERVICE', effectiveDate: '2026-10-26' },
  { slug: 'cookies', title: 'COOKIE POLICY', effectiveDate: '2026-10-26' },
  { slug: 'creator-monetization', title: 'CREATOR MONETIZATION AGREEMENT', effectiveDate: '2026-10-26' },
  { slug: 'verification-refund', title: 'VERIFICATION AND REFUND POLICY', effectiveDate: '2026-10-26' },
  { slug: 'acceptable-use', title: 'ACCEPTABLE USE POLICY', effectiveDate: '2026-10-26' },
  { slug: 'partner-dpa', title: 'DATA PROCESSING AGREEMENT (DPA) FOR PARTNERS', effectiveDate: '2026-10-26' },
  { slug: 'community-guidelines', title: 'COMMUNITY GUIDELINES', effectiveDate: '2026-10-26' },
  { slug: 'disclaimer', title: 'DISCLAIMER', effectiveDate: '2026-10-26' },
];

async function bootList() {
  const { LegalDocumentsScreen } = require('../LegalDocumentsScreen') as typeof import('../LegalDocumentsScreen');
  const props = { onBack: jest.fn(), onOpen: jest.fn() };
  await render(<LegalDocumentsScreen {...props} />);
  return props;
}

async function bootPolicy(slug: import('../api').PolicySlug) {
  const { PolicyScreen } = require('../PolicyScreen') as typeof import('../PolicyScreen');
  const props = { onBack: jest.fn() };
  await render(<PolicyScreen slug={slug} {...props} />);
  return props;
}

beforeEach(() => {
  answers = {};
  sent = [];
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('The Legal list', () => {
  it('a person sees all nine documents by title, in the owner order, each with its date', async () => {
    answers['/policies'] = [ok({ items: NINE })];
    await bootList();
    for (const doc of NINE) expect(await rtl.screen.findByText(doc.title)).toBeTruthy();
    const order = NINE.map((doc) => doc.slug);
    const rows = rtl.screen.getAllByTestId(/^legal-document-/).map((node) => node.props.testID as string);
    expect(rows).toEqual(order.map((slug) => `legal-document-${slug}`));
    expect(rtl.screen.getAllByText('Updated 26 October 2026')).toHaveLength(9);
    expect(rtl.screen.getByText('Legal')).toBeTruthy();
    expect(sent).toEqual(['/policies']);
  });

  it('a person taps a document and it opens by its slug', async () => {
    answers['/policies'] = [ok({ items: NINE })];
    const props = await bootList();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('legal-document-partner-dpa'));
    expect(props.onOpen).toHaveBeenCalledWith('partner-dpa');
    await rtl.fireEvent.press(rtl.screen.getByTestId('legal-document-terms'));
    expect(props.onOpen).toHaveBeenLastCalledWith('terms');
  });

  it('draws only what the owner has published: two documents, two rows', async () => {
    answers['/policies'] = [ok({ items: NINE.slice(0, 2) })];
    await bootList();
    await rtl.screen.findByText('TERMS OF SERVICE');
    expect(rtl.screen.getAllByTestId(/^legal-document-/)).toHaveLength(2);
  });

  it('says so when nothing is published yet, and writes no wording of its own', async () => {
    answers['/policies'] = [ok({ items: [] })];
    await bootList();
    expect(await rtl.screen.findByTestId('legal-documents-empty')).toBeTruthy();
    expect(rtl.screen.getByText('Not available yet')).toBeTruthy();
    expect(rtl.screen.queryAllByTestId(/^legal-document-/)).toHaveLength(0);
  });

  it('shows No connection with Try again when the Hub cannot be reached, and Try again loads the list', async () => {
    answers['/policies'] = ['offline', ok({ items: NINE })];
    await bootList();
    expect(await rtl.screen.findByText('No connection')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByText('DISCLAIMER')).toBeTruthy();
  });

  it('draws no em-dash and no Fintava or Flutterwave word', async () => {
    answers['/policies'] = [ok({ items: NINE })];
    await bootList();
    await rtl.screen.findByText('DISCLAIMER');
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/—|Fintava|Flutterwave/);
  });
});

describe('One of the nine in the policy reader', () => {
  it('opens a document that is not Terms or Privacy by its slug, titled as the owner titled it, with its date and sections', async () => {
    answers['/policies/cookies'] = [
      ok({
        slug: 'cookies',
        available: true,
        title: 'COOKIE POLICY',
        effectiveDate: '2026-10-26',
        sections: [
          { heading: '1. WHAT ARE COOKIES?', body: 'Cookies are small text files.\n\nThey help us.' },
          { heading: '2. CONTACT', body: 'privacy@example.test' },
        ],
      }),
    ];
    await bootPolicy('cookies');
    expect(await rtl.screen.findByText('1. WHAT ARE COOKIES?')).toBeTruthy();
    expect(rtl.screen.getAllByText('COOKIE POLICY').length).toBeGreaterThan(0);
    expect(rtl.screen.getByText('Updated 26 October 2026')).toBeTruthy();
    expect(rtl.screen.getByText('Cookies are small text files.')).toBeTruthy();
    expect(rtl.screen.getByText('They help us.')).toBeTruthy();
    expect(sent).toEqual(['/policies/cookies']);
  });

  it('says "Not available yet" for a document the owner has not published, with no wording of its own', async () => {
    answers['/policies/disclaimer'] = [ok({ slug: 'disclaimer', available: false, title: null, effectiveDate: null, sections: [] })];
    await bootPolicy('disclaimer');
    expect(await rtl.screen.findByTestId('policy-disclaimer-unavailable')).toBeTruthy();
  });
});

describe('The route for one document', () => {
  it('knows the nine slugs and nothing else', () => {
    const { isPolicySlug, POLICY_SLUGS } = require('../api') as typeof import('../api');
    expect(POLICY_SLUGS).toHaveLength(9);
    for (const doc of NINE) expect(isPolicySlug(doc.slug)).toBe(true);
    for (const other of ['imprint', 'Terms', '', undefined, null, 5]) expect(isPolicySlug(other)).toBe(false);
  });
});
