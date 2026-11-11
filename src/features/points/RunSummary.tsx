import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { SUMMARY_WORDS } from './voiceToolsModel';

/** The chosen-file row's own measures (`FileParts.tsx` `RecordingBox`, from points.js `pt2Body`): a 20 corner row on the input colour, 14 by 16 padding, a 1 hairline, a 22 mark, the name 15 and the line 12.5. */
const ROW = { radius: 20, padV: 14, padH: 16, ring: 1, min: 64, mark: 22, parts: 12, name: 15, line: 12.5, lineGap: 2, tap: 44 } as const;

/**
 * Once Run is pressed, an Audiobook's text box and a Podcast's form fold into this one row at the top of the screen (S2-APP-2 patch, F1), so the
 * working, done and failed views sit right under it and are in the first screen however long the text is. While a job works the row has no
 * action; once it is done or has failed, "Edit" unfolds the input again with the result kept below.
 */
export function RunSummary({ icon, title, line, onEdit }: { icon: IconName; title: string; line: string; onEdit?: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View testID="run-summary" style={[styles.row, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: ROW.ring, color: colors.borderHairline, inset: true }] }]}>
      <Icon name={icon} size={ROW.mark} color={colors.textSecondary} strokeWidth={2} />
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} testID="run-summary-title" style={[font(600), { fontSize: ROW.name, lineHeight: canvasNormalLineHeight(ROW.name) }]}>
          {title}
        </Text>
        {line !== '' ? (
          <Text variant="body" tone="textMuted" numberOfLines={1} testID="run-summary-line" style={{ fontSize: ROW.line, lineHeight: canvasNormalLineHeight(ROW.line) }}>
            {line}
          </Text>
        ) : null}
      </View>
      {onEdit ? (
        <Pressable testID="run-summary-edit" accessibilityRole="button" accessibilityLabel={SUMMARY_WORDS.edit} onPress={onEdit} hitSlop={space.sm} {...ring.handlers} style={[styles.edit, ring.style]}>
          <Text variant="body" tone="accentFg" style={[font(600), { fontSize: ROW.line, lineHeight: canvasNormalLineHeight(ROW.line) }]}>
            {SUMMARY_WORDS.edit}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: ROW.parts, minHeight: ROW.min, borderRadius: ROW.radius, paddingVertical: ROW.padV, paddingHorizontal: ROW.padH },
  words: { flex: 1, minWidth: 0, gap: ROW.lineGap },
  edit: { minHeight: ROW.tap, justifyContent: 'center', paddingHorizontal: space.sm },
});
