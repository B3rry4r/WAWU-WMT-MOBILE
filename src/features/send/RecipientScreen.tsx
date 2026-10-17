import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { GroupedList } from '@/components/Card';
import { ListRow } from '@/components/ListRow';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { isNoWallet, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { space } from '@/theme';

import { recentRecipientsQuery, searchRecipientsQuery, SEARCH_MIN_CHARS, type Recipient } from './api';
import { hueOfPayee, payeeLine, payeeOf, searchText, type Payee } from './model';
import { PayeeTick, RecentChip, RecipientSearch, SEND, SEND_WAYS, useSettled, type SendWay } from './parts';

/** The Hub's search text is 60 characters at most (`GET /money/recipients`, `q` maxLength). */
const SEARCH_MAX = 60;
/** How long the typing rests before the Hub is asked (it allows 20 searches a minute from one address). */
const SETTLE_MS = 350;

export type RecipientScreenProps = {
  onBack: () => void;
  onPick: (payee: Payee) => void;
  /** The Bank account tab: W8. */
  onBank: () => void;
};

/**
 * W7 · Send · to a WAWU user: search by name, @handle or phone, the people sent to most recently, and the people the search finds
 * (people with an open wallet; blocked people never appear). Picking one goes to W9.
 *
 * The Bank account tab opens W8 (WALLET-03), which replaces this screen so the two tabs never pile up. The canvas's "On WAWU" list under
 * Recent is the search result: the Hub serves no list of suggestions, so with nothing typed the screen shows Recent and what to type.
 */
export function RecipientScreen({ onBack, onPick, onBank }: RecipientScreenProps) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const [typed, setTyped] = useState('');
  const q = searchText(useSettled(typed, SETTLE_MS));
  const searching = q.length >= SEARCH_MIN_CHARS;

  const recent = useQuery(recentRecipientsQuery(owner), queryClient);
  const found = useQuery(searchRecipientsQuery(owner, q), queryClient);

  // Nobody has a wallet until they open one (R-6): either read says so, and the way in opens, once.
  const led = useRef(false);
  const noWallet = isNoWallet(recent.error) || isNoWallet(found.error);
  useEffect(() => {
    if (noWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [noWallet, entry]);

  let body;
  if (searching) {
    body = <Results query={found} onPick={onPick} />;
  } else {
    body = (
      <>
        {typed.trim().length > 0 ? (
          <Text variant="meta" testID="send-search-hint" accessibilityLiveRegion="polite">
            Type at least {SEARCH_MIN_CHARS} characters.
          </Text>
        ) : null}
        <Recent query={recent} onPick={onPick} />
      </>
    );
  }

  return (
    <AuthFrame testID="send-recipient-screen" navTitle="Send money" onBack={onBack}>
      <View style={styles.body}>
        <SegmentedTabs<SendWay>
          testID="send-ways"
          label="Who to send to"
          items={SEND_WAYS}
          value="user"
          onChange={(way) => {
            if (way === 'bank') onBank();
          }}
        />
        <RecipientSearch testID="send-search" value={typed} maxLength={SEARCH_MAX} onChange={setTyped} />
        {body}
      </View>
    </AuthFrame>
  );
}

function sentence(error: unknown): string | undefined {
  return isApiError(error) && error.message ? error.message : undefined;
}

function Recent({ query, onPick }: { query: UseQueryResult<Recipient[]>; onPick: (p: Payee) => void }) {
  if (query.isPending && query.isFetching) {
    return <SkeletonRows count={1} testID="send-recent-loading" />;
  }
  if (query.isError && !isNoWallet(query.error)) {
    return (
      <ErrorState
        testID="send-recent-error"
        icon={isApiError(query.error) && query.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your recent people"
        message={sentence(query.error) ?? 'Search for someone instead, or try again.'}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const people = (query.data ?? []).map(payeeOf);
  if (people.length === 0) {
    return (
      <EmptyState
        testID="send-recent-empty"
        icon="Users"
        title="Who are you sending to?"
        message="Search by name, @handle or phone number. People you send to show up here."
      />
    );
  }
  return (
    <View testID="send-recent" style={styles.section}>
      <Text variant="label">Recent</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
        {people.map((p) => (
          <RecentChip key={p.wawuUserId} payee={p} onPress={() => onPick(p)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Results({ query, onPick }: { query: UseQueryResult<Recipient[]>; onPick: (p: Payee) => void }) {
  if (query.isPending) return <SkeletonRows count={4} testID="send-results-loading" />;
  if (query.isError) {
    if (isNoWallet(query.error)) return null;
    return (
      <ErrorState
        testID="send-results-error"
        icon={isApiError(query.error) && query.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't search"
        message={sentence(query.error) ?? 'Check your connection and try again.'}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const people = query.data.map(payeeOf);
  if (people.length === 0) {
    return <EmptyState testID="send-results-empty" icon="Search" title="No one found" message="Check the spelling, or try their @handle or phone number. Only people with a wallet can be sent money." />;
  }
  return (
    <View testID="send-results" style={styles.section}>
      <Text variant="label">On Who Made This</Text>
      <GroupedList>
        {people.map((p) => (
          <ListRow
            key={p.wawuUserId}
            testID={`result-${p.wawuUserId}`}
            lead={<Avatar name={p.name} hue={hueOfPayee(p)} size={SEND.rowAvatar} source={p.avatarUrl ?? undefined} decorative />}
            title={p.name}
            titleAccessory={<PayeeTick payee={p} />}
            subtitle={payeeLine(p) || undefined}
            onPress={() => onPick(p)}
          />
        ))}
      </GroupedList>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  section: { gap: SEND.sectionGap },
  recentRow: { gap: SEND.recentBetween },
});
