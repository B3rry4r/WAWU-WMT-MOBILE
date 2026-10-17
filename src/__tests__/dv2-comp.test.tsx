import { fireEvent, render, screen } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';
import { renderRouter, screen as routed } from 'expo-router/testing-library';
import { ActivityIndicator, Pressable, Text as NativeText, View } from 'react-native';

import PointsFigurePreview from '@/app/preview/points-figure';
import ProductsMeterPreview from '@/app/preview/products-meter';
import TierBadgePreview from '@/app/preview/tier-badge';
import VoicePlayerPreview from '@/app/preview/voice-player';
import { formatPoints, formatPointsCount, PointsFigure } from '@/components/PointsFigure';
import { ProductsMeter, productsMeterCaption, productsMeterFill, productsMeterLine } from '@/components/ProductsMeter';
import { TierBadge, tierBadgeLabel } from '@/components/TierBadge';
import { barCountFor, playedBars, VoiceLabel, VoicePlayer, voiceClock } from '@/components/VoicePlayer';
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
});

describe('VoicePlayer', () => {
  const barsOf = () => screen.getByTestId('vp-wave').children.map((c) => styleOf(c).backgroundColor);

  it('idle: Play, the length, the Bio label and the small AI voice tag, with no bar played', async () => {
    await render(<VoicePlayer status="idle" durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(screen.getByLabelText('Play Bio, 0:22')).toBeTruthy();
    expect(screen.getByTestId('icon-Play', hidden)).toBeTruthy();
    expect(screen.getByText('0:22')).toBeTruthy();
    expect(screen.getByText('Bio')).toBeTruthy();
    expect(screen.getByText('AI voice')).toBeTruthy();
    const bars = barsOf();
    expect(bars).toHaveLength(26);
    expect(bars.every((c) => c === darkColors.borderStrong)).toBe(true);
  });

  it('playing: Pause, and the played bars take the accent', async () => {
    await render(<VoicePlayer status="playing" progress={12 / 26} durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(screen.getByLabelText('Pause Bio')).toBeTruthy();
    expect(screen.getByTestId('icon-Pause', hidden)).toBeTruthy();
    const bars = barsOf();
    expect(bars.filter((c) => c === darkColors.accent)).toHaveLength(12);
    expect(bars.filter((c) => c === darkColors.borderStrong)).toHaveLength(14);
    expect(screen.getByTestId('vp-wave').props.accessibilityValue.now).toBe(46);
  });

  it('paused part-way keeps its bars and shows Play', async () => {
    await render(<VoicePlayer status="idle" progress={0.5} durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(screen.getByTestId('icon-Play', hidden)).toBeTruthy();
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
    expect(screen.getByLabelText('Try again')).toBeTruthy();
    expect(screen.getByTestId('icon-RotateCcw', hidden)).toBeTruthy();
    expect(screen.queryByTestId('vp-wave')).toBeNull();
    expect(screen.queryByText('0:22')).toBeNull();
    await fireEvent.press(screen.getByTestId('vp-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    await rerender(<VoicePlayer status="error" durationSeconds={22} onToggle={onToggle} errorMessage="Try later." testID="vp" />);
    expect(screen.getByText('Try later.')).toBeTruthy();
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

  it('draws fewer, never thinner, bars on a narrow phone, and keeps the played share', async () => {
    expect([undefined, 0, 200, 100, 60, 10].map(barCountFor)).toEqual([26, 26, 26, 25, 15, 8]);
    await render(<VoicePlayer status="playing" progress={0.5} durationSeconds={22} onToggle={() => undefined} testID="vp" />);
    expect(barsOf()).toHaveLength(26);
    await fireEvent(screen.getByTestId('vp-wave'), 'layout', { nativeEvent: { layout: { width: 60, height: 26 } } });
    const bars = barsOf();
    expect(bars).toHaveLength(15);
    expect(bars.filter((c) => c === darkColors.accent)).toHaveLength(playedBars(0.5, 15));
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
    expect(routed.getByLabelText('1,250,000 points')).toBeTruthy();
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
