import createClient from 'openapi-fetch';

import type { paths } from './schema.generated';

/**
 * The typed Hub API client. Every request and response type comes from
 * schema.generated.ts, which is generated from the backend contract
 * (`npm run api`). Never hand-write a response shape: if the contract does not
 * describe what a screen needs, that is a backend task (BACKEND_GAPS.md).
 *
 * EXPO_PUBLIC_API_URL picks the environment: staging for development and
 * testers, production for store builds.
 */
export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://staging.invalid';

export const api = createClient<paths>({ baseUrl: apiBaseUrl });
