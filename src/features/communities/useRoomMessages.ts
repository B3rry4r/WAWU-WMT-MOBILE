import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { fetchMe, meKey } from '@/features/profile-edit/api';
import { fullName } from '@/features/profile-edit/form';
import { onLiveEvent, onLiveSynced } from '@/features/inbox/live';
import { refreshInbox } from '@/features/inbox/unread';

import {
  creditsKey,
  fetchMessages,
  markRoomRead,
  messagesKey,
  roomKey,
  sendMessage,
  type CommunityMessage,
  type CommunitySender,
} from './api';

/** A message of the person's own that has not been confirmed by the server: on its way, or refused. */
export type OutgoingMessage = {
  localId: string;
  text: string;
  status: 'sending' | 'failed';
  /** The server's own sentence when it refused, or the phone's when no answer came. */
  error?: string;
  /** The server said the person has no credits left (402). */
  outOfCredits?: boolean;
  /** The request got no usable answer, so the message may have been stored anyway. */
  uncertain?: boolean;
  /** The ids of the room's messages the phone held when it tried, so a retry can tell whether this one landed. */
  heldIds: ReadonlySet<string>;
};

/** Waits shorter than this are not worth a request: events that arrive together share one read mark. */
const READ_MARK_COALESCE_MS = 300;
/** The server's refusal for a person who is not in the room (403) or a room hidden from them (404). */
const NOT_A_MEMBER = 403;
const OUT_OF_CREDITS = 402;

/** The person's own profile: who "me" is, and how their own sent messages read until the server echoes them. */
export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: fetchMe, staleTime: Infinity }, queryClient);
}

