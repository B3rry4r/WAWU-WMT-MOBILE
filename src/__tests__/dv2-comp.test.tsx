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
  pointsCountGroups,
  pointsFigureMetrics,
  pointsFit,
  pointsFitAllowance,
  pointsFixedWidth,
  pointsReadableFloor,
  type PointsFigureSize,
  type PointsFit,
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
  it('draws one line at the board\'s size: the count and the word keep their own width (never wrap)', async () => {
    await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
    for (const node of [screen.getByText('1,250,000'), screen.getByText('points')]) {
      expect(node.props.numberOfLines).toBe(1);
      // no system shrink: the figure fits itself from what it measured, the same on a phone and on the web
      expect(node.props.adjustsFontSizeToFit).toBeUndefined();
      expect(styleOf(node).flexShrink).toBe(0);
      // the drawn texts are never read for their width: only the copies are
      expect(node.props.onLayout).toBeUndefined();
    }
    expect(styleOf(screen.getByText('1,250,000')).fontSize).toBe(22);
    expect(styleOf(screen.getByText('points')).lineHeight).toBe(Math.round(18 * 1.2));
  });

  it('never cuts the count of a hugging figure: it spills past a narrow parent like the star and the word (DV2-COMP L1)', async () => {
    await render(<PointsFigure count={123456789} size="hero" testID="pts" />);
    // the web caps a one-line Text at its box and ends it in an ellipsis; the overflow stays visible so the whole count is drawn
    for (const node of [screen.getByText('123,456,789'), screen.getByText('points')]) {
      expect(styleOf(node).overflow).toBe('visible');
      expect(node.props.ellipsizeMode).toBeUndefined();
    }
  });

  it('on the web the count and the word are not capped at their parent, so the word never sits on the digits (SWEEP-APP-4 row 169)', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<PointsFigure count={12345678} size="hero" testID="pts" />);
    for (const node of [screen.getByText('12,345,678'), screen.getByText('points')]) {
      expect(styleOf(node).maxWidth).toBe('none');
    }
  });

  it('off the web the count and the word set no max width', async () => {
    await render(<PointsFigure count={12345678} size="hero" testID="pts" />);
    expect(styleOf(screen.getByText('12,345,678')).maxWidth).toBeUndefined();
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

  it('names its floors in px: the count 11, the word 10, and a rounding allowance', () => {
    expect(pointsReadableFloor).toEqual({ count: 11, word: 10 });
    expect(pointsFitAllowance).toBe(2);
  });

  describe('pointsFit', () => {
    const hero = { size: 'hero', showWord: true, showIcon: true } as const;
    /** Hero at the board's size: the count is 120 wide and the word 45, with 30 for the star and the gaps, so 195 in all. */
    const known = { ...hero, count: 120, word: 45 };
    const fits = (fit: PointsFit, room: number) => {
      const m = pointsFigureMetrics.hero;
      return fit.stacked || fit.broken ? true : 30 + (120 * fit.countSize) / m.number + (45 * fit.wordSize) / m.word <= room;
    };

    it('draws full size where nothing is known yet, or where it all fits', () => {
      const full = { countSize: 22, wordSize: 18, stacked: false, broken: false };
      expect(pointsFit({ ...hero })).toEqual(full);
      expect(pointsFit({ ...known, room: undefined })).toEqual(full);
      expect(pointsFit({ ...known, room: 150, count: undefined })).toEqual(full);
      expect(pointsFit({ ...known, room: 150, word: undefined })).toEqual(full);
      expect(pointsFit({ ...known, room: 195 + pointsFitAllowance })).toEqual(full);
      expect(pointsFit({ ...known, room: 400 })).toEqual(full);
      // the word is not waited for where there is none
      expect(pointsFit({ size: 'chip', showWord: false, showIcon: true, room: 400, count: 120 })).toEqual({ countSize: 13.5, wordSize: 12, stacked: false, broken: false });
    });

    it('is the room over the natural widths: one pass, no tolerance, no cap', () => {
      // 150 px: 150 - 30 for the star and gaps - 2 allowed = 118 for the count and the word, which are 165 at full size
      const fit = pointsFit({ ...known, room: 150 });
      expect(fit.countSize).toBeCloseTo(22 * (118 / 165), 9);
      expect(fit.wordSize).toBeCloseTo(18 * (118 / 165), 9);
      expect(fit).toMatchObject({ stacked: false, broken: false });
      // the same three numbers always give the same answer
      expect(pointsFit({ ...known, room: 150 })).toEqual(fit);
      // a figure that was shrunk to fit never reaches the room
      for (let room = 120; room < 197; room += 0.5) expect(fits(pointsFit({ ...known, room }), room - pointsFitAllowance + 1e-9)).toBe(true);
    });

    it('never takes the count under 11 px or the word under 10 px', () => {
      for (const size of ['hero', 'row', 'line'] as const) {
        const m = pointsFigureMetrics[size];
        for (let room = 20; room < 260; room += 1) {
          const fit = pointsFit({ size, showWord: true, showIcon: true, room, count: 150, word: 52 });
          expect(fit.countSize).toBeGreaterThanOrEqual(Math.min(m.number, 11) - 1e-9);
          expect(fit.wordSize).toBeGreaterThanOrEqual(Math.min(m.word, 10) - 1e-9);
          expect(fit.countSize).toBeLessThanOrEqual(m.number);
        }
      }
      // each at its own floor: the word reaches 10 px first (hero 18 to 10 is 0.556), the count keeps shrinking to 11 px (0.5)
      const wordFirst = pointsFit({ ...known, room: 30 + 120 * 0.53 + 45 * (10 / 18) + pointsFitAllowance + 0.01 });
      expect(wordFirst.wordSize).toBeCloseTo(10, 6);
      expect(wordFirst.countSize).toBeGreaterThan(11);
      expect(wordFirst.countSize).toBeLessThan(22 * 0.54);
    });

    it('moves the word under the count where one line does not fit at the floor, and the count is then worked out against the room alone', () => {
      // at the floors the line is 120 * 0.5 + 45 * 0.556 = 85 and the room for it is 118 at 150: it fits. At 110 it does not.
      const fit = pointsFit({ ...known, room: 110 });
      expect(fit.stacked).toBe(true);
      expect(fit.broken).toBe(false);
      // the count sits beside the star (25 px) in what is left of the room, less the allowance: 110 - 25 - 2 = 83 of 120
      expect(fit.countSize).toBeCloseTo(22 * (83 / 120), 9);
      expect(fit.wordSize).toBeCloseTo(18 * (83 / 120), 9);
      // the count is never under 11 px, and the room is never exceeded while it is not broken
      for (let room = 60; room < 200; room += 0.5) {
        const f = pointsFit({ ...known, room });
        if (f.stacked && !f.broken) expect(25 + (120 * f.countSize) / 22).toBeLessThanOrEqual(room - pointsFitAllowance + 1e-9);
        expect(f.countSize).toBeGreaterThanOrEqual(11 - 1e-9);
      }
    });

    it('breaks a count that is still wider than its room at 11 px, only between digit groups', () => {
      const fit = pointsFit({ ...known, room: 70 });
      expect(fit).toMatchObject({ countSize: 11, stacked: true, broken: true });
      expect(fit.wordSize).toBeGreaterThanOrEqual(10);
      expect(pointsCountGroups('123,456,789,012,345')).toEqual(['123,', '456,', '789,', '012,', '345']);
      expect(pointsCountGroups('1,250,000')).toEqual(['1,', '250,', '000']);
      expect(pointsCountGroups('1,240')).toEqual(['1,', '240']);
      expect(pointsCountGroups('250')).toEqual(['250']);
      expect(pointsCountGroups('0')).toEqual(['0']);
      expect(pointsCountGroups('123,456,789,012,345').join('')).toBe('123,456,789,012,345');
    });

    it('has no stack where there is no word: the count alone goes to 11 px, then breaks', () => {
      const chip = { size: 'chip', showWord: false, showIcon: true, count: 120 } as const;
      // 60 - 18 for the star and gap - 2 allowed = 40 for the count: under the 11 px floor (0.815 of 13.5), so it breaks at 11 px
      expect(pointsFit({ ...chip, room: 60 })).toEqual({ countSize: 11, wordSize: 12, stacked: false, broken: true });
      // 120 - 20 = 100 for the count, which is 120 at full size
      const fit = pointsFit({ ...chip, room: 120 });
      expect(fit.countSize).toBeCloseTo(13.5 * (100 / 120), 9);
      expect(fit).toMatchObject({ stacked: false, broken: false });
      const tile = pointsFit({ size: 'tile', showWord: false, showIcon: false, room: 60, count: 120 });
      expect(tile).toMatchObject({ countSize: 11, broken: true, stacked: false });
      // a size that is already under a floor keeps its own size
      const small = pointsFit({ size: 'chip', showWord: false, showIcon: false, room: 30, count: 50 });
      expect(small.countSize).toBeGreaterThanOrEqual(11);
    });
  });

  describe('hugging (the default)', () => {
    const rootOf = () => styleOf(screen.getByTestId('pts'));

    it('is as wide as its content like a Text: no width, no growing or shrinking, no room, no copies, nothing measured or hidden', async () => {
      await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
      const root = rootOf();
      for (const key of ['width', 'minWidth', 'maxWidth', 'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'opacity']) {
        expect(root[key]).toBeUndefined();
      }
      expect(root).toMatchObject({ flexDirection: 'row', alignItems: 'center' });
      expect(screen.getByTestId('pts').props.onLayout).toBeUndefined();
      expect(screen.queryByTestId('pts-measure-count', hidden)).toBeNull();
      expect(screen.queryByTestId('pts-measure-word', hidden)).toBeNull();
      expect(screen.queryByTestId('pts-row', hidden)).toBeNull();
      expect(screen.getByLabelText('1,250,000 points')).toBeTruthy();
    });

    it('is drawn at the board\'s size from the first frame and on every change, with nothing to wait for', async () => {
      const { rerender } = await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
      expect(styleOf(screen.getByText('1,250,000')).fontSize).toBe(22);
      expect(styleOf(screen.getByText('points')).fontSize).toBe(18);
      await rerender(<PointsFigure count={1} size="hero" testID="pts" />);
      expect(styleOf(screen.getByText('1')).fontSize).toBe(22);
      expect(screen.getByText('point')).toBeTruthy();
      expect(screen.queryByTestId('pts-stack')).toBeNull();
      expect(screen.queryByTestId('pts-groups')).toBeNull();
    });

    it('draws the Studio count, the PT3 value and the Points tile at their boards\' sizes', async () => {
      const { rerender } = await render(<PointsFigure count={1250} size="chip" testID="pts" />);
      expect(styleOf(screen.getByText('1,250')).fontSize).toBe(13.5);
      await rerender(<PointsFigure count={250} size="row" testID="pts" />);
      expect(styleOf(screen.getByText('250')).fontSize).toBe(17);
      await rerender(<PointsFigure count={1240} size="tile" testID="pts" />);
      expect(styleOf(screen.getByText('1,240')).fontSize).toBe(18);
    });
  });

  /*
   * Where the figure sits is the parent's layout. Jest has no layout engine, so these read the styles the rendered tree really carries
   * and solve the little of flexbox they use (a row with fixed, flexible and content-wide items; a column that stretches, centres or
   * end-aligns), the way the 'settles' tests stand in for the engine. Measured widths in the app are the same numbers: the hero set at
   * the board's size is a 30 px star and gaps, a 120 px count and a 45 px word.
   */
  describe('in a parent', () => {
    const pct = (value: unknown, of: number) => (typeof value === 'string' && value.endsWith('%') ? (parseFloat(value) / 100) * of : undefined);
    const widthOf = (style: Record<string, unknown>, of: number) => (typeof style.width === 'number' ? style.width : pct(style.width, of));
    /** The widths of a row's items: basis from `width`, `flex` or the content, then growing into free space or shrinking out of a lack. */
    const rowWidths = (rowWidth: number, gap: number, items: { style: Record<string, unknown>; content: number }[]) => {
      const flexes = items.map(({ style }) => (typeof style.flex === 'number' ? style.flex : 0));
      const basis = items.map(({ style, content }, at) => (flexes[at] ? 0 : (widthOf(style, rowWidth) ?? content)));
      const grow = items.map(({ style }, at) => flexes[at] || (typeof style.flexGrow === 'number' ? style.flexGrow : 0));
      const shrink = items.map(({ style }, at) => (flexes[at] ? 1 : typeof style.flexShrink === 'number' ? style.flexShrink : 0));
      const free = rowWidth - gap * (items.length - 1) - basis.reduce((a, b) => a + b, 0);
      const growTotal = grow.reduce((a, b) => a + b, 0);
      const shrinkTotal = shrink.reduce((sum, k, at) => sum + k * basis[at], 0);
      return basis.map((b, at) => Math.max(0, free >= 0 ? b + (growTotal ? (free * grow[at]) / growTotal : 0) : b + (shrinkTotal ? (free * shrink[at] * b) / shrinkTotal : 0)));
    };
    /** A column's child: where its box starts and how wide it is, for the column's `alignItems`. */
    const inColumn = (columnWidth: number, alignItems: 'stretch' | 'center' | 'flex-end' | 'flex-start', style: Record<string, unknown>, content: number) => {
      const width = widthOf(style, columnWidth) ?? (alignItems === 'stretch' ? columnWidth : content);
      const left = alignItems === 'center' ? (columnWidth - width) / 2 : alignItems === 'flex-end' ? columnWidth - width : 0;
      return { left, width };
    };
    /** The drawn content's span inside its box: a hugging figure starts at the box's start, a fitted one by its `justifyContent`. */
    const contentSpan = (box: { left: number; width: number }, style: Record<string, unknown>, content: number) => {
      const slack = Math.max(0, box.width - content);
      const left = box.left + (style.justifyContent === 'center' ? slack / 2 : style.justifyContent === 'flex-end' ? slack : 0);
      return { left, right: left + content };
    };

    const W = 358;
    /** The hero at the board's size, one line: 20 star + 5 + 120 count + 5 + 45 word. The chip: 14 + 4 + 40. */
    const natural = { hero: 195, chip: 58 } as const;
    const rootStyle = () => styleOf(screen.getByTestId('pts'));

    it.each([
      ['centres', 'center', (box: { left: number; width: number }) => [box.left, W - (box.left + box.width)]],
      ['end-aligns', 'flex-end', (box: { left: number; width: number }) => [W - (box.left + box.width), 0]],
      ['start-aligns', 'flex-start', (box: { left: number; width: number }) => [box.left, 0]],
    ] as const)('a parent that %s it puts it there, hugging', async (_name, alignItems, edges) => {
      await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
      const box = inColumn(W, alignItems, rootStyle(), natural.hero);
      // the box is the content's width, so the parent's alignment is the figure's place
      expect(box.width).toBe(natural.hero);
      if (alignItems === 'center') expect(edges(box)[0]).toBeCloseTo(edges(box)[1], 9);
      else expect(edges(box)[0]).toBe(0);
    });

    it('in a parent that stretches, a hugging figure draws from the start edge', async () => {
      await render(<PointsFigure count={1250000} size="hero" testID="pts" />);
      const box = inColumn(W, 'stretch', rootStyle(), natural.hero);
      expect(contentSpan(box, rootStyle(), natural.hero)).toEqual({ left: 0, right: natural.hero });
    });

    it('in a pill that hugs it, the pill is as wide as the figure', async () => {
      await render(<PointsFigure count={1250} size="chip" testID="pts" />);
      // a pill row: padding 12 each side, a figure with no width of its own
      const [figure] = rowWidths(natural.chip, 0, [{ style: rootStyle(), content: natural.chip }]);
      expect(figure).toBe(natural.chip);
      expect(rootStyle().width).toBeUndefined();
    });

    it('at the end of M19\'s Studio card, the title block keeps the width the card leaves it, and the count is as wide as it is', async () => {
      await render(
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View testID="mark" style={{ width: 40 }} />
          <View testID="title" style={{ flex: 1 }} />
          <PointsFigure count={1250} size="chip" testID="pts" />
        </View>,
      );
      const [mark, title, figure] = rowWidths(W - 32, 12, [
        { style: styleOf(screen.getByTestId('mark')), content: 0 },
        { style: styleOf(screen.getByTestId('title')), content: 0 },
        { style: rootStyle(), content: natural.chip },
      ]);
      expect(mark).toBe(40);
      expect(figure).toBe(natural.chip);
      expect(title).toBe(W - 32 - 40 - natural.chip - 24);
      expect(title).toBeGreaterThan(150);
    });

    it('in a card row with a title beside it, the title is not squeezed whatever the title\'s width', async () => {
      await render(
        <View style={{ flexDirection: 'row' }}>
          <View testID="title" style={{ flex: 1 }} />
          <PointsFigure count={1250000} size="hero" testID="pts" />
        </View>,
      );
      for (const row of [260, 300, 358]) {
        const [title, figure] = rowWidths(row, 0, [
          { style: styleOf(screen.getByTestId('title')), content: 0 },
          { style: rootStyle(), content: natural.hero },
        ]);
        expect(figure).toBe(natural.hero);
        expect(title).toBe(row - natural.hero);
      }
    });

    it('at the end of a key and value row (PT3), the value keeps its own width and the key keeps its', async () => {
      await render(<PointsFigure count={250} size="row" testID="pts" />);
      // the row size set at the board's size: a 15 star, 5, a 30 count, 5, a 50 word
      const value = 15 + 5 + 30 + 5 + 50;
      const [key, figure] = rowWidths(W, 0, [
        { style: { flexShrink: 0 }, content: 80 },
        { style: rootStyle(), content: value },
      ]);
      expect(figure).toBe(value);
      expect(key).toBe(80);
    });

    it.each([
      ['start', 'flex-start'],
      ['center', 'center'],
      ['end', 'flex-end'],
    ] as const)('fitted with "%s": the room is the parent\'s width, and the content sits at the %s of it whatever the parent aligns', async (align, justify) => {
      await render(<PointsFigure count={1250000} size="hero" fit={align} testID="pts" />);
      const room = rootStyle();
      expect(room).toMatchObject({ width: '100%', flexShrink: 1, minWidth: 0, flexDirection: 'row', justifyContent: justify });
      for (const alignItems of ['stretch', 'center', 'flex-end', 'flex-start'] as const) {
        // a percent width is the parent's whole width, so the parent's alignment moves nothing
        const box = inColumn(W, alignItems, room, natural.hero);
        expect(box).toEqual({ left: 0, width: W });
        const span = contentSpan(box, room, natural.hero);
        if (align === 'start') expect(span.left).toBe(0);
        if (align === 'center') expect(span.left).toBeCloseTo((W - natural.hero) / 2, 9);
        if (align === 'end') expect(span.right).toBe(W);
      }
    });

    it('fitted with true is fitted to the start', async () => {
      await render(<PointsFigure count={1250000} size="hero" fit testID="pts" />);
      expect(rootStyle()).toMatchObject({ justifyContent: 'flex-start', width: '100%' });
    });

    it('fitted, it is the parent\'s width and no more: beside PT5\'s "Buy points" it takes the column\'s and leaves the button its own', async () => {
      await render(
        <View style={{ flexDirection: 'row' }}>
          <View testID="column" style={{ flex: 1 }}>
            <PointsFigure count={123456789} size="hero" fit testID="pts" />
          </View>
          <View testID="buy" style={{ width: 120 }} />
        </View>,
      );
      const [column, buy] = rowWidths(W, 0, [
        { style: styleOf(screen.getByTestId('column')), content: 0 },
        { style: styleOf(screen.getByTestId('buy')), content: 0 },
      ]);
      expect(buy).toBe(120);
      expect(column).toBe(W - 120);
      // and the figure's room is that column, as a percent of it
      expect(inColumn(column, 'stretch', rootStyle(), natural.hero).width).toBe(column);
    });
  });

  describe.each(['ios', 'web'] as const)('on %s: the figure measures itself and fits the room', (os) => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', os);
    });
    const layout = (node: unknown, width: number) => fireEvent(node as never, 'layout', { nativeEvent: { layout: { width, height: 26 } } });
    const sizeOf = (text: string) => styleOf(screen.getByText(text)).fontSize as number;
    const room = () => screen.getByTestId('pts');
    const row = () => screen.getByTestId('pts-row');
    const copyOf = (part: 'count' | 'word') => screen.getByTestId(`pts-measure-${part}`, hidden);
    /** The three numbers the figure is made from: the copies' natural widths (hero: the count 120 wide, the word 45) and the room. */
    const measure = async (count: number, word: number, roomWidth: number) => {
      await layout(copyOf('count'), count);
      await layout(copyOf('word'), word);
      await layout(room(), roomWidth);
    };

    it('draws full size and invisible until it is measured, then shrinks the count and the word to the room it is given', async () => {
      await render(<PointsFigure count={1250000} size="hero" fit testID="pts" />);
      expect(sizeOf('1,250,000')).toBe(22);
      expect(styleOf(row()).opacity).toBe(0);
      expect(screen.getByText('1,250,000').props.numberOfLines).toBe(1);
      // two of the three are not enough
      await layout(copyOf('count'), 120);
      await layout(room(), 150);
      expect(styleOf(row()).opacity).toBe(0);
      await layout(copyOf('word'), 45);
      expect(styleOf(row()).opacity).toBeUndefined();
      expect(sizeOf('1,250,000')).toBeCloseTo(22 * (118 / 165), 6);
      expect(styleOf(screen.getByText('points')).fontSize).toBeCloseTo(18 * (118 / 165), 6);
      expect(styleOf(screen.getByText('1,250,000')).lineHeight).toBe(Math.round(22 * (118 / 165) * 1.2));
      expect(screen.getByLabelText('1,250,000 points')).toBeTruthy();
      expect(screen.getByTestId('icon-Sparkles', hidden)).toBeTruthy();
      expect(screen.queryByTestId('pts-stack')).toBeNull();
      await layout(room(), 200);
      expect(sizeOf('1,250,000')).toBe(22);
    });

    it('keeps the copies out of the layout, invisible and away from screen readers, at the board\'s size whatever is drawn', async () => {
      await render(<PointsFigure count={1250000} size="hero" fit testID="pts" />);
      await measure(120, 45, 150);
      for (const part of ['count', 'word'] as const) {
        const copy = copyOf(part);
        expect(styleOf(copy).position).toBe('absolute');
        const box = copy.parent as never;
        expect(styleOf(box)).toMatchObject({ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, flexDirection: 'row' });
        expect(screen.getByTestId('pts-measure-count', hidden).parent?.props.importantForAccessibility).toBe('no-hide-descendants');
        expect((box as { props: { accessibilityElementsHidden?: boolean } }).props.accessibilityElementsHidden).toBe(true);
      }
      expect(styleOf(copyOf('count')).fontSize).toBe(22);
      expect(styleOf(copyOf('word')).fontSize).toBe(18);
      // a reader finds the figure once, with its label, and the copies are not found by text
      expect(screen.getAllByText('1,250,000')).toHaveLength(1);
      expect(screen.getAllByLabelText('1,250,000 points')).toHaveLength(1);
    });

    it('stays put when it is measured again, and grows back when the room does', async () => {
      await render(<PointsFigure count={1250000} size="hero" fit testID="pts" />);
      await measure(120, 45, 150);
      const small = sizeOf('1,250,000');
      // the same readings again change nothing, and what is drawn is never read back (the copies are at the board's size)
      await measure(120, 45, 150);
      expect(sizeOf('1,250,000')).toBe(small);
      expect(styleOf(copyOf('count')).fontSize).toBe(22);
      await layout(room(), 182);
      expect(sizeOf('1,250,000')).toBeCloseTo(22 * (150 / 165), 6);
      await layout(room(), 200);
      expect(sizeOf('1,250,000')).toBe(22);
      await layout(room(), 150);
      expect(sizeOf('1,250,000')).toBe(small);
    });

    it('fits a nine digit count into 150 px on one line, above the floor', async () => {
      await render(<PointsFigure count={123456789} size="hero" fit testID="pts" />);
      await measure(142, 45, 150);
      const share = sizeOf('123,456,789') / 22;
      expect(sizeOf('123,456,789')).toBeGreaterThan(11);
      expect(share).toBeLessThan(1);
      expect(30 + (142 + 45) * share).toBeLessThanOrEqual(150);
      expect(screen.queryByTestId('pts-stack')).toBeNull();
    });

    it('moves the word under the count where one line would go under the floor, and the count keeps every digit', async () => {
      await render(<PointsFigure count={123456789012} size="hero" fit testID="pts" />);
      await measure(200, 45, 130);
      // the floors alone take 200 * 0.5 + 45 * 0.556 = 125 of the 98 a line has at 130, so the word goes under the count
      const stack = screen.getByTestId('pts-stack');
      expect(within(stack).getByText('123,456,789,012')).toBeTruthy();
      expect(within(stack).getByText('points')).toBeTruthy();
      expect(within(screen.getByTestId('pts-row')).getByTestId('icon-Sparkles', hidden)).toBeTruthy();
      expect(within(stack).queryByTestId('icon-Sparkles', hidden)).toBeNull();
      const size = sizeOf('123,456,789,012');
      expect(size).toBeCloseTo(22 * ((130 - 25 - 2) / 200), 6);
      expect(size).toBeGreaterThanOrEqual(11);
      // the count fits beside the star (20 + 5), whole, with no ellipsis to read it by
      expect(25 + (200 * size) / 22).toBeLessThanOrEqual(130);
      for (const node of [screen.getByText('123,456,789,012'), screen.getByText('points')]) {
        expect(node.props.ellipsizeMode).toBeUndefined();
        expect(node.props.adjustsFontSizeToFit).toBeUndefined();
      }
      // the word is set as it is beside the count, only smaller with it (and never under 10 px)
      expect(styleOf(screen.getByText('points')).fontSize).toBeCloseTo(Math.max(10, 18 * ((130 - 25 - 2) / 200)), 6);
      expect(screen.getByLabelText('123,456,789,012 points')).toBeTruthy();
      // and back to one line when the room is there again
      await layout(room(), 280);
      expect(screen.queryByTestId('pts-stack')).toBeNull();
      expect(sizeOf('123,456,789,012')).toBe(22);
    });

    it('stacks 9 digits in 120 px and 12 digits in 150 px, the two the lead named, never below the room', async () => {
      await render(<PointsFigure count={123456789} size="hero" fit testID="pts" />);
      await measure(142, 45, 120);
      expect(screen.getByTestId('pts-stack')).toBeTruthy();
      expect(25 + 142 * (sizeOf('123,456,789') / 22)).toBeLessThanOrEqual(120);
      expect(sizeOf('123,456,789')).toBeGreaterThanOrEqual(11);
    });

    it('breaks a count that cannot fit at 11 px between its digit groups, never inside one and never with an ellipsis', async () => {
      await render(<PointsFigure count={123456789012} size="chip" fit testID="pts" />);
      // the chip is the star and the count: 14 + 4 of star and gap, 120 of count
      await layout(copyOf('count'), 120);
      await layout(room(), 400);
      expect(sizeOf('123,456,789,012')).toBe(13.5);
      await layout(room(), 60);
      // 60 - 18 - 2 = 40 of 120: under the floor, so 11 px and groups
      const groups = screen.getByTestId('pts-groups');
      const parts = within(groups).getAllByText(/\d/);
      expect(parts.map((node) => (node.props as { children: string }).children)).toEqual(['123,', '456,', '789,', '012']);
      for (const node of parts) {
        expect(styleOf(node).fontSize).toBe(11);
        expect(node.props.ellipsizeMode).toBeUndefined();
        expect(node.props.numberOfLines).toBe(1);
      }
      expect(styleOf(groups)).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap' });
      expect(screen.getByLabelText('123,456,789,012 points')).toBeTruthy();
      await layout(room(), 10);
      expect(within(screen.getByTestId('pts-groups')).getAllByText(/\d/)).toHaveLength(4);
      await layout(room(), 400);
      expect(screen.queryByTestId('pts-groups')).toBeNull();
      expect(sizeOf('123,456,789,012')).toBe(13.5);
    });

    it('keeps the fit it had while a new count is read: never a blank frame, and it grows back once the new copy is read', async () => {
      const { rerender } = await render(<PointsFigure count={1250000} size="hero" fit testID="pts" />);
      // before the first reading nothing shows
      expect(styleOf(row()).opacity).toBe(0);
      await measure(120, 45, 150);
      const small = sizeOf('1,250,000');
      expect(small).toBeLessThan(22);
      expect(styleOf(row()).opacity).toBeUndefined();
      // a new count of the same width: the very next frame is drawn, at the same size, with no hidden frame between
      await rerender(<PointsFigure count={1250001} size="hero" fit testID="pts" />);
      expect(styleOf(row()).opacity).toBeUndefined();
      expect(sizeOf('1,250,001')).toBe(small);
      await layout(copyOf('count'), 120);
      expect(styleOf(row()).opacity).toBeUndefined();
      expect(sizeOf('1,250,001')).toBe(small);
      // a shorter count is drawn at once at the fit it had, then at full size when its own copy has been read
      await rerender(<PointsFigure count={1240} size="hero" fit testID="pts" />);
      expect(styleOf(row()).opacity).toBeUndefined();
      expect(sizeOf('1,240')).toBe(small);
      await layout(copyOf('count'), 45);
      expect(styleOf(row()).opacity).toBeUndefined();
      expect(sizeOf('1,240')).toBe(22);
    });

    it('is drawn at every step of a count that ticks, and a tick of the same width changes nothing it draws', async () => {
      const opacities: unknown[] = [];
      let commits = 0;
      const { rerender } = await render(
        <Profiler id="fig" onRender={() => (commits += 1)}>
          <PointsFigure count={123456789} size="hero" fit testID="pts" />
        </Profiler>,
      );
      await measure(142, 45, 150);
      const settled = sizeOf('123,456,789');
      const stacked = screen.queryByTestId('pts-stack') !== null;
      for (let n = 123456790; n < 123456800; n++) {
        await rerender(
          <Profiler id="fig" onRender={() => (commits += 1)}>
            <PointsFigure count={n} size="hero" fit testID="pts" />
          </Profiler>,
        );
        opacities.push(styleOf(row()).opacity);
        // the new text's copy reports the same width as the old one's: the fit is the same, so nothing below can move
        await layout(copyOf('count'), 142);
        opacities.push(styleOf(row()).opacity);
        expect(sizeOf(formatPointsCount(n))).toBe(settled);
        expect(screen.queryByTestId('pts-stack') !== null).toBe(stacked);
      }
      expect(opacities.every((value) => value === undefined)).toBe(true);
      // one render for the new count and none for the reading of the same width
      const before = commits;
      await layout(copyOf('count'), 142);
      expect(commits).toBe(before);
    });

    it('reads a new text again even when it is as wide as the old one', async () => {
      const { rerender } = await render(<PointsFigure count={1250} size="chip" fit testID="pts" />);
      const first = copyOf('count');
      await rerender(<PointsFigure count={1240} size="chip" fit testID="pts" />);
      // a new copy is mounted for a new text, so its first layout is always reported
      expect(copyOf('count')).not.toBe(first);
    });

    it('has no cap to hit: every reading changes the answer by the room alone', async () => {
      let commits = 0;
      await render(
        <Profiler id="fig" onRender={() => (commits += 1)}>
          <PointsFigure count={1250000} size="hero" fit testID="pts" />
        </Profiler>,
      );
      await measure(120, 45, 150);
      // the first repeat is rendered once and dropped by React (it sees no change); after that the figure is quiet
      await measure(120, 45, 150);
      const settled = commits;
      const size = sizeOf('1,250,000');
      for (let i = 0; i < 40; i++) await measure(120, 45, 150);
      expect(commits).toBe(settled);
      expect(sizeOf('1,250,000')).toBe(size);
      // a new room is a fresh answer, in one render
      await layout(room(), 182);
      expect(commits).toBe(settled + 1);
    });
  });

  describe('settles', () => {
    /** A stand-in layout engine. Digits are 0.6 em, commas 0.3, the word 3 em; the hero star is 20 and each gap 5. */
    const em = (text: string) => [...text].reduce((sum, ch) => sum + (ch === ',' ? 0.3 : 0.6), 0);
    const rooms: number[] = [];
    for (let w = 100; w <= 260; w += 0.5) rooms.push(w);

    const sweep = async (size: PointsFigureSize, count: number, step: number) => {
      let commits = 0;
      await render(
        <Profiler id="fig" onRender={() => (commits += 1)}>
          <PointsFigure count={count} size={size} fit testID="pts" />
        </Profiler>,
      );
      const shown = formatPointsCount(count);
      const m = pointsFigureMetrics[size];
      const send = (node: unknown, width: number) => fireEvent(node as never, 'layout', { nativeEvent: { layout: { width, height: 26 } } });
      // first paint: nothing is seen, at the board's size, before the three widths are known
      const firstOpacity = styleOf(screen.getByTestId('pts-row')).opacity;
      expect(firstOpacity).toBe(0);
      await send(screen.getByTestId('pts-measure-count', hidden), em(shown) * m.number);
      if (m.showWord) await send(screen.getByTestId('pts-measure-word', hidden), 3 * m.word);
      const worst = { renders: 0, overflow: -Infinity, texts: Infinity };
      let walked = 0;
      for (const room of rooms) {
        if (walked++ % step !== 0) continue;
        const before = commits;
        await send(screen.getByTestId('pts'), room);
        worst.renders = Math.max(worst.renders, commits - before);
        // what the stand-in engine draws now: the texts at the sizes the figure chose
        const row = screen.getByTestId('pts-row');
        expect(styleOf(row).opacity).toBeUndefined();
        const countNodes = screen.queryByTestId('pts-groups') !== null ? within(screen.getByTestId('pts-groups')).getAllByText(/\d/) : [screen.getByText(shown)];
        const countW = countNodes.reduce((sum, node) => sum + em((node.props as { children: string }).children) * (styleOf(node).fontSize as number), 0);
        const wordW = m.showWord ? 3 * (styleOf(screen.getByText(/^points?$/)).fontSize as number) : 0;
        const stacked = screen.queryByTestId('pts-stack') !== null;
        const broken = screen.queryByTestId('pts-groups') !== null;
        // a broken count wraps to the room, so only the one-line and the stacked figures have a width to compare
        if (!broken) {
          const used = stacked ? m.icon + m.iconToNumber + Math.max(countW, wordW) : (m.showIcon ? m.icon : 0) + (m.showIcon ? m.iconToNumber : 0) + countW + (m.showWord ? m.iconToNumber + wordW : 0);
          worst.overflow = Math.max(worst.overflow, used - room);
        }
        worst.texts = Math.min(worst.texts, styleOf(countNodes[0]).fontSize as number);
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
      ['hero', 123456789012345],
      ['row', 1250000],
      ['row', 123456789],
      ['chip', 123456789],
    ] as const)('%s %i: every room from 100 to 260 in half pixels is one render and fits, never under the floor', async (size, count) => {
      const worst = await sweep(size, count, 1);
      expect(worst.renders).toBeLessThanOrEqual(1);
      expect(worst.overflow).toBeLessThanOrEqual(0);
      expect(worst.texts).toBeGreaterThanOrEqual(Math.min(pointsFigureMetrics[size].number, 11) - 1e-9);
    }, 120000);

    it.each([
      ['line', 123456789],
      ['hero', 12500],
      ['hero', 1250000],
      ['hero', 123456789012],
      ['row', 1250000],
    ] as const)('%s %i: and whole-pixel rooms, as React Native Web reports them, are one render each too', async (size, count) => {
      const worst = await sweep(size, count, 2);
      expect(worst.renders).toBeLessThanOrEqual(1);
      expect(worst.overflow).toBeLessThanOrEqual(0);
    }, 120000);
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
    // the hero at 9, 12 and 15 digits in 120, 150, 182 and 200 px, and the Studio chip at the same counts in 120 and 150
    expect(routed.getAllByLabelText('123,456,789 points')).toHaveLength(6);
    expect(routed.getAllByLabelText('123,456,789,012 points')).toHaveLength(6);
    expect(routed.getAllByLabelText('123,456,789,012,345 points')).toHaveLength(6);
    expect(routed.getByText('12 digits in 120 px')).toBeTruthy();
    expect(routed.getByText('9 digits in 150 px')).toBeTruthy();
    expect(routed.getByText('Studio count, 15 digits in 120 px')).toBeTruthy();
    expect(styleOf(routed.getByTestId('points-fit-7-182').parent as never).width).toBe(182);
    // the places: a hugging figure has no width of its own wherever the boards put it, and only PT5's balance is fitted
    for (const place of ['studio', 'kv', 'center', 'end', 'pill']) {
      expect(styleOf(routed.getByTestId(`points-place-${place}`)).width).toBeUndefined();
    }
    expect(styleOf(routed.getByTestId('points-place-balance')).width).toBe('100%');
    expect(routed.getByLabelText('98,765,432 points')).toBeTruthy();
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
