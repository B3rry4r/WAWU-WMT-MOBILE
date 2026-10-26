import type { ThreadQuestion } from '../api';
import {
  answeredCard,
  askButtonLabel,
  askTerms,
  composerLabel,
  deadlineWords,
  followUpOf,
  headerLine,
  heldLine,
  isWaiting,
  leftLong,
  offBody,
  offTitle,
  paidStamp,
  priceKoboOf,
  refundLine,
  refundedCard,
  rowLeft,
  shortLine,
  threadEntries,
  tookLong,
  usualReplyLine,
  waitingCard,
  windowHoursOf,
  windowAdjective,
  windowLine,
  windowWords,
} from '../model';

const NOW = new Date(2026, 9, 17, 10, 0, 0).getTime();
const at = (hours: number, minutes = 0) => new Date(NOW + hours * 3_600_000 + minutes * 60_000).toISOString();
const q = (over: Partial<ThreadQuestion> = {}): ThreadQuestion => ({ id: 'q1', text: 'How do you price?', amountKobo: 150000, status: 'awaiting_response', mine: true, sentAt: at(-6), deadlineAt: at(18), respondedAt: null, replies: [], ...over });

describe('time and window words', () => {
  it('writes the time left as the design does', () => {
    expect(leftLong(17 * 3_600_000 + 52 * 60_000)).toBe('17h 52m');
    expect(leftLong(2 * 86_400_000 + 3 * 3_600_000)).toBe('2d 3h');
    expect(leftLong(40 * 60_000)).toBe('40m');
    expect(leftLong(20_000)).toBe('under a minute');
  });
  it('names a window in hours, then in days from two days up', () => {
    expect(windowWords(24)).toBe('24 hours');
    expect(windowWords(1)).toBe('1 hour');
    expect(windowWords(48)).toBe('2 days');
    expect(windowWords(168)).toBe('7 days');
    expect(windowHoursOf({ sentAt: at(0), deadlineAt: at(24) })).toBe(24);
    expect(windowHoursOf({ sentAt: 'nope', deadlineAt: at(24) })).toBeNull();
  });
  it('rounds the time left on an inbox row down and says nothing once the window has closed', () => {
    expect(rowLeft(at(18, 30), NOW)).toBe('18h');
    expect(rowLeft(at(0, 40), NOW)).toBe('40m');
    expect(rowLeft(at(50), NOW)).toBe('2d');
    expect(rowLeft(at(-1), NOW)).toBeNull();
  });
  it('says "usually replies in" only when the Hub has a figure', () => {
    expect(usualReplyLine(180)).toBe('Usually replies in about 3 hours');
    expect(usualReplyLine(45)).toBe('Usually replies in about 45 minutes');
    expect(usualReplyLine(60)).toBe('Usually replies in about 1 hour');
    expect(usualReplyLine(null)).toBeNull();
    expect(usualReplyLine(0)).toBeNull();
  });
  it('says how long the creator took, and when the window closes', () => {
    expect(tookLong(at(0), at(2, 14))).toBe('2h 14m');
    expect(tookLong(at(0), at(0, 49))).toBe('49m');
    expect(tookLong(at(1), at(0))).toBeNull();
    expect(deadlineWords(at(23, 51), NOW)).toBe('tomorrow 09:51');
    expect(deadlineWords(at(2), NOW)).toBe('today 12:00');
  });
});

describe('I3 and I6: what the sheet says', () => {
  it('names the window, the refund and who holds the money, from the Hub\'s figures', () => {
    expect(windowLine('Chidi Eze', 24)).toBe('Chidi has 24 hours to reply');
    expect(refundLine(152325)).toBe('No reply in time, your ₦1,523.25 comes back');
    expect(refundLine(null)).toBe('No reply in time, your money comes back');
    expect(heldLine('Chidi Eze')).toBe('Held by Who Made This? until Chidi answers');
    expect(refundLine(152325)).not.toMatch(/in full/);
  });
  it('says what the wallet is short by with the total the button shows', () => {
    expect(shortLine(152325, 90000)).toBe('You need ₦1,523.25. You have ₦900.00.');
  });
  it('makes the profile\'s naira price kobo in one place and labels the button', () => {
    expect(priceKoboOf(1500)).toBe(150000);
    expect(priceKoboOf(0)).toBeNull();
    expect(priceKoboOf(null)).toBeNull();
    expect(askButtonLabel(150000)).toBe('Message · ₦1,500');
    expect(askButtonLabel(150000, 'Ask a question')).toBe('Ask a question · ₦1,500');
  });
});

