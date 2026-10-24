import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { ListRow } from '@/components/ListRow';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SkeletonRows } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { space } from '@/theme';

import type { Refusal } from './api';
import { fieldProblem, fieldsOf, methodLabel, type Bank, type Corridors, type Country, type Field, type Rail } from './model';

export type BanksRead = {
  data: Bank[] | undefined;
  loading: boolean;
  failed: boolean;
  retry: () => void;
};

export type NewRecipientViewProps = {
  corridors: Corridors;
  /** The bank directory of a country, asked only while its picker is the one in view (a hook, passed in). */
  useBanks: (country: string, wanted: boolean) => BanksRead;
  saving: boolean;
  /** The Hub's refusal of the last save, with the fields it names. */
  refusal: Refusal | null;
  /** The last save got no answer. */
  unanswered: boolean;
  onBack: () => void;
  onSave: (input: {
    country: string;
    method: 'bank' | 'mobile_money';
    scheme: string | null;
    holderName: string;
    fields: Record<string, string>;
  }) => void;
  /** For pictures: start on a country and way. */
  initial?: { country: string; method?: 'bank' | 'mobile_money' };
};

type Step = 'country' | 'details' | 'bank';

/**
 * Send abroad · a new recipient (NUV-11, R-84; no board, R-29). Pick the country, then the way it arrives, then exactly the fields that
 * country and way ask: the Hub draws them (`GET /money/abroad/corridors`), the app never keeps a list of its own. A country the Hub says
 * is not available is shown with its words and cannot be picked (R-47 allows it: it is built, and Nuvion has not switched it on).
 */
