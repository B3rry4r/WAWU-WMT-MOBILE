import { placePanel, type Anchor } from '../StudioPopover';

/*
 * Where Studio's pop-overs stand (STUDIO-HOME round 1, finding 1): whatever the window, the safe edges, the number of rows or how far the page was
 * scrolled when the menu opened (the control is measured then), the panel's cap keeps it inside the screen, so its rows scroll instead of leaving it.
 */
const WINDOWS = [
  { width: 390, height: 844 },
  { width: 390, height: 667 },
  { width: 360, height: 640 },
];
const SAFE = [
  { top: 0, bottom: 0 },
  { top: 47, bottom: 34 },
  { top: 24, bottom: 0 },
];
const SIDE = 16;
// The tallest the More list gets (12 rows of two lines at most) and the shortest the app draws a menu (3 attach rows).
const TALL = 12 * 56 + 16;
const SHORT = 3 * 52 + 16;
const more = (y: number): Anchor => ({ x: 292, y, width: 82, height: 107 });

/** The panel's box when it is as tall as its cap lets it be (the worst case for fitting). */
function box(p: ReturnType<typeof placePanel>, winHeight: number) {
  const bottom = p.bottom !== undefined ? winHeight - p.bottom : (p.top as number) + p.maxHeight;
  const top = p.top !== undefined ? p.top : bottom - p.maxHeight;
  return { top, bottom };
}

describe('placePanel · the panel stays inside the screen', () => {
  it('for every place the control can be on every phone, the capped panel is inside the safe edges and clear of its control', () => {
    for (const win of WINDOWS) {
      for (const insets of SAFE) {
        for (let y = 0; y <= win.height - 107; y += 7) {
          for (const content of [null, SHORT, TALL]) {
            const anchor = more(y);
            const p = placePanel({ anchor, win, insets, align: 'right', content });
            const { top, bottom } = box(p, win.height);
            expect(top).toBeGreaterThanOrEqual(insets.top + SIDE - 0.001);
            expect(bottom).toBeLessThanOrEqual(win.height - insets.bottom - SIDE + 0.001);
            // Clear of the control: above it ends before the control starts, below it starts after the control ends.
            if (p.above) expect(bottom).toBeLessThanOrEqual(anchor.y + 0.001);
            else expect(top).toBeGreaterThanOrEqual(anchor.y + anchor.height - 0.001);
            expect(p.maxHeight).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it('a list too tall for either side opens on the side with more room and takes all of it', () => {
    for (const win of WINDOWS) {
      for (let y = 0; y <= win.height - 107; y += 7) {
        const insets = { top: 47, bottom: 34 };
        const p = placePanel({ anchor: more(y), win, insets, align: 'right', content: TALL });
        const roomAbove = y - 8 - (insets.top + SIDE);
        const roomBelow = win.height - insets.bottom - SIDE - (y + 107) - 8;
        expect(p.above).toBe(roomAbove >= roomBelow);
        expect(p.maxHeight).toBeCloseTo(Math.max(roomAbove, roomBelow), 3);
      }
    }
  });

  it('a short list rises above its control as before when it fits there, even where the room below is larger', () => {
    // 844 high, the "+" of the box (y 366): 313 above, 364 below; a 3-row menu fits above, so it stays above.
    const p = placePanel({ anchor: { x: 16, y: 366, width: 38, height: 38 }, win: { width: 390, height: 844 }, insets: { top: 0, bottom: 0 }, align: 'left', content: SHORT });
    expect(p.above).toBe(true);
    expect(p.bottom).toBe(844 - 366 + 8);
  });

  it('a list that does not fit above drops below when there is more room there, and is capped to it', () => {
    const win = { width: 390, height: 844 };
    const insets = { top: 47, bottom: 34 };
    const p = placePanel({ anchor: more(120), win, insets, align: 'right', content: TALL });
    expect(p.above).toBe(false);
    expect(p.top).toBe(120 + 107 + 8);
    expect(p.maxHeight).toBe(844 - 34 - SIDE - (120 + 107) - 8);
    expect(p.maxHeight).toBeLessThan(TALL);
  });

  it('with the full list (about 650 tall) at 390x667 and 390x844 the panel is capped below its own height wherever the page was scrolled to', () => {
    for (const win of [WINDOWS[0], WINDOWS[1]]) {
      // The More tile unscrolled, and the page scrolled a thumb's worth (120) or more.
      for (const y of [win.height - 130, win.height - 250, win.height - 370, 200]) {
        const p = placePanel({ anchor: more(y), win, insets: { top: 47, bottom: 34 }, align: 'right', content: TALL });
        expect(p.maxHeight).toBeLessThan(TALL);
        const { top, bottom } = box(p, win.height);
        expect(top).toBeGreaterThanOrEqual(47 + SIDE);
        expect(bottom).toBeLessThanOrEqual(win.height - 34 - SIDE);
      }
    }
  });

  it('lines up with the control on the side it asks for and never leaves the sides of the window', () => {
    const win = { width: 390, height: 844 };
    const insets = { top: 0, bottom: 0 };
    const right = placePanel({ anchor: more(500), win, insets, align: 'right', content: null });
    expect(right.left).toBe(292 + 82 - 288);
    const left = placePanel({ anchor: { x: 2, y: 500, width: 38, height: 38 }, win, insets, align: 'left', content: null });
    expect(left.left).toBe(SIDE);
  });

  it('where the phone gave no position yet it sits in its corner, as tall as the screen allows and no taller', () => {
    for (const win of WINDOWS) {
      const insets = { top: 47, bottom: 34 };
      const p = placePanel({ anchor: null, win, insets, align: 'right', content: null });
      const { top, bottom } = box(p, win.height);
      expect(top).toBeGreaterThanOrEqual(insets.top + SIDE);
      expect(bottom).toBeLessThanOrEqual(win.height - insets.bottom - SIDE);
      expect(p.left).toBe(win.width - SIDE - Math.min(288, win.width - SIDE * 2));
    }
  });
});
