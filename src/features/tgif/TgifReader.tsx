import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type DimensionValue, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button, IconButton } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import type { AdCard } from '@/features/ads/api';
import { openAd } from '@/features/ads/api';
import { SponsoredBackdrop, SponsoredStep } from '@/features/ads/SponsoredStep';
import { useAd, useAdReports } from '@/features/ads/useAd';
import { font, layout, space, useWawu } from '@/theme';

import type { TgifCard, TgifDay } from './api/tgif';
import { CardBackdrop } from './CardBackdrop';
import { ink, looks } from './look';
import { backZone, cardLabels, cardText, compactCount, fitSize, headerLine, readerDay, readerSteps, sponsoredSlot, tapGoesBack, wordLeading, wordSize, type WordRoom } from './model';
import { partMetrics, Progress, ReadPill } from './parts';
import { COULD_NOT_SHARE_VERSE, shareVerse } from './sharePhone';
import { useAmen, useCountRead, useCountShare, useDay, useStats } from './useTgif';

/**
 * design/_gen/home.js, H29 to H34: where everything sits on a card. The canvas keeps 170 clear below
 * the words for the controls; here the controls are a row of their own under the scroll area (so
 * no text can ever run under them) and the words' own bottom padding is what is left of the 170.
 */
const readerMetrics = {
  headerGap: 14,
  title: 19,
  subtitle: 12.5,
  subtitleFaint: 0.7,
  subtitleGap: 2,
  bodyPadTop: 30,
  bodyPadX: 24,
  bodyClear: 170,
  bodyGap: 18,
  quoteMark: 120,
  quoteMarkLine: 72,
  quoteMarkBox: 50,
  quoteMarkFaint: 0.25,
  label: 12,
  labelTracking: 0.14,
  labelFaint: 0.8,
  tracking: -0.025,
  reference: 15,
  referenceLeading: 1.5,
  inlineTop: 6,
  inlineButton: 44,
  /** The label's line (the body line height at 15) and the most lines a reference takes. */
  labelLine: 21.75,
  referenceLines: 2,
  controlsX: 24,
  controlsBottom: 44,
  controlsGap: 16,
  pillsGap: 8,
  hint: 13,
  hintFaint: 0.65,
  problemFaint: 0.9,
} as const;

/** What is left of the canvas's 170 below the words once the controls take their own row: the pills, their gap, the arrow row and the bottom margin. */
const bodyPadBottom =
  readerMetrics.bodyClear - (partMetrics.pillHeight + readerMetrics.controlsGap + partMetrics.next + readerMetrics.controlsBottom);

/** The room a card's words have inside a scroll area of `viewport`: its width less the sides, its height less the padding and everything else drawn with the words. */
export function wordRoom(card: TgifCard, viewport: WordRoom): WordRoom {
  const { bodyGap, labelLine, quoteMarkBox, reference, referenceLines, referenceLeading, inlineTop, inlineButton } = readerMetrics;
  const others = {
    verse: quoteMarkBox + labelLine + reference * referenceLeading * referenceLines + 3 * bodyGap,
    prayer: labelLine + inlineTop + inlineButton + 2 * bodyGap,
    reality: labelLine + bodyGap,
    remember: labelLine + bodyGap,
    takeaway: labelLine + bodyGap,
  }[card];
  return {
    width: viewport.width - 2 * readerMetrics.bodyPadX,
    height: viewport.height - readerMetrics.bodyPadTop - bodyPadBottom - others,
  };
}

export type TgifReaderProps = {
  /** Leaves the reader: the close control, and Done on the last card. */
  onClose: () => void;
  /** Opens an event (E2): where the sponsored card's button leads. Without it the reader offers no sponsored card, so it never draws a button that does nothing. */
  onOpenEvent?: (eventId: string) => void;
  /** The moment the reader was opened; the day it reads is this moment's calendar day on the phone. */
  now?: Date;
  /** The day a morning notice was made for (HOME-16, `YYYY-MM-DD`). Read when it is yesterday, today or tomorrow on the phone, otherwise today is read. */
  date?: string;
};

/**
 * H29 to H34 · TGIF. The five cards of today, one at a time, full screen: tap to continue, Amen
 * on any card (and inline on the prayer), Share from any card (the phone's share sheet, R-58 a), Done on the last. Every word
 * and count comes from the Hub: the text from `GET /tgif/{date}`, the Amen counts and which the
 * person has said, and how many have read today, from `GET /tgif/{date}/stats`. When a campaign is live, the sponsored card (H33,
 * `GET /ads?placement=tgif_card`, ADS-01) is a sixth step before the takeaway; the cards never wait for it.
 */
