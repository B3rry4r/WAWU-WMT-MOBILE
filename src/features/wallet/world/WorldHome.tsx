import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { isApiError } from "@/api/errors";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PoweredByNuvion } from "@/components/PoweredByNuvion";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { space } from "@/theme";

import { corridorsQuery, sourcesQuery } from "@/features/abroad/api";

import { ChoiceSheet } from "@/features/open-wallet/ChoiceField";

import { chainName, SHORT_NAME, WORD, type FxChain, type FxCode, type QuoteCode } from "../fx/amount";
import { accountsQuery, currenciesQuery } from "../fx/api";
import { CurrencyNote } from "../fx/CurrencyNote";
import { FxBalanceCard } from "../fx/FxBalanceCard";
import { FxDetailsSheet } from "../fx/FxDetailsSheet";
import { ActionPill, CryptoSection, PaidFromAbroad, Transactions } from "../fx/FxTabBody";
import { addOptions, isCoinCode, maskedNumber } from "../fx/model";

import {
  fetchAddable,
  fetchWorldAccounts,
  openAccountIn,
  WORLD_ACCOUNTS_KEY,
  type WorldAccount,
} from "./api";

/**
 * WALLET-41 (R-87), reworked by R2-MONEY D-01: the Wallet tab of a person who opened from outside Nigeria. They have no naira account, so
 * the naira balance card, Send and Add money are not drawn (R-47). What they have is their foreign accounts, and each one is drawn as the
 * naira wallet home draws its account: the balance card with the bank's own figure (the provider's balance as the Hub serves it, never
 * added up here), the controls built for them under it (Send abroad, Swap between their own accounts, Get paid from abroad with the details
 * payers use), and that account's activity. One more account can be added in any currency that is on. No board draws this tab for them
 * (R-29); it is built from W1's and W2's own parts. Nothing here is naira.
 */
