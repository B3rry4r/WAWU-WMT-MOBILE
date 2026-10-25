import * as rtl from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ACCT } from "../home/BalanceCard";
import { AccountCard } from "../world/WorldHome";

/*
 * WALLET-41 low (SWEEP-MONEY-6): the currency code of an account on a world person's Wallet tab sat against the card's top edge.
 * R2-MONEY D-01 replaced that bare card with the balance card of the naira wallet home (the same ground, glow, eye and Copy), whose
 * padding gives every side the same room, so the first test now holds the new card to that, and the rest hold what it draws.
 */
const account = {
  id: "a1",
  currency: "GBP",
  status: "open" as const,
  decimals: 2,
  availableMinor: 12_000,
  details: null,
  rawDetails: null,
  detailsStatus: "pending" as const,
  detailsNote: null,
  chain: null,
};

const frame = (ui: React.ReactElement) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    {ui}
  </SafeAreaProvider>
);

describe("an account card on the world Wallet tab", () => {
  it("is the naira wallet's balance card, with the same room on every side and the bank's own figure", async () => {
    await rtl.render(frame(<AccountCard account={account} />));
    const card = StyleSheet.flatten(
      rtl.screen.getByTestId("wallet-world-GBP-card").props.style,
    ) as Record<string, unknown>;
    expect(card.padding).toBe(ACCT.pad);
    expect(card.paddingVertical).toBeUndefined();
    expect(rtl.screen.getByText("Pound balance")).toBeTruthy();
    expect(rtl.screen.getByTestId("fx-balance")).toBeTruthy();
  });

  it("says so, with a retry, when the bank could not be asked: never a 0 the Hub did not say", async () => {
    await rtl.render(
      frame(<AccountCard account={{ ...account, availableMinor: null }} />),
    );
    expect(rtl.screen.getByTestId("fx-balance-retry")).toBeTruthy();
    expect(rtl.screen.queryByTestId("fx-balance")).toBeNull();
  });

  it("draws no naira anywhere on a foreign account's card", async () => {
    await rtl.render(frame(<AccountCard account={account} />));
    expect(JSON.stringify(rtl.screen.toJSON())).not.toContain("₦");
  });
});
