import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { waitClock } from '@/components/pin-sheet/format';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useCountdown } from '@/features/auth/useCountdown';
import { layout, useWawu } from '@/theme';

import { confirmPinReset, newRequestKey, startPinReset, type PinResetStarted } from '../api/settings';
import { BELOW, CodeBoxes, CodeMiddle, PinDots, PinFrame, PinHead, StatusLine } from './PinFrame';
import { CODE_LENGTH, CONFIRM_TITLE, NEW_PIN_LINE, NEW_PIN_TITLE, PIN_LENGTH, refusalOf, RESET_NAV, RESET_TITLE, sentToLine, stepLabel, UNKNOWN_RESET, type Refusal } from './pinFlow';

const MS_PER_SECOND = 1000;
/** A reset with no answer is sent this many times in a row (the same request, the same key) before the person is asked to tap Try again. */
const REPEATS = 2;

/**
 * - sending: the first code is being asked for (`POST /money/pin/reset`)
 * - failed: it could not be sent; the server's sentence and, when asking again can help, Try again
 * - code: W37, the six boxes
 * - new, confirm: W36's two steps, with the code held
 */
type Stage = 'sending' | 'failed' | 'code' | 'new' | 'confirm';
/** `saving`: the reset is out. `resending`: a new code is being asked for. `unsent`: the reset got no answer twice (or the server said it is still running); Try again sends it once more under the same key. */
type Busy = 'idle' | 'saving' | 'resending' | 'unsent';
type Line = { text: string; refused: boolean };
/** One attempt to reset the PIN: what is sent, and the Idempotency-Key it is sent under, every time it is sent. */
type Attempt = { key: string; resetId: string; code: string; newPin: string; newPinConfirmation: string };

export type ResetPinScreenProps = {
  /** Back from W37 to where it was opened (W36's current-PIN step went here in its place, so W35). */
  onBack: () => void;
  /** The PIN is reset: back where it was opened, which reads the wallet again. */
  onDone: () => void;
  /** The account has no open wallet: Open your wallet. */
  onNoWallet: () => void;
  /** The account has no PIN to reset: creating one is A9. */
  onNoPin: () => void;
};

/**
 * W37 · Transaction PIN, reset, then W36 again. Arriving here asks for a code (`POST /money/pin/reset`): the server
 * sends it to the person it belongs to and answers who it was sent to (`sentTo`, in its own words: a masked phone, or
 * a masked email when codes go by email) and how many seconds until another can be asked for (`resendInSeconds`, counted
 * down from the server's figure). The six digits are held, not sent: the server checks the code only together with the new PIN
 * (`POST /money/pin/reset/confirm`), so the new PIN is chosen next, twice, and a wrong code sends the person back to
 * the boxes with the server's sentence. Resending changes the code (the old one stops working).
 *
 * The code and both PINs live in this screen's memory only and are dropped when the request is answered, whatever the
 * answer, and on leaving.
 *
 * Resend counts down the server's own seconds (`resendInSeconds`, taken as it answered) on the phone's timer, never
 * `resendAvailableAt` against the phone's clock, and says "We sent a new code." only when the server's answer to it is a
 * different reset: asked before the gap has passed, the server answers the same reset and sends nothing (D3).
 *
 * One attempt is one Idempotency-Key (WALLET-06 round 2, D1): a reset that got no answer is sent again, once at once and
 * then by Try again, with the same key and entries. If the first landed the server answers it again (a code works once,
 * so without the key it would be refused as a code already used); if it did not the repeat is the request. The screen never
 * judges by the PIN's `changedAt`, which moves for a change by anyone.
 */