export function TgifReader({ onClose, onOpenEvent, now, date: requested }: TgifReaderProps) {
  const [date] = useState(() => readerDay(requested, now));
  const day = useDay(date);
  const ad = useAd('tgif_card', Boolean(onOpenEvent));
  const marked = useCountRead(date, Boolean(day.data));

  if (day.data) return <Cards date={date} day={day.data} ad={ad.data ?? null} marked={marked} onClose={onClose} onOpenEvent={onOpenEvent} />;
  return (
    <Frame onClose={onClose}>
      {day.isError ? (
        <ErrorState
          testID="tgif-error"
          icon={isApiError(day.error) && day.error.kind === 'network' ? 'WifiOff' : 'CircleAlert'}
          title={isApiError(day.error) && day.error.kind === 'network' ? 'No connection' : "Today's TGIF could not be loaded"}
          message={isApiError(day.error) ? day.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void day.refetch()}
        />
      ) : (
        <LoadingView label="Loading TGIF" testID="tgif-loading">
          <View style={styles.loading}>
            <Skeleton width="30%" height={readerMetrics.label} />
            <Skeleton height={readerMetrics.title * 3} />
            <Skeleton width="70%" height={readerMetrics.title} />
          </View>
        </LoadingView>
      )}
    </Frame>
  );
}

type FrameProps = { onClose: () => void; children: ReactNode };

/** The reader before its cards are here, or when they cannot come: the page, with the close control. */
function Frame({ onClose, children }: FrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID="tgif-reader" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top + space.sm }]}>
      <View style={styles.frameBar}>
        <IconButton icon="X" label="Close" onPress={onClose} testID="tgif-close" />
      </View>
      <View style={styles.frameBody}>{children}</View>
    </View>
  );
}

type CardsProps = {
  date: string;
  day: TgifDay;
  ad: AdCard | null;
  /** The day's readers as the Hub answered this person's own read, which includes them. */
  marked: number | null;
  onClose: () => void;
  onOpenEvent?: (eventId: string) => void;
};

