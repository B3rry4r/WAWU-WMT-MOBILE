import {
  RATIO_MAX,
  RATIO_MIN,
  ZOOM_MAX,
  ZOOM_MIN,
  canPlace,
  centred,
  clampPosition,
  formatPhotoPosition,
  isCentred,
  movedBy,
  placement,
  settled,
  splitPhotoLink,
  wheelZoomFactor,
  withPhotoPosition,
  zoomedAbout,
  zoomedTo,
  type Frame,
} from '@/lib/photoPosition';

/** R-96: where a person put their picture in its frame. The fragment matches the Hub's, and the placement never uncovers the frame. */
const square: Frame = { width: 100, height: 100 };
const banner: Frame = { width: 390, height: 195 };

describe('the position in a picture link', () => {
  it('reads the position the Hub serves and the link without it', () => {
    expect(splitPhotoLink('https://h/avatars/u/a.jpg?X-Amz-Signature=s#wmt-pos=0.52,0.41,1.8,1.3333')).toEqual({
      uri: 'https://h/avatars/u/a.jpg?X-Amz-Signature=s',
      position: { x: 0.52, y: 0.41, zoom: 1.8, ratio: 1.3333 },
    });
  });

  it('draws a link with no position, or one it cannot read, centred', () => {
    expect(splitPhotoLink('https://h/a.jpg')).toEqual({ uri: 'https://h/a.jpg', position: null });
    expect(splitPhotoLink('https://h/a.jpg#wmt-pos=oops').position).toBeNull();
    expect(splitPhotoLink('https://h/a.jpg#wmt-pos=0.5,0.5,9,1').position).toBeNull();
    expect(splitPhotoLink('https://h/a.jpg#wmt-pos=0.5,0.5,9,1').uri).toBe('https://h/a.jpg');
    expect(splitPhotoLink('https://h/a.jpg#top').position).toBeNull();
  });

  it('draws a photo whose declared shape is far from any real photo centred, never as a huge stretched element', () => {
    // The shape that drew a 384 by 7680 avatar on Me.
    expect(splitPhotoLink('https://h/a.jpg#wmt-pos=0.5,0.5,4,0.05').position).toBeNull();
    expect(splitPhotoLink('https://h/a.jpg#wmt-pos=0.5,0.5,4,20').position).toBeNull();
    expect(splitPhotoLink(`https://h/a.jpg#wmt-pos=0.5,0.5,4,${RATIO_MIN}`).position?.ratio).toBe(RATIO_MIN);
    expect(splitPhotoLink(`https://h/a.jpg#wmt-pos=0.5,0.5,4,${RATIO_MAX}`).position?.ratio).toBe(RATIO_MAX);
    expect(canPlace(0.1)).toBe(false);
    expect(canPlace(0.75)).toBe(true);
    // The largest a placed photo can be is its range at the greatest zoom: twenty times the frame, never more.
    const tallest = placement(square, { x: 0.5, y: 0.5, zoom: ZOOM_MAX, ratio: RATIO_MIN });
    expect(tallest.height).toBeLessThanOrEqual(20 * square.height);
    expect(tallest.width).toBe(ZOOM_MAX * square.width);
  });

  it('writes the exact fragment the Hub stores, and one position at most', () => {
    expect(formatPhotoPosition({ x: 0.5, y: 0.5, zoom: 1, ratio: 1 })).toBe('wmt-pos=0.5,0.5,1,1');
    expect(formatPhotoPosition({ x: 0.123456, y: 0.987654, zoom: 2.34567, ratio: 1.333333 })).toBe('wmt-pos=0.1235,0.9877,2.346,1.3333');
    const once = withPhotoPosition('https://h/a.jpg#wmt-pos=0.1,0.1,1,1', { x: 0.3, y: 0.6, zoom: 2, ratio: 0.75 });
    expect(once).toBe('https://h/a.jpg#wmt-pos=0.3,0.6,2,0.75');
    expect(withPhotoPosition('https://h/a.jpg#wmt-pos=0.1,0.1,1,1', null)).toBe('https://h/a.jpg');
  });
});

