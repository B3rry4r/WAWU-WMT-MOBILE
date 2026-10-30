/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * OPEN-UPLOAD: the photos A26 and A27 take on the phone are brought down before they are held, so the upload over a
 * phone's data is small and quick. The real pickers (`documents/pick.ts`) and `readPicked` run over replacements of
 * expo-image-picker, expo-image-manipulator, expo-document-picker and expo-file-system, which record what the encoder was
 * asked for and keep the phone's files by uri.
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/** The files on the phone, by uri. A uri not here is gone. */
const mockFiles: Record<string, Uint8Array> = {};

jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists() {
      return this.uri in mockFiles;
    }
    delete() {
      delete mockFiles[this.uri];
    }
  }
  class Directory {
    uri = 'file:///cache/ImageManipulator/';
    exists = true;
    list() {
      return Object.keys(mockFiles).filter((uri) => uri.startsWith(this.uri)).map((uri) => new File(uri));
    }
  }
  return { File, Directory, Paths: { cache: { uri: 'file:///cache/' } } };
});

type Asset = { uri: string; mimeType?: string; width: number; height: number };
let mockCameraAllowed = true;
let mockPhoto: Asset = { uri: 'file:///cache/ImagePicker/camera.jpg', mimeType: 'image/jpeg', width: 4000, height: 3000 };
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: mockCameraAllowed })),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [mockPhoto] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [mockPhoto] })),
}));

let mockPicked: { uri: string; mimeType: string; name: string } | null = null;
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => (mockPicked ? { canceled: false, assets: [mockPicked] } : { canceled: true, assets: null })),
}));

/** What the encoder was asked: the picture's size when it got it, any resize, and how it saved the result. */
const mockEncoded: { from: string; resize: { width?: number; height?: number } | null; format?: string; compress?: number; width: number; height: number }[] = [];
let mockSizeOf: Record<string, { width: number; height: number }> = {};
jest.mock('expo-image-manipulator', () => {
  const makeImage = (from: string, size: { width: number; height: number }, resize: { width: number; height: number } | null, asked: { width?: number; height?: number } | null) => ({
    width: size.width,
    height: size.height,
    saveAsync: async (options: { format?: string; compress?: number }) => {
      const uri = `file:///cache/ImageManipulator/out-${mockEncoded.length + 1}.${options.format === 'png' ? 'png' : 'jpg'}`;
      mockFiles[uri] = options.format === 'png' ? Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1]) : Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
      mockEncoded.push({ from, resize: asked, format: options.format, compress: options.compress, width: (resize ?? size).width, height: (resize ?? size).height });
      return { uri, width: (resize ?? size).width, height: (resize ?? size).height };
    },
    release: jest.fn(),
    source: from,
    size,
  });
  return {
    SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
    ImageManipulator: {
      manipulate: (source: string | ReturnType<typeof makeImage>) => {
        const from = typeof source === 'string' ? source : source.source;
        const size = typeof source === 'string' ? (mockSizeOf[source] ?? { width: 0, height: 0 }) : source.size;
        let asked: { width?: number; height?: number } | null = null;
        const context = {
          resize: (to: { width?: number; height?: number }) => {
            asked = to;
            return context;
          },
          renderAsync: async () => {
            if (!asked) return makeImage(from, size, null, null);
            const scale = asked.width ? asked.width / size.width : (asked.height as number) / size.height;
            return makeImage(from, size, { width: Math.round(size.width * scale), height: Math.round(size.height * scale) }, asked);
          },
          release: jest.fn(),
        };
        return context;
      },
    },
  };
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!(href in mockFiles)) throw new TypeError('Network request failed');
  return new Response(Uint8Array.from(mockFiles[href]));
}) as typeof fetch;

const pick = () => require('../documents/pick') as typeof import('../documents/pick');

beforeEach(() => {
  Object.keys(mockFiles).forEach((uri) => delete mockFiles[uri]);
  mockEncoded.length = 0;
  mockCameraAllowed = true;
  mockPicked = null;
  mockPhoto = { uri: 'file:///cache/ImagePicker/camera.jpg', mimeType: 'image/jpeg', width: 4000, height: 3000 };
  mockFiles[mockPhoto.uri] = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0, 4, 0, 0, 0xff, 0xd9]);
  mockSizeOf = { [mockPhoto.uri]: { width: 4000, height: 3000 } };
});

