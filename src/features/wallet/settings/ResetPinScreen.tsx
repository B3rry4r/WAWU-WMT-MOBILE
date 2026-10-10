import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { waitClock } from '@/components/pin-sheet/format';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { useCountdown } from '@/features/auth/useCountdown';
import { layout, useWawu } from '@/theme';

import { confirmPinReset, fetchPinState, startPinReset, type PinResetStarted } from '../api/settings';
import { BELOW, CodeBoxes, CodeMiddle, PinDots, PinFrame, PinHead, StatusLine } from './PinFrame';
import { CODE_LENGTH, CONFIRM_TITLE, movedOn, NEW_PIN_LINE, NEW_PIN_TITLE, PIN_LENGTH, refusalOf, RESET_NAV, RESET_TITLE, sentToLine, stepLabel, type Refusal } from './pinFlow';

const MS_PER_SECOND = 1000;

/**
 * - sending: the first code is being asked for (`POST /money/pin/reset`)
 * - failed: it could not be sent; the server's sentence and, when asking again can help, Try again
 * - code: W37, the six boxes
 * - new, confirm: W36's two steps, with the code held
 */
type Stage = 'sending' | 'failed' | 'code' | 'new' | 'confirm';
/** `saving`: the reset is out. `resending`: a new code is being asked for. `unchecked`: the reset got no answer, and neither did the read that tells whether it landed. */
type Busy = 'idle' | 'saving' | 'resending' | 'unchecked';
type Line = { text: string; refused: boolean };

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

function secondsUntil(iso: string): number {
  const at = Date.parse(iso);
  return Number.isNaN(at) ? 0 : Math.max(0, Math.ceil((at - Date.now()) / MS_PER_SECOND));
}

/**
 * W37 · Transaction PIN, reset, then W36 again. Arriving here asks for a code (`POST /money/pin/reset`): the server
 * sends it to the person it belongs to and answers who it was sent to (`sentTo`, in its own words: a masked phone, or
 * a masked email when codes go by email) and when another can be asked for (`resendAvailableAt`, counted down as the
 * server gave it). The six digits are held, not sent: the server checks the code only together with the new PIN
 * (`POST /money/pin/reset/confirm`), so the new PIN is chosen next, twice, and a wrong code sends the person back to
 * the boxes with the server's sentence. Resending changes the code (the old one stops working).
 *
 * The code and both PINs live in this screen's memory only and are dropped when the request is answered, whatever the
 * answer, and on leaving. A reset that got no answer is checked by reading the PIN's state: if `changedAt` moved on
 * it landed, and if not the person starts again at the new PIN with the same code.
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
  const baseline = useRef<string | null | undefined>(undefined);
  const inFlight = useRef(false);
  const alive = useRef(true);
  const began = useRef(false);
  const resend = useCountdown(null);

  useEffect(
    () => () => {
      alive.current = false;
      code.current = null;
      first.current = null;
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
      resend.start(secondsUntil(started.resendAvailableAt));
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
    // The PIN as it stands now: what a reset that got no answer is compared with.
    void fetchPinState().then(
      (state) => {
        if (alive.current && baseline.current === undefined) baseline.current = state.changedAt;
      },
      () => undefined,
    );
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
      setReset(started);
      resend.start(secondsUntil(started.resendAvailableAt));
      setDigits('');
      code.current = null;
      setSentNote(true);
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
    setDigits('');
    setStage(next);
    if (next === 'code') code.current = null;
    if (text === null) setLine(null);
    else say(text, refused);
  };

  const finish = () => {
    code.current = null;
    first.current = null;
    void queryClient.invalidateQueries({ queryKey: ['money'] });
    onDone();
  };

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
      startAgainAt('new', "We couldn't reset your PIN. Try again.");
    } catch (error) {
      if (!alive.current) return;
      setBusy('unchecked');
      say(`We couldn't check whether your PIN was reset. ${refusalOf(error).line}`);
    }
  };

  const submit = async (firstEntry: string, secondEntry: string) => {
    const sent = code.current;
    if (inFlight.current || sent === null || reset === null) return;
    inFlight.current = true;
    setBusy('saving');
    setLine(null);
    try {
      await confirmPinReset({ resetId: reset.resetId, code: sent, newPin: firstEntry, newPinConfirmation: secondEntry });
      if (!alive.current) return;
      finish();
    } catch (error) {
      if (!alive.current) return;
      const refusal = refusalOf(error);
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
      if (entered !== null) void submit(entered, next);
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
    if (stage === 'confirm') startAgainAt('new', null);
    else if (stage === 'new') startAgainAt('code', null);
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
        {busy === 'unchecked' ? <Button label="Try again" icon="RotateCw" variant="secondary" size="md" onPress={() => void check()} testID="reset-pin-check-again" /> : null}
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
