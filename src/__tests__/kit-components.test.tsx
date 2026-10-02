import { render, screen } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Platform } from 'react-native';

import { Avatar, hues, initialsOf } from '@/components/Avatar';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { amountTracking, Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { Showcase } from '@/features/showcase/Showcase';
import { canvasNormalLineHeight, text } from '@/theme';
import { darkColors, lightColors } from '@/theme/tokens.generated';

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

/** Avatars beside a name are hidden from screen readers, so tests look past that. */
const hidden = { includeHiddenElements: true } as const;

const themes = [
  ['dark', darkColors],
  ['light', lightColors],
] as const;

/** Alan Sans's vertical metrics, read from the font file the app ships (hhea ascender and descender over unitsPerEm). */
function alanSansMetrics(): { ascent: number; descent: number } {
  const ttf = readFileSync(join(__dirname, '../../assets/fonts/AlanSans-SemiBold.ttf'));
  const tables = ttf.readUInt16BE(4);
  const offsetOf = (tag: string) => {
    for (let i = 0; i < tables; i += 1) {
      const rec = 12 + i * 16;
      if (ttf.toString('latin1', rec, rec + 4) === tag) return ttf.readUInt32BE(rec + 8);
    }
    throw new Error(`no ${tag} table`);
  };
  const unitsPerEm = ttf.readUInt16BE(offsetOf('head') + 18);
  const hhea = offsetOf('hhea');
  return { ascent: ttf.readInt16BE(hhea + 4) / unitsPerEm, descent: -ttf.readInt16BE(hhea + 6) / unitsPerEm };
}

/**
 * The CSS line box of one line: every inline run is centred on its own line
 * height around its font's content area, all on one baseline, and the line box
 * spans the highest top to the lowest bottom (CSS 2.1, 10.8.1).
 */
type Run = { fontSize: number; lineHeight: number; ascent?: number; descent?: number };
function lineBox(runs: Run[]): number {
  const alan = alanSansMetrics();
  let top = 0;
  let bottom = 0;
  for (const { fontSize, lineHeight, ascent = alan.ascent, descent = alan.descent } of runs) {
    const halfLeading = (lineHeight - (ascent + descent) * fontSize) / 2;
    top = Math.max(top, ascent * fontSize + halfLeading);
    bottom = Math.max(bottom, descent * fontSize + halfLeading);
  }
  return top + bottom;
}

beforeEach(() => {
  mockScheme = 'dark';
});

describe('amount at the kit size, on the web', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'web');
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([40, 15.5, 14.5])('shows a user a %p px amount exactly that tall, kobo included, as the kit Amt draws it', async (size) => {
    await render(<Money minorUnits={2500075} size={size} testID="amount" />);
    const whole = flat(screen.getByTestId('amount').props.style);
    const sign = flat(screen.getByText('₦').props.style);
    const kobo = flat(screen.getByText('.75').props.style);
    const run = (s: Record<string, unknown>) => ({
      fontSize: Number(s.fontSize ?? whole.fontSize),
      lineHeight: Number(s.lineHeight ?? whole.lineHeight),
    });
    expect(whole.lineHeight).toBe(size);
    expect(kobo.lineHeight).toBeCloseTo(size * 0.72);
    expect(lineBox([run(whole), run(sign), run(kobo)])).toBeCloseTo(size, 5);
  });

  it('would have drawn a 40 px amount taller than 40 if the kobo kept the figure line height (the bug this fixes)', () => {
    expect(lineBox([{ fontSize: 40, lineHeight: 40 }, { fontSize: 28.8, lineHeight: 40 }])).toBeGreaterThan(43);
  });

  it('keeps the amount at its size when the platform font drawing the naira sign has other metrics', async () => {
    // DejaVu Sans, a common Linux fallback: hhea ascender 1901, descender 483 of 2048 units.
    const platform = { ascent: 1901 / 2048, descent: 483 / 2048 };
    await render(<Money minorUnits={2500075} size={40} testID="amount" />);
    const sign = flat(screen.getByText('₦').props.style);
    const kobo = flat(screen.getByText('.75').props.style);
    const runs: Run[] = [
      { fontSize: 40, lineHeight: 40 },
      { fontSize: 40, lineHeight: Number(sign.lineHeight), ...platform },
      { fontSize: Number(kobo.fontSize), lineHeight: Number(kobo.lineHeight) },
    ];
    expect(lineBox(runs)).toBeCloseTo(40, 5);
    expect(lineBox([runs[0], { ...runs[1], lineHeight: 40 }])).toBeGreaterThan(40);
  });

});

