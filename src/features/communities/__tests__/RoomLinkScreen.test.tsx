/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, canGoBack: () => false }),
}));
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockVault.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockVault.delete(key)),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refuse = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(key);
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { adoptSession, resetSessionForTests, signOut } = require('@/api/session') as typeof import('@/api/session');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { RoomLinkScreen } = require('../RoomLinkScreen') as typeof import('../RoomLinkScreen');

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${b64({ alg: 'none' })}.${b64({ sub: 'me', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

const roomView = { id: 'r1', name: 'Aba tailors circle', kind: 'open', imageUrl: null, description: 'About', hostWawuId: 'h', memberCount: 3, messagesToday: 0, slug: 'aba-tailors-circle', link: 'wawu/c/aba-tailors-circle' };

async function renderLink(slug = 'aba-tailors-circle') {
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <RoomLinkScreen slug={slug} />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  sent = [];
  answers = {};
  mockReplace.mockClear();
  mockPush.mockClear();
  mockBack.mockClear();
  queryClient.clear();
  resetSessionForTests();
  mockVault.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => {
    await signOut();
  });
  rtl.cleanup();
  queryClient.clear();
});

describe('a room link, wawu/c/<slug>', () => {
  it('a signed-in user who opens it lands in the room it names', async () => {
    answers['GET /communities/links/aba-tailors-circle'] = [ok(roomView)];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await renderLink();
    await rtl.waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'r1' } }));
    expect(sent).toEqual(['GET /communities/links/aba-tailors-circle']);
  });

  it('shows a loading view while the server finds the room', async () => {
    answers['GET /communities/links/aba-tailors-circle'] = ['hold'];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await renderLink();
    expect(await rtl.screen.findByTestId('room-link-loading')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Opening the community')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('says a link nobody holds leads nowhere, and offers the inbox', async () => {
    answers['GET /communities/links/nope'] = [refuse(404, 'Community link not found')];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await renderLink('nope');
    expect(await rtl.screen.findByTestId('room-link-unknown')).toBeTruthy();
    expect(rtl.screen.getByText('This link doesn’t lead to a community')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Go to your inbox' }));
    expect(mockReplace).toHaveBeenCalledWith('/inbox');
  });

  it('says it could not open the link when the network is cut, and a retry opens it', async () => {
    answers['GET /communities/links/aba-tailors-circle'] = ['offline', 'offline', 'offline', ok(roomView)];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await renderLink();
    expect(await rtl.screen.findByTestId('room-link-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('No connection. Check your internet and try again.')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' }));
    await rtl.waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'r1' } }));
  }, 20_000);

  it('asks someone who is signed out to sign in first, and asks the server nothing', async () => {
    await renderLink();
    expect(await rtl.screen.findByTestId('room-link-signed-out')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Sign in' }));
    expect(mockPush).toHaveBeenCalledWith('/sign-in');
    expect(sent).toEqual([]);
  });

  it('goes back to the inbox when there is nothing to go back to', async () => {
    answers['GET /communities/links/aba-tailors-circle'] = ['hold'];
    await adoptSession({ accessToken: token, refreshToken: 'r' });
    await renderLink();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('room-link-back'));
    expect(mockReplace).toHaveBeenCalledWith('/inbox');
  });
});
