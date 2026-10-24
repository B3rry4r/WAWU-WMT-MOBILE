import { GroupedList } from "@/components/Card";
import { IconTile } from "@/components/IconTile";
import { ListRow } from "@/components/ListRow";

import { WORDS } from "./model";

/**
 * The one row on the Wallet tab that leads to Capital (NUV-12, R-84), under the Points and Passes cards. No board draws it (R-29,
 * BACKEND_GAPS G-NUV-12-1): it is a wallet row. It is drawn when the Hub says Capital is on and the wallet provider serves it, or the person holds
 * something (`GET /capital/availability`: `available`, `holding`), so a switched-off Capital leaves no entry for a person who has nothing
 * in it (R-47) and keeps the way out for one who has.
 */
export function CapitalWalletRow({ onPress }: { onPress: () => void }) {
  return (
    <GroupedList testID="wallet-capital-card">
      <ListRow
        testID="wallet-capital"
        lead={<IconTile icon="TrendingUp" tone="accent" size={44} />}
        title={WORDS.rowTitle}
        subtitle={WORDS.rowLine}
        onPress={onPress}
      />
    </GroupedList>
  );
}
