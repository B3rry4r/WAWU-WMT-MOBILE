import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Text } from '@/components/Text';
import { space } from '@/theme';

/** The kit's sheet gap for an ending (H16, H18, H28 pass 16). */
const SHEET_GAP = space.lg;

/**
 * The end of a feed payment: a mark, a heading, a line, then rows and buttons. H16 (Unlocked), H18 (Paid, still opening) and H28
 * (Tip sent) are all this: a 72 mark or a 64 avatar, a 22 heading, a muted line centred under it (design/_gen/home.js lines 138,
 * 140, 156: the parts 10 apart, the sheet's parts 16 apart).
 */
export function StatusSheet({
  visible,
  onClose,
  label,
  mark,
  title,
  line,
  children,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  /** What a screen reader calls the sheet when it opens. */
  label: string;
  mark: ReactNode;
  title: string;
  line?: string | null;
  /** The rows and buttons under the words. */
  children?: ReactNode;
  testID?: string;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label={label} gap={SHEET_GAP} testID={testID}>
      <View style={styles.head}>
        {mark}
        <Text variant="sheetTitle" style={styles.centre}>
          {title}
        </Text>
        {line ? (
          <Text variant="muted" style={styles.centre}>
            {line}
          </Text>
        ) : null}
      </View>
      {children}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: space.sm + space.xs / 2 },
  centre: { textAlign: 'center' },
});
