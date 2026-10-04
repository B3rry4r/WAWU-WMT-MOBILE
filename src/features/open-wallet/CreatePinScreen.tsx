import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { onSessionEnd } from '@/api/session';
import { IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ALERT, DOTS } from '@/components/pin-sheet/kit';
import { Keypad } from '@/components/pin-sheet/Keypad';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import { OPEN_WALLET_KEY } from './api/account';
import { fetchOpenedWallet, openedWalletQuery, setTransactionPin } from './api/wallet';
import { afterPinRefusal, lengthLine, PIN_LENGTH, PIN_PURPOSE } from './pin';
import { useSessionAccount } from './sessionAccount';

/**
 * design/_gen/auth.js line 59, `pinMake`: the bar (back, and the step "1 of 2"
 * on the right, 12.5 / 600 muted, 42 wide), then the body 8 down with 40
 * under it: a centred column 20 down (the LockKeyhole tile 56, accent; the
 * title 22 bold 8 below it; the muted line), the dots centred in the space
 * left, the keypad at the bottom, 14 between the parts.
 */
const NAV = { height: 56, side: 42, step: 12.5 } as const;
const BODY = { top: 8, bottom: 40, between: 14, headTop: 20, headGap: 8, titleNudge: 8, icon: 56 } as const;

const STEPS = 2;
const CREATE_TITLE = 'Create your transaction PIN';
const CONFIRM_TITLE = 'Enter it again';

type Step = 'create' | 'confirm';
type Line = { text: string; wrongPin: boolean };
type Phase = 'entering' | 'setting' | 'done';

export type CreatePinScreenProps = {
  /** Back from A9 to A8. */
  onBack: () => void;
  /** The PIN is set (or one already was): back to where Open your wallet started. */
  onDone: () => void;
  /** The wallet is not open (a link or a reload with no account): A8 says where it stands. */
  onNotOpen: () => void;
};

/**
 * A9 · Create PIN and A10 · Confirm PIN (KYC-04), one screen in two steps.
 * Four digits on A9, the same four again on A10, then `POST /money/pin` with
 * both (MONEY-09). The server compares them: a mismatch is its `pin_mismatch`
 * sentence under the dots in the PIN sheet's wrong-PIN look (W11; BRIEF
 * section 12, A10), and the person starts again at A9.
 *
 * The PIN lives in this screen's memory only: the digits typed, and A9's four
 * held for A10. Both are dropped the moment the request is answered, whatever
 * the answer, and on Back or leaving. Nothing is stored, logged, or put in a
 * URL. An answer that lands after the session ended, or after the screen
 * closed, changes nothing.
 */
