/* eslint-disable @typescript-eslint/no-require-imports */
import { act, render } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, Redirect: () => null }));
jest.mock('@/api/session', () => ({ ...jest.requireActual('@/api/session'), useSession: () => ({ status: 'signedIn' }) }));

type Props = { onBack: () => void; onOpenSocial: () => void; onSaved: () => void };
let mockShown: Props | null = null;
jest.mock('@/features/profile-edit/EditProfileScreen', () => ({
  EditProfileScreen: (props: Props) => {
    mockShown = props;
    return null;
  },
}));

const EditProfileRoute = (require('@/app/edit-profile') as typeof import('@/app/edit-profile')).default;
const notice = require('../savedNotice') as typeof import('../savedNotice');

describe("M8's route (M10)", () => {
  it('a finished save on M8 goes back and leaves "Profile saved" for the Me tab', async () => {
    notice.clearProfileSaved();
    const seen: boolean[] = [];
    function Probe() {
      seen.push(notice.useProfileSaved());
      return null;
    }
    await render(
      <>
        <EditProfileRoute />
        <Probe />
      </>,
    );
    expect(mockShown).not.toBeNull();
    expect(seen[seen.length - 1]).toBe(false);
    await act(async () => mockShown!.onSaved());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(seen[seen.length - 1]).toBe(true);
    notice.clearProfileSaved();
  });

  it('Back leaves no notice', async () => {
    notice.clearProfileSaved();
    mockRouter.back.mockClear();
    await render(<EditProfileRoute />);
    await act(async () => mockShown!.onBack());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    let up = true;
    function Probe() {
      up = notice.useProfileSaved();
      return null;
    }
    await render(<Probe />);
    expect(up).toBe(false);
  });
});
