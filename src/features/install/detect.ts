/**
 * WEBAPP-11 (R-131): which browser a person opened the web app in, read from the user agent and the page's own flags, so the install
 * screen shows the right thing. Pure: a test passes each browser's user agent.
 */
export type InAppName = 'Instagram' | 'WhatsApp' | 'Facebook' | 'Messenger' | 'X' | 'TikTok' | 'LinkedIn' | 'Snapchat' | 'Line' | 'another app';

export type InstallContext =
  | { kind: 'standalone' }
  /** Another app's own browser (Instagram, WhatsApp and the rest): the link must be opened in Safari or Chrome first. */
  | { kind: 'inapp'; app: InAppName; os: 'ios' | 'android' | 'other' }
  /** Safari on an iPhone or an iPad (iPadOS asks for a desktop page, so it is told by touch points): Share, then Add to Home Screen. */
  | { kind: 'ios-safari' }
  /** Safari 17 or later on a Mac: File, Add to Dock. */
  | { kind: 'mac-safari' }
  /** Chrome, Firefox or Edge on iOS: Add to Home Screen is Safari's, so the person is sent there. */
  | { kind: 'ios-other' }
  /** Chrome, Edge, Samsung Internet, Opera: the browser can install (the Install button when it offers the prompt, else its menu). */
  | { kind: 'chromium'; os: 'android' | 'desktop' }
  /** Firefox and Safari on a computer, or anything else that cannot install the app. */
  | { kind: 'cannot' };

export type Signals = {
  userAgent: string;
  /** `matchMedia('(display-mode: standalone)').matches` or `fullscreen`/`minimal-ui`. */
  displayModeStandalone?: boolean;
  /** iOS Safari's own `navigator.standalone`. */
  navigatorStandalone?: boolean;
  maxTouchPoints?: number;
};

const IN_APP: readonly (readonly [RegExp, InAppName])[] = [
  [/Instagram/i, 'Instagram'],
  [/WhatsApp/i, 'WhatsApp'],
  [/Messenger|FBAN\/Orca|MessengerForiOS|MessengerLite/i, 'Messenger'],
  [/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i, 'Facebook'],
  [/Twitter|TwitterAndroid/i, 'X'],
  [/musical_ly|TikTok|BytedanceWebview|Bytedance|trill_/i, 'TikTok'],
  [/LinkedInApp/i, 'LinkedIn'],
  [/Snapchat/i, 'Snapchat'],
  [/\bLine\//i, 'Line'],
];

/** The in-app browser named in the user agent, or null. A bare web view (no Safari token on iOS, `; wv)` on Android) is "another app". */
export function inAppName(ua: string): InAppName | null {
  for (const [re, name] of IN_APP) if (re.test(ua)) return name;
  const ios = /iPhone|iPad|iPod/.test(ua);
  if (ios && /AppleWebKit/.test(ua) && !/Safari\//.test(ua)) return 'another app';
  if (/Android/.test(ua) && /; wv\)/.test(ua)) return 'another app';
  return null;
}

export function isIos(ua: string, maxTouchPoints = 0): boolean {
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
}

/** An iPad (its Safari asks for a desktop page, so a Mac with touch points): its Share button is at the top of Safari, an iPhone's at the bottom. */
export function isIpad(ua: string, maxTouchPoints = 0): boolean {
  return /iPad/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
}

export function detectInstallContext(s: Signals): InstallContext {
  if (s.displayModeStandalone || s.navigatorStandalone) return { kind: 'standalone' };
  const ua = s.userAgent ?? '';
  const ios = isIos(ua, s.maxTouchPoints ?? 0);
  const android = /Android/.test(ua);
  const app = inAppName(ua);
  if (app) return { kind: 'inapp', app, os: ios ? 'ios' : android ? 'android' : 'other' };
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? { kind: 'ios-other' } : { kind: 'ios-safari' };
  if (/Firefox\//.test(ua) && !android) return { kind: 'cannot' };
  const safari = /Macintosh/.test(ua) && /Version\/(\d+)/.exec(ua) && !/Chrome\/|Chromium\/|Edg\/|OPR\//.test(ua) ? Number(/Version\/(\d+)/.exec(ua)?.[1]) : 0;
  if (safari >= 17) return { kind: 'mac-safari' };
  if (/Chrome\/|Chromium\/|Edg\/|SamsungBrowser\/|OPR\//.test(ua)) return { kind: 'chromium', os: android ? 'android' : 'desktop' };
  // Firefox on Android and anything unknown on a phone: its own menu may offer Add to Home screen.
  if (android) return { kind: 'chromium', os: 'android' };
  return { kind: 'cannot' };
}
