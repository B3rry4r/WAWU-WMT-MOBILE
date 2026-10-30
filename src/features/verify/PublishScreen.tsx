import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, Share, StyleSheet, View } from 'react-native';

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
import type { UploadedFile } from '@/features/create/draft';
import { formatBytes, previewHint, uploadTitle, type FormatId, type FormatRule } from '@/features/create/model';
import { pickFile } from '@/features/create/pickFile';
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

import { CATEGORIES, productLink, publishDraft, type Published } from './publishApi';

const BODY_GAP = 12;
const PREVIEW_HEIGHT = 190;

/** One file the person adds before publishing: nothing yet, on its way (the real share that has gone up), ready, or refused. */
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
 * the file and the preview buyers see before paying, both through the create flow's upload (`POST /uploads/presign` under the draft's
 * format, the Hub's own type and size rules); the meter is the Hub's own count (`GET /me/tier`). Before the first publish the category
 * is asked here (the draft form stays without it), then `POST /product-drafts/{id}/publish`.
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
  const [preview, setPreview] = useState<Slot>({ state: 'empty' });
  const [category, setCategory] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState<Published | null>(null);
  const [gone, setGone] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [limit, setLimit] = useState(false);
  const aborts = useRef<AbortController[]>([]);
  const publishing = useRef(false);
  const firstTap = useFirstTap();
  useEffect(() => () => aborts.current.forEach((a) => a.abort()), []);

  const rule: FormatRule | undefined = formats.data?.find((r) => r.id === draft.data?.contentType);
  const format = (draft.data?.contentType ?? null) as FormatId | null;
  const running = tier.data ? tier.data.state === 'active' || tier.data.state === 'ending' : false;

  const add = async (which: 'full' | 'preview') => {
    if (!rule || !format || !firstTap()) return;
    const set = which === 'full' ? setFull : setPreview;
    const fileRule = which === 'full' ? rule.full : rule.preview;
    let file: ChosenFile | null;
    try {
      file = await pickFile(fileRule.contentTypes);
    } catch {
      set({ state: 'failed', message: "We couldn't open your files. Try again." });
      return;
    }
    if (!file) return;
    const refusal = refusalFor(file, fileRule);
    if (refusal) {
      set({ state: 'failed', message: refusal });
      return;
    }
    const controller = new AbortController();
    aborts.current.push(controller);
    set({ state: 'uploading', name: file.name, share: 0 });
    try {
      const uploaded = await uploadFile(file, { folder: which === 'full' ? 'content/full' : 'content/preview', format }, (share) => set((s) => (s.state === 'uploading' ? { ...s, share } : s)), controller.signal);
      if (controller.signal.aborted) return;
      set({ state: 'ready', file: uploaded });
    } catch (error) {
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
  const filesReady = full.state === 'ready' && preview.state === 'ready';
  const canPublish = !busy && published === null && filesReady && chosenCategory !== null && otherMissing.length === 0;

  const publish = async () => {
    if (publishing.current || !canPublish || full.state !== 'ready' || preview.state !== 'ready' || !draft.data) return;
    publishing.current = true;
    setBusy(true);
    try {
      // The category is the Hub's field on the draft: it is saved before the publish reads the draft.
      if (needsCategory && category) await updateDraft(draft.data.id, { category: category as (typeof CATEGORIES)[number]['id'] });
      const outcome = await publishDraft(draft.data.id, { previewAsset: preview.file.fileUrl, fullAsset: full.file.fileUrl });
      switch (outcome.kind) {
        case 'done':
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
        <PreviewTile slot={preview} hint={previewHint(rule?.preview)} disabled={busy || published !== null} onPress={() => void add('preview')} />
        <FileRow slot={full} title={format ? uploadTitle(format) : 'Add the file'} disabled={busy || published !== null} onPress={() => void add('full')} />
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

/** The part buyers see before paying: a tile that takes the file, shows the real share that has gone up, and holds the Hub's own hint. */
function PreviewTile({ slot, hint, disabled, onPress }: { slot: Slot; hint: string; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const uploading = slot.state === 'uploading';
  const picture = slot.state === 'ready' ? slot.file.previewUri : undefined;
  return (
    <Pressable
      testID="publish-preview"
      accessibilityRole="button"
      accessibilityLabel={slot.state === 'ready' ? `Preview, ${slot.file.name}. Replace` : 'Add a preview'}
      disabled={disabled || uploading}
      onPress={onPress}
      style={[styles.preview, { backgroundColor: colors.surfaceSunken }]}
    >
      {picture ? (
        <Image testID="publish-preview-picture" source={{ uri: picture }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <>
          <IconTile icon={slot.state === 'ready' ? 'FileCheck2' : 'Image'} tone={slot.state === 'ready' ? 'in' : 'accent'} size={48} />
          <Text variant="body" style={font(600)}>
            {slot.state === 'ready' ? slot.file.name : 'Add a preview'}
          </Text>
          <Text variant="meta" tone={slot.state === 'failed' ? 'danger' : 'textMuted'} style={styles.centre} accessibilityLiveRegion={slot.state === 'failed' ? 'polite' : undefined}>
            {slot.state === 'failed' ? slot.message : hint}
          </Text>
        </>
      )}
      {uploading ? <Bar share={slot.share} testID="publish-preview-bar" /> : null}
    </Pressable>
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
  preview: { height: PREVIEW_HEIGHT, borderRadius: radius.media, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.lg, overflow: 'hidden' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  fileWords: { flex: 1 },
  track: { height: productsMeterMetrics.track, borderRadius: productsMeterMetrics.trackRadius, marginTop: space.md, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: productsMeterMetrics.track, borderRadius: productsMeterMetrics.trackRadius },
  centre: { textAlign: 'center' },
});
