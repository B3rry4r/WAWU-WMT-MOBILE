/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { Platform, Text as NativeText, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LongPressable } from '../LongPressable';
import { ReportSheet } from '../ReportSheet';
import { REPORT_REASONS } from '../reasons';
import { useReporting } from '../useReporting';

jest.mock('../api', () => ({ sendReport: jest.fn() }));
const { sendReport } = require('../api') as { sendReport: jest.Mock };

const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const draw = (ui: React.ReactElement) => rtl.render(<SafeAreaProvider initialMetrics={frame}>{ui}</SafeAreaProvider>);

/** A screen that reports a thing and then takes it out of view, as every screen does. */
function Screen({ onHide }: { onHide: (kind: string, id: string) => void }) {
  const reporting = useReporting(onHide);
  return (
    <View>
      <LongPressable onLongPress={() => reporting.ask('community_message', 'msg-1')}>
        <NativeText testID="the-message">rude words</NativeText>
      </LongPressable>
      <LongPressable>
        <NativeText testID="my-message">my own words</NativeText>
      </LongPressable>
      {reporting.element}
    </View>
  );
}

describe('REPORT-UGC: the shared report sheet, on Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
    sendReport.mockReset();
  });
  afterEach(() => jest.restoreAllMocks());

  it('draws the Hub\'s seven reasons and sends nothing until one is chosen', async () => {
    await draw(<ReportSheet visible kind="comment" targetId="c1" onClose={jest.fn()} onReported={jest.fn()} />);
    expect(await rtl.screen.findByText('Report this comment')).toBeTruthy();
    for (const r of REPORT_REASONS) expect(rtl.screen.getByTestId(`report-sheet-reason-${r.reason}`)).toBeTruthy();
    expect(REPORT_REASONS.map((r) => r.reason)).toEqual(['spam', 'harassment', 'hate', 'sexual', 'illegal', 'impersonation', 'other']);
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    expect(sendReport).not.toHaveBeenCalled();
  });

  it('sends kind, id, reason and the note once, then hands the item back to the screen', async () => {
    sendReport.mockResolvedValue({ id: 'r1', alreadyReported: false });
    const onReported = jest.fn();
    await draw(<ReportSheet visible kind="profile" targetId="person-1" onClose={jest.fn()} onReported={onReported} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('report-sheet-reason-impersonation'));
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('report-sheet-note'), '  fake account  ');
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    await rtl.waitFor(() => expect(onReported).toHaveBeenCalledWith('profile', 'person-1'));
    expect(sendReport).toHaveBeenCalledTimes(1);
    expect(sendReport).toHaveBeenCalledWith({ kind: 'profile', targetId: 'person-1', reason: 'impersonation', note: '  fake account  ' });
  });

  it('keeps the sheet open with the reason when the Hub cannot take it', async () => {
    sendReport.mockRejectedValue(new Error('down'));
    const onReported = jest.fn();
    await draw(<ReportSheet visible kind="piece" targetId="p1" onClose={jest.fn()} onReported={onReported} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('report-sheet-reason-spam'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    expect(await rtl.screen.findByText('Could not send the report. Try again.')).toBeTruthy();
    expect(onReported).not.toHaveBeenCalled();
  });

  it('the Android back button closes it without sending', async () => {
    const onClose = jest.fn();
    await draw(<ReportSheet visible kind="chat_message" targetId="m1" onClose={onClose} onReported={jest.fn()} />);
    await rtl.screen.findByText('Report this message');
    // The Modal's own requestClose is what the Android back button fires; the event climbs from the sheet to the Modal.
    await rtl.fireEvent(await rtl.screen.findByTestId('report-sheet'), 'requestClose');
    expect(onClose).toHaveBeenCalled();
    expect(sendReport).not.toHaveBeenCalled();
  });

  it('press and hold on another person\'s message opens the sheet; after sending it says thanks and the screen hides the item; the person\'s own message cannot be held', async () => {
    sendReport.mockResolvedValue({ id: 'r1', alreadyReported: false });
    const onHide = jest.fn();
    await draw(<Screen onHide={onHide} />);
    // The person's own message draws no hold target: no accessibility action, nothing to hold.
    expect(rtl.screen.getByTestId('my-message').parent?.props.accessibilityActions).toBeUndefined();
    await rtl.fireEvent(rtl.screen.getByTestId('the-message'), 'longPress');
    expect(await rtl.screen.findByText('Report this message')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-reason-hate'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    expect(await rtl.screen.findByText('Thanks. We’ll review this.')).toBeTruthy();
    expect(onHide).toHaveBeenCalledWith('community_message', 'msg-1');
    expect(sendReport).toHaveBeenCalledWith(expect.objectContaining({ kind: 'community_message', targetId: 'msg-1', reason: 'hate' }));
  });
});
