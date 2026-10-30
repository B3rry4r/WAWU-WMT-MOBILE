import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { formatPoints, PointsFigure } from '@/components/PointsFigure';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { SaidBanner, StoreLoading, StoreUnready } from '@/features/store/StoreParts';
import { buyLabel, plain, type StoreItem } from '@/features/store/model';
import { useStoreBuyer, useStoreCatalog } from '@/features/store/useStore';
import { font, radius, space, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { plansQuery, runningTierQuery } from './buyApi';
import { blurbFor, bonusChip, BUY_WORDS, startingPack } from './buyModel';
import { PointsFrame } from './PointsFrame';

const BODY_GAP = 12;
const RESULT = { mark: 72, between: 10, title: 28 } as const;
/** PT4's heading is the board's 28 bold, tracked -0.035em (PT6b's headline is the same family). */
const HEAD = { title: 28, tracking: -0.035 } as const;
const PACK = { radio: 22, dot: 10, padV: 16, chipTop: 8 } as const;

export type BuyScreenProps = {
  onBack: () => void;
  /** Done: back to where Buy points was opened from. */
  onDone: () => void;
  /** The button's words once the points are added: "Back to AI tools" when Studio opened this screen (PT4c), else "Done". */
  doneLabel?: string;
};

/**
 * PT4 · Buy points, with PT4c (points added). Points are bought in the store sheet, Google Play Billing or Apple In-App Purchase, never
 * with the wallet (R-86). The packs and what each gives are the Hub's (`GET /store/products`); the price is the store's own, in the
 * person's own currency. Pay opens the store sheet; the Hub checks the purchase with the store before it adds a point, and the store
 * transaction is finished only after that. The Founding Maker's bonus on every pack still shows as its chip, from the plan.
 * A store the Hub is not open for yet says so plainly, and so does a phone with no store.
 */
export function BuyScreen(props: BuyScreenProps) {
  const owner = useSessionAccount(undefined);
  const [chosen, setChosen] = useState<string | null>(null);
  const store = useStoreCatalog(['points']);
  const buyer = useStoreBuyer(store.catalog);
  const plans = useQuery({ ...plansQuery(owner), retry: false }, queryClient);
  const tier = useQuery({ ...runningTierQuery(owner), retry: false }, queryClient);
  const items = store.state.kind === 'ready' ? store.state.items : [];
  const byId = (id: string) => items.find((i) => i.product.id === id) ?? null;
  const start = startingPack(items.map((i) => ({ id: i.product.id })));
  const selected = (chosen ? byId(chosen) : null) ?? (start ? byId(start.id) : null);
  // Once the store has taken the payment and the Hub has added the points, the balance after it comes from the points the Hub holds now.
  const points = useQuery({ ...myPointsQuery(owner), enabled: Boolean(owner) && buyer.granted !== null }, queryClient);
  // A tier that is running adds its percent to every pack (the Hub's `packBonusPercent` for it); none, or an ended one, adds nothing.
  const percent = tier.data ? (plans.data?.bonusByTier[tier.data.id] ?? 0) : 0;
  const chip = bonusChip(tier.data?.name ?? null, percent);

  let body;
  if (store.state.kind === 'loading') body = <StoreLoading testID="buy-loading" label="Loading the packs" />;
  else if (store.state.kind !== 'ready') body = <StoreUnready state={store.state} onRetry={store.refetch} testID="buy" />;
  else if (items.length === 0) {
    body = <StoreUnready state={{ kind: 'not_open', why: 'not_configured' }} onRetry={store.refetch} testID="buy-none" />;
  } else {
    body = (
      <>
        <View>
          <Text variant="display" accessibilityRole="header" testID="buy-title" style={{ fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }}>
            {BUY_WORDS.title}
          </Text>
          <Text variant="body" tone="textSecondary" testID="buy-blurb" style={styles.blurb}>
            {blurbFor()}
          </Text>
        </View>
        <View testID="buy-packs" accessibilityRole="radiogroup" style={styles.packs}>
          {items.map((item) => (
            <PackRow key={item.product.id} item={item} on={selected?.product.id === item.product.id} chip={chip} disabled={buyer.busy} onPress={() => (setChosen(item.product.id), buyer.clear())} />
          ))}
        </View>
        <SaidBanner said={buyer.said} testID="buy-said" />
      </>
    );
  }

  const foot =
    selected && store.state.kind === 'ready' ? (
      <Button testID="buy-pay" label={buyer.busy ? BUY_WORDS.paying : buyLabel(selected)} full loading={buyer.busy} disabled={buyer.busy} onPress={() => void buyer.buy(selected)} />
    ) : undefined;

  return (
    <>
      <PointsFrame title="" onBack={props.onBack} gap={BODY_GAP} foot={foot} testID="buy-screen">
        {body}
      </PointsFrame>
      {buyer.granted ? <Added added={buyer.granted.grant.points ?? 0} balance={points.data?.balance ?? null} label={props.doneLabel ?? BUY_WORDS.done} onDone={props.onDone} /> : null}
    </>
  );
}

function PackRow({ item, on, chip, disabled, onPress }: { item: StoreItem; on: boolean; chip: string | null; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const count = item.product.grants.points ?? 0;
  return (
    <Pressable
      testID={`pack-${item.product.id}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: on, disabled }}
      accessibilityLabel={`${formatPoints(count)}, ${item.price}${chip ? `, ${chip}` : ''}`}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.pack,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? 2 : 1, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <View style={styles.packWords}>
        <PointsFigure count={count} size="row" />
        {chip ? (
          <View style={styles.chip}>
            <StatusPill label={chip} tone="accent" />
          </View>
        ) : null}
      </View>
      <Text variant="body" testID={`pack-price-${item.product.id}`} style={[font(700), styles.price]}>
        {item.price}
      </Text>
      <Radio on={on} />
    </Pressable>
  );
}

function Radio({ on }: { on: boolean }) {
  const { colors } = useWawu();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.radio, { borderColor: on ? colors.accent : colors.borderStrong, backgroundColor: on ? colors.accent : 'transparent' }]}
    >
      {on ? <View style={[styles.dot, { backgroundColor: colors.textOnAccent }]} /> : null}
    </View>
  );
}

/** PT4c: the points added and the balance now, over the same screen. */
function Added({ added, balance, label, onDone }: { added: number; balance: number | null; label: string; onDone: () => void }) {
  return (
    <BottomSheet visible onClose={onDone} label="Points added" testID="buy-added">
      <View style={styles.result}>
        <IconTile icon="Sparkles" tone="accent" size={RESULT.mark} strokeWidth={2.2} />
        <Text variant="display" accessibilityRole="header" testID="buy-added-title" style={[styles.centre, { fontSize: RESULT.title }]}>
          {added > 0 ? `${plain(added)} ${added === 1 ? 'point' : 'points'} added` : 'Points added'}
        </Text>
        {balance !== null ? (
          <Text variant="body" tone="textSecondary" testID="buy-added-balance" style={styles.centre}>
            {`Your balance is ${formatPoints(balance)}.`}
          </Text>
        ) : null}
      </View>
      <Button testID="buy-done" label={label} full onPress={onDone} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  blurb: { marginTop: space.xs },
  packs: { gap: BODY_GAP },
  pack: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: PACK.padV, paddingHorizontal: space.lg, borderRadius: radius.card },
  packWords: { flex: 1 },
  chip: { marginTop: PACK.chipTop },
  price: { fontSize: 16 },
  radio: { width: PACK.radio, height: PACK.radio, borderRadius: PACK.radio / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: PACK.dot, height: PACK.dot, borderRadius: PACK.dot / 2 },
  centre: { textAlign: 'center' },
  result: { alignItems: 'center', gap: RESULT.between, paddingVertical: space.lg },
});
