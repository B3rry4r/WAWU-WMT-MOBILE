import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Engine, PaymentViewLike, QuoteLike } from '../usePaymentFlow';
import { usePaymentFlow } from '../usePaymentFlow';

/**
 * SWEEP-APP-3 row 138 (HOME-13 S1 L2): the kept payment attempts are dropped when a session ends. After a lost answer and a sign-out,
 * the next person making the identical tip or unlock in the same run must not send the first person's key and quote.
 */
const ends: (() => void)[] = [];
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  onSessionEnd: (listener: () => void) => {
    ends.push(listener);
    return () => undefined;
  },
}));

const handlers = { onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() };

function setup() {
  const asked: number[] = [];
  const sends: { key: string; token: string }[] = [];
  const engine: Engine<QuoteLike & { token: string }, PaymentViewLike> = {
    scope: 'tip:ada:2000',
    ask: async () => {
      asked.push(asked.length);
      return { token: `quote-${asked.length}`, payment: { totalKobo: 202_500 } } as never;
    },
    send: async (quote, key) => {
      sends.push({ key, token: quote.token });
      return { kind: 'unanswered' };
    },
    read: async () => {
      throw new Error('not read');
    },
    readKey: (id) => ['tip', id],
    shortLine: 'short',
  };
  return { engine, asked, sends };
}

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
afterAll(() => client.clear());
const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

async function tryToPay(engine: ReturnType<typeof setup>['engine']) {
  let flow: ReturnType<typeof usePaymentFlow<QuoteLike & { token: string }, PaymentViewLike>> | null = null;
  function Probe() {
    flow = usePaymentFlow(engine, handlers);
    return null;
  }
  const screen = await rtl.render(<Probe />, { wrapper: wrap });
  await rtl.act(async () => {
    await flow!.open();
  });
  await rtl.act(async () => {
    await flow!.pay();
  });
  await rtl.act(async () => {
    await flow!.submitPin('1234');
  });
  await screen.unmount();
}

it('keeps an undecided attempt for the same person, and drops it when the session ends', async () => {
  const { engine, asked, sends } = setup();
  await tryToPay(engine);
  expect(sends).toHaveLength(1);
  // The same person comes back to the same payment: the SAME key and the SAME quote go again, never a new quote.
  await tryToPay(engine);
  expect(sends).toHaveLength(2);
  expect(sends[1]).toEqual(sends[0]);
  // The session ends, and another person makes the identical payment: a new quote and a new key.
  await rtl.act(async () => {
    ends.forEach((end) => end());
  });
  await tryToPay(engine);
  expect(sends).toHaveLength(3);
  expect(sends[2].key).not.toBe(sends[0].key);
  expect(sends[2].token).not.toBe(sends[0].token);
  expect(asked.length).toBeGreaterThanOrEqual(4);
});
