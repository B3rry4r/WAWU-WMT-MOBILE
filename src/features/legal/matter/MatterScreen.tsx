import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { formatNaira, shortfallKobo } from '@/components/pay-sheet';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { ListSection } from '@/components/ListRow';
import { addToCalendar } from '@/features/events/calendar';

import { matterMetrics as m } from '../look2';
import { fetchBooking, fetchDeliverables, fetchLetter, fetchRequest, matterKeys, signLetter, type LegalRequest } from './api';
import { PayPin } from '../pay/PaySheets';
import { useLegalFeePay, type FeePayArgs } from '../pay/useLegalFeePay';
import { LegalFrame } from '../ui';
import { askOf, consultationBooked, signableName, stepsOf } from './model';
import { DocumentsCard, FeeCard, GoodNote, LetterSheet, QuoteCard, Steps, WalletCard } from './parts';

export type MatterArgs = {
  requestId: string;
  onBack: () => void;
  wallet: Pick<FeePayArgs, 'onOpenWallet' | 'onSetPin' | 'onForgotPin' | 'onAddMoney'>;
};

/** How often a matter that is still moving is read again (our own records). PROVISIONAL(LEGAL-MATTER-POLL, owner=LEGAL-04, why=no ruling sizes it; the live connection carries no legal frame for a request). */
const REFRESH_MS = 15000;

const sentence = (error: unknown, fallback: string) => (isApiError(error) && error.message ? error.message : fallback);

/**
 * S20 to S23: one legal matter, tracked. The steps are drawn from what the Hub records on the matter (a consultation booked and paid, a quote, a signed
 * letter, a paid fee, delivered files), and the one thing the matter asks of the person is drawn under them: add the consultation to the calendar (S20), read
 * and sign the letter (S21), pay to start (S22), open the documents (S23). A fixed-price matter (S26) runs the same way without the consultation.
 */
