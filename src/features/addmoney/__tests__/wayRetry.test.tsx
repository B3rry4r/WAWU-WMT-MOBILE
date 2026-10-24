/* eslint-disable @typescript-eslint/no-require-imports */
import {
  act,
  configure,
  render as plainRender,
  screen,
  userEvent,
} from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Svg from "react-native-svg";

import { queryClient } from "@/api/query";
import { encryptCard } from "../encryptCard";
import { WayScreen } from "../WayScreen";
import * as ways from "../ways";

/*
 * A card payment that gets no answer is sent again as the SAME request (WALLET-25 fix round 1, F1). The card is scrambled with a random
 * padding, so scrambling it again for the retry makes a different body under the same Idempotency-Key, and the Hub refuses that
 * (409 idempotency_key_reused) while the first charge may have gone through. So the card is scrambled once per attempt and the whole
 * request is kept with its key; every retry sends those bytes, and a 409 key_reused never takes a new key by itself.
 */
jest.mock("../ways", () => ({
  ...jest.requireActual("../ways"),
  fetchOptions: jest.fn(),
  fetchQuote: jest.fn(),
  startAddMoney: jest.fn(),
}));
let scrambles = 0;
jest.mock("../encryptCard", () => ({
  encryptCard: jest.fn(
    async () => `SCRAMBLED-${(scrambles += 1)}-${"A".repeat(330)}`,
  ),
  appCryptoParts: jest.fn(async () => ({})),
}));
jest.mock("@/features/open-wallet/entry", () => ({
  useOpenWalletEntry: () => ({ open: jest.fn() }),
  OPEN_WALLET_PIN_PATH: "/open-wallet-pin",
}));
jest.mock("@/features/open-wallet/sessionAccount", () => ({
  useSessionAccount: () => "owner-1",
}));
jest.mock("@/features/device-approval", () => ({
  ...jest.requireActual("@/features/device-approval"),
  useApprovalKind: () => null,
}));
jest.mock("expo-crypto", () =>
  require("@/features/device-approval/testing/expoCrypto"),
);
const mockVault = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (k: string) => mockVault.get(k) ?? null),
  setItemAsync: jest.fn(
    async (k: string, v: string) => void mockVault.set(k, v),
  ),
  deleteItemAsync: jest.fn(async (k: string) => void mockVault.delete(k)),
}));

void [Modal, Svg];
configure({ asyncUtilTimeout: 10_000 });
jest.setTimeout(60_000);
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
const render = (ui: ReactElement) =>
  plainRender(
    <SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>,
  );
const mocked = jest.mocked(ways);
const encrypt = jest.mocked(encryptCard);

const rail = (r: ways.AddMoneyRail) => ({
  rail: r,
  available: true,
  reason: null,
  hosted: false,
});
const QUOTE: ways.AddMoneyQuote = {
  rail: "card",
  currency: "NGN",
  amountKobo: 1_000_000,
  providerFeeKobo: 75,
  wawuFeeKobo: 0,
  feeKobo: 75,
  chargeKobo: 1_000_075,
};
const attempt = (
  over: Partial<ways.AddMoneyAttempt> = {},
): ways.AddMoneyAttempt => ({
  id: "3f1c5b1e-0d6a-4b9e-9d57-2f6f3c1d9a10",
  rail: "card",
  status: "processing",
  currency: "NGN",
  amountKobo: 1_000_000,
  chargeKobo: 1_000_075,
  providerFeeKobo: 75,
  wawuFeeKobo: 0,
  checkoutUrl: null,
  message:
    "Paid. Your wallet is being topped up. This can take a little while.",
  failureMessage: null,
  cardLast4: "1111",
  cardBrand: "visa",
  expiresAt: null,
  createdAt: "2026-10-24T12:00:00.000Z",
  creditedAt: null,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  scrambles = 0;
  mockVault.clear();
  queryClient.clear();
  jest.useFakeTimers({
    now: new Date("2026-10-24T12:00:00Z"),
    doNotFake: ["nextTick", "queueMicrotask"],
  });
  mocked.fetchOptions.mockResolvedValue({
    currency: "NGN",
    rails: [rail("card")],
    cardPublicKey: "-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----",
    limits: { minKobo: null, maxKobo: null, dailyMaxKobo: null },
  });
  mocked.fetchQuote.mockResolvedValue(QUOTE);
});
afterEach(() => jest.useRealTimers());

