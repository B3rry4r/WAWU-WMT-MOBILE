import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';
import { renderRouter, screen as routed } from 'expo-router/testing-library';
import { Profiler } from 'react';
import { ActivityIndicator, Platform, Pressable, Text as NativeText, View } from 'react-native';

import PointsFigurePreview from '@/app/preview/points-figure';
import ProductsMeterPreview from '@/app/preview/products-meter';
import TierBadgePreview from '@/app/preview/tier-badge';
import VoicePlayerPreview from '@/app/preview/voice-player';
import {
  formatPoints,
  formatPointsCount,
  PointsFigure,
  pointsFigureMetrics,
  pointsFitLayout,
  pointsFitMinScale,
  pointsFitScale,
  pointsFixedWidth,
  pointsFullWidth,
  pointsRemeasureCap,
  pointsStackMinScale,
  type PointsFigureSize,
} from '@/components/PointsFigure';
import { ProductsMeter, productsMeterCaption, productsMeterFill, productsMeterLine } from '@/components/ProductsMeter';
import { TierBadge, tierBadgeLabel } from '@/components/TierBadge';
import { barCountFor, playedBars, VoiceLabel, VoicePlayer, voiceClock, voiceErrorLabel, voicePlayerMetrics } from '@/components/VoicePlayer';
import { darkColors, lightColors } from '@/theme/tokens.generated';

/*
 * DV2-COMP: the four shared pieces the tier, points and Voice Intro screens draw (M1, VF11, VF14, M19, PT5). Each takes its values
 * by props; nothing here calls the API. React Native's components load on first use, so touch them once at file load.
 */
void [ActivityIndicator, Pressable, NativeText, View];

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const styleOf = (node: unknown) => flat((node as { props: { style: unknown } }).props.style);
const hidden = { includeHiddenElements: true };
const renderedText = () => JSON.stringify(screen.toJSON());

