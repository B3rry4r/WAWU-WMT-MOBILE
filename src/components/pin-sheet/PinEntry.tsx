import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { space, useWawu } from '@/theme';

import { approvalLine, lockedLine, msUntil, wrongPinLine } from './format';
import { ALERT, DOTS, HEADING, SHEET } from './kit';
import { PinDots } from './PinDots';
import { Keypad } from './Keypad';
import { biometricFailedLine, biometricLook, useBiometricKind } from './biometric';
import type { BiometricKind, BiometricResult, PinCheckResult, PinSheetProps } from './types';

/** The transaction PIN is 4 digits (W11 draws four dots; the contract's `^[0-9]{4}$`). */
export const PIN_LENGTH = 4;
/** How often the locked countdown refreshes. */
const TICK_MS = 1000;
const ALERT_ICON = ALERT.icon;
const UNANSWERED_LINE = "We couldn't check your PIN. Try again.";
/** For a sheet that pays (SWEEP-APP rows POINTS-05 L3, LEGAL-04 S4 F5, ME-12 S7 F4): the answer did not arrive, so the PIN may have been right. */
export const PAYMENT_UNANSWERED_LINE = "We didn't get an answer. Try again: it will only happen once.";

/**
 * - entering: the keypad is live (with or without a message from the last try)
 * - submitting: waiting for the server; keys are off
 * - approved: the server said yes; keys stay off until the caller closes the sheet
 * - locked: keys are off until `until`
 */
type Phase =
  | { kind: 'entering'; message?: { text: string; wrongPin: boolean } }
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
  unansweredLine = UNANSWERED_LINE,
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

  /** `wrongPin` also rings the empty dots in danger: only a refused PIN does. */
  const say = (line: string, wrongPin = false) => {
    setPhase({ kind: 'entering', message: { text: line, wrongPin } });
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
        say(wrongPinLine(result.triesLeft), true);
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
        say(unansweredLine);
        return;
    }
  };

  const settleBiometric = (kind: BiometricKind, result: BiometricResult) => {
    if (!finish()) return;
    if (result.code === 'approved') setPhase({ kind: 'approved' });
    else if (result.code === 'failed') say(biometricFailedLine(kind));
    else setPhase({ kind: 'entering' });
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

  const biometricKind = useBiometricKind(biometric !== undefined, biometric?.kind);
  const approveWithBiometric = (kind: BiometricKind) => {
    if (!biometric || !start()) return;
    biometric.onPress(kind).then(
      (result) => settleBiometric(kind, result),
      () => settleBiometric(kind, { code: 'failed' }),
    );
  };
  const look = biometricKind ? biometricLook(biometricKind) : null;

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
  const missed = phase.kind === 'entering' && phase.message?.wrongPin === true && pin.length === 0;

  let status: React.ReactNode = null;
  if (submitting) {
    status = (
      <View style={styles.status} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.accentFg} accessibilityLabel="Checking your PIN" />
      </View>
    );
  } else if (phase.kind === 'entering' && phase.message) {
    status = (
      <View style={styles.alert} accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Icon name={ALERT_ICON.name} size={ALERT_ICON.size} strokeWidth={ALERT_ICON.stroke} color={colors.danger} />
        <Text variant="errorLine">{phase.message.text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.body} accessibilityState={{ busy: submitting }}>
      <View style={styles.heading}>
        <Text variant="sheetTitleSm" style={styles.center}>
          {locked ? 'PIN locked' : 'Enter your PIN'}
        </Text>
        <Text variant="muted" style={styles.center}>
          {locked ? lockedLine(msUntil(phase.until, now)) : approvalLine(approval)}
        </Text>
      </View>

      <PinDots filled={filled} length={pinLength} missed={missed} locked={locked} style={styles.dots} />

      {status}

      <Keypad
        inactive={keysOff}
        onDigit={onDigit}
        onDelete={onDelete}
        onClear={onClear}
        biometric={
          biometricKind && look
            ? { icon: look.icon, label: look.label, onPress: () => approveWithBiometric(biometricKind) }
            : undefined
        }
      />

      {onForgotPin ? (
        <Pressable
          accessibilityRole="button"
          onPress={onForgotPin}
          disabled={submitting}
          hitSlop={space.md}
          style={styles.forgot}
        >
          <Text variant="linkStrong" tone={submitting ? 'textDisabled' : undefined} style={styles.center}>
            Forgot PIN?
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: SHEET.stack },
  heading: { gap: HEADING.stack },
  center: { textAlign: 'center' },
  dots: { paddingVertical: DOTS.padY },
  status: { alignItems: 'center' },
  alert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ALERT.apart },
  forgot: { alignSelf: 'center' },
});
