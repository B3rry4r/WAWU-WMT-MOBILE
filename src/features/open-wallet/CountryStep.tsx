import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";

import { isApiError } from "@/api/errors";
import { BottomSheet } from "@/components/BottomSheet";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Icon } from "@/components/icon";
import { ListRow } from "@/components/ListRow";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { canvasNormalLineHeight, space, type, useWawu } from "@/theme";

import { AuthFrame } from "@/features/auth/AuthFrame";

import {
  fetchCountries,
  fetchWorldOptions,
  type FiatCode,
  type WorldOptions,
  type WorldUnavailable,
} from "./api/world";
import { ChoiceField, ChoiceSheet } from "./ChoiceField";

const NAV_TITLE = "Complete your account";
const NAV_STEP = "1 of 4";
const TITLE_LEADING = 1.15;
const TITLE_GAP = 6;
const BODY_GAP = 14;
/** The country list is long: the sheet shows about half the screen, like the state list. */
const LIST_SHARE = 0.5;
const SEARCH_MAX = 60;

/** Why a wallet cannot be opened from a country now, in words the person can act on (the Hub's `unavailableReason`). */
export const UNAVAILABLE_COPY: Record<WorldUnavailable, string> = {
  switched_off:
    "Opening a wallet from outside Nigeria is paused for now. Try again later.",
  country_blocked: "We cannot open a wallet for a person in this country yet.",
  limit_reached:
    "We are opening a limited number of wallets each day and today is full. Try again tomorrow.",
  nigeria: "",
};

/** What the person picked: Nigeria goes on to the BVN, any other country to the world details. */
export type CountryChoice = { country: string; currency: FiatCode | null };

export type CountryStepProps = {
  /** The country on the account (WAWU ID's claim): shown as it is, with no list to pick from. Null asks the person. */
  fixedCountry?: string | null;
  /** The currency the person asked for on the way in (R-87), used as the first account when the Hub has it on; the person can change it. */
  preferredCurrency?: FiatCode;
  onClose: () => void;
  /** Nigeria was chosen: the BVN and NIN step follows, unchanged (R-6). */
  onNigeria: () => void;
  /** Another country, with the currency of the first account (the country's own, or the person's pick). */
  onAbroad: (choice: { country: string; currency: FiatCode }) => void;
};

/**
 * WALLET-41 (R-87), the step before the BVN: where the person lives. A person whose account number does not start with
 * +234 and who has no country on file (the profile gets one with GEO-02) is asked here. Nigeria goes on to the BVN
 * and NIN as ever. Any other country shows the currency of the first account (the country's own by the Hub's table,
 * the person may pick another that is on) and goes on to the details and the documents of their own country; there is
 * no BVN. No board draws this step (R-29): it is built from the form's own parts. The lists, the suggestion and what
 * is switched off are the Hub's (`GET /money/world/countries` and `/options`), never the app's.
 */
