/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { emptyReferrals, ladder, milestones, referrals, reward } from '../referralsForTests';

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
const mockCopied: string[] = [];
let mockCopyWorks = true;
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async (value: string) => {
    if (!mockCopyWorks) throw new Error('refused');
    mockCopied.push(value);
    return true;
  }),
}));
const jwt = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => jwt('person-1'),
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer | Answer[]> = {};
let asked = 0;

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  if (url.pathname === '/api/hub/me/referrals') asked += 1;
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const HUB = 'GET /api/hub/me/referrals';

const { InviteScreen } = require('../InviteScreen') as typeof import('../InviteScreen');
const { seenKey } = require('../seen') as typeof import('../seen');

let client: QueryClient;
const onBack = jest.fn();
const onOpenRules = jest.fn();
const onOpenCard = jest.fn();

function open() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <InviteScreen onBack={onBack} onOpenRules={onOpenRules} onOpenCard={onOpenCard} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

const text = (id: string) => {
  const node = screen.getByTestId(id);
  return [node.props.children].flat(Infinity).join('');
};

beforeEach(() => {
  answers = {};
  asked = 0;
  mockVault.clear();
  mockCopied.length = 0;
  mockCopyWorks = true;
  onBack.mockClear();
  onOpenRules.mockClear();
  onOpenCard.mockClear();
});
afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  cleanup();
  client?.clear();
});

