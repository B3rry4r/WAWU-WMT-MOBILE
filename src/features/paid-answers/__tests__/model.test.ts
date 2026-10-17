import type { PaidQuestion } from '../api';
import { cardOf, leftPill, leftShort, leftWords, msLeft, repliedIn, stateOf } from '../model';

const MIN = 60_000;
const HOUR = 60 * MIN;
const money = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG')}`;
const NOW = Date.parse('2026-10-17T10:00:00Z');
const at = (ms: number) => new Date(NOW + ms).toISOString();

function question(over: Partial<PaidQuestion> = {}): PaidQuestion {
  return {
    id: 'q1',
    text: 'How do I price a logo for a bank?',
    amountKobo: 150_000,
    status: 'awaiting_response',
    mine: false,
    sentAt: at(-49 * MIN),
    deadlineAt: at(72 * MIN),
    respondedAt: null,
    replies: [],
    creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'pending' },
    ...over,
  };
}

describe('the time left on a paid question (I9, I10)', () => {
  it('is written as the board writes it: 1h 12m, 9h 04m, 21h 40m, then minutes alone', () => {
    expect(leftWords(72 * MIN)).toBe('1h 12m');
    expect(leftWords(9 * HOUR + 4 * MIN)).toBe('9h 04m');
    expect(leftWords(21 * HOUR + 40 * MIN)).toBe('21h 40m');
    expect(leftWords(42 * MIN + 59_000)).toBe('42m');
    expect(leftWords(30_000)).toBe('under 1m');
    expect(leftShort(18 * HOUR + 20 * MIN)).toBe('18h');
    expect(leftShort(42 * MIN)).toBe('42m');
  });

  it('turns red under two hours and stays amber from two hours up', () => {
    expect(leftPill(72 * MIN)).toEqual({ label: '1h 12m left', tone: 'danger' });
    expect(leftPill(2 * HOUR - MIN).tone).toBe('danger');
    expect(leftPill(2 * HOUR).tone).toBe('warning');
    expect(leftPill(9 * HOUR + 4 * MIN)).toEqual({ label: '9h 04m left', tone: 'warning' });
  });

  it('is nothing once the Hub deadline has passed', () => {
    expect(msLeft(at(-1), NOW)).toBeNull();
    expect(msLeft(at(0), NOW)).toBeNull();
    expect(msLeft(at(1000), NOW)).toBe(1000);
    expect(msLeft('not a time', NOW)).toBeNull();
  });
});

describe('Replied in', () => {
  it('counts the minutes between the question and the first reply', () => {
    expect(repliedIn(at(-60 * MIN), at(-11 * MIN))).toBe('Replied in 49 minutes');
    expect(repliedIn(at(-10 * MIN), at(-9 * MIN))).toBe('Replied in 1 minute');
    expect(repliedIn(at(-10 * MIN), at(-10 * MIN + 5000))).toBe('Replied in under a minute');
    expect(repliedIn(at(-200 * MIN), at(-80 * MIN))).toBe('Replied in 2h');
    expect(repliedIn(at(-200 * MIN), at(-65 * MIN))).toBe('Replied in 2h 15m');
    expect(repliedIn(at(-10 * MIN), null)).toBeNull();
  });
});

describe('the card under a question (I10, I11)', () => {
  it('I10: the time left, the Hub share and its percent, and the refund line without "full amount"', () => {
    const card = cardOf(question(), 'Bisi', NOW, money);
    expect(card.title).toBe('Reply in 1h 12m to earn ₦1,275');
    expect(card.body).toBe("That's 85% of ₦1,500. Miss it and Bisi gets their ₦1,500 back.");
    expect(card.body).not.toMatch(/full amount/);
    expect(card.tone).toBe('warning');
  });

  it('draws the time and the refund only when the Hub holds no share for the question', () => {
    const card = cardOf(question({ creatorEarning: null }), 'Bisi', NOW, money);
    expect(card.title).toBe('Reply in 1h 12m');
    expect(card.body).toBe('Miss it and Bisi gets their ₦1,500 back.');
  });

  it('I11: in the wallet once the share landed', () => {
    const answered = question({ status: 'responded', respondedAt: at(-1 * MIN), sentAt: at(-50 * MIN), creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'in_wallet' } });
    expect(cardOf(answered, 'Bisi', NOW, money)).toMatchObject({ tone: 'positive', title: '₦1,275 is in your wallet', body: 'Replied in 49 minutes.' });
  });

  it('I11 for a share still travelling: not "in your wallet" until the Hub says it landed (R-55)', () => {
    const answered = question({ status: 'responded', respondedAt: at(-1 * MIN), sentAt: at(-50 * MIN), creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'on_its_way' } });
    const card = cardOf(answered, 'Bisi', NOW, money);
    expect(card.title).toBe('₦1,275 is on its way to your wallet');
    expect(card.title).not.toMatch(/is in your wallet/);
    expect(card.body).toBe('Replied in 49 minutes. Earnings reach your wallet once a day.');
  });

  it('I11 for a creator with no wallet yet: it lands when they open one (R-11)', () => {
    const answered = question({ status: 'responded', respondedAt: at(-1 * MIN), sentAt: at(-50 * MIN), creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'waiting_for_wallet' } });
    expect(cardOf(answered, 'Bisi', NOW, money)).toMatchObject({ title: '₦1,275 is waiting for you', body: 'Replied in 49 minutes. It lands when you open your wallet.' });
  });

  it('a question the Hub refunded, or whose deadline passed, says the time ran out and the price goes back', () => {
    expect(stateOf(question({ status: 'refunded', creatorEarning: null }), NOW)).toBe('closed');
    expect(stateOf(question({ deadlineAt: at(-1000) }), NOW)).toBe('closed');
    expect(cardOf(question({ status: 'refunded', creatorEarning: null }), 'Bisi', NOW, money)).toMatchObject({ tone: 'neutral', title: 'The time to reply ran out', body: "Bisi's ₦1,500 goes back to them." });
  });

  it('writes no em-dash and no "Move to wallet" in any state', () => {
    const states = [
      question(),
      question({ creatorEarning: null }),
      question({ status: 'responded', respondedAt: at(-1 * MIN), creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'in_wallet' } }),
      question({ status: 'responded', respondedAt: at(-1 * MIN), creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'on_its_way' } }),
      question({ status: 'responded', respondedAt: at(-1 * MIN), creatorEarning: { amountKobo: 127_500, sharePct: 85, state: 'waiting_for_wallet' } }),
      question({ status: 'refunded', creatorEarning: null }),
    ];
    for (const q of states) {
      const card = cardOf(q, null, NOW, money);
      expect(`${card.title} ${card.body}`).not.toMatch(/—|Move to wallet/);
    }
  });
});
