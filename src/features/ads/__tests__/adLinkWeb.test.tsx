/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

/**
 * FIX-P5 (CHECK-3 fifth pass, L6, R-92) · an ad's link opens in a new tab on the web build, so the person keeps the app in the tab they
 * were in. On a phone it still goes to the phone's browser through expo-linking, as before. (expo-linking's own web `openURL` sets
 * `window.location`, which is what replaced the app's tab.)
 */
const mockOpenURL = jest.fn(async (_url: string) => true);
jest.mock('expo-linking', () => ({ openURL: (url: string) => mockOpenURL(url) }));

const { drawable, openAd } = require('../api') as typeof import('../api');

const LINK_URL = 'https://acme.example.com/shop?ref=wawu';
const base = { id: '11111111-1111-4111-8111-111111111111', advertiser: 'Acme', headline: 'Shop with Acme', subline: 'Lagos', artworkUrl: 'https://cdn.example.test/ad.jpg' };
const link = drawable({ ...base, ctaLabel: 'Visit us', ctaDestination: 'link', ctaUrl: LINK_URL });
const event = drawable({ ...base, ctaLabel: 'Get tickets', ctaDestination: 'event', ctaDestinationId: '22222222-2222-4222-8222-222222222222' });

const mockWindowOpen = jest.fn();
const realOpen = (globalThis as { open?: unknown }).open;

beforeEach(() => {
  mockOpenURL.mockClear();
  mockWindowOpen.mockClear();
  (globalThis as { open?: unknown }).open = mockWindowOpen;
});
afterEach(() => {
  jest.restoreAllMocks();
  (globalThis as { open?: unknown }).open = realOpen;
});

describe('an ad link on the web build', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web');
  });

  it('opens in a new tab, and the app keeps its own tab', () => {
    if (!link) throw new Error('the link ad should be drawable');
    openAd(link, jest.fn());
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith(LINK_URL, '_blank', 'noopener,noreferrer');
    // expo-linking's web `openURL` replaces the current tab: it is not used for an ad on the web.
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('an event ad still opens its event in the app, not a tab', () => {
    if (!event) throw new Error('the event ad should be drawable');
    const openEvent = jest.fn();
    openAd(event, openEvent);
    expect(openEvent).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
    expect(mockWindowOpen).not.toHaveBeenCalled();
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});

describe.each(['ios', 'android'] as const)('an ad link on %s', (os) => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', os);
  });

  it("still goes to the phone's browser, and opens no tab", () => {
    if (!link) throw new Error('the link ad should be drawable');
    openAd(link, jest.fn());
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    expect(mockOpenURL).toHaveBeenCalledWith(LINK_URL);
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });
});
