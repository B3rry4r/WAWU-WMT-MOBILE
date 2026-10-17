import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { BottomSheet } from '@/components/BottomSheet';
import { Button, IconButton } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { KeyValueRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { gradientEnds } from '@/components/MediaCard';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Banner } from '@/components/Banner';
import { openLink } from '@/features/about/links';
import { canPlay } from '@/features/feed/player';
import { font, layout, radius, space, useWawu } from '@/theme';

import { fetchMyId, fetchWork, myIdKey, removeWork, workKey, worksRoot, type WorkDetail } from './api';
import { readFailure, removeFailure } from './failure';
import { factsOf, isWebLink, shareText } from './model';
import { WorkCover } from './WorkCover';
import { WorksFrame } from './WorksFrame';

/**
 * design/_gen/me.js line 71 (M35): the picture is 280 high from the top edge, darkened 35% at the top
 * fading out by 40%; the title sits 38 below it (50 for the status bar, 6, the 42 bar, then 220 of padding,
 * less the picture's 280); 14 between the parts; the strip is 84 high with 14 corners and 8 between; the
 * creator row is 40 across with the name at 14.5, on the page colour, 12 above and 34 below.
 */
const heroMetrics = { height: 280, scrimEnd: 0.4, playButton: 56, playIcon: 24 } as const;
const bodyMetrics = { top: 38, stack: 14, thumb: 84, thumbRadius: 14, thumbGap: space.sm, thumbsShown: 3, bottomRoom: 140 } as const;
const navTop = 6;
const footMetrics = { avatar: 40, name: 14.5, top: space.md, bottom: 34, between: 10 } as const;
const removeMetrics = { icon: 18, label: 14.5, gap: space.sm } as const;
const descriptionMetrics = { size: 14.5, line: 1.55 } as const;

export type WorkScreenProps = {
  wawuId: string;
  workId: string;
  onBack: () => void;
  /** Opens the creator's profile. Left out until that screen exists, and then the creator row is only a label. */
  onOpenCreator?: (wawuId: string) => void;
  /** After the owner has confirmed Remove and the work is gone: the route goes back to M34, whose count has already been told to refresh. */
  onRemoved: () => void;
};

/**
 * M35 · A work. Reads `GET /users/{wawuId}/featured-works/{workId}`: the work and whose it is. A
 * photo is the picture at the top; a video plays there where this build can play one. The other
 * photos and videos sit in a strip under the words, and choosing one brings it up to the top. The person who
 * made the work (and nobody else) also sees Remove, which asks first and then deletes it (`DELETE /users/me/featured-works/{id}`).
 */
export function WorkScreen({ wawuId, workId, onBack, onOpenCreator, onRemoved }: WorkScreenProps) {
  const work = useQuery({ queryKey: workKey(wawuId, workId), queryFn: () => fetchWork(wawuId, workId) });

  if (work.data) return <Work work={work.data} onBack={onBack} onOpenCreator={onOpenCreator} onRemoved={onRemoved} />;

  if (work.isError) {
    const gone = isApiError(work.error) && work.error.kind === 'not_found';
    const offline = isApiError(work.error) && work.error.kind === 'network';
    return (
      <WorksFrame title="Work" onBack={onBack} testID="work-problem">
        {gone ? (
          <ErrorState testID="work-unavailable" icon="CircleAlert" title="This work is not available" message="It may have been removed." />
        ) : (
          <ErrorState
            testID="work-error"
            icon={offline ? 'WifiOff' : 'CircleAlert'}
            title="The work did not load"
            message={readFailure(work.error)}
            onRetry={() => void work.refetch()}
          />
        )}
      </WorksFrame>
    );
  }

  return (
    <WorksFrame title="Work" onBack={onBack} testID="work-loading-frame">
      <LoadingView label="Loading the work" testID="work-loading">
        <View style={styles.loading}>
          <Skeleton height={heroMetrics.height / 2} radius={radius.media} />
          <Skeleton width="70%" height={heroMetrics.playIcon} />
          <Skeleton height={bodyMetrics.thumb} radius={radius.card} />
          <Skeleton height={bodyMetrics.thumb / 2} />
        </View>
      </LoadingView>
    </WorksFrame>
  );
}

type WorkProps = { work: WorkDetail; onBack: () => void; onOpenCreator?: (wawuId: string) => void; onRemoved: () => void };

