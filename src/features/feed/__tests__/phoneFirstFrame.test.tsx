/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

import { VideoSurface } from '../player';

/*
 * PREVIEWS-APP: on the phone the player tells the post when its first picture is on screen (expo-video's own `onFirstFrameRender`, which
 * Android and iOS both send even for a paused player), so the kind's mark the post draws behind it can go. Android's handler is the real one.
 */
jest.mock('expo-video', () => {
  const { View } = require('react-native');
  const player = {
    play: jest.fn(),
    pause: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    currentTime: 0,
    duration: 0,
    loop: false,
    timeUpdateEventInterval: 0,
    staysActiveInBackground: false,
    showNowPlayingNotification: false,
  };
  return {
    useVideoPlayer: () => player,
    VideoView: (props: Record<string, unknown>) => <View {...props} />,
  };
});
jest.mock('expo-audio', () => ({ useAudioPlayer: () => ({}) }));

const noop = () => undefined;

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('the phone player (Android)', () => {
  it('tells the post once the first frame has rendered, for a player that is paused', async () => {
    const onFirstFrame = jest.fn();
    await rtl.render(<VideoSurface uri="https://cdn.test/previews/clip.mp4" playing={false} seek={null} frosted={false} onTime={noop} onEnded={noop} onFirstFrame={onFirstFrame} testID="v" />);
    expect(onFirstFrame).not.toHaveBeenCalled();
    await rtl.act(async () => {
      rtl.screen.getByTestId('v').props.onFirstFrameRender();
    });
    expect(onFirstFrame).toHaveBeenCalledTimes(1);
  });

  it('a surface that was given no listener still plays and pauses as before', async () => {
    await rtl.render(<VideoSurface uri="https://cdn.test/previews/clip.mp4" playing seek={null} frosted={false} onTime={noop} onEnded={noop} testID="v" />);
    expect(rtl.screen.getByTestId('v').props.onFirstFrameRender).toBeUndefined();
  });
});
