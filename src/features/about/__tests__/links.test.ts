import { Platform } from 'react-native';

import { appVersion, rateUrl } from '../links';

let mockConfig: { version?: string; android?: { package?: string } } | null = null;
jest.mock('expo-constants', () => ({ __esModule: true, default: { get expoConfig() { return mockConfig; } } }));

const original = Platform.OS;
const setOS = (os: 'ios' | 'android' | 'web') => {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
};

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => original });
  mockConfig = null;
});

describe('appVersion', () => {
  it('is the version in the app config, trimmed, and nothing else', () => {
    mockConfig = { version: ' 3.1.4 ' };
    expect(appVersion()).toBe('3.1.4');
  });

  it('is null when the build carries no version, never a typed-in number', () => {
    mockConfig = null;
    expect(appVersion()).toBeNull();
    mockConfig = { version: '  ' };
    expect(appVersion()).toBeNull();
  });
});

describe('rateUrl', () => {
  it('on Android is the Play page of the package in the app config', () => {
    setOS('android');
    mockConfig = { android: { package: 'africa.example.app' } };
    expect(rateUrl()).toBe('https://play.google.com/store/apps/details?id=africa.example.app');
  });

  it('on an iPhone is null: there is no App Store page to send a person to', () => {
    setOS('ios');
    mockConfig = { android: { package: 'africa.example.app' } };
    expect(rateUrl()).toBeNull();
  });

  it('is null when the config has no Android package', () => {
    setOS('android');
    mockConfig = { version: '1.0.0' };
    expect(rateUrl()).toBeNull();
  });
});
