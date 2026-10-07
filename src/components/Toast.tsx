import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { font, radius, space, useWawu } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './Text';

/**
 * design/_gen/me.js line 39 (M10, "Profile saved"): 48 high, 16 corner, 20 in from each side, an 18 icon at stroke
 * 2.2, 10 between the icon and the words, 14.5 at 600; 60 from the top. Explore's "Couldn't follow" (not drawn on
 * the canvas) takes the same shape 24 above the bottom, with room for a second line.
 */
export const toastMetrics = { height: 48, top: 60, bottom: 24, icon: 18, iconStroke: 2.2, between: 10, fontSize: 14.5 } as const;

export type ToastTone = 'success' | 'alert';
export type ToastPlacement = 'top' | 'bottom';

const tones: Record<ToastTone, { icon: IconName; color: 'positive' | 'danger' }> = {
  success: { icon: 'CircleCheck', color: 'positive' },
  alert: { icon: 'CircleAlert', color: 'danger' },
};

export type ToastProps = {
  /** What it says. Nothing is drawn while this is null or empty. */
  message: string | null;
  /** `success`: the positive tick ("Profile saved"). `alert`: the danger mark ("Couldn't follow"). */
  tone?: ToastTone;
  /** `top`: over the top of the screen (M10). `bottom`: above the bottom, so it never covers the header. */
  placement?: ToastPlacement;
  /** How far from that edge: 60 from the top, 24 from the bottom by default. A screen without the tab bar adds its safe area. */
  offset?: number;
  /** `1`: one line, 48 high. `2`: at least 48 high, the words wrap onto a second line before they are cut. */
  lines?: 1 | 2;
  /** With `onHide`: the toast asks to be taken down this many milliseconds after each new message. */
  duration?: number;
  onHide?: () => void;
  testID?: string;
};

/**
 * A short notice over the screen: a dark pill with an icon and a line, announced to a screen reader when it appears.
 * It takes no presses, so whatever is under it stays usable.
 */
export function Toast({ message, tone = 'success', placement = 'top', offset, lines = 1, duration, onHide, testID = 'toast' }: ToastProps) {
  const { colors } = useWawu();
  // The newest `onHide`, so a caller passing a new function each draw does not restart the clock.
  const hide = useRef(onHide);
  useEffect(() => {
    hide.current = onHide;
  });

  useEffect(() => {
    if (!message || duration === undefined) return undefined;
    const timer = setTimeout(() => hide.current?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;
  const look = tones[tone];
  const edge = placement === 'top' ? { top: offset ?? toastMetrics.top } : { bottom: offset ?? toastMetrics.bottom };
  const wraps = lines === 2;
  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.root, wraps ? styles.twoLines : styles.oneLine, edge, { backgroundColor: colors.textPrimary }]}
    >
      <Icon name={look.icon} size={toastMetrics.icon} color={colors[look.color]} strokeWidth={toastMetrics.iconStroke} />
      <Text
        variant="body"
        numberOfLines={wraps ? 2 : undefined}
        style={[font(600), styles.words, wraps ? styles.wrapWords : null, { color: colors.surfacePage }]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: toastMetrics.between,
    paddingHorizontal: space.lg,
  },
  oneLine: { height: toastMetrics.height },
  twoLines: { minHeight: toastMetrics.height, paddingVertical: space.md },
  words: { fontSize: toastMetrics.fontSize },
  wrapWords: { flex: 1 },
});