describe('Invite and earn (RF1)', () => {
  it('a person sees their link and code, brought, verified, points and pending apart, their level and the next milestone, all from the Hub', async () => {
    answers[HUB] = ok(referrals({ link: 'wawu/r/amaka', code: 'AMAKA', brought: 11, verified: 4, pending: 5, pointsEarned: 12_350, multiplier: 1.25, ladder: ladder(2) }));
    await open();
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
    expect(text('invite-link')).toBe('wawu/r/amaka');
    expect(text('invite-code')).toBe('AMAKA');
    expect(screen.getByTestId('invite-brought')).toHaveTextContent('11Brought');
    expect(screen.getByTestId('invite-verified')).toHaveTextContent('4Verified');
    expect(screen.getByTestId('invite-pending')).toHaveTextContent('5Pending');
    expect(screen.getByLabelText('12,350 points')).toBeTruthy();
    expect(screen.getByText('Points earned ×1.25')).toBeTruthy();
    expect(screen.getAllByTestId(/^invite-level-/).map((n) => n.props.testID)).toEqual(['invite-level-done', 'invite-level-current', 'invite-level-ahead', 'invite-level-ahead', 'invite-level-ahead']);
    expect(screen.getByText('Next: +500 points at 5 verified')).toBeTruthy();
    expect(screen.getByText('3 more to go · then +1,500 at 10')).toBeTruthy();
    expect(screen.queryByTestId('invite-nobody')).toBeNull();
  });

  it('copies the link and the code, and says Copied only once the phone has them', async () => {
    answers[HUB] = ok(referrals());
    await open();
    await fireEvent.press(await screen.findByTestId('invite-copy-link'));
    await waitFor(() => expect(mockCopied).toEqual(['wawu/r/lennox']));
    expect(await screen.findByLabelText('Copied')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('invite-copy-code'));
    await waitFor(() => expect(mockCopied).toEqual(['wawu/r/lennox', 'LENNOX']));
  });

  it('does not say Copied when the phone refuses', async () => {
    answers[HUB] = ok(referrals());
    mockCopyWorks = false;
    await open();
    await fireEvent.press(await screen.findByTestId('invite-copy-link'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(mockCopied).toEqual([]);
    expect(screen.queryByLabelText('Copied')).toBeNull();
    expect(screen.getByLabelText('Copy link')).toBeTruthy();
  });

  it('Share opens the share card, the help button opens the rules and Back goes back', async () => {
    answers[HUB] = ok(referrals());
    await open();
    await fireEvent.press(await screen.findByTestId('invite-share'));
    expect(onOpenCard).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('invite-help'));
    expect(onOpenRules).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('invite-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('RF1a: a person nobody has used the link of sees zeros, the first level and "Nobody yet"', async () => {
    answers[HUB] = ok(emptyReferrals());
    await open();
    expect(await screen.findByTestId('invite-nobody')).toHaveTextContent('Nobody yet. Share your link to start.');
    expect(screen.getByTestId('invite-brought')).toHaveTextContent('0Brought');
    expect(screen.getByLabelText('0 points')).toBeTruthy();
    expect(screen.getByText('Points earned ×1')).toBeTruthy();
    expect(screen.getAllByTestId(/^invite-level-/)[0].props.testID).toBe('invite-level-current');
    expect(screen.getByText('5 more to go · then +1,500 at 10')).toBeTruthy();
  });

  it('RF1b: one more verified person turns the milestone card into the note', async () => {
    answers[HUB] = ok(referrals({ brought: 12, verified: 9, pending: 2, pointsEarned: 2350, multiplier: 1.5, ladder: ladder(3), nextMilestone: { verified: 10, points: 1500, remaining: 1 }, milestones: milestones(9) }));
    await open();
    expect(await screen.findByText('One more verified person')).toBeTruthy();
    expect(screen.getByText('Get +1,500 points at 10 verified.')).toBeTruthy();
    expect(screen.queryByTestId('invite-next')).toBeNull();
    expect(screen.getByLabelText('2,350 points')).toBeTruthy();
  });

  it('draws no milestone card once every milestone is reached', async () => {
    answers[HUB] = ok(referrals({ nextMilestone: null, milestones: milestones(30) }));
    await open();
    await screen.findByTestId('invite-link-card');
    expect(screen.queryByTestId('invite-next')).toBeNull();
    expect(screen.queryByTestId('invite-next-close')).toBeNull();
  });

  it('shows a loading state while the Hub answers', async () => {
    answers[HUB] = ok(referrals());
    await open();
    expect(screen.getByTestId('invite-loading')).toBeTruthy();
    expect(screen.queryByTestId('invite-link-card')).toBeNull();
    await screen.findByTestId('invite-link-card');
    expect(screen.queryByTestId('invite-loading')).toBeNull();
  });

  it('shows an error with Try again when the phone is offline, and recovers when the Hub answers', async () => {
    answers[HUB] = 'offline';
    await open();
    expect(await screen.findByTestId('invite-error')).toBeTruthy();
    expect(screen.queryByTestId('invite-link-card')).toBeNull();
    answers[HUB] = ok(referrals());
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
  });

  it('shows an error, and no half-read figures, when the Hub answers with something that is not the referrals', async () => {
    answers[HUB] = ok({ link: 'wawu/r/x' });
    await open();
    expect(await screen.findByTestId('invite-error')).toBeTruthy();
    expect(screen.queryByTestId('invite-brought')).toBeNull();
  });

  it('reads the Hub again each time the screen opens', async () => {
    answers[HUB] = ok(referrals());
    const first = await open();
    await screen.findByTestId('invite-link-card');
    await first.unmount();
    answers[HUB] = ok(referrals({ brought: 8 }));
    await open();
    await waitFor(() => expect(screen.getByTestId('invite-brought')).toHaveTextContent('8Brought'));
    expect(asked).toBe(2);
  });
});

describe('The reward moment (RF3, RF3a)', () => {
  const seenIds = () => JSON.parse(mockVault.get(seenKey('person-1')) ?? 'null') as string[] | null;

  it('the first look on a phone tells nothing and takes what is already listed as seen', async () => {
    answers[HUB] = ok(referrals({ rewards: [reward()], milestones: milestones(5, { 5: '2026-10-11T12:00:00.000Z' }) }));
    await open();
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
    expect(screen.queryByTestId('invite-moment')).toBeNull();
    await waitFor(() => expect(seenIds()?.sort()).toEqual(['milestone:5', 'reward:rw1']));
  });

  it('RF3: a reward that became available since the last look is told once, with the points and the multiplier from the Hub', async () => {
    mockVault.set(seenKey('person-1'), JSON.stringify([]));
    answers[HUB] = ok(referrals({ rewards: [reward()] }));
    await open();
    expect(await screen.findByTestId('invite-moment')).toBeTruthy();
    expect(text('invite-moment-title')).toBe('You earned 125 points');
    expect(text('invite-moment-line')).toBe('Kemi Okafor paid and is verified. 100 points ×1.25.');
    expect(screen.getByLabelText('125 points')).toBeTruthy();
    expect(screen.queryByTestId('invite-link-card')).toBeNull();

    await fireEvent.press(screen.getByTestId('invite-moment-continue'));
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
    expect(screen.queryByTestId('invite-moment')).toBeNull();
    await waitFor(() => expect(seenIds()).toEqual(['reward:rw1']));
  });

  it('is not told again the next time the screen opens', async () => {
    mockVault.set(seenKey('person-1'), JSON.stringify(['reward:rw1']));
    answers[HUB] = ok(referrals({ rewards: [reward()] }));
    await open();
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
    expect(screen.queryByTestId('invite-moment')).toBeNull();
  });

  it('does not tell a reward that is still held or was cancelled', async () => {
    mockVault.set(seenKey('person-1'), JSON.stringify([]));
    answers[HUB] = ok(referrals({ rewards: [reward({ id: 'held', state: 'pending', settledAt: null }), reward({ id: 'gone', state: 'cancelled' })] }));
    await open();
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
    expect(screen.queryByTestId('invite-moment')).toBeNull();
  });

  it('RF3a: a milestone the Hub granted is told with a trophy, then the next moment follows, oldest first', async () => {
    mockVault.set(seenKey('person-1'), JSON.stringify([]));
    answers[HUB] = ok(
      referrals({
        multiplier: 1.25,
        rewards: [reward({ id: 'late', settledAt: '2026-10-12T00:00:00.000Z', points: 150, name: 'Ada' })],
        milestones: milestones(5, { 5: '2026-10-11T12:00:00.000Z' }),
      }),
    );
    await open();
    expect(await screen.findByTestId('invite-moment')).toBeTruthy();
    expect(text('invite-moment-title')).toBe('You reached 5 verified');
    expect(text('invite-moment-line')).toBe('+500 bonus points. Your level is now ×1.25.');
    await fireEvent.press(screen.getByTestId('invite-moment-continue'));
    await waitFor(() => expect(text('invite-moment-title')).toBe('You earned 150 points'));
    await fireEvent.press(screen.getByTestId('invite-moment-continue'));
    expect(await screen.findByTestId('invite-link-card')).toBeTruthy();
  });
});
