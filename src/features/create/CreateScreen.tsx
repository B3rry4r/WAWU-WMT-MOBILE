import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { draftsKey, fetchDrafts, fetchMyTier, tierKey } from '@/features/me/api';
import { draftCount } from '@/features/verify/model';
import { font, radius, space, useWawu } from '@/theme';

import { allowanceKey, fetchAllowance } from './api';
import { CreateFrame } from './CreateFrame';
import { SlotsFullNotice, UploadsMeter, slotsFull } from './UploadsMeter';

/** me.js `hubItem`: a 22 corner card, 16 padding, 12 between the picture and the words; a 48 accent tile, a 16 semi-bold name, a 13 muted line 3 under it. */
const tileMetrics = { corner: radius.card, pad: space.lg, gap: space.md, icon: 48, title: 16, sub: 13, subLeading: 1.35, subGap: 3, between: 10 } as const;
/** M27 draws the list it disables at 45% opacity. */
const FULL_FADE = 0.45;

type Tile = { id: string; icon: IconName; title: string; sub: string; onPress: () => void; disabled?: boolean };

export type CreateScreenProps = {
  onClose: () => void;
  /** Content opens M20. */
  onContent: () => void;
  /** Event opens E13, or E21 for an account without a tick (the host form decides). */
  onEvent: () => void;
  /** Service opens P5 (or P8 for a creator who is already listed). */
  onService: () => void;
  /** The draft row opens Your shop (VF2, VERIFY-01). The row is not drawn without it. */
  onShop?: () => void;
  /** "Get verified" under the uploads meter and the full note opens the tiers (VF5, ME-12). Not drawn without it. */
  onGetVerified?: () => void;
  /** At the limit of a running tier's products, Content opens VF13 (VERIFY-05) in place of starting a piece the Hub would refuse. */
  onProductsFull?: () => void;
};

/**
 * M19 · Create. Content, Event and Service, the draft row ("Your shop", VF2: drafts are free) and the uploads meter from the Hub's own
 * count. Community (opens I32, INBOX-14) and the meter's "Get verified" (opens M11, ME-12) are added by the tasks that build where they
 * lead (R-47).
 */
export function CreateScreen({ onClose, onContent, onEvent, onService, onShop, onGetVerified, onProductsFull }: CreateScreenProps) {
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });
  // The draft count is the Hub's; a read that fails leaves the row with its fixed words and Your shop says why when it opens.
  const drafts = useQuery({ queryKey: draftsKey, queryFn: fetchDrafts, enabled: Boolean(onShop) });
  // At "5 of 5 used" a new piece would be refused when it is created, so Content does not start one (M27). Event and Service take no upload slot.
  const full = allowance.data ? slotsFull(allowance.data) : false;
  // A running tier whose every place is used: Content opens VF13 (add five, or move up a tier) instead of a piece the Hub would refuse.
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, enabled: Boolean(onProductsFull), staleTime: 0, retry: false });
  const running = tier.data ? tier.data.state === 'active' || tier.data.state === 'ending' : false;
  const atLimit = Boolean(onProductsFull) && running && tier.data !== undefined && tier.data.productsAllowed > 0 && tier.data.productsUsed >= tier.data.productsAllowed;
  const tiles: Tile[] = [
    { id: 'content', icon: 'Clapperboard', title: 'Content', sub: 'Video, course, audio, PDF, image or template', onPress: atLimit && onProductsFull ? onProductsFull : onContent, disabled: full && !atLimit },
    { id: 'event', icon: 'CalendarDays', title: 'Event', sub: 'Needs a verified tick', onPress: onEvent },
    { id: 'service', icon: 'BriefcaseBusiness', title: 'Service', sub: 'Get listed as a professional', onPress: onService },
  ];
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <CreateFrame testID="create-screen" title="Create" leading="close" onLeave={onClose}>
      {allowance.data && full && !atLimit ? <SlotsFullNotice allowance={allowance.data} onGetVerified={onGetVerified} /> : null}
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row[0].id} style={styles.pair}>
            {row.map((tile) => (
              <HubTile key={tile.id} tile={tile} />
            ))}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>
      {onShop ? <ShopRow sub={drafts.data ? `${draftCount(drafts.data.length)} \u00b7 drafts are free` : 'Drafts are free'} onPress={onShop} /> : null}
      {allowance.data ? (
        <UploadsMeter allowance={allowance.data} onGetVerified={onGetVerified} />
      ) : allowance.isError ? (
        <MeterFailed message={isApiError(allowance.error) ? allowance.error.message : 'Check your connection and try again.'} onRetry={() => void allowance.refetch()} />
      ) : (
        <Skeleton testID="create-meter-loading" height={96} radius={radius.card} />
      )}
    </CreateFrame>
  );
}

function HubTile({ tile }: { tile: Tile }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`create-tile-${tile.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${tile.title}, ${tile.sub}`}
      accessibilityState={{ disabled: tile.disabled ?? false }}
      disabled={tile.disabled}
      onPress={tile.onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        tile.disabled ? { opacity: FULL_FADE } : null,
        ring.style,
      ]}
    >
      <IconTile icon={tile.icon} tone="accent" size={tileMetrics.icon} />
      <View>
        <Text variant="body" style={[font(600), styles.tileTitle]}>
          {tile.title}
        </Text>
        <Text variant="body" tone="textMuted" style={styles.tileSub}>
          {tile.sub}
        </Text>
      </View>
    </Pressable>
  );
}

/** The draft row: the same card as a tile, laid across the screen (a 48 accent tile, the name, a line under it, a chevron). */
function ShopRow({ sub, onPress }: { sub: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="create-shop-row"
      accessibilityRole="button"
      accessibilityLabel={`Your shop, ${sub}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.shopRow,
        { backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
        ring.style,
      ]}
    >
      <IconTile icon="Store" tone="accent" size={tileMetrics.icon} />
      <View style={styles.shopWords}>
        <Text variant="body" style={[font(600), styles.tileTitle]}>
          Your shop
        </Text>
        <Text variant="body" tone="textMuted" testID="create-shop-sub" style={styles.tileSub}>
          {sub}
        </Text>
      </View>
      <Icon name="ChevronRight" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

/** The meter could not be read: the tiles above still work, and this says why the count is missing. */
function MeterFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View testID="create-meter-error" accessibilityRole="alert" style={[styles.failed, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
      <Text variant="body" style={font(600)}>
        Your uploads did not load
      </Text>
      <Text variant="caption" tone="textMuted">
        {message}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} testID="create-meter-retry" {...ring.handlers} style={ring.style}>
        <Text variant="linkStrong">Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: tileMetrics.between },
  pair: { flexDirection: 'row', gap: tileMetrics.between },
  // The empty half of an odd last row takes the same padding as a tile: a flex item's padding comes on top of its share, so without it
  // the lone tile was wider than the others (186 against 170 at 390).
  spacer: { flex: 1, minWidth: 0, paddingHorizontal: tileMetrics.pad },
  tile: { flex: 1, minWidth: 0, borderRadius: tileMetrics.corner, padding: tileMetrics.pad, gap: tileMetrics.gap },
  tileTitle: { fontSize: tileMetrics.title },
  tileSub: { fontSize: tileMetrics.sub, lineHeight: tileMetrics.sub * tileMetrics.subLeading, marginTop: tileMetrics.subGap },
  failed: { borderRadius: radius.card, padding: space.lg, gap: space.xs },
  shopRow: { flexDirection: 'row', alignItems: 'center', borderRadius: tileMetrics.corner, padding: tileMetrics.pad, gap: tileMetrics.gap },
  shopWords: { flex: 1, minWidth: 0 },
});
