import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';

import { nairaToKobo } from '@/api/kobo';
import { Avatar, type AvatarHue } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, VerifiedTick, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Money } from '@/components/Money';
import { formatNaira } from '@/components/pay-sheet';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';
import { compactCount, UNNAMED_CREATOR } from '@/features/feed/model';

import type { Comment, PieceDetail } from './api';
import { ago, commenterName, lessonLength, plural, type Thread } from './model';

/** design/_gen/home.js lines 61 to 75: the sizes of the piece's own page. */
export const m = {
  nav: 56,
  navButton: 42,
  navTitle: 17,
  avatar: 44,
  tick: 14,
  priceSize: 26,
  engageIcon: 22,
  engageLabel: 12,
  engagePad: 6,
  lessonRow: 56,
  lessonNo: 28,
  lessonIcon: 16,
  commentAvatar: 36,
  replyAvatar: 30,
  replyIndent: 44,
  commentGap: 11,
  commentText: 14.5,
  walletIcon: 14,
  likeIcon: 13,
  makerSpace: 2,
  tightSpace: 6,
  lessonSpace: 2,
  textTop: 3,
} as const;

/** The bar: a round back button, the title centred, and the share button (kit `nav` with `right`). */
export function Header({ title, onBack, onShare }: { title: string; onBack: () => void; onShare?: () => void }) {
  return (
    <View style={styles.nav}>
      <View style={styles.side}>
        <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="detail-back" />
      </View>
      <Text variant="body" accessibilityRole="header" style={[styles.navTitle, font(700)]}>
        {title}
      </Text>
      <View style={[styles.side, styles.end]}>{onShare ? <IconButton icon="Share" label="Share" onPress={onShare} testID="detail-share" /> : null}</View>
    </View>
  );
}

/** The creator under the title: avatar, name with their tick, their line, and Follow (Following once they are). */
export function MakerRow({
  name,
  hue,
  avatarUrl,
  tick,
  line,
  following,
  onToggleFollow,
}: {
  name: string | null;
  hue: AvatarHue;
  avatarUrl: string | null;
  tick: 'creator' | 'pro' | null;
  line: string;
  /** Null on the viewer's own piece: no button. */
  following: boolean | null;
  onToggleFollow?: () => void;
}) {
  return (
    <View style={styles.maker} testID="detail-maker">
      <Avatar name={name ?? undefined} hue={hue} source={avatarUrl ?? undefined} size={m.avatar} decorative />
      <View style={styles.makerWords}>
        <View style={styles.nameLine}>
          <Text variant="body" numberOfLines={1} style={[font(600), styles.makerName]}>
            {name ?? UNNAMED_CREATOR}
          </Text>
          {tick ? <VerifiedTick kind={tick} size={m.tick} /> : null}
        </View>
        {line ? (
          <Text variant="meta" numberOfLines={1}>
            {line}
          </Text>
        ) : null}
      </View>
      {following === null || !onToggleFollow ? null : (
        <Button
          testID="detail-follow"
          label={following ? 'Following' : 'Follow'}
          variant={following ? 'secondary' : 'primary'}
          size="sm"
          onPress={onToggleFollow}
          selected={following}
        />
      )}
    </View>
  );
}

/** design/_gen/home.js line 74: the "From the course" row is a 12 by 14 card, a 44 picture with 14 corners, 12 between, the amount at 15. */
const courseRow = { pad: 14, picture: 44, corner: 14, title: 14.5, line: 12.5, amount: 15, between: 12 } as const;

/**
 * H24's "From the course VFX for Beginners · 12 lessons ₦8,000": a piece that comes from one of its creator's own courses names it, and
 * a tap opens the course (H25). The picture is the course's own preview when it is a picture, else the course mark. Every figure is the
 * Hub's (`parentCourse` on the detail); a free course says Free.
 */
