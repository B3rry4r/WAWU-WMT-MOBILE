import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { fetchMe, meKey } from '@/features/profile-edit/api';
import { fullName } from '@/features/profile-edit/form';
import type { PickedImage } from '@/features/profile-edit/pickImage';
import { onLiveEvent, onLiveSynced, retainLive } from '@/features/inbox/live';
import { refreshInbox } from '@/features/inbox/unread';

import {
  creditsKey,
  fetchMessages,
  markRoomRead,
  messagesKey,
  newMessageKey,
  roomKey,
  sendMessage,
  uploadMessagePhoto,
  type CommunityMessage,
  type CommunitySender,
} from './api';

/** A message of the person's own that has not been confirmed by the server: on its way, or refused. */
export type OutgoingMessage = {
  localId: string;
  /** What was typed; empty for a photo sent on its own. */
  text: string;
  /** The photo the person chose, kept until the message is stored or removed (the sending bubble draws it, and a retry may upload it again). */
  photo?: PickedImage;
  /** The address the photo was uploaded to, once it is up: a retry sends this and never uploads the same photo twice (the Hub's key covers the address). */
  imageUrl?: string;
  /** The Hub's `Idempotency-Key` for this one message: made when it is composed, sent again unchanged on every retry, never used for another. */
  key: string;
  status: 'sending' | 'failed';
  /** The server's own sentence when it refused, or the phone's when no answer came. */
  error?: string;
  /** The server said the person has no credits left (402). */
  outOfCredits?: boolean;
  /** The server refused the words themselves (too long, or empty): sending them again cannot work, they need editing. */
  needsEdit?: boolean;
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
/** The validator's own words for a message past the limit; the screen says it in plain language instead. */
const TOO_LONG = /shorter than or equal to \d+ characters/i;

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

/** Whether `message` is the one `entry` sent: the person's own, not held when they tried, with the same photo, or the same words and no photo. */
function sentBy(message: CommunityMessage, entry: OutgoingMessage, ownId: string): boolean {
  if (message.senderWawuId !== ownId || entry.heldIds.has(message.id)) return false;
  if (entry.photo) return entry.imageUrl !== undefined && message.imageUrl === entry.imageUrl;
  return !message.imageUrl && message.text === entry.text;
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
 *   replaces it. Every message gets one `Idempotency-Key` when it is composed, sent with every try of that
 *   message and with no other: per sender and key the Hub stores and charges once and answers a repeat with
 *   the first message, so a send whose answer was lost is safe to send again (INBOX-05 defect 21). One send
 *   still runs at a time and a second press while it runs does nothing.
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
  const outgoingRef = useRef(outgoing);
  useEffect(() => {
    outgoingRef.current = outgoing;
  }, [outgoing]);

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
    // A room keeps the connection up while it is open, whatever is underneath it: opened from a reload, a room link or a push
    // there are no tabs below it to hold the socket (INBOX-05 defect 13). The connection counts its holders, so under the tabs
    // this is a second hold, and the socket closes only when the last one lets go.
    const release = retainLive();
    return () => {
      offEvent();
      offSynced();
      release();
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

  // A "Not sent" copy of words the Hub did store (the answer was lost) is settled when the same words arrive under this person's
  // name, on the live socket or in a page: the pending copy is no longer drawn, instead of showing the words twice (INBOX-05 #34).
  const ownId = me.data?.wawuUserId;
  const settled = useMemo(() => {
    const done = new Set<string>();
    if (!ownId) return done;
    for (const entry of outgoing) {
      if (entry.status !== 'failed' || entry.uncertain !== true) continue;
      if (items.some((message) => sentBy(message, entry, ownId))) {
        done.add(entry.localId);
      }
    }
    return done;
  }, [items, outgoing, ownId]);
  const pending = useMemo(() => (settled.size === 0 ? outgoing : outgoing.filter((entry) => !settled.has(entry.localId))), [outgoing, settled]);
  // The words were stored, so the credits they cost are spent: read the balance again.
  const settledCount = settled.size;
  useEffect(() => {
    if (settledCount > 0) void queryClient.invalidateQueries({ queryKey: creditsKey });
  }, [settledCount]);

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
    (localId: string, message: CommunityMessage, photo?: PickedImage) => {
      take([{ ...message, sender: message.sender ?? meSender ?? undefined }]);
      // The stored message has the photo now: the app's own copy of it is deleted.
      photo?.discard?.();
      setOutgoing((held) => held.filter((entry) => entry.localId !== localId));
      void queryClient.invalidateQueries({ queryKey: creditsKey });
    },
    [take, meSender],
  );

  /**
   * Whether a message the phone could not confirm was stored after all, found by reading the newest page. Only a shortcut: it
   * saves a request when the message did land. The key is what makes sending again safe, so when this read cannot be made the
   * message is sent again with the same key (see `run`).
   */
  const landed = useCallback(
    async (entry: OutgoingMessage): Promise<CommunityMessage | null> => {
      const own = me.data ?? (await fetchMe());
      const page = await fetchMessages(id, 1);
      return page.items.find((message) => sentBy(message, entry, own.wawuUserId)) ?? null;
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
        // A look-up that cannot be read is no answer: the message is sent again under its own key, and the Hub stores it once.
        const stored = entry.uncertain ? await landed(entry).catch(() => null) : null;
        if (stored) {
          confirm(entry.localId, stored, entry.photo);
          return;
        }
        // A photo goes up first, once: its address is kept on the message so a retry sends the same one under the same key.
        let imageUrl = entry.imageUrl;
        if (entry.photo && !imageUrl) {
          imageUrl = await uploadMessagePhoto(entry.photo);
          setOutgoing((held) => held.map((candidate) => (candidate.localId === entry.localId ? { ...candidate, imageUrl } : candidate)));
        }
        confirm(entry.localId, await sendMessage(id, { text: entry.text || undefined, imageUrl }, entry.key), entry.photo);
      } catch (error) {
        const refused = isApiError(error) ? error : null;
        const outOfCredits = refused?.status === OUT_OF_CREDITS;
        const uncertain = !refused || refused.kind === 'network' || refused.kind === 'server';
        const needsEdit = refused?.kind === 'validation';
        const reason = needsEdit && TOO_LONG.test(refused?.message ?? '') ? 'That message is too long. Shorten it and send it again.' : refused?.message;
        setOutgoing((held) =>
          held.map((candidate) =>
            candidate.localId === entry.localId
              ? {
                  ...candidate,
                  status: 'failed',
                  error: reason ?? 'Something went wrong. Try again.',
                  outOfCredits,
                  needsEdit,
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

  /** Sends what was typed, with a photo if one was chosen. Returns false when nothing was sent (nothing to say, or a send is still running). */
  const send = useCallback(
    (raw: string, photo?: PickedImage | null): boolean => {
      const text = raw.trim();
      if ((!text && !photo) || sending.current) return false;
      const entry: OutgoingMessage = {
        localId: nextLocalId(),
        text,
        photo: photo ?? undefined,
        key: newMessageKey(),
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

  /** Removes a message that was not sent. `keepPhoto` leaves the photo's own copy alone, for a message put back in the field to be changed. */
  const discard = useCallback((localId: string, keepPhoto = false) => {
    if (!keepPhoto) outgoingRef.current.find((entry) => entry.localId === localId)?.photo?.discard?.();
    setOutgoing((held) => held.filter((entry) => entry.localId !== localId));
  }, []);

  return {
    ...query,
    items,
    outgoing: pending,
    send,
    retry,
    discard,
    /** A send is on its way: the Send button waits. */
    busy: pending.some((entry) => entry.status === 'sending'),
    me: meSender,
  };
}