describe('an ID photo from the camera', () => {
  it('is brought down to 2000 pixels on its long side and saved as a JPEG', async () => {
    const file = await pick().pickIdPhoto('id-front');

    expect(file?.name).toBe('id-front.jpg');
    expect(file?.contentType).toBe('image/jpeg');
    expect(mockEncoded).toHaveLength(1);
    expect(mockEncoded[0].resize).toEqual({ width: 2000 });
    expect(mockEncoded[0].format).toBe('jpeg');
    expect(mockEncoded[0].compress).toBe(0.8);
    expect([mockEncoded[0].width, mockEncoded[0].height]).toEqual([2000, 1500]);
    // The camera's own copy (with the place and the time in it) is gone; the written copy is what is held.
    expect(mockPhoto.uri in mockFiles).toBe(false);
    expect(file?.uri && file.uri in mockFiles).toBe(true);
  });

  it('keeps the long side when the photo was taken upright (the height is brought down, not the width)', async () => {
    mockPhoto = { ...mockPhoto, width: 3000, height: 4000 };
    mockSizeOf[mockPhoto.uri] = { width: 3000, height: 4000 };

    await pick().pickIdPhoto('id-back');

    expect(mockEncoded[0].resize).toEqual({ height: 2000 });
    expect([mockEncoded[0].width, mockEncoded[0].height]).toEqual([1500, 2000]);
  });

  it('is not enlarged or resized again when it is already small enough', async () => {
    mockPhoto = { ...mockPhoto, width: 1600, height: 1200 };
    mockSizeOf[mockPhoto.uri] = { width: 1600, height: 1200 };

    await pick().pickIdPhoto('id-front');

    expect(mockEncoded).toHaveLength(1);
    expect(mockEncoded[0].resize).toBeNull();
    expect(mockEncoded[0].format).toBe('jpeg');
  });

  it('from the photo library (the camera not allowed) is a JPEG too, even when it was a PNG', async () => {
    mockCameraAllowed = false;
    mockPhoto = { uri: 'file:///cache/ImagePicker/screenshot.png', mimeType: 'image/png', width: 2400, height: 1080 };
    mockFiles[mockPhoto.uri] = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1]);
    mockSizeOf[mockPhoto.uri] = { width: 2400, height: 1080 };

    const file = await pick().pickIdPhoto('id-front');

    expect(mockEncoded[0].format).toBe('jpeg');
    expect(mockEncoded[0].resize).toEqual({ width: 2000 });
    expect(file?.contentType).toBe('image/jpeg');
    expect(file?.name).toBe('id-front.jpg');
  });

  it('says whether the app\'s copy is still on the phone, and the answer follows the phone\'s files', async () => {
    const file = await pick().pickIdPhoto('id-front');

    expect(file?.stillThere?.()).toBe(true);
    delete mockFiles[file?.uri as string];
    expect(file?.stillThere?.()).toBe(false);
  });

  it('is deleted by discard, once, and then the check says it is gone', async () => {
    const file = await pick().pickIdPhoto('id-front');

    file?.discard?.();

    expect(file?.stillThere?.()).toBe(false);
  });
});

describe('a bill from the phone\'s files', () => {
  it('a PDF goes as it is: not rewritten, with its copy checked', async () => {
    mockPicked = { uri: 'file:///cache/DocumentPicker/bill.pdf', mimeType: 'application/pdf', name: 'bill.pdf' };
    mockFiles[mockPicked.uri] = Uint8Array.from([0x25, 0x50, 0x44, 0x46]);

    const file = await pick().pickProofFile('proof-of-address');

    expect(mockEncoded).toHaveLength(0);
    expect(file?.contentType).toBe('application/pdf');
    expect(file?.name).toBe('bill.pdf');
    expect(file?.stillThere?.()).toBe(true);
    delete mockFiles[mockPicked.uri];
    expect(file?.stillThere?.()).toBe(false);
  });

  it('a photo of a bill is brought down to 2000 pixels and keeps its kind (a PNG stays a PNG)', async () => {
    mockPicked = { uri: 'file:///cache/DocumentPicker/scan.png', mimeType: 'image/png', name: 'scan.png' };
    mockFiles[mockPicked.uri] = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1]);
    mockSizeOf[mockPicked.uri] = { width: 3000, height: 4000 };

    const file = await pick().pickProofFile('proof-of-address');

    expect(mockEncoded[0].resize).toEqual({ height: 2000 });
    expect(mockEncoded[0].format).toBe('png');
    expect(file?.contentType).toBe('image/png');
    expect(file?.name).toBe('proof-of-address.png');
  });
});

describe('fitTo', () => {
  it('names the long side, never enlarges, and ignores a size it cannot read', () => {
    const { fitTo } = require('@/features/profile-edit/readPicked') as typeof import('@/features/profile-edit/readPicked');
    expect(fitTo(4000, 3000, 2000)).toEqual({ width: 2000 });
    expect(fitTo(3000, 4000, 2000)).toEqual({ height: 2000 });
    expect(fitTo(3000, 3000, 2000)).toEqual({ width: 2000 });
    expect(fitTo(2000, 1000, 2000)).toBeNull();
    expect(fitTo(800, 600, 2000)).toBeNull();
    expect(fitTo(4000, 3000, 0)).toBeNull();
  });
});
