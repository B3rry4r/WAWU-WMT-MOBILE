import { useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { layout, radius, space, useWawu } from '@/theme';

import { PinEntry } from './PinEntry';
import type { PinSheetProps } from './types';

/** The grab handle on W11: 40 by 5. */
const HANDLE_W = space.s3xl + space.sm;
const HANDLE_H = 5;
/** The sheet's top edge on W11 (inset 0 1px 0 border-hairline). */
const EDGE = 1;

/**
 * The transaction PIN sheet (W11). Every payment opens this same sheet: send
 * (W11), unlock (H15), the professional tick (M13), tickets, school fees.
 *
 * It shows what the server answers and never decides anything itself. See
 * `PinSheetProps` for the contract.
 *
 * The frame (scrim, rounded panel, grab handle) is drawn here from React
 * Native primitives. UI-02's shared sheet is meant to frame it instead:
 * SHARED-CHANGES.md, section 2.
 */
export function PinSheet({ visible, onClose, ...entry }: PinSheetProps) {
  const { colors } = useWawu();
  const insets = useContext(SafeAreaInsetsContext);
  const bottom = Math.max(space.s3xl, insets?.bottom ?? 0);
  // While a PIN is being checked the payment is in flight: the sheet stays
  // open so the person sees how it ended.
  const [busy, setBusy] = useState(false);
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          disabled={busy}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceScrim }]}
        />
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderHairline,
              paddingBottom: bottom,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          <PinEntry {...entry} onBusyChange={setBusy} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: EDGE,
    paddingTop: space.sm,
    paddingHorizontal: layout.gutter,
    gap: space.md,
  },
  handle: {
    alignSelf: 'center',
    width: HANDLE_W,
    height: HANDLE_H,
    borderRadius: radius.chip,
    marginBottom: space.xs,
  },
});
