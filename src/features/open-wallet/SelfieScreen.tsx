import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse } from 'react-native-svg';

import { isApiError } from '@/api/errors';
import { selfieProblem, fetchSelfieMatch } from '@/api/walletIdentity';
import { Button, IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, space } from '@/theme';
import { darkColors, lightColors } from '@/theme/tokens.generated';

import { fetchWalletState, OPEN_WALLET_KEY } from './api/account';
import { checksLeftOf, matchSelfie, openWallet, type OpeningInput } from './api/opening';
import { waitOf } from './api/check';
import { addressLine, openingName } from './details';
import { ticketFor, ticketIsLive, useKeptOpening, type KeepTicket } from './keptCheck';
import { OpenWalletEnd } from './OpenWalletEnd';
import { useSelfieCapture } from './selfie/capture';
import type { SelfieCapture } from './selfie/types';
import { useSessionAccount } from './sessionAccount';
import { waitPhrase } from './wait';

/**
 * design/_gen/auth.js line 44, `selfie`: the camera page is dark in both
 * themes (`#0B0A0D`, the dark page colour), the bar's title white; a 240 by 310
 * oval with a 4 px ring (white; green when matched; red when not, the light
 * theme's positive and danger, as the canvas draws them in both themes) and
 * the page dimmed to 70% outside it; 22 between the oval and the words, the
 * middle lifted 120 off the bottom; the title 18 / 700 white, the line 13.5 at
 * 70% white, 4 under it; the button row 20 in from the sides, 48 above the
 * bottom edge.
 */
const OVAL = { width: 240, height: 310, ring: 4 } as const;
const PAGE = { between: 22, lift: 120, title: 18, line: 13.5, lineOpacity: 0.7, lineGap: 4, footBottom: 48 } as const;
/**
 * kit.js line 15, `Btn` large: 54 high. The button row keeps that height on
 * every state (the spinner on A7 stands in it), so the oval sits where A16
 * draws it and does not jump between states. The 48 under it holds the
 * home indicator, so a taller system inset replaces it.
 */
const FOOT_ROW = 54;
const CAMERA = {
  page: darkColors.surfacePage,
  frame: darkColors.surfaceCard,
  ink: darkColors.textOnAccent,
  idle: darkColors.textOnAccent,
  matched: lightColors.positive,
  refused: lightColors.danger,
} as const;
/**
 * How often A7 asks again while the bank's answer is being confirmed. The
 * server settles an opening by itself (its sweep runs every 30 seconds,
 * contract CONVENTIONS section 9); asking more often only shows it sooner.
 * Default (agent), owner may override.
 */
const OPENING_POLL_MS = 5000;

const NAV_TITLE = 'Selfie';
const FIT_TITLE = 'Fit your face in the oval';
/** BRIEF A6: no "Then blink slowly". The match is with the BVN record's photo (contract CONVENTIONS section 8); nothing here is a liveness check. */
const FIT_LINE = 'It must match your BVN photo.';

type Note = { title: string; body: string };
type Ring = 'idle' | 'matched' | 'refused';

type Phase =
  /** A6: fit the face, take the selfie. `note` replaces the words when the last try did not run. */
  | { kind: 'ready'; note: Note | null }
  /** A6 while the match runs (charged; the button is busy). */
  | { kind: 'matching' }
  /** A16: the face did not match. Try again while the server says matches are left. */
  | { kind: 'not_matched'; title: string; line: string; checksLeft: number | null }
  /** A16 with no try left today. */
  | { kind: 'limit'; message: string }
  /** A7: matched, the account opening. */
  | { kind: 'opening' }
  /** A7 when the opening could not be asked for or did not go through: try it again. */
  | { kind: 'open_failed'; note: Note }
  /** The end of Open your wallet: the account is open, or the bank refused it. */
  | { kind: 'ended'; end: 'open' }
  /** `fixable`: the bank refused the details sent (`account_not_opened`), so A5 can correct them and ask again. */
  | { kind: 'ended'; end: 'refused'; message: string; fixable: boolean };

export type SelfieScreenProps = {
  /** Back to A5 (the X before anything was opened). */
  onBack: () => void;
  /** Leaves Open your wallet altogether (Done at an end, the X once the opening was sent). */
  onLeave: () => void;
  /** Back to A26 for a new BVN check, with the server's sentence for A26 to show. */
  onRestart: (notice?: string) => void;
  /** How this build takes the selfie; the platform's own unless a test hands one in. */
  capture?: SelfieCapture;
};