export function WorldHome({ owner, adding = null }: { owner: string; adding?: string | null }) {
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
  // The Hub's switches: Swap is offered only while it is on (a failed read draws no Swap, R-47).
  const currencies = useQuery(currenciesQuery(owner));
  // The coins they hold, drawn as the naira wallet's Crypto tab draws them (R-87): the same accounts the Hub lists, read as the fx home reads them.
  const fxAccounts = useQuery(accountsQuery(owner));
  const router = useRouter();
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
  const [hidden, setHidden] = useState(false);

  const held = new Set((accounts.data ?? []).map((a) => a.currency));
  const more = (addable.data ?? []).filter((c) => !held.has(c.code));
  // The coins the Hub says can be opened (its own list, never one of ours), offered beside the currencies; a coin leads to W22, which picks its network.
  const coins = addOptions(currencies.data ?? null, held).filter((o) => o.coin);
  const options = [...more.map((c) => ({ value: c.code, label: c.name })), ...coins.map((o) => ({ value: o.value as string, label: o.label }))];
  const fiat = (accounts.data ?? []).filter((a) => !isCoinCode(a.currency));
  const open = (accounts.data ?? []).filter((a) => a.status === "open");
  // History stays readable on a frozen account: its movements show even when no account is open (an account still opening has none).
  const withHistory = (accounts.data ?? []).filter(
    (a) => a.status === "open" || a.status === "frozen",
  );
  // A swap needs a side to move money to as well as from: two open accounts of their own.
  const swaps = currencies.data?.products.swap === true && open.length > 1;

  const refresh = () => client.invalidateQueries({ queryKey: ["money"] });
  // Sent here to add one currency ("Add a dollar account" on /tiers): the add-a-currency sheet is open on arrival when the Hub lists
  // that currency as one that can still be added, until the person closes it or picks one. A currency already held, or one that is off,
  // opens nothing.
  const [dismissed, setDismissed] = useState(false);
  const canAdd = adding !== null && accounts.data !== undefined && addable.data !== undefined && more.some((c) => c.code === adding);
  const sheetOpen = picking || (canAdd && !dismissed);
  const closeSheet = () => {
    setPicking(false);
    setDismissed(true);
  };

  const add = async (code: string) => {
    closeSheet();
    if (coins.some((o) => o.value === code)) {
      router.push({ pathname: "/crypto-receive", params: { coin: code } });
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await openAccountIn(code);
      await refresh();
    } catch (error) {
      setProblem(
        // A provider's refusal carries the provider's words: never drawn (M-02).
        isApiError(error) && error.code !== "provider_declined"
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
  // "Powered by Nuvion" (R-95) once on the screen: under the first account whose card is drawn (an opening one has no card).
  const lineOn = fiat.find((account) => account.status !== "opening")?.id;
  if (accounts.data === undefined) {
    return (
      <View style={styles.body} testID="wallet-world-loading">
        <Skeleton height={220} radius={28} />
        <Skeleton height={54} />
      </View>
    );
  }
  return (
    <View style={styles.body} testID="wallet-world">
      <CurrencyNote
        owner={owner}
        first={1}
        adder={{
          available: options.length > 0,
          options: [...more.map((c) => ({ value: c.code as FxCode, label: c.name, coin: false })), ...coins],
          accounts: fxAccounts.data ?? null,
          // This screen has its own picker, whose button shows a spinner while the account is opening and takes no second tap.
          opening: new Set<FxCode>(),
          show: () => setPicking(true),
          sheet: null,
          notice: null,
        }}
      />
      {problem ? (
        <Banner
          tone="danger"
          title="We could not open that account"
          body={problem}
          testID="wallet-world-problem"
        />
      ) : null}
      {fiat.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          poweredBy={account.id === lineOn}
          hidden={hidden}
          onToggleHidden={() => setHidden((was) => !was)}
          onRetry={() => void refresh()}
          canSendAbroad={
            account.status === "open" && sendable.has(account.currency)
          }
          canSwap={swaps && account.status === "open"}
        />
      ))}
      <CryptoSection currencies={currencies.data ?? null} accounts={fxAccounts.data ?? null} hidden={hidden} toNaira={false} />
      {withHistory.length > 0 ? (
        <Transactions
          owner={owner}
          accounts={withHistory}
          currencies={currencies.data ?? null}
          allAccounts={accounts.data}
          noun="account"
        />
      ) : null}
      {options.length > 0 ? (
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
        visible={sheetOpen}
        onClose={closeSheet}
        title="Add a currency"
        options={options}
        selected={null}
        onPick={(code) => void add(code)}
        testID="wallet-world-add"
      />
    </View>
  );
}

/** The number a payer needs most, for the card's masked line and its Copy: an account number, else an IBAN. */
function primaryOf(account: WorldAccount): string | null {
  const d = account.rawDetails;
  if (!d || d.status !== "active") return null;
  return d.accountNumber?.trim() || d.iban?.trim() || null;
}

export function AccountCard({
  account,
  canSendAbroad,
  canSwap,
  hidden = false,
  onToggleHidden = () => undefined,
  onRetry = () => undefined,
  poweredBy = false,
}: {
  account: WorldAccount;
  canSendAbroad?: boolean;
  canSwap?: boolean;
  hidden?: boolean;
  onToggleHidden?: () => void;
  onRetry?: () => void;
  /** "Powered by Nuvion" under the card (R-95): the Wallet draws it on one account, not on every one. */
  poweredBy?: boolean;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState(false);
  const code = account.currency as QuoteCode;
  const name = SHORT_NAME[code] ?? account.currency;
  const number = primaryOf(account);
  const chain = (account.chain ?? null) as FxChain | null;
  if (account.status === "opening") {
    return (
      <Card
        padded
        style={styles.card}
        testID={`wallet-world-${account.currency}`}
      >
        <EmptyState
          testID={`wallet-world-${account.currency}-opening`}
          icon="Clock"
          title={`Your ${WORD[code] ?? account.currency} account is opening`}
          message="It takes a short while. Check again in a moment."
          action={{ label: "Check again", onPress: onRetry }}
        />
      </Card>
    );
  }
  const frozen = account.status === "frozen";
  return (
    <View style={styles.account} testID={`wallet-world-${account.currency}`}>
      <View>
        <FxBalanceCard
          label={`${name} balance`}
          availableMinor={account.availableMinor}
          code={code}
          decimals={account.decimals}
          hidden={hidden}
          onToggleHidden={onToggleHidden}
          line={
            chain
              ? `${account.currency} · ${chainName(chain)}`
              : `${account.currency} account`
          }
          maskedNumber={number ? maskedNumber(number) : null}
          copyValue={number}
          detailsStatus={account.detailsStatus}
          detailsNote={account.detailsNote}
          onRetry={onRetry}
          testID={`wallet-world-${account.currency}-card`}
        />
        {poweredBy ? <PoweredByNuvion style={styles.powered} /> : null}
      </View>
      {frozen ? (
        <Banner
          tone="warning"
          title="This account is frozen"
          body="Money can arrive, but it cannot be swapped or sent until it is opened again."
          testID={`wallet-world-${account.currency}-frozen`}
        />
      ) : null}
      {canSendAbroad || canSwap ? (
        <View style={styles.actions}>
          {canSendAbroad ? (
            <ActionPill
              testID={`wallet-world-${account.currency}-send-abroad`}
              icon="ArrowUpRight"
              label="Send abroad"
              onPress={() =>
                router.push({
                  pathname: "/send/abroad",
                  params: { from: account.currency },
                })
              }
            />
          ) : null}
          {canSwap ? (
            <ActionPill
              testID={`wallet-world-${account.currency}-swap`}
              icon="ArrowLeftRight"
              label="Swap"
              onPress={() =>
                router.push({
                  pathname: "/swap",
                  params: { from: account.currency },
                })
              }
            />
          ) : null}
        </View>
      ) : null}
      {account.rawDetails?.status === "active" && number ? (
        <PaidFromAbroad
          code={account.currency as FxCode}
          name={name}
          onPress={() => setSheet(true)}
        />
      ) : null}
      <FxDetailsSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        account={{
          currency: account.currency as FxCode,
          details: account.rawDetails,
        }}
        name={name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  account: { gap: space.lg },
  // Under the balance card, close to it, so it reads as that card's own line.
  powered: { marginTop: space.sm },
  // The padding comes from `padded` on the Card: a `padding` here loses to the Card's own `paddingVertical`.
  card: { gap: space.md },
  actions: { flexDirection: "row", gap: space.sm, alignItems: "center" },
});
