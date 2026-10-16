import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { IconTile, type IconTileTone } from '@/components/IconTile';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

import type { Listing } from './api';
import { listingTitle, type PaidMessages } from './model';

/**
 * design/_gen/me.js line 27, `services`: cards 10 apart, 14 by 16 inside, the 44 icon circle 12 from the
 * words, a 15.5 at 600 title and a 13 muted line 2 under it.
 */
const serviceMetrics = { between: 10, padV: 14, padH: 16, iconGap: 12, title: 15.5, sub: 13, subGap: 2, chevron: 18 } as const;

/** What M2 writes under each listing. People reach a professional through paid messages, so that part is said only while they are on (lead ruling U2). */
const LISTED = 'Listed as a professional';
const VIA_PAID = 'via paid messages';

export type ServicesTabProps = { paid: PaidMessages | null; listings: readonly Listing[]; onOpenListings?: () => void; onOpenPaid?: () => void };

/**
 * M2: the person's paid messages (price and reply window, I21's settings) and each professional listing that is
 * live. Each row tells a visitor what they can buy. A listing row opens P8 with the chevron M2 draws (PROS-03,
 * R-41). The paid messages row opens I21 (INBOX-12) with the same chevron, and carries none while no way in is given.
 */
export function ServicesTab({ paid, listings, onOpenListings, onOpenPaid }: ServicesTabProps) {
  return (
    <View testID="me-services" style={styles.list}>
      {paid ? (
        onOpenPaid ? (
          <ListingRow
            testID="me-service-paid"
            icon="MessageCircle"
            tone="accent"
            title="Paid messages"
            sub={paid.replyLine ? `${paid.priceLine} · ${paid.replyLine}` : paid.priceLine}
            onPress={onOpenPaid}
          />
        ) : (
          <ServiceRow
            testID="me-service-paid"
            icon="MessageCircle"
            tone="accent"
            title="Paid messages"
            sub={paid.replyLine ? `${paid.priceLine} · ${paid.replyLine}` : paid.priceLine}
          />
        )
      ) : null}
      {listings.map((listing) => (
        onOpenListings ? (
          <ListingRow key={listing.id} testID={`me-service-listing-${listing.id}`} icon="BriefcaseBusiness" tone="neutral" title={listingTitle(listing)} sub={paid ? `${LISTED} · ${VIA_PAID}` : LISTED} onPress={onOpenListings} />
        ) : (
          <ServiceRow key={listing.id} testID={`me-service-listing-${listing.id}`} icon="BriefcaseBusiness" tone="neutral" title={listingTitle(listing)} sub={paid ? `${LISTED} · ${VIA_PAID}` : LISTED} />
        )
      ))}
    </View>
  );
}

type ServiceRowProps = { icon: IconName; tone: IconTileTone; title: string; sub: string; testID: string };

function ServiceRow({ icon, tone, title, sub, testID }: ServiceRowProps) {
  return (
    <Card testID={testID} style={styles.card}>
      <View accessible accessibilityLabel={`${title}, ${sub}`} style={styles.row}>
        <RowWords icon={icon} tone={tone} title={title} sub={sub} testID={testID} />
      </View>
    </Card>
  );
}

/** A listing row that opens P8: the card itself is the button, with the keyboard ring and the pressed look the profile's chips have. */
function ListingRow({ icon, tone, title, sub, testID, onPress }: ServiceRowProps & { onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`${testID}-open`}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.card,
        styles.pressable,
        {
          backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <View testID={testID} style={styles.row}>
        <RowWords icon={icon} tone={tone} title={title} sub={sub} testID={testID} />
        <Icon name="ChevronRight" size={serviceMetrics.chevron} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function RowWords({ icon, tone, title, sub, testID }: ServiceRowProps) {
  return (
    <>
      <IconTile icon={icon} tone={tone} />
      <View style={styles.words}>
        <Text variant="body" style={styles.title}>
          {title}
        </Text>
        <Text variant="meta" style={styles.sub} testID={`${testID}-sub`}>
          {sub}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: serviceMetrics.between },
  card: { paddingVertical: serviceMetrics.padV, paddingHorizontal: serviceMetrics.padH },
  pressable: { borderRadius: radius.card, paddingVertical: serviceMetrics.padV, paddingHorizontal: serviceMetrics.padH },
  row: { flexDirection: 'row', alignItems: 'center', gap: serviceMetrics.iconGap },
  words: { flex: 1 },
  title: { ...font(600), fontSize: serviceMetrics.title, lineHeight: canvasNormalLineHeight(serviceMetrics.title) },
  sub: { fontSize: serviceMetrics.sub, marginTop: serviceMetrics.subGap },
});
