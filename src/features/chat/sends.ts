import { onSessionEnd } from '@/api/session';
import { readLocal, writeLocal } from '@/features/claim/localStore';

/**
 * The sends this phone made from a chat, so I15's "You sent" bubble is there when the chat is opened again.
 *
 * The Hub writes no chat message for a send (BACKEND_GAPS: a `money_sent` message kind, the send carrying a chat), so the only
 * record tying a send to a chat is the one this phone makes at the moment the send completes: the send's id, under the chat's id.
 * Everything the bubble shows (the amount, the note, whether it was delivered, when) is read from the Hub's own record of the send
 * by that id (`GET /money/transfers/{id}`), never kept here. The person who got the money sees no bubble in their chat.
 *
 * Nothing here is a secret. One account's list is one key in the phone's store; every call is bounded and never throws, and a store
 * that fails reads as "none kept" while the memory of this run still holds what was added.
 */
export type ChatSend = { transferId: string; at: number };

const MAX_PER_CHAT = 50;
const keyOf = (owner: string) => `wmt.chat.sends.${owner}`;

const memory = new Map<string, Record<string, ChatSend[]>>();
const loading = new Map<string, Promise<Record<string, ChatSend[]>>>();
let writes: Promise<unknown> = Promise.resolve();

function parse(raw: string | null): Record<string, ChatSend[]> {
  try {
    const value: unknown = raw ? JSON.parse(raw) : {};
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    const out: Record<string, ChatSend[]> = {};
    for (const [chatId, rows] of Object.entries(value as Record<string, unknown>)) {
      if (!Array.isArray(rows)) continue;
      const clean = rows.filter(
        (row): row is ChatSend => typeof row === 'object' && row !== null && typeof (row as ChatSend).transferId === 'string' && (row as ChatSend).transferId.length > 0 && Number.isFinite((row as ChatSend).at),
      );
      if (clean.length > 0) out[chatId] = clean;
    }
    return out;
  } catch {
    return {};
  }
}

async function load(owner: string): Promise<Record<string, ChatSend[]>> {
  const known = memory.get(owner);
  if (known) return known;
  const pending = loading.get(owner);
  if (pending) return pending;
  const reading = (async () => {
    const stored = parse(await readLocal(keyOf(owner)));
    // Whatever this run added while the phone was being asked is newer than the store.
    const settled = memory.get(owner) ?? stored;
    memory.set(owner, settled);
    loading.delete(owner);
    return settled;
  })();
  loading.set(owner, reading);
  return reading;
}

/** The sends made from this chat, newest first. */
export async function chatSends(owner: string, chatId: string): Promise<ChatSend[]> {
  const all = await load(owner);
  return [...(all[chatId] ?? [])].sort((a, b) => b.at - a.at);
}

/** Keeps one completed send under its chat. The same send twice is kept once. */
export async function addChatSend(owner: string, chatId: string, transferId: string, at: number = Date.now()): Promise<void> {
  const all = await load(owner);
  const rows = all[chatId] ?? [];
  if (rows.some((row) => row.transferId === transferId)) return;
  const next = { ...all, [chatId]: [{ transferId, at }, ...rows].slice(0, MAX_PER_CHAT) };
  memory.set(owner, next);
  const done = writes.then(() => writeLocal(keyOf(owner), JSON.stringify(next)));
  writes = done;
  await done;
}

/** For tests: the phone forgets what this run held in memory (the store keeps what it was given). */
export function forgetChatSendsInMemory(): void {
  memory.clear();
  loading.clear();
  writes = Promise.resolve();
}

onSessionEnd(forgetChatSendsInMemory);
