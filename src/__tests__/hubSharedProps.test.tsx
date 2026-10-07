import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { chipIconMetrics, chipMetrics, FilterChips, optionChipMetrics } from '@/components/FilterChips';
import { mediaMetrics, MediaCard } from '@/components/MediaCard';
import { looks } from '@/features/tgif/look';
import { font, stopOf } from '@/theme';
import { darkColors, darkShadows, lightColors, lightShadows } from '@/theme/tokens.generated';

/*
 * SHARED-02: the optional props and tokens the four tab hubs asked for (SHARED-CHANGES EXPLORE-01 #1 and #3,
 * HOME-01 #1 and #2, HOME-09 #1, ME-01 #1, WALLET-01 #1). Each is drawn when given and changes nothing when not.
 */

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));
beforeEach(() => {
  mockScheme = 'dark';
});
afterEach(() => jest.restoreAllMocks());

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const hiddenOk = { includeHiddenElements: true };
const styleOf = (node: unknown) => flat((node as { props: { style: unknown } }).props.style);

describe('MediaCard titleAccessory (HOME-01 #2)', () => {
  it('draws the accessory after the title, 4 apart, on a stacked card', async () => {
    await render(<MediaCard layout="stacked" title="Adaeze O." subtitle="Business strategist" titleAccessory={<View testID="tick" />} />);
    const line = screen.getByTestId('tick').parent!;
    expect(styleOf(line)).toMatchObject({ flexDirection: 'row', alignItems: 'center', gap: mediaMetrics.titleAccessoryGap });
    expect(mediaMetrics.titleAccessoryGap).toBe(4);
    expect(screen.getByText('Adaeze O.').parent).toBe(line);
  });

  it('draws it after the title on a row card too', async () => {
    await render(<MediaCard title="How I built it" subtitle="Video" titleAccessory={<View testID="tick" />} />);
    expect(screen.getByText('How I built it').parent).toBe(screen.getByTestId('tick').parent);
  });

  it('is absent when not given: the title sits straight in the caption, as before', async () => {
    await render(<MediaCard layout="stacked" title="Lighting night shoots" subtitle="Video" testID="card" />);
    const title = screen.getByText('Lighting night shoots');
    expect(styleOf(title.parent).flexDirection).toBeUndefined();
    expect(styleOf(title.parent).position).toBe('absolute');
    expect(screen.queryByTestId('tick')).toBeNull();
  });
});

describe('MediaCard footer (HOME-01 #2)', () => {
  it('draws the footer under the caption, 8 below the words, and keeps the words one stop for a screen reader', async () => {
    await render(
      <MediaCard layout="stacked" title="Adaeze O." subtitle="Business strategist" testID="card" footer={<Text testID="below">Below</Text>} />,
    );
    const caption = screen.getByTestId('below').parent!;
    expect(styleOf(caption)).toMatchObject({ position: 'absolute', gap: mediaMetrics.footerGap });
    expect(mediaMetrics.footerGap).toBe(8);
    const words = screen.getByTestId('card-words');
    expect(words.props.accessible).toBe(true);
    expect(words.props.accessibilityLabel).toBe('Adaeze O., Business strategist');
    // The card itself is no longer one element, so the footer's own controls stay reachable.
    expect(screen.getByTestId('card').props.accessible).toBe(false);
  });

  it('is absent when not given: the card is one element with its label, as before', async () => {
    await render(<MediaCard layout="stacked" title="Lighting night shoots" subtitle="Video" testID="card" />);
    expect(screen.getByTestId('card').props.accessible).toBe(true);
    expect(screen.getByTestId('card').props.accessibilityLabel).toBe('Lighting night shoots, Video');
    expect(screen.queryByTestId('card-words')).toBeNull();
  });

  it('is drawn only on a stacked card', async () => {
    await render(<MediaCard title="How I built it" footer={<Text testID="below">Below</Text>} />);
    expect(screen.queryByTestId('below')).toBeNull();
  });
});

