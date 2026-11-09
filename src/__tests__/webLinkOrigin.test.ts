import { Platform } from 'react-native';

import { LINK_ORIGIN, contentShareLink, inviteLink, linkOrigin, profileLink, receiptLink, roomLink, selfieReturnUrl } from '@/lib/appLinks';
import { contentLink } from '@/features/content-detail/model';

/** WEBAPP-01: a link made on the web app names the web app's own origin; the phone app keeps wawuafrica.com. */
describe('WEBAPP-01: the origin links are written on', () => {
  const realOS = Platform.OS;
  const realLocation = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const setOrigin = (origin: string) => Object.defineProperty(globalThis, 'window', { value: { location: { origin } }, configurable: true });
  afterEach(() => {
    Platform.OS = realOS;
    if (realLocation) Object.defineProperty(globalThis, 'window', realLocation);
    else delete (globalThis as { window?: unknown }).window;
  });

  it.each(['ios', 'android'] as const)('on %s every link is on wawuafrica.com, whatever the page', (os) => {
    Platform.OS = os;
    setOrigin('https://usewmt.com');
    expect(linkOrigin()).toBe(LINK_ORIGIN);
    expect(inviteLink('LENNOX')).toBe('https://wawuafrica.com/r/lennox');
    expect(profileLink('@ada')).toBe('https://wawuafrica.com/u/ada');
    expect(roomLink('Lagos')).toBe('https://wawuafrica.com/c/lagos');
    expect(contentLink('abc')).toBe('https://wawuafrica.com/content/abc');
    expect(receiptLink('X1')).toBe('https://wawuafrica.com/receipt/X1');
    expect(selfieReturnUrl()).toBe('https://wawuafrica.com/selfie');
  });

  it('on the web every link is on the page\'s own origin', () => {
    Platform.OS = 'web';
    setOrigin('https://usewmt.com');
    expect(linkOrigin()).toBe('https://usewmt.com');
    expect(inviteLink('LENNOX')).toBe('https://usewmt.com/r/lennox');
    expect(profileLink('@ada')).toBe('https://usewmt.com/u/ada');
    expect(roomLink('Lagos')).toBe('https://usewmt.com/c/lagos');
    expect(contentLink('abc')).toBe('https://usewmt.com/content/abc');
    expect(contentShareLink('abc')).toBe('https://usewmt.com/content/abc');
    expect(receiptLink('X1')).toBe('https://usewmt.com/receipt/X1');
    expect(selfieReturnUrl()).toBe('https://usewmt.com/selfie');
  });

  it('on the web with no page address it falls back to wawuafrica.com', () => {
    Platform.OS = 'web';
    delete (globalThis as { window?: unknown }).window;
    expect(linkOrigin()).toBe(LINK_ORIGIN);
  });
});
