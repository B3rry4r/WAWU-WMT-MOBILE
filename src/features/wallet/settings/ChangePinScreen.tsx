import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { lockedLine } from '@/components/pin-sheet/format';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { space, useWawu } from '@/theme';

import { changePin, fetchPinState, newRequestKey, verifyPin } from '../api/settings';
import { PinDots, PinFrame, PinHead, StatusLine } from './PinFrame';
import { CONFIRM_TITLE, CURRENT_LINE, CURRENT_TITLE, lockLeftMs, NEW_PIN_LINE, NEW_PIN_TITLE, PIN_LENGTH, refusalOf, type Refusal, stepLabel, UNKNOWN_CHANGE } from './pinFlow';
import { useMonotonicCountdown } from './useMonotonicCountdown';

const MS_PER_SECOND = 1000;
/** A change with no answer is sent this many times in a row (the same request, the same key) before the person is asked to tap Try again. */
const REPEATS = 2;

type Stage = 'current' | 'new' | 'confirm';
/** `checking`: the current PIN is out. `saving`: the change is out. `unsent`: the change got no answer twice (or the server said it is still running); Try again sends it once more under the same key. */
type Busy = 'idle' | 'checking' | 'saving' | 'unsent';
type Line = { text: string; wrongPin: boolean };
/** One attempt to change the PIN: what is sent, and the Idempotency-Key it is sent under, every time it is sent. */
type Attempt = { key: string; current: string; newPin: string; newPinConfirmation: string };

export type ChangePinScreenProps = {
  /** Back from W36 to W35. */
  onBack: () => void;
  /** The PIN is changed: back to W35, which reads the wallet again. */
  onChanged: () => void;
  /** "Forgot PIN?" on the current-PIN step: W37. */
  onForgotPin: () => void;
  /** The account has no PIN (the wallet opened and A9 was never finished): creating one is A9. */
  onNoPin: () => void;
  /** The account has no open wallet: W35 says where it stands. */
  onNoWallet: () => void;
};

/**
 * W36 · Change the transaction PIN, in the brief's version ("change", not "create": the PIN is made when the wallet opens, R-6).
 *
 * The backend will not change a PIN without the PIN in use (`PUT /money/pin`, the current PIN in `X-Transaction-Pin`),
 * and the canvas draws no step for it, so the screen first asks for it in W36's own layout and checks it at once
 * (`POST /money/pin/verify`, which uses a try if it is wrong, as on a payment). Then comes what the canvas draws:
 * "Step 1 of 2", a new four-digit PIN, and "Step 2 of 2", the same four again. Both new entries go in one request and
 * the server compares them. Default (agent), owner may override.
 *
 * Every PIN lives in this screen's memory only, and is dropped the moment its request is answered, whatever the
 * answer, and on leaving. Nothing is stored, logged or put in a URL.
 *
 * One attempt is one Idempotency-Key (WALLET-06 round 2, D1). A change that got no answer is sent again, once at
 * once and then by Try again, with the same key and the same entries: if the first landed the server answers it again
 * without looking at the PIN (no try is spent), and if it did not the repeat is the request. The screen never judges
 * by the PIN's `changedAt`, which moves for a change by anyone, and never asks the server with the new PIN. A new
 * attempt (other entries after a refusal) is a new key.
 */
