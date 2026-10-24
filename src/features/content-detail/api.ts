import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { filled, readData } from '@/features/feedpay/payCall';

/**
 * The calls behind a piece's own page (HOME-03: H19 to H23, HOME-08: H24, H25), as the Hub's contract types them:
 * - `GET /content/{id}`: the piece (title, kind, price, counts, and the file only when the viewer may have it);
 * - `GET /content/{id}/detail`: when it was last changed, when THIS viewer bought it, the students, the free preview, the course's
 *   lessons, the rating (HOME-06) and who made it (HOME-03);
 * - `GET /content/{id}/engagement`: the viewer's own marks (liked, saved, following the creator) and the counts;
 * - comments: `GET` and `POST /content/{id}/comments`, and a like on a comment;
 * - `PUT /content/{id}/rating`: one rating per person, only after buying (HOME-06);
 * - `POST /content/{id}/share`: counts one share.
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each
 * call reads the envelope itself.
 */
export type Piece = components['schemas']['ContentPieceResponse'];
export type PieceDetail = components['schemas']['ContentDetail'];
export type Engagement = components['schemas']['ContentEngagement'];
export type Maker = components['schemas']['DetailCreator'];
export type Comment = components['schemas']['Comment'];
export type RatingState = components['schemas']['RatingState'];
export type LessonPlay = components['schemas']['LessonPlay'];
export type Lesson = PieceDetail['lessons'][number];
export type ChatSummary = components['schemas']['ChatSummary'];

export const pieceKey = (id: string) => ['content-page', id] as const;
export const detailKey = (id: string) => ['content-page', id, 'detail'] as const;
export const engagementKey = (id: string) => ['content-page', id, 'engagement'] as const;
export const commentsKey = (id: string) => ['content-page', id, 'comments'] as const;
export const shareChatsKey = ['content-page', 'share-chats'] as const;

/** Comments a page asks for: the Hub's own default. */
export const COMMENTS_PAGE_SIZE = 20;

/** How many recent chats the share sheet offers. */
export const SHARE_CHATS_LIMIT = 30;

const unreadable = (what: string) => new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);

export async function fetchPiece(id: string): Promise<Piece> {
  const piece = await readData<Piece>(api.GET('/api/hub/content/{id}', { params: { path: { id } } }), 'piece');
  if (!filled(piece.id) || !filled(piece.title) || !filled(piece.creatorWawuId)) throw unreadable('piece');
  return piece;
}

export async function fetchPieceDetail(id: string): Promise<PieceDetail> {
  const detail = await readData<PieceDetail>(api.GET('/api/hub/content/{id}/detail', { params: { path: { id } } }), 'piece');
  if (!detail.freePreview || !detail.rating || !Array.isArray(detail.lessons)) throw unreadable('piece');
  return detail;
}

export async function fetchEngagement(id: string): Promise<Engagement> {
  const e = await readData<Engagement>(api.GET('/api/hub/content/{id}/engagement', { params: { path: { id } } }), 'piece');
  if (typeof e.likes !== 'number' || typeof e.likedByMe !== 'boolean') throw unreadable('piece');
  return e;
}

export async function fetchComments(id: string, page: number): Promise<{ items: Comment[]; nextPage: number | null }> {
  const body = (await unwrap(
    api.GET('/api/hub/content/{id}/comments', { params: { path: { id }, query: { page, perPage: COMMENTS_PAGE_SIZE } } }),
  )) as unknown as { data?: Comment[] | null; pagination?: { nextPage?: number | null } };
  if (!Array.isArray(body?.data)) throw unreadable('comments');
  const next = body.pagination?.nextPage;
  // Without a `pagination` block a full page means there may be more; a short one is the last.
  const more = typeof next === 'number' ? next : body.data.length >= COMMENTS_PAGE_SIZE ? page + 1 : null;
  return { items: body.data, nextPage: more };
}

/** POST a comment, or a reply to one. */
export async function postComment(id: string, text: string, replyToId: string | null): Promise<Comment> {
  const comment = await readData<Comment>(
    api.POST('/api/hub/content/{id}/comments', { params: { path: { id } }, body: { text, ...(replyToId ? { replyToId } : {}) } }),
    'comment',
  );
  if (!filled(comment.id)) throw unreadable('comment');
  return comment;
}

export type CommentLike = { likes: number; likedByMe: boolean };

export async function setCommentLiked(id: string, commentId: string, liked: boolean): Promise<CommentLike> {
  const params = { params: { path: { id, commentId } } };
  const state = await readData<CommentLike>(
    liked ? api.POST('/api/hub/content/{id}/comments/{commentId}/like', params) : api.DELETE('/api/hub/content/{id}/comments/{commentId}/like', params),
    'like',
  );
  if (typeof state.likes !== 'number') throw unreadable('like');
  return state;
}

/** PUT the rating: 1 to 5, replaced if there was one. */
export async function putRating(id: string, rating: number): Promise<RatingState> {
  const state = await readData<RatingState>(api.PUT('/api/hub/content/{id}/rating', { params: { path: { id } }, body: { rating } }), 'rating');
  if (typeof state.count !== 'number') throw unreadable('rating');
  return state;
}

/** Counts one share of the piece. The Hub counts one per person per piece, so a repeat is `counted: false`. */
export async function countShare(id: string): Promise<void> {
  await unwrap(api.POST('/api/hub/content/{id}/share', { params: { path: { id } } }));
}

export async function unfollow(wawuId: string): Promise<boolean> {
  const body = (await unwrap(
    api.DELETE('/api/hub/creators/{wawuId}/follow', { params: { path: { wawuId } } }),
  )) as unknown as { data?: { following?: boolean } };
  return body?.data?.following === true;
}

export async function fetchShareChats(): Promise<ChatSummary[]> {
  const page = await readData<{ items: ChatSummary[] }>(api.GET('/api/hub/chats', { params: { query: { limit: SHARE_CHATS_LIMIT } } }), 'chats');
  if (!Array.isArray(page.items)) throw unreadable('chats');
  return page.items;
}

/** Sends one chat the piece's link as a text message. The same `clientMessageId` again answers the message already stored. */
export async function sendLinkToChat(chatId: string, text: string, clientMessageId: string): Promise<void> {
  await readData<{ id: string }>(api.POST('/api/hub/chats/{chatId}/messages', { params: { path: { chatId } }, body: { text, clientMessageId } }), 'message');
}

/**
 * A fresh link to one lesson's file (H25, FIX-107). The Hub decides who may play it: a free lesson for anyone who may open the piece,
 * the rest for the creator and for a buyer (403 for anyone else, 404 for a lesson with no file). The link is short-lived and is asked
 * for again each time a lesson is opened.
 */
export async function fetchLessonPlay(id: string, lessonId: string): Promise<LessonPlay> {
  const play = await readData<LessonPlay>(api.GET('/api/hub/content/{id}/lessons/{lessonId}/play', { params: { path: { id, lessonId } } }), 'lesson');
  if (!filled(play.url)) throw unreadable('lesson');
  return play;
}

/** Marks a lesson finished for the person (M29's "3 of 12 done"); idempotent. The Hub takes it only for a course the person may open. */
export async function markLessonDone(lessonId: string): Promise<void> {
  await unwrap(api.PUT('/api/hub/me/lessons/{lessonId}/done', { params: { path: { lessonId } } }));
}

