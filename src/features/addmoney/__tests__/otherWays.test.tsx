/* eslint-disable @typescript-eslint/no-require-imports */
import {
  configure,
  fireEvent,
  render as plainRender,
  screen,
  waitFor,
} from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Modal } from "react-native";
import Svg from "react-native-svg";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/api/query";
import { OtherWays, waysToDraw } from "../OtherWays";
import * as ways from "../ways";

/*
 * The other ways to add money (WALLET-25 card and Apple Pay, WALLET-26 USSD and the bank checkout, R-84): the list on W15, the way's own
 * screen, and the status screen, each against the Hub's answers in the shapes the contract gives (the calls are replaced, the screens are
 * real). Card encryption has its own test (encryptCard.test.ts), so here it is replaced by a fixed text.
 */
jest.mock("../ways", () => ({
  ...jest.requireActual("../ways"),
  fetchOptions: jest.fn(),
  fetchQuote: jest.fn(),
  fetchAttempt: jest.fn(),
  cancelAttempt: jest.fn(),
  startAddMoney: jest.fn(),
}));
jest.mock("../encryptCard", () => ({
  encryptCard: jest.fn(async () => "SCRAMBLED"),
  appCryptoParts: jest.fn(async () => ({})),
}));
jest.mock("@/features/open-wallet/entry", () => ({
  useOpenWalletEntry: () => ({ open: jest.fn() }),
  OPEN_WALLET_PIN_PATH: "/open-wallet-pin",
}));
jest.mock("@/features/device-approval", () => ({
  ...jest.requireActual("@/features/device-approval"),
  useApprovalKind: () => null,
}));
jest.mock("expo-crypto", () =>
  require("@/features/device-approval/testing/expoCrypto"),
);

/*
 * Package imports are loaded on first use, so the first render of a screen with the PIN sheet pays for React Native's Modal and
 * react-native-svg (seconds with a cold cache). Touching them here moves that one-off cost to file load, where no timeout applies,
 * and the waits below allow for a slow machine (the same rule as PinSheet.test.tsx).
 */
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
const rail = (
  r: ways.AddMoneyRail,
  available = true,
  reason: string | null = null,
) => ({
  rail: r,
  available,
  reason,
  hosted: r === "apple_pay" || r === "open_banking",
});
const OPTIONS: ways.AddMoneyOptions = {
  currency: "NGN",
  rails: [
    rail("card"),
    rail("apple_pay"),
    rail(
      "ussd",
      false,
      "USSD is not available for Nigerian phone numbers yet.",
    ),
    rail("open_banking", false, "This is not available yet."),
  ],
  cardPublicKey: "-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----",
  limits: { minKobo: null, maxKobo: null, dailyMaxKobo: null },
};
const QUOTE: ways.AddMoneyQuote = {
  rail: "card",
  currency: "NGN",
  amountKobo: 1_000_000,
  providerFeeKobo: 75,
  wawuFeeKobo: 0,
  feeKobo: 75,
  chargeKobo: 1_000_075,
};
beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  mocked.fetchOptions.mockResolvedValue(OPTIONS);
  mocked.fetchQuote.mockResolvedValue(QUOTE);
});

describe("W15: the other ways to add money", () => {
  it("draws each way the Hub lists: one that can be used opens its screen, one that cannot says why in the Hub's words and opens nothing", async () => {
    const onOpen = jest.fn();
    await render(<OtherWays onOpen={onOpen} />);
    expect(await screen.findByTestId("add-money-way-card")).toBeTruthy();
    expect(screen.getByText("Debit card")).toBeTruthy();
    expect(
      screen.getByText("USSD is not available for Nigerian phone numbers yet."),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId("add-money-way-card"));
    expect(onOpen).toHaveBeenCalledWith("card");
    fireEvent.press(screen.getByTestId("add-money-way-ussd"));
    fireEvent.press(screen.getByTestId("add-money-way-open_banking"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("draws nothing while the Hub has not answered, when it names no way, and Apple Pay only on an iPhone", async () => {
    mocked.fetchOptions.mockRejectedValue(new Error("offline"));
    const a = await render(<OtherWays onOpen={jest.fn()} />);
    await waitFor(() => expect(mocked.fetchOptions).toHaveBeenCalled());
    expect(screen.queryByTestId("add-money-other-ways")).toBeNull();
    a.unmount();
    expect(waysToDraw(OPTIONS.rails, "android").map((r) => r.rail)).toEqual([
      "card",
      "ussd",
      "open_banking",
    ]);
    expect(waysToDraw(OPTIONS.rails, "ios").map((r) => r.rail)).toContain(
      "apple_pay",
    );
  });
});
