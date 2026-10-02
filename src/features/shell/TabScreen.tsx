import { StyleSheet, Text, View } from 'react-native';

import { space, text, useWawu } from '@/theme';

/** The page a tab shows until its own feature screen is built into the route. */
export function TabScreen({ title }: { title: string }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <Text accessibilityRole="header" style={[text.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', padding: space.xl, paddingTop: space.s3xl },
});
