export type ReaderProps = {
  /** The free pages: the creator's public preview file (or the whole PDF once it is the viewer's). */
  uri: string;
  title: string;
  visible: boolean;
  onClose: () => void;
  testID?: string;
};
