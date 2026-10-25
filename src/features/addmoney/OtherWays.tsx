import { useQuery } from "@tanstack/react-query";
import { Platform, View } from "react-native";

import { queryClient } from "@/api/query";

import { GroupedList } from "@/components/Card";
import { IconTile } from "@/components/IconTile";
import { ListRow } from "@/components/ListRow";
import { Text } from "@/components/Text";
import { space } from "@/theme";

import { RAIL_TITLE, railLine } from "./cardModel";
import { fetchOptions, type AddMoneyRail, type AddMoneyRailView } from "./ways";

export const optionsQuery = {
  queryKey: ["money", "add-money", "options"] as const,
  queryFn: fetchOptions,
  staleTime: 60_000,
};

const ICON: Record<AddMoneyRail, "CreditCard" | "Smartphone" | "Landmark"> = {
  card: "CreditCard",
  apple_pay: "CreditCard",
  ussd: "Smartphone",
  open_banking: "Landmark",
};

/**
 * The ways the screen draws (R2-MONEY D-04): only a way the Hub lists as available for this account's currency, so no row answers
 * "not available yet" and opens nothing (R-47). Apple Pay only on an iPhone (Nuvion takes it through a page that needs Safari's wallet).
 */
export function waysToDraw(
  rails: readonly AddMoneyRailView[],
  os: string = Platform.OS,
): AddMoneyRailView[] {
  return rails.filter(
    (r) => r.available && (r.rail !== "apple_pay" || os === "ios"),
  );
}

export type OtherWaysProps = { onOpen: (rail: AddMoneyRail) => void };

/**
 * W15's "other ways to add money" (WALLET-25 card and Apple Pay, WALLET-26 USSD and the bank checkout, R-84). No board draws this
 * list since the 16 Oct board (R-42), so it is built from W15's own parts, a card of rows, and filed for the designer (R-29). A way is a
 * row the person can open; a way the Hub says cannot be used now is not drawn at all (no do-nothing rows, R-47, R2-MONEY D-04). Nothing
 * is drawn while the Hub has not answered, or when it answered with no way that can be used.
 */
export function OtherWays({ onOpen }: OtherWaysProps) {
  const options = useQuery(optionsQuery, queryClient);
  const rails = options.data ? waysToDraw(options.data.rails) : [];
  if (rails.length === 0) return null;
  return (
    <View testID="add-money-other-ways" style={{ gap: space.sm }}>
      <Text variant="label" style={{ paddingHorizontal: space.xs }}>
        Other ways to add money
      </Text>
      <GroupedList>
        {rails.map((r) => (
          <ListRow
            key={r.rail}
            testID={`add-money-way-${r.rail}`}
            lead={<IconTile icon={ICON[r.rail]} tone="accent" />}
            title={RAIL_TITLE[r.rail]}
            subtitle={railLine(r.rail, null)}
            subtitleLines={2}
            onPress={() => onOpen(r.rail)}
          />
        ))}
      </GroupedList>
    </View>
  );
}
