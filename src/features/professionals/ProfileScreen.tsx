import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Icon, VerifiedTick } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { hueFor } from '@/features/feed/model';
import { canvasNormalLineHeight, font, layout, radius, space, type, useWawu } from '@/theme';

import { fetchProfile, prosKeys, type DirectoryProfile } from './api';
import { credentialLine, credentialTitle, hasProTick, takesMessages } from './model';
import { ProsNav, RefreshFailed } from './parts';

/**
 * design/_gen/pros.js `profile`: the body pads 8 above with 18 between its parts. The head row: a 64 avatar 14 from the
 * words, the name 19 at 700 with an 18 tick 6 after it, the headline 14 (3 under), the field 12.5 at 600 in the accent
 * (4 under). `contact(false)` (P3): the kit's large button (54 high, 24 across, a 19 icon 7 from a 16 bold label at
 * -0.01em) in its disabled look, 8 above a 12.5 muted line. About and "What they take on": a label 8 above a 14 line at
 * 1.55, and 30 high chips 12 across in 13, 7 apart. Credentials: the kit's card padded 14 by 16, a label, a 17
 * ShieldCheck 8 from a 14 bold line, and a 13 muted line, 8 apart.
 */
export const profileMetrics = {
  bodyTop: space.sm,
  gap: 18,
  bottom: 40,
  avatar: 64,
  headGap: 14,
  name: 19,
  tick: 18,
  tickGap: 6,
  headline: 14,
  headlineGap: 3,
  field: 12.5,
  fieldGap: 4,
  stack: 8,
  closedHeight: 54,
  closedPadH: 24,
  closedIcon: 19,
  closedIconGap: 7,
  closedLabel: 16,
  closedTracking: -0.01,
  note: 12.5,
  about: 14,
  aboutLeading: 1.55,
  chipHeight: 30,
  chipPadH: 12,
  chip: 13,
  chipGap: 7,
  credPadV: 14,
  credPadH: 16,
  credIcon: 17,
  credTitle: 14,
  credLine: 13,
} as const;

export type ProfileScreenProps = {
  id: string;
  onBack: () => void;
};

/** P2 and P3: one professional's profile. P3 when they are not taking messages. */
export function ProfileScreen({ id, onBack }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const profile = useQuery({ queryKey: prosKeys.profile(id), queryFn: () => fetchProfile(id) }, queryClient);
  const [pulled, setPulled] = useState(false);
  const { refetch } = profile;

  const onRefresh = useCallback(async () => {
    setPulled(true);
    try {
      await refetch();
    } finally {
      setPulled(false);
    }
  }, [refetch]);

  let body;
  let centred = false;
  if (profile.isPending) {
    body = <ProfileSkeleton />;
  } else if (profile.isError && !profile.data) {
    centred = true;
    const failure = profile.error;
    if (isApiError(failure) && failure.kind === 'not_found') {
      body = (
        <EmptyState
          testID="pro-gone"
          icon="BriefcaseBusiness"
          title="This listing isn’t available"
          message="They may have stopped listing for now. Find someone else in this field."
          action={{ label: 'Back to professionals', onPress: onBack }}
        />
      );
    } else {
      const offline = isApiError(failure) && failure.kind === 'network';
      body = (
        <ErrorState
          testID="pro-error"
          title="Couldn’t load this profile"
          message={offline ? 'No connection. Check your internet and try again.' : isApiError(failure) ? failure.message : 'Something went wrong. Try again.'}
          icon={offline ? 'WifiOff' : 'TriangleAlert'}
          onRetry={() => void refetch()}
        />
      );
    }
  } else {
    body = (
      <>
        {profile.isRefetchError ? <RefreshFailed onRetry={() => void refetch()} testID="pro-refresh-failed" /> : null}
        <ProfileBody profile={profile.data} />
      </>
    );
  }

  return (
    <View testID="pro-profile" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <ProsNav title="Professional" onBack={onBack} />
      <ScrollView
        testID="pro-scroll"
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + profileMetrics.bottom }, centred && styles.centred]}
        refreshControl={<RefreshControl refreshing={pulled} onRefresh={() => void onRefresh()} tintColor={colors.accent} />}
      >
        {body}
      </ScrollView>
    </View>
  );
}

