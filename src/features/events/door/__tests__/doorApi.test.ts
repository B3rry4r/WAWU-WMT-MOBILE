import { isEventId, readDoorResult } from '../doorApi';

const totals = { sold: 3, checkedIn: 1, stillToArrive: 2, remaining: 47 };
const ticket = { code: 'K7QX-4M2P-9WVA-3RTE', tierName: 'Regular', holderName: 'Chidi Umeh', checkedInAt: '2026-10-10T08:52:00.000Z', checkedInBy: { role: 'host', label: null } };
const body = (data: unknown) => ({ statusCode: 201, message: 'Created', data });

describe('reading the door answer', () => {
  it('takes a complete answer of each kind', () => {
    expect(readDoorResult(body({ outcome: 'valid', ticket, totals }))).toMatchObject({ outcome: 'valid' });
    expect(readDoorResult(body({ outcome: 'already_used', ticket, totals }))).toMatchObject({ outcome: 'already_used' });
    expect(readDoorResult(body({ outcome: 'invalid', ticket: null, totals }))).toMatchObject({ outcome: 'invalid' });
  });

  it('refuses an answer that is not whole: no verdict is drawn from it', () => {
    expect(readDoorResult(null)).toBeNull();
    expect(readDoorResult(body(null))).toBeNull();
    expect(readDoorResult(body({ outcome: 'maybe', ticket: null, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket: null, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'invalid', ticket, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'already_used', ticket: { ...ticket, checkedInAt: null }, totals }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket, totals: { ...totals, checkedIn: 'x' } }))).toBeNull();
    expect(readDoorResult(body({ outcome: 'valid', ticket, totals: { ...totals, stillToArrive: -1 } }))).toBeNull();
  });
});

describe('an event id in a link', () => {
  it('is a uuid, and nothing else is sent to the Hub', () => {
    expect(isEventId('e5000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isEventId('door')).toBe(false);
    expect(isEventId('')).toBe(false);
    expect(isEventId('e5000000-0000-4000-8000-000000000001/../x')).toBe(false);
  });
});
