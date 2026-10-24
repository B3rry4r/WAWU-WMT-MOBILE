import { RESULT_HOLD_MS, SAME_CODE_QUIET_MS, ANSWER_WAIT_MS } from '../doorConfig';
import { canSend, createScanGate, formatTypedCode, lengthOf, MAX_SENT_CHARS, MIN_SENT_CHARS, newScanKey, readingText } from '../doorCode';

describe('a typed ticket code (E19, "Type the code instead")', () => {
  it('is written as the ticket prints it: capitals, groups of four, a hyphen between', () => {
    expect(formatTypedCode('k7qx4m2p9wva3rte')).toBe('K7QX-4M2P-9WVA-3RTE');
    expect(formatTypedCode('K7QX-4M2P-9WVA-3RTE')).toBe('K7QX-4M2P-9WVA-3RTE');
  });

  it('keeps what has been typed so far, one group at a time', () => {
    expect(formatTypedCode('')).toBe('');
    expect(formatTypedCode('k7')).toBe('K7');
    expect(formatTypedCode('k7qx')).toBe('K7QX');
    expect(formatTypedCode('k7qx4')).toBe('K7QX-4');
  });

  it('drops spaces, hyphens and anything that is not a letter or a digit, so a pasted code is cleaned', () => {
    expect(formatTypedCode('  k7qx - 4m2p  9wva.3rte \n')).toBe('K7QX-4M2P-9WVA-3RTE');
    expect(formatTypedCode('#K7QX/4M2P')).toBe('K7QX-4M2P');
  });

  it('reads the letter O as the digit 0, and I or L as the digit 1: tickets never use those letters', () => {
    expect(formatTypedCode('oOiIlL')).toBe('0011-11');
  });

  it('is cut at eight groups, far past the sixteen characters a ticket has, so a longer code is never shortened', () => {
    const long = 'A'.repeat(40);
    const out = formatTypedCode(long);
    expect(out.replace(/-/g, '')).toHaveLength(32);
    expect(out.length).toBeLessThanOrEqual(40);
  });
});

describe('what a camera read is sent as', () => {
  it('has the spaces around it taken off and nothing else touched', () => {
    expect(readingText('  K7QX-4M2P-9WVA-3RTE \n')).toBe('K7QX-4M2P-9WVA-3RTE');
    expect(readingText('https://example.com/menu?x=1')).toBe('https://example.com/menu?x=1');
  });

  it('can be sent when it is as long as the door route needs: 4 to 500 characters, by value (the Hub refuses 3 and 501)', () => {
    expect(MIN_SENT_CHARS).toBe(4);
    expect(MAX_SENT_CHARS).toBe(500);
    expect(canSend('A'.repeat(3))).toBe(false);
    expect(canSend('A'.repeat(4))).toBe(true);
    expect(canSend('A'.repeat(500))).toBe(true);
    expect(canSend('A'.repeat(501))).toBe(false);
    expect(canSend('')).toBe(false);
    expect(canSend('A'.repeat(5000))).toBe(false);
  });

  it('counts characters the way the Hub does: an emoji is one, so 2 emoji are too few and 300 are enough', () => {
    expect(lengthOf('😀')).toBe(1);
    expect(lengthOf('😀😀')).toBe(2);
    expect(canSend('😀😀')).toBe(false);
    expect(canSend('😀'.repeat(4))).toBe(true);
    expect(canSend('😀'.repeat(300))).toBe(true);
    expect(canSend('😀'.repeat(500))).toBe(true);
    expect(canSend('😀'.repeat(501))).toBe(false);
  });
});

