import { act, render, screen } from '@testing-library/react-native';
import { PixelRatio, Platform } from 'react-native';

import { Avatar } from '../Avatar';
import { MediaCard } from '../MediaCard';

/*
 * APP-THUMBS: an avatar and a card draw the Hub's small copy for the size drawn, times the screen's pixel ratio; with no copy they draw the
 * full picture as always; a copy that fails to load gives way to the full picture once. Run as a phone (android) and as the web build.
 */
const FULL = 'https://files.test/avatars/u/a.jpg?sig=1';
const COPIES = { w96: 'https://files.test/avatars/u/a.t96.webp?sig=1', w640: 'https://files.test/avatars/u/a.t640.webp?sig=1' };
const sourceOf = (testID: string) => (screen.getByTestId(testID).props as { source: { uri: string }[] }).source[0].uri;

afterEach(() => jest.restoreAllMocks());

describe.each(['android', 'web'] as const)('on %s', (os) => {
  const original = Platform.OS;
  beforeAll(() => {
    Platform.OS = os;
  });
  afterAll(() => {
    Platform.OS = original;
  });

  it('an avatar drawn at 44 takes w96 on a 2x screen (88 px) and w640 on a 3x screen (132 px)', async () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(2);
    await render(<Avatar testID="av" name="Amaka" size={44} source={FULL} thumbs={COPIES} />);
    expect(sourceOf('av-image')).toBe(COPIES.w96);
    await screen.unmount();
    jest.spyOn(PixelRatio, 'get').mockReturnValue(3);
    await render(<Avatar testID="av" name="Amaka" size={44} source={FULL} thumbs={COPIES} />);
    expect(sourceOf('av-image')).toBe(COPIES.w640);
  });

  it('an avatar with no copy, or a null one, draws the full photo', async () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(2);
    await render(<Avatar testID="av" name="Amaka" size={44} source={FULL} />);
    expect(sourceOf('av-image')).toBe(FULL);
    await screen.unmount();
    await render(<Avatar testID="av" name="Amaka" size={44} source={FULL} thumbs={null} />);
    expect(sourceOf('av-image')).toBe(FULL);
  });

  it('an avatar whose copy fails to load draws the full photo, once, and a failing full photo does not loop', async () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(2);
    await render(<Avatar testID="av" name="Amaka" size={44} source={FULL} thumbs={COPIES} />);
    expect(sourceOf('av-image')).toBe(COPIES.w96);
    await act(async () => {
      (screen.getByTestId('av-image').props as { onError: (e: unknown) => void }).onError({ nativeEvent: { error: 'x' } });
    });
    expect(sourceOf('av-image')).toBe(FULL);
    await act(async () => {
      (screen.getByTestId('av-image').props as { onError: (e: unknown) => void }).onError({ nativeEvent: { error: 'x' } });
    });
    expect(sourceOf('av-image')).toBe(FULL);
  });

  it('a stacked card draws the 640 copy of its picture, and the full picture when it has none', async () => {
    jest.spyOn(PixelRatio, 'get').mockReturnValue(2);
    await render(<MediaCard layout="stacked" testID="card" title="Amaka" imageUrl={FULL} imageThumbs={COPIES} />);
    expect(sourceOf('card-image')).toBe(COPIES.w640);
    await screen.unmount();
    await render(<MediaCard layout="stacked" testID="card" title="Amaka" imageUrl={FULL} imageThumbs={undefined} />);
    expect(sourceOf('card-image')).toBe(FULL);
  });
});
