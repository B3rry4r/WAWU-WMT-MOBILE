import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Banner } from '@/components/Banner';
import { ListRow } from '@/components/ListRow';
import { SkeletonRows } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { font, space, useWawu } from '@/theme';

import { fetchSetupState, setupKey, type SetupState } from './api';

export const SETUP_TITLE = 'Set up your account';

/** design/_gen/auth.js line 17, `setRow`: a finished row is drawn at 70% (the kit's own figure). */
const DONE_OPACITY = 0.7;
/** The kit's `setRow` and `txIcon`: a 40 px round icon, the row cards 8 apart, the top card 14 by 16. */
const SETUP = { icon: 40, between: 8, topPadV: 14, topPadH: 16 } as const;

export type SetupTarget = 'paid' | 'profile' | 'publish' | 'community' | 'wallet';
type Row = { target: SetupTarget; icon: 'MessageCircle' | 'UserRound' | 'Upload' | 'Users' | 'IdCard'; title: string; line: string; done: boolean | undefined };

/** The line under each row. A figure the system does not back ("Free to list") is not written here (BACKEND_GAPS G-171). */
function rowsOf(state: SetupState | undefined): Row[] {
  return [
    { target: 'paid', icon: 'MessageCircle', title: 'Price your paid messages', line: 'Fans pay to ask you', done: state?.priced },
    { target: 'profile', icon: 'UserRound', title: 'Finish your profile', line: 'Photo, bio, socials', done: state?.profile },
    {
      target: 'publish',
      icon: 'Upload',
      title: 'Publish your first piece',
      line: state?.published === undefined ? '' : state.published ? 'You have published' : 'Nothing published yet',
      done: state?.published,
    },
    {
      target: 'community',
      icon: 'Users',
      title: 'Start your first community',
      line: state?.community === undefined ? '' : state.community ? 'You host a community' : 'None started yet',
      done: state?.community,
    },
    { target: 'wallet', icon: 'IdCard', title: 'Verify your identity', line: 'Needed to get paid', done: state?.wallet },
  ];
}

export type CreatorSetupScreenProps = {
  /** Later: the checklist is put off and Home opens (or, opened from "Become a creator", the screen before). */
  onLater: () => void;
  laterBusy?: boolean;
  laterFailed?: boolean;
  onOpen: (target: SetupTarget) => void;
};

/** The first card's words for what the person's tier lets them do (R-43). `undefined`: the tier is not known, so uploading is not mentioned. */
export function uploadingCard(state: 'none' | 'active' | 'ending' | 'ended' | undefined): { title: string; line?: string } {
  if (state === 'active' || state === 'ending') return { title: 'Uploading is open', line: 'Your earnings wait until you open your wallet' };
  if (state === 'none' || state === 'ended') return { title: 'Uploading needs a tier', line: 'Drafts are free. Pick a tier when you are ready to publish.' };
  return { title: 'Your earnings wait until you open your wallet' };
}

/**
 * A11 · Set up your account. The checklist of what a new earning account does next, each row opening the screen that does it. A row is
 * ticked when the Hub says it is done; the count is the rows ticked of the rows drawn. "Start your first community" (I32, INBOX-14) is the
 * fourth row, ticked when the person is the host of a room, so the count is of five; the board's "Free to host" under it is not backed
 * (G-INBOX-14-1) and is not written. The first card says what is true of the person's tier (SWEEP-FLOWS B6, R-43): uploading is open with one,
 * needs one without, and earnings wait for the wallet (R-11, BRIEF A11).
 */
export function CreatorSetupScreen({ onLater, laterBusy, laterFailed, onOpen }: CreatorSetupScreenProps) {
  const { colors } = useWawu();
  const state = useQuery({ queryKey: setupKey, queryFn: fetchSetupState, staleTime: 0 });
  const refetch = state.refetch;
  // Coming back from a row (the profile saved, a price set) re-reads, so the tick is there when the screen is.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
  // What the first card says about uploading is the tier's (R-43): open with one, needing one without. Not read yet or not readable, it claims nothing.
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false });
  const refetchTier = tier.refetch;
  useFocusEffect(
    useCallback(() => {
      void refetchTier();
    }, [refetchTier]),
  );
  const top = uploadingCard(tier.data?.state);
  const rows = rowsOf(state.data);
  const known = state.data !== undefined && !state.data.failed;
  const doneCount = rows.filter((r) => r.done === true).length;

  return (
    <AuthFrame
      testID="creator-setup"
      navTitle={SETUP_TITLE}
      navAction={
        <Pressable accessibilityRole="button" accessibilityLabel="Later" onPress={onLater} disabled={laterBusy} testID="setup-later" hitSlop={space.md}>
          <Text variant="body" style={[font(600), styles.later, { color: colors.accentFg }]}>
            Later
          </Text>
        </Pressable>
      }
    >
      <View style={styles.stack}>
        {laterFailed ? <Banner tone="danger" title="Couldn’t put this off" body="Check your connection and tap Later again." testID="setup-later-failed" /> : null}
        <Card padded>
          <View style={styles.top}>
            <View style={styles.topWords}>
              <Text variant="body" style={font(600)} testID="setup-top-title">
                {top.title}
              </Text>
              {top.line ? (
                <Text variant="secondary" tone="textMuted" testID="setup-top-line">
                  {top.line}
                </Text>
              ) : null}
            </View>
            {known ? <StatusPill tone="accent" label={`${doneCount} of ${rows.length}`} testID="setup-count" /> : null}
          </View>
        </Card>
        {state.isError || state.data?.failed ? (
          <Pressable accessibilityRole="button" onPress={() => void refetch()} testID="setup-retry">
            <Banner tone="warning" title="Couldn’t check your progress" body="Tap to try again. The steps below still open." testID="setup-read-failed" />
          </Pressable>
        ) : null}
        {state.isPending ? (
          <SkeletonRows count={rows.length} testID="setup-loading" />
        ) : (
          <View style={styles.rows}>
            {rows.map((row) => (
              <View key={row.target} style={row.done ? { opacity: DONE_OPACITY } : undefined}>
                <Card>
                  <ListRow
                    testID={`setup-row-${row.target}`}
                    lead={
                      row.done ? (
                        <IconTile icon="Check" tone="in" size={SETUP.icon} strokeWidth={2.6} />
                      ) : (
                        <IconTile icon={row.icon} tone="accent" size={SETUP.icon} />
                      )
                    }
                    title={row.title}
                    subtitle={row.line || undefined}
                    trailing={<Icon name="ChevronRight" size={17} color={colors.textMuted} />}
                    onPress={() => onOpen(row.target)}
                    accessibilityLabel={[row.title, row.line, row.done ? 'Done' : ''].filter(Boolean).join(', ')}
                  />
                </Card>
              </View>
            ))}
          </View>
        )}
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.md, paddingTop: space.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  topWords: { flex: 1, gap: space.xs },
  rows: { gap: SETUP.between },
  later: { fontSize: 14, textAlign: 'right' },
});
