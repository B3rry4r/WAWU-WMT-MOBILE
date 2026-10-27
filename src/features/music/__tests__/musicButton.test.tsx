import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { createButtonMetrics } from '@/components/CreateButton';
import { layout } from '@/theme';

import { MusicLayer, musicHiddenOn, musicMetrics } from '../MusicButton';

/**
 * THEME-MUSIC (R-99): the round button above Create. The player and the route are stood in; the layer and the button
 * are the real ones.
 */
let mockPath = '/';
jest.mock('expo-router', () => ({ usePathname: () => mockPath }));

let mockCreator = false;
jest.mock('@/features/create/CreateEntry', () => ({ useIsCreator: () => mockCreator }));

let mockState = { on: false, busy: false, notice: null as string | null };
const mockToggle = jest.fn();
const mockResume = jest.fn();
const mockClear = jest.fn();
jest.mock('../themeMusic', () => ({
  useThemeMusic: () => mockState,
  toggleThemeMusic: () => mockToggle(),
  resumeThemeMusic: () => mockResume(),
  clearThemeNotice: () => mockClear(),
}));

const SIZE = layout.tapMin;
const place = () => StyleSheet.flatten(screen.getByTestId('music-button').props.style) as { right: number; bottom: number; width: number; height: number };

beforeEach(() => {
  mockPath = '/';
  mockCreator = false;
  mockState = { on: false, busy: false, notice: null };
  jest.clearAllMocks();
});

describe('the music button', () => {
  it('is a round play button that says "Play music" while the song is off', async () => {
    await render(<MusicLayer />);
    const button = screen.getByTestId('music-button');
    expect(button.props.accessibilityLabel).toBe('Play music');
    expect(button.props.accessibilityRole).toBe('button');
    expect(screen.getByTestId('icon-Play', { includeHiddenElements: true })).toBeTruthy();
    const { width, height } = place();
    expect([width, height]).toEqual([SIZE, SIZE]);
  });

  it('shows pause and says "Pause music" while the song is on', async () => {
    mockState = { on: true, busy: false, notice: null };
    await render(<MusicLayer />);
    expect(screen.getByTestId('music-button').props.accessibilityLabel).toBe('Pause music');
    expect(screen.getByTestId('icon-Pause', { includeHiddenElements: true })).toBeTruthy();
  });

  it('a tap flips the song', async () => {
    await render(<MusicLayer />);
    await fireEvent.press(screen.getByTestId('music-button'));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('shows it is working while the song downloads, and takes no tap meanwhile', async () => {
    mockState = { on: false, busy: true, notice: null };
    await render(<MusicLayer />);
    const button = screen.getByTestId('music-button');
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
    expect(screen.getByTestId('music-working')).toBeTruthy();
    await fireEvent.press(button);
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it('says so in a toast when the download failed, and the button stays on play', async () => {
    mockState = { on: false, busy: false, notice: 'Our theme song could not be downloaded.' };
    await render(<MusicLayer />);
    expect(screen.getByText('Our theme song could not be downloaded.')).toBeTruthy();
    expect(screen.getByTestId('music-button').props.accessibilityLabel).toBe('Play music');
  });

  it('asks the player to play again when the app opens, once, only when it draws', async () => {
    await render(<MusicLayer />);
    expect(mockResume).toHaveBeenCalledTimes(1);
  });
});

describe('where the button sits', () => {
  const create = createButtonMetrics;
  const centre = (p: { right: number; width: number }) => p.right + p.width / 2;

  it('for a creator it stands above Create on the same vertical line, with a gap', async () => {
    mockCreator = true;
    await render(<MusicLayer />);
    const p = place();
    expect(centre(p)).toBe(create.right + create.size / 2);
    expect(p.bottom).toBe(layout.tabbarH + create.bottom + create.size + musicMetrics.gap);
    expect(musicMetrics.gap).toBeGreaterThan(0);
  });

  it('for a member with no Create button it takes Create\'s place, on the same line', async () => {
    await render(<MusicLayer />);
    const p = place();
    expect(centre(p)).toBe(create.right + create.size / 2);
    // Centred in the slot Create would have filled.
    expect(p.bottom + SIZE / 2).toBe(layout.tabbarH + create.bottom + create.size / 2);
  });

  it('for a creator on a tab with no Create button (Wallet) it also takes Create\'s place', async () => {
    mockCreator = true;
    mockPath = '/wallet';
    await render(<MusicLayer />);
    expect(place().bottom + SIZE / 2).toBe(layout.tabbarH + create.bottom + create.size / 2);
  });

  it.each(['/', '/explore', '/me', '/wallet'])('is drawn on the tab %s', async (path) => {
    mockPath = path;
    await render(<MusicLayer />);
    expect(screen.queryByTestId('music-button')).toBeTruthy();
  });

  it.each([
    '/inbox',
    '/content/abc',
    '/chat/abc',
    '/paid-thread/abc',
    '/paid-questions/abc',
    '/community/abc',
    '/schools/courses/abc',
    '/schools',
    '/library/abc/lessons',
    '/library',
  ])('is not drawn where a person reads or talks: %s', async (path) => {
    mockPath = path;
    await render(<MusicLayer />);
    expect(screen.queryByTestId('music-button')).toBeNull();
    expect(mockResume).not.toHaveBeenCalled();
  });

  it('matches whole path segments, so a page that only starts with the same letters is not hidden', async () => {
    expect(musicHiddenOn('/content')).toBe(true);
    expect(musicHiddenOn('/contents')).toBe(false);
    expect(musicHiddenOn('/community/new')).toBe(true);
    expect(musicHiddenOn('/communityfoo')).toBe(false);
  });

  it('moves with the route', async () => {
    const view = await render(<MusicLayer />);
    expect(screen.queryByTestId('music-button')).toBeTruthy();
    mockPath = '/inbox';
    await act(async () => view.rerender(<MusicLayer />));
    expect(screen.queryByTestId('music-button')).toBeNull();
  });
});
