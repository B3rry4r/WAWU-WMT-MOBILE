import { Directory, File, Paths } from 'expo-file-system';

/*
 * The files `expo-image-manipulator` writes on the phone. It can only answer through a
 * file, always in `<cache>/ImageManipulator/` (Android `FileUtils.generateRandomOutputPath`,
 * iOS `saveImage`), so the app deletes what it no longer needs: A6's selfie at once, M8's
 * and M36's photos once their upload has settled (SHARED-04, F3). Phone builds only; the
 * web build never imports this.
 */

/** The folder the manipulator writes to, inside the app's cache. */
export const MANIPULATOR_FOLDER = 'ImageManipulator';

/** Deletes one file; one that is already gone, or a cache cleared under us, is fine. */
export function forgetFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Nothing to remove: either way the file is not kept.
  }
}

/** The files in the manipulator's folder now, by uri (none when it does not exist or cannot be read). */
export function manipulatorFiles(): Set<string> {
  try {
    const folder = new Directory(Paths.cache, MANIPULATOR_FOLDER);
    if (!folder.exists) return new Set();
    return new Set(folder.list().flatMap((entry) => (entry instanceof File ? [entry.uri] : [])));
  } catch {
    return new Set();
  }
}

/**
 * Deletes every file the manipulator wrote since `before` was read, including one it
 * wrote and then failed on, whose address never reached the app.
 */
export function forgetWrittenSince(before: Set<string>): void {
  for (const uri of manipulatorFiles()) if (!before.has(uri)) forgetFile(uri);
}
