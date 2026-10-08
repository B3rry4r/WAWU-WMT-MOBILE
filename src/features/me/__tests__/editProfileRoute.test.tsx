/* eslint-disable @typescript-eslint/no-require-imports */
import { act, render } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockRouter = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn(), push: jest.fn() };
let mockParams: { from?: string } = { from: 'me' };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, Redirect: () => null }));
jest.mock('@/api/session', () => ({ ...jest.requireActual('@/api/session'), useSession: () => ({ status: 'signedIn' }) }));

type Props = { onBack: () => void; onOpenSocial: () => void; onSaved: () => void; ownNotice?: boolean };
let mockShown: Props | null = null;
jest.mock('@/features/profile-edit/EditProfileScreen', () => ({
  EditProfileScreen: (props: Props) => {
    mockShown = props;
    return null;
  },
}));

type Opener = Record<string, (...args: unknown[]) => void>;
let mockOpener: Opener | null = null;
jest.mock('@/features/me/MeScreen', () => ({
  MeScreen: (props: Opener) => {
    mockOpener = props;
    return null;
  },
}));
jest.mock('@/features/settings/SettingsScreen', () => ({
  SettingsScreen: (props: Opener) => {
    mockOpener = props;
    return null;
  },
}));

const EditProfileRoute = (require('@/app/edit-profile') as typeof import('@/app/edit-profile')).default;
const MeTab = (require('@/app/(tabs)/me') as typeof import('@/app/(tabs)/me')).default;
const SettingsRoute = (require('@/app/settings/index') as typeof import('@/app/settings/index')).default;
const notice = require('../savedNotice') as typeof import('../savedNotice');

beforeEach(() => {
  mockParams = { from: 'me' };
  mockRouter.canGoBack.mockReturnValue(true);
  mockRouter.back.mockClear();
  mockRouter.push.mockClear();
  mockShown = null;
});

describe("M8's route (M10)", () => {
  it('a finished save on M8 opened from the Me tab goes back and leaves "Profile saved" for the Me tab, and M8 draws none', async () => {
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
    expect(mockShown!.ownNotice).toBe(false);
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

  it('opened from anywhere else (Settings), M8 shows its own notice and the save leaves none for the Me tab', async () => {
    notice.clearProfileSaved();
    mockParams = {};
    let up = false;
    function Probe() {
      up = notice.useProfileSaved();
      return null;
    }
    await render(
      <>
        <EditProfileRoute />
        <Probe />
      </>,
    );
    expect(mockShown!.ownNotice).toBe(true);
    await act(async () => mockShown!.onSaved());
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(up).toBe(false);
  });

  it('opened as from the Me tab but with nothing to go back to, M8 shows its own notice instead', async () => {
    notice.clearProfileSaved();
    mockRouter.canGoBack.mockReturnValue(false);
    await render(<EditProfileRoute />);
    expect(mockShown!.ownNotice).toBe(true);
    await act(async () => mockShown!.onSaved());
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    let up = true;
    function Probe() {
      up = notice.useProfileSaved();
      return null;
    }
    await render(<Probe />);
    expect(up).toBe(false);
  });
});

describe('who opens M8', () => {
  it("the Me tab's Edit profile marks it as from the Me tab", async () => {
    await render(<MeTab />);
    mockOpener!.onEditProfile();
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/edit-profile', params: { from: 'me' } });
  });

  it("Settings' header opens it unmarked", async () => {
    await render(<SettingsRoute />);
    mockOpener!.onOpenProfile();
    expect(mockRouter.push).toHaveBeenCalledWith('/edit-profile');
  });
});
