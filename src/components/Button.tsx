import { useState } from 'react';
import type { NativeSyntheticEvent, TargetedEvent } from 'react-native';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text as NativeText, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, layout, radius, space, useWawu, type ColorToken } from '@/theme';

import { Icon, type IconName } from './Icon';

/** design/_ds/wawu/tokens/elevation.css `--press-scale`. */
export const pressScale = 0.98;

/** The keyboard focus outline. */
const ringWidth = 1.5;

/**
 * On the web a click also focuses the element, but the ring is for the keyboard:
 * only `:focus-visible` shows it. Native focus only comes from a keyboard or
 * switch device, so it always shows.
 */
function showsFocusRing(e: NativeSyntheticEvent<TargetedEvent>): boolean {
  if (Platform.OS !== 'web') return true;
  const target = e.target as unknown as { matches?: (selector: string) => boolean } | undefined;
  return typeof target?.matches === 'function' ? target.matches(':focus-visible') : true;
}

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

const sizes = {
  sm: { height: 34, padding: space.lg, fontSize: 13.5, icon: 15 },
  md: { height: 44, padding: space.xl, fontSize: 14.5, icon: 17 },
  lg: { height: 54, padding: space.s2xl, fontSize: 16, icon: 19 },
} as const;

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
  const [focused, setFocused] = useState(false);
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
      onFocus={(e) => setFocused(showsFocusRing(e))}
      onBlur={() => setFocused(false)}
      hitSlop={Math.max(0, (layout.tapMin - dims.height) / 2)}
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.padding,
          backgroundColor: inactive ? colors.surfaceSunken : pressed ? colors[look.pressed] : look.bg ? colors[look.bg] : 'transparent',
          borderColor: focused ? colors.accentFg : look.ring ? colors[look.ring] : 'transparent',
          borderWidth: focused ? ringWidth : look.ring ? StyleSheet.hairlineWidth : 0,
          transform: [{ scale: pressed && !blocked ? pressScale : 1 }],
        },
        full && styles.full,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator testID="button-spinner" size="small" color={fg} />
        ) : icon ? (
          <Icon name={icon} size={dims.icon} color={fg} stroke={2.2} />
        ) : null}
        <NativeText numberOfLines={1} style={[font(700), { color: fg, fontSize: dims.fontSize, letterSpacing: -labelTracking * dims.fontSize }]}>
          {label}
        </NativeText>
        {iconRight && !loading ? <Icon name={iconRight} size={dims.icon} color={fg} stroke={2.2} /> : null}
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
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.46)} color={fg} stroke={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  round: { borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});
