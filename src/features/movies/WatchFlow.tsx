import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Linking, Modal, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { isApiError } from '@/api/errors';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { ConsentBox } from '@/features/open-wallet/ConsentBox';
import { font, radius, space, useWawu } from '@/theme';

import { detailKey, watchMovie } from './api';
import { openingMetrics as o, sheetMetrics } from './look';

const RING = { size: o.ring, stroke: o.ringStroke, turnMs: 1100, arc: 0.3 } as const;
const RADIUS = (RING.size - RING.stroke) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The three lines MV4 draws, in its order. */
export const CONTINUE_POINTS = [
  'You’re signed in with your Who Made This? account. No new sign-up.',
  'Flixora plays films in Chrome or Edge on a computer.',
  'The first time, Flixora asks you to add its streaming extension.',
] as const;

/** What a refusal says, in plain words. A 409 means the terms were not agreed; a 503 means the movie partner could not make a link. */
export function watchProblem(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 409) return 'Agree to the terms to continue.';
    if (error.status === 503) return 'Flixora couldn’t be opened just now. Try again in a moment.';
    if (error.kind === 'network') return error.message;
  }
  return 'Flixora couldn’t be opened. Try again.';
}

/** MV5's ring: the sunken circle with the accent arc turning once in 1.1 seconds, held still when the phone asks for less motion. */
function OpeningRing() {
  const { colors } = useWawu();
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let live = true;
    void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
      .catch(() => false)
      .then((reduced) => {
        if (!live || reduced) return;
        loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: RING.turnMs, easing: Easing.linear, useNativeDriver: true }));
        loop.start();
      });
    return () => {
      live = false;
      loop?.stop();
    };
  }, [turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const middle = RING.size / 2;
  return (
    <Animated.View testID="flix-opening-ring" accessibilityRole="progressbar" accessibilityLabel="Opening Flixora" style={{ transform: [{ rotate }] }}>
      <Svg width={RING.size} height={RING.size} viewBox={`0 0 ${RING.size} ${RING.size}`}>
        <Circle cx={middle} cy={middle} r={RADIUS} stroke={colors.surfaceSunken} strokeWidth={RING.stroke} fill="none" />
        <Circle
          cx={middle}
          cy={middle}
          r={RADIUS}
          stroke={colors.accent}
          strokeWidth={RING.stroke}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE * RING.arc} ${CIRCUMFERENCE * (1 - RING.arc)}`}
          rotation={-90}
          origin={`${middle}, ${middle}`}
        />
      </Svg>
    </Animated.View>
  );
}

export type WatchFlowProps = {
  movieId: string;
  title: string;
  /** The Hub's `mustAgreeTerms` for this person: the shared consent box is drawn, and "Open Flixora" waits for the tick, only when true. */
  mustAgreeTerms: boolean;
  visible: boolean;
  onClose: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
};

/**
 * MV4 · Continue on Flixora, then MV5 · Opening Flixora, then the Hub's link in the system browser (R-74, R-75). "Open Flixora"
 * asks the Hub for a fresh signed-in link on every tap (`POST /movies/{id}/watch`, sending `agreeToTerms: true` only when the
 * person had to tick the box). The link goes straight to the browser: it is never shown, kept or logged (V5). A 409 or a 503 stays
 * on MV4 with one plain sentence under the buttons.
 */
export function WatchFlow({ movieId, title, mustAgreeTerms, visible, onClose, onOpenTerms, onOpenPrivacy }: WatchFlowProps) {
  const { colors } = useWawu();
  const client = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [opening, setOpening] = useState(false);
  // The Hub can ask for the agreement the page did not know it needed (a 409): the box is drawn then, never a line about a box that is not there.
  const [needsAgreement, setNeedsAgreement] = useState(false);
  const mustTick = mustAgreeTerms || needsAgreement;
  const [problem, setProblem] = useState<string | null>(null);
  // Every way out of the sheet leaves it clean for the next opening: the box unticked, no sentence.
  const close = () => {
    setAgreed(false);
    setNeedsAgreement(false);
    setProblem(null);
    onClose();
  };

  // Back during MV5 stops the link from being opened (the request itself cannot be taken back).
  const cancelled = useRef(false);
  const cancel = () => {
    cancelled.current = true;
    setOpening(false);
  };

  const open = async () => {
    if (opening || (mustTick && !agreed)) return;
    setProblem(null);
    cancelled.current = false;
    setOpening(true);
    try {
      const url = await watchMovie(movieId, mustTick && agreed);
      if (cancelled.current) return;
      await Linking.openURL(url);
      // The agreement is now the Hub's: the next look at this movie does not ask again.
      if (mustTick) void client.invalidateQueries({ queryKey: detailKey(movieId) });
      close();
    } catch (error) {
      if (isApiError(error) && error.status === 409 && !mustTick) {
        setNeedsAgreement(true);
        void client.invalidateQueries({ queryKey: detailKey(movieId) });
      } else {
        setProblem(watchProblem(error));
      }
    } finally {
      setOpening(false);
    }
  };

  return (
    <>
      <BottomSheet visible={visible && !opening} onClose={close} label="Continue on Flixora" gap={space.lg} testID="flix-continue">
        <View style={styles.head}>
          <IconTile icon="Clapperboard" tone="accent" size={64} />
          <Text variant="sheetTitle" accessibilityRole="header">
            Continue on Flixora
          </Text>
          <Text variant="muted" style={styles.center}>{`${title} plays on Flixora, our movie partner.`}</Text>
        </View>
        <View style={styles.points}>
          {CONTINUE_POINTS.map((line) => (
            <View key={line} style={styles.point}>
              <Icon name="Check" size={16} color={colors.positive} strokeWidth={2.6} />
              <Text variant="secondary" style={styles.pointText}>
                {line}
              </Text>
            </View>
          ))}
        </View>
        {mustTick ? <ConsentBox testID="flix-consent" agreed={agreed} busy={opening} onToggle={() => setAgreed((a) => !a)} onOpenTerms={onOpenTerms} onOpenPrivacy={onOpenPrivacy} /> : null}
        <Button testID="flix-open" label="Open Flixora" disabled={mustTick && !agreed} loading={opening} onPress={() => void open()} />
        <Button testID="flix-not-now" label="Not now" variant="secondary" onPress={close} />
        {problem ? (
          <Text variant="errorLine" accessibilityRole="alert" testID="flix-problem" style={styles.center}>
            {problem}
          </Text>
        ) : null}
      </BottomSheet>
      <Modal visible={visible && opening} transparent={false} animationType="fade" onRequestClose={cancel} statusBarTranslucent>
        <View testID="flix-opening" style={[styles.opening, { backgroundColor: colors.surfacePage }]}>
          <OpeningRing />
          <Text variant="sheetTitle" accessibilityRole="header">
            Opening Flixora
          </Text>
          <Text variant="muted">{`Signing you in to ${title}.`}</Text>
          <View style={[styles.pill, { backgroundColor: colors.surfaceSunken }]}>
            <Icon name="Lock" size={o.pillIcon} color={colors.textMuted} strokeWidth={2.2} />
            <Text variant="caption" tone="textSecondary" style={[font(600), { fontSize: o.pillFont }]}>
              flixora.com
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: sheetMetrics.group },
  center: { textAlign: 'center' },
  points: { gap: sheetMetrics.group },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: sheetMetrics.group },
  pointText: { flex: 1 },
  opening: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: o.between, paddingHorizontal: space.s2xl },
  pill: { height: o.pillHeight, paddingHorizontal: o.pillPadX, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: o.pillGap },
});
