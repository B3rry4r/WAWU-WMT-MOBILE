import type { FeeQuote } from '../api';
import { dropIntent, findIntent, forgetIntentsInMemory, intentsKey, MAX_INTENTS, putIntent, readIntent, UNKNOWN_KEEP_MS, type SendIntent } from '../intent';

/*
 * The payment intent the review keeps on the phone (WALLET-02 round 2): written before a request leaves, found again after the
 * screen, the run or the phone's memory is gone, and let go when the Hub has the last word. The secure store is a Map here.
 */
const mockVault = new Map<string, string>();
const mockStore = {
  failWrites: false,
  failReads: false,
};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    if (mockStore.failReads) throw new Error('keychain unavailable');
    return mockVault.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (mockStore.failWrites) throw new Error('keychain unavailable');
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const OWNER = '00000000-0000-4000-8000-0000000000f2';
const OTHER = '00000000-0000-4000-8000-0000000000f3';
const AMAKA = '11111111-1111-4111-8111-111111111111';
const CHIDI = '22222222-2222-4222-8222-222222222222';

const quote: FeeQuote = {
  kind: 'wawu_transfer',
  billCategory: null,
  amountKobo: 2_500_000,
  fee: { providerFeeKobo: 1575, wawuFeeKobo: 1000, totalFeeKobo: 2575 },
  parts: [
    { code: 'balance_transfer', source: 'provider', amountKobo: 1575 },
    { code: 'wawu_fee', source: 'wawu', amountKobo: 1000 },
  ],
  totalKobo: 2_502_575,
  withinDailyLimit: true,
  remainingTodayKobo: null,
  quoteToken: 'tok-1',
  expiresAt: '2099-01-01T00:00:00.000Z',
} as FeeQuote;

const intent = (over: Partial<SendIntent> = {}): SendIntent => ({
  key: 'key-1',
  payeeId: AMAKA,
  amountKobo: 2_500_000,
  note: 'Rent',
  quote,
  phase: 'unknown',
  transferId: null,
  at: Date.now(),
  ...over,
});

beforeEach(() => {
  mockVault.clear();
  mockStore.failWrites = false;
  mockStore.failReads = false;
  forgetIntentsInMemory();
});

describe('a payment intent on the phone', () => {
  it('is found again for the same person and amount after the phone’s memory is gone, with its key, request and quote', async () => {
    await putIntent(OWNER, intent());
    forgetIntentsInMemory();
    const found = await findIntent(OWNER, AMAKA, 2_500_000);
    expect(found).toEqual(expect.objectContaining({ key: 'key-1', note: 'Rent', phase: 'unknown', transferId: null }));
    expect(found?.quote.quoteToken).toBe('tok-1');
    expect(found?.quote.totalKobo).toBe(2_502_575);
  });

  it('is not found for another person, another amount or another account', async () => {
    await putIntent(OWNER, intent());
    forgetIntentsInMemory();
    expect(await findIntent(OWNER, CHIDI, 2_500_000)).toBeNull();
    expect(await findIntent(OWNER, AMAKA, 2_500_001)).toBeNull();
    expect(await findIntent(OTHER, AMAKA, 2_500_000)).toBeNull();
  });

  it('keeps one intent per person and amount, and a pending one carries the send’s id', async () => {
    await putIntent(OWNER, intent());
    await putIntent(OWNER, intent({ phase: 'pending', transferId: 'send-9' }));
    forgetIntentsInMemory();
    const found = await findIntent(OWNER, AMAKA, 2_500_000);
    expect(found).toEqual(expect.objectContaining({ phase: 'pending', transferId: 'send-9' }));
    expect(JSON.parse(mockVault.get(intentsKey(OWNER)) ?? '[]')).toHaveLength(1);
  });

  it('is let go when the Hub has the last word, in memory and on the phone', async () => {
    await putIntent(OWNER, intent());
    await dropIntent(OWNER, 'key-1');
    expect(await findIntent(OWNER, AMAKA, 2_500_000)).toBeNull();
    forgetIntentsInMemory();
    expect(await findIntent(OWNER, AMAKA, 2_500_000)).toBeNull();
  });

  it('with no answer is not trusted after the Hub’s key window, and a pending one is kept until it is read by id', async () => {
    const old = Date.now() - UNKNOWN_KEEP_MS - 1000;
    await putIntent(OWNER, intent({ at: old }));
    await putIntent(OWNER, intent({ key: 'key-2', payeeId: CHIDI, phase: 'pending', transferId: 'send-2', at: old }));
    forgetIntentsInMemory();
    expect(await findIntent(OWNER, AMAKA, 2_500_000)).toBeNull();
    expect((await findIntent(OWNER, CHIDI, 2_500_000))?.transferId).toBe('send-2');
  });

  it('keeps the newest few', async () => {
    for (let i = 0; i < MAX_INTENTS + 3; i += 1) await putIntent(OWNER, intent({ key: `k-${i}`, amountKobo: 100_000 + i }));
    forgetIntentsInMemory();
    expect(await findIntent(OWNER, AMAKA, 100_000)).toBeNull();
    expect((await findIntent(OWNER, AMAKA, 100_000 + MAX_INTENTS + 2))?.key).toBe(`k-${MAX_INTENTS + 2}`);
  });

  it('reads nothing from a store that is damaged, never throws, and drops entries that are not whole', async () => {
    mockVault.set(intentsKey(OWNER), '{not json');
    expect(await findIntent(OWNER, AMAKA, 2_500_000)).toBeNull();
    forgetIntentsInMemory();
    mockVault.set(intentsKey(OWNER), JSON.stringify([{ key: 'x' }, { ...intent(), quote: { totalKobo: 1 } }, { ...intent(), phase: 'pending', transferId: null }, intent({ key: 'whole' })]));
    expect((await findIntent(OWNER, AMAKA, 2_500_000))?.key).toBe('whole');
    expect(readIntent({ ...intent(), amountKobo: 12.5 })).toBeNull();
  });

  it('still holds in memory when the phone’s store cannot be written or read', async () => {
    mockStore.failWrites = true;
    mockStore.failReads = true;
    await expect(putIntent(OWNER, intent())).resolves.toBeUndefined();
    expect((await findIntent(OWNER, AMAKA, 2_500_000))?.key).toBe('key-1');
  });
});
