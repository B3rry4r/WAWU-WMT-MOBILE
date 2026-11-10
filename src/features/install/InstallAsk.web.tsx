import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { detectInstallContext, type InstallContext } from './detect';
import { InstallView } from './InstallView';

/** The browser's own install offer, held until the button is pressed. Typed here: the DOM lib has no `BeforeInstallPromptEvent`. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const KEY = 'wmt.install.continued';

let deferred: InstallPromptEvent | null = null;
let installedNow = false;
let continued = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

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

// The browser fires this once, soon after the page loads and often before React draws, so it is caught when the code loads.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** True while the install screen stands in front of the app: in a browser tab, not from the icon, and not yet continued past it in this tab. */
export function useInstallAsk(): boolean {
  const [context] = useState(readContext);
  const gone = useSyncExternalStore(subscribe, () => continued || remembered(), () => true);
  return context.kind !== 'standalone' && !gone;
}

/** Test seam: forget what this tab did. */
export function resetInstallAsk(): void {
  deferred = null;
  installedNow = false;
  continued = false;
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

/**
 * The install screen with its behaviour. The address the person opened is never touched: the app's routes are simply not drawn until
 * "Continue in the browser", so the same address opens after it (an invite, a piece, a payment return).
 */
export function InstallAskScreen() {
  const [context] = useState(readContext);
  const prompt = useSyncExternalStore(subscribe, () => deferred, () => null);
  const installed = useSyncExternalStore(subscribe, () => installedNow, () => false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  const onInstall = useCallback(() => {
    const e = deferred;
    if (!e) return;
    // A browser's offer can be used once: it stays until the person has answered it, then the menu steps take over.
    void e
      .prompt()
      .then(() => e.userChoice)
      .then((choice) => {
        deferred = null;
        if (choice.outcome === 'accepted') installedNow = true;
        emit();
      })
      .catch(() => undefined);
  }, []);

  const onCopy = useCallback(() => {
    void copyText(window.location.href).then((ok) => setCopied(ok));
  }, []);

  const onContinue = useCallback(() => {
    continued = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      // Storage refused: this page load still continues.
    }
    emit();
  }, []);

  return (
    <InstallView
      context={context}
      canPrompt={prompt !== null}
      installed={installed}
      copied={copied}
      onInstall={onInstall}
      onCopy={onCopy}
      onContinue={onContinue}
    />
  );
}