/**
 * A6 · Selfie, with A7 · Matched and A16 · Face doesn't match as its states
 * (KYC-03). The selfie is matched with the BVN record's photo (KYC-02); it is
 * a face match, not a liveness check, and nothing here says otherwise. The
 * capture is sent once and never kept: it lives in one local value between
 * the camera and the request. A match opens the account (MONEY-12) with A5's
 * name, date of birth and address, all held in memory since A26 and A5.
 */
export function SelfieScreen({ onBack, onLeave, onRestart, capture }: SelfieScreenProps) {
  const platformCapture = useSelfieCapture();
  const camera = capture ?? platformCapture;
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const kept = useKeptOpening(owner);
  const naming = kept ? openingName(kept.check.prefill) : null;
  const address = kept?.address ?? null;
  const handle = kept?.handle ?? null;
  const usable = Boolean(kept && naming && address && handle);
  const selfie = useQuery({
    queryKey: [OPEN_WALLET_KEY, 'selfie', owner ?? ''] as const,
    queryFn: fetchSelfieMatch,
    staleTime: 0,
    // Never answered from an earlier visit: back from A5 ("Check my details"), a stale "not matched" would offer a second, charged selfie.
    gcTime: 0,
    enabled: Boolean(owner) && usable,
  });

  // Nothing kept for this account (a reload, another account, a forget), or no address from A5: start again at A26.
  const lost = owner !== undefined && !usable;
  useEffect(() => {
    if (lost) onRestart();
  }, [lost, onRestart]);

  if (selfie.isError && selfie.data === undefined) {
    return (
      <CameraPage
        onClose={onBack}
        ring="idle"
        testID="open-wallet-selfie-error"
        words={<Words title="We couldn't open this step" line={isApiError(selfie.error) ? selfie.error.message : 'Something went wrong. Try again.'} live />}
        foot={<Button label="Try again" variant="white" full onPress={() => void selfie.refetch()} testID="open-wallet-selfie-retry-load" />}
      />
    );
  }
  if (!owner || !kept || !naming || !address || !handle || !selfie.data) {
    return (
      <CameraPage
        onClose={onBack}
        ring="idle"
        testID="open-wallet-selfie-loading"
        words={<Words title="" line="" />}
        foot={<ActivityIndicator color={CAMERA.ink} accessibilityLabel="Loading" />}
      />
    );
  }

  return (
    <Selfie
      owner={owner}
      camera={camera}
      alreadyMatched={selfie.data.matchedAt !== null}
      opening={{ ...naming, address: addressLine(address), checkHandle: handle }}
      onBack={onBack}
      onLeave={onLeave}
      onRestart={onRestart}
    />
  );
}

type SelfieProps = {
  owner: string;
  camera: SelfieCapture;
  /** A selfie already matched the current check (the person came back): go straight to the opening. */
  alreadyMatched: boolean;
  /** What the opening sends; `checkHandle` also goes to the selfie match, in place of the BVN. */
  opening: OpeningInput;
  onBack: () => void;
  onLeave: () => void;
  onRestart: (notice?: string) => void;
};

