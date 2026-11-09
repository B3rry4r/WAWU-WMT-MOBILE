import { Platform, Share } from 'react-native';

import { shareOut } from '@/lib/share';
import { clearShareNote } from '@/lib/shareNote';

/** WEBAPP-03: one share helper for every screen. On a phone it is the system sheet, untouched; in a browser it shares or copies. */
let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
const nav = navigator as unknown as { share?: unknown; clipboard?: unknown };
const original = { share: nav.share, clipboard: nav.clipboard };
afterEach(() => {
  os?.restore();
  os = undefined;
  Object.defineProperty(navigator, 'share', { value: original.share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: original.clipboard, configurable: true });
  clearShareNote();
  jest.restoreAllMocks();
});
const set = (key: 'share' | 'clipboard', value: unknown) => Object.defineProperty(navigator, key, { value, configurable: true });

describe('shareOut', () => {
  it('on a phone (Platform android) hands the text to the system share sheet and gives back its answer', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'android');
    const spy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });
    const out = await shareOut({ message: 'https://usewmt.com/content/1' }, { dialogTitle: 'Share' });
    expect(spy).toHaveBeenCalledWith({ message: 'https://usewmt.com/content/1' }, { dialogTitle: 'Share' });
    expect(out.action).toBe(Share.dismissedAction);
  });

  it('in a browser with a share sheet opens it, and a good share is a share (no missing result read as a failure)', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    const share = jest.fn().mockResolvedValue(undefined);
    set('share', share);
    const out = await shareOut({ message: 'a link https://usewmt.com/u/ada' });
    expect(share).toHaveBeenCalledWith({ text: 'a link https://usewmt.com/u/ada' });
    expect(out.action).toBe(Share.sharedAction);
  });

  it('closing the browser sheet is a dismissal, not a failure', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    set('share', jest.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' })));
    expect((await shareOut({ message: 'x' })).action).toBe(Share.dismissedAction);
  });

  it('in a browser with no share sheet (desktop Chrome) copies the link to the clipboard', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    set('share', undefined);
    const writeText = jest.fn().mockResolvedValue(undefined);
    set('clipboard', { writeText });
    const out = await shareOut({ message: 'https://usewmt.com/content/9' });
    expect(writeText).toHaveBeenCalledWith('https://usewmt.com/content/9');
    expect(out.action).toBe(Share.sharedAction);
  });

  it('rejects when nothing can share or copy, so the screen says it could not', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    set('share', undefined);
    set('clipboard', undefined);
    await expect(shareOut({ message: 'x' })).rejects.toThrow();
  });
});
