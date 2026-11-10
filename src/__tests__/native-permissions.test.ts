/**
 * MIC-PERMS: the native permissions the app's code needs are in the build, and no plugin option takes one away.
 *
 * The owner's Android build (30 Oct 2026) never asked for the microphone. `app.json` passed `microphonePermission: false` to
 * `expo-image-picker` (its plugin then blocks RECORD_AUDIO with tools:node="remove") and to `expo-camera` (its plugin deletes the
 * iPhone microphone text), and both overrode `expo-audio`, so no recording in the app could ever ask. Nothing in jest saw it,
 * because jest never builds the manifest. This runs the real `expo config --type introspect`, which applies every config plugin
 * in `app.json` the way a build does, and reads the Android manifest and the iPhone Info.plist it would write.
 *
 * It asserts: RECORD_AUDIO and CAMERA are in the manifest and not removed; the three iPhone usage texts are there, are not empty and
 * are not a library's default sentence (ours won); and no permission the code under `src/` needs is blocked. A new Expo module
 * that asks for a permission this file does not know fails until it is added to `NEEDS`.
 *
 * NATIVE-FIX (30 Oct 2026) adds the rest of what the one store build must carry, so none of it can be dropped by a later `app.json`
 * edit: the iPhone `audio` background mode (UIBackgroundModes) and the Android media-playback foreground service permissions, so what a
 * person listens to keeps playing when the screen locks (R-115); `ITSAppUsesNonExemptEncryption` false, so TestFlight does not stop
 * on the export question; and the app-level privacy manifest with the four required-reason categories Apple asks for. The manifest is
 * written by a build step the introspect does not run, so it is read from `ios.privacyManifests` and checked through Expo's own
 * `mergePrivacyInfo`, the function that writes `PrivacyInfo.xcprivacy`.
 *
 * To run the same check on another project folder (for example an old `app.json` in a copy of this project): set
 * NATIVE_PERMS_ROOT to that folder.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(__dirname, '..', '..');
const projectRoot = process.env.NATIVE_PERMS_ROOT ? path.resolve(process.env.NATIVE_PERMS_ROOT) : repo;

const RECORD_AUDIO = 'android.permission.RECORD_AUDIO';
const CAMERA = 'android.permission.CAMERA';
const FOREGROUND_SERVICE = 'android.permission.FOREGROUND_SERVICE';
const FOREGROUND_SERVICE_MEDIA_PLAYBACK = 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK';
/** The permissions background listening needs on Android (R-115): the media-playback foreground service and its type. */
const BACKGROUND_AUDIO_ANDROID = [FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK] as const;
/** The required-reason API categories the app's privacy manifest declares, and the reason code for each (Apple's list). */
export const PRIVACY_CATEGORIES: Record<string, string> = {
  NSPrivacyAccessedAPICategoryUserDefaults: 'CA92.1',
  NSPrivacyAccessedAPICategoryFileTimestamp: 'C617.1',
  NSPrivacyAccessedAPICategoryDiskSpace: 'E174.1',
  NSPrivacyAccessedAPICategorySystemBootTime: '35F9.1',
};
const REQUIRED_IOS = ['NSMicrophoneUsageDescription', 'NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription'] as const;

/** The sentences the Expo plugins write when `app.json` gives them no text. Seeing one means our own text lost. */
const LIBRARY_DEFAULTS = [
  'Allow $(PRODUCT_NAME) to access your microphone',
  'Allow $(PRODUCT_NAME) to access your camera',
  'Allow $(PRODUCT_NAME) to access your photos',
];

type UsesPermission = { $?: Record<string, string> };
type PrivacyManifests = { NSPrivacyAccessedAPITypes?: { NSPrivacyAccessedAPIType?: unknown; NSPrivacyAccessedAPITypeReasons?: unknown }[] };
export type Introspected = {
  android?: { blockedPermissions?: string[] };
  ios?: { privacyManifests?: PrivacyManifests };
  _internal?: {
    modResults?: {
      android?: { manifest?: { manifest?: Record<string, UsesPermission[] | undefined> } };
      ios?: { infoPlist?: Record<string, unknown> };
    };
  };
};

