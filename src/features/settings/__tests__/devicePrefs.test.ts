/* eslint-disable @typescript-eslint/no-require-imports */
import { Appearance } from 'react-native';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
}));

type Prefs = typeof import('../devicePrefs');
let prefs: Prefs;
let setScheme: jest.SpyInstance;

beforeEach(() => {
  mockStore.clear();
  jest.resetModules();
  prefs = require('../devicePrefs') as Prefs;
  setScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
});

afterEach(() => setScheme.mockRestore());

describe('this phone\'s Theme and Sound choices', () => {
  it('start as System and sound off, as Z2 draws them', async () => {
    expect(await prefs.loadPrefs()).toEqual({ theme: 'system', sound: false });
  });

  it('are kept between launches', async () => {
    await prefs.setTheme('dark');
    await prefs.setSound(true);
    expect(await prefs.loadPrefs()).toEqual({ theme: 'dark', sound: true });
    await prefs.setSound(false);
    expect((await prefs.loadPrefs()).sound).toBe(false);
  });

  it('ignore a stored theme it does not know', async () => {
    mockStore.set(prefs.THEME_KEY, 'sepia');
    expect((await prefs.loadPrefs()).theme).toBe('system');
  });

  it('pin the app to Light or Dark, and hand it back to the phone for System', async () => {
    await prefs.setTheme('light');
    expect(setScheme).toHaveBeenLastCalledWith('light');
    await prefs.setTheme('dark');
    expect(setScheme).toHaveBeenLastCalledWith('dark');
    await prefs.setTheme('system');
    expect(setScheme).toHaveBeenLastCalledWith('unspecified');
  });

  it('are applied at launch from what was saved', async () => {
    mockStore.set(prefs.THEME_KEY, 'dark');
    await prefs.applyStoredTheme();
    expect(setScheme).toHaveBeenLastCalledWith('dark');
  });
});
