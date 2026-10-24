import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { PayPinSheet, type Credential, type Settled } from '@/features/device-approval';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { font, radius, space, useWawu } from '@/theme';

import {
  blockCard,
  cardKey,
  cardsKey,
  cardTransactionsKey,
  fetchCard,
  fetchCardTransactions,
  freezeCard,
  revealCard,
  unfreezeCard,
  type CardDetails,
} from './api';
import { CardArt } from './CardArt';
import { kindTitle, REVEAL_MS, statusLine, transactionAmount, transactionTitle, whenLine, WORDS } from './model';
import { settleStop } from './settle';

const BODY_GAP = 16;
/** How often a card that is still being made is read again. Default (agent), owner may override. */
const POLL_MS = 5000;

export type CardScreenProps = {
  id: string;
  onBack: () => void;
  onOpenWallet: () => void;
  onSetPin: () => void;
  onForgotPin: () => void;
  /** The card is blocked or gone: back to the list. */
  onGone: () => void;
};

type Sheet = 'reveal' | 'unfreeze' | null;

/**
 * W31 · Card detail and W32 · Card frozen, for the card Nuvion issues (R-84). Freeze needs no PIN (a lost card is stopped at once); Details
 * and Unfreeze ask for the PIN or the phone's fingerprint each time. The number, expiry and CVV are read from the issuer when the PIN is
 * given, held in this screen's memory only while they show (30 seconds, or until the screen goes), and never stored. Block is for good: the
 * issuer deletes the card. Not drawn, because Nuvion serves nothing behind them: the Physical tab, Card PIN, Limits and the channel switches
 * (W33, W34), and ATM spending.
 */
