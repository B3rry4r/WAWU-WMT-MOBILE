import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useFocusRing } from '@/components/focusRing';
import { Icon, ICON_STROKE } from '@/components/icon';
import { radius } from '@/theme';

import type { CardWork, CreatorCardData } from './api';
import { ButtonRow, CardButton, CardFrame, CardName, Stat, StatsPanel, useCardFollow } from './CardFrame';
import { cardMetrics as m, media, words } from './look';
import { cardTick, compactCount, followedByParts, hueFor, isPicture, placeLine, workTile } from './model';
import { Pill } from './parts';

export type FeedCreatorCardProps = {
  card: CreatorCardData;
  width: number;
  height: number;
  chromeTop: number;
  /** A piece in the strip opens its own page (H19). Left out, the strip is only looked at. */
  onOpenWork?: (id: string) => void;
};

/** One piece in the strip: its kind, a lock and its price when it is locked, else its views and length. */
function WorkTile({ work, onOpen }: { work: CardWork; onOpen?: () => void }) {
  const ring = useFocusRing();
  const tile = workTile(work);
  const picture = isPicture(work.thumbnailUrl) ? work.thumbnailUrl : null;
  const body = (
    <>
      {picture ? <Image source={{ uri: picture }} contentFit="cover" blurRadius={tile.locked ? m.tileBlur : 0} style={StyleSheet.absoluteFill} /> : null}
      {tile.locked ? <View style={[StyleSheet.absoluteFill, { backgroundColor: media.tileVeil }]} /> : null}
      <LinearGradient
        pointerEvents="none"
        colors={media.tileScrim.colors as unknown as [string, string, ...string[]]}
        locations={media.tileScrim.locations as unknown as [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.kind, { backgroundColor: media.pill }]}>
        <Icon name={tile.icon} size={m.tileIconGlyph} color={media.ink} strokeWidth={ICON_STROKE.button} />
      </View>
      {tile.locked ? (
        <View style={styles.lock}>
          <Icon name="Lock" size={m.tileLock} color={media.ink} />
        </View>
      ) : null}
      <View style={styles.tileFoot}>
        <Text numberOfLines={1} style={[words.tileMain, styles.shrink, { color: media.ink }]}>
          {tile.left}
        </Text>
        {tile.right ? <Text style={[words.tileSide, { color: media.ink }]}>{tile.right}</Text> : null}
      </View>
    </>
  );
  const frame = [styles.tile, { backgroundColor: media.backdrop }];
  if (!onOpen) {
    return (
      <View testID={`work-${work.id}`} accessible accessibilityLabel={tile.label} style={frame}>
        {body}
      </View>
    );
  }
  return (
    <Pressable testID={`work-${work.id}`} accessibilityRole="button" accessibilityLabel={tile.label} onPress={onOpen} {...ring.handlers} style={[frame, ring.style]}>
      {body}
    </Pressable>
  );
}

/** "Followed by Amaka and 12 people you know", with up to three faces. */
function KnownRow({ known }: { known: CreatorCardData['knownFollowers'] }) {
  const parts = followedByParts(known);
  if (!parts) return null;
  return (
    <View testID="card-known" style={styles.known}>
      <View style={styles.faces}>
        {known.people.map((person, i) => (
          <View key={person.wawuId} style={[styles.face, { borderColor: media.black, marginLeft: i === 0 ? 0 : m.knownOverlap }]}>
            <Avatar name={person.displayName ?? undefined} hue={hueFor(person.wawuId)} source={person.avatarUrl ?? undefined} size={m.knownAvatar} decorative />
          </View>
        ))}
      </View>
      <Text style={[words.known, styles.shrink, { color: media.ink }]}>
        {parts.map((part, i) => (
          <Text key={i} style={part.bold ? words.knownBold : undefined}>
            {part.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}

/**
 * H9: a creator among the posts, one screen. Their portrait fills it; over it, their name and tick,
 * their headline, the stats the Hub counts (followers, posts, and the rating when the Hub has one),
 * the people the viewer follows who follow them, a sideways strip of their latest work (free and
 * locked), and Follow. Every figure is the Hub's: a figure it does not have is left out with the
 * element around it. Profile (M5) is added by ME-02 with its screen.
 */
export function FeedCreatorCard({ card, width, height, chromeTop, onOpenWork }: FeedCreatorCardProps) {
  const name = card.displayName?.trim() ?? '';
  const follow = useCardFollow(card.wawuId, card.followsCreator);
  return (
    <CardFrame
      testID={`creator-card-${card.wawuId}`}
      width={width}
      height={height}
      chromeTop={chromeTop}
      portrait={card.coverUrl ?? card.avatarUrl}
      wawuId={card.wawuId}
      pill={<Pill icon="Sparkles" text="Creator for you" testID={`creator-card-${card.wawuId}-pill`} />}
    >
      <CardName name={name} tick={cardTick(card.verification, 'creator')} line={placeLine(card.headline)} testID="card-name" />
      <StatsPanel testID="card-stats">
        <Stat value={compactCount(card.followers)} label={card.followers === 1 ? 'follower' : 'followers'} testID="stat-followers" />
        <Stat value={compactCount(card.posts)} label={card.posts === 1 ? 'post' : 'posts'} testID="stat-posts" />
        {card.rating === null ? null : <Stat value={card.rating.toFixed(1)} label="rating" testID="stat-rating" />}
      </StatsPanel>
      <KnownRow known={card.knownFollowers} />
      {card.works.length > 0 ? (
        <ScrollView testID="card-works" horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={styles.works} contentContainerStyle={styles.worksRow}>
          {card.works.map((work) => (
            <WorkTile key={work.id} work={work} onOpen={onOpenWork ? () => onOpenWork(work.id) : undefined} />
          ))}
        </ScrollView>
      ) : null}
      {follow.failed ? (
        <Text accessibilityRole="alert" testID="card-follow-failed" style={[words.failed, { color: media.ink }]}>
          {follow.on ? `${name} wasn't unfollowed. Try again.` : `${name} wasn't followed. Try again.`}
        </Text>
      ) : null}
      <ButtonRow>
        <CardButton
          testID="card-follow"
          tone={follow.on ? 'glass' : 'primary'}
          icon={follow.on ? undefined : 'Plus'}
          label={follow.on ? 'Following' : 'Follow'}
          busy={follow.busy}
          onPress={follow.toggle}
        />
      </ButtonRow>
    </CardFrame>
  );
}

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  known: { flexDirection: 'row', alignItems: 'center', gap: m.knownGap },
  faces: { flexDirection: 'row' },
  face: { borderRadius: radius.chip, borderWidth: m.knownRing },
  works: { marginRight: -m.side },
  worksRow: { gap: m.tileGap, paddingRight: m.side },
  tile: { width: m.tileW, height: m.tileH, borderRadius: m.tileRadius, overflow: 'hidden' },
  kind: {
    position: 'absolute',
    left: m.tileInset,
    top: m.tileInset,
    width: m.tileIcon,
    height: m.tileIcon,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: { position: 'absolute', left: 0, right: 0, top: m.tileLockTop, alignItems: 'center', transform: [{ translateY: -m.tileLock / 2 }] },
  tileFoot: { position: 'absolute', left: m.tileLeft, right: m.tileLeft, bottom: m.tileInset, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: m.tileInset },
});
