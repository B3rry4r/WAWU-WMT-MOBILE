import { __iconData as badgeCheck } from 'lucide-react-native/icons/badge-check';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useWawu } from '@/theme';

import { brands, icons, type BrandName, type IconName } from './icons.generated';

/**
 * Every icon in the app: Lucide (latest), called by the names the canvas uses,
 * drawn the way the board kit draws them (design/_gen/kit.js `I()`): round caps
 * and joins, a 1.8 stroke unless the artboard says otherwise (buttons 2.2, the
 * FAB 2.4, the active tab 2.2 with a tinted fill). Pass the size, stroke and
 * fill the artboard's source uses. Facebook and Instagram, which Lucide no
 * longer ships, are the official filled marks from Simple Icons, drawn in
 * Lucide's 2px inset so they sit at the same visual size.
 */
export const ICON_STROKE = { default: 1.8, button: 2.2, activeTab: 2.2, fab: 2.4 } as const;

type Props = {
  name: IconName;
  size: number;
  color: string;
  strokeWidth?: number;
  /** The kit's `fill` argument. Most icons are outlines (`none`). */
  fill?: string;
  accessibilityLabel?: string;
};

export function Icon({ name, size, color, strokeWidth = ICON_STROKE.default, fill = 'none', accessibilityLabel }: Props) {
  const glyph =
    name in brands ? (
      <Svg width={size} height={size} viewBox="-2 -2 28 28" testID={`icon-${name}`}>
        <Path d={brands[name as BrandName].path} fill={color} />
      </Svg>
    ) : (
      (() => {
        const Glyph = icons[name as keyof typeof icons];
        return <Glyph size={size} color={color} strokeWidth={strokeWidth} fill={fill} testID={`icon-${name}`} />;
      })()
    );
  if (!accessibilityLabel) {
    // Decorative: hidden from screen readers.
    return (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {glyph}
      </View>
    );
  }
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {glyph}
    </View>
  );
}

/**
 * The verified tick (kit.js `tick()`): Lucide's BadgeCheck, the badge filled in
 * the tick colour and the check stroked white. Creator ticks are purple,
 * professional ticks blue.
 */
export function VerifiedTick({ kind = 'creator', size = 15 }: { kind?: 'creator' | 'pro'; size?: number }) {
  const { colors } = useWawu();
  const col = kind === 'pro' ? colors.tickProfessional : colors.tickCreator;
  const [badge, check] = badgeCheck.node.map(([, attrs]) => String((attrs as { d?: string }).d));
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" testID={`tick-${kind}`}>
      <Path d={badge} fill={col} stroke={col} strokeWidth={1.5} />
      <Path d={check} fill="none" stroke={colors.textOnAccent} strokeWidth={2.4} />
    </Svg>
  );
}
