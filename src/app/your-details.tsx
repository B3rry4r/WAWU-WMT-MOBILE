import { IdentityScreen } from '@/features/auth/IdentityScreen';
import { askUsername } from '@/features/auth/identityApi';
import { saveIdentity } from '@/features/auth/identityStep';
import { finishIdentity, useSignupGate } from '@/features/auth/signupGate';

/**
 * The name and username step (SIGNUP-NAMES, R-82). The root layout opens it before the tabs while the account lacks a first
 * name, a last name or a username, and closes it the moment `finishIdentity` runs. It is not a place to go: with nothing
 * missing there is nothing to draw.
 */
export default function YourDetailsRoute() {
  const { identity } = useSignupGate();
  if (!identity) return null;
  return (
    <IdentityScreen
      need={identity}
      checkUsername={askUsername}
      onSave={async (values) => {
        await saveIdentity(identity, values);
        finishIdentity();
      }}
    />
  );
}
