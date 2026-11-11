import { getSmallCopy, abandonDraft } from '@/features/create/draft';
import { smallCopyOf } from '@/features/create/previewCopy';

import { holdPictureCopy, putPieceInDraft } from '../pieceFlow';

jest.mock('@/features/create/previewCopy', () => ({ smallCopyOf: jest.fn() }));
jest.mock('@/features/create/api', () => ({ releaseUpload: jest.fn(async () => undefined) }));

const piece = (format: 'image' | 'audio') => ({
  format,
  suggestedTitle: 'A kite',
  full: { key: 'k1', fileUrl: 'https://files.example/k1.png', contentType: 'image/png', bytes: 10, name: 'k1.png' },
});
const copy = () => ({ blob: new Blob(['x']), name: 'preview.jpg', contentType: 'image/jpeg', extension: 'jpg', discard: jest.fn() });

describe('a Studio picture going into Create (R-118)', () => {
  beforeEach(() => {
    abandonDraft();
    (smallCopyOf as jest.Mock).mockReset();
  });
  it('a user who makes a picture a piece has the phone make its smaller copy from the result link', async () => {
    const c = copy();
    (smallCopyOf as jest.Mock).mockResolvedValue(c);
    const p = piece('image') as never;
    putPieceInDraft(p);
    await holdPictureCopy(p);
    expect(smallCopyOf).toHaveBeenCalledWith({ previewUri: 'https://files.example/k1.png' });
    expect(getSmallCopy()).toBe(c);
  });
  it('drops the copy when the draft moved on to another piece meanwhile', async () => {
    const c = copy();
    (smallCopyOf as jest.Mock).mockResolvedValue(c);
    const p = piece('image') as never;
    putPieceInDraft(p);
    abandonDraft();
    await holdPictureCopy(p);
    expect(c.discard).toHaveBeenCalled();
    expect(getSmallCopy()).toBeNull();
  });
  it('makes none for an audio piece', async () => {
    const p = piece('audio') as never;
    putPieceInDraft(p);
    await holdPictureCopy(p);
    expect(smallCopyOf).not.toHaveBeenCalled();
  });
});
