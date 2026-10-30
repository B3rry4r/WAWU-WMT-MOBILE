import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { radius, space, useWawu } from '@/theme';

/** Where the control the pop-over hangs from sits in the window. */
export type Anchor = { x: number; y: number; width: number; height: number };

/** The panel: 288 wide at most, a 22 corner like a card, 8 clear of its control, 16 clear of the window's sides. */
const PANEL = { maxWidth: 288, away: 8, side: space.lg, flip: 280 } as const;

/**
 * Measures a control when it is opened, so the pop-over can hang from it (ElevenLabs' More menu, R-113). The pop-over opens at once and moves to
 * the control when the phone has answered; where the phone gives no position (a test, the first frame) it sits in the corner it hangs from.
 */
export function usePopover(ref: RefObject<View | null>): { open: boolean; anchor: Anchor | null; show: () => void; hide: () => void } {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const show = useCallback(() => {
    setOpen(true);
    ref.current?.measureInWindow((x, y, width, height) => {
      if (Number.isFinite(x) && Number.isFinite(y)) setAnchor({ x, y, width, height });
    });
  }, [ref]);
  const hide = useCallback(() => setOpen(false), []);
  return { open, anchor, show, hide };
}

export type PopoverProps = {
  visible: boolean;
  onClose: () => void;
  anchor: Anchor | null;
  /** The side of the control the panel lines up with: the left edge of a control on the left, the right edge of one on the right. */
  align: 'left' | 'right';
  /** What a screen reader calls the menu. */
  label: string;
  children: ReactNode;
  testID?: string;
};

/**
 * A menu that hangs from the control that opened it, over a page that stays where it is (not a screen, not a bottom sheet). It rises above the
 * control, or drops below it when the control is near the top. A tap outside it, and the Android back button, close it.
 */
export function Popover({ visible, onClose, anchor, align, label, children, testID }: PopoverProps) {
  const { colors, shadows } = useWawu();
  const win = useWindowDimensions();
  const width = Math.min(PANEL.maxWidth, win.width - PANEL.side * 2);
  const above = !anchor || anchor.y > PANEL.flip;
  const vertical = !anchor ? { bottom: PANEL.side * 2 } : above ? { bottom: win.height - anchor.y + PANEL.away } : { top: anchor.y + anchor.height + PANEL.away };
  const left = !anchor ? (align === 'left' ? PANEL.side : win.width - PANEL.side - width) : align === 'left' ? anchor.x : anchor.x + anchor.width - width;
  const horizontal = { left: Math.max(PANEL.side, Math.min(left, win.width - PANEL.side - width)) };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable testID={testID ? `${testID}-backdrop` : 'popover-backdrop'} accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} tabIndex={-1} />
        <View
          testID={testID}
          role="menu"
          aria-modal
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[styles.panel, { width, backgroundColor: colors.surfaceElevated, boxShadow: [...shadows.float, { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }, vertical, horizontal]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: { position: 'absolute', borderRadius: radius.card, padding: space.sm },
});
