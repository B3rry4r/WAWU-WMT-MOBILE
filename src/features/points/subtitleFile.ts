import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/*
 * The phone's side of "Share subtitles" (POINTS-10, R-68): the Hub's subtitle text is written to a file in the app's cache and handed to
 * the phone's own share sheet (`expo-sharing`), as the Story card is (`tgif/cardFile.ts`). The web build has none of this
 * (`subtitleFile.web.ts`), so it draws no share row.
 */

/** Whether this phone has a share sheet to hand the file to. */
export async function canShareSubtitles(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Writes the subtitles to a file in the app's cache (the same name replaces the last one) and opens the share sheet; resolves when it is closed. */
export async function shareSubtitles(srt: string, fileName: string, title: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(srt);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/x-subrip', UTI: 'public.plain-text', dialogTitle: title });
}
