import { ApiError } from '@/api/errors';

import { discoverable, moneyCard, suggestionLine, suggestionTick, tgifDayLabel, tgifMeta, todayPhase } from '../model';

const tick = (verified: boolean) => ({ verified, expiresAt: null });
const person = (wawuId: string, over: Record<string, unknown> = {}) => ({
  wawuId,
  name: wawuId,
  handle: null,
  avatarUrl: null,
  field: null,
  pieceCount: 1,
  verification: { creator: tick(false), professional: tick(false) },
  following: false,
  ...over,
});
const day = {
  date: '2026-09-26',
  series: 'Sons, not slaves',
  seriesTheme: '',
  verse: 'v',
  verseReference: 'r',
  reality: 'r',
  remember: 'm',
  prayer: 'p',
  takeaway: 't',
  shareLink: null,
};
const done = { pending: false, failed: false };
const failed = { pending: false, failed: true };
const waiting = { pending: true, failed: false };

describe('the TGIF card words', () => {
  it('writes the day as H1 does', () => {
    expect(tgifDayLabel('2026-09-25')).toBe('TGIF · FRIDAY 25 SEP');
    expect(tgifDayLabel('2026-09-26')).toBe('TGIF · SATURDAY 26 SEP');
    expect(tgifDayLabel('2026-10-07')).toBe('TGIF · WEDNESDAY 7 OCT');
  });

  it('counts the cards that have words and writes the readers as the reader does', () => {
    expect(tgifMeta(day, 12400)).toBe('5 cards · 12.4K reading today');
    expect(tgifMeta(day, 640)).toBe('5 cards · 640 reading today');
    expect(tgifMeta({ ...day, remember: ' ' }, 12400)).toBe('4 cards · 12.4K reading today');
  });

  it('leaves the readers out when there are none or they have not come', () => {
    expect(tgifMeta(day, 0)).toBe('5 cards');
    expect(tgifMeta(day, null)).toBe('5 cards');
    expect(tgifMeta(day, undefined)).toBe('5 cards');
  });

  it('never writes a reading time, which nothing serves', () => {
    expect(tgifMeta(day, 12400)).not.toMatch(/min/);
  });
});

describe('creators to discover', () => {
  it('never offers the viewer', () => {
    expect(discoverable([person('a'), person('me'), person('b')], 'me').map((p) => p.wawuId)).toEqual(['a', 'b']);
    expect(discoverable([person('a')], null)).toHaveLength(1);
  });

  it('shows the creator tick first, then the professional tick, and none for neither', () => {
    expect(suggestionTick(person('a', { verification: { creator: tick(true), professional: tick(true) } }))).toBe('creator');
    expect(suggestionTick(person('a', { verification: { creator: tick(false), professional: tick(true) } }))).toBe('pro');
    expect(suggestionTick(person('a'))).toBeNull();
  });

  it('writes what they do only when they listed it', () => {
    expect(suggestionLine(person('a', { field: ' Accountant ' }))).toBe('Accountant');
    expect(suggestionLine(person('a', { field: '  ' }))).toBeNull();
    expect(suggestionLine(person('a'))).toBeNull();
  });
});

describe('the balance card', () => {
  const account = { accountNumber: '1154079370', accountName: 'Ada Sandbox', bankName: 'Loma Bank' };

  it("shows the bank's figure and never a zero in place of one it lacks", () => {
    expect(moneyCard({ kind: 'ready', account, availableKobo: 48525075 })).toEqual({ kind: 'figure', kobo: 48525075 });
    expect(moneyCard({ kind: 'loading' })).toEqual({ kind: 'loading' });
  });

  it("says what the Wallet tab says for each state, with the card's one button", () => {
    expect(moneyCard({ kind: 'no_wallet' })).toEqual({
      kind: 'notice',
      state: 'no_wallet',
      title: "You don't have a wallet yet",
      message: 'Open your wallet to continue.',
      action: 'open_wallet',
    });
    expect(moneyCard({ kind: 'opening' })).toMatchObject({ title: 'Your account is opening', action: 'check_wallet' });
    expect(moneyCard({ kind: 'unreachable', message: 'We could not reach your account.' })).toMatchObject({
      title: "We couldn't reach your account",
      message: 'We could not reach your account.',
      action: 'retry_balance',
    });
    expect(moneyCard({ kind: 'frozen', message: 'Held.' })).toMatchObject({ title: 'Your wallet is frozen', message: 'Held.', action: 'retry_balance' });
    expect(moneyCard({ kind: 'wallet_error', error: new ApiError('network', 0, 'No connection.') })).toMatchObject({
      title: "We couldn't load your wallet",
      message: 'No connection.',
      action: 'retry_wallet',
    });
    expect(moneyCard({ kind: 'balance_error', error: new ApiError('server', 500, 'Server error') })).toMatchObject({
      title: "We couldn't load your balance",
      action: 'retry_balance',
    });
  });
});

describe('the page as a whole', () => {
  const wallet = (r: { pending: boolean; failed: boolean }, walletAnswer = false) => ({ ...r, walletAnswer });

  it('loads until every read Today draws from has answered', () => {
    expect(todayPhase({ balance: wallet(waiting), creators: done })).toBe('loading');
    expect(todayPhase({ balance: wallet(done), creators: waiting })).toBe('loading');
    expect(todayPhase({ balance: wallet(done), creators: done })).toBe('ready');
  });

  it('fails as a whole only when everything failed and the wallet did not answer', () => {
    expect(todayPhase({ balance: wallet(failed), creators: failed })).toBe('error');
    expect(todayPhase({ balance: wallet(failed, true), creators: failed })).toBe('ready');
    expect(todayPhase({ balance: wallet(failed), creators: done })).toBe('ready');
  });
});
