import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { isApiError } from '@/api/client';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ProductsMeter, productsMeterMetrics } from '@/components/ProductsMeter';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { fetchFormats, formatsKey } from '@/features/create/api';
import type { ChosenFile } from '@/features/create/chosen';
import { refusalFor } from '@/features/create/chosen';
import { CoverChoice } from '@/features/create/CoverChoice';
import { coverAssetFor } from '@/features/create/coverSend';
import { giveBack, type DraftCover, type UploadedFile } from '@/features/create/draft';
import { frameFor } from '@/features/create/frames';
import { coverRequired, formatBytes, previewLine, previewWayOf, uploadTitle, type FormatId, type FormatRule } from '@/features/create/model';
import { pickFile } from '@/features/create/pickFile';
import { smallCopyOf } from '@/features/create/previewCopy';
import { UPLOAD_CANCELLED, uploadFile } from '@/features/create/upload';
import { useFirstTap } from '@/features/create/parts';
import { fetchMyTier, tierKey, draftsKey } from '@/features/me/api';
import { fetchOpeningProgress, openingProgressQuery } from '@/features/open-wallet/api/review';
import { useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { PointsFrame } from '@/features/points/PointsFrame';
import { font, radius, space, useWawu } from '@/theme';

import { fetchDraft, draftKey, updateDraft, type ProductDraft } from './api';
import { IdentityCheck } from './IdentityCheck';
import { identityStateOf } from './identityModel';
import { ProductsFullSheet, type ProductsFullSheetProps } from './ProductsFullSheet';
import { readableLink } from '@/lib/appLinks';

import { CATEGORIES, productLink, publishDraft, type PublishFiles, type Published } from './publishApi';

const BODY_GAP = 12;
const PREVIEW_HEIGHT = 190;
/** The sentence when a picture's smaller copy is gone or was never made: the person chooses the picture again. */
const COPY_GONE = 'Your preview could not be made. Choose your picture again.';
const noCover: DraftCover = { mode: 'default', file: null };

/** The file the person adds before publishing: nothing yet, on its way (the real share that has gone up), ready, or refused. */
type Slot = { state: 'empty' } | { state: 'uploading'; name: string; share: number } | { state: 'ready'; file: UploadedFile } | { state: 'failed'; message: string };

export type PublishScreenProps = Pick<ProductsFullSheetProps, 'onOpenLibrary'> & {
  draftId: string;
  onBack: () => void;
  /** No tier is running: VF5. */
  onSeeTiers: () => void;
  /** A tier that ended: VF14b, where it is renewed. */
  onYourTier: () => void;
  /** "Upgrade instead" on VF13: VF5. */
  onUpgrade: () => void;
  /** The draft still lacks something the Hub names: the draft form. */
  onEditDraft: () => void;
};

/**
 * VF12 · Publish, with VF12a (uploading), VF12b (published) and VF12c (shared). The draft's own details are the Hub's; the person adds
 * the file through the create flow's upload (`POST /uploads/presign` under the draft's format, the Hub's own type and size rules); the
 * meter is the Hub's own count (`GET /me/tier`). Before the first publish the category is asked here (the draft form stays without it),
 * then `POST /product-drafts/{id}/publish`.
 *
 * R-118 (owner, 31 Oct 2026), exactly as Create: nobody uploads a preview. Once the file is ready the screen asks for a cover (its own, never
 * Create's) with the kind's one muted line saying what the preview is. A PAID piece sends `previewFromFile: true` (the Hub cuts the first
 * 30 seconds or makes the first pages), a paid picture sends the smaller copy the phone made of it as `previewAsset`, a template and a
 * course with no video first preview as their cover so a paid one cannot go without it; a FREE piece sends none of these.
 *
 * Gates, in the Hub's order: no running tier is VF5 (or Renew, once ended); the identity check (VF15 to VF15b) has to have passed (the
 * Hub refuses a paused one itself, `403 identity_paused`, and its sentence is what VF15b shows); every place used is VF13. Share is the phone's own share sheet (R-33): no card is drawn. The Hub puts a published product up for
 * review first, so the note says "live" only when the Hub says it is.
 */
export function PublishScreen(props: PublishScreenProps) {
  const { colors } = useWawu();
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const draft = useQuery({ queryKey: draftKey(props.draftId), queryFn: () => fetchDraft(props.draftId), retry: false }, queryClient);
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false }, queryClient);
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats }, queryClient);
  const [watched, setWatched] = useState(false);
  const progress = useQuery(
    {
      ...openingProgressQuery(owner ?? undefined),
      // The check passed while the person watched it run: VF15a shows it once, with Continue; a check that was already done goes straight on.
      queryFn: async () => {
        const read = await fetchOpeningProgress();
        if (identityStateOf(read).kind !== 'passed') setWatched(true);
        return read;
      },
      refetchInterval: (q: { state: { data?: { state: string } } }) => (q.state.data?.state === 'opening' ? 3000 : false),
    },
    queryClient,
  );
  const identity = progress.data ? identityStateOf(progress.data) : null;

  const [continued, setContinued] = useState(false);
  // The Hub refused with `identity_paused` (a publish, or a file for a product): its own sentence is shown as VF15b says it.
  const [hubPause, setHubPause] = useState<string | null>(null);

  const [full, setFull] = useState<Slot>({ state: 'empty' });
  const [cover, setCover] = useState<DraftCover>(noCover);
  const [category, setCategory] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<Published | null>(null);
  const [gone, setGone] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [limit, setLimit] = useState(false);
  const aborts = useRef<AbortController[]>([]);
  const publishing = useRef(false);
  const firstTap = useFirstTap();
  // What was made for a picture: the phone's smaller copy (held until Send uploads it) and, once up, the preview it became (kept so a publish
  // that fails and is tried again uses it rather than sending a second one).
  const smallCopy = useRef<ChosenFile | null>(null);
  const madePreview = useRef<UploadedFile | null>(null);
  const coverNow = useRef<DraftCover>(noCover);
  const settled = useRef(false);
  useEffect(() => {
    coverNow.current = cover;
  }, [cover]);
  useEffect(
    () => () => {
      aborts.current.forEach((a) => a.abort());
      smallCopy.current?.discard?.();
      // Leaving without publishing: the cover and the preview that went up for this try are given back to the Hub.
      if (!settled.current) {
        giveBack(coverNow.current.file);
        giveBack(madePreview.current);
      }
    },
    [],
  );

  const rule: FormatRule | undefined = formats.data?.find((r) => r.id === draft.data?.contentType);
  const format = (draft.data?.contentType ?? null) as FormatId | null;
  const running = tier.data ? tier.data.state === 'active' || tier.data.state === 'ending' : false;

  const free = draft.data?.accessType === 'free';

  const add = async () => {
    if (!rule || !format || !firstTap()) return;
    const set = setFull;
    let file: ChosenFile | null;
    try {
      file = await pickFile(rule.full.contentTypes);
    } catch {
      set({ state: 'failed', message: "We couldn't open your files. Try again." });
      return;
    }
    if (!file) return;
    const refusal = refusalFor(file, rule.full);
    if (refusal) {
      set({ state: 'failed', message: refusal });
      return;
    }
    const controller = new AbortController();
    aborts.current.push(controller);
    set({ state: 'uploading', name: file.name, share: 0 });
    // What the cover and the preview are made from has to be read now, from the phone's own copy of the file, which goes once the upload has
    // settled (R-118): a video's frame (the default cover), and a picture's smaller copy (the preview of a paid picture).
    let copy: ChosenFile | null = null;
    try {
      const frame = await frameFor(file);
      copy = format === 'image' && !free ? await smallCopyOf(file) : null;
      if (format === 'image' && !free && !copy) {
        // The phone cannot read the picture again, so it cannot make the preview from it: say so now, not when the piece is published.
        file.discard?.();
        set({ state: 'failed', message: 'That picture could not be read. Choose another.' });
        return;
      }
      if (controller.signal.aborted) {
        file.discard?.();
        copy?.discard?.();
        return;
      }
      const uploaded = await uploadFile(file, { folder: 'content/full', format }, (share) => set((s) => (s.state === 'uploading' ? { ...s, share } : s)), controller.signal);
      if (controller.signal.aborted) {
        copy?.discard?.();
        return;
      }
      // A new file starts the cover and the preview again: whatever was made from the old one is not this one's.
      smallCopy.current?.discard?.();
      smallCopy.current = copy;
      giveBack(madePreview.current);
      madePreview.current = null;
      if (coverNow.current.mode === 'default') {
        giveBack(coverNow.current.file);
        setCover(noCover);
      }
      set({ state: 'ready', file: { ...uploaded, ...(frame ? { frame } : {}) } });
    } catch (error) {
      copy?.discard?.();
      if (error instanceof ApiError && error.code === UPLOAD_CANCELLED) return;
      // The Hub's own answer for a tier that is not running or every place used: the way up, not a sentence to read.
      if (isApiError(error) && error.code === 'tier_required') {
        void tier.refetch();
        set({ state: 'empty' });
        return;
      }
      if (isApiError(error) && error.code === 'product_limit_reached') {
        setLimit(true);
        set({ state: 'empty' });
        return;
      }
      if (isApiError(error) && error.code === 'identity_paused') {
        setHubPause(error.message);
        void progress.refetch();
        set({ state: 'empty' });
        return;
      }
      set({ state: 'failed', message: isApiError(error) ? error.message : 'That file did not upload. Try again.' });
    }
  };

  const needsCategory = draft.data !== undefined && draft.data.category === null;
  const otherMissing = (draft.data?.missing ?? []).filter((m) => m !== 'category');
  const chosenCategory = category ?? draft.data?.category ?? null;
  // The preview of a paid piece (R-118): made for the person. A template, and a course with no video first, preview as their cover.
  const way = full.state === 'ready' && format ? previewWayOf(format, full.file) : null;
  const coverNeeded = way !== null && coverRequired(way, free);
  const coverReady = !coverNeeded || (cover.mode === 'picture' && Boolean(cover.file));
  const filesReady = full.state === 'ready' && coverReady;
  const canPublish = !busy && published === null && filesReady && chosenCategory !== null && otherMissing.length === 0;

  /** A cover that is replaced or dropped is given back to the Hub; the screen keeps its own, never Create's. */
  const chooseCover = (next: DraftCover) => {
    if (cover.file && cover.file.key !== next.file?.key) giveBack(cover.file);
    setCover(next);
  };

  /** The files a publish sends (R-118): the cover, and for a PAID piece its preview (the Hub makes it, or the phone's smaller copy of a picture). */
  const filesFor = async (file: UploadedFile, kind: FormatId): Promise<PublishFiles> => {
    const coverAsset = await coverAssetFor(file, cover, setCover);
    let previewAsset: string | null = null;
    if (!free && previewWayOf(kind, file) === 'copy') {
      if (!madePreview.current) {
        const copy = smallCopy.current;
        if (!copy) throw new ApiError('unknown', 0, COPY_GONE);
        madePreview.current = await uploadFile(copy, { folder: 'content/preview', format: 'image' }, () => undefined);
        smallCopy.current = null;
      }
      previewAsset = madePreview.current.fileUrl;
    }
    return {
      fullAsset: file.fileUrl,
      ...(coverAsset ? { coverAsset } : {}),
      ...(previewAsset ? { previewAsset } : free ? {} : { previewFromFile: true }),
    };
  };

  const publish = async () => {
    if (publishing.current || !canPublish || full.state !== 'ready' || !format || !draft.data) return;
    publishing.current = true;
    setBusy(true);
    try {
      // The category is the Hub's field on the draft: it is saved before the publish reads the draft.
      if (needsCategory && category) await updateDraft(draft.data.id, { category: category as (typeof CATEGORIES)[number]['id'] });
      const outcome = await publishDraft(draft.data.id, await filesFor(full.file, format));
      switch (outcome.kind) {
        case 'done':
          settled.current = true;
          setPublished(outcome.piece);
          for (const key of [tierKey, draftsKey, ['uploads'], ['profile']]) void queryClient.invalidateQueries({ queryKey: key });
          break;
        case 'tier_required':
          void tier.refetch();
          break;
        case 'limit_reached':
          setLimit(true);
          break;
        case 'identity_paused':
          setHubPause(outcome.message);
          void progress.refetch();
          break;
        case 'incomplete':
        case 'refused':
          setNotice(outcome.message);
          void draft.refetch();
          break;
        case 'gone':
          // A first answer that was lost: the draft is gone because it was published. The piece is not known here, so there is no link.
          settled.current = true;
          setGone(true);
          for (const key of [tierKey, draftsKey, ['uploads'], ['profile']]) void queryClient.invalidateQueries({ queryKey: key });
          break;
        case 'unanswered':
          setNotice('We could not reach the server. Tap Publish to try again.');
          break;
      }
    } catch (error) {
      setNotice(isApiError(error) ? error.message : 'We could not publish this. Try again.');
    } finally {
      publishing.current = false;
      setBusy(false);
    }
  };

  const share = () => {
    const link = published ? productLink(published) : null;
    if (link) void Share.share({ message: link }, { dialogTitle: 'Share your product' }).catch(() => undefined);
  };

  const failed = (draft.isError && !draft.data) || (tier.isError && !tier.data) || (formats.isError && !formats.data) || (progress.isError && !progress.data);
  const loading = !draft.data || !tier.data || !formats.data || !progress.data;

  let body;
  let foot;
  // VF15 to VF15b are full-bleed on the boards (no Publish bar, no back button), so they replace the frame instead of filling it.
  let identityView: ReactNode = null;
  if (failed) {
    const error = draft.error ?? tier.error ?? formats.error ?? progress.error;
    body = (
      <ErrorState
        testID="publish-error"
        icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
        title={isApiError(error) && error.status === 404 ? 'That draft is gone' : "We couldn't load your draft"}
        message={isApiError(error) && error.message ? error.message : 'Check your connection and try again.'}
        onRetry={() => {
          void draft.refetch();
          void tier.refetch();
          void formats.refetch();
          void progress.refetch();
        }}
      />
    );
  } else if (loading) {
    body = (
      <View testID="publish-loading" style={styles.stack}>
        <Skeleton height={48} radius={radius.card} />
        <Skeleton height={PREVIEW_HEIGHT} radius={radius.media} />
        <Skeleton height={64} radius={radius.card} />
      </View>
    );
  } else if (!running) {
    const ended = tier.data?.state === 'ended';
    body = (
      <ErrorState
        testID="publish-no-tier"
        icon="BadgeCheck"
        title={ended ? 'Your tier has ended' : 'Make it official to publish'}
        message={ended ? 'Published products stay up. New publishing is paused until you renew.' : 'Publishing needs a tier. Drafts stay free.'}
        onRetry={ended ? props.onYourTier : props.onSeeTiers}
      />
    );
  } else if (hubPause !== null) {
    // The Hub's sentence is the reason (it names what went wrong and what to do), so no steps are listed under it. Try again opens
    // Open your wallet when the wallet's own state says it is the way forward, else asks the Hub again.
    const canOpen = identity?.kind === 'paused' ? identity.canOpen : identity?.kind !== 'checking';
    identityView = (
      <IdentityCheck
        state={{ kind: 'paused', reason: hubPause, fixes: [], canOpen }}
        onContinue={() => setHubPause(null)}
        onTryAgain={() => {
          setHubPause(null);
          if (canOpen) entry.open();
          else void progress.refetch();
        }}
      />
    );
  } else if (identity && (identity.kind !== 'passed' || (watched && !continued))) {
    identityView = (
      <IdentityCheck
        state={identity}
        onContinue={() => setContinued(true)}
        onTryAgain={() => (identity.kind === 'paused' && identity.canOpen ? entry.open() : void progress.refetch())}
      />
    );
  } else if (gone && published === null) {
    body = (
      <View testID="publish-gone" style={styles.stack}>
        <Card padded>
          <Text variant="body" style={font(700)}>
            Published
          </Text>
          <Text variant="secondary" tone="textSecondary">
            Your product was sent a moment ago. It is in your content.
          </Text>
        </Card>
      </View>
    );
    foot = <Button testID="publish-done" label="Done" full onPress={props.onBack} />;
  } else {
    const d = draft.data as ProductDraft;
    const count = tier.data ? `${tier.data.productsUsed} of ${tier.data.productsAllowed}` : null;
    const link = published ? productLink(published) : null;
    body = (
      <>
        <Text variant="secondary" tone="textMuted" testID="publish-draft-title" numberOfLines={1}>
          {d.title}
        </Text>
        {tier.data ? <ProductsMeter testID="publish-meter" used={tier.data.productsUsed} allowed={tier.data.productsAllowed} tier={{ name: tier.data.tier?.name, state: tier.data.state, endsAt: tier.data.activeUntil }} /> : null}
        {needsCategory && published === null ? (
          <View style={styles.group}>
            <Text variant="secondary" tone="textSecondary">
              Pick a category
            </Text>
            <FilterChips<string>
              testID="publish-category"
              label="Category"
              variant="option"
              inset={0}
              items={CATEGORIES.map((c) => ({ value: c.id as string, label: c.label }))}
              value={chosenCategory ?? ''}
              onChange={(value) => setCategory(value)}
            />
          </View>
        ) : null}
        {otherMissing.length > 0 ? (
          <View testID="publish-missing" style={[styles.note, { backgroundColor: colors.warningTint }]}>
            <Icon name="CircleAlert" size={22} color={colors.warning} />
            <View style={styles.noteWords}>
              <Text variant="body" style={font(700)}>
                Finish your draft first
              </Text>
              <Text variant="secondary" tone="textSecondary">
                It still needs the details the draft form asks for.
              </Text>
              <View style={styles.noteButton}>
                <Button testID="publish-edit" label="Edit draft" size="card" onPress={props.onEditDraft} />
              </View>
            </View>
          </View>
        ) : null}
        <FileRow slot={full} title={format ? uploadTitle(format) : 'Add the file'} disabled={busy || published !== null} onPress={() => void add()} />
        {full.state === 'ready' && format && way && published === null ? (
          // The cover step (R-118): once the file is in, the cover and, for a paid piece, the one muted line saying what the preview is.
          <View testID="publish-cover" pointerEvents={busy ? 'none' : 'auto'} style={styles.group}>
            {free ? null : (
              <Text variant="muted" testID="publish-preview-line">
                {previewLine(format, way)}
              </Text>
            )}
            <CoverChoice source={full.file} required={coverNeeded} value={cover} onChange={chooseCover} />
          </View>
        ) : null}
        {published || gone ? (
          <View testID="publish-published" accessibilityLiveRegion="polite" style={[styles.note, { backgroundColor: colors.infoTint }]}>
            <Icon name="CircleCheck" size={22} color={colors.info} />
            <View style={styles.noteWords}>
              <Text variant="body" style={font(700)}>
                Published
              </Text>
              <Text variant="secondary" tone="textSecondary" testID="publish-published-line">
                {published?.status === 'live' ? `It's live on your profile.` : 'It is with our team for review. It goes live once approved.'}
                {count ? ` ${count} used.` : ''}
              </Text>
            </View>
          </View>
        ) : null}
        {link ? (
          <Text variant="meta" tone="textMuted" testID="publish-link" selectable style={styles.centre}>
            {readableLink(link)}
          </Text>
        ) : null}
      </>
    );
    foot = published ? (
      link ? (
        <Button testID="publish-share" label="Share it" full onPress={share} />
      ) : (
        <Button testID="publish-done" label="Done" full onPress={props.onBack} />
      )
    ) : (
      <Button testID="publish-submit" label="Publish" full disabled={!canPublish} loading={busy} onPress={() => void publish()} />
    );
  }

  return (
    <>
      {identityView ?? (
        <PointsFrame title="Publish" onBack={props.onBack} gap={BODY_GAP} foot={foot} testID="publish-screen">
          {body}
        </PointsFrame>
      )}
      {limit ? (
        <ProductsFullSheet
          onClose={() => {
            setLimit(false);
            void tier.refetch();
          }}
          onUpgrade={() => {
            setLimit(false);
            props.onUpgrade();
          }}
          onOpenLibrary={
            props.onOpenLibrary
              ? () => {
                  setLimit(false);
                  props.onOpenLibrary?.();
                }
              : undefined
          }
        />
      ) : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="publish-notice" /> : null}
    </>
  );
}

