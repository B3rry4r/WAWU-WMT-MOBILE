import { StyleSheet, View } from 'react-native';

import { radius, space } from '@/theme';

/**
 * The few marks the pay sheet draws, built from Views because the app has no
 * icon set installed yet (SHARED-CHANGES.md asks for one). Sizes come from the
 * spacing scale; colours from the caller's theme.
 */

const STROKE = 2;

/** A tick inside a ring: "this wallet pays". */
export function CheckRing({ color }: { color: string }) {
  return (
    <View style={[styles.ring, { borderColor: color }]}>
      <View style={[styles.tick, { borderColor: color }]} />
    </View>
  );
}

/** A plus sign, for "Add ₦X". */
export function Plus({ color }: { color: string }) {
  return (
    <View style={styles.plus}>
      <View style={[styles.plusBar, { backgroundColor: color }]} />
      <View style={[styles.plusBar, styles.plusBarDown, { backgroundColor: color }]} />
    </View>
  );
}

/** A wallet outline with its clasp, for "not enough in your wallet". */
export function Wallet({ color }: { color: string }) {
  return (
    <View style={[styles.wallet, { borderColor: color }]}>
      <View style={[styles.clasp, { borderColor: color }]} />
    </View>
  );
}

/** A clock face, for "still confirming". */
export function Clock({ color }: { color: string }) {
  return (
    <View style={[styles.clock, { borderColor: color }]}>
      <View style={[styles.hourHand, { backgroundColor: color }]} />
      <View style={[styles.minuteHand, { backgroundColor: color }]} />
    </View>
  );
}

/** A ring with a cross, for "didn't go through". */
export function Cross({ color }: { color: string }) {
  return (
    <View style={[styles.clock, { borderColor: color }]}>
      <View style={[styles.crossBar, { backgroundColor: color, transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.crossBar, { backgroundColor: color, transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

const RING = space.xl; // 20
const ICON = space.lg + space.xs; // 20, the canvas draws these at 19 to 20
const FACE = space.s3xl; // 32, the canvas draws the status mark at 32
const HAND = STROKE + 0.4;
/** Centre of the face, measured inside its border. */
const CENTRE = (FACE - 2 * HAND) / 2;

const styles = StyleSheet.create({
  ring: {
    width: RING,
    height: RING,
    borderRadius: radius.chip,
    borderWidth: STROKE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: space.sm,
    height: space.xs,
    borderLeftWidth: STROKE,
    borderBottomWidth: STROKE,
    transform: [{ translateY: -1 }, { rotate: '-45deg' }],
  },
  plus: { width: ICON - space.xs, height: ICON - space.xs, alignItems: 'center', justifyContent: 'center' },
  plusBar: { position: 'absolute', width: ICON - space.xs, height: STROKE, borderRadius: radius.chip },
  plusBarDown: { transform: [{ rotate: '90deg' }] },
  wallet: {
    width: ICON,
    height: ICON - space.xs,
    borderWidth: STROKE,
    borderRadius: space.xs,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  clasp: {
    width: space.sm,
    height: space.sm - STROKE,
    borderWidth: STROKE,
    borderRightWidth: 0,
    borderTopLeftRadius: space.xs,
    borderBottomLeftRadius: space.xs,
  },
  clock: {
    width: FACE,
    height: FACE,
    borderRadius: radius.chip,
    borderWidth: HAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourHand: {
    position: 'absolute',
    width: HAND,
    height: space.sm + STROKE,
    borderRadius: radius.chip,
    left: CENTRE - HAND / 2,
    top: CENTRE - space.sm - STROKE,
  },
  minuteHand: {
    position: 'absolute',
    width: space.sm,
    height: HAND,
    borderRadius: radius.chip,
    left: CENTRE - HAND / 2,
    top: CENTRE - HAND / 2,
    transform: [{ translateX: space.xs }, { translateY: STROKE }, { rotate: '27deg' }],
  },
  crossBar: { position: 'absolute', width: space.lg, height: HAND, borderRadius: radius.chip },
});
