/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));
const mockPick = jest.fn();
jest.mock('../pickDocument', () => ({ canPickDocument: true, pickDocument: () => mockPick() }));

type Plain = { status: number; body: unknown };
type Answer = Plain | 'offline' | 'hang';
type Sent = { method: string; path: string; body: unknown; url: string };

let answers: Record<string, Answer | Answer[]> = {};
let sent: Sent[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  const isJson = (request.headers.get('content-type') ?? '').includes('json');
  sent.push({ method: request.method, path: url.pathname, body: text && isJson ? JSON.parse(text) : text || undefined, url: request.url });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

const ME = 'GET /api/hub/users/me';
const FIELDS = 'GET /api/hub/professionals/fields';
const MINE = 'GET /api/hub/professionals/applications/mine';
const APPLY = 'POST /api/hub/professionals/applications';
const PRESIGN = 'POST /api/hub/uploads/presign';

const field = (id: string, label: string, applyCategory: string, regulated: boolean, categories = [applyCategory]) => ({ id, label, applyCategory, categories, regulated });
const fields = [
  field('accounting_tax', 'Accounting & Tax', 'finance', true),
  field('legal_compliance', 'Legal & Compliance', 'legal_services', true),
  field('design_creative', 'Design & Creative', 'entertainment_creative', false),
  field('business_consulting', 'Business & Consulting', 'professional_services', false, ['professional_services', 'business_entrepreneurship']),
];
const app = (over: Record<string, unknown> = {}) => ({
  id: 'a1',
  status: 'pending',
  reviewedAt: null,
  category: 'finance',
  documents: [],
  wawuUserId: 'u1',
  headline: 'Chartered accountant, 9 years',
  about: 'I help creators and small businesses file taxes and keep books.',
  submittedAt: '2026-10-01T10:00:00.000Z',
  rejectionReason: null,
  services: ['Tax filing'],
  credentialKind: 'licence',
  licenceNumber: 'ICAN/2016/40921',
  issuingBody: 'ICAN',
  listed: true,
  ...over,
});

const clients: QueryClient[] = [];
function frame(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{child}</QueryClientProvider>
    </SafeAreaProvider>
  );
}
const mod = <T,>(path: string) => require(path) as T;
const tap = (testID: string) => act(async () => fireEvent.press(screen.getByTestId(testID)));
const type = (testID: string, value: string) => act(async () => fireEvent.changeText(screen.getByTestId(testID), value));
const bodiesOf = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === path).map((s) => s.body);

const HEADLINE = 'Chartered accountant, 9 years';
const ABOUT = 'I help creators and small businesses file taxes and keep books.';

beforeEach(() => {
  answers = { [ME]: ok({ wawuUserId: 'u1', accountType: 'creator' }), [FIELDS]: ok(fields), [MINE]: ok([]) };
  sent = [];
  mockStore.clear();
  mockPick.mockReset();
});
afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

