import type { DoorResult } from '../doorApi';
import { alreadyUsedLine, byLine, CANCELLED_LINE, checkedInWhen, localNotValidView, NOT_VALID_LINE, resultView } from '../doorFormat';

/** A moment on this phone's own clock, so the expectations hold in any time zone. */
const at = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo - 1, d, h, mi, 0).toISOString();
const NOW = new Date(2026, 9, 10, 14, 30, 0).getTime();

const totals = { sold: 64, checkedIn: 23, stillToArrive: 41, remaining: 56 };
const ticket = { code: 'K7QX-4M2P-9WVA-3RTE', tierName: 'Regular', holderName: 'Lennox Emmanuel', checkedInAt: at(2026, 10, 10, 9, 52), checkedInBy: { role: 'door_staff' as const, label: 'Door 1' } };

describe('when a ticket was let in (E23)', () => {
  it('is the clock time on the day itself', () => {
    expect(checkedInWhen(at(2026, 10, 10, 9, 52), NOW)).toBe('at 09:52');
    expect(checkedInWhen(at(2026, 10, 10, 0, 5), NOW)).toBe('at 00:05');
  });

  it('names the day when it was another day, so an old check-in is never read as today', () => {
    expect(checkedInWhen(at(2026, 10, 9, 21, 3), NOW)).toBe('Fri 9 Oct at 21:03');
    expect(checkedInWhen(at(2025, 12, 31, 23, 59), NOW)).toBe('Wed 31 Dec 2025 at 23:59');
  });
});

describe('who let it in (E23)', () => {
  it('names the door the Hub gives', () => {
    expect(byLine({ role: 'door_staff', label: 'Door 1' })).toBe(' by Door 1');
    expect(byLine({ role: 'door_staff', label: '  Gate B  ' })).toBe(' by Gate B');
  });

  it('says the organiser when they scanned it themselves, and nothing when the scanner is not known', () => {
    expect(byLine({ role: 'host', label: null })).toBe(' by the organiser');
    expect(byLine(null)).toBe('');
    expect(byLine({ role: 'door_staff', label: null })).toBe('');
  });

  it('reads as one sentence', () => {
    expect(alreadyUsedLine(at(2026, 10, 10, 9, 52), { role: 'door_staff', label: 'Door 1' }, NOW)).toBe('Checked in at 09:52 by Door 1');
    expect(alreadyUsedLine(at(2026, 10, 9, 9, 52), null, NOW)).toBe('Checked in Fri 9 Oct at 09:52');
  });
});

describe('the three results', () => {
  it('E20: the tier and the holder, and the live counts', () => {
    const view = resultView({ outcome: 'valid', ticket, totals }, NOW);
    expect(view).toMatchObject({ tone: 'positive', icon: 'Check', title: 'LET THEM IN', line: 'Regular · Lennox Emmanuel', totals: ['In the room 23', 'Still to arrive 41'] });
    expect(view.announce).toBe('LET THEM IN. Regular · Lennox Emmanuel. In the room 23. Still to arrive 41.');
  });

  it('E20 with no name to give: the tier alone, never an empty or made-up name', () => {
    expect(resultView({ outcome: 'valid', ticket: { ...ticket, holderName: null }, totals }, NOW).line).toBe('Regular');
    expect(resultView({ outcome: 'valid', ticket: { ...ticket, holderName: '  ' }, totals }, NOW).line).toBe('Regular');
  });

  it('E23: when and by which door', () => {
    expect(resultView({ outcome: 'already_used', ticket, totals }, NOW)).toMatchObject({
      tone: 'warning',
      icon: 'Clock',
      title: 'ALREADY USED',
      line: 'Checked in at 09:52 by Door 1',
      totals: ['In the room 23', 'Still to arrive 41'],
    });
  });

  it('E24: the code is not for this event, and the counts are still the event’s', () => {
    expect(resultView({ outcome: 'invalid', ticket: null, totals }, NOW)).toMatchObject({
      tone: 'danger',
      icon: 'X',
      title: 'NOT A VALID TICKET',
      line: NOT_VALID_LINE,
      totals: ['In the room 23', 'Still to arrive 41'],
    });
  });

  it('E24 for a voided ticket of this event: "This ticket was cancelled", still red, still with the counts', () => {
    expect(CANCELLED_LINE).toBe('This ticket was cancelled');
    expect(resultView({ outcome: 'invalid', reason: 'cancelled', ticket: null, totals }, NOW)).toMatchObject({
      tone: 'danger',
      title: 'NOT A VALID TICKET',
      line: 'This ticket was cancelled',
      totals: ['In the room 23', 'Still to arrive 41'],
    });
    // A reason of null, or none, is the plain answer.
    expect(resultView({ outcome: 'invalid', reason: null, ticket: null, totals }, NOW).line).toBe(NOT_VALID_LINE);
  });

  it('E24 answered by the app itself (a reading the Hub would not take): red, the plain line, and no count, since nobody was asked', () => {
    const view = localNotValidView();
    expect(view).toMatchObject({ tone: 'danger', icon: 'X', title: 'NOT A VALID TICKET', line: NOT_VALID_LINE, totals: null });
    expect(view.announce).toBe("NOT A VALID TICKET. This code isn't for this event.");
  });

  it('an answer that says valid with no ticket is never drawn as a let in', () => {
    const odd = { outcome: 'valid', ticket: null, totals } as unknown as DoorResult;
    expect(resultView(odd, NOW).title).toBe('NOT A VALID TICKET');
  });

  it('writes no em-dash in anything a person reads', () => {
    for (const result of [
      { outcome: 'valid', ticket, totals },
      { outcome: 'already_used', ticket, totals },
      { outcome: 'invalid', ticket: null, totals },
    ] as DoorResult[]) {
      const view = resultView(result, NOW);
      expect([view.title, view.line, ...(view.totals ?? []), view.announce].join(' ')).not.toContain('—');
    }
  });
});
