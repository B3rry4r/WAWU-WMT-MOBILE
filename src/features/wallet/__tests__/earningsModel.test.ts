import { monthWords, pieceIcon, rowsOfTiles, salesWords, showsKobo, streamName, tilesOf, waitingWords } from '../earnings/model';

const money = (kobo: number) => `K${kobo}`;

describe('W39 words (WALLET-13)', () => {
  it('names the three streams the board draws, and any other the Hub lists in its own words', () => {
    expect(streamName('content_unlock')).toBe('Unlocks');
    expect(streamName('tip')).toBe('Tips');
    expect(streamName('paid_dm')).toBe('Paid DMs');
    expect(streamName('school_fee')).toBe('Course fees');
    expect(streamName('some_new_kind')).toBe('Some new kind');
  });

  it('draws Unlocks, Tips and Paid DMs always, a stream the Hub lists none of at nothing, and the rest after them in the Hub order', () => {
    const tiles = tilesOf([
      { kind: 'legal_fee', earnedKobo: 900_000, sales: 1 },
      { kind: 'tip', earnedKobo: 85_000, sales: 2 },
    ]);
    expect(tiles.map((t) => [t.kind, t.earnedKobo])).toEqual([
      ['content_unlock', 0],
      ['tip', 85_000],
      ['paid_dm', 0],
      ['legal_fee', 900_000],
    ]);
    expect(rowsOfTiles(tiles).map((row) => row.length)).toEqual([3, 1]);
  });

  it('says how many of what, singular and plural', () => {
    expect(salesWords('content_unlock', 1)).toBe('1 unlock');
    expect(salesWords('content_unlock', 18)).toBe('18 unlocks');
    expect(salesWords('tip', 6)).toBe('6 tips');
    expect(salesWords('paid_dm', 2)).toBe('2 paid DMs');
    expect(salesWords('mystery', 3)).toBe('3 sales');
    expect(pieceIcon('tip')).toBe('HandCoins');
    expect(pieceIcon('mystery')).toBe('Banknote');
  });

  it('turns the Hub month into its name and refuses what is not a month', () => {
    expect(monthWords('2026-10')).toBe('October');
    expect(monthWords('2026-01')).toBe('January');
    expect(monthWords('2026-13')).toBe('');
    expect(monthWords('October')).toBe('');
  });

  it('shows kobo only when there are some', () => {
    expect(showsKobo(4_200_000)).toBe(false);
    expect(showsKobo(4_200_085)).toBe(true);
  });

  it('says nothing when nothing waits, leads to Open your wallet when there is no wallet, and says once a day when there is one', () => {
    expect(waitingWords(false, 0, money)).toBeNull();
    expect(waitingWords(true, 0, money)).toBeNull();
    expect(waitingWords(false, 8_500, money)).toEqual({ title: 'K8500 is waiting for you', body: 'It lands in your wallet the moment you open one.', action: true });
    expect(waitingWords(true, 8_500, money)).toEqual({ title: 'K8500 is on its way to your wallet', body: 'Earnings reach your wallet once a day.', action: false });
  });
});
