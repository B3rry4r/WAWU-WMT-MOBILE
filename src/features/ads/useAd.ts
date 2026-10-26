import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { adKey, adListKey, adOpensSomething, fetchAd, fetchAdList, reportAd, type AdCard, type AdEventKind, type AdListPlacement, type AdPlacement } from './api';

/**
 * The live card for a place. A sponsored card is never a reason to draw a frame or an error: while it is on its
 * way, when there is none and when it cannot be read, `data` is simply not a card and the screen shows nothing.
 * Not retried (a card that arrives late helps nobody), and not read again when the app returns to the front, so a
 * card on screen never changes under a finger.
 */
export function useAd(placement: AdPlacement, enabled = true, client?: QueryClient) {
  return useQuery(
    {
      queryKey: adKey(placement),
      queryFn: () => fetchAd(placement),
      enabled,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    client,
  );
}

/**
 * The live cards for a place that serves a list (the Explore slider). The same rule as one card: a read that is on its
 * way, that found none or that failed is an empty list, never a frame or an error. Not retried and not read again when
 * the app returns to the front.
 */
export function useAdList(placement: AdListPlacement, enabled = true, client?: QueryClient) {
  return useQuery(
    {
      queryKey: adListKey(placement),
      queryFn: () => fetchAdList(placement),
      enabled,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    client,
  );
}

/**
 * What the Hub is told about a card (ADS-05): one view when it is on screen, one tap when its button is pressed, one
 * skip when Skip is. Each is sent at most once for a card by this screen; the Hub itself keeps one of each kind per
 * person per day, so a screen opened again changes nothing. A report that cannot be sent is not shown to anyone,
 * only the day's count misses one. A card that does nothing (R-92, `none`) is viewed and never tapped: nothing on it is a tap, so
 * no tap is sent for it whatever calls `tap` (SWEEP-1026 row 1).
 */
export function useAdReports(ad: AdCard | null | undefined, showing: boolean) {
  const sent = useRef(new Set<string>());
  const id = ad?.id;

  const report = useCallback((card: string, kind: AdEventKind) => {
    const key = `${card}:${kind}`;
    if (sent.current.has(key)) return;
    sent.current.add(key);
    void reportAd(card, kind).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (id && showing) report(id, 'view');
  }, [id, showing, report]);

  return {
    tap: useCallback(() => {
      if (id && ad && adOpensSomething(ad)) report(id, 'tap');
    }, [id, ad, report]),
    skip: useCallback(() => {
      if (id) report(id, 'skip');
    }, [id, report]),
    /**
     * A tap on a card that is not the one this hook was given (EXPLORE-07 L1): the Explore slider is bound to the slide on
     * screen, and a press can land on a slide beside it while the strip is between two. The tap is for the card pressed.
     */
    tapOf: useCallback(
      (card: AdCard) => {
        if (adOpensSomething(card)) report(card.id, 'tap');
      },
      [report],
    ),
  };
}
