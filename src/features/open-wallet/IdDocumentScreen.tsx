import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { useSession } from '@/api/session';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { radius } from '@/theme';

import { Banner } from '@/features/auth/Banner';
import { AuthFrame } from '@/features/auth/AuthFrame';

import { DOCUMENTS_KEY, documentProblem, fetchDocuments, fileProblem, rowOf, type DocumentsView } from './api/documents';
import { openingProgressQuery } from './api/review';
import { pickFailure, sendFailure, type Failure } from './documentCopy';
import { UploadTile } from './DocumentParts';
import { pickIdPhoto } from './documents/pick';
import { setIdSide, useDraft } from './draft';
import { OpenWalletEnd } from './OpenWalletEnd';
import { useSessionAccount } from './sessionAccount';

const NAV_TITLE = 'Your ID document';
/** design/_gen/auth.js line 65 (A26): the body's parts 14 apart; the intro is the kit's `muted`. */
const BODY_GAP = 14;
const SKELETON_TILE = 150;

export type IdDocumentScreenProps = {
  onBack: () => void;
  /** On to A27 once both sides are in. */
  onContinue: () => void;
  /** The bank is already checking (or the account is open): A28 or A8 takes this step's place. */
  onChecking: () => void;
  onOpened: () => void;
  /** Leaves Open your wallet (this wallet takes no documents). */
  onLeave: () => void;
};

/**
 * A26 · Your ID document (KYC-06): the front and, where it has two sides, the
 * back, each a photo taken here ("Tap to take a photo"). Nothing is sent from
 * this screen: a side is held in memory until A27's Submit sends both in one
 * request (BACKEND_GAPS G-470). A side the Hub already holds (a person coming
 * back, or `GET /money/identity/documents` saying `uploaded`) shows Done
 * without being taken again, and Continue needs both sides in, as drawn.
 */
export function IdDocumentScreen({ onBack, onContinue, onChecking, onOpened, onLeave }: IdDocumentScreenProps) {
  const { status } = useSession();
  const signedIn = useSessionAccount(undefined);
  const owner = signedIn ?? undefined;
  const draft = useDraft(owner);
  const progress = useQuery(openingProgressQuery(owner));
  // The Hub answers 409 `wallet_not_open` until the details were sent: then it has no limits to name yet, and the step still shows.
  const documents = useQuery({
    queryKey: [...DOCUMENTS_KEY, owner ?? ''] as const,
    queryFn: fetchDocuments,
    enabled: Boolean(owner),
    staleTime: 0,
    retry: false,
  });
  const [failure, setFailure] = useState<Failure | null>(null);
  const [taking, setTaking] = useState<'front' | 'back' | null>(null);
  const inFlight = useRef(false);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const stage = progress.data?.review?.stage;
  const opened = progress.data?.state === 'open' || progress.data?.state === 'frozen';
  const checking = stage === 'checking' || stage === 'approved';
  useEffect(() => {
    if (opened) onOpened();
    else if (checking) onChecking();
  }, [opened, checking, onOpened, onChecking]);

  const notOpenYet = documents.isError && documentProblem(documents.error) === 'not_open';
  const view: DocumentsView | undefined = documents.data;

  if (status === 'signedIn' && !owner) return <Loading onBack={onBack} />;
  if (progress.isError && progress.data === undefined) {
    return (
      <AuthFrame testID="open-wallet-id-error" navTitle={NAV_TITLE} onBack={onBack}>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(progress.error) ? progress.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void progress.refetch()}
        />
      </AuthFrame>
    );
  }
  if (documents.isError && !notOpenYet && view === undefined) {
    return (
      <AuthFrame testID="open-wallet-id-error" navTitle={NAV_TITLE} onBack={onBack}>
        <ErrorState
          title="We couldn't open this step"
          message={isApiError(documents.error) ? documents.error.message : 'Something went wrong. Try again.'}
          onRetry={() => void documents.refetch()}
        />
      </AuthFrame>
    );
  }
  if (!progress.data || (documents.isPending && !documents.isError) || opened || checking) return <Loading onBack={onBack} />;
  if (view && !view.required) {
    return (
      <OpenWalletEnd
        testID="open-wallet-id-not-needed"
        tone="neutral"
        icon="FileCheck2"
        title="Nothing to add here"
        message="No documents are needed to open your wallet right now."
        actionLabel="Done"
        onAction={onLeave}
      />
    );
  }

  const row = rowOf(view, 'identity');
  const held = row !== undefined && (row.state === 'uploaded' || row.state === 'confirming');
  const frontIn = draft.idFront !== null || (held && row.sides.includes('front'));
  const backIn = draft.idBack !== null || (held && row.sides.includes('back'));

  const take = async (side: 'front' | 'back') => {
    if (!owner || inFlight.current) return;
    inFlight.current = true;
    setTaking(side);
    setFailure(null);
    try {
      const file = await pickIdPhoto(side === 'front' ? 'id-front' : 'id-back');
      if (!live.current || !file) return;
      const problem = fileProblem(file, view);
      if (problem) {
        file.discard?.();
        setFailure(pickFailure(problem, view));
        return;
      }
      setIdSide(owner, side, file);
    } catch (error) {
      if (live.current) setFailure(sendFailure(error, "We couldn't take that photo"));
    } finally {
      inFlight.current = false;
      if (live.current) setTaking(null);
    }
  };

  return (
    <AuthFrame
      testID="open-wallet-id"
      navTitle={NAV_TITLE}
      onBack={onBack}
      footer={<Button label="Continue" full disabled={!(frontIn && backIn)} onPress={onContinue} testID="open-wallet-id-continue" />}
    >
      <View style={styles.body}>
        {failure ? <Banner tone="danger" title={failure.title} body={failure.body} testID="open-wallet-id-banner" /> : null}
        <Text variant="muted">
          NIN slip, passport, driver&apos;s licence or voter&apos;s card. Both sides if it has two.
        </Text>
        <UploadTile
          title="Front"
          line={frontIn ? 'Done' : 'Tap to take a photo'}
          done={frontIn}
          disabled={taking !== null}
          onPress={() => void take('front')}
          testID="open-wallet-id-front"
        />
        <UploadTile
          title="Back"
          line={backIn ? 'Done' : 'Tap to take a photo'}
          done={backIn}
          disabled={taking !== null}
          onPress={() => void take('back')}
          testID="open-wallet-id-back"
        />
      </View>
    </AuthFrame>
  );
}

function Loading({ onBack }: { onBack: () => void }) {
  return (
    <AuthFrame testID="open-wallet-id-loading" navTitle={NAV_TITLE} onBack={onBack}>
      <LoadingView label="Loading your documents">
        <View style={styles.body}>
          <Skeleton height={SKELETON_TILE} radius={radius.media} />
          <Skeleton height={SKELETON_TILE} radius={radius.media} />
        </View>
      </LoadingView>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
});
