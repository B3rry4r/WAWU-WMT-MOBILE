import type { ReactNode } from 'react';

import type { FeedItem } from '@/features/feed/api';
import { creatorName, hueFor } from '@/features/feed/model';
import { AskSheets } from '@/features/paid-ask/AskSheets';
import { useAsk, type AskTarget } from '@/features/paid-ask/useAsk';
import { TipSheets } from '@/features/tips/TipSheets';
import { useTip } from '@/features/tips/useTip';
import { UnlockSheets } from '@/features/unlock/UnlockSheets';
import { useUnlock } from '@/features/unlock/useUnlock';

import type { FlowHandlers } from './usePaymentFlow';

const NOT_WIRED: FlowHandlers = {
  onOpenWallet: () => undefined,
  onSetPin: () => undefined,
  onForgotPin: () => undefined,
  onAddMoney: () => undefined,
};

/**
 * What the For you and Following feed pays for: a tip from the rail (HOME-13), an unlock from the offer bar (HOME-12) and a paid
 * question from a professional card's Message (H10, I3). One of each serves the whole feed, so the sheets live here, once, and a post
 * only says "tip this" or "unlock this", a card "ask this person".
 *
 * With no `handlers` the feed draws no ₦ Tip and the offer bar starts nothing (R-47: an entry is drawn only when what it opens is
 * wired), which is how the feed renders on its own in tests and previews. Message is wired only with `handlers` AND `onOpenPaidThread`
 * (where a paid question ends, I4). `focused` is false while another screen (Add money) is on top, so the ask sheet quotes again on return.
 */
export function useFeedPay(
  handlers: FlowHandlers | undefined,
  { onOpenPaidThread, focused = true }: { onOpenPaidThread?: (creatorWawuId: string) => void; focused?: boolean } = {},
): {
  onTip?: (item: FeedItem) => void;
  onUnlock?: (item: FeedItem) => void;
  /** H10's Message: opens the paid-ask sheet for this person. Undefined unless the feed can start and finish a paid question. */
  onMessage?: (target: AskTarget) => void;
  /** The post whose price is being asked for (its offer bar waits). */
  unlockingId: string | null;
  sheets: ReactNode;
} {
  const wired = handlers ?? NOT_WIRED;
  const tip = useTip(wired);
  const unlock = useUnlock(wired);
  const ask = useAsk(wired, (who) => onOpenPaidThread?.(who), focused);
  if (!handlers) return { unlockingId: null, sheets: null };
  return {
    unlockingId: unlock.asking ? (unlock.item?.id ?? null) : null,
    onUnlock: unlock.begin,
    onMessage: onOpenPaidThread ? ask.begin : undefined,
    onTip: (item) =>
      tip.begin({
        wawuId: item.creatorWawuId,
        name: creatorName(item.creator),
        avatarUrl: item.creator?.avatarUrl ?? null,
        hue: hueFor(item.creatorWawuId),
      }),
    sheets: (
      <>
        <TipSheets tip={tip} onAddMoney={handlers.onAddMoney} onOpenWallet={handlers.onOpenWallet} onForgotPin={handlers.onForgotPin} />
        <UnlockSheets unlock={unlock} onAddMoney={handlers.onAddMoney} onOpenWallet={handlers.onOpenWallet} onForgotPin={handlers.onForgotPin} />
        {onOpenPaidThread ? <AskSheets ask={ask} onAddMoney={handlers.onAddMoney} onOpenWallet={handlers.onOpenWallet} onForgotPin={handlers.onForgotPin} /> : null}
      </>
    ),
  };
}
