import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { formatMoney, Money } from '@/components/Money';
import { feesTotalKobo, PaySheet } from '@/components/pay-sheet';
import { PinSheet } from '@/components/pin-sheet';
import { Text } from '@/components/Text';
import { TOTAL_LABEL, WALLET_LABEL } from '@/features/money-attempt/refusal';
import { WalletRow } from '@/features/money-attempt/WalletRow';
import { space } from '@/theme';

import { REQUEST_CONFIRMING_LINE, type useRequestPay } from './useRequestPay';

const SHEET_GAP = 16;
const ROW_VALUE = 14.5;

type Sheet = NonNullable<ReturnType<typeof useRequestPay>['sheet']>;

export type RequestPaySheetProps = {
  sheet: Sheet;
  /** The person who asked, by their first name: "Pay Kemi", "Kemi gets ₦12,000". */
  name: string;
  /** A line above the button when something moved since the sheet opened (the fees changed). */
  notice: string | null;
};

const naira = (kobo: number) => formatMoney(kobo, { decimals: kobo % 100 !== 0 });

/**
 * I18's review before the PIN (BRIEF I18): paying a request is a send to a Who Made This? user, so the sheet shows what it costs before
 * the PIN: the amount, the bank's charge and WAWU's fee, the total, "Kemi gets ₦12,000" and a button that carries the total.
 * A short wallet, a payment the provider has not confirmed and a refusal are the shared pay sheet's own states.
 */
export function RequestPaySheet({ sheet, name, notice }: RequestPaySheetProps) {
  const { request, quote, fees, status, pinOpen } = sheet;
  const total = quote.totalKobo;
  const pin = (
    <PinSheet
      visible={pinOpen}
      onClose={sheet.closePin}
      approval={{ totalKobo: total, payee: name }}
      onSubmit={sheet.submitPin}
      onForgotPin={sheet.forgotPin}
      lockedUntil={sheet.lockedUntil}
    />
  );

  if (sheet.confirming || status.kind === 'failed' || sheet.shortfallKobo > 0) {
    return (
      <>
        <PaySheet
          visible
          item={{ title: `Request from ${name}`, displayName: name }}
          amountKobo={request.amountKobo}
          amountLabel="Amount"
          fees={fees}
          wallet={sheet.balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo: sheet.balanceKobo }}
          walletName={WALLET_LABEL}
          actionLabel="Pay"
          recipientGetsKobo={request.amountKobo}
          status={sheet.confirming ? { kind: 'confirming', line: REQUEST_CONFIRMING_LINE } : status.kind === 'failed' ? status : { kind: 'review' }}
          onPay={() => void sheet.pay()}
          onAddMoney={sheet.addMoney}
          onCancel={sheet.cancel}
          onRetry={sheet.retry}
          onRefresh={sheet.refresh}
        />
        {pin}
      </>
    );
  }

  const blocked = sheet.limit !== null ? sheet.limit : !sheet.addsUp ? 'We couldn’t work out the total. Close this and try again.' : null;
  return (
    <>
      <BottomSheet visible onClose={sheet.cancel} label={`Pay ${name}`} gap={SHEET_GAP} dismissible={status.kind !== 'paying'} testID="request-pay-sheet">
        <View style={styles.head}>
          <Text variant="sheetTitleSm">{`Pay ${name}`}</Text>
          {request.memo ? <Text variant="muted">{request.memo}</Text> : null}
        </View>
        <GroupedList>
          <KeyValueRow key="amount" label="Amount" value={<Money minorUnits={request.amountKobo} size={ROW_VALUE} decimals />} />
          {fees.map((line) => (
            <KeyValueRow key={line.label} label={line.label} value={<Money minorUnits={line.amountKobo} size={ROW_VALUE} decimals />} />
          ))}
          {fees.length > 1 ? <KeyValueRow key="fees" label="Fees" value={<Money minorUnits={feesTotalKobo(fees)} size={ROW_VALUE} decimals />} /> : null}
          <KeyValueRow key="total" label={TOTAL_LABEL} value={<Money minorUnits={total} size={ROW_VALUE} decimals />} testID="request-total" />
        </GroupedList>
        <WalletRow balanceKobo={sheet.balanceKobo} />
        <Text variant="muted" style={styles.centre} testID="request-gets">
          {`${name} gets ${naira(request.amountKobo)}`}
        </Text>
        {notice ? (
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="request-notice">
            {notice}
          </Text>
        ) : null}
        {blocked ? (
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="request-blocked">
            {blocked}
          </Text>
        ) : null}
        <Button
          testID="request-pay"
          label={`Pay ${naira(total)}`}
          full
          loading={status.kind === 'paying'}
          disabled={blocked !== null || sheet.balanceKobo === null}
          onPress={() => void sheet.pay()}
        />
      </BottomSheet>
      {pin}
    </>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.xs },
  centre: { textAlign: 'center' },
});
