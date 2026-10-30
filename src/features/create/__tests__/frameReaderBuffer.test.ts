/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

/*
 * PREVIEWS-APP (data cost): the player the frame reader opens (`frames.ts`) never plays, so it reads about two seconds ahead, not the
 * stock 50 s expo-video's Android player fills even when paused. The reader is scripted (jest has no phone); the player it is given
 * is the real object the code writes to.
 */
const mockMade: Record<string, unknown>[] = [];
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(),
  createVideoPlayer: jest.fn(() => {
    const player = {
      status: 'readyToPlay',
      duration: 8,
      release: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      generateThumbnailsAsync: jest.fn(async () => [{ width: 480, height: 270 }]),
    };
    mockMade.push(player);
    return player;
  }),
}));

const { frameFor } = require('../frames') as typeof import('../frames');
const { FRAME_BUFFER } = require('@/features/feed/player/buffer') as typeof import('@/features/feed/player/buffer');

beforeEach(() => {
  mockMade.length = 0;
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('the frame reader (Android)', () => {
  it('a user adding a video preview opens it with the two-second read, not the default 50, and the frame still arrives', async () => {
    const frame = await frameFor({ contentType: 'video/mp4', previewUri: 'content://media/external/video/media/42' });
    expect(frame).toEqual({ width: 480, height: 270 });
    expect(mockMade).toHaveLength(1);
    const options = (mockMade[0] as { bufferOptions: { preferredForwardBufferDuration: number } }).bufferOptions;
    expect(options).toBe(FRAME_BUFFER);
    expect(options.preferredForwardBufferDuration).toBeLessThanOrEqual(3);
  });
});
