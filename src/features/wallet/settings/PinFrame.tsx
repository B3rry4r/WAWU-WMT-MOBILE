import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Keypad } from '@/components/pin-sheet/Keypad';
import { ALERT, DOTS } from '@/components/pin-sheet/kit';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import { CODE_LENGTH, PIN_LENGTH } from './pinFlow';

/**
 * design/_gen/kit.js line 34, `nav`: a 56 bar with 20 at the sides and 12 between, the 42 round back button, the title
 * (17 / 700, -0.02em) centred and, when there is one, the line under it (12.5, muted, 2 below), and a 42 slot at the end.
 * W36 draws the step ("Step 1 of 2") as that line under an empty title; W37 draws a title.
 */
const NAV = { height: 56, button: 42, title: 17, titleTracking: -0.02, sub: 12.5, subGap: 2 } as const;
/** kit.js line 35, `body`, with the `pb: 40` and `gap: 14` W36 and W37 pass: 8 above, 40 under, the parts 14 apart. */
const BODY = { top: 8, bottom: 40, between: 14 } as const;
/** wallet.js lines 144 and 145: the head is a centred column 20 down with 8 (`space.sm`) between its parts; the title is `h1` at 22 and, under an icon, nudged 8 further. */
const HEAD = { top: 20, icon: 56, titleNudge: 8 } as const;
/** kit.js line 53, `boxes`: 46 by 56, a 16 corner, 9 apart, the digit 24 / 600; the box to fill has a 1.5 accent edge, the rest 1 hairline. W37 puts 18 between the boxes and the line under them. */
const BOX = { width: 46, height: 56, apart: 9, digit: 24, edgeOn: 1.5, edgeOff: 1, below: 18 } as const;
/** wallet.js line 145: the line under the boxes is 13.5 and muted. */
const BELOW_SIZE = 13.5;

export type PinFrameProps = {
  navTitle?: string;
  navSub?: string;
  onBack: () => void;
  backDisabled?: boolean;
  head: ReactNode;
  /** The dots, or the boxes, with what sits under them. It takes the room between the head and the keypad. */
  middle: ReactNode;
  keypad: { inactive: boolean; onDigit: (digit: string) => void; onDelete: () => void; onClear: () => void };
  /** Under the keypad: Forgot PIN?, where the screen offers it. */
  footer?: ReactNode;
  testID: string;
};

/** The frame W36 and W37 share: the bar, a centred head, the middle, the keypad (no biometric key here: this is where a PIN is chosen). */
export function PinFrame({ navTitle, navSub, onBack, backDisabled, head, middle, keypad, footer, testID }: PinFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.page, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={onBack} disabled={backDisabled} testID={`${testID}-back`} />
        </View>
        <View style={styles.navMiddle}>
          {navTitle ? (
            <Text variant="body" accessibilityRole="header" style={[font(700), { fontSize: NAV.title, letterSpacing: NAV.titleTracking * NAV.title }]} testID={`${testID}-nav-title`}>
              {navTitle}
            </Text>
          ) : null}
          {navSub ? (
            <Text variant="meta" tone="textMuted" style={{ fontSize: NAV.sub, marginTop: navTitle ? NAV.subGap : 0 }} testID={`${testID}-nav-sub`}>
              {navSub}
            </Text>
          ) : null}
        </View>
        <View style={styles.side} />
      </View>
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, BODY.bottom) }]}>
        {head}
        <View style={styles.middle}>{middle}</View>
        <Keypad inactive={keypad.inactive} onDigit={keypad.onDigit} onDelete={keypad.onDelete} onClear={keypad.onClear} />
        {footer}
      </View>
    </View>
  );
}

export type PinHeadProps = { icon?: boolean; title: string; line?: string; testID?: string };

