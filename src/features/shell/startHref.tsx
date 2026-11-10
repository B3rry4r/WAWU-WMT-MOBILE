import { createContext, useContext } from 'react';

/** What the root layout knows about a signed-in person's way in. */
export type StartState = {
  needsEmail: boolean;
  needsIdentity: boolean;
  /** "Have an access code?" is on screen. */
  claimOffer: boolean;
  /** "Choose your tier" is on screen. */
  tierOffer: boolean;
  /** "Your bonus is waiting" is on screen. */
  bonus: boolean;
  setupStep: 'creator_setup' | 'interests' | 'follows' | null;
};

/**
 * The route a signed-in person is led on to when the page they opened is not one they can see (WEBAPP-09 W1, R-127): the step of the sign-up they
 * have not finished, in the order the root layout opens them, or Home when there is none. Home (`/`) sits behind the sign-up steps, so a redirect
 * to it from an invite link, a bills link or a wrong address left a person mid-sign-up on a blank page.
 */
export function startHref(s: StartState): string {
  if (s.needsEmail) return '/email-code';
  if (s.needsIdentity) return '/your-details';
  if (s.claimOffer) return '/claim-offer';
  if (s.tierOffer) return '/tier-offer';
  if (s.setupStep === null && s.bonus) return '/verify-bonus';
  if (s.setupStep === 'interests') return '/interests';
  if (s.setupStep === 'follows') return '/people-to-follow';
  if (s.setupStep === 'creator_setup') return '/creator-setup';
  return '/';
}

const StartHrefContext = createContext<string>('/');
export const StartHrefProvider = StartHrefContext.Provider;

/** Where "the app opens" for this person now. `/` outside the root layout. */
export function useStartHref(): string {
  return useContext(StartHrefContext);
}
