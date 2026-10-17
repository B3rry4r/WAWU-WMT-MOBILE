import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { useRowRoom } from './useRowRoom';

/**
 * wallet.js line 43 (`actions`, DV2-02, the 16 Oct board): five columns spread edge to edge, each a 54 square at the tile corner on
 * the card colour with a hairline, its glyph 23, the word 12.5 semi-bold in the secondary colour 8 under it; the column is 16
 * wider than the square. Add money, Send, Withdraw, Buy points and To cash, in that order.
 *
 * 54 is the size that makes five columns exactly the 350 of a 390 screen. A narrower phone has less, so the size steps down by
 * the same rule until five columns fit (`actionTileSize`): 54 from 390 up, 51 at 375, 48 at 360, 44 at 340, 40 at 320.
 *
 * Only the actions whose screens are built are drawn (R-47), packed from the left in the board's order, each in a column of the size
 * five columns give. The tile size and column width never depend on how many are drawn, so a task that adds its action draws one
 * more column and resizes none of them.
 */
export const ACTION_TILE = { square: 54, glyphRatio: 0.42, extra: 2 * space.sm, label: 12.5, gap: space.sm, count: 5 } as const;

/** The square's size for a row that has `room` to use: the board's 54 when five columns of it fit, less when they do not. */
export function actionTileSize(room: number, count: number = ACTION_TILE.count): number {
  return Math.max(0, Math.min(ACTION_TILE.square, Math.floor(room / count) - ACTION_TILE.extra));
}

/** The glyph in a square of that size: the size times 0.42, rounded (23 in the board's 54). */
export function actionGlyph(square: number): number {
  return Math.round(square * ACTION_TILE.glyphRatio);
}

export type WalletAction = {
  key: 'add-money' | 'send' | 'withdraw' | 'buy-points' | 'to-cash';
  icon: IconName;
  label: string;
  onPress: () => void;
  /** The glyph in the accent colour, as the board draws Add money's plus. */
  accent?: boolean;
};

export type WalletActionsProps = {
  /** The actions that are built, in the board's order; the screen decides which these are. */
  actions: readonly WalletAction[];
};

/** How many tiles a row of `actions` draws, for the loading shapes that stand for them (W4). */
export const actionCount = (actions: readonly unknown[]): number => actions.length;

export function WalletActions({ actions }: WalletActionsProps) {
  // The size the board's five columns give, not the few that are drawn: a bigger tile now would shrink when another is added.
  const size = actionTileSize(useRowRoom());
  return (
    <View testID="wallet-actions" style={styles.row}>
      {actions.map((action) => (
        <Tile key={action.key} action={action} size={size} />
      ))}
    </View>
  );
}

function Tile({ action, size }: { action: WalletAction; size: number }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`wallet-action-${action.key}`}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      {...ring.handlers}
      style={[styles.tile, { width: size + ACTION_TILE.extra }, ring.style]}
    >
      <View style={[styles.square, { width: size, height: size, backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
        <Icon name={action.icon} size={actionGlyph(size)} color={action.accent ? colors.accent : colors.textPrimary} />
      </View>
      <Text variant="body" tone="textSecondary" numberOfLines={1} style={[font(600), styles.label]}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-start' },
  tile: { alignItems: 'center', gap: ACTION_TILE.gap },
  square: { borderRadius: radius.tile, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: ACTION_TILE.label, lineHeight: canvasNormalLineHeight(ACTION_TILE.label) },
});