describe('I2 and I8: whether the creator takes paid questions', () => {
  const on = { dmEnabled: true, dmPrice: 1500, dmResponseHours: 24 };
  it('is on at the creator\'s price and window when they have switched it on and the Hub has not paused it', () => {
    expect(askTerms(on, { paused: false, pausedUntil: null })).toEqual({ kind: 'on', priceKobo: 150000, windowHours: 24 });
    expect(askTerms(on, undefined)).toEqual({ kind: 'on', priceKobo: 150000, windowHours: 24 });
  });
  it('is off when the creator switched it off, has no price, or the Hub paused it', () => {
    expect(askTerms({ ...on, dmEnabled: false }, null)).toMatchObject({ kind: 'off', why: 'switched_off' });
    expect(askTerms({ ...on, dmPrice: null }, null)).toMatchObject({ kind: 'off', why: 'switched_off' });
    expect(askTerms(on, { paused: true, pausedUntil: '2026-10-24T00:00:00.000Z' })).toEqual({ kind: 'off', why: 'paused', pausedUntil: '2026-10-24T00:00:00.000Z' });
  });
  it('says what I8 says, with no shop (R-2, R-9)', () => {
    expect(offTitle('Tolu Balogun')).toBe("Tolu isn't taking paid messages right now");
    expect(offBody('Tolu Balogun')).toBe("You can still follow, tip and buy Tolu's work.");
  });
});

