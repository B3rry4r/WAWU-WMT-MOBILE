import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';

/** `GET /me/suspension` (USER-SUSPEND, R-121): whether the signed-in person is suspended, since when, and the Hub's own sentence. */
export type MySuspension = components['schemas']['MySuspensionView'];

export const mySuspensionKey = ['me', 'suspension'] as const;

type Envelope<T> = { statusCode: number; message: string; data: T | null };

export async function fetchMySuspension(): Promise<MySuspension> {
  const body = (await unwrap(api.GET('/api/hub/me/suspension'))) as unknown as Envelope<MySuspension>;
  if (!body.data) throw new Error('The Hub answered without data.');
  return body.data;
}

/** A read like any other: a failure is quiet (no banner), and Me asks again each time it is opened after a minute. */
export function useMySuspension(enabled = true) {
  return useQuery({ queryKey: mySuspensionKey, queryFn: fetchMySuspension, enabled, staleTime: 60_000, retry: false });
}