function firstSeen(items: readonly CommunityMessage[]): CommunityMessage[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

let localCount = 0;
const nextLocalId = () => `local-${(localCount += 1)}`;

/**
 * A room's messages, newest first, for I25 and I26. One room per mount: the screen is keyed by the room's id.
 *
 * - History is read a page at a time (`GET /communities/:id/messages`, offset pages, newest first).
 * - New messages arrive on the live socket (`community.message` events, catch-up included) and are
 *   merged in by id, so a message the page also holds, or an event repeated after a reconnect, shows once.
 *   A message arriving while a page is being read is kept apart from the pages until the pages hold it,
 *   so a read that started before it cannot erase it.
 * - What the person sends is held here as `outgoing` until the server answers; the server's answer
 *   replaces it. One send runs at a time and a second press while it runs does nothing, because the route
 *   takes no idempotency key (BACKEND_GAPS.md): a message could be charged twice.
 * - The room is marked read while the person is looking at it, and the Inbox is read again after.
 */
export function useRoomMessages(id: string, looking: boolean) {
  const me = useMe();
  const query = useInfiniteQuery(
    {
      queryKey: messagesKey(id),
      queryFn: ({ pageParam }) => fetchMessages(id, pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) => last.nextPage ?? undefined,
      staleTime: 0,
    },
    queryClient,
  );
  const [arrived, setArrived] = useState<CommunityMessage[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingMessage[]>([]);

  const take = useCallback((messages: readonly CommunityMessage[]) => {
    setArrived((held) => {
      const have = new Set(held.map((message) => message.id));
      const fresh = messages.filter((message) => !have.has(message.id));
      return fresh.length === 0 ? held : [...fresh, ...held];
    });
  }, []);

  useEffect(() => {
    const offEvent = onLiveEvent((event) => {
      if (event.type === 'community.message' && event.communityId === id) take([event.message]);
    });
    // The socket is up and caught up: read the newest page, in case an event was lost while it was down.
    const offSynced = onLiveSynced(() => {
      fetchMessages(id, 1)
        .then((page) => take(page.items))
        .catch(() => undefined);
    });
    return () => {
      offEvent();
      offSynced();
      // A room left open for a long read holds only its newest page afterwards, so coming back is one request.
      queryClient.setQueryData(messagesKey(id), (data: typeof query.data) =>
        data ? { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) } : data,
      );
    };
    // The cache's current pages are read inside the cleanup only to shorten them; they are not a reason to resubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, take]);

  const items = useMemo(() => {
    const paged = query.data?.pages.flatMap((page) => page.items) ?? [];
    const merged = firstSeen([...arrived, ...paged]);
    return merged.sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt));
  }, [query.data, arrived]);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Reading: mark the room read while it is on screen and its newest message is one the person has seen.
  const newestId = items[0]?.id;
  useEffect(() => {
    if (!looking || !newestId || query.isError) return undefined;
    const timer = setTimeout(() => {
      markRoomRead(id)
        .then(() => refreshInbox())
        .catch(() => undefined);
    }, READ_MARK_COALESCE_MS);
    return () => clearTimeout(timer);
  }, [id, looking, newestId, query.isError]);

  const sending = useRef(false);

  const meSender = useMemo<CommunitySender | null>(() => {
    const profile = me.data;
    if (!profile) return null;
    return {
      wawuId: profile.wawuUserId,
      name: fullName(profile),
      handle: profile.handle ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      verification: profile.verification,
    };
  }, [me.data]);

  /** The server stored it, so the person's own send reads like any other message. */
  const confirm = useCallback(
    (localId: string, message: CommunityMessage) => {
      take([{ ...message, sender: message.sender ?? meSender ?? undefined }]);
      setOutgoing((held) => held.filter((entry) => entry.localId !== localId));
      void queryClient.invalidateQueries({ queryKey: creditsKey });
    },
    [take, meSender],
  );

  /** Whether a message the phone could not confirm was stored after all, found by reading the newest page. */
  const landed = useCallback(
    async (entry: OutgoingMessage): Promise<CommunityMessage | null> => {
      const own = me.data ?? (await fetchMe());
      const page = await fetchMessages(id, 1);
      return (
        page.items.find(
          (message) => message.senderWawuId === own.wawuUserId && message.text === entry.text && !entry.heldIds.has(message.id),
        ) ?? null
      );
    },
    [id, me.data],
  );

  const run = useCallback(
    async (entry: OutgoingMessage) => {
      if (sending.current) return;
      sending.current = true;
      setOutgoing((held) =>
        held.map((candidate) => (candidate.localId === entry.localId ? { ...candidate, status: 'sending', error: undefined } : candidate)),
      );
      try {
        const stored = entry.uncertain ? await landed(entry).catch(() => null) : null;
        confirm(entry.localId, stored ?? (await sendMessage(id, entry.text)));
      } catch (error) {
        const refused = isApiError(error) ? error : null;
        const outOfCredits = refused?.status === OUT_OF_CREDITS;
        const uncertain = !refused || refused.kind === 'network' || refused.kind === 'server';
        setOutgoing((held) =>
          held.map((candidate) =>
            candidate.localId === entry.localId
              ? {
                  ...candidate,
                  status: 'failed',
                  error: refused?.message ?? 'Something went wrong. Try again.',
                  outOfCredits,
                  uncertain,
                }
              : candidate,
          ),
        );
        if (outOfCredits) void queryClient.invalidateQueries({ queryKey: creditsKey });
        if (refused?.status === NOT_A_MEMBER) void queryClient.invalidateQueries({ queryKey: roomKey(id) });
      } finally {
        sending.current = false;
      }
    },
    [id, confirm, landed],
  );

  /** Sends what was typed. Returns false when nothing was sent (empty text, or a send is still running). */
  const send = useCallback(
    (raw: string): boolean => {
      const text = raw.trim();
      if (!text || sending.current) return false;
      const entry: OutgoingMessage = {
        localId: nextLocalId(),
        text,
        status: 'sending',
        heldIds: new Set(itemsRef.current.map((message) => message.id)),
      };
      setOutgoing((held) => [...held, entry]);
      void run(entry);
      return true;
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

  const discard = useCallback((localId: string) => {
    setOutgoing((held) => held.filter((entry) => entry.localId !== localId));
  }, []);

  return {
    ...query,
    items,
    outgoing,
    send,
    retry,
    discard,
    /** A send is on its way: the Send button waits. */
    busy: outgoing.some((entry) => entry.status === 'sending'),
    me: meSender,
  };
}
