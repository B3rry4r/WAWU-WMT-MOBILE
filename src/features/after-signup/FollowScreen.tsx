import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { VerifiedTick } from '@/components/icon';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { displayHandle, tickOf } from '@/features/explore/CreatorCard';
import { interestLabelOf } from '@/features/explore/interestLabel';
import { FOLLOW_NOTICE_MS, useFollow } from '@/features/explore/follow';
import { hueFor } from '@/features/feed/model';
import { font, space } from '@/theme';

import { fetchInterests, fetchSuggested, interestsKey, suggestedKey } from './api';

export const FOLLOW_TITLE = 'People to follow';

/** design/_gen/auth.js line 21: each person is a 52 px avatar, 12 to the words, 10 above and below, a 14 px tick. */
const PERSON = { avatar: 52, toWords: 12, padV: 10, tick: 14 } as const;

export type FollowScreenProps = {
  step?: string;
  onBack?: () => void;
  /** Go to Home. Throws when the step could not be finished. */
  onDone: () => Promise<void>;
};

/**
 * A13 · People to follow. The creators the Hub suggests for the interests saved at A12, best match first, with Follow and Following. A name
 * on this list is the name WAWU ID holds (or the handle); the line under it is the first thing the creator is into. Nobody to suggest is a
 * real answer too: the screen says so and Go to Home still works.
 */
export function FollowScreen({ step, onBack, onDone }: FollowScreenProps) {
  const picks = useQuery({ queryKey: interestsKey, queryFn: fetchInterests });
  const ids = picks.data?.selected ?? [];
  const list = useQuery({ queryKey: suggestedKey(ids), queryFn: () => fetchSuggested(ids), enabled: picks.isSuccess });
  const follow = useFollow();
  const options = picks.data?.options;
  const labelOf = (id: string | null | undefined) => interestLabelOf(options, id);

  return (
    <AuthFrame
      testID="people-to-follow"
      navTitle={FOLLOW_TITLE}
      navStep={step}
      onBack={onBack}
      footer={<DoneButton onDone={onDone} />}
    >
      {picks.isPending || (picks.isSuccess && list.isPending) ? (
        <SkeletonRows count={4} testID="follow-loading" />
      ) : picks.isError || list.isError ? (
        <ErrorState
          title="Couldn’t load people to follow"
          message="Check your connection and try again. You can still go to Home."
          onRetry={() => void (picks.isError ? picks.refetch() : list.refetch())}
          testID="follow-error"
        />
      ) : (
        <View style={styles.body}>
          <Text variant="body" tone="textSecondary">
            Based on what you picked.
          </Text>
          {(list.data ?? []).length === 0 ? (
            <EmptyState icon="Users" title="No one to suggest yet" message="Creators will show up here as they join." testID="follow-empty" />
          ) : (
            (list.data ?? []).map((person) => {
              const tick = tickOf(person);
              const role = labelOf(person.field) ?? undefined;
              return (
                <View key={person.wawuId} style={styles.person} testID={`person-${person.wawuId}`}>
                  <Avatar name={person.name} hue={hueFor(person.wawuId)} size={PERSON.avatar} source={person.avatarUrl ?? undefined} decorative />
                  <View style={styles.words}>
                    <View style={styles.nameLine}>
                      <Text variant="body" numberOfLines={1} style={[font(600), styles.name]}>
                        {person.name || displayHandle(person)}
                      </Text>
                      {tick ? <VerifiedTick kind={tick} size={PERSON.tick} /> : null}
                    </View>
                    {role ? (
                      <Text variant="secondary" tone="textMuted" numberOfLines={1}>
                        {role}
                      </Text>
                    ) : null}
                  </View>
                  <Button
                    label={person.following ? 'Following' : 'Follow'}
                    variant={person.following ? 'secondary' : 'primary'}
                    size="sm"
                    selected={person.following}
                    onPress={() => follow.toggle(person)}
                    testID={`follow-${person.wawuId}`}
                  />
                </View>
              );
            })
          )}
        </View>
      )}
      <Toast message={follow.notice} tone="alert" placement="bottom" duration={FOLLOW_NOTICE_MS} onHide={follow.dismiss} testID="follow-notice" />
    </AuthFrame>
  );
}

function DoneButton({ onDone }: { onDone: () => Promise<void> }) {
  const [state, run] = useDone(onDone);
  return (
    <>
      {state.failed ? (
        <Text variant="secondary" tone="danger" accessibilityRole="alert" testID="follow-done-failed">
          Couldn’t finish. Try again.
        </Text>
      ) : null}
      <Button label="Go to Home" onPress={run} loading={state.busy} full testID="follow-done" />
    </>
  );
}

function useDone(action: () => Promise<void>): [{ busy: boolean; failed: boolean }, () => void] {
  const [state, set] = useState({ busy: false, failed: false });
  return [
    state,
    () => {
      if (state.busy) return;
      set({ busy: true, failed: false });
      action().then(
        () => set({ busy: false, failed: false }),
        () => set({ busy: false, failed: true }),
      );
    },
  ];
}

const styles = StyleSheet.create({
  body: { gap: space.xs, paddingTop: space.sm },
  person: { flexDirection: 'row', alignItems: 'center', gap: PERSON.toWords, paddingVertical: PERSON.padV },
  words: { flex: 1, gap: space.xs },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  name: { flexShrink: 1 },
});
