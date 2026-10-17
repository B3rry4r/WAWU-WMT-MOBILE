import appConfig from '../../app.json';
import { codeFromLink } from '@/features/referral/model';
import { INVITE_PATH_PREFIX, LINK_HOST, LINK_ORIGIN, SELFIE_PATH, inviteLink, readableLink, selfieReturnUrl } from '@/lib/appLinks';

/**
 * LINKS-01: the addresses WAWU shares and receives. `app.json` (what the phone is told) and `src/lib/appLinks.ts` (what
 * the app builds and the website lists) must say the same, and say only the two app paths.
 */
describe('LINKS-01: the app links', () => {
  it('an invite is shared as an https address on the website, the code in lower case', () => {
    expect(inviteLink('LENNOX')).toBe('https://wawuafrica.com/r/lennox');
    expect(inviteLink(' Amaka-2_x ')).toBe('https://wawuafrica.com/r/amaka-2_x');
    expect(inviteLink('a b')).toBe('https://wawuafrica.com/r/a%20b');
  });

  it('the code in a shared invite reads back, however the link arrives', () => {
    for (const link of [inviteLink('LENNOX'), 'wawu/r/lennox', 'wawu://r/lennox', 'https://wawuafrica.com/r/lennox/', 'lennox']) {
      expect(codeFromLink(link)).toBe('lennox');
    }
  });

  it('a card shows the link without its scheme', () => {
    expect(readableLink(inviteLink('lennox'))).toBe('wawuafrica.com/r/lennox');
    expect(readableLink('wawuafrica.com/r/lennox')).toBe('wawuafrica.com/r/lennox');
  });

  it('the selfie page returns to its own path, never /join', () => {
    expect(selfieReturnUrl()).toBe('https://wawuafrica.com/selfie');
    expect(selfieReturnUrl()).not.toContain('/join');
    expect(SELFIE_PATH).not.toBe('/join');
  });

  it('app.json tells iOS the website opens in the app, and nothing else', () => {
    expect(appConfig.expo.ios.associatedDomains).toEqual([`applinks:${LINK_HOST}`]);
    expect(appConfig.expo.scheme).toBe('wawu');
  });

  it('app.json tells Android to open exactly /r/ and /selfie on the website, verified', () => {
    const filters = appConfig.expo.android.intentFilters;
    expect(filters).toHaveLength(1);
    const [filter] = filters;
    expect(filter.action).toBe('VIEW');
    expect(filter.autoVerify).toBe(true);
    expect([...filter.category].sort()).toEqual(['BROWSABLE', 'DEFAULT']);
    expect(filter.data).toEqual([
      { scheme: 'https', host: LINK_HOST, pathPrefix: INVITE_PATH_PREFIX },
      { scheme: 'https', host: LINK_HOST, path: SELFIE_PATH },
    ]);
  });

  it('the origin is the one host and no other', () => {
    expect(LINK_ORIGIN).toBe(`https://${LINK_HOST}`);
    expect(LINK_HOST).toBe('wawuafrica.com');
  });
});
