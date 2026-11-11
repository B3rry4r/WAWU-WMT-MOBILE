import { act, fireEvent, render, screen } from '@testing-library/react-native';

/**
 * WEBAPP-11 (R-131): the web half run against a stand-in browser (window, matchMedia, storage, the install offer). The address the
 * person opened is never touched by the screen: Continue only lets the app draw.
 */
type Handler = (e: unknown) => void;
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

const handlers: Record<string, Handler[]> = {};
let now = 0;
jest.spyOn(performance, 'now').mockImplementation(() => now);
const g = globalThis as unknown as Record<string, unknown>;
// The module catches the browser's offer when it loads, so the stand-in window exists before it is required (once: one React).
g.window = { addEventListener: (n: string, h: Handler) => (handlers[n] ||= []).push(h) };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require('@/features/install/InstallAsk.web') as typeof import('@/features/install/InstallAsk.web');

function browser(opts: { ua: string; standalone?: boolean; continued?: boolean; href?: string }) {
  const store: Record<string, string> = opts.continued ? { 'wmt.install.continued': '1' } : {};
  const clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
  Object.assign(g.window as object, {
    matchMedia: (q: string) => ({ matches: Boolean(opts.standalone) && q.includes('standalone') }),
    location: { href: opts.href ?? 'https://x.test/r/ABC123' },
  });
  g.sessionStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v), removeItem: (k: string) => void delete store[k] };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: opts.ua, maxTouchPoints: 0, clipboard }, configurable: true });
  mod.resetInstallAsk();
  now = 0;
  if (opts.continued) store['wmt.install.continued'] = '1';
  return { fire: (n: string, e: unknown) => (handlers[n] ?? []).forEach((h) => h(e)), clipboard, store };
}

function Probe() {
  return <mod.InstallAskScreen />;
}

const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const offer = (outcome: 'accepted' | 'dismissed' = 'dismissed', choice?: Promise<{ outcome: string }>) => ({
  preventDefault: jest.fn(),
  prompt: jest.fn().mockResolvedValue(undefined),
  userChoice: choice ?? Promise.resolve({ outcome }),
});
const stored = (b: { store: Record<string, string> }) => b.store['wmt.install.continued'];

