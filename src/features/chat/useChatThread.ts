import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { onLiveEvent, onLiveSynced, retainLive } from '@/features/inbox/live';
import { refreshInbox } from '@/features/inbox/unread';

import { kindOfType, releaseChatUpload, sendChatFile, uploadChatFile, type ChatFile } from './attachments';
import {
  chatKey,
  chatMessagesKey,
  fetchChat,
  fetchChatMessages,
  markChatRead,
  newClientMessageId,
  sendChatText,
  type ChatMessage,
  type ChatMessagePage,
  type MoneyRequest,
} from './api';

/** A message of the person's own that the Hub has not confirmed yet: on its way, or refused. Text, or a photo, a video or a file (`file`). */
export type OutgoingText = {
  localId: string;
  text: string;
  /**
   * A photo, video or file on its way (FIX-104). `key` is where it landed once uploaded, so a retry after a refused send does not upload it again.
   * `reserved` is an upload the Hub counted that never landed (a failed upload, or a send that did not find the file): it is given back before
   * the next try asks for a new one, so one message is charged once.
   */
  file?: ChatFile & { key?: string; reserved?: string };
  /** The message's own id for the Hub: made when it is composed and sent again unchanged on every retry, so a lost answer never posts it twice. */
  clientMessageId: string;
  status: 'sending' | 'failed';
  /** The Hub's own sentence when it refused, or the phone's when no answer came. */
  error?: string;
  createdAt: string;
};

/** Events that arrive together share one read mark. */
const READ_MARK_COALESCE_MS = 300;

let localCount = 0;
const nextLocalId = () => `local-${(localCount += 1)}`;

const byNewest = (a: ChatMessage, b: ChatMessage) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

