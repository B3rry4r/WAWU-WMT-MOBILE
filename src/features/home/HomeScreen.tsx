import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CreateEntry } from '@/features/create/CreateEntry';
import type { FeedItem } from '@/features/feed/api';
import { FeedScreen } from '@/features/feed/FeedScreen';
import type { FlowHandlers } from '@/features/feedpay/usePaymentFlow';

import type { HomeView } from './model';
import { TodayScreen } from './TodayScreen';

/**
 * The Home tab: Today (H1, this task) and the Following and For you feed (H2 to H6, HOME-02)
 * under one tab row, so the Home tab stays lit on all three. Home opens on Today.
 *
 * The screen's title is "Home" for a screen reader (the tab row is what the eye reads; the
 * canvas draws no title), as every other tab names its own screen.
 */
export type HomeScreenProps = {
  /** Create opens M19 (ME-04, R-38). Not drawn without it. */
  onCreate?: () => void;
  /** The search buttons (Today's head and the feed's tab row) open Search (X5, EXPLORE-02). Not drawn without it. */
  onSearch?: () => void;
  /** "See all" on Today's creators, and "Find people to follow" on an empty Following, open All creators (X4, EXPLORE-02). Not drawn without it. */
  onSeeAllCreators?: () => void;
  /** A professional card in the feed has Profile, which opens their page (P2, PROS-01) with the listing's id. Not drawn without it. */
  onOpenProfessional?: (id: string) => void;
  /** A creator card on Today's rail and the feed's creator card open that creator's profile (M5). */
  onOpenCreator?: (wawuId: string) => void;
  /** Where the feed's wallet payments lead when they need somewhere else (HOME-13). */
  pay?: FlowHandlers;
  /** A feed post's caption, and a piece in a creator card's strip, open that piece's own page (H19, HOME-03). */
  onOpenPiece?: (item: Pick<FeedItem, 'id'>) => void;
};

export function HomeScreen({ onCreate, onSearch, onSeeAllCreators, onOpenProfessional, onOpenCreator, pay, onOpenPiece }: HomeScreenProps = {}) {
  const [view, setView] = useState<HomeView>('today');
  // Kept here, not on Today, so the figure stays hidden while the person looks at the feed and back.
  const [masked, setMasked] = useState(false);

  return (
    <View testID="home" style={styles.root}>
      <View accessible accessibilityRole="header" accessibilityLabel="Home" style={styles.title} />
      {view === 'today' ? (
        <TodayScreen onView={setView} masked={masked} onToggleMask={() => setMasked((m) => !m)} onSearch={onSearch} onSeeAllCreators={onSeeAllCreators} onOpenCreator={onOpenCreator} />
      ) : (
        <FeedScreen
          key={view}
          initialScope={view}
          onToday={() => setView('today')}
          onSearch={onSearch}
          pay={pay}
          onOpenPiece={onOpenPiece}
          onOpenProfessional={onOpenProfessional}
          onOpenCreator={onOpenCreator}
          onSeeAllCreators={onSeeAllCreators}
        />
      )}
      {onCreate ? <CreateEntry onPress={onCreate} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /** The title is heard, not seen: no size and nothing drawn. */
  title: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
});
