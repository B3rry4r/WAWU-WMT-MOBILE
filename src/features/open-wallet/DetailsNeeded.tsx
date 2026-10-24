import { OpenWalletEnd } from './OpenWalletEnd';

export type DetailsNeededProps = {
  navTitle: string;
  onBack: () => void;
  /** Leads to the step that collects the details (the first step of Open your wallet). */
  onDetails: () => void;
  testID: string;
};

/**
 * What A26 and A27 say when the Hub asks for the details again (a refusal, or an opening that sat unfinished)
 * and nothing on this phone holds them: the photos are not taken yet, so none is lost, and the one button leads
 * to the step that collects them (KYC-06 round 2). A screen that would bounce the person back to A29 is the loop
 * this replaces.
 */
export function DetailsNeeded({ navTitle, onBack, onDetails, testID }: DetailsNeededProps) {
  return (
    <OpenWalletEnd
      testID={testID}
      tone="neutral"
      icon="IdCard"
      title="We need your details again"
      message="Add your details first, then send your new documents."
      actionLabel="Add your details"
      onAction={onDetails}
      onBack={onBack}
      navTitle={navTitle}
    />
  );
}
