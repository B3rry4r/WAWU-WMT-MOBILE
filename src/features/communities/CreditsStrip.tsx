import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { font, space } from '@/theme';

import { chatLine, wawuCredits } from './format';
import { useCredits, useMessageCost } from './useCredits';

/**
 * design/_gen/inbox.js line 70: a card with 12 and 14 of padding holding a 44 coin tile, the balance in 15 / 600 and a
 * 12.5 line under it, and a small Buy button on its right that opens I28 (INBOX-13).
 */
const stripMetrics = { padV: 12, padH: 14, tile: 44, balance: 15, line: 12.5, lineGap: 2, between: space.md } as const;

/**
 * I24's strip: the person's WAWU Credits as a count, what is free and what is not. The balance is the server's
 * (`GET /credits`) and so are the prices (`GET /communities/message-cost`, R-62): "Chat free · photos, video, voice use
 * credits". Until the prices are known (loading, or they could not be read) the strip says only "Reading is free", which
 * is always true because the room's history route never touches credits.
 */
export function CreditsStrip({ onBuy }: { onBuy?: () => void }) {
  const credits = useCredits();
  const cost = useMessageCost();
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
            {credits.isError ? 'Your balance could not be read' : cost.data ? chatLine(cost.data.creditsByKind) : 'Reading is free'}
          </Text>
        </View>
        {onBuy ? <Button testID="credits-strip-buy" label="Buy" variant="secondary" size="sm" onPress={onBuy} /> : null}
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
