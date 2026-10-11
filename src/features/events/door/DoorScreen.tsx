import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { BottomSheet } from '@/components/BottomSheet';
import { Button, IconButton } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, space } from '@/theme';

import { checkInAtDoor, isEventId, type DoorScan } from './doorApi';
import { canSend, createScanGate, formatTypedCode, newScanKey, readingText } from './doorCode';
import { RESULT_HOLD_MS } from './doorConfig';
import { localNotValidView, resultView, type ResultView } from './doorFormat';
import { AimWords, DOOR, ProblemPanel, ResultPanel, veilOpacity, type ProblemView } from './DoorParts';
import { useDoorCamera, type DoorCamera } from './useDoorCamera';

/**
 * design/_gen/events.js, E19: a 56 bar (a 42 round glass X at the left, "At the door" 17 at 700 white in the
 * middle), a middle that holds the aim area (a 230 square, then 20, then the line "Point at the ticket QR" at 15
 * and 600), 60 up from the bottom, and the button row 20 in from the sides and 48 above the bottom edge. The
 * canvas draws four white corner marks round the aim area, but its own `border-width:0` cancels them, so the
 * render shows none and neither does this screen; the square is only the room they would have taken.
 *
 * With a result up the canvas draws no button row at all and lifts the aim area by 280 instead of 60
 * (`padding-bottom:${res ? 280 : 60}px`), so the aim line rises to stay above the panel. A problem panel is the
 * result panel's shape, so it does the same.
 */
const NAV = { height: 56, button: 42, title: 17, tracking: -0.02 } as const;
const AIM = { size: 230, between: 20, lift: 60, liftWithPanel: 280, line: 15 } as const;
const FOOT = { bottom: 48 } as const;

const NAV_TITLE = 'At the door';
const AIM_LINE = 'Point at the ticket QR';

type Phase =
  | { kind: 'ready' }
  /** A scan or a typed code is on its way to the Hub. */
  | { kind: 'checking' }
  /** E20, E23 or E24. */
  | { kind: 'result'; view: ResultView }
  /** Not a verdict: the Hub could not be asked, or could not answer, or this person may not scan here. */
  | { kind: 'problem'; problem: ProblemView };

export type DoorScreenProps = {
  eventId: string;
  /** Leaves the door (the X, and "Back" when this person may not scan here). */
  onClose: () => void;
};

/**
 * E19 · At the door, with E20 Let them in, E23 Already used and E24 Not a valid ticket as what it answers
 * (EVENTS-09). The organiser and the door staff they added scan the ticket's QR or type its code; the Hub decides
 * (one conditional update, so a ticket is let in once even under two scanners at once) and this screen only shows
 * the verdict. A result clears itself, or on a tap, and the scanner is ready for the next ticket.
 */
