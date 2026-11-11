import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useWawu } from '@/theme';

import { detectInstallContext, isIpad, type InstallContext } from './detect';
import { InstallView } from './InstallView';

/** The browser's own install offer, held until the button is pressed. Typed here: the DOM lib has no `BeforeInstallPromptEvent`. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

/** Set for the tab once the screen has been answered (Install accepted, dismissed or cancelled, or Continue), or was not wanted this visit. */
const KEY = 'wmt.install.continued';

/**
 * R-131, lead decision 10 Nov (round 2): the app is never hidden and never blank. The install screen is drawn OVER it. On Chrome, Edge and
 * Samsung the browser's offer must arrive within this long after the page loaded, and before the person has touched the page; a later offer is
 * ignored, and nothing waits on a timer to hide anything.
 */
export const OFFER_WINDOW_MS = 3000;

let deferred: InstallPromptEvent | null = null;
let continued = false;
let cached: InstallContext | null = null;
/** The person has touched the page (a press, a key, the wheel or a drag). */
let touched = false;
/** The address the browser opened on, read once when the code loads: the app may move the address under the screen, the copy button copies this. */
const landing: string | null = typeof window !== 'undefined' ? (window.location?.href ?? null) : null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const sinceLoad = () => (typeof performance !== 'undefined' ? performance.now() : 0);

function remembered(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return continued;
  }
}

/** Read now, from the page itself: the standalone flags and the user agent. */
export function readContext(): InstallContext {
  if (typeof window === 'undefined') return { kind: 'standalone' };
  let displayModeStandalone = false;
  try {
    displayModeStandalone = ['standalone', 'fullscreen', 'minimal-ui'].some((m) => window.matchMedia?.(`(display-mode: ${m})`).matches);
  } catch {
    displayModeStandalone = false;
  }
  return detectInstallContext({
    userAgent: navigator.userAgent,
    displayModeStandalone,
    navigatorStandalone: (navigator as Navigator & { standalone?: boolean }).standalone === true,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

const context = (): InstallContext => (cached ??= readContext());

/** Latches "no screen this visit": it never comes back in this tab. */
function latch(): void {
  continued = true;
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // Storage refused: this page load still stays latched.
  }
  emit();
}

/**
 * Is the screen over the app right now? Not from the icon, not in a browser that cannot install, not once answered. Where the browser says it
 * can install by an offer (a computer's Chrome or Edge) only while an offer is held; on an iPhone, an iPad, a Mac's Safari, in another app's
 * browser and on an Android phone (menu steps when there is no offer) from the first paint.
 */
function visibleNow(): boolean {
  const c = context();
  if (c.kind === 'standalone' || c.kind === 'cannot') return false;
  if (continued || remembered()) return false;
  if (c.kind === 'chromium' && c.os === 'desktop') return deferred !== null;
  return true;
}

// The browser fires the offer once, soon after load and often before React draws, so it is caught when the code loads.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    // Late (after the window) or after the person has touched the page: ignored, so it never replaces the app they are using.
    if (touched || sinceLoad() > OFFER_WINDOW_MS || continued || remembered()) return;
    deferred = e as InstallPromptEvent;
    emit();
  });
  const touch = () => {
    if (touched) return;
    touched = true;
    // A touch before the screen is up means no screen this visit.
    if (!visibleNow()) latch();
  };
  // Only what a person does (not a scroll event, which the app itself can cause).
  for (const name of ['pointerdown', 'touchstart', 'touchmove', 'keydown', 'wheel']) window.addEventListener(name, touch, { capture: true, passive: true });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    latch();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** True while the install screen is drawn over the app. */
export function useInstallAsk(): boolean {
  return useSyncExternalStore(subscribe, visibleNow, () => false);
}

/** Test seam: forget what this tab did. */
export function resetInstallAsk(): void {
  deferred = null;
  continued = false;
  cached = null;
  touched = false;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Storage refused: nothing was kept.
  }
  emit();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

// A fixed layer over the whole window (the app's own column sits beneath it, drawn and running).
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 } as unknown as ViewStyle;

/**
 * The install screen, drawn over the app, with its behaviour. It draws nothing when it is not wanted. However it ends (Install accepted,
 * dismissed or cancelled, Continue) it latches for the tab and the app is what is left.
 */
export function InstallAskScreen() {
  const show = useInstallAsk();
  const { colors } = useWawu();
  const c = context();
  const prompt = useSyncExternalStore(subscribe, () => deferred, () => null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  const onInstall = useCallback(() => {
    const e = deferred;
    if (!e) return;
    // A browser's offer is used once; whatever the answer, and however late, the screen ends and the app is what is left.
    void e
      .prompt()
      .then(() => e.userChoice)
      .catch(() => undefined)
      .then(() => {
        deferred = null;
        latch();
      });
  }, []);

  const onCopy = useCallback(() => {
    void copyText(landing ?? window.location.href).then((ok) => setCopied(ok));
  }, []);

  if (!show) return null;
  return (
    <View testID="install-overlay" role="dialog" aria-modal style={[overlay, { backgroundColor: colors.surfacePage }]}>
      <InstallView
        context={c}
        ipad={isIpad(navigator.userAgent, navigator.maxTouchPoints)}
        canPrompt={prompt !== null}
        copied={copied}
        onInstall={onInstall}
        onCopy={onCopy}
        onContinue={latch}
      />
    </View>
  );
}
