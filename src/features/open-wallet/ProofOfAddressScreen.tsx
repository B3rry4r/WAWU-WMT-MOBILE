import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { useSession } from '@/api/session';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { radius } from '@/theme';

import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { Banner } from '@/features/auth/Banner';

import { OPEN_WALLET_KEY } from './api/account';
import { DOCUMENTS_KEY, documentProblem, fetchDocuments, fileProblem, rowOf } from './api/documents';
import { openingProgressQuery, type OpeningProgress } from './api/review';
import { addressLine } from './details';
import { fileLine, pickFailure, sendFailure, type Failure } from './documentCopy';
import { FileRow, UploadTile } from './DocumentParts';
import { pickProofFile } from './documents/pick';
import { clearFiles, setAddress, setProof, useDraft } from './draft';
import { readAddress } from './keptCheck';
import { useSessionAccount } from './sessionAccount';
import { detailsFromKept, NeedsDetails, needsOpening, sendOpening } from './submit';

const NAV_TITLE = 'Proof of address';
/** design/_gen/auth.js line 66 (A27): the body's parts 14 apart. */
const BODY_GAP = 14;
const SKELETON_ROW = 76;
const ADDRESS_MIN = 5;
const ADDRESS_MAX = 200;
const ADDRESS_NEEDS = 'Enter your home address: street, town and state.';
const NEEDS_DETAILS: Failure = {
  title: 'We need your details again',
  body: 'The details you gave are no longer held on this phone. Start again to send them.',
};

const tidy = (value: string) => value.replace(/\s+/g, ' ').trim();

/** The Hub's own rule for the address line: 5 to 200 characters, a letter in it, no angle brackets or control characters. */
export function addressProblem(value: string): string | null {
  const address = tidy(value);
  const clean = !/[\u0000-\u001f\u007f<>]/.test(address);
  return address.length >= ADDRESS_MIN && address.length <= ADDRESS_MAX && /\p{L}/u.test(address) && clean ? null : ADDRESS_NEEDS;
}

export type ProofOfAddressScreenProps = {
  onBack: () => void;
  /** The documents are sent: A28 takes this step's place. */
  onSubmitted: () => void;
  /** The bank is already checking (or the account is open). */
  onChecking: () => void;
  onOpened: () => void;
  /** Back to the first step: the details of this opening are no longer held. */
  onRestart: () => void;
};

/**
 * A27 · Proof of address (KYC-06): the home address and a utility bill or bank
 * statement from the last 3 months. Submit sends the details when the Hub has
 * none yet (or asks for them again after a refusal), then the ID's two sides
 * and this file, and goes to A28; the Hub sends the opening to the bank's
 * review itself once both documents are in (`submit.ts`).
 */