beforeEach(() => {
  mockScheme = 'dark';
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('TierBadge', () => {
  it('draws a tier with no number in the tint with the accent ink, in dark and in light', async () => {
    const { rerender } = await render(<TierBadge name="Verify" testID="badge" />);
    expect(styleOf(screen.getByTestId('badge')).backgroundColor).toBe(darkColors.accentTint);
    expect(screen.getByText('Verify')).toBeTruthy();
    expect(screen.getByLabelText('Verify tier')).toBeTruthy();
    expect(screen.getByTestId('icon-BadgeCheck', hidden)).toBeTruthy();

    mockScheme = 'light';
    await rerender(<TierBadge name="Verify" testID="badge" />);
    expect(styleOf(screen.getByTestId('badge')).backgroundColor).toBe(lightColors.accentTint);
  });

  it('draws a numbered tier as the dark pill, and says its number', async () => {
    await render(<TierBadge name="Founding Maker" number={128} testID="badge" />);
    expect(styleOf(screen.getByTestId('badge')).backgroundColor).toBe(darkColors.surfaceCardInk);
    expect(screen.getByText('Founding Maker #128')).toBeTruthy();
    expect(screen.getByLabelText('Founding Maker tier, number 128')).toBeTruthy();
  });

  it('is as wide as its name, unless a screen asks it to fill the card (VF14)', async () => {
    const { rerender } = await render(<TierBadge name="Verify" testID="badge" />);
    expect(styleOf(screen.getByTestId('badge')).alignSelf).toBe('flex-start');
    await rerender(<TierBadge name="Verify" stretch testID="badge" />);
    expect(styleOf(screen.getByTestId('badge')).alignSelf).toBe('stretch');
    expect(styleOf(screen.getByTestId('badge')).backgroundColor).toBe(darkColors.accentTint);
    expect(screen.getByText('Verify')).toBeTruthy();
    await rerender(<TierBadge name="Founding Maker" number={128} stretch testID="badge" />);
    expect(styleOf(screen.getByTestId('badge')).alignSelf).toBe('stretch');
    expect(styleOf(screen.getByTestId('badge')).backgroundColor).toBe(darkColors.surfaceCardInk);
  });

  it('treats a missing or null number as no number', async () => {
    await render(<TierBadge name="Founding Maker" number={null} testID="badge" />);
    expect(styleOf(screen.getByTestId('badge')).backgroundColor).toBe(darkColors.accentTint);
    expect(screen.getByText('Founding Maker')).toBeTruthy();
    expect(tierBadgeLabel('Verify Plus')).toBe('Verify Plus');
    expect(tierBadgeLabel('Founding Maker', 7)).toBe('Founding Maker #7');
  });
});

describe('ProductsMeter', () => {
  it('says "2 of 3 products" with the caption, and fills two thirds of the bar', async () => {
    await render(<ProductsMeter used={2} allowed={3} caption="Verify · ends 26 Nov" testID="meter" />);
    expect(screen.getByText('2 of 3 products')).toBeTruthy();
    expect(screen.getByText('Verify · ends 26 Nov')).toBeTruthy();
    expect(String(styleOf(screen.getByTestId('meter-fill')).width).startsWith('66.6')).toBe(true);
    expect(styleOf(screen.getByTestId('meter-fill')).backgroundColor).toBe(darkColors.accent);
    expect(screen.getByTestId('meter').props.accessibilityValue).toEqual({ min: 0, max: 3, now: 2 });
  });

  it('draws none used as an empty bar and all used as a full one', async () => {
    const { rerender } = await render(<ProductsMeter used={0} allowed={3} testID="meter" />);
    expect(screen.getByText('0 of 3 products')).toBeTruthy();
    expect(styleOf(screen.getByTestId('meter-fill')).width).toBe('0%');
    await rerender(<ProductsMeter used={3} allowed={3} testID="meter" />);
    expect(styleOf(screen.getByTestId('meter-fill')).width).toBe('100%');
  });

  it('stops the bar at full when a person is over their allowance, and keeps the true figures', async () => {
    await render(<ProductsMeter used={4} allowed={3} testID="meter" />);
    expect(screen.getByText('4 of 3 products')).toBeTruthy();
    expect(styleOf(screen.getByTestId('meter-fill')).width).toBe('100%');
    expect(screen.getByTestId('meter').props.accessibilityValue).toEqual({ min: 0, max: 3, now: 3 });
  });

  it('says "product" when one is allowed', () => {
    expect(productsMeterLine(0, 1)).toBe('0 of 1 product');
    expect(productsMeterLine(5, 10)).toBe('5 of 10 products');
  });

  it('draws nothing with no allowance, and a block the size of the meter while loading', async () => {
    const { rerender } = await render(<ProductsMeter used={0} allowed={0} testID="meter" />);
    expect(screen.queryByTestId('meter')).toBeNull();
    await rerender(<ProductsMeter used={0} allowed={0} loading testID="meter" />);
    expect(screen.getByTestId('meter-loading')).toBeTruthy();
    expect(screen.queryByText(/products/)).toBeNull();
  });

  it('reads the fill from the figures only', () => {
    expect(productsMeterFill(1, 4)).toBe(0.25);
    expect(productsMeterFill(1, 0)).toBe(0);
    expect(productsMeterFill(-2, 3)).toBe(0);
  });

  it('writes the caption in Lagos time, from the tier name and the end date', () => {
    expect(productsMeterCaption('Verify', '2026-11-26T12:00:00Z')).toBe('Verify · ends 26 Nov');
    expect(productsMeterCaption('Verify', '2026-11-26T23:30:00Z')).toBe('Verify · ends 27 Nov');
    expect(productsMeterCaption('Verify', null)).toBe('Verify');
    expect(productsMeterCaption(null, '2026-11-26T12:00:00Z')).toBe('ends 26 Nov');
    expect(productsMeterCaption('Verify', 'not a date')).toBe('Verify');
    expect(productsMeterCaption(undefined, undefined)).toBeUndefined();
  });

  it('writes September as "Sep", the board\'s three letters, never "Sept"', () => {
    expect(productsMeterCaption('Verify', '2026-09-30T12:00:00Z')).toBe('Verify · ends 30 Sep');
    expect(productsMeterCaption('Verify', '2027-09-01T08:00:00Z')).toBe('Verify · ends 1 Sep');
    expect(productsMeterCaption(null, '2026-09-30T12:00:00Z')).toBe('ends 30 Sep');
  });

  it('writes every month as the history writes it, from the same table', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((name, i) => {
      const at = new Date(Date.UTC(2026, i, 15, 12));
      expect(productsMeterCaption(null, at)).toBe(`ends 15 ${name}`);
    });
  });

  it('reads the day on the Lagos clock at midnight and at the ends of a month and a year', () => {
    expect(productsMeterCaption('Verify', '2026-09-30T22:59:59Z')).toBe('Verify · ends 30 Sep');
    expect(productsMeterCaption('Verify', '2026-09-30T23:00:00Z')).toBe('Verify · ends 1 Oct');
    expect(productsMeterCaption('Verify', '2026-12-31T22:59:59Z')).toBe('Verify · ends 31 Dec');
    expect(productsMeterCaption('Verify', '2026-12-31T23:59:00Z')).toBe('Verify · ends 1 Jan');
    expect(productsMeterCaption('Verify', '2026-02-28T23:30:00Z')).toBe('Verify · ends 1 Mar');
    expect(productsMeterCaption('Verify', '2028-02-28T23:30:00Z')).toBe('Verify · ends 29 Feb');
    expect(productsMeterCaption('Verify', '2026-11-26T00:00:00Z')).toBe('Verify · ends 26 Nov');
  });

  it('reads a date with an offset, and a Date, on the same clock', () => {
    expect(productsMeterCaption('Verify', '2026-11-26T20:00:00-05:00')).toBe('Verify · ends 27 Nov');
    expect(productsMeterCaption('Verify', '2026-11-26T23:30:00+01:00')).toBe('Verify · ends 26 Nov');
    expect(productsMeterCaption('Verify', new Date('2026-09-30T23:00:00Z'))).toBe('Verify · ends 1 Oct');
  });
});

describe('PointsFigure', () => {
  it('writes a count with commas and the word "points", never naira', () => {
    expect(formatPoints(1240)).toBe('1,240 points');
    expect(formatPoints(1)).toBe('1 point');
    expect(formatPoints(0)).toBe('0 points');
    expect(formatPoints(1250000)).toBe('1,250,000 points');
    expect(formatPoints(-5)).toBe('0 points');
    expect(formatPoints(Number.NaN)).toBe('0 points');
    expect(formatPoints(2.9)).toBe('2 points');
    expect(formatPointsCount(2750)).toBe('2,750');
  });

  it('draws the star, the count and the word on a balance, and reads as "1,240 points"', async () => {
    await render(<PointsFigure count={1240} size="hero" testID="pts" />);
    expect(screen.getByText('1,240')).toBeTruthy();
    expect(screen.getByText('points')).toBeTruthy();
    expect(screen.getByLabelText('1,240 points')).toBeTruthy();
    expect(screen.getByTestId('icon-Sparkles', hidden)).toBeTruthy();
    expect(renderedText()).not.toMatch(/₦|naira|kobo/i);
  });

  it('says "point" for one', async () => {
    await render(<PointsFigure count={1} size="hero" />);
    expect(screen.getByText('point')).toBeTruthy();
  });

  it('draws the Studio count as the star and the number, and W1 as the number alone', async () => {
    const { rerender } = await render(<PointsFigure count={1250} size="chip" />);
    expect(screen.getByText('1,250')).toBeTruthy();
    expect(screen.queryByText('points')).toBeNull();
    expect(screen.getByTestId('icon-Sparkles', hidden)).toBeTruthy();
    await rerender(<PointsFigure count={1240} size="tile" />);
    expect(screen.getByText('1,240')).toBeTruthy();
    expect(screen.queryByTestId('icon-Sparkles', hidden)).toBeNull();
  });

  it('lets a screen turn the word or the star on or off', async () => {
    await render(<PointsFigure count={400} size="line" word={false} icon={false} />);
    expect(screen.getByText('400')).toBeTruthy();
    expect(screen.queryByText('points')).toBeNull();
    expect(screen.queryByTestId('icon-Sparkles', hidden)).toBeNull();
  });
  it('draws one line at the board\'s size: the count and the word keep their own width (never wrap), the box gives way to the parent', async () => {
    await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
    const box = styleOf(screen.getByTestId('pts'));
    expect(box.flexShrink).toBe(1);
    expect(box.maxWidth).toBe('100%');
    for (const node of [screen.getByText('1,250,000'), screen.getByText('points')]) {
      expect(node.props.numberOfLines).toBe(1);
      // no system shrink: the figure fits itself from what it measured, the same on a phone and on the web
      expect(node.props.adjustsFontSizeToFit).toBeUndefined();
      expect(styleOf(node).flexShrink).toBe(0);
    }
    expect(styleOf(screen.getByText('1,250,000')).fontSize).toBe(22);
    expect(styleOf(screen.getByText('points')).lineHeight).toBe(Math.round(18 * 1.2));
  });

  it('keeps the board\'s sizes and lines at full size', async () => {
    await render(<PointsFigure count={1240} size="hero" />);
    expect(styleOf(screen.getByText('1,240'))).toMatchObject({ fontSize: 22, lineHeight: 26, letterSpacing: 0 });
    expect(styleOf(screen.getByText('points'))).toMatchObject({ fontSize: 18, lineHeight: 22 });
  });

  it('measures what the star and the gaps take, which never shrink', () => {
    expect(pointsFixedWidth('hero', true, true)).toBe(20 + 5 + 5);
    expect(pointsFixedWidth('chip', false, true)).toBe(14 + 4);
    expect(pointsFixedWidth('tile', false, false)).toBe(0);
    expect(pointsFixedWidth('line', true, false)).toBe(5);
  });

  it('works out the scale that fits: 1 where it fits, else the share, rounded down, never below the floor', () => {
    expect(pointsFitScale(undefined, 195, 30)).toBe(1);
    expect(pointsFitScale(150, undefined, 30)).toBe(1);
    expect(pointsFitScale(200, 195, 30)).toBe(1);
    expect(pointsFitScale(195, 195, 30)).toBe(1);
    expect(pointsFitScale(150, 195, 30)).toBe(0.72);
    expect(pointsFitScale(182, 195, 30)).toBe(0.92);
    expect(pointsFitScale(150, 227, 30)).toBe(0.6);
    expect(pointsFitScale(40, 195, 30)).toBe(pointsFitMinScale);
    expect(pointsFitScale(10, 195, 30)).toBe(pointsFitMinScale);
    expect(pointsFitScale(150, 30, 30)).toBe(1);
    // the drawn row always fits, wherever the rounding falls
    for (let available = 60; available < 195; available += 1) {
      const scale = pointsFitScale(available, 195, 30);
      expect(30 + 165 * scale).toBeLessThanOrEqual(Math.max(available, 30 + 165 * pointsFitMinScale));
    }
  });

  it('gets the full width back from a row that was drawn small', () => {
    expect(pointsFullWidth(195, 1, 30)).toBe(195);
    expect(pointsFullWidth(30 + 165 * 0.72, 0.72, 30)).toBeCloseTo(195, 6);
    expect(pointsFullWidth(80, 0, 30)).toBe(80);
  });

  describe.each(['ios', 'web'] as const)('on %s: the figure measures itself and fits the room', (os) => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', os);
    });
    const layout = (node: unknown, width: number) => fireEvent(node as never, 'layout', { nativeEvent: { layout: { width, height: 26 } } });
    const sizeOf = (text: string) => styleOf(screen.getByText(text)).fontSize as number;
    const box = () => screen.getByTestId('pts');
    /** Hero at full size: the count is 120 wide and the word 45, with 30 for the star and the gaps, so 195 in all. */
    const measureHero = async (count: string, widths = { count: 120, word: 45 }, scale = 1) => {
      await layout(screen.getByText(count), widths.count * scale);
      await layout(screen.getByText(/^points?$/), widths.word * scale);
    };

    it('draws full size until it is measured, then shrinks the count and the word to the room it is given', async () => {
      await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
      expect(sizeOf('1,250,000')).toBe(22);
      expect(screen.getByText('1,250,000').props.numberOfLines).toBe(1);
      await measureHero('1,250,000');
      expect(styleOf(box()).width).toBe(195);
      await layout(box(), 195);
      expect(sizeOf('1,250,000')).toBe(22);
      await layout(box(), 150);
      expect(sizeOf('1,250,000')).toBeCloseTo(22 * 0.72, 6);
      expect(styleOf(screen.getByText('points')).fontSize).toBeCloseTo(18 * 0.72, 6);
      expect(styleOf(screen.getByText('1,250,000')).lineHeight).toBe(Math.round(22 * 0.72 * 1.2));
      expect(screen.getByLabelText('1,250,000 points')).toBeTruthy();
      expect(screen.getByTestId('icon-Sparkles', hidden)).toBeTruthy();
      expect(screen.queryByTestId('pts-stack')).toBeNull();
    });

    it('stays put when it is measured again at the scale it was drawn at, and grows back when the room does', async () => {
      await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
      await measureHero('1,250,000');
      await layout(box(), 150);
      await measureHero('1,250,000', undefined, 0.72);
      expect(styleOf(box()).width).toBe(195);
      expect(sizeOf('1,250,000')).toBeCloseTo(22 * 0.72, 6);
      await layout(box(), 182);
      expect(sizeOf('1,250,000')).toBeCloseTo(22 * 0.92, 6);
      await layout(box(), 200);
      expect(sizeOf('1,250,000')).toBe(22);
    });

    it('fits a nine digit count into 150 px on one line, above the floor', async () => {
      await render(<PointsFigure count={123456789} size="hero" testID="pts" />);
      await measureHero('123,456,789', { count: 142, word: 45 });
      await layout(box(), 150);
      const scale = sizeOf('123,456,789') / 22;
      expect(scale).toBeGreaterThanOrEqual(pointsFitMinScale);
      expect(scale).toBeLessThan(1);
      expect(30 + (142 + 45) * scale).toBeLessThanOrEqual(150);
      expect(screen.queryByTestId('pts-stack')).toBeNull();
    });

    it('moves the word under the count where one line would go under the floor, and the count keeps every digit', async () => {
      await render(<PointsFigure count={123456789012} size="hero" testID="pts" />);
      await measureHero('123,456,789,012', { count: 200, word: 45 });
      await layout(box(), 150);
      // 30 + 245 * 0.5 is 152.5: it does not fit one line at the floor, so the word goes under the count
      const stack = screen.getByTestId('pts-stack');
      expect(within(stack).getByText('123,456,789,012')).toBeTruthy();
      expect(within(stack).getByText('points')).toBeTruthy();
      expect(within(screen.getByTestId('pts-row')).getByTestId('icon-Sparkles', hidden)).toBeTruthy();
      expect(within(stack).queryByTestId('icon-Sparkles', hidden)).toBeNull();
      const scale = sizeOf('123,456,789,012') / 22;
      expect(scale).toBe(0.62);
      // the count fits beside the star (20 + 5), whole, with no ellipsis to read it by
      expect(25 + 200 * scale).toBeLessThanOrEqual(150);
      for (const node of [screen.getByText('123,456,789,012'), screen.getByText('points')]) {
        expect(node.props.ellipsizeMode).toBeUndefined();
        expect(node.props.adjustsFontSizeToFit).toBeUndefined();
      }
      // the word is set as it is beside the count, only smaller with it
      expect(styleOf(screen.getByText('points')).fontSize).toBeCloseTo(18 * 0.62, 6);
      expect(screen.getByLabelText('123,456,789,012 points')).toBeTruthy();
      // and back to one line when the room is there again
      await layout(box(), 280);
      expect(screen.queryByTestId('pts-stack')).toBeNull();
      expect(sizeOf('123,456,789,012')).toBe(22);
    });

    it('stacks 9 digits in 120 px and 12 digits in 150 px, the two the lead named, never below the room', async () => {
      await render(<PointsFigure count={123456789} size="hero" testID="pts" />);
      await measureHero('123,456,789', { count: 142, word: 45 });
      await layout(box(), 120);
      expect(screen.getByTestId('pts-stack')).toBeTruthy();
      expect(25 + 142 * (sizeOf('123,456,789') / 22)).toBeLessThanOrEqual(120);
    });

    it('lets a figure with no word to move go under the floor instead of cutting the count', async () => {
      await render(<PointsFigure count={123456789012} size="chip" testID="pts" />);
      await layout(screen.getByText('123,456,789,012'), 120);
      // the chip is the star and the count: 14 + 4 of star and gap, 120 of count
      expect(styleOf(box()).width).toBe(14 + 4 + 120);
      await layout(box(), 60);
      expect(sizeOf('123,456,789,012')).toBeCloseTo(13.5 * 0.35, 6);
      expect(screen.queryByTestId('pts-stack')).toBeNull();
      await layout(box(), 10);
      expect(sizeOf('123,456,789,012')).toBeCloseTo(13.5 * pointsStackMinScale, 6);
    });

    it('takes a new count at once: a shorter one goes back to full size', async () => {
      const { rerender } = await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
      await measureHero('1,250,000');
      await layout(box(), 150);
      await rerender(<PointsFigure count={1240} size="hero" testID="pts" />);
      // "1,240" is 45 wide at full size; drawn at 0.72 it is 32.4, and "points" is 45 wide, 32.4 at 0.72
      await layout(screen.getByText('1,240'), 45 * 0.72);
      expect(styleOf(box()).width).toBeCloseTo(30 + 45 + 45, 6);
      expect(sizeOf('1,240')).toBe(22);
    });

    it('stops listening to a width that will not settle, after a fixed number of changes', async () => {
      let commits = 0;
      await render(
        <Profiler id="fig" onRender={() => (commits += 1)}>
          <PointsFigure count={1250000} size="hero" testID="pts" />
        </Profiler>,
      );
      await measureHero('1,250,000');
      await layout(box(), 150);
      for (let i = 0; i < 40; i++) await layout(screen.getByText('1,250,000'), i % 2 ? 90 : 130);
      const settled = commits;
      const size = sizeOf('1,250,000');
      for (let i = 0; i < 20; i++) await layout(screen.getByText('1,250,000'), i % 2 ? 80 : 140);
      expect(commits).toBe(settled);
      expect(sizeOf('1,250,000')).toBe(size);
      // a new room is a fresh start
      await layout(box(), 182);
      expect(commits).toBeGreaterThan(settled);
    });
  });

  describe('pointsFitLayout', () => {
    const hero = { size: 'hero', showWord: true, showIcon: true, countFull: 120, wordFull: 45 } as const;
    it('draws full size where nothing is measured or it fits', () => {
      expect(pointsFitLayout({ ...hero })).toEqual({ scale: 1, stacked: false });
      expect(pointsFitLayout({ ...hero, available: 150, countFull: undefined })).toEqual({ scale: 1, stacked: false });
      expect(pointsFitLayout({ ...hero, available: 150, wordFull: undefined })).toEqual({ scale: 1, stacked: false });
      expect(pointsFitLayout({ ...hero, available: 195 })).toEqual({ scale: 1, stacked: false });
      expect(pointsFitLayout({ ...hero, available: 194.95 })).toEqual({ scale: 1, stacked: false });
      expect(pointsFitLayout({ ...hero, available: 400 })).toEqual({ scale: 1, stacked: false });
    });
    it('shrinks the one line down to the floor, then stacks, and the count always fits beside the star', () => {
      expect(pointsFitLayout({ ...hero, available: 150 })).toEqual({ scale: 0.72, stacked: false });
      expect(pointsFitLayout({ ...hero, available: 112.5 })).toEqual({ scale: 0.5, stacked: false });
      expect(pointsFitLayout({ ...hero, available: 112 })).toMatchObject({ stacked: true });
      for (let available = 40; available < 195; available += 1) {
        const fit = pointsFitLayout({ ...hero, available });
        if (fit.stacked) expect(25 + 120 * fit.scale).toBeLessThanOrEqual(Math.max(available, 25 + 120 * pointsStackMinScale));
        else expect(30 + 165 * fit.scale).toBeLessThanOrEqual(available + 0.1);
        expect(fit.scale).toBeGreaterThanOrEqual(fit.stacked ? pointsStackMinScale : pointsFitMinScale);
      }
    });
    it('has no stack where there is no word, and no star beside the stack where there is no star', () => {
      expect(pointsFitLayout({ size: 'chip', showWord: false, showIcon: true, available: 60, countFull: 120 })).toEqual({ scale: 0.35, stacked: false });
      expect(pointsFitLayout({ size: 'tile', showWord: false, showIcon: false, available: 60, countFull: 120 })).toEqual({ scale: 0.5, stacked: false });
      expect(pointsFitLayout({ size: 'hero', showWord: true, showIcon: false, available: 70, countFull: 100, wordFull: 45 })).toEqual({ scale: 0.7, stacked: true });
    });
  });

  describe('settles', () => {
    /** A stand-in layout engine. Digits are 0.6 em, commas 0.3, the word 3 em; the hero star is 20 and each gap 5. */
    const em = (text: string) => [...text].reduce((sum, ch) => sum + (ch === ',' ? 0.3 : 0.6), 0);
    const widths: number[] = [];
    for (let w = 100; w <= 260; w += 2) widths.push(w);
    // the widths that looped on the web: 150 for a line, 108 and 128 for the others
    for (const w of [101, 107, 109, 123, 127, 129, 149, 151]) widths.push(w);

    const sweep = async (size: PointsFigureSize, count: number, whole: boolean) => {
      jest.replaceProperty(Platform, 'OS', 'web');
      let commits = 0;
      await render(
        <Profiler id="fig" onRender={() => (commits += 1)}>
          <PointsFigure count={count} size={size} testID="pts" />
        </Profiler>,
      );
      const shown = formatPointsCount(count);
      const read = whole ? Math.round : (x: number) => x;
      const m = pointsFigureMetrics[size];
      const worst = { renders: 0, overflow: 0 };
      /** What the engine would report now: every event is read from the screen as it is when the event is delivered, as the web does. */
      const now = (room: number) => {
        const countNode = screen.getByText(shown);
        const wordNode = screen.getByText(/^points?$/);
        const countW = em(shown) * (styleOf(countNode).fontSize as number);
        const wordW = 3 * (styleOf(wordNode).fontSize as number);
        const rowW = screen.queryByTestId('pts-stack') !== null ? m.icon + m.iconToNumber + Math.max(countW, wordW) : m.icon + 2 * m.iconToNumber + countW + wordW;
        const boxW = Math.min((styleOf(screen.getByTestId('pts')).width as number | undefined) ?? rowW, room);
        return { countNode, wordNode, countW, wordW, rowW, boxW };
      };
      const send = (node: unknown, width: number) => fireEvent(node as never, 'layout', { nativeEvent: { layout: { width: read(width), height: 26 } } });
      for (const room of widths) {
        const before = commits;
        let quiet = false;
        for (let pass = 0; pass < 30 && !quiet; pass++) {
          const passStart = commits;
          await send(screen.getByTestId('pts'), now(room).boxW);
          await send(now(room).countNode, now(room).countW);
          await send(now(room).wordNode, now(room).wordW);
          quiet = commits === passStart;
          if (quiet) worst.overflow = Math.max(worst.overflow, now(room).rowW - room);
        }
        expect({ room, quiet }).toEqual({ room, quiet: true });
        worst.renders = Math.max(worst.renders, commits - before);
      }
      return worst;
    };

    it.each([
      ['line', 123456789],
      ['line', 123456789012],
      ['hero', 12500],
      ['hero', 1250000],
      ['hero', 123456789],
      ['hero', 123456789012],
      ['row', 1250000],
      ['row', 123456789],
    ] as const)('%s %i: every width from 100 to 260 settles in a few renders and fits, exact widths', async (size, count) => {
      const worst = await sweep(size, count, false);
      expect(worst.renders).toBeLessThanOrEqual(4);
      expect(worst.overflow).toBeLessThanOrEqual(0.1);
    }, 60000);

    it.each([
      ['line', 123456789],
      ['hero', 12500],
      ['hero', 1250000],
      ['hero', 123456789012],
      ['row', 1250000],
    ] as const)('%s %i: and whole-pixel widths, as React Native Web reports them, settle within the cap', async (size, count) => {
      const worst = await sweep(size, count, true);
      expect(worst.renders).toBeLessThanOrEqual(pointsRemeasureCap + 4);
      expect(worst.overflow).toBeLessThanOrEqual(2);
    }, 60000);
  });
});