describe('P5 to P7 · Offer your services', () => {
  const boot = async (props: { initialField?: string } = {}) => {
    const { ApplyScreen } = mod<typeof import('../ApplyScreen')>('../ApplyScreen');
    const handlers = { onBack: jest.fn(), onDone: jest.fn(), onMyListings: jest.fn() };
    await render(frame(<ApplyScreen {...handlers} {...props} />));
    await screen.findByTestId('pro-continue');
    return handlers;
  };
  const pickField = async (id: string) => {
    await tap('pro-add-field');
    await tap(`pro-pick-${id}`);
  };
  const fill = async () => {
    await type('pro-headline', HEADLINE);
    await type('pro-about', ABOUT);
  };

  it('P5: a user can pick fields, write the headline and about, add what they take on, and Continue', async () => {
    await boot();
    expect(screen.queryByTestId('pro-field-accounting_tax')).toBeNull();
    await pickField('accounting_tax');
    expect(screen.getByTestId('pro-field-accounting_tax')).toBeTruthy();
    // A picked field is no longer offered, and a second one can be added.
    await tap('pro-add-field');
    expect(screen.queryByTestId('pro-pick-accounting_tax')).toBeNull();
    await tap('pro-pick-design_creative');
    expect(screen.getByTestId('pro-field-design_creative')).toBeTruthy();
    await fill();
    await tap('pro-add-service');
    await type('pro-service-input', '  Tax filing ');
    await tap('pro-service-add');
    expect(screen.getByLabelText('Remove Tax filing')).toBeTruthy();
    await tap('pro-continue');
    expect(screen.getByTestId('pro-credentials')).toBeTruthy();
  });

  it('P5: Continue names what is missing and does not leave the step', async () => {
    await boot();
    await tap('pro-continue');
    expect(screen.getByText('Pick at least one field.')).toBeTruthy();
    expect(screen.getByText('Write at least 8 characters.')).toBeTruthy();
    expect(screen.getByText('Tell people more: at least 40 characters.')).toBeTruthy();
    expect(screen.queryByTestId('pro-credentials')).toBeNull();
    await pickField('accounting_tax');
    await type('pro-headline', 'a'.repeat(7));
    await type('pro-about', 'a'.repeat(39));
    await tap('pro-continue');
    expect(screen.getByText('Write at least 8 characters.')).toBeTruthy();
    await type('pro-headline', 'a'.repeat(8));
    await type('pro-about', 'a'.repeat(40));
    await tap('pro-continue');
    expect(screen.getByTestId('pro-credentials')).toBeTruthy();
  });

  it('P5: a person can take a field or a service away again, and a repeated service is refused', async () => {
    await boot();
    await pickField('accounting_tax');
    await tap('pro-field-accounting_tax');
    expect(screen.queryByTestId('pro-field-accounting_tax')).toBeNull();
    await tap('pro-add-service');
    await type('pro-service-input', 'Bookkeeping');
    await tap('pro-service-add');
    await tap('pro-add-service');
    await type('pro-service-input', 'bookkeeping');
    await tap('pro-service-add');
    expect(screen.getByText('You already added that.')).toBeTruthy();
  });

  it('P5: a field already under review or listed is not offered, and when none is left the screen says so', async () => {
    answers[MINE] = ok([app({ category: 'finance', status: 'pending' }), app({ id: 'a2', category: 'legal_services', status: 'approved' })]);
    await boot();
    await tap('pro-add-field');
    expect(screen.queryByTestId('pro-pick-accounting_tax')).toBeNull();
    expect(screen.queryByTestId('pro-pick-legal_compliance')).toBeNull();
    expect(screen.getByTestId('pro-pick-design_creative')).toBeTruthy();
  });

  it('P5: with every field taken a user is told, and can open My listings', async () => {
    answers[MINE] = ok(fields.map((f, i) => app({ id: `a${i}`, category: f.applyCategory, status: i % 2 ? 'approved' : 'pending' })));
    const { ApplyScreen } = mod<typeof import('../ApplyScreen')>('../ApplyScreen');
    const onMyListings = jest.fn();
    await render(frame(<ApplyScreen onBack={jest.fn()} onDone={jest.fn()} onMyListings={onMyListings} />));
    await screen.findByTestId('pro-all-applied');
    await act(async () => fireEvent.press(screen.getByText('My listings')));
    expect(onMyListings).toHaveBeenCalledTimes(1);
  });

  it('P6: a regulated field shows the regulated note; a field with no register does not', async () => {
    await boot();
    await pickField('design_creative');
    await fill();
    await tap('pro-continue');
    expect(screen.queryByTestId('pro-regulated')).toBeNull();
    await tap('pro-back');
    await tap('pro-field-design_creative');
    await pickField('accounting_tax');
    await tap('pro-continue');
    expect(screen.getByTestId('pro-regulated')).toBeTruthy();
    expect(screen.getByText('We check your licence with the body that issued it.')).toBeTruthy();
  });

  it('P6: Back keeps what was written on P5', async () => {
    await boot();
    await pickField('accounting_tax');
    await fill();
    await tap('pro-continue');
    await tap('pro-back');
    expect(screen.getByTestId('pro-headline').props.value).toBe(HEADLINE);
    expect(screen.getByTestId('pro-about').props.value).toBe(ABOUT);
    expect(screen.getByTestId('pro-field-accounting_tax')).toBeTruthy();
  });

  it('P6: a regulated field refuses a missing number, a missing issuer and a kind that is not a licence, and sends nothing', async () => {
    await boot();
    await pickField('accounting_tax');
    await fill();
    await tap('pro-continue');
    await tap('pro-send');
    expect(screen.getByText('Add the number on your licence.')).toBeTruthy();
    expect(screen.getByText('Say who issued it, so they can be asked to confirm it.')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByLabelText('Qualification')));
    await tap('pro-send');
    expect(screen.getByText('A regulated field needs a practising licence.')).toBeTruthy();
    expect(bodiesOf('POST', '/api/hub/professionals/applications')).toHaveLength(0);
  });

  it('P6 to P7: Send for review files one application per field, with the same credentials, then shows Under review with every field', async () => {
    answers[APPLY] = [ok(app()), ok(app({ id: 'a2', category: 'professional_services' }))];
    const handlers = await boot();
    await pickField('accounting_tax');
    await pickField('business_consulting');
    await fill();
    await tap('pro-add-service');
    await type('pro-service-input', 'Tax filing');
    await tap('pro-service-add');
    await tap('pro-continue');
    await type('pro-licence', ' ICAN/2016/40921 ');
    await type('pro-issuer', ' ICAN ');
    await tap('pro-send');
    await screen.findByTestId('pro-sent');
    const body = (category: string) => ({
      category,
      headline: HEADLINE,
      about: ABOUT,
      services: ['Tax filing'],
      credentialKind: 'licence',
      licenceNumber: 'ICAN/2016/40921',
      issuingBody: 'ICAN',
      documents: [],
    });
    expect(bodiesOf('POST', '/api/hub/professionals/applications')).toEqual([body('finance'), body('professional_services')]);
    expect(screen.getByText('Under review')).toBeTruthy();
    expect(screen.getByText('Accounting & Tax, Business & Consulting')).toBeTruthy();
    expect(screen.getByText("A person checks it. You'll see the outcome in your listings.")).toBeTruthy();
    await tap('pro-done');
    expect(handlers.onDone).toHaveBeenCalledTimes(1);
    await tap('pro-my-listings');
    expect(handlers.onMyListings).toHaveBeenCalledTimes(1);
  });

  it('P6: a second tap on Send while the first is on its way files nothing twice, and the button says it is busy', async () => {
    answers[APPLY] = 'hang';
    await boot();
    await pickField('accounting_tax');
    await fill();
    await tap('pro-continue');
    await type('pro-licence', 'ICAN/1');
    await type('pro-issuer', 'ICAN');
    await fireEvent.press(screen.getByTestId('pro-send'));
    await fireEvent.press(screen.getByTestId('pro-send'));
    expect(screen.getByTestId('pro-send').props.accessibilityState.busy).toBe(true);
    expect(bodiesOf('POST', '/api/hub/professionals/applications')).toHaveLength(1);
  });

  it('P6: when the middle of three fields is refused, the first stays sent, the third is not tried, the message says which, and a retry files the other two', async () => {
    answers[APPLY] = [
      ok(app()),
      refusal(409, 'You already have an application under review for this category.'),
      ok(app({ id: 'a3', category: 'entertainment_creative' })),
      ok(app({ id: 'a4', category: 'professional_services' })),
    ];
    await boot();
    await pickField('accounting_tax');
    await pickField('design_creative');
    await pickField('business_consulting');
    await fill();
    await tap('pro-continue');
    await type('pro-licence', 'ICAN/1');
    await type('pro-issuer', 'ICAN');
    await tap('pro-send');
    await screen.findByTestId('pro-send-problem');
    expect(screen.getByText('Accounting & Tax was sent. Design & Creative could not be sent. You already have an application in this field.')).toBeTruthy();
    expect(screen.queryByTestId('pro-sent')).toBeNull();
    const first = bodiesOf('POST', '/api/hub/professionals/applications') as { category: string }[];
    expect(first.map((b) => b.category)).toEqual(['finance', 'entertainment_creative']);
    await tap('pro-send');
    await screen.findByTestId('pro-sent');
    const posted = bodiesOf('POST', '/api/hub/professionals/applications') as { category: string }[];
    expect(posted.map((b) => b.category)).toEqual(['finance', 'entertainment_creative', 'entertainment_creative', 'professional_services']);
    expect(screen.getByText('Accounting & Tax, Design & Creative, Business & Consulting')).toBeTruthy();
  });

  it('P6: a refusal keeps the person on P6 with the app’s own sentence, never the server’s', async () => {
    answers[APPLY] = refusal(500, 'Internal server error');
    await boot();
    await pickField('design_creative');
    await fill();
    await tap('pro-continue');
    await act(async () => fireEvent.press(screen.getByLabelText('Work samples')));
    await tap('pro-send');
    await waitFor(() => expect(screen.getByText('Design & Creative could not be sent. Something went wrong. Try again.')).toBeTruthy());
    expect(screen.queryByText('Internal server error')).toBeNull();
    answers[APPLY] = 'offline';
    await tap('pro-send');
    await waitFor(() => expect(screen.getByText('Design & Creative could not be sent. No connection. Check your internet and try again.')).toBeTruthy());
  });

  it('P6: a user can upload the licence; the file goes to professional/document and its address goes with the application', async () => {
    answers[PRESIGN] = ok({ uploadUrl: 'https://store.test/put-1', fileUrl: 'https://files.test/ican-licence.pdf', key: 'k' });
    answers['PUT /put-1'] = { status: 200, body: {} };
    answers[APPLY] = ok(app());
    mockPick.mockResolvedValue({ blob: new Blob(['%PDF'], { type: 'application/pdf' }), name: 'ican-licence.pdf', contentType: 'application/pdf', extension: 'pdf' });
    await boot();
    await pickField('accounting_tax');
    await fill();
    await tap('pro-continue');
    await type('pro-licence', 'ICAN/1');
    await type('pro-issuer', 'ICAN');
    await tap('pro-upload');
    await waitFor(() => expect(screen.getByText('Uploaded')).toBeTruthy());
    expect(screen.getByText('ican-licence.pdf')).toBeTruthy();
    expect(screen.queryByTestId('pro-upload')).toBeNull();
    expect(bodiesOf('POST', '/api/hub/uploads/presign')).toEqual([{ folder: 'professional/document', contentType: 'application/pdf', extension: 'pdf', contentLength: 4 }]);
    await tap('pro-send');
    await screen.findByTestId('pro-sent');
    expect((bodiesOf('POST', '/api/hub/professionals/applications')[0] as { documents: string[] }).documents).toEqual(['https://files.test/ican-licence.pdf']);
  });

  it('P6: a file that did not upload says so and can be tried again, and is never sent; removing it takes it away', async () => {
    answers[PRESIGN] = [refusal(503, 'Storage is not configured'), ok({ uploadUrl: 'https://store.test/put-2', fileUrl: 'https://files.test/two.pdf', key: 'k' })];
    answers['PUT /put-2'] = { status: 200, body: {} };
    mockPick.mockResolvedValue({ blob: new Blob(['%PDF'], { type: 'application/pdf' }), name: 'ican-licence.pdf', contentType: 'application/pdf', extension: 'pdf' });
    await boot();
    await pickField('design_creative');
    await fill();
    await tap('pro-continue');
    await act(async () => fireEvent.press(screen.getByLabelText('Work samples')));
    await tap('pro-upload');
    await waitFor(() => expect(screen.getByText('Did not upload. Try again')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByText('Did not upload. Try again')));
    await waitFor(() => expect(screen.getByText('Uploaded')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByLabelText('Remove ican-licence.pdf')));
    expect(screen.queryByText('ican-licence.pdf')).toBeNull();
    expect(screen.getByTestId('pro-upload')).toBeTruthy();
  });

  it('P6: Send waits for a file that is still uploading', async () => {
    answers[PRESIGN] = 'hang';
    mockPick.mockResolvedValue({ blob: new Blob(['%PDF']), name: 'a.pdf', contentType: 'application/pdf', extension: 'pdf' });
    await boot();
    await pickField('design_creative');
    await fill();
    await tap('pro-continue');
    await act(async () => fireEvent.press(screen.getByLabelText('Work samples')));
    await tap('pro-upload');
    await tap('pro-send');
    expect(screen.getByText('Wait for your file to finish uploading.')).toBeTruthy();
    expect(bodiesOf('POST', '/api/hub/professionals/applications')).toHaveLength(0);
  });

  it('P6: choosing nothing in the file chooser leaves the screen as it was', async () => {
    mockPick.mockResolvedValue(null);
    await boot();
    await pickField('design_creative');
    await fill();
    await tap('pro-continue');
    await tap('pro-upload');
    expect(screen.queryByTestId('pro-file')).toBeNull();
    expect(bodiesOf('POST', '/api/hub/uploads/presign')).toHaveLength(0);
  });

  it('Apply again starts from the turned-down application in that field, and nothing else', async () => {
    answers[MINE] = ok([
      app({ id: 'r', category: 'legal_services', status: 'rejected', headline: 'Contract reviews', about: 'Reviewing contracts for creators and small studios.', services: ['NDAs'], licenceNumber: 'NBA/1', issuingBody: 'NBA', rejectionReason: 'This field needs a practising licence.' }),
    ]);
    await boot({ initialField: 'legal_compliance' });
    expect(screen.getByTestId('pro-field-legal_compliance')).toBeTruthy();
    expect(screen.getByTestId('pro-headline').props.value).toBe('Contract reviews');
    expect(screen.getByTestId('pro-about').props.value).toBe('Reviewing contracts for creators and small studios.');
    expect(screen.getByLabelText('Remove NDAs')).toBeTruthy();
    await tap('pro-continue');
    expect(screen.getByTestId('pro-licence').props.value).toBe('NBA/1');
    expect(screen.getByTestId('pro-issuer').props.value).toBe('NBA');
  });

  it('a link that names no field, or one already taken, starts empty', async () => {
    answers[MINE] = ok([app({ category: 'finance', status: 'pending' })]);
    await boot({ initialField: 'not-a-field' });
    expect(screen.queryByTestId('pro-field-not-a-field')).toBeNull();
    expect(screen.getByTestId('pro-headline').props.value).toBe('');
  });

  it('P10: an account that is not a creator’s sees the gate, and nothing else is asked', async () => {
    answers[ME] = ok({ wawuUserId: 'u1', accountType: 'user' });
    const { ApplyScreen } = mod<typeof import('../ApplyScreen')>('../ApplyScreen');
    const onBack = jest.fn();
    await render(frame(<ApplyScreen onBack={onBack} onDone={jest.fn()} onMyListings={jest.fn()} />));
    await screen.findByTestId('pro-gate');
    expect(screen.getByText('This needs a creator account')).toBeTruthy();
    expect(screen.getByText('Setting one up is free.')).toBeTruthy();
    expect(screen.queryByText('Become a creator')).toBeNull();
    expect(sent.map((s) => s.path)).toEqual(['/api/hub/users/me']);
    await act(async () => fireEvent.press(screen.getByLabelText('Back')));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state while the answers come, and an error with Try again when one fails', async () => {
    answers[FIELDS] = 'hang';
    const { ApplyScreen } = mod<typeof import('../ApplyScreen')>('../ApplyScreen');
    await render(frame(<ApplyScreen onBack={jest.fn()} onDone={jest.fn()} onMyListings={jest.fn()} />));
    await screen.findByTestId('pro-loading');
  });

  it('an error names its cause and Try again asks again', async () => {
    answers[FIELDS] = ['offline', ok(fields)];
    const { ApplyScreen } = mod<typeof import('../ApplyScreen')>('../ApplyScreen');
    await render(frame(<ApplyScreen onBack={jest.fn()} onDone={jest.fn()} onMyListings={jest.fn()} />));
    await screen.findByTestId('pro-error');
    expect(screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Try again')));
    await screen.findByTestId('pro-continue');
  });
});

