import { useQueries, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Money, type Currency } from '@/components/Money';
import { Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMyTier, tierKey, type MyTier } from '@/features/me/api';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { font, radius, space, useWawu } from '@/theme';

import { fetchQuote, plansQuery, type PlanTier } from './purchaseApi';
import { dayOf, higherTiers, priceIn, startingTier, tierFacts, TIER_WORDS } from './purchaseModel';
import { Radio } from './planParts';

const HEAD = { title: 22, tracking: -0.03 } as const;
const CARD = { padV: 14, padH: 16, between: 8 } as const;

export type TiersScreenProps = {
  /** False closes the sheet (its Modal) while this screen stays mounted, so the choice made on it is still there when it opens again. */
  open?: boolean;
  onClose: () => void;
  /** The button: `tier` for a person with none (or an ended one), `upgrade` for a person whose tier is running. */
  onContinue: (kind: 'tier' | 'upgrade', tierId: string) => void;
  /** A person billed in dollars: the Hub takes no tier payment from a dollar account yet, so Continue says so and this opens the wallet to add one, with the Hub's currency (R-87). */
  onAddAccount?: (currency: Currency) => void;
};

/** A person's tier is running (the Hub's `active` or `ending`): the choice is then the step up, paid as the difference. */
const running = (tier: MyTier | undefined): tier is MyTier & { tier: NonNullable<MyTier['tier']> } => Boolean(tier && (tier.state === 'active' || tier.state === 'ending') && tier.tier);

/**
 * VF5 · Make it official, and VF5b · Upgrade, one sheet. The tiers, their prices, lengths, products, points and passes are the Hub's
 * (`GET /plans`); the tier the sheet starts on is the one the Hub marks `preselected`. A person whose tier is running sees their own
 * tier marked and the others at "pay only" the difference, which is the Hub's own upgrade quote for each (`GET /plans/purchases/quote`
 * `kind=upgrade`), never a subtraction made here. A person the Hub bills in dollars (VF5a) sees the Hub's dollar figures with the dollar
 * sign (D-1), never a naira sign. The Hub takes a tier payment only from a naira wallet (BACKEND_GAPS G-R2-AUTHME-1), so for them Continue
 * says plainly that paying in dollars is not open yet and leads to adding a dollar account; no cedi or naira wallet is opened to pay it.
 * The board's first line,
 * "Your intro is ready", is true only once a Voice Intro exists (VERIFY-03), so the title is the board's name for the sheet.
 */
