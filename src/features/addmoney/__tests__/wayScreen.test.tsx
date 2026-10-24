/* eslint-disable @typescript-eslint/no-require-imports */
import {
  configure,
  fireEvent,
  render as plainRender,
  screen,
} from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Modal } from "react-native";
import Svg from "react-native-svg";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/api/query";
import { WayScreen } from "../WayScreen";
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

describe("a card payment screen", () => {
  const noop = jest.fn();
  const open = () =>
    render(
      <WayScreen
        rail="card"
        onBack={noop}
        onStarted={noop}
        onForgotPin={noop}
        onSetPin={noop}
      />,
    );

  it("shows the Hub's quote for an amount (the charge, what is paid, what the wallet gets) and the pay button names the total", async () => {
    await open();
    fireEvent.changeText(
      await screen.findByTestId("add-money-way-amount"),
      "10,000",
    );
    expect(await screen.findByTestId("add-money-way-quote")).toBeTruthy();
    expect(mocked.fetchQuote).toHaveBeenCalledWith("card", 1_000_000);
    expect(screen.getByTestId("add-money-way-quote-provider")).toBeTruthy();
    expect(screen.queryByTestId("add-money-way-quote-wawu")).toBeNull();
    expect(screen.getByText("Pay ₦10,000.75")).toBeTruthy();
  });

  it("a way the Hub says cannot be used shows its reason and no form", async () => {
    mocked.fetchOptions.mockResolvedValue({
      ...OPTIONS,
      rails: [
        rail(
          "card",
          false,
          "This is not switched on for naira yet. It shows here as soon as it is.",
        ),
      ],
    });
    await open();
    expect(await screen.findByTestId("add-money-way-unavailable")).toBeTruthy();
    expect(
      screen.getByText(
        "This is not switched on for naira yet. It shows here as soon as it is.",
      ),
    ).toBeTruthy();
    expect(screen.queryByTestId("add-money-way-amount")).toBeNull();
  });

  it("a card with a fault says what is wrong and does not open the PIN sheet", async () => {
    await open();
    fireEvent.changeText(
      await screen.findByTestId("add-money-way-amount"),
      "10000",
    );
    await screen.findByTestId("add-money-way-quote");
    fireEvent.changeText(
      screen.getByTestId("add-money-way-number"),
      "4111 1111 1111 1112",
    );
    fireEvent.press(screen.getByTestId("add-money-way-pay"));
    expect(await screen.findByText("Check the card number.")).toBeTruthy();
    expect(screen.queryByText(/Approve ₦/)).toBeNull();
    expect(mocked.startAddMoney).not.toHaveBeenCalled();
  });
});
