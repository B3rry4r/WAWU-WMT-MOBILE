import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { IconTile, type IconTileTone } from '@/components/IconTile';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, useWawu } from '@/theme';

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

export type ServicesTabProps = { paid: PaidMessages | null; listings: readonly Listing[]; onOpenListings?: () => void };

/**
 * M2: the person's paid messages (price and reply window, I21's settings) and each professional listing that is
 * live. Each row tells a visitor what they can buy. A listing row opens P8 with the chevron M2 draws (PROS-03,
 * R-41). The way into I21 from the paid messages row is added by INBOX-12, so that row carries no chevron yet.
 */
export function ServicesTab({ paid, listings, onOpenListings }: ServicesTabProps) {
  return (
    <View testID="me-services" style={styles.list}>
      {paid ? (
        <ServiceRow
          testID="me-service-paid"
          icon="MessageCircle"
          tone="accent"
          title="Paid messages"
          sub={paid.replyLine ? `${paid.priceLine} · ${paid.replyLine}` : paid.priceLine}
        />
      ) : null}
      {listings.map((listing) => (
        <ServiceRow key={listing.id} testID={`me-service-listing-${listing.id}`} icon="BriefcaseBusiness" tone="neutral" title={listingTitle(listing)} sub={paid ? `${LISTED} · ${VIA_PAID}` : LISTED} onPress={onOpenListings} />
      ))}
    </View>
  );
}

type ServiceRowProps = { icon: IconName; tone: IconTileTone; title: string; sub: string; testID: string; onPress?: () => void };

function ServiceRow({ icon, tone, title, sub, testID, onPress }: ServiceRowProps) {
  const { colors } = useWawu();
  const press = onPress ? { accessibilityRole: 'button' as const, onPress } : {};
  return (
    <Card testID={testID} style={styles.card}>
      <Pressable disabled={!onPress} accessible accessibilityLabel={`${title}, ${sub}`} testID={`${testID}-open`} style={styles.row} {...press}>
        <IconTile icon={icon} tone={tone} />
        <View style={styles.words}>
          <Text variant="body" style={styles.title}>
            {title}
          </Text>
          <Text variant="meta" style={styles.sub} testID={`${testID}-sub`}>
            {sub}
          </Text>
        </View>
        {onPress ? <Icon name="ChevronRight" size={serviceMetrics.chevron} color={colors.textMuted} /> : null}
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: serviceMetrics.between },
  card: { paddingVertical: serviceMetrics.padV, paddingHorizontal: serviceMetrics.padH },
  row: { flexDirection: 'row', alignItems: 'center', gap: serviceMetrics.iconGap },
  words: { flex: 1 },
  title: { ...font(600), fontSize: serviceMetrics.title, lineHeight: canvasNormalLineHeight(serviceMetrics.title) },
  sub: { fontSize: serviceMetrics.sub, marginTop: serviceMetrics.subGap },
});
