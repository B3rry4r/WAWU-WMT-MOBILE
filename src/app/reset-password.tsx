import { useLocalSearchParams, useNavigation, useRoute, useRouter } from 'expo-router';
import { useRef } from 'react';

import { resetPasswordRequest } from '@/api/identity';
import { signOut, useSession } from '@/api/session';
import { readResetLink } from '@/features/auth/resetPassword';
import { ResetPasswordScreen } from '@/features/auth/ResetPasswordScreen';

/**
 * `https://wawuafrica.com/reset-password?token=...&email=...` opened in the installed app (RESET-APP, R-123): the link WAWU ID mails
 * for "Forgot password". It is open to everyone on purpose (the root layout lists it outside every guard): the token in the link is
 * the proof, not a session, so it works signed out and signed in. A phone without the app opens the website's page instead.
 *
 * Saved, "Sign in" opens sign-in with the email filled in. WAWU ID has ended every session of that account, so a phone that is signed
 * in is signed out first (sign-in is a signed-out screen). A link that cannot be used goes back to Forgot password with the email
 * filled in; for someone already signed in, who cannot reach that screen, it just closes.
 */
/** The slice of the screen's navigation object this file uses: React Navigation's `dispatch` taking a function of the stack's state. */
type StackRoute = { key: string; path?: string; params?: object };
type StackNavigation = {
  dispatch: (action: (state: { routes: StackRoute[] }) => { type: 'RESET'; payload: { routes: StackRoute[] } }) => void;
};

/**
 * The route without the token: its params lose `token`, and so does `path`, the address the router keeps of how the screen was
 * opened (`router.setParams` leaves it, and it holds the whole link, token included). A reset that keeps this screen's own key keeps
 * the screen too, so "Password changed" stays up and the form's state is untouched.
 */
function dropTokenFromRoute(navigation: StackNavigation, routeKey: string) {
  navigation.dispatch((state) => ({
    type: 'RESET',
    payload: {
      ...state,
      routes: state.routes.map((route) => {
        if (route.key !== routeKey) return route;
        const { token: _spent, ...params } = (route.params ?? {}) as Record<string, unknown>;
        return { ...route, path: undefined, params };
      }),
    },
  }));
}

export default function ResetPasswordRoute() {
  const router = useRouter();
  const navigation = useNavigation<StackNavigation>();
  const routeKey = useRoute().key;
  const { status } = useSession();
  const signedIn = status === 'signedIn';
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();
  const link = readResetLink(params);
  /** The address the link was for, kept once the token is dropped from the route, so Sign in can still fill it in. */
  const savedFor = useRef('');

  return (
    <ResetPasswordScreen
      email={link?.email ?? ''}
      linkUsable={link !== null}
      onSave={(password) => (link ? resetPasswordRequest(link.token, link.email, password) : Promise.reject(new Error('no link')))}
      // Opened cold from a link there is no screen behind: back goes to the welcome screen (Home when signed in).
      onBack={() => (router.canGoBack() ? router.back() : router.replace(signedIn ? '/' : '/welcome'))}
      // The token is spent the moment the password is saved: drop it from the route at once, not when the person leaves the screen
      // (nothing holds it while "Password changed" shows, and it never travels on to Sign in).
      onSaved={() => {
        if (link) savedFor.current = link.email;
        dropTokenFromRoute(navigation, routeKey);
      }}
      onSignIn={() => {
        void (async () => {
          if (signedIn) await signOut();
          const email = link?.email ?? savedFor.current;
          router.replace({ pathname: '/sign-in', params: email ? { email } : {} });
        })();
      }}
      onAskForNewLink={() => {
        if (signedIn) router.replace('/');
        else router.replace({ pathname: '/forgot-password', params: link ? { email: link.email } : {} });
      }}
      askLabel={signedIn ? 'Close' : 'Back to Forgot password'}
    />
  );
}
