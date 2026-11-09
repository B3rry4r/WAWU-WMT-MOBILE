import { Platform } from 'react-native';

import { clearSignupDraft, readSignupDraft, saveSignupDraft, SIGNUP_DRAFT_KEY } from '../signupDraft';

/** WEBAPP-08 F5: what was typed on A3 survives a refresh in the tab; the password never does. */
describe('the sign-up draft', () => {
  const store = new Map<string, string>();
  let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
  beforeEach(() => {
    store.clear();
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    } as Storage;
  });
  afterEach(() => {
    os?.restore();
    delete (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage;
  });

  it('on the web: saves the details, never the password, and clears', () => {
    os = jest.replaceProperty(Platform, 'OS', 'web');
    saveSignupDraft({ firstName: 'Ada', lastName: 'Obi', username: 'ada', email: 'ada@example.com', phone: '+2348031234567', password: 'hunter2hunter2' } as never);
    expect(store.get(SIGNUP_DRAFT_KEY)).not.toContain('hunter2');
    expect(readSignupDraft()).toEqual({ firstName: 'Ada', lastName: 'Obi', username: 'ada', email: 'ada@example.com', phone: '+2348031234567' });
    clearSignupDraft();
    expect(readSignupDraft()).toBeUndefined();
  });

  it('on a phone: keeps nothing', () => {
    os = jest.replaceProperty(Platform, 'OS', 'ios');
    saveSignupDraft({ firstName: 'Ada', lastName: 'Obi', username: 'ada', email: 'ada@example.com', phone: '+2348031234567' });
    expect(store.size).toBe(0);
    expect(readSignupDraft()).toBeUndefined();
  });
});