export function ParentCourseRow({ course, onPress }: { course: NonNullable<PieceDetail['parentCourse']>; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [broken, setBroken] = useState(false);
  const amount = course.price > 0 ? formatNaira(nairaToKobo(course.price)) : 'Free';
  const lines = plural(course.lessonCount, 'lesson', 'lessons');
  return (
    <Pressable
      testID="detail-parent-course"
      accessibilityRole="button"
      accessibilityLabel={`From the course ${course.title}, ${lines}, ${amount}`}
      accessibilityHint="Opens the course"
      onPress={onPress}
      {...ring.handlers}
      style={ring.style}
    >
      <Card padded style={styles.courseCard}>
        <View style={styles.courseRow}>
          {course.previewAssetUrl && !broken ? (
            <View style={[styles.coursePicture, { backgroundColor: colors.surfaceSunken }]}>
              <Image source={{ uri: course.previewAssetUrl }} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
            </View>
          ) : (
            <IconTile icon="GraduationCap" tone="accent" size={courseRow.picture} />
          )}
          <View style={styles.courseWords}>
            <Text variant="body" numberOfLines={2} style={[font(600), { fontSize: courseRow.title }]}>
              {`From the course ${course.title}`}
            </Text>
            <Text variant="meta" style={{ fontSize: courseRow.line, marginTop: m.lessonSpace }}>
              {lines}
            </Text>
          </View>
          {course.price > 0 ? <Money minorUnits={nairaToKobo(course.price)} decimals={false} size={courseRow.amount} weight={700} /> : <Text variant="body" style={[font(700), { fontSize: courseRow.amount }]}>Free</Text>}
        </View>
      </Card>
    </Pressable>
  );
}

/** H19's price card: what unlocking gives, the price, Unlock, and what it is paid from. */
export function PriceCard({
  label,
  priceKobo,
  actionLabel = 'Unlock',
  balanceKobo,
  loading,
  onUnlock,
}: {
  label: string;
  priceKobo: number;
  actionLabel?: string;
  /** The wallet's balance when the Hub gave one; the line then says what is available. */
  balanceKobo: number | null;
  loading: boolean;
  onUnlock: () => void;
}) {
  return (
    <Card padded style={styles.price} testID="detail-price-card">
      <Text variant="meta" style={styles.priceLabel}>
        {label}
      </Text>
      <Money minorUnits={priceKobo} decimals={false} size={m.priceSize} weight={700} />
      <Button testID="detail-unlock" label={`${actionLabel} · ${formatNaira(priceKobo)}`} onPress={onUnlock} loading={loading} full />
      <WalletLine balanceKobo={balanceKobo} />
    </Card>
  );
}

/** "Pay from wallet · ₦485,250 available": without a balance (no wallet yet, or it could not be read) it says only how it is paid. */
export function WalletLine({ balanceKobo }: { balanceKobo: number | null }) {
  const { colors } = useWawu();
  return (
    <View style={styles.walletLine} testID="detail-wallet-line">
      <Icon name="Wallet" size={m.walletIcon} color={colors.textMuted} />
      <Text variant="meta" style={styles.walletText}>
        Pay from wallet{balanceKobo === null ? '' : ` · ${formatNaira(balanceKobo)} available`}
      </Text>
    </View>
  );
}

export type Action = { key: string; icon: IconName; label: string; on?: boolean; onPress: () => void; testID: string; hint?: string };

/** The row of five: like, comments, share, save, rate. A mark that is on is filled and in the accent. */
export function ActionsRow({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.engage} testID="detail-actions">
      {actions.map((a) => (
        <ActionButton key={a.key} action={a} />
      ))}
    </View>
  );
}

function ActionButton({ action }: { action: Action }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const tone = action.on ? colors.accentFg : colors.textSecondary;
  return (
    <Pressable
      testID={action.testID}
      accessibilityRole="button"
      accessibilityLabel={action.hint ?? action.label}
      accessibilityState={{ selected: Boolean(action.on) }}
      onPress={action.onPress}
      {...ring.handlers}
      style={[styles.action, ring.style]}
    >
      <Icon name={action.icon} size={m.engageIcon} color={tone} fill={action.on ? tone : 'none'} />
      <NativeText style={[font(600), { fontSize: m.engageLabel, color: tone }]}>{action.label}</NativeText>
    </Pressable>
  );
}

