import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { VerifiedTick } from '@/components/icon';
import { KeyValueRow } from '@/components/ListRow';
import { MediaCard } from '@/components/MediaCard';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { radius, space } from '@/theme';

import { storeName, storeOs } from '../iap';
import { SaidBanner } from '../StoreParts';
import type { Said } from '../words';

/**
 * The pay sheet of a store purchase (R-101): the same head, rows and button as the wallet's pay sheet (H14, I3), built from the same parts, for
 * a purchase made in Google Play or the App Store. There is no wallet row, no PIN and no bank charge: the person pays the STORE, and the
 * price on the row and the button is the store's own text in their currency (R-86), never the list price. The sheet states where the money
 * goes ("Paid with Google Play") and, when the person holds a credit that covers the price, offers it first. A credit is a promise to give
 * this on Who Made This: it is never shown as cash.
 *
 * Which of its states is drawn is the caller's: the price is null while the store is asked (a skeleton, no button), `unready` stands in for
 * the rows when the store cannot sell (not open yet, no store, a failed ask), and `said` is how a stopped purchase is told.
 */
export type StoreBuyHead = {
  title: string;
  by?: string;
  verified?: 'creator' | 'pro';
  subtitle?: string;
  image?: string;
  /** A tile left of the words, when there is no picture. */
  lead?: ReactNode;
};

export type StoreBuySheetProps = {
  visible: boolean;
  /** What a screen reader calls the sheet when it opens. */
  label: string;
  head: StoreBuyHead;
  /** Extra content between the head and the rows (the question's words). */
  children?: ReactNode;
  priceLabel?: string;
  /** The store's own price text, or null while the store is being asked. */
  price: string | null;
  /** Rows that describe the purchase and are not money ("Yours: Forever, in My purchases"). */
  details?: readonly { label: string; value: string }[];
  /** The verb on the buy button: "Unlock" gives "Unlock · ₦1,075.00". */
  actionLabel: string;
  /** The button is held back (the question has no words yet). */
  disabled?: boolean;
  busy: boolean;
  said: Said | null;
  /** The person's credit covers this: "Use your credit" is offered first. `creditLine` says what it is. */
  credit?: { line: string } | null;
  /** What stands in for the rows and the buttons when the store cannot sell. */
  unready?: ReactNode;
  onBuy: () => void;
  onUseCredit?: () => void;
  onCancel: () => void;
  testID: string;
};

/** "Google Play" or "App Store": the store the money goes to, as a row's value. */
export const storeLabel = (): string => (storeOs() === 'ios' ? 'App Store' : storeName('android'));

export function StoreBuySheet(p: StoreBuySheetProps) {
  const head = (
    <MediaCard
      title={p.head.title}
      byline={p.head.by}
      subtitle={p.head.subtitle}
      subtitleAccessory={p.head.verified ? <VerifiedTick kind={p.head.verified} size={space.md + 1} /> : undefined}
      image={p.head.image}
      bare
      testID={`${p.testID}-head`}
    />
  );
  const body = p.unready ?? (
    <>
      <GroupedList testID={`${p.testID}-rows`}>
        {[
          <KeyValueRow key="price" label={p.priceLabel ?? 'Price'} value={p.price ?? '...'} testID={`${p.testID}-price`} />,
          ...(p.details ?? []).map((d) => <KeyValueRow key={d.label} label={d.label} value={d.value} />),
          <KeyValueRow key="with" label="Paid with" value={storeLabel()} testID={`${p.testID}-with`} />,
        ]}
      </GroupedList>
      {p.credit ? (
        <Banner tone="info" icon="Ticket" title="You have a credit" body={p.credit.line} testID={`${p.testID}-credit`} />
      ) : null}
      <SaidBanner said={p.said} testID={`${p.testID}-said`} />
      <View style={styles.buttons}>
        {p.credit && p.onUseCredit ? (
          <Button testID={`${p.testID}-use-credit`} label={p.busy ? 'Working...' : 'Use your credit'} full loading={p.busy} disabled={p.busy || p.disabled} onPress={p.onUseCredit} />
        ) : null}
        {p.price === null ? (
          <Skeleton testID={`${p.testID}-price-loading`} height={52} radius={radius.chip} />
        ) : (
          <Button
            testID={`${p.testID}-buy`}
            label={p.busy && !p.credit ? 'Buying...' : `${p.actionLabel} · ${p.price}`}
            variant={p.credit ? 'secondary' : 'primary'}
            full
            loading={p.busy && !p.credit}
            disabled={p.busy || p.disabled}
            onPress={p.onBuy}
          />
        )}
      </View>
      {p.credit ? (
        <Text variant="meta" tone="textMuted" style={styles.centre}>
          A credit can only be used on Who Made This. It can not be turned into cash.
        </Text>
      ) : null}
    </>
  );
  return (
    <BottomSheet visible={p.visible} onClose={p.onCancel} label={p.label} gap={space.lg} dismissible={!p.busy} testID={p.testID}>
      {head}
      {p.children}
      {body}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: space.sm },
  centre: { textAlign: 'center' },
});
