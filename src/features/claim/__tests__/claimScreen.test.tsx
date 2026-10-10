/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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

type Plain = { status: number; body: unknown };
type Answer = Plain | 'offline' | 'hang' | (Plain | 'offline' | 'hang')[];
type Sent = { method: string; path: string; body: unknown };

let answer: Answer = { status: 404, body: {} };
let sent: Sent[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
  const next = Array.isArray(answer) ? (answer.length > 1 ? answer.shift()! : answer[0]) : answer;
  if (next === 'offline') throw new TypeError('Network request failed');
  if (next === 'hang') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(next.body), { status: next.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

type ClaimCodeScreenProps = import('../ClaimCodeScreen').ClaimCodeScreenProps;
// Loaded after the fetch stand-in above is in place: the API client takes its fetch when it is first imported.
const { ClaimCodeScreen } = require('../ClaimCodeScreen') as typeof import('../ClaimCodeScreen');

const CLAIM = '/api/hub/waitlist/claims';

const view = (over: Record<string, unknown> = {}) => ({
  offerName: 'Event registration',
  days: 30,
  extended: false,
  pointsGranted: 100,
  pointsExpireAt: '2027-01-15T10:00:00.000Z',
  tier: {
    state: 'active',
    tier: { id: 'verify', name: 'Verify', badge: { id: 'verified', numbered: false } },
    activeFrom: '2026-10-17T10:00:00.000Z',
    activeUntil: '2026-11-16T10:00:00.000Z',
    productsAllowed: 3,
    extraProducts: 0,
    pointsIncluded: 100,
    firstVoiceIntroIncluded: true,
    eventPass: { id: 'watch_apply', name: 'Watch live, apply' },
  },
  ...over,
});
const ok = (data: unknown): Plain => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message = 'Server words.'): Plain => ({
  status,
  body: { statusCode: status, message, data: null, reason: { code, message } },
});

async function open(props: Partial<ClaimCodeScreenProps> = {}) {
  const onBack = jest.fn();
  const onDone = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ClaimCodeScreen onBack={onBack} onDone={onDone} {...props} />
    </SafeAreaProvider>,
  );
  return { onBack, onDone };
}

const type = async (text: string) => {
  await fireEvent.changeText(screen.getByTestId('claim-code'), text);
};
const submit = async () => {
  await fireEvent.press(screen.getByTestId('claim-submit'));
};
const claims = () => sent.filter((s) => s.method === 'POST' && s.path === CLAIM);

beforeEach(() => {
  answer = ok(view());
  sent = [];
  mockStore.clear();
});

