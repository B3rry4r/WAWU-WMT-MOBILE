import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { isApiError } from "@/api/errors";
import { queryClient } from "@/api/query";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { formatMoney } from "@/components/Money";
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
import { useSessionAccount } from "@/features/open-wallet/sessionAccount";
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
import { dropSent, keepSent, readSent, type SentRequest } from "./sentRequest";
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
  keyReused:
    "This payment may already have gone through, and the Hub could not match this try to it. Check your wallet activity before you pay again.",
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
  const owner = useSessionAccount(undefined);
  const key = useRef(newRequestKey());
  // The request of this attempt once it has been made: the same key and the same bytes on every retry (F1). `sent` is what the
  // screen shows while a try is unconfirmed; the ref is what the next try sends.
  const sentRef = useRef<SentRequest | null>(null);
  const [sent, setSent] = useState<SentRequest | null>(null);
  useEffect(() => {
    let current = true;
    void readSent(owner).then((kept) => {
      if (current && kept && kept.rail === rail && !sentRef.current) {
        sentRef.current = kept;
        setSent(kept);
      }
    });
    return () => {
      current = false;
    };
  }, [owner, rail]);
  /** Lets go of the request: the Hub has the last word, or the person starts a new payment knowingly. */
  const release = () => {
    sentRef.current = null;
    setSent(null);
    key.current = newRequestKey();
    void dropSent(owner);
  };
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
  const total = sent?.chargeKobo ?? quote.data?.chargeKobo ?? 0;

  const card = () => ({ number, expiry, cvv, name, address, city, state });
  const begin = () => {
    setNotice(null);
    if (sent) {
      setPinOpen(true);
      return;
    }
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
    let request = sentRef.current;
    const madeNow = request === null;
    if (!request) {
      const q = quote.data!;
      let card: SentRequest["card"];
      if (isCard) {
        const { month, year } = expiryParts(expiry);
        // Scrambled once for the whole attempt: a retry sends this text again (the Hub compares bodies under one key).
        const encrypted = await encryptCard(
          options.data!.cardPublicKey!,
          { number, expiryMonth: month, expiryYear: year, cvv, name: name.trim() },
          await appCryptoParts(),
        );
        card = {
          encrypted,
          billing: { line1: address.trim(), city: city.trim(), state: state.trim() },
        };
      }
      request = {
        key: key.current,
        rail,
        amountKobo: q.amountKobo,
        chargeKobo: q.chargeKobo,
        ...(card ? { card } : {}),
        ...(rail === "ussd" && phone.trim() ? { msisdn: phone.trim() } : {}),
        at: Date.now(),
      };
      // Kept before anything leaves the phone, so a closed app can still send the same request again.
      sentRef.current = request;
      await keepSent(owner, request);
    }
    const outcome = await startAddMoney({
      rail: request.rail,
      amountKobo: request.amountKobo,
      chargeKobo: request.chargeKobo,
      ...(request.card ? { card: request.card } : {}),
      ...(request.msisdn ? { msisdn: request.msisdn } : {}),
      key: request.key,
      ...credential,
    });
    switch (outcome.kind) {
      case "pin_incorrect":
        // The Hub answers a wrong PIN before it makes anything: no payment exists for this key.
        if (madeNow) release();
        return { code: "pin_incorrect" as const, triesLeft: outcome.triesLeft };
      case "pin_locked":
        if (madeNow) release();
        setLockedUntil(outcome.lockedUntil);
        return { code: "pin_locked" as const, lockedUntil: outcome.lockedUntil };
      case "unanswered":
        // No answer proves nothing: the same request goes again, same key, same bytes.
        setSent(request);
        return { code: "unanswered" as const };
      case "approval_cancelled":
        if (madeNow) release();
        return notApproved("cancelled", !madeNow, () => undefined);
      case "approval_failed":
        if (madeNow) release();
        return notApproved("failed", !madeNow, () => undefined);
      case "done":
        setPinOpen(false);
        release();
        onStarted(outcome.attempt);
        return { code: "approved" as const };
      case "pin_not_set":
        setPinOpen(false);
        release();
        onSetPin();
        return { code: "approved" as const };
      case "no_wallet":
        setPinOpen(false);
        release();
        entry.open();
        return { code: "approved" as const };
      case "quote_changed":
        // A refusal before anything is made: no payment exists for the key, so this is a new attempt at the new quote.
        setPinOpen(false);
        release();
        setSettled((n) => (n ?? 0) + 1);
        setNotice(lines.changed);
        return { code: "approved" as const };
      case "refused":
        setPinOpen(false);
        if (outcome.code === "idempotency_key_reused") {
          // The Hub knows this key with another body. Never a new key by itself: the first charge may have gone through. The request
          // stays, and only the person's own "Start a new payment" lets go of it.
          setSent(request);
          setNotice(lines.keyReused);
        } else {
          release();
          setNotice(outcome.message);
        }
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
  } else if (sent) {
    body = (
      <View style={styles.form}>
        {notice ? (
          <Banner testID="add-money-way-notice" tone="warning" icon="TriangleAlert" title="Check this" body={notice} />
        ) : null}
        <Banner
          testID="add-money-way-sent"
          tone="info"
          icon="Clock"
          title="Your payment was not confirmed"
          body="It may already have gone through. Paying again sends the very same payment, so you are not charged twice. If you are unsure, check your wallet activity first."
        />
        <Card testID="add-money-way-sent-card">
          <KeyValueRow label="You pay" value={formatMoney(sent.chargeKobo, { decimals: sent.chargeKobo % 100 !== 0 })} />
          <KeyValueRow label="Wallet gets" value={formatMoney(sent.amountKobo, { decimals: sent.amountKobo % 100 !== 0 })} />
        </Card>
        <Button testID="add-money-way-new" full variant="secondary" label="Start a new payment" onPress={release} />
      </View>
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

  const ready = sent ? !options.isPending : kobo !== null && !!quote.data && !options.isPending;
  return (
    <AuthFrame
      testID="add-money-way-screen"
      navTitle={RAIL_TITLE[rail]}
      onBack={onBack}
      footer={
        <Button
          testID="add-money-way-pay"
          full
          label={sent ? `Pay ${formatMoney(sent.chargeKobo, { decimals: sent.chargeKobo % 100 !== 0 })} again` : payLabel(quote.data ?? null)}
          disabled={!ready}
          loading={!sent && quote.isFetching && kobo !== null}
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
