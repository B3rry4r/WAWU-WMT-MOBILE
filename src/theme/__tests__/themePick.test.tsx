/* eslint-disable @typescript-eslint/no-require-imports */
import { act, renderHook } from '@testing-library/react-native';
import { Appearance } from 'react-native';

let mockPhone: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockPhone,
}));

/**
 * SWEEP-FLOWS B7: Settings, Theme, Dark (and Light) take effect at once and after a reload, and System follows the phone, whether or
 * not the platform lets `Appearance.setColorScheme` pin a scheme (the browser build cannot, so the pick is the app's own).
 */
const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
}));

let setScheme: jest.SpyInstance;

const theme = require('@/theme') as typeof import('@/theme');
const prefs = require('@/features/settings/devicePrefs') as typeof import('@/features/settings/devicePrefs');
const { setThemePick } = require('@/theme/override') as typeof import('@/theme/override');

beforeEach(() => {
  mockStore.clear();
  mockPhone = 'light';
  setThemePick('system');
  // The platform cannot pin a scheme: the pick has to work without it.
  setScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
});

afterEach(() => {
  setScheme.mockRestore();
});

describe('the theme a person picks', () => {
  it('Dark on a light phone draws dark at once, and Light on a dark phone draws light at once', async () => {
    const hook = await renderHook(() => theme.useWawu().dark);
    expect(hook.result.current).toBe(false);
    await act(async () => {
      await prefs.setTheme('dark');
    });
    expect(hook.result.current).toBe(true);
    await act(async () => {
      await prefs.setTheme('light');
    });
    expect(hook.result.current).toBe(false);
    mockPhone = 'dark';
    await act(async () => {
      await prefs.setTheme('system');
    });
    expect(hook.result.current).toBe(true);
  });

  it('System follows the phone, and a phone that does not say is dark (the design\'s default)', async () => {
    expect((await renderHook(() => theme.useWawu().dark)).result.current).toBe(false);
    mockPhone = 'dark';
    expect((await renderHook(() => theme.useWawu().dark)).result.current).toBe(true);
    mockPhone = null;
    expect((await renderHook(() => theme.useWawu().dark)).result.current).toBe(true);
  });

  it('is applied again after a reload: the saved Dark reads back and draws dark on a light phone', async () => {
    mockStore.set('wmt.pref.theme', 'dark');
    const hook = await renderHook(() => theme.useWawu().dark);
    expect(hook.result.current).toBe(false);
    await act(async () => {
      await prefs.applyStoredTheme();
    });
    expect(hook.result.current).toBe(true);
  });

  it('takes the colours of the pick, not of the phone', async () => {
    const hook = await renderHook(() => theme.useWawu().colors.surfacePage);
    const light = hook.result.current;
    await act(async () => {
      await prefs.setTheme('dark');
    });
    expect(hook.result.current).not.toBe(light);
  });
});