export function CountryStep({
  fixedCountry = null,
  preferredCurrency,
  onClose,
  onNigeria,
  onAbroad,
}: CountryStepProps) {
  const [picked, setCountry] = useState<{ code: string; name: string } | null>(
    null,
  );
  const [pickedCurrency, setPickedCurrency] = useState<FiatCode | null>(null);
  const [pickingCountry, setPickingCountry] = useState(false);
  const [pickingCurrency, setPickingCurrency] = useState(false);
  const [missing, setMissing] = useState<string | undefined>();
  const { colors } = useWawu();

  const countries = useQuery({
    queryKey: ["world", "countries"],
    queryFn: fetchCountries,
    staleTime: 60 * 60_000,
  });
  const country = fixedCountry
    ? {
        code: fixedCountry,
        name:
          countries.data?.find((c) => c.code === fixedCountry)?.name ??
          fixedCountry,
      }
    : picked;

  const options = useQuery({
    queryKey: ["world", "options", country?.code ?? ""],
    queryFn: () => fetchWorldOptions(country!.code),
    enabled: country !== null && country.code !== "NG",
    staleTime: 0,
  });

  if (countries.isError && countries.data === undefined) {
    return (
      <AuthFrame
        testID="open-wallet-country-error"
        navTitle={NAV_TITLE}
        navStep={NAV_STEP}
        onBack={onClose}
      >
        <View style={styles.body}>
          <Banner
            tone="danger"
            title="We couldn't load the countries"
            body={
              isApiError(countries.error)
                ? countries.error.message
                : "Something went wrong. Try again."
            }
            testID="open-wallet-country-error-banner"
          />
          <Button
            label="Try again"
            variant="secondary"
            full
            onPress={() => void countries.refetch()}
            testID="open-wallet-country-retry"
          />
        </View>
      </AuthFrame>
    );
  }

  const abroad = country !== null && country.code !== "NG";
  const info: WorldOptions | undefined = abroad ? options.data : undefined;
  const asked = preferredCurrency && info?.choices.some((c) => c.code === preferredCurrency && c.enabled) ? preferredCurrency : null;
  const currency: FiatCode | null = pickedCurrency ?? asked ?? info?.suggested ?? null;
  const choices = info?.choices.filter((c) => c.enabled) ?? [];
  const blocked =
    info && !info.available
      ? (info.unavailableReason
          ? UNAVAILABLE_COPY[info.unavailableReason]
          : "") || UNAVAILABLE_COPY.switched_off
      : null;

  const next = () => {
    if (!country) {
      setMissing("Choose the country you live in.");
      return;
    }
    if (country.code === "NG") {
      onNigeria();
      return;
    }
    if (!info || !info.available || !currency) return;
    onAbroad({ country: country.code, currency });
  };
  const waiting = abroad && (options.isLoading || (options.isError && !info));

  return (
    <AuthFrame
      testID="open-wallet-country"
      navTitle={NAV_TITLE}
      navStep={NAV_STEP}
      onBack={onClose}
      footer={
        <Button
          label="Continue"
          full
          disabled={Boolean(blocked) || waiting}
          onPress={next}
          testID="open-wallet-country-continue"
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="h1" style={styles.title}>
            Where do you live?
          </Text>
          <Text variant="muted">
            We check who you are with an ID from your own country, then open
            your wallet.
          </Text>
        </View>
        {countries.isLoading ? (
          <Skeleton height={56} />
        ) : (
          <ChoiceField
            label="Country"
            value={country?.name ?? null}
            onPress={() => setPickingCountry(true)}
            disabled={fixedCountry !== null}
            error={missing}
            testID="open-wallet-country-field"
          />
        )}
        {abroad && options.isError && !info ? (
          <Banner
            tone="danger"
            title="We couldn't check this country"
            body={
              isApiError(options.error)
                ? options.error.message
                : "Something went wrong. Try again."
            }
            testID="open-wallet-country-options-error"
          />
        ) : null}
        {abroad && options.isLoading ? <Skeleton height={56} /> : null}
        {blocked ? (
          <Banner
            tone="warning"
            title="Not available yet"
            body={blocked}
            testID="open-wallet-country-blocked"
          />
        ) : null}
        {info && info.available && currency ? (
          <>
            <ChoiceField
              label="Your first account"
              value={
                info.choices.find((c) => c.code === currency)?.name ?? currency
              }
              onPress={() => setPickingCurrency(true)}
              testID="open-wallet-currency-field"
            />
            <View style={styles.note} testID="open-wallet-country-note">
              <Icon
                name="Lock"
                size={15}
                color={colors.textMuted}
                strokeWidth={2}
              />
              <Text variant="secondary" style={styles.noteText}>
                You can add other currencies after your wallet is open.
              </Text>
            </View>
          </>
        ) : null}
      </View>
      <CountrySheet
        visible={pickingCountry}
        countries={countries.data ?? []}
        selected={country?.code ?? null}
        onClose={() => setPickingCountry(false)}
        onPick={(picked) => {
          setCountry(picked);
          setPickedCurrency(null);
          setMissing(undefined);
          setPickingCountry(false);
        }}
      />
      <ChoiceSheet
        visible={pickingCurrency}
        onClose={() => setPickingCurrency(false)}
        title="Your first account"
        options={choices.map((c) => ({ value: c.code, label: c.name }))}
        selected={currency}
        onPick={(picked) => {
          setPickedCurrency(picked);
          setPickingCurrency(false);
        }}
        testID="open-wallet-currency"
      />
    </AuthFrame>
  );
}

/** Narrows a long list as the person types: names that contain the typed letters, case aside. */
export function filterCountries<T extends { name: string }>(
  all: readonly T[],
  typed: string,
): T[] {
  const needle = typed.trim().toLowerCase();
  return needle
    ? all.filter((c) => c.name.toLowerCase().includes(needle))
    : [...all];
}

type CountrySheetProps = {
  visible: boolean;
  countries: readonly { code: string; name: string }[];
  selected: string | null;
  onClose: () => void;
  onPick: (country: { code: string; name: string }) => void;
};

function CountrySheet({
  visible,
  countries,
  selected,
  onClose,
  onPick,
}: CountrySheetProps) {
  const { colors } = useWawu();
  const { height } = useWindowDimensions();
  const [typed, setTyped] = useState("");
  const shown = useMemo(
    () => filterCountries(countries, typed),
    [countries, typed],
  );
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      label="Choose your country"
      testID="country-sheet"
    >
      <Text variant="sheetTitleSm" accessibilityRole="header">
        Choose your country
      </Text>
      <TextField
        label="Search"
        testID="country-search"
        value={typed}
        onChangeText={setTyped}
        maxLength={SEARCH_MAX}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <FlatList
        testID="country-sheet-list"
        data={shown}
        keyExtractor={(c) => c.code}
        initialNumToRender={24}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: height * LIST_SHARE }}
        renderItem={({ item }) => (
          <ListRow
            testID={`country-${item.code}`}
            title={item.name}
            accessibilityLabel={
              item.code === selected ? `${item.name}, chosen` : item.name
            }
            trailing={
              item.code === selected ? (
                <Icon
                  name="Check"
                  size={18}
                  color={colors.accentFg}
                  strokeWidth={2.6}
                />
              ) : (
                <View />
              )
            }
            onPress={() => onPick(item)}
          />
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  titleBlock: { gap: TITLE_GAP },
  title: { lineHeight: type.size.h1 * TITLE_LEADING },
  note: { flexDirection: "row", alignItems: "center", gap: space.md },
  noteText: { flex: 1, fontSize: 13, lineHeight: canvasNormalLineHeight(13) },
});
