import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { font, radius, space, text, useWawu } from '@/theme';

import { approvalLine, lockedLine, msUntil, wrongPinLine } from './format';
import { Keypad } from './Keypad';
import type { PinCheckResult, PinSheetProps } from './types';

/** The transaction PIN is 4 digits (W11 draws four dots; W36 creates a 4 digit PIN). */
export const PIN_LENGTH = 4;
/** How often the locked countdown refreshes. */
const TICK_MS = 1000;

/**
 * - entering: the keypad is live (with or without a message from the last try)
 * - submitting: waiting for the server; keys are off
 * - approved: the server said yes; keys stay off until the caller closes the sheet
 * - locked: keys are off until `until`
 */
type Phase =
  | { kind: 'entering'; message?: { tone: 'danger'; text: string } }
  | { kind: 'submitting' }
  | { kind: 'approved' }
  | { kind: 'locked'; until: Date | string };

function initialPhase(lockedUntil: Date | string | undefined): Phase {
  if (lockedUntil !== undefined && msUntil(lockedUntil, Date.now()) > 0) {
    return { kind: 'locked', until: lockedUntil };
  }
  return { kind: 'entering' };
}

type PinEntryProps = Omit<PinSheetProps, 'visible' | 'onClose'> & {
  /** Told when a check starts and ends, so the frame can refuse to close mid-payment. */
  onBusyChange?: (busy: boolean) => void;
};

/** The sheet's content: title, approval line, dots, status line, keypad, Forgot PIN. */
export function PinEntry({
  approval,
  onSubmit,
  pinLength = PIN_LENGTH,
  biometric,
  onForgotPin,
  lockedUntil,
  onBusyChange,
}: PinEntryProps) {
  const { colors } = useWawu();
  const [pin, setPin] = useState('');
  const [stored, setPhase] = useState<Phase>(() => initialPhase(lockedUntil));
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(true);
  // One check at a time: a double tap on the last digit never submits twice.
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A lock the caller learns about while the sheet is open. Compared by time,
  // not by Date object, so a new Date for the same moment is no change.
  const lockedAt = lockedUntil === undefined ? undefined : new Date(lockedUntil).getTime();
  const [seenLockedAt, setSeenLockedAt] = useState(lockedAt);
  if (lockedAt !== seenLockedAt) {
    setSeenLockedAt(lockedAt);
    if (lockedAt !== undefined && !Number.isNaN(lockedAt)) {
      setPin('');
      setPhase({ kind: 'locked', until: new Date(lockedAt) });
    }
  }

  // A lock ends by itself when its time passes: the keypad comes back.
  const expired = stored.kind === 'locked' && msUntil(stored.until, now) <= 0;
  const phase: Phase = expired ? { kind: 'entering' } : stored;

  // The countdown ticks only while locked.
  const lockedUntilValue = stored.kind === 'locked' ? stored.until : undefined;
  useEffect(() => {
    if (lockedUntilValue === undefined || expired) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [lockedUntilValue, expired]);

  const settle = (result: PinCheckResult) => {
    inFlight.current = false;
    if (!mounted.current) return;
    onBusyChange?.(false);
    setPin('');
    switch (result.status) {
      case 'ok':
        setPhase({ kind: 'approved' });
        return;
      case 'wrong': {
        const line = wrongPinLine(result.triesLeft);
        setPhase({ kind: 'entering', message: { tone: 'danger', text: line } });
        AccessibilityInfo.announceForAccessibility(line);
        return;
      }
      case 'locked':
        if (msUntil(result.until, Date.now()) > 0) {
          setNow(Date.now());
          setPhase({ kind: 'locked', until: result.until });
          AccessibilityInfo.announceForAccessibility(lockedLine(msUntil(result.until, Date.now())));
        } else {
          setPhase({ kind: 'entering' });
        }
        return;
      case 'cancelled':
        setPhase({ kind: 'entering' });
        return;
      case 'error': {
        const line = "We couldn't check your PIN. Try again.";
        setPhase({ kind: 'entering', message: { tone: 'danger', text: line } });
        AccessibilityInfo.announceForAccessibility(line);
        return;
      }
    }
  };

  const run = (check: () => Promise<PinCheckResult>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    onBusyChange?.(true);
    setPhase({ kind: 'submitting' });
    check().then(settle, () => settle({ status: 'error' }));
  };

  const keysOff = phase.kind !== 'entering';

  const onDigit = (d: string) => {
    if (keysOff || pin.length >= pinLength) return;
    const next = pin + d;
    setPin(next);
    if (next.length === pinLength) run(() => onSubmit(next));
  };
  const onDelete = () => {
    if (!keysOff) setPin((p) => p.slice(0, -1));
  };
  const onClear = () => {
    if (!keysOff) setPin('');
  };

  const locked = phase.kind === 'locked';
  const submitting = phase.kind === 'submitting';
  const filled = submitting || phase.kind === 'approved' ? pinLength : pin.length;
  const missed = phase.kind === 'entering' && phase.message !== undefined && pin.length === 0;
  const ring = missed ? colors.danger : colors.borderStrong;

  let status: React.ReactNode = null;
  if (submitting) {
    status = (
      <View style={styles.status} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.accentFg} accessibilityLabel="Checking your PIN" />
      </View>
    );
  } else if (phase.kind === 'entering' && phase.message) {
    status = (
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[text.secondary, styles.center, { color: colors.danger }]}
      >
        {phase.message.text}
      </Text>
    );
  }

  return (
    <View style={styles.body} accessibilityState={{ busy: submitting }}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[text.h1, styles.center, { color: colors.textPrimary }]}>
          {locked ? 'PIN locked' : 'Enter your PIN'}
        </Text>
        <Text style={[text.secondary, styles.center, { color: colors.textSecondary }]}>
          {locked ? lockedLine(msUntil(phase.until, now)) : approvalLine(approval)}
        </Text>
      </View>

      <View
        style={styles.dots}
        accessible
        accessibilityLabel={`${filled} of ${pinLength} digits entered`}
      >
        {Array.from({ length: pinLength }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < filled
                ? { backgroundColor: locked ? colors.textDisabled : colors.textPrimary }
                : { borderColor: locked ? colors.borderHairline : ring, borderWidth: RING },
            ]}
          />
        ))}
      </View>

      {status}

      <Keypad
        inactive={keysOff}
        onDigit={onDigit}
        onDelete={onDelete}
        onClear={onClear}
        biometricLabel={biometric?.label}
        onBiometric={biometric ? () => run(biometric.onPress) : undefined}
      />

      {onForgotPin ? (
        <Pressable
          accessibilityRole="button"
          onPress={onForgotPin}
          disabled={submitting}
          hitSlop={space.md}
          style={styles.forgot}
        >
          <Text style={[text.secondary, font(600), styles.center, { color: submitting ? colors.textDisabled : colors.accentFg }]}>
            Forgot PIN?
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The empty dot's ring on W11 (inset 1.5px). */
const RING = 1.5;

const styles = StyleSheet.create({
  body: { gap: space.md },
  heading: { gap: space.xs },
  center: { textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.lg, paddingVertical: space.sm },
  dot: { width: space.lg, height: space.lg, borderRadius: radius.chip },
  status: { alignItems: 'center' },
  forgot: { alignSelf: 'center' },
});
