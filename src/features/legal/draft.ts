import { onSessionEnd } from '@/api/session';

/**
 * What a person has typed and not sent, by conversation, kept while the app runs so that leaving the chat (the
 * bar's back button or the phone's Back) and returning finds the words still there. It is forgotten when the
 * message is sent and when the session ends.
 */
const drafts = new Map<string, string>();

onSessionEnd(() => drafts.clear());

export function readDraft(threadId: string): string {
  return drafts.get(threadId) ?? '';
}

export function writeDraft(threadId: string, text: string): void {
  if (text === '') drafts.delete(threadId);
  else drafts.set(threadId, text);
}