describe('placing a picture in a frame', () => {
  it('a wide photo centred fills the frame by its height and shows its middle', () => {
    expect(placement(square, centred(2))).toEqual({ left: -50, top: 0, width: 200, height: 100 });
  });

  it('a tall photo centred fills the frame by its width and shows its middle', () => {
    expect(placement(square, centred(0.5))).toEqual({ left: 0, top: -50, width: 100, height: 200 });
  });

  it('zoom makes it bigger about the middle, and the focal point sits at the frame middle', () => {
    const at = placement(square, { x: 0.5, y: 0.5, zoom: 2, ratio: 1 });
    expect(at).toEqual({ left: -50, top: -50, width: 200, height: 200 });
    const off = placement(square, { x: 0.6, y: 0.4, zoom: 2, ratio: 1 });
    expect(off.left + 0.6 * off.width).toBeCloseTo(50);
    expect(off.top + 0.4 * off.height).toBeCloseTo(50);
  });

  it('can never be dragged off its edge: the frame stays covered at any position and zoom', () => {
    for (const ratio of [0.4, 1, 1.5, 3]) {
      for (const zoom of [1, 1.7, 4]) {
        for (const [x, y] of [[0, 0], [1, 1], [0, 1], [1, 0], [0.5, 0.5], [-3, 9]]) {
          for (const frame of [square, banner]) {
            const at = placement(frame, { x, y, zoom, ratio });
            expect(at.left).toBeLessThanOrEqual(1e-9);
            expect(at.top).toBeLessThanOrEqual(1e-9);
            expect(at.left + at.width).toBeGreaterThanOrEqual(frame.width - 1e-9);
            expect(at.top + at.height).toBeGreaterThanOrEqual(frame.height - 1e-9);
          }
        }
      }
    }
  });

  it('a photo smaller than the frame is scaled up to fill it and still cannot be dragged off', () => {
    // Only the shape matters: the photo's pixel size never enters, so a 10 by 10 photo behaves like a 4000 by 4000 one.
    const moved = movedBy(square, centred(1), 500, 500);
    expect(moved).toEqual({ x: 0.5, y: 0.5, zoom: 1, ratio: 1 });
  });

  it('dragging moves the photo with the finger, and stops at the edge', () => {
    const start = { x: 0.5, y: 0.5, zoom: 2, ratio: 1 };
    const right = movedBy(square, start, 20, 0);
    expect(right.x).toBeCloseTo(0.4);
    expect(placement(square, right).left).toBeCloseTo(-30);
    expect(movedBy(square, start, 5000, -5000)).toEqual({ x: 0.25, y: 0.75, zoom: 2, ratio: 1 });
  });

  it('keeps the zoom between filling the frame and four times that', () => {
    expect(zoomedTo(square, centred(1), 9).zoom).toBe(ZOOM_MAX);
    expect(zoomedTo(square, centred(1), 0.2).zoom).toBe(ZOOM_MIN);
  });

  it('zooming out pulls the focal point back inside, so the frame stays covered', () => {
    const edge = { x: 0.75, y: 0.75, zoom: 2, ratio: 1 };
    const out = zoomedTo(square, edge, 1.5);
    expect(out.zoom).toBe(1.5);
    expect(out.x).toBeCloseTo(2 / 3);
    expect(out.y).toBeCloseTo(2 / 3);
  });

  it('what is saved is clamped for the frame it was made in, then rounded as the Hub rounds it', () => {
    const saved = settled(square, { x: 0.123456, y: 0.9, zoom: 2.34567, ratio: 1.333333 });
    expect(saved.x).toBeCloseTo(0.1599, 4);
    expect(saved.y).toBeCloseTo(0.7868, 4);
    expect(saved.zoom).toBe(2.346);
    expect(saved.ratio).toBe(1.3333);
    const other = settled(banner, { x: 0.3333333, y: 0.6666667, zoom: 1.2345678, ratio: 1.5 });
    expect(Number.isInteger(Math.round(other.x * 1e8) / 1e4)).toBe(true);
    expect(other.zoom).toBe(1.235);
  });

  it('zooms about the spot under the fingers, which stays under them', () => {
    const start = { x: 0.5, y: 0.5, zoom: 1, ratio: 1 };
    const spot = { x: 75, y: 25 };
    const zoomed = zoomedAbout(square, start, 2, spot);
    expect(zoomed.zoom).toBe(2);
    // The part of the photo that was under the spot is under it still.
    const before = placement(square, start);
    const after = placement(square, zoomed);
    expect((spot.x - before.left) / before.width).toBeCloseTo((spot.x - after.left) / after.width, 6);
    expect((spot.y - before.top) / before.height).toBeCloseTo((spot.y - after.top) / after.height, 6);
    // About the middle it is the same as zooming in place.
    expect(zoomedAbout(square, start, 2, { x: 50, y: 50 })).toEqual(zoomedTo(square, start, 2));
    // A spot in a corner cannot uncover the frame: the photo stops at its edge.
    const corner = zoomedAbout(square, start, 4, { x: 0, y: 0 });
    const box = placement(square, corner);
    expect(box.left).toBeLessThanOrEqual(0);
    expect(box.top).toBeLessThanOrEqual(0);
    expect(box.left + box.width).toBeGreaterThanOrEqual(square.width);
    expect(zoomedAbout(square, start, 99, spot).zoom).toBe(ZOOM_MAX);
  });

  it('turns a wheel or a trackpad pinch into a zoom: forward or opening zooms in, a pinch is more sensitive', () => {
    expect(wheelZoomFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100, 0, false)).toBeLessThan(1);
    expect(wheelZoomFactor(0, 0, false)).toBe(1);
    expect(wheelZoomFactor(-5, 0, true)).toBeGreaterThan(wheelZoomFactor(-5, 0, false));
    // A line-counting wheel (Firefox) is scaled to pixels.
    expect(wheelZoomFactor(-3, 1, false)).toBeCloseTo(wheelZoomFactor(-48, 0, false));
  });

  it('knows a photo that has not been moved or zoomed', () => {
    expect(isCentred(centred(1.2))).toBe(true);
    expect(isCentred({ x: 0.5, y: 0.5, zoom: 1.1, ratio: 1 })).toBe(false);
  });

  it('keeps the same photo point at the middle when the frame has another shape', () => {
    const position = clampPosition(banner, { x: 0.4, y: 0.5, zoom: 2, ratio: 1.5 });
    const inBanner = placement(banner, position);
    const inSquare = placement(square, position);
    expect(inBanner.left + position.x * inBanner.width).toBeCloseTo(banner.width / 2);
    expect(inSquare.left + position.x * inSquare.width).toBeCloseTo(square.width / 2);
  });
});
