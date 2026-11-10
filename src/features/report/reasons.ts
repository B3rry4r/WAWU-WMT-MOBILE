import type { ReportKind, ReportReason } from './api';

/** The Hub's short fixed list, in the order it is drawn. The words are the app's. */
export const REPORT_REASONS: readonly { reason: ReportReason; label: string }[] = [
  { reason: 'spam', label: 'Spam or a scam' },
  { reason: 'harassment', label: 'Harassment or bullying' },
  { reason: 'hate', label: 'Hate or threats' },
  { reason: 'sexual', label: 'Nudity or sexual content' },
  { reason: 'illegal', label: 'Illegal or dangerous' },
  { reason: 'impersonation', label: 'Pretending to be someone' },
  { reason: 'other', label: 'Something else' },
];

/** What the sheet's title and the menu rows call each kind. */
export const REPORT_WORDS: Record<ReportKind, { title: string; row: string }> = {
  piece: { title: 'Report this piece', row: 'Report this piece' },
  comment: { title: 'Report this comment', row: 'Report comment' },
  profile: { title: 'Report this profile', row: 'Report this profile' },
  community_message: { title: 'Report this message', row: 'Report message' },
  chat_message: { title: 'Report this message', row: 'Report message' },
  direct_message: { title: 'Report this conversation', row: 'Report this conversation' },
};

/** After sending: the same words for every kind. */
export const REPORT_THANKS = 'Thanks. We’ll review this.';
