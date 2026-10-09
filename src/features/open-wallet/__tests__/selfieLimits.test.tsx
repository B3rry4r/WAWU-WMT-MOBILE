/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * A6's phone capture against the server's limits, each limit pinned at its boundary, plus the permission
 * flow through `useSelfieCapture` alone (SHARED-04, lead ruling T1). Copied from the verifier's
 * `zzVerifierSelfie.test.tsx` (evidence folder vsh04/specs, 8 Oct 2026) with three changes: the fixture
 * JPEGs are ones the server's walk accepts (the phone now walks them as the server does, F1); V-S7 now
 * expects a JPEG with a second JPEG appended to be refused (F1); V-S13, which read the verifier's encoder
 * samples from outside the repo, is not copied (the samples were checked once against the new walk; see the
 * builder report).
 */
import * as rtl from '@testing-library/react-native';
import { createElement } from 'react';
import { AppState, Linking } from 'react-native';

type Permission = { granted: boolean; canAskAgain: boolean; status: string; expires: 'never' };
const perm = (granted: boolean, canAskAgain: boolean): Permission => ({ granted, canAskAgain, status: granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied', expires: 'never' });

const mockCam = {
  now: perm(false, true) as Permission,
  answer: perm(true, true) as Permission,
  asks: 0,
  gets: 0,
  takes: 0,
  ready: true,
  mountFails: false,
  takeFails: false,
  picture: { width: 3000, height: 4000 },
  released: 0,
};

jest.mock('expo-camera', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  function useCameraPermissions() {
    const [status, setStatus] = React.useState<unknown>(null);
    const request = React.useCallback(async () => {
      mockCam.asks += 1;
      mockCam.now = mockCam.answer;
      setStatus(mockCam.now);
      return mockCam.now;
    }, []);
    const get = React.useCallback(async () => {
      mockCam.gets += 1;
      setStatus(mockCam.now);
      return mockCam.now;
    }, []);
    React.useEffect(() => {
      void get();
    }, [get]);
    return [status, request, get];
  }
  const CameraView = React.forwardRef<unknown, { onCameraReady?: () => void; onMountError?: (e: unknown) => void; testID?: string }>(function CameraView(props, ref) {
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: async () => {
        mockCam.takes += 1;
        if (mockCam.takeFails) throw new Error('capture failed');
        return { ...mockCam.picture, release: () => (mockCam.released += 1) };
      },
    }));
    React.useEffect(() => {
      if (mockCam.mountFails) props.onMountError?.({ message: 'no camera' });
      else if (mockCam.ready) props.onCameraReady?.();
    }, [props]);
    return React.createElement(View, { testID: 'cam' });
  });
  return { CameraView, useCameraPermissions };
});

const mockEnc = {
  resizes: [] as unknown[],
  saves: [] as number[],
  outputs: [] as (string | Error)[],
  rendered: null as null | { width: number; height: number },
  renderFails: false,
  releasedImage: 0,
  releasedContext: 0,
  uris: [] as string[],
};
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
  ImageManipulator: {
    manipulate: (source: { width: number; height: number }) => {
      let size = { width: source.width, height: source.height };
      const context = {
        resize: (to: { width?: number; height?: number }) => {
          mockEnc.resizes.push(to);
          const scale = to.width ? to.width / size.width : (to.height as number) / size.height;
          size = { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
          return context;
        },
        renderAsync: async () => {
          if (mockEnc.renderFails) throw new Error('render failed');
          const shown = mockEnc.rendered ?? size;
          return {
            ...shown,
            saveAsync: async (o: { compress: number }) => {
              mockEnc.saves.push(o.compress);
              const next = mockEnc.outputs.shift();
              if (next instanceof Error) throw next;
              const uri = `file:///cache/ImageManipulator/v${mockEnc.saves.length}.jpg`;
              mockEnc.uris.push(uri);
              mockFs.cache.add(uri);
              return { uri, ...shown, base64: next };
            },
            release: () => (mockEnc.releasedImage += 1),
          };
        },
        release: () => (mockEnc.releasedContext += 1),
      };
      return context;
    },
  },
}));

