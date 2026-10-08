import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { mediaMetrics, MediaCard } from '@/components/MediaCard';
import { Toast, toastMetrics } from '@/components/Toast';
import { CreatorCard } from '@/features/explore/CreatorCard';
import { CreatorRail } from '@/features/home/CreatorRail';
import { radius, space } from '@/theme';
import { darkColors, lightColors } from '@/theme/tokens.generated';

/*
 * SHARED-03: one shared toast (items 1 and 4), MediaCard's placeholder (item 3) and THE creator-card Follow (items 6
 * and 7). FilterChips' padding beside icon chips (item 2) is in hubSharedProps.test.tsx with the chip icon it extends.
 */

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));
beforeEach(() => {
  mockScheme = 'dark';
});
afterEach(() => {
  jest.useRealTimers();
});

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const styleOf = (node: unknown) => flat((node as { props: { style: unknown } }).props.style);
const hiddenOk = { includeHiddenElements: true };
const tick = (verified: boolean) => ({ verified, expiresAt: null });

describe('Toast (one toast for "Profile saved", "Password changed" and "Couldn\'t follow")', () => {
  it('draws M10\'s pill over the top: 48 high, 60 down, 20 in, 16 corner, the tick in the positive colour and 14.5 words at 600', async () => {
    await render(<Toast message="Profile saved" testID="profile-saved" />);
    const root = screen.getByTestId('profile-saved');
    expect(styleOf(root)).toMatchObject({
      position: 'absolute',
      top: 60,
      left: space.xl,
      right: space.xl,
      height: 48,
      borderRadius: radius.input,
      gap: 10,
      paddingHorizontal: space.lg,
      backgroundColor: darkColors.textPrimary,
    });
    expect(styleOf(root).paddingVertical).toBeUndefined();
    expect(root.props.accessibilityRole).toBe('alert');
    expect(root.props.accessibilityLiveRegion).toBe('polite');
    expect(screen.getByTestId('icon-CircleCheck', hiddenOk)).toBeTruthy();
    expect(JSON.stringify(screen.getByTestId('icon-CircleCheck', hiddenOk))).toContain(darkColors.positive);
    const words = screen.getByText('Profile saved');
    expect(styleOf(words)).toMatchObject({ fontSize: 14.5, color: darkColors.surfacePage });
    expect(words.props.numberOfLines).toBeUndefined();
    expect(toastMetrics).toMatchObject({ height: 48, top: 60, bottom: 24, icon: 18, iconStroke: 2.2, between: 10, fontSize: 14.5 });
  });

  it('draws the alert at the bottom with room for a second line, the mark in the danger colour, and takes no press', async () => {
    await render(<Toast message="Couldn’t follow @adaeze. Try again later." tone="alert" placement="bottom" lines={2} testID="follow-notice" />);
    const root = screen.getByTestId('follow-notice');
    expect(styleOf(root)).toMatchObject({ bottom: 24, minHeight: 48, paddingVertical: space.md });
    expect(styleOf(root).top).toBeUndefined();
    expect(styleOf(root).height).toBeUndefined();
    expect(root.props.pointerEvents).toBe('none');
    expect(JSON.stringify(screen.getByTestId('icon-CircleAlert', hiddenOk))).toContain(darkColors.danger);
    const words = screen.getByText('Couldn’t follow @adaeze. Try again later.');
    expect(words.props.numberOfLines).toBe(2);
    expect(styleOf(words)).toMatchObject({ flex: 1 });
  });

  it('takes an offset from its edge (a screen without the tab bar adds its safe area)', async () => {
    await render(<Toast message="x" placement="bottom" offset={58} />);
    expect(styleOf(screen.getByTestId('toast')).bottom).toBe(58);
  });

  it('draws nothing while there is nothing to say', async () => {
    await render(<Toast message={null} />);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('asks to be taken down `duration` after each new line, and not before', async () => {
    jest.useFakeTimers();
    const onHide = jest.fn();
    const view = await render(<Toast message="first" duration={4000} onHide={onHide} />);
    await act(async () => {
      jest.advanceTimersByTime(3999);
    });
    expect(onHide).not.toHaveBeenCalled();
    // A new line starts the clock again.
    await view.rerender(<Toast message="second" duration={4000} onHide={onHide} />);
    await act(async () => {
      jest.advanceTimersByTime(3999);
    });
    expect(onHide).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('keeps no clock without a duration', async () => {
    jest.useFakeTimers();
    const onHide = jest.fn();
    await render(<Toast message="Profile saved" onHide={onHide} />);
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(onHide).not.toHaveBeenCalled();
  });
});

describe('MediaCard placeholder (SHARED-CHANGES HOME-01 #3)', () => {
  const initials = <Avatar name="Amaka Nwosu" hue="coral" size={mediaMetrics.placeholderAvatar} decorative testID="initials" />;

  it('draws the initials on the quiet block when there is no picture, hidden from a screen reader', async () => {
    await render(<MediaCard layout="stacked" title="@amaka" testID="card" placeholder={initials} />);
    expect(screen.getByText('AN', hiddenOk)).toBeTruthy();
    const slot = screen.getByTestId('card-placeholder', hiddenOk);
    expect(slot.props.accessibilityElementsHidden).toBe(true);
    expect(slot.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(styleOf(slot)).toMatchObject({ alignItems: 'center', justifyContent: 'center' });
  });

  it('on a stacked card, centres them in the room above the caption once the caption is laid out', async () => {
    await render(<MediaCard layout="stacked" title="@amaka" testID="card" placeholder={initials} action={{ label: 'Follow', onPress: () => undefined }} />);
    const caption = screen.getByTestId('card-words').parent!;
    await fireEvent(caption, 'layout', { nativeEvent: { layout: { x: 10, y: 107, width: 130, height: 83 } } });
    expect(styleOf(screen.getByTestId('card-placeholder', hiddenOk))).toMatchObject({
      paddingTop: mediaMetrics.captionInset,
      paddingBottom: mediaMetrics.captionInset + 83 + mediaMetrics.footerGap,
    });
  });

  it('is not drawn when the card has a picture', async () => {
    await render(<MediaCard layout="stacked" title="@amaka" testID="card" imageUrl="https://example.test/a.jpg" placeholder={initials} />);
    expect(screen.queryByTestId('card-placeholder', hiddenOk)).toBeNull();
    expect(screen.getByTestId('card-image')).toBeTruthy();
  });

  it('is absent when not given: the bare block, and the caption measures nothing', async () => {
    await render(<MediaCard layout="stacked" title="@amaka" testID="card" />);
    expect(screen.queryByTestId('card-placeholder', hiddenOk)).toBeNull();
    expect(screen.getByText('@amaka').parent!.props.onLayout).toBeUndefined();
  });

  it('a creator with no photo shows their initials on Home\'s rail and on Explore\'s card', async () => {
    const person = {
      wawuId: 'c1',
      name: 'Amaka Nwosu',
      handle: 'amaka',
      avatarUrl: null,
      field: 'Photographer',
      pieceCount: 2,
      verification: { creator: tick(true), professional: tick(false) },
      following: false,
    };
    const rail = await render(<CreatorRail creators={[person]} onRetry={() => undefined} retrying={false} />);
    expect(screen.getByTestId('today-creator-c1-placeholder', hiddenOk)).toBeTruthy();
    expect(screen.getByText('AN', hiddenOk)).toBeTruthy();
    await rail.unmount();
    await render(<CreatorCard creator={person} onToggleFollow={() => undefined} testID="explore-c1" />);
    expect(screen.getByTestId('explore-c1-placeholder', hiddenOk)).toBeTruthy();
    expect(screen.getByText('AN', hiddenOk)).toBeTruthy();
  });

  it('a creator with a photo shows the photo, not the initials, on both', async () => {
    const person = {
      wawuId: 'c1',
      name: 'Amaka Nwosu',
      handle: 'amaka',
      avatarUrl: 'https://example.test/amaka.jpg',
      field: 'Photographer',
      pieceCount: 2,
      verification: { creator: tick(true), professional: tick(false) },
      following: false,
    };
    const rail = await render(<CreatorRail creators={[person]} onRetry={() => undefined} retrying={false} />);
    expect(screen.queryByTestId('today-creator-c1-placeholder', hiddenOk)).toBeNull();
    await rail.unmount();
    await render(<CreatorCard creator={person} onToggleFollow={() => undefined} testID="explore-c1" />);
    expect(screen.queryByTestId('explore-c1-placeholder', hiddenOk)).toBeNull();
  });
});

describe('Button size "card" and variant "veil" (cCard\'s Follow and Following)', () => {
  it('draws "card" 32 high with the label 13 at 700 and no letter-spacing', async () => {
    await render(<Button label="Follow" size="card" onPress={() => undefined} testID="b" />);
    expect(styleOf(screen.getByTestId('b'))).toMatchObject({ height: 32, backgroundColor: darkColors.accent });
    expect(styleOf(screen.getByText('Follow'))).toMatchObject({ fontSize: 13, letterSpacing: -0 });
  });

  it('leaves the other sizes as they were: sm still 34 high at 13.5', async () => {
    await render(<Button label="Small" size="sm" onPress={() => undefined} testID="b" />);
    expect(styleOf(screen.getByTestId('b')).height).toBe(34);
    expect(styleOf(screen.getByText('Small'))).toMatchObject({ fontSize: 13.5, letterSpacing: -0.01 * 13.5 });
  });

  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('draws "veil" as white at 20%, no ring, white words (%s)', async (scheme, colors) => {
    mockScheme = scheme;
    await render(<Button label="Following" variant="veil" size="card" onPress={() => undefined} testID="b" />);
    expect(styleOf(screen.getByTestId('b'))).toMatchObject({ backgroundColor: 'transparent', borderWidth: 0 });
    expect(styleOf(screen.getByTestId('b-veil'))).toMatchObject({
      backgroundColor: colors.textOnAccent,
      opacity: 0.2,
      position: 'absolute',
      borderRadius: radius.button,
    });
    expect(colors.textOnAccent).toBe('#FFFFFF');
    expect(styleOf(screen.getByText('Following')).color).toBe(colors.textOnAccent);
  });

  it('a disabled veil draws the disabled look without the veil', async () => {
    await render(<Button label="Following" variant="veil" disabled onPress={() => undefined} testID="b" />);
    expect(screen.queryByTestId('b-veil')).toBeNull();
    expect(styleOf(screen.getByTestId('b')).backgroundColor).toBe(darkColors.surfaceSunken);
  });
});

describe("THE creator-card Follow: Home and Explore draw it identically, through MediaCard's action", () => {
  const person = (following: boolean) => ({
    wawuId: 'c1',
    name: 'Amaka Nwosu',
    handle: 'amaka',
    avatarUrl: null,
    field: 'Photographer',
    pieceCount: 2,
    verification: { creator: tick(true), professional: tick(false) },
    following,
  });
  const look = (testID: string, label: string) => ({
    button: styleOf(screen.getByTestId(testID)),
    words: StyleSheet.flatten(screen.getByText(label).props.style),
    veil: screen.queryByTestId(`${testID}-veil`) ? styleOf(screen.getByTestId(`${testID}-veil`)) : null,
  });

  it.each([
    [false, 'Follow'],
    [true, 'Following'],
  ] as const)('following %s: the same button, words and fill on both cards (%s)', async (following, label) => {
    const rail = await render(<CreatorRail creators={[person(following)]} onRetry={() => undefined} retrying={false} />);
    const home = look('today-follow-c1', label);
    await rail.unmount();
    await render(<CreatorCard creator={person(following)} onToggleFollow={() => undefined} testID="explore-c1" />);
    const explore = look('explore-c1-follow', label);
    expect(explore).toEqual(home);
    expect(home.button).toMatchObject({ height: 32, alignSelf: 'stretch', borderRadius: radius.button });
    expect(home.words).toMatchObject({ fontSize: 13, color: darkColors.textOnAccent });
    if (following) {
      expect(home.button).toMatchObject({ backgroundColor: 'transparent', borderWidth: 0 });
      expect(home.veil).toMatchObject({ backgroundColor: darkColors.textOnAccent, opacity: 0.2 });
    } else {
      expect(home.button.backgroundColor).toBe(darkColors.accent);
      expect(home.veil).toBeNull();
    }
  });

  it('neither card styles the button by hand: no style reaches it beyond what the size and variant give', async () => {
    await render(<Button label="Following" variant="veil" size="card" full onPress={() => undefined} testID="shared" />);
    const shared = styleOf(screen.getByTestId('shared'));
    const rail = await render(<CreatorRail creators={[person(true)]} onRetry={() => undefined} retrying={false} />);
    expect(styleOf(screen.getByTestId('today-follow-c1'))).toEqual(shared);
    await rail.unmount();
    await render(<CreatorCard creator={person(true)} onToggleFollow={() => undefined} testID="explore-c1" />);
    expect(styleOf(screen.getByTestId('explore-c1-follow'))).toEqual(shared);
  });

  it('draws the card without a button when there is nothing to follow (the viewer\'s own card)', async () => {
    await render(<CreatorCard creator={person(false)} testID="explore-c1" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('Follow')).toBeNull();
  });
});
