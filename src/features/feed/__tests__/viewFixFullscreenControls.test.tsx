/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';

/*
 * VIEW-FIX round 2 (R-117, lead ruling 31 Oct): the piece players draw their own controls (`nativeControls` is false), and expo-video on the
 * iPhone keeps `showsPlaybackControls` false in full screen, so a person there could have no Done and no controls. A person must always be
 * able to leave full screen and control the video: the phone's own controls go ON for the full-screen view (before the view is asked to open,
 * and again when the view says it entered) and back OFF when it closes. Proven on both platforms with the player's real handlers.
 */
const mockV = { enter: jest.fn((controls: unknown) => Promise.resolve(controls)), controlsAtEnter: [] as unknown[] };

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  class VideoView extends React.Component<Record<string, unknown>> {
    enterFullscreen = () => {
      mockV.controlsAtEnter.push(this.props.nativeControls);
      return mockV.enter(this.props.nativeControls);
    };
    render() {
      return <View {...(this.props as object)} />;
    }
  }
  const player = { play: jest.fn(), pause: jest.fn(), currentTime: 0, duration: 0, status: 'idle', addListener: () => ({ remove: () => undefined }) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return { VideoView, useVideoPlayer: (_s: unknown, setup?: (p: unknown) => void) => React.useMemo(() => (setup?.(player), player), []) };
});
jest.mock('expo-audio', () => ({ useAudioPlayer: () => ({}), setAudioModeAsync: async () => undefined }));

const { VideoSurface } = require('../player') as typeof import('../player');
const noop = () => undefined;
const surface = (fullscreenAt?: number) => <VideoSurface uri="https://files.example/a.mp4" playing seek={null} frosted={false} fullscreenAt={fullscreenAt} onTime={noop} onEnded={noop} testID="v" />;
const controls = () => rtl.screen.getByTestId('v').props.nativeControls;
const fire = (name: 'onFullscreenEnter' | 'onFullscreenExit') => rtl.act(async () => void rtl.screen.getByTestId('v').props[name]());
const settle = () => rtl.act(async () => void (await Promise.resolve()));

describe.each(['android', 'ios'] as const)('R-117 · the phone controls on the full-screen view (%s)', (os) => {
  let replaced: jest.ReplaceProperty<typeof Platform.OS>;
  beforeEach(() => {
    replaced = jest.replaceProperty(Platform, 'OS', os);
    mockV.enter.mockClear();
    mockV.enter.mockImplementation((c: unknown) => Promise.resolve(c));
    mockV.controlsAtEnter = [];
  });
  afterEach(() => replaced.restore());

  it('inline the page keeps the controls off; a press turns them on BEFORE the view is asked to open, and the view closing turns them off', async () => {
    const view = await rtl.render(surface());
    expect(controls()).toBe(false);
    await view.rerender(surface(1));
    await settle();
    expect(mockV.enter).toHaveBeenCalledTimes(1);
    // The controls were already on in the props the view held when it was asked to go full screen.
    expect(mockV.controlsAtEnter).toEqual([true]);
    expect(controls()).toBe(true);
    await fire('onFullscreenEnter');
    expect(controls()).toBe(true);
    await fire('onFullscreenExit');
    expect(controls()).toBe(false);
  });

  it('every press does it again: a second full screen has its controls too, and the same number twice opens once', async () => {
    const view = await rtl.render(surface());
    await view.rerender(surface(1));
    await fire('onFullscreenEnter');
    await fire('onFullscreenExit');
    expect(controls()).toBe(false);
    await view.rerender(surface(1));
    expect(mockV.enter).toHaveBeenCalledTimes(1);
    await view.rerender(surface(2));
    await settle();
    expect(mockV.enter).toHaveBeenCalledTimes(2);
    expect(mockV.controlsAtEnter).toEqual([true, true]);
    expect(controls()).toBe(true);
    await fire('onFullscreenExit');
    expect(controls()).toBe(false);
  });

  it('a full screen the phone opens itself still gets the controls, and closing it takes them off', async () => {
    await rtl.render(surface());
    await fire('onFullscreenEnter');
    expect(controls()).toBe(true);
    await fire('onFullscreenExit');
    expect(controls()).toBe(false);
  });

  it('a view that refuses to open leaves no controls on the page', async () => {
    mockV.enter.mockImplementationOnce(() => Promise.reject(new Error('no activity')));
    const view = await rtl.render(surface());
    await view.rerender(surface(1));
    await settle();
    expect(mockV.enter).toHaveBeenCalledTimes(1);
    expect(controls()).toBe(false);
  });

  it('a view that throws as it is asked leaves no controls on the page either', async () => {
    mockV.enter.mockImplementationOnce(() => {
      throw new Error('view gone');
    });
    const view = await rtl.render(surface());
    await view.rerender(surface(1));
    await settle();
    expect(controls()).toBe(false);
  });
});