const press = () =>
  userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
/** Lets promises settle and moves the sheet's own timers on (it slides in). */
const flush = () =>
  act(async () => {
    jest.advanceTimersByTime(1000);
  });
async function enterPin(user: ReturnType<typeof press>, pin: string) {
  for (const d of pin)
    await user.press(screen.getByRole("button", { name: d }));
}

async function openAndFill(
  user: ReturnType<typeof press>,
  onStarted = jest.fn(),
) {
  await render(
    <WayScreen
      rail="card"
      onBack={jest.fn()}
      onStarted={onStarted}
      onForgotPin={jest.fn()}
      onSetPin={jest.fn()}
    />,
  );
  const type = async (id: string, text: string) =>
    user.type(await screen.findByTestId(`add-money-way-${id}`), text);
  await type("amount", "10000");
  await screen.findByTestId("add-money-way-quote");
  await type("number", "4111111111111111");
  await type("expiry", "1230");
  await type("cvv", "123");
  await type("name", "Ada Lovelace");
  await type("address", "1 Test Street");
  await type("city", "Lagos");
  await type("state", "Lagos");
  return onStarted;
}

describe("a card payment that gets no answer is sent again as the same request", () => {
  it("scrambles the card once and sends the same key and the same bytes on the retry (the Hub then answers with the first payment)", async () => {
    const user = press();
    const onStarted = await openAndFill(user);
    mocked.startAddMoney
      .mockResolvedValueOnce({ kind: "unanswered" })
      .mockResolvedValueOnce({ kind: "done", attempt: attempt() });

    await user.press(screen.getByTestId("add-money-way-pay"));
    await flush();
    await enterPin(user, "4826");
    await flush();
    expect(mocked.startAddMoney).toHaveBeenCalledTimes(1);

    // The sheet is back on its keypad after an unanswered try: the same PIN, the retry.
    await enterPin(user, "4826");
    await flush();
    expect(mocked.startAddMoney).toHaveBeenCalledTimes(2);

    const [first, second] = mocked.startAddMoney.mock.calls.map(
      ([input]) => input,
    );
    expect(second.key).toBe(first.key);
    expect(second.card).toEqual(first.card);
    expect(second.chargeKobo).toBe(first.chargeKobo);
    expect(second.amountKobo).toBe(first.amountKobo);
    expect(encrypt).toHaveBeenCalledTimes(1);
    expect(onStarted).toHaveBeenCalledWith(
      expect.objectContaining({ id: attempt().id }),
    );
  });

  it("a 409 idempotency_key_reused never takes a new key by itself: the request stays, the words are plain, and the person starts again knowingly", async () => {
    const user = press();
    await openAndFill(user);
    mocked.startAddMoney.mockResolvedValue({
      kind: "refused",
      code: "idempotency_key_reused",
      message:
        "This key was already used for a different payment. Start again to pay.",
    });
    await user.press(screen.getByTestId("add-money-way-pay"));
    await flush();
    await enterPin(user, "4826");
    await flush();
    expect(await screen.findByTestId("add-money-way-sent")).toBeTruthy();
    expect(
      screen.getAllByText(/may already have gone through/).length,
    ).toBeGreaterThan(0);

    // Paying again sends the very same request (no new key, no new scramble).
    await user.press(screen.getByTestId("add-money-way-pay"));
    await flush();
    await enterPin(user, "4826");
    await flush();
    const [a, b] = mocked.startAddMoney.mock.calls.map(([input]) => input);
    expect(b.key).toBe(a.key);
    expect(b.card).toEqual(a.card);
    expect(encrypt).toHaveBeenCalledTimes(1);

    // Only the person's own "Start a new payment" lets go of it: a new key and a new scramble.
    await user.press(screen.getByTestId("add-money-way-new"));
    await flush();
    expect(screen.queryByTestId("add-money-way-sent")).toBeNull();
    expect(screen.getByTestId("add-money-way-amount")).toBeTruthy();
  });
});
