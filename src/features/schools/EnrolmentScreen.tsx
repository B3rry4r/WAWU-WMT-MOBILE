import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import { PaySheet } from '@/components/pay-sheet';
import { formatNaira } from '@/components/pay-sheet/money';
import { PAYMENT_UNANSWERED_LINE, PinSheet } from '@/components/pin-sheet';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { WALLET_NAME } from '@/features/events/buyModel';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { fetchMe, settingsKeys } from '@/features/settings/api/hub';
import { useSignedIn } from '@/features/settings/sessionGuard';
import { canvasNormalLineHeight, font, layout, space, useWawu } from '@/theme';

import { enrolKeys, fetchEnrolment, type Enrolment } from './enrolApi';
import { classRow, CLOSED_LINE, CLOSED_TITLE, CONFIRMING_LINE, CONFIRMING_TITLE, enrolledLine, REFUNDED_TITLE, shareText, shortDay } from './enrolModel';
import { DetailRow, DetailsCard, EnrolBar, enrolMetrics } from './enrolParts';
import { useEnrolPay } from './useEnrolPay';

export type EnrolmentScreenProps = {
  id: string;
  /** Back, and Android's back: where the person came from. */
  onBack: () => void;
  /** SC7's My courses (SC8). */
  onMyCourses: () => void;
  /** A place that went back: the course, to pick a class again. */
  onCourse: (courseId: string) => void;
  /** No wallet yet (R-6): Open your wallet. */
  onOpenWallet: () => void;
  /** No PIN is set yet: A9 sets one. */
  onSetPin: () => void;
  /** Forgot PIN? (W37). */
  onForgotPin: () => void;
  /** Add money for the shortfall (kobo). */
  onAddMoney: (shortfallKobo: number) => void;
};

const RECEIPT = { partGap: 18, mark: 88, headGap: 10, headTop: 70, title: 30, titleTracking: -0.035, sub: 14.5, paid: 14.5, note: 14 } as const;

/**
 * One enrolment, by what the Hub says it is: SC5 and SC6 (the pay sheet, then the PIN sheet, over the "Enroll" page) while a place
 * is held and unpaid, still-confirming while the Hub has a payment it has not finished, SC7 once enrolled, and a plain note when the
 * place went back. Opening it again from My courses reads the same record, so the screen is always what the enrolment is now.
 */
export function EnrolmentScreen(props: EnrolmentScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const read = useQuery({ queryKey: enrolKeys.enrolment(props.id), queryFn: () => fetchEnrolment(props.id) }, queryClient);

  if (read.isPending) {
    return (
      <Frame onBack={props.onBack} insetTop={insets.top} bg={colors.surfacePage}>
        <LoadingView label="Loading your enrolment" testID="enrolment-loading">
          <View style={styles.skeleton}>
            <Skeleton height={96} />
            <Skeleton height={56} />
          </View>
        </LoadingView>
      </Frame>
    );
  }
  if (read.isError) {
    const gone = isApiError(read.error) && (read.error.kind === 'not_found' || read.error.kind === 'validation');
    const offline = isApiError(read.error) && read.error.kind === 'network';
    return (
      <Frame onBack={props.onBack} insetTop={insets.top} bg={colors.surfacePage}>
        {gone ? (
          <EmptyState testID="enrolment-gone" icon="GraduationCap" title="We couldn’t find that enrolment" message="It may belong to another account." />
        ) : (
          <ErrorState
            testID="enrolment-error"
            title="Couldn’t load your enrolment"
            message={offline ? 'No connection. Check your internet and try again.' : isApiError(read.error) && read.error.message ? read.error.message : 'Something went wrong. Try again.'}
            icon={offline ? 'WifiOff' : 'TriangleAlert'}
            onRetry={() => void read.refetch()}
          />
        )}
      </Frame>
    );
  }

  const enrolment = read.data;
  if (enrolment.status === 'enrolled') return <Receipt enrolment={enrolment} onMyCourses={props.onMyCourses} />;
  if (enrolment.status === 'reserved') return <PayView {...props} enrolment={enrolment} />;
  const refunded = enrolment.status === 'refunded';
  return (
    <Frame onBack={props.onBack} insetTop={insets.top} bg={colors.surfacePage} course={enrolment.course.title}>
      <EmptyState
        testID="enrolment-closed"
        icon={refunded ? 'Wallet' : 'CalendarX'}
        title={refunded ? REFUNDED_TITLE : CLOSED_TITLE}
        message={refunded ? refundLine(enrolment) : CLOSED_LINE}
        action={{ label: 'See the course', onPress: () => props.onCourse(enrolment.course.id) }}
      />
    </Frame>
  );
}