/**
 * H25's lessons: number, title, length, and Free or a lock. A lesson the person can play (`canOpen`) is a button that plays it in the
 * picture above (FIX-107); once the course is theirs a lesson with a file shows a play mark where the lock was, and the one playing
 * shows it in the accent.
 */
export function LessonList({
  lessons,
  unlocked = false,
  playingId = null,
  canOpen,
  onOpen,
}: {
  lessons: PieceDetail['lessons'];
  /** The course is the person's (bought, free or their own): no lock is drawn. */
  unlocked?: boolean;
  playingId?: string | null;
  canOpen?: (lesson: PieceDetail['lessons'][number]) => boolean;
  onOpen?: (lesson: PieceDetail['lessons'][number]) => void;
}) {
  const { colors } = useWawu();
  return (
    <Card style={styles.lessons} testID="detail-lessons">
      {lessons.map((lesson, i) => {
        const length = lessonLength(lesson.durationLabel);
        const playing = lesson.id === playingId;
        const mark = playing ? (
          <Icon name="Play" size={m.lessonIcon} color={colors.accentFg} fill={colors.accentFg} />
        ) : unlocked ? (
          lesson.hasFile ? <Icon name="Play" size={m.lessonIcon} color={colors.textMuted} /> : null
        ) : lesson.isFree ? (
          <StatusPill label="Free" tone="positive" />
        ) : (
          <Icon name="Lock" size={m.lessonIcon} color={colors.textMuted} />
        );
        const row = (
          <>
            <NativeText style={[font(700), styles.lessonNo, { color: colors.textMuted }]}>{String(i + 1).padStart(2, '0')}</NativeText>
            <View style={styles.lessonWords}>
              <Text variant="cardTitle" numberOfLines={2}>
                {lesson.title}
              </Text>
              {length ? (
                <Text variant="meta" style={styles.lessonLength}>
                  {length}
                </Text>
              ) : null}
            </View>
            {mark}
          </>
        );
        const line = [styles.lesson, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline }];
        return onOpen && canOpen?.(lesson) ? (
          <Pressable
            key={lesson.id}
            testID={`lesson-${lesson.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${lesson.isFree || unlocked ? 'Play' : 'Unlock to play'} lesson ${i + 1}, ${lesson.title}`}
            accessibilityState={{ selected: playing }}
            onPress={() => onOpen(lesson)}
            style={line}
          >
            {row}
          </Pressable>
        ) : (
          <View key={lesson.id} testID={`lesson-${lesson.id}`} style={line}>
            {row}
          </View>
        );
      })}
    </Card>
  );
}