export function TiersScreen({ open = true, onClose, onContinue, onAddAccount }: TiersScreenProps) {
  const owner = useSessionAccount(undefined);
  const plans = useQuery(plansQuery(owner), queryClient);
  const mine = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false }, queryClient);
  const [chosen, setChosen] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const held = running(mine.data) ? mine.data : null;
  const all = plans.data?.tiers ?? [];
  const currency: Currency = plans.data?.currency ?? 'NGN';
  const dollars = currency !== 'NGN';
  const above = held ? higherTiers(all, held.tier.id) : [];
  // The Hub quotes an upgrade only in naira, so a dollar account is shown the tier prices as they are and no difference is asked for.
  const quoted = dollars ? [] : above;
  const diffs = useQueries(
    {
      queries: quoted.map((tier) => ({
        queryKey: ['plans', 'upgrade-diff', owner ?? '', tier.id] as const,
        queryFn: () => fetchQuote({ kind: 'upgrade', tierId: tier.id, bump: false }),
        enabled: Boolean(owner),
        staleTime: 0,
        retry: false,
      })),
    },
    queryClient,
  );
  const diffOf = (id: string): number | null => {
    const at = quoted.findIndex((t) => t.id === id);
    return at >= 0 ? (diffs[at]?.data?.planKobo ?? null) : null;
  };

  const failed = (plans.isError && !plans.data) || (mine.isError && !mine.data) || diffs.some((d) => d.isError);
  const waiting = !plans.data || !mine.data || diffs.some((d) => d.isPending);
  const choices = held ? above : all;
  const start = held ? (above.find((t) => t.preselected) ?? above[0] ?? null) : startingTier(all);
  const selected = choices.find((t) => t.id === chosen) ?? start;
  const stepUp = held !== null && !dollars;
  const price = selected ? (stepUp ? diffOf(selected.id) : selected.priceMinor) : null;

  let body;
  if (failed) {
    const error = plans.error ?? mine.error ?? diffs.find((d) => d.isError)?.error;
    body = (
      <ErrorState
        testID="tiers-error"
        icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load the tiers"
        message={isApiError(error) && error.message ? error.message : 'Check your connection and try again.'}
        onRetry={() => {
          void plans.refetch();
          void mine.refetch();
          for (const d of diffs) if (d.isError) void d.refetch();
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
  } else if (explaining) {
    body = (
      <EmptyState
        testID="tiers-dollars"
        icon="Wallet"
        title={TIER_WORDS.dollarsTitle}
        message={TIER_WORDS.dollarsBody}
        action={onAddAccount ? { label: TIER_WORDS.dollarsAdd, onPress: () => onAddAccount(currency) } : undefined}
        actionVariant="primary"
      />
    );
  } else if (all.length === 0 || (held && above.length === 0)) {
    // A person on the highest tier has nothing to move up to, and a Hub that sells no tier has nothing to sell: nothing is offered.
    body = (
      <ErrorState
        testID="tiers-none"
        icon="TriangleAlert"
        title={held ? 'You are on the highest tier' : 'No tiers on sale'}
        message={held ? 'There is no tier above yours to move up to.' : 'There are no tiers on sale right now. Try again later.'}
        onRetry={() => void plans.refetch()}
      />
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
            {held ? `You're on ${heldName}${until ? ` until ${until}` : ''}. Pay only the difference.` : TIER_WORDS.blurb}
          </Text>
        </View>
        <View accessibilityRole="radiogroup" testID="tiers-list" style={styles.list}>
          {held ? <TierCard tier={all.find((t) => t.id === held.tier.id) ?? null} fallbackName={held.tier.name ?? 'Your tier'} mark="mine" currency={currency} /> : null}
          {choices.map((tier) => (
            <TierCard key={tier.id} tier={tier} currency={currency} on={selected?.id === tier.id} mark={tier.preselected ? 'best' : undefined} only={stepUp ? diffOf(tier.id) : null} onPress={() => setChosen(tier.id)} />
          ))}
        </View>
      </>
    );
  }

  const ready = !failed && !waiting && !explaining && selected !== null && price !== null;
  return (
    <View testID="tiers-screen" style={styles.page}>
      <BottomSheet visible={open} onClose={onClose} label="Choose a tier">
        {body}
        {ready && selected ? (
          <Button
            testID="tiers-continue"
            label={stepUp ? `Upgrade · pay ${priceIn(price as number, currency)}` : `Continue with ${selected.name}`}
            full
            onPress={() => (dollars ? setExplaining(true) : onContinue(held ? 'upgrade' : 'tier', selected.id))}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}

type Mark = 'best' | 'mine';

/** One tier: its name and mark, its price (or the difference), what it gives, and the choice mark. The tier a person holds has no choice mark. */
export function TierCard({ tier, fallbackName, mark, on, only, onPress, currency }: { tier: PlanTier | null; fallbackName?: string; mark?: Mark; on?: boolean; only?: number | null; onPress?: () => void; currency: Currency }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const name = tier?.name ?? fallbackName ?? '';
  const facts = tier ? tierFacts(tier) : null;
  const chooses = onPress !== undefined;
  const priceKobo = only ?? tier?.priceMinor ?? null;
  return (
    <Pressable
      testID={`tier-${tier?.id ?? 'mine'}`}
      accessibilityRole={chooses ? 'radio' : 'text'}
      accessibilityState={chooses ? { checked: Boolean(on) } : undefined}
      accessibilityLabel={[name, mark === 'mine' ? 'your tier' : null, mark === 'best' ? TIER_WORDS.best : null, priceKobo !== null ? `${only != null ? 'pay only ' : ''}${priceIn(priceKobo, currency)}` : null, facts?.gives, facts?.extras].filter(Boolean).join(', ')}
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
          {only != null ? (
            <Text variant="meta" tone="textMuted">
              {TIER_WORDS.payOnly}
            </Text>
          ) : null}
          {priceKobo !== null ? <Money minorUnits={priceKobo} currency={currency} size={16} weight={700} decimals={priceKobo % 100 !== 0} /> : null}
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
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
