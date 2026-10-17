/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { referrals } from '../referralsForTests';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
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
const mockCapture = jest.fn();
jest.mock('react-native-view-shot', () => ({ captureRef: (...args: unknown[]) => mockCapture(...args) }));
const mockFile = { canShareCard: jest.fn(), shareCardFile: jest.fn(), saveCardFile: jest.fn() };
jest.mock('@/features/tgif/cardFile', () => ({
  canShareCard: () => mockFile.canShareCard(),
  shareCardFile: (uri: string, title: string) => mockFile.shareCardFile(uri, title),
  saveCardFile: (uri: string) => mockFile.saveCardFile(uri),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hang';
let answers: Record<string, Answer> = {};
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const answer = answers[`${request.method} ${new URL(request.url).pathname}`];
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  if (answer === 'hang') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;
const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const ME = 'GET /api/hub/users/me';
const HUB = 'GET /api/hub/me/referrals';

const me = (over: Record<string, unknown> = {}) => ({
  wawuUserId: 'u1',
  sub: 'u1',
  firstName: 'Lennox',
  middleName: null,
  lastName: 'Emmanuel',
  accountType: 'creator',
  handle: 'lennox',
  avatarUrl: null,
  verification: { creator: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' }, professional: { verified: false, expiresAt: null } },
  ...over,
});

const { ShareCardScreen } = require('../ShareCardScreen') as typeof import('../ShareCardScreen');

let client: QueryClient;
const onClose = jest.fn();

function open() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <ShareCardScreen onClose={onClose} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

beforeEach(() => {
  answers = { [ME]: ok(me()), [HUB]: ok(referrals()) };
  onClose.mockClear();
  mockCapture.mockReset().mockResolvedValue('file:///cache/invite-card.png');
  mockFile.canShareCard.mockReset().mockResolvedValue(true);
  mockFile.shareCardFile.mockReset().mockResolvedValue(undefined);
  mockFile.saveCardFile.mockReset().mockResolvedValue('saved');
});
afterEach(async () => {
  await flush();
  cleanup();
  client?.clear();
  jest.restoreAllMocks();
});

describe('Share card (RF2)', () => {
  it('draws the person\'s card: their name, their tick, the line and the Hub link, and no outside brand name', async () => {
    await open();
    expect(await screen.findByTestId('invite-card')).toBeTruthy();
    expect(screen.getByTestId('invite-card-name')).toHaveTextContent('Lennox Emmanuel');
    expect(screen.getByTestId('invite-card-link')).toHaveTextContent('wawuafrica.com/r/lennox');
    expect(screen.getByText('Join me on Who Made This? and get paid for what you know.')).toBeTruthy();
    expect(screen.getByLabelText('Creator tick')).toBeTruthy();
    const everything = JSON.stringify(screen.toJSON());
    for (const brand of ['Instagram', 'WhatsApp', 'Story', 'Flutterwave', 'Nuvion', 'Fintava']) expect(everything).not.toContain(brand);
  });

  it('Share captures the card as a picture and hands it to the phone\'s share sheet', async () => {
    await open();
    await fireEvent.press(await screen.findByTestId('invite-card-share'));
    await waitFor(() => expect(mockFile.shareCardFile).toHaveBeenCalledTimes(1));
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockCapture.mock.calls[0][1]).toMatchObject({ format: 'png', result: 'tmpfile' });
    expect(mockFile.shareCardFile).toHaveBeenCalledWith('file:///cache/invite-card.png', 'Share your invite');
    expect(screen.queryByTestId('invite-card-problem')).toBeNull();
  });

  it('a second tap while the first is still working shares once', async () => {
    let finish: () => void = () => undefined;
    mockFile.shareCardFile.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    await open();
    const share = await screen.findByTestId('invite-card-share');
    await fireEvent.press(share);
    await fireEvent.press(share);
    await flush();
    expect(mockFile.shareCardFile).toHaveBeenCalledTimes(1);
    await act(async () => finish());
  });

  it('says so, in plain words, when the sheet or the picture fails', async () => {
    mockCapture.mockRejectedValue(new Error('no view'));
    await open();
    await fireEvent.press(await screen.findByTestId('invite-card-share'));
    expect(await screen.findByTestId('invite-card-problem')).toHaveTextContent('The card could not be shared. Try again.');
    expect(mockFile.shareCardFile).not.toHaveBeenCalled();
  });

  it('Save puts the picture in the phone\'s photos, and tells a refusal to allow it', async () => {
    await open();
    await fireEvent.press(await screen.findByTestId('invite-card-save'));
    expect(await screen.findByTestId('invite-card-saved')).toHaveTextContent('Saved to your photos.');
    expect(mockFile.saveCardFile).toHaveBeenCalledWith('file:///cache/invite-card.png');

    mockFile.saveCardFile.mockResolvedValue('denied');
    await fireEvent.press(screen.getByTestId('invite-card-save'));
    expect(await screen.findByTestId('invite-card-problem')).toHaveTextContent(/^Saving needs permission to add to your photos\./);
    expect(screen.queryByTestId('invite-card-saved')).toBeNull();
  });

  it('a phone with no share sheet shares the line and the link as text and draws no Save', async () => {
    mockFile.canShareCard.mockResolvedValue(false);
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await open();
    await fireEvent.press(await screen.findByTestId('invite-card-share'));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ message: 'Join me on Who Made This? and get paid for what you know. https://wawuafrica.com/r/lennox' }));
    expect(screen.queryByTestId('invite-card-save')).toBeNull();
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('the cross closes it', async () => {
    await open();
    await fireEvent.press(await screen.findByTestId('invite-card-back'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state while the Hub answers, and no share buttons without a card', async () => {
    answers[HUB] = 'hang';
    await open();
    expect(screen.getByTestId('invite-card-loading')).toBeTruthy();
    expect(screen.queryByTestId('invite-card')).toBeNull();
    expect(screen.queryByTestId('invite-card-share')).toBeNull();
  });

  it('shows an error with Try again when the Hub cannot be reached, and recovers', async () => {
    answers[HUB] = 'offline';
    await open();
    expect(await screen.findByTestId('invite-card-error')).toBeTruthy();
    expect(screen.queryByTestId('invite-card-share')).toBeNull();
    answers[HUB] = ok(referrals());
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('invite-card')).toBeTruthy();
    expect(screen.getByTestId('invite-card-share')).toBeTruthy();
  });
});
