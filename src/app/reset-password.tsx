import { useLocalSearchParams, useRouter } from 'expo-router';

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
export default function ResetPasswordRoute() {
  const router = useRouter();
  const { status } = useSession();
  const signedIn = status === 'signedIn';
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();
  const link = readResetLink(params);

  return (
    <ResetPasswordScreen
      email={link?.email ?? ''}
      linkUsable={link !== null}
      onSave={(password) => (link ? resetPasswordRequest(link.token, link.email, password) : Promise.reject(new Error('no link')))}
      // Opened cold from a link there is no screen behind: back goes to the welcome screen (Home when signed in).
      onBack={() => (router.canGoBack() ? router.back() : router.replace(signedIn ? '/' : '/welcome'))}
      onSignIn={() => {
        void (async () => {
          if (signedIn) await signOut();
          router.replace({ pathname: '/sign-in', params: link ? { email: link.email } : {} });
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
