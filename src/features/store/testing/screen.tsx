/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * Renders a buy screen the way the app does, for tests only (IAP-02): signed in as `me`, with the query client and the safe area. The
 * session reads its token from the secure store, so a test that uses this mocks `expo-secure-store` with a Map as the others do.
 */
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
export const TOKEN = `${b64({ alg: 'none' })}.${b64({ sub: 'me', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;

export async function renderSignedIn(ui: ReactElement) {
  const { adoptSession } = require('@/api/session') as typeof import('@/api/session');
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  await adoptSession({ accessToken: TOKEN, refreshToken: 'r' });
  return rtl.render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>{ui}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

export function resetApp(): void {
  const { resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');
  const { queryClient } = require('@/api/query') as typeof import('@/api/query');
  queryClient.clear();
  resetSessionForTests();
}
