import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { isApiError } from "@/api/errors";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyValueRow } from "@/components/ListRow";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/StateViews";
import { Text } from "@/components/Text";
import { space } from "@/theme";

import { corridorsQuery, sourcesQuery } from "@/features/abroad/api";

import { ChoiceSheet } from "@/features/open-wallet/ChoiceField";

import {
  fetchAddable,
  fetchWorldAccounts,
  formatMinor,
  openAccountIn,
  WORLD_ACCOUNTS_KEY,
  type WorldAccount,
} from "./api";

/**
 * WALLET-41 (R-87): the Wallet tab of a person who opened from outside Nigeria. They have no naira account, so the
 * naira balance card, Send and Add money are not drawn (R-47). What they have is their foreign accounts: each with the
 * bank's own balance and the details payers use, and one more can be added in any currency that is on. No board draws
 * this tab for them (R-29); it is built from the app's own parts. Swaps and sends between these accounts follow with the
 * dollar and crypto screens (WALLET-21).
 */
export function WorldHome({ owner }: { owner: string }) {
  const client = useQueryClient();
  const accounts = useQuery({
    queryKey: [...WORLD_ACCOUNTS_KEY, owner],
    queryFn: fetchWorldAccounts,
    staleTime: 0,
  });
  const addable = useQuery({
    queryKey: ["money", "world-addable", owner],
    queryFn: fetchAddable,
    staleTime: 0,
  });
  // Send abroad (NUV-11, WALLET-42): offered on an account only while the Hub says sending abroad is on and lists an account to
  // send from in that currency (R-47: nothing is drawn that does not work).
  const corridors = useQuery(corridorsQuery(owner));
  const sources = useQuery({
    ...sourcesQuery(owner),
    enabled: corridors.data?.enabled === true,
  });
  const sendable = new Set((sources.data ?? []).map((s) => s.currency));
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const held = new Set((accounts.data ?? []).map((a) => a.currency));
  const more = (addable.data ?? []).filter((c) => !held.has(c.code));

  const add = async (code: string) => {
    setPicking(false);
    setBusy(true);
    setProblem(null);
    try {
      await openAccountIn(code);
      await client.invalidateQueries({ queryKey: ["money"] });
    } catch (error) {
      setProblem(
        isApiError(error)
          ? error.message
          : "We could not open that account. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (accounts.isError && accounts.data === undefined) {
    return (
      <ErrorState
        title="We couldn't load your accounts"
        message={
          isApiError(accounts.error)
            ? accounts.error.message
            : "Something went wrong. Try again."
        }
        onRetry={() => void accounts.refetch()}
      />
    );
  }
  if (accounts.data === undefined) {
    return (
      <View style={styles.body} testID="wallet-world-loading">
        <Skeleton height={96} />
        <Skeleton height={96} />
      </View>
    );
  }
  return (
    <View style={styles.body} testID="wallet-world">
      <Text variant="h2">Your accounts</Text>
      {problem ? (
        <Banner
          tone="danger"
          title="We could not open that account"
          body={problem}
          testID="wallet-world-problem"
        />
      ) : null}
      {accounts.data.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          canSendAbroad={
            account.status === "open" && sendable.has(account.currency)
          }
        />
      ))}
      {more.length > 0 ? (
        <Button
          label="Add a currency"
          variant="secondary"
          full
          loading={busy}
          onPress={() => setPicking(true)}
          testID="wallet-world-add"
        />
      ) : null}
      <ChoiceSheet
        visible={picking}
        onClose={() => setPicking(false)}
        title="Add a currency"
        options={more.map((c) => ({ value: c.code, label: c.name }))}
        selected={null}
        onPick={(code) => void add(code)}
        testID="wallet-world-add"
      />
    </View>
  );
}

function AccountCard({
  account,
  canSendAbroad,
}: {
  account: WorldAccount;
  canSendAbroad: boolean;
}) {
  const router = useRouter();
  const balance =
    account.availableMinor === null
      ? "Balance unavailable"
      : formatMinor(account.availableMinor, account.currency, account.decimals);
  return (
    <Card style={styles.card} testID={`wallet-world-${account.currency}`}>
      <View style={styles.head}>
        <Text variant="body" style={styles.code}>
          {account.currency}
        </Text>
        {account.status === "frozen" ? (
          <Text variant="secondary">Frozen</Text>
        ) : account.status === "opening" ? (
          <Text variant="secondary">Opening</Text>
        ) : null}
      </View>
      <Text variant="h1" testID={`wallet-world-${account.currency}-balance`}>
        {balance}
      </Text>
      {account.details ? (
        account.details.status === "pending" ||
        account.details.lines.length === 0 ? (
          <Text
            variant="secondary"
            testID={`wallet-world-${account.currency}-pending`}
          >
            Your account details are on their way.
          </Text>
        ) : (
          <View testID={`wallet-world-${account.currency}-details`}>
            {account.details.lines.map((line) => (
              <KeyValueRow
                key={line.label}
                label={line.label}
                value={line.value}
              />
            ))}
          </View>
        )
      ) : null}
      {canSendAbroad ? (
        <Button
          label="Send abroad"
          variant="secondary"
          full
          onPress={() =>
            router.push({
              pathname: "/send/abroad",
              params: { from: account.currency },
            })
          }
          testID={`wallet-world-${account.currency}-send-abroad`}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  card: { gap: space.md, padding: space.lg },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  code: { fontWeight: "700" },
});
