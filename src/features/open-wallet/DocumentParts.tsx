import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

/**
 * design/_gen/auth.js line 62 (A26), `up`: a 150 tall tile, a 20 radius, 8
 * between its icon (26 at 2), its title (14 / 600) and its line (12.5, muted).
 * Done, it takes the positive tint and a check; waiting, the sunken surface
 * with a 1.5 ring in the strong border.
 */
const TILE = { height: 150, gap: space.sm, icon: 26, stroke: 2, title: 14, line: 12.5, ring: 1.5 } as const;
/** auth.js line 66 (A27): the file row, a 18 radius, 14 and 16 padding, 12 between its parts; the name 15 / 600, its line 12.5 muted 2 below, a 18 X. */
const ROW = { padV: 14, padH: space.lg, gap: space.md, name: 15, line: 12.5, lineGap: 2, close: 18, icon: 44 } as const;

export type UploadTileProps = {
  title: string;
  /** The line under the title ("Tap to take a photo"); "Done" once it is in. */
  line: string;
  done: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** The icon while waiting (a camera for a photo, a file for a bill). */
  icon?: 'Camera' | 'FileUp';
  testID?: string;
};

/** A26's tile for one side of the ID, and A27's for the proof of address while none is chosen. */
export function UploadTile({ title, line, done, onPress, disabled, icon = 'Camera', testID }: UploadTileProps) {
  const { colors } = useWawu();
  const focus = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${line}`}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      {...focus.handlers}
      style={[
        styles.tile,
        done ? { backgroundColor: colors.positiveTint } : { backgroundColor: colors.surfaceSunken, borderWidth: TILE.ring, borderColor: colors.borderStrong },
        focus.style,
      ]}
    >
      <Icon name={done ? 'CircleCheck' : icon} size={TILE.icon} color={done ? colors.positive : colors.textSecondary} strokeWidth={TILE.stroke} />
      <Text variant="body" style={styles.tileTitle}>
        {title}
      </Text>
      <Text variant="caption" style={styles.tileLine}>
        {line}
      </Text>
    </Pressable>
  );
}

export type FileRowProps = {
  name: string;
  line: string;
  /** Takes the file back out (the X). Left out where the file is the bank's already. */
  onRemove?: () => void;
  disabled?: boolean;
  testID?: string;
};

/** A27's row for a chosen proof of address: its name, what kind of file it is, and an X to take it out. */
export function FileRow({ name, line, onRemove, disabled, testID }: FileRowProps) {
  const { colors } = useWawu();
  const focus = useFocusRing();
  return (
    <View testID={testID} style={[styles.row, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
      <IconTile icon="FileCheck2" tone="in" size={ROW.icon} />
      <View style={styles.rowText}>
        <Text variant="body" numberOfLines={1} style={styles.rowName}>
          {name}
        </Text>
        <Text variant="caption" numberOfLines={1} style={styles.rowLine}>
          {line}
        </Text>
      </View>
      {onRemove ? (
        <Pressable
          testID={testID ? `${testID}-remove` : undefined}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name}`}
          disabled={disabled}
          onPress={onRemove}
          hitSlop={space.md}
          {...focus.handlers}
          style={focus.style}
        >
          <Icon name="X" size={ROW.close} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { height: TILE.height, borderRadius: radius.media, alignItems: 'center', justifyContent: 'center', gap: TILE.gap },
  tileTitle: { ...font(600), fontSize: TILE.title, lineHeight: canvasNormalLineHeight(TILE.title) },
  tileLine: { fontSize: TILE.line, lineHeight: canvasNormalLineHeight(TILE.line) },
  row: { flexDirection: 'row', alignItems: 'center', gap: ROW.gap, paddingVertical: ROW.padV, paddingHorizontal: ROW.padH, borderRadius: radius.tile, borderWidth: 1 },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { ...font(600), fontSize: ROW.name, lineHeight: canvasNormalLineHeight(ROW.name) },
  rowLine: { marginTop: ROW.lineGap, fontSize: ROW.line, lineHeight: canvasNormalLineHeight(ROW.line) },
});
