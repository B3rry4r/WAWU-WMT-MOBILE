import { bytesOfDataUri, canShareCard, saveCardFile, shareCardFile, writeCard } from '../cardFile';

const mockWrite = jest.fn();
const mockCreate = jest.fn();
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache/' },
  File: class {
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join('');
    }
    create = mockCreate;
    write = mockWrite;
  },
}));

const mockAssetCreate = jest.fn();
const mockPermission = jest.fn();
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: (writeOnly: boolean) => mockPermission(writeOnly),
  Asset: { create: (uri: string) => mockAssetCreate(uri) },
}));

const mockAvailable = jest.fn();
const mockShare = jest.fn();
jest.mock('expo-sharing', () => ({ isAvailableAsync: () => mockAvailable(), shareAsync: (...a: unknown[]) => mockShare(...a) }));

beforeEach(() => {
  [mockWrite, mockCreate, mockAssetCreate, mockPermission, mockAvailable, mockShare].forEach((m) => m.mockReset());
});

describe('H35 · the card as a file on the phone', () => {
  it('reads the bytes of a PNG data address exactly', () => {
    const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 250, 255]);
    const uri = `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
    expect(Array.from(bytesOfDataUri(uri))).toEqual(Array.from(bytes));
  });

  it('refuses an address that is not base64', () => {
    expect(() => bytesOfDataUri('data:image/png,abc')).toThrow();
    expect(() => bytesOfDataUri('data:image/png;base64,@@@@')).toThrow();
  });

  it('writes the card into the cache under its day, replacing a file from an earlier share', () => {
    const uri = writeCard({ blob: {} as Blob, uri: `data:image/png;base64,${Buffer.from([1, 2, 3, 4]).toString('base64')}` }, '2025-09-26');
    expect(uri).toBe('file:///cache/TGIF-2025-09-26.png');
    expect(mockCreate).toHaveBeenCalledWith({ overwrite: true });
    expect(Array.from(mockWrite.mock.calls[0][0] as Uint8Array)).toEqual([1, 2, 3, 4]);
  });

  it('hands the file to the phone share sheet as a PNG with a title', async () => {
    mockShare.mockResolvedValue(undefined);
    await shareCardFile('file:///cache/a.png', 'Share to your story');
    expect(mockShare).toHaveBeenCalledWith('file:///cache/a.png', { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share to your story' });
  });

  it('knows whether the phone can share, and treats a failing check as no', async () => {
    mockAvailable.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('no module'));
    expect(await canShareCard()).toBe(true);
    expect(await canShareCard()).toBe(false);
    expect(await canShareCard()).toBe(false);
  });

  it('saves to the photos only after the person allows adding to them', async () => {
    mockPermission.mockResolvedValue({ granted: true });
    mockAssetCreate.mockResolvedValue({});
    expect(await saveCardFile('file:///cache/a.png')).toBe('saved');
    expect(mockPermission).toHaveBeenCalledWith(true);
    expect(mockAssetCreate).toHaveBeenCalledWith('file:///cache/a.png');

    mockAssetCreate.mockReset();
    mockPermission.mockResolvedValue({ granted: false });
    expect(await saveCardFile('file:///cache/a.png')).toBe('denied');
    expect(mockAssetCreate).not.toHaveBeenCalled();
  });
});
