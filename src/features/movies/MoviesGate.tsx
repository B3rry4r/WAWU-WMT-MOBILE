import { useEffect, type ReactNode } from 'react';

import { queryClient } from '@/api/query';

import { useMoviesHome } from './api';

/**
 * Every Flix screen sits inside this (R-27, R-47): when the Hub answers `enabled: false` no Flix screen is drawn, so a person who
 * reaches one by an old link is sent out (`onOff`) and sees nothing of it. While the answer is on its way nothing is drawn (it is
 * the answer the rails on Home and Explore already hold), except on Flix movies itself (`showWhilePending`), whose own loading
 * view is MV11. A read that fails lets the screen draw: it says for itself that it could
 * not load.
 */
export function MoviesGate({ onOff, showWhilePending = false, children }: { onOff: () => void; showWhilePending?: boolean; children: ReactNode }) {
  const home = useMoviesHome(queryClient);
  const off = home.data?.enabled === false;
  useEffect(() => {
    if (off) onOff();
  }, [off, onOff]);
  if (off || (home.isPending && !showWhilePending)) return null;
  return <>{children}</>;
}
