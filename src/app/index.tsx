import { StyleSheet, Text, View } from 'react-native';

import { text, useWawu } from '@/theme';

/** The first frame: the wordmark on the page surface. Replaced by the tab shell in task A-01. */
export default function Boot() {
  const { colors } = useWawu();
  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <Text accessibilityRole="header" style={[text.display, { color: colors.accentFg }]}>
        WAWU
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
