import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Icon } from '@/components/icon';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { canvasNormalLineHeight, useWawu } from '@/theme';

import { myPassQuery, type MyPass } from '../api/pass';
import { PassCard, PASS } from './PassCard';

/** design/_gen/wallet.js line 96 (W44): the pass and what it gets you stand 18 apart; the label and its lines 10, the lines 8 from their ticks, all on the canvas's normal line height. */
const BODY_GAP = 18;
const LINES = { rows: 10, tick: 15, tickStroke: 2.6, between: 8, size: 14, label: 11 } as const;
/** The loading view's stand-in for the pass: the card's corner and a height close to its words (name, tier, date). */
const SKELETON = { card: 128 } as const;

/**
 * W44 · Your pass, read from `GET /me/tier` `eventPass`: the pass's name, the tier that gave it and the day of the event
 * ("Date to be announced" until the Hub sends one), then "What it gets you" with the Hub's lines. The lines are drawn only
 * when the Hub has some (TIER-06, G-804). The event's name and the QR code have no source (G-814) and are not drawn; the
 * board's "Example values." footnote is a designer note and is not printed.
 *
 * A person with no pass who reaches this screen sees the empty state; a read that fails is the error state, with Try again.
 */
export function PassScreen({ onBack }: { onBack: () => void }) {
  const owner = useSessionAccount(undefined);
  const pass = useQuery(myPassQuery(owner), queryClient);

  let body: React.ReactNode;
  if (pass.data === undefined && pass.isError) {
    body = (
      <ErrorState
        testID="pass-error"
        icon={isApiError(pass.error) && pass.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title="We couldn't load your pass"
        message={isApiError(pass.error) ? pass.error.message : 'Something went wrong. Try again.'}
        onRetry={() => void pass.refetch()}
      />
    );
  } else if (pass.data === undefined) {
    body = <Loading />;
  } else if (pass.data === null) {
    body = (
      <EmptyState
        testID="pass-none"
        icon="Ticket"
        title="You don't have a pass yet"
        message="Your event pass shows here once your plan includes one."
      />
    );
  } else {
    body = <Pass pass={pass.data} />;
  }

  return (
    <ScreenFrame idPrefix="settings" title="Your pass" onBack={onBack} gap={BODY_GAP} testID="pass-screen">
      {body}
    </ScreenFrame>
  );
}

function Pass({ pass }: { pass: MyPass }) {
  return (
    <>
      <PassCard pass={pass} />
      {pass.benefits.length > 0 ? <Benefits lines={pass.benefits} /> : null}
    </>
  );
}

/** "What it gets you": a ticked line for each the Hub sent, in its order. */
function Benefits({ lines }: { lines: string[] }) {
  const { colors } = useWawu();
  return (
    <View testID="pass-benefits" style={styles.benefits}>
      <Text variant="label" accessibilityRole="header" style={{ lineHeight: canvasNormalLineHeight(LINES.label) }}>
        What it gets you
      </Text>
      {lines.map((line, i) => (
        <View key={`${i}-${line}`} testID="pass-benefit" style={styles.line}>
          <Icon name="Check" size={LINES.tick} color={colors.positive} strokeWidth={LINES.tickStroke} />
          <Text variant="body" style={styles.lineText}>
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The page before the Hub has answered: the pass's shape, never a name or a date. */
function Loading() {
  return (
    <LoadingView label="Loading your pass" testID="pass-loading">
      <Skeleton height={SKELETON.card} radius={PASS.radius} />
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  benefits: { gap: LINES.rows },
  line: { flexDirection: 'row', alignItems: 'center', gap: LINES.between },
  lineText: { flex: 1, minWidth: 0, fontSize: LINES.size, lineHeight: canvasNormalLineHeight(LINES.size) },
});