/** What a source file's use of an Expo module needs from the phone. `api` narrows a module that is used for more than one thing. */
type Need = { module: string; api?: RegExp; android: string[]; ios: string[]; for: string };
const NEEDS: Need[] = [
  { module: 'expo-audio', api: /\b(useAudioRecorder|requestRecordingPermissionsAsync|getRecordingPermissionsAsync)\b/, android: [RECORD_AUDIO], ios: ['NSMicrophoneUsageDescription'], for: 'recording a voice' },
  { module: 'expo-camera', android: [CAMERA], ios: ['NSCameraUsageDescription'], for: 'the camera view' },
  { module: 'expo-image-picker', api: /\b(launchCameraAsync|requestCameraPermissionsAsync|getCameraPermissionsAsync)\b/, android: [CAMERA], ios: ['NSCameraUsageDescription'], for: 'taking a photo' },
  { module: 'expo-image-picker', api: /\blaunchImageLibraryAsync\b/, android: [], ios: ['NSPhotoLibraryUsageDescription'], for: 'choosing a photo' },
  { module: 'expo-media-library', android: [], ios: ['NSPhotoLibraryAddUsageDescription'], for: 'saving a picture' },
  { module: 'expo-local-authentication', android: ['android.permission.USE_BIOMETRIC'], ios: ['NSFaceIDUsageDescription'], for: 'fingerprint or face approval' },
  { module: 'expo-calendar', api: /\b(requestCalendarPermissionsAsync|getCalendarsAsync|createEventAsync|updateEventAsync|deleteEventAsync)\b/, android: ['android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR'], ios: ['NSCalendarsUsageDescription'], for: 'reading or writing the calendar' },
  { module: 'expo-calendar', android: [], ios: ['NSCalendarsWriteOnlyAccessUsageDescription'], for: 'adding an event through the calendar sheet' },
];

/** Modules that ask the person for something this file does not map: importing one is a failure until it is mapped above. */
const UNMAPPED = ['expo-location', 'expo-contacts', 'expo-sensors', 'expo-tracking-transparency', 'expo-barcode-scanner', 'expo-av', 'expo-speech-recognition'];

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' || entry.name === '__mocks__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

/** Reads the code under `src/` and answers what it needs from the phone, and the modules nobody mapped. */
export function codeNeeds(src: string): { android: Map<string, string>; ios: Map<string, string>; unmapped: string[] } {
  const android = new Map<string, string>();
  const ios = new Map<string, string>();
  const unmapped = new Set<string>();
  for (const file of sourceFiles(src)) {
    const text = fs.readFileSync(file, 'utf8');
    const relative = path.relative(path.dirname(src), file);
    for (const need of NEEDS) {
      const imported = new RegExp(`from '${need.module}(/[a-z]+)?'`).test(text);
      if (!imported || (need.api && !need.api.test(text))) continue;
      const why = `${relative} (${need.for})`;
      need.android.forEach((permission) => android.set(permission, android.get(permission) ?? why));
      need.ios.forEach((key) => ios.set(key, ios.get(key) ?? why));
    }
    for (const module of UNMAPPED) {
      if (new RegExp(`from '${module}(/[a-z]+)?'`).test(text)) unmapped.add(`${module} in ${relative}`);
    }
  }
  return { android, ios, unmapped: [...unmapped] };
}

