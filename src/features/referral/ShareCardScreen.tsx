import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { hueFor } from '@/features/feed/model';
import { nameOf, ticksOf } from '@/features/me/model';
import { fetchMe, meKey } from '@/features/profile-edit/api';
import { canShareCard, saveCardFile, shareCardFile } from '@/features/tgif/cardFile';
import { font, layout, radius, space, useWawu } from '@/theme';

import { fetchReferrals, referralsKey } from './api';
import { pictureOfCard } from './cardPicture';
import { CARD_LINE } from './model';
import { ChatSheet } from './ChatSheet';
import { NavBar } from './parts';
import { cardMetrics, ShareCard } from './ShareCard';

/** design/_gen/referral.js `rf2`: the card centred 6 under the bar; under it a row of 56 tiles, each 76 wide with a 12 / 600 word 8 below. */
const screen = { top: 6, target: 76, tile: 56, tileIcon: 22, label: 12, labelGap: 8, footTop: 12, targetsGap: space.s3xl } as const;

export const COULD_NOT_SHARE = 'The card could not be shared. Try again.';
export const COULD_NOT_SAVE = 'The card could not be saved. Try again.';
export const SAVE_NOT_ALLOWED = 'Saving needs permission to add to your photos. Allow it in your phone settings, then try again.';
export const SAVED = 'Saved to your photos.';
const PHONE_CAN_SHARE = ['referral', 'phone-can-share'] as const;

export type ShareCardScreenProps = { onClose: () => void };

/**
 * RF2 · Share card. The card is drawn here and the picture of it goes to the phone's share sheet (R-33), not to an
 * Instagram card (R-68): the sheet lists whatever the phone has, so no outside app is named, WhatsApp included (R-68 wins over the
 * lead's first D-2b ruling). Targets that need no native change (RELEASE-02, CHECK-3 D-2b): the in-app "Who Made This? chat" (the
 * line and the link to a recent chat), Share (the system sheet, which reaches every chat app) and Save, which puts the same
 * picture in the phone's photos. The board's WhatsApp and Story targets are not drawn: Story needs a native module and both name an
 * outside brand (BACKEND_GAPS G-R2-AUTHME-2). A phone with no share sheet (the web build) shares the line and the link as text, and draws no Save.
 */
export function ShareCardScreen({ onClose }: ShareCardScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe });
  const referrals = useQuery({ queryKey: referralsKey, queryFn: fetchReferrals });
  const phone = useQuery({ queryKey: PHONE_CAN_SHARE, queryFn: canShareCard, staleTime: Infinity });
  const queryClient = useQueryClient();
  const cardRef = useRef<View>(null);
  const busy = useRef(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [chatting, setChatting] = useState(false);

  const link = referrals.data?.link;
  const ready = Boolean(me.data && link);
  const asPicture = phone.data === true;

  /** One press at a time: a second tap while the first is still working does nothing. */
  const once = async (work: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setProblem(null);
    setSaved(false);
    try {
      await work();
    } finally {
      busy.current = false;
    }
  };

  const share = () =>
    once(async () => {
      try {
        // Pressed before the phone has said whether it can share a picture: wait for that answer (one probe, shared with the one
        // already running) rather than send the text in the picture's place (SWEEP-APP row REF-03 L5).
        const picture = phone.isPending
          ? (await queryClient.fetchQuery({ queryKey: PHONE_CAN_SHARE, queryFn: canShareCard, staleTime: Infinity }).catch(() => false)) === true
          : asPicture;
        if (picture) await shareCardFile(await pictureOfCard(cardRef), 'Share your invite');
        else await Share.share({ message: `${CARD_LINE} ${link ?? ''}`.trim() });
      } catch {
        setProblem(COULD_NOT_SHARE);
      }
    });

  const save = () =>
    once(async () => {
      try {
        const out = await saveCardFile(await pictureOfCard(cardRef));
        if (out === 'saved') setSaved(true);
        else setProblem(SAVE_NOT_ALLOWED);
      } catch {
        setProblem(COULD_NOT_SAVE);
      }
    });

  const failed = (me.isError && !me.data) || (referrals.isError && !referrals.data);
  const retry = () => {
    if (me.isError) void me.refetch();
    if (referrals.isError) void referrals.refetch();
  };

  return (
    <View testID="invite-card-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Share card" onBack={onClose} backIcon="X" backLabel="Close" idPrefix="invite-card" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} testID="invite-card-scroll">
        {ready && me.data && link ? (
          <ShareCard
            viewRef={cardRef}
            name={nameOf(me.data)}
            hue={hueFor(me.data.wawuUserId)}
            avatarUrl={me.data.avatarUrl}
            ticks={ticksOf(me.data)}
            link={link}
          />
        ) : failed ? (
          <ErrorState
            title="Couldn't load your card"
            message="Check your connection and try again."
            onRetry={retry}
            testID="invite-card-error"
          />
        ) : (
          <LoadingView label="Loading your card" testID="invite-card-loading">
            <Skeleton width={cardMetrics.width} height={cardMetrics.height} radius={cardMetrics.radius} />
          </LoadingView>
        )}
        {saved ? (
          <Text variant="muted" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="invite-card-saved">
            {SAVED}
          </Text>
        ) : null}
        {problem ? (
          <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="invite-card-problem">
            {problem}
          </Text>
        ) : null}
      </ScrollView>
      {ready ? (
        <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Target icon="Send" label="Who Made This? chat" onPress={() => setChatting(true)} testID="invite-card-chat" />
          <Target icon="Share" label="Share" onPress={() => void share()} testID="invite-card-share" />
          {asPicture ? <Target icon="ImageDown" label="Save" onPress={() => void save()} testID="invite-card-save" /> : null}
        </View>
      ) : null}
      <ChatSheet visible={chatting} onClose={() => setChatting(false)} text={`${CARD_LINE} ${link ?? ''}`.trim()} />
    </View>
  );
}

function Target({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={testID} style={styles.target}>
      {({ pressed }) => (
        <>
          <View style={[styles.tile, { backgroundColor: pressed ? colors.borderHairline : colors.surfaceSunken }]}>
            <Icon name={icon} size={screen.tileIcon} color={colors.textPrimary} />
          </View>
          <Text variant="body" style={[font(600), styles.targetLabel]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  body: { flexGrow: 1, alignItems: 'center', paddingTop: screen.top, paddingHorizontal: layout.gutter, gap: space.lg },
  foot: { paddingTop: screen.footTop, paddingHorizontal: layout.gutter, flexDirection: 'row', justifyContent: 'center', gap: screen.targetsGap },
  target: { width: screen.target, alignItems: 'center', gap: screen.labelGap },
  tile: { width: screen.tile, height: screen.tile, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
  targetLabel: { fontSize: screen.label, textAlign: 'center' },
});