function Cards({ date, day, ad, marked, onClose, onOpenEvent }: CardsProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [at, setAt] = useState(0);
  // The sponsored card joins the steps only while its place is still ahead: a card that arrives once the person is on the
  // takeaway is not put in front of them, and one that goes is not taken from under them.
  const [passedSlot, setPassedSlot] = useState(false);
  // A card whose picture will not load is left out of the steps too (SWEEP-APP row ADS-01 L5): no bare dark card to skip.
  const [unloaded, setUnloaded] = useState<string | null>(null);
  const offer = onOpenEvent && ad && !passedSlot && unloaded !== ad.artworkUrl ? ad : null;
  // The picture that has been drawn: a view is told to the Hub only once the card's picture is on screen, as on Today (SWEEP-APP-4 row 62/106 low).
  const [drawn, setDrawn] = useState<string | null>(null);
  const steps = readerSteps(Boolean(offer));
  const [shareFailed, setShareFailed] = useState(false);
  // The scroll area's size once it has been laid out; until then the text is sized by its length alone.
  const [viewport, setViewport] = useState<WordRoom | null>(null);
  // Whether the words are taller than their area: only then the scroll bar is shown.
  const [overflow, setOverflow] = useState(false);
  const stats = useStats(date);
  const amen = useAmen(date);
  const counted = useCountShare(date);

  const step = steps[Math.min(at, steps.length - 1)];
  const sponsored = step.kind === 'sponsored';
  // On the sponsored step the card under it is the takeaway's, the one it leads to.
  const card: TgifCard = step.kind === 'card' ? step.card : 'takeaway';
  const reports = useAdReports(offer, sponsored && offer !== null && drawn === offer.artworkUrl);
  const last = at >= steps.length - 1;
  const mine = stats.data?.cards.find((c) => c.card === card);
  const said = Boolean(mine?.amenByMe);
  const count = mine && mine.amen > 0 ? compactCount(mine.amen) : undefined;
  // The Hub's count for the day, or the count its answer to this person's own read gave if that is higher (it includes them); none until one has come.
  // The count only rises while the reader is open: a later answer that is lower (the read call failed, then a refetch) does not take the pill down (SWEEP-APP row DV2-01 L3).
  const latestReaders = Math.max(stats.data?.readers ?? 0, marked ?? 0);
  const [peakReaders, setPeakReaders] = useState(0);
  if (latestReaders > peakReaders) setPeakReaders(latestReaders);
  const readers = Math.max(latestReaders, peakReaders);
  const text = cardText(day, card);
  const size = viewport ? fitSize(card, text, wordRoom(card, viewport)) : wordSize(card, text);
  const onViewport = ({ nativeEvent }: LayoutChangeEvent) => {
    const { width: w, height: h } = nativeEvent.layout;
    setViewport((was) => (was && was.width === w && was.height === h ? was : { width: w, height: h }));
  };

  const advance = () => {
    if (!last) {
      amen.clearFailure();
      if (!offer && at + 1 >= sponsoredSlot) setPassedSlot(true);
      setAt(at + 1);
    }
  };
  // A tap on the left of the card goes back a card; on the first card it does nothing. The step is counted from the cards
  // that are in the steps now (a sponsored card that failed to load has left them), so Back never lands where it already is.
  const back = () => {
    const here = Math.min(at, steps.length - 1);
    if (here <= 0) return;
    amen.clearFailure();
    setAt(here - 1);
  };
  const tapCard = (event?: GestureResponderEvent) => (tapGoesBack(event?.nativeEvent?.pageX, width) ? back() : advance());
  const openOffer = () => {
    if (!offer || !onOpenEvent) return;
    reports.tap();
    openAd(offer, onOpenEvent);
  };
  const skipAd = () => {
    reports.skip();
    advance();
  };
  const toggleAmen = () => amen.say({ card, on: !said });
  // Share opens the phone's own share sheet with the verse and its link (R-58 a); it counts once something has gone out.
  // One sheet at a time: a second tap while a sheet is open opens nothing and sends no second count (SWEEP-APP row DV2-01 L4).
  const sharing = useRef(false);
  const shareToday = async () => {
    if (sharing.current) return;
    sharing.current = true;
    setShareFailed(false);
    try {
      if ((await shareVerse(day)) === 'shared') counted.mutate();
    } catch {
      setShareFailed(true);
    } finally {
      sharing.current = false;
    }
  };

  return (
    <View testID="tgif-reader" style={[styles.root, { backgroundColor: looks[card].ground }]}>
      <StatusBar style="light" />
      {sponsored && offer ? <SponsoredBackdrop ad={offer} onFail={() => setUnloaded(offer.artworkUrl)} onLoad={() => setDrawn(offer.artworkUrl)} /> : <CardBackdrop look={looks[card]} width={width} height={height} />}
      {/* The sponsored card has no tap of its own (a tap outside its button or Skip does nothing), but its left edge goes back, like every card. Behind the step, so its button and Skip keep their taps. */}
      {sponsored && offer ? <Pressable testID="tgif-back-zone" accessible={false} onPress={back} style={styles.backZone} /> : null}
      <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + space.sm, paddingHorizontal: layout.gutter + insets.left }]}>
        <Progress steps={steps.length} at={at} />
        <View style={styles.header}>
          <View style={styles.headerWords}>
            <Text variant="body" accessibilityRole="header" style={[font(800), styles.title]}>
              TGIF
            </Text>
            <Text variant="body" testID="tgif-header-line" style={styles.subtitle}>
              {headerLine(day)}
            </Text>
          </View>
          <IconButton testID="tgif-close" icon="X" label="Close" tone="glass" size={partMetrics.close} onPress={onClose} />
        </View>
      </View>
      {sponsored && offer ? (
        <SponsoredStep ad={offer} onOpen={openOffer} onSkip={skipAd} bottomInset={insets.bottom} />
      ) : (
        <>
        <ScrollView
          testID="tgif-body"
          onLayout={onViewport}
          onContentSizeChange={(_w, h) => setOverflow(Boolean(viewport) && h > (viewport?.height ?? 0) + 1)}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={overflow}
          persistentScrollbar={overflow}
          bounces={false}
        >
          <Pressable
            testID={`tgif-card-${card}`}
            accessible={false}
            onPress={tapCard}
            style={styles.words}
          >
            {card === 'verse' ? (
              <View style={styles.quoteMarkBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text variant="body" style={[font(700), styles.quoteMark]}>
                  {'“'}
                </Text>
              </View>
            ) : null}
            <Text variant="body" testID="tgif-label" style={[font(700), styles.label]}>
              {cardLabels[card]}
            </Text>
            <Text
              variant="body"
              testID="tgif-text"
              style={[font(card === 'verse' ? 700 : 600), { fontSize: size, lineHeight: size * wordLeading, letterSpacing: readerMetrics.tracking * size, color: ink }]}
            >
              {text}
            </Text>
            {card === 'verse' ? (
              <Text variant="body" testID="tgif-reference" style={styles.reference}>
                {day.verseReference}
              </Text>
            ) : null}
            {card === 'prayer' ? (
              <View style={styles.inline}>
                <Button
                  testID="tgif-amen-inline"
                  label="Amen"
                  icon="HandHeart"
                  size="md"
                  variant={said ? 'glass' : 'white'}
                  onPress={toggleAmen}
                />
              </View>
            ) : null}
          </Pressable>
        </ScrollView>
        <View
          testID="tgif-controls"
          style={[styles.controls, { paddingBottom: Math.max(readerMetrics.controlsBottom, insets.bottom + space.lg) }]}
        >
          {amen.failed ? (
            <Text variant="body" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="tgif-amen-problem" style={[font(600), styles.problem]}>
              Your Amen could not be saved. Try again.
            </Text>
          ) : null}
          {shareFailed ? (
            <Text variant="body" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="tgif-share-problem" style={[font(600), styles.problem]}>
              {COULD_NOT_SHARE_VERSE}
            </Text>
          ) : null}
          <View style={styles.pills}>
            <Button
              testID="tgif-amen"
              label="Amen"
              count={count || undefined}
              selected={said}
              icon="HandHeart"
              size="pill"
              variant={said ? 'white' : 'glass'}
              onPress={toggleAmen}
            />
            {readers > 0 ? <ReadPill count={compactCount(readers)} /> : null}
            <Button testID="tgif-share" label="Share" icon="Share2" size="pill" variant="glass" onPress={() => void shareToday()} />
          </View>
          <View style={styles.continueRow}>
            <Pressable testID="tgif-hint" accessible={false} onPress={advance} style={styles.hintArea}>
              <Text variant="body" style={styles.hint}>
                Tap to continue
              </Text>
            </Pressable>
            {last ? (
              <Button testID="tgif-done" label="Done" size="md" variant="white" onPress={onClose} />
            ) : (
              <IconButton testID="tgif-next" icon="ArrowRight" label="Next card" tone="lift" size={partMetrics.next} onPress={advance} />
            )}
          </View>
        </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backZone: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${backZone * 100}%` as DimensionValue },
  frameBar: { alignItems: 'flex-end', paddingHorizontal: layout.gutter },
  frameBody: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.gutter },
  loading: { gap: readerMetrics.headerGap },
  top: { gap: readerMetrics.headerGap },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerWords: { flexShrink: 1 },
  title: { fontSize: readerMetrics.title, color: ink },
  subtitle: { fontSize: readerMetrics.subtitle, color: ink, opacity: readerMetrics.subtitleFaint, marginTop: readerMetrics.subtitleGap },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  words: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: readerMetrics.bodyGap,
    paddingTop: readerMetrics.bodyPadTop,
    paddingHorizontal: readerMetrics.bodyPadX,
    paddingBottom: bodyPadBottom,
  },
  quoteMarkBox: { height: readerMetrics.quoteMarkBox },
  quoteMark: { fontSize: readerMetrics.quoteMark, lineHeight: readerMetrics.quoteMarkLine, color: ink, opacity: readerMetrics.quoteMarkFaint },
  label: { fontSize: readerMetrics.label, letterSpacing: readerMetrics.labelTracking * readerMetrics.label, color: ink, opacity: readerMetrics.labelFaint },
  reference: { fontSize: readerMetrics.reference, lineHeight: readerMetrics.reference * readerMetrics.referenceLeading, color: ink, opacity: readerMetrics.labelFaint },
  inline: { marginTop: readerMetrics.inlineTop, alignSelf: 'flex-start' },
  controls: { paddingHorizontal: readerMetrics.controlsX, gap: readerMetrics.controlsGap },
  pills: { flexDirection: 'row', gap: readerMetrics.pillsGap },
  continueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hintArea: { flex: 1, justifyContent: 'center', minHeight: layout.tapMin },
  hint: { fontSize: readerMetrics.hint, color: ink, opacity: readerMetrics.hintFaint },
  problem: { fontSize: readerMetrics.hint, color: ink, opacity: readerMetrics.problemFaint },
});
