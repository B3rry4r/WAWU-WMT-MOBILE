import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { formatNaira } from '@/components/pay-sheet';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast, type ToastTone } from '@/components/Toast';
import { layout, space, useWawu } from '@/theme';
import { compactCount, creatorName, hueFor, tickKind } from '@/features/feed/model';
import type { FlowHandlers } from '@/features/feedpay/usePaymentFlow';
import { TipSheets } from '@/features/tips/TipSheets';
import { useTip } from '@/features/tips/useTip';
import { openIcon, openLabel } from '@/features/unlock/model';
import { UnlockSheets } from '@/features/unlock/UnlockSheets';
import { useUnlock } from '@/features/unlock/useUnlock';

import { CommentsSheet } from './CommentsSheet';
import { Media } from './Media';
import {
  ActionsRow,
  Header,
  LessonList,
  MakerRow,
  PriceCard,
  SectionHead,
  ThreadList,
  WalletLine,
  type Action,
} from './Parts';
import { RateSheet } from './RateSheet';
import { ShareSheet } from './ShareSheet';
import {
  BAR_TITLE,
  firstName,
  kindOf,
  layoutOf,
  makerLine,
  mediaTag,
  metaLine,
  NOT_BOUGHT_LINE,
  priceKobo,
  rateLabel,
  threads,
  unlockLabel,
} from './model';
import { usePage } from './usePage';

/** design/_gen/home.js lines 69 to 72: the lessons the course shows before See all, and the page's gap and foot. */
const LESSONS_SHOWN = 4;
const PREVIEW_THREADS = 3;
const NOTICE_MS = 3200;
const m = { between: 18, bottom: 40, footBottom: 24, footTop: 10, titleSpace: 6, skeletonMedia: 220, skeletonRows: 2 } as const;

export const THANKS_LINE = 'Thanks for rating';
export const COMMENTS_LOAD_FAILED = "The comments couldn't be loaded.";
export const FILE_FAILED = "The file couldn't be opened. Try again.";
export const NOT_AVAILABLE = { title: "This isn't available", message: 'It was taken down, or you cannot see it.' } as const;
export const LOAD_FAILED = { title: "Couldn't load this", message: 'Check your connection and try again.' } as const;

export type ContentDetailScreenProps = {
  /** The piece's id. */
  id: string;
  onBack: () => void;
  /** Where the page's wallet payments (an unlock, a tip) lead when they need somewhere else: Open your wallet, a PIN to set, Forgot PIN, add money. */
  pay: FlowHandlers;
};

type Notice = { text: string; tone: ToastTone } | null;

/**
 * H19 to H25 · A piece's own page (`/content/<id>`). One screen, three states for a paid piece (locked H19, unlocked H20, and free
 * H24) and a course layout (H25); the comments (H21), share (H22) and rate (H23) are sheets over it. Every figure is the Hub's: the
 * price, the counts, the dates, the lessons, who made it and what the viewer has bought. A mark the Hub does not take is put back
 * and said so; a part that cannot be read says so on its own.
 */
