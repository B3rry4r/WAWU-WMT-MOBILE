import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMyTier, tierKey, type MyTier } from '@/features/me/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { StoreUnready } from '@/features/store/StoreParts';
import type { StoreItem } from '@/features/store/model';
import { useStoreCatalog } from '@/features/store/useStore';
import { font, radius, space, useWawu } from '@/theme';

import { plansQuery, type PlanTier } from './purchaseApi';
import { dayOf, tierFacts, TIER_WORDS } from './purchaseModel';
import { Radio } from './planParts';

const HEAD = { title: 22, tracking: -0.03 } as const;
const CARD = { padV: 14, padH: 16, between: 8 } as const;

export type TiersScreenProps = {
  /** False closes the sheet (its Modal) while this screen stays mounted, so the choice made on it is still there when it opens again. */
  open?: boolean;
  onClose: () => void;
  /** The button: `tier` for a person with none (or an ended one), `upgrade` for a person whose tier is running. */
  onContinue: (kind: 'tier' | 'upgrade', tierId: string) => void;
};

/** A person's tier is running (the Hub's `active` or `ending`): the choice is then the step up. */
const running = (tier: MyTier | undefined): tier is MyTier & { tier: NonNullable<MyTier['tier']> } => Boolean(tier && (tier.state === 'active' || tier.state === 'ending') && tier.tier);

/** A tier the store sells, joined to what the plan says it gives. */
type Offer = { tier: PlanTier; item: StoreItem };

/**
 * VF5 · Make it official, and VF5b · Upgrade, one sheet. A tier is a subscription bought in the store sheet (R-86): the tiers on sale are the
 * ones the Hub sells in this phone's store (`GET /store/products`) joined to what each gives (`GET /plans`: its length, products, points and
 * pass), and the price is the store's own, in the person's own currency. A person whose tier is running sees their own tier marked and the
 * tiers above it; the store works out what moving up costs, so no difference is shown here. The tier the sheet starts on is the one the Hub
 * marks `preselected`. The dollar tiers (VF5a) are not built at launch (R-16, R-65).
 */
