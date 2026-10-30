import { router, type ErrorBoundaryProps } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, layout, radius, space, useWawu } from '@/theme';

/**
 * What a person sees when a screen throws while it draws (WALLET-BLANK): never a blank screen. Used as the root layout's `ErrorBoundary` and as
 * the tabs' screen boundary, so a screen that fails inside the tabs keeps the tab bar and the rest of the app keeps working.
 *
 * It is built from React Native's own parts and the theme's tokens only, so a fault in a shared component cannot take the fallback down too.
 * "Details" is for a screenshot: the error's name and the first line of its message, cut short. Never a stack, never anything but those words.
 */
const DETAIL_MAX = 160;

/** "TypeError: Cannot read properties of null (reading 'layout')": the name and the first line of the message, no stack. */
export function errorDetails(error: unknown): string {
  const name = error instanceof Error && error.name ? error.name : 'Error';
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const line = (message.split('\n')[0] ?? '').trim();
  const text = line ? `${name}: ${line}` : name;
  return text.length > DETAIL_MAX ? `${text.slice(0, DETAIL_MAX - 1)}…` : text;
}

export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const { colors } = useWawu();
  const [showing, setShowing] = useState(false);
  return (
    <View testID="error-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <Text accessibilityRole="header" style={[font(700), styles.title, { color: colors.textPrimary }]}>
        Something went wrong
      </Text>
      <Text style={[font(400), styles.line, { color: colors.textSecondary }]}>This screen could not open. Your money and your account are safe.</Text>
      <View style={styles.buttons}>
        <Pressable
          testID="error-retry"
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={retry}
          style={[styles.button, { backgroundColor: colors.accent }]}
        >
          <Text style={[font(600), styles.buttonLabel, { color: colors.textOnAccent }]}>Try again</Text>
        </Pressable>
        <Pressable
          testID="error-home"
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
          onPress={() => router.replace('/')}
          style={[styles.button, { borderColor: colors.borderHairline, borderWidth: StyleSheet.hairlineWidth }]}
        >
          <Text style={[font(600), styles.buttonLabel, { color: colors.textPrimary }]}>Go to Home</Text>
        </Pressable>
      </View>
      <Pressable testID="error-details-toggle" accessibilityRole="button" accessibilityLabel="Details" accessibilityState={{ expanded: showing }} onPress={() => setShowing((was) => !was)} hitSlop={space.md}>
        <Text style={[font(600), styles.link, { color: colors.accentFg }]}>Details</Text>
      </Pressable>
      {showing ? (
        <Text testID="error-details" selectable style={[font(400), styles.details, { color: colors.textMuted }]}>
          {errorDetails(error)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.gutter, gap: space.md },
  title: { fontSize: 22, textAlign: 'center' },
  line: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  buttons: { alignSelf: 'stretch', gap: space.sm, marginTop: space.md },
  button: { height: 48, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  buttonLabel: { fontSize: 16 },
  link: { fontSize: 14, marginTop: space.md },
  details: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