export function ResetPinScreen({ onBack, onDone, onNoWallet, onNoPin }: ResetPinScreenProps) {
  const { colors } = useWawu();
  const [stage, setStage] = useState<Stage>('sending');
  const [busy, setBusy] = useState<Busy>('idle');
  const [reset, setReset] = useState<PinResetStarted | null>(null);
  const [failure, setFailure] = useState<Refusal | null>(null);
  const [digits, setDigits] = useState('');
  const [line, setLine] = useState<Line | null>(null);
  const [sentNote, setSentNote] = useState(false);
  const code = useRef<string | null>(null);
  const first = useRef<string | null>(null);
  /** The reset being sent, with its key, from the second entry until it is answered or given up. Memory only. */
  const attempt = useRef<Attempt | null>(null);
  const inFlight = useRef(false);
  const alive = useRef(true);
  const began = useRef(false);
  const resend = useCountdown(null);

  useEffect(
    () => () => {
      alive.current = false;
      code.current = null;
      first.current = null;
      attempt.current = null;
    },
    [],
  );

  const say = (text: string, refused = false) => {
    setLine({ text, refused });
    AccessibilityInfo.announceForAccessibility(text);
  };

  const begin = async () => {
    setStage('sending');
    setFailure(null);
    try {
      const started = await startPinReset();
      if (!alive.current) return;
      setReset(started);
      resend.start(started.resendInSeconds);
      setStage('code');
    } catch (error) {
      if (!alive.current) return;
      const refusal = refusalOf(error);
      if (refusal.kind === 'no_wallet') onNoWallet();
      else if (refusal.kind === 'no_pin') onNoPin();
      else {
        setFailure(refusal);
        setStage('failed');
      }
    }
  };

  useEffect(() => {
    if (began.current) return;
    began.current = true;
    void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askAgain = async () => {
    if (inFlight.current || busy !== 'idle' || resend.seconds > 0) return;
    inFlight.current = true;
    setBusy('resending');
    setLine(null);
    setSentNote(false);
    try {
      const started = await startPinReset();
      if (!alive.current) return;
      // Only a different reset is a new code. The same one means the server had not reached its gap and sent nothing:
      // the count starts again from its seconds and nothing is claimed.
      const sentNew = started.resetId !== reset?.resetId;
      setReset(started);
      resend.start(started.resendInSeconds);
      if (sentNew) {
        setDigits('');
        code.current = null;
        setSentNote(true);
      }
    } catch (error) {
      if (!alive.current) return;
      const refusal = refusalOf(error);
      if (refusal.kind === 'no_wallet') onNoWallet();
      else if (refusal.kind === 'no_pin') onNoPin();
      else say(refusal.line);
    } finally {
      inFlight.current = false;
      if (alive.current) setBusy('idle');
    }
  };

  const startAgainAt = (next: Stage, text: string | null, refused = false) => {
    first.current = null;
    attempt.current = null;
    setDigits('');
    setStage(next);
    if (next === 'code') code.current = null;
    if (text === null) setLine(null);
    else say(text, refused);
  };

  const finish = () => {
    code.current = null;
    first.current = null;
    attempt.current = null;
    void queryClient.invalidateQueries({ queryKey: ['money'] });
    onDone();
  };

  /** The second entry is in: this is one attempt, with one key for as long as it goes unanswered. */
  const submit = (firstEntry: string, secondEntry: string) => {
    const sent = code.current;
    if (inFlight.current || sent === null || reset === null) return;
    attempt.current = { key: newRequestKey(), resetId: reset.resetId, code: sent, newPin: firstEntry, newPinConfirmation: secondEntry };
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
          await confirmPinReset(held);
          if (!alive.current) return;
          finish();
          return;
        } catch (error) {
          if (!alive.current) return;
          const refusal = refusalOf(error);
          if (refusal.kind !== 'unanswered' && refusal.kind !== 'in_progress') {
            refused(refusal);
            return;
          }
          unanswered = refusal;
          // The server is still on the first one: it will answer it. Do not send a third.
          if (refusal.kind === 'in_progress') break;
        }
      }
      setBusy('unsent');
      say(unanswered?.kind === 'in_progress' ? unanswered.line : `${UNKNOWN_RESET} ${unanswered?.line ?? ''}`.trim());
    } finally {
      inFlight.current = false;
      if (alive.current) setBusy((was) => (was === 'saving' ? 'idle' : was));
    }
  };

  /** An answer that says the reset did not happen: why, and where the person starts again. */
  const refused = (refusal: Refusal) => {
    attempt.current = null;
    first.current = null;
    setDigits('');
    switch (refusal.kind) {
      case 'bad_code':
        startAgainAt('code', refusal.line, true);
        break;
      case 'mismatch':
        startAgainAt('new', refusal.line, true);
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

  const keysOff = busy !== 'idle' || stage === 'sending';
  const limit = stage === 'code' ? CODE_LENGTH : PIN_LENGTH;
  const onDigit = (digit: string) => {
    if (keysOff || digits.length >= limit) return;
    const next = digits + digit;
    setSentNote(false);
    if (next.length < limit) {
      setDigits(next);
      setLine(null);
      return;
    }
    if (stage === 'code') {
      code.current = next;
      setDigits('');
      setLine(null);
      setStage('new');
      AccessibilityInfo.announceForAccessibility(NEW_PIN_TITLE);
    } else if (stage === 'new') {
      first.current = next;
      setDigits('');
      setLine(null);
      setStage('confirm');
      AccessibilityInfo.announceForAccessibility(CONFIRM_TITLE);
    } else {
      const entered = first.current;
      setDigits(next);
      if (entered !== null) submit(entered, next);
    }
  };
  const onDelete = () => {
    if (!keysOff) setDigits((was) => was.slice(0, -1));
  };
  const onClear = () => {
    if (!keysOff) setDigits('');
  };

  const waiting = busy === 'saving';
  const back = () => {
    if (waiting) return;
    if (stage === 'confirm') {
      // Back from a reset that has no answer yet gives that attempt up and frees the keypad (D4's twin).
      setBusy('idle');
      startAgainAt('new', null);
    } else if (stage === 'new') startAgainAt('code', null);
    else onBack();
  };

  if (stage === 'failed' && failure) {
    return (
      <View testID="reset-pin-failed" style={[styles.failed, { backgroundColor: colors.surfacePage }]}>
        <ErrorState
          testID="reset-pin-error"
          icon={failure.kind === 'unanswered' ? 'WifiOff' : 'TriangleAlert'}
          title="We couldn't send your code"
          message={failure.line}
          onRetry={failure.kind === 'unanswered' ? () => void begin() : undefined}
        />
        <Button label="Back" variant="secondary" size="md" onPress={onBack} testID="reset-pin-failed-back" />
      </View>
    );
  }

  const spinner = (label: string, testID: string) => <ActivityIndicator color={colors.accentFg} accessibilityLabel={label} testID={testID} />;

  if (stage === 'sending' || stage === 'code') {
    const codeStatus = (): React.ReactNode => {
      if (stage === 'sending') return spinner('Sending your code', 'reset-pin-sending');
      if (busy === 'resending') return spinner('Sending a new code', 'reset-pin-resending');
      if (line) return <StatusLine text={line.text} testID="reset-pin-line" />;
      if (resend.seconds > 0) {
        return (
          <Text variant="muted" tone="textMuted" style={{ fontSize: BELOW.size }} testID="reset-pin-resend-wait">
            {`Resend in ${waitClock(resend.seconds * MS_PER_SECOND)}`}
          </Text>
        );
      }
      return (
        <Pressable testID="reset-pin-resend" accessibilityRole="button" accessibilityLabel="Resend code" hitSlop={layout.tapMin / 4} onPress={() => void askAgain()}>
          <Text variant="linkStrong">Resend code</Text>
        </Pressable>
      );
    };
    return (
      <PinFrame
        testID="reset-pin-code"
        navTitle={RESET_NAV}
        onBack={back}
        head={<PinHead icon={false} title={RESET_TITLE} line={reset ? sentToLine(reset.sentTo) : undefined} testID="reset-pin-title" />}
        middle={
          <CodeMiddle>
            <CodeBoxes digits={digits} refused={line?.refused === true && digits.length === 0} testID="reset-pin-boxes" />
            {codeStatus()}
            {line && stage === 'code' && resend.seconds === 0 && busy === 'idle' ? (
              <Pressable testID="reset-pin-resend" accessibilityRole="button" accessibilityLabel="Resend code" hitSlop={layout.tapMin / 4} onPress={() => void askAgain()}>
                <Text variant="linkStrong">Resend code</Text>
              </Pressable>
            ) : null}
            {sentNote && !line ? (
              <Text variant="muted" accessibilityLiveRegion="polite" testID="reset-pin-sent">
                We sent a new code.
              </Text>
            ) : null}
          </CodeMiddle>
        }
        keypad={{ inactive: keysOff, onDigit, onDelete, onClear }}
      />
    );
  }

  const filled = waiting ? PIN_LENGTH : digits.length;
  const missed = line?.refused === true && digits.length === 0 && !waiting;
  let status: React.ReactNode = null;
  if (waiting) status = spinner('Resetting your PIN', 'reset-pin-saving');
  else if (line) {
    status = (
      <>
        <StatusLine text={line.text} testID="reset-pin-line" />
        {busy === 'unsent' ? <Button label="Try again" icon="RotateCw" variant="secondary" size="md" onPress={() => void send()} testID="reset-pin-try-again" /> : null}
      </>
    );
  }
  return (
    <PinFrame
      testID={`reset-pin-${stage}`}
      navSub={stepLabel(stage === 'new' ? 1 : 2)}
      onBack={back}
      backDisabled={waiting}
      head={<PinHead title={stage === 'new' ? NEW_PIN_TITLE : CONFIRM_TITLE} line={NEW_PIN_LINE} testID="reset-pin-title" />}
      middle={
        <>
          <PinDots filled={filled} missed={missed} testID="reset-pin-dots" />
          {status}
        </>
      }
      keypad={{ inactive: keysOff, onDigit, onDelete, onClear }}
    />
  );
}

const styles = StyleSheet.create({
  failed: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: layout.gutter, paddingHorizontal: layout.gutter },
});