/** The file row: "Add the file", then its name and size with the real share while it goes up (VF12a), then "ready". */
function FileRow({ slot, title, disabled, onPress }: { slot: Slot; title: string; disabled: boolean; onPress: () => void }) {
  const uploading = slot.state === 'uploading';
  const percent = uploading ? Math.round(slot.share * 100) : 0;
  const line =
    slot.state === 'ready' ? `${formatBytes(slot.file.bytes)} · ready` : uploading ? `Uploading · ${percent}%` : slot.state === 'failed' ? slot.message : 'Tap to choose a file';
  return (
    <Pressable
      testID="publish-file"
      accessibilityRole="button"
      accessibilityLabel={slot.state === 'ready' ? `${slot.file.name}, ready. Replace` : title}
      disabled={disabled || uploading}
      onPress={onPress}
    >
      <Card padded>
        <View style={styles.fileRow}>
          <IconTile icon={slot.state === 'ready' ? 'FileCheck2' : uploading ? 'Upload' : 'FileUp'} tone={slot.state === 'ready' ? 'in' : 'accent'} size={44} />
          <View style={styles.fileWords}>
            <Text variant="body" style={font(700)} numberOfLines={1}>
              {slot.state === 'ready' ? slot.file.name : uploading ? slot.name : title}
            </Text>
            <Text variant="secondary" tone={slot.state === 'failed' ? 'danger' : 'textMuted'} testID="publish-file-line" accessibilityLiveRegion={slot.state === 'failed' ? 'polite' : undefined}>
              {line}
            </Text>
          </View>
        </View>
        {uploading ? <Bar share={slot.share} testID="publish-file-bar" /> : null}
      </Card>
    </Pressable>
  );
}

function Bar({ share, testID }: { share: number; testID: string }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(share * 100) }} style={[styles.track, { backgroundColor: colors.surfaceCard }]}>
      <View style={[styles.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: BODY_GAP },
  group: { gap: space.sm },
  note: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card },
  noteWords: { flex: 1, gap: space.xs },
  noteButton: { alignSelf: 'flex-start', marginTop: space.sm },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  fileWords: { flex: 1 },
  track: { height: productsMeterMetrics.track, borderRadius: productsMeterMetrics.trackRadius, marginTop: space.md, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: productsMeterMetrics.track, borderRadius: productsMeterMetrics.trackRadius },
  centre: { textAlign: 'center' },
});