/** What a refunded enrolment says: the class filled before the payment landed, and where the money is. */
function refundLine(e: Enrolment): string {
  const back = e.returned.returnedKobo;
  if (e.returned.returned && back !== null) return `We took your payment and the class had no seat left. ${formatNaira(back)} went back to your wallet.`;
  return 'We took your payment and the class had no seat left. Your money is on its way back to your wallet.';
}

type FrameProps = { onBack: () => void; insetTop: number; bg: string; course?: string; children: ReactNode };

/** The bar and what stands in for the page: loading shapes, or the words that say what became of the enrolment. */
function Frame({ onBack, insetTop, bg, course, children }: FrameProps) {
  return (
    <View testID="enrolment-frame" style={[styles.root, { backgroundColor: bg, paddingTop: insetTop }]}>
      <EnrolBar course={course} onBack={onBack} backTestID="enrolment-back" />
      <View style={styles.frameBody}>{children}</View>
    </View>
  );
}

/**
 * SC5 · Pay and SC6 · PIN: the "Enroll" page with the course under its title and the name on a card, the pay sheet over it, and the
 * PIN sheet over that ("Approve ₦150,015.75 to Greenfield Tech Academy"). The PIN sheet steps over the page's words, as SC6 draws
 * it. Closing the pay sheet leaves the page (the place stays held for a while).
 */
function PayView(props: EnrolmentScreenProps & { enrolment: Enrolment }) {
  const { enrolment } = props;
  const insets = useSafeAreaInsets();
  const { colors } = useWawu();
  const signedIn = useSignedIn();
  const me = useQuery({ queryKey: settingsKeys.me, queryFn: fetchMe, enabled: signedIn }, queryClient);
  const pay = useEnrolPay({
    enrolment,
    onLeave: props.onBack,
    onOpenWallet: props.onOpenWallet,
    onSetPin: props.onSetPin,
    onForgotPin: props.onForgotPin,
    onAddMoney: props.onAddMoney,
  });
  const sheet = pay.sheet;
  const name = [me.data?.firstName, me.data?.lastName].filter(Boolean).join(' ');
  const school = enrolment.school.name;
  const when = shortDay(enrolment.intake.startDate);

  return (
    <View testID="enrolment-pay" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <EnrolBar course={sheet?.pinOpen ? undefined : enrolment.course.title} onBack={props.onBack} backTestID="enrolment-back" />
      {pay.confirming ? (
        <View style={styles.frameBody}>
          <EmptyState
            testID="enrolment-confirming"
            icon="Clock"
            title={CONFIRMING_TITLE}
            message={pay.refreshFailed ? 'We could not check just now. Try again in a moment.' : CONFIRMING_LINE}
            action={{ label: pay.refreshing ? 'Checking' : 'Refresh', onPress: pay.refresh }}
          />
        </View>
      ) : (
        <View style={styles.payBody}>
          {sheet?.pinOpen || !name ? null : (
            <DetailsCard testID="enrolment-name-card">
              <DetailRow label="Name" value={name} />
            </DetailsCard>
          )}
          {pay.notice ? (
            <Text variant="errorLine" testID="enrolment-notice" accessibilityRole="alert" onPress={pay.clearNotice}>
              {pay.notice}
            </Text>
          ) : null}
        </View>
      )}
      {sheet ? (
        <>
          <PaySheet
            visible={sheet.payOpen && !sheet.pinOpen}
            item={{ title: enrolment.course.title, subtitle: when === '' ? school : `${school} · starts ${when}` }}
            amountKobo={sheet.payment.priceKobo}
            amountLabel="Course fee"
            fees={sheet.fees}
            wallet={sheet.wallet}
            walletName={WALLET_NAME}
            actionLabel="Pay"
            status={sheet.status}
            onPay={sheet.pay}
            onAddMoney={sheet.addMoney}
            onCancel={sheet.cancel}
            onOpenWallet={sheet.openWallet}
            onRetry={sheet.tryAgain}
          />
          <PinSheet
            visible={sheet.pinOpen}
            onClose={sheet.closePin}
            approval={{ totalKobo: sheet.payment.totalKobo, payee: school }}
            onSubmit={sheet.submitPin}
            unansweredLine={PAYMENT_UNANSWERED_LINE}
            onForgotPin={sheet.forgotPin}
            lockedUntil={sheet.lockedUntil}
          />
        </>
      ) : null}
    </View>
  );
}

