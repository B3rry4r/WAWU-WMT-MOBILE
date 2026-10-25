import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback } from 'react';

import { walletBalanceQuery } from '@/api/money';
import { fetchMyId, follow, meKey, recordView, setLiked, setSaved, type FeedItem, type LikeState } from '@/features/feed/api';
import { purchasesKey } from '@/features/purchases/api';
import { fetchMedia } from '@/features/unlock/api';

import {
  commentsKey,
  countShare,
  detailKey,
  engagementKey,
  fetchComments,
  fetchEngagement,
  fetchLessonPlay,
  fetchPiece,
  fetchPieceDetail,
  markLessonDone,
  pieceKey,
  postComment,
  putRating,
  setCommentLiked,
  unfollow,
  type Comment,
  type Engagement,
  type PieceDetail,
  type RatingState,
} from './api';
import { asFeedItem, isLocked } from './model';

type CommentPages = InfiniteData<{ items: Comment[]; nextPage: number | null }, number>;

/**
 * Everything the piece's own page reads and writes (HOME-03, HOME-08). The piece, its detail (who made it, when it was bought, the
 * lessons, the rating), the viewer's marks and the comments are each their own read, so one that fails says so on its own part; the
 * viewer's marks are drawn at once and put right by the Hub's answer (or put back when the Hub refuses).
 *
 * `onFail` hears a short sentence for a mark the Hub did not take, for the screen's notice.
 */
export function usePage(id: string, onFail: (line: string) => void) {
  const client = useQueryClient();
  const piece = useQuery({ queryKey: pieceKey(id), queryFn: () => fetchPiece(id) });
  const detail = useQuery({ queryKey: detailKey(id), queryFn: () => fetchPieceDetail(id) });
  const engagement = useQuery({ queryKey: engagementKey(id), queryFn: () => fetchEngagement(id) });
  const me = useQuery({ queryKey: meKey, queryFn: fetchMyId });
  const media = useQuery({ queryKey: [...pieceKey(id), 'media'], queryFn: () => fetchMedia(id), enabled: Boolean(piece.data) });
  const locked = piece.data ? isLocked(piece.data) : false;
  // Only a locked piece shows the wallet's balance, and only when the wallet answers: no wallet yet leaves the line plain.
  const balance = useQuery({ ...walletBalanceQuery, enabled: locked, retry: false });
  const comments = useInfiniteQuery({
    queryKey: commentsKey(id),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchComments(id, pageParam),
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });

  const patchEngagement = useCallback(
    (change: (e: Engagement) => Engagement) => client.setQueryData<Engagement>(engagementKey(id), (e) => (e ? change(e) : e)),
    [client, id],
  );
  const mark = <V, A = unknown>(opts: {
    call: (value: V) => Promise<A>;
    apply: (e: Engagement, value: V) => Engagement;
    fail: string;
  }) => ({
    mutationFn: opts.call,
    onMutate: (value: V) => {
      const before = client.getQueryData<Engagement>(engagementKey(id));
      patchEngagement((e) => opts.apply(e, value));
      return { before };
    },
    onError: (_error: unknown, _value: V, ctx: { before?: Engagement } | undefined) => {
      if (ctx?.before) client.setQueryData(engagementKey(id), ctx.before);
      onFail(opts.fail);
    },
  });

  const like = useMutation({
    ...mark<boolean, LikeState>({
      call: (next) => setLiked(id, next),
      apply: (e, next) => ({ ...e, likedByMe: next, likes: Math.max(0, e.likes + (next ? 1 : -1)) }),
      fail: "Couldn't update your like. Try again.",
    }),
    onSuccess: (state) => patchEngagement((e) => ({ ...e, likedByMe: state.likedByMe, likes: state.likes })),
  });
  const save = useMutation(
    mark<boolean>({
      call: (next) => setSaved(id, next),
      apply: (e, next) => ({ ...e, savedByMe: next }),
      fail: "Couldn't update your saved list. Try again.",
    }),
  );
  const followMaker = useMutation({
    ...mark<boolean>({
      call: (next) => (next ? follow(piece.data?.creatorWawuId ?? '') : unfollow(piece.data?.creatorWawuId ?? '')),
      apply: (e, next) => ({ ...e, followsCreator: next }),
      fail: "Couldn't update who you follow. Try again.",
    }),
    // The follower count on the creator's line is the Hub's, so it is read again.
    onSuccess: () => void client.invalidateQueries({ queryKey: detailKey(id) }),
  });

  const rate = useMutation({
    mutationFn: (stars: number) => putRating(id, stars),
    onSuccess: (state: RatingState) => {
      client.setQueryData<PieceDetail>(detailKey(id), (d) => (d ? { ...d, rating: state } : d));
      // The heart's "96% liked" is the piece's own rating, which a new rating moves (R2-SOCIAL e).
      void client.invalidateQueries({ queryKey: pieceKey(id), exact: true });
    },
  });

  const post = useMutation({
    mutationFn: (input: { text: string; replyToId: string | null }) => postComment(id, input.text, input.replyToId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: commentsKey(id) });
      void client.invalidateQueries({ queryKey: pieceKey(id), exact: true });
      void client.invalidateQueries({ queryKey: engagementKey(id) });
    },
  });
  const likeComment = useMutation({
    mutationFn: (input: { commentId: string; next: boolean }) => setCommentLiked(id, input.commentId, input.next),
    onMutate: (input) => {
      const before = client.getQueryData<CommentPages>(commentsKey(id));
      client.setQueryData<CommentPages>(commentsKey(id), (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((p) => ({
                ...p,
                items: p.items.map((c) => (c.id === input.commentId ? { ...c, likedByMe: input.next, likes: Math.max(0, c.likes + (input.next ? 1 : -1)) } : c)),
              })),
            }
          : data,
      );
      return { before };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.before) client.setQueryData(commentsKey(id), ctx.before);
      onFail("Couldn't update your like. Try again.");
    },
  });

  // H25: a lesson's own link, asked for each time one is opened; and the lesson finished, which My purchases counts ("3 of 12 done").
  const playLesson = useMutation({ mutationFn: (lessonId: string) => fetchLessonPlay(id, lessonId) });
  const lessonDone = useMutation({
    mutationFn: (lessonId: string) => markLessonDone(lessonId),
    onSuccess: () => void client.invalidateQueries({ queryKey: purchasesKey('').slice(0, 2) }),
  });

  const shared = useMutation({ mutationFn: () => countShare(id) });
  const viewed = useMutation({ mutationFn: () => recordView(id) });

  const item: FeedItem | null =
    piece.data && detail.data && engagement.data
      ? asFeedItem(
          piece.data,
          detail.data,
          engagement.data,
          media.data ?? { contentId: id, contentType: piece.data.contentType, durationLabel: piece.data.durationLabel, pageCount: piece.data.pageCount, frameCount: 0, frames: [] },
        )
      : null;

  /** The page after an unlock: the piece, its detail (when it was bought) and the viewer's marks are read again. */
  const refresh = useCallback(() => {
    void client.invalidateQueries({ queryKey: pieceKey(id) });
  }, [client, id]);

  return {
    piece,
    detail,
    engagement,
    me,
    balance,
    comments,
    item,
    like,
    save,
    followMaker,
    rate,
    post,
    likeComment,
    shared,
    viewed,
    playLesson,
    lessonDone,
    refresh,
  };
}

export type Page = ReturnType<typeof usePage>;
