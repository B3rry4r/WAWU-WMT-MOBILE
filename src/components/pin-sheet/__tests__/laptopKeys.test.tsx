import { act, render, screen } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';
import { useState } from 'react';

import { AmountKeypad } from '@/components/amount-entry';
import { PinEntry, PinSheet, type PinCheckResult } from '@/components/pin-sheet';

/*
 * WEBAPP-05 (R-127): a person on a laptop types the PIN on the keyboard. These run as the web build (Platform.OS web, a real
 * DOM), with real KeyboardEvents on the page. The PIN is checked to stay out of the DOM and out of the console.
 */
const NOW = new Date('2026-11-09T10:00:00Z');
/*
 * jest runs these in node, so the page is a small stand-in: `window` is a real EventTarget (the keypad adds one capture listener to
 * it), `document` holds the focused element. A key is a real Event carrying the fields the keypad reads.
 */
type Fake = { tagName: string; blur: jest.Mock };
const page = globalThis as unknown as { window?: EventTarget; document?: { body: object; activeElement: Fake | null } };
const BODY = {};
let behind: Fake;
beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  jest.replaceProperty(Platform, 'OS', 'web');
  page.window = new EventTarget();
  behind = { tagName: 'BUTTON', blur: jest.fn() };
  page.document = { body: BODY, activeElement: BODY as unknown as Fake };
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete page.window;
  delete page.document;
});

const flush = () => act(async () => undefined);
async function key(k: string, init: { ctrlKey?: boolean; repeat?: boolean } = {}, target: object | null = null) {
  const event = Object.assign(new Event('keydown', { bubbles: true, cancelable: true }), { key: k, ctrlKey: false, metaKey: false, altKey: false, isComposing: false, repeat: false, ...init });
  if (target) Object.defineProperty(event, 'target', { value: target });
  await act(async () => {
    page.window?.dispatchEvent(event);
  });
  return event;
}
async function typeAll(digits: string) {
  for (const d of digits) await key(d);
}
const approval = { totalKobo: 150_000, payee: 'Chidinma Okoro' };
const answer = (r: PinCheckResult) => jest.fn((_pin: string) => Promise.resolve(r));