export function TiersScreen({ open = true, onClose, onContinue }: TiersScreenProps) {
  const owner = useSessionAccount(undefined);
  const plans = useQuery({ ...plansQuery(owner), retry: false }, queryClient);
  const mine = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false }, queryClient);
  const store = useStoreCatalog(['tier']);
  const [chosen, setChosen] = useState<string | null>(null);

  const held = running(mine.data) ? mine.data : null;
  const all = plans.data?.tiers ?? [];
  const offers: Offer[] = store.state.kind === 'ready' ? store.state.items.flatMap((item) => { const tier = all.find((t) => t.id === item.product.grants.tierId); return tier ? [{ tier, item }] : []; }) : [];
  const heldPrice = held ? all.find((t) => t.id === held.tier.id)?.priceMinor : undefined;
  const above = held && heldPrice !== undefined ? offers.filter((o) => o.tier.priceMinor > heldPrice) : offers;
  const choices = held ? above : offers;
  const start = choices.find((o) => o.tier.preselected) ?? choices[0] ?? null;
  const selected = choices.find((o) => o.tier.id === chosen) ?? start;

  const failed = (plans.isError && !plans.data) || (mine.isError && !mine.data);
  const waiting = !plans.data || !mine.data || store.state.kind === 'loading';

  let body;
  if (failed) {
    const error = plans.error ?? mine.error;
    body = (
      <ErrorState
        testID="tiers-error"
        icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load the tiers"
        message={isApiError(error) && error.message ? error.message : 'Check your connection and try again.'}
        onRetry={() => {
          void plans.refetch();
          void mine.refetch();
          store.refetch();
        }}
      />
    );
  } else if (waiting) {
    body = (
      <View testID="tiers-loading" style={styles.list}>
        <Skeleton height={34} width="70%" radius={radius.tile} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={92} radius={radius.card} />
        ))}
      </View>
    );
  } else if (store.state.kind !== 'ready') {
    body = <StoreUnready state={store.state} onRetry={store.refetch} testID="tiers" />;
  } else if (choices.length === 0) {
    // A person on the highest tier has nothing to move up to; a store with no tier on sale has nothing to sell: nothing is offered.
    body = held ? (
      <ErrorState testID="tiers-none" icon="TriangleAlert" title="You are on the highest tier" message="There is no tier above yours to move up to." />
    ) : (
      <StoreUnready state={{ kind: 'not_open', why: 'not_configured' }} onRetry={store.refetch} testID="tiers-none" />
    );
  } else {
    const heldName = held?.tier.name ?? 'your tier';
    const until = held ? dayOf(held.activeUntil) : null;
    body = (
      <>
        <View>
          <Text variant="display" accessibilityRole="header" testID="tiers-title" style={{ fontSize: HEAD.title, letterSpacing: HEAD.tracking * HEAD.title }}>
            {held ? TIER_WORDS.upgradeTitle : TIER_WORDS.title}
          </Text>
          <Text variant="body" tone="textSecondary" testID="tiers-blurb" style={styles.blurb}>
            {held ? `You're on ${heldName}${until ? ` until ${until}` : ''}. The store works out what moving up costs.` : TIER_WORDS.blurb}
          </Text>
        </View>
        <View accessibilityRole="radiogroup" testID="tiers-list" style={styles.list}>
          {held ? <TierCard tier={all.find((t) => t.id === held.tier.id) ?? null} fallbackName={held.tier.name ?? 'Your tier'} mark="mine" price={null} /> : null}
          {choices.map((o) => (
            <TierCard key={o.tier.id} tier={o.tier} price={o.item.price} on={selected?.tier.id === o.tier.id} mark={o.tier.preselected ? 'best' : undefined} onPress={() => setChosen(o.tier.id)} />
          ))}
        </View>
      </>
    );
  }

  const ready = !failed && !waiting && store.state.kind === 'ready' && selected !== null;
  return (
    <View testID="tiers-screen" style={styles.page}>
      <BottomSheet visible={open} onClose={onClose} label="Choose a tier">
        {body}
        {ready && selected ? (
          <Button
            testID="tiers-continue"
            label={held ? `Upgrade to ${selected.tier.name} · ${selected.item.price}` : `Continue with ${selected.tier.name}`}
            full
            onPress={() => onContinue(held ? 'upgrade' : 'tier', selected.tier.id)}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}

type Mark = 'best' | 'mine';

/** One tier: its name and mark, its price (or the difference), what it gives, and the choice mark. The tier a person holds has no choice mark. */
function TierCard({ tier, fallbackName, mark, on, price, onPress }: { tier: PlanTier | null; fallbackName?: string; mark?: Mark; on?: boolean; price: string | null; onPress?: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const name = tier?.name ?? fallbackName ?? '';
  const facts = tier ? tierFacts(tier) : null;
  const chooses = onPress !== undefined;
  return (
    <Pressable
      testID={`tier-${tier?.id ?? 'mine'}`}
      accessibilityRole={chooses ? 'radio' : 'text'}
      accessibilityState={chooses ? { checked: Boolean(on) } : undefined}
      accessibilityLabel={[name, mark === 'mine' ? 'your tier' : null, mark === 'best' ? TIER_WORDS.best : null, price, facts?.gives, facts?.extras].filter(Boolean).join(', ')}
      disabled={!chooses}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.card,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? 2 : 1, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <View style={styles.cardHead}>
        <View style={styles.nameRow}>
          <Text variant="body" style={[font(700), styles.name]}>
            {name}
          </Text>
          {mark === 'best' ? <StatusPill label={TIER_WORDS.best} tone="accent" /> : null}
          {mark === 'mine' ? <StatusPill label="Your tier" tone="positive" /> : null}
        </View>
        <View style={styles.priceRow}>
          {price !== null ? (
            <Text variant="body" testID={`tier-price-${tier?.id ?? 'mine'}`} style={[font(700), styles.price]}>
              {price}
            </Text>
          ) : null}
          {chooses ? <Radio on={Boolean(on)} /> : null}
        </View>
      </View>
      {facts ? (
        <>
          <Text variant="secondary" tone="textSecondary">
            {facts.gives}
          </Text>
          {facts.extras ? (
            <Text variant="secondary" tone="textSecondary">
              {facts.extras}
            </Text>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  blurb: { marginTop: space.xs },
  list: { gap: space.md },
  card: { gap: CARD.between, paddingVertical: CARD.padV, paddingHorizontal: CARD.padH, borderRadius: radius.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1, flexWrap: 'wrap' },
  name: { fontSize: 17 },
  price: { fontSize: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