describe('MediaCard action (EXPLORE-01 #3)', () => {
  it('draws the shared button under the caption, 32 high across the caption, on the accent; a press reaches the caller', async () => {
    const follow = jest.fn();
    await render(<MediaCard layout="stacked" title="@adaeze" subtitle="Photography" action={{ label: 'Follow', onPress: follow, testID: 'follow' }} />);
    const button = screen.getByRole('button', { name: 'Follow' });
    expect(styleOf(button)).toMatchObject({ height: mediaMetrics.actionHeight, alignSelf: 'stretch', backgroundColor: darkColors.accent });
    expect(mediaMetrics.actionHeight).toBe(32);
    await fireEvent.press(screen.getByTestId('follow'));
    expect(follow).toHaveBeenCalledTimes(1);
  });

  it('draws the on state ("Following") on glass', async () => {
    await render(<MediaCard layout="stacked" title="@adaeze" action={{ label: 'Following', on: true, onPress: () => undefined }} />);
    expect(styleOf(screen.getByRole('button', { name: 'Following' })).backgroundColor).toBe(darkColors.surfaceGlass);
  });

  it('comes after a footer when both are given', async () => {
    await render(
      <MediaCard layout="stacked" title="@adaeze" footer={<Text testID="below">Below</Text>} action={{ label: 'Follow', onPress: () => undefined }} />,
    );
    const caption = screen.getByTestId('below').parent!;
    const order = caption.children.map((c) => (typeof c === 'string' ? c : (c.props as { testID?: string; accessibilityLabel?: string }).testID ?? (c.props as { accessibilityLabel?: string }).accessibilityLabel));
    expect(order.indexOf('below')).toBeLessThan(order.indexOf('Follow'));
  });

  it('is absent when not given: no button on the card', async () => {
    await render(<MediaCard layout="stacked" title="Lighting night shoots" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it("takes a grid's full width ('100%')", async () => {
    await render(<MediaCard layout="stacked" title="@adaeze" width="100%" height={218} testID="card" />);
    expect(styleOf(screen.getByTestId('card').children[0])).toMatchObject({ width: '100%', height: 218 });
  });
});

const categories = [
  { value: 'all', label: 'All', icon: 'LayoutGrid' },
  { value: 'photo', label: 'Photography', icon: 'Camera' },
  { value: 'music', label: 'Music' },
] as const;

describe('FilterChips icon (EXPLORE-01 #1)', () => {
  it('draws the icon 6 before the label, 15 at stroke 2 in the label colour, with 11 at the start and 14 at the end', async () => {
    await render(<FilterChips label="Categories" items={categories} value="all" onChange={() => undefined} testID="cats" />);
    const on = screen.getByTestId('cats-all');
    expect(styleOf(on)).toMatchObject({ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 11, paddingRight: 14 });
    // The icon is decoration: hidden from a screen reader, which reads the label.
    expect(screen.getByTestId('icon-LayoutGrid', hiddenOk)).toBeTruthy();
    expect(on.children.length).toBe(2);
    expect(chipIconMetrics).toMatchObject({ size: 15, stroke: 2, iconGap: 6 });
    // The chip that is on draws its label in the page colour; the icon follows it.
    expect(JSON.stringify(screen.getByTestId('cats-all'))).toContain(darkColors.surfacePage);
    expect(JSON.stringify(screen.getByTestId('cats-photo'))).toContain(darkColors.textSecondary);
  });

  it('counts the option chip outline into the icon padding, as it does for the plain one', async () => {
    await render(<FilterChips variant="option" label="Categories" items={categories} value="all" onChange={() => undefined} testID="cats" />);
    expect(styleOf(screen.getByTestId('cats-photo'))).toMatchObject({
      paddingLeft: chipIconMetrics.padStart - optionChipMetrics.border,
      paddingRight: chipIconMetrics.padEnd - optionChipMetrics.border,
    });
  });

  it('is absent when not given: the chip keeps its 15 either side and draws no icon', async () => {
    await render(<FilterChips label="Categories" items={categories} value="all" onChange={() => undefined} testID="cats" />);
    const plain = styleOf(screen.getByTestId('cats-music'));
    expect(plain.paddingHorizontal).toBe(chipMetrics.padH);
    expect(plain.paddingLeft).toBeUndefined();
    expect(plain.flexDirection).toBeUndefined();
    expect(screen.queryAllByTestId(/^icon-/, hiddenOk)).toHaveLength(2);
  });
});

describe('FilterChips revealSelected (EXPLORE-01 #1, the Categories behaviour)', () => {
  const layout = (x: number, width: number) => ({ nativeEvent: { layout: { x, y: 0, width, height: 36 } } });
  /** The mocked ScrollView's own `scrollTo` is one function shared by every test: start each count at zero. */
  const spyScroll = () => {
    const spy = jest.spyOn(ScrollView.prototype, 'scrollTo');
    spy.mockClear();
    return spy;
  };
  const many = Array.from({ length: 12 }, (_, i) => ({ value: `c${i}`, label: `Category ${i}` }));

  it('scrolls once to the chip that is on when the row opens, when it starts out of view', async () => {
    const scrollTo = spyScroll();
    await render(<FilterChips label="Categories" items={many} value="c9" onChange={() => undefined} revealSelected testID="cats" />);
    await fireEvent(screen.getByTestId('cats'), 'layout', layout(0, 390));
    await fireEvent(screen.getByTestId('cats-c9'), 'layout', layout(900, 110));
    expect(scrollTo).toHaveBeenCalledWith({ x: 900 - 20, animated: false });
    await fireEvent(screen.getByTestId('cats-c9'), 'layout', layout(900, 110));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('leaves the row where it is when that chip is already in full view', async () => {
    const scrollTo = spyScroll();
    await render(<FilterChips label="Categories" items={many} value="c1" onChange={() => undefined} revealSelected testID="cats" />);
    await fireEvent(screen.getByTestId('cats'), 'layout', layout(0, 390));
    await fireEvent(screen.getByTestId('cats-c1'), 'layout', layout(120, 110));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('is absent when not given: the row never scrolls by itself', async () => {
    const scrollTo = spyScroll();
    await render(<FilterChips label="Categories" items={many} value="c9" onChange={() => undefined} testID="cats" />);
    expect(screen.getByTestId('cats-c9').props.onLayout).toBeUndefined();
    expect(screen.getByTestId('cats').props.onLayout).toBeUndefined();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('Button size "profile" (ME-01 #1)', () => {
  it('draws "Edit profile" 38 high, 16 either side, the label 14 at 600', async () => {
    await render(<Button label="Edit profile" variant="outline" size="profile" onPress={() => undefined} />);
    expect(styleOf(screen.getByRole('button', { name: 'Edit profile' }))).toMatchObject({ height: 38, paddingHorizontal: 16 });
    expect(styleOf(screen.getByText('Edit profile'))).toMatchObject({ fontSize: 14, fontFamily: font(600).fontFamily });
  });

  it('leaves every other size at 700', async () => {
    await render(<Button label="Go" size="sm" onPress={() => undefined} />);
    expect(styleOf(screen.getByText('Go'))).toMatchObject({ fontSize: 13.5, fontFamily: font(700).fontFamily });
  });
});

describe('TGIF tokens (HOME-09 #1 joined with HOME-01 #1)', () => {
  const canvas = {
    tgifVerseGround: '#2A0C3E',
    tgifVerseGlow: 'rgba(148, 17, 201, 0.7)',
    tgifRealityGround: '#101A3A',
    tgifRealityGlow: 'rgba(92, 100, 255, 0.55)',
    tgifRememberGround: '#3A0C2A',
    tgifRememberGlow: 'rgba(214, 59, 140, 0.55)',
    tgifPrayerGround: '#1A0E30',
    tgifPrayerGlow: 'rgba(148, 17, 201, 0.6)',
    tgifTakeawayGround: '#2A0C3E',
    tgifTakeawayGlow: 'rgba(255, 160, 60, 0.5)',
    tgifLabel: '#E2B4F5',
    tgifWarmGlow: 'rgba(255, 160, 60, 0.35)',
  } as const;

  it.each(Object.entries(canvas))('%s is the canvas colour, the same in both themes', (token, value) => {
    expect(darkColors[token as keyof typeof canvas]).toBe(value);
    expect(lightColors[token as keyof typeof canvas]).toBe(value);
  });

  it("paints each reader card with its own ground and glow, the glow split for an SVG stop", () => {
    expect(looks.verse).toEqual({ ground: canvas.tgifVerseGround, glow: { color: 'rgb(148, 17, 201)', opacity: 0.7 } });
    expect(looks.reality).toEqual({ ground: canvas.tgifRealityGround, glow: { color: 'rgb(92, 100, 255)', opacity: 0.55 } });
    expect(looks.remember).toEqual({ ground: canvas.tgifRememberGround, glow: { color: 'rgb(214, 59, 140)', opacity: 0.55 } });
    expect(looks.prayer).toEqual({ ground: canvas.tgifPrayerGround, glow: { color: 'rgb(148, 17, 201)', opacity: 0.6 } });
    expect(looks.takeaway).toEqual({ ground: canvas.tgifTakeawayGround, glow: { color: 'rgb(255, 160, 60)', opacity: 0.5 } });
  });

  it('stopOf keeps a colour with no alpha whole, at full strength', () => {
    expect(stopOf('#2A0C3E')).toEqual({ color: '#2A0C3E', opacity: 1 });
  });
});

describe('money card tokens (WALLET-01 #1, HOME-01 #1)', () => {
  it('--shadow-money: light 0 24 40 -22 at 60% of #16151B under the card, dark an inset 1 px line of white at 8%', () => {
    expect(lightShadows.money).toEqual([{ offsetX: 0, offsetY: 24, blurRadius: 40, spreadDistance: -22, color: 'rgba(22, 21, 27, 0.6)' }]);
    expect(darkShadows.money).toEqual([{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: 'rgba(255, 255, 255, 0.08)', inset: true }]);
  });

  it("the balance card's glow is the accent at 55% in both themes", () => {
    expect(darkColors.glowMoney).toBe('rgba(148, 17, 201, 0.55)');
    expect(lightColors.glowMoney).toBe(darkColors.glowMoney);
  });

  it('a shadow token of none is no shadow at all', () => {
    expect(darkShadows.card).toEqual([]);
  });
});