export function ChangePinScreen({ onBack, onChanged, onForgotPin, onNoPin, onNoWallet }: ChangePinScreenProps) {
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  // Never from the cache: a lock or a time held from an earlier visit (before a reset cleared it) is not the PIN's state now.
  const pin = useQuery(
    { queryKey: ['money', 'pin', owner ?? ''] as const, queryFn: fetchPinState, staleTime: 0, gcTime: 0, enabled: Boolean(owner) },
    queryClient,
  );

  const [stage, setStage] = useState<Stage>('current');
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState<Busy>('idle');
  const [line, setLine] = useState<Line | null>(null);
  /** The PIN in use, once checked; the first new entry, held until the second. Memory only. */
  const current = useRef<string | null>(null);
  const first = useRef<string | null>(null);
  /** The change being sent, with its key, from the second entry until it is answered or given up. Memory only. */
  const attempt = useRef<Attempt | null>(null);
  const inFlight = useRef(false);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
      current.current = null;
      first.current = null;
      attempt.current = null;
    },
    [],
  );

  const read = pin.data;
  useEffect(() => {
    if (read && !read.isSet) onNoPin();
  }, [read, onNoPin]);

  // The lock: from the read at the start, and again after a refusal that says locked. The server sends the instant the lock
  // ends, not seconds; it is read against the phone's clock once, here, as the answer arrives, and from then on the lock
  // counts down on the monotonic clock, so a phone clock changed while it runs moves nothing (round 3, N2).
  const lockClock = useMonotonicCountdown();
  const startLock = lockClock.start;
  const lockedUntil = read?.lockedUntil ?? null;
  useEffect(() => {
    startLock(Math.ceil(lockLeftMs(lockedUntil, Date.now()) / MS_PER_SECOND));
  }, [lockedUntil, startLock]);
  const lockLeft = lockClock.seconds * MS_PER_SECOND;
  const locked = lockClock.seconds > 0;

  const say = (text: string, wrongPin = false) => {
    setLine({ text, wrongPin });
    AccessibilityInfo.announceForAccessibility(text);
  };

  const learnLock = async () => {
    await pin.refetch();
  };

  const startAgainAt = (next: Stage, text: string | null, wrongPin = false) => {
    first.current = null;
    attempt.current = null;
    setDigits('');
    setStage(next);
    if (text === null) setLine(null);
    else say(text, wrongPin);
  };

  const finish = () => {
    current.current = null;
    first.current = null;
    attempt.current = null;
    void queryClient.invalidateQueries({ queryKey: ['money'] });
    onChanged();
  };

  const submitCurrent = async (entered: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy('checking');
    setLine(null);
    try {
      await verifyPin(entered);
      if (!alive.current) return;
      current.current = entered;
      startAgainAt('new', null);
    } catch (error) {
      if (!alive.current) return;
      const refusal = refusalOf(error);
      setDigits('');
      if (refusal.kind === 'locked') {
        await learnLock();
        say(refusal.line);
      } else if (refusal.kind === 'no_pin') onNoPin();
      else if (refusal.kind === 'no_wallet') onNoWallet();
      else say(refusal.line, refusal.kind === 'wrong_pin');
    } finally {
      inFlight.current = false;
      if (alive.current) setBusy((was) => (was === 'checking' ? 'idle' : was));
    }
  };

  /** The second entry is in: this is one attempt, with one key for as long as it goes unanswered. */
  const submitNew = (firstEntry: string, secondEntry: string) => {
    const pinInUse = current.current;
    if (inFlight.current || pinInUse === null) return;
    attempt.current = { key: newRequestKey(), current: pinInUse, newPin: firstEntry, newPinConfirmation: secondEntry };
    void send();
  };

  /**
   * Sends the attempt held. With no answer it is sent once more at once, under the same key; with none again (or the
   * server saying the first is still running) the person is told so and Try again sends it again, still the same.
   */
  const send = async () => {
    const held = attempt.current;
    if (inFlight.current || held === null) return;
    inFlight.current = true;
    setBusy('saving');
    setLine(null);
    try {
      let unanswered: Refusal | null = null;
      for (let sends = 0; sends < REPEATS; sends += 1) {
        try {
          await changePin(held);
          if (!alive.current) return;
          finish();
          return;
        } catch (error) {
          if (!alive.current) return;
          const refusal = refusalOf(error);
          if (refusal.kind !== 'unanswered' && refusal.kind !== 'in_progress') {
            await refused(refusal);
            return;
          }
          unanswered = refusal;
          // The server is still on the first one: it will answer it. Do not send a third.
          if (refusal.kind === 'in_progress') break;
        }
      }
      setBusy('unsent');
      say(unanswered?.kind === 'in_progress' ? unanswered.line : `${UNKNOWN_CHANGE} ${unanswered?.line ?? ''}`.trim());
    } finally {
      inFlight.current = false;
      if (alive.current) setBusy((was) => (was === 'saving' ? 'idle' : was));
    }
  };

  /** An answer that says the change did not happen: why, and where the person starts again. */
  const refused = async (refusal: Refusal) => {
    attempt.current = null;
    first.current = null;
    setDigits('');
    switch (refusal.kind) {
      case 'mismatch':
        startAgainAt('new', refusal.line, true);
        break;
      case 'wrong_pin':
        // The PIN in use was changed under this screen (another phone, a reset): ask for it again.
        current.current = null;
        startAgainAt('current', refusal.line, true);
        break;
      case 'locked':
        current.current = null;
        startAgainAt('current', null);
        await learnLock();
        say(refusal.line);
        break;
      case 'changed_again':
        // The change landed, and the PIN was changed again before this repeat came (N4): the PIN typed here is not the PIN
        // now, and neither is the one in use, so nothing is claimed and nothing is sent with the old one.
        current.current = null;
        void queryClient.invalidateQueries({ queryKey: ['money'] });
        startAgainAt('current', refusal.line);
        break;
      case 'no_pin':
        onNoPin();
        break;
      case 'no_wallet':
        onNoWallet();
        break;
      default:
        startAgainAt('new', refusal.line);
    }
  };

  const keysOff = busy !== 'idle' || locked;
  const onDigit = (digit: string) => {
    if (keysOff || digits.length >= PIN_LENGTH) return;
    const next = digits + digit;
    if (next.length < PIN_LENGTH) {
      setDigits(next);
      setLine(null);
      return;
    }
    if (stage === 'current') {
      setDigits(next);
      void submitCurrent(next);
    } else if (stage === 'new') {
      first.current = next;
      setDigits('');
      setLine(null);
      setStage('confirm');
      AccessibilityInfo.announceForAccessibility(CONFIRM_TITLE);
    } else {
      const entered = first.current;
      setDigits(next);
      if (entered !== null) submitNew(entered, next);
    }
  };
  const onDelete = () => {
    if (!keysOff) setDigits((was) => was.slice(0, -1));
  };
  const onClear = () => {
    if (!keysOff) setDigits('');
  };

  const waiting = busy === 'checking' || busy === 'saving';
  const back = () => {
    if (waiting) return;
    if (stage === 'confirm') {
      // Back from a change that has no answer yet gives that attempt up and frees the keypad (D4).
      setBusy('idle');
      startAgainAt('new', null);
      return;
    }
    onBack();
  };

  const filled = waiting ? PIN_LENGTH : digits.length;
  const missed = line?.wrongPin === true && digits.length === 0 && !waiting;

  let status: React.ReactNode = null;
  if (waiting) {
    status = (
      <ActivityIndicator
        color={colors.accentFg}
        accessibilityLabel={busy === 'checking' ? 'Checking your PIN' : 'Changing your PIN'}
        testID={busy === 'checking' ? 'change-pin-checking' : 'change-pin-saving'}
      />
    );
  } else if (locked && stage === 'current') {
    status = <StatusLine text={lockedLine(lockLeft)} testID="change-pin-locked" />;
  } else if (line) {
    status = (
      <>
        <StatusLine text={line.text} testID="change-pin-line" />
        {busy === 'unsent' ? <Button label="Try again" icon="RotateCw" variant="secondary" size="md" onPress={() => void send()} testID="change-pin-try-again" /> : null}
      </>
    );
  }

  const head =
    stage === 'current' ? (
      <PinHead title={CURRENT_TITLE} line={CURRENT_LINE} testID="change-pin-title" />
    ) : (
      <PinHead title={stage === 'new' ? NEW_PIN_TITLE : CONFIRM_TITLE} line={NEW_PIN_LINE} testID="change-pin-title" />
    );

  return (
    <PinFrame
      testID={`change-pin-${stage}`}
      navSub={stage === 'current' ? undefined : stepLabel(stage === 'new' ? 1 : 2)}
      onBack={back}
      backDisabled={waiting}
      head={head}
      middle={
        <>
          <PinDots filled={filled} missed={missed} testID="change-pin-dots" />
          {status}
        </>
      }
      keypad={{ inactive: keysOff, onDigit, onDelete, onClear }}
      footer={
        stage === 'current' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Forgot PIN?" onPress={onForgotPin} disabled={waiting} hitSlop={space.md} style={styles.forgot} testID="change-pin-forgot">
            <Text variant="linkStrong" tone={waiting ? 'textDisabled' : undefined} style={styles.center}>
              Forgot PIN?
            </Text>
          </Pressable>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'center' },
  center: { textAlign: 'center' },
});

