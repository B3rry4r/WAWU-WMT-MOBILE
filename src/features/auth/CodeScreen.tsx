import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Keypad } from '@/components/pin-sheet/Keypad';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { font, layout, radius, space, useWawu } from '@/theme';

import { AuthFrame } from './AuthFrame';
import { Banner } from '@/components/Banner';
import type { Failure } from './signInFailure';
import { clock, type Outcome } from './signupFailure';
import { useCountdown } from './useCountdown';

/** The code is 6 digits (contract `PhoneVerifyConfirmDto.code`, pattern `^\d{6}$`; the email code is the same). */
export const CODE_LENGTH = 6;
/** design/_gen/kit.js line 53, `boxes`: 46 by 56, 16 radius, 9 apart, the digit 24 / 600; the current box has a 1.5 px accent edge, the rest 1 px hairline. */
const BOX = { width: 46, height: 56, apart: 9, digit: 24, edgeOn: 1.5, edgeOff: 1 } as const;
/** design/_gen/auth.js line 55: the heading is `h1` at 24 px with 6 below it and 10 above; the boxes and the line under them sit 14 apart. */
const HEAD = { size: 24, tracking: -0.03, leading: 1.15, apart: 6, top: 10, middleGap: 14 } as const;
/** design/_gen/auth.js line 55: the line under the boxes is 13 / 600 danger beside a 15 px CircleAlert at stroke 2.2, 6 apart; the resend line is 13.5 muted. */
const LINE = { icon: 15, stroke: 2.2, apart: 6, resend: 13.5 } as const;
/** design/_gen/auth.js line 55: the body stacks its parts 14 apart. */
const BODY_GAP = 14;

export type CodeScreenProps = {
  navTitle: string;
  title?: string;
  /** The line under the title: where the code went. */
  subtitle: string;
  /** Seconds until another code can be asked for, from the server. */
  resendIn: number;
  /** Checks the code. Resolves when it was right (the route moves on); rejects with the server's refusal. */
  onSubmit: (code: string, extra: string) => Promise<void>;
  /** Asks for another code. Resolves with the server's `resendIn`. */
  onResend: () => Promise<number>;
  /** Turns a refusal into what the screen does about it. */
  classify: (error: unknown) => Outcome;
  /** After this many wrong codes in a row the secret is no longer live: the screen offers to start again (BACKEND_GAPS G-18, N-1). */
  restartAfter?: number;
  onRestart?: () => void;
  onBack?: () => void;
  /** A second code to enter beside the first (the email code, when sign-up asked for it). */
  extra?: { label: string; hint: string };
  /** A plain note under the heading that has nothing to do with the code: the number that was not added (AUTH-07 round 3). */
  aside?: { title: string; body: string };
  /** Under the Resend line: "Later" on the email step. */
  later?: { label: string; onPress: () => Promise<void> };
  /** What the screen starts in (a preview, never the app). */
  initialDigits?: string;
  initialWrong?: boolean;
  testID: string;
};

type Phase = { kind: 'entering' } | { kind: 'wrong' } | { kind: 'dead' };

/**
 * A4, A15 and the email step: six boxes, a keypad, a resend line that counts
 * down the server's own figure, and the cause of every refusal. The sixth digit
 * sends the code at once (with a second code to enter, Continue sends both).
 */
