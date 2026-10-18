import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { space } from '@/theme';

/** The smaller parts of X1: the section heading and Featured creators' See all. */

/** `SH`: a heading with its action at the right (when its destination is built), the two sitting on one baseline row (aligned to the bottom). */
export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.headingLine}>
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

/** "See all" beside Featured creators (X1): opens All creators (X4, EXPLORE-02). */
export function SeeAllCreators({ onPress, testID }: { onPress: () => void; testID?: string }) {
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel="See all creators" hitSlop={space.md} onPress={onPress} {...ring.handlers} style={ring.style}>
      <Text variant="linkStrong">See all</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headingLine: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
});
