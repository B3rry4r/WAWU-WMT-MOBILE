import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { filled } from '@/features/money-attempt/refusal';

/**
 * The call behind every "talk to us" button (SUPPORT-01, R-30): `POST /support/thread` opens the person's one support thread, or
 * gets the one that exists, with the payment they are asking about already written into it as its first message. The thread is an
 * ordinary chat, so the chat screen (I12) shows it from the `chatId` this returns. The same reference sent again answers the same
 * chat and the same message, so a second tap never writes it twice. The Hub's success body is `{ statusCode, message, data }` and
 * the contract types only `data` (SHARED-CHANGES.md row 11).
 */
export type SupportThread = components['schemas']['SupportThreadView'];
export type SupportReference = NonNullable<components['schemas']['OpenSupportThreadDto']['reference']>;

type Envelope<T> = { data?: T | null };

/** What W27's "Report a problem" is about: the wallet's own row (the id `GET /money/transactions/{id}` took). */
export const transactionReference = (id: string): SupportReference => ({ kind: 'transaction', id });
/** What H18's "Contact support" is about: the payment the unlock made. */
export const paymentReference = (id: string): SupportReference => ({ kind: 'payment', id });

/** POST /support/thread. No reference opens the thread with nothing attached (W35, "Help with a payment"). */
export async function openSupportThread(reference?: SupportReference): Promise<SupportThread> {
  const body = (await unwrap(api.POST('/api/hub/support/thread', { body: reference ? { reference } : {} }))) as unknown as Envelope<SupportThread>;
  const thread = body?.data;
  if (!thread || !filled(thread.chatId)) throw new ApiError('unknown', 200, 'The support chat could not be read. Try again.');
  return thread;
}
