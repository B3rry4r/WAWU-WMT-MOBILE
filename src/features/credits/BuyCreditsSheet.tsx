import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { creditsKey, fetchCredits } from '@/features/communities/api';
import { creditCostLine } from '@/features/communities/format';
import { useMessageCost } from '@/features/communities/useCredits';
import { SaidBanner, StoreLoading, StoreUnready } from '@/features/store/StoreParts';
import { buyLabel, type StoreItem } from '@/features/store/model';
import { useStoreBuyer, useStoreCatalog } from '@/features/store/useStore';
import { font, radius, space, useWawu } from '@/theme';

import { addedLine, buyWords, creditCount, SHEET_LINE, SHEET_TITLE, startingCredits } from './model';

/**
 * design/_gen/inbox.js lines 79 and 80: a pack is a 20 radius card, 14 by 12 inside, 6 between its parts: the count at 26 / 700 with
 * -0.03em, "credits" at 12 muted and the price at 15; the chosen pack has the accent tint and a 1.5 accent ring, the others a 1 hairline.
 * The packs are 8 apart. The price is the store's own (R-86).
 */
const packMetrics = { corner: radius.media, padV: 14, padH: 12, between: 6, badge: 26, count: 26, countTracking: -0.03, unit: 12, price: 15, ringOn: 1.5, ringOff: 1, row: 8 } as const;
const addedMetrics = { tile: 72 } as const;
const SHEET_GAP = 16;

export type BuyCreditsSheetProps = {
  /** The sheet is open: nothing is asked of the Hub or the store while it is closed. */
  visible: boolean;
  onClose: () => void;
  /** What I29's button says: "Back to chat" in a room, "Done" anywhere else. */
  doneLabel: string;
  /** The credits were added: the host reads its own copy of the balance again. */
  onAdded?: () => void;
};

/**
 * I28 · Buy WAWU Credits and I29 · Credits added, over whatever opened them (a room, the communities list). Credits are an in-app currency,
 * so they are bought in the store sheet, Google Play Billing or Apple In-App Purchase, never with the wallet (R-86). The packs and their
 * credits are the Hub's (`GET /store/products`), the price is the store's own, and the Hub checks the purchase with the store before it adds
 * a credit. The store transaction is finished only after the Hub says so. A store the Hub is not open for yet says so plainly.
 */
export function BuyCreditsSheet(props: BuyCreditsSheetProps) {
  const { visible, onClose, doneLabel } = props;
  const store = useStoreCatalog(['credits']);
  const buyer = useStoreBuyer(visible ? store.catalog : null);
  const [chosen, setChosen] = useState<string | null>(null);
  const items = store.state.kind === 'ready' ? store.state.items : [];
  const selected = items.find((i) => i.product.id === chosen) ?? startingCredits(items);
  const balance = useQuery({ queryKey: creditsKey, queryFn: fetchCredits, enabled: visible && buyer.granted !== null }, queryClient);
  // I28's "A photo is 1 credit, a video or voice note 3": the Hub's costs by kind, said only once they are known (never a number written here).
  const costs = useMessageCost();
  const costLine = costs.data ? creditCostLine(costs.data.creditsByKind) : null;

  const close = () => {
    onClose();
    if (buyer.granted) props.onAdded?.();
    buyer.clear();
  };

  if (buyer.granted) {
    const added = buyer.granted.grant.credits ?? 0;
    return (
      <BottomSheet visible={visible} onClose={close} label="Credits added" gap={SHEET_GAP} testID="credits-added">
        <View style={styles.added}>
          <IconTile icon="Coins" tone="in" size={addedMetrics.tile} />
          <Text variant="sheetTitle" style={styles.centre} testID="credits-added-title">
            {added > 0 ? `${creditCount(added)} credits added` : 'Credits added'}
          </Text>
          <Text variant="muted" style={styles.centre} testID="credits-added-line">
            {addedLine(balance.data?.creditBalance ?? null)}
          </Text>
        </View>
        <Button label={doneLabel} full onPress={close} testID="credits-added-done" />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={close} label={SHEET_TITLE} gap={SHEET_GAP} dismissible={!buyer.busy} testID="credits-sheet">
      <View style={styles.head}>
        <Text variant="sheetTitleSm">{SHEET_TITLE}</Text>
        {costLine ? (
          <Text variant="muted" testID="credits-cost-line">
            {costLine}
          </Text>
        ) : null}
        <Text variant="muted">{SHEET_LINE}</Text>
      </View>
      {store.state.kind === 'loading' ? (
        <StoreLoading testID="credits-packs-loading" label="Loading the packs" />
      ) : store.state.kind !== 'ready' ? (
        <StoreUnready state={store.state} onRetry={store.refetch} testID="credits" />
      ) : items.length === 0 ? (
        <StoreUnready state={{ kind: 'not_open', why: 'not_configured' }} onRetry={store.refetch} testID="credits-none" />
      ) : (
        <View style={styles.packs} accessibilityRole="radiogroup" testID="credits-packs">
          {items.map((item) => (
            <Pack key={item.product.id} item={item} on={item.product.id === selected?.product.id} disabled={buyer.busy} onPress={() => (setChosen(item.product.id), buyer.clear())} />
          ))}
        </View>
      )}
      <SaidBanner said={buyer.said} testID="credits-said" />
      {selected && store.state.kind === 'ready' ? (
        <Button
          testID="credits-buy"
          label={buyer.busy ? 'Buying...' : selected.product.grants.credits ? `${buyWords(selected.product.grants.credits)} · ${selected.price}` : buyLabel(selected)}
          full
          loading={buyer.busy}
          disabled={buyer.busy}
          onPress={() => void buyer.buy(selected)}
        />
      ) : null}
    </BottomSheet>
  );
}

function Pack({ item, on, disabled, onPress }: { item: StoreItem; on: boolean; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const credits = item.product.grants.credits ?? 0;
  return (
    <Pressable
      testID={`credits-pack-${item.product.id}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: on, disabled }}
      accessibilityLabel={`${creditCount(credits)} credits, ${item.price}`}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.pack,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? packMetrics.ringOn : packMetrics.ringOff, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
      ]}
    >
      <Text variant="body" style={[font(700), { fontSize: packMetrics.count, letterSpacing: packMetrics.countTracking * packMetrics.count }]}>
        {creditCount(credits)}
      </Text>
      <Text variant="caption" tone="textMuted" style={{ fontSize: packMetrics.unit }}>
        credits
      </Text>
      <Text variant="body" testID={`credits-price-${item.product.id}`} style={[font(600), { fontSize: packMetrics.price }]}>
        {item.price}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { gap: packMetrics.between },
  packs: { flexDirection: 'row', gap: packMetrics.row },
  pack: {
    flex: 1,
    minWidth: 0,
    borderRadius: packMetrics.corner,
    paddingVertical: packMetrics.padV,
    paddingHorizontal: packMetrics.padH,
    alignItems: 'center',
    gap: packMetrics.between,
  },
  added: { alignItems: 'center', gap: space.md, paddingTop: space.sm },
  centre: { textAlign: 'center' },
});