export function NewRecipientView(props: NewRecipientViewProps) {
  const { corridors } = props;
  const start = props.initial ? corridors.countries.find((c) => c.country === props.initial?.country) : undefined;
  const [step, setStep] = useState<Step>(start ? 'details' : 'country');
  const [country, setCountry] = useState<Country | null>(start ?? null);
  const [method, setMethod] = useState<'bank' | 'mobile_money'>(props.initial?.method ?? 'bank');
  const [scheme, setScheme] = useState<string | null>(null);
  const [holder, setHolder] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [bank, setBank] = useState<Bank | null>(null);
  const [search, setSearch] = useState('');
  const [touched, setTouched] = useState(false);

  const rail: Rail | null = country ? (country.rails.find((r) => r.method === method) ?? country.rails[0] ?? null) : null;
  const schemeId = rail ? (rail.schemes.some((s) => s.id === scheme) ? scheme : (rail.schemes[0]?.id ?? null)) : null;
  const fields = useMemo(() => (rail ? fieldsOf(rail, schemeId) : []), [rail, schemeId]);
  const banks = props.useBanks(country?.country ?? '', step === 'bank' && Boolean(rail?.directory));

  const problems = useMemo(() => {
    const out: Record<string, string> = {};
    for (const f of fields) {
      const raw = f.kind === 'bank' ? (bank?.code ?? '') : (values[f.key] ?? '');
      const p = fieldProblem(f, raw);
      if (p) out[f.key] = f.kind === 'bank' ? 'Choose the bank.' : p;
    }
    if (holder.trim().length < 2) out.holder = 'Enter the name on the account.';
    return out;
  }, [fields, values, bank, holder]);
  const refused = new Set(props.refusal?.fields ?? []);

  const pickCountry = (c: Country) => {
    setCountry(c);
    setMethod(c.rails[0]?.method ?? 'bank');
    setScheme(null);
    setValues({});
    setBank(null);
    setTouched(false);
    setStep('details');
  };

  const save = () => {
    setTouched(true);
    if (!country || !rail || Object.keys(problems).length > 0) return;
    const sent: Record<string, string> = {};
    for (const f of fields) sent[f.key] = f.kind === 'bank' ? (bank?.code ?? '') : (values[f.key] ?? '').trim();
    props.onSave({
      country: country.country,
      method: rail.method,
      scheme: rail.schemes.length > 1 || rail.schemes[0]?.id ? schemeId : null,
      holderName: holder.trim(),
      fields: sent,
    });
  };

  if (step === 'country') {
    const q = search.trim().toLowerCase();
    const list = corridors.countries.filter((c) => q === '' || c.name.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q));
    return (
      <AuthFrame testID="abroad-country-screen" navTitle="Where to?" onBack={props.onBack}>
        <View style={styles.body}>
          <TextField testID="abroad-country-search" label="Search countries" value={search} onChangeText={setSearch} autoCapitalize="none" />
          <GroupedList>
            {list.map((c) => (
              <ListRow
                key={c.country}
                testID={`abroad-country-${c.country}`}
                title={c.name}
                subtitle={c.available ? `Paid in ${c.currency}` : (c.unavailableNote ?? 'Not available yet')}
                onPress={c.available ? () => pickCountry(c) : undefined}
                accessibilityLabel={c.available ? `${c.name}, paid in ${c.currency}` : `${c.name}. ${c.unavailableNote ?? 'Not available yet'}`}
              />
            ))}
          </GroupedList>
        </View>
      </AuthFrame>
    );
  }

  if (step === 'bank' && country) {
    const q = search.trim().toLowerCase();
    const list = (banks.data ?? []).filter((b) => q === '' || b.name.toLowerCase().includes(q));
    return (
      <AuthFrame
        testID="abroad-bank-screen"
        navTitle="Choose the bank"
        onBack={() => {
          setSearch('');
          setStep('details');
        }}
      >
        <View style={styles.body}>
          <TextField testID="abroad-bank-search" label="Search banks" value={search} onChangeText={setSearch} autoCapitalize="none" />
          {banks.loading ? (
            <SkeletonRows count={5} testID="abroad-banks-loading" />
          ) : banks.failed ? (
            <ErrorState
              testID="abroad-banks-error"
              icon="TriangleAlert"
              title="We couldn't load the banks"
              message="Check your connection and try again."
              onRetry={banks.retry}
            />
          ) : (
            <GroupedList>
              {list.map((b) => (
                <ListRow
                  key={b.code}
                  testID={`abroad-bank-${b.code}`}
                  title={b.name}
                  onPress={() => {
                    setBank(b);
                    setSearch('');
                    setStep('details');
                  }}
                />
              ))}
            </GroupedList>
          )}
        </View>
      </AuthFrame>
    );
  }

  if (!country || !rail) return null;
  const typeOf = (f: Field) =>
    f.kind === 'digits' ? 'number-pad' : f.kind === 'phone' ? 'phone-pad' : f.kind === 'email' ? 'email-address' : 'default';
  const errorOf = (f: Field) => (touched && problems[f.key]) || (refused.has(f.key) ? `Check the ${f.label.toLowerCase()}.` : undefined);

  return (
    <AuthFrame
      testID="abroad-recipient-screen"
      navTitle="New recipient"
      onBack={() => setStep('country')}
      footer={<Button testID="abroad-save" label="Save recipient" full loading={props.saving} onPress={save} />}
    >
      <View style={styles.body}>
        <GroupedList>
          <ListRow
            testID="abroad-change-country"
            title={country.name}
            subtitle={`Paid in ${country.currency}. Tap to change.`}
            onPress={() => setStep('country')}
          />
        </GroupedList>
        {country.rails.length > 1 ? (
          <SegmentedTabs<'bank' | 'mobile_money'>
            testID="abroad-ways"
            label="How it arrives"
            items={country.rails.map((r) => ({
              value: r.method,
              label: methodLabel(r),
            }))}
            value={rail.method}
            onChange={(m) => {
              setMethod(m);
              setScheme(null);
              setTouched(false);
            }}
          />
        ) : null}
        {rail.schemes.length > 1 ? (
          <FilterChips<string>
            testID="abroad-schemes"
            label="Which kind"
            variant="option"
            items={rail.schemes.map((s) => ({
              value: s.id ?? '',
              label: s.label,
            }))}
            value={schemeId ?? ''}
            onChange={(v) => {
              setScheme(v);
              setTouched(false);
            }}
          />
        ) : null}
        <TextField
          testID="abroad-holder"
          label="Name on the account"
          value={holder}
          onChangeText={setHolder}
          autoCapitalize="words"
          error={touched ? problems.holder : undefined}
        />
        {fields.map((f) =>
          f.kind === 'bank' ? (
            <TextField
              key={f.key}
              testID={`abroad-field-${f.key}`}
              label={f.label}
              value={bank?.name ?? ''}
              placeholder="Choose the bank"
              onPress={() => {
                setSearch('');
                setStep('bank');
              }}
              trailingIcon="ChevronRight"
              error={errorOf(f)}
            />
          ) : f.kind === 'choice' && f.options ? (
            <View key={f.key} style={styles.choice}>
              <Text variant="label">{f.label}</Text>
              <FilterChips<string>
                testID={`abroad-field-${f.key}`}
                label={f.label}
                variant="option"
                items={f.options.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                value={values[f.key] ?? ''}
                onChange={(v) => setValues((cur) => ({ ...cur, [f.key]: v }))}
              />
              {errorOf(f) ? (
                <Text variant="meta" tone="danger">
                  {errorOf(f)}
                </Text>
              ) : null}
            </View>
          ) : (
            <TextField
              key={f.key}
              testID={`abroad-field-${f.key}`}
              label={f.label}
              hint={f.hint ?? undefined}
              value={values[f.key] ?? ''}
              onChangeText={(v) => setValues((cur) => ({ ...cur, [f.key]: v }))}
              keyboardType={typeOf(f)}
              autoCapitalize={f.key === 'iban' || f.key === 'swift_bic' ? 'characters' : 'none'}
              autoCorrect={false}
              error={errorOf(f)}
            />
          ),
        )}
        {props.refusal ? (
          <Banner testID="abroad-refusal" tone="danger" title="This was not saved" body={props.refusal.message || 'The details were not accepted.'} />
        ) : null}
        {props.unanswered ? (
          <Banner
            testID="abroad-unanswered"
            tone="warning"
            title="No answer yet"
            body="We could not reach the payment partner. Nothing was saved. Try again."
          />
        ) : null}
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.lg },
  choice: { gap: space.sm },
});
