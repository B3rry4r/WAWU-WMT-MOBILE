import { render, screen } from '@testing-library/react-native';

import { BrandMark } from '@/components/BrandMark';
import { IconTile } from '@/components/IconTile';
import { Switch } from '@/components/Switch';
import { GroupTile, tileMetrics } from '@/features/communities/GroupTile';

/**
 * FIX-14 L2 (SWEEP-APP-1): react-native-web reads only `aria-hidden`, so a decorative tile that sets the two native props alone is still
 * read out on the web. Each draws the three, as Avatar does.
 */
const hidden = { includeHiddenElements: true };

describe('decorative tiles hide from the web too', () => {
  it('the icon tile, the switch and the group tile set aria-hidden beside the native props', async () => {
    await render(
      <>
        <IconTile icon="Users" />
        <Switch on />
        <GroupTile uri={null} size={tileMetrics.row} testID="tile" />
      </>,
    );
    const tile = screen.getByTestId('tile', hidden);
    expect(tile.props['aria-hidden']).toBe(true);
    expect(tile.props.accessibilityElementsHidden).toBe(true);
    expect(tile.props.importantForAccessibility).toBe('no-hide-descendants');
    const web: unknown[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(walk);
      const n = node as { props?: Record<string, unknown>; children?: unknown };
      if (n.props?.['aria-hidden'] === true && n.props.accessibilityElementsHidden === true) web.push(n);
      walk(n.children);
    };
    walk(screen.toJSON());
    // the icon tile, the switch and the group tile each hide for the web beside the native props
    expect(web.length).toBeGreaterThanOrEqual(3);
  });

  it('the brand mark hides only when it is decorative', async () => {
    await render(
      <>
        <BrandMark layout="submark" width={40} decorative testID="mark-decor" />
        <BrandMark layout="submark" width={40} testID="mark-named" />
      </>,
    );
    expect(screen.getByTestId('mark-decor', hidden).props['aria-hidden']).toBe(true);
    expect(screen.getByTestId('mark-named', hidden).props['aria-hidden']).toBeFalsy();
  });
});
