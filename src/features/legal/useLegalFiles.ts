import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { kindOfType, releaseChatUpload, uploadLegalFile, type ChatFile } from '@/features/chat/attachments';

import { sendLegalFile, type LegalThread } from './api';

/** A file of the person's own that the Hub has not put in the conversation yet: on its way, or refused (R2-LEGAL3). */
export type OutgoingFile = {
  localId: string;
  /**
   * `key` is where the file landed once uploaded, so a retry after a refused send does not upload it again. `reserved` is an upload the Hub
   * counted that never landed (a failed upload, or a send that did not find the file): it is given back before the next try asks for a new
   * one, so one file is charged once.
   */
  file: ChatFile & { key?: string; reserved?: string };
  status: 'sending' | 'failed';
  /** The Hub's own sentence when it refused, or the phone's when no answer came. */
  error?: string;
};

let localCount = 0;
const nextLocalId = () => `legal-file-${(localCount += 1)}`;

/**
 * The photos, videos and PDFs the person sends on their matter (R2-LEGAL3), the Legal chat's version of the one-to-one chat's file send
 * (`useChatThread`): a bubble at once, the file uploaded and sent behind it, and on a failure the same Try again and Delete. The Hub puts the
 * file in the conversation and answers it; `keep` stores that answer. One file's failure never stops another.
 */
export function useLegalFiles(threadId: string, keep: (thread: LegalThread) => void) {
  const [outgoing, setOutgoing] = useState<OutgoingFile[]>([]);
  const running = useRef(new Set<string>());
  const outgoingRef = useRef<OutgoingFile[]>([]);
  const keepRef = useRef(keep);
  useEffect(() => {
    outgoingRef.current = outgoing;
    keepRef.current = keep;
  });

  const patch = useCallback((localId: string, change: (entry: OutgoingFile) => OutgoingFile) => {
    setOutgoing((held) => held.map((entry) => (entry.localId === localId ? change(entry) : entry)));
  }, []);

  const run = useCallback(
    async (entry: OutgoingFile) => {
      if (running.current.has(entry.localId)) return;
      running.current.add(entry.localId);
      patch(entry.localId, (held) => ({ ...held, status: 'sending', error: undefined }));
      const file = entry.file;
      let uploadedKey = file.key;
      let reserved = file.reserved;
      const mark = (change: { key?: string; reserved?: string }) => patch(entry.localId, (held) => ({ ...held, file: { ...held.file, ...change } }));
      try {
        if (!uploadedKey && reserved) {
          // Try again after an upload that failed: the dead reservation is given back first, so the new one is the only one charged.
          await releaseChatUpload(reserved);
          reserved = undefined;
          mark({ reserved: undefined });
        }
        if (!uploadedKey) {
          uploadedKey = await uploadLegalFile(threadId, file, (key) => {
            reserved = key;
            mark({ reserved: key });
          });
          reserved = undefined;
          mark({ key: uploadedKey, reserved: undefined });
        }
        const thread = await sendLegalFile(threadId, uploadedKey, kindOfType(file.contentType) === 'file' ? file.name : null);
        file.discard?.();
        keepRef.current(thread);
        setOutgoing((held) => held.filter((candidate) => candidate.localId !== entry.localId));
      } catch (error) {
        const refused = isApiError(error) ? error : null;
        // A refused send (the Hub did not find the file) means the next try uploads it again, after giving back the one it did not find.
        const lost = refused?.status === 400 && uploadedKey !== undefined;
        patch(entry.localId, (held) => ({
          ...held,
          status: 'failed',
          error: refused?.message ?? 'Something went wrong. Try again.',
          file: { ...held.file, key: lost ? undefined : held.file.key, reserved: lost ? uploadedKey : reserved },
        }));
      } finally {
        running.current.delete(entry.localId);
      }
    },
    [threadId, patch],
  );

  /** A file the person chose: a bubble at once, uploaded and sent behind it. */
  const add = useCallback(
    (file: ChatFile) => {
      const entry: OutgoingFile = { localId: nextLocalId(), file, status: 'sending' };
      setOutgoing((held) => [...held, entry]);
      void run(entry);
    },
    [run],
  );

  const retry = useCallback(
    (localId: string) => {
      const entry = outgoingRef.current.find((candidate) => candidate.localId === localId);
      if (entry && entry.status === 'failed') void run(entry);
    },
    [run],
  );

  /** Delete on a failed bubble gives its upload back: it was counted, and no line will carry it. */
  const discard = useCallback((localId: string) => {
    const entry = outgoingRef.current.find((candidate) => candidate.localId === localId);
    entry?.file.discard?.();
    const held = entry?.file.key ?? entry?.file.reserved;
    if (held) void releaseChatUpload(held);
    setOutgoing((all) => all.filter((candidate) => candidate.localId !== localId));
  }, []);

  return { outgoing, add, retry, discard };
}