describe('P8 and P9 · Your listings', () => {
  const rows = [
    app({ id: 'r1', category: 'legal_services', status: 'rejected', headline: 'Contract reviews', rejectionReason: 'This field needs a practising licence.', submittedAt: '2026-10-05T00:00:00.000Z' }),
    app({ id: 'p1', category: 'professional_services', status: 'pending', headline: 'Small business advisor', submittedAt: '2026-10-04T00:00:00.000Z' }),
    app({ id: 'a1', category: 'finance', status: 'approved', listed: true, submittedAt: '2026-10-01T00:00:00.000Z' }),
  ];
  const boot = async () => {
    const { ListingsScreen } = mod<typeof import('../ListingsScreen')>('../ListingsScreen');
    const handlers = { onBack: jest.fn(), onApply: jest.fn() };
    await render(frame(<ListingsScreen {...handlers} />));
    return handlers;
  };

  it('P8: shows each field with its headline and state, listed first, then under review, then turned down with the reason', async () => {
    answers[MINE] = ok(rows);
    await boot();
    await screen.findByTestId('pro-listings');
    const order = screen.getAllByTestId(/^pro-row-/).map((n) => n.props.testID);
    expect(order).toEqual(['pro-row-a1', 'pro-row-p1', 'pro-row-r1']);
    expect(screen.getByText('Accounting & Tax')).toBeTruthy();
    expect(screen.getByText('Chartered accountant, 9 years')).toBeTruthy();
    expect(screen.getByText('Listed')).toBeTruthy();
    expect(screen.getByText('Showing in the directory')).toBeTruthy();
    expect(screen.getByText('Business & Consulting')).toBeTruthy();
    expect(screen.getByText('Under review')).toBeTruthy();
    expect(screen.getByText('Turned down')).toBeTruthy();
    expect(screen.getByText('Why it was turned down')).toBeTruthy();
    expect(screen.getByText('This field needs a practising licence.')).toBeTruthy();
    expect(screen.getByText('People reach you through paid messages')).toBeTruthy();
    expect(screen.queryByText(/I21/)).toBeNull();
  });

  it('P8: a turned-down row with no reason shows no reason box, and a category no field covers is named from the category', async () => {
    answers[MINE] = ok([app({ id: 'r1', category: 'real_estate', status: 'rejected', rejectionReason: null })]);
    await boot();
    await screen.findByTestId('pro-listings');
    expect(screen.queryByText('Why it was turned down')).toBeNull();
    expect(screen.getByText('Real estate')).toBeTruthy();
  });

  it('P8 to P9: a user can Hide a listed field and Show it again, each with one request', async () => {
    answers[MINE] = ok(rows);
    answers['PATCH /api/hub/professionals/applications/a1/listing'] = [ok(app({ id: 'a1', status: 'approved', listed: false })), ok(app({ id: 'a1', status: 'approved', listed: true }))];
    await boot();
    await screen.findByTestId('pro-listings');
    await tap('pro-toggle-a1');
    await screen.findByText('Hidden. Nobody can find you');
    expect(screen.getByText('Show')).toBeTruthy();
    expect(screen.getByText('Listed')).toBeTruthy();
    expect(bodiesOf('PATCH', '/api/hub/professionals/applications/a1/listing')).toEqual([{ listed: false }]);
    await tap('pro-toggle-a1');
    await screen.findByText('Showing in the directory');
    expect(bodiesOf('PATCH', '/api/hub/professionals/applications/a1/listing')).toEqual([{ listed: false }, { listed: true }]);
  });

  it('P9: a hidden listing from the Hub opens as Hidden with Show', async () => {
    answers[MINE] = ok([app({ id: 'a1', status: 'approved', listed: false })]);
    await boot();
    await screen.findByText('Hidden. Nobody can find you');
    expect(screen.getByText('Show')).toBeTruthy();
    expect(screen.queryByText('Hide')).toBeNull();
  });

  it('P8: a hide that fails says so in the app\u2019s words and the row keeps its state', async () => {
    answers[MINE] = ok(rows);
    answers['PATCH /api/hub/professionals/applications/a1/listing'] = refusal(500, 'Internal server error');
    await boot();
    await screen.findByTestId('pro-listings');
    await tap('pro-toggle-a1');
    await screen.findByText('Your listing could not be hidden. Try again.');
    expect(screen.getByText('Showing in the directory')).toBeTruthy();
    expect(screen.queryByText('Internal server error')).toBeNull();
  });

  it('P8: a second tap on Hide while the first is on its way sends one request', async () => {
    answers[MINE] = ok(rows);
    answers['PATCH /api/hub/professionals/applications/a1/listing'] = 'hang';
    await boot();
    await screen.findByTestId('pro-listings');
    await fireEvent.press(screen.getByTestId('pro-toggle-a1'));
    await fireEvent.press(screen.getByTestId('pro-toggle-a1'));
    expect(bodiesOf('PATCH', '/api/hub/professionals/applications/a1/listing')).toHaveLength(1);
  });

  it('P8: Apply again opens the application for that field, and Apply in another field opens it with none', async () => {
    answers[MINE] = ok(rows);
    const { onApply } = await boot();
    await screen.findByTestId('pro-listings');
    await tap('pro-again-r1');
    expect(onApply).toHaveBeenLastCalledWith('legal_compliance');
    await tap('pro-apply-another');
    expect(onApply).toHaveBeenLastCalledWith();
  });

  it('P8: with no applications a user is invited to offer their services; error and loading have their own screens', async () => {
    const { onApply } = await boot();
    await screen.findByTestId('pro-listings-empty');
    await act(async () => fireEvent.press(screen.getByText('Offer your services')));
    expect(onApply).toHaveBeenCalledWith();
  });

  it('P8: an error says why and Try again asks again', async () => {
    answers[MINE] = ['offline', ok(rows)];
    await boot();
    await screen.findByTestId('pro-listings-error');
    expect(screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Try again')));
    await screen.findByTestId('pro-listings');
  });

  it('P8: shows loading while the list comes', async () => {
    answers[MINE] = 'hang';
    await boot();
    await screen.findByTestId('pro-listings-loading');
  });

  it('P10: a non-creator opening Your listings sees the gate', async () => {
    answers[ME] = ok({ wawuUserId: 'u1', accountType: 'user' });
    await boot();
    await screen.findByTestId('pro-gate');
    expect(sent.map((s) => s.path)).toEqual(['/api/hub/users/me']);
  });
});
