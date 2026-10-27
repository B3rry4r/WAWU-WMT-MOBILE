import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
import { ProductsMeter } from '@/components/ProductsMeter';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { Toast, toastMetrics } from '@/components/Toast';
import { fetchMyTier, tierKey, type MyTier } from '@/features/me/api';
import { productsMeterOf } from '@/features/me/model';
import { SERVICES_DOOR_NOTICE_MS, type ServicesDoor } from '@/features/pro-listing/useListServicesDoor';
import { StudioRow } from '@/features/points/StudioRow';
import { font, radius, space, useWawu } from '@/theme';

import { allowanceKey, fetchAllowance, type Allowance } from './api';
import { CreateFrame } from './CreateFrame';
import { SlotsFullNotice, UploadsMeter, slotsFull } from './UploadsMeter';

/** me.js `hubItem`: a 22 corner card, 16 padding, 12 between the picture and the words; a 48 accent tile, a 16 semi-bold name, a 13 muted line 3 under it. */
const tileMetrics = { corner: radius.card, pad: space.lg, gap: space.md, icon: 48, title: 16, sub: 13, subLeading: 1.35, subGap: 3, between: 10 } as const;
/** M27 draws the list it disables at 45% opacity. */
const FULL_FADE = 0.45;

/** A small spinner is 20 square: it sits in the tile's top right corner, centred on the 48 icon. */
const SPINNER = 20;

type Tile = {
  id: string;
  icon: IconName;
  title: string;
  /** Left out when the tile has nothing to add to its name. */
  sub?: string;
  onPress: () => void;
  disabled?: boolean;
  /** The tile's reads are on their way (SERVICES-FEEDBACK 1): it keeps its pressed look and shows the app's spinner. */
  busy?: boolean;
};

export type CreateScreenProps = {
  onClose: () => void;
  /** Content opens M20. */
  onContent: () => void;
  /** Event opens E13, or E21 (Hosting needs a tier) for an account with no running tier and no live tick: the host form decides. */
  onEvent: () => void;
  /** Community opens I32 (INBOX-14). The tile is not drawn without it. */
  onCommunity?: () => void;
  /** Service opens P5 (or P8 for a creator who is already listed). */
  onService: () => void;
  /** What the Service tile shows while its reads run and when one fails (SERVICES-FEEDBACK 1): the tile works at once, and a failed read is said in a line at the bottom. */
  servicesDoor?: ServicesDoor;
  /** The full-state note's Open library button (M27) opens My content (M28). The button is not drawn without it. */
  onOpenLibrary?: () => void;
  /** "Get verified" under the uploads meter and the full note opens the tiers (VF5, ME-12). Not drawn without it. */
  onGetVerified?: () => void;
  /** At the limit of a running tier's products, Content opens VF13 (VERIFY-05) in place of starting a piece the Hub would refuse. */
  onProductsFull?: () => void;
  /** The Studio card opens Studio (PT1, POINTS-07), the AI tools. The card is not drawn without it. */
  onStudio?: () => void;
};

/**
 * M19 · Create. Content, Event and Service and the uploads meter from the Hub's own count (the 16 Oct board draws no draft row: Your shop,
 * VF2, opens from Me's draft tile and VF1's "Build my shop", SWEEP-APP-4). Community (opens I32, INBOX-14) and the meter's "Get verified" (opens the tiers, VF5, ME-12) are drawn only when their screens are built (R-47).
 */
export function CreateScreen({ onClose, onContent, onEvent, onCommunity, onService, servicesDoor, onOpenLibrary, onGetVerified, onProductsFull, onStudio }: CreateScreenProps) {
  const insets = useSafeAreaInsets();
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });
  // At "5 of 5 used" a new piece would be refused when it is created, so Content does not start one (M27). Event and Service take no upload slot.
  const full = allowance.data ? slotsFull(allowance.data) : false;
  // The tier is the Hub's: the products meter (M19) and, at the limit of a running tier's products, Content opening VF13 in place of a piece the Hub would refuse.
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false });
  const running = tier.data ? tier.data.state === 'active' || tier.data.state === 'ending' : false;
  const atLimit = Boolean(onProductsFull) && running && tier.data !== undefined && tier.data.productsAllowed > 0 && tier.data.productsUsed >= tier.data.productsAllowed;
  const tiles: Tile[] = [
    { id: 'content', icon: 'Clapperboard', title: 'Content', sub: 'Video, course, audio, PDF, image or template', onPress: atLimit && onProductsFull ? onProductsFull : onContent, disabled: full && !atLimit },
    // "Needs an active tier" is M19's note for a person with none: once a tier is held (the state the meter below reads) the note is gone.
    { id: 'event', icon: 'CalendarDays', title: 'Event', sub: running ? undefined : 'Needs an active tier', onPress: onEvent },
    ...(onCommunity ? [{ id: 'community', icon: 'Users' as const, title: 'Community', sub: 'A room your people talk in', onPress: onCommunity }] : []),
    { id: 'service', icon: 'BriefcaseBusiness', title: 'Service', sub: 'Get listed as a professional', onPress: onService, busy: servicesDoor?.busy },
  ];
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <>
      <CreateFrame testID="create-screen" title="Create" leading="close" onLeave={onClose}>
        {allowance.data && full && !atLimit ? <SlotsFullNotice allowance={allowance.data} onOpenLibrary={onOpenLibrary} onGetVerified={onGetVerified} /> : null}
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
        {onStudio ? <StudioRow onPress={onStudio} /> : null}
        <Meter tier={tier} allowance={allowance} onGetVerified={onGetVerified} />
      </CreateFrame>
      <Toast
        message={servicesDoor?.notice ?? null}
        tone="alert"
        placement="bottom"
        offset={insets.bottom + toastMetrics.bottom}
        lines={2}
        duration={SERVICES_DOOR_NOTICE_MS}
        onHide={servicesDoor?.dismiss}
        testID="services-door-notice"
      />
    </>
  );
}

