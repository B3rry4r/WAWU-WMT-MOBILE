/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { AppState, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * A6 on the phone build (SHARED-04): `SelfieScreen` with its own capture, `useSelfieCapture` from
 * `selfie/capture.ts`, over expo-camera, expo-image-manipulator and expo-file-system. Each module is
 * replaced here, so no test reaches the phone's native side; what the replacements record is what the
 * capture asked of them.
 */

const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

type Permission = { granted: boolean; canAskAgain: boolean; status: 'granted' | 'denied' | 'undetermined'; expires: 'never' };
const permission = (granted: boolean, canAskAgain: boolean): Permission => ({
  granted,
  canAskAgain,
  status: granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied',
  expires: 'never',
});

/** The phone's camera: what the permission reads now, what asking answers, and what each picture is. */
const mockCamera = {
  now: permission(false, true),
  answer: permission(true, true),
  asks: 0,
  pictures: [] as { pictureRef?: boolean }[],
  picture: { width: 3000, height: 4000 },
  takeFails: false,
  mountFails: false,
  released: 0,
};

type MockCameraProps = { facing: string; testID: string; onCameraReady?: () => void; onMountError?: (event: unknown) => void };
jest.mock('expo-camera', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  function useCameraPermissions() {
    const [status, setStatus] = React.useState<unknown>(null);
    const request = React.useCallback(async () => {
      mockCamera.asks += 1;
      mockCamera.now = mockCamera.answer;
      setStatus(mockCamera.now);
      return mockCamera.now;
    }, []);
    const get = React.useCallback(async () => {
      setStatus(mockCamera.now);
      return mockCamera.now;
    }, []);
    React.useEffect(() => {
      void get();
    }, [get]);
    return [status, request, get];
  }
  const CameraView = React.forwardRef<unknown, MockCameraProps>(function CameraView(props, ref) {
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: async (options: { pictureRef?: boolean }) => {
        mockCamera.pictures.push(options);
        if (mockCamera.takeFails) throw new Error('capture failed');
        return {
          ...mockCamera.picture,
          release: () => {
            mockCamera.released += 1;
          },
        };
      },
    }));
    React.useEffect(() => {
      if (mockCamera.mountFails) props.onMountError?.({ message: 'Camera is not available' });
      else props.onCameraReady?.();
    }, [props]);
    return React.createElement(View, { testID: props.testID, facing: props.facing } as object);
  });
  return { CameraView, useCameraPermissions };
});

/** The encoder: the sizes asked for, each save's options, and the base64 each save answers, in turn. */
const mockEncoder = {
  sources: [] as unknown[],
  resizes: [] as unknown[],
  saves: [] as { format?: string; compress?: number; base64?: boolean }[],
  /** A string is the base64 a save answers; `'write-then-fail'` writes its file and then throws (F3). */
  outputs: [] as string[],
  rendered: null as null | { width: number; height: number },
  released: 0,
};
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: (source: { width: number; height: number }) => {
      mockEncoder.sources.push(source);
      let size = { width: source.width, height: source.height };
      const context = {
        resize: (to: { width?: number; height?: number }) => {
          mockEncoder.resizes.push(to);
          const scale = to.width ? to.width / size.width : (to.height as number) / size.height;
          size = { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
          return context;
        },
        renderAsync: async () => {
          const shown = mockEncoder.rendered ?? size;
          return {
            ...shown,
            saveAsync: async (options: { format?: string; compress?: number; base64?: boolean }) => {
              mockEncoder.saves.push(options);
              const uri = `file:///cache/ImageManipulator/${mockEncoder.saves.length}.jpg`;
              mockCache.add(uri);
              const output = mockEncoder.outputs.shift();
              if (output === 'write-then-fail') throw new Error('encoder failed after writing');
              return { uri, ...shown, base64: output };
            },
            release: () => {
              mockEncoder.released += 1;
            },
          };
        },
        release: () => {
          mockEncoder.released += 1;
        },
      };
      return context;
    },
  },
}));