/** The permissions in the Android manifest the build would write: `present` are asked for, `removed` carry tools:node="remove". */
export function manifestPermissions(config: Introspected): { present: Set<string>; removed: Set<string> } {
  const manifest = config._internal?.modResults?.android?.manifest?.manifest ?? {};
  const entries = [...(manifest['uses-permission'] ?? []), ...(manifest['uses-permission-sdk-23'] ?? [])];
  const present = new Set<string>();
  const removed = new Set<string>();
  for (const entry of entries) {
    const name = entry.$?.['android:name'];
    if (!name) continue;
    (entry.$?.['tools:node'] === 'remove' ? removed : present).add(name);
  }
  // `android.blockedPermissions` is what the plugins asked to block; it is the same list before it reaches the manifest.
  (config.android?.blockedPermissions ?? []).forEach((name) => removed.add(name));
  return { present, removed };
}

/**
 * Expo's own merge writes `PrivacyInfo.xcprivacy` from `ios.privacyManifests`. Run on the config, it is the file's contents: every
 * category in `PRIVACY_CATEGORIES` must be in it with its reason, and every entry must be the shape Expo's schema gives (a string
 * category and a list of string reasons, nothing else).
 */
export function privacyManifestProblems(manifests: PrivacyManifests | undefined): string[] {
  if (!manifests || !Array.isArray(manifests.NSPrivacyAccessedAPITypes) || manifests.NSPrivacyAccessedAPITypes.length === 0) {
    return ['iOS: ios.privacyManifests is missing, so the build has no app-level privacy manifest (PrivacyInfo.xcprivacy)'];
  }
  const problems: string[] = [];
  for (const entry of manifests.NSPrivacyAccessedAPITypes) {
    const reasons = entry.NSPrivacyAccessedAPITypeReasons;
    const keys = Object.keys(entry).sort().join(',');
    if (typeof entry.NSPrivacyAccessedAPIType !== 'string' || !Array.isArray(reasons) || reasons.some((r) => typeof r !== 'string') || keys !== 'NSPrivacyAccessedAPIType,NSPrivacyAccessedAPITypeReasons') {
      problems.push(`iOS: a privacy manifest entry is not {NSPrivacyAccessedAPIType: string, NSPrivacyAccessedAPITypeReasons: string[]}: ${JSON.stringify(entry)}`);
    }
  }
  if (problems.length > 0) return problems;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mergePrivacyInfo } = require('@expo/config-plugins/build/ios/PrivacyInfo') as { mergePrivacyInfo: (existing: object, manifests: PrivacyManifests) => { NSPrivacyAccessedAPITypes: { NSPrivacyAccessedAPIType: string; NSPrivacyAccessedAPITypeReasons: string[] }[] } };
  const written = mergePrivacyInfo({}, manifests).NSPrivacyAccessedAPITypes;
  for (const [category, reason] of Object.entries(PRIVACY_CATEGORIES)) {
    const found = written.find((entry) => entry.NSPrivacyAccessedAPIType === category);
    if (!found) problems.push(`iOS: the privacy manifest does not declare ${category}`);
    else if (!found.NSPrivacyAccessedAPITypeReasons.includes(reason)) problems.push(`iOS: the privacy manifest declares ${category} without the reason ${reason}`);
  }
  return problems;
}

