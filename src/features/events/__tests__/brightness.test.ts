/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * R2-SOCIAL (h), CHECK-3 defect 8: E7's "Brightness goes up when this opens." was held back because `expo-brightness` was not in the
 * app. It is (package.json, row 8), so the note is true on a phone, and these tests are the proof: the screen goes to full brightness,
 * the person's own value comes back, and nothing is promised where the module does nothing.
 */
const mockBrightness = {
  available: true,
  current: 0.4,
  isAvailableAsync: jest.fn(async (): Promise<boolean> => mockBrightness.available),
  getBrightnessAsync: jest.fn(async (): Promise<number> => mockBrightness.current),
  setBrightnessAsync: jest.fn(async (_value: number): Promise<void> => undefined),
  restoreSystemBrightnessAsync: jest.fn(async (): Promise<void> => undefined),
};
jest.mock('expo-brightness', () => ({
  isAvailableAsync: () => mockBrightness.isAvailableAsync(),
  getBrightnessAsync: () => mockBrightness.getBrightnessAsync(),
  setBrightnessAsync: (value: number) => mockBrightness.setBrightnessAsync(value),
  restoreSystemBrightnessAsync: () => mockBrightness.restoreSystemBrightnessAsync(),
}));

const flush = () => new Promise((resolve) => setImmediate(resolve));

function load(os: 'ios' | 'android' | 'web') {
  const replaced: { restore: () => void }[] = [];
  const setOs = () => replaced.push(jest.replaceProperty((require('react-native') as typeof import('react-native')).Platform, 'OS', os));
  let loaded!: typeof import('../brightness');
  // The module is loaded in its own registry, with its own `react-native`; `Platform` is read again when it puts the screen back, from
  // the registry the test runs in, so the platform is set on both copies.
  jest.isolateModules(() => {
    setOs();
    loaded = require('../brightness') as typeof import('../brightness');
  });
  setOs();
  return { ...loaded, done: () => replaced.forEach((r) => r.restore()) };
}

beforeEach(() => {
  mockBrightness.available = true;
  mockBrightness.current = 0.4;
  mockBrightness.isAvailableAsync.mockClear();
  mockBrightness.getBrightnessAsync.mockClear();
  mockBrightness.setBrightnessAsync.mockClear();
  mockBrightness.restoreSystemBrightnessAsync.mockClear();
});

describe('E7 · the ticket screen\'s brightness', () => {
  it('a phone can do it, the web cannot, so the note is drawn on the phone only', () => {
    for (const [os, can] of [['ios', true], ['android', true], ['web', false]] as const) {
      const m = load(os);
      expect(m.canBoostBrightness).toBe(can);
      m.done();
    }
  });

  it('on iOS the screen goes to full brightness and the person\'s own value is written back on close', async () => {
    const m = load('ios');
    const putBack = m.boostBrightness();
    await flush();
    expect(mockBrightness.setBrightnessAsync).toHaveBeenCalledTimes(1);
    expect(mockBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
    putBack();
    await flush();
    expect(mockBrightness.setBrightnessAsync).toHaveBeenCalledTimes(2);
    expect(mockBrightness.setBrightnessAsync).toHaveBeenLastCalledWith(0.4);
    m.done();
  });

  it('on Android the activity stops overriding the system value on close', async () => {
    const m = load('android');
    const putBack = m.boostBrightness();
    await flush();
    expect(mockBrightness.setBrightnessAsync).toHaveBeenCalledWith(1);
    putBack();
    await flush();
    expect(mockBrightness.restoreSystemBrightnessAsync).toHaveBeenCalledTimes(1);
    expect(mockBrightness.setBrightnessAsync).toHaveBeenCalledTimes(1);
    m.done();
  });

  it('closing twice puts the screen back once', async () => {
    const m = load('ios');
    const putBack = m.boostBrightness();
    await flush();
    putBack();
    putBack();
    await flush();
    expect(mockBrightness.setBrightnessAsync).toHaveBeenCalledTimes(2);
    m.done();
  });

  it('closing before the raise lands never leaves the screen raised', async () => {
    const m = load('ios');
    let release!: () => void;
    mockBrightness.setBrightnessAsync.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)));
    const putBack = m.boostBrightness();
    await flush();
    putBack();
    release();
    await flush();
    expect(mockBrightness.setBrightnessAsync.mock.calls.map((c) => c[0])).toEqual([1, 0.4]);
    m.done();
  });

  it('closing before the phone has even answered changes nothing', async () => {
    const m = load('ios');
    const putBack = m.boostBrightness();
    putBack();
    await flush();
    expect(mockBrightness.setBrightnessAsync).not.toHaveBeenCalled();
    m.done();
  });

  it('a phone that cannot change its brightness is left alone', async () => {
    mockBrightness.available = false;
    const m = load('ios');
    const putBack = m.boostBrightness();
    await flush();
    putBack();
    await flush();
    expect(mockBrightness.setBrightnessAsync).not.toHaveBeenCalled();
    expect(mockBrightness.restoreSystemBrightnessAsync).not.toHaveBeenCalled();
    m.done();
  });

  it('a refused call leaves the ticket showing: nothing is thrown', async () => {
    mockBrightness.setBrightnessAsync.mockRejectedValueOnce(new Error('refused'));
    const m = load('ios');
    const putBack = m.boostBrightness();
    await flush();
    expect(() => putBack()).not.toThrow();
    await flush();
    expect(mockBrightness.setBrightnessAsync).toHaveBeenCalledTimes(1);
    m.done();
  });
});