/** The files in the manipulator's cache folder (`cache`), and the ones deleted. */
const mockFs = { deleted: [] as string[], deleteThrows: false, cache: new Set<string>() };
jest.mock('expo-file-system', () => {
  class File {
    uri: string;
    exists = true;
    constructor(uri: string) {
      this.uri = uri;
    }
    delete() {
      if (mockFs.deleteThrows) throw new Error('cannot delete');
      mockFs.cache.delete(this.uri);
      mockFs.deleted.push(this.uri);
    }
  }
  class Directory {
    uri: string;
    exists = true;
    constructor(parent: { uri: string }, name: string) {
      this.uri = `${parent.uri}${name}/`;
    }
    list() {
      return [...mockFs.cache].map((uri) => new File(uri));
    }
  }
  return { File, Directory, Paths: { cache: { uri: 'file:///cache/' } } };
});

const { encodeSelfie, useSelfieCapture } = require('../selfie/capture') as typeof import('../selfie/capture');
const { selfieResize } = require('../selfie/encoding') as typeof import('../selfie/encoding');
const { SELFIE_MIN_BASE64_CHARS } = require('../api/opening') as typeof import('../api/opening');

const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
/**
 * A made-up JPEG of exactly `bytes` bytes (at least 114) that the server's walk accepts: SOI, APP0, DQT,
 * SOF0 480 x 640, SOS, scan bytes with no `FF`, EOI, then `after`.
 */
function jpegBytes(bytes: number, after: number[] = []): Buffer {
  const head = [
    0xff, 0xd8,
    0xff, 0xe0, ...u16(16), 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xdb, ...u16(67), 0x00, ...Array.from({ length: 64 }, (_, i) => i + 1),
    0xff, 0xc0, ...u16(11), 0x08, ...u16(640), ...u16(480), 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, ...u16(8), 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
  ];
  const scan = Array.from({ length: Math.max(1, bytes - head.length - 2) }, (_, i) => (i * 13) % 251);
  return Buffer.from([...head, ...scan, 0xff, 0xd9, ...after]);
}
const jpeg = (bytes: number, after: number[] = []) => jpegBytes(bytes, after).toString('base64');
/** A JPEG whose base64 is exactly `chars` long (chars a multiple of 4; no padding). */
const jpegChars = (chars: number) => jpeg((chars / 4) * 3);

const picture = (w = 3000, h = 4000) => ({ width: w, height: h, release: jest.fn() }) as unknown as Parameters<typeof encodeSelfie>[0];

beforeEach(() => {
  Object.assign(mockEnc, { resizes: [], saves: [], outputs: [], rendered: null, renderFails: false, releasedImage: 0, releasedContext: 0, uris: [] });
  Object.assign(mockFs, { deleted: [], deleteThrows: false });
  mockFs.cache.clear();
  Object.assign(mockCam, { now: perm(false, true), answer: perm(true, true), asks: 0, gets: 0, takes: 0, ready: true, mountFails: false, takeFails: false, picture: { width: 3000, height: 4000 }, released: 0 });
});

