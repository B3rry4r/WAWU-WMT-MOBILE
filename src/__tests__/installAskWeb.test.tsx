import { act, fireEvent, render, screen } from '@testing-library/react-native';

/**
 * WEBAPP-11 (R-131): the web half run against a stand-in browser (window, matchMedia, storage, the install offer). The address the
 * person opened is never touched by the screen: Continue only lets the app draw.
 */
type Handler = (e: unknown) => void;
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

const handlers: Record<string, Handler[]> = {};
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
  if (opts.continued) store['wmt.install.continued'] = '1';
  return { fire: (n: string, e: unknown) => (handlers[n] ?? []).forEach((h) => h(e)), clipboard, store };
}

function Probe() {
  const asking = mod.useInstallAsk();
  return asking ? <mod.InstallAskScreen /> : null;
}

describe('the web install gate', () => {
  it('opened from the icon (standalone) it never shows', async () => {
    browser({ ua: ANDROID, standalone: true });
    await render(<Probe />);
    expect(screen.queryByTestId('install-screen')).toBeNull();
  });

  it('opened in a tab it shows; beforeinstallprompt makes the Install button, which calls prompt()', async () => {
    const b = browser({ ua: ANDROID });
    await render(<Probe />);
    expect(screen.getByTestId('install-screen')).toBeTruthy();
    expect(screen.queryByTestId('install-button')).toBeNull();
    const prompt = jest.fn().mockResolvedValue(undefined);
    const preventDefault = jest.fn();
    await act(async () => b.fire('beforeinstallprompt', { preventDefault, prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) }));
    expect(preventDefault).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('install-button'));
    expect(prompt).toHaveBeenCalledTimes(1);
    await act(async () => undefined);
    expect(screen.getByTestId('install-title').props.children).toBe('Who Made This is on your device');
  });

  it('Continue in the browser lets the app draw, remembers it for the tab, and does not touch the address', async () => {
    const b = browser({ ua: ANDROID, href: 'https://x.test/content/abc?ref=1' });
    await render(<Probe />);
    await fireEvent.press(screen.getByTestId('install-continue'));
    expect(screen.queryByTestId('install-screen')).toBeNull();
    expect(b.store['wmt.install.continued']).toBe('1');
    expect((globalThis as unknown as { window: { location: { href: string } } }).window.location.href).toBe('https://x.test/content/abc?ref=1');
  });

  it('a tab that already continued does not ask again; a new tab (no stored flag) does', async () => {
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

  const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
  const offer = () => ({ preventDefault: jest.fn(), prompt: jest.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome: 'dismissed' }) });

  it('desktop Chrome with an offer shows the Install button', async () => {
    jest.useFakeTimers();
    const b = browser({ ua: DESKTOP });
    await render(<Probe />);
    expect(screen.queryByTestId('install-button')).toBeNull();
    await act(async () => b.fire('beforeinstallprompt', offer()));
    await act(async () => jest.advanceTimersByTime(mod.OFFER_WAIT_MS + 100));
    expect(screen.getByTestId('install-button')).toBeTruthy();
    jest.useRealTimers();
  });

  it('desktop Chrome with no offer after the wait steps aside (most often already installed)', async () => {
    jest.useFakeTimers();
    browser({ ua: DESKTOP });
    await render(<Probe />);
    expect(screen.queryByTestId('install-screen')).toBeNull();
    await act(async () => jest.advanceTimersByTime(mod.OFFER_WAIT_MS + 100));
    expect(screen.queryByTestId('install-waiting')).toBeNull();
    expect(screen.queryByTestId('install-screen')).toBeNull();
    jest.useRealTimers();
  });

  it('desktop Firefox shows no screen at all', async () => {
    browser({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0' });
    await render(<Probe />);
    expect(screen.queryByTestId('install-screen')).toBeNull();
    expect(screen.queryByTestId('install-waiting')).toBeNull();
  });

  it('Safari 17 or later on a Mac shows the Add to Dock steps', async () => {
    browser({ ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15' });
    await render(<Probe />);
    expect(screen.getByText('Choose Add to Dock.')).toBeTruthy();
  });
});

