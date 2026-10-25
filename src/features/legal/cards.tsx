import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { font } from '@/theme';

import { iconOf } from './fixed/model';
import type { LegalFixedPrice } from './api';
import { matterMetrics as m } from './look2';
import { normal } from './look';

/** The matter's statuses a consultation can still be booked from (the Hub's booking route takes these and no others). */
const BOOKABLE = ['draft', 'awaiting_quote', 'awaiting_consultation_payment'];

/** What the consultant's card in the chat offers: to book while the consultation can be booked, to open the matter once it has moved on, nothing once it is closed. */
export function matterCardOf(requestStatus: string | null, requestPath: string | null = null): 'book' | 'open' | null {
  if (requestStatus === null || requestStatus === 'cancelled') return null;
  // A fixed-price matter has no consultation to book (the Hub refuses it): its card only ever opens the matter.
  if (requestPath === 'simple') return 'open';
  return BOOKABLE.includes(requestStatus) ? 'book' : 'open';
}

/** S17 · the card under the consultant's lines: "Book a consultation". Once booked it is the way back to the matter (S20 to S23). */
export function MatterCard({ kind, matterLabel, onPress }: { kind: 'book' | 'open'; matterLabel: string; onPress: () => void }) {
  return (
    <Card testID="legal-matter-card" style={styles.slim}>
      <View style={styles.row}>
        <IconTile icon={kind === 'book' ? 'Video' : 'FileText'} tone="accent" size={m.chatCardTile} />
        <View style={styles.flex}>
          <Text variant="body" style={[font(600), { fontSize: m.chatCardTitle, lineHeight: normal(m.chatCardTitle) }]}>
            {kind === 'book' ? 'Book a consultation' : matterLabel}
          </Text>
          <Text variant="body" tone="textMuted" style={{ fontSize: m.chatCardSub, lineHeight: normal(m.chatCardSub), marginTop: m.mediumSubTop }}>
            {kind === 'book' ? 'Video, phone or in person' : 'See where your request stands'}
          </Text>
        </View>
        <Button label={kind === 'book' ? 'Book' : 'Open'} onPress={onPress} size="sm" testID="legal-matter-card-button" />
      </View>
    </Card>
  );
}

/** S24 · the fixed-price card under the assistant's line: the service, what it is, the price WAWU set, and "Start this request". */
export function FixedPriceCard({ service, onStart }: { service: LegalFixedPrice; onStart: () => void }) {
  return (
    <Card testID="legal-fixed-card-chat" style={styles.fixed}>
      <View style={styles.row}>
        <IconTile icon={iconOf(service)} tone="accent" size={m.chatCardTile} />
        <View style={styles.flex}>
          <Text variant="body" style={[font(600), { fontSize: m.chatCardTitle, lineHeight: normal(m.chatCardTitle) }]}>
            {service.name}
          </Text>
          {service.blurb ? (
            <Text variant="body" tone="textMuted" numberOfLines={2} style={{ fontSize: m.chatCardSub, lineHeight: normal(m.chatCardSub), marginTop: m.mediumSubTop }}>
              {service.blurb}
            </Text>
          ) : null}
        </View>
        <Money minorUnits={service.priceNaira * 100} size={m.chatCardPrice} weight={700} decimals={false} />
      </View>
      <Button label="Start this request" onPress={onStart} size="md" full testID="legal-fixed-start" />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: m.chatCardGap },
  slim: { paddingVertical: m.chatCardPadSlim, paddingHorizontal: m.chatCardPad },
  fixed: { padding: m.chatCardPad, gap: m.chatCardGap },
});