function Work({ work, onBack, onOpenCreator, onRemoved }: WorkProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState(false);
  const [asking, setAsking] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  // Whose page this is decides whether Remove is offered: only the person who made the work. Until that is known (or if it cannot be read) it is not.
  const me = useQuery({ queryKey: myIdKey, queryFn: fetchMyId });
  const own = me.data !== undefined && me.data === work.owner.wawuId;

  // The lists and the profile are told to read again. This work's own query is left alone: it would answer 404 to a screen that is on its way out.
  const refreshLists = () => {
    void queryClient.invalidateQueries({ queryKey: worksRoot, predicate: (query) => !(query.queryKey[2] === 'one' && query.queryKey[3] === work.id) });
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const remove = useMutation({
    mutationFn: () => removeWork(work.id),
    onMutate: () => setRemoveError(null),
    onSuccess: () => {
      setAsking(false);
      AccessibilityInfo.announceForAccessibility('Work removed');
      refreshLists();
      onRemoved();
    },
    onError: (error) => {
      const out = removeFailure(error);
      if (out.gone) {
        // Already gone (removed on another device): the same result as removing it here.
        setAsking(false);
        refreshLists();
        onRemoved();
        return;
      }
      setRemoveError(out.message);
    },
  });

  const hero = work.media[shown] ?? null;
  const others = work.media.map((media, index) => ({ media, index })).filter((item) => item.index !== shown);
  const thumbWidth = (width - 2 * layout.gutter - (bodyMetrics.thumbsShown - 1) * bodyMetrics.thumbGap) / bodyMetrics.thumbsShown;
  const facts = factsOf(work);
  const video = hero?.kind === 'video' && hero.url !== null && canPlay;

  const share = async () => {
    setNotice(false);
    try {
      await Share.share({ message: shareText(work) });
    } catch {
      setNotice(true);
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };

  const choose = (index: number) => {
    setPlaying(false);
    setShown(index);
  };

  const scrim = { colors: [colors.mediaBlack35, colors.mediaBlack0] as const, locations: [0, heroMetrics.scrimEnd] as const };
  const ends = gradientEnds(180);

  return (
    <View testID="work-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + bodyMetrics.bottomRoom }}
        showsVerticalScrollIndicator={false}
      >
        <View testID="work-hero" style={[styles.hero, { backgroundColor: colors.surfaceSunken }]}>
          <WorkCover media={hero} playing={playing} onEnded={() => setPlaying(false)} testID="work-hero-cover" />
          <LinearGradient pointerEvents="none" colors={scrim.colors} locations={scrim.locations} start={ends.start} end={ends.end} style={StyleSheet.absoluteFill} />
          {video ? (
            <Pressable
              testID="work-play"
              accessibilityRole="button"
              accessibilityLabel={playing ? 'Pause video' : 'Play video'}
              onPress={() => setPlaying((on) => !on)}
              style={styles.playLayer}
            >
              {playing ? null : (
                <View style={[styles.playButton, { backgroundColor: colors.surfaceScrim }]}>
                  <Icon name="Play" size={heroMetrics.playIcon} color={colors.textOnAccent} strokeWidth={2} />
                </View>
              )}
            </Pressable>
          ) : null}
        </View>
        <View style={styles.content}>
          {notice ? <Banner tone="warning" title="Sharing did not open" body="Sharing is not available on this device." testID="work-share-notice" /> : null}
          <Text variant="h1" testID="work-title">
            {work.title}
          </Text>
          <GroupedList testID="work-facts">
            {facts.map((fact) => (
              <KeyValueRow
                key={fact.key}
                testID={`work-fact-${fact.key}`}
                label={fact.label}
                value={fact.key === 'link' && isWebLink(fact.value) ? <WebLink url={fact.value} /> : fact.value}
              />
            ))}
          </GroupedList>
          {work.description ? (
            <Text variant="body" testID="work-description" tone="textSecondary" style={styles.description}>
              {work.description}
            </Text>
          ) : null}
          {others.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="work-strip" contentContainerStyle={styles.strip}>
              {others.map(({ media, index }) => (
                <Thumb key={`${index}-${media.url ?? 'none'}`} media={media} width={thumbWidth} label={`Show ${media.kind === 'video' ? 'video' : 'photo'} ${index + 1}`} onPress={() => choose(index)} testID={`work-thumb-${index}`} />
              ))}
            </ScrollView>
          ) : null}
          {own ? (
            <RemoveRow
              onPress={() => {
                setRemoveError(null);
                setAsking(true);
              }}
            />
          ) : null}
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.nav, { top: insets.top + navTop }]}>
        <IconButton icon="ChevronLeft" label="Back" tone="glass" onPress={onBack} testID="work-back" />
        <IconButton icon="Share" label="Share this work" tone="glass" onPress={() => void share()} testID="work-share" />
      </View>

      <Creator work={work} bottom={insets.bottom} onOpenCreator={onOpenCreator} />

      <BottomSheet visible={asking} onClose={() => setAsking(false)} dismissible={!remove.isPending} label="Remove this work?" testID="work-remove-sheet">
        <Text variant="sheetTitleSm">Remove this work?</Text>
        <Text variant="muted">It stops showing on your profile. This cannot be undone.</Text>
        {removeError ? <Banner tone="danger" title="That did not work" body={removeError} testID="work-remove-error" /> : null}
        <Button label="Keep this work" full onPress={() => setAsking(false)} disabled={remove.isPending} testID="work-remove-keep" />
        <Button label="Remove" variant="secondary" full loading={remove.isPending} onPress={() => remove.mutate()} testID="work-remove-confirm" />
      </BottomSheet>
    </View>
  );
}