describe('the key one scan carries', () => {
  it('is a UUID v4, which the Hub takes (8 to 128 letters, digits, - or _)', () => {
    const key = newScanKey();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(key).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
  });

  it('is new each time', () => {
    const keys = new Set(Array.from({ length: 500 }, () => newScanKey()));
    expect(keys.size).toBe(500);
  });

  it('is made without the phone\'s generator too (Hermes has none)', () => {
    const original = (globalThis as { crypto?: unknown }).crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      const key = newScanKey();
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(newScanKey()).not.toBe(key);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

describe('the scanner\'s times, by value (all three PROVISIONAL until a walk at a real door)', () => {
  it('holds a result 3 seconds, keeps a code quiet for 1.5 seconds, and stops waiting for an answer after 10', () => {
    expect(RESULT_HOLD_MS).toBe(3000);
    expect(SAME_CODE_QUIET_MS).toBe(1500);
    expect(ANSWER_WAIT_MS).toBe(10_000);
  });

  it('reads a code again at 1500 ms out of view and not at 1499, with no number given to the gate', () => {
    const early = createScanGate();
    expect(early.accept('A', 0, false)).toBe(true);
    expect(early.accept('A', 1499, false)).toBe(false);
    const late = createScanGate();
    expect(late.accept('A', 0, false)).toBe(true);
    expect(late.accept('A', 1500, false)).toBe(true);
  });
});

describe('which camera readings are sent', () => {
  it('sends a code the first time and not again while it stays in view, however long that is', () => {
    const gate = createScanGate(1500);
    expect(gate.accept('A', 0, false)).toBe(true);
    expect(gate.accept('A', 300, false)).toBe(false);
    expect(gate.accept('A', 600, false)).toBe(false);
    // Reports keep arriving, so it is still in view: 10 seconds on, still not sent.
    for (let t = 900; t <= 10_000; t += 300) expect(gate.accept('A', t, false)).toBe(false);
  });

  it('sends it again once it has been out of view for the quiet time', () => {
    const gate = createScanGate(1500);
    expect(gate.accept('A', 0, false)).toBe(true);
    expect(gate.accept('A', 1499, false)).toBe(false);
    // Nothing reported for 1500 ms or more, then it comes back.
    expect(gate.accept('A', 1499 + 1500, false)).toBe(true);
  });

  it('sends a different code at once', () => {
    const gate = createScanGate(1500);
    expect(gate.accept('A', 0, false)).toBe(true);
    expect(gate.accept('B', 100, false)).toBe(true);
    // A was only just read: it is not read again for being the code after B.
    expect(gate.accept('A', 200, false)).toBe(false);
    expect(gate.accept('A', 200 + 1500, false)).toBe(true);
  });

  it('sends nothing while a check or a result is up, and a code held in view meanwhile is not sent when that clears', () => {
    const gate = createScanGate(1500);
    expect(gate.accept('A', 0, false)).toBe(true);
    // The result is up for 3 seconds; the ticket stays in front of the camera.
    for (let t = 300; t <= 3000; t += 300) expect(gate.accept('A', t, true)).toBe(false);
    // The result clears and the ticket is still in view: not read again.
    expect(gate.accept('A', 3300, false)).toBe(false);
    // Another ticket is read.
    expect(gate.accept('B', 3600, false)).toBe(true);
  });

  it('reads a ticket first shown while a result was up the moment the scanner is free, with no need to take it away', () => {
    const gate = createScanGate(1500);
    expect(gate.accept('A', 0, false)).toBe(true);
    // B arrives during A's result and stays in view; neither is sent.
    for (let t = 300; t <= 3000; t += 300) {
      expect(gate.accept('A', t, true)).toBe(false);
      expect(gate.accept('B', t, true)).toBe(false);
    }
    // The result clears: A (still in view) is not read again, B is.
    expect(gate.accept('A', 3300, false)).toBe(false);
    expect(gate.accept('B', 3300, false)).toBe(true);
    expect(gate.accept('B', 3600, false)).toBe(false);
  });

  it('does not read either of two tickets in one picture over and over as the phone reports them in turn', () => {
    const gate = createScanGate(1500);
    expect(gate.accept('A', 0, false)).toBe(true);
    expect(gate.accept('B', 100, false)).toBe(true);
    for (let t = 300; t <= 6000; t += 300) {
      expect(gate.accept('A', t, false)).toBe(false);
      expect(gate.accept('B', t + 100, false)).toBe(false);
    }
  });

  it('forgets what was in view on reset', () => {
    const gate = createScanGate(1500);
    expect(gate.accept('A', 0, false)).toBe(true);
    gate.reset();
    expect(gate.accept('A', 10, false)).toBe(true);
  });
});