export function CreatePinScreen({ onBack, onDone, onNotOpen }: CreatePinScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const wallet = useQuery(openedWalletQuery(owner));

  const [step, setStep] = useState<Step>('create');
  const [digits, setDigits] = useState('');
  const [line, setLine] = useState<Line | null>(null);
  const [phase, setPhase] = useState<Phase>('entering');
  /** A9's four digits, held only until A10's request is sent. */
  const first = useRef<string | null>(null);
  /** Set before the request, so a second tap in the same frame sends nothing. */
  const inFlight = useRef(false);
  /** False once this screen closed or the session ended: an answer after that moves nothing. */
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    const stop = onSessionEnd(() => {
      live.current = false;
      first.current = null;
    });
    return () => {
      live.current = false;
      first.current = null;
      stop();
    };
  }, []);

  const pinIsSet = wallet.data?.pinIsSet === true;
  const state = wallet.data?.state;
  const notOpen = state === 'not_open' || state === 'opening';
  // A PIN set before (BACKEND_GAPS G-41): nothing to create, go on as if A10 were done. No wallet: A8 says where it stands.
  const handed = useRef(false);
  useEffect(() => {
    if (phase !== 'entering' || handed.current) return;
    if (pinIsSet) {
      handed.current = true;
      onDone();
    } else if (notOpen) {
      handed.current = true;
      onNotOpen();
    }
  }, [pinIsSet, notOpen, phase, onDone, onNotOpen]);

  const startAgain = (next: Line) => {
    setStep('create');
    setDigits('');
    setLine(next);
    setPhase('entering');
    AccessibilityInfo.announceForAccessibility(next.text);
  };

  const finish = () => {
    handed.current = true;
    setPhase('done');
    // Every money read is asked again on the way out, so where the flow started (the pay sheet, the Wallet tab) sees the open wallet.
    void client.invalidateQueries({ queryKey: ['money'] });
    void client.invalidateQueries({ queryKey: [OPEN_WALLET_KEY] });
    onDone();
  };

  const submit = async (second: string) => {
    const entered = first.current;
    first.current = null;
    if (inFlight.current || entered === null) return;
    inFlight.current = true;
    setPhase('setting');
    try {
      await setTransactionPin(entered, second);
      if (!live.current) return;
      finish();
    } catch (error) {
      if (!live.current) return;
      const outcome = afterPinRefusal(error);
      if (outcome.kind === 'done') {
        finish();
        return;
      }
      if (outcome.kind === 'again') {
        startAgain({ text: outcome.line, wrongPin: outcome.wrongPin });
        return;
      }
      // No answer that says whether it was set: the wallet read does. Set means this PIN, typed twice, is the one.
      try {
        const now = await fetchOpenedWallet();
        if (!live.current) return;
        if (now.pinIsSet) {
          finish();
          return;
        }
      } catch {
        if (!live.current) return;
      }
      startAgain({ text: outcome.line, wrongPin: false });
    } finally {
      inFlight.current = false;
    }
  };

  const keysOff = phase !== 'entering' || !wallet.data || pinIsSet || notOpen;
  const onDigit = (d: string) => {
    if (keysOff || digits.length >= PIN_LENGTH) return;
    const next = digits + d;
    if (next.length < PIN_LENGTH) {
      setDigits(next);
      return;
    }
    if (step === 'create') {
      first.current = next;
      setDigits('');
      setLine(null);
      setStep('confirm');
      AccessibilityInfo.announceForAccessibility(CONFIRM_TITLE);
      return;
    }
    setDigits(next);
    void submit(next);
  };
  const onDelete = () => {
    if (!keysOff) setDigits((d) => d.slice(0, -1));
  };
  const onClear = () => {
    if (!keysOff) setDigits('');
  };
  const back = () => {
    if (phase === 'setting') return;
    if (step === 'confirm') {
      first.current = null;
      setDigits('');
      setStep('create');
      return;
    }
    onBack();
  };

  const stepNo = step === 'create' ? 1 : STEPS;
  const failed = wallet.isError && wallet.data === undefined;
  const filled = phase === 'setting' || phase === 'done' ? PIN_LENGTH : digits.length;
  const missed = line?.wrongPin === true && digits.length === 0 && phase === 'entering';
  const ring = missed ? colors.danger : colors.borderStrong;

  let status: React.ReactNode = null;
  if (!failed && (!wallet.data || phase !== 'entering')) {
    status = (
      <ActivityIndicator
        color={colors.accentFg}
        accessibilityLabel={wallet.data ? 'Setting your PIN' : 'Loading'}
        testID={wallet.data ? 'open-wallet-pin-setting' : 'open-wallet-pin-loading'}
      />
    );
  } else if (line) {
    status = (
      <View style={styles.alert} accessible accessibilityRole="alert" accessibilityLiveRegion="polite" testID="open-wallet-pin-line">
        <Icon name={ALERT.icon.name} size={ALERT.icon.size} strokeWidth={ALERT.icon.stroke} color={colors.danger} />
        <Text variant="errorLine" style={styles.alertText}>
          {line.text}
        </Text>
      </View>
    );
  }

  return (
    <View testID={step === 'create' ? 'open-wallet-pin-create' : 'open-wallet-pin-confirm'} style={[styles.page, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={back} disabled={phase === 'setting'} testID="open-wallet-pin-back" />
        </View>
        <View style={styles.navMiddle} />
        <View style={styles.side}>
          <Text variant="meta" style={[font(600), styles.step]} accessibilityLabel={`Step ${stepNo} of ${STEPS}`} testID="open-wallet-pin-step">
            {`${stepNo} of ${STEPS}`}
          </Text>
        </View>
      </View>
      {failed ? (
        <View style={styles.failed}>
          <ErrorState
            title="We couldn't open this step"
            message={isApiError(wallet.error) ? wallet.error.message : 'Something went wrong. Try again.'}
            onRetry={() => void wallet.refetch()}
            testID="open-wallet-pin-error"
          />
        </View>
      ) : (
        <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, BODY.bottom) }]}>
          <View style={styles.head}>
            <IconTile icon="LockKeyhole" tone="accent" size={BODY.icon} />
            <Text variant="sheetTitle" style={styles.title} testID="open-wallet-pin-title">
              {step === 'create' ? CREATE_TITLE : CONFIRM_TITLE}
            </Text>
            <Text variant="muted" style={styles.center}>
              {`${lengthLine()} ${PIN_PURPOSE}`}
            </Text>
          </View>
          <View style={styles.middle}>
            <View style={styles.dots} accessible accessibilityLabel={`${filled} of ${PIN_LENGTH} digits entered`} testID="open-wallet-pin-dots">
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i < filled ? { backgroundColor: colors.textPrimary } : { borderColor: ring, borderWidth: DOTS.ring }]}
                />
              ))}
            </View>
            {status}
          </View>
          <Keypad inactive={keysOff} onDigit={onDigit} onDelete={onDelete} onClear={onClear} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  nav: { height: NAV.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: NAV.side },
  navMiddle: { flex: 1 },
  step: { fontSize: NAV.step, textAlign: 'right' },
  failed: { flex: 1, justifyContent: 'center' },
  body: { flex: 1, paddingTop: BODY.top, paddingHorizontal: layout.gutter, gap: BODY.between },
  head: { alignItems: 'center', gap: BODY.headGap, paddingTop: BODY.headTop },
  title: { marginTop: BODY.titleNudge, textAlign: 'center' },
  center: { textAlign: 'center' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: DOTS.padY },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: DOTS.apart },
  dot: { width: DOTS.size, height: DOTS.size, borderRadius: radius.chip },
  alert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ALERT.apart },
  alertText: { flexShrink: 1, textAlign: 'center' },
});
