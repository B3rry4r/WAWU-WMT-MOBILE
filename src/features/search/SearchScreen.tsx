import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View , Text as NativeText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { APP_NAME } from '@/components/BrandMark';
import { IconTile } from '@/components/IconTile';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { useJoinCommunity } from '@/features/communities/useCommunities';
import { LoadFailedBanner } from '@/features/explore/LoadFailedBanner';
import { FOLLOW_NOTICE_MS, useFollow } from '@/features/explore/follow';
import { fetchMyId, meKey } from '@/features/feed/api';
import { font, layout, radius, space, useWawu } from '@/theme';

import { MAX_QUERY, type SearchCommunity, type SearchPerson } from './api';
import { useClearRecent, useLanding, useRecordRecent, useResults, useSearchText } from './hooks';
import { contentRows, PREVIEW, TAB_LABELS, type SearchTab } from './model';
import { ContentRow, PersonRow, QueryChip, ResultTabs, RoomRow, SearchField, SectionLabel, chipMetrics, searchMetrics, rowMetrics, type RoomAction } from './parts';

/** Words the screen says, written once. */
const words = {
  placeholder: `Search ${APP_NAME}`,
  noRecent: 'No recent searches yet.',
  failedTitle: 'Search isn’t working right now',
  failedNetwork: 'Check your connection and try again.',
  nothingTitle: 'Try a shorter search',
  nothingMessage: 'Fewer words usually finds more.',
  closest: 'Closest things we have',
  joinFailed: (name: string, asking: boolean) => (asking ? `Couldn’t send your request to ${name}. Try again later.` : `Couldn’t join ${name}. Try again later.`),
  clearFailed: 'Couldn’t clear your recent searches. Try again later.',
} as const;

export type SearchScreenProps = {
  /** Cancel: back to where search was opened from. */
  onCancel: () => void;
  /** A room was joined: open it (I25). */
  onOpenRoom: (id: string) => void;
  /** A content result was pressed: open that piece's own page (H19, HOME-03). Left out, a content row only reads. */
  onOpenContent?: (id: string) => void;
};

function Block({ children, testID }: { children: React.ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={styles.block}>
      {children}
    </View>
  );
}

function RowsSkeleton() {
  return (
    <LoadingView testID="search-loading" label="Searching">
      <View style={styles.skeleton}>
        {Array.from({ length: 5 }, (_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton width={rowMetrics.thumb} height={rowMetrics.thumb} radius={rowMetrics.thumbCorner} />
            <View style={styles.skeletonWords}>
              <Skeleton width={i % 2 === 0 ? '70%' : '55%'} height={rowMetrics.name} />
              <Skeleton width="40%" height={rowMetrics.line} />
            </View>
          </View>
        ))}
      </View>
    </LoadingView>
  );
}

/**
 * X5 to X12: Search. Empty, it is the landing (X5, X11): the person's recent searches with Clear, what many people searched,
 * and creators to know with Follow. Typed (the text is searched once typing pauses; the keyboard's search key and a chip search
 * it at once and remember it), it is the results: All, Content, Creators and Communities with their counts (X6 to X9), the nearest
 * content when nothing matched (X10) and a Try again when the search failed (X12).
 *
 * A content result opens its piece (H19, HOME-03). A creator opens their profile (M5, ME-02), added by the task that builds it
 * (R-27), so a person row opens nothing today. Follow works in place; a creator already followed shows Following (tap to
 * unfollow) where X6 draws Profile.
 */
