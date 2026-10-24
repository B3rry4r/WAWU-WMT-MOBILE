import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { formatNaira } from '@/components/pay-sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { BANK_CHARGE, WAWU_FEE } from '@/features/events/buyModel';
import { font, space, text } from '@/theme';

import { matterMetrics as m } from '../look2';
import { LegalFrame } from '../ui';
import { fetchPurchaseFee, fetchServices, fixedKeys, startRequest } from './api';
import { iconOf, nameChoice, startable } from './model';

export type FixedArgs = {
  code: string;
  onBack: () => void;
  /** The request exists: its matter, where the letter is signed and the fee paid. */
  onStarted: (requestId: string) => void;
};

const sentence = (error: unknown, fallback: string) => (isApiError(error) && error.message ? error.message : fallback);

/**
 * S26 · Fixed-price request: what the service is, the price WAWU set (R-14), the bank's charge and the total (BRIEF S26), and the first name choice.
 * "Continue" starts the request on the Hub, which quotes it at the fixed price; the matter then asks for the letter to be signed (S21) before the fee is
 * paid with the PIN (S22), because the Hub refuses a fee until the letter is signed. Nothing is charged here.
 */
export function FixedPriceScreen({ code, onBack, onStarted }: FixedArgs) {
  const services = useQuery({ queryKey: fixedKeys.catalogue, queryFn: fetchServices, staleTime: 0 });
  const service = services.data?.find((s) => s.code === code);
  const ok = startable(service) ? service : null;
  const priceKobo = ok ? ok.priceNaira * 100 : null;
  const fee = useQuery({
    queryKey: fixedKeys.fee(priceKobo ?? 0),
    queryFn: () => fetchPurchaseFee(priceKobo as number),
    enabled: priceKobo !== null,
    retry: false,
  });

  const [typed, setTyped] = useState('');
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const tapping = useRef(false);
  // The request that was made: a second Continue after a lost answer reads it again instead of starting another.
  const made = useRef<string | null>(null);
  const choice = nameChoice(typed);

  const totalKobo = fee.data ? fee.data.totalKobo : null;
  const label = totalKobo === null ? 'Continue' : `Continue · ${formatNaira(totalKobo)}`;

  const go = async () => {
    if (tapping.current || !ok || !choice) return;
    tapping.current = true;
    setStarting(true);
    setProblem(null);
    try {
      if (made.current === null) made.current = (await startRequest(ok.code, { firstNameChoice: choice })).id;
      onStarted(made.current);
    } catch (error) {
      setProblem(sentence(error, 'We could not start your request. Check your connection and try again.'));
    } finally {
      tapping.current = false;
      setStarting(false);
    }
  };

  let body;
  if (services.isPending) {
    body = (
      <View testID="legal-fixed-loading" accessibilityLabel="Loading" style={styles.loading}>
        <Skeleton height={m.headTile} width={m.headTile} radius={m.headTile / 2} />
        <Skeleton height={140} radius={m.mediumCorner} />
      </View>
    );
  } else if (services.isError) {
    body = (
      <ErrorState
        testID="legal-fixed-error"
        title="We couldn't load this service"
        message={sentence(services.error, 'Check your connection, then try again.')}
        onRetry={() => void services.refetch()}
      />
    );
  } else if (!ok) {
    body = (
      <EmptyState
        testID="legal-fixed-unavailable"
        icon="FileText"
        title="This service isn't open right now"
        message="It cannot be started from the app at the moment. Check back soon."
      />
    );
  } else {
    body = (
      <>
        <View style={styles.head}>
          <IconTile icon={iconOf(ok)} tone="accent" size={m.headTile} />
          <Text variant="body" accessibilityRole="header" style={[font(700), styles.title]}>
            {ok.name}
          </Text>
          {ok.blurb ? <Text variant="muted" style={styles.centre}>{ok.blurb}</Text> : null}
        </View>
        <GroupedList testID="legal-fixed-card">
          <KeyValueRow label="Price" value={<Money minorUnits={ok.priceNaira * 100} size={text.kvValue.fontSize} decimals={false} />} />
          {fee.data ? (
            <>
              <KeyValueRow label={BANK_CHARGE} value={<Money minorUnits={fee.data.fee.providerFeeKobo} size={text.kvValue.fontSize} decimals={fee.data.fee.providerFeeKobo % 100 !== 0} />} />
              {fee.data.fee.wawuFeeKobo > 0 ? (
                <KeyValueRow label={WAWU_FEE} value={<Money minorUnits={fee.data.fee.wawuFeeKobo} size={text.kvValue.fontSize} decimals={fee.data.fee.wawuFeeKobo % 100 !== 0} />} />
              ) : null}
              <KeyValueRow label="Total" value={<Money minorUnits={fee.data.totalKobo} size={text.kvValue.fontSize} decimals={fee.data.totalKobo % 100 !== 0} />} testID="legal-fixed-total" />
            </>
          ) : null}
        </GroupedList>
        <TextField
          label="First name choice"
          value={typed}
          onChangeText={(value) => {
            setTyped(value);
            setProblem(null);
          }}
          autoCapitalize="words"
          disabled={starting}
          testID="legal-fixed-name"
        />
        {problem ? <Banner tone="danger" title="Not started" body={problem} testID="legal-fixed-problem" /> : null}
      </>
    );
  }

  return (
    <LegalFrame
      title={ok?.name ?? 'Your request'}
      onBack={onBack}
      keyboard
      testID="legal-fixed"
      foot={ok ? <Button label={label} onPress={() => void go()} disabled={choice === null} loading={starting} full testID="legal-fixed-continue" /> : undefined}
    >
      {body}
    </LegalFrame>
  );
}

const styles = StyleSheet.create({
  loading: { gap: space.lg, alignItems: 'center' },
  head: { alignItems: 'center', gap: m.headGap, paddingTop: m.headTop },
  title: { fontSize: m.headTitle, textAlign: 'center' },
  centre: { textAlign: 'center' },
});
