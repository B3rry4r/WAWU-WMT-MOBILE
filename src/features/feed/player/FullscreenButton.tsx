import { Pressable, StyleSheet } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { layout, radius } from '@/theme';

import { media } from '../look';

export type FullscreenButtonProps = {
  onPress: () => void;
  /** What a screen reader calls it. */
  label?: string;
  testID?: string;
};

/**
 * R-117 · the full-screen button on a video: a round 44 tap target over the picture, the same glass as the feed's pills. It asks the
 * player for the phone's own full-screen video (`VideoSurface`'s `fullscreenAt`); it is one component for the piece page and the feed.
 */
export function FullscreenButton({ onPress, label = 'Full screen', testID }: FullscreenButtonProps) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.button, { backgroundColor: media.pill }, ring.style]}
    >
      <Icon name="Maximize" size={ICON} color={media.ink} strokeWidth={1.8} />
    </Pressable>
  );
}

const ICON = 20;

const styles = StyleSheet.create({
  button: { width: layout.tapMin, height: layout.tapMin, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});
