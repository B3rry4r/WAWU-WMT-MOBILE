/**
 * WEBAPP-11 (R-131): the phone's half of the install screen. There is none: a phone app is already installed, so this draws nothing and
 * the root layout carries on. The web's own half is `InstallAsk.web.tsx` (the platform pair test keeps the two the same extension).
 */
export function useInstallAsk(): boolean {
  return false;
}

export function InstallAskScreen(): null {
  return null;
}
