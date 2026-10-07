import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Avatar, hues, type AvatarHue } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font } from '@/theme';

import { fetchBlocked, settingsKeys, unblock, type BlockedAccount, type BlockedList } from './api/hub';
import { loadProblem, sentenceOf } from './failure';
import { startedInThisSession, useSignedIn } from './sessionGuard';
import { SettingsFrame } from './SettingsFrame';

/** design/_gen/settings.js line 16 (Z5): rows 10 above and below, an avatar of 48, 12 between, a 15 name at 600; the body keeps its parts 4 apart. */
const blockedMetrics = { padV: 10, avatar: 48, between: 12, name: 15, body: 4 } as const;
/** The caption under the list, as Z5 draws it. */
export const BLOCKED_CAPTION = "They can't message you, see your profile or find you in search.";
/**
 * Z12 centres its words in a body the kit pads 120 at the foot (design/_gen/kit.js line 35, `body`'s default `pb`);
 * the frame already keeps 40, so the empty state lifts by the other 80.
 */
const EMPTY_LIFT = 80;
/** A block whose person is no longer there (the Hub sends `blockedUser: null`). */
export const REMOVED_ACCOUNT = 'Account removed';

export type BlockedScreenProps = { onBack: () => void };

/** A stable colour for a person, so their avatar does not change between visits. */
export function hueOf(id: string): AvatarHue {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return hues[sum % hues.length] ?? 'lilac';
}

/**
 * Z5 · Blocked accounts, and Z12 when nobody is. The list is `GET /settings/privacy/blocked`; Unblock is
 * `DELETE /settings/privacy/blocked/{id}` (the block's own row id). An unblocked person leaves the list at
 * once; if that was the last one, the screen becomes Z12.
 */
export function BlockedScreen({ onBack }: BlockedScreenProps) {
  const signedIn = useSignedIn();
  const list = useQuery({ queryKey: settingsKeys.blocked, queryFn: fetchBlocked, enabled: signedIn });
  const client = useQueryClient();
  const [working, setWorking] = useState<readonly string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const inFlight = useRef(new Set<string>());
  const loadFailure = loadProblem(list.error);

  const drop = (id: string) =>
    client.setQueryData<BlockedList>(settingsKeys.blocked, (old) =>
      old ? { rows: old.rows.filter((item) => item.id !== id), total: Math.max(0, old.total - 1) } : old,
    );

  const remove = async (row: BlockedAccount) => {
    if (inFlight.current.has(row.id)) return;
    inFlight.current.add(row.id);
    const sameSession = startedInThisSession();
    setWorking([...inFlight.current]);
    setProblem(null);
    try {
      await unblock(row.id);
      // Signed out meanwhile (or another account in): the list now is someone else's, so the answer is dropped.
      if (sameSession()) drop(row.id);
    } catch (error) {
      if (!sameSession()) return;
      // A block that is already gone (another phone unblocked it) is what the person asked for.
      if (isApiError(error) && error.kind === 'not_found') {
        drop(row.id);
      } else {
        setProblem(sentenceOf(error, 'That did not unblock. Try again.'));
      }
    } finally {
      inFlight.current.delete(row.id);
      setWorking([...inFlight.current]);
    }
  };

  const empty = list.data?.rows.length === 0;
  return (
    <SettingsFrame title="Blocked accounts" onBack={onBack} gap={blockedMetrics.body} testID="blocked-screen">
      {list.isError && !list.data ? (
        <ErrorState
          testID="blocked-error"
          icon={loadFailure.icon}
          title={loadFailure.title}
          message={loadFailure.message}
          onRetry={() => void list.refetch()}
        />
      ) : !list.data ? (
        <SkeletonRows count={3} testID="blocked-loading" />
      ) : empty ? (
        <View style={styles.empty}>
          <EmptyState testID="blocked-empty" icon="Ban" title="Nobody blocked" message="Block someone from their profile menu." />
        </View>
      ) : (
        <>
          {list.data.rows.map((row) => {
            const name = row.blockedUser?.name ?? REMOVED_ACCOUNT;
            return (
              <View key={row.id} testID={`blocked-row-${row.id}`} style={styles.row}>
                <Avatar name={name} hue={hueOf(row.blockedWawuId)} size={blockedMetrics.avatar} source={row.blockedUser?.avatarUrl ?? undefined} decorative />
                <Text variant="body" numberOfLines={1} style={[font(600), styles.name]}>
                  {name}
                </Text>
                <Button
                  label="Unblock"
                  variant="secondary"
                  size="sm"
                  loading={working.includes(row.id)}
                  onPress={() => void remove(row)}
                  testID={`blocked-unblock-${row.id}`}
                />
              </View>
            );
          })}
          {problem ? (
            <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="blocked-problem">
              {problem}
            </Text>
          ) : null}
          <Text variant="muted" testID="blocked-caption">
            {BLOCKED_CAPTION}
          </Text>
        </>
      )}
    </SettingsFrame>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: blockedMetrics.between, paddingVertical: blockedMetrics.padV },
  name: { flex: 1, minWidth: 0, fontSize: blockedMetrics.name },
  empty: { flex: 1, justifyContent: 'center', paddingBottom: EMPTY_LIFT },
});
