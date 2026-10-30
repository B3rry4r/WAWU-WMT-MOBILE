import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space, useWawu } from '@/theme';

/** Where the control the pop-over hangs from sits in the window. */
export type Anchor = { x: number; y: number; width: number; height: number };

/**
 * The panel: 288 wide at most, a 22 corner like a card, 8 clear of its control, 16 clear of the window's sides and of the screen's safe edges.
 * `flip`: until the phone has laid the rows out, a control lower than this many points down the window has its panel rise above it, a control higher up has it drop below.
 */
const PANEL = { maxWidth: 288, away: 8, side: space.lg, flip: 280, pad: space.sm } as const;

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

/** Where the panel stands: the side of the control it opens on, its tallest height there, and its place. Rows past the height scroll inside it. */
export type Placement = { above: boolean; maxHeight: number; left: number; top?: number; bottom?: number };

export type PlaceInput = {
  anchor: Anchor | null;
  win: { width: number; height: number };
  /** The screen's safe edges (the status bar, the home bar), so the panel never runs under them. */
  insets: { top: number; bottom: number };
  align: 'left' | 'right';
  /** The rows' own height once the phone has laid them out; null before that. */
  content: number | null;
};

/**
 * The panel is never taller than the room between its control and the screen's safe edge on the side it opens on, so its top can never leave the
 * screen however many rows there are or however far the page is scrolled (the control is measured where it is when the menu opens). It rises above
 * the control, as ElevenLabs' More menu does, unless its rows do not fit there and the other side has more room: then it drops below.
 */
export function placePanel({ anchor, win, insets, align, content }: PlaceInput): Placement {
  const width = Math.min(PANEL.maxWidth, win.width - PANEL.side * 2);
  const topEdge = insets.top + PANEL.side;
  const bottomEdge = win.height - insets.bottom - PANEL.side;
  if (!anchor) {
    // No position yet (a test, the first frame): in the corner it hangs from, as tall as the screen allows.
    const left = align === 'left' ? PANEL.side : win.width - PANEL.side - width;
    const bottom = Math.max(PANEL.side * 2, insets.bottom + PANEL.side);
    return { above: true, maxHeight: Math.max(0, win.height - topEdge - bottom), left, bottom };
  }
  const roomAbove = Math.max(0, anchor.y - PANEL.away - topEdge);
  const roomBelow = Math.max(0, bottomEdge - (anchor.y + anchor.height) - PANEL.away);
  const needs = content === null ? null : content + PANEL.pad * 2;
  const above = needs === null ? anchor.y > PANEL.flip : needs <= roomAbove || roomAbove >= roomBelow;
  const left = align === 'left' ? anchor.x : anchor.x + anchor.width - width;
  const place = { left: Math.max(PANEL.side, Math.min(left, win.width - PANEL.side - width)) };
  return above
    ? { above, maxHeight: roomAbove, bottom: win.height - anchor.y + PANEL.away, ...place }
    : { above, maxHeight: roomBelow, top: anchor.y + anchor.height + PANEL.away, ...place };
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
 * control, or drops below it when its rows fit better there; its rows scroll inside it when the room is short, and it stays inside the screen's
 * safe edges. A tap outside it, and the Android back button, close it.
 */
export function Popover({ visible, onClose, anchor, align, label, children, testID }: PopoverProps) {
  const { colors, shadows } = useWawu();
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState<number | null>(null);
  const width = Math.min(PANEL.maxWidth, win.width - PANEL.side * 2);
  const { above, maxHeight, left, top, bottom } = placePanel({ anchor, win, insets, align, content });
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
          style={[styles.panel, { width, maxHeight, left, backgroundColor: colors.surfaceElevated, boxShadow: [...shadows.float, { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }, above ? { bottom } : { top }]}
        >
          <ScrollView testID={testID ? `${testID}-rows` : 'popover-rows'} style={styles.rows} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator onContentSizeChange={(_w, h) => setContent(h)}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: { position: 'absolute', borderRadius: radius.card, padding: PANEL.pad },
  // Takes the rows' height up to the panel's cap, then scrolls.
  rows: { flexGrow: 0, flexShrink: 1 },
});
