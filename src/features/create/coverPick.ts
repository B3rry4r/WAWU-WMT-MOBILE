import type { ChosenFile } from './chosen';
import { pickFile } from './pickFile';

/** What the Hub takes for a cover (`content/cover`, R-114): png, jpeg or webp, at most 5 MB. */
export const COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/**
 * How a picked cover is written before it goes up: the long edge at most 2048 px, as a JPEG at about 0.85, so a 12 megapixel phone photo
 * (often 8 MB or more as it comes, or a photo PNG) fits the Hub's 5 MB. The phone does it with the image manipulator (`readPicked`); the
 * browser's chooser sends the file as it is, and the Hub's own sentence says when that is too big.
 */
export const COVER_READ = { maxSide: 2048, jpeg: true, quality: 0.85 } as const;

/** The phone's photo picker, asked for a cover. Null when the person closes it without choosing. */
export const pickCover = (): Promise<ChosenFile | null> => pickFile(COVER_TYPES, COVER_READ);