/**
 * SC7 · Enrolled: "You're enrolled", the course and its start, then the school, the class, what was paid (the total the wallet was
 * debited, as the Hub recorded it) and the reference, and that the school has the student's details. Share receipt opens the phone's
 * share sheet with the receipt's text and reference (R-33); My courses opens SC8. The "within 2 working days" the canvas draws is a
 * promise nothing backs and is left out (BACKEND_GAPS).
 */
function Receipt({ enrolment, onMyCourses }: { enrolment: Enrolment; onMyCourses: () => void }) {
  const [notice, setNotice] = useState<string | null>(null);
  const paid = enrolment.totalKobo;
  const share = async () => {
    setNotice(null);
    try {
      await Share.share({ message: shareText(enrolment) });
    } catch {
      setNotice('Sharing isn’t available on this device.');
      AccessibilityInfo.announceForAccessibility('Sharing is not available on this device.');
    }
  };
  return (
    <AuthFrame
      testID="enrolment-receipt"
      bare
      footer={
        <View style={styles.footer}>
          {notice ? (
            <Text variant="errorLine" testID="enrolment-share-notice" accessibilityRole="alert">
              {notice}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            <View style={styles.half}>
              <Button testID="enrolment-share" label="Share receipt" variant="secondary" full onPress={() => void share()} />
            </View>
            <View style={styles.half}>
              <Button testID="enrolment-my-courses" label="My courses" full onPress={onMyCourses} />
            </View>
          </View>
        </View>
      }
    >
      <View style={styles.receipt}>
        <View style={styles.head} testID="enrolment-head">
          <IconTile icon="Check" tone="in" size={RECEIPT.mark} strokeWidth={2.2} />
          <Text variant="body" accessibilityRole="header" style={styles.title}>
            You&apos;re enrolled
          </Text>
          <Text variant="body" tone="textSecondary" testID="enrolment-line" style={styles.sub}>
            {enrolledLine(enrolment)}
          </Text>
        </View>
        <GroupedList testID="enrolment-card">
          <KeyValueRow testID="enrolment-school" label="School" value={enrolment.school.name} />
          {classRow(enrolment.intake) === '' ? null : <KeyValueRow testID="enrolment-class" label="Class" value={classRow(enrolment.intake)} />}
          {paid === null ? (
            <KeyValueRow testID="enrolment-fee" label="Course fee" value="Free" />
          ) : (
            <KeyValueRow testID="enrolment-paid" label="Paid" value={<Money minorUnits={paid} size={RECEIPT.paid} weight={600} decimals={paid % 100 !== 0} />} />
          )}
          <KeyValueRow testID="enrolment-reference" label="Reference" value={enrolment.reference} />
        </GroupedList>
        <Text variant="muted" testID="enrolment-note" style={styles.note}>
          {enrolment.school.name} will contact you. We&apos;ve sent them your details.
        </Text>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  frameBody: { flex: 1 },
  skeleton: { paddingHorizontal: layout.gutter, paddingTop: enrolMetrics.bodyTop, gap: enrolMetrics.partGap },
  payBody: { flex: 1, paddingTop: enrolMetrics.bodyTop, paddingHorizontal: layout.gutter, gap: space.md },
  receipt: { gap: RECEIPT.partGap },
  head: { alignItems: 'center', gap: RECEIPT.headGap, paddingTop: RECEIPT.headTop - 56 },
  title: { ...font(700), fontSize: RECEIPT.title, lineHeight: RECEIPT.title * 1.15, letterSpacing: RECEIPT.titleTracking * RECEIPT.title, marginTop: space.sm, textAlign: 'center' },
  sub: { fontSize: RECEIPT.sub, lineHeight: canvasNormalLineHeight(RECEIPT.sub), textAlign: 'center' },
  note: { fontSize: RECEIPT.note, lineHeight: canvasNormalLineHeight(RECEIPT.note) * 1.3, textAlign: 'center' },
  footer: { gap: space.sm },
  buttons: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
});
