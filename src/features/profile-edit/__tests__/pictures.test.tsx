/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// A build that can open a photo library (the web build today; the phone build once expo-image-picker is installed).
const mockPick = jest.fn();
jest.mock('../pickImage', () => ({ canPickImage: true, pickImage: (...args: unknown[]) => mockPick(...args) }));

type Sent = { method: string; url: string; body?: unknown; type?: string | null };
let sent: Sent[] = [];
let putStatus = 200;

const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });

const profile = {
  wawuUserId: 'u1', firstName: 'Lennox', middleName: null, lastName: 'Emmanuel', handle: 'lennox', bio: null, avatarUrl: null, coverUrl: null,
  instagramHandle: null, tiktokHandle: null, xHandle: null, youtubeUrl: null, facebookUrl: null, linkedinUrl: null,
};
const details = { wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' || request.method === 'PUT' ? '' : await request.text();
  sent.push({ method: request.method, url: request.url, body: text ? JSON.parse(text) : undefined, type: request.headers.get('content-type') });
  if (url.host === 'files.example') return new Response('', { status: putStatus });
  if (request.method === 'GET' && url.pathname.endsWith('/profile-fields')) return ok(details);
  if (request.method === 'GET') return ok(profile);
  if (url.pathname.endsWith('/uploads/presign')) {
    const folder = (JSON.parse(text) as { folder: string }).folder;
    return ok({ uploadUrl: `https://files.example/put/${folder}`, key: `k/${folder}`, fileUrl: `https://files.example/read/${folder}.jpg` });
  }
  return ok(profile);
}) as typeof fetch;

const { EditProfileScreen } = require('../EditProfileScreen') as typeof import('../EditProfileScreen');
const draft = require('../draft') as typeof import('../draft');

async function boot() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={jest.fn()} />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  await screen.findByTestId('edit-profile');
}

const picked = { blob: new Blob(['abc']), contentType: 'image/png', extension: 'png', previewUri: 'blob:preview' };

beforeEach(() => {
  sent = [];
  putStatus = 200;
  mockPick.mockReset();
  draft.clearDraft();
});

describe('M8 · changing the avatar and the cover', () => {
  it('a user can choose a new avatar: it is uploaded, then saved on the profile when they press Save', async () => {
    mockPick.mockResolvedValue(picked);
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await screen.findByTestId('edit-avatar-image');
    const presign = sent.find((s) => s.url.endsWith('/uploads/presign'));
    expect(presign?.body).toEqual({ folder: 'avatars', contentType: 'image/png', extension: 'png', contentLength: 3 });
    expect(sent.find((s) => s.method === 'PUT')).toMatchObject({ url: 'https://files.example/put/avatars', type: 'image/png' });
    // Nothing is on the profile until Save.
    expect(sent.filter((s) => s.method === 'PATCH')).toHaveLength(0);
    await fireEvent.press(screen.getByTestId('edit-save'));
    await screen.findByTestId('profile-saved');
    expect(sent.filter((s) => s.method === 'PATCH').map((s) => s.body)).toEqual([{ avatarUrl: 'https://files.example/read/avatars.jpg' }]);
  });

  it('a user can choose a new cover picture, which goes to the cover folder', async () => {
    mockPick.mockResolvedValue(picked);
    await boot();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await screen.findByTestId('edit-save');
    await fireEvent.press(await screen.findByTestId('edit-save'));
    await screen.findByTestId('profile-saved');
    expect(sent.find((s) => s.url.endsWith('/uploads/presign'))?.body).toMatchObject({ folder: 'profile/cover' });
    expect(sent.filter((s) => s.method === 'PATCH').map((s) => s.body)).toEqual([{ coverUrl: 'https://files.example/read/profile/cover.jpg' }]);
  });

  it('a user who closes the chooser without choosing changes nothing', async () => {
    mockPick.mockResolvedValue(null);
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    expect(sent.some((s) => s.url.endsWith('/uploads/presign'))).toBe(false);
    expect(screen.getByTestId('edit-save')).toBeDisabled();
  });

  it('a user whose picture did not upload is told, and nothing is saved with it', async () => {
    mockPick.mockResolvedValue(picked);
    putStatus = 403;
    await boot();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    expect(await screen.findByText('Your picture did not upload. Try again.')).toBeTruthy();
    expect(screen.getByTestId('edit-save')).toBeDisabled();
    expect(sent.filter((s) => s.method === 'PATCH')).toHaveLength(0);
  });
});
