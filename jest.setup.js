/* global jest */
/*
 * Stand-ins for the native modules SHARED-04 installed for the feed's players, the in-place PDF and
 * H35's Story and Save (SHARED-CHANGES HOME-02 #2 and HOME-09 #2). jest has no phone to run them on, and
 * `expo-audio` throws on import without one, so every suite that reaches a screen using them would fail.
 * A test that needs to drive a player or the sheet mocks the module itself, and wins over these.
 */
const mockSubscription = () => ({ remove: jest.fn() });

jest.mock('expo-video', () => {
  const React = require('react');
  const makePlayer = () => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    addListener: jest.fn(mockSubscription),
    currentTime: 0,
    duration: 0,
    loop: false,
    timeUpdateEventInterval: 0,
    staysActiveInBackground: false,
    showNowPlayingNotification: false,
  });
  return {
    useVideoPlayer: jest.fn(() => React.useMemo(makePlayer, [])),
    VideoView: 'VideoView',
  };
});

jest.mock('expo-audio', () => {
  const React = require('react');
  const makePlayer = () => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    addListener: jest.fn(mockSubscription),
  });
  return { useAudioPlayer: jest.fn(() => React.useMemo(makePlayer, [])) };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  Asset: { create: jest.fn(() => Promise.resolve({})) },
}));

jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));
