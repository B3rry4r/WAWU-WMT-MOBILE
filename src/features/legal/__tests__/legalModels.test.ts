import { dayChips, horizonWords, mediumRows, pickedLine, sheetSubtitle } from '../book/model';
import { matterCardOf } from '../cards';
import { isOpenMatter } from '../api';
import { nameChoice } from '../fixed/model';
import { askOf, consultationBooked, consultationLine, signableName, stepsOf } from '../matter/model';
import { feeSettled } from '../pay/model';
import { OPTIONS, request } from '../testing/legalHub';

const req = (over: Record<string, unknown> = {}) => request(over) as unknown as Parameters<typeof stepsOf>[0];

describe('book: what S18 draws from the Hub', () => {
  it('one card per kind WAWU offers, with its length and price, and an in-person one priced per matter', () => {
    const rows = mediumRows(OPTIONS as Parameters<typeof mediumRows>[0]);
    expect(rows.map((r) => [r.title, r.sub, r.priceKobo])).toEqual([
      ['Video call', '30 minutes', 1_500_000],
      ['Phone call', '20 minutes', 1_000_000],
      ['In person', 'Arranged by email, fee per matter', null],
    ]);
  });

  it('an in-person consultation WAWU has priced is arranged by email and keeps its price', () => {
    const [row] = mediumRows([{ medium: 'physical', label: 'In person', minutes: null, priceKobo: 5_000_000, onRequest: true }]);
    expect(row.sub).toBe('Arranged by email');
    expect(row.priceKobo).toBe(5_000_000);
  });

  it('the day strip keeps days with an hour free, with their times in Lagos time', () => {
    const chips = dayChips({
      medium: 'zoom',
      label: 'Video call',
      minutes: 30,
      timeZone: 'Africa/Lagos',
      horizonDays: 21,
      days: [
        { date: '2099-10-02', slots: [{ startsAt: '2099-10-02T08:00:00.000Z', available: false }, { startsAt: '2099-10-02T11:00:00.000Z', available: true }] },
        { date: '2099-10-03', slots: [{ startsAt: '2099-10-03T08:00:00.000Z', available: false }] },
      ],
    });
    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({ weekday: 'Fri', day: 2 });
    expect(chips[0].slots.map((s) => [s.time, s.available])).toEqual([['09:00', false], ['12:00', true]]);
  });

  it('says the pick the way the board does, and the horizon in words', () => {
    expect(pickedLine('2099-10-02T11:00:00.000Z', 'Africa/Lagos')).toBe('Fri 2 Oct, 12:00 (Lagos time)');
    expect(pickedLine('2099-10-02T11:00:00.000Z', 'Africa/Accra')).toBe('Fri 2 Oct, 12:00');
    expect(horizonWords(21)).toBe('three weeks');
    expect(horizonWords(14)).toBe('two weeks');
    expect(horizonWords(10)).toBe('10 days');
    expect(sheetSubtitle('2099-10-02T11:00:00.000Z', 30)).toBe('Fri 2 Oct, 12:00 · 30 min');
    expect(sheetSubtitle(null, null)).toBe('');
  });
});