/** The files in the manipulator's cache folder, and the ones the capture deleted. */
const mockCache = new Set<string>();
const mockDeleted: string[] = [];
jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists() {
      return mockCache.has(this.uri);
    }
    delete() {
      mockCache.delete(this.uri);
      mockDeleted.push(this.uri);
    }
  }
  class Directory {
    uri: string;
    constructor(parent: { uri: string }, name: string) {
      this.uri = `${parent.uri}${name}/`;
    }
    get exists() {
      return true;
    }
    list() {
      return [...mockCache].filter((uri) => uri.startsWith(this.uri)).map((uri) => new File(uri));
    }
  }
  return { File, Directory, Paths: { cache: { uri: 'file:///cache/' } } };
});

const OWNER = '00000000-0000-4000-8000-0000000000d4';
const HANDLE = 'v1.sh04-test-handle';

const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
/**
 * A made-up baseline JPEG of `size` bytes the server's walk accepts (never a face): SOI, APP0, DQT, SOF0
 * 480 x 640, SOS, scan bytes with no `FF`, the end marker, then `after`.
 */
function jpeg(size: number, after: number[] = []): string {
  const head = [
    0xff, 0xd8,
    0xff, 0xe0, ...u16(16), 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xdb, ...u16(67), 0x00, ...Array.from({ length: 64 }, (_, i) => i + 1),
    0xff, 0xc0, ...u16(11), 0x08, ...u16(640), ...u16(480), 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, ...u16(8), 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
  ];
  const scan = Array.from({ length: Math.max(1, size - head.length - 2) }, (_, i) => (i * 13) % 251);
  return Buffer.from([...head, ...scan, 0xff, 0xd9, ...after]).toString('base64');
}

type Sent = { method: string; path: string; body: string };
let sent: Sent[] = [];
const ok = (data: unknown) => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  sent.push({ method: request.method, path, body: await request.clone().text() });
  if (request.method === 'GET' && path === '/money/identity/selfie') return ok({ matchedAt: null, checksLeft: 3 });
  if (request.method === 'POST' && path === '/money/identity/selfie') return ok({ matchedAt: '2026-10-08T10:05:00.000Z', checksLeft: 2 });
  if (path === '/money/wallet/open' || path === '/money/wallet') return ok({ state: 'open', account: null, limits: null });
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

function tokenFor(sub: string) {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
}