function firstSeen(items: readonly ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

type Pages = InfiniteData<ChatMessagePage, string | undefined>;

/**
 * One chat's messages, newest first, for I12 to I19. One chat per mount: the screen is keyed by the chat's id.
 *
 * - History is read a page at a time (`GET /chats/:id/messages`, an opaque cursor, newest first).
 * - A new message arrives on the live socket (`chat.message`) and is merged in by id, so one the page also holds, or an event repeated
 *   after a reconnect, shows once. A request that changed (`money_request.updated`: paid, declined, cancelled, being paid) replaces
 *   the message it is on, in the pages the phone already holds, so the bubble flips at once.
 * - What the person types is held as `outgoing` until the Hub answers; one `clientMessageId` per message, sent with every try of it.
 * - The chat is marked read while the person is looking at it, and the Inbox is read again after.
 */
export function useChatThread(chatId: string, looking: boolean) {
  const client = useQueryClient();
  const chat = useQuery({ queryKey: chatKey(chatId), queryFn: () => fetchChat(chatId) });
  const query = useInfiniteQuery({
    queryKey: chatMessagesKey(chatId),
    queryFn: ({ pageParam }) => fetchChatMessages(chatId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 0,
  });
  const [arrived, setArrived] = useState<ChatMessage[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingText[]>([]);

  /** Puts a request's new state on the message that carries it, wherever the phone holds that message. */
  const patchRequest = useCallback(
    (request: Pick<MoneyRequest, 'id'> & Partial<MoneyRequest>) => {
      const apply = (message: ChatMessage): ChatMessage =>
        message.moneyRequest && message.moneyRequest.id === request.id ? { ...message, moneyRequest: { ...message.moneyRequest, ...request } } : message;
      client.setQueryData<Pages>(chatMessagesKey(chatId), (data) => (data ? { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(apply) })) } : data));
      setArrived((held) => held.map(apply));
    },
    [client, chatId],
  );

  const take = useCallback((messages: readonly ChatMessage[]) => {
    setArrived((held) => {
      const have = new Set(held.map((message) => message.id));
      const fresh = messages.filter((message) => !have.has(message.id));
      return fresh.length === 0 ? held : [...fresh, ...held];
    });
  }, []);

  /** A message the Hub changed (a request): replaced in the pages and in what arrived, or taken as new when the phone had not seen it. */
  const replace = useCallback(
    (message: ChatMessage) => {
      let found = false;
      client.setQueryData<Pages>(chatMessagesKey(chatId), (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => {
              if (item.id !== message.id) return item;
              found = true;
              return message;
            }),
          })),
        };
      });
      setArrived((held) => {
        if (held.some((item) => item.id === message.id)) {
          found = true;
          return held.map((item) => (item.id === message.id ? message : item));
        }
        return held;
      });
      if (!found) take([message]);
    },
    [client, chatId, take],
  );

  useEffect(() => {
    const offEvent = onLiveEvent((event) => {
      if (event.type === 'chat.message' && event.message.chatId === chatId) take([event.message]);
      if (event.type === 'money_request.updated' && event.chatId === chatId) replace(event.message);
    });
    // The socket is up and caught up: read the newest page, in case an event was lost while it was down.
    const offSynced = onLiveSynced(() => {
      fetchChatMessages(chatId)
        .then((page) => page.items.forEach(replace))
        .catch(() => undefined);
    });
    // A chat keeps the connection up while it is open, whatever is underneath it: opened from a link or a push there are no tabs below it.
    const release = retainLive();
    return () => {
      offEvent();
      offSynced();
      release();
      // A chat left open for a long read holds only its newest page afterwards, so coming back is one request.
      client.setQueryData<Pages>(chatMessagesKey(chatId), (data) => (data ? { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) } : data));
    };
  }, [chatId, take, replace, client]);

  const items = useMemo(() => {
    const paged = query.data?.pages.flatMap((page) => page.items) ?? [];
    return firstSeen([...paged, ...arrived].sort(byNewest));
  }, [query.data, arrived]);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Reading: mark the chat read while it is on screen and its newest message is somebody else's.
  const newest = items[0];
  const newestId = newest?.id;
  const newestIsTheirs = newest !== undefined && !newest.mine;
  useEffect(() => {
    if (!looking || !newestId || !newestIsTheirs || query.isError) return undefined;
    const timer = setTimeout(() => {
      markChatRead(chatId, newestId)
        .then(() => refreshInbox())
        .catch(() => undefined);
    }, READ_MARK_COALESCE_MS);
    return () => clearTimeout(timer);
  }, [chatId, looking, newestId, newestIsTheirs, query.isError]);

  const sending = useRef(false);

  const confirm = useCallback(
    (localId: string, message: ChatMessage) => {
      take([message]);
      setOutgoing((held) => held.filter((entry) => entry.localId !== localId));
      void refreshInbox();
    },
    [take],
  );

  /** The localIds of files being uploaded and sent: a file takes as long as it takes, and never holds up a text message. */
  const filesRunning = useRef(new Set<string>());

  const runFile = useCallback(
    async (entry: OutgoingText) => {
      const file = entry.file;
      if (!file || filesRunning.current.has(entry.localId)) return;
      filesRunning.current.add(entry.localId);
      setOutgoing((held) => held.map((candidate) => (candidate.localId === entry.localId ? { ...candidate, status: 'sending', error: undefined } : candidate)));
      let uploadedKey = file.key;
      let reserved = file.reserved;
      const mark = (patch: { key?: string; reserved?: string }) =>
        setOutgoing((held) => held.map((candidate) => (candidate.localId === entry.localId && candidate.file ? { ...candidate, file: { ...candidate.file, ...patch } } : candidate)));
      try {
        if (!uploadedKey && reserved) {
          // Try again after an upload that failed: the dead reservation is given back first, so the new one is the only one charged.
          await releaseChatUpload(reserved);
          reserved = undefined;
          mark({ reserved: undefined });
        }
        if (!uploadedKey) {
          uploadedKey = await uploadChatFile(chatId, file, (key) => {
            reserved = key;
            mark({ reserved: key });
          });
          reserved = undefined;
          mark({ key: uploadedKey, reserved: undefined });
        }
        const message = await sendChatFile(chatId, uploadedKey, kindOfType(file.contentType) === 'file' ? file.name : null, entry.clientMessageId);
        file.discard?.();
        confirm(entry.localId, message);
      } catch (error) {
        const refused = isApiError(error) ? error : null;
        // A refused send (the Hub did not find the file) means the next try uploads it again, after giving back the one it did not find.
        const lost = refused?.status === 400 && uploadedKey !== undefined;
        setOutgoing((held) =>
          held.map((candidate) =>
            candidate.localId === entry.localId
              ? {
                  ...candidate,
                  status: 'failed',
                  error: refused?.message ?? 'Something went wrong. Try again.',
                  file: candidate.file ? { ...candidate.file, key: lost ? undefined : candidate.file.key, reserved: lost ? uploadedKey : reserved } : candidate.file,
                }
              : candidate,
          ),
        );
        if (refused?.status === 403) void client.invalidateQueries({ queryKey: chatKey(chatId) });
      } finally {
        filesRunning.current.delete(entry.localId);
      }
    },
    [chatId, confirm, client],
  );

  const run = useCallback(
    async (entry: OutgoingText) => {
      if (entry.file) return runFile(entry);
      if (sending.current) return;
      sending.current = true;
      setOutgoing((held) => held.map((candidate) => (candidate.localId === entry.localId ? { ...candidate, status: 'sending', error: undefined } : candidate)));
      try {
        confirm(entry.localId, await sendChatText(chatId, entry.text, entry.clientMessageId));
      } catch (error) {
        const refused = isApiError(error) ? error : null;
        setOutgoing((held) =>
          held.map((candidate) =>
            candidate.localId === entry.localId ? { ...candidate, status: 'failed', error: refused?.message ?? 'Something went wrong. Try again.' } : candidate,
          ),
        );
        if (refused?.status === 403) void client.invalidateQueries({ queryKey: chatKey(chatId) });
      } finally {
        sending.current = false;
      }
    },
    [chatId, confirm, client, runFile],
  );

  /** Sends what was typed. Returns false when nothing was sent (empty text, or a send is still running). */
  const send = useCallback(
    (raw: string): boolean => {
      const text = raw.trim();
      if (!text || sending.current) return false;
      const entry: OutgoingText = { localId: nextLocalId(), text, clientMessageId: newClientMessageId(), status: 'sending', createdAt: new Date().toISOString() };
      setOutgoing((held) => [...held, entry]);
      void run(entry);
      return true;
    },
    [run],
  );

  /** Sends a photo, a video or a file the person chose: a bubble at once, uploaded and sent behind it. */
  const sendFile = useCallback(
    (file: ChatFile) => {
      const entry: OutgoingText = { localId: nextLocalId(), text: '', file, clientMessageId: newClientMessageId(), status: 'sending', createdAt: new Date().toISOString() };
      setOutgoing((held) => [...held, entry]);
      void run(entry);
    },
    [run],
  );

  const retry = useCallback(
    (localId: string) => {
      const entry = outgoing.find((candidate) => candidate.localId === localId);
      if (entry && entry.status === 'failed') void run(entry);
    },
    [outgoing, run],
  );

  const discard = useCallback(
    (localId: string) => {
      const file = outgoing.find((entry) => entry.localId === localId)?.file;
      file?.discard?.();
      // Delete on a failed bubble gives its upload back: it was counted, and no message will carry it.
      const held = file?.key ?? file?.reserved;
      if (held) void releaseChatUpload(held);
      setOutgoing((held) => held.filter((entry) => entry.localId !== localId));
    },
    [outgoing],
  );

  /** A message the person's own action made (a request they sent) goes into the thread at once. */
  const add = useCallback((message: ChatMessage) => take([message]), [take]);

  return {
    chat,
    messages: query,
    items,
    outgoing,
    send,
    sendFile,
    retry,
    discard,
    add,
    patchRequest,
    /** A text message is on its way: Send waits. A file on its way does not stop the next message. */
    busy: outgoing.some((entry) => entry.status === 'sending' && !entry.file),
  };
}
