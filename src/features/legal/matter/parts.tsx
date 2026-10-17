import type { ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { CurrencyFlag } from '@/components/CurrencyFlag';
import { ICON_STROKE, Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, ListRow } from '@/components/ListRow';
import { Money } from '@/components/Money';
import type { PayFeeLine, PayWallet } from '@/components/pay-sheet';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { WALLET_NAME } from '@/features/events/buyModel';
import { font, layout, radius, space, text, useWawu } from '@/theme';

import { normal } from '../look';
import { matterMetrics as m } from '../look2';
import type { Deliverable, Letter } from './api';
import type { Step } from './model';

/** `track`: a card holding the steps, one row each. A done step is a green check, the current one an accent dot, the rest a quiet disc. */
export function Steps({ steps }: { steps: readonly Step[] }) {
  const { colors } = useWawu();
  return (
    <Card testID="legal-steps" style={styles.track}>
      {steps.map((step) => (
        <View
          key={step.key}
          testID={`legal-step-${step.key}`}
          accessible
          accessibilityLabel={`${step.title}${step.sub ? `, ${step.sub}` : ''}, ${step.state === 'done' ? 'done' : step.state === 'now' ? 'now' : 'to come'}`}
          style={styles.step}
        >
          <View
            style={[
              styles.disc,
              { backgroundColor: step.state === 'done' ? colors.positiveTint : step.state === 'now' ? colors.accent : colors.surfaceSunken },
            ]}
          >
            {step.state === 'done' ? <Icon name="Check" size={m.stepCheck} color={colors.positive} strokeWidth={2.6} /> : null}
            {step.state === 'now' ? <View style={[styles.dot, { backgroundColor: colors.textOnAccent }]} /> : null}
          </View>
          <View style={styles.flex}>
            <Text variant="body" style={[font(600), { fontSize: m.stepTitle, lineHeight: normal(m.stepTitle) }, step.state === 'todo' ? { color: colors.textMuted } : null]}>
              {step.title}
            </Text>
            {step.sub ? (
              <Text variant="body" tone="textMuted" style={{ fontSize: m.stepSub, lineHeight: normal(m.stepSub), marginTop: m.stepSubTop }}>
                {step.sub}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

/** `booked`: the green note above the steps. */
export function GoodNote({ text: line, testID }: { text: string; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} accessibilityRole="alert" style={[styles.note, { backgroundColor: colors.positiveTint }]}>
      <Icon name="CircleCheck" size={m.noteIcon} color={colors.positive} strokeWidth={2.2} />
      <Text variant="body" style={[font(600), { fontSize: m.noteText, lineHeight: normal(m.noteText) }, styles.flex]}>
        {line}
      </Text>
    </View>
  );
}

type QuoteProps = {
  quoteKobo: number;
  name: string;
  onName: (value: string) => void;
  onRead: () => void;
  error?: string;
  disabled: boolean;
};

/** S21: the quote, "Read letter", and the field the person types their full name into to sign. */
export function QuoteCard({ quoteKobo, name, onName, onRead, error, disabled }: QuoteProps) {
  return (
    <Card padded testID="legal-quote" style={styles.quoteCard}>
      <View style={styles.quoteTop}>
        <View style={styles.flex}>
          <Text variant="body" tone="textMuted" style={{ fontSize: m.quoteLabel, lineHeight: normal(m.quoteLabel) }}>
            Quote
          </Text>
          <View style={{ marginTop: m.quoteFigureTop }}>
            <Money minorUnits={quoteKobo} size={m.quoteFigure} weight={700} decimals={quoteKobo % 100 !== 0} testID="legal-quote-amount" />
          </View>
        </View>
        <Button label="Read letter" onPress={onRead} variant="secondary" size="sm" icon="FileText" testID="legal-read-letter" />
      </View>
      <TextField
        label="Type your full name to sign"
        value={name}
        onChangeText={onName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        error={error}
        disabled={disabled}
        testID="legal-sign-name"
      />
    </Card>
  );
}

/** "Read letter": the engagement letter exactly as the Hub holds it, in a sheet that scrolls. */
export function LetterSheet({ visible, onClose, letter, failed, onRetry }: { visible: boolean; onClose: () => void; letter?: Letter; failed: boolean; onRetry: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Engagement letter" gap={space.md}>
      <Text variant="sheetTitleSm">Engagement letter</Text>
      {failed ? (
        <View style={styles.letterGap}>
          <Banner tone="danger" title="We couldn't open the letter" body="Check your connection, then try again." testID="legal-letter-error" />
          <Button label="Try again" onPress={onRetry} variant="secondary" full />
        </View>
      ) : letter ? (
        <ScrollView testID="legal-letter" style={styles.letter} nestedScrollEnabled>
          <Text variant="secondary" selectable>
            {letter.contractText}
          </Text>
        </ScrollView>
      ) : (
        <Text variant="muted" testID="legal-letter-loading">
          Opening the letter
        </Text>
      )}
      <Button label="Close" onPress={onClose} variant="secondary" full testID="legal-letter-close" />
    </BottomSheet>
  );
}

type FeeCardProps = {
  signedAs: string | null;
  priceKobo: number;
  fees: readonly PayFeeLine[];
  totalKobo: number;
};

/** S22: "Signed as", the price, the bank's charge and the total (BRIEF S22), all from the Hub's quote. */
export function FeeCard({ signedAs, priceKobo, fees, totalKobo }: FeeCardProps) {
  const money = (kobo: number) => <Money minorUnits={kobo} size={text.kvValue.fontSize} decimals={kobo % 100 !== 0} />;
  return (
    <GroupedList testID="legal-fee-card">
      {signedAs ? <KeyValueRow label="Signed as" value={signedAs} testID="legal-signed-as" /> : null}
      <KeyValueRow label="Price" value={money(priceKobo)} />
      {fees.map((f) => (
        <KeyValueRow key={f.label} label={f.label} value={money(f.amountKobo)} />
      ))}
      <KeyValueRow label="Total" value={money(totalKobo)} testID="legal-fee-total" />
    </GroupedList>
  );
}

/**
 * `fromWallet`: "Pay from wallet" with the balance the Hub read. The shared pay sheet draws this same card inside itself and does not export
 * it, so S22's page draws its own until it does (SHARED-CHANGES, LEGAL-06 #1).
 */
export function WalletCard({ wallet }: { wallet: PayWallet }) {
  const { colors } = useWawu();
  return (
    <Card testID="legal-wallet-card" style={styles.walletCard}>
      <CurrencyFlag currency="NGN" />
      <View style={styles.flex}>
        <Text variant="cardTitle">Pay from wallet</Text>
        <Text variant="meta" style={styles.walletLine}>
          {wallet.kind === 'open' ? (
            <>
              {WALLET_NAME} · <Money minorUnits={wallet.balanceKobo} size={text.meta.fontSize} weight={500} tone="textMuted" /> available
            </>
          ) : wallet.kind === 'none' ? (
            "You don't have a wallet yet"
          ) : (
            'Checking your balance'
          )}
        </Text>
      </View>
      {wallet.kind === 'open' ? <Icon name="CircleCheck" size={space.xl} color={colors.accentFg} strokeWidth={ICON_STROKE.button} /> : null}
    </Card>
  );
}

/** S23: "Your documents": each file the consultant delivered, with its pages when the Hub knows them, and a way to open it. */
export function DocumentsCard({ items }: { items: readonly Deliverable[] }) {
  const { colors } = useWawu();
  return (
    <GroupedList testID="legal-documents">
      {items.map((item) => (
        <ListRow
          key={item.id}
          testID={`legal-document-${item.id}`}
          lead={<IconTile icon="FileText" tone="in" />}
          title={item.fileName}
          titleLines={0}
          subtitle={item.pages === null ? undefined : `${item.pages} ${item.pages === 1 ? 'page' : 'pages'}`}
          trailing={item.url ? <Icon name="Download" size={18} color={colors.textSecondary} /> : undefined}
          onPress={item.url ? () => void Linking.openURL(item.url as string) : undefined}
          accessibilityLabel={`${item.fileName}${item.pages === null ? '' : `, ${item.pages} pages`}${item.url ? ', open' : ''}`}
        />
      ))}
    </GroupedList>
  );
}

/** A small line that is only a note under the card (never a promise): the Hub's own words. */
export function Aside({ children }: { children: ReactNode }) {
  return (
    <Text variant="meta" style={styles.aside}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  track: { paddingVertical: m.trackPadY, paddingHorizontal: m.trackPadX },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: m.stepGap, paddingVertical: m.stepPadY },
  disc: { width: m.stepDisc, height: m.stepDisc, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  dot: { width: m.stepDot, height: m.stepDot, borderRadius: radius.chip },
  note: { flexDirection: 'row', alignItems: 'center', gap: m.noteGap, borderRadius: m.noteCorner, paddingVertical: m.notePadY, paddingHorizontal: m.notePadX },
  quoteCard: { padding: m.quoteCardPad, gap: m.quoteGap },
  quoteTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  letter: { maxHeight: 360 },
  letterGap: { gap: space.md },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + space.xs / 2, paddingHorizontal: layout.cardPad },
  walletLine: { marginTop: space.xs / 2 },
  aside: { textAlign: 'center' },
});
