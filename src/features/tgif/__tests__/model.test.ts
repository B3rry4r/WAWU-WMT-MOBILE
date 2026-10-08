import {
  cardFileName,
  cardLabels,
  cardOrder,
  cardText,
  compactCount,
  dateText,
  estimateLines,
  fitSize,
  headerLine,
  localDay,
  pngSize,
  readerSteps,
  shareLine,
  shareText,
  textHeight,
  whatsappUrl,
  wordLeading,
  wordSize,
  wordSizes,
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

  it('takes the day from the phone\'s own clock: at half past midnight in Lagos it is the new day, though UTC is still the old one (M3)', () => {
    const lagosHalfPastMidnight = {
      getFullYear: () => 2026,
      getMonth: () => 8,
      getDate: () => 7,
      getUTCFullYear: () => 2026,
      getUTCMonth: () => 8,
      getUTCDate: () => 6,
      toISOString: () => '2026-09-06T23:30:00.000Z',
    } as unknown as Date;
    expect(localDay(lagosHalfPastMidnight)).toBe('2026-09-07');
    const losAngelesEvening = {
      getFullYear: () => 2026,
      getMonth: () => 11,
      getDate: () => 31,
      getUTCFullYear: () => 2027,
      getUTCMonth: () => 0,
      getUTCDate: () => 1,
      toISOString: () => '2027-01-01T05:00:00.000Z',
    } as unknown as Date;
    expect(localDay(losAngelesEvening)).toBe('2026-12-31');
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

  it('names no link in the share line while the Hub has none, and says both targets carry it when it has one (D7)', () => {
    expect(shareLine(null)).toBe('The card goes to Chat as an image. WhatsApp gets the verse as text.');
    expect(shareLine('')).toBe('The card goes to Chat as an image. WhatsApp gets the verse as text.');
    expect(shareLine(undefined)).not.toMatch(/link/i);
    expect(shareLine('wawu/tgif')).toBe('The card goes to Chat as an image. WhatsApp gets the verse as text. Both carry the link.');
    expect(shareLine(null)).not.toMatch(/Posted as an image|\u2014/);
  });
});

describe('TGIF · the words fit the room they have (D2)', () => {
  const room = (width: number, height: number) => ({ width, height });

  it('counts the lines of a text from its length, its size and the column it sits in', () => {
    expect(estimateLines(0, 26, 342)).toBe(0);
    // 28 characters a line at 26 in 342: 90 characters are 4 lines, and one spare.
    expect(estimateLines(90, 26, 342)).toBe(Math.ceil((90 * 1.1) / 28) + 1);
    expect(estimateLines(409, 16, 272)).toBeGreaterThan(estimateLines(409, 16, 342));
    expect(estimateLines(409, 18, 342)).toBeGreaterThan(estimateLines(409, 16, 342));
    expect(textHeight(409, 16, 272)).toBe(estimateLines(409, 16, 272) * 16 * wordLeading);
    // A column narrower than one character still counts a line per character, not infinity.
    expect(Number.isFinite(estimateLines(10, 26, 1))).toBe(true);
  });

  it('gives the canvas size when the room allows it, and a smaller one as the room shrinks', () => {
    const canvasVerse = 'x'.repeat(90);
    const canvasOther = 'x'.repeat(90);
    expect(fitSize('verse', canvasVerse, room(342, 400))).toBe(32);
    expect(fitSize('reality', canvasOther, room(342, 400))).toBe(26);
    let last = Infinity;
    for (let height = 700; height >= 0; height -= 10) {
      const size = fitSize('reality', 'x'.repeat(409), room(342, height));
      expect(size).toBeLessThanOrEqual(last);
      last = size;
    }
    let widest = 0;
    for (let width = 200; width <= 400; width += 10) {
      const size = fitSize('reality', 'x'.repeat(300), room(width, 300));
      expect(size).toBeGreaterThanOrEqual(widest);
      widest = size;
    }
  });

  it('never goes below the smallest size of its ladder, and takes the smallest when nothing fits, so the text scrolls', () => {
    expect(fitSize('reality', 'x'.repeat(409), room(272, 100))).toBe(16);
    expect(fitSize('reality', 'x'.repeat(409), room(272, 0))).toBe(16);
    expect(fitSize('reality', 'x'.repeat(409), room(272, -50))).toBe(16);
    expect(fitSize('verse', 'x'.repeat(270), room(272, 100))).toBe(18);
    for (const card of ['verse', 'reality', 'remember', 'prayer', 'takeaway'] as const) {
      const ladder = card === 'verse' ? wordSizes.verse : wordSizes.other;
      const size = fitSize(card, 'x'.repeat(500), room(272, 120));
      expect(size).toBe(ladder[ladder.length - 1]);
      for (let height = 0; height < 900; height += 50) expect(ladder as readonly number[]).toContain(fitSize(card, 'x'.repeat(200), room(300, height)));
    }
  });

  it('sets the longest text of the book, 409 characters, so that it fits where it can: the chosen size always fits, the next larger one never does', () => {
    for (const [width, height] of [
      [342, 492],
      [327, 440],
      [312, 327],
      [272, 255],
    ] as const) {
      const size = fitSize('reality', 'x'.repeat(409), room(width, height));
      const ladder = wordSizes.other as readonly number[];
      if (textHeight(409, ladder[ladder.length - 1], width) <= height) {
        expect(textHeight(409, size, width)).toBeLessThanOrEqual(height);
      }
      const larger = ladder[ladder.indexOf(size) - 1];
      if (larger !== undefined) expect(textHeight(409, larger, width)).toBeGreaterThan(height);
    }
  });
});