function ProfileBody({ profile }: { profile: DirectoryProfile }) {
  const { colors } = useWawu();
  const credential = credentialTitle(profile.credentialKind);
  const services = profile.services.filter((s) => s.trim() !== '');
  return (
    <>
      <View style={styles.head}>
        <Avatar name={profile.name} hue={hueFor(profile.wawuId)} size={profileMetrics.avatar} source={profile.avatarUrl ?? undefined} decorative />
        <View style={styles.words}>
          <View style={styles.nameLine}>
            <Text variant="body" accessibilityRole="header" style={styles.name} testID="pro-name">
              {profile.name}
            </Text>
            {hasProTick(profile) ? <VerifiedTick kind="pro" size={profileMetrics.tick} /> : null}
          </View>
          <Text variant="body" tone="textSecondary" style={styles.headline} testID="pro-headline">
            {profile.headline}
          </Text>
          <Text variant="body" tone="accentFg" style={styles.field} testID="pro-field">
            {profile.field.label}
          </Text>
        </View>
      </View>
      {/* P2's "Ask a question · price" and the reply promise under it are INBOX-10's (the paid message they open); P3's closed state is this task's. */}
      {takesMessages(profile) ? null : (
        <View style={styles.stack} testID="pro-closed">
          <View
            accessible
            accessibilityLabel="Not taking messages"
            style={[styles.closed, { backgroundColor: colors.surfaceSunken }]}
          >
            <Icon name="MessageCircleOff" size={profileMetrics.closedIcon} color={colors.textDisabled} strokeWidth={2.2} />
            <Text variant="body" tone="textDisabled" numberOfLines={1} style={styles.closedLabel}>
              Not taking messages
            </Text>
          </View>
          <Text variant="body" tone="textMuted" style={styles.note}>
            Check back later, or find someone else in this field.
          </Text>
        </View>
      )}
      {profile.about.trim() !== '' ? (
        <View style={styles.stack}>
          <Text variant="label" style={styles.label}>
            About
          </Text>
          <Text variant="body" tone="textSecondary" style={styles.about} testID="pro-about">
            {profile.about}
          </Text>
        </View>
      ) : null}
      {services.length > 0 ? (
        <View style={styles.stack} testID="pro-services">
          <Text variant="label" style={styles.label}>
            What they take on
          </Text>
          <View style={styles.chips}>
            {services.map((s) => (
              <View key={s} style={[styles.chip, { backgroundColor: colors.surfaceSunken }]}>
                <Text variant="body" tone="textSecondary" style={styles.chipText}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <Card style={styles.cred} testID="pro-credentials">
        <View style={styles.stack}>
          <Text variant="label" style={styles.label}>
            Credentials
          </Text>
          {credential ? (
            <View style={styles.credRow}>
              <Icon name="ShieldCheck" size={profileMetrics.credIcon} color={colors.positive} strokeWidth={2} />
              <Text variant="body" style={styles.credTitle}>
                {credential}
              </Text>
            </View>
          ) : null}
          <Text variant="body" tone="textMuted" style={styles.credLine} testID="pro-credential-line">
            {credentialLine(profile.issuingBody)}
          </Text>
        </View>
      </Card>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <LoadingView testID="pro-loading" label="Loading profile">
      <View style={styles.skeleton}>
        <View style={styles.head}>
          <Skeleton width={profileMetrics.avatar} height={profileMetrics.avatar} radius={radius.chip} />
          <View style={[styles.words, styles.skeletonLines]}>
            <Skeleton width="60%" height={profileMetrics.name} />
            <Skeleton width="80%" height={profileMetrics.headline} />
          </View>
        </View>
        <Skeleton height={profileMetrics.closedHeight} radius={radius.button} />
        <Skeleton height={type.size.body * 3} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingTop: profileMetrics.bodyTop, paddingHorizontal: layout.gutter, gap: profileMetrics.gap },
  centred: { justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: profileMetrics.headGap },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: profileMetrics.tickGap },
  name: { ...font(700), flexShrink: 1, fontSize: profileMetrics.name, lineHeight: canvasNormalLineHeight(profileMetrics.name) },
  headline: { fontSize: profileMetrics.headline, lineHeight: canvasNormalLineHeight(profileMetrics.headline), marginTop: profileMetrics.headlineGap },
  field: { ...font(600), fontSize: profileMetrics.field, lineHeight: canvasNormalLineHeight(profileMetrics.field), marginTop: profileMetrics.fieldGap },
  stack: { gap: profileMetrics.stack },
  closed: {
    height: profileMetrics.closedHeight,
    paddingHorizontal: profileMetrics.closedPadH,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: profileMetrics.closedIconGap,
  },
  closedLabel: { ...font(700), fontSize: profileMetrics.closedLabel, lineHeight: canvasNormalLineHeight(profileMetrics.closedLabel), letterSpacing: profileMetrics.closedTracking * profileMetrics.closedLabel },
  note: { fontSize: profileMetrics.note, lineHeight: canvasNormalLineHeight(profileMetrics.note), textAlign: 'center' },
  label: { lineHeight: canvasNormalLineHeight(type.size.label) },
  about: { fontSize: profileMetrics.about, lineHeight: profileMetrics.about * profileMetrics.aboutLeading },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: profileMetrics.chipGap },
  chip: { height: profileMetrics.chipHeight, paddingHorizontal: profileMetrics.chipPadH, borderRadius: radius.chip, justifyContent: 'center' },
  chipText: { fontSize: profileMetrics.chip, lineHeight: canvasNormalLineHeight(profileMetrics.chip) },
  cred: { paddingVertical: profileMetrics.credPadV, paddingHorizontal: profileMetrics.credPadH },
  credRow: { flexDirection: 'row', alignItems: 'center', gap: profileMetrics.stack },
  credTitle: { ...font(600), fontSize: profileMetrics.credTitle, lineHeight: canvasNormalLineHeight(profileMetrics.credTitle) },
  credLine: { fontSize: profileMetrics.credLine, lineHeight: canvasNormalLineHeight(profileMetrics.credLine) },
  skeleton: { gap: profileMetrics.gap },
  skeletonLines: { gap: space.sm },
});
