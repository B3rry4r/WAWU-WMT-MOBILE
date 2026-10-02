import { ActivityIndicator, Pressable, StyleSheet, Text as NativeText, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, layout, radius, useWawu, type ColorToken } from '@/theme';

import { useFocusRing } from './focusRing';
import { Icon, type IconName } from './icon';

/** design/_ds/wawu/tokens/elevation.css `--press-scale`. */
export const pressScale = 0.98;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'white' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Look = { bg?: ColorToken; pressed: ColorToken; fg: ColorToken; ring?: ColorToken };

const looks: Record<ButtonVariant, Look> = {
  primary: { bg: 'accent', pressed: 'accentPress', fg: 'textOnAccent' },
  secondary: { bg: 'surfaceCard', pressed: 'surfaceSunken', fg: 'textPrimary', ring: 'borderHairline' },
  outline: { pressed: 'surfaceSunken', fg: 'textPrimary', ring: 'borderStrong' },
  white: { bg: 'textOnAccent', pressed: 'hueSand', fg: 'textOnLight' },
  glass: { bg: 'surfaceGlass', pressed: 'borderGlass', fg: 'textOnAccent', ring: 'borderGlass' },
};

/** `letter-spacing: -0.01em` on the design's button label. */
const labelTracking = 0.01;

/** design/_gen/kit.js line 15 (`Btn`, `S`): [height, side padding, label size, icon size] per size (DECISIONS R-22). */
const sizes = {
  sm: { height: 34, padX: 14, fontSize: 13.5, icon: 15 },
  md: { height: 44, padX: 18, fontSize: 14.5, icon: 17 },
  lg: { height: 54, padX: 24, fontSize: 16, icon: 19 },
} as const;

/** The kit's `gap:7px` between a button's icon and its label. */
const iconGap = 7;

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  /** Stretch to the full width of the parent. */
  full?: boolean;
  disabled?: boolean;
  /** Shows a spinner and ignores presses until it clears, so a slow request can't be sent twice. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The pill button. Every action in the app is one of these. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  full,
  disabled,
  loading,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const look = looks[variant];
  const dims = sizes[size];
  const inactive = Boolean(disabled);
  const blocked = inactive || Boolean(loading);
  const fg = colors[inactive ? 'textDisabled' : look.fg];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy: Boolean(loading) }}
      disabled={blocked}
      onPress={onPress}
      {...ring.handlers}
      hitSlop={Math.max(0, (layout.tapMin - dims.height) / 2)}
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.padX,
          backgroundColor: inactive ? colors.surfaceSunken : pressed ? colors[look.pressed] : look.bg ? colors[look.bg] : 'transparent',
          borderColor: look.ring ? colors[look.ring] : 'transparent',
          borderWidth: look.ring ? StyleSheet.hairlineWidth : 0,
          transform: [{ scale: pressed && !blocked ? pressScale : 1 }],
        },
        ring.style,
        full && styles.full,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator testID="button-spinner" size="small" color={fg} />
        ) : icon ? (
          <Icon name={icon} size={dims.icon} color={fg} strokeWidth={2.2} />
        ) : null}
        <NativeText numberOfLines={1} style={[font(700), { color: fg, fontSize: dims.fontSize, letterSpacing: -labelTracking * dims.fontSize }]}>
          {label}
        </NativeText>
        {iconRight && !loading ? <Icon name={iconRight} size={dims.icon} color={fg} strokeWidth={2.2} /> : null}
      </View>
    </Pressable>
  );
}

export type IconButtonProps = {
  icon: IconName;
  /** What a screen reader says. An icon alone says nothing. */
  label: string;
  onPress: () => void;
  /** `glass` sits over a cover photo. */
  tone?: 'card' | 'glass';
  size?: number;
  disabled?: boolean;
  testID?: string;
};

/** Round icon-only control: back, scan, settings. */
export function IconButton({ icon, label, onPress, tone = 'card', size = 42, disabled, testID }: IconButtonProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const glass = tone === 'glass';
  const fg = colors[disabled ? 'textDisabled' : glass ? 'textOnAccent' : 'textPrimary'];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      hitSlop={Math.max(0, (layout.tapMin - size) / 2)}
      style={({ pressed }) => [
        styles.round,
        {
          width: size,
          height: size,
          backgroundColor: colors[glass ? 'surfaceScrim' : pressed ? 'surfaceSunken' : 'surfaceCard'],
          borderColor: colors.borderHairline,
          borderWidth: glass ? 0 : StyleSheet.hairlineWidth,
          transform: [{ scale: pressed && !disabled ? pressScale : 1 }],
        },
        ring.style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={fg} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: iconGap },
  round: { borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});