describe('A6 limits, at each boundary (from the verifier, T1)', () => {
  it('V-S1 exactly 100,000 base64 characters is sent at the first quality', async () => {
    const at = jpegChars(100_000);
    expect(at.length).toBe(100_000);
    mockEnc.outputs = [at];
    await expect(encodeSelfie(picture())).resolves.toBe(at);
    expect(mockEnc.saves).toEqual([0.85]);
  });

  it('V-S2 100,004 characters steps down, and the 0.7 capture is the one sent; both files deleted', async () => {
    const over = jpegChars(100_004);
    const fits = jpegChars(99_996);
    mockEnc.outputs = [over, fits];
    await expect(encodeSelfie(picture())).resolves.toBe(fits);
    expect(mockEnc.saves).toEqual([0.85, 0.7]);
    expect(mockFs.deleted).toEqual(mockEnc.uris);
    expect(mockFs.deleted).toHaveLength(2);
  });

  it('V-S3 the quality floor is 0.4: exactly four tries, the fourth may be sent, a fifth is never tried', async () => {
    const over = jpegChars(100_004);
    const fourth = jpegChars(60_000);
    mockEnc.outputs = [over, over, over, fourth];
    await expect(encodeSelfie(picture())).resolves.toBe(fourth);
    expect(mockEnc.saves).toEqual([0.85, 0.7, 0.55, 0.4]);
    mockEnc.saves = [];
    mockEnc.outputs = [over, over, over, over, jpegChars(60_000)];
    await expect(encodeSelfie(picture())).resolves.toBeNull();
    expect(mockEnc.saves).toEqual([0.85, 0.7, 0.55, 0.4]);
    expect(mockFs.deleted).toHaveLength(8);
  });

  it('V-S4 2,048 pixels a side is taken; 2,049 is refused before anything is written', async () => {
    mockEnc.rendered = { width: 2048, height: 1536 };
    mockEnc.outputs = [jpegChars(40_000)];
    await expect(encodeSelfie(picture())).resolves.toEqual(expect.any(String));
    mockEnc.rendered = { width: 1536, height: 2049 };
    mockEnc.saves = [];
    await expect(encodeSelfie(picture())).resolves.toBeNull();
    expect(mockEnc.saves).toEqual([]);
  });

  it('V-S5 the smallest: 1,024 bytes is sent, 1,023 is not; the server would take 1,000 (the phone is stricter)', async () => {
    expect(SELFIE_MIN_BASE64_CHARS).toBe(1368);
    mockEnc.outputs = [jpeg(1024)];
    await expect(encodeSelfie(picture(400, 300))).resolves.toEqual(expect.any(String));
    mockEnc.outputs = [jpeg(1023)];
    await expect(encodeSelfie(picture(400, 300))).resolves.toBeNull();
    mockEnc.outputs = [jpeg(1000)];
    await expect(encodeSelfie(picture(400, 300))).resolves.toBeNull();
  });

  it('V-S6 bytes after the end marker, a missing end, a base64 with line breaks, or a data: prefix are never sent', async () => {
    for (const bad of [jpeg(30_000, [0x00]), jpeg(30_000, [0xff, 0xd9, 0x00]), jpegBytes(30_000).subarray(0, 29_998).toString('base64'), jpeg(30_000).replace(/(.{76})/g, '$1\n'), `data:image/jpeg;base64,${jpeg(30_000)}`]) {
      mockEnc.outputs = [bad];
      await expect(encodeSelfie(picture())).resolves.toBeNull();
    }
  });

  it('V-S7 (F1) a JPEG with a second JPEG appended ends in FF D9, but the phone walks it as the server does and refuses it', async () => {
    const appended = Buffer.concat([jpegBytes(20_000), jpegBytes(5_000)]).toString('base64');
    mockEnc.outputs = [appended];
    await expect(encodeSelfie(picture())).resolves.toBeNull();
    // The same first JPEG alone is sent.
    const alone = jpegBytes(20_000).toString('base64');
    mockEnc.outputs = [alone];
    await expect(encodeSelfie(picture())).resolves.toBe(alone);
  });

  it('V-S8 the resize: the long side to 640 whatever the orientation, never up', () => {
    expect(selfieResize(4000, 3000)).toEqual({ width: 640 });
    expect(selfieResize(3000, 4000)).toEqual({ height: 640 });
    expect(selfieResize(10_000, 7_500)).toEqual({ width: 640 });
    expect(selfieResize(641, 10)).toEqual({ width: 640 });
    expect(selfieResize(640, 640)).toBeNull();
    expect(selfieResize(1, 1)).toBeNull();
  });

  it('V-S9 a 1x1 capture is not enlarged, and its tiny JPEG is never sent', async () => {
    mockEnc.outputs = [jpeg(300)];
    await expect(encodeSelfie(picture(1, 1))).resolves.toBeNull();
    expect(mockEnc.resizes).toEqual([]);
  });

  it('V-S10 an encoder that fails on the second quality: the first file is deleted, the error goes up, every native image released', async () => {
    mockEnc.outputs = [jpegChars(100_004), new Error('disk full')];
    await expect(encodeSelfie(picture())).rejects.toThrow('disk full');
    expect(mockFs.deleted).toEqual(['file:///cache/ImageManipulator/v1.jpg']);
    expect(mockEnc.releasedImage).toBe(1);
    expect(mockEnc.releasedContext).toBe(1);
  });

  it('V-S11 a cache file that cannot be deleted does not stop the capture', async () => {
    mockFs.deleteThrows = true;
    const ok = jpegChars(40_000);
    mockEnc.outputs = [ok];
    await expect(encodeSelfie(picture())).resolves.toBe(ok);
  });

  it('V-S12 a render that fails releases the context', async () => {
    mockEnc.renderFails = true;
    await expect(encodeSelfie(picture())).rejects.toThrow('render failed');
    expect(mockEnc.releasedContext).toBe(1);
  });
});

