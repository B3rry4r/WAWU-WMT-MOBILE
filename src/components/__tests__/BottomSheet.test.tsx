import * as rtl from '@testing-library/react-native';
import { Dimensions, Platform, StyleSheet, Text as NativeText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReportSheet } from '@/features/report/ReportSheet';
import { REPORT_REASONS } from '@/features/report/reasons';

import { BottomSheet, sheetMetrics } from '../BottomSheet';

/**
 * REPORT-UGC round 1 (HIGH 1): no sheet is taller than the screen. On Platform.OS android, at the two sizes the verifier used
 * (390 x 844 and 360 x 640). jest draws no layout, so the content's height is told to the sheet the way a phone does, with
 * its `onLayout` event; what the sheet then does with it (the cap, the scroll) is what is proven here.
 */

const insets = { top: 24, left: 0, right: 0, bottom: 16 };
const draw = (ui: React.ReactElement, width = 390, height = 844) => {
  Dimensions.set({ window: { width, height, scale: 2, fontScale: 1 }, screen: { width, height, scale: 2, fontScale: 1 } });
  return rtl.render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height }, insets }}>{ui}</SafeAreaProvider>);
};
const layout = (height: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height } } });
const capAt = (height: number) => height - insets.top - insets.bottom - sheetMetrics.topGap;

describe('BottomSheet: capped at the screen, the body scrolls inside the cap (Android)', () => {
  beforeEach(() => jest.replaceProperty(Platform, 'OS', 'android'));
  afterEach(() => jest.restoreAllMocks());

  it('a sheet that fits is drawn as it always was: the cap is set, nothing scrolls, the grabber and the rows are there', async () => {
    await draw(
      <BottomSheet visible onClose={jest.fn()} label="Short" testID="short">
        <NativeText>one row</NativeText>
      </BottomSheet>,
    );
    await rtl.fireEvent(rtl.screen.getByTestId('short-sheet-content'), 'layout', layout(120));
    expect(rtl.screen.queryByTestId('short-sheet-scroll')).toBeNull();
    expect(rtl.screen.getByTestId('short-close')).toBeTruthy();
    expect(rtl.screen.getByTestId('short-backdrop', { includeHiddenElements: true })).toBeTruthy();
    expect(StyleSheet.flatten(rtl.screen.getByTestId('short').props.style).maxHeight).toBe(capAt(844));
  });

  it.each([
    [390, 844],
    [360, 640],
  ])('a sheet taller than %i x %i keeps its grabber and backdrop and scrolls inside the cap', async (width, height) => {
    await draw(
      <BottomSheet visible onClose={jest.fn()} label="Tall" testID="tall">
        <NativeText>title</NativeText>
        <NativeText>the last row</NativeText>
      </BottomSheet>,
      width,
      height,
    );
    await rtl.fireEvent(rtl.screen.getByTestId('tall-sheet-content'), 'layout', layout(2000));
    const scroll = await rtl.screen.findByTestId('tall-sheet-scroll');
    // The rows are inside the scroller, the grabber is outside it (it stays put), and the panel stops short of the top.
    expect(rtl.within(scroll).getByText('the last row')).toBeTruthy();
    expect(rtl.within(scroll).queryByTestId('tall-close')).toBeNull();
    expect(rtl.screen.getByTestId('tall-close')).toBeTruthy();
    expect(rtl.screen.getByTestId('tall-backdrop', { includeHiddenElements: true })).toBeTruthy();
    const cap = StyleSheet.flatten(rtl.screen.getByTestId('tall').props.style).maxHeight as number;
    expect(cap).toBe(capAt(height));
    expect(cap + insets.top + insets.bottom).toBeLessThan(height);
  });

  it('the Android back button closes a scrolling sheet, and a tap on the backdrop does too', async () => {
    const onClose = jest.fn();
    await draw(
      <BottomSheet visible onClose={onClose} label="Tall" testID="tall">
        <NativeText>row</NativeText>
      </BottomSheet>,
      360,
      640,
    );
    await rtl.fireEvent(rtl.screen.getByTestId('tall-sheet-content'), 'layout', layout(2000));
    await rtl.screen.findByTestId('tall-sheet-scroll');
    await rtl.fireEvent(rtl.screen.getByTestId('tall'), 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(1);
    await rtl.fireEvent.press(rtl.screen.getByTestId('tall-backdrop', { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('a sheet that is too tall once stays a scroller while it is open, so what a person typed is not lost; closing it forgets', async () => {
    const view = await draw(
      <BottomSheet visible onClose={jest.fn()} label="Tall" testID="tall">
        <NativeText>row</NativeText>
      </BottomSheet>,
      360,
      640,
    );
    await rtl.fireEvent(rtl.screen.getByTestId('tall-sheet-content'), 'layout', layout(2000));
    await rtl.screen.findByTestId('tall-sheet-scroll');
    await view.rerender(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 640 }, insets }}>
        <BottomSheet visible={false} onClose={jest.fn()} label="Tall" testID="tall">
          <NativeText>row</NativeText>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    await view.rerender(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 640 }, insets }}>
        <BottomSheet visible onClose={jest.fn()} label="Tall" testID="tall">
          <NativeText>row</NativeText>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    expect(await rtl.screen.findByTestId('tall-sheet-content')).toBeTruthy();
    expect(rtl.screen.queryByTestId('tall-sheet-scroll')).toBeNull();
  });
});

describe('the report sheet at 360 x 640 and 390 x 844 (Android)', () => {
  beforeEach(() => jest.replaceProperty(Platform, 'OS', 'android'));
  afterEach(() => jest.restoreAllMocks());

  it.each([
    [390, 844],
    [360, 640],
  ])('at %i x %i the whole title, all seven reasons, the note and both buttons are inside a scroller under the cap, and a reason can be picked there', async (width, height) => {
    await draw(<ReportSheet visible kind="piece" targetId="p1" onClose={jest.fn()} onReported={jest.fn()} />, width, height);
    // The report sheet is taller than the screen on a small phone and about as tall on a big one: told by its layout.
    await rtl.fireEvent(await rtl.screen.findByTestId('report-sheet-sheet-content'), 'layout', layout(900));
    const scroll = await rtl.screen.findByTestId('report-sheet-sheet-scroll');
    const inside = rtl.within(scroll);
    expect(inside.getByText('Report this piece')).toBeTruthy();
    for (const r of REPORT_REASONS) expect(inside.getByTestId(`report-sheet-reason-${r.reason}`)).toBeTruthy();
    expect(inside.getByTestId('report-sheet-note')).toBeTruthy();
    expect(inside.getByTestId('report-sheet-send')).toBeTruthy();
    expect(inside.getByTestId('report-sheet-cancel')).toBeTruthy();
    // The grabber and the backdrop are the shared sheet's own, outside the scroller.
    expect(rtl.screen.getByTestId('report-sheet-close')).toBeTruthy();
    expect(rtl.screen.getByTestId('report-sheet-backdrop', { includeHiddenElements: true })).toBeTruthy();
    await rtl.fireEvent.press(inside.getByTestId('report-sheet-reason-hate'));
    expect(rtl.screen.getByTestId('report-sheet-reason-hate').props.accessibilityLabel).toBe('Hate or threats, selected');
  });
});
