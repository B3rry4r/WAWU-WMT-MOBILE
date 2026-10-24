import { cardOrder, readerSteps, sponsoredSlot } from '@/features/tgif/model';

describe('the reader steps with a sponsored card (H33)', () => {
  it('are the five cards when there is no card to show', () => {
    expect(readerSteps()).toHaveLength(5);
    expect(readerSteps(false)).toEqual(cardOrder.map((card) => ({ kind: 'card', card })));
  });

  it('put the sponsored card before the takeaway, making six', () => {
    const steps = readerSteps(true);
    expect(steps).toHaveLength(6);
    expect(steps[4]).toEqual({ kind: 'sponsored' });
    expect(steps[5]).toEqual({ kind: 'card', card: 'takeaway' });
    expect(steps.slice(0, 4).every((s) => s.kind === 'card')).toBe(true);
  });

  it('name its place as the one the takeaway has without it', () => {
    expect(sponsoredSlot).toBe(4);
    expect(readerSteps(false)[sponsoredSlot]).toEqual({ kind: 'card', card: 'takeaway' });
    expect(readerSteps(true)[sponsoredSlot]).toEqual({ kind: 'sponsored' });
  });
});
