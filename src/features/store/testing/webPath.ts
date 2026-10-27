import { Platform } from 'react-native';

/*
 * Import this in a test file that tests the WALLET path of a purchase (R-101). On a phone with a store (Android and iOS, which is what jest's
 * default platform is) a piece, a tip, a community pass and a paid question are store purchases, drawn and tested in
 * `features/store/__tests__/ladder*.test.*`. The wallet path stays for the website and the app's web export, so a file that tests it runs
 * as the web: the platform is 'web' for each test (after the code has loaded), and put back after.
 */
let replaced: { restore: () => void } | null = null;
beforeEach(() => {
  replaced = jest.replaceProperty(Platform, 'OS', 'web');
});
afterEach(() => {
  replaced?.restore();
  replaced = null;
});
