import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { isApiError } from "@/api/errors";
import { queryClient } from "@/api/query";
import { Banner } from "@/components/Banner";
import { Card, GroupedList } from "@/components/Card";
import { formatMoney } from "@/components/Money";
import { ScreenFrame } from "@/components/ScreenFrame";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { LoadingView, Skeleton } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Text } from "@/components/Text";
import { useOpenWalletEntry } from "@/features/open-wallet/entry";
import { useSessionAccount } from "@/features/open-wallet/sessionAccount";
import { radius, space } from "@/theme";

import {
  availabilityQuery,
  ordersQuery,
  portfolioQuery,
  productsQuery,
  type CapitalOrder,
  type CapitalPortfolio,
  type CapitalProduct,
} from "./api";
import { WORDS } from "./model";
import { GAP, OrderRow, ProductRow } from "./parts";

export type CapitalScreenProps = {
  onBack: () => void;
  onProduct: (id: string) => void;
  onOrder: (id: string) => void;
};

type Tab = "invest" | "mine";

/**
 * Capital (NUV-12, R-84; no board, so built from the wallet's own parts, R-29): the portfolio at the top, then Invest (the products the
 * provider offers, with their terms) or Mine (what the person holds, and what has ended). The portfolio is the provider's own total,
 * never a sum of our rows; a return it cannot value yet is not drawn as zero. A person with no wallet is sent to open one.
 */
export function CapitalScreen({
  onBack,
  onProduct,
  onOrder,
}: CapitalScreenProps) {
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const [picked, setTab] = useState<Tab>("invest");
  // Switched off, Capital takes no new orders but a person who holds something still sees it and can take it out (NUV-12 round 1).
  const availability = useQuery({ ...availabilityQuery(owner) }, queryClient);
  const closed = availability.data?.available === false;
  const tab: Tab = closed ? "mine" : picked;
  const portfolio = useQuery({ ...portfolioQuery(owner) }, queryClient);
  const products = useQuery(
    { ...productsQuery(owner), enabled: Boolean(owner) && tab === "invest" },
    queryClient,
  );
  const holding = useQuery(
    {
      ...ordersQuery(owner, "holding"),
      enabled: Boolean(owner) && tab === "mine",
    },
    queryClient,
  );
  const ended = useQuery(
    {
      ...ordersQuery(owner, "ended"),
      enabled: Boolean(owner) && tab === "mine",
    },
    queryClient,
  );

  const failure =
    [portfolio.error, products.error, holding.error].find(
      (e) => e !== null && e !== undefined,
    ) ?? null;
  const code = isApiError(failure) ? failure.code : undefined;

  let body;
  if (code === "wallet_not_open" || code === "wallet_opening") {
    body = (
      <EmptyState
        testID="capital-no-wallet"
        icon="Wallet"
        title={WORDS.noWallet}
        message="Capital is paid for from your wallet."
        action={{ label: "Open your wallet", onPress: entry.open }}
      />
    );
  } else if (code === "capital_unavailable") {
    body = (
      <EmptyState
        testID="capital-off"
        icon="TrendingUp"
        title="Capital is not available right now"
        message="Check again later."
      />
    );
  } else if (failure) {
    body = (
      <ErrorState
        testID="capital-error"
        icon={
          isApiError(failure) && failure.kind === "network"
            ? "WifiOff"
            : "TriangleAlert"
        }
        title="We could not load Capital"
        message={
          isApiError(failure)
            ? failure.message
            : "Something went wrong. Try again."
        }
        onRetry={() => {
          void portfolio.refetch();
          void products.refetch();
          void holding.refetch();
          void ended.refetch();
        }}
      />
    );
  } else {
    body = (
      <>
        <PortfolioCard
          portfolio={portfolio.data ?? null}
          loading={portfolio.isPending}
        />
        {closed ? (
          <Banner
            testID="capital-closed"
            tone="info"
            title="New investments are closed right now"
            body="What you hold is below. You can still read it and withdraw it."
          />
        ) : (
          <SegmentedTabs
            label="Capital"
            value={tab}
            onChange={setTab}
            items={[
              { value: "invest", label: WORDS.invest },
              { value: "mine", label: WORDS.mine },
            ]}
            testID="capital-tabs"
          />
        )}
        {tab === "invest" ? (
          <ProductList
            items={products.data?.items ?? null}
            loading={products.isPending}
            onProduct={onProduct}
          />
        ) : (
          <MineList
            holding={holding.data?.items ?? null}
            ended={ended.data?.items ?? null}
            loading={holding.isPending || ended.isPending}
            onOrder={onOrder}
          />
        )}
        <Text variant="secondary" tone="textMuted" testID="capital-note">
          {WORDS.notAPromise}
        </Text>
      </>
    );
  }

  return (
    <ScreenFrame
      title={WORDS.title}
      onBack={onBack}
      gap={GAP}
      idPrefix="capital"
      testID="capital-screen"
    >
      {body}
    </ScreenFrame>
  );
}