describe('amount at the kit size, on a phone', () => {
  afterEach(() => jest.restoreAllMocks());

  // One paragraph has one line height on native: iOS takes the first run's
  // paragraph style, Android the last line-height span. So only the outer Text
  // carries one, `size`, and no run inside it sets its own.
  it.each(['ios', 'android'] as const)('shows a user on %s an amount with one line height, the size, and none on the sign or kobo', async (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    await render(<Money minorUnits={2500075} size={40} testID="amount" />);
    expect(flat(screen.getByTestId('amount').props.style).lineHeight).toBe(40);
    const sign = flat(screen.getByText('₦').props.style);
    const kobo = flat(screen.getByText('.75').props.style);
    expect(sign).not.toHaveProperty('lineHeight');
    expect(sign.fontFamily).toBe('System');
    expect(kobo).not.toHaveProperty('lineHeight');
    expect(kobo.fontSize).toBeCloseTo(28.8);
  });

  it.each(['ios', 'android'] as const)('keeps a hidden balance on %s to the one outer line height', async (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    await render(<Money minorUnits={2500075} size={40} masked testID="hidden" />);
    expect(flat(screen.getByTestId('hidden').props.style).lineHeight).toBe(40);
    expect(flat(screen.getByText('₦').props.style)).not.toHaveProperty('lineHeight');
  });

  it('gives the sign its own kobo-sized line height on the web only, hidden balance included', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<Money minorUnits={2500075} size={40} masked testID="hidden" />);
    expect(flat(screen.getByText('₦').props.style).lineHeight).toBeCloseTo(28.8);
  });
});

describe('amount tracking', () => {
  it('tracks an amount at the kit -0.025em, not the -0.03em token', async () => {
    expect(amountTracking).toBe(-0.025);
    await render(<Money minorUnits={2500000} size={40} testID="amount" />);
    expect(flat(screen.getByTestId('amount').props.style).letterSpacing).toBeCloseTo(-1);
  });
});