export function MatterScreen({ requestId, onBack, wallet }: MatterArgs) {
  const client = useQueryClient();
  const request = useQuery({
    queryKey: matterKeys.request(requestId),
    queryFn: () => fetchRequest(requestId),
    staleTime: 0,
    refetchInterval: (query) => {
      const r = query.state.data;
      return r && (r.deliveredAt !== null || r.status === 'cancelled') ? false : REFRESH_MS;
    },
  });
  const data = request.data;
  const ask = data ? askOf(data) : null;

  const pay = useLegalFeePay({
    requestId,
    onPaid: () => void client.invalidateQueries({ queryKey: matterKeys.request(requestId) }),
    ...wallet,
  });

  // S22 draws the fee before anything is tapped, so the quote is asked for as soon as the letter is signed. It is asked for again whenever the
  // matter moves under the page (a new quote, a new status): the fee drawn is dropped and the page shows what the Hub answers now.
  const { reload } = pay;
  const wantsFee = ask === 'pay';
  const shape = data ? `${data.status}|${data.quoteAmount}|${data.contractSignedAt ?? ''}` : '';
  useEffect(() => {
    if (wantsFee) void reload();
  }, [wantsFee, shape, reload]);

  const booking = useQuery({
    queryKey: ['legal', 'booking', requestId],
    queryFn: () => fetchBooking(requestId),
    enabled: Boolean(data && consultationBooked(data) && data.scheduledFor),
  });
  const documents = useQuery({
    queryKey: matterKeys.deliverables(requestId),
    queryFn: () => fetchDeliverables(requestId),
    enabled: Boolean(data && data.deliveredAt !== null),
  });

  const [name, setName] = useState('');
  const [letterOpen, setLetterOpen] = useState(false);
  const letter = useQuery({ queryKey: matterKeys.letter(requestId), queryFn: () => fetchLetter(requestId), enabled: letterOpen });
  const [signing, setSigning] = useState(false);
  const [signProblem, setSignProblem] = useState<string | null>(null);
  const [calendarFailed, setCalendarFailed] = useState(false);
  const tapping = useRef(false);

  const signed = signableName(name);
  const sign = async () => {
    if (tapping.current || !signed) return;
    tapping.current = true;
    setSigning(true);
    setSignProblem(null);
    try {
      client.setQueryData<LegalRequest>(matterKeys.request(requestId), await signLetter(requestId, signed));
    } catch (error) {
      setSignProblem(sentence(error, 'We could not sign it. Check your connection and try again.'));
      void request.refetch();
    } finally {
      tapping.current = false;
      setSigning(false);
    }
  };

  const calendar = async () => {
    if (!data?.scheduledFor) return;
    const start = new Date(data.scheduledFor).getTime();
    const minutes = booking.data?.minutes ?? null;
    const ok = await addToCalendar({
      name: `${data.serviceName} consultation`,
      startsAt: data.scheduledFor,
      endsAt: minutes === null ? null : new Date(start + minutes * 60_000).toISOString(),
      timezone: 'Africa/Lagos',
      location: '',
      venueName: null,
    });
    setCalendarFailed(!ok);
  };

  let body;
  let foot;
  if (request.isPending) {
    body = <Loading />;
  } else if (!data) {
    body = (
      <ErrorState
        testID="legal-matter-error"
        title={isApiError(request.error) && request.error.kind === 'not_found' ? "We couldn't find this request" : "We couldn't open this request"}
        message={sentence(request.error, 'Check your connection, then try again.')}
        onRetry={() => void request.refetch()}
      />
    );
  } else {
    const quotePayment = pay.quote?.payment ?? null;
    const short = quotePayment && pay.wallet.kind === 'open' ? shortfallKobo(quotePayment.totalKobo, pay.wallet.balanceKobo) : 0;
    body = (
      <>
        {consultationBooked(data) ? <GoodNote testID="legal-booked-note" text="Consultation booked." /> : null}
        {data.status === 'cancelled' ? (
          <Banner tone="warning" title="This request was closed" body={data.cancellationReason ?? 'It is no longer open.'} testID="legal-cancelled" />
        ) : null}
        <Steps steps={stepsOf(data)} />
        {consultationBooked(data) && data.scheduledFor ? (
          <>
            <Button label="Add to calendar" onPress={() => void calendar()} variant="secondary" icon="CalendarPlus" full testID="legal-add-calendar" />
            {calendarFailed ? <Banner tone="danger" title="We couldn't open your calendar" body="Try again, or add it by hand." testID="legal-calendar-failed" /> : null}
          </>
        ) : null}
        {ask === 'sign' && data.quoteAmount !== null ? (
          <>
            <QuoteCard
              quoteKobo={data.quoteAmount * 100}
              name={name}
              onName={(value) => {
                setName(value);
                setSignProblem(null);
              }}
              onRead={() => setLetterOpen(true)}
              disabled={signing}
            />
            {signProblem ? <Banner tone="danger" title="Not signed" body={signProblem} testID="legal-sign-problem" /> : null}
          </>
        ) : null}
        {ask === 'pay' ? (
          <>
            {quotePayment ? (
              <FeeCard signedAs={data.contractSignedAs} priceKobo={quotePayment.priceKobo} fees={pay.fees} totalKobo={quotePayment.totalKobo} />
            ) : pay.loading || (!pay.problem && !pay.noWallet) ? (
              <Skeleton height={m.stepPadY * 2 + 124} radius={m.mediumCorner} testID="legal-fee-loading" />
            ) : null}
            {quotePayment || pay.noWallet ? <WalletCard wallet={pay.noWallet ? { kind: 'none' } : pay.wallet} /> : null}
            {pay.problem ? (
              <Banner tone="danger" title={pay.unpayable ? 'Nothing to pay right now' : "We couldn't ask for the price"} body={pay.problem} testID="legal-fee-problem" />
            ) : null}
            {pay.notice ? <Banner tone="warning" title="Check the total" body={pay.notice} testID="legal-fee-notice" /> : null}
            {short > 0 && pay.status.kind === 'review' && pay.wallet.kind === 'open' && quotePayment ? (
              <Banner
                tone="warning"
                icon="Wallet"
                title="Not enough in your Naira wallet"
                body={`This costs ${formatNaira(quotePayment.totalKobo)}. You have ${formatNaira(pay.wallet.balanceKobo, 'always')}.`}
                testID="legal-fee-short"
              />
            ) : null}
            {pay.status.kind === 'failed' ? (
              <Banner tone="danger" title="Payment didn't go through" body={pay.status.message ?? 'Nothing was kept. Check your wallet before you try again.'} testID="legal-fee-failed" />
            ) : null}
            {pay.status.kind === 'confirming' ? (
              <Banner tone="info" title="Still confirming" body={pay.status.line ?? "Don't pay again."} testID="legal-fee-confirming" />
            ) : null}
            {pay.status.kind === 'blocked' ? <Banner tone="warning" title={pay.status.title} body={pay.status.message} testID="legal-fee-blocked" /> : null}
          </>
        ) : null}
        {data.deliveredAt !== null ? (
          <ListSection title="Your documents">
            {documents.isSuccess && documents.data.items.length > 0 ? (
              <DocumentsCard items={documents.data.items} />
            ) : documents.isError ? (
              <ErrorState testID="legal-documents-error" title="We couldn't load the documents" message="Check your connection, then try again." onRetry={() => void documents.refetch()} />
            ) : documents.isPending ? (
              <Skeleton height={64} radius={m.mediumCorner} testID="legal-documents-loading" />
            ) : null}
          </ListSection>
        ) : null}
      </>
    );

    if (ask === 'sign') {
      foot = <Button label="Sign this agreement" onPress={() => void sign()} disabled={signed === null} loading={signing} full testID="legal-sign" />;
    } else if (ask === 'pay') {
      // The Hub says nothing can be paid now: no Pay is drawn, not even a greyed one.
      if (pay.unpayable) foot = undefined;
      else if (pay.noWallet) foot = <Button label="Open your wallet" onPress={wallet.onOpenWallet} full testID="legal-open-wallet" />;
      else if (pay.confirming) foot = <Button label="Refresh" onPress={pay.refresh} icon="RotateCcw" variant="secondary" full testID="legal-fee-refresh" />;
      else if (short > 0 && quotePayment && pay.status.kind === 'review') foot = <Button label={`Add ${formatNaira(short)}`} onPress={() => pay.addMoney(short)} icon="Plus" full testID="legal-add-money" />;
      else if (pay.status.kind === 'failed' || pay.status.kind === 'blocked') {
        foot = <Button label="Try again" onPress={pay.tryAgain} full testID="legal-fee-retry" />;
      } else {
        foot = (
          <Button
            label={quotePayment ? `Pay ${formatNaira(quotePayment.totalKobo)} to start` : 'Pay to start'}
            onPress={() => void pay.pay()}
            disabled={!quotePayment}
            loading={pay.loading && !quotePayment}
            full
            testID="legal-pay-start"
          />
        );
      }
    }
  }

  return (
    <>
      <LegalFrame title={data?.serviceName ?? 'Your request'} onBack={onBack} foot={foot} keyboard testID="legal-matter">
        {body}
      </LegalFrame>
      <LetterSheet visible={letterOpen} onClose={() => setLetterOpen(false)} letter={letter.data} failed={letter.isError} onRetry={() => void letter.refetch()} />
      <PayPin pay={pay} />
    </>
  );
}

function Loading() {
  return (
    <View testID="legal-matter-loading" accessibilityLabel="Loading" style={styles.loading}>
      <Skeleton height={m.stepDisc * 5 + m.stepPadY * 10 + m.trackPadY * 2} radius={m.mediumCorner} />
    </View>
  );
}

const styles = StyleSheet.create({ loading: { gap: m.cardsGap } });
