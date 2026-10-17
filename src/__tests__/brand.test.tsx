import { render, screen } from '@testing-library/react-native';

import { Avatar } from '@/components/Avatar';
import { APP_NAME, BrandMark } from '@/components/BrandMark';
import { darkColors } from '@/theme/tokens.generated';

import appConfig from '../../app.json';

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));
beforeEach(() => {
  mockScheme = 'dark';
});

const hiddenOk = { includeHiddenElements: true };
const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
/** expo-image's test build hands the source on as a one-item list. */
const sourceOf = (testID: string) => [screen.getByTestId(`${testID}-art`, hiddenOk).props.source].flat()[0] as unknown;

describe('Brand (R-37)', () => {
  it('names the app Who Made This?, with no WAWU in the launcher name', async () => {
    expect(APP_NAME).toBe('Who Made This?');
    expect(appConfig.expo.name).toBe(APP_NAME);
    expect(appConfig.expo.name).not.toMatch(/wawu/i);
  });

  it('draws the ink artwork on a light surface and the white artwork on a dark one', async () => {
    mockScheme = 'light';
    const { unmount } = await render(<BrandMark layout="horizontal" width={120} testID="mark" />);
    expect(sourceOf('mark')).toEqual(require('../../assets/brand/horizontal-ink.png'));
    await unmount();

    mockScheme = 'dark';
    await render(<BrandMark layout="horizontal" width={120} testID="mark" />);
    expect(sourceOf('mark')).toEqual(require('../../assets/brand/horizontal-white.png'));
  });

  it('uses the sticker submark on dark and the plain submark on light', async () => {
    await render(<BrandMark width={34} testID="mark" />);
    expect(sourceOf('mark')).toEqual(require('../../assets/brand/submark-sticker.png'));
  });

  it('lets a white surface (the receipt) force the ink artwork in the dark theme', async () => {
    await render(<BrandMark layout="horizontal" width={120} surface="light" testID="mark" />);
    expect(sourceOf('mark')).toEqual(require('../../assets/brand/horizontal-ink.png'));
  });

  it('keeps the artwork proportions from the width', async () => {
    await render(<BrandMark layout="horizontal" width={1009 / 4} testID="mark" />);
    const box = flat(screen.getByTestId('mark', hiddenOk).props.style);
    expect(box.width).toBeCloseTo(252.25);
    expect(box.height).toBeCloseTo(295 / 4);
  });

  it('is read as the app name when it stands alone, and hidden when decorative', async () => {
    const { unmount } = await render(<BrandMark width={64} testID="mark" />);
    expect(screen.getByLabelText(APP_NAME)).toBeTruthy();
    expect(screen.getByRole('image')).toBeTruthy();
    await unmount();

    await render(<BrandMark width={34} decorative testID="mark" />);
    expect(screen.queryByLabelText(APP_NAME)).toBeNull();
    expect(screen.getByTestId('mark', hiddenOk).props.accessibilityElementsHidden).toBe(true);
  });

  it('shows the app as its own correspondent with the submark on the sunken surface, read as the app name', async () => {
    await render(<Avatar brand size={52} testID="sys" />);
    const circle = screen.getByLabelText(APP_NAME);
    expect(flat(circle.props.style).backgroundColor).toBe(darkColors.surfaceSunken);
    expect(flat(screen.getByTestId('sys-brand', hiddenOk).props.style).width).toBe(30);
    expect(screen.queryByText('W')).toBeNull();
  });
});