export function ContentDetailScreen({ id, onBack, pay }: ContentDetailScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState<Notice>(null);
  const say = (text: string, tone: ToastTone = 'alert') => setNotice({ text, tone });
  const page = usePage(id, (line) => say(line));
  const tip = useTip(pay);
  const unlock = useUnlock(pay);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [allLessons, setAllLessons] = useState(false);
  const [open, setOpen] = useState(0);

  const { piece, detail, engagement, item } = page;
  // The Hub counts one view per person per piece per day, and never the owner's own, so opening the page tells it once.
  const viewedFor = useRef<string | null>(null);
  const countView = page.viewed.mutate;
  useEffect(() => {
    if (!piece.data || viewedFor.current === id) return;
    viewedFor.current = id;
    countView();
  }, [id, piece.data, countView]);

  const preview = useMemo(() => threads(page.comments.data?.pages[0]?.items ?? []).slice(0, PREVIEW_THREADS), [page.comments.data]);

  const frame = (children: ReactNode, title = '') => (
    <View style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]} testID="content-detail">
      <Header title={title} onBack={onBack} />
      {children}
    </View>
  );

  const failed = piece.error ?? detail.error ?? engagement.error;
  if (!piece.data || !detail.data || !engagement.data || !item) {
    if (failed) {
      const gone = isApiError(failed) && failed.kind === 'not_found';
      return frame(
        gone ? (
          <EmptyState testID="detail-gone" icon="Lock" title={NOT_AVAILABLE.title} message={NOT_AVAILABLE.message} action={{ label: 'Go back', onPress: onBack }} />
        ) : (
          <ErrorState
            testID="detail-error"
            title={LOAD_FAILED.title}
            message={isApiError(failed) && failed.message ? failed.message : LOAD_FAILED.message}
            onRetry={() => {
              void piece.refetch();
              void detail.refetch();
              void engagement.refetch();
            }}
          />
        ),
      );
    }
    return frame(
      <LoadingView testID="detail-loading" label="Loading">
        <View style={styles.body}>
          <Skeleton height={m.skeletonMedia} radius={20} />
          <Skeleton width="75%" height={24} />
          <Skeleton width="45%" height={14} />
          <Skeleton height={44} radius={22} />
        </View>
      </LoadingView>,
    );
  }

  const p = piece.data;
  const d = detail.data;
  const e = engagement.data;
  const kind = kindOf(p);
  const state = layoutOf(p);
  const locked = state === 'locked';
  const own = page.me.data === p.creatorWawuId;
  const maker = d.creator;
  const by = creatorName(maker);
  const count = Math.max(e.commentCount, p.commentCount);
  const commentLine = count === 0 ? 'No comments yet' : count === 1 ? '1 comment' : `${compactCount(count)} comments`;
  const balanceKobo = page.balance.data?.availableKobo ?? null;
  const rating = d.rating;
  const canOpen = !locked && !(state === 'free' && (kind === 'video' || kind === 'audio'));
  const tipTarget = () => tip.begin({ wawuId: maker.wawuId, name: by, avatarUrl: maker.avatarUrl, hue: hueFor(maker.wawuId) });
  const startUnlock = () => unlock.begin(item);
  const openFile = () => {
    const url = p.fullAssetUrl;
    if (!url) return say(FILE_FAILED);
    Linking.openURL(url).catch(() => say(FILE_FAILED));
  };
  // The unlock sheet's last button hands the piece back to the page, read again so it draws as bought.
  const unlockSheets = {
    ...unlock,
    done: () => {
      unlock.done();
      page.refresh();
    },
  };

  const onRate = () => {
    if (rating.canRate) setRateOpen(true);
    else if (rating.cannotRateReason === 'not_purchased') say(NOT_BOUGHT_LINE);
  };

  const actions: Action[] = [
    { key: 'like', icon: 'Heart', label: compactCount(e.likes), on: e.likedByMe, hint: e.likedByMe ? 'Unlike' : 'Like', onPress: () => page.like.mutate(!e.likedByMe), testID: 'detail-like' },
    { key: 'comments', icon: 'MessageCircle', label: compactCount(count), hint: commentLine, onPress: () => setCommentsOpen(true), testID: 'detail-comments' },
    { key: 'share', icon: 'Share', label: 'Share', onPress: () => setShareOpen(true), testID: 'detail-share-action' },
    { key: 'save', icon: 'Bookmark', label: e.savedByMe ? 'Saved' : 'Save', on: e.savedByMe, onPress: () => page.save.mutate(!e.savedByMe), testID: 'detail-save' },
    ...(own ? [] : [{ key: 'rate', icon: 'Star' as const, label: rateLabel(rating.myRating), on: rating.myRating !== null, onPress: onRate, testID: 'detail-rate' }]),
  ];

  const lessons = d.lessons;
  const shownLessons = allLessons ? lessons : lessons.slice(0, LESSONS_SHOWN);
  const course = kind === 'course';

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]} testID="content-detail">
      <Header title={BAR_TITLE[kind]} onBack={onBack} onShare={() => setShareOpen(true)} />
      <ScrollView testID="detail-scroll" contentContainerStyle={[styles.body, { paddingBottom: course && locked ? space.lg : m.bottom + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <Media piece={item} tag={mediaTag(p, d)} by={by} signal={open} />
        <View style={styles.title}>
          <Text variant="sheetTitle" testID="detail-title">
            {p.title}
          </Text>
          <Text variant="meta" testID="detail-meta">
            {metaLine(p, d)}
          </Text>
        </View>
        <MakerRow
          name={by}
          hue={hueFor(maker.wawuId)}
          avatarUrl={maker.avatarUrl}
          tick={tickKind(maker)}
          line={makerLine(maker)}
          following={own ? null : e.followsCreator}
          onToggleFollow={() => page.followMaker.mutate(!e.followsCreator)}
        />

        {locked && !course ? <PriceCard label={unlockLabel(kind)} priceKobo={priceKobo(p)} balanceKobo={balanceKobo} loading={unlock.asking} onUnlock={startUnlock} /> : null}

        {course && lessons.length > 0 ? (
          <>
            <LessonList lessons={shownLessons} />
            {lessons.length > LESSONS_SHOWN ? (
              <Button
                testID="detail-lessons-toggle"
                label={allLessons ? 'Show fewer lessons' : `See all ${lessons.length} lessons`}
                variant="secondary"
                size="sm"
                onPress={() => setAllLessons((v) => !v)}
                style={styles.center}
              />
            ) : null}
          </>
        ) : null}

        {canOpen ? (
          <View style={styles.openRow}>
            <Button testID="detail-open" label={openLabel(item)} icon={openIcon(item)} onPress={() => setOpen((n) => n + 1)} style={styles.openMain} />
            {p.fullAssetUrl ? <Button testID="detail-download" label="Download" icon="Download" variant="secondary" onPress={openFile} style={styles.openSide} /> : null}
          </View>
        ) : null}
        {!locked && !own ? (
          <View style={styles.center}>
            <Button testID="detail-tip" label={`Tip ${firstName(by)}`.trim()} icon="HandCoins" variant="outline" size="md" onPress={tipTarget} />
          </View>
        ) : null}

        <ActionsRow actions={actions} />

        <View style={styles.comments} testID="detail-comments-section">
          <SectionHead title="Comments" line={commentLine} onPress={() => setCommentsOpen(true)} />
          {page.comments.isPending ? (
            <View style={styles.comments} testID="detail-comments-loading" accessibilityLabel="Loading comments">
              {Array.from({ length: m.skeletonRows }, (_, i) => (
                <Skeleton key={i} height={40} />
              ))}
            </View>
          ) : page.comments.isError ? (
            <View style={styles.errorRow} testID="detail-comments-error">
              <Text variant="errorLine" accessibilityRole="alert" style={styles.grow}>
                {COMMENTS_LOAD_FAILED}
              </Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={() => void page.comments.refetch()} loading={page.comments.isFetching} />
            </View>
          ) : preview.length > 0 ? (
            <ThreadList idPrefix="preview" items={preview} onReply={() => setCommentsOpen(true)} onLike={(c) => page.likeComment.mutate({ commentId: c.id, next: c.likedByMe !== true })} />
          ) : null}
        </View>
      </ScrollView>

      {course && locked ? (
        <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, m.footBottom), backgroundColor: colors.surfacePage }]} testID="detail-foot">
          <WalletLine balanceKobo={balanceKobo} />
          <Button testID="detail-unlock" label={`Unlock course · ${formatNaira(priceKobo(p))}`} onPress={startUnlock} loading={unlock.asking} full />
        </View>
      ) : null}

      <Toast message={notice?.text ?? null} tone={notice?.tone ?? 'alert'} placement="top" offset={insets.top + space.sm} duration={NOTICE_MS} onHide={() => setNotice(null)} />

      <CommentsSheet visible={commentsOpen} onClose={() => setCommentsOpen(false)} count={count} page={page} />
      <ShareSheet visible={shareOpen} onClose={() => setShareOpen(false)} piece={{ id: p.id, title: p.title, by }} onShared={() => page.shared.mutate()} />
      <RateSheet
        visible={rateOpen}
        onClose={() => setRateOpen(false)}
        mine={rating.myRating}
        onSubmit={async (stars) => {
          await page.rate.mutateAsync(stars);
          setRateOpen(false);
          say(THANKS_LINE, 'success');
        }}
      />
      <TipSheets tip={tip} onAddMoney={pay.onAddMoney} onOpenWallet={pay.onOpenWallet} onForgotPin={pay.onForgotPin} />
      <UnlockSheets unlock={unlockSheets} onAddMoney={pay.onAddMoney} onOpenWallet={pay.onOpenWallet} onForgotPin={pay.onForgotPin} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingTop: space.sm, paddingHorizontal: layout.gutter, gap: m.between },
  title: { gap: m.titleSpace },
  center: { alignSelf: 'center' },
  openRow: { flexDirection: 'row', gap: space.sm },
  openMain: { flex: 1.3 },
  openSide: { flex: 1 },
  comments: { gap: space.lg },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
  foot: { paddingTop: m.footTop, paddingHorizontal: layout.gutter, gap: space.sm },
});
