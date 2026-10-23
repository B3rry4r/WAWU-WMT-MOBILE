import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text as NativeText, View } from 'react-native';

import { Avatar, type AvatarHue } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, VerifiedTick, type IconName } from '@/components/icon';
import { Money } from '@/components/Money';
import { formatNaira } from '@/components/pay-sheet';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';
import { compactCount, UNNAMED_CREATOR } from '@/features/feed/model';

import type { Comment, PieceDetail } from './api';
import { ago, commenterName, lessonLength, type Thread } from './model';

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

/** H25's lessons: number, title, length, and Free or a lock. */
export function LessonList({ lessons }: { lessons: PieceDetail['lessons'] }) {
  const { colors } = useWawu();
  return (
    <Card style={styles.lessons} testID="detail-lessons">
      {lessons.map((lesson, i) => {
        const length = lessonLength(lesson.durationLabel);
        return (
          <View key={lesson.id} testID={`lesson-${lesson.id}`} style={[styles.lesson, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderHairline }]}>
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
            {lesson.isFree ? <StatusPill label="Free" tone="positive" /> : <Icon name="Lock" size={m.lessonIcon} color={colors.textMuted} />}
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
