import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { layout, radius, space, useWawu } from '@/theme';

import { useFocusRing } from './focusRing';
import { blackAt } from './shadow';

/** design/_gen/kit.js `sheet`: a 40 by 5 grabber, 10 above it and 34 below the content (the home indicator). */
export const sheetMetrics = {
  grabberW: 40,
  grabberH: 5,
  grabberRadius: 3,
  padTop: 10,
  padBottom: 34,
  between: 18,
  /** `--shadow-sheet`: 0 -12px 40px at 50% black, the same in both themes. */
  shadowY: -12,
  shadowBlur: 40,
  shadowAlpha: 0.5,
  /**
   * The top hairline, drawn as the kit does: `inset 0 1px 0 var(--border-hairline)`
   * inside the 10 px top padding, so the grabber sits 10 below the sheet's edge.
   * A border would sit outside the padding and push everything down by its width.
   */
  edge: 1,
} as const;

export type BottomSheetProps = {
  visible: boolean;
  /** Called by the backdrop, the grabber (the close control a screen reader finds) and the Escape key (or the back button on Android). */
  onClose: () => void;
  /** What a screen reader calls the sheet when it opens ("Unlock"). */
  label: string;
  /** False while something is in flight (a payment), so the sheet cannot be dismissed half way. */
  dismissible?: boolean;
  /** Text for the grabber's screen reader name. */
  closeLabel?: string;
  /**
   * Space between the sheet's rows (grabber included): kit.js `sheet(inner, { gap })`,
   * 18 when an artboard passes none (W11 and M13 pass 14).
   */
  gap?: number;
  children: ReactNode;
  testID?: string;
};

/** A panel that rises from the bottom over a dimmed page. Tap outside it, press its grabber or hit Escape to close it. */
export function BottomSheet({
  visible,
  onClose,
  label,
  dismissible = true,
  closeLabel = 'Close',
  gap = sheetMetrics.between,
  children,
  testID,
}: BottomSheetProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const close = () => {
    if (dismissible) onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          testID={testID ? `${testID}-backdrop` : 'sheet-backdrop'}
          accessible={false}
          disabled={!dismissible}
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceScrim }]}
          tabIndex={-1}
        />
        <View
          testID={testID}
          role="dialog"
          aria-modal
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceElevated,
              gap,
              boxShadow: [
                { offsetX: 0, offsetY: sheetMetrics.shadowY, blurRadius: sheetMetrics.shadowBlur, color: blackAt(sheetMetrics.shadowAlpha) },
                { offsetX: 0, offsetY: sheetMetrics.edge, blurRadius: 0, color: colors.borderHairline, inset: true },
              ],
            },
          ]}
        >
          <Pressable
            testID={testID ? `${testID}-close` : 'sheet-close'}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            accessibilityState={{ disabled: !dismissible }}
            disabled={!dismissible}
            hitSlop={layout.tapMin / 2}
            onPress={close}
            {...ring.handlers}
            style={[
              styles.grabber,
              { backgroundColor: colors.borderStrong },
              ring.style,
            ]}
          />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: layout.screenW,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: sheetMetrics.padTop,
    paddingHorizontal: layout.gutter,
    paddingBottom: sheetMetrics.padBottom,
  },
  grabber: {
    alignSelf: 'center',
    width: sheetMetrics.grabberW,
    height: sheetMetrics.grabberH,
    borderRadius: sheetMetrics.grabberRadius,
    marginBottom: space.xs,
  },
});