describe('kit copy sizes', () => {
  const kit = {
    kvLabel: { fontSize: 14, fontFamily: 'AlanSans-Regular', tone: 'textSecondary' },
    kvValue: { fontSize: 14.5, fontFamily: 'AlanSans-SemiBold', tone: 'textPrimary' },
    meta: { fontSize: 13, fontFamily: 'AlanSans-Regular', tone: 'textMuted' },
    muted: { fontSize: 13.5, fontFamily: 'AlanSans-Regular', tone: 'textSecondary' },
    bannerBody: { fontSize: 13, fontFamily: 'AlanSans-Regular', tone: 'textSecondary' },
    cardTitle: { fontSize: 15, fontFamily: 'AlanSans-SemiBold', tone: 'textPrimary' },
    sheetTitle: { fontSize: 22, fontFamily: 'AlanSans-Bold', tone: 'textPrimary' },
    sheetTitleSm: { fontSize: 21, fontFamily: 'AlanSans-Bold', tone: 'textPrimary' },
    errorLine: { fontSize: 13, fontFamily: 'AlanSans-SemiBold', tone: 'danger' },
    linkStrong: { fontSize: 14, fontFamily: 'AlanSans-SemiBold', tone: 'accentFg' },
  } as const;

  describe.each(themes)('in %s', (scheme, colors) => {
    it.each(Object.entries(kit))('shows a user %s copy at the kit size, weight and colour', async (variant, want) => {
      mockScheme = scheme;
      await render(<Text variant={variant as keyof typeof kit}>Copy</Text>);
      const s = flat(screen.getByText('Copy').props.style);
      expect(s.fontSize).toBe(want.fontSize);
      expect(s.fontFamily).toBe(want.fontFamily);
      expect(s.color).toBe(colors[want.tone]);
    });
  });

  it('draws a sheet title at -0.03em tracking and 1.15 line height, and announces it as a heading', async () => {
    await render(
      <>
        <Text variant="sheetTitle">Unlocked</Text>
        <Text variant="sheetTitleSm">Enter your PIN</Text>
      </>,
    );
    expect(screen.getByRole('header', { name: 'Unlocked' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Enter your PIN' })).toBeTruthy();
    expect(text.sheetTitle.letterSpacing).toBeCloseTo(-0.66);
    expect(text.sheetTitle.lineHeight).toBe(22 * 1.15);
    expect(text.sheetTitleSm.lineHeight).toBe(21 * 1.15);
  });

  it('draws a banner body at 13 on a 1.45 line, 18.85 px exactly as CSS computes it, apart from meta on the canvas normal line, 17 px', () => {
    expect(text.bannerBody.lineHeight).toBe(13 * 1.45);
    expect(text.meta.lineHeight).toBe(17);
  });

  it('draws the inline error line (auth.js line 14) and the strong link (wallet.js line 81) untracked on the canvas normal line, 17 and 18 px', () => {
    expect(text.errorLine.letterSpacing).toBe(0);
    expect(text.errorLine.lineHeight).toBe(17);
    expect(text.linkStrong.letterSpacing).toBe(0);
    expect(text.linkStrong.lineHeight).toBe(18);
  });

  it('puts every kit variant on line-height normal on the canvas line: kvLabel 18, kvValue 18, meta 17, cardTitle 20, errorLine 17, linkStrong 18', () => {
    expect(text.kvLabel.lineHeight).toBe(18);
    expect(text.kvValue.lineHeight).toBe(18);
    expect(text.meta.lineHeight).toBe(17);
    expect(text.cardTitle.lineHeight).toBe(20);
    expect(text.errorLine.lineHeight).toBe(17);
    expect(text.linkStrong.lineHeight).toBe(18);
  });

  it('gives the canvas line for `line-height: normal`: Alan Sans ascent and descent, each rounded (17 at 13.5, 18 at 14.5)', () => {
    expect(canvasNormalLineHeight(13.5)).toBe(17);
    expect(canvasNormalLineHeight(14.5)).toBe(18);
    expect(canvasNormalLineHeight(13)).toBe(17);
    expect(canvasNormalLineHeight(15)).toBe(20);
  });

  it('keeps muted copy apart from secondary: same size and colour, taller line (1.45 against 1.4)', () => {
    expect(text.muted.fontSize).toBe(text.secondary.fontSize);
    expect(Number(text.muted.lineHeight)).toBeGreaterThan(Number(text.secondary.lineHeight));
  });
});

describe('avatars', () => {
  it('shows a user the first letters of up to two names, and W with no name', () => {
    expect(initialsOf('Chidinma Okoro')).toBe('CO');
    expect(initialsOf('Chidinma Adaeze Okoro')).toBe('CA');
    expect(initialsOf('Tife')).toBe('T');
    expect(initialsOf('  Femi   Bello ')).toBe('FB');
    expect(initialsOf()).toBe('W');
  });

  describe.each(themes)('in %s', (scheme, colors) => {
    it('shows a user initials in dark text on the hue, sized from the avatar', async () => {
      mockScheme = scheme;
      await render(<Avatar testID="av" name="Chidinma Okoro" hue="coral" size={64} />);
      const circle = flat(screen.getByTestId('av', hidden).props.style);
      expect(circle).toMatchObject({ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.hueCoral });
      const letters = flat(screen.getByText('CO', hidden).props.style);
      expect(letters).toMatchObject({ fontSize: 23, fontFamily: 'AlanSans-Bold', color: colors.textOnLight });
      expect(letters.letterSpacing).toBeCloseTo(-0.46);
    });

    it('shows a user every hue from the theme tokens', async () => {
      mockScheme = scheme;
      await render(
        <>
          {hues.map((h) => (
            <Avatar key={h} testID={`av-${h}`} name="A B" hue={h} />
          ))}
        </>,
      );
      const used = hues.map((h) => flat(screen.getByTestId(`av-${h}`, hidden).props.style).backgroundColor);
      expect(used).toEqual([colors.hueLilac, colors.hueLemon, colors.hueGreen, colors.hueSky, colors.huePink, colors.hueCoral, colors.hueSand]);
    });
  });

  it('shows a user the photo instead of initials when there is one', async () => {
    await render(<Avatar testID="av" name="Tife Ade" source="https://example.test/tife.jpg" />);
    expect(screen.getByTestId('av-image')).toBeTruthy();
    expect(screen.queryByText('TA')).toBeNull();
    expect(screen.getByRole('image', { name: 'Tife Ade' })).toBeTruthy();
  });

  it('keeps a screen reader from reading initials twice beside a name, at the kit default size of 44', async () => {
    await render(<Avatar testID="av" name="Tife Ade" decorative />);
    expect(screen.queryByText('TA')).toBeNull();
    expect(flat(screen.getByTestId('av', hidden).props.style).width).toBe(44);
  });
});

describe('currency flags', () => {
  describe.each(themes)('in %s', (scheme, colors) => {
    it('shows a user each currency coin in its kit colour with a white sign', async () => {
      mockScheme = scheme;
      await render(
        <>
          <CurrencyFlag testID="ngn" currency="NGN" />
          <CurrencyFlag testID="usd" currency="USD" size={40} />
          <CurrencyFlag testID="usdt" currency="USDT" size={40} />
          <CurrencyFlag testID="btc" currency="BTC" size={26} />
        </>,
      );
      const bg = (id: string) => flat(screen.getByTestId(id).props.style).backgroundColor;
      expect([bg('ngn'), bg('usd'), bg('usdt'), bg('btc')]).toEqual([colors.curNgn, colors.curUsd, colors.curUsdt, colors.curBtc]);
      const naira = flat(screen.getByText('₦').props.style);
      expect(naira).toMatchObject({ color: colors.textOnAccent, fontWeight: '700' });
      expect(naira.fontSize).toBeCloseTo(36 * 0.46);
      expect(flat(screen.getByTestId('ngn').props.style)).toMatchObject({ width: 36, height: 36, borderRadius: 18 });
      expect(flat(screen.getByText('$').props.style)).toMatchObject({ fontFamily: 'AlanSans-Bold' });
      expect(flat(screen.getByText('₿').props.style).fontSize).toBeCloseTo(26 * 0.46);
    });
  });

  it('names the currency to a screen reader', async () => {
    await render(<CurrencyFlag currency="NGN" />);
    expect(screen.getByRole('image', { name: 'Naira' })).toBeTruthy();
  });
});

describe('showcase', () => {
  it.each(['dark', 'light'] as const)('lets a developer see the avatars, flags and kit copy on one page in %s', async (scheme) => {
    mockScheme = scheme;
    await render(<Showcase />);
    expect(screen.getByTestId('sample-avatar', hidden)).toBeTruthy();
    expect(screen.getByTestId('sample-flag')).toBeTruthy();
    expect(screen.getByText('sheetTitle: Who made this')).toBeTruthy();
    expect(screen.getByText('kvLabel: Who made this')).toBeTruthy();
  });
});
