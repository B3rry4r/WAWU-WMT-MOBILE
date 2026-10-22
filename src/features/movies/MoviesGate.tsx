import { useEffect, type ReactNode } from 'react';

import { queryClient } from '@/api/query';

import { useMoviesHome } from './api';

/**
 * Every Flix screen sits inside this (R-27, R-47): when the Hub answers `enabled: false` no Flix screen is drawn, so a person who
 * reaches one by an old link is sent out (`onOff`) and sees nothing of it. While the answer is on its way nothing is drawn (it is
 * the answer the rails on Home and Explore already hold). A read that fails lets the screen draw: it says for itself that it could
 * not load.
 */
export function MoviesGate({ onOff, children }: { onOff: () => void; children: ReactNode }) {
  const home = useMoviesHome(queryClient);
  const off = home.data?.enabled === false;
  useEffect(() => {
    if (off) onOff();
  }, [off, onOff]);
  if (off || home.isPending) return null;
  return <>{children}</>;
}
