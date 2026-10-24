import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card as Surface } from '@/components/Card';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { formatMoney } from '@/components/Money';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { PayPinSheet, type Credential, type Settled } from '@/features/device-approval';
import { isApprovalStop } from '@/features/device-approval';
import { attemptFor, dropAttempt, keepAttempt, type Attempt } from '@/features/money-attempt/attempts';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { font, radius, space, useWawu } from '@/theme';

import { cardQuoteKey, cardsKey, createCard, fetchCardQuote, type CardKind } from './api';
import { CardArt } from './CardArt';
import { feeRows, getButtonLabel, KIND_ROWS, WORDS } from './model';
import { settleStop } from './settle';

const SUBJECT = 'card:new';
const BODY_GAP = 14;

export type GetCardScreenProps = {
  onBack?: () => void;
  /** The card was made (or is being confirmed): its screen. */
  onDone: (cardId: string) => void;
  onOpenWallet: () => void;
  onSetPin: () => void;
  onForgotPin: () => void;
  /** Inside the list's empty state there is no bar of its own. */
  bare?: boolean;
};

/**
 * W29 · Get a card, for what Nuvion issues today (R-84): a virtual or a single-use dollar card. The Physical choice and its delivery (W30)
 * are not drawn: Nuvion has no physical card. The fee is the quote's (the bank's charge, plus WAWU's when there is one), taken from the wallet
 * when the card is made. The PIN or the phone's fingerprint approves it; one Idempotency-Key per attempt, kept across a wrong PIN and an answer
 * that never came, so one card is made.
 */
