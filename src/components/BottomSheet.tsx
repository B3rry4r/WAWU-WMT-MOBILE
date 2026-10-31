import { useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { layout, radius, space, useWawu } from '@/theme';

import { useFocusRing } from './focusRing';

/** design/_gen/kit.js `sheet`: a 40 by 5 grabber, 10 above it and 34 below the content (the home indicator). */
export const sheetMetrics = {
  grabberW: 40,
  grabberH: 5,
  grabberRadius: 3,
  padTop: 10,
  padBottom: 34,
  between: 18,
  /** The gap kept above a sheet that is as tall as the screen allows, so the dimmed page still shows over it (REPORT-UGC r1). */
  topGap: 24,
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

/**
 * A panel that rises from the bottom over a dimmed page. Tap outside it, press its grabber or hit Escape to close it.
 *
 * No sheet is taller than the screen (REPORT-UGC r1): the panel stops at the window's height less the safe-area insets and a
 * `topGap`, so its grabber, its rounded top and the backdrop above it always show. A sheet whose content fits (all but the
 * longest) draws exactly as before. One whose content does not fit keeps its grabber and scrolls the rest inside the cap.
 * The content is measured once it is drawn; a sheet that holds its own list (the pickers) is shorter than the cap by
 * construction and is never wrapped, so its list keeps its own scrolling and windowing.
 */
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
  const { colors, shadows } = useWawu();
  const ring = useFocusRing();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useContext(SafeAreaInsetsContext);
  const cap = Math.max(0, Math.floor(windowHeight - (insets?.top ?? 0) - (insets?.bottom ?? 0) - sheetMetrics.topGap));
  // The height the content wants (its own, without the grabber and the padding), read after it is drawn.
  const [wanted, setWanted] = useState<number | null>(null);
  // Once a sheet has been seen to be too tall it scrolls for as long as it is open (no flip back, so what the person typed stays).
  const [stuck, setStuck] = useState(false);
  const chrome = sheetMetrics.padTop + sheetMetrics.grabberH + space.xs + gap + sheetMetrics.padBottom;
  const scrolls = stuck || (wanted !== null && wanted + chrome > cap + 1);
  // A sheet that is closed forgets what it measured, so the next opening starts as a fresh sheet.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (!visible) {
      setStuck(false);
      setWanted(null);
    }
  }
  const measured = (height: number) => {
    setWanted(height);
    if (height + chrome > cap + 1) setStuck(true);
  };
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
              maxHeight: cap,
              boxShadow: [
                ...shadows.sheet,
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
          {scrolls ? (
            <ScrollView
              testID={testID ? `${testID}-sheet-scroll` : 'sheet-scroll'}
              style={styles.scroll}
              contentContainerStyle={{ gap }}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator
              bounces={false}
              nestedScrollEnabled
            >
              {children}
            </ScrollView>
          ) : (
            <View testID={testID ? `${testID}-sheet-content` : 'sheet-content'} style={{ gap }} onLayout={(event) => measured(event.nativeEvent.layout.height)}>
              {children}
            </View>
          )}
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
  scroll: { flexGrow: 0, flexShrink: 1 },
  grabber: {
    alignSelf: 'center',
    width: sheetMetrics.grabberW,
    height: sheetMetrics.grabberH,
    borderRadius: sheetMetrics.grabberRadius,
    marginBottom: space.xs,
  },
});
