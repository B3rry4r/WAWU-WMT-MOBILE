import { detectInstallContext, inAppName, isIpad } from '@/features/install/detect';

/** WEBAPP-11 (R-131): each browser the install screen tells apart, from its real user agent. */
const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  ipadSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  iphoneInstagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.10.100 (iPhone15,2; iOS 18_1; en_NG; en; scale=3.00; 1170x2532; 123)',
  androidInstagram: 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0.100 Android (34/14)',
  androidWhatsApp: 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 WhatsApp/2.24.20.85',
  iphoneFacebook: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.0;FBBV/1;FBDV/iPhone15,2]',
  androidFacebook: 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]',
  iphoneX: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone/10.60',
  androidTikTok: 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 musical_ly_2023 BytedanceWebview/d8a21c6',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  desktopEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  desktopFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
};

describe('a person is told apart by where they opened the app', () => {
  it('iPhone Safari gets the Share steps', () => {
    expect(detectInstallContext({ userAgent: UA.iphoneSafari })).toEqual({ kind: 'ios-safari' });
  });
  it('iPadOS Safari (asks for a desktop page, has touch) gets the Share steps; a Mac does not', () => {
    expect(detectInstallContext({ userAgent: UA.ipadSafari, maxTouchPoints: 5 })).toEqual({ kind: 'ios-safari' });
    // Round 1 (lead rule for computers): Safari 17 or later on a Mac is told File, Add to Dock.
    expect(detectInstallContext({ userAgent: UA.macSafari, maxTouchPoints: 0 })).toEqual({ kind: 'mac-safari' });
  });
  it('Chrome on an iPhone is sent to Safari', () => {
    expect(detectInstallContext({ userAgent: UA.iphoneChrome })).toEqual({ kind: 'ios-other' });
  });
  it.each([
    ['Instagram on iPhone', UA.iphoneInstagram, 'Instagram', 'ios'],
    ['Instagram on Android', UA.androidInstagram, 'Instagram', 'android'],
    ['WhatsApp on Android', UA.androidWhatsApp, 'WhatsApp', 'android'],
    ['Facebook on iPhone', UA.iphoneFacebook, 'Facebook', 'ios'],
    ['Facebook on Android', UA.androidFacebook, 'Facebook', 'android'],
    ['X on iPhone', UA.iphoneX, 'X', 'ios'],
    ['TikTok on Android', UA.androidTikTok, 'TikTok', 'android'],
  ] as const)('%s is an in-app browser', (_n, userAgent, app, os) => {
    expect(detectInstallContext({ userAgent })).toEqual({ kind: 'inapp', app, os });
  });
  it('a bare web view (iOS with no Safari token, Android `wv`) is another app', () => {
    expect(inAppName('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148')).toBe('another app');
    expect(inAppName('Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Version/4.0 Chrome/130 Mobile Safari/537.36')).toBe('another app');
    expect(inAppName(UA.iphoneSafari)).toBeNull();
    expect(inAppName(UA.androidChrome)).toBeNull();
  });
  it('Chrome, Edge and Samsung Internet can install', () => {
    expect(detectInstallContext({ userAgent: UA.androidChrome })).toEqual({ kind: 'chromium', os: 'android' });
    expect(detectInstallContext({ userAgent: UA.samsung })).toEqual({ kind: 'chromium', os: 'android' });
    expect(detectInstallContext({ userAgent: UA.desktopChrome })).toEqual({ kind: 'chromium', os: 'desktop' });
    expect(detectInstallContext({ userAgent: UA.desktopEdge })).toEqual({ kind: 'chromium', os: 'desktop' });
  });
  it('Firefox on a computer cannot install', () => {
    expect(detectInstallContext({ userAgent: UA.desktopFirefox })).toEqual({ kind: 'cannot' });
  });
  it('opened from the icon (display-mode standalone, or iOS navigator.standalone) it is standalone, whatever the agent says', () => {
    expect(detectInstallContext({ userAgent: UA.androidChrome, displayModeStandalone: true })).toEqual({ kind: 'standalone' });
    expect(detectInstallContext({ userAgent: UA.iphoneSafari, navigatorStandalone: true })).toEqual({ kind: 'standalone' });
    expect(detectInstallContext({ userAgent: UA.iphoneInstagram, displayModeStandalone: true })).toEqual({ kind: 'standalone' });
  });
});

describe('round 1: computers and iPad', () => {
  it('Safari 16 on a Mac cannot install; Chrome on a Mac is Chromium, not Safari', () => {
    expect(detectInstallContext({ userAgent: UA.macSafari.replace('Version/18.1', 'Version/16.6') })).toEqual({ kind: 'cannot' });
    expect(detectInstallContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })).toEqual({ kind: 'chromium', os: 'desktop' });
  });
  it('an iPad is told from an iPhone', () => {
    expect(isIpad(UA.ipadSafari, 5)).toBe(true);
    expect(isIpad('Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Version/18.1 Mobile/15E148 Safari/604.1', 5)).toBe(true);
    expect(isIpad(UA.iphoneSafari, 5)).toBe(false);
    expect(isIpad(UA.macSafari, 0)).toBe(false);
  });
});

