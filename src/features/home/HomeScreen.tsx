import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeedScreen } from '@/features/feed/FeedScreen';

import type { HomeView } from './model';
import { TodayScreen } from './TodayScreen';

/**
 * The Home tab: Today (H1, this task) and the Following and For you feed (H2 to H6, HOME-02)
 * under one tab row, so the Home tab stays lit on all three. Home opens on Today.
 *
 * The screen's title is "Home" for a screen reader (the tab row is what the eye reads; the
 * canvas draws no title), as every other tab names its own screen.
 */
export function HomeScreen() {
  const [view, setView] = useState<HomeView>('today');
  // Kept here, not on Today, so the figure stays hidden while the person looks at the feed and back.
  const [masked, setMasked] = useState(false);

  return (
    <View testID="home" style={styles.root}>
      <View accessible accessibilityRole="header" accessibilityLabel="Home" style={styles.title} />
      {view === 'today' ? (
        <TodayScreen onView={setView} masked={masked} onToggleMask={() => setMasked((m) => !m)} />
      ) : (
        <FeedScreen key={view} initialScope={view} onToday={() => setView('today')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /** The title is heard, not seen: no size and nothing drawn. */
  title: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
});