export function DoorScreen({ eventId, onClose }: DoorScreenProps) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { camera, onMountError } = useDoorCamera();
  const known = isEventId(eventId);

  const [phase, setPhase] = useState<Phase>(known ? { kind: 'ready' } : { kind: 'problem', problem: gone() });
  /** What `phase` holds, readable between two renders: a camera reports every few hundred milliseconds. */
  const current = useRef<Phase>(phase);
  const go = useCallback((next: Phase) => {
    current.current = next;
    setPhase(next);
  }, []);
  /** Set before the first await, so the same code read twice in one frame is sent once. */
  const inFlight = useRef(false);
  const live = useRef(true);
  const [gate] = useState(createScanGate);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  /** The codes typed while a check was on its way, in the order typed (each waits for the check before it), and how many the screen says are waiting. */
  const queued = useRef<string[]>([]);
  const [waiting, setWaiting] = useState(0);

  /** What "Try again" calls: `check`, as it is now. It is given the scan, so it sends the same key. */
  const again = useRef<(scan: DoorScan) => void>(() => undefined);
  const check = useCallback(
    async (scan: DoorScan) => {
      if (inFlight.current || !known) return;
      inFlight.current = true;
      go({ kind: 'checking' });
      try {
        const result = await checkInAtDoor(eventId, scan);
        if (live.current) go({ kind: 'result', view: resultView(result) });
      } catch (error) {
        if (live.current) go({ kind: 'problem', problem: problemOf(error, () => again.current(scan)) });
      } finally {
        inFlight.current = false;
      }
    },
    [eventId, go, known],
  );

  useEffect(() => {
    again.current = (scan) => void check(scan);
  }, [check]);

  /**
   * One new scan. A reading that cannot be a ticket (under 4 characters, over 500) is answered here, red and
   * at once, and never sent; anything else gets its own key, which Try again keeps for this scan.
   */
  const start = useCallback(
    (text: string) => {
      if (!known) return;
      if (!canSend(text)) {
        go({ kind: 'result', view: localNotValidView() });
        return;
      }
      void check({ code: text, key: newScanKey() });
    },
    [check, go, known],
  );

  // A result stays over the camera for a few seconds, then the scanner is ready for the next ticket.
  useEffect(() => {
    if (phase.kind !== 'result') return;
    const timer = setTimeout(() => go({ kind: 'ready' }), RESULT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase, go]);

  // A code typed while a check was on its way waits for it, and is checked the moment the scanner is ready. Several wait in the order typed, one at a time.
  useEffect(() => {
    if (phase.kind !== 'ready') return;
    const text = queued.current.shift();
    if (text === undefined) return;
    setWaiting(queued.current.length);
    start(text);
  }, [phase, start]);

  const onScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      const text = readingText(data);
      if (!text) return;
      const busy = inFlight.current || current.current.kind !== 'ready';
      if (gate.accept(text, Date.now(), busy)) start(text);
    },
    [gate, start],
  );

  const checkTyped = () => {
    if (!canSend(typed)) return;
    const text = typed;
    setTyping(false);
    setTyped('');
    if (inFlight.current) {
      // The one before it has not been answered. This one is kept and sent when that one is done.
      queued.current.push(text);
      setWaiting(queued.current.length);
      return;
    }
    start(text);
  };

  const scanning = camera.kind === 'ready' && focused && !typing && known;
  const sheetOpen = typing && known;
  /** A result or a problem is up: the canvas draws no button row then, and lifts the aim line to clear the panel. */
  const panelUp = phase.kind === 'result' || phase.kind === 'problem';

  return (
    <View testID="door-screen" style={[styles.page, { paddingTop: insets.top }]}>
      {focused ? <StatusBar style="light" /> : null}
      {camera.kind === 'ready' && focused && known ? (
        <>
          <CameraView
            testID="door-camera"
            facing="back"
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanning ? onScanned : undefined}
            onMountError={onMountError}
          />
          <View pointerEvents="none" testID="door-veil" style={[StyleSheet.absoluteFill, styles.veil]} />
        </>
      ) : null}

      <View style={styles.nav}>
        <IconButton icon="X" label="Close" tone="glass" onPress={onClose} testID="door-close" />
        <Text variant="body" tone="textOnAccent" numberOfLines={1} accessibilityRole="header" style={styles.navTitle}>
          {NAV_TITLE}
        </Text>
        <View style={styles.navSide} />
      </View>

      <View testID="door-middle" style={[styles.middle, { paddingBottom: panelUp ? AIM.liftWithPanel : AIM.lift }]}>
        <View style={styles.aim} />
        <Words camera={camera} phase={phase} waiting={waiting} />
      </View>

      {panelUp ? null : (
        <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, FOOT.bottom) }]}>
          <CameraActions camera={camera} />
          <Button label="Type the code instead" variant="glass" full onPress={() => setTyping(true)} disabled={!known} testID="door-type" />
        </View>
      )}

      {phase.kind === 'result' ? <ResultPanel view={phase.view} onDismiss={() => go({ kind: 'ready' })} bottomInset={insets.bottom} /> : null}
      {phase.kind === 'problem' ? (
        <ProblemPanel problem={phase.problem} onDismiss={() => go({ kind: 'ready' })} onLeave={onClose} bottomInset={insets.bottom} />
      ) : null}

      <BottomSheet visible={sheetOpen} onClose={() => setTyping(false)} label="Type the ticket code" testID="door-type-sheet">
        <KeyboardAvoidingView behavior="padding" style={styles.sheetBody}>
          <Text variant="sheetTitleSm">Type the ticket code</Text>
          <TextField
            label="Ticket code"
            value={typed}
            onChangeText={(value) => setTyped(formatTypedCode(value))}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={checkTyped}
            hint="It is printed under the QR on the ticket."
            testID="door-code-input"
          />
          <Button label="Check ticket" full disabled={!canSend(typed)} onPress={checkTyped} testID="door-code-check" />
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

