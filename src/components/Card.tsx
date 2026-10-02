import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, useWawu } from '@/theme';

/** The card's vertical padding: rows carry their own height, so only 2 is left over (design/_gen/kit.js `card`). */
const cardPadV = 2;
/**
 * The card's edge: kit.js `card` draws `box-shadow: inset 0 0 0 1px var(--border-hairline)`,
 * inside the card, so it adds no height. A border would add 1 px top and bottom.
 */
const edge = 1;

export type CardProps = {
  children: ReactNode;
  /** Room all round, for a card that holds a figure and not rows. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The white (or raised, in dark) rounded surface with a hairline edge. */
export function Card({ children, padded, style, testID }: CardProps) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        padded ? styles.padded : styles.rows,
        { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: edge, color: colors.borderHairline, inset: true }] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type GroupedListProps = { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string };

/** Rows inside one card, a hairline between each pair. A row never draws its own divider, so a list of one or of many is the same code. */
export function GroupedList({ children, style, testID }: GroupedListProps) {
  const { colors } = useWawu();
  const rows = Children.toArray(children);
  return (
    <Card testID={testID} style={style}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.borderHairline }]} /> : null}
          {row}
        </Fragment>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card },
  rows: { paddingVertical: cardPadV, paddingHorizontal: space.lg },
  padded: { padding: space.lg },
  /** The next row's top edge carries the line, as the kit's inset shadow does: no layout of its own. */
  divider: { height: StyleSheet.hairlineWidth, marginBottom: -StyleSheet.hairlineWidth },
});
