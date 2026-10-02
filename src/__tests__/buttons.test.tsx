import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { Button, type ButtonSize, type ButtonVariant } from '@/components/Button';
import { darkColors, lightColors } from '@/theme/tokens.generated';

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

const variants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'white', 'glass'];
const keyboard = { target: { matches: (q: string) => q === ':focus-visible' } };

/** "0 0 0 2px #F6F5F8, 0 0 0 3.5px #9411C9" as [gap colour, ring colour]. */
function ringColours(shadow: unknown): [string, string] {
  const [gap, ring] = String(shadow).split(/,\s(?=0 0 0)/);
  const colour = (layer: string) => layer.replace(/^0 0 0 [\d.]+px\s/, '');
  return [colour(gap), colour(ring)];
}

describe('button sizes follow the design kit (design/_gen/kit.js Btn: 34/14, 44/18, 54/24)', () => {
  it.each<[ButtonSize, number, number, number, number]>([
    ['sm', 34, 14, 13.5, 15],
    ['md', 44, 18, 14.5, 17],
    ['lg', 54, 24, 16, 19],
  ])('draws a %s button %i high with %i either side of the label, a %s label', async (size, height, padX, fontSize) => {
    await render(<Button label="Go" size={size} onPress={() => undefined} />);
    const button = flat(screen.getByRole('button', { name: 'Go' }).props.style);
    expect(button.height).toBe(height);
    expect(button.paddingHorizontal).toBe(padX);
    expect(flat(screen.getByText('Go').props.style).fontSize).toBe(fontSize);
  });

  it('puts 7 between a button icon and its label, as the kit does', async () => {
    await render(<Button label="Go" icon="Plus" onPress={() => undefined} />);
    const row = screen.getByText('Go').parent!;
    expect(flat(row.props.style).gap).toBe(7);
  });
});

describe('the keyboard focus ring on every button', () => {
  it.each(variants.flatMap((v) => (['dark', 'light'] as const).map((t) => [v, t] as const)))(
    'shows a keyboard user a ring on a %s button in %s mode that is set off from the button by a page-coloured gap',
    async (variant, scheme) => {
      mockScheme = scheme;
      const colors = scheme === 'dark' ? darkColors : lightColors;
      await render(<Button label="Go" variant={variant} onPress={() => undefined} />);
      const button = screen.getByRole('button', { name: 'Go' });
      expect(flat(button.props.style).boxShadow).toBeUndefined();
      await fireEvent(button, 'focus', keyboard);
      const style = flat(screen.getByRole('button', { name: 'Go' }).props.style);
      const [gap, ring] = ringColours(style.boxShadow);
      expect(gap).toBe(colors.surfacePage);
      expect(ring).toBe(colors.accentFg);
      expect(ring).not.toBe(gap);
      if (variant === 'primary') expect(gap).not.toBe(style.backgroundColor);
      await fireEvent(button, 'blur');
      expect(flat(screen.getByRole('button', { name: 'Go' }).props.style).boxShadow).toBeUndefined();
    },
  );

  it('keeps the ring visible on the filled accent button in light mode, where the accent ring alone is the button colour', async () => {
    mockScheme = 'light';
    expect(lightColors.accentFg).toBe(lightColors.accent);
    await render(<Button label="Go" onPress={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Go' });
    await fireEvent(button, 'focus', keyboard);
    const style = flat(screen.getByRole('button', { name: 'Go' }).props.style);
    expect(style.backgroundColor).toBe(lightColors.accent);
    const [gap] = ringColours(style.boxShadow);
    expect(gap).toBe(lightColors.surfacePage);
    expect(gap).not.toBe(lightColors.accent);
  });

  it('shows a mouse user no ring on the web, because a click is not keyboard focus', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<Button label="Go" onPress={() => undefined} />);
    await fireEvent(screen.getByRole('button', { name: 'Go' }), 'focus', { target: { matches: () => false } });
    expect(flat(screen.getByRole('button', { name: 'Go' }).props.style).boxShadow).toBeUndefined();
  });
});

describe('the browser outline on a focused button', () => {
  it('is switched off on the web, so only the designed ring shows', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<Button label="Go" onPress={() => undefined} />);
    await fireEvent(screen.getByRole('button', { name: 'Go' }), 'focus', keyboard);
    expect(flat(screen.getByRole('button', { name: 'Go' }).props.style)).toMatchObject({ outlineStyle: 'none', outlineWidth: 0 });
  });

  it('is left alone on a phone', async () => {
    await render(<Button label="Go" onPress={() => undefined} />);
    expect(flat(screen.getByRole('button', { name: 'Go' }).props.style).outlineStyle).toBeUndefined();
  });
});
