import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { isApiError } from "@/api/errors";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { space, type } from "@/theme";

import { AuthFrame } from "@/features/auth/AuthFrame";

import {
  fetchWorldOptions,
  openFirstAccount,
  type FiatCode,
} from "./api/world";
import type { OpeningProgress } from "./api/review";
import { ChoiceField, ChoiceSheet } from "./ChoiceField";

/** How often the app asks the Hub to open the first account while the bank's approval is in and the account is not open. */
export const FIRST_ACCOUNT_RETRY_MS = 8000;

/** True when the bank approved a person outside Nigeria and their first account is not open yet. */
export function firstAccountDue(
  progress: OpeningProgress | undefined,
): boolean {
  return Boolean(
    progress?.world &&
    progress.world.state === "opening" &&
    progress.review?.stage === "approved",
  );
}

export type FirstAccount = {
  /** The Hub's words when it declined the first account (for example the bank does not give that currency in the country). */
  problem: string | null;
  busy: boolean;
  /** Tries again with another first currency. */
  pick: (currency: FiatCode) => void;
};

/**
 * WALLET-41: once the bank has approved a person outside Nigeria, the Hub opens their first account by itself (Nuvion's
 * notice); this asks it to as well, so a notice that never came does not leave them waiting. Safe to repeat: the
 * Hub opens one first account however many times it is asked. A refusal in the bank's words stops the asking and is
 * shown with the other currencies to pick (`pick`); `refresh` reads the wallet again after every answer.
 */
export function useFirstAccount(
  progress: OpeningProgress | undefined,
  refresh: () => void,
): FirstAccount {
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const due = firstAccountDue(progress);

  const run = (currency?: FiatCode) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    openFirstAccount(currency)
      .then(() => setProblem(null))
      .catch((error: unknown) =>
        setProblem(
          isApiError(error)
            ? error.message
            : "We could not open your account. Try again.",
        ),
      )
      .finally(() => {
        inFlight.current = false;
        setBusy(false);
        refresh();
      });
  };

  useEffect(() => {
    if (!due || problem !== null) return undefined;
    run();
    const timer = setInterval(() => run(), FIRST_ACCOUNT_RETRY_MS);
    return () => clearInterval(timer);
    // `run` only reads refs and setters; it is meant to start once per due state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due, problem]);

  return {
    problem,
    busy,
    pick: (currency) => {
      setProblem(null);
      run(currency);
    },
  };
}

/** The bank declined the first account: its words, and the other currencies to try. */
export function FirstAccountProblem({
  country,
  problem,
  busy,
  onPick,
  onLeave,
}: {
  country: string;
  problem: string;
  busy: boolean;
  onPick: (currency: FiatCode) => void;
  onLeave: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const options = useQuery({
    queryKey: ["world", "options", country],
    queryFn: () => fetchWorldOptions(country),
    staleTime: 0,
  });
  const choices = options.data?.choices.filter((c) => c.enabled) ?? [];
  return (
    <AuthFrame
      testID="open-wallet-first-account-problem"
      bare
      footer={
        <Button
          label="Close"
          variant="secondary"
          full
          onPress={onLeave}
          testID="open-wallet-first-account-leave"
        />
      }
    >
      <View style={styles.body}>
        <Text variant="h1" style={styles.title}>
          Your wallet is approved
        </Text>
        <Banner
          tone="warning"
          title="We could not open that account"
          body={problem}
          testID="open-wallet-first-account-banner"
        />
        {choices.length > 0 ? (
          <ChoiceField
            label="Open an account in"
            value={null}
            onPress={() => setPicking(true)}
            disabled={busy}
            testID="open-wallet-first-account-currency"
          />
        ) : null}
        <ChoiceSheet
          visible={picking}
          onClose={() => setPicking(false)}
          title="Open an account in"
          options={choices.map((c) => ({ value: c.code, label: c.name }))}
          selected={null}
          onPick={(code) => {
            setPicking(false);
            onPick(code);
          }}
          testID="open-wallet-first-account-pick"
        />
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  title: { fontSize: type.size.h1 },
});
