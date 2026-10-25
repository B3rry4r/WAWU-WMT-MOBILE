import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { radius, space } from '@/theme';

import type { StoreBuyer } from './useStore';
import { NOT_OPEN_LINE, NOT_OPEN_TITLE, PAUSED_LINE, RESTORE_WORDS, storeUnavailableLine, type StoreState } from './model';
import type { Said } from './words';
import { storeOs } from './iap';

/**
 * The parts every buy screen shares (IAP-02, R-86): what is drawn when the store is not ready, how a stopped buy is said, and Restore
 * purchases. Each draws its own words only; the price on a buy screen is always the store's.
 */

/** The loading placeholder of a buy list. */
export function StoreLoading({ testID, label }: { testID: string; label: string }) {
  return (
    <LoadingView label={label} testID={testID}>
      <View style={styles.rows}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={72} radius={radius.card} />
        ))}
      </View>
    </LoadingView>
  );
}

/** What stands in for the list when the store cannot sell: not open yet, no store on this device, or a failed ask. Null when the list is ready or loading. */
export function StoreUnready({ state, onRetry, testID }: { state: StoreState; onRetry: () => void; testID: string }) {
  if (state.kind === 'not_open') {
    return <EmptyState testID={`${testID}-not-open`} icon="Clock" title={NOT_OPEN_TITLE} message={state.why === 'disabled' ? PAUSED_LINE : NOT_OPEN_LINE} />;
  }
  if (state.kind === 'store_unavailable') {
    return state.web ? (
      <EmptyState testID={`${testID}-no-store`} icon="Lock" title="Buy in the app" message={storeUnavailableLine(null)} />
    ) : (
      <ErrorState testID={`${testID}-no-store`} icon="TriangleAlert" title="The store is not available" message={storeUnavailableLine(storeOs())} onRetry={onRetry} />
    );
  }
  if (state.kind === 'error') {
    return <ErrorState testID={`${testID}-error`} icon="WifiOff" title="We couldn't load the store" message={state.message} onRetry={onRetry} />;
  }
  return null;
}

/** How a stopped buy is said, in the banner tone of its real cause. */
export function SaidBanner({ said, testID }: { said: Said | null; testID: string }) {
  if (!said) return null;
  const title = said.tone === 'danger' ? "That didn't go through" : said.tone === 'warning' ? 'Not finished yet' : 'Cancelled';
  return <Banner testID={testID} tone={said.tone === 'neutral' ? 'info' : said.tone} title={title} body={said.line} />;
}

/** Restore purchases, where a subscription lives: asks the store what this account bought and hands the Hub what it has not seen. */
export function RestoreRow({ buyer, testID, communityId }: { buyer: Pick<StoreBuyer, 'restore' | 'restoring' | 'restoreLine' | 'busy'>; testID: string; communityId?: string | null }) {
  return (
    <View style={styles.restore}>
      <Button testID={testID} label={buyer.restoring ? RESTORE_WORDS.working : RESTORE_WORDS.label} variant="secondary" full loading={buyer.restoring} disabled={buyer.busy || buyer.restoring} onPress={() => void buyer.restore(communityId ? { communityId } : undefined)} />
      {buyer.restoreLine ? (
        <Text variant="meta" tone="textMuted" testID={`${testID}-line`} accessibilityLiveRegion="polite" style={styles.centre}>
          {buyer.restoreLine}
        </Text>
      ) : (
        <Text variant="meta" tone="textMuted" style={styles.centre}>
          {RESTORE_WORDS.hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: space.md },
  restore: { gap: space.xs },
  centre: { textAlign: 'center' },
});