describe('a user claims the plan an event registration paid for (JOIN-03)', () => {
  it('can type the code in any form, claim it, and see what the Hub says they now have', async () => {
    const { onDone } = await open();
    await type('5f6c-15e4');
    expect(screen.getByTestId('claim-code').props.value).toBe('5F6C 15E4');
    await submit();
    await waitFor(() => expect(screen.getByTestId('claim-done')).toBeTruthy());
    expect(claims()).toHaveLength(1);
    expect(claims()[0].body).toEqual({ code: '5F6C15E4' });
    expect(screen.getByText('Your plan is ready')).toBeTruthy();
    expect(screen.getByTestId('claim-ready-line').props.children).toBe('Verify for 30 days, starting today.');
    // What is in force in the app today: the plan, its end and the points. The Hub also granted three products, a pass and
    // a Voice Intro; their screens are not built, so they are not listed (round 2, N2).
    for (const text of ['Verify', '16 Nov', '100', '15 Jan 2027']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    for (const text of ['Products you can publish', 'Event pass', 'Watch live, apply', 'Voice Intro', 'First one included']) {
      expect(screen.queryByText(text)).toBeNull();
    }
    await fireEvent.press(screen.getByTestId('claim-done-button'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('is told when the days were added to a plan they already had', async () => {
    answer = ok(view({ extended: true }));
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByTestId('claim-ready-line').props.children).toBe('30 days were added to the plan you already have.'));
    expect(screen.getByText('Now runs until')).toBeTruthy();
  });

  it('sends nothing for a code that is empty, short, or has a letter after F, and says why on the field', async () => {
    await open();
    await submit();
    expect(screen.getByText('Enter your access code.')).toBeTruthy();
    await type('5F6C 15');
    await submit();
    expect(screen.getByText('Type all 8 letters and numbers of your access code.')).toBeTruthy();
    await type('5F6C 15EZ');
    await submit();
    expect(screen.getByText('An access code only has the numbers 0 to 9 and the letters A to F.')).toBeTruthy();
    expect(claims()).toHaveLength(0);
  });

  it('sends one claim for a double tap', async () => {
    answer = 'hang';
    await open();
    await type('5F6C15E4');
    await submit();
    await submit();
    await submit();
    expect(claims()).toHaveLength(1);
  });

  it('sends one claim when two sends land in the same frame (Return pressed twice), before the screen has drawn its busy state', async () => {
    answer = 'hang';
    await open();
    await type('5F6C15E4');
    const press = screen.getByTestId('claim-code').props.onSubmitEditing as () => void;
    await act(async () => {
      press();
      press();
    });
    expect(claims()).toHaveLength(1);
  });

  it.each([
    [404, 'code_not_found', 'We could not match that code to you', 'signed in with the phone number or email you registered with, and that you have confirmed it'],
    [409, 'contact_not_verified', 'Confirm your phone number or email first', 'Confirm one, then try your code again'],
    [409, 'code_refunded', 'That code cannot be used', 'Use the code from your first payment'],
    [409, 'already_claimed', 'That code has already been used', 'Each code can be used once'],
    [409, 'claimed_by_you', 'You already claimed this code', 'Your plan is already on your account'],
  ])('says in plain words what a %s %s means, and keeps the code that was typed', async (status, code, title, body) => {
    answer = refusal(status, code);
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByTestId('claim-banner')).toBeTruthy());
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText(new RegExp(body))).toBeTruthy();
    expect(screen.getByTestId('claim-code').props.value).toBe('5F6C 15E4');
    expect(screen.queryByTestId('claim-done')).toBeNull();
  });

  it("shows the Hub's own words when the offer is gone, and the code field's line when the Hub says the code is not 8 characters", async () => {
    answer = refusal(409, 'offer_unavailable', 'The offer for that code is no longer available. Email support@wawuafrica.com with your code.');
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByText('That code cannot be claimed')).toBeTruthy());
    expect(screen.getByText(/no longer available\. Email support/)).toBeTruthy();
    // The title does not say again what the sentence under it says (round 2, N5).
    expect(screen.queryByText('That offer is no longer available')).toBeNull();
    answer = refusal(400, 'code_invalid');
    await submit();
    await waitFor(() => expect(screen.getByText('Type all 8 letters and numbers of your access code.')).toBeTruthy());
    expect(screen.queryByTestId('claim-banner')).toBeNull();
  });

  it('can try again after being offline, and the second try is the one that claims', async () => {
    answer = ['offline', ok(view())];
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByText('No connection')).toBeTruthy());
    expect(screen.getByTestId('claim-code').props.value).toBe('5F6C 15E4');
    await submit();
    await waitFor(() => expect(screen.getByTestId('claim-done')).toBeTruthy());
    expect(claims()).toHaveLength(2);
  });

  it('is told to sign in again when the session ended, and that too many tries need a wait', async () => {
    answer = refusal(401, 'x');
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByText('Your session ended')).toBeTruthy());
    answer = refusal(429, 'throttled');
    await submit();
    await waitFor(() => expect(screen.getByText('Too many tries')).toBeTruthy());
  });

  it('is told, in words that do not say the claim failed, when the answer was a success it could not read', async () => {
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: null } };
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByText('Your code was accepted')).toBeTruthy());
    expect(screen.getByText(/Open your account again to see your plan/)).toBeTruthy();
    expect(screen.queryByTestId('claim-done')).toBeNull();
  });

  it('is told the same, and shows no plan, for an answer that has no plan in it (round 2, V5)', async () => {
    await open();
    await type('5F6C15E4');
    for (const data of [{}, { tier: null }, { tier: 'Verify' }, [], 'ok']) {
      answer = { status: 200, body: { statusCode: 200, message: 'OK', data } };
      await submit();
      await waitFor(() => expect(screen.getByText('Your code was accepted')).toBeTruthy());
      expect(screen.queryByTestId('claim-done')).toBeNull();
      expect(screen.queryByText('Your plan is ready')).toBeNull();
    }
  });

  it('takes the last refusal off the screen the moment the next try is sent, and puts the new answer there (round 2, V7)', async () => {
    answer = [refusal(404, 'code_not_found'), 'hang'];
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByTestId('claim-banner')).toBeTruthy());
    await submit();
    // The second try is on its way and has not been answered: the first answer is not left standing as if it were this one's.
    await waitFor(() => expect(claims()).toHaveLength(2));
    expect(screen.queryByTestId('claim-banner')).toBeNull();
    expect(screen.queryByText('We could not match that code to you')).toBeNull();
  });

  it('takes a refusal off the screen when the code is edited, and keeps what was typed (round 2, V8)', async () => {
    answer = refusal(404, 'code_not_found');
    await open();
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByTestId('claim-banner')).toBeTruthy());
    await type('5F6C15E');
    expect(screen.queryByTestId('claim-banner')).toBeNull();
    expect(screen.getByTestId('claim-code').props.value).toBe('5F6C 15E');
    // A line on the field goes the same way.
    answer = refusal(400, 'code_invalid');
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByText('Type all 8 letters and numbers of your access code.')).toBeTruthy());
    await type('5F6C15E');
    expect(screen.queryByText('Type all 8 letters and numbers of your access code.')).toBeNull();
  });

  it('can go back from the form', async () => {
    const { onBack } = await open();
    await fireEvent.press(screen.getByTestId('auth-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('writes no em-dash anywhere a person reads', async () => {
    await open();
    expect(JSON.stringify(screen.toJSON())).not.toContain('—');
    await type('5F6C15E4');
    await submit();
    await waitFor(() => expect(screen.getByTestId('claim-done')).toBeTruthy());
    expect(JSON.stringify(screen.toJSON())).not.toContain('—');
  });
});