/** What A26 and A5 keep before A6: the passed check, its handle and the address. */
function keepOpening() {
  const kept = require('../keptCheck') as typeof import('../keptCheck');
  const identity = { bvn: { last4: '0111', verifiedAt: '2026-10-08T10:00:00.000Z' }, ninLast4: '0999', occupation: 'Filmmaker', checksLeft: 2 };
  const prefill = { firstName: 'Ada', middleName: 'B', lastName: 'Eze', dateOfBirth: '1992-10-04', gender: 'female' as const };
  kept.keepCheck(kept.ticketFor(OWNER), { checkHandle: HANDLE, identity, prefill });
  kept.keepAddress(kept.ticketFor(OWNER), { street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' });
}

const clients: QueryClient[] = [];

/** A6 as the route opens it: no capture handed in, so the phone's own (`useSelfieCapture`). */
async function boot() {
  const { SelfieScreen } = require('../SelfieScreen') as typeof import('../SelfieScreen');
  const props = { onBack: jest.fn(), onLeave: jest.fn(), onRestart: jest.fn(), onOpened: jest.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <SelfieScreen {...props} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  await rtl.waitFor(() => expect(rtl.screen.queryByTestId('open-wallet-selfie-loading')).toBeNull());
  return props;
}

const press = async (testID: string) => rtl.fireEvent.press(await rtl.screen.findByTestId(testID));
const matches = () => sent.filter((s) => s.method === 'POST' && s.path === '/money/identity/selfie');
const camera = () => rtl.screen.queryByTestId('open-wallet-selfie-camera', { includeHiddenElements: true });
const settle = () =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

/** A6 with the camera already allowed and showing in the oval. */
async function bootAllowed() {
  mockCamera.now = permission(true, true);
  const props = await boot();
  await rtl.waitFor(() => expect(camera()).toBeTruthy());
  return props;
}

beforeEach(() => {
  sent = [];
  mockDeleted.length = 0;
  mockCache.clear();
  Object.assign(mockCamera, { now: permission(false, true), answer: permission(true, true), asks: 0, pictures: [], picture: { width: 3000, height: 4000 }, takeFails: false, mountFails: false, released: 0 });
  Object.assign(mockEncoder, { sources: [], resizes: [], saves: [], outputs: [], rendered: null, released: 0 });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor(OWNER));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  (require('../keptCheck') as typeof import('../keptCheck')).forgetKeptCheck();
  (require('@/api/session') as typeof import('@/api/session')).resetSessionForTests();
  keepOpening();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await settle();
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe('A6 on the phone: the camera in the oval', () => {
  it('a user who has not allowed the camera taps Take selfie, is asked, and nothing is taken; once allowed, the front camera fills the oval', async () => {
    await boot();
    expect(rtl.screen.getByTestId('open-wallet-selfie-take')).toBeTruthy();
    expect(camera()).toBeNull();
    expect(rtl.screen.queryByTestId('open-wallet-oval-mask', { includeHiddenElements: true })).toBeNull();

    await press('open-wallet-selfie-take');
    expect(mockCamera.asks).toBe(1);
    expect(mockCamera.pictures).toHaveLength(0);
    expect(matches()).toHaveLength(0);

    await rtl.waitFor(() => expect(camera()).toBeTruthy());
    expect(camera()?.props.facing).toBe('front');
    // The page colour over the rectangle's corners: the live picture shows only inside the oval.
    expect(rtl.screen.getByTestId('open-wallet-oval-mask', { includeHiddenElements: true })).toBeTruthy();
    expect(rtl.screen.getByText('Fit your face in the oval')).toBeTruthy();
  });

  it('a user who allowed the camera before sees it in the oval at once, and one tap takes the selfie: brought down to 640, sent once as plain JPEG base64, and the account opens', async () => {
    const props = await bootAllowed();
    const image = jpeg(30_000);
    mockEncoder.outputs = [image];
    await press('open-wallet-selfie-take');
    await rtl.waitFor(() => expect(props.onOpened).toHaveBeenCalledTimes(1));

    expect(mockCamera.asks).toBe(0);
    // The camera's own image in memory, never a full-size file.
    expect(mockCamera.pictures).toEqual([{ pictureRef: true }]);
    expect(mockEncoder.resizes).toEqual([{ height: 640 }]);
    expect(mockEncoder.saves).toEqual([{ format: 'jpeg', compress: 0.85, base64: true }]);
    expect(matches()).toHaveLength(1);
    expect(JSON.parse(matches()[0].body)).toEqual({ image, checkHandle: HANDLE });
    // Nothing is kept: the encoder's file is deleted, and every native image is released.
    expect(mockDeleted).toEqual(['file:///cache/ImageManipulator/1.jpg']);
    expect(mockCamera.released).toBe(1);
    expect(mockEncoder.released).toBe(2);
  });

  it('the quality steps down until the capture fits the server’s 100,000 characters', async () => {
    await bootAllowed();
    const fits = jpeg(60_000);
    mockEncoder.outputs = [jpeg(80_000), jpeg(76_000), fits];
    await press('open-wallet-selfie-take');
    await rtl.waitFor(() => expect(matches()).toHaveLength(1));
    expect(mockEncoder.saves.map((save) => save.compress)).toEqual([0.85, 0.7, 0.55]);
    expect(JSON.parse(matches()[0].body).image).toBe(fits);
    expect(fits.length).toBeLessThanOrEqual(100_000);
    // Every file the encoder wrote is gone, the ones too large as well.
    expect(mockDeleted).toHaveLength(3);
  });

  it.each([
    ['still too large at the lowest quality', () => [jpeg(80_000), jpeg(80_000), jpeg(80_000), jpeg(80_000)]],
    ['with bytes after the image’s end', () => [jpeg(30_000, [0x00, 0x01])]],
    ['not a JPEG', () => [Buffer.from(Array.from({ length: 3000 }, (_, i) => i % 256)).toString('base64')]],
    ['smaller than a photo', () => [jpeg(400)]],
    ['empty', () => ['']],
  ])('a capture %s is never sent, and A6 asks for another', async (_, outputs) => {
    await bootAllowed();
    mockEncoder.outputs = outputs();
    await press('open-wallet-selfie-take');
    expect(await rtl.screen.findByText('That photo could not be used')).toBeTruthy();
    expect(matches()).toHaveLength(0);
    expect(rtl.screen.getByTestId('open-wallet-selfie-take')).toBeTruthy();
  });

  it('a capture still over 2,048 pixels a side after resizing is never sent', async () => {
    await bootAllowed();
    mockEncoder.rendered = { width: 2049, height: 1500 };
    mockEncoder.outputs = [jpeg(30_000)];
    await press('open-wallet-selfie-take');
    expect(await rtl.screen.findByText('That photo could not be used')).toBeTruthy();
    expect(mockEncoder.saves).toHaveLength(0);
    expect(matches()).toHaveLength(0);
  });

  it('a capture smaller than 640 is not enlarged', async () => {
    await bootAllowed();
    mockCamera.picture = { width: 480, height: 600 };
    mockEncoder.outputs = [jpeg(20_000)];
    await press('open-wallet-selfie-take');
    await rtl.waitFor(() => expect(matches()).toHaveLength(1));
    expect(mockEncoder.resizes).toEqual([]);
  });

  it('F3: an encoder that writes its file and then fails leaves nothing in the cache: the file it never named is deleted too', async () => {
    await bootAllowed();
    mockEncoder.outputs = [jpeg(80_000), 'write-then-fail'];
    await press('open-wallet-selfie-take');
    expect(await rtl.screen.findByText('That photo could not be used')).toBeTruthy();
    expect(matches()).toHaveLength(0);
    expect(mockDeleted).toEqual(['file:///cache/ImageManipulator/1.jpg', 'file:///cache/ImageManipulator/2.jpg']);
    expect(mockCache.size).toBe(0);
  });

  it('a picture the camera fails to take is not sent', async () => {
    await bootAllowed();
    mockCamera.takeFails = true;
    await press('open-wallet-selfie-take');
    expect(await rtl.screen.findByText('That photo could not be used')).toBeTruthy();
    expect(matches()).toHaveLength(0);
  });

  it('a user who turned the camera off is told how to turn it on, can open the phone’s settings, and is back to the camera when it is allowed there', async () => {
    mockCamera.now = permission(false, false);
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      listeners.push(listener as (state: string) => void);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await boot();
    expect(await rtl.screen.findByText('Allow your camera')).toBeTruthy();
    expect(rtl.screen.getByText("Turn on the camera for this app in your phone's settings, then take your selfie.")).toBeTruthy();
    expect(rtl.screen.queryByTestId('open-wallet-selfie-take')).toBeNull();
    await press('open-wallet-selfie-settings');
    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(mockCamera.asks).toBe(0);

    // Back from the settings with the camera allowed.
    mockCamera.now = permission(true, true);
    await rtl.act(async () => listeners.forEach((listener) => listener('active')));
    await rtl.waitFor(() => expect(camera()).toBeTruthy());
    expect(rtl.screen.getByTestId('open-wallet-selfie-take')).toBeTruthy();
    expect(rtl.screen.queryByText('Allow your camera')).toBeNull();
  });

  it('a phone whose camera will not start says so, sends nothing, and goes back to A5', async () => {
    mockCamera.now = permission(true, true);
    mockCamera.mountFails = true;
    const props = await boot();
    expect(await rtl.screen.findByTestId('open-wallet-selfie-no-camera')).toBeTruthy();
    expect(rtl.screen.getByText("We can't open your camera")).toBeTruthy();
    expect(rtl.screen.getByText("Your phone's camera did not start. Go back and try again.")).toBeTruthy();
    await press('open-wallet-selfie-back');
    expect(props.onBack).toHaveBeenCalledTimes(1);
    expect(matches()).toHaveLength(0);
  });
});
