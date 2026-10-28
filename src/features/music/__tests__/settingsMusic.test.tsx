/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * THEME-MUSIC (R-99), Settings: the "Alert sound" row says what it does, the "Music" row holds the same state as the
 * button, and a push shown while the app is open still reads the Alert sound switch.
 */
const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockPlayer = { play: jest.fn(), pause: jest.fn(), remove: jest.fn(), loop: false };
jest.mock('expo-audio', () => ({ createAudioPlayer: () => mockPlayer, useAudioPlayer: jest.fn() }));
let mockSaved: string | null = 'file:///documents/wawu-theme.mp3';
let mockDownloadFails = false;
jest.mock('../themeTrack', () => ({
  THEME_URL: 'https://wawuafrica.com/wawu-theme.mp3',
  savedTrack: () => mockSaved,
  fetchTrack: async () => {
    if (mockDownloadFails) throw new Error('Network request failed');
    return 'file:///documents/wawu-theme.mp3';
  },
}));

let mockHandler: { handleNotification: () => Promise<Record<string, boolean>> } | null = null;
jest.mock('expo-notifications', () => ({
  setNotificationHandler: (handler: typeof mockHandler) => {
    mockHandler = handler;
  },
}));

const me = {
  wawuUserId: 'u1',
  firstName: 'Lennox',
  lastName: 'Emmanuel',
  email: 'lennox@example.test',
  phone: '+2348031234412',
  avatarUrl: null,
  verification: { creator: { verified: true, expiresAt: null }, professional: { verified: false, expiresAt: null } },
};
jest.mock('@/features/settings/api/hub', () => ({
  ...jest.requireActual('@/features/settings/api/hub'),
  fetchMe: async () => me,
  fetchTgif: async () => ({ show: true }),
  patchTgif: async () => ({ show: true }),
}));
jest.mock('@/features/settings/sessionGuard', () => ({ useSignedIn: () => true }));

const checked = (testID: string) => Boolean(screen.getByTestId(testID).props.accessibilityState?.checked);
const tap = (testID: string) => act(async () => fireEvent.press(screen.getByTestId(testID)));

async function open() {
  const { SettingsScreen } = require('@/features/settings/SettingsScreen') as typeof import('@/features/settings/SettingsScreen');
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity, retry: false } } });
  const noop = () => undefined;
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>
        <SettingsScreen
          onBack={noop}
          onOpenProfile={noop}
          onOpenNotifications={noop}
          onOpenPrivacy={noop}
          onOpenPassword={noop}
          onOpenAbout={noop}
          onOpenTerms={noop}
          onOpenPolicy={noop}
          onSignedOut={noop}
        />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  await screen.findByTestId('settings-sound');
}

beforeEach(() => {
  mockSaved = 'file:///documents/wawu-theme.mp3';
  mockDownloadFails = false;
  mockStore.clear();
  mockHandler = null;
  jest.clearAllMocks();
  require('@/features/settings/devicePrefs').resetPrefsForTests();
  require('@/features/music/themeMusic').resetThemeMusicForTests();
});

describe('Settings, Alert sound and Music', () => {
  it('the old Sound row is "Alert sound", and its line says what it does', async () => {
    await open();
    const row = screen.getByTestId('settings-sound');
    expect(row.props.accessibilityLabel).toBe('Alert sound, Alerts while the app is open');
    expect(screen.queryByText('Taps and alerts')).toBeNull();
    expect(screen.queryByText('Sound')).toBeNull();
    expect(screen.getByText('Alert sound')).toBeTruthy();
    expect(screen.getByText('Alerts while the app is open')).toBeTruthy();
  });

  it('a "Music" row, "Our theme song", sits with the other switches', async () => {
    await open();
    expect(screen.getByTestId('settings-music').props.accessibilityLabel).toBe('Music, Our theme song');
    expect(screen.getByTestId('settings-music').props.accessibilityRole).toBe('switch');
    expect(checked('settings-music')).toBe(false);
    expect(screen.getByText('Our theme song')).toBeTruthy();
  });

  it('names the app, not WAWU, on the Music row, the Alert sound row and the failed-download toast (R-37)', async () => {
    await open();
    const { THEME_FAILED } = require('@/features/music/themeMusic') as typeof import('@/features/music/themeMusic');
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/Tier|WAWU|Fintava|\u2014/);
    expect(THEME_FAILED).not.toMatch(/WAWU|\u2014/);
  });

  it('the Music switch starts the song and holds the same state as the button', async () => {
    await open();
    const music = require('@/features/music/themeMusic') as typeof import('@/features/music/themeMusic');
    await tap('settings-music');
    await waitFor(() => expect(checked('settings-music')).toBe(true));
    expect(music.getThemeMusic().on).toBe(true);
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(mockStore.get('wmt.pref.music')).toBe('on');

    // The button flips it; the row follows.
    await act(async () => void (await music.toggleThemeMusic()));
    await waitFor(() => expect(checked('settings-music')).toBe(false));

    await tap('settings-music');
    await waitFor(() => expect(checked('settings-music')).toBe(true));
    await tap('settings-music');
    await waitFor(() => expect(checked('settings-music')).toBe(false));
    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  it('a first download that fails from the Music row says so on Settings, and the switch stays off', async () => {
    mockSaved = null;
    mockDownloadFails = true;
    await open();
    const { THEME_FAILED } = require('@/features/music/themeMusic') as typeof import('@/features/music/themeMusic');
    expect(screen.queryByTestId('music-notice')).toBeNull();
    await tap('settings-music');
    await waitFor(() => expect(screen.getByText(THEME_FAILED)).toBeTruthy());
    expect(screen.getByTestId('music-notice')).toBeTruthy();
    expect(checked('settings-music')).toBe(false);
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('a push shown while the app is open still reads the Alert sound switch, and Music does not touch it', async () => {
    await open();
    const { installPushHandler } = require('@/features/push/registration') as typeof import('@/features/push/registration');
    installPushHandler();
    expect(await mockHandler?.handleNotification()).toMatchObject({ shouldShowBanner: true, shouldPlaySound: false });

    await tap('settings-music');
    await waitFor(() => expect(checked('settings-music')).toBe(true));
    expect(checked('settings-sound')).toBe(false);
    expect(await mockHandler?.handleNotification()).toMatchObject({ shouldPlaySound: false });

    await tap('settings-sound');
    await waitFor(() => expect(checked('settings-sound')).toBe(true));
    expect(mockStore.get('wmt.pref.sound')).toBe('on');
    expect(await mockHandler?.handleNotification()).toMatchObject({ shouldPlaySound: true });
  });
});