/** The centred head: an optional lock tile, the title at 22 / 700 and the muted line under it. */
export function PinHead({ icon = true, title, line, testID }: PinHeadProps) {
  return (
    <View style={styles.head}>
      {icon ? <IconTile icon="LockKeyhole" tone="accent" size={HEAD.icon} /> : null}
      <Text variant="sheetTitle" style={[styles.center, icon ? { marginTop: HEAD.titleNudge } : null]} testID={testID}>
        {title}
      </Text>
      {line ? (
        <Text variant="muted" style={styles.center}>
          {line}
        </Text>
      ) : null}
    </View>
  );
}

export type PinDotsProps = { filled: number; /** Ring the empty dots in danger: only a refused PIN does. */ missed?: boolean; testID?: string };

/** kit.js line 52, `dots`: 16 across, 18 apart, the empty ones a 1.5 ring. */
export function PinDots({ filled, missed, testID }: PinDotsProps) {
  const { colors } = useWawu();
  const ring = missed ? colors.danger : colors.borderStrong;
  return (
    <View style={styles.dots} accessible accessibilityLabel={`${filled} of ${PIN_LENGTH} digits entered`} testID={testID}>
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <View key={i} style={[styles.dot, i < filled ? { backgroundColor: colors.textPrimary } : { borderColor: ring, borderWidth: DOTS.ring }]} />
      ))}
    </View>
  );
}

export type StatusLineProps = { text: string; testID?: string };

/** The inline error line under the dots or the boxes: a CircleAlert in danger and the sentence (auth.js line 14). */
export function StatusLine({ text, testID }: StatusLineProps) {
  const { colors } = useWawu();
  return (
    <View style={styles.alert} accessible accessibilityRole="alert" accessibilityLiveRegion="polite" testID={testID}>
      <Icon name={ALERT.icon.name} size={ALERT.icon.size} strokeWidth={ALERT.icon.stroke} color={colors.danger} />
      <Text variant="errorLine" style={styles.alertText}>
        {text}
      </Text>
    </View>
  );
}

export type CodeBoxesProps = { digits: string; /** The boxes show no box to fill, and a refusal rings none of them. */ refused?: boolean; testID?: string };

/** kit.js line 53, `boxes`: six boxes, the next one to fill edged in the accent. */
export function CodeBoxes({ digits, refused, testID }: CodeBoxesProps) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Code, ${digits.length} of ${CODE_LENGTH} digits entered`}
      style={styles.boxes}
    >
      {Array.from({ length: CODE_LENGTH }, (_, index) => {
        const next = index === digits.length && !refused;
        return (
          <View
            key={index}
            style={[
              styles.box,
              {
                backgroundColor: colors.surfaceCard,
                boxShadow: [
                  {
                    offsetX: 0,
                    offsetY: 0,
                    blurRadius: 0,
                    spreadDistance: next ? BOX.edgeOn : BOX.edgeOff,
                    color: next ? colors.accent : colors.borderHairline,
                    inset: true,
                  },
                ],
              },
            ]}
          >
            <Text variant="body" style={[font(600), { fontSize: BOX.digit }]}>
              {digits[index] ?? ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** The middle of W37: the boxes, then what sits under them, 18 apart. */
export function CodeMiddle({ children }: { children: ReactNode }) {
  return <View style={styles.codeMiddle}>{children}</View>;
}

/** The muted size W37 draws "Resend in 0:42" at. */
export const BELOW = { size: BELOW_SIZE } as const;

const styles = StyleSheet.create({
  page: { flex: 1 },
  nav: { height: NAV.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: NAV.button },
  navMiddle: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  body: { flex: 1, paddingTop: BODY.top, paddingHorizontal: layout.gutter, gap: BODY.between },
  head: { alignItems: 'center', gap: space.sm, paddingTop: HEAD.top },
  center: { textAlign: 'center' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DOTS.padY },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: DOTS.apart },
  dot: { width: DOTS.size, height: DOTS.size, borderRadius: radius.chip },
  alert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ALERT.apart },
  alertText: { flexShrink: 1 },
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: BOX.apart, alignSelf: 'stretch' },
  box: { width: BOX.width, flexShrink: 1, minWidth: 0, height: BOX.height, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  codeMiddle: { alignItems: 'center', gap: BOX.below, alignSelf: 'stretch' },
});