function PortfolioCard({
  portfolio,
  loading,
}: {
  portfolio: CapitalPortfolio | null;
  loading: boolean;
}) {
  if (loading || !portfolio)
    return (
      <Skeleton
        testID="capital-portfolio-loading"
        height={104}
        radius={radius.card}
      />
    );
  return (
    <Card padded testID="capital-portfolio">
      <View style={styles.portfolio}>
        <Text variant="secondary" tone="textMuted">
          Invested
        </Text>
        <Text variant="title" testID="capital-invested">
          {formatMoney(portfolio.investedKobo)}
        </Text>
        {portfolio.returnKobo !== null && portfolio.valueKobo !== null ? (
          <Text variant="secondary" tone="textMuted" testID="capital-return">
            {`Interest so far ${formatMoney(portfolio.returnKobo)} · Worth ${formatMoney(portfolio.valueKobo)}`}
          </Text>
        ) : portfolio.investedKobo > 0 ? (
          <Text
            variant="secondary"
            tone="textMuted"
            testID="capital-return-unknown"
          >
            We cannot value everything you hold yet.
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function ProductList({
  items,
  loading,
  onProduct,
}: {
  items: CapitalProduct[] | null;
  loading: boolean;
  onProduct: (id: string) => void;
}) {
  if (loading || items === null) {
    return (
      <LoadingView label="Loading products" testID="capital-products-loading">
        <Skeleton height={72} radius={radius.card} />
        <Skeleton height={72} radius={radius.card} />
      </LoadingView>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        testID="capital-products-empty"
        icon="TrendingUp"
        title="Nothing to invest in right now"
        message="New products appear here when they open."
      />
    );
  }
  return (
    <GroupedList testID="capital-products">
      {items.map((p) => (
        <ProductRow key={p.id} product={p} onPress={() => onProduct(p.id)} />
      ))}
    </GroupedList>
  );
}

function MineList({
  holding,
  ended,
  loading,
  onOrder,
}: {
  holding: CapitalOrder[] | null;
  ended: CapitalOrder[] | null;
  loading: boolean;
  onOrder: (id: string) => void;
}) {
  if (loading || holding === null || ended === null) {
    return (
      <LoadingView
        label="Loading your investments"
        testID="capital-mine-loading"
      >
        <Skeleton height={72} radius={radius.card} />
      </LoadingView>
    );
  }
  if (holding.length === 0 && ended.length === 0) {
    return (
      <EmptyState
        testID="capital-mine-empty"
        icon="TrendingUp"
        title="You have not invested yet"
        message="What you invest in shows here, with where it stands."
      />
    );
  }
  return (
    <View style={styles.lists}>
      {holding.length > 0 ? (
        <GroupedList testID="capital-holding">
          {holding.map((o) => (
            <OrderRow key={o.id} order={o} onPress={() => onOrder(o.id)} />
          ))}
        </GroupedList>
      ) : null}
      {ended.length > 0 ? (
        <>
          <Text variant="secondary" tone="textMuted" style={styles.heading}>
            Ended
          </Text>
          <GroupedList testID="capital-ended">
            {ended.map((o) => (
              <OrderRow key={o.id} order={o} onPress={() => onOrder(o.id)} />
            ))}
          </GroupedList>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  portfolio: { gap: space.xs, paddingVertical: space.xs },
  lists: { gap: GAP },
  heading: { marginTop: space.xs },
});