function Selfie({ owner, camera, alreadyMatched, opening, onBack, onLeave, onRestart }: SelfieProps) {
  const [phase, setPhase] = useState<Phase>(alreadyMatched ? { kind: 'opening' } : { kind: 'ready', note: null });
  /** Set before the first await, so a second tap in the same frame sends nothing (each match is charged). */
  const inFlight = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  /** An answer whose session ended, or whose check was forgotten, or that lands after this screen closed, moves nothing. */
  const current = (ticket: KeepTicket) => live.current && ticketIsLive(ticket);

  /** When the last opening answered (null while one is being asked for): a wallet read from before it says nothing about it. */
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const open = async () => {
    const ticket = ticketFor(owner);
    setOpenedAt(null);
    setPhase({ kind: 'opening' });
    try {
      const state = await openWallet(opening);
      if (!current(ticket)) return;
      setOpenedAt(Date.now());
      if (state === 'open' || state === 'frozen') setPhase({ kind: 'ended', end: 'open' });
      else if (state === 'not_open') setPhase({ kind: 'open_failed', note: { title: "We couldn't open your account", body: 'Try again.' } });
    } catch (error) {
      if (!current(ticket)) return;
      const next = afterOpenRefusal(error);
      if ('restart' in next) onRestart(next.restart);
      else setPhase(next);
    }
  };

  // A selfie that already matched goes straight on to the opening, once.
  const started = useRef(false);
  useEffect(() => {
    if (alreadyMatched && !started.current) {
      started.current = true;
      void open();
    }
  });

  // While the bank's answer is being confirmed, A7 asks where the account stands.
  const waiting = useQuery({
    queryKey: [OPEN_WALLET_KEY, 'opening', owner] as const,
    queryFn: fetchWalletState,
    enabled: phase.kind === 'opening',
    // Asks again until the account is open; the screen then ends and the read goes with it.
    refetchInterval: (query) => (query.state.data === 'open' || query.state.data === 'frozen' ? false : OPENING_POLL_MS),
    staleTime: 0,
  });
  // What A7 shows once a read after the opening's answer says where the account stands.
  let shown: Phase = phase;
  if (phase.kind === 'opening' && waiting.data && openedAt !== null && waiting.dataUpdatedAt >= openedAt) {
    if (waiting.data === 'open' || waiting.data === 'frozen') shown = { kind: 'ended', end: 'open' };
    // The server gave the opening up (no account found and the time to resend passed): it can be asked for again.
    else if (waiting.data === 'not_open') shown = { kind: 'open_failed', note: { title: "We couldn't open your account", body: 'Try again.' } };
  }

  const takeSelfie = async () => {
    if (inFlight.current || camera.kind !== 'ready') return;
    inFlight.current = true;
    try {
      const taken = await camera.take();
      if (!live.current) return;
      if (taken.kind === 'cancelled') return;
      if (taken.kind === 'unusable') {
        setPhase({ kind: 'ready', note: { title: 'That photo could not be used', body: 'Take it again.' } });
        return;
      }
      const ticket = ticketFor(owner);
      setPhase({ kind: 'matching' });
      try {
        await matchSelfie(taken.image, opening.checkHandle);
        if (!current(ticket)) return;
        void open();
      } catch (error) {
        if (!current(ticket)) return;
        const next = afterSelfieRefusal(error);
        if (next === 'open') void open();
        else if ('restart' in next) onRestart(next.restart);
        else setPhase(next);
      }
    } finally {
      inFlight.current = false;
    }
  };

  if (shown.kind === 'ended') {
    if (shown.end === 'open') {
      return (
        <OpenWalletEnd
          testID="open-wallet-opened"
          tone="in"
          icon="Wallet"
          title="Your wallet is open"
          message="You can pay from it now."
          actionLabel="Done"
          onAction={onLeave}
        />
      );
    }
    return (
      <OpenWalletEnd
        testID="open-wallet-not-opened"
        tone="danger"
        icon="CircleAlert"
        title="We couldn't open your account"
        message={shown.message}
        actionLabel={shown.fixable ? 'Check my details' : 'Done'}
        // Back to A5 with the check, its handle and the matched selfie kept: asking again needs no new selfie.
        onAction={shown.fixable ? onBack : onLeave}
        secondaryLabel={shown.fixable ? 'Done' : undefined}
        onSecondary={shown.fixable ? onLeave : undefined}
      />
    );
  }

  const sent = shown.kind === 'opening' || shown.kind === 'open_failed';
  const close = sent ? onLeave : onBack;

  if (camera.kind === 'unavailable' && (shown.kind === 'ready' || shown.kind === 'matching')) {
    return (
      <CameraPage
        onClose={close}
        ring="idle"
        testID="open-wallet-selfie-no-camera"
        words={<Words title="We can't open your camera" line="Taking a selfie isn't available in this version of the app." live />}
        foot={<Button label="Go back" variant="white" full onPress={onBack} testID="open-wallet-selfie-back" />}
      />
    );
  }

  switch (shown.kind) {
    case 'ready':
    case 'matching':
      return (
        <CameraPage
          onClose={close}
          ring="idle"
          testID="open-wallet-selfie"
          Preview={camera.kind === 'ready' ? camera.Preview : undefined}
          words={shown.kind === 'ready' && shown.note ? <Words title={shown.note.title} line={shown.note.body} live /> : <Words title={FIT_TITLE} line={FIT_LINE} />}
          foot={
            <Button label="Take selfie" icon="Camera" variant="white" full loading={shown.kind === 'matching'} onPress={() => void takeSelfie()} testID="open-wallet-selfie-take" />
          }
        />
      );
    case 'not_matched':
      return (
        <CameraPage
          onClose={close}
          ring="refused"
          testID="open-wallet-selfie-not-matched"
          words={<Words title={shown.title} line={shown.line} live />}
          foot={
            shown.checksLeft === 0 ? (
              <Button label="Done" variant="white" full onPress={onLeave} testID="open-wallet-selfie-done" />
            ) : (
              <Button label="Try again" variant="white" full onPress={() => setPhase({ kind: 'ready', note: null })} testID="open-wallet-selfie-try-again" />
            )
          }
        />
      );
    case 'limit':
      return (
        <CameraPage
          onClose={close}
          ring="refused"
          testID="open-wallet-selfie-limit"
          words={<Words title="You've used today's selfie checks" line={shown.message} live />}
          foot={<Button label="Done" variant="white" full onPress={onLeave} testID="open-wallet-selfie-done" />}
        />
      );
    case 'opening':
      return (
        <CameraPage
          onClose={close}
          ring="matched"
          testID="open-wallet-matched"
          words={<Words title="Matched to your BVN" line="Opening your account" live />}
          foot={<ActivityIndicator color={CAMERA.ink} accessibilityLabel="Opening your account" testID="open-wallet-opening-spinner" />}
        />
      );
    case 'open_failed':
      return (
        <CameraPage
          onClose={close}
          ring="matched"
          testID="open-wallet-open-failed"
          words={<Words title={shown.note.title} line={shown.note.body} live />}
          foot={<Button label="Try again" variant="white" full onPress={() => void open()} testID="open-wallet-open-retry" />}
        />
      );
  }
}

