import { act, renderHook } from '@testing-library/react-native';
import { PixelRatio, Platform } from 'react-native';

import { copyCandidates, copyFor, useCopy } from '../thumbs';

const copies = { w96: 'https://files/a.t96.webp?sig=1', w640: 'https://files/a.t640.webp?sig=1' };
const full = 'https://files/a.jpg?sig=1';

const withRatio = (ratio: number) => jest.spyOn(PixelRatio, 'get').mockReturnValue(ratio);
afterEach(() => jest.restoreAllMocks());

function suite(os: 'ios' | 'android' | 'web') {
  describe(`on ${os}`, () => {
    const original = Platform.OS;
    beforeAll(() => {
      Platform.OS = os;
    });
    afterAll(() => {
      Platform.OS = original;
    });

    it('takes w96 when the drawn size in device pixels is 96 or less', () => {
      withRatio(1);
      expect(copyFor(copies, 96)).toBe(copies.w96);
      withRatio(2);
      expect(copyCandidates(full, copies, 44)[0]).toBe(copies.w96); // 88 px
      expect(copyCandidates(full, copies, 48)[0]).toBe(copies.w96); // exactly 96 px
    });

    it('takes w640 for an avatar drawn at 44 on a 3x screen (132 px), not w96', () => {
      withRatio(3);
      expect(copyCandidates(full, copies, 44)).toEqual([copies.w640, full]);
    });

    it('takes w640 up to 640 device pixels and the full picture beyond', () => {
      withRatio(2);
      expect(copyCandidates(full, copies, 320)[0]).toBe(copies.w640);
      expect(copyCandidates(full, copies, 321)).toEqual([full]);
      withRatio(1);
      expect(copyCandidates(full, copies, 1440)).toEqual([full]);
    });

    it('takes w640 when the size is not known', () => {
      withRatio(3);
      expect(copyCandidates(full, copies)[0]).toBe(copies.w640);
    });

    it('draws the full picture, as today, when the field is missing, null or empty', async () => {
      withRatio(1);
      expect(copyCandidates(full, undefined, 44)).toEqual([full]);
      expect(copyCandidates(full, null, 44)).toEqual([full]);
      expect(copyCandidates(full, { w96: '', w640: '' }, 44)).toEqual([full]);
      expect((await renderHook(() => useCopy(full, null, 44))).result.current.uri).toBe(full);
    });

    it('keeps the position the person placed the photo at (R-96) on the copy', () => {
      withRatio(1);
      expect(copyCandidates(`${full}#wmt-pos=0.5,0.4,1.8,1.3333`, copies, 44)[0]).toBe(`${copies.w96}#wmt-pos=0.5,0.4,1.8,1.3333`);
    });

    it('switches to the full picture once when the copy fails, with no loop and never a blank', async () => {
      withRatio(1);
      const { result } = await renderHook(() => useCopy(full, copies, 44));
      expect(result.current.uri).toBe(copies.w96);
      let verdict: string = '';
      await act(async () => {
        verdict = result.current.onError();
      });
      expect(verdict).toBe('retry');
      expect(result.current.uri).toBe(full);
      await act(async () => {
        verdict = result.current.onError();
      });
      expect(verdict).toBe('final');
      expect(result.current.uri).toBe(full);
    });
  });
}

suite('web');
suite('android');
suite('ios');

describe('pictureCandidates with the Hub copies', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pictureCandidates } = require('@/features/feed/model') as typeof import('@/features/feed/model');
  const cover = { w96: 'https://f/c.t96.webp', w640: 'https://f/c.t640.webp' };
  const prev = { w96: 'https://f/p.t96.webp', w640: 'https://f/p.t640.webp' };
  const piece = { contentType: 'image', coverUrl: 'https://f/c.jpg', coverThumbs: cover };

  it('puts each copy before its full picture, cover first', () => {
    withRatio(2);
    expect(pictureCandidates(piece, 'https://f/p.jpg', { preview: prev, drawn: 64 })).toEqual([cover.w640, 'https://f/c.jpg', prev.w640, 'https://f/p.jpg']);
  });

  it('draws full pictures only when the screen passes no size (a piece page, a zoom)', () => {
    withRatio(2);
    expect(pictureCandidates(piece, 'https://f/p.jpg')).toEqual(['https://f/c.jpg', 'https://f/p.jpg']);
  });

  it('is exactly today when the copies are missing or null', () => {
    withRatio(2);
    expect(pictureCandidates({ ...piece, coverThumbs: null }, 'https://f/p.jpg', { preview: undefined, drawn: 64 })).toEqual(['https://f/c.jpg', 'https://f/p.jpg']);
  });
});