/** Every reason this build cannot ask for what the app's code needs. An empty list is a pass. */
export function permissionProblems(config: Introspected, needs: ReturnType<typeof codeNeeds>): string[] {
  const problems: string[] = [];
  const { present, removed } = manifestPermissions(config);
  const plist = config._internal?.modResults?.ios?.infoPlist ?? {};

  for (const permission of [RECORD_AUDIO, CAMERA]) {
    if (removed.has(permission)) problems.push(`Android: ${permission} is blocked (tools:node="remove"); a plugin option such as microphonePermission: false or cameraPermission: false does this`);
    else if (!present.has(permission)) problems.push(`Android: ${permission} is not in the manifest`);
  }
  for (const permission of BACKGROUND_AUDIO_ANDROID) {
    if (removed.has(permission)) problems.push(`Android: ${permission} is blocked (tools:node="remove"); a piece the person listens to would stop when the screen locks`);
    else if (!present.has(permission)) problems.push(`Android: ${permission} is not in the manifest; enableBackgroundPlayback on expo-audio is off, so a piece stops when the screen locks`);
  }
  const backgroundModes = plist.UIBackgroundModes;
  if (!Array.isArray(backgroundModes) || !backgroundModes.includes('audio')) problems.push('iOS: UIBackgroundModes does not contain audio; enableBackgroundPlayback on expo-audio is off, so a piece stops when the screen locks');
  if (plist.ITSAppUsesNonExemptEncryption !== false) problems.push('iOS: ITSAppUsesNonExemptEncryption is not false (ios.config.usesNonExemptEncryption), so every iPhone build waits on the export question');
  problems.push(...privacyManifestProblems(config.ios?.privacyManifests));
  for (const key of REQUIRED_IOS) {
    const value = plist[key];
    if (typeof value !== 'string' || value.trim() === '') problems.push(`iOS: ${key} is missing or empty in Info.plist`);
    else if (LIBRARY_DEFAULTS.includes(value)) problems.push(`iOS: ${key} is a plugin's default sentence, not ours ("${value}")`);
  }
  for (const [permission, why] of needs.android) {
    if (removed.has(permission)) problems.push(`Android: ${permission} is blocked but the code needs it: ${why}`);
    else if (!present.has(permission) && ![RECORD_AUDIO, CAMERA].includes(permission)) problems.push(`Android: ${permission} is not in the manifest but the code needs it: ${why}`);
  }
  for (const [key, why] of needs.ios) {
    const value = plist[key];
    if (typeof value !== 'string' || value.trim() === '') problems.push(`iOS: ${key} is missing or empty but the code needs it: ${why}`);
  }
  for (const item of needs.unmapped) problems.push(`${item} asks for a permission this check does not know: add it to NEEDS`);
  return problems;
}

/** The real thing: Expo applies every plugin in app.json and answers the manifest and Info.plist it would write. */
function introspect(root: string): Introspected {
  const run = spawnSync(path.join(repo, 'node_modules', '.bin', 'expo'), ['config', '--type', 'introspect', '--json', root], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, EXPO_OFFLINE: '1', EXPO_NO_TELEMETRY: '1', CI: '1', FORCE_COLOR: '0' },
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.status !== 0) throw new Error(`expo config failed (${run.status}): ${run.stderr || run.error}`);
  const start = run.stdout.search(/^\{/m);
  return JSON.parse(run.stdout.slice(Math.max(0, start))) as Introspected;
}