describe('the web install screen is drawn over the app, never instead of it', () => {
  it('opened from the icon (standalone) it never shows', async () => {
    browser({ ua: ANDROID, standalone: true });
    await render(<Probe />);
    expect(screen.queryByTestId('install-screen')).toBeNull();
  });

  it('Android Chrome: menu steps from the first paint; an offer in the window makes the Install button, which calls prompt(); any answer ends the screen', async () => {
    const b = browser({ ua: ANDROID });
    await render(<Probe />);
    expect(screen.getByTestId('install-steps')).toBeTruthy();
    expect(screen.queryByTestId('install-button')).toBeNull();
    const o = offer('accepted');
    now = 800;
    await act(async () => b.fire('beforeinstallprompt', o));
    expect(o.preventDefault).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('install-button'));
    expect(o.prompt).toHaveBeenCalledTimes(1);
    await act(async () => undefined);
    expect(screen.queryByTestId('install-overlay')).toBeNull();
    expect(stored(b)).toBe('1');
  });

  it('Continue in the browser ends the screen, latches the tab, and does not touch the address', async () => {
    const b = browser({ ua: ANDROID, href: 'https://x.test/content/abc?ref=1' });
    await render(<Probe />);
    await fireEvent.press(screen.getByTestId('install-continue'));
    expect(screen.queryByTestId('install-screen')).toBeNull();
    expect(stored(b)).toBe('1');
    expect((globalThis as unknown as { window: { location: { href: string } } }).window.location.href).toBe('https://x.test/content/abc?ref=1');
  });

  it('a tab that already answered does not ask again', async () => {
    browser({ ua: ANDROID, continued: true });
    await render(<Probe />);
    expect(screen.queryByTestId('install-screen')).toBeNull();
  });

  it('the copy button copies the address that was opened', async () => {
    const b = browser({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0.0.10.100', href: 'https://x.test/r/ABC123' });
    await render(<Probe />);
    await fireEvent.press(screen.getByTestId('install-copy'));
    await act(async () => undefined);
    expect(b.clipboard.writeText).toHaveBeenCalledWith('https://x.test/r/ABC123');
  });

  it('desktop Chrome: no offer means nothing is drawn, at any time (no blank wait)', async () => {
    jest.useFakeTimers();
    browser({ ua: DESKTOP });
    await render(<Probe />);
    expect(screen.toJSON()).toBeNull();
    await act(async () => jest.advanceTimersByTime(10000));
    expect(screen.toJSON()).toBeNull();
    jest.useRealTimers();
  });

  it('desktop Chrome: an offer inside the window draws the Install button over the app', async () => {
    const b = browser({ ua: DESKTOP });
    await render(<Probe />);
    now = 900;
    await act(async () => b.fire('beforeinstallprompt', offer()));
    expect(screen.getByTestId('install-button')).toBeTruthy();
  });

  it('H1: Install then cancelled (the browser dialog closed 5 s later) lands on the app, not an empty page', async () => {
    const b = browser({ ua: DESKTOP });
    await render(<Probe />);
    now = 1000;
    let cancel!: (v: { outcome: string }) => void;
    const o = offer('dismissed', new Promise((r) => (cancel = r)));
    await act(async () => b.fire('beforeinstallprompt', o));
    await fireEvent.press(screen.getByTestId('install-button'));
    now = 6000;
    await act(async () => cancel({ outcome: 'dismissed' }));
    expect(screen.toJSON()).toBeNull();
    expect(stored(b)).toBe('1');
    // and a new offer does not bring it back
    await act(async () => b.fire('beforeinstallprompt', offer()));
    expect(screen.toJSON()).toBeNull();
  });

  it('H1: a prompt that throws also ends on the app', async () => {
    const b = browser({ ua: DESKTOP });
    await render(<Probe />);
    now = 500;
    const o = offer();
    o.prompt = jest.fn().mockRejectedValue(new Error('no'));
    await act(async () => b.fire('beforeinstallprompt', o));
    await fireEvent.press(screen.getByTestId('install-button'));
    await act(async () => undefined);
    expect(screen.toJSON()).toBeNull();
  });

  it('M1: an offer after the window (5 s) never replaces the app, on a computer or on a phone', async () => {
    const b = browser({ ua: DESKTOP });
    await render(<Probe />);
    now = 5000;
    await act(async () => b.fire('beforeinstallprompt', offer()));
    expect(screen.toJSON()).toBeNull();
    const a = browser({ ua: ANDROID, continued: true });
    now = 5000;
    await act(async () => a.fire('beforeinstallprompt', offer()));
    expect(screen.queryByTestId('install-button')).toBeNull();
  });

  it('an offer after the person has touched the page is ignored, and the visit is latched', async () => {
    const b = browser({ ua: DESKTOP });
    await render(<Probe />);
    now = 400;
    await act(async () => b.fire('pointerdown', {}));
    expect(stored(b)).toBe('1');
    await act(async () => b.fire('beforeinstallprompt', offer()));
    expect(screen.toJSON()).toBeNull();
  });

  it('the latch holds for the visit: a touch while the screen is up does not end it, an answer does', async () => {
    const b = browser({ ua: ANDROID });
    await render(<Probe />);
    await act(async () => b.fire('keydown', {}));
    expect(screen.getByTestId('install-screen')).toBeTruthy();
    expect(stored(b)).toBeUndefined();
    await fireEvent.press(screen.getByTestId('install-continue'));
    expect(stored(b)).toBe('1');
    await act(async () => b.fire('beforeinstallprompt', offer()));
    expect(screen.toJSON()).toBeNull();
  });

  it('desktop Firefox shows no screen at all', async () => {
    browser({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0' });
    await render(<Probe />);
    expect(screen.toJSON()).toBeNull();
  });

  it('Safari 17 or later on a Mac shows the Add to Dock steps', async () => {
    browser({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15' });
    await render(<Probe />);
    expect(screen.getByText('Choose Add to Dock.')).toBeTruthy();
  });
});
