import { ActivityIndicator, Pressable, StyleSheet, Text as NativeText, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, layout, radius, useWawu, type ColorToken } from '@/theme';

import { useFocusRing } from './focusRing';
import { Icon, type IconName } from './icon';

/** design/_ds/wawu/tokens/elevation.css `--press-scale`. */
export const pressScale = 0.98;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'white' | 'glass' | 'veil';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'profile' | 'card' | 'pill';

/**
 * `veil`: a fill drawn as its own layer at an opacity, for a colour the tokens hold only at full strength (white at
 * 20% over a picture). The pill itself stays clear, so its pressed colour is the press scale alone.
 */
type Look = { bg?: ColorToken; pressed?: ColorToken; fg: ColorToken; ring?: ColorToken; veil?: { color: ColorToken; opacity: number } };

const looks: Record<ButtonVariant, Look> = {
  primary: { bg: 'accent', pressed: 'accentPress', fg: 'textOnAccent' },
  secondary: { bg: 'surfaceCard', pressed: 'surfaceSunken', fg: 'textPrimary', ring: 'borderHairline' },
  outline: { pressed: 'surfaceSunken', fg: 'textPrimary', ring: 'borderStrong' },
  white: { bg: 'textOnAccent', pressed: 'hueSand', fg: 'textOnLight' },
  glass: { bg: 'surfaceGlass', pressed: 'borderGlass', fg: 'textOnAccent', ring: 'borderGlass' },
  /** design/_gen/explore.js and home.js `cCard`'s "Following": white at 20% over the card's picture, with no ring. */
  veil: { fg: 'textOnAccent', veil: { color: 'textOnAccent', opacity: 0.2 } },
};

/** `letter-spacing: -0.01em` on the design's button label (a size may set its own). */
const labelTracking = 0.01;

/**
 * design/_gen/kit.js line 15 (`Btn`, `S`): [height, side padding, label size, icon size] per size, the label at 700
 * (DECISIONS R-22). `profile` is not the kit's: it is "Edit profile" in a profile's name block (design/_gen/me.js
 * line 20, `nameBlock`, M1 and M5), 38 high, 16 in, the label 14 at 600; it draws no icon, so its icon size is `sm`'s.
 * `card` is not the kit's either: it is a creator card's Follow (design/_gen/explore.js and home.js `cCard`), 32 high,
 * the label 13 at 700 with no letter-spacing; the side padding and icon are `sm`'s.
 * `pill` is not the kit's either: the controls over a card in the TGIF reader (design/_gen/home.js, H29 to H34: Amen, Share),
 * 40 high, 14 across, the label 13.5 at 600, a 17 icon.
 */
const sizes: Record<ButtonSize, { height: number; padX: number; fontSize: number; icon: number; weight: 600 | 700; tracking?: number }> = {
  sm: { height: 34, padX: 14, fontSize: 13.5, icon: 15, weight: 700 },
  md: { height: 44, padX: 18, fontSize: 14.5, icon: 17, weight: 700 },
  lg: { height: 54, padX: 24, fontSize: 16, icon: 19, weight: 700 },
  profile: { height: 38, padX: 16, fontSize: 14, icon: 15, weight: 600 },
  card: { height: 32, padX: 14, fontSize: 13, icon: 15, weight: 700, tracking: 0 },
  pill: { height: 40, padX: 14, fontSize: 13.5, icon: 17, weight: 600 },
};

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
  /** A toggle that is on (Amen said): told to a screen reader as selected, not by colour alone. */
  selected?: boolean;
  /** A figure after the label at 70% strength ("Amen 2.1K"); a screen reader reads it with the label. */
  count?: string;
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
  selected,
  count,
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
      accessibilityLabel={count ? `${label} ${count}` : label}
      accessibilityState={{ disabled: blocked, busy: Boolean(loading), ...(selected === undefined ? {} : { selected }) }}
      disabled={blocked}
      onPress={onPress}
      {...ring.handlers}
      hitSlop={Math.max(0, (layout.tapMin - dims.height) / 2)}
      style={({ pressed }) => [
        styles.base,
        {
          height: dims.height,
          paddingHorizontal: dims.padX,
          backgroundColor: inactive
            ? colors.surfaceSunken
            : pressed && look.pressed
              ? colors[look.pressed]
              : look.bg
                ? colors[look.bg]
                : 'transparent',
          borderColor: look.ring ? colors[look.ring] : 'transparent',
          borderWidth: look.ring ? StyleSheet.hairlineWidth : 0,
          transform: [{ scale: pressed && !blocked ? pressScale : 1 }],
        },
        ring.style,
        full && styles.full,
        style,
      ]}
    >
      {look.veil && !inactive ? (
        <View
          testID={testID ? `${testID}-veil` : undefined}
          pointerEvents="none"
          style={[styles.veil, { backgroundColor: colors[look.veil.color], opacity: look.veil.opacity }]}
        />
      ) : null}
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator testID="button-spinner" size="small" color={fg} />
        ) : icon ? (
          <Icon name={icon} size={dims.icon} color={fg} strokeWidth={2.2} />
        ) : null}
        <NativeText numberOfLines={1} style={[font(dims.weight), { color: fg, fontSize: dims.fontSize, letterSpacing: -(dims.tracking ?? labelTracking) * dims.fontSize }]}>
          {label}
          {count ? <NativeText style={styles.count}>{` ${count}`}</NativeText> : null}
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
  /** `glass` sits over a cover photo; `lift` is a 16% white disc over a coloured card. */
  tone?: 'card' | 'glass' | 'lift';
  size?: number;
  disabled?: boolean;
  testID?: string;
};

/** Round icon-only control: back, scan, settings. */
export function IconButton({ icon, label, onPress, tone = 'card', size = 42, disabled, testID }: IconButtonProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const glass = tone === 'glass' || tone === 'lift';
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
          backgroundColor: colors[tone === 'lift' ? 'borderGlass' : glass ? 'surfaceScrim' : pressed ? 'surfaceSunken' : 'surfaceCard'],
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
  veil: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.button },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: iconGap },
  count: { opacity: 0.7 },
  round: { borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});
