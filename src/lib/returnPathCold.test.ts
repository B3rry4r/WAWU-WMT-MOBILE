import { Platform } from 'react-native';

import { captureLandingPath, dropColdPath, peekColdPath, resetReturnPathForTests, takeColdPath, takeReturnPath } from './returnPath';

/** WEBAPP-08 F10: the address this page load opened on is kept for the tier offer that stands in front of it. */
describe('the cold address', () => {
  let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
  beforeEach(() => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    resetReturnPathForTests();
  });
  afterEach(() => {
    os?.restore();
    resetReturnPathForTests();
  });

  it('keeps /me (and a query) and gives it once', () => {
    captureLandingPath({ pathname: '/me', search: '?a=1' });
    expect(peekColdPath()).toBe('/me?a=1');
    expect(takeColdPath()).toBe('/me?a=1');
    expect(takeColdPath()).toBeNull();
  });

  it('keeps nothing for the signed-out set or Home', () => {
    captureLandingPath({ pathname: '/', search: '' });
    captureLandingPath({ pathname: '/sign-in', search: '' });
    expect(peekColdPath()).toBeNull();
  });

  it('is forgotten when it was reached, and when the sign-in return takes it', () => {
    captureLandingPath({ pathname: '/wallet', search: '' });
    dropColdPath();
    expect(takeColdPath()).toBeNull();
    captureLandingPath({ pathname: '/wallet', search: '' });
    expect(takeReturnPath()).toBe('/wallet');
    expect(takeColdPath()).toBeNull();
  });
});
