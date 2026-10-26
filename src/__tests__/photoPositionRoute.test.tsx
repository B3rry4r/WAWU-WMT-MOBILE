/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Image as NativeImage } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

require('react-native-gesture-handler/jestSetup');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams: { kind?: string } = {};
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text: Label } = require('react-native');
    return <Label testID="redirect">{href}</Label>;
  },
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
}));

const PhotoPositionRoute = (require('@/app/photo-position') as typeof import('@/app/photo-position')).default;
const draft = require('@/features/profile-edit/draft') as typeof import('@/features/profile-edit/draft');
const { formFrom } = require('@/features/profile-edit/form') as typeof import('@/features/profile-edit/form');

const AVATAR = 'https://files.example/read/avatars/u1/a.jpg?X-Amz-Signature=s';
const form = formFrom(
  { wawuUserId: 'u1', firstName: 'Lennox', middleName: null, lastName: 'Emmanuel', handle: 'lennox', bio: null, avatarUrl: AVATAR, coverUrl: null } as never,
  { skills: [], socialOrder: [] } as never,
);

const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
);

beforeEach(() => {
  mockBack.mockClear();
  mockReplace.mockClear();
  mockParams = { kind: 'avatar' };
  draft.clearDraft();
  jest.spyOn(NativeImage, 'getSize').mockImplementation(((_uri: string, success: (w: number, h: number) => void) => success(900, 600)) as never);
});
afterEach(() => (NativeImage.getSize as jest.Mock).mockRestore());

describe('/photo-position (R-96)', () => {
  it('a visit with no Edit profile form open goes back to Edit profile', async () => {
    await render(frame(<PhotoPositionRoute />));
    expect(screen.getByTestId('redirect').children).toEqual(['/edit-profile']);
  });

  it('a visit for a picture the form does not have, or for something that is not a picture, goes back to Edit profile', async () => {
    draft.ensureDraft('u1', form);
    mockParams = { kind: 'cover' };
    await render(frame(<PhotoPositionRoute />));
    expect(screen.getByTestId('redirect')).toBeTruthy();
    mockParams = { kind: 'banner' };
    await render(frame(<PhotoPositionRoute />));
    expect(screen.getAllByTestId('redirect').length).toBeGreaterThan(0);
  });

  it('a user who repositions the profile picture and presses Save leaves the form holding the link with its position, and goes back', async () => {
    draft.ensureDraft('u1', form);
    await render(frame(<PhotoPositionRoute />));
    await screen.findByTestId('position-stage');
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-pinch'), [{ scale: 1 }, { scale: 1.5 }, { scale: 1.5 }]);
    });
    await fireEvent.press(screen.getByTestId('position-save'));
    const link = draft.readDraft()?.form.avatarUrl ?? '';
    expect(link.startsWith(`${AVATAR}#wmt-pos=`)).toBe(true);
    expect(link).toMatch(/#wmt-pos=[\d.]+,[\d.]+,1\.5,1\.5$/);
    // The saved profile is untouched until M8's Save.
    expect(draft.readDraft()?.base.avatarUrl).toBe(AVATAR);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('a user who presses Cancel leaves the form as it was', async () => {
    draft.ensureDraft('u1', form);
    await render(frame(<PhotoPositionRoute />));
    await screen.findByTestId('position-stage');
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-pinch'), [{ scale: 1 }, { scale: 1.5 }, { scale: 1.5 }]);
    });
    await fireEvent.press(screen.getByTestId('position-cancel'));
    expect(draft.readDraft()?.form.avatarUrl).toBe(AVATAR);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  describe('a photo just chosen from the phone', () => {
    const place = jest.fn();
    const discard = jest.fn();
    beforeEach(() => {
      place.mockReset();
      discard.mockReset();
      draft.ensureDraft('u1', form);
      draft.holdPendingPhoto({
        kind: 'avatar',
        picked: { blob: new Blob(['x']), contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cache/new.jpg', discard },
        place,
      });
    });
    afterEach(() => draft.dropPendingPhoto());

    it('is shown from the phone, and Save hands its position on for the upload while the form still holds the old picture', async () => {
      await render(frame(<PhotoPositionRoute />));
      await screen.findByTestId('position-stage');
      expect(screen.getByTestId('position-image').props.source).toEqual([{ uri: 'file:///cache/new.jpg' }]);
      await act(async () => {
        fireGestureHandler(getByGestureTestId('position-pinch'), [{ scale: 1 }, { scale: 2 }, { scale: 2 }]);
      });
      await fireEvent.press(screen.getByTestId('position-save'));
      expect(place).toHaveBeenCalledTimes(1);
      expect(place.mock.calls[0][0]).toMatchObject({ zoom: 2, ratio: 1.5 });
      expect(draft.readPendingPhoto()).toBeNull();
      expect(discard).not.toHaveBeenCalled();
      expect(draft.readDraft()?.form.avatarUrl).toBe(AVATAR);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('Save on a photo left alone places it centred', async () => {
      await render(frame(<PhotoPositionRoute />));
      await screen.findByTestId('position-stage');
      await fireEvent.press(screen.getByTestId('position-save'));
      expect(place).toHaveBeenCalledWith(null);
    });

    it('Cancel drops the photo, uploads nothing and keeps the old picture', async () => {
      await render(frame(<PhotoPositionRoute />));
      await screen.findByTestId('position-stage');
      await fireEvent.press(screen.getByTestId('position-cancel'));
      expect(place).not.toHaveBeenCalled();
      expect(draft.readPendingPhoto()).toBeNull();
      expect(discard).toHaveBeenCalledTimes(1);
      expect(draft.readDraft()?.form.avatarUrl).toBe(AVATAR);
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('a photo chosen for the cover is not the profile picture\'s: Reposition of the avatar shows the avatar', async () => {
      draft.holdPendingPhoto({
        kind: 'cover',
        picked: { blob: new Blob(['x']), contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cache/cover.jpg' },
        place,
      });
      await render(frame(<PhotoPositionRoute />));
      await screen.findByTestId('position-stage');
      expect(screen.getByTestId('position-image').props.source).toEqual([{ uri: AVATAR }]);
    });
  });
});
