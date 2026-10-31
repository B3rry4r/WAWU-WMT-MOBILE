/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { servePrices } from '@/features/prices/__helpers__/prices';

import { ScriptedXhr, FORMATS, allowance, chosen, hub, installFetch, installXhr, ok, presigned } from '../__helpers__/harness';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })) }));
jest.mock('expo-video', () => ({ VideoView: 'VideoView', useVideoPlayer: jest.fn(), createVideoPlayer: jest.fn() }));
// The phone's own file picker and image manipulator are not here under jest: each test says what the person chose and what the phone made.
const mockPick = jest.fn();
jest.mock('../pickFile', () => ({ canPickFile: true, pickFile: (...args: unknown[]) => mockPick(...args) }));
jest.mock('../previewCopy', () => ({ smallCopyOf: jest.fn(async () => ({ blob: new Blob([new Uint8Array(900)]), name: 'preview.jpg', contentType: 'image/jpeg', extension: 'jpg', discard: jest.fn() })) }));

/*
 * UPLOAD-REST r2 (BLOCKER 2): the whole Create flow through the REAL router, on Android (Platform.OS android). The screen tests render one screen
 * at a time with `Redirect` stubbed away, which is how `create-details` kept sending the person back to the cover step (it wanted a preview that
 * nothing makes any more, R-118) while every test passed. Here the six real route files are walked by their own Continue buttons, with the real
 * session and the real creator gate, and only the phone (file picker, storage PUT) and the Hub's answers scripted:
 *   choose a format -> pick a file -> the cover step -> Continue -> details -> Continue -> price -> Send for review -> "Sent for review".
 * A paid audio piece, a paid picture and a free piece; each must land on the step it was sent to and send what R-118 says it sends.
 */
// The Hub client takes `fetch` when it is first loaded, so the stand-in Hub is installed before any app module is.
installFetch();
const { queryClient: appClient } = require('@/api/query') as typeof import('@/api/query');
const CreateDetailsRoute = (require('@/app/create-details') as typeof import('@/app/create-details')).default;
const CreateFormatRoute = (require('@/app/create-format') as typeof import('@/app/create-format')).default;
const CreatePreviewRoute = (require('@/app/create-preview') as typeof import('@/app/create-preview')).default;
const CreatePriceRoute = (require('@/app/create-price') as typeof import('@/app/create-price')).default;
const CreateReviewRoute = (require('@/app/create-review') as typeof import('@/app/create-review')).default;
const CreateUploadRoute = (require('@/app/create-upload') as typeof import('@/app/create-upload')).default;
const draft = require('../draft') as typeof import('../draft');
const details = require('../details') as typeof import('../details');
const { adoptSession, resetSessionForTests } = require('@/api/session') as typeof import('@/api/session');

const FORMATS_PATH = '/api/hub/uploads/formats';
const ALLOWANCE = '/api/hub/uploads/allowance';
const PRESIGN = '/api/hub/uploads/presign';
const CREATE = '/api/hub/content';
const ME = '/api/hub/users/me';

