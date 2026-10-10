import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { formatCredits } from '@/components/Credits';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { font, space } from '@/theme';

import { wawuCredits } from './format';
import { useCredits, useMessageCost } from './useCredits';

/**
 * design/_gen/inbox.js line 70: a card with 12 and 14 of padding holding a 44 coin tile, the balance in 15 / 600 and a
 * 12.5 line under it. The Buy button the design puts on its right is INBOX-13's (docs/WORKFLOW.md section 7).
 */
const stripMetrics = { padV: 12, padH: 14, tile: 44, balance: 15, line: 12.5, lineGap: 2, between: space.md } as const;

/**
 * I24's strip: the person's WAWU Credits as a count, what is free and what is not. The balance is the server's
 * (`GET /credits`) and so is the price of a message (`GET /communities/message-cost`, G-450): "Reading is free ·
 * 1 credit per message you send". Until the price is known (loading, or it could not be read) the strip says only
 * "Reading is free", which is always true because the room's history route never touches credits.
 */
export function CreditsStrip() {
  const credits = useCredits();
  const cost = useMessageCost();
  const price = cost.data && cost.data.creditsPerMessage > 0 ? ` · ${formatCredits(cost.data.creditsPerMessage)} per message you send` : '';
  return (
    <Card padded style={styles.card} testID="credits-strip">
      <View style={styles.row}>
        <IconTile icon="Coins" tone="accent" size={stripMetrics.tile} />
        <View style={styles.words}>
          {credits.data ? (
            <Text variant="body" style={[font(600), { fontSize: stripMetrics.balance }]} testID="credits-strip-balance">
              {wawuCredits(credits.data.creditBalance)}
            </Text>
          ) : credits.isError ? (
            <Text variant="body" style={[font(600), { fontSize: stripMetrics.balance }]}>
              WAWU Credits
            </Text>
          ) : (
            <Skeleton width={stripMetrics.tile * 2} height={stripMetrics.balance} testID="credits-strip-loading" />
          )}
          <Text variant="caption" tone="textMuted" style={[styles.line, { fontSize: stripMetrics.line }]}>
            {credits.isError ? 'Your balance could not be read' : `Reading is free${price}`}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: stripMetrics.padV, paddingHorizontal: stripMetrics.padH },
  row: { flexDirection: 'row', alignItems: 'center', gap: stripMetrics.between },
  words: { flex: 1, minWidth: 0 },
  line: { marginTop: stripMetrics.lineGap },
});