describe('native permissions (the build that expo prebuild would make)', () => {
  const needs = codeNeeds(path.join(repo, 'src'));

  it('the real introspected config asks for the camera and the microphone and blocks nothing the code needs', () => {
    const problems = permissionProblems(introspect(projectRoot), needs);
    expect(problems).toEqual([]);
  }, 120_000);

  it('reads what the code needs: the recorder needs the microphone, the cameras need the camera, the pickers need photos', () => {
    expect([...needs.android.keys()]).toEqual(expect.arrayContaining([RECORD_AUDIO, CAMERA]));
    expect([...needs.ios.keys()]).toEqual(expect.arrayContaining([...REQUIRED_IOS, 'NSPhotoLibraryAddUsageDescription']));
    expect(needs.unmapped).toEqual([]);
  });

  describe('the check itself, on the shapes a build can have', () => {
    const goodPermissions = (): UsesPermission[] => [RECORD_AUDIO, CAMERA, 'android.permission.USE_BIOMETRIC', ...BACKGROUND_AUDIO_ANDROID].map((name) => ({ $: { 'android:name': name } }));
    const goodManifests = (): PrivacyManifests => ({
      NSPrivacyAccessedAPITypes: Object.entries(PRIVACY_CATEGORIES).map(([NSPrivacyAccessedAPIType, reason]) => ({ NSPrivacyAccessedAPIType, NSPrivacyAccessedAPITypeReasons: [reason] })),
    });
    const config = (over: { permissions?: UsesPermission[]; plist?: Record<string, unknown>; blocked?: string[]; manifests?: PrivacyManifests | null } = {}): Introspected => ({
      android: { blockedPermissions: over.blocked ?? [] },
      ios: over.manifests === null ? {} : { privacyManifests: over.manifests ?? goodManifests() },
      _internal: {
        modResults: {
          android: { manifest: { manifest: { 'uses-permission': over.permissions ?? goodPermissions() } } },
          ios: {
            infoPlist: over.plist ?? {
              NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to use your microphone to record your voice.',
              NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to use your camera.',
              NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to open your photos.',
              NSPhotoLibraryAddUsageDescription: 'Allow $(PRODUCT_NAME) to save a picture to your photos.',
              NSFaceIDUsageDescription: 'Allow $(PRODUCT_NAME) to use Face ID.',
              NSCalendarsWriteOnlyAccessUsageDescription: 'Allow $(PRODUCT_NAME) to add an event.',
              UIBackgroundModes: ['audio'],
              ITSAppUsesNonExemptEncryption: false,
            },
          },
        },
      },
    });

    it('passes a build that asks for both and has every text', () => {
      expect(permissionProblems(config(), needs)).toEqual([]);
    });

    it('the 30 Oct build fails: RECORD_AUDIO removed in the manifest and no microphone text on the iPhone', () => {
      const old = config({
        permissions: [{ $: { 'android:name': CAMERA } }, { $: { 'android:name': 'android.permission.USE_BIOMETRIC' } }, { $: { 'android:name': RECORD_AUDIO, 'tools:node': 'remove' } }],
        plist: { NSCameraUsageDescription: 'x', NSPhotoLibraryUsageDescription: 'x', NSPhotoLibraryAddUsageDescription: 'x', NSFaceIDUsageDescription: 'x', NSCalendarsWriteOnlyAccessUsageDescription: 'x' },
      });
      const problems = permissionProblems(old, needs);
      expect(problems.join('\n')).toContain(`Android: ${RECORD_AUDIO} is blocked`);
      expect(problems.join('\n')).toContain('iOS: NSMicrophoneUsageDescription is missing or empty');
    });

    it('fails a camera that is blocked, a permission only in blockedPermissions, an empty text and a plugin default', () => {
      expect(permissionProblems(config({ permissions: [{ $: { 'android:name': RECORD_AUDIO } }, { $: { 'android:name': 'android.permission.USE_BIOMETRIC' } }] }), needs).join('\n')).toContain(`${CAMERA} is not in the manifest`);
      expect(permissionProblems(config({ blocked: [CAMERA] }), needs).join('\n')).toContain(`${CAMERA} is blocked`);
      const emptyText = { NSMicrophoneUsageDescription: ' ', NSCameraUsageDescription: 'ok', NSPhotoLibraryUsageDescription: 'ok', NSPhotoLibraryAddUsageDescription: 'ok', NSFaceIDUsageDescription: 'ok', NSCalendarsWriteOnlyAccessUsageDescription: 'ok' };
      expect(permissionProblems(config({ plist: emptyText }), needs).join('\n')).toContain('NSMicrophoneUsageDescription is missing or empty');
      const defaulted = { ...emptyText, NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone' };
      expect(permissionProblems(config({ plist: defaulted }), needs).join('\n')).toContain("is a plugin's default sentence");
    });

    it('NATIVE-FIX: a build without background listening fails, on the iPhone mode and on each Android permission', () => {
      const plist = (config().ios && config()._internal?.modResults?.ios?.infoPlist) as Record<string, unknown>;
      expect(permissionProblems(config({ plist: { ...plist, UIBackgroundModes: [] } }), needs).join('\n')).toContain('UIBackgroundModes does not contain audio');
      const { UIBackgroundModes: _gone, ...noModes } = plist;
      expect(permissionProblems(config({ plist: noModes }), needs).join('\n')).toContain('UIBackgroundModes does not contain audio');
      for (const permission of BACKGROUND_AUDIO_ANDROID) {
        const without = goodPermissions().filter((entry) => entry.$?.['android:name'] !== permission);
        expect(permissionProblems(config({ permissions: without }), needs).join('\n')).toContain(`${permission} is not in the manifest`);
        expect(permissionProblems(config({ blocked: [permission] }), needs).join('\n')).toContain(`${permission} is blocked`);
      }
    });

    it('NATIVE-FIX: a build without the encryption answer, or with the wrong one, fails', () => {
      const plist = config()._internal?.modResults?.ios?.infoPlist as Record<string, unknown>;
      const { ITSAppUsesNonExemptEncryption: _gone, ...without } = plist;
      expect(permissionProblems(config({ plist: without }), needs).join('\n')).toContain('ITSAppUsesNonExemptEncryption is not false');
      expect(permissionProblems(config({ plist: { ...plist, ITSAppUsesNonExemptEncryption: true } }), needs).join('\n')).toContain('ITSAppUsesNonExemptEncryption is not false');
    });

    it('NATIVE-FIX: a build without the privacy manifest, a category, a reason, or a well-formed entry fails; the four categories carry Apple\'s reasons', () => {
      expect(PRIVACY_CATEGORIES).toEqual({
        NSPrivacyAccessedAPICategoryUserDefaults: 'CA92.1',
        NSPrivacyAccessedAPICategoryFileTimestamp: 'C617.1',
        NSPrivacyAccessedAPICategoryDiskSpace: 'E174.1',
        NSPrivacyAccessedAPICategorySystemBootTime: '35F9.1',
      });
      expect(privacyManifestProblems(goodManifests())).toEqual([]);
      expect(permissionProblems(config({ manifests: null }), needs).join('\n')).toContain('ios.privacyManifests is missing');
      expect(privacyManifestProblems({ NSPrivacyAccessedAPITypes: [] }).join('\n')).toContain('ios.privacyManifests is missing');
      for (const category of Object.keys(PRIVACY_CATEGORIES)) {
        const without = { NSPrivacyAccessedAPITypes: goodManifests().NSPrivacyAccessedAPITypes!.filter((entry) => entry.NSPrivacyAccessedAPIType !== category) };
        expect(privacyManifestProblems(without).join('\n')).toContain(`does not declare ${category}`);
        const wrong = { NSPrivacyAccessedAPITypes: goodManifests().NSPrivacyAccessedAPITypes!.map((entry) => (entry.NSPrivacyAccessedAPIType === category ? { ...entry, NSPrivacyAccessedAPITypeReasons: ['0000.0'] } : entry)) };
        expect(privacyManifestProblems(wrong).join('\n')).toContain(`${category} without the reason ${PRIVACY_CATEGORIES[category]}`);
      }
      expect(privacyManifestProblems({ NSPrivacyAccessedAPITypes: [{ NSPrivacyAccessedAPIType: 'x', NSPrivacyAccessedAPITypeReasons: 'CA92.1' }] }).join('\n')).toContain('is not {NSPrivacyAccessedAPIType: string');
      expect(privacyManifestProblems({ NSPrivacyAccessedAPITypes: [{ NSPrivacyAccessedAPIType: 'x', NSPrivacyAccessedAPITypeReasons: ['CA92.1'], extra: 1 } as never] }).join('\n')).toContain('is not {NSPrivacyAccessedAPIType: string');
    });

    it('fails a module that asks for a permission nobody mapped', () => {
      const mapped = { android: new Map<string, string>(), ios: new Map<string, string>(), unmapped: ['expo-location in src/x.ts'] };
      expect(permissionProblems(config(), mapped).join('\n')).toContain('expo-location in src/x.ts asks for a permission this check does not know');
    });
  });
});