function Frame() {
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={appClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
const Stand = (name: string) =>
  function StandIn() {
    return <Text testID={`stand-${name}`}>{name}</Text>;
  };
const routes = {
  _layout: Frame,
  index: Stand('home'),
  welcome: Stand('welcome'),
  library: Stand('library'),
  create: Stand('create'),
  'create-format': CreateFormatRoute,
  'create-upload': CreateUploadRoute,
  'create-preview': CreatePreviewRoute,
  'create-details': CreateDetailsRoute,
  'create-price': CreatePriceRoute,
  'create-review': CreateReviewRoute,
};

/** The router's own view of where it is. */
function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
const posts = () => hub.sent.filter((s) => s.method === 'POST' && s.path === CREATE).map((s) => s.body as Record<string, unknown>);
const created = (title: string) => ({ status: 201, body: { statusCode: 201, message: 'Created', data: { id: 'c1', title, status: 'pending' } } });
const TITLE = 'Midnight Tapes';

beforeAll(async () => {
  const { unmount } = await renderRouter(routes);
  await unmount();
}, 60_000);

beforeEach(async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  installFetch();
  installXhr();
  mockPick.mockReset();
  draft.resetDraft();
  details.setSent(null);
  appClient.clear();
  resetSessionForTests();
  hub.answers[`GET ${ME}`] = ok({ wawuUserId: 'u1', accountType: 'creator' });
  hub.answers[`GET ${FORMATS_PATH}`] = ok(FORMATS);
  hub.answers[`GET ${ALLOWANCE}`] = ok(allowance(1, 5));
  hub.answers[`POST ${CREATE}`] = created(TITLE);
  servePrices();
  // A real signed-in session (the token is read, never verified, by the phone) whose profile says it is a creator.
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  await adoptSession({ accessToken: `${b64({ alg: 'RS256' })}.${b64({ sub: 'u1', iat: 1000, exp: 4_000_000_000 })}.sig`, refreshToken: 'r' });
});
afterEach(() => {
  jest.restoreAllMocks();
});

/** Step 1 to the end of step 2: the format picked, a file chosen, sent to storage and landed; then Continue to the cover step. */
async function pickAFile(format: string, file: ReturnType<typeof chosen>, folder = 'content/full') {
  hub.answers[`POST ${PRESIGN}`] = presigned(folder, file.name);
  mockPick.mockResolvedValue(file);
  await renderRouter(routes, { initialUrl: '/create-format' });
  await fireEvent.press(await screen.findByTestId(`format-${format}`));
  await fireEvent.press(screen.getByTestId('create-continue'));
  await screen.findByTestId('upload-screen');
  expect(pathname()).toBe('/create-upload');
  await fireEvent.press(await screen.findByTestId('upload-drop'));
  await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
  await act(async () => {
    ScriptedXhr.last?.finish(200);
  });
  await waitFor(() => expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(false));
  await fireEvent.press(screen.getByTestId('create-continue'));
}

/** The cover step, then Continue to details: the step the old gate sent every kind straight back from. */
async function throughCover() {
  expect(await screen.findByTestId('preview-screen')).toBeTruthy();
  expect(pathname()).toBe('/create-preview');
  expect(screen.getByText('Add a cover')).toBeTruthy();
  await waitFor(() => expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(false));
  await fireEvent.press(screen.getByTestId('create-continue'));
  expect(await screen.findByTestId('details-screen')).toBeTruthy();
  expect(pathname()).toBe('/create-details');
  // Not bounced back, not on the cover step again, a moment later either.
  await act(async () => undefined);
  expect(pathname()).toBe('/create-details');
  expect(screen.queryByTestId('preview-screen')).toBeNull();
}

/** Details filled and Continue to the price step. */
async function throughDetails() {
  await fireEvent.changeText(screen.getByTestId('details-title'), TITLE);
  await fireEvent.changeText(screen.getByTestId('details-description'), 'Eight late-night beats.');
  await fireEvent.press(screen.getByTestId('details-category'));
  await fireEvent.press(await screen.findByTestId('category-entertainment_creative'));
  await fireEvent.press(screen.getByTestId('create-continue'));
  expect(await screen.findByTestId('price-screen')).toBeTruthy();
  expect(pathname()).toBe('/create-price');
}

async function sendIt() {
  await waitFor(() => expect(screen.getByTestId('create-send').props.accessibilityState.disabled).toBe(false));
  await fireEvent.press(screen.getByTestId('create-send'));
}

describe('UPLOAD-REST r2 · the Create flow, route by route (Android, the real router)', () => {
  it('a PAID AUDIO piece: file -> cover -> details -> price -> Send, ending on "Sent for review", asking the Hub to make the preview', async () => {
    await pickAFile('audio', chosen('midnight.mp3', 'audio/mpeg', 1000));
    await throughCover();
    await throughDetails();
    await sendIt();

    await waitFor(() => expect(pathname()).toBe('/create-review'));
    expect(await screen.findByTestId('review-screen')).toBeTruthy();
    expect(screen.getByTestId('review-title')).toHaveTextContent(TITLE);
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({ contentType: 'audio', accessType: 'paid', price: 2500, previewFromFile: true, fullAsset: 'https://storage.test/content/full/u1/midnight.mp3?read=1' });
    expect(posts()[0]).not.toHaveProperty('previewAsset');
    // Nobody was asked for a preview file, and nobody was sent back to look for one.
    expect(hub.sent.filter((s) => s.path === PRESIGN)).toHaveLength(1);
  });

  it('a PAID PICTURE: file -> cover -> details -> price -> Send; the phone-made smaller copy goes up as the preview and is named as previewAsset', async () => {
    await pickAFile('image', chosen('shot.png', 'image/png', 4000, { previewUri: 'file:///cache/shot.png' }));
    await throughCover();
    await throughDetails();
    // The Send uploads the copy the phone made: its own presign, its own PUT.
    hub.answers[`POST ${PRESIGN}`] = presigned('content/preview', 'preview.jpg');
    ScriptedXhr.last = null;
    await sendIt();
    await waitFor(() => expect(ScriptedXhr.last).not.toBeNull());
    expect(hub.sent.filter((s) => s.path === PRESIGN).pop()?.body).toMatchObject({ folder: 'content/preview', contentType: 'image/jpeg' });
    await act(async () => {
      ScriptedXhr.last?.finish(200);
    });

    await waitFor(() => expect(pathname()).toBe('/create-review'));
    expect(await screen.findByTestId('review-screen')).toBeTruthy();
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({
      contentType: 'image',
      accessType: 'paid',
      fullAsset: 'https://storage.test/content/full/u1/shot.png?read=1',
      previewAsset: 'https://storage.test/content/preview/u1/preview.jpg?read=1',
    });
    expect(posts()[0]).not.toHaveProperty('previewFromFile');
  });

  it('a FREE piece: file -> cover -> details -> price (Free) -> Send; it sends no preview and asks for none', async () => {
    await pickAFile('pdf', chosen('guide.pdf', 'application/pdf', 1000));
    await throughCover();
    await throughDetails();
    await fireEvent.press(screen.getByLabelText('Free'));
    await sendIt();

    await waitFor(() => expect(pathname()).toBe('/create-review'));
    expect(await screen.findByTestId('review-screen')).toBeTruthy();
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({ contentType: 'pdf', accessType: 'free', price: 0 });
    expect(posts()[0]).not.toHaveProperty('previewAsset');
    expect(posts()[0]).not.toHaveProperty('previewFromFile');
  });

  it('Android Back from the details step lands on the cover step with the file still there, and Continue goes on again', async () => {
    // The phone's Back key reaches every handler the app registered, last one first, until one takes it (react-native's BackHandler).
    const { BackHandler } = require('react-native') as typeof import('react-native');
    const handlers: (() => boolean | null | undefined)[] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, cb) => {
      handlers.push(cb as () => boolean);
      return { remove: () => void handlers.splice(handlers.indexOf(cb as () => boolean), 1) };
    });
    const pressBack = async () => {
      let taken = false;
      await act(async () => {
        for (const handler of [...handlers].reverse()) {
          if (handler()) {
            taken = true;
            break;
          }
        }
      });
      return taken;
    };
    await pickAFile('audio', chosen('midnight.mp3', 'audio/mpeg', 1000));
    await throughCover();
    expect(await pressBack()).toBe(true);
    await waitFor(() => expect(pathname()).toBe('/create-preview'));
    expect(await screen.findByTestId('preview-screen')).toBeTruthy();
    expect(draft.getDraft().full?.name).toBe('midnight.mp3');
    // Continue is not held up by the way back: it opens the details again.
    await fireEvent.press(screen.getByTestId('create-continue'));
    expect(await screen.findByTestId('details-screen')).toBeTruthy();
    expect(pathname()).toBe('/create-details');
  });

  it('a PAID TEMPLATE is held at the cover step until it has a cover (its cover is its preview): Continue waits, and a jump to the price step is sent back', async () => {
    const { router } = require('expo-router') as typeof import('expo-router');
    await pickAFile('template', chosen('kit.zip', 'application/zip', 1000));
    expect(await screen.findByTestId('preview-screen')).toBeTruthy();
    expect(screen.getByTestId('create-continue').props.accessibilityState?.disabled).toBe(true);
    details.setDetails({ title: TITLE, description: 'A kit.', category: 'entertainment_creative' });
    await act(async () => {
      router.push('/create-price');
    });
    await waitFor(() => expect(pathname()).toBe('/create-preview'));
    expect(screen.queryByTestId('price-screen')).toBeNull();
  });
});
