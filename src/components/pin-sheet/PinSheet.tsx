import { useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { layout, radius, useWawu } from '@/theme';

import { SHEET } from './kit';
import { PinEntry } from './PinEntry';
import type { PinSheetProps } from './types';

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
  const bottom = Math.max(SHEET.padBottom, insets?.bottom ?? 0);
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
    borderTopWidth: SHEET.edge,
    paddingTop: SHEET.padTop,
    paddingHorizontal: layout.gutter,
    gap: SHEET.stack,
  },
  handle: {
    alignSelf: 'center',
    width: SHEET.handleW,
    height: SHEET.handleH,
    borderRadius: SHEET.handleRound,
    marginBottom: SHEET.handleBelow,
  },
});