/** Back to A26 for a new check, carrying the server's sentence for A26's banner. */
type Restart = { restart: string };

/** A16's title when the server's sentence does not lead with one. */
const NOT_MATCHED_TITLE = "We couldn't match your face";

/**
 * A16 draws the server's refusal as a title and a line: "We couldn't match
 * your face" over "It must match your BVN photo. Good light, no glasses or
 * cap". The server answers both as one sentence run (KYC-02's
 * `SELFIE_NOT_MATCHED_MESSAGE`), so its first sentence is the title and the
 * rest the line. A one-sentence answer goes under the screen's own title.
 */
export function headed(message: string, fallbackTitle: string): { title: string; line: string } {
  const match = /^(.+?)\.\s+(\S[\s\S]*)$/.exec(message.trim());
  return match ? { title: match[1], line: match[2] } : { title: fallbackTitle, line: message };
}

/** Where a refused selfie match leaves A6 (contract CONVENTIONS section 8; every sentence is the server's). */
function afterSelfieRefusal(error: unknown): Phase | Restart | 'open' {
  const message = isApiError(error) ? error.message : 'Something went wrong. Try again.';
  switch (selfieProblem(error)) {
    case 'not_matched':
      return { kind: 'not_matched', ...headed(message, NOT_MATCHED_TITLE), checksLeft: checksLeftOf(error) };
    case 'limit': {
      const wait = waitOf(error);
      return { kind: 'limit', message: wait === null ? message : `Try again ${waitPhrase(wait)}.` };
    }
    case 'already_matched':
      return 'open';
    case 'not_checked':
      return { restart: message };
    case 'wallet_open':
      return { kind: 'ended', end: 'open' };
    case 'unreachable':
      return { kind: 'ready', note: { title: "We couldn't check your selfie", body: message } };
    default:
      break;
  }
  if (isApiError(error) && error.kind === 'network') return { kind: 'ready', note: { title: 'No connection', body: message } };
  if (isApiError(error) && error.kind === 'rate_limited') return { kind: 'ready', note: { title: 'Too many tries', body: `Try again ${waitPhrase(waitOf(error))}.` } };
  return { kind: 'ready', note: { title: "We couldn't check your selfie", body: message } };
}

/** Where a refused opening leaves A7 (contract CONVENTIONS section 9). Asking again is always safe: one account per person. */
function afterOpenRefusal(error: unknown): Phase | Restart {
  const message = isApiError(error) ? error.message : 'Something went wrong. Try again.';
  const code = isApiError(error) ? error.code : undefined;
  if (code === 'bvn_not_checked') return { restart: message };
  if (code === 'selfie_required') return { kind: 'ready', note: { title: 'Take your selfie again', body: message } };
  if (code === 'wallet_already_open') return { kind: 'ended', end: 'open' };
  if (code === 'account_not_opened') return { kind: 'ended', end: 'refused', message, fixable: true };
  if (code === 'identity_has_wallet' || code === 'phone_held_by_other_identity') return { kind: 'ended', end: 'refused', message, fixable: false };
  if (isApiError(error) && error.kind === 'network') return { kind: 'open_failed', note: { title: 'No connection', body: message } };
  return { kind: 'open_failed', note: { title: "We couldn't open your account", body: message } };
}

