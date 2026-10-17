import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, radius, space } from '@/theme';

import { draftsKey, fetchDrafts } from './api';
import { DraftCard, ReadyCard, ShopFrame } from './parts';

/** VF2a: a 56 neutral tile, a 19 title, a 15 line held to 280 wide, a pill button; the block sits in the middle of the room under the ring. */
const empty = { tile: 56, maxWidth: 280, title: 19, line: 15, gap: space.md } as const;

export type ShopScreenProps = {
  onBack: () => void;
  /** The plus in the bar, and "Add a product" on the empty shop: opens the form on a new draft. */
  onAdd: () => void;
  onOpenDraft: (id: string) => void;
};

/**
 * VF2, VF2a and VF2b · Your shop. The person's drafts (`GET /product-drafts`, newest first) under a "Shop ready" ring worked out from
 * them, each tagged Draft; the plus in the bar and, with none yet, "Add a product" start another. Drafts are free, so nothing here
 * asks for a tier. How many drafts a person may keep is the Hub's number (G-662): the form shows its answer when the next is refused.
 * Not drawn: the "Hear your name" row (VF3, VERIFY-02) and publishing (VERIFY-04), which add their entries when they are built (R-47).
 */
export function ShopScreen({ onBack, onAdd, onOpenDraft }: ShopScreenProps) {
  const drafts = useQuery({ queryKey: draftsKey, queryFn: fetchDrafts });
  const list = drafts.data ?? null;

  return (
    <ShopFrame testID="shop-screen" title="Your shop" onBack={onBack} trailing={{ icon: 'Plus', label: 'Add a product', onPress: onAdd, testID: 'shop-add' }}>
      {drafts.isError && !list ? (
        <ErrorState
          testID="shop-error"
          title="Your drafts did not load"
          message={isApiError(drafts.error) ? drafts.error.message : 'Check your connection and try again.'}
          onRetry={() => void drafts.refetch()}
        />
      ) : !list ? (
        <LoadingView label="Loading your shop" testID="shop-loading">
          <View style={styles.list}>
            <Skeleton height={92} radius={radius.card} />
            <Skeleton height={76} radius={radius.card} />
            <Skeleton height={76} radius={radius.card} />
          </View>
        </LoadingView>
      ) : (
        <>
          <ReadyCard drafts={list} />
          {list.length === 0 ? (
            <View testID="shop-empty" style={styles.empty}>
              <IconTile icon="Store" size={empty.tile} />
              <Text variant="h3" accessibilityRole="header" style={[font(700), styles.emptyTitle]}>
                Add your first product
              </Text>
              <Text variant="body" tone="textSecondary" style={styles.emptyLine}>
                Title, price and how it looks. Files come later.
              </Text>
              <Button testID="shop-empty-add" label="Add a product" onPress={onAdd} />
            </View>
          ) : (
            <View testID="shop-drafts" style={styles.list}>
              {list.map((draft) => (
                <DraftCard key={draft.id} draft={draft} onPress={() => onOpenDraft(draft.id)} />
              ))}
            </View>
          )}
        </>
      )}
    </ShopFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: empty.gap, paddingBottom: space.s3xl * 2 },
  emptyTitle: { fontSize: empty.title, textAlign: 'center' },
  emptyLine: { fontSize: empty.line, textAlign: 'center', maxWidth: empty.maxWidth, marginBottom: space.xs },
});
