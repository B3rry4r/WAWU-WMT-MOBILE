import { Platform } from 'react-native';

import { captureLandingPath, resetReturnPathForTests, returnableTarget, settleReturnPath, takeReturnPath } from '@/lib/returnPath';

/** WEBAPP-03: a link opened while signed out is remembered through sign-in. */
jest.mock('@/api/session', () => ({ useSession: () => ({ status: 'signedOut' }) }));
let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
beforeEach(() => {
  resetReturnPathForTests();
  os = jest.replaceProperty(Platform, 'OS', 'web');
});
afterEach(() => os?.restore());

describe('returnableTarget', () => {
  it('keeps an in-app page with its query, and refuses the signed-out screens, app links that look after themselves, and anything off the app', () => {
    expect(returnableTarget('/content/abc')).toBe('/content/abc');
    expect(returnableTarget('/u/ada?tab=works')).toBe('/u/ada?tab=works');
    for (const no of ['/', '/welcome', '/sign-in', '/sign-up', '/r/ABC123', '/reset-password?token=x', '/activate', '/about', '//evil.example', 'https://evil.example', '/\\evil', null, '']) {
      expect(returnableTarget(no)).toBeNull();
    }
  });
});

describe('the landing path', () => {
  it('is read from the address the browser opened on, kept for a visitor who started signed out, and taken once', () => {
    captureLandingPath({ pathname: '/content/abc', search: '' });
    settleReturnPath('signedOut');
    expect(takeReturnPath()).toBe('/content/abc');
    expect(takeReturnPath()).toBeNull();
  });

  it('is dropped when the visitor was already signed in at the start (a later Home must not replay a link)', () => {
    captureLandingPath({ pathname: '/content/abc', search: '' });
    settleReturnPath('signedIn');
    expect(takeReturnPath()).toBeNull();
  });

  it('keeps nothing from the welcome screen or on a phone', () => {
    captureLandingPath({ pathname: '/welcome', search: '' });
    expect(takeReturnPath()).toBeNull();
    os?.restore();
    os = jest.replaceProperty(Platform, 'OS', 'android');
    captureLandingPath({ pathname: '/content/abc', search: '' });
    expect(takeReturnPath()).toBeNull();
  });
});