type TierQuery = UseQueryResult<MyTier>;
type AllowanceQuery = UseQueryResult<Allowance>;

/**
 * M19's meter. A person with a running tier sees "2 of 3 products" with the tier's name and end date (`GET /me/tier`, the same card as
 * Me). Without one, or when the tier cannot be read, the Hub's own uploads count (`GET /uploads/allowance`) stands in: it carries a tick
 * that has not ended and a tier's places alike. A person the Hub allows nothing has nothing to count, so nothing is drawn. Each read has
 * its own loading state, and the count's failure says so with Try again.
 */
function Meter({ tier, allowance, onGetVerified }: { tier: TierQuery; allowance: AllowanceQuery; onGetVerified?: () => void }) {
  const products = productsMeterOf(tier.data);
  if (products) return <ProductsMeter used={products.used} allowed={products.allowed} caption={products.caption} testID="create-products" />;
  if (tier.isPending) return <ProductsMeter loading used={0} allowed={0} testID="create-meter-loading" />;
  // No running tier (or none readable): a tier that ended or never was draws no products meter.
  if (allowance.data) return <UploadsMeter allowance={allowance.data} onGetVerified={onGetVerified} />;
  if (allowance.isError) {
    return <MeterFailed message={isApiError(allowance.error) ? allowance.error.message : 'Check your connection and try again.'} onRetry={() => void allowance.refetch()} />;
  }
  return <Skeleton testID="create-meter-loading" height={96} radius={radius.card} />;
}

function HubTile({ tile }: { tile: Tile }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`create-tile-${tile.id}`}
      accessibilityRole="button"
      accessibilityLabel={tile.sub ? `${tile.title}, ${tile.sub}` : tile.title}
      accessibilityState={{ disabled: tile.disabled ?? false, busy: tile.busy ?? false }}
      disabled={tile.disabled}
      onPress={tile.onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: pressed || tile.busy ? colors.surfaceSunken : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        tile.disabled ? { opacity: FULL_FADE } : null,
        ring.style,
      ]}
    >
      <IconTile icon={tile.icon} tone="accent" size={tileMetrics.icon} />
      {tile.busy ? <ActivityIndicator testID={`create-tile-${tile.id}-busy`} size="small" color={colors.textMuted} style={styles.spinner} /> : null}
      <View>
        <Text variant="body" style={[font(600), styles.tileTitle]}>
          {tile.title}
        </Text>
        {tile.sub ? (
          <Text variant="body" tone="textMuted" style={styles.tileSub}>
            {tile.sub}
          </Text>
        ) : null}
      </View>
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
  spinner: { position: 'absolute', top: tileMetrics.pad + (tileMetrics.icon - SPINNER) / 2, right: tileMetrics.pad },
  grid: { gap: tileMetrics.between },
  pair: { flexDirection: 'row', gap: tileMetrics.between },
  // The empty half of an odd last row takes the same padding as a tile: a flex item's padding comes on top of its share, so without it
  // the lone tile was wider than the others (186 against 170 at 390).
  spacer: { flex: 1, minWidth: 0, paddingHorizontal: tileMetrics.pad },
  tile: { flex: 1, minWidth: 0, borderRadius: tileMetrics.corner, padding: tileMetrics.pad, gap: tileMetrics.gap },
  tileTitle: { fontSize: tileMetrics.title },
  tileSub: { fontSize: tileMetrics.sub, lineHeight: tileMetrics.sub * tileMetrics.subLeading, marginTop: tileMetrics.subGap },
  failed: { borderRadius: radius.card, padding: space.lg, gap: space.xs },
});
