import { BuyCreditsSheet } from './BuyCreditsSheet';

export type BuyCreditsEntryProps = {
  visible: boolean;
  onClose: () => void;
  /** What I29's button says: "Back to chat" in a room, "Done" anywhere else. */
  doneLabel: string;
  /** The credits were added: the host reads its own copy of the balance again. */
  onAdded?: () => void;
};

/** I28 and I29 wired to the app. Credits are bought in the store sheet (R-86), so no wallet route is reached from here. */
export function BuyCreditsEntry(props: BuyCreditsEntryProps) {
  return <BuyCreditsSheet {...props} />;
}
