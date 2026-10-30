import type { ReactNode } from 'react';

import { IconTile } from '@/components/IconTile';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { ICON_STROKE } from '@/components/icon';
import { isPicture, tickKind } from '@/features/feed/model';
import { StatusSheet } from '@/features/feedpay/StatusSheet';
import { StoreUnready } from '@/features/store/StoreParts';
import type { FeedItem } from '@/features/feed/api';
import type { Ladder } from '@/features/store/ladder/useLadder';
import { StoreBuySheet, storeLabel } from '@/features/store/ladder/StoreBuySheet';
import { layout, space } from '@/theme';

import { openIcon, openLabel, sheetSubtitle, unlockedLine, unlockPayee } from './model';

const MARK = layout.tapMin + space.s3xl - space.xs;
const YOURS = [{ label: 'Yours', value: 'Forever, in My purchases' }] as const;

/**
 * H14 and H16 for a phone with a store (R-101): "Unlock" is a store purchase of the piece. The head and the rows are the wallet sheet's own;
 * the price is the store's, there is no wallet, PIN or bank charge, and a credit that covers the price is offered first ("Use your credit",
 * no store sheet). The Hub says what the payment is for before the store sheet opens, so a piece that is free now, theirs, or taken down is
 * refused before anything is charged. A paid unlock ends on H16 with what was paid and where.
 */
export function StoreUnlockSheet({ item, ladder, onDone }: { item: FeedItem; ladder: Ladder; onDone: () => void }) {
  const { buyer } = ladder;
  const list = item.price;
  const entry = ladder.itemFor(list);
  const credit = ladder.creditFor('content', list);

  if (buyer.granted) {
    const withCredit = Boolean(buyer.granted.paidWithCredit);
    return (
      <StatusSheet
        visible
        onClose={onDone}
        label="Unlocked"
        testID="unlock-done"
        mark={<IconTile icon="Check" tone="in" size={MARK} strokeWidth={ICON_STROKE.fab} />}
        title="Unlocked"
        line={unlockedLine(item)}
      >
        <GroupedList testID="unlock-receipt">
          {[
            <KeyValueRow key="paid" label="Paid" value={withCredit ? 'Your credit' : (entry?.price ?? '')} />,
            <KeyValueRow key="from" label="From" value={withCredit ? 'Who Made This' : storeLabel()} />,
          ]}
        </GroupedList>
        <Button testID="unlock-open" label={openLabel(item)} icon={openIcon(item)} onPress={onDone} full />
      </StatusSheet>
    );
  }

  let unready: ReactNode = null;
  if (ladder.state.kind === 'ready') {
    if (entry === null) unready = <StoreUnready state={{ kind: 'not_open', why: 'not_configured' }} onRetry={ladder.refetch} testID="unlock-store" />;
  } else if (ladder.state.kind !== 'loading') {
    unready = <StoreUnready state={ladder.state} onRetry={ladder.refetch} testID="unlock-store" />;
  }
  return (
    <StoreBuySheet
      visible
      testID="unlock-store-sheet"
      label="Unlock"
      head={{
        title: item.title,
        by: unlockPayee(item.creator ?? { displayName: null, handle: null }),
        verified: tickKind(item.creator) ?? undefined,
        subtitle: sheetSubtitle(item),
        image: isPicture(item.previewAssetUrl) ? item.previewAssetUrl : undefined,
      }}
      price={entry?.price ?? null}
      details={YOURS}
      actionLabel="Unlock"
      busy={buyer.busy}
      said={buyer.said}
      credit={credit ? { line: 'A credit from an earlier purchase pays for this piece.' } : null}
      unready={unready}
      onBuy={() => void buyer.buyLadder({ kind: 'content', contentId: item.id, listPriceNaira: list })}
      onUseCredit={() => void buyer.buyLadder({ kind: 'content', contentId: item.id, listPriceNaira: list }, 'credit')}
      onCancel={onDone}
    />
  );
}
