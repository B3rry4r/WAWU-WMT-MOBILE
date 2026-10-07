import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button, IconButton } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, space, useWawu } from '@/theme';

import type { TgifDay } from './api/tgif';
import { CardBackdrop } from './CardBackdrop';
import { ink, looks } from './look';
import { cardLabels, cardText, compactCount, headerLine, localDay, readerSteps, wordSize } from './model';
import { CloseButton, NextButton, Pill, Progress } from './parts';
import { ShareSheet } from './ShareSheet';
import { useAmen, useCountRead, useDay, useStats } from './useTgif';

/** design/_gen/home.js, H29 to H34: where everything sits on a card. The body keeps 170 clear below for the controls. */
const readerMetrics = {
  headerGap: 14,
  title: 19,
  subtitle: 12.5,
  subtitleFaint: 0.7,
  subtitleGap: 2,
  bodyPadTop: 30,
  bodyPadX: 24,
  bodyPadBottom: 170,
  bodyGap: 18,
  quoteMark: 120,
  quoteMarkLine: 72,
  quoteMarkBox: 50,
  quoteMarkFaint: 0.25,
  label: 12,
  labelTracking: 0.14,
  labelFaint: 0.8,
  leading: 1.25,
  tracking: -0.025,
  reference: 15,
  referenceLeading: 1.5,
  inlineTop: 6,
  controlsX: 24,
  controlsBottom: 44,
  controlsGap: 16,
  pillsGap: 8,
  hint: 13,
  hintFaint: 0.65,
  problemFaint: 0.9,
} as const;

export type TgifReaderProps = {
  /** Leaves the reader: the close control, and Done on the last card. */
  onClose: () => void;
  /** Where a person with no chats is sent from the share sheet. */
  onOpenInbox?: () => void;
  /** The moment the reader was opened; the day it reads is this moment's calendar day on the phone. */
  now?: Date;
};

/**
 * H29 to H34 · TGIF. The five cards of today, one at a time, full screen: tap to continue, Amen
 * on any card (and inline on the prayer), Share from any card (H35), Done on the last. Every word
 * and count comes from the Hub: the text from `GET /tgif/{date}`, the Amen counts and which the
 * person has said from `GET /tgif/{date}/stats`.
 */
export function TgifReader({ onClose, onOpenInbox, now }: TgifReaderProps) {
  const [date] = useState(() => localDay(now));
  const day = useDay(date);
  useCountRead(date, Boolean(day.data));

  if (day.data) return <Cards date={date} day={day.data} onClose={onClose} onOpenInbox={onOpenInbox} />;
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

type CardsProps = { date: string; day: TgifDay; onClose: () => void; onOpenInbox?: () => void };

function Cards({ date, day, onClose, onOpenInbox }: CardsProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const steps = readerSteps();
  const [at, setAt] = useState(0);
  const [sharing, setSharing] = useState(false);
  const stats = useStats(date);
  const amen = useAmen(date);

  const step = steps[Math.min(at, steps.length - 1)];
  const card = step.card;
  const last = at >= steps.length - 1;
  const mine = stats.data?.cards.find((c) => c.card === card);
  const said = Boolean(mine?.amenByMe);
  const count = mine && mine.amen > 0 ? compactCount(mine.amen) : undefined;
  const text = cardText(day, card);
  const size = wordSize(card, text);

  const advance = () => {
    if (!last) {
      amen.clearFailure();
      setAt(at + 1);
    }
  };
  const toggleAmen = () => amen.say({ card, on: !said });

  return (
    <View testID="tgif-reader" style={[styles.root, { backgroundColor: looks[card].ground }]}>
      <StatusBar style="light" />
      <CardBackdrop look={looks[card]} width={width} height={height} />
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
          <CloseButton onPress={onClose} />
        </View>
      </View>
      <ScrollView
        testID="tgif-body"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Pressable
          testID={`tgif-card-${card}`}
          accessible={false}
          onPress={advance}
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
            style={[font(card === 'verse' ? 700 : 600), { fontSize: size, lineHeight: size * readerMetrics.leading, letterSpacing: readerMetrics.tracking * size, color: ink }]}
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
                disabled={amen.busy}
                onPress={toggleAmen}
              />
            </View>
          ) : null}
        </Pressable>
      </ScrollView>
      <View pointerEvents="box-none" style={[styles.controls, { bottom: Math.max(readerMetrics.controlsBottom, insets.bottom + space.lg) }]}>
        {amen.failed ? (
          <Text variant="body" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="tgif-amen-problem" style={[font(600), styles.problem]}>
            Your Amen could not be saved. Try again.
          </Text>
        ) : null}
        <View style={styles.pills}>
          <Pill
            testID="tgif-amen"
            icon="HandHeart"
            label="Amen"
            count={count}
            active={said}
            disabled={amen.busy}
            onPress={toggleAmen}
          />
          <Pill testID="tgif-share" icon="Share2" label="Share" onPress={() => setSharing(true)} />
        </View>
        <View style={styles.continueRow}>
          <Pressable testID="tgif-hint" accessible={false} onPress={advance} style={styles.hintArea}>
            <Text variant="body" style={styles.hint}>
              Tap to continue
            </Text>
          </Pressable>
          {last ? <Button testID="tgif-done" label="Done" size="md" variant="white" onPress={onClose} /> : <NextButton onPress={advance} />}
        </View>
      </View>
      <ShareSheet visible={sharing} onClose={() => setSharing(false)} date={date} day={day} onOpenInbox={onOpenInbox} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    paddingBottom: readerMetrics.bodyPadBottom,
  },
  quoteMarkBox: { height: readerMetrics.quoteMarkBox },
  quoteMark: { fontSize: readerMetrics.quoteMark, lineHeight: readerMetrics.quoteMarkLine, color: ink, opacity: readerMetrics.quoteMarkFaint },
  label: { fontSize: readerMetrics.label, letterSpacing: readerMetrics.labelTracking * readerMetrics.label, color: ink, opacity: readerMetrics.labelFaint },
  reference: { fontSize: readerMetrics.reference, lineHeight: readerMetrics.reference * readerMetrics.referenceLeading, color: ink, opacity: readerMetrics.labelFaint },
  inline: { marginTop: readerMetrics.inlineTop, alignSelf: 'flex-start' },
  controls: { position: 'absolute', left: readerMetrics.controlsX, right: readerMetrics.controlsX, gap: readerMetrics.controlsGap },
  pills: { flexDirection: 'row', gap: readerMetrics.pillsGap },
  continueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hintArea: { flex: 1, justifyContent: 'center', minHeight: layout.tapMin },
  hint: { fontSize: readerMetrics.hint, color: ink, opacity: readerMetrics.hintFaint },
  problem: { fontSize: readerMetrics.hint, color: ink, opacity: readerMetrics.problemFaint },
});
