import { formatBytes, typesLine, type FileRule } from './model';

/** A file the person chose, ready to upload. */
export type ChosenFile = {
  blob: Blob;
  /** The file's own name, shown on its row. */
  name: string;
  /** What `POST /uploads/presign` takes as `contentType`. */
  contentType: string;
  /** Without the dot. */
  extension: string;
  /** Where the screen can draw it, when it is a picture. */
  previewUri?: string;
  /** Phone builds: deletes the app's own copy once the upload has settled. */
  discard?: () => void;
};

/**
 * The sentence for a chosen file the Hub's rule would refuse, or null when it fits. The Hub checks again on the
 * upload; this only stops the person at the edge, in the Hub's own numbers.
 */
export function refusalFor(file: ChosenFile, rule: FileRule): string | null {
  if (!rule.contentTypes.includes(file.contentType)) {
    return `That file type is not accepted here. Choose ${typesLine(rule.extensions)}.`;
  }
  if (file.blob.size > rule.maxBytes) return `That file is over the ${formatBytes(rule.maxBytes)} limit.`;
  if (file.blob.size === 0) return 'That file is empty. Choose another.';
  return null;
}
