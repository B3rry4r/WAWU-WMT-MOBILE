import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { sheetMetrics } from '@/components/BottomSheet';
import { Icon } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';
import { compactCount } from '@/features/feed/model';
import { useKeyboardLift } from '@/features/feedpay/useKeyboardLift';

import type { Comment } from './api';
import { COMMENT_MAX, commenterName, mentionFor, threads } from './model';
import { ThreadList } from './Parts';
import { useReporting } from '@/features/report/useReporting';
import type { Page } from './usePage';

/** design/_gen/home.js line 76: the sheet opens 170 from the top; the box is 44 tall and the send button a 44 disc. */
const m = { top: 170, input: 44, send: 44, sendIcon: 20, inputPad: 16, focusEdge: 1.5, skeletonRows: 3, skeletonWordsSpace: 11, composerTop: 10, inputSpace: 10 } as const;

export const POST_FAILED = "Your comment couldn't be posted. Try again.";
export const COMMENTS_FAILED = { title: "Couldn't load the comments", message: 'Check your connection and try again.' } as const;
export const COMMENTS_EMPTY = { title: 'No comments yet', message: 'Be the first to say something.' } as const;

export type CommentsSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The number the piece says it has ("48 comments"), the Hub's. */
  count: number;
  page: Page;
};

/**
 * H21 · Comments: each comment with its replies indented under it, a like on each, and the box at the foot. Reply puts the person's
 * first name in the box ("@Emeka ") and names who is being answered; posting sends the words and, for a reply, the comment answered.
 * A comment that fails to post keeps its words in the box with a line saying so.
 */
