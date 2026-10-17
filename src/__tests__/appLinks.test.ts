import { existsSync } from 'fs';
import { join } from 'path';

import appConfig from '../../app.json';
import { codeFromLink } from '@/features/referral/model';
import {
  ACTIVATE_PATH,
  INVITE_PATH_PREFIX,
  LINK_HOST,
  LINK_ORIGIN,
  PROFILE_PATH_PREFIX,
  RECEIPT_PATH_PREFIX,
  ROOM_PATH_PREFIX,
  SELFIE_PATH,
  inviteLink,
  profileLink,
  readableLink,
  roomLink,
  selfieReturnUrl,
} from '@/lib/appLinks';

/**
 * LINKS-01: the addresses WAWU shares and receives. `app.json` (what the phone is told) and `src/lib/appLinks.ts` (what
 * the app builds and the website lists) must say the same, and say only the six app paths.
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

  it('a profile is shared as an https address on the website, the handle without its @', () => {
    expect(profileLink('lennox')).toBe('https://wawuafrica.com/u/lennox');
    expect(profileLink(' @Lennox.Films_2 ')).toBe('https://wawuafrica.com/u/Lennox.Films_2');
    expect(readableLink(profileLink('lennox'))).toBe('wawuafrica.com/u/lennox');
  });

  it('a room is shared as an https address on the website, the slug in lower case', () => {
    expect(roomLink('aba-tailors')).toBe('https://wawuafrica.com/c/aba-tailors');
    expect(roomLink(' Aba-Tailors-2 ')).toBe('https://wawuafrica.com/c/aba-tailors-2');
  });

  it('a receipt has its own path and never the invite path', () => {
    expect(RECEIPT_PATH_PREFIX).toBe('/receipt/');
    expect(RECEIPT_PATH_PREFIX).not.toBe(INVITE_PATH_PREFIX);
    expect(RECEIPT_PATH_PREFIX.startsWith(INVITE_PATH_PREFIX)).toBe(false);
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

  it('app.json tells Android to open exactly the six app paths on the website, verified', () => {
    const filters = appConfig.expo.android.intentFilters;
    expect(filters).toHaveLength(1);
    const [filter] = filters;
    expect(filter.action).toBe('VIEW');
    expect(filter.autoVerify).toBe(true);
    expect([...filter.category].sort()).toEqual(['BROWSABLE', 'DEFAULT']);
    expect(filter.data).toEqual([
      { scheme: 'https', host: LINK_HOST, pathPrefix: INVITE_PATH_PREFIX },
      { scheme: 'https', host: LINK_HOST, path: SELFIE_PATH },
      { scheme: 'https', host: LINK_HOST, path: ACTIVATE_PATH },
      { scheme: 'https', host: LINK_HOST, pathPrefix: RECEIPT_PATH_PREFIX },
      { scheme: 'https', host: LINK_HOST, pathPrefix: PROFILE_PATH_PREFIX },
      { scheme: 'https', host: LINK_HOST, pathPrefix: ROOM_PATH_PREFIX },
    ]);
    // Nothing of the registration campaign or any other website page is claimed.
    for (const entry of filter.data) expect(`${entry.path ?? entry.pathPrefix}`.startsWith('/join')).toBe(false);
  });

  it('every path app.json claims has a route in the app that handles it', () => {
    // The file the app's router uses for each claimed path (`src/app/...`): a claimed path with no route would open the app on nothing.
    const routeFile: Record<string, string> = {
      '/r/': 'r/[code].tsx',
      '/selfie': 'selfie.tsx',
      '/activate': 'activate.tsx',
      '/receipt/': 'receipt/[code].tsx',
      '/u/': 'u/[handle].tsx',
      '/c/': 'c/[slug].tsx',
    };
    const claimed = appConfig.expo.android.intentFilters[0].data.map((entry) => `${'path' in entry ? entry.path : entry.pathPrefix}`);
    expect([...claimed].sort()).toEqual(Object.keys(routeFile).sort());
    for (const path of claimed) expect(existsSync(join(__dirname, '..', 'app', routeFile[path]))).toBe(true);
  });

  it('the origin is the one host and no other', () => {
    expect(LINK_ORIGIN).toBe(`https://${LINK_HOST}`);
    expect(LINK_HOST).toBe('wawuafrica.com');
  });
});
