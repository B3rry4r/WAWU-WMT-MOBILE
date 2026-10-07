import {
  cardFileName,
  cardLabels,
  cardOrder,
  cardText,
  compactCount,
  dateText,
  headerLine,
  localDay,
  pngSize,
  readerSteps,
  shareText,
  whatsappUrl,
  wordSize,
} from '../model';

const day = {
  date: '2026-09-26',
  series: 'SONS, NOT SLAVES',
  seriesTheme: 'theme',
  verse: 'A verse.',
  verseReference: 'Psalm 1:1 (KJV)',
  reality: 'Reality words.',
  remember: 'Remember words.',
  prayer: 'Prayer words.',
  takeaway: 'Takeaway words.',
  shareLink: 'wawu/tgif',
};

describe('TGIF · the day and its words', () => {
  it('reads five cards in the order H29 to H34 draw them, one step each', () => {
    expect(cardOrder).toEqual(['verse', 'reality', 'remember', 'prayer', 'takeaway']);
    expect(readerSteps()).toEqual(cardOrder.map((card) => ({ kind: 'card', card })));
    expect(cardOrder.map((c) => cardLabels[c])).toEqual(["TODAY'S VERSE", 'THE REALITY', 'REMEMBER', 'PRAYER', 'TAKEAWAY']);
  });

  it('writes the phone calendar day as YYYY-MM-DD, not the UTC day', () => {
    expect(localDay(new Date(2026, 8, 6, 23, 59))).toBe('2026-09-06');
    expect(localDay(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
    expect(localDay(new Date(2026, 11, 31, 12, 0))).toBe('2026-12-31');
  });

  it('writes the day as the header does, the same on every phone', () => {
    expect(dateText('2026-09-26')).toBe('Saturday 26 September');
    expect(dateText('2025-09-26')).toBe('Friday 26 September');
    expect(dateText('2026-01-01')).toBe('Thursday 1 January');
    expect(headerLine({ date: '2025-09-26', series: 'SONS, NOT SLAVES' })).toBe('Friday 26 September · SONS, NOT SLAVES');
  });

  it('writes a count the way the cards do, cut down and never rounded up', () => {
    const cases: [number, string][] = [
      [0, '0'],
      [7, '7'],
      [999, '999'],
      [1000, '1K'],
      [2149, '2.1K'],
      [2150, '2.1K'],
      [8999, '8.9K'],
      [12_450, '12.4K'],
      [99_999, '99.9K'],
      [100_000, '100K'],
      [999_999, '999K'],
      [1_000_000, '1M'],
      [1_260_000, '1.2M'],
    ];
    for (const [n, text] of cases) expect(compactCount(n)).toBe(text);
    expect(compactCount(-1)).toBe('');
    expect(compactCount(Number.NaN)).toBe('');
  });

  it('puts the verse in quotation marks and gives every other card its own words', () => {
    expect(cardText(day, 'verse')).toBe('“A verse.”');
    expect(cardText(day, 'reality')).toBe('Reality words.');
    expect(cardText(day, 'remember')).toBe('Remember words.');
    expect(cardText(day, 'prayer')).toBe('Prayer words.');
    expect(cardText(day, 'takeaway')).toBe('Takeaway words.');
  });

  it('sets a text at the canvas size and steps down as it gets longer, so it never leaves the card', () => {
    expect(wordSize('verse', 'x'.repeat(90))).toBe(32);
    expect(wordSize('reality', 'x'.repeat(90))).toBe(26);
    expect(wordSize('verse', 'x'.repeat(170))).toBe(32);
    expect(wordSize('verse', 'x'.repeat(171))).toBe(28);
    expect(wordSize('verse', 'x'.repeat(272))).toBe(24);
    expect(wordSize('verse', 'x'.repeat(400))).toBe(21);
    expect(wordSize('reality', 'x'.repeat(330))).toBe(26);
    expect(wordSize('reality', 'x'.repeat(331))).toBe(23);
    expect(wordSize('reality', 'x'.repeat(409))).toBe(23);
    expect(wordSize('reality', 'x'.repeat(421))).toBe(20);
    expect(wordSize('reality', 'x'.repeat(561))).toBe(18);
    let last = Infinity;
    for (let length = 0; length <= 420; length += 10) {
      const size = wordSize('reality', 'x'.repeat(length));
      expect(size).toBeLessThanOrEqual(last);
      last = size;
    }
  });

  it('sends the verse, where it is from and the link, and leaves the link out when the Hub has none', () => {
    expect(shareText(day)).toBe('“A verse.”\nPsalm 1:1 (KJV)\nwawu/tgif');
    expect(shareText({ ...day, shareLink: null })).toBe('“A verse.”\nPsalm 1:1 (KJV)');
    expect(whatsappUrl('a b\n&c')).toBe('https://wa.me/?text=a%20b%0A%26c');
    expect(cardFileName('2026-09-26')).toBe('TGIF-2026-09-26.png');
  });

  it('reads a PNG size from its address, and nothing else', () => {
    const header = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0);
    header.writeUInt32BE(13, 8);
    header.write('IHDR', 12, 'latin1');
    header.writeUInt32BE(1050, 16);
    header.writeUInt32BE(660, 20);
    const uri = `data:image/png;base64,${header.toString('base64')}AAAA`;
    expect(pngSize(uri)).toEqual({ width: 1050, height: 660 });
    expect(pngSize(`data:image/jpeg;base64,${Buffer.from('not a png at all, not at all').toString('base64')}`)).toBeNull();
    expect(pngSize('data:image/png;base64,')).toBeNull();
    expect(pngSize('https://example.test/a.png')).toBeNull();
    expect(pngSize('data:image/png;base64,@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')).toBeNull();
  });
});
