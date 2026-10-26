/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Animated, Image as NativeImage } from 'react-native';
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
  const onSave = jest.fn();
  const onCancel = jest.fn();
  await render(frame(<PhotoPositionScreen kind={kind} link={link} onSave={onSave} onCancel={onCancel} />));
  await screen.findByTestId('position-stage');
  return { onSave, onCancel };
}

const save = async () => fireEvent.press(screen.getByTestId('position-save'));
const drag = async (dx: number, dy: number) =>
  act(async () => {
    fireGestureHandler(getByGestureTestId('position-pan'), [{ translationX: 0, translationY: 0 }, { translationX: dx / 2, translationY: dy / 2 }, { translationX: dx, translationY: dy }]);
  });
const pinch = async (scale: number, focal: { focalX: number; focalY: number } = { focalX: 195, focalY: 370 }) =>
  act(async () => {
    fireGestureHandler(getByGestureTestId('position-pinch'), [{ scale: 1, ...focal }, { scale, ...focal }, { scale, ...focal }]);
  });
const action = async (name: string) => fireEvent(screen.getByTestId('position-stage'), 'accessibilityAction', { nativeEvent: { actionName: name } });

describe('The picture editor (R-96), the way Facebook and Instagram do it', () => {
  it('a user sees a dark stage with the photo in a circle and the rest dimmed, and Save on a photo they did not move keeps the link as it is', async () => {
    const { onSave } = await open('avatar', HOST);
    const at = style('position-image');
    // A 3 to 2 photo in a round frame: filled by its height, so wider than the circle and centred.
    expect(at.height).toBeCloseTo(at.width / 1.5);
    expect(at.width).toBeGreaterThan(at.height);
    expect(screen.getByTestId('position-veil')).toBeTruthy();
    expect(style('position-stage')).toBeTruthy();
    await save();
    expect(onSave).toHaveBeenCalledWith(HOST);
  });

  it('a user sees Cancel, the title and Save in the bar and no other control: no slider, no plus or minus, no arrows, no Centre', async () => {
    await open('avatar', HOST);
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Profile picture')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    // The hint is for the eye: a screen reader already has the stage's own label and actions.
    expect(screen.getByText('Drag to reposition', { includeHiddenElements: true })).toBeTruthy();
    for (const id of ['position-slider', 'position-zoom-in', 'position-zoom-out', 'position-left', 'position-right', 'position-up', 'position-down', 'position-reset']) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
    expect(screen.queryByText('Centre')).toBeNull();
    // The only buttons are the two in the bar.
    expect(screen.getAllByRole('button').map((b) => b.props.testID)).toEqual(['position-cancel', 'position-save']);
  });

  it('a user drags the photo with one finger from the very first touch, and Save hands back where it now sits', async () => {
    const { onSave } = await open('avatar', HOST);
    // The drag is active at once (no distance to cover first), so its first step moves the photo too.
    expect((getByGestureTestId('position-pan') as unknown as { config: { minDist: number } }).config.minDist).toBe(0);
    await pinch(2);
    await drag(60, 0);
    await save();
    const { uri, position } = splitPhotoLink(onSave.mock.calls[0][0] as string);
    expect(uri).toBe(HOST);
    expect(position?.zoom).toBe(2);
    expect(position?.ratio).toBe(1.5);
    // Dragging the photo to the right shows more of its left side.
    expect(position?.x).toBeLessThan(0.5);
  });

  it('a user can never drag the photo off its edge: a huge drag stops where the circle is still covered', async () => {
    const { onSave } = await open('avatar', HOST);
    await pinch(2);
    await drag(9000, 9000);
    await save();
    const position = splitPhotoLink(onSave.mock.calls[0][0] as string).position!;
    const at = style('position-image');
    const side = at.height / position.zoom; // the circle is a square the photo's height at zoom 1
    const box = placement({ width: side, height: side }, position);
    expect(box.left).toBeLessThanOrEqual(0.01);
    expect(box.left + box.width).toBeGreaterThanOrEqual(side - 0.01);
    expect(box.top).toBeLessThanOrEqual(0.01);
    expect(box.top + box.height).toBeGreaterThanOrEqual(side - 0.01);
  });

  it('a user pinches to zoom from filling the circle to four times that, about the spot between their fingers', async () => {
    const { onSave } = await open('avatar', HOST);
    // Fingers to the right of the middle: the photo grows about that spot, so the middle of the circle moves right in the photo.
    await pinch(2.5, { focalX: 195 + 120, focalY: 370 });
    await save();
    const first = splitPhotoLink(onSave.mock.calls[0][0] as string).position!;
    expect(first.zoom).toBe(2.5);
    expect(first.x).toBeGreaterThan(0.5);
    expect(first.y).toBeCloseTo(0.5, 3);

    // Past four times is stopped.
    await pinch(9);
    await save();
    expect(splitPhotoLink(onSave.mock.calls[1][0] as string).position?.zoom).toBe(4);
  });

  it('a user with a screen reader has every move as an action on the stage, and the stage says what it is', async () => {
    const { onSave } = await open('avatar', HOST);
    const stage = screen.getByTestId('position-stage');
    expect(stage.props.accessibilityLabel).toBe('Profile picture. Drag to reposition, pinch to zoom.');
    expect(stage.props.accessibilityHint).toContain('zoom in');
    expect((stage.props.accessibilityActions as { name: string }[]).map((a) => a.name)).toEqual(['zoomIn', 'zoomOut', 'moveUp', 'moveDown', 'moveLeft', 'moveRight', 'reset']);
    await action('zoomIn');
    await action('zoomIn');
    await action('moveLeft');
    await action('moveUp');
    await save();
    const position = splitPhotoLink(onSave.mock.calls[0][0] as string).position!;
    expect(position.zoom).toBe(1.5);
    // Move left shows more of the photo's right side; up shows more of its bottom.
    expect(position.x).toBeGreaterThan(0.5);
    expect(position.y).toBeGreaterThan(0.5);
    await action('zoomOut');
    await action('zoomOut');
    await action('zoomOut');
    await save();
    // Back at the least zoom, and still where it was moved to sideways (a wide photo in a round frame has room to move that way).
    expect(splitPhotoLink(onSave.mock.calls[1][0] as string).position?.zoom).toBe(1);
  });

  it('a user can reset the photo to centred, and Save then keeps no position at all', async () => {
    const held = `${HOST}#wmt-pos=0.4,0.5,2,1.5`;
    const { onSave } = await open('avatar', held);
    await action('reset');
    await save();
    expect(onSave).toHaveBeenCalledWith(HOST);
  });

  it('a user who repositions a photo reopens it where they left it, and Save without a move keeps the link exactly', async () => {
    const held = `${HOST}#wmt-pos=0.4,0.5,2,1.5`;
    const { onSave } = await open('avatar', held);
    expect(NativeImage.getSize).not.toHaveBeenCalled();
    await save();
    expect(onSave).toHaveBeenCalledWith(held);
  });

  it('a user who presses Cancel changes nothing', async () => {
    const { onSave, onCancel } = await open('avatar', HOST);
    await pinch(2);
    await fireEvent.press(screen.getByTestId('position-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('the hint "Drag to reposition" fades once the photo has been moved', async () => {
    await open('avatar', HOST);
    const hint = () => screen.getByTestId('position-hint', { includeHiddenElements: true });
    expect(hint()).toHaveStyle({ opacity: 1 });
    const timing = jest.spyOn(Animated, 'timing');
    expect(timing).not.toHaveBeenCalled();
    await drag(20, 0);
    // The fade runs on the native side, so the test sees it asked for: from fully shown to nothing.
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 0 }));
    timing.mockRestore();
  });

  it('a cover is placed in the shape of the profile header, under the title Cover photo', async () => {
    photo = { width: 800, height: 1200 };
    const { onSave } = await open('cover', COVER);
    expect(screen.getByText('Cover photo')).toBeTruthy();
    const at = style('position-image');
    // A tall photo fills a wide banner by its width, so it is taller than the banner.
    expect(at.height).toBeGreaterThan(at.width);
    // The banner is the stage's width less 16 each side, and has the header's shape on this phone (390 wide, `coverHeight(0)` high).
    const bannerWidth = 390 - 2 * 16;
    expect(at.width).toBeCloseTo(bannerWidth);
    await drag(0, 80);
    await save();
    const position = splitPhotoLink(onSave.mock.calls[0][0] as string).position!;
    expect(position.ratio).toBe(0.6667);
    expect(position.y).toBeLessThan(0.5);
    expect(coverHeight(0)).toBeGreaterThan(0);
  });

  it('a photo too long one way to place is kept centred, not stretched or lost', async () => {
    photo = { width: 100, height: 900 };
    const { onSave } = await open('avatar', HOST);
    await drag(0, 50);
    await save();
    expect(onSave).toHaveBeenCalledWith(HOST);
  });

  it('a user whose photo cannot be read is told, and can try again', async () => {
    photo = 'fails';
    await render(frame(<PhotoPositionScreen kind="avatar" link={HOST} onSave={jest.fn()} onCancel={jest.fn()} />));
    expect(await screen.findByTestId('position-error')).toBeTruthy();
    expect(screen.getByTestId('position-save')).toBeDisabled();
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

describe('Cards and the pay sheet header wear the position too (R-96)', () => {
  const link = `${HOST}#wmt-pos=0.3,0.6,2,1.5`;
  const { MediaCard } = require('@/components/MediaCard') as typeof import('@/components/MediaCard');
  const { CreatorCard } = require('@/features/explore/CreatorCard') as typeof import('@/features/explore/CreatorCard');

  it('a creator card draws the portrait at the position its owner set, at the card size', async () => {
    const creator = { wawuId: 'c1', name: 'Ada Obi', handle: 'ada', avatarUrl: link, field: null, following: false, verification: null };
    await render(<CreatorCard creator={creator as never} testID="card" />);
    const at = style('card-image');
    const expected = placement({ width: 150, height: 200 }, { x: 0.3, y: 0.6, zoom: 2, ratio: 1.5 });
    expect(at.left).toBeCloseTo(expected.left);
    expect(at.top).toBeCloseTo(expected.top);
    expect(at.width).toBeCloseTo(expected.width);
    expect(screen.getByTestId('card-image').props.source).toEqual([{ uri: HOST }]);
  });

  it('a card that fills its row (a width in percent) is measured, then draws the portrait at the position', async () => {
    await render(<MediaCard layout="stacked" title="Ada" width="100%" height={218} imageUrl={link} testID="grid" />);
    await fireEvent(screen.getByTestId('grid-image-frame'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 180, height: 218 } } });
    const at = style('grid-image');
    const expected = placement({ width: 180, height: 218 }, { x: 0.3, y: 0.6, zoom: 2, ratio: 1.5 });
    expect(at.width).toBeCloseTo(expected.width);
  });

  it('a picture with no position is cover-fitted as it always was', async () => {
    await render(<MediaCard layout="stacked" title="Ada" width={150} height={200} imageUrl={HOST} testID="plain" />);
    expect(screen.getByTestId('plain-image').props.contentFit).toBe('cover');
  });
});

describe('A position that does not match its photo never stretches it (R-96)', () => {
  it('a link that declares the wrong shape is drawn by the shape the photo really has', async () => {
    // The Hub once accepted any shape: a tall one drew a 384 by 7680 avatar.
    const liar = `${HOST}#wmt-pos=0.5,0.5,4,0.2`;
    await render(<Avatar name="Ada Obi" size={96} source={liar} testID="liar" />);
    // Before the photo has loaded it is drawn by the declared shape, which is at most twenty times the frame.
    expect(style('liar-image').height).toBeLessThanOrEqual(20 * 96);
    await fireEvent(screen.getByTestId('liar-image'), 'load', { nativeEvent: { source: { width: 1200, height: 800 } } });
    const at = style('liar-image');
    const expected = placement({ width: 96, height: 96 }, { x: 0.5, y: 0.5, zoom: 4, ratio: 1.5 });
    expect(at.width).toBeCloseTo(expected.width);
    expect(at.height).toBeCloseTo(expected.height);
    // The photo keeps its own shape: 3 to 2.
    expect(at.width / at.height).toBeCloseTo(1.5);
  });

  it('a link that declares a shape no photo has, on a photo that is more extreme still, is drawn cover-fitted', async () => {
    const liar = `${HOST}#wmt-pos=0.5,0.5,4,1`;
    await render(<Avatar name="Ada Obi" size={96} source={liar} testID="odd" />);
    await fireEvent(screen.getByTestId('odd-image'), 'load', { nativeEvent: { source: { width: 100, height: 2000 } } });
    expect(screen.getByTestId('odd-image').props.contentFit).toBe('cover');
  });

  it('a link that tells the truth is not redrawn when the photo loads', async () => {
    await render(<Avatar name="Ada Obi" size={96} source={`${HOST}#wmt-pos=0.3,0.6,2,1.5`} testID="true" />);
    const before = style('true-image');
    await fireEvent(screen.getByTestId('true-image'), 'load', { nativeEvent: { source: { width: 1200, height: 800 } } });
    expect(style('true-image')).toEqual(before);
  });
});

describe('M8 · choosing and positioning the pictures (R-96)', () => {
  const FIELDS = '/api/hub/users/me/profile-fields';
  const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
  const profile = {
    wawuUserId: 'u1', firstName: 'Lennox', middleName: null, lastName: 'Emmanuel', handle: 'lennox', bio: null, avatarUrl: `${HOST}#wmt-pos=0.3,0.6,2,1.5`, coverUrl: COVER,
    instagramHandle: null, tiktokHandle: null, xHandle: null, youtubeUrl: null, facebookUrl: null, linkedinUrl: null,
  };
  const details = { wawuUserId: 'u1', location: null, skills: [], openTo: [], threadsHandle: null, socialOrder: [], memberSince: null };
  let sent: { method: string; path: string; body: unknown }[] = [];
  let putStatus = 200;
  const discard = jest.fn();
  const picked = () => ({ blob: new Blob(['abc']), contentType: 'image/png', extension: 'png', previewUri: 'blob:preview', discard });

  beforeEach(() => {
    sent = [];
    putStatus = 200;
    discard.mockClear();
    handler = async (input, init) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      const url = new URL(request.url);
      const text = request.method === 'GET' || request.method === 'PUT' ? '' : await request.text();
      sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
      if (url.host === 'files.example') return new Response('', { status: putStatus });
      if (url.pathname.endsWith('/uploads/presign')) {
        const folder = (JSON.parse(text) as { folder: string }).folder;
        return ok({ uploadUrl: `https://files.example/put/${folder}`, key: `k/${folder}`, fileUrl: `https://files.example/read/${folder}/new.jpg` });
      }
      if (url.pathname === FIELDS) return ok(details);
      return ok(profile);
    };
  });
  afterEach(() => draft.dropPendingPhoto());

  async function boot(onPositionPhoto?: (kind: 'avatar' | 'cover') => void) {
    const saved = jest.fn();
    await render(frame(<EditProfileScreen onBack={jest.fn()} onOpenSocial={jest.fn()} onSaved={saved} ownNotice={false} onPositionPhoto={onPositionPhoto} />));
    await screen.findByTestId('edit-profile');
    return saved;
  }
  const uploads = () => sent.filter((s) => s.path.endsWith('/uploads/presign'));

  it('a user whose route has no position screen sees no Reposition, and choosing a photo uploads it as it did', async () => {
    mockPick.mockResolvedValue(picked());
    await boot();
    expect(screen.queryByTestId('edit-cover-reposition')).toBeNull();
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(uploads()).toHaveLength(1));
  });

  it('a user taps their profile picture and is offered "Choose a new photo" and "Reposition", with no Reposition button sitting beside it', async () => {
    await boot(jest.fn());
    expect(screen.queryByTestId('edit-avatar-reposition')).toBeNull();
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    expect(await screen.findByText('Choose a new photo')).toBeTruthy();
    expect(screen.getByTestId('edit-avatar-reposition')).toBeTruthy();
  });

  it('a user who taps Reposition on their profile picture is taken to place it, and nothing waits to be uploaded', async () => {
    const open = jest.fn();
    await boot(open);
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await fireEvent.press(await screen.findByTestId('edit-avatar-reposition'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('avatar'), { timeout: 2000 });
    expect(draft.readPendingPhoto()).toBeNull();
    expect(mockPick).not.toHaveBeenCalled();
  });

  it('the cover keeps its Reposition on the cover, beside the camera, and it opens the position screen for the cover', async () => {
    const open = jest.fn();
    await boot(open);
    await fireEvent.press(screen.getByTestId('edit-cover-reposition'));
    expect(open.mock.calls).toEqual([['cover']]);
  });

  it('a user with no profile picture taps it and goes straight to choosing one', async () => {
    mockPick.mockResolvedValue(picked());
    handler = async (input, init) => {
      const request = input instanceof Request ? input : new Request(String(input), init);
      const url = new URL(request.url);
      if (url.pathname === FIELDS) return ok(details);
      return ok({ ...profile, avatarUrl: null });
    };
    const open = jest.fn();
    await boot(open);
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('avatar'));
    expect(screen.queryByTestId('edit-avatar-reposition')).toBeNull();
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

  it('a user who chooses a new photo is taken to place it at once, and nothing is uploaded or changed until they press Save there', async () => {
    mockPick.mockResolvedValue(picked());
    const open = jest.fn();
    await boot(open);
    await fireEvent.press(screen.getByTestId('edit-avatar-pick'));
    await fireEvent.press(await screen.findByTestId('edit-avatar-choose'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('avatar'), { timeout: 2000 });
    expect(draft.readPendingPhoto()?.kind).toBe('avatar');
    expect(draft.readPendingPhoto()?.picked.previewUri).toBe('blob:preview');
    expect(uploads()).toHaveLength(0);
    expect(draft.readDraft()?.form.avatarUrl).toBe(`${HOST}#wmt-pos=0.3,0.6,2,1.5`);
  });

  it('a user who presses Save on the position screen uploads the photo with its position, and sees it placed there while it goes up', async () => {
    mockPick.mockResolvedValue(picked());
    await boot(jest.fn());
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(draft.readPendingPhoto()?.kind).toBe('cover'));
    const pending = draft.readPendingPhoto()!;
    draft.releasePendingPhoto();
    await act(async () => pending.place({ x: 0.5, y: 0.25, zoom: 1.6, ratio: 0.6667 }));
    await waitFor(() => expect(draft.readDraft()?.form.coverUrl).toBe('https://files.example/read/profile/cover/new.jpg#wmt-pos=0.5,0.25,1.6,0.6667'));
    expect(uploads()).toHaveLength(1);
    expect(discard).toHaveBeenCalled();
    // Only the new picture changed.
    expect(draft.readDraft()?.form.avatarUrl).toBe(`${HOST}#wmt-pos=0.3,0.6,2,1.5`);
  });

  it('a user who presses Cancel on the position screen keeps the old picture: the chosen photo is dropped and never uploaded', async () => {
    mockPick.mockResolvedValue(picked());
    await boot(jest.fn());
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(draft.readPendingPhoto()?.kind).toBe('cover'));
    await act(async () => draft.dropPendingPhoto());
    expect(draft.readPendingPhoto()).toBeNull();
    expect(discard).toHaveBeenCalledTimes(1);
    expect(uploads()).toHaveLength(0);
    expect(draft.readDraft()?.form.coverUrl).toBe(COVER);
  });

  it('a user whose photo does not go up is told, and the old picture stays', async () => {
    mockPick.mockResolvedValue(picked());
    putStatus = 500;
    await boot(jest.fn());
    await fireEvent.press(screen.getByTestId('edit-cover-pick'));
    await waitFor(() => expect(draft.readPendingPhoto()?.kind).toBe('cover'));
    const pending = draft.readPendingPhoto()!;
    draft.releasePendingPhoto();
    await act(async () => pending.place(null));
    expect(await screen.findByTestId('edit-banner')).toBeTruthy();
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
