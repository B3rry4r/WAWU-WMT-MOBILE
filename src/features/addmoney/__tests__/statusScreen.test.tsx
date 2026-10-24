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
import { StatusScreen } from "../StatusScreen";
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
  queryClient.clear();
  mocked.fetchOptions.mockResolvedValue(OPTIONS);
  mocked.fetchQuote.mockResolvedValue(QUOTE);
});

describe("the status of an attempt", () => {
  const show = (
    over: Partial<ways.AddMoneyAttempt>,
    handlers: Partial<Parameters<typeof StatusScreen>[0]> = {},
  ) => {
    mocked.fetchAttempt.mockResolvedValue(attempt(over));
    return render(
      <StatusScreen
        id={attempt().id}
        onBack={jest.fn()}
        onDone={jest.fn()}
        onTryAgain={jest.fn()}
        onOpenPage={jest.fn()}
        pollMs={60_000}
        {...handlers}
      />,
    );
  };

  it("paid and being added: says so, shows the sums, and offers no cancel", async () => {
    await show({});
    expect(
      await screen.findByText("Paid. Adding it to your wallet."),
    ).toBeTruthy();
    expect(screen.getByText("₦10,000.75")).toBeTruthy();
    expect(screen.queryByTestId("add-money-status-cancel")).toBeNull();
  });

  it("in the wallet: the amount that was added and Done", async () => {
    const onDone = jest.fn();
    await show(
      {
        status: "settled",
        message: "The money is in your wallet.",
        creditedAt: "2026-10-24T12:05:00.000Z",
      },
      { onDone },
    );
    expect(await screen.findByText("₦10,000 added")).toBeTruthy();
    fireEvent.press(screen.getByText("Done"));
    expect(onDone).toHaveBeenCalled();
  });

  it("ended without the money: the Hub's reason, and Try again opens that way again", async () => {
    const onTryAgain = jest.fn();
    await show(
      {
        status: "failed",
        failureMessage:
          "Your card was declined. Nothing was added to your wallet.",
      },
      { onTryAgain },
    );
    expect(
      await screen.findByText(
        "Your card was declined. Nothing was added to your wallet.",
      ),
    ).toBeTruthy();
    fireEvent.press(screen.getByText("Try again"));
    expect(onTryAgain).toHaveBeenCalledWith("card");
  });

  it("waiting for the person: the page can be opened again and the payment given up on", async () => {
    mocked.cancelAttempt.mockResolvedValue(
      attempt({
        status: "cancelled",
        message:
          "You cancelled this payment. Nothing was added to your wallet.",
      }),
    );
    const onOpenPage = jest.fn();
    await show(
      {
        status: "awaiting_user",
        checkoutUrl: "https://app.nuvion.test/sessions/abc",
        message: "Finish the payment on the page that opened.",
      },
      { onOpenPage },
    );
    fireEvent.press(await screen.findByTestId("add-money-status-open-page"));
    expect(onOpenPage).toHaveBeenCalledWith(
      "https://app.nuvion.test/sessions/abc",
    );
    fireEvent.press(screen.getByTestId("add-money-status-cancel"));
    expect(await screen.findByText("Payment cancelled")).toBeTruthy();
    expect(mocked.cancelAttempt).toHaveBeenCalledTimes(1);
  });
});
