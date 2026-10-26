/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Image as NativeImage } from 'react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// The gesture handler's own jest setup: the native module is not there under jest.
require('react-native-gesture-handler/jestSetup');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 2, fontScale: 1 }),
}));
const mockPick = jest.fn();
jest.mock('../pickImage', () => ({ canPickImage: true, pickImage: (...args: unknown[]) => mockPick(...args) }));

// The Hub client binds `fetch` when it is first imported, so one stable function is installed first and each case swaps what it answers with.
type Handler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
let handler: Handler = async () => new Response('{}', { status: 404 });
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => handler(input, init)) as typeof fetch;

const { PhotoPositionScreen } = require('../PhotoPositionScreen') as typeof import('../PhotoPositionScreen');
const { EditProfileScreen } = require('../EditProfileScreen') as typeof import('../EditProfileScreen');
const draft = require('../draft') as typeof import('../draft');
const { Avatar } = require('@/components/Avatar') as typeof import('@/components/Avatar');
const { placement, splitPhotoLink } = require('@/lib/photoPosition') as typeof import('@/lib/photoPosition');
const { coverHeight } = require('@/features/me/ProfileHeader') as typeof import('@/features/me/ProfileHeader');

const HOST = 'https://files.example/read/avatars/u1/a.jpg?X-Amz-Signature=s';
const COVER = 'https://files.example/read/profile/cover/u1/c.jpg?X-Amz-Signature=t';

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** The photo's pixel size as the device reads it: 1200 wide, 800 tall (3 to 2) unless a test says otherwise. */
let photo: { width: number; height: number } | 'fails' = { width: 1200, height: 800 };
beforeEach(() => {
  photo = { width: 1200, height: 800 };
  jest.spyOn(NativeImage, 'getSize').mockImplementation(((_uri: string, success: (w: number, h: number) => void, failure?: () => void) => {
    if (photo === 'fails') failure?.();
    else success(photo.width, photo.height);
  }) as never);
  mockPick.mockReset();
  draft.clearDraft();
});
afterEach(() => (NativeImage.getSize as jest.Mock).mockRestore());

const style = (id: string) => {
  const flat = Object.assign({}, ...[screen.getByTestId(id).props.style].flat(5).filter(Boolean)) as Record<string, number>;
  return { left: flat.left, top: flat.top, width: flat.width, height: flat.height };
};

async function open(kind: 'avatar' | 'cover', link: string) {
  const onDone = jest.fn();
  const onClose = jest.fn();
  await render(frame(<PhotoPositionScreen kind={kind} link={link} onDone={onDone} onClose={onClose} />));
  await screen.findByTestId('position-stage');
  return { onDone, onClose };
}

const done = async () => fireEvent.press(screen.getByTestId('position-done'));