describe('I4, I5 and I7: the cards', () => {
  it('counts down to the deadline and says where the money is', () => {
    const card = waitingCard(q({ deadlineAt: at(17, 52) }), 'Chidi Eze', NOW);
    expect(card.tone).toBe('waiting');
    expect(card.title).toBe('Chidi has 17h 52m left to reply');
    // The person paid the price and the bank's charge and gets all of it back, so the line names no figure the thread cannot know.
    expect(card.body).toBe('Your money is held by Who Made This? No reply by tomorrow 03:52 and it comes back to your wallet.');
    expect(card.body).not.toMatch(/₦/);
  });
  it('past the deadline says the money is on its way back, never a negative time', () => {
    const card = waitingCard(q({ deadlineAt: at(-1) }), 'Chidi Eze', NOW);
    expect(card.tone).toBe('late');
    expect(card.body).toBe('Your money is on its way back to your wallet.');
  });
  it('after an answer offers the follow-up only with terms the Hub gave', () => {
    expect(answeredCard('Chidi Eze', { priceKobo: 150000, windowHours: 24 })).toEqual({
      tone: 'answered',
      title: "Chidi answered, so they've been paid",
      body: 'Ask a follow-up for ₦1,500. Each paid message gets its own 24-hour window.',
    });
    expect(answeredCard('Chidi Eze', { priceKobo: 150000, windowHours: 48 }).body).toBe('Ask a follow-up for ₦1,500. Each paid message gets its own 2-day window.');
    expect(answeredCard('Chidi Eze', { priceKobo: 150000, windowHours: 1 }).body).toBe('Ask a follow-up for ₦1,500. Each paid message gets its own 1-hour window.');
    expect(answeredCard('Chidi Eze', null).body).toBe('This question is closed.');
  });
  it('says nothing about asking again until the creator\'s terms are known: no body, never "closed"', () => {
    expect(answeredCard('Chidi Eze', 'pending')).toEqual({ tone: 'answered', title: "Chidi answered, so they've been paid", body: null });
  });
  it('when the creator\'s terms could not be read the card says so in words, with a body of its own: not loading for good, never "closed", no offer', () => {
    expect(answeredCard('Chidi Eze', 'failed')).toEqual({ tone: 'answered', title: "Chidi answered, so they've been paid", body: "We couldn't check if you can ask a follow-up. Try again below." });
  });
  it('turns the creator\'s terms into what an answer may say: not known yet, not readable, closed, or the offer', () => {
    expect(followUpOf(null)).toBe('pending');
    expect(followUpOf(null, true)).toBe('failed');
    expect(followUpOf({ kind: 'off', why: 'switched_off', pausedUntil: null }, true)).toBeNull();
    expect(followUpOf({ kind: 'off', why: 'switched_off', pausedUntil: null })).toBeNull();
    expect(followUpOf({ kind: 'off', why: 'paused', pausedUntil: '2026-10-24T00:00:00.000Z' })).toBeNull();
    expect(followUpOf({ kind: 'on', priceKobo: 150000, windowHours: 24 })).toEqual({ priceKobo: 150000, windowHours: 24 });
  });
  it('writes the window as a describing word the way the board does: 24-hour, 1-hour, 2-day', () => {
    expect(windowAdjective(24)).toBe('24-hour');
    expect(windowAdjective(1)).toBe('1-hour');
    expect(windowAdjective(48)).toBe('2-day');
    expect(windowAdjective(72)).toBe('3-day');
    expect(windowAdjective(36)).toBe('36-hour');
  });
  it('after a refund says the amount and the time from the wallet\'s own record, and only that', () => {
    const wallet = { status: 'refunded', payment: { hold: { refundedKobo: 152325, settledAt: at(24, 5) } } } as unknown as Parameters<typeof refundedCard>[2];
    const card = refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', wallet, new Date(at(25)).getTime());
    expect(card.title).toBe('No reply in 24 hours, so you got ₦1,523.25 back');
    expect(card.body).toBe('It went back to your Naira wallet today at 10:05. Zainab earned nothing.');
    const noRecord = refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', null, NOW);
    expect(noRecord.title).toBe('No reply in 24 hours, so this question was refunded');
    expect(noRecord.body).toBe('Zainab earned nothing.');
    const moving = { status: 'refunding', payment: { hold: { refundedKobo: 152325, settledAt: null } } } as unknown as Parameters<typeof refundedCard>[2];
    expect(refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', moving, NOW).title).toBe('No reply in 24 hours, so ₦1,523.25 is coming back');
  });
  it('INBOX-10 N1: while the refund is still moving and the hold has no figure yet, says the money is on its way back, not that it was refunded', () => {
    const owed = { status: 'refunding', payment: { hold: { refundedKobo: null, settledAt: null } } } as unknown as Parameters<typeof refundedCard>[2];
    const card = refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', owed, NOW);
    expect(card.title).toBe('No reply in 24 hours, so your money is on its way back');
    expect(card.body).toBe('It is on its way to your Naira wallet. Zainab earned nothing.');
    // A hold that is not settled says the same, whatever the wallet's own word for it.
    const held = { status: 'refunded', payment: { hold: { refundedKobo: null, settledAt: null } } } as unknown as Parameters<typeof refundedCard>[2];
    expect(refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', held, NOW).title).toBe('No reply in 24 hours, so your money is on its way back');
    // No wallet record at all (a question paid the older way) still says only that it was refunded.
    expect(refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', null, NOW).title).toBe('No reply in 24 hours, so this question was refunded');
  });
  it('prints the figure the Hub says came back, a charge of 2,325 kobo or none, and never adds the price and the charge up itself (S3 round 2, F1)', () => {
    // The hold says ₦1,523.25 (price 150,000 + charge 2,325): that is the title, whatever else the payment holds.
    const withCharge = {
      status: 'refunded',
      priceKobo: 150000,
      payment: { priceKobo: 150000, totalKobo: 152325, fee: { totalFeeKobo: 2325 }, hold: { amountKobo: 150000, refundedKobo: 152325, settledAt: at(24, 5) } },
    } as unknown as Parameters<typeof refundedCard>[2];
    expect(refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', withCharge, new Date(at(25)).getTime()).title).toBe('No reply in 24 hours, so you got ₦1,523.25 back');
    // A refund that returned only the price (the person caused it, or the bank charged nothing): the Hub's figure is the price, and
    // the app prints that, though the payment's total is higher. It does not reach for the total.
    const priceOnly = {
      status: 'refunded',
      priceKobo: 150000,
      payment: { priceKobo: 150000, totalKobo: 152325, fee: { totalFeeKobo: 2325 }, hold: { amountKobo: 150000, refundedKobo: 150000, settledAt: at(24, 5) } },
    } as unknown as Parameters<typeof refundedCard>[2];
    expect(refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', priceOnly, new Date(at(25)).getTime()).title).toBe('No reply in 24 hours, so you got ₦1,500 back');
  });
});

describe('the thread', () => {
  const answered = q({ id: 'a', status: 'responded', sentAt: at(-30), deadlineAt: at(-6), respondedAt: at(-27, -46), replies: [{ id: 'r1', text: 'Priced by outcome.', createdAt: at(-27) }] });
  const waiting = q({ id: 'w' });
  it('turns the Hub\'s newest-first list around: a day label, the question, its replies, its card', () => {
    const entries = threadEntries([waiting, answered], NOW);
    expect(entries.map((e) => e.kind)).toEqual(['day', 'question', 'reply', 'card', 'day', 'question', 'card']);
    expect(entries.filter((e) => e.kind === 'card').map((e) => (e.kind === 'card' ? e.status : ''))).toEqual(['responded', 'awaiting_response']);
    expect(entries.at(-1)).toMatchObject({ kind: 'card', last: true });
  });
  it('locks the composer while a question waits, and offers the next one after an answer or a refund', () => {
    expect(isWaiting([waiting], NOW)).toBe(true);
    expect(isWaiting([q({ deadlineAt: at(-1) })], NOW)).toBe(false);
    expect(isWaiting([answered], NOW)).toBe(false);
    expect(composerLabel(answered, 150000)).toBe('Ask a follow-up · ₦1,500');
    expect(composerLabel(q({ status: 'refunded' }), 20000)).toBe('Try again · ₦200');
  });
  it('an empty thread offers a first question, not a follow-up', () => {
    expect(composerLabel(null, 150000)).toBe('Ask a question · ₦1,500');
  });
  it('headlines the latest question', () => {
    expect(headerLine(waiting)).toEqual({ text: 'Paid DM · replies within 24h', tone: 'muted' });
    expect(headerLine(answered)).toEqual({ text: 'Replied in 2h 14m', tone: 'positive' });
    expect(headerLine(q({ status: 'refunded' }))).toEqual({ text: 'Paid DM · refunded', tone: 'muted' });
  });
});

describe('PAY-FX (R-91): a paid question from a dollar account says the dollar amount and the dollar account', () => {
  const usd = { currency: 'USD', decimals: 2, totalMinor: 23, refundedMinor: null };
  const refunded = { currency: 'USD', decimals: 2, totalMinor: 23, refundedMinor: 23 };

  it('the sheet says what comes back, in dollars, to the USD account', () => {
    expect(refundLine(152325, usd)).toBe('No reply in time, your $0.23 comes back to your USD account');
    expect(refundLine(152325)).toBe('No reply in time, your ₦1,523.25 comes back');
  });

  it('the waiting card says the money comes back to the USD account, not the wallet', () => {
    const card = waitingCard(q({ deadlineAt: at(17, 52) }), 'Chidi Eze', NOW, usd);
    expect(card.body).toContain('and it comes back to your USD account.');
    expect(card.body).not.toContain('wallet');
    expect(waitingCard(q({ deadlineAt: at(-1) }), 'Chidi Eze', NOW, usd).body).toBe('Your money is on its way back to your USD account.');
    expect(waitingCard(q({ deadlineAt: at(17, 52) }), 'Chidi Eze', NOW).body).toContain('comes back to your wallet.');
  });

  it('the stamp under the question says what left the account', () => {
    expect(paidStamp(at(0), 10000, NOW, usd)).toMatch(/ · \$0\.23 paid$/);
    expect(paidStamp(at(0), 10000, NOW)).toMatch(/ · ₦100 paid$/);
  });

  it('a refund names the USD account and the dollar amount that went back', () => {
    // The wallet's record of the question (GET /dm/send/wallet/{id}) carries no `source`; the account comes from the payment record.
    const wallet = { status: 'refunded', payment: { hold: { refundedKobo: 10000, settledAt: at(24, 5) } } } as unknown as Parameters<typeof refundedCard>[2];
    const card = refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', wallet, new Date(at(25)).getTime(), refunded);
    expect(card.title).toBe('No reply in 24 hours, so you got $0.23 back');
    expect(card.body).toMatch(/^It went back to your USD account /);
    const moving = { status: 'refunding', payment: { hold: { refundedKobo: 10000, settledAt: null } } } as unknown as Parameters<typeof refundedCard>[2];
    const onItsWay = refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', moving, NOW, usd);
    // A question whose payment record is not known names the Naira wallet.
    expect(refundedCard({ sentAt: at(0), deadlineAt: at(24) }, 'Zainab Bello', moving, NOW).body).toBe('It is on its way to your Naira wallet. Zainab earned nothing.');
    expect(onItsWay.title).toBe('No reply in 24 hours, so $0.23 is coming back');
    expect(onItsWay.body).toBe('It is on its way to your USD account. Zainab earned nothing.');
  });
});
