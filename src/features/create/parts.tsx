import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { IconTile, type IconTileTone } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

/** kit.js `radio`: 22 round, a 1.5 strong ring, or filled with a 6.5 accent ring when picked. */
const radioMetrics = { size: 22, ring: 1.5, picked: 6.5 } as const;
/** me.js `stepper`: four 4 high bars 6 apart, 2 corners; 11.5 semi-bold names 6 under them. */
const stepperMetrics = { bar: 4, barCorner: 2, between: 6, label: 11.5 } as const;
/** kit.js `listRow`: 13 between the parts, 12 above and below, 64 high at least; 15.5 semi-bold over a 13 muted line 3 under it. */
/** me.js `upload` and `previewStep`: the file card is 14 by 16 (12 by 14 once it is a finished file), its name 14.5, the line under it 12.5 two below, the bar 6 high with 3 corners. */
const fileMetrics = { padV: 14, padVTight: space.md, padH: 14, name: 14.5, meta: 12.5, metaGap: 2, track: 6, trackCorner: 3, percent: 13 } as const;
const rowMetrics = { between: 13, padV: 12, minHeight: 64, title: 15.5, sub: 13, subGap: 3, icon: 44 } as const;

/**
 * Answers true for the first tap of a burst and false for the rest of it within `ms`. A double click on the web would otherwise open
 * the chooser twice and ask the Hub for two upload links; the browser's own chooser is modal, so a person never means the second.
 * It counts time, not "a chooser is open", because a browser that never reports the chooser being closed would otherwise leave the
 * box dead.
 */
export function useFirstTap(ms = 800): () => boolean {
  const last = useRef(0);
  return () => {
    const now = Date.now();
    if (last.current !== 0 && now - last.current < ms) return false;
    last.current = now;
    return true;
  };
}

export const STEP_NAMES = ['Upload', 'Cover', 'Details', 'Price'] as const;

/** Upload / Cover / Details / Price (R-118: step 3 is the cover step), the bars up to the current step lit and its name in full colour. */
export function Stepper({ active }: { active: 0 | 1 | 2 | 3 }) {
  const { colors } = useWawu();
  return (
    <View style={styles.stepper} accessible accessibilityLabel={`${STEP_NAMES[active]}, step ${active + 2} of 5`}>
      {STEP_NAMES.map((name, i) => (
        <View key={name} style={styles.stepCol}>
          <View style={[styles.bar, { backgroundColor: i <= active ? colors.accent : colors.surfaceSunken }]} />
          <Text
            variant="body"
            tone={i === active ? 'textPrimary' : 'textMuted'}
            style={[font(600), { fontSize: stepperMetrics.label, lineHeight: canvasNormalLineHeight(stepperMetrics.label) }]}
          >
            {name}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Radio({ selected }: { selected: boolean }) {
  const { colors } = useWawu();
  return (
    <View
      style={[
        styles.radio,
        {
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 0,
              blurRadius: 0,
              spreadDistance: selected ? radioMetrics.picked : radioMetrics.ring,
              color: selected ? colors.accent : colors.borderStrong,
              inset: true,
            },
          ],
        },
      ]}
    />
  );
}

export type FormatRowProps = { label: string; hint: string; icon: IconName; selected: boolean; onPress: () => void; testID: string };

/** One row of M20's list: the picture, the name over its line, and a radio. The picked row's picture is on the accent tint. */
export function FormatRow({ label, hint, icon, selected, onPress, testID }: FormatRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${hint}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <IconTile icon={icon} tone={selected ? 'accent' : 'neutral'} size={rowMetrics.icon} />
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.rowTitle]}>
          {label}
        </Text>
        <Text variant="secondary" tone="textMuted" numberOfLines={2} style={styles.rowSub}>
          {hint}
        </Text>
      </View>
      <Radio selected={selected} />
    </Pressable>
  );
}

export type FileRowProps = {
  name: string;
  /** The line under the name, when there is no bar under it. */
  meta?: string;
  /** 0 to 1: draws the bar under the name and the share at the right. */
  progress?: number;
  tone?: IconTileTone;
  icon: IconName;
  failed?: boolean;
  /** A remove control at the right (M22's X). */
  onRemove?: () => void;
  removeLabel?: string;
  testID?: string;
};

/** The card with the chosen file: its name, a bar and a percentage while it goes up (M21), or what it is once it has (M22). */
export function FileRow({ name, meta, progress, tone = 'neutral', icon, failed, onRemove, removeLabel = 'Remove', testID }: FileRowProps) {
  const { colors } = useWawu();
  const percent = progress === undefined ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <Card padded testID={testID} style={progress === undefined ? styles.fileCardTight : styles.fileCard}>
      <View style={styles.fileRow}>
        <IconTile icon={icon} tone={failed ? 'danger' : tone} size={rowMetrics.icon} />
        <View style={styles.words}>
          <Text variant="body" numberOfLines={1} style={[font(600), styles.fileName]}>
            {name}
          </Text>
          {progress !== undefined ? (
            <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
              <View style={[styles.fill, { backgroundColor: failed ? colors.danger : colors.accent, width: `${percent ?? 0}%` }]} />
            </View>
          ) : meta ? (
            <Text variant="caption" tone="textMuted" style={styles.fileMeta}>
              {meta}
            </Text>
          ) : null}
        </View>
        {percent !== null ? (
          <Text variant="body" tone="textMuted" testID="create-percent" style={[font(600), styles.percent]}>
            {`${percent}%`}
          </Text>
        ) : null}
        {onRemove ? (
          <Pressable accessibilityRole="button" accessibilityLabel={removeLabel} onPress={onRemove} hitSlop={space.md} testID="create-remove">
            <Icon name="X" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', gap: stepperMetrics.between },
  stepCol: { flex: 1, gap: stepperMetrics.between },
  bar: { height: stepperMetrics.bar, borderRadius: stepperMetrics.barCorner },
  radio: { width: radioMetrics.size, height: radioMetrics.size, borderRadius: radioMetrics.size / 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, minHeight: rowMetrics.minHeight, paddingVertical: rowMetrics.padV },
  words: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: rowMetrics.title, letterSpacing: -0.01 * rowMetrics.title },
  rowSub: { fontSize: rowMetrics.sub, marginTop: rowMetrics.subGap },
  fileCard: { paddingVertical: fileMetrics.padV, paddingHorizontal: space.lg },
  fileCardTight: { paddingVertical: fileMetrics.padVTight, paddingHorizontal: fileMetrics.padH },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  fileName: { fontSize: fileMetrics.name },
  fileMeta: { fontSize: fileMetrics.meta, marginTop: fileMetrics.metaGap },
  track: { marginTop: space.sm, height: fileMetrics.track, borderRadius: fileMetrics.trackCorner, overflow: 'hidden' },
  fill: { height: '100%' },
  percent: { fontSize: fileMetrics.percent },
});