describe('Position the profile picture (R-96)', () => {
  it('a user sees the photo filling the avatar circle, centred, and Done on a photo they did not move keeps the link as it is', async () => {
    const { onDone } = await open('avatar', HOST);
    const at = style('position-image');
    // 3 to 2 photo in a square frame: filled by its height, so it is wider than the frame and centred.
    expect(at.height).toBeCloseTo(at.width / 1.5);
    expect(at.width).toBeGreaterThan(at.height);
    await done();
    expect(onDone).toHaveBeenCalledWith(HOST);
  });

  it('a user zooms in with the button and drags the photo, and Done hands back the link with where it now sits', async () => {
    const { onDone } = await open('avatar', HOST);
    for (let i = 0; i < 4; i += 1) await fireEvent.press(screen.getByTestId('position-zoom-in'));
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-pan'), [{ translationX: 0, translationY: 0 }, { translationX: 30, translationY: 0 }, { translationX: 60, translationY: 0 }]);
    });
    await done();
    const link = onDone.mock.calls[0][0] as string;
    const { uri, position } = splitPhotoLink(link);
    expect(uri).toBe(HOST);
    expect(position?.zoom).toBe(2);
    expect(position?.ratio).toBe(1.5);
    // Dragging the photo to the right shows more of its left side.
    expect(position?.x).toBeLessThan(0.5);
    expect(position?.y).toBe(0.5);
  });

  it('a user can never drag the photo off its edge: a huge drag stops where the frame is still covered', async () => {
    const { onDone } = await open('avatar', HOST);
    await fireEvent.press(screen.getByTestId('position-zoom-in'));
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-pan'), [{ translationX: 0, translationY: 0 }, { translationX: 9000, translationY: 9000 }, { translationX: 9000, translationY: 9000 }]);
    });
    const at = style('position-image');
    const stage = style('position-stage');
    expect(stage.width).toBeGreaterThan(0);
    // The photo's left edge is at or inside the frame's left edge, and its top likewise.
    await done();
    const position = splitPhotoLink(onDone.mock.calls[0][0] as string).position!;
    const frameSide = at.height / position.zoom; // the frame is a square the photo's height at zoom 1
    const box = placement({ width: frameSide, height: frameSide }, position);
    expect(box.left).toBeLessThanOrEqual(0.01);
    expect(box.left + box.width).toBeGreaterThanOrEqual(frameSide - 0.01);
    expect(box.top).toBeLessThanOrEqual(0.01);
    expect(box.top + box.height).toBeGreaterThanOrEqual(frameSide - 0.01);
  });

  it('a user can zoom with a pinch, with the slider and with the buttons, from filling the frame to four times that', async () => {
    const { onDone } = await open('avatar', HOST);
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-pinch'), [{ scale: 1 }, { scale: 2.5 }, { scale: 2.5 }]);
    });
    await done();
    expect(splitPhotoLink(onDone.mock.calls[0][0] as string).position?.zoom).toBe(2.5);

    // Past four times is stopped, and the button says so.
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-pinch'), [{ scale: 1 }, { scale: 9 }, { scale: 9 }]);
    });
    expect(screen.getByTestId('position-zoom-in')).toBeDisabled();
    await done();
    expect(splitPhotoLink(onDone.mock.calls[1][0] as string).position?.zoom).toBe(4);

    // The slider: a screen reader adjusts it, and the track can be dragged.
    await fireEvent(screen.getByTestId('position-slider'), 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    await done();
    expect(splitPhotoLink(onDone.mock.calls[2][0] as string).position?.zoom).toBe(3.75);
    await fireEvent(screen.getByTestId('position-slider'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 228, height: 44 } } });
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-slider-pan'), [{ x: 14 }, { x: 14 }]);
    });
    expect(screen.getByTestId('position-zoom-out')).toBeDisabled();
    await act(async () => {
      fireGestureHandler(getByGestureTestId('position-slider-pan'), [{ x: 14 + 100 }, { x: 14 + 100 }]);
    });
    await done();
    const zoomed = splitPhotoLink(onDone.mock.calls[3][0] as string).position!.zoom;
    expect(zoomed).toBeCloseTo(1 + 3 * (100 / 200), 1);
  });

  it('a user with a screen reader or a keyboard can move the photo and zoom it with buttons that say what they do', async () => {
    const { onDone } = await open('avatar', HOST);
    for (const label of ['Zoom in', 'Zoom out', 'Move picture left', 'Move picture right', 'Move picture up', 'Move picture down']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
    expect(screen.getByRole('adjustable', { name: 'Zoom' })).toBeTruthy();
    await fireEvent.press(screen.getByTestId('position-zoom-in'));
    await fireEvent.press(screen.getByTestId('position-zoom-in'));
    await fireEvent.press(screen.getByTestId('position-left'));
    await fireEvent.press(screen.getByTestId('position-up'));
    await done();
    const position = splitPhotoLink(onDone.mock.calls[0][0] as string).position!;
    expect(position.zoom).toBe(1.5);
    // Move left shows more of the photo's right side; up shows more of its bottom.
    expect(position.x).toBeGreaterThan(0.5);
    expect(position.y).toBeGreaterThan(0.5);
  });

  it('a user can put the photo back to centred, and Done then keeps no position at all', async () => {
    const held = `${HOST}#wmt-pos=0.4,0.5,2,1.5`;
    const { onDone } = await open('avatar', held);
    expect(screen.getByTestId('position-reset')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('position-reset'));
    expect(screen.getByTestId('position-reset')).toBeDisabled();
    await done();
    expect(onDone).toHaveBeenCalledWith(HOST);
  });

  it('a user who repositions a photo reopens it where they left it, and Done without a change keeps it', async () => {
    const held = `${HOST}#wmt-pos=0.4,0.5,2,1.5`;
    const { onDone } = await open('avatar', held);
    expect(NativeImage.getSize).not.toHaveBeenCalled();
    await done();
    const kept = splitPhotoLink(onDone.mock.calls[0][0] as string);
    expect(kept.uri).toBe(HOST);
    expect(kept.position?.zoom).toBe(2);
    expect(kept.position?.ratio).toBe(1.5);
  });

  it('a cover is placed in the shape of the profile header, and Back closes without changing anything', async () => {
    photo = { width: 800, height: 1200 };
    const { onDone, onClose } = await open('cover', COVER);
    const stage = style('position-stage');
    const at = style('position-image');
    // A tall photo fills a wide banner by its width, so it is taller than the banner.
    expect(at.height).toBeGreaterThan(at.width);
    // The banner has the header's shape on this phone (390 wide, `coverHeight(0)` high).
    const bannerWidth = stage.width - 2 * 16;
    expect(at.width).toBeCloseTo(bannerWidth);
    expect(stage.height).toBeCloseTo(bannerWidth / (390 / coverHeight(0)) + 2 * 32);
    await fireEvent.press(screen.getByTestId('position-back'));
    expect(onClose).toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('a user whose photo cannot be read is told, and can try again', async () => {
    photo = 'fails';
    await render(frame(<PhotoPositionScreen kind="avatar" link={HOST} onDone={jest.fn()} onClose={jest.fn()} />));
    expect(await screen.findByTestId('position-error')).toBeTruthy();
    expect(screen.getByTestId('position-done')).toBeDisabled();
    photo = { width: 600, height: 600 };
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByTestId('position-stage')).toBeTruthy();
  });
});

