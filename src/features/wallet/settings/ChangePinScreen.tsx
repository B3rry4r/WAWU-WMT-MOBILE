import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { lockedLine } from '@/components/pin-sheet/format';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { space, useWawu } from '@/theme';

import { changePin, fetchPinState, verifyPin } from '../api/settings';
import { PinDots, PinFrame, PinHead, StatusLine } from './PinFrame';
import { CONFIRM_TITLE, CURRENT_LINE, CURRENT_TITLE, lockLeftMs, movedOn, NEW_PIN_LINE, NEW_PIN_TITLE, PIN_LENGTH, refusalOf, stepLabel } from './pinFlow';

/** How often the lock's countdown refreshes. */
const TICK_MS = 1000;

type Stage = 'current' | 'new' | 'confirm';
/** `checking`: the current PIN is out. `saving`: the change is out. `unchecked`: the change got no answer and neither did the read that tells whether it landed. */
type Busy = 'idle' | 'checking' | 'saving' | 'unchecked';
type Line = { text: string; wrongPin: boolean };

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
 * answer, and on leaving. Nothing is stored, logged or put in a URL. A change that got no answer is checked by reading
 * the PIN's state: if `changedAt` moved on it landed, and if not the person starts again at the new PIN.
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
  /** `changedAt` as it stood when this screen opened: what "the change landed" is compared with. Undefined until read. */
  const baseline = useRef<string | null | undefined>(undefined);
  const inFlight = useRef(false);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
      current.current = null;
      first.current = null;
    },
    [],
  );

  const read = pin.data;
  useEffect(() => {
    if (!read) return;
    if (baseline.current === undefined) baseline.current = read.changedAt;
    if (!read.isSet) onNoPin();
  }, [read, onNoPin]);

  // The lock: from the read at the start, and again after a refusal that says locked.
  const [now, setNow] = useState(() => Date.now());
  const lockLeft = lockLeftMs(read?.lockedUntil ?? null, now);
  const locked = lockLeft > 0;
  useEffect(() => {
    if (!locked) return undefined;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [locked]);

  const say = (text: string, wrongPin = false) => {
    setLine({ text, wrongPin });
    AccessibilityInfo.announceForAccessibility(text);
  };

  const learnLock = async () => {
    setNow(Date.now());
    await pin.refetch();
  };

  const startAgainAt = (next: Stage, text: string | null, wrongPin = false) => {
    first.current = null;
    setDigits('');
    setStage(next);
    if (text === null) setLine(null);
    else say(text, wrongPin);
  };

  const finish = () => {
    current.current = null;
    first.current = null;
    void queryClient.invalidateQueries({ queryKey: ['money'] });
    onChanged();
  };

  /** Where the change stands when no answer came: moved on is done; unchanged is a fresh start at the new PIN; no answer again waits for Try again. */
  const check = async () => {
    setBusy('saving');
    setLine(null);
    try {
      const now = await fetchPinState();
      if (!alive.current) return;
      if (movedOn(baseline.current, now.changedAt)) {
        finish();
        return;
      }
      setBusy('idle');
      startAgainAt('new', "We couldn't change your PIN. Try again.");
    } catch (error) {
      if (!alive.current) return;
      setBusy('unchecked');
      say(`We couldn't check whether your PIN was changed. ${refusalOf(error).line}`);
    }
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

  const submitNew = async (firstEntry: string, secondEntry: string) => {
    const pinInUse = current.current;
    if (inFlight.current || pinInUse === null) return;
    inFlight.current = true;
    setBusy('saving');
    setLine(null);
    try {
      await changePin(pinInUse, firstEntry, secondEntry);
      if (!alive.current) return;
      finish();
    } catch (error) {
      if (!alive.current) return;
      const refusal = refusalOf(error);
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
        case 'no_pin':
          onNoPin();
          break;
        case 'no_wallet':
          onNoWallet();
          break;
        case 'unanswered':
          inFlight.current = false;
          await check();
          break;
        default:
          startAgainAt('new', refusal.line);
      }
    } finally {
      inFlight.current = false;
      if (alive.current) setBusy((was) => (was === 'saving' ? 'idle' : was));
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
      if (entered !== null) void submitNew(entered, next);
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
        {busy === 'unchecked' ? <Button label="Try again" icon="RotateCw" variant="secondary" size="md" onPress={() => void check()} testID="change-pin-check-again" /> : null}
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

