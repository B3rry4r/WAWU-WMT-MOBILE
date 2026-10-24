import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { isApiError } from "@/api/errors";
import { queryClient } from "@/api/query";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyValueRow, rowMetrics } from "@/components/ListRow";
import {
  PAYMENT_UNANSWERED_LINE,
  PinSheet,
  type BiometricKind,
} from "@/components/pin-sheet";
import { approvalLine } from "@/components/pin-sheet/format";
import { LoadingView, Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/StateViews";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { AuthFrame } from "@/features/auth/AuthFrame";
import {
  approveRequest,
  asBiometricResult,
  asPinResult,
  notApproved,
  useApprovalKind,
} from "@/features/device-approval";
import { useOpenWalletEntry } from "@/features/open-wallet/entry";
import { newRequestKey } from "@/features/wallet/api/settings";
import { radius, space } from "@/theme";

import {
  cardProblems,
  expiryParts,
  groupedCard,
  groupedExpiry,
  koboOf,
  payLabel,
  quoteLines,
  RAIL_TITLE,
  type CardProblems,
} from "./cardModel";
import { appCryptoParts, encryptCard } from "./encryptCard";
import { optionsQuery } from "./OtherWays";
import {
  fetchQuote,
  startAddMoney,
  type AddMoneyAttempt,
  type AddMoneyRail,
  type Credential,
} from "./ways";

export type WayScreenProps = {
  rail: AddMoneyRail;
  onBack: () => void;
  /** The attempt was taken (it may already say it failed): its status screen opens, and a hosted page is opened first. */
  onStarted: (attempt: AddMoneyAttempt) => void;
  onForgotPin: () => void;
  onSetPin: () => void;
};

const lines = {
  amountHint: "What your wallet gets, in naira.",
  noKey: "Card payments are not available right now.",
  cardNote:
    "Your card is scrambled on this phone before it is sent. We never see the number.",
  ussdNote: "You get a prompt on your phone to approve the payment.",
  pageNote: "You finish on a secure page, then come back here.",
  changed: "The fees changed. Check the new total before you pay.",
};

/**
 * One of the other ways to add money (WALLET-25 card and Apple Pay, WALLET-26 USSD and the bank checkout; R-84): the amount, the
 * details that way needs (a card with its billing address, a phone for USSD), the quote the Hub gives (the provider's charge plus ours,
 * R-10), then the PIN sheet or the phone's fingerprint, as a send to a person does (W11). No board draws it (the 16 Oct board removed the
 * card page, R-42), so it is built from the app's own parts and filed for the designer (R-29).
 *
 * The card is encrypted here with the provider's public key (`cardPublicKey` from the Hub); the Hub passes the scrambled text on and
 * keeps none of it. The Idempotency-Key is one per attempt and goes again, unchanged, if no answer came back.
 */
export function WayScreen({
  rail,
  onBack,
  onStarted,
  onForgotPin,
  onSetPin,
}: WayScreenProps) {
  const entry = useOpenWalletEntry();
  const options = useQuery(optionsQuery, queryClient);
  const [amountText, setAmountText] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [problems, setProblems] = useState<CardProblems>({});
  const [pinOpen, setPinOpen] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const key = useRef(newRequestKey());
  const [settled, setSettled] = useState<number | null>(null);

  const kobo = koboOf(amountText);
  const quote = useQuery(
    {
      queryKey: ["money", "add-money", "quote", rail, kobo, settled] as const,
      queryFn: () => fetchQuote(rail, kobo!),
      enabled: kobo !== null,
      staleTime: 30_000,
      gcTime: 0,
      retry: false,
    },
    queryClient,
  );
  const approvalKind = useApprovalKind();
  const isCard = rail === "card";
  const total = quote.data?.chargeKobo ?? 0;

  const card = () => ({ number, expiry, cvv, name, address, city, state });
  const begin = () => {
    setNotice(null);
    if (kobo === null || !quote.data) return;
    if (isCard) {
      const found = cardProblems(card());
      setProblems(found);
      if (Object.keys(found).length > 0) return;
      if (!options.data?.cardPublicKey) {
        setNotice(lines.noKey);
        return;
      }
    }
    setPinOpen(true);
  };

  const run = async (credential: Credential) => {
    const q = quote.data!;
    let cardInput;
    if (isCard) {
      const { month, year } = expiryParts(expiry);
      const encrypted = await encryptCard(
        options.data!.cardPublicKey!,
        {
          number,
          expiryMonth: month,
          expiryYear: year,
          cvv,
          name: name.trim(),
        },
        await appCryptoParts(),
      );
      cardInput = {
        encrypted,
        billing: {
          line1: address.trim(),
          city: city.trim(),
          state: state.trim(),
        },
      };
    }
    const outcome = await startAddMoney({
      rail,
      amountKobo: q.amountKobo,
      chargeKobo: q.chargeKobo,
      ...(cardInput ? { card: cardInput } : {}),
      ...(rail === "ussd" && phone.trim() ? { msisdn: phone.trim() } : {}),
      key: key.current,
      ...credential,
    });
    switch (outcome.kind) {
      case "pin_incorrect":
        return { code: "pin_incorrect" as const, triesLeft: outcome.triesLeft };
      case "pin_locked":
        setLockedUntil(outcome.lockedUntil);
        return {
          code: "pin_locked" as const,
          lockedUntil: outcome.lockedUntil,
        };
      case "unanswered":
        return { code: "unanswered" as const };
      case "approval_cancelled":
        return notApproved("cancelled", false, () => undefined);
      case "approval_failed":
        return notApproved("failed", false, () => undefined);
      case "done":
        setPinOpen(false);
        key.current = newRequestKey();
        onStarted(outcome.attempt);
        return { code: "approved" as const };
      case "pin_not_set":
        setPinOpen(false);
        onSetPin();
        return { code: "approved" as const };
      case "no_wallet":
        setPinOpen(false);
        entry.open();
        return { code: "approved" as const };
      case "quote_changed":
        setPinOpen(false);
        key.current = newRequestKey();
        setSettled((n) => (n ?? 0) + 1);
        setNotice(lines.changed);
        return { code: "approved" as const };
      case "refused":
        setPinOpen(false);
        key.current = newRequestKey();
        setNotice(outcome.message);
        return { code: "approved" as const };
    }
  };

  const submitPin = async (pin: string) => asPinResult(await run({ pin }));
  const prompt = quote.data
    ? approvalLine({ totalKobo: total, payee: "your wallet" })
    : "Approve this payment";
  const approveWithBiometric = async (_kind: BiometricKind) =>
    asBiometricResult(
      await run({ approve: (signed) => approveRequest(signed, prompt) }),
    );

  let body;
  if (options.isPending) {
    body = (
      <LoadingView label="Loading" testID="add-money-loading">
        <Skeleton height={rowMetrics.pairMinHeight * 3} radius={radius.card} />
      </LoadingView>
    );
  } else if (
    options.isError ||
    !options.data?.rails.some((r) => r.rail === rail && r.available)
  ) {
    body = (
      <ErrorState
        testID="add-money-way-unavailable"
        icon="TriangleAlert"
        title={`${RAIL_TITLE[rail]} is not available`}
        message={
          options.data?.rails.find((r) => r.rail === rail)?.reason ??
          "Try again in a moment."
        }
        onRetry={() => void options.refetch()}
      />
    );
  } else {
    body = (
      <View style={styles.form}>
        {notice ? (
          <Banner
            testID="add-money-way-notice"
            tone="warning"
            icon="TriangleAlert"
            title="Check this"
            body={notice}
          />
        ) : null}
        <TextField
          testID="add-money-way-amount"
          label="Amount"
          hint={lines.amountHint}
          keyboardType="decimal-pad"
          placeholder="₦0"
          value={amountText}
          onChangeText={(t) => setAmountText(t.replace(/[^0-9.,]/g, ""))}
          error={
            amountText.length > 0 && kobo === null
              ? "Enter an amount in naira."
              : quote.isError && isApiError(quote.error)
                ? quote.error.message
                : undefined
          }
        />
        {isCard ? (
          <>
            <TextField
              testID="add-money-way-number"
              label="Card number"
              keyboardType="number-pad"
              autoComplete="cc-number"
              value={number}
              onChangeText={(t) => setNumber(groupedCard(t))}
              error={problems.number}
            />
            <View style={styles.pair}>
              <View style={styles.half}>
                <TextField
                  testID="add-money-way-expiry"
                  label="Expiry"
                  placeholder="MM/YY"
                  keyboardType="number-pad"
                  autoComplete="cc-exp"
                  value={expiry}
                  onChangeText={(t) => setExpiry(groupedExpiry(t))}
                  error={problems.expiry}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  testID="add-money-way-cvv"
                  label="Security code"
                  keyboardType="number-pad"
                  autoComplete="cc-csc"
                  maxLength={4}
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/[^0-9]/g, ""))}
                  error={problems.cvv}
                />
              </View>
            </View>
            <TextField
              testID="add-money-way-name"
              label="Name on card"
              autoCapitalize="words"
              autoComplete="cc-name"
              value={name}
              onChangeText={setName}
              error={problems.name}
            />
            <TextField
              testID="add-money-way-address"
              label="Billing address"
              autoComplete="street-address"
              value={address}
              onChangeText={setAddress}
              error={problems.address}
            />
            <View style={styles.pair}>
              <View style={styles.half}>
                <TextField
                  testID="add-money-way-city"
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  error={problems.city}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  testID="add-money-way-state"
                  label="State"
                  value={state}
                  onChangeText={setState}
                  error={problems.state}
                />
              </View>
            </View>
            <Text variant="secondary">{lines.cardNote}</Text>
          </>
        ) : null}
        {rail === "ussd" ? (
          <>
            <TextField
              testID="add-money-way-phone"
              label="Phone to pay from"
              hint="Left empty, the phone on your account is used."
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
            />
            <Text variant="secondary">{lines.ussdNote}</Text>
          </>
        ) : null}
        {rail === "apple_pay" || rail === "open_banking" ? (
          <Text variant="secondary">{lines.pageNote}</Text>
        ) : null}
        {quote.data ? (
          <Card testID="add-money-way-quote">
            {quoteLines(quote.data).map((l) => (
              <KeyValueRow
                key={l.key}
                testID={`add-money-way-quote-${l.key}`}
                label={l.label}
                value={l.value}
              />
            ))}
          </Card>
        ) : null}
      </View>
    );
  }

  const ready = kobo !== null && !!quote.data && !options.isPending;
  return (
    <AuthFrame
      testID="add-money-way-screen"
      navTitle={RAIL_TITLE[rail]}
      onBack={onBack}
      footer={
        <Button
          testID="add-money-way-pay"
          full
          label={payLabel(quote.data ?? null)}
          disabled={!ready}
          loading={quote.isFetching && kobo !== null}
          onPress={begin}
        />
      }
    >
      {body}
      <PinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        approval={{ totalKobo: total, payee: "your wallet" }}
        onSubmit={submitPin}
        biometric={
          approvalKind
            ? { kind: approvalKind, onPress: approveWithBiometric }
            : undefined
        }
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          setPinOpen(false);
          onForgotPin();
        }}
        lockedUntil={lockedUntil}
      />
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.lg },
  pair: { flexDirection: "row", gap: space.md },
  half: { flex: 1 },
});
