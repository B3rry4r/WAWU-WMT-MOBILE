import { StyleSheet, View } from 'react-native';

import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { font } from '@/theme';

/** Line 90, the working view: 12 between the parts, 20 above and below, a 64 mark, the title 20 bold, the line 13.5. */
const WORKING = { parts: 12, padV: 20, mark: 64, title: 20, titleTracking: -0.03, titleLeading: 1.15, body: 13.5, bodyLeading: 1.45 } as const;
export function Working({ title, body }: { title: string; body: string }) {
  return (
    <View testID="tool-working" accessibilityLiveRegion="polite" style={styles.working}>
      <IconTile icon="Loader" tone="accent" size={WORKING.mark} />
      <Text variant="body" accessibilityRole="header" style={[font(700), styles.workingTitle, { fontSize: WORKING.title, lineHeight: WORKING.title * WORKING.titleLeading, letterSpacing: WORKING.titleTracking * WORKING.title }]}>
        {title}
      </Text>
      <Text variant="body" tone="textSecondary" style={[styles.workingBody, { fontSize: WORKING.body, lineHeight: WORKING.body * WORKING.bodyLeading }]}>
        {body}
      </Text>
    </View>
  );
}


const styles = StyleSheet.create({
  working: { alignItems: 'center', gap: WORKING.parts, paddingVertical: WORKING.padV },
  workingTitle: { textAlign: 'center' },
  workingBody: { textAlign: 'center' },
});