export function CommentsSheet({ visible, onClose, count, page }: CommentsSheetProps) {
  const { colors, shadows } = useWawu();
  const insets = useSafeAreaInsets();
  // R-117 part B: while the keyboard is up it covers the bottom inset, so the composer sits right on it (the sheet itself is lifted by its KeyboardAvoidingView).
  const keyboard = useKeyboardLift();
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  // REPORT-UGC: press and hold another person's comment to report it; the Hub then leaves it out of this person's list.
  const reporting = useReporting(() => void page.comments.refetch());
  const [text, setText] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const input = useRef<TextInput>(null);
  // One send per comment: set before the request goes and cleared on its answer, so two presses in one frame (before `posting`
  // has re-rendered) post once, as the pay sheets do.
  const sending = useRef(false);
  const items = useMemo(() => page.comments.data?.pages.flatMap((p) => p.items) ?? [], [page.comments.data]);
  const tree = useMemo(() => threads(items), [items]);
  const posting = page.post.isPending;
  const clean = text.trim();
  const ready = clean.length > 0 && clean.length <= COMMENT_MAX && !posting;

  const reply = (comment: Comment) => {
    setReplyTo(comment);
    setText(mentionFor(comment));
    setProblem(null);
    input.current?.focus();
  };
  const stopReplying = () => {
    setReplyTo(null);
    setText('');
  };
  const send = () => {
    if (!ready || sending.current) return;
    sending.current = true;
    setProblem(null);
    page.post.mutate(
      { text: clean, replyToId: replyTo?.id ?? null },
      {
        onSuccess: () => {
          setText('');
          setReplyTo(null);
        },
        onError: () => setProblem(POST_FAILED),
        onSettled: () => {
          sending.current = false;
        },
      },
    );
  };

  let body;
  if (page.comments.isPending) {
    body = (
      <View style={styles.list} testID="comments-loading" accessibilityLabel="Loading comments">
        {Array.from({ length: m.skeletonRows }, (_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <Skeleton width={36} height={36} radius={18} />
            <View style={styles.skeletonWords}>
              <Skeleton width="40%" height={13} />
              <Skeleton width="85%" height={14} />
            </View>
          </View>
        ))}
      </View>
    );
  } else if (page.comments.isError) {
    body = <ErrorState testID="comments-error" title={COMMENTS_FAILED.title} message={COMMENTS_FAILED.message} onRetry={() => void page.comments.refetch()} />;
  } else if (tree.length === 0) {
    body = <EmptyState testID="comments-empty" icon="MessageCircle" title={COMMENTS_EMPTY.title} message={COMMENTS_EMPTY.message} />;
  } else {
    body = (
      <View style={styles.list}>
        <ThreadList idPrefix="comment" items={tree} me={page.me.data} onReport={(c) => reporting.ask('comment', c.id)} onReply={reply} onLike={(c) => page.likeComment.mutate({ commentId: c.id, next: c.likedByMe !== true })} />
        {page.comments.hasNextPage ? (
          <Button testID="comments-more" label="Show more comments" variant="secondary" size="sm" onPress={() => void page.comments.fetchNextPage()} loading={page.comments.isFetchingNextPage} />
        ) : null}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} testID="comments-sheet" accessibilityViewIsModal>
        {reporting.element}
        <Pressable testID="comments-backdrop" accessible={false} onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceScrim }]} tabIndex={-1} />
        <KeyboardAvoidingView testID="comments-keyboard" behavior="padding" style={[styles.sheet, { top: m.top, backgroundColor: colors.surfaceElevated, boxShadow: shadows.sheet }]} role="dialog">
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.grabberHit}>
            <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
          </Pressable>
          <View style={styles.head}>
            <Text variant="h3" accessibilityRole="header" style={font(700)} testID="comments-count">
              {count === 1 ? '1 comment' : `${compactCount(count)} comments`}
            </Text>
            <IconButton icon="X" label="Close comments" onPress={onClose} tone="card" size={layout.tapMin - space.sm} testID="comments-close" />
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} testID="comments-scroll">
            {body}
          </ScrollView>
          <View testID="comments-composer" style={[styles.composer, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.borderHairline, paddingBottom: keyboard > 0 ? space.sm : Math.max(insets.bottom, space.lg) }]}>
            {replyTo ? (
              <View style={styles.replying} testID="comments-replying">
                <Text variant="meta" numberOfLines={1} style={styles.replyingText}>
                  Replying to {commenterName(replyTo)}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Stop replying" onPress={stopReplying} hitSlop={space.md} testID="comments-stop-reply">
                  <Icon name="X" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : null}
            {problem ? (
              <Text variant="errorLine" accessibilityRole="alert" testID="comments-problem">
                {problem}
              </Text>
            ) : null}
            <View style={styles.inputRow}>
              <TextInput
                ref={input}
                testID="comments-input"
                accessibilityLabel={replyTo ? `Reply to ${commenterName(replyTo)}` : 'Add a comment'}
                value={text}
                onChangeText={(t) => {
                  setText(t);
                  if (problem) setProblem(null);
                }}
                placeholder="Add a comment"
                placeholderTextColor={colors.textMuted}
                maxLength={COMMENT_MAX}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={send}
                style={[styles.input, font(400), { backgroundColor: colors.surfaceInput, color: colors.textPrimary, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: m.focusEdge, color: replyTo ? colors.accent : colors.borderHairline, inset: true }] }]}
              />
              <Pressable
                testID="comments-send"
                accessibilityRole="button"
                accessibilityLabel="Post comment"
                accessibilityState={{ disabled: !ready, busy: posting }}
                disabled={!ready}
                onPress={send}
                style={[styles.send, { backgroundColor: ready ? colors.accent : colors.surfaceTag }]}
              >
                <Icon name="ArrowUp" size={m.sendIcon} color={ready ? colors.textOnAccent : colors.textDisabled} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: sheetMetrics.padTop,
    overflow: 'hidden',
  },
  grabberHit: { alignItems: 'center', paddingBottom: space.sm },
  grabber: { width: sheetMetrics.grabberW, height: sheetMetrics.grabberH, borderRadius: sheetMetrics.grabberRadius },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.gutter, paddingBottom: space.md },
  scroll: { flex: 1 },
  scrollBody: { paddingHorizontal: layout.gutter, paddingVertical: space.sm },
  list: { gap: space.lg },
  skeletonRow: { flexDirection: 'row', gap: m.skeletonWordsSpace },
  skeletonWords: { flex: 1, gap: space.sm },
  composer: { paddingHorizontal: layout.gutter, paddingTop: m.composerTop, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  replying: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyingText: { flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: m.inputSpace },
  input: { flex: 1, height: m.input, borderRadius: radius.chip, paddingHorizontal: m.inputPad, fontSize: 14.5 },
  send: { width: m.send, height: m.send, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});