describe('VoicePlayer', () => {
  const barsOf = () => screen.getByTestId('vp-wave').children.map((c) => styleOf(c).backgroundColor);
  /** The strip is measured by the layout engine; a phone as wide as the board gives it 300 or more. */
  const measure = (width = 300) => fireEvent(screen.getByTestId('vp-wave'), 'layout', { nativeEvent: { layout: { width, height: 26 } } });

  it('idle: Play, the length, the Bio label and the small AI voice tag, with no bar played', async () => {
    await render(<VoicePlayer status="idle" durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(screen.getByLabelText('Play Bio, 0:22')).toBeTruthy();
    expect(screen.getByTestId('icon-Play', hidden)).toBeTruthy();
    expect(screen.getByText('0:22')).toBeTruthy();
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.getByText('AI voice')).toBeTruthy();
    await measure();
    const bars = barsOf();
    expect(bars).toHaveLength(26);
    expect(bars.every((c) => c === darkColors.borderStrong)).toBe(true);
  });

  it('playing: Pause, and the played bars take the accent', async () => {
    await render(<VoicePlayer status="playing" progress={12 / 26} durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(screen.getByLabelText('Pause Bio')).toBeTruthy();
    expect(screen.getByTestId('icon-Pause', hidden)).toBeTruthy();
    await measure();
    const bars = barsOf();
    expect(bars.filter((c) => c === darkColors.accent)).toHaveLength(12);
    expect(bars.filter((c) => c === darkColors.borderStrong)).toHaveLength(14);
    expect(screen.getByTestId('vp-wave').props.accessibilityValue.now).toBe(46);
  });

  it('paused part-way keeps its bars and shows Play', async () => {
    await render(<VoicePlayer status="idle" progress={0.5} durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(screen.getByTestId('icon-Play', hidden)).toBeTruthy();
    await measure();
    expect(barsOf().filter((c) => c === darkColors.accent)).toHaveLength(13);
  });

  it('presses once to play, to pause, or to try again', async () => {
    const onToggle = jest.fn();
    const { rerender } = await render(<VoicePlayer status="idle" durationSeconds={22} onToggle={onToggle} testID="vp" />);
    await fireEvent.press(screen.getByTestId('vp-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    await rerender(<VoicePlayer status="playing" durationSeconds={22} onToggle={onToggle} testID="vp" />);
    await fireEvent.press(screen.getByTestId('vp-button'));
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('loading: the button is busy and a press does nothing', async () => {
    const onToggle = jest.fn();
    await render(<VoicePlayer status="loading" durationSeconds={22} onToggle={onToggle} testID="vp" />);
    const button = screen.getByTestId('vp-button');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    expect(screen.getByTestId('vp-spinner')).toBeTruthy();
    expect(screen.queryByTestId('icon-Play', hidden)).toBeNull();
    await fireEvent.press(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('error: the strip becomes the message, announced as an alert, and the button tries again', async () => {
    const onToggle = jest.fn();
    const { rerender } = await render(<VoicePlayer status="error" durationSeconds={22} onToggle={onToggle} testID="vp" />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText("Couldn't play this. Tap to try again.")).toBeTruthy();
    expect(screen.getByLabelText("Couldn't play this. Try again")).toBeTruthy();
    expect(screen.getByTestId('icon-RotateCcw', hidden)).toBeTruthy();
    expect(screen.queryByTestId('vp-wave')).toBeNull();
    expect(screen.queryByText('0:22')).toBeNull();
    await fireEvent.press(screen.getByTestId('vp-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    await rerender(<VoicePlayer status="error" durationSeconds={22} onToggle={onToggle} errorMessage="Try later." testID="vp" />);
    expect(screen.getByText('Try later.')).toBeTruthy();
    expect(screen.getByLabelText('Try later. Try again')).toBeTruthy();
  });

  it('error: the whole row is the one button, so a tap on the words tries again too', async () => {
    const onToggle = jest.fn();
    await render(<VoicePlayer status="error" durationSeconds={22} onToggle={onToggle} testID="vp" />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    const row = screen.getByRole('button');
    // the label carries the message as well as the action: a button's label hides the text inside it from a screen reader
    expect(row.props.accessibilityLabel).toBe("Couldn't play this. Try again");
    expect(row.props.testID).toBe('vp-button');
    // the words and the circle are inside that one button
    expect(within(row).getByTestId('icon-RotateCcw', hidden)).toBeTruthy();
    expect(within(row).getByText("Couldn't play this. Tap to try again.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Couldn't play this. Tap to try again."));
    expect(onToggle).toHaveBeenCalledTimes(1);
    // the touch area runs out over the pill's own padding (8 above and below, 8 and 12 at the sides)
    expect(row.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 12 });
  });

  it('labels the error row with the message and the action, whatever the message says', () => {
    expect(voiceErrorLabel("Couldn't play this. Tap to try again.")).toBe("Couldn't play this. Try again");
    expect(voiceErrorLabel('No connection')).toBe('No connection. Try again');
    expect(voiceErrorLabel('Try later.')).toBe('Try later. Try again');
    expect(voiceErrorLabel('Tap to try again.')).toBe('Try again');
    expect(voiceErrorLabel('')).toBe('Try again');
  });

  it('drops the AI voice tag only when the Hub says the audio is not AI voice, and the label when a screen draws its own', async () => {
    const { rerender } = await render(<VoicePlayer status="idle" durationSeconds={22} onToggle={() => undefined} aiVoice={false} testID="vp" />);
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.queryByText('AI voice')).toBeNull();
    await rerender(<VoicePlayer status="idle" durationSeconds={22} onToggle={() => undefined} label="none" testID="vp" />);
    expect(screen.queryByText('Bio')).toBeNull();
    expect(screen.queryByText('AI voice')).toBeNull();
    expect(screen.getByText('0:22')).toBeTruthy();
  });

  it('draws the label alone for VF11, and takes light-theme tokens', async () => {
    mockScheme = 'light';
    await render(<VoiceLabel testID="vl" />);
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.getByText('AI voice')).toBeTruthy();
    expect(styleOf(screen.getByTestId('vl-ai')).backgroundColor).toBe(lightColors.surfaceSunken);
  });

  it('draws no bars until the strip is measured, then all 26 where they fit', async () => {
    await render(<VoicePlayer status="playing" progress={0.5} durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(barsOf()).toHaveLength(0);
    expect(screen.getByTestId('vp-wave').props.accessibilityValue.now).toBe(50);
    await measure(300);
    expect(barsOf()).toHaveLength(26);
  });

  it('draws fewer, never thinner, bars on a narrow phone, and keeps the played share', async () => {
    const m = voicePlayerMetrics;
    expect([undefined, 0, -5, Number.NaN, 1, 3, 10, 60, 100, 200].map(barCountFor)).toEqual([0, 0, 0, 0, 0, 1, 3, 15, 25, 26]);
    await render(<VoicePlayer status="playing" progress={0.5} durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    await measure(60);
    const bars = barsOf();
    expect(bars).toHaveLength(15);
    expect(bars.filter((c) => c === darkColors.accent)).toHaveLength(playedBars(0.5, 15));
    await measure(0);
    expect(barsOf()).toHaveLength(0);
    await measure(280);
    expect(barsOf()).toHaveLength(26);
    expect(m.minBar).toBe(2);
  });

  it('never draws a bar thinner than the minimum, at any width', () => {
    const m = voicePlayerMetrics;
    for (let width = 1; width <= 400; width += 1) {
      const n = barCountFor(width);
      if (n === 0) continue;
      expect((width - (n - 1) * m.barGap) / n).toBeGreaterThanOrEqual(m.minBar);
      // one more bar would be thinner than the minimum (or there are already all 26)
      if (n < m.bars) expect((width - n * m.barGap) / (n + 1)).toBeLessThan(m.minBar);
    }
  });

  it('writes the length and the played bars from plain numbers', () => {
    expect(voiceClock(22)).toBe('0:22');
    expect(voiceClock(61)).toBe('1:01');
    expect(voiceClock(600)).toBe('10:00');
    expect(voiceClock(-3)).toBe('0:00');
    expect(voiceClock(Number.NaN)).toBe('0:00');
    expect([0, 0.5, 1, 2, -1, Number.NaN, undefined].map((p) => playedBars(p))).toEqual([0, 13, 26, 26, 0, 0, 0]);
  });
});

describe('the pieces carry no outside brand and no typed figure', () => {
  const files = [
    'src/components/TierBadge.tsx',
    'src/components/ProductsMeter.tsx',
    'src/components/PointsFigure.tsx',
    'src/components/VoicePlayer.tsx',
    'src/app/preview/tier-badge.tsx',
    'src/app/preview/products-meter.tsx',
    'src/app/preview/points-figure.tsx',
    'src/app/preview/voice-player.tsx',
  ];
  const source = (f: string) => readFileSync(join(__dirname, '..', '..', f), 'utf8');

  it.each(files)('%s names no outside brand (R-68) and has no em-dash (R-5)', (f) => {
    expect(source(f)).not.toMatch(/eleven\s?labs|instagram|tiktok|youtube|facebook|kora|flutterwave|fintava|nuvion|openai|anthropic|whatsapp/i);
    expect(source(f)).not.toContain('—');
  });

  it.each(files.slice(0, 4))('%s has no colour literal (R-47 tokens only)', (f) => {
    const code = source(f)
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
      .join('\n');
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});

describe('the preview routes show every state without the API', () => {
  it('tier badge: every badge, or one by ?state', async () => {
    await renderRouter({ 'preview/tier-badge': TierBadgePreview }, { initialUrl: '/preview/tier-badge' });
    expect(routed.getByText('Verify Plus')).toBeTruthy();
    expect(routed.getByText('Founding Maker #128')).toBeTruthy();
    expect(routed.getByText('Founding Maker #12840')).toBeTruthy();
    expect(styleOf(routed.getByTestId('tier-stretch')).alignSelf).toBe('stretch');
    expect(styleOf(routed.getByTestId('tier-verify')).alignSelf).toBe('flex-start');
  });

  it('tier badge: one badge by ?state', async () => {
    await renderRouter({ 'preview/tier-badge': TierBadgePreview }, { initialUrl: '/preview/tier-badge?state=numbered' });
    expect(routed.getByText('Founding Maker #128')).toBeTruthy();
    expect(routed.queryByText('Verify Plus')).toBeNull();
  });

  it('products meter: partway, none, full, loading, and no tier', async () => {
    await renderRouter({ 'preview/products-meter': ProductsMeterPreview }, { initialUrl: '/preview/products-meter' });
    expect(routed.getByText('2 of 3 products')).toBeTruthy();
    expect(routed.getByText('0 of 3 products')).toBeTruthy();
    expect(routed.getByText('3 of 3 products')).toBeTruthy();
    expect(routed.getByText('0 of 1 product')).toBeTruthy();
    expect(routed.getByTestId('meter-loading')).toBeTruthy();
    expect(routed.queryByTestId('meter-none')).toBeNull();
  });

  it('points figure: every size', async () => {
    await renderRouter({ 'preview/points-figure': PointsFigurePreview }, { initialUrl: '/preview/points-figure' });
    expect(routed.getAllByLabelText('1,240 points').length).toBeGreaterThan(0);
    expect(routed.getByLabelText('1 point')).toBeTruthy();
    expect(routed.getByLabelText('0 points')).toBeTruthy();
    expect(routed.getAllByLabelText('1,250,000 points').length).toBeGreaterThan(0);
    // 9 digits in 120, 150, 182 and 200 px; 12 digits in the same four
    expect(routed.getAllByLabelText('123,456,789 points')).toHaveLength(4);
    expect(routed.getAllByLabelText('123,456,789,012 points')).toHaveLength(4);
    expect(routed.getByText('12 digits in 120 px')).toBeTruthy();
    expect(routed.getByText('9 digits in 150 px')).toBeTruthy();
    expect(styleOf(routed.getByTestId('points-fit-7-182').parent as never).width).toBe(182);
  });

  it('voice player: an error is left by pressing the button', async () => {
    await renderRouter({ 'preview/voice-player': VoicePlayerPreview }, { initialUrl: '/preview/voice-player?state=error' });
    expect(routed.getByText("Couldn't play this. Tap to try again.")).toBeTruthy();
    await fireEvent.press(routed.getByTestId('voice-error-button'));
    expect(await routed.findByLabelText('Play Bio, 0:22')).toBeTruthy();
  });

  it('voice player: every state in one page', async () => {
    await renderRouter({ 'preview/voice-player': VoicePlayerPreview }, { initialUrl: '/preview/voice-player' });
    expect(routed.getByTestId('voice-idle')).toBeTruthy();
    expect(routed.getByTestId('voice-playing')).toBeTruthy();
    expect(routed.getByTestId('voice-loading-spinner')).toBeTruthy();
    expect(routed.getByTestId('voice-above-above')).toBeTruthy();
  });
});
