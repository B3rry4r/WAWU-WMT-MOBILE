import { useMutation, useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

import { isApiError } from "@/api/errors";
import { queryClient } from "@/api/query";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyValueRow, rowMetrics } from "@/components/ListRow";
import { formatMoney } from "@/components/Money";
import { LoadingView, Skeleton } from "@/components/Skeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { AuthFrame } from "@/features/auth/AuthFrame";
import { radius, space } from "@/theme";

import { ENDED_FALLBACK, OPEN_PAGE_LABEL, RAIL_TITLE } from "./cardModel";
import { cancelAttempt, fetchAttempt, type AddMoneyAttempt } from "./ways";

/** How often an open attempt is asked about (`GET /money/add-money/{id}`, the Hub asks the provider). Default (agent), owner may override. */
export const STATUS_POLL_MS = 4000;
const OPEN = ["created", "awaiting_user", "processing"];
const money = (kobo: number) =>
  formatMoney(kobo, { decimals: kobo % 100 !== 0 });

export type StatusScreenProps = {
  id: string;
  onBack: () => void;
  /** Done: back to where the person came from. */
  onDone: () => void;
  /** Try again: the way's own screen. */
  onTryAgain: (rail: AddMoneyAttempt["rail"]) => void;
  /** Opens a hosted page (3-D Secure, Apple Pay, the bank checkout) in the browser. */
  onOpenPage: (url: string) => void;
  pollMs?: number;
};

/**
 * Where one add-money attempt stands (WALLET-25, WALLET-26): the screen the hosted pages and the USSD prompt come back to, by the
 * app's link `wawu://add-money/status?id=`. It asks the Hub every few seconds while the attempt is open, and says in the Hub's own
 * words what happened: waiting for the person (with the page to open again, and a way to give up), paid and being added to the wallet,
 * in the wallet, or ended without the money (with the reason, and Try again). The balance is never shown here: it is the provider's,
 * on the wallet. No board draws it, so it is built from the app's own parts and filed for the designer (R-29).
 */
export function StatusScreen({
  id,
  onBack,
  onDone,
  onTryAgain,
  onOpenPage,
  pollMs = STATUS_POLL_MS,
}: StatusScreenProps) {
  const attempt = useQuery(
    {
      queryKey: ["money", "add-money", "attempt", id] as const,
      queryFn: () => fetchAttempt(id),
      refetchInterval: (q) =>
        q.state.data && !OPEN.includes(q.state.data.status) ? false : pollMs,
      retry: false,
    },
    queryClient,
  );
  const cancel = useMutation(
    {
      mutationFn: () => cancelAttempt(id),
      onSuccess: (a) =>
        queryClient.setQueryData(["money", "add-money", "attempt", id], a),
    },
    queryClient,
  );

  const a = attempt.data;
  let body;
  if (attempt.isPending) {
    body = (
      <LoadingView label="Loading" testID="add-money-loading">
        <Skeleton height={rowMetrics.pairMinHeight * 3} radius={radius.card} />
      </LoadingView>
    );
  } else if (!a) {
    body = (
      <ErrorState
        testID="add-money-status-error"
        icon="TriangleAlert"
        title="We couldn't load this payment"
        message={
          isApiError(attempt.error) && attempt.error.message
            ? attempt.error.message
            : "Check your connection and try again."
        }
        onRetry={() => void attempt.refetch()}
      />
    );
  } else if (a.status === "settled") {
    body = (
      <EmptyState
        testID="add-money-status-settled"
        icon="CircleCheck"
        title={`${money(a.amountKobo)} added`}
        message={a.message}
        action={{ label: "Done", onPress: onDone }}
      />
    );
  } else if (
    a.status === "failed" ||
    a.status === "expired" ||
    a.status === "cancelled"
  ) {
    body = (
      <ErrorState
        testID="add-money-status-ended"
        icon="CircleX"
        title={
          a.status === "cancelled"
            ? "Payment cancelled"
            : "The payment did not go through"
        }
        message={
          a.failureMessage ??
          (a.status === "cancelled" ? a.message : ENDED_FALLBACK)
        }
        onRetry={() => onTryAgain(a.rail)}
      />
    );
  } else {
    body = (
      <View style={styles.open}>
        <Banner
          testID="add-money-status-open"
          tone="info"
          icon={a.status === "processing" ? "Clock" : "CreditCard"}
          title={
            a.status === "processing"
              ? "Paid. Adding it to your wallet."
              : "Waiting for you"
          }
          body={a.message}
        />
        <Card testID="add-money-status-card">
          <KeyValueRow label="Way" value={RAIL_TITLE[a.rail]} />
          <KeyValueRow label="You pay" value={money(a.chargeKobo)} />
          <KeyValueRow label="Wallet gets" value={money(a.amountKobo)} />
        </Card>
        {a.status === "awaiting_user" && a.checkoutUrl ? (
          <Button
            testID="add-money-status-open-page"
            full
            label={OPEN_PAGE_LABEL}
            onPress={() => onOpenPage(a.checkoutUrl!)}
          />
        ) : null}
        {a.status === "awaiting_user" || a.status === "created" ? (
          <Button
            testID="add-money-status-cancel"
            full
            variant="secondary"
            label="Cancel this payment"
            loading={cancel.isPending}
            onPress={() => cancel.mutate()}
          />
        ) : (
          <Button
            testID="add-money-status-leave"
            full
            variant="secondary"
            label="Back to wallet"
            onPress={onDone}
          />
        )}
        {cancel.isError ? (
          <Banner
            testID="add-money-status-cancel-error"
            tone="warning"
            icon="TriangleAlert"
            title="This could not be cancelled"
            body={
              isApiError(cancel.error) && cancel.error.message
                ? cancel.error.message
                : "Try again in a moment."
            }
          />
        ) : null}
      </View>
    );
  }

  return (
    <AuthFrame
      testID="add-money-status-screen"
      navTitle="Add money"
      onBack={onBack}
    >
      {body}
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  open: { gap: space.lg },
});
