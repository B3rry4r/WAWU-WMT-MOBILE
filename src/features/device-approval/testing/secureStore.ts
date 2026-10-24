/**
 * A stand-in for `expo-secure-store` for tests: one in-memory vault for every item (the session tokens, the payment intents, and the
 * phone's approval key), and the biometric prompt of the key's item as something a test can set. jest has no phone, so nothing here
 * proves the Keystore or the Keychain: that stays NOT RUN until a device build (FIX-108 task file).
 */
export const vault = new Map<string, string>();

/** What the phone's prompt does when the key is read: `ok` opens it, `cancel` the person closes it, `fail` it errors (a lockout), `dropped` the system has lost the key. */
export const phone = { prompt: 'ok' as 'ok' | 'cancel' | 'fail' | 'dropped', biometric: true, prompts: [] as string[], writes: [] as string[] };

export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 6;

export const secureStoreMock = {
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  canUseBiometricAuthentication: () => phone.biometric,
  getItemAsync: async (key: string, options?: { requireAuthentication?: boolean; authenticationPrompt?: string }) => {
    if (options?.requireAuthentication) {
      phone.prompts.push(options.authenticationPrompt ?? '');
      if (phone.prompt === 'cancel') throw new Error('Could not Authenticate the user: User canceled the authentication. Cancel');
      if (phone.prompt === 'fail') throw new Error('Could not Authenticate the user: Lockout. Too many attempts');
      if (phone.prompt === 'dropped') return null;
    }
    return vault.get(key) ?? null;
  },
  setItemAsync: async (key: string, value: string, options?: { requireAuthentication?: boolean }) => {
    if (options?.requireAuthentication) phone.writes.push(key);
    vault.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    vault.delete(key);
  },
};