export function SearchScreen({ onCancel, onOpenRoom, onOpenContent }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const { text, setText, query, submit } = useSearchText(MAX_QUERY);
  // The tab on screen is the one chosen for this text; a new text opens All.
  const [chosen, setChosen] = useState<{ q: string; tab: SearchTab }>({ q: '', tab: 'all' });
  const tab: SearchTab = chosen.q === query ? chosen.tab : 'all';
  const setTab = (next: SearchTab) => setChosen({ q: query, tab: next });
  const landing = useLanding();
  const results = useResults(query);
  const record = useRecordRecent();
  const clear = useClearRecent();
  const follow = useFollow();
  const join = useJoinCommunity();
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId }, queryClient);
  const [asked, setAsked] = useState<ReadonlySet<string>>(new Set());
  const [joining, setJoining] = useState<string | null>(null);
  const [roomNotice, setRoomNotice] = useState<string | null>(null);

  const clearFailed = clear.isError;

  const run = (value: string) => {
    const clean = submit(value);
    if (clean !== '') record.mutate(clean);
  };

  const onToggle = (person: SearchPerson) => (person.wawuId === me.data ? undefined : () => follow.toggle(person));

  const roomState = (room: SearchCommunity): RoomAction => (room.kind === 'open' ? 'join' : asked.has(room.id) ? 'asked' : 'ask');
  const onRoom = (room: SearchCommunity) => {
    if (joining !== null) return;
    setJoining(room.id);
    setRoomNotice(null);
    join.mutate(room.id, {
      onSuccess: (membership) => {
        if (membership.status === 'joined') onOpenRoom(room.id);
        else setAsked((prev) => new Set(prev).add(room.id));
      },
      onError: () => setRoomNotice(words.joinFailed(room.name, room.kind === 'private')),
      onSettled: () => setJoining(null),
    });
  };

  const notice = follow.notice ?? roomNotice ?? (clearFailed ? words.clearFailed : null);
  const dismiss = () => {
    follow.dismiss();
    setRoomNotice(null);
    clear.reset();
  };

  const person = (p: SearchPerson, prefix: string) => (
    <PersonRow key={p.wawuId} testID={`${prefix}-${p.wawuId}`} person={p} onToggleFollow={onToggle(p)} />
  );
  const room = (r: SearchCommunity) => (
    <RoomRow key={r.id} testID={`search-room-${r.id}`} room={r} state={roomState(r)} busy={joining === r.id} onPress={() => onRoom(r)} />
  );

  let body;
  if (query === '') {
    const recent = landing.suggestions.data?.recentSearches ?? [];
    const popular = landing.popular.data ?? [];
    const pending = landing.suggestions.isPending;
    const failed = landing.suggestions.isError && !landing.suggestions.data;
    body = (
      <ScrollView testID="search-landing" keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.s3xl }]}>
        {failed ? (
          <LoadFailedBanner
            title="Couldn’t load your searches"
            message={isApiError(landing.suggestions.error) ? landing.suggestions.error.message : 'Something went wrong. Try again.'}
            icon={isApiError(landing.suggestions.error) && landing.suggestions.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
            retrying={landing.suggestions.isFetching}
            onRetry={() => void landing.suggestions.refetch()}
          />
        ) : null}
        {pending ? (
          <LoadingView testID="search-landing-loading" label="Loading your searches">
            <View style={styles.chipWrap}>
              {[96, 64, 112, 88].map((w) => (
                <Skeleton key={w} width={w + 40} height={34} radius={radius.chip} />
              ))}
            </View>
          </LoadingView>
        ) : (
          <Block testID="search-recent">
            <SectionLabel title="Recent" action={recent.length > 0 ? { label: 'Clear', onPress: () => clear.mutate(), testID: 'search-clear-recent' } : undefined} />
            {recent.length > 0 ? (
              <View style={styles.chipWrap}>
                {recent.map((q) => (
                  <QueryChip key={q} kind="recent" label={q} onPress={() => run(q)} testID={`search-recent-${q}`} />
                ))}
              </View>
            ) : (
              <Text variant="secondary" tone="textMuted" testID="search-no-recent">
                {words.noRecent}
              </Text>
            )}
          </Block>
        )}
        {popular.length > 0 ? (
          <Block testID="search-popular">
            <SectionLabel title="People are searching" />
            <View style={styles.chipWrap}>
              {popular.map((q) => (
                <QueryChip key={q} kind="popular" label={q} onPress={() => run(q)} testID={`search-popular-${q}`} />
              ))}
            </View>
          </Block>
        ) : null}
        {landing.creators.length > 0 ? (
          <Block testID="search-known">
            <SectionLabel title="Creators to know" />
            <View style={styles.rows}>{landing.creators.map((p) => person(p, 'search-known'))}</View>
          </Block>
        ) : null}
      </ScrollView>
    );
  } else if (results.loading) {
    body = <RowsSkeleton />;
  } else if (results.failed) {
    const network = isApiError(results.error) && results.error.kind === 'network';
    body = (
      <View style={styles.center}>
        <ErrorState
          testID="search-error"
          title={words.failedTitle}
          message={network || !isApiError(results.error) ? words.failedNetwork : results.error.message}
          icon={network ? 'WifiOff' : 'TriangleAlert'}
          onRetry={() => void results.refetch()}
        />
      </View>
    );
  } else {
    const answer = results.answer;
    const counts = results.counts;
    const content = contentRows(answer?.content ?? [], results.people);
    let list;
    if (results.nothing) {
      const closest = contentRows(results.closest, results.people).slice(0, PREVIEW.content);
      list = (
        <View testID="search-nothing" style={styles.nothing}>
          <View style={styles.nothingTop}>
            <IconTile icon="SearchX" tone="neutral" size={56} />
            <Text variant="body" style={[font(600), styles.nothingTitle]}>
              {words.nothingTitle}
            </Text>
            <Text variant="secondary" tone="textMuted" style={styles.centered}>
              {words.nothingMessage}
            </Text>
          </View>
          {closest.length > 0 ? (
            <Block testID="search-closest">
              <SectionLabel title={words.closest} />
              <View style={styles.rows}>
                {closest.map((r) => (
                  <ContentRow key={r.id} testID={`search-content-${r.id}`} row={r} onPress={onOpenContent ? () => onOpenContent(r.id) : undefined} />
                ))}
              </View>
            </Block>
          ) : null}
        </View>
      );
    } else if (tab === 'all') {
      list = (
        <View style={styles.all}>
          {content.length > 0 ? (
            <Block testID="search-section-content">
              <SectionLabel title="Content" action={content.length > PREVIEW.content ? { label: `See all ${content.length}`, onPress: () => setTab('content'), testID: 'search-see-all-content' } : undefined} />
              <View style={styles.rows}>
                {content.slice(0, PREVIEW.content).map((r) => (
                  <ContentRow key={r.id} testID={`search-content-${r.id}`} row={r} onPress={onOpenContent ? () => onOpenContent(r.id) : undefined} />
                ))}
              </View>
            </Block>
          ) : null}
          {results.creators.length > 0 ? (
            <Block testID="search-section-creators">
              <SectionLabel title="Creators" action={results.creators.length > PREVIEW.creators ? { label: `See all ${results.creators.length}`, onPress: () => setTab('creators'), testID: 'search-see-all-creators' } : undefined} />
              <View style={styles.rows}>{results.creators.slice(0, PREVIEW.creators).map((p) => person(p, 'search-creator'))}</View>
            </Block>
          ) : null}
          {(answer?.communities.length ?? 0) > 0 ? (
            <Block testID="search-section-communities">
              <SectionLabel title="Communities" action={answer!.communities.length > PREVIEW.communities ? { label: `See all ${answer!.communities.length}`, onPress: () => setTab('communities'), testID: 'search-see-all-communities' } : undefined} />
              <View style={styles.rows}>{answer!.communities.slice(0, PREVIEW.communities).map(room)}</View>
            </Block>
          ) : null}
        </View>
      );
    } else if (counts[tab] === 0) {
      list = (
        <EmptyState
          testID={`search-empty-${tab}`}
          icon="SearchX"
          title={`No ${TAB_LABELS[tab].toLowerCase()} found`}
          message="Try a different search, or a shorter one."
        />
      );
    } else if (tab === 'content') {
      list = (
        <View style={styles.rows}>
          {content.map((r) => (
            <ContentRow key={r.id} testID={`search-content-${r.id}`} row={r} onPress={onOpenContent ? () => onOpenContent(r.id) : undefined} />
          ))}
        </View>
      );
    } else if (tab === 'creators') {
      list = <View style={styles.rows}>{results.creators.map((p) => person(p, 'search-creator'))}</View>;
    } else {
      list = <View style={styles.rows}>{(answer?.communities ?? []).map(room)}</View>;
    }
    body = (
      <>
        <ResultTabs value={tab} counts={counts} onChange={setTab} />
        <ScrollView testID="search-results" keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, styles.resultsScroll, { paddingBottom: insets.bottom + space.s3xl }]}>
          {list}
        </ScrollView>
      </>
    );
  }

  return (
    <View testID="search-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.head}>
        <SearchField
          testID="search-input"
          value={text}
          onChange={setText}
          onSubmit={run}
          onClear={() => setText('')}
          placeholder={words.placeholder}
          maxLength={MAX_QUERY}
          autoFocus
        />
        <Pressable testID="search-cancel" accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={space.md} onPress={onCancel}>
          <NativeText style={[font(600), { fontSize: searchMetrics.cancel, color: colors.accentFg }]}>Cancel</NativeText>
        </Pressable>
      </View>
      {body}
      <Toast message={notice} tone="alert" placement="bottom" offset={insets.bottom + space.s2xl} lines={2} duration={FOLLOW_NOTICE_MS} onHide={dismiss} testID="search-notice" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: searchMetrics.between, paddingTop: searchMetrics.top, paddingBottom: searchMetrics.bottom, paddingHorizontal: layout.gutter },
  scroll: { flexGrow: 1, paddingTop: space.sm, paddingHorizontal: layout.gutter, gap: space.s2xl },
  resultsScroll: { paddingTop: space.lg },
  block: { gap: space.md },
  rows: { gap: 0 },
  all: { gap: rowMetrics.sections },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: chipMetrics.between },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.gutter },
  nothing: { gap: space.lg },
  nothingTop: { alignItems: 'center', gap: space.xs, paddingTop: space.xl, paddingBottom: space.xs },
  nothingTitle: { fontSize: 15, marginTop: space.xs },
  centered: { textAlign: 'center' },
  skeleton: { paddingHorizontal: layout.gutter, paddingTop: space.lg, gap: space.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  skeletonWords: { flex: 1, gap: space.sm },
});