describe('A6 permission flow, useSelfieCapture alone (from the verifier, T1)', () => {
  type Ready = Extract<ReturnType<typeof useSelfieCapture>, { kind: 'ready' }>;
  async function mount() {
    return await rtl.renderHook(() => useSelfieCapture());
  }
  const ready = (h: { result: { current: ReturnType<typeof useSelfieCapture> } }) => h.result.current as Ready;

  it('V-P1 the first tap only asks: no picture, and the camera mounts once allowed', async () => {
    const h = await mount();
    await rtl.waitFor(() => expect(mockCam.gets).toBeGreaterThan(0));
    expect(ready(h).Preview).toBeUndefined();
    let out: unknown;
    await rtl.act(async () => {
      out = await ready(h).take();
    });
    expect(out).toEqual({ kind: 'cancelled' });
    expect(mockCam.asks).toBe(1);
    expect(mockCam.takes).toBe(0);
    await rtl.waitFor(() => expect(ready(h).Preview).toBeDefined());
  });

  it('V-P2 refused once but the phone will ask again: no settings button, the next tap asks again', async () => {
    mockCam.answer = perm(false, true);
    const h = await mount();
    await rtl.waitFor(() => expect(mockCam.gets).toBeGreaterThan(0));
    await rtl.act(async () => {
      await ready(h).take();
    });
    expect(ready(h).settings).toBeUndefined();
    await rtl.act(async () => {
      await ready(h).take();
    });
    expect(mockCam.asks).toBe(2);
    expect(mockCam.takes).toBe(0);
  });

  it('V-P3 turned off for good: settings offered; back still off keeps it; back allowed brings the camera', async () => {
    mockCam.now = perm(false, false);
    const listeners: ((s: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, l) => {
      listeners.push(l as (s: string) => void);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const h = await mount();
    await rtl.waitFor(() => expect(ready(h).settings).toBeDefined());
    ready(h).settings?.();
    expect(open).toHaveBeenCalledTimes(1);
    await rtl.act(async () => listeners.forEach((l) => l('active')));
    expect(ready(h).settings).toBeDefined();
    mockCam.now = perm(true, true);
    await rtl.act(async () => listeners.forEach((l) => l('active')));
    await rtl.waitFor(() => expect(ready(h).Preview).toBeDefined());
    expect(ready(h).settings).toBeUndefined();
    jest.restoreAllMocks();
  });

  it('V-P4 a tap before the camera has started takes nothing', async () => {
    mockCam.now = perm(true, true);
    mockCam.ready = false;
    const h = await mount();
    await rtl.waitFor(() => expect(ready(h).Preview).toBeDefined());
    const Preview = ready(h).Preview as React.ComponentType;
    await rtl.render(createElement(Preview));
    let out: unknown;
    await rtl.act(async () => {
      out = await ready(h).take();
    });
    expect(out).toEqual({ kind: 'cancelled' });
    expect(mockCam.takes).toBe(0);
  });

  it('V-P5 a capture that fails is unusable and nothing is encoded; an encoding refused releases the picture once', async () => {
    mockCam.now = perm(true, true);
    const h = await mount();
    await rtl.waitFor(() => expect(ready(h).Preview).toBeDefined());
    await rtl.render(createElement(ready(h).Preview as React.ComponentType));
    mockCam.takeFails = true;
    let out: unknown;
    await rtl.act(async () => {
      out = await ready(h).take();
    });
    expect(out).toEqual({ kind: 'unusable' });
    expect(mockEnc.saves).toEqual([]);
    mockCam.takeFails = false;
    mockEnc.outputs = [jpeg(300)];
    await rtl.act(async () => {
      out = await ready(h).take();
    });
    expect(out).toEqual({ kind: 'unusable' });
    expect(mockCam.released).toBe(1);
  });

  it('V-P6 a camera that will not start makes the capture unavailable', async () => {
    mockCam.now = perm(true, true);
    mockCam.mountFails = true;
    const h = await mount();
    await rtl.waitFor(() => expect(ready(h).Preview).toBeDefined());
    await rtl.render(createElement(ready(h).Preview as React.ComponentType));
    await rtl.waitFor(() => expect(h.result.current.kind).toBe('unavailable'));
  });
});