export function CodeScreen({
  navTitle,
  title = 'Enter the 6-digit code',
  subtitle,
  resendIn,
  onSubmit,
  onResend,
  classify,
  restartAfter,
  onRestart,
  onBack,
  extra,
  aside,
  later,
  initialDigits = '',
  initialWrong = false,
  testID,
}: CodeScreenProps) {
  const { colors } = useWawu();
  const [digits, setDigits] = useState(initialDigits);
  const [extraCode, setExtraCode] = useState('');
  const [phase, setPhase] = useState<Phase>(initialWrong ? { kind: 'wrong' } : { kind: 'entering' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Failure | null>(null);
  const [sentNote, setSentNote] = useState(false);
  const resend = useCountdown(resendIn);
  const lock = useCountdown(null);
  const locked = lock.seconds > 0;
  const inFlight = useRef(false);
  const wrongRun = useRef(0);
  const resendLink = useFocusRing();
  const laterLink = useFocusRing();

  const apply = (outcome: Outcome) => {
    if (outcome.kind === 'wrong') {
      wrongRun.current += 1;
      if (restartAfter !== undefined && wrongRun.current >= restartAfter) {
        setPhase({ kind: 'dead' });
        return;
      }
      setPhase({ kind: 'wrong' });
    } else if (outcome.kind === 'locked') {
      wrongRun.current = 0;
      setDigits('');
      setPhase({ kind: 'entering' });
      lock.start(outcome.seconds);
    } else if (outcome.kind === 'wait') {
      resend.start(outcome.seconds);
    } else {
      setNotice(outcome.failure);
    }
  };

  const submit = async (code: string, second: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await onSubmit(code, second);
      wrongRun.current = 0;
    } catch (error) {
      apply(classify(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const ready = (code: string, second: string) => code.length === CODE_LENGTH && (!extra || second.length === CODE_LENGTH);

  const keysOff = busy || locked || phase.kind === 'dead';
  const onDigit = (digit: string) => {
    if (keysOff) return;
    // After a wrong code the next digit starts a fresh one, so there is nothing to delete first.
    const base = phase.kind === 'wrong' || (notice && digits.length >= CODE_LENGTH) ? '' : digits;
    if (base.length >= CODE_LENGTH) return;
    const next = base + digit;
    setDigits(next);
    setNotice(null);
    setPhase({ kind: 'entering' });
    setSentNote(false);
    if (!extra && next.length === CODE_LENGTH) void submit(next, '');
  };
  // WALK-FIX M4: a code pasted, or offered by the phone from a text or an email ("123456", "123 456"), fills all the boxes. The sixth
  // digit sends it, as a keypad's sixth digit does. A single character is a key like the keypad's own.
  const onPhoneText = (text: string) => {
    if (keysOff) return;
    const incoming = text.replace(/\D/g, '');
    if (incoming.length === 0) return;
    if (incoming.length === 1) {
      onDigit(incoming);
      return;
    }
    const next = incoming.slice(0, CODE_LENGTH);
    setDigits(next);
    setNotice(null);
    setPhase({ kind: 'entering' });
    setSentNote(false);
    if (!extra && next.length === CODE_LENGTH) void submit(next, '');
  };
  const onDelete = () => {
    if (busy || locked || phase.kind === 'dead') return;
    setDigits(digits.slice(0, -1));
    setPhase({ kind: 'entering' });
  };
  const onClear = () => {
    if (busy || locked || phase.kind === 'dead') return;
    setDigits('');
    setPhase({ kind: 'entering' });
  };

  const askAgain = async () => {
    if (busy || resend.seconds > 0 || locked || phase.kind === 'dead') return;
    setNotice(null);
    setBusy(true);
    try {
      const next = await onResend();
      resend.start(next);
      setDigits('');
      setPhase((current) => (current.kind === 'dead' ? current : { kind: 'entering' }));
      setSentNote(true);
    } catch (error) {
      apply(classify(error));
    } finally {
      setBusy(false);
    }
  };

  const putOff = async () => {
    if (!later || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await later.onPress();
    } catch (error) {
      apply(classify(error));
    } finally {
      setBusy(false);
    }
  };

  const wrongLine = phase.kind === 'wrong' ? "That code isn't right" : null;
  const lockedLine = locked ? `Too many tries. Try again in ${clock(lock.seconds)}.` : null;
  const problem = lockedLine ?? wrongLine;

  return (
    <AuthFrame
      testID={testID}
      onBack={onBack}
      navTitle={navTitle}
      footer={
        <View>
          {extra ? (
            <View style={styles.continue}>
              <Button
                label="Continue"
                full
                loading={busy}
                disabled={!ready(digits, extraCode) || locked || phase.kind === 'dead'}
                onPress={() => void submit(digits, extraCode)}
                testID={`${testID}-continue`}
              />
            </View>
          ) : null}
          {phase.kind === 'dead' ? (
            <View style={styles.continue}>
              <Button label="Start again" full onPress={() => onRestart?.()} testID={`${testID}-restart`} />
            </View>
          ) : null}
          {!extra && notice && digits.length === CODE_LENGTH && phase.kind !== 'dead' ? (
            <View style={styles.continue}>
              <Button label="Try again" full loading={busy} onPress={() => void submit(digits, '')} testID={`${testID}-retry`} />
            </View>
          ) : null}
          <Keypad inactive={keysOff} onDigit={onDigit} onDelete={onDelete} onClear={onClear} />
        </View>
      }
    >
      <View style={[styles.body, { gap: BODY_GAP }]}>
        <View style={styles.head}>
          <Text variant="h1" style={{ fontSize: HEAD.size, lineHeight: HEAD.size * HEAD.leading, letterSpacing: HEAD.tracking * HEAD.size }}>
            {title}
          </Text>
          <Text variant="muted">{subtitle}</Text>
        </View>
        {aside ? <Banner tone="warning" title={aside.title} body={aside.body} testID={`${testID}-aside`} /> : null}
        {phase.kind === 'dead' ? (
          <Banner tone="warning" title="This sign-up has ended" body="Start again to get a new code." testID={`${testID}-dead`} />
        ) : null}
        {notice ? <Banner tone={notice.tone} title={notice.title} body={notice.body} testID={`${testID}-banner`} /> : null}
        {extra ? (
          <TextField
            label={extra.label}
            hint={extra.hint}
            testID={`${testID}-extra`}
            value={extraCode}
            onChangeText={(value) => setExtraCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={CODE_LENGTH}
          />
        ) : null}
        <View style={styles.middle}>
          <View style={styles.boxesWrap}>
          <View
            testID={`${testID}-boxes`}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Code, ${digits.length} of ${CODE_LENGTH} digits entered`}
            style={styles.boxes}
          >
            {Array.from({ length: CODE_LENGTH }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.box,
                  {
                    backgroundColor: colors.surfaceCard,
                    boxShadow: [
                      {
                        offsetX: 0,
                        offsetY: 0,
                        blurRadius: 0,
                        spreadDistance: index === digits.length && !problem ? BOX.edgeOn : BOX.edgeOff,
                        color: problem ? colors.borderHairline : index === digits.length ? colors.accent : colors.borderHairline,
                        inset: true,
                      },
                    ],
                  },
                ]}
              >
                <Text variant="body" style={[font(600), { fontSize: BOX.digit }]}>
                  {digits[index] ?? ''}
                </Text>
              </View>
            ))}
          </View>
          {/* Over the boxes and see-through: it never holds the code (value stays empty), so what arrives in it is only what was just
              typed, pasted or offered. The phone offers the code from a text or an email to this field (iOS oneTimeCode, Android sms-otp). */}
          <TextInput
            testID={`${testID}-input`}
            value=""
            onChangeText={onPhoneText}
            onKeyPress={(event) => {
              if (event.nativeEvent.key === 'Backspace') onDelete();
            }}
            editable={!keysOff}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            importantForAutofill="yes"
            autoCorrect={false}
            caretHidden
            // Our own keypad is the keyboard; this field is for paste and the phone's code offer.
            showSoftInputOnFocus={false}
            accessibilityLabel="Paste your code"
            style={styles.hiddenInput}
          />
          </View>
          {problem ? (
            <View style={styles.line} accessibilityRole="alert" accessibilityLiveRegion="polite" testID={`${testID}-error`}>
              <Icon name="CircleAlert" size={LINE.icon} color={colors.danger} strokeWidth={LINE.stroke} />
              <Text variant="errorLine">{problem}</Text>
            </View>
          ) : phase.kind === 'dead' ? null : resend.seconds > 0 ? (
            <Text variant="muted" tone="textMuted" style={{ fontSize: LINE.resend }} testID={`${testID}-resend-wait`}>
              {`Resend in ${clock(resend.seconds)}`}
            </Text>
          ) : (
            <Pressable
              testID={`${testID}-resend`}
              accessibilityRole="button"
              accessibilityLabel="Resend code"
              disabled={busy}
              hitSlop={layout.tapMin / 4}
              onPress={() => void askAgain()}
              {...resendLink.handlers}
              style={resendLink.style}
            >
              <Text variant="linkStrong">Resend code</Text>
            </Pressable>
          )}
          {sentNote && !problem ? (
            <Text variant="muted" accessibilityLiveRegion="polite" testID={`${testID}-sent`}>
              We sent a new code.
            </Text>
          ) : null}
          {later ? (
            <Pressable
              testID={`${testID}-later`}
              accessibilityRole="button"
              accessibilityLabel={later.label}
              disabled={busy}
              hitSlop={layout.tapMin / 4}
              onPress={() => void putOff()}
              {...laterLink.handlers}
              style={[laterLink.style, styles.later]}
            >
              <Text variant="linkStrong" tone="textSecondary">
                {later.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  head: { gap: HEAD.apart, paddingTop: HEAD.top },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: HEAD.middleGap },
  boxesWrap: { alignSelf: 'stretch' },
  hiddenInput: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.02, color: 'transparent', zIndex: 1 },
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: BOX.apart, alignSelf: 'stretch' },
  box: { width: BOX.width, flexShrink: 1, minWidth: 0, height: BOX.height, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: LINE.apart },
  continue: { paddingBottom: space.md },
  later: { paddingVertical: space.sm },
});