/** The dark camera page: the bar with X and "Selfie", the oval, the words under it, the button row. */
function CameraPage({ onClose, ring, words, foot, Preview, testID }: { onClose: () => void; ring: Ring; words: ReactNode; foot?: ReactNode; Preview?: SelfieCaptureReady['Preview']; testID?: string }) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  return (
    <View testID={testID} style={[styles.page, { paddingTop: insets.top }]}>
      {focused ? <StatusBar style="light" /> : null}
      <View style={styles.nav}>
        <IconButton icon="X" label="Close" tone="glass" onPress={onClose} testID="open-wallet-selfie-close" />
        <Text variant="body" tone="textOnAccent" numberOfLines={1} accessibilityRole="header" style={styles.navTitle}>
          {NAV_TITLE}
        </Text>
        <View style={styles.navSide} />
      </View>
      <View style={styles.middle}>
        <Oval ring={ring} Preview={Preview} />
        {words}
      </View>
      <View style={[styles.foot, { marginBottom: Math.max(insets.bottom, PAGE.footBottom) }]}>{foot}</View>
    </View>
  );
}

type SelfieCaptureReady = Extract<SelfieCapture, { kind: 'ready' }>;

/** The oval the face goes in: the live camera inside it where the platform has one, the ring's colour saying how the match went. */
function Oval({ ring, Preview }: { ring: Ring; Preview?: SelfieCaptureReady['Preview'] }) {
  const color = ring === 'matched' ? CAMERA.matched : ring === 'refused' ? CAMERA.refused : CAMERA.idle;
  const outer = { width: OVAL.width + 2 * OVAL.ring, height: OVAL.height + 2 * OVAL.ring };
  return (
    <View testID={`open-wallet-oval-${ring}`} style={outer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Preview ? (
        <View style={[styles.preview, { width: OVAL.width, height: OVAL.height }]}>
          <Preview />
        </View>
      ) : null}
      <Svg width={outer.width} height={outer.height} style={StyleSheet.absoluteFill}>
        <Ellipse
          cx={outer.width / 2}
          cy={outer.height / 2}
          rx={OVAL.width / 2 + OVAL.ring / 2}
          ry={OVAL.height / 2 + OVAL.ring / 2}
          fill={Preview ? 'transparent' : CAMERA.frame}
          stroke={color}
          strokeWidth={OVAL.ring}
        />
      </Svg>
    </View>
  );
}

function Words({ title, line, live }: { title: string; line: string; live?: boolean }) {
  return (
    <View style={styles.words} accessibilityLiveRegion={live ? 'polite' : 'none'}>
      <Text variant="body" tone="textOnAccent" style={styles.wordsTitle} testID="open-wallet-selfie-title">
        {title}
      </Text>
      <Text variant="body" tone="textOnAccent" style={styles.wordsLine} testID="open-wallet-selfie-line">
        {line}
      </Text>
    </View>
  );
}

/** kit.js line 34, `nav`: 56 high, a 42 round button, the title 17 / 700 at -0.02em, 12 between the parts. */
const NAV = { height: 56, button: 42, title: 17, tracking: -0.02 } as const;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: CAMERA.page },
  nav: { height: NAV.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  navSide: { width: NAV.button },
  navTitle: { ...font(700), flex: 1, textAlign: 'center', fontSize: NAV.title, letterSpacing: NAV.tracking * NAV.title },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: PAGE.between, paddingBottom: PAGE.lift },
  preview: { position: 'absolute', left: OVAL.ring, top: OVAL.ring, overflow: 'hidden' },
  /** A16's two sentences fit one line at 390 px, as drawn: the words run nearly edge to edge. */
  words: { alignItems: 'center', paddingHorizontal: space.sm },
  wordsTitle: { ...font(700), fontSize: PAGE.title, lineHeight: canvasNormalLineHeight(PAGE.title), textAlign: 'center' },
  wordsLine: { fontSize: PAGE.line, lineHeight: canvasNormalLineHeight(PAGE.line), opacity: PAGE.lineOpacity, marginTop: PAGE.lineGap, textAlign: 'center' },
  foot: { minHeight: FOOT_ROW, justifyContent: 'center', paddingHorizontal: layout.gutter },
});
