import { useQuery } from '@tanstack/react-query';

import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { plansQuery } from '@/features/verify/purchaseApi';

import { HostGate, type GateWords } from './HostEnds';
import { fromLine, tierNamesLine, type HostTierRefusal } from './hostTier';

export type HostGateScreenProps = {
  /** What the Hub said when it turned a host action down. Absent when the screen decided from the person's own tier before asking. */
  refusal: HostTierRefusal | null;
  onBack: () => void;
  /** See tiers opens VF5 (the tiers). The button is not drawn without it. */
  onSeeTiers?: () => void;
};

/**
 * E21 · Needs a tier, with its words read from the Hub. A tier that ended is told in the Hub's own sentence when the Hub refused (it
 * carries the price too, so nothing waits on the plan); every other case lists the tier names and "From" the lowest price, both from
 * `GET /plans`. Nothing here is a figure of the app's own.
 */
export function HostGateScreen({ refusal, onBack, onSeeTiers }: HostGateScreenProps) {
  const owner = useSessionAccount(undefined);
  const plans = useQuery(plansQuery(owner));
  const hubWords = refusal && refusal.tierState === 'ended' && refusal.message.trim() !== '' ? refusal.message : null;
  const hubPrice = Boolean(refusal?.lowestTier && refusal.currency);

  let words: GateWords;
  if (hubWords && hubPrice) {
    words = { state: 'ready', lines: [hubWords, fromLine(null, refusal)].filter((line): line is string => Boolean(line)) };
  } else if (plans.data) {
    words = { state: 'ready', lines: [hubWords ?? tierNamesLine(plans.data), fromLine(plans.data, refusal)].filter((line): line is string => Boolean(line)) };
  } else if (plans.isError) {
    words = { state: 'failed', onRetry: () => void plans.refetch() };
  } else {
    words = { state: 'loading' };
  }
  return <HostGate words={words} onBack={onBack} onSeeTiers={onSeeTiers} />;
}
