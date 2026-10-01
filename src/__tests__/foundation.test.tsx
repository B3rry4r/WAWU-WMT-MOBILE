import { render, screen } from '@testing-library/react-native';

import Boot from '@/app/index';
import { api } from '@/api/client';
import { darkColors, lightColors } from '@/theme/tokens.generated';

describe('design tokens', () => {
  it('carry the same token names in both themes', () => {
    expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
  });

  it('use WAWU Purple as the accent in both themes', () => {
    expect(darkColors.accent).toBe('#9411C9');
    expect(lightColors.accent).toBe('#9411C9');
  });
});

describe('boot screen', () => {
  it('shows the wordmark', async () => {
    await render(<Boot />);
    expect(screen.getByRole('header')).toBeTruthy();
    expect(screen.getByText('WAWU')).toBeTruthy();
  });
});

describe('api client', () => {
  it('is typed against the generated contract', () => {
    expect(typeof api.GET).toBe('function');
  });
});