export function CardScreen(props: CardScreenProps) {
  const { id } = props;
  const owner = useSessionAccount(undefined);
  const client = useQueryClient();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shown, setShown] = useState<CardDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = useQuery(
    {
      queryKey: cardKey(id),
      queryFn: () => fetchCard(id),
      enabled: Boolean(owner),
      staleTime: 0,
      refetchInterval: (query) => (query.state.data?.status === 'pending' ? POLL_MS : false),
    },
    queryClient,
  );
  const status = card.data?.status;
  const usable = status === 'active' || status === 'frozen';
  const spending = useQuery(
    {
      queryKey: cardTransactionsKey(id),
      queryFn: () => fetchCardTransactions(id),
      enabled: Boolean(owner) && usable,
      staleTime: 0,
    },
    queryClient,
  );

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setShown(null);
  }, []);
  // The details go when the screen goes (and are drawn only while the card is usable).
  useEffect(() => hide, [hide]);

  const afterChange = useCallback(() => {
    void client.invalidateQueries({ queryKey: cardKey(id) });
    void client.invalidateQueries({ queryKey: cardsKey });
  }, [client, id]);

  const hooks = {
    onSetPin: props.onSetPin,
    onOpenWallet: props.onOpenWallet,
    say: setNotice,
    locked: setLocked,
    closeSheet: () => setSheet(null),
  };

  const run = async (credential: Credential): Promise<Settled> => {
    if (sheet === 'reveal') {
      const outcome = await revealCard(id, credential);
      if (outcome.kind === 'done') {
        setSheet(null);
        setShown(outcome.value);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(hide, REVEAL_MS);
        return { code: 'approved' };
      }
      return settleStop(outcome, false, hooks);
    }
    const outcome = await unfreezeCard(id, credential);
    if (outcome.kind === 'done') {
      setSheet(null);
      client.setQueryData(cardKey(id), outcome.value);
      afterChange();
      return { code: 'approved' };
    }
    return settleStop(outcome, false, hooks);
  };

  const reason = (error: unknown): string => (isApiError(error) && error.message ? error.message : 'That was not done. Check your connection and try again.');

  const freeze = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const done = await freezeCard(id);
      hide();
      client.setQueryData(cardKey(id), done);
      afterChange();
    } catch (error) {
      setNotice(reason(error));
    } finally {
      setBusy(false);
    }
  };

  const block = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const done = await blockCard(id);
      hide();
      setBlockOpen(false);
      client.setQueryData(cardKey(id), done);
      afterChange();
    } catch (error) {
      setBlockOpen(false);
      setNotice(reason(error));
    } finally {
      setBusy(false);
    }
  };

  const frame = {
    title: WORDS.title,
    onBack: props.onBack,
    gap: BODY_GAP,
    idPrefix: 'card',
  } as const;

  if (card.isPending) {
    return (
      <ScreenFrame {...frame} testID="card-screen">
        <LoadingView label="Loading your card" testID="card-loading">
          <Skeleton height={200} radius={radius.card} />
          <Skeleton height={64} radius={radius.card} />
        </LoadingView>
      </ScreenFrame>
    );
  }
  if (card.isError) {
    const gone = isApiError(card.error) && card.error.status === 404;
    return (
      <ScreenFrame {...frame} testID="card-screen">
        <ErrorState
          testID="card-error"
          title={gone ? 'We couldn’t find that card' : 'We couldn’t load your card'}
          message={reason(card.error)}
          onRetry={gone ? props.onGone : () => void card.refetch()}
        />
      </ScreenFrame>
    );
  }

  const c = card.data;
  const frozen = c.status === 'frozen';
  return (
    <>
      <ScreenFrame {...frame} testID="card-screen">
        <CardArt
          kind={c.kind}
          status={c.status}
          last4={c.last4}
          shown={usable && shown ? { ...shown, holder: shown.cardholderName } : null}
          testID="card-art"
        />
        <View style={styles.statusLine}>
          <StatusPill
            testID="card-status"
            label={statusLine(c)}
            tone={c.status === 'active' ? 'positive' : c.status === 'frozen' ? 'info' : c.status === 'blocked' ? 'danger' : 'warning'}
            icon={c.status === 'active' ? 'Check' : c.status === 'frozen' ? 'Snowflake' : c.status === 'blocked' ? 'Ban' : 'Clock'}
          />
          <Text variant="secondary">
            {kindTitle(c.kind)} · {WORDS.spendsFrom}
          </Text>
        </View>
        {c.status === 'pending' ? <Banner tone="info" title={WORDS.pendingTitle} body={c.statusMessage ?? ''} testID="card-pending" /> : null}
        {c.status === 'blocked' ? <Banner tone="danger" title={WORDS.blockedTitle} body={WORDS.blockedBody} testID="card-blocked" /> : null}
        {frozen ? (
          <>
            <Banner
              tone="info"
              icon="Snowflake"
              title={WORDS.frozenTitle}
              body={c.frozenBySupport ? 'Support has frozen this card. Contact support to use it again.' : WORDS.frozenBody}
              testID="card-frozen"
            />
            {c.frozenBySupport ? null : <Button testID="card-unfreeze" label={WORDS.unfreeze} icon="Sun" size="lg" full onPress={() => setSheet('unfreeze')} />}
          </>
        ) : null}
        {c.status === 'active' ? (
          <View style={styles.actions}>
            <Action testID="card-freeze" icon="Snowflake" label={WORDS.freeze} onPress={() => void freeze()} disabled={busy} />
            {shown ? (
              <Action testID="card-hide" icon="EyeOff" label={WORDS.hideDetails} onPress={hide} />
            ) : (
              <Action testID="card-details" icon="Eye" label={WORDS.details} onPress={() => setSheet('reveal')} />
            )}
          </View>
        ) : null}
        {usable ? (
          <View style={styles.spending}>
            <Text variant="h3" accessibilityRole="header">
              {WORDS.spending}
            </Text>
            {spending.isPending ? (
              <Skeleton height={56} radius={radius.card} />
            ) : spending.isError ? (
              <ErrorState
                testID="card-spending-error"
                title="We couldn’t load your card payments"
                message={reason(spending.error)}
                onRetry={() => void spending.refetch()}
              />
            ) : spending.data.items.length === 0 ? (
              <Text variant="secondary" testID="card-spending-empty">
                {WORDS.noSpending}
              </Text>
            ) : (
              spending.data.items.map((t) => (
                <View key={t.id} style={styles.txn} testID={`card-txn-${t.id}`}>
                  <IconTile icon={t.kind === 'purchase' ? 'ShoppingBag' : 'Wallet'} tone={t.kind === 'purchase' ? 'neutral' : 'in'} size={44} />
                  <View style={styles.txnWords}>
                    <Text variant="body" numberOfLines={1} style={font(700)}>
                      {transactionTitle(t)}
                    </Text>
                    <Text variant="secondary" numberOfLines={1}>
                      {t.place ?? ''}
                    </Text>
                  </View>
                  <View style={styles.txnEnd}>
                    <Text variant="body" tone={t.kind === 'purchase' ? 'textPrimary' : 'success'} style={font(700)}>
                      {transactionAmount(t)}
                    </Text>
                    <Text variant="secondary">{whenLine(t.occurredAt, new Date())}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
        {c.status === 'active' || frozen ? (
          <Pressable testID="card-block" accessibilityRole="button" onPress={() => setBlockOpen(true)} style={styles.blockLink}>
            <Text variant="body" tone="danger" style={font(600)}>
              {WORDS.block}
            </Text>
          </Pressable>
        ) : null}
      </ScreenFrame>
      <PayPinSheet
        visible={sheet !== null}
        onClose={() => setSheet(null)}
        approval={{
          purpose: sheet === 'unfreeze' ? 'Unfreeze your card' : 'Show your card details',
        }}
        run={run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          setSheet(null);
          props.onForgotPin();
        }}
        lockedUntil={locked}
      />
      <BottomSheet visible={blockOpen} onClose={() => setBlockOpen(false)} label={WORDS.blockSheetTitle} dismissible={!busy}>
        <Text variant="sheetTitle" accessibilityRole="header">
          {WORDS.blockSheetTitle}
        </Text>
        <Text variant="secondary">{WORDS.blockSheetBody}</Text>
        <Button testID="card-block-confirm" label={WORDS.blockConfirm} size="lg" full loading={busy} onPress={() => void block()} />
        <Button testID="card-block-keep" label={WORDS.keep} variant="outline" size="lg" full disabled={busy} onPress={() => setBlockOpen(false)} />
      </BottomSheet>
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="card-notice" /> : null}
    </>
  );
}

function Action({
  icon,
  label,
  onPress,
  disabled,
  testID,
}: {
  icon: 'Snowflake' | 'Eye' | 'EyeOff';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID: string;
}) {
  const { colors } = useWawu();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, disabled ? styles.dim : null]}
    >
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderHairline,
          },
        ]}
      >
        <Icon name={icon} size={24} color={colors.textPrimary} />
      </View>
      <Text variant="secondary" style={font(600)}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    flexWrap: 'wrap',
  },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  action: { alignItems: 'center', gap: space.sm, minWidth: 80 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.5 },
  spending: { gap: space.md },
  txn: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  txnWords: { flex: 1, gap: space.xs },
  txnEnd: { alignItems: 'flex-end', gap: space.xs },
  blockLink: { alignItems: 'center', paddingVertical: space.md },
});
