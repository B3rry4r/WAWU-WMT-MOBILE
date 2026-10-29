/**
 * A file the person chose for A26 or A27, held in memory until Submit sends
 * it (KYC-06). The bytes live in `blob` only: nothing here writes them to
 * storage, logs them or puts them in a URL, and `discard` removes the app's
 * own copy of a photo once it has gone or been dropped.
 */
export type PickedFile = {
  blob: Blob;
  /** The name the file goes up under (and A27's row shows). */
  name: string;
  /** `application/pdf`, `image/jpeg` or `image/png`. */
  contentType: string;
  /**
   * Where the phone build's own copy lives (a file URI). Not sent: the upload goes by `blob`, because the phone's
   * `fetch` (Expo's) cannot read a `{ uri }` part of a form. Kept so the app can tell, before an upload, that the copy
   * is still there (`stillThere`) and delete it once it has gone (`discard`). Not set on the web build.
   */
  uri?: string;
  /**
   * False when the phone build's own copy has been deleted since it was picked (the phone cleared its cache, or
   * something removed it): the person is asked for that photo again, before anything is sent. Not set on the web
   * build, where the file is in memory only.
   */
  stillThere?: () => boolean;
  /** Deletes the phone build's own copy of a photo. Not set on the web build. */
  discard?: () => void;
};

/** A chosen file the phone or browser could not read: a 0-byte or corrupt photo, or a type the encoder cannot decode. */
export class UnreadableFile extends Error {
  constructor() {
    super('The chosen file could not be read.');
    this.name = 'UnreadableFile';
  }
}