describe('the PIN sheet on a laptop keyboard', () => {
  it('a user types 1234 and the PIN is checked once with 1234', async () => {
    const onSubmit = answer({ code: 'approved' });
    await render(<PinEntry approval={approval} onSubmit={onSubmit} />);
    await typeAll('123');
    expect(screen.getByLabelText('3 of 4 digits entered')).toBeOnTheScreen();
    await key('Backspace');
    expect(screen.getByLabelText('2 of 4 digits entered')).toBeOnTheScreen();
    await typeAll('34');
    await flush();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('1234');
  });

  it('a held key and a fifth digit do not submit twice, and keys with Ctrl or Alt are left to the browser', async () => {
    const onSubmit = answer({ code: 'pin_incorrect', triesLeft: 4 });
    await render(<PinEntry approval={approval} onSubmit={onSubmit} />);
    const ctrl = await key('1', { ctrlKey: true });
    expect(ctrl.defaultPrevented).toBe(false);
    await key('1');
    await key('1', { repeat: true });
    await typeAll('234');
    await typeAll('5');
    await flush();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('1234');
  });

  it('a wrong PIN typed five times locks, as on the phone', async () => {
    const onSubmit = jest
      .fn<Promise<PinCheckResult>, [string]>()
      .mockResolvedValueOnce({ code: 'pin_incorrect', triesLeft: 4 })
      .mockResolvedValueOnce({ code: 'pin_incorrect', triesLeft: 3 })
      .mockResolvedValueOnce({ code: 'pin_incorrect', triesLeft: 2 })
      .mockResolvedValueOnce({ code: 'pin_incorrect', triesLeft: 1 })
      .mockResolvedValueOnce({ code: 'pin_locked', lockedUntil: new Date(NOW.getTime() + 15 * 60_000).toISOString() });
    await render(<PinEntry approval={approval} onSubmit={onSubmit} />);
    for (let i = 0; i < 5; i += 1) {
      await typeAll('0000');
      await flush();
    }
    expect(onSubmit).toHaveBeenCalledTimes(5);
    expect(screen.getByText('PIN locked')).toBeOnTheScreen();
    // Locked: further digits are swallowed and nothing more is sent.
    const swallowed = await key('1');
    await typeAll('111');
    await flush();
    expect(swallowed.defaultPrevented).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(5);
  });

  it('keeps focus in the sheet: a button left focused behind it is blurred, Enter and Space never press it, and the digits never reach a field', async () => {
    const onSubmit = answer({ code: 'approved' });
    page.document!.activeElement = behind;
    await render(<PinEntry approval={approval} onSubmit={onSubmit} />);
    expect(behind.blur).toHaveBeenCalledTimes(1);
    expect((await key('Enter')).defaultPrevented).toBe(true);
    expect((await key(' ')).defaultPrevented).toBe(true);
    // A field focused elsewhere on the page does not get the PIN: the key is taken before it can type.
    const field = { tagName: 'INPUT' };
    expect((await key('7', {}, field)).defaultPrevented).toBe(true);
    await typeAll('123');
    expect(onSubmit).toHaveBeenCalledWith('7123');
  });

  it('the PIN is never in the DOM as text and never logged', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => jest.spyOn(console, m).mockImplementation(() => undefined));
    await render(<PinEntry approval={approval} onSubmit={answer({ code: 'pin_incorrect', triesLeft: 4 })} />);
    await typeAll('4821');
    // While the dots are filled and after the answer clears them.
    expect(JSON.stringify(screen.toJSON())).not.toContain('4821');
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    await flush();
    expect(JSON.stringify(screen.toJSON())).not.toContain('4821');
    spies.forEach((spy) => expect(spy.mock.calls.flat().join(' ')).not.toContain('4821'));
  });

  it('a sheet over a screen with its own keypad: only the sheet hears the keys', async () => {
    const onDown = jest.fn();
    const onSubmit = answer({ code: 'approved' });
    function Screen() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <AmountKeypad onKey={onDown} onDelete={jest.fn()} onClear={jest.fn()} />
          <Text onPress={() => setOpen(true)}>open</Text>
          <PinSheet visible={open} onClose={() => setOpen(false)} approval={approval} onSubmit={onSubmit} />
        </>
      );
    }
    await render(<Screen />);
    await key('5');
    expect(onDown).toHaveBeenCalledWith('5');
    onDown.mockClear();
    await act(async () => screen.getByText('open').props.onPress());
    await typeAll('1234');
    await flush();
    expect(onDown).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith('1234');
  });
});

describe('keyboard access', () => {
  it('Enter and Space press a keypad key or Close the person reached with Tab, and still never the stale button behind the sheet', async () => {
    await render(<PinEntry approval={approval} onSubmit={answer({ code: 'approved' })} />);
    const reached = { tagName: 'BUTTON' };
    expect((await key('Enter', {}, reached)).defaultPrevented).toBe(false);
    expect((await key(' ', {}, { tagName: 'DIV', getAttribute: () => 'button' })).defaultPrevented).toBe(false);
    expect((await key('Enter')).defaultPrevented).toBe(true);
  });
});

describe('the amount keypad on a laptop keyboard', () => {
  it('digits, the point, Backspace and Enter act as taps, and a focused note field keeps its own keys', async () => {
    const onKey = jest.fn();
    const onDelete = jest.fn();
    const onEnter = jest.fn();
    await render(<AmountKeypad onKey={onKey} onDelete={onDelete} onClear={jest.fn()} onEnter={onEnter} />);
    await key('1');
    await key('.');
    await key(',');
    await key('Backspace');
    await key('Enter');
    expect(onKey.mock.calls).toEqual([['1'], ['.'], ['.']]);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEnter).toHaveBeenCalledTimes(1);
    // The note field on the amount screen keeps its own keys.
    const typed = await key('9', {}, { tagName: 'INPUT' });
    expect(typed.defaultPrevented).toBe(false);
    expect(onKey).toHaveBeenCalledTimes(3);
  });
});

describe('on a phone', () => {
  it('no key listener exists', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const onSubmit = answer({ code: 'approved' });
    await render(<PinEntry approval={approval} onSubmit={onSubmit} />);
    await typeAll('1234');
    await flush();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
