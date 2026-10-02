import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ICON_STROKE, Icon } from '@/components/icon';
import { font, radius, space, text, useWawu } from '@/theme';

import { approvalLine, lockedLine, msUntil, wrongPinLine } from './format';
import { Keypad } from './Keypad';
import type { BiometricResult, PinCheckResult, PinSheetProps } from './types';

/** The transaction PIN is 4 digits (W11 draws four dots; the contract's `^[0-9]{4}$`). */
export const PIN_LENGTH = 4;
/** How often the locked countdown refreshes. */
const TICK_MS = 1000;
/** The canvas's inline error line (design/_gen/auth.js): CircleAlert 15, danger, stroke 2.2. */
const ALERT_ICON = { name: 'CircleAlert', size: 15, stroke: ICON_STROKE.button } as const;
const UNANSWERED_LINE = "We couldn't check your PIN. Try again.";

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
  | { kind: 'locked'; until: string };

function initialPhase(lockedUntil: string | null | undefined): Phase {
  if (lockedUntil && msUntil(lockedUntil, Date.now()) > 0) {
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
  const busyListener = useRef(onBusyChange);
  useEffect(() => {
    busyListener.current = onBusyChange;
  }, [onBusyChange]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Hidden or unmounted mid-check: the frame must not stay busy, or a
      // reopened sheet could never be closed. The answer, when it comes, is
      // the caller's to handle; this entry is gone.
      if (inFlight.current) {
        inFlight.current = false;
        busyListener.current?.(false);
      }
    };
  }, []);

  // A lock the caller learns about while the sheet is open.
  const [seenLockedUntil, setSeenLockedUntil] = useState(lockedUntil);
  if (lockedUntil !== seenLockedUntil) {
    setSeenLockedUntil(lockedUntil);
    if (lockedUntil) {
      setPin('');
      setPhase({ kind: 'locked', until: lockedUntil });
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

  const say = (line: string) => {
    setPhase({ kind: 'entering', message: { tone: 'danger', text: line } });
    AccessibilityInfo.announceForAccessibility(line);
  };

  // Every answer clears the digits; only `approved` keeps the keys off.
  const finish = (): boolean => {
    if (!inFlight.current) return false;
    inFlight.current = false;
    if (!mounted.current) return false;
    busyListener.current?.(false);
    setPin('');
    return true;
  };

  const settlePin = (result: PinCheckResult) => {
    if (!finish()) return;
    switch (result.code) {
      case 'approved':
        setPhase({ kind: 'approved' });
        return;
      case 'pin_incorrect':
        say(wrongPinLine(result.triesLeft));
        return;
      case 'pin_locked': {
        const at = Date.now();
        if (msUntil(result.lockedUntil, at) > 0) {
          setNow(at);
          setPhase({ kind: 'locked', until: result.lockedUntil });
          AccessibilityInfo.announceForAccessibility(lockedLine(msUntil(result.lockedUntil, at)));
        } else {
          setPhase({ kind: 'entering' });
        }
        return;
      }
      case 'unanswered':
        say(UNANSWERED_LINE);
        return;
    }
  };

  const settleBiometric = (result: BiometricResult) => {
    if (!finish()) return;
    setPhase(result.code === 'approved' ? { kind: 'approved' } : { kind: 'entering' });
  };

  const start = () => {
    if (inFlight.current) return false;
    inFlight.current = true;
    busyListener.current?.(true);
    setPhase({ kind: 'submitting' });
    return true;
  };

  const submitPin = (entered: string) => {
    if (!start()) return;
    onSubmit(entered).then(settlePin, () => settlePin({ code: 'unanswered' }));
  };

  const approveWithBiometric = () => {
    if (!biometric || !start()) return;
    biometric.onPress().then(settleBiometric, () => settleBiometric({ code: 'declined' }));
  };

  const keysOff = phase.kind !== 'entering';

  const onDigit = (d: string) => {
    if (keysOff || pin.length >= pinLength) return;
    const next = pin + d;
    setPin(next);
    if (next.length === pinLength) submitPin(next);
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
      <View style={styles.alert} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Icon name={ALERT_ICON.name} size={ALERT_ICON.size} strokeWidth={ALERT_ICON.stroke} color={colors.danger} />
        <Text style={[text.secondary, font(600), { color: colors.danger }]}>{phase.message.text}</Text>
      </View>
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
        onBiometric={biometric ? approveWithBiometric : undefined}
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
  alert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  forgot: { alignSelf: 'center' },
});
