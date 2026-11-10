import { act, render, screen } from '@testing-library/react-native';
import { Dimensions, Platform, Text, useWindowDimensions, View } from 'react-native';

import { FrameModal } from '@/lib/FrameModal';
import { FRAME_FROM, FRAME_WIDTH, frameWidthFor, isFramed, useFrameWidth } from '@/lib/useFrameWidth';
import { WebFrame } from '@/lib/WebFrame';

/** R-127, Phase 1 (WEBAPP-02): the web frame, drawn only in a browser window wider than a phone. */
let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
afterEach(() => {
  jest.restoreAllMocks();
  os?.restore();
  os = undefined;
});
const platform = (name: 'web' | 'android' | 'ios') => {
  os = jest.replaceProperty(Platform, 'OS', name);
};

function Width() {
  return <Text testID="w">{useFrameWidth()}</Text>;
}
function Window() {
  return <Text testID="win">{useWindowDimensions().width}</Text>;
}
const setWindow = (width: number) => {
  jest.spyOn(Dimensions, 'get').mockImplementation((k) => (k === 'window' || k === 'screen' ? { width, height: 900, scale: 1, fontScale: 1 } : ({} as never)));
};

describe('frameWidthFor', () => {
  it('is the column on a wide browser window, and the window everywhere else', async () => {
    expect(frameWidthFor(1440, 'web')).toBe(FRAME_WIDTH);
    expect(frameWidthFor(FRAME_FROM + 1, 'web')).toBe(FRAME_WIDTH);
    expect(frameWidthFor(430, 'web')).toBe(430);
    expect(frameWidthFor(390, 'web')).toBe(390);
    expect(frameWidthFor(1440, 'android')).toBe(1440);
    expect(frameWidthFor(1440, 'ios')).toBe(1440);
    expect(isFramed(1440, 'android')).toBe(false);
  });
  it('is a phone width, 390', async () => {
    expect(FRAME_WIDTH).toBe(390);
  });
});

describe('WebFrame', () => {
  it('on a wide browser window draws every child inside one phone-width column', async () => {
    platform('web');
    setWindow(1440);
    await render(
      <WebFrame>
        <View testID="child" />
      </WebFrame>,
    );
    expect(screen.getByTestId('web-frame-column')).toBeTruthy();
    expect(screen.getByTestId('web-frame-column')).toHaveStyle({ maxWidth: 390 });
    expect(screen.getByTestId('child')).toBeTruthy();
  });
  it('on a phone (Platform android) draws the children with no wrapper at all', async () => {
    platform('android');
    setWindow(1440);
    await render(
      <WebFrame>
        <View testID="child" />
      </WebFrame>,
    );
    expect(screen.queryByTestId('web-frame')).toBeNull();
    expect(screen.getByTestId('child')).toBeTruthy();
  });
  it('on a phone browser (390 or 430 wide) draws no wrapper, so nothing changes', async () => {
    platform('web');
    for (const w of [390, 430]) {
      setWindow(w);
      const { unmount } = await render(
        <WebFrame>
          <View testID="child" />
        </WebFrame>,
      );
      expect(screen.queryByTestId('web-frame')).toBeNull();
      await unmount();
    }
  });
});

describe('useFrameWidth', () => {
  it('sizes to the column on a laptop and follows a resize without a reload', async () => {
    platform('web');
    const resize = (width: number) => act(async () => Dimensions.set({ window: { width, height: 900, scale: 1, fontScale: 1 }, screen: { width, height: 900, scale: 1, fontScale: 1 } }));
    await resize(1440);
    await render(<Width />);
    expect(screen.getByTestId('w').props.children).toBe(390);
    await resize(500);
    expect(screen.getByTestId('w').props.children).toBe(500);
    await resize(1920);
    expect(screen.getByTestId('w').props.children).toBe(390);
  });
  it('is the window width on a phone', async () => {
    platform('android');
    setWindow(1440);
    await render(
      <>
        <Width />
        <Window />
      </>,
    );
    expect(screen.getByTestId('w').props.children).toBe(screen.getByTestId('win').props.children);
  });
});

describe('FrameModal', () => {
  it('on a phone is the plain Modal around its children', async () => {
    platform('android');
    setWindow(1440);
    await render(
      <FrameModal visible transparent>
        <View testID="inside" />
      </FrameModal>,
    );
    expect(screen.getByTestId('inside')).toBeTruthy();
    expect(screen.queryByTestId('web-frame-modal')).toBeNull();
  });
  it('on a wide browser window keeps its children in the column', async () => {
    platform('web');
    setWindow(1440);
    await render(
      <FrameModal visible>
        <View testID="inside" />
      </FrameModal>,
    );
    expect(screen.getByTestId('web-frame-modal-column')).toBeTruthy();
    expect(screen.getByTestId('inside')).toBeTruthy();
  });
});
