import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { onSessionEnd, useSession } from '@/api/session';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ALERT, DOTS } from '@/components/pin-sheet/kit';
import { Keypad } from '@/components/pin-sheet/Keypad';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, layout, radius, space, useWawu } from '@/theme';

import { OPEN_WALLET_KEY } from './api/account';
import { fetchOpenedWallet, openedWalletQuery, setTransactionPin } from './api/wallet';
import { OpenWalletEnd } from './OpenWalletEnd';
import { afterPinRefusal, ALREADY_SET, lengthLine, PIN_LENGTH, PIN_PURPOSE, unconfirmedLine } from './pin';
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

type Line = { text: string; wrongPin: boolean };
/**
 * - entering: the keypad is live
 * - setting: `POST /money/pin` is out; keys off
 * - checking: the set got no answer, so the wallet is read to learn whether the PIN was set; keys off
 * - unchecked: that read got no answer either; only Try again (the read once more), never a new entry
 * - already: the server already held a PIN this screen did not know of; the earlier one stands
 * - done: set; the flow is ending
 */
type Phase = 'entering' | 'setting' | 'checking' | 'unchecked' | 'already' | 'done';

export type CreatePinScreenProps = {
  /** Back from A9 to A8. */
  onBack: () => void;
  /** The PIN is set (or one already was): back to where Open your wallet started. */
  onDone: () => void;
  /**
   * The session ended with the screen still drawn and the app still signed in
   * (a sign-in that replaced it, a refresh that answered another account):
   * nothing of this visit goes on for the new account, so the flow is left.
   */
  onLeave: () => void;
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
export function CreatePinScreen({ onBack, onDone, onNotOpen, onLeave }: CreatePinScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const { status: sessionStatus } = useSession();
  /** How many sessions have ended while this screen was drawn: each one starts it over, as another visit. */
  const [ends, setEnds] = useState(0);
  const signedIn = useSessionAccount(String(ends));
  const owner = signedIn ?? undefined;
  const wallet = useQuery(openedWalletQuery(owner));

  const [digits, setDigits] = useState('');
  const [line, setLine] = useState<Line | null>(null);
  const [phase, setPhase] = useState<Phase>('entering');
  /**
   * A9's four digits, held only until A10's request is sent. Holding them is
   * what puts the screen on A10: with them dropped (a send, Back, a session
   * end) it is A9 again.
   */
  const [first, setFirst] = useState<string | null>(null);
  /** Set before the request, so a second tap in the same frame sends nothing. */
  const inFlight = useRef(false);
  /** This visit: bumped when the session ends or the screen closes. An answer from an earlier visit moves nothing. */
  const visit = useRef(0);
  /** Why the set got no answer, kept for the line if the wallet then says the PIN was not set. */
  const lost = useRef<string | null>(null);
  const handed = useRef(false);
  useEffect(() => {
    const stop = onSessionEnd(() => {
      // Everything of the account that was signed in goes: the digits, A9's entry, the step, the phase, the line.
      visit.current += 1;
      setFirst(null);
      lost.current = null;
      inFlight.current = false;
      handed.current = false;
      setDigits('');
      setLine(null);
      setPhase('entering');
      setEnds((n) => n + 1);
    });
    return () => {
      visit.current += 1;
      stop();
    };
  }, []);
  // Still signed in after the session ended, so another account (or a new session) now holds the app: leave the flow.
  // Signed out, the route itself sends the visitor away.
  useEffect(() => {
    if (ends > 0 && sessionStatus === 'signedIn') onLeave();
  }, [ends, sessionStatus, onLeave]);

  // Only a read that has settled counts: while it is in flight, or when it failed, what the cache holds (A8's read, from before) is not trusted.
  const read = wallet.isFetching || wallet.isError ? undefined : wallet.data;
  const pinIsSet = read?.pinIsSet === true;
  const state = read?.state;
  const notOpen = state === 'not_open' || state === 'opening';
  // A PIN set before (BACKEND_GAPS G-41): nothing to create, go on as if A10 were done. No wallet: A8 says where it stands.
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
    setFirst(null);
    setDigits('');
    setLine(next);
    setPhase('entering');
    AccessibilityInfo.announceForAccessibility(next.text);
  };

  const askAgain = () => {
    // Every money read is asked again on the way out, so where the flow started (the pay sheet, the Wallet tab) sees the open wallet.
    void client.invalidateQueries({ queryKey: ['money'] });
    void client.invalidateQueries({ queryKey: [OPEN_WALLET_KEY] });
  };
  const finish = () => {
    handed.current = true;
    setPhase('done');
    askAgain();
    onDone();
  };

  /**
   * The set got no answer: the wallet read says whether the PIN was set. Set,
   * the PIN typed twice in this visit is the one (this screen arrived with
   * none). Not set, the person starts again at A9. No answer to the read
   * either: A10 stays, and Try again reads again; a new entry is never
   * offered while the PIN may be set.
   */
  const check = async (mine: number) => {
    setPhase('checking');
    setLine(null);
    try {
      const now = await fetchOpenedWallet();
      if (visit.current !== mine) return;
      if (now.pinIsSet) {
        finish();
        return;
      }
      startAgain({ text: lost.current ?? unconfirmedLine(null), wrongPin: false });
    } catch (error) {
      if (visit.current !== mine) return;
      const said = unconfirmedLine(isApiError(error) ? error.message : null);
      setPhase('unchecked');
      setLine({ text: said, wrongPin: false });
      AccessibilityInfo.announceForAccessibility(said);
    }
  };

  const submit = async (second: string) => {
    const entered = first;
    setFirst(null);
    if (inFlight.current || entered === null) return;
    inFlight.current = true;
    const mine = visit.current;
    setPhase('setting');
    try {
      let refusal: unknown = null;
      let landed = false;
      try {
        await setTransactionPin(entered, second);
        landed = true;
      } catch (error) {
        refusal = error;
      }
      if (visit.current !== mine) return;
      // The request has answered, whatever it said: the second entry goes now, not when the screen closes.
      setDigits('');
      if (landed) {
        finish();
        return;
      }
      const outcome = afterPinRefusal(refusal);
      if (outcome.kind === 'already') {
        // The server holds a PIN this screen did not know of. Which one it is cannot be told here: say only what is true either way.
        handed.current = true;
        setPhase('already');
        askAgain();
        return;
      }
      if (outcome.kind === 'again') {
        startAgain({ text: outcome.line, wrongPin: outcome.wrongPin });
        return;
      }
      lost.current = outcome.line;
      await check(mine);
    } finally {
      if (visit.current === mine) inFlight.current = false;
    }
  };

  // A10 while A9's entry is held, and while its request is out or its outcome is being learned.
  const step = first !== null || phase === 'setting' || phase === 'checking' || phase === 'unchecked' || phase === 'done' ? 'confirm' : 'create';
  const keysOff = phase !== 'entering' || !read || pinIsSet || notOpen;
  const onDigit = (d: string) => {
    if (keysOff || digits.length >= PIN_LENGTH) return;
    const next = digits + d;
    if (next.length < PIN_LENGTH) {
      setDigits(next);
      return;
    }
    if (step === 'create') {
      setFirst(next);
      setDigits('');
      setLine(null);
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
  const waiting = phase === 'setting' || phase === 'checking';
  const back = () => {
    if (waiting) return;
    // While it is not known whether the PIN was set, Back goes to A8, which reads the wallet before offering anything.
    if (phase === 'unchecked') {
      onBack();
      return;
    }
    if (step === 'confirm') {
      setFirst(null);
      setDigits('');
      return;
    }
    onBack();
  };

  const stepNo = step === 'create' ? 1 : STEPS;
  const failed = phase === 'entering' && wallet.isError && !wallet.isFetching;
  const loading = phase === 'entering' && !read && !failed;
  const filled = phase === 'entering' ? digits.length : PIN_LENGTH;
  const missed = line?.wrongPin === true && digits.length === 0 && phase === 'entering';
  const ring = missed ? colors.danger : colors.borderStrong;

  if (phase === 'already') {
    return (
      <OpenWalletEnd
        testID="open-wallet-pin-already-set"
        tone="warn"
        icon="LockKeyhole"
        title={ALREADY_SET.title}
        message={ALREADY_SET.message}
        actionLabel="Done"
        onAction={onDone}
      />
    );
  }

  let status: React.ReactNode = null;
  if (!failed && (loading || phase === 'setting' || phase === 'checking' || phase === 'done')) {
    const label = loading ? 'Loading' : phase === 'checking' ? 'Checking your PIN' : 'Setting your PIN';
    const id = loading ? 'open-wallet-pin-loading' : phase === 'checking' ? 'open-wallet-pin-checking' : 'open-wallet-pin-setting';
    status = <ActivityIndicator color={colors.accentFg} accessibilityLabel={label} testID={id} />;
  } else if (line) {
    status = (
      <View style={styles.alert} accessible accessibilityRole="alert" accessibilityLiveRegion="polite" testID="open-wallet-pin-line">
        <Icon name={ALERT.icon.name} size={ALERT.icon.size} strokeWidth={ALERT.icon.stroke} color={colors.danger} />
        <Text variant="errorLine" style={styles.alertText}>
          {line.text}
        </Text>
      </View>
    );
    if (phase === 'unchecked') {
      status = (
        <>
          {status}
          <Button label="Try again" icon="RotateCw" variant="secondary" size="md" onPress={() => void check(visit.current)} testID="open-wallet-pin-check-again" />
        </>
      );
    }
  }

  return (
    <View testID={step === 'create' ? 'open-wallet-pin-create' : 'open-wallet-pin-confirm'} style={[styles.page, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={back} disabled={waiting} testID="open-wallet-pin-back" />
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
  alertText: { flexShrink: 1 },
});
