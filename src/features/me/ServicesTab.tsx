import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { IconTile, type IconTileTone } from '@/components/IconTile';
import type { IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font } from '@/theme';

import type { Listing } from './api';
import { listingTitle, type PaidMessages } from './model';

/**
 * design/_gen/me.js line 27, `services`: cards 10 apart, 14 by 16 inside, the 44 icon circle 12 from the
 * words, a 15.5 at 600 title and a 13 muted line 2 under it.
 */
const serviceMetrics = { between: 10, padV: 14, padH: 16, iconGap: 12, title: 15.5, sub: 13, subGap: 2 } as const;

/** What a listed professional is reached by, as M2 writes it under each listing. */
const LISTING_LINE = 'Listed as a professional · via paid messages';

export type ServicesTabProps = { paid: PaidMessages | null; listings: readonly Listing[] };

/**
 * M2: the person's paid messages (price and reply window, I21's settings) and each professional listing that is
 * live. Each row tells a visitor what they can buy. The way into I21 and into the listings (P8) is added by
 * INBOX-12 and PROS-03 (R-41), so here the rows carry no chevron and open nothing.
 */
export function ServicesTab({ paid, listings }: ServicesTabProps) {
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
        <ServiceRow key={listing.id} testID={`me-service-listing-${listing.id}`} icon="BriefcaseBusiness" tone="neutral" title={listingTitle(listing)} sub={LISTING_LINE} />
      ))}
    </View>
  );
}

function ServiceRow({ icon, tone, title, sub, testID }: { icon: IconName; tone: IconTileTone; title: string; sub: string; testID: string }) {
  return (
    <Card testID={testID} style={styles.card}>
      <View accessible accessibilityLabel={`${title}, ${sub}`} style={styles.row}>
        <IconTile icon={icon} tone={tone} />
        <View style={styles.words}>
          <Text variant="body" style={styles.title}>
            {title}
          </Text>
          <Text variant="meta" style={styles.sub} testID={`${testID}-sub`}>
            {sub}
          </Text>
        </View>
      </View>
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
