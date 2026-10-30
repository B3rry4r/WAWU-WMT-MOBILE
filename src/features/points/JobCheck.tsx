import { useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { PointsFigure } from '@/components/PointsFigure';
import { EmptyState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { space } from '@/theme';

import { fetchJobQuote, type JobInput, type JobQuote } from './studioApi';
import { CAP_WORDS, capMessage, capTitle, SHEET_WORDS, verdictOf } from './studioModel';
import { PointsFrame } from './PointsFrame';

/** The board's sheet stacks its parts 12 apart (points.js `pt3`, the sheet's second argument). */
const SHEET_GAP = space.md;

export type JobCheckOptions = {
  /** The Hub says the points cover the job and no cap stops it: now, or after the missing points were bought. The quote's `quoteToken` is what the job carries. */
  onReady: (quote: JobQuote, job: JobInput) => void;
  /** Buy points (PT4): the sheet's Buy points opens the store packs. */
  onBuyPoints: () => void;
  /** "Back to AI tools" on the daily limit (PT7). */
  onLeave: () => void;
};

/** The route Buy points lives at (PT4): a trip there is not leaving. */
const BUY_PATH = '/points-buy';

type View_ = { kind: 'sheet'; job: JobInput; quote: JobQuote } | { kind: 'cap'; job: JobInput; quote: JobQuote } | null;

/**
 * The check before a job runs (PT3, PT7), for the screen that runs one tool (POINTS-08's VoiceOver; every later tool). The screen calls
 * `check(job)` when the person taps Run; the Hub quotes the job (`POST /points/quote`: nothing held, nothing taken) and:
 *
 * - the points cover it and no cap stops it: `onReady(quote, job)`, and nothing is drawn here;
 * - a cap stops it (a daily or per-job limit): PT7, in the Hub's own words (it names the cap and when it resets);
 * - the points fall short: the sheet, with the cost, what the person has and what is missing, and Buy points. Points are bought in the
 *   store sheet on the Buy points screen (R-86), never with the wallet; when the person comes back to this screen the Hub quotes the job
 *   again, so the job only runs when the Hub's own count says it can.
 *
 * `node` is rendered by the screen. `checking` is true while the quote is being asked for (the Run button's busy state).
 */
export function useJobCheck(options: JobCheckOptions): { check: (job: JobInput) => void; checking: boolean; node: ReactNode } {
  const [view, setView] = useState<View_>(null);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = useRef(false);
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  // The job the person left for Buy points, and the screen they left from: when this screen is shown again the Hub quotes it again, so
  // the job runs if the points arrived. The trip ends when they come back, when they go anywhere that is not this screen or Buy points,
  // and when this screen goes away; after that nothing is quoted unasked.
  const buying = useRef<{ job: JobInput; from: string } | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    const trip = buying.current;
    if (trip && pathname !== trip.from && pathname !== BUY_PATH) buying.current = null;
  }, [pathname]);
  useEffect(
    () => () => {
      buying.current = null;
    },
    [],
  );

  /** Puts a quote where it belongs: the job runs, or the cap, or the sheet. */
  const settle = useCallback((job: JobInput, quote: JobQuote) => {
    const verdict = verdictOf(quote);
    if (verdict === 'ready') {
      setView(null);
      latest.current.onReady(quote, job);
    } else if (verdict === 'cap') setView({ kind: 'cap', job, quote });
    else if (verdict === 'short') setView({ kind: 'sheet', job, quote });
    else {
      setView(null);
      setNotice(SHEET_WORDS.checkFailed);
    }
  }, []);

  const check = useCallback(
    (job: JobInput) => {
      if (busy.current) return;
      busy.current = true;
      setChecking(true);
      setNotice(null);
      fetchJobQuote(job)
        .then((quote) => settle(job, quote))
        .catch((error: unknown) => setNotice(isApiError(error) && error.message ? error.message : SHEET_WORDS.checkFailed))
        .finally(() => {
          busy.current = false;
          setChecking(false);
        });
    },
    [settle],
  );

  /** The quote again, after the person came back from buying points. */
  const requote = useCallback(
    async (job: JobInput) => {
      try {
        settle(job, await fetchJobQuote(job));
      } catch (error) {
        setNotice(isApiError(error) && error.message ? error.message : SHEET_WORDS.checkFailed);
      }
    },
    [settle],
  );

  useFocusEffect(
    useCallback(() => {
      const trip = buying.current;
      if (!trip) return;
      buying.current = null;
      void requote(trip.job);
    }, [requote]),
  );

  const node = (
    <>
      {view?.kind === 'sheet' ? (
        <ShortfallSheet
          key="shortfall"
          quote={view.quote}
          onClose={() => setView(null)}
          onBuyPoints={() => {
            buying.current = { job: view.job, from: pathname };
            setView(null);
            options.onBuyPoints();
          }}
        />
      ) : null}
      {view?.kind === 'cap' ? (
        <CapReachedScreen
          quote={view.quote}
          onBack={() => {
            setView(null);
            options.onLeave();
          }}
        />
      ) : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="job-check-notice" /> : null}
    </>
  );
  return { check, checking, node };
}

type ShortfallSheetProps = {
  quote: JobQuote;
  onClose: () => void;
  onBuyPoints: () => void;
};

/**
 * PT3a · Not enough points. Every figure is the Hub's quote: what the job costs, what the person has and what is missing. Buy points opens
 * the store packs (R-86): packs are whole, so the person buys a pack, not exactly what is missing, and the job is checked again when they
 * come back.
 */
export function ShortfallSheet({ quote, onClose, onBuyPoints }: ShortfallSheetProps) {
  return (
    <BottomSheet visible onClose={onClose} label={SHEET_WORDS.title} gap={SHEET_GAP} testID="shortfall-sheet">
      <Text variant="sheetTitleSm" accessibilityRole="header">
        {SHEET_WORDS.title}
      </Text>
      <GroupedList testID="shortfall-figures">
        <KeyValueRow label={SHEET_WORDS.costs} value={<PointsFigure count={quote.costPoints} size="line" testID="shortfall-cost" />} />
        <KeyValueRow label={SHEET_WORDS.have} value={<PointsFigure count={quote.balancePoints} size="line" testID="shortfall-have" />} />
        <KeyValueRow label={SHEET_WORDS.short} value={<PointsFigure count={quote.shortfallPoints} size="line" testID="shortfall-short" />} />
      </GroupedList>
      <View style={styles.buttons}>
        <Button testID="shortfall-buy" label={SHEET_WORDS.buyPoints} onPress={onBuyPoints} full />
        <Button testID="shortfall-close" label={SHEET_WORDS.notNow} onPress={onClose} variant="secondary" full />
      </View>
    </BottomSheet>
  );
}

/**
 * PT7 · The limit: a daily limit (or the size of one job) reached. The Hub's quote names the cap and, for the day's, when it resets, in
 * its own friendly sentence; nothing was held and nothing was taken, so the points are safe. "Back to AI tools" leaves.
 */
export function CapReachedScreen({ quote, onBack }: { quote: Pick<JobQuote, 'title' | 'cap'>; onBack: () => void }) {
  const cap = quote.cap;
  if (!cap) return null;
  return (
    <Modal visible animationType="fade" onRequestClose={onBack} statusBarTranslucent>
      <PointsFrame title={quote.title || 'AI tools'} onBack={onBack} gap={space.md} centered testID="cap-screen">
        <EmptyState testID="cap-reached" icon="Timer" title={capTitle(cap)} message={capMessage(cap)} action={{ label: CAP_WORDS.back, onPress: onBack }} />
      </PointsFrame>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: space.sm },
});
