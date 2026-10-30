import { createButtonMetrics } from '@/components/CreateButton';
import { floatingMetrics, floatingRoom, musicBottom, musicRight } from '@/components/floating';
import { layout } from '@/theme';

/**
 * R-110 point 3 (POLISH-1): nothing a person needs to read sits under the floating buttons. The geometry is measured here: the two buttons
 * are side by side and never overlap, and the room a tab screen keeps under its last block is at least as tall as the tallest button's top edge
 * above the scene's foot, plus clear air.
 */
const rect = (right: number, bottom: number, size: number) => ({ left: 390 - right - size, right: 390 - right, bottom, top: bottom + size });
const overlaps = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) => a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top;

describe('the floating buttons', () => {
  const create = rect(createButtonMetrics.right, createButtonMetrics.bottom, createButtonMetrics.size);

  it('the theme button beside Create never overlaps it, and keeps a gap', () => {
    const music = rect(musicRight(true), musicBottom(), floatingMetrics.music);
    expect(overlaps(music, create)).toBe(false);
    expect(create.left - music.right).toBe(floatingMetrics.gap);
    expect(music.bottom + floatingMetrics.music / 2).toBe(create.bottom + createButtonMetrics.size / 2);
  });

  it('without Create the theme button takes its place, centred on the same line', () => {
    const music = rect(musicRight(false), musicBottom(), floatingMetrics.music);
    expect(music.bottom + floatingMetrics.music / 2).toBe(create.bottom + createButtonMetrics.size / 2);
    expect(music.right + (createButtonMetrics.size - floatingMetrics.music) / 2).toBe(create.right);
  });

  it('the room under a last block clears the top of the tallest button by the clear air', () => {
    const creator = floatingRoom({ create: true, music: true });
    expect(creator).toBe(create.top + floatingMetrics.clear);
    expect(creator).toBeGreaterThanOrEqual(createButtonMetrics.bottom + createButtonMetrics.size);
    const member = floatingRoom({ create: false, music: true });
    expect(member).toBe(musicBottom() + floatingMetrics.music + floatingMetrics.clear);
    // A tab with neither (nothing floats there) keeps no extra room; the Inbox keeps Create's.
    expect(floatingRoom({ create: false, music: false })).toBe(0);
    expect(floatingRoom({ create: true, music: false })).toBe(creator);
  });

  it('is shorter than the old stack: one row high, not Create and the theme button on top of each other', () => {
    const oldStack = createButtonMetrics.bottom + createButtonMetrics.size + floatingMetrics.gap + floatingMetrics.music + floatingMetrics.clear;
    expect(floatingRoom({ create: true, music: true })).toBeLessThan(oldStack);
    expect(layout.tabbarH).toBeGreaterThan(0);
  });
});
