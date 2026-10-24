import * as rtl from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { space } from "@/theme";

import { AccountCard } from "../world/WorldHome";

/*
 * WALLET-41 low (SWEEP-MONEY-6): the currency code of an account on a world person's Wallet tab sat against the card's top edge. The
 * Card's `rows` look gives it `paddingVertical`, which beats a `padding` given in the card's style, so only `padded` gives all four
 * sides the same room.
 */
const account = {
  id: "a1",
  currency: "GBP",
  status: "open" as const,
  decimals: 2,
  availableMinor: 12_000,
  details: null,
};

describe("an account card on the world Wallet tab", () => {
  it("has the same room on every side, so the currency code is not against the top edge", async () => {
    await rtl.render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <AccountCard account={account} />
      </SafeAreaProvider>,
    );
    const card = StyleSheet.flatten(
      rtl.screen.getByTestId("wallet-world-GBP").props.style,
    ) as Record<string, unknown>;
    expect(card.padding).toBe(space.lg);
    expect(card.paddingVertical).toBeUndefined();
    expect(card.paddingTop).toBeUndefined();
    expect(rtl.screen.getByText("GBP")).toBeTruthy();
  });
});
