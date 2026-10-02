import { render, screen } from '@testing-library/react-native';

import { Icon, MISSING, VerifiedTick, brands, icons, type IconName } from '../index';

describe('Icon', () => {
  it('has every icon the canvas names', () => {
    expect(Object.keys(icons).length).toBeGreaterThan(150);
    expect(Object.keys(brands)).toEqual(['Facebook', 'Instagram']);
    expect(MISSING).toEqual([]);
  });

  it('draws the Facebook and Instagram marks', async () => {
    await render(<Icon name="Instagram" size={20} color="#9411C9" />);
    expect(screen.getByTestId('icon-Instagram', { includeHiddenElements: true })).toBeTruthy();
  });

  it('renders every canvas icon with the board kit stroke', async () => {
    for (const n of Object.keys(icons) as IconName[]) {
      await render(<Icon name={n} size={20} color="#9411C9" />);
      expect(screen.getByTestId(`icon-${n}`, { includeHiddenElements: true }).props.strokeWidth).toBe(1.8);
    }
  });

  it('is labelled for screen readers when given a label', async () => {
    await render(<Icon name="ScanFace" size={24} color="#9411C9" accessibilityLabel="Use Face ID" />);
    expect(screen.getByLabelText('Use Face ID')).toBeTruthy();
  });

  it('is hidden from screen readers when decorative', async () => {
    await render(<Icon name="Wallet" size={24} color="#9411C9" />);
    expect(screen.queryByTestId('icon-Wallet')).toBeNull();
  });

  it('draws creator and professional ticks', async () => {
    await render(<VerifiedTick kind="pro" />);
    expect(screen.getByTestId('tick-pro')).toBeTruthy();
  });
});