/** The line in the middle of the page: E19's "Point at the ticket QR", or what stands in for the camera, or the check on its way. */
function Words({ camera, phase, waiting }: { camera: DoorCamera; phase: Phase; waiting: number }) {
  if (phase.kind === 'checking') return <AimWords testID="door-checking" busy title="Checking the ticket" line={waitingLine(waiting)} />;
  switch (camera.kind) {
    case 'starting':
      return <AimWords testID="door-camera-starting" busy title="Opening the camera" />;
    case 'askable':
      return <AimWords testID="door-camera-askable" title="Allow your camera" line="To scan tickets, let the app use your camera. You can also type the code." />;
    case 'blocked':
      return (
        <AimWords
          testID="door-camera-blocked"
          title="Allow your camera"
          line={camera.settings ? "Turn on the camera for this app in your phone's settings, then scan tickets. You can also type the code." : "Allow the camera for this site in your browser, then reload. You can also type the code."}
        />
      );
    case 'unavailable':
      return <AimWords testID="door-camera-unavailable" title="We can't open your camera" line="Your phone's camera did not start. You can type the code instead." />;
    case 'ready':
      return (
        <Text testID="door-aim-line" variant="body" tone="textOnAccent" style={styles.aimLine}>
          {AIM_LINE}
        </Text>
      );
  }
}

/** What the screen says under "Checking the ticket" when codes typed meanwhile are waiting. */
const waitingLine = (count: number): string | undefined => (count === 0 ? undefined : count === 1 ? 'Then the code you typed.' : `Then the ${count} codes you typed.`);

/** The one thing a person can do about a camera that is not on: ask again, or open the phone's settings. */
function CameraActions({ camera }: { camera: DoorCamera }) {
  if (camera.kind === 'askable') return <Button label="Allow camera" variant="white" full onPress={camera.allow} testID="door-camera-allow" />;
  if (camera.kind === 'blocked' && camera.settings) return <Button label="Open settings" variant="white" full onPress={camera.settings} testID="door-camera-settings" />;
  return null;
}

function gone(): ProblemView {
  return { icon: 'CircleAlert', title: "We can't find this event", line: 'It may have been removed, or the link is wrong.', retry: null, leave: true };
}

/**
 * Where a refused or failed check leaves the door. A check whose request was sent and whose answer did not come
 * back (a lost connection, a wait that ran out, a server error, an answer that could not be read) may have been
 * made, so it never says "not checked in": it says it could not confirm, and Try again sends the same scan with
 * the same key, which the Hub answers with its first verdict. Only a refusal the Hub makes before it does
 * anything (not allowed, no such event, too many scans, a code it will not take) says the ticket was not checked in.
 * Every sentence about the Hub that is shown is the Hub's own, and no validator sentence ever is.
 */
function problemOf(error: unknown, retry: () => void): ProblemView {
  if (isApiError(error)) {
    switch (error.kind) {
      case 'rate_limited':
        return { icon: 'CircleAlert', title: 'Too many scans at once', line: 'Wait a moment, then try again. The ticket was not checked in.', retry, leave: false };
      case 'forbidden':
        return { icon: 'Lock', title: "You can't check tickets in here", line: error.message, retry: null, leave: true };
      case 'not_found':
        return gone();
      case 'validation':
        return { icon: 'CircleAlert', title: "We couldn't check that ticket", line: 'This code could not be checked. The ticket was not checked in.', retry: null, leave: false };
      case 'network':
        return couldNotConfirm('WifiOff', retry);
    }
  }
  return couldNotConfirm('CircleAlert', retry);
}

const couldNotConfirm = (icon: ProblemView['icon'], retry: () => void): ProblemView => ({
  icon,
  title: "We couldn't confirm",
  line: "We didn't hear back, so we can't say if this ticket went in. Try again to find out.",
  retry,
  leave: false,
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: DOOR.page },
  veil: { backgroundColor: DOOR.page, opacity: veilOpacity },
  nav: { height: NAV.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  navSide: { width: NAV.button },
  navTitle: { ...font(700), flex: 1, textAlign: 'center', fontSize: NAV.title, letterSpacing: NAV.tracking * NAV.title },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: AIM.between },
  aim: { width: AIM.size, height: AIM.size },
  aimLine: { ...font(600), fontSize: AIM.line, lineHeight: canvasNormalLineHeight(AIM.line), textAlign: 'center' },
  foot: { paddingHorizontal: layout.gutter, gap: space.md },
  sheetBody: { gap: space.lg },
});