export function GetCardScreen(props: GetCardScreenProps) {
  const owner = useSessionAccount(undefined);
  const client = useQueryClient();
  const { colors } = useWawu();
  const [kind, setKind] = useState<CardKind>('virtual');
  const [pinOpen, setPinOpen] = useState(false);
  const [locked, setLocked] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const quote = useQuery(
    {
      queryKey: cardQuoteKey,
      queryFn: fetchCardQuote,
      staleTime: 0,
      enabled: Boolean(owner),
      retry: false,
    },
    queryClient,
  );

  const run = async (credential: Credential): Promise<Settled> => {
    const earlierTry = attemptFor(SUBJECT) !== null;
    const sending: Attempt<{ kind: CardKind }> = attemptFor<{ kind: CardKind }>(SUBJECT) ?? {
      subject: SUBJECT,
      key: newRequestKey(),
      quote: { kind },
      phase: 'sent',
      paymentId: null,
    };
    keepAttempt(sending);
    const outcome = await createCard({
      kind: sending.quote.kind,
      key: sending.key,
      ...credential,
    });
    if (outcome.kind === 'done') {
      dropAttempt(SUBJECT, sending.key);
      setPinOpen(false);
      void client.invalidateQueries({ queryKey: cardsKey });
      void client.invalidateQueries({ queryKey: ['money'] });
      props.onDone(outcome.value.id);
      return { code: 'approved' };
    }
    if (outcome.kind === 'unanswered') {
      // Nothing proves no card was made: the attempt stays, and the next try is the same request.
      return { code: 'unanswered' };
    }
    if (!isApprovalStop(outcome)) dropAttempt(SUBJECT, sending.key);
    return settleStop(outcome, earlierTry, {
      onSetPin: props.onSetPin,
      onOpenWallet: props.onOpenWallet,
      say: setNotice,
      locked: setLocked,
      closeSheet: () => setPinOpen(false),
    });
  };

  const frameProps = {
    title: WORDS.title,
    onBack: props.onBack,
    gap: BODY_GAP,
    idPrefix: 'get-card',
  } as const;
  const inner = (
    <>
      <CardArt kind={kind} status="active" testID="get-card-art" />
      <View style={styles.words}>
        <Text variant="h2" accessibilityRole="header">
          {WORDS.getTitle}
        </Text>
        <Text variant="secondary">{WORDS.getBody}</Text>
      </View>
      {quote.isPending ? (
        <LoadingView label="Checking the card fee" testID="get-card-loading">
          <Skeleton height={64} radius={radius.card} />
          <Skeleton height={64} radius={radius.card} />
        </LoadingView>
      ) : quote.isError ? (
        <ErrorState
          testID="get-card-error"
          title="We couldn’t check the card fee"
          message={isApiError(quote.error) && quote.error.message ? quote.error.message : 'Check your connection and try again.'}
          onRetry={() => void quote.refetch()}
        />
      ) : !quote.data.enabled ? (
        <EmptyState testID="get-card-off" icon="CreditCard" title={WORDS.off} message="Check again later." />
      ) : (
        <>
          <View accessibilityRole="radiogroup" style={styles.kinds}>
            {KIND_ROWS.filter((row) => quote.data.kinds.includes(row.kind)).map((row) => {
              const on = row.kind === kind;
              return (
                <Pressable
                  key={row.kind}
                  testID={`get-card-kind-${row.kind}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setKind(row.kind)}
                  style={[
                    styles.kind,
                    {
                      backgroundColor: colors.surfaceCard,
                      borderColor: on ? colors.borderAccent : colors.borderHairline,
                    },
                  ]}
                >
                  <IconTile icon={row.icon} tone={on ? 'accent' : 'neutral'} size={44} />
                  <View style={styles.kindWords}>
                    <Text variant="body" style={font(700)}>
                      {row.title}
                    </Text>
                    <Text variant="secondary">{row.line}</Text>
                  </View>
                  {on ? <Icon name="CircleCheck" size={22} color={colors.accent} /> : <View style={[styles.radio, { borderColor: colors.borderStrong }]} />}
                </Pressable>
              );
            })}
          </View>
          <Surface style={styles.fee} testID="get-card-fee">
            {feeRows(quote.data.fee).map((row) => (
              <View key={row.label} style={styles.feeRow}>
                <Text variant="secondary">{row.label}</Text>
                <Text variant="body">{formatMoney(row.kobo)}</Text>
              </View>
            ))}
            <View style={styles.feeRow}>
              <Text variant="body" style={font(700)}>
                {WORDS.total}
              </Text>
              <Text variant="body" style={font(700)} testID="get-card-total">
                {formatMoney(quote.data.fee.totalFeeKobo)}
              </Text>
            </View>
            <Text variant="caption">{WORDS.feeNote}</Text>
          </Surface>
          {!quote.data.canCreate ? (
            <Text variant="errorLine" testID="get-card-blocked">
              {quote.data.limits.activeNow >= quote.data.limits.maxActive ? WORDS.limitReached : WORDS.off}
            </Text>
          ) : null}
        </>
      )}
    </>
  );

  const ready = quote.isSuccess && quote.data.enabled;
  return (
    <>
      {props.bare ? (
        <View style={styles.bare}>{inner}</View>
      ) : (
        <ScreenFrame {...frameProps} testID="get-card-screen">
          {inner}
        </ScreenFrame>
      )}
      {ready ? (
        <View style={styles.foot}>
          <Button testID="get-card-button" label={getButtonLabel(kind)} size="lg" full disabled={!quote.data.canCreate} onPress={() => setPinOpen(true)} />
        </View>
      ) : null}
      <PayPinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        approval={ready ? { totalKobo: quote.data.fee.totalFeeKobo, purpose: 'your card' } : { purpose: 'your card' }}
        run={run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          setPinOpen(false);
          props.onForgotPin();
        }}
        lockedUntil={locked}
      />
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="get-card-notice" /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  words: { gap: space.sm },
  kinds: { gap: space.md },
  kind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
    borderWidth: 1.5,
  },
  kindWords: { flex: 1, gap: space.xs },
  radio: { width: 22, height: 22, borderRadius: radius.chip, borderWidth: 2 },
  fee: { padding: space.lg, gap: space.md },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foot: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    paddingTop: space.md,
  },
  bare: { gap: BODY_GAP, paddingHorizontal: space.xl },
});
