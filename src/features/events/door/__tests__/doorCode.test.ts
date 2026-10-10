import { canSend, createScanGate, formatTypedCode, MIN_SENT_CHARS, readingText } from '../doorCode';

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

  it('can be sent when it is as long as the door route needs', () => {
    expect(canSend('A'.repeat(MIN_SENT_CHARS - 1))).toBe(false);
    expect(canSend('A'.repeat(MIN_SENT_CHARS))).toBe(true);
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