export function ProofOfAddressScreen({ onBack, onSubmitted, onChecking, onOpened, onRestart }: ProofOfAddressScreenProps) {
  const { status } = useSession();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const draft = useDraft(owner);
  const queryClient = useQueryClient();
  const progressQuery = openingProgressQuery(owner);
  const progress = useQuery(progressQuery);
  const documents = useQuery({
    queryKey: [...DOCUMENTS_KEY, owner ?? ''] as const,
    queryFn: fetchDocuments,
    enabled: Boolean(owner),
    staleTime: 0,
    retry: false,
  });
  const scrollRef = useRef<ScrollView>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [needsDetails, setNeedsDetails] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  // The address A5 kept (street, town, state) comes back as the one line, once, when nothing was typed here.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !owner) return;
    seeded.current = true;
    const kept = readAddress(owner);
    if (kept && draft.address === '') setAddress(owner, addressLine(kept));
  }, [owner, draft.address]);

  const stage = progress.data?.review?.stage;
  const opened = progress.data?.state === 'open' || progress.data?.state === 'frozen';
  const checking = stage === 'checking' || stage === 'approved';
  useEffect(() => {
    if (opened) onOpened();
    else if (checking) onChecking();
  }, [opened, checking, onOpened, onChecking]);

  if ((status === 'signedIn' && !owner) || (!progress.data && !progress.isError) || opened || checking) return <Loading onBack={onBack} />;
  if (progress.isError && progress.data === undefined) {
    return (
      <AuthFrame testID="open-wallet-address-error" navTitle={NAV_TITLE} onBack={onBack}>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(progress.error) ? progress.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void progress.refetch()}
        />
      </AuthFrame>
    );
  }
  const current = progress.data as OpeningProgress;
  const view = documents.data;
  const proofRow = rowOf(view, 'proof_of_address');
  const identityRow = rowOf(view, 'identity');
  const heldProof = proofRow !== undefined && (proofRow.state === 'uploaded' || proofRow.state === 'confirming');
  const heldId = identityRow !== undefined && (identityRow.state === 'uploaded' || identityRow.state === 'confirming');
  const proofIn = draft.proof !== null || heldProof;
  const idIn = draft.idFront !== null || heldId;
  const problem = addressProblem(draft.address);
  const ready = proofIn && idIn && problem === null;

  const edit = (value: string) => {
    if (!owner) return;
    setAddress(owner, value);
    setFailure(null);
    setNeedsDetails(false);
  };

  const choose = async () => {
    if (!owner || inFlight.current) return;
    inFlight.current = true;
    setFailure(null);
    try {
      const file = await pickProofFile('proof-of-address');
      if (!live.current || !file) return;
      const refused = fileProblem(file, view);
      if (refused) {
        file.discard?.();
        setFailure(pickFailure(refused, view));
        return;
      }
      setProof(owner, file);
    } catch (error) {
      if (live.current) setFailure(sendFailure(error, "We couldn't use that file"));
    } finally {
      inFlight.current = false;
    }
  };

  const submit = async () => {
    if (inFlight.current || !owner) return;
    if (problem !== null) {
      setAttempted(true);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    setNeedsDetails(false);
    const address = tidy(draft.address);
    let step: 'details' | 'documents' = needsOpening(current) ? 'details' : 'documents';
    try {
      await sendOpening({
        progress: current,
        draft: { ...draft, address },
        details: detailsFromKept(owner, address),
        onOpened: (answer) => {
          step = 'documents';
          queryClient.setQueryData(progressQuery.queryKey, answer);
        },
      });
      if (!live.current) return;
      clearFiles(owner);
      void queryClient.invalidateQueries({ queryKey: [OPEN_WALLET_KEY] });
      onSubmitted();
    } catch (error) {
      if (!live.current) return;
      if (error instanceof NeedsDetails) {
        setNeedsDetails(true);
        setFailure(NEEDS_DETAILS);
      } else if (documentProblem(error) === 'closed') {
        // The opening was already sent for review: this step has nothing more to take.
        void queryClient.invalidateQueries({ queryKey: [OPEN_WALLET_KEY] });
        onSubmitted();
      } else {
        setFailure(sendFailure(error, step === 'details' ? "We couldn't send your details" : "We couldn't send your documents"));
      }
    } finally {
      inFlight.current = false;
      if (live.current) setBusy(false);
    }
  };

  return (
    <AuthFrame
      testID="open-wallet-address"
      scrollRef={scrollRef}
      navTitle={NAV_TITLE}
      onBack={onBack}
      footer={
        <>
          <Button label="Submit" full loading={busy} disabled={!ready} onPress={() => void submit()} testID="open-wallet-address-submit" />
          {needsDetails ? <Button label="Start again" variant="secondary" full onPress={onRestart} testID="open-wallet-address-restart" /> : null}
        </>
      }
    >
      <View style={styles.body}>
        {failure ? <Banner tone="danger" title={failure.title} body={failure.body} testID="open-wallet-address-banner" /> : null}
        <Text variant="muted">A utility bill or bank statement from the last 3 months, with your name and address.</Text>
        <AuthField
          scrollRef={scrollRef}
          label="Home address"
          testID="open-wallet-address-field"
          value={draft.address}
          onChangeText={edit}
          error={attempted && problem ? problem : undefined}
          maxLength={ADDRESS_MAX}
          autoComplete="street-address"
          textContentType="fullStreetAddress"
          autoCapitalize="words"
          returnKeyType="done"
          disabled={busy}
        />
        {draft.proof ? (
          <FileRow
            testID="open-wallet-proof"
            name={draft.proof.name}
            line={fileLine(draft.proof.contentType, draft.proof.blob.size)}
            onRemove={owner ? () => setProof(owner, null) : undefined}
            disabled={busy}
          />
        ) : heldProof ? (
          <FileRow testID="open-wallet-proof" name="Proof of address" line="Uploaded" />
        ) : (
          <UploadTile
            title="Utility bill or bank statement"
            line="Tap to choose a file"
            done={false}
            icon="FileUp"
            disabled={busy}
            onPress={() => void choose()}
            testID="open-wallet-proof-add"
          />
        )}
      </View>
    </AuthFrame>
  );
}

function Loading({ onBack }: { onBack: () => void }) {
  return (
    <AuthFrame testID="open-wallet-address-loading" navTitle={NAV_TITLE} onBack={onBack}>
      <LoadingView label="Loading your documents">
        <View style={styles.body}>
          <Skeleton height={fieldMetrics.height} radius={radius.tile} />
          <Skeleton height={SKELETON_ROW} radius={radius.tile} />
        </View>
      </LoadingView>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
});
