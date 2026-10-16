/** A licence or certificate the person chose, ready to upload. */
export type PickedDocument = {
  blob: Blob;
  /** The file's own name, shown on its row. */
  name: string;
  /** `application/pdf` or a picture type: what `POST /uploads/presign` takes as `contentType`. */
  contentType: string;
  /** Without the dot. */
  extension: string;
};

/**
 * Whether this build can open the phone's files. The phone build waits for `expo-document-picker`
 * (SHARED-CHANGES.md row 8, PROS-03): until it is installed there is no way to choose a file on a phone, so P6
 * does not draw the upload row there rather than draw a button that does nothing. The web build
 * (`pickDocument.web.ts`) opens the browser's file chooser.
 */
export const canPickDocument = false;

export async function pickDocument(): Promise<PickedDocument | null> {
  return null;
}
