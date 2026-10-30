/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * MIC-PERMS: on an Android phone the Voice Intro recording screen ASKS for the microphone first, and says "We can't use your
 * microphone" only after the phone really refused. (The owner's Android build never asked: the manifest had RECORD_AUDIO removed, so the
 * phone refused without a dialog; the screen was right and the build was wrong. `native-permissions.test.ts` is the gate for the build.)
 *
 * Platform.OS is android; the real VoiceTakeScreen and the real recorder hook run; only `expo-audio` is a stand-in that records the
 * order of the calls and answers the permission the test sets.
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockPermission = jest.fn();
const mockPrepare = jest.fn(async () => undefined);
const mockRecord = jest.fn();
const mockStop = jest.fn(async () => undefined);
const mockRecorder = { currentTime: 0, uri: null as string | null, prepareToRecordAsync: mockPrepare, record: mockRecord, stop: mockStop };

jest.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: () => mockPermission(),
  setAudioModeAsync: jest.fn(async () => undefined),
  useAudioRecorder: () => mockRecorder,
  useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0, canRecord: false, mediaServicesDidReset: false, url: null }),
}));

const { Linking } = require('react-native') as typeof import('react-native');
const { VoiceTakeScreen } = require('../VoiceTakeScreen') as typeof import('../VoiceTakeScreen');

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const answer = (granted: boolean, canAskAgain: boolean, status: string) => async () => ({ granted, canAskAgain, status, expires: 'never' });

async function open() {
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <VoiceTakeScreen script="I shoot brand films." bounds={{ min: 15, max: 30 }} next={{ free: true, costPoints: 0 }} onBack={jest.fn()} onUse={jest.fn()} />
    </SafeAreaProvider>,
  );
}

let platform: jest.ReplaceProperty<typeof Platform.OS>;
beforeEach(() => {
  platform = jest.replaceProperty(Platform, 'OS', 'android');
  mockPermission.mockReset();
  mockPrepare.mockClear();
  mockRecord.mockClear();
  mockStop.mockClear();
});
afterEach(() => platform.restore());

describe('Voice Intro on Android · the microphone is asked for first', () => {
  it('runs as an Android phone', () => {
    expect(Platform.OS).toBe('android');
  });

  it('before the person taps record, nothing has asked and nothing says the microphone is off', async () => {
    await open();
    expect(screen.getByTestId('voice-take-record')).toBeTruthy();
    expect(screen.queryByTestId('voice-take-mic-off')).toBeNull();
    expect(screen.queryByText("We can't use your microphone")).toBeNull();
    expect(mockPermission).not.toHaveBeenCalled();
  });

  it('the first tap on record asks the phone for the microphone, then prepares and records, and shows no refusal', async () => {
    mockPermission.mockImplementation(answer(true, true, 'granted'));
    await open();
    await fireEvent.press(screen.getByTestId('voice-take-record'));
    await act(async () => undefined);
    expect(mockPermission).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockPermission.mock.invocationCallOrder[0]).toBeLessThan(mockPrepare.mock.invocationCallOrder[0]);
    expect(mockPrepare.mock.invocationCallOrder[0]).toBeLessThan(mockRecord.mock.invocationCallOrder[0]);
    expect(screen.queryByTestId('voice-take-mic-off')).toBeNull();
  });

  it('a real refusal (the phone said no and can be asked again) shows "We can\'t use your microphone" and Allow microphone, and never records', async () => {
    mockPermission.mockImplementation(answer(false, true, 'undetermined'));
    await open();
    await fireEvent.press(screen.getByTestId('voice-take-record'));
    expect(await screen.findByTestId('voice-take-mic-off')).toBeTruthy();
    expect(screen.getByText("We can't use your microphone")).toBeTruthy();
    expect(mockRecord).not.toHaveBeenCalled();

    // Allow microphone asks the phone again (a second request), and a yes starts the recording.
    mockPermission.mockImplementation(answer(true, true, 'granted'));
    await fireEvent.press(screen.getByTestId('voice-take-allow'));
    await act(async () => undefined);
    expect(mockPermission).toHaveBeenCalledTimes(2);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('voice-take-mic-off')).toBeNull();
  });

  it('a refusal the phone will not ask again sends the person to the phone\'s settings', async () => {
    mockPermission.mockImplementation(answer(false, false, 'denied'));
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await open();
    await fireEvent.press(screen.getByTestId('voice-take-record'));
    await fireEvent.press(await screen.findByTestId('voice-take-settings'));
    expect(settings).toHaveBeenCalledTimes(1);
    expect(mockRecord).not.toHaveBeenCalled();
    settings.mockRestore();
  });
});
