import { File, Paths } from 'expo-file-system';

/** R-99: the website's own track. */
export const THEME_URL = 'https://wawuafrica.com/wawu-theme.mp3';

const NAME = 'wawu-theme.mp3';
const PART = 'wawu-theme.part';

/**
 * The song kept on the phone (R-99). It lives in the app's documents folder, which the phone does not empty to make room, so a
 * person who left the music on hears it again at the next start without a second 8.7 MB download. The web build has none of
 * this (`themeTrack.web.ts`); it plays the address itself.
 */

/** Where the song is on this phone, or null when it has not been fetched. */
export function savedTrack(): string | null {
  const file = new File(Paths.document, NAME);
  return file.exists && (file.size ?? 0) > 0 ? file.uri : null;
}

/**
 * Downloads the song and returns where it is now. The caller asks `savedTrack` first: this always downloads. It downloads
 * beside the final name and moves into place only once whole, so a half file from a dropped connection is never taken for the song.
 */
export async function fetchTrack(): Promise<string> {
  const part = new File(Paths.document, PART);
  if (part.exists) part.delete();
  const got = await File.downloadFileAsync(THEME_URL, part);
  if (!got.exists || !((got.size ?? 0) > 0)) throw new Error('The theme song came down empty');
  const final = new File(Paths.document, NAME);
  await got.move(final, { overwrite: true });
  return final.uri;
}