describe('matter: the steps are read from what the Hub records', () => {
  const states = (r: ReturnType<typeof req>) => stepsOf(r).map((s) => `${s.key}:${s.state}`);

  it('a consultation matter has five steps and a fixed-price one four', () => {
    expect(stepsOf(req())).toHaveLength(5);
    expect(stepsOf(req({ path: 'simple', status: 'quoted', quoteAmount: 35000 }))).toHaveLength(4);
  });

  it('walks from the consultation to the documents', () => {
    expect(states(req({ status: 'consultation_scheduled', consultationPaidAt: 'x' }))).toEqual(['sent:done', 'consultation:now', 'quote:todo', 'pay:todo', 'delivered:todo']);
    expect(states(req({ status: 'quoted', consultationPaidAt: 'x', quoteAmount: 45000 }))[2]).toBe('quote:now');
    expect(states(req({ status: 'contract_signed', consultationPaidAt: 'x', quoteAmount: 45000, contractSigned: true }))[3]).toBe('pay:now');
    expect(states(req({ status: 'in_progress', consultationPaidAt: 'x', quoteAmount: 45000, contractSigned: true, servicePaidAt: 'x' }))[4]).toBe('delivered:now');
    expect(states(req({ status: 'delivered', consultationPaidAt: 'x', quoteAmount: 45000, contractSigned: true, servicePaidAt: 'x', deliveredAt: 'x' })).every((s) => s.endsWith('done'))).toBe(true);
  });

  it('a closed matter marks no step as the current one, and keeps the steps it had finished (S22 under the closed banner)', () => {
    const closed = states(req({ status: 'cancelled', consultationPaidAt: 'x', quoteAmount: 45000, contractSigned: true }));
    expect(closed).toEqual(['sent:done', 'consultation:done', 'quote:done', 'pay:todo', 'delivered:todo']);
    expect(states(req({ status: 'cancelled' })).some((s) => s.endsWith(':now'))).toBe(false);
  });

  it('draws the hour and the kind only once something is booked, and a consultant has read it only once it is paid', () => {
    expect(consultationLine({ consultationMedium: null, scheduledFor: null })).toBeNull();
    expect(consultationLine({ consultationMedium: 'zoom', scheduledFor: '2099-10-02T11:00:00.000Z' })).toBe('Fri 2 Oct, 12:00 · video');
    expect(consultationLine({ consultationMedium: 'physical', scheduledFor: null })).toBe("In person · we'll arrange a time by email");
    expect(stepsOf(req())[0].sub).toBeNull();
    expect(stepsOf(req({ consultationPaidAt: 'x' }))[0].sub).toBe('Answers read by your consultant');
  });

  it('asks for the letter to be signed, then the fee, and nothing of a closed matter', () => {
    expect(askOf(req({ status: 'quoted', quoteAmount: 45000 }))).toBe('sign');
    expect(askOf(req({ status: 'contract_signed', quoteAmount: 45000, contractSigned: true }))).toBe('pay');
    expect(askOf(req({ status: 'in_progress', quoteAmount: 45000, contractSigned: true, servicePaidAt: 'x' }))).toBeNull();
    expect(askOf(req({ status: 'cancelled', quoteAmount: 45000 }))).toBeNull();
    expect(askOf(req())).toBeNull();
  });

  it('a consultation is booked once it is paid and still ahead', () => {
    expect(consultationBooked(req({ status: 'consultation_scheduled', consultationPaidAt: 'x' }))).toBe(true);
    expect(consultationBooked(req({ status: 'awaiting_consultation_payment' }))).toBe(false);
    expect(consultationBooked(req({ status: 'quoted', consultationPaidAt: 'x', quoteAmount: 1 }))).toBe(false);
  });

  it('a signature is a first and a last name', () => {
    expect(signableName('Lennox')).toBeNull();
    expect(signableName('  Lennox   Emmanuel ')).toBe('Lennox Emmanuel');
  });
});

describe('pay: a fee is settled when the matter says so', () => {
  it('reads the stage on the matter', () => {
    expect(feeSettled({ consultationPaidAt: 'x', servicePaidAt: null }, 'consultation')).toBe(true);
    expect(feeSettled({ consultationPaidAt: 'x', servicePaidAt: null }, 'service')).toBe(false);
    expect(feeSettled({ consultationPaidAt: null, servicePaidAt: 'x' }, 'service')).toBe(true);
  });
});

describe('fixed price: what S26 asks of the person', () => {
  it('a name choice is words, trimmed', () => {
    expect(nameChoice(' ')).toBeNull();
    expect(nameChoice('a')).toBeNull();
    expect(nameChoice('  Lennox   Films ')).toBe('Lennox Films');
  });
});

describe('R2-LEGAL2 H-1: which matters the Legal entry goes back to', () => {
  const sent = (requestStatus: string | null) => ({ stage: 'sent', requestStatus }) as Parameters<typeof isOpenMatter>[0];

  it('a conversation not yet sent is open, and so is a sent one at every step up to delivery', () => {
    expect(isOpenMatter({ stage: 'profiling', requestStatus: null } as Parameters<typeof isOpenMatter>[0])).toBe(true);
    for (const status of ['awaiting_quote', 'awaiting_consultation_payment', 'consultation_scheduled', 'consultation_done', 'quoted', 'contract_signed', 'awaiting_service_payment', 'in_progress']) {
      expect(isOpenMatter(sent(status))).toBe(true);
    }
  });

  it('a delivered or cancelled matter is finished, so Legal opens a new conversation', () => {
    expect(isOpenMatter(sent('delivered'))).toBe(false);
    expect(isOpenMatter(sent('cancelled'))).toBe(false);
  });

  it('the chat card books only a consultation matter that has not moved on, and opens every other', () => {
    expect(matterCardOf('awaiting_quote', 'consultation')).toBe('book');
    expect(matterCardOf('awaiting_quote', 'simple')).toBe('open');
    expect(matterCardOf('quoted', 'consultation')).toBe('open');
    expect(matterCardOf('in_progress', 'simple')).toBe('open');
    expect(matterCardOf('cancelled', 'simple')).toBeNull();
    expect(matterCardOf(null, null)).toBeNull();
  });
});