/** The owner's way out of a full profile (and of a mistake): a quiet danger row under the work, which asks before it does anything. */
function RemoveRow({ onPress }: { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID="work-remove" accessibilityRole="button" accessibilityLabel="Remove this work" onPress={onPress} {...ring.handlers} style={[styles.remove, ring.style]}>
      <Icon name="Trash2" size={removeMetrics.icon} color={colors.danger} />
      <Text variant="body" style={[font(600), { color: colors.danger, fontSize: removeMetrics.label }]}>
        Remove this work
      </Text>
    </Pressable>
  );
}

function Thumb({ media, width, label, onPress, testID }: { media: WorkDetail['media'][number]; width: number; label: string; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.thumb, { width, backgroundColor: colors.surfaceSunken }, ring.style]}>
      <WorkCover media={media} />
    </Pressable>
  );
}

function WebLink({ url }: { url: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID="work-link" accessibilityRole="link" accessibilityLabel={`Open ${url}`} onPress={() => void openLink(url)} {...ring.handlers} style={ring.style}>
      <Text variant="kvValue" numberOfLines={1} style={{ color: colors.accentFg }}>
        {url.replace(/^https?:\/\//i, '')}
      </Text>
    </Pressable>
  );
}

function Creator({ work, bottom, onOpenCreator }: { work: WorkDetail; bottom: number; onOpenCreator?: (wawuId: string) => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const { owner } = work;
  const row = (
    <>
      <Avatar name={owner.displayName ?? undefined} size={footMetrics.avatar} source={owner.avatarUrl ?? undefined} decorative />
      <Text variant="body" numberOfLines={1} testID="work-creator-name" style={[font(600), styles.creatorName]}>
        {owner.displayName ?? ''}
      </Text>
    </>
  );
  return (
    <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: Math.max(bottom, footMetrics.bottom) }]}>
      {onOpenCreator ? (
        <Pressable
          testID="work-creator"
          accessibilityRole="button"
          accessibilityLabel={owner.displayName ? `${owner.displayName}, open profile` : 'Open profile'}
          onPress={() => onOpenCreator(owner.wawuId)}
          {...ring.handlers}
          style={[styles.creator, ring.style]}
        >
          {row}
        </Pressable>
      ) : (
        <View testID="work-creator" style={styles.creator}>
          {row}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  hero: { height: heroMetrics.height, width: '100%', overflow: 'hidden' },
  playLayer: { ...StyleSheet.flatten(StyleSheet.absoluteFill), alignItems: 'center', justifyContent: 'center' },
  playButton: { width: heroMetrics.playButton, height: heroMetrics.playButton, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: layout.gutter, paddingTop: bodyMetrics.top, gap: bodyMetrics.stack },
  description: { fontSize: descriptionMetrics.size, lineHeight: descriptionMetrics.size * descriptionMetrics.line },
  strip: { gap: bodyMetrics.thumbGap },
  thumb: { height: bodyMetrics.thumb, borderRadius: bodyMetrics.thumbRadius, overflow: 'hidden' },
  nav: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: layout.gutter },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: footMetrics.top, paddingHorizontal: layout.gutter },
  creator: { flexDirection: 'row', alignItems: 'center', gap: footMetrics.between, minHeight: layout.tapMin },
  creatorName: { flex: 1, fontSize: footMetrics.name },
  loading: { gap: space.lg },
  remove: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: removeMetrics.gap, minHeight: layout.tapMin },
});