describe('Avatars and covers wear the position (R-96)', () => {
  const link = `${HOST}#wmt-pos=0.3,0.6,2,1.5`;
  it('an avatar at every size shows the same part of the photo', async () => {
    const sizes = [28, 44, 72, 96];
    await render(
      <>
        {sizes.map((size) => (
          <Avatar key={size} name="Ada Obi" size={size} source={link} testID={`av${size}`} />
        ))}
      </>,
    );
    const big = style('av96-image');
    for (const size of sizes) {
      const at = style(`av${size}-image`);
      const expected = placement({ width: size, height: size }, { x: 0.3, y: 0.6, zoom: 2, ratio: 1.5 });
      expect(at.left).toBeCloseTo(expected.left);
      expect(at.top).toBeCloseTo(expected.top);
      expect(at.width).toBeCloseTo(expected.width);
      expect(at.height).toBeCloseTo(expected.height);
      // In the avatar's own units the photo sits the same at every size.
      expect(at.left / size).toBeCloseTo(big.left / 96, 5);
      expect(at.top / size).toBeCloseTo(big.top / 96, 5);
    }
  });

  it('an avatar with no position is the photo cover-fitted and centred, as it always was', async () => {
    await render(<Avatar name="Ada Obi" size={44} source={HOST} testID="plain" />);
    const image = screen.getByTestId('plain-image');
    expect(image.props.contentFit).toBe('cover');
    expect(image.props.source).toEqual([{ uri: HOST }]);
  });

  it('an avatar draws the link without the position as its picture address', async () => {
    await render(<Avatar name="Ada Obi" size={44} source={link} testID="placed" />);
    expect(screen.getByTestId('placed-image').props.source).toEqual([{ uri: HOST }]);
  });

  it('a photo the app cannot place (a position it cannot read) is centred, not lost', async () => {
    await render(<Avatar name="Ada Obi" size={44} source={`${HOST}#wmt-pos=nonsense`} testID="odd" />);
    expect(screen.getByTestId('odd-image').props.contentFit).toBe('cover');
    expect(screen.getByTestId('odd-image').props.source).toEqual([{ uri: HOST }]);
  });
});