/** One comment, or a reply (indented once, with a smaller avatar): name, when, the words, Reply and the like count. */
export function CommentRow({
  comment,
  reply,
  onReply,
  onLike,
  testID,
}: {
  comment: Comment;
  reply?: boolean;
  /** Without it (the page's own preview) no Reply is drawn. */
  onReply?: (comment: Comment) => void;
  onLike?: (comment: Comment) => void;
  testID?: string;
}) {
  const { colors } = useWawu();
  const name = commenterName(comment);
  const liked = comment.likedByMe === true;
  return (
    <View testID={testID} style={[styles.comment, reply && { paddingLeft: m.replyIndent }]}>
      <Avatar name={name} hue="sky" source={comment.author?.avatarUrl ?? undefined} size={reply ? m.replyAvatar : m.commentAvatar} decorative />
      <View style={styles.commentWords}>
        <Text variant="meta" style={styles.commentHead}>
          <NativeText style={[font(600), { color: colors.textPrimary }]}>{name}</NativeText>
          {` · ${ago(comment.createdAt)}`}
        </Text>
        <NativeText style={[font(400), styles.commentText, { color: colors.textPrimary }]}>{comment.text}</NativeText>
        <View style={styles.commentFoot}>
          {onReply ? (
            <Pressable testID={testID ? `${testID}-reply` : undefined} accessibilityRole="button" accessibilityLabel={`Reply to ${name}`} onPress={() => onReply(comment)} hitSlop={space.sm}>
              <NativeText style={[font(600), styles.footWord, { color: colors.textMuted }]}>Reply</NativeText>
            </Pressable>
          ) : null}
          <Pressable
            testID={testID ? `${testID}-like` : undefined}
            accessibilityRole="button"
            accessibilityLabel={liked ? `Unlike ${name}'s comment` : `Like ${name}'s comment`}
            accessibilityState={{ selected: liked }}
            disabled={!onLike}
            onPress={() => onLike?.(comment)}
            hitSlop={space.sm}
            style={styles.likeWrap}
          >
            <Icon name="Heart" size={m.likeIcon} color={liked ? colors.accentFg : colors.textMuted} fill={liked ? colors.accentFg : 'none'} />
            <NativeText style={[font(600), styles.footWord, { color: liked ? colors.accentFg : colors.textMuted }]}>{compactCount(comment.likes)}</NativeText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** The comments of the page and of H21: each top-level comment with its replies under it. */
export function ThreadList({
  items,
  onReply,
  onLike,
  idPrefix,
}: {
  items: Thread[];
  onReply?: (comment: Comment) => void;
  onLike?: (comment: Comment) => void;
  idPrefix: string;
}) {
  return (
    <View style={styles.threads}>
      {items.map(({ comment, replies }) => (
        <View key={comment.id} style={styles.threads}>
          <CommentRow testID={`${idPrefix}-${comment.id}`} comment={comment} onReply={onReply} onLike={onLike} />
          {replies.map((r) => (
            <CommentRow key={r.id} testID={`${idPrefix}-${r.id}`} comment={r} reply onReply={onReply} onLike={onLike} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** A section's heading with a line under it (kit `SH`): "Comments" and "48 comments". */
export function SectionHead({ title, line, onPress, children }: { title: string; line: string; onPress?: () => void; children?: ReactNode }) {
  const ring = useFocusRing();
  const head = (
    <View style={styles.sectionHead}>
      <Text variant="h2">{title}</Text>
      <Text variant="meta">{line}</Text>
      {children}
    </View>
  );
  if (!onPress) return head;
  return (
    <Pressable testID="detail-comments-open" accessibilityRole="button" accessibilityLabel={`${line}, open`} onPress={onPress} {...ring.handlers} style={ring.style}>
      {head}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: { height: m.nav, flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.gutter, gap: space.md },
  side: { width: m.navButton, alignItems: 'flex-start' },
  end: { alignItems: 'flex-end' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: m.navTitle },
  maker: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  makerWords: { flex: 1, minWidth: 0, gap: m.makerSpace },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  makerName: { flexShrink: 1 },
  courseCard: { paddingVertical: space.md, paddingHorizontal: courseRow.pad },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: courseRow.between },
  coursePicture: { width: courseRow.picture, height: courseRow.picture, borderRadius: courseRow.corner, overflow: 'hidden' },
  courseWords: { flex: 1, minWidth: 0 },
  price: { gap: space.md },
  priceLabel: { marginBottom: -space.sm },
  walletLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: m.tightSpace },
  walletText: { textAlign: 'center' },
  engage: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.xs, paddingHorizontal: m.engagePad },
  action: { alignItems: 'center', gap: m.tightSpace, minWidth: layout.tapMin },
  lessons: { paddingHorizontal: space.lg },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: m.lessonRow },
  lessonNo: { width: m.lessonNo, fontSize: 13 },
  lessonWords: { flex: 1, gap: m.lessonSpace, paddingVertical: space.sm },
  lessonLength: { marginTop: 0 },
  comment: { flexDirection: 'row', gap: m.commentGap },
  commentWords: { flex: 1, minWidth: 0 },
  commentHead: { fontSize: 13.5 },
  commentText: { fontSize: m.commentText, lineHeight: m.commentText * 1.4, marginTop: m.textTop },
  commentFoot: { flexDirection: 'row', gap: space.lg, marginTop: m.tightSpace, alignItems: 'center' },
  footWord: { fontSize: 12.5 },
  likeWrap: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  threads: { gap: space.lg },
  sectionHead: { gap: space.xs },
});
