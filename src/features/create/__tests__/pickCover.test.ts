/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

/*
 * COVERS-APP round 1: a picked cover is written smaller before it goes up (the phone's `readPicked`, with the image manipulator), so a 12 megapixel
 * photo fits the Hub's 5 MB. The picker and the manipulator are scripted (jest has no phone); the options handed to `readPicked` are the real ones.
 */
const mockRead = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'content://media/external/images/media/9', type: 'image', mimeType: 'image/jpeg', fileName: 'IMG_0001.jpg', width: 4000, height: 3000 }] })),
}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('@/features/profile-edit/readPicked', () => ({ readPicked: (...args: unknown[]) => mockRead(...args) }));

const { pickCover, COVER_READ, COVER_TYPES } = require('../coverPick') as typeof import('../coverPick');

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  mockRead.mockReset();
  mockRead.mockResolvedValue({ blob: new Blob([new Uint8Array(900_000)]), contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cache/ImageManipulator/a.jpg', discard: jest.fn() });
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('a picked cover (Android)', () => {
  it('a user picking a 12 MP camera photo has it written again within 2048 px as a JPEG at about 0.85 before it is sent', async () => {
    const picked = await pickCover();
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead.mock.calls[0][1]).toEqual({ maxSide: 2048, jpeg: true, quality: 0.85 });
    expect(COVER_READ).toEqual({ maxSide: 2048, jpeg: true, quality: 0.85 });
    expect(COVER_TYPES).toEqual(['image/png', 'image/jpeg', 'image/webp']);
    expect(picked).toMatchObject({ contentType: 'image/jpeg', extension: 'jpg', name: 'IMG_0001.jpg' });
    expect(picked?.blob.size).toBeLessThan(5 * 1024 * 1024);
  });
});