describe('M8 · positioning the pictures (R-96)', () => {
  const FIELDS = '/api/hub/users/me/profile-fields';
  const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
  const profile = {
    wawuUserId: 'u1', firstName: 'Lennox', middleName: null, lastName: 'Emmanuel', handle: 'lennox', bio: null, avatarUrl: `${HOST}#wmt-pos=0.3,0.6,2,1.5`, coverUrl: COVER,
    instagramHandle: null, tiktokHandle: null, xHandle: null, youtubeUrl: null, facebookUrl: null, linkedinUrl: null,
  };
  const details = { wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null };
  let sent: { method: string; path: string; body: unknown }[] = [];

  beforeEach(() => {
    sent = [];
    handler = async (input, init) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      const url = new URL(request.url);
      const text = request.method === 'GET' || request.method === 'PUT' ? '' : await request.text();
      sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
      if (url.host === 'files.example') return new Response('', { status: 200 });
      if (url.pathname.endsWith('/uploads/presign')) {
        const folder = (JSON.parse(text) as { folder: string }).folder;
        return ok({ uploadUrl: `https://files.example/put/${folder}`, key: `k/${folder}`, fileUrl: `https://files.example/read/${folder}/new.jpg` });
      }
      if (url.pathname === FIELDS) return ok(details);
      return ok(profile);
    };
  });

  async function boot(onPositionPhoto?: (kind: 'avatar' | 'cover') => void) {
    const saved = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={saved} ownNotice={false} onPositionPhoto={onPositionPhoto} />));
    await screen.findByTestId('edit-profile');
    return saved;
  }

  it('a user whose route has no position screen sees no Reposition, and choosing a photo works as it did', async () => {
    mockPick.mockResolvedValue({ blob: new Blob(['abc']), contentType: 'image/png', extension: 'png', previewUri: 'blob:preview' });
    await boot();
    expect(screen.queryByTestId('edit-avatar-reposition')).toBeNull();
    expect(screen.queryByTestId('edit-cover-reposition')).toBeNull();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(sent.some((s) => s.path.endsWith('/uploads/presign'))).toBe(true));
  });

  it('a user sees Reposition on a picture they already have, and it opens the position screen for that picture', async () => {
    const open = jest.fn();
    await boot(open);
    await fireEvent.press(screen.getByTestId('edit-avatar-reposition'));
    await fireEvent.press(screen.getByTestId('edit-cover-reposition'));
    expect(open.mock.calls).toEqual([['avatar'], ['cover']]);
  });

  it('a user with no cover has nothing to reposition there, and sees the picture they have placed', async () => {
    handler = async (input, init) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      const url = new URL(request.url);
      if (url.pathname === FIELDS) return ok(details);
      return ok({ ...profile, coverUrl: null });
    };
    await boot(jest.fn());
    expect(screen.queryByTestId('edit-cover-reposition')).toBeNull();
    const at = style('edit-avatar-image');
    const expected = placement({ width: 72, height: 72 }, { x: 0.3, y: 0.6, zoom: 2, ratio: 1.5 });
    expect(at.left).toBeCloseTo(expected.left);
  });

  it('a user who chooses a new photo is taken to place it, and it starts centred (no position carried over)', async () => {
    mockPick.mockResolvedValue({ blob: new Blob(['abc']), contentType: 'image/png', extension: 'png', previewUri: 'blob:preview' });
    const open = jest.fn();
    await boot(open);
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('avatar'));
    expect(draft.readDraft()?.form.avatarUrl).toBe('https://files.example/read/avatars/new.jpg');
    expect(draft.readDraft()?.form.coverUrl).toBe(COVER);
  });

  it('a user who places a picture and presses Save sends the link with its position, and only that', async () => {
    const saved = await boot(jest.fn());
    draft.updateDraft((form) => ({ ...form, coverUrl: `${COVER}#wmt-pos=0.5,0.25,1.6,0.6667` }));
    await fireEvent.press(await screen.findByTestId('edit-save'));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(sent.filter((s) => s.method === 'PATCH').map((s) => s.body)).toEqual([{ coverUrl: `${COVER}#wmt-pos=0.5,0.25,1.6,0.6667` }]);
  });
});
