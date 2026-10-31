import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { KeyValueRow } from '@/components/ListRow';
import { APP_NAME } from '@/components/BrandMark';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { formatMoney } from '@/components/Money';
import { PricePicker } from '@/components/PricePicker';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Text } from '@/components/Text';
import { listOf, refetchIfNotOnList, usePrices } from '@/features/prices/api';
import { stopOf } from '@/features/prices/model';
import { font, space, useWawu } from '@/theme';

import { allowanceKey, createContent, fetchSaleTerms, saleTermsKey, saveLessons, type LessonInput, type SaleTerms } from './api';
import { CreateFrame } from './CreateFrame';
import { fullFileOf, getCover, getDraft, getSmallCopy, resetDraft, setMade, setPreview, useCover, useDraft, useLessons, useMade, type DraftLesson, type UploadedFile } from './draft';
import { priceOf, priceReady, setDetails, setSent, useDetails, type AccessType } from './details';
import { coverRequired, formatBytes, iconOf, labelOf, previewWayOf, type FormatId } from './model';
import { Stepper } from './parts';
import { listingStill } from './still';
import { coverAssetFor } from './coverSend';
import { uploadFile } from './upload';

/** The cover 52 by 66 with 10 corners; the summary card 12 by 14 (the picker's own measures are in `PricePicker`). */
const priceMetrics = { coverW: 52, coverH: 66, coverCorner: 10, title: 14.5, meta: 12.5, metaGap: 3, padV: space.md, padH: 14, note: 12.5 } as const;
/** The "Free for everyone" card: 14 by 16, a 44 round gift, 12 between it and the words, 15.5 over 12.5 two below. */
const freeMetrics = { padV: 14, padH: space.lg, between: space.md, icon: 44, title: 15.5, line: 12.5, lineGap: 2 } as const;

export const MODES = [
  { value: 'paid', label: 'Paid' },
  { value: 'free', label: 'Free' },
] as const satisfies readonly { value: AccessType; label: string }[];

/** `84 pages`, or what the file weighs when it does not say how many pages it has. */
const sizeOf = (file: UploadedFile): string => (file.pages ? `${file.pages} ${file.pages === 1 ? 'page' : 'pages'}` : formatBytes(file.bytes));

/** "PDF · 84 pages": the format, then the full file as the person's own file says. R-118: the preview is made for them, so it is not listed. */
export function pieceMeta(format: FormatId, full: UploadedFile): string {
  return `${labelOf(format)} · ${sizeOf(full)}`;
}

/** The sentence when a picture's smaller copy is gone (the app was closed and opened again, or the phone could not keep it). */
export const COPY_GONE = 'Your preview could not be made. Choose your picture again.';

/** The sentence under a refused send: the Hub's own words when it gave them, else one the person can act on. */
export const sendFailure = (error: unknown): string => (error instanceof ApiError && error.message ? error.message : 'We could not send it. Check your connection and try again.');

/** The Hub's list of a course's lessons, from what the lessons step collected: every lesson has a title and a file by now. */
export function lessonInputs(lessons: readonly DraftLesson[]): LessonInput[] {
  return lessons.flatMap((l) =>
    l.file ? [{ title: l.title.trim(), ...(l.duration.trim() ? { durationLabel: l.duration.trim() } : {}), assetKey: l.file.key }] : [],
  );
}

/** The sentence under a course that was taken for review while its lessons were not saved. */
export const lessonsFailure = (error: unknown): string =>
  `Your course is in review, but its lessons did not save. ${error instanceof ApiError && error.message ? error.message : 'Check your connection and try again.'}`;

/**
 * The `previewAsset` a piece is sent with, or null when it sends none (R-118). Only a PAID picture has one to send: the smaller copy the phone
 * made when the picture was chosen, uploaded now as the preview and kept in the draft, so a Send that fails and is tried again uses it rather
 * than sending a second. A free piece sends none, and one left over from an earlier try at paid is given back.
 */
export async function previewFor(format: FormatId, full: UploadedFile, free: boolean): Promise<string | null> {
  if (free || previewWayOf(format, full) !== 'copy') {
    if (getDraft().preview) setPreview(null);
    return null;
  }
  const held = getDraft().preview;
  if (held) return held.fileUrl;
  const copy = getSmallCopy();
  if (!copy) throw new ApiError('unknown', 0, COPY_GONE);
  const uploaded = await uploadFile(copy, { folder: 'content/preview', format: 'image' }, () => undefined);
  setPreview(uploaded);
  return uploaded.fileUrl;
}

export type PriceScreenProps = {
  format: FormatId;
  onBack: () => void;
  /** Opens M25 once the Hub has taken the piece. */
  onSent: () => void;
};

/**
 * M24 · Price (step 5 of 5) and M37 (the same step with Free picked). Paid asks for a price in whole naira; Free sends 0 and
 * says what free means (R-8). Send for review is the create call: the Hub files every piece as pending, so a piece that goes
 * through is in review, and the files then belong to it, not to the draft. The quick prices, "You earn per sale", "Your share"
 * and "Listing fee" are the Hub's own (`GET /content/sale-terms`, FIX-110): the app never multiplies money, and none of the four is
 * drawn until the Hub has answered. Left out: the Dollar and USDT picker (R-64).
 */
export function PriceScreen({ format, onBack, onSent }: PriceScreenProps) {
  const details = useDetails();
  const draft = useDraft();
  const lessons = useLessons();
  const full = fullFileOf(draft, lessons);
  const made = useMade();
  const queryClient = useQueryClient();
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const free = details.accessType === 'free';
  // The price picked, in whole naira: the picker only ever gives one on the Hub's list.
  const picked = free ? null : priceOf(details.price);
  // The picker never chooses a price by itself, so this step starts a paid piece on the design's stop (₦2,500, or the nearest list price).
  const start = stopOf(listOf(usePrices().data), null);
  useEffect(() => {
    if (!free && details.price === '' && start !== null) setDetails({ price: String(start) });
  }, [free, details.price, start]);
  // The listing fee is the Hub's (`GET /content/sale-terms`, FIX-110), drawn once it has answered.
  const terms = useQuery({ queryKey: saleTermsKey(null), queryFn: () => fetchSaleTerms(null) });

  const send = async () => {
    const price = free ? 0 : priceOf(details.price);
    if (sending.current || price === null || !full || details.category === null) return;
    // A template, or a course with no video first, previews as its cover: a paid one cannot be sent without it (step 3 holds Continue for the same reason).
    if (coverRequired(previewWayOf(format, full), free) && !(getCover().mode === 'picture' && getCover().file)) {
      setFailure('Add a cover first. It is the preview buyers see.');
      return;
    }
    sending.current = true;
    setBusy(true);
    setFailure(null);
    try {
      let taken = made;
      if (!taken) {
        // The cover (R-114): the picture the person picked, none, or by default the frame of a video preview, sent to `content/cover` now.
        const coverAsset = await coverAssetFor(full, getCover());
        const previewAsset = await previewFor(format, full, free);
        const sent = await createContent({
          contentType: format,
          title: details.title.trim(),
          description: details.description.trim(),
          category: details.category,
          accessType: details.accessType,
          price,
          // R-118: nobody uploads a preview. A free piece has none; a paid picture sends the smaller copy the phone made; any other paid piece
          // asks the Hub to make it (the first 30 seconds, the first pages, or its cover).
          ...(previewAsset ? { previewAsset } : free ? {} : { previewFromFile: true }),
          fullAsset: full.fileUrl,
          ...(coverAsset ? { coverAsset } : {}),
          ...(details.parentCourse ? { parentCourseId: details.parentCourse.id } : {}),
        });
        // A course is made first and its lessons follow. The Hub's answer carries the piece's id; without one the piece is in review
        // already, so it goes on to M25 (its lessons can be added from the course itself) rather than being made a second time.
        taken = sent.id && format === 'course' ? { id: sent.id, title: sent.title } : null;
        if (taken) setMade(taken);
        else setSent({ title: sent.title });
      }
      if (taken) {
        try {
          await saveLessons(taken.id, lessonInputs(lessons));
        } catch (error) {
          setFailure(lessonsFailure(error));
          sending.current = false;
          setBusy(false);
          return;
        }
        setSent({ title: taken.title });
      }
      resetDraft();
      void queryClient.invalidateQueries({ queryKey: allowanceKey });
      onSent();
    } catch (error) {
      // An admin changed the list while the picker was open: read it again, and the Hub's own sentence says what is on it now.
      refetchIfNotOnList(queryClient, error);
      setFailure(sendFailure(error));
      sending.current = false;
      setBusy(false);
    }
  };

  const foot = (
    <>
      {failure ? <Banner testID="price-failure" tone="danger" title={made ? 'Lessons not saved' : 'Not sent'} body={failure} /> : null}
      {free ? null : <NoteLine />}
      <Button testID="create-send" label={made ? 'Save the lessons' : 'Send for review'} full loading={busy} disabled={!priceReady(details)} onPress={() => void send()} />
    </>
  );

  return (
    <CreateFrame testID="price-screen" title={`New ${labelOf(format)}`} subtitle="Step 5 of 5" onLeave={onBack} foot={foot}>
      <Stepper active={3} />
      {full ? <PieceCard format={format} title={details.title.trim()} meta={pieceMeta(format, full)} cover={full} /> : null}
      <SegmentedTabs
        testID="price-mode"
        label="Paid or free"
        items={MODES}
        value={details.accessType}
        onChange={(accessType) => {
          setFailure(null);
          setDetails({ accessType });
        }}
      />
      {free ? (
        <>
          <FreeCard />
          <Text variant="muted" testID="price-free-count">
            Free pieces count toward your uploads.
          </Text>
        </>
      ) : (
        <PricePicker
          testID="price-picker"
          value={picked}
          onChange={(naira) => {
            setFailure(null);
            setDetails({ price: String(naira) });
          }}
          label="Your price"
          earnSuffix="a sale"
        />
      )}
      {!free && terms.data ? <ListingFeeCard terms={terms.data} /> : null}
    </CreateFrame>
  );
}

/** M24's card under the price: the listing fee, "Free" when the Hub says 0 (FIX-110). */
export function ListingFeeCard({ terms }: { terms: SaleTerms }) {
  return (
    <GroupedList testID="price-terms">
      <KeyValueRow testID="price-fee" label="Listing fee" value={terms.listingFeeKobo === 0 ? 'Free' : formatMoney(terms.listingFeeKobo, { decimals: false })} />
    </GroupedList>
  );
}

/** "Who Made This? checks every piece before it goes live": true of every piece, the Hub files each new one as pending. */
function NoteLine() {
  const { colors } = useWawu();
  return (
    <Text variant="caption" testID="price-note" style={[styles.note, { color: colors.textMuted }]}>
      {`${APP_NAME} checks every piece before it goes live`}
    </Text>
  );
}

/** The piece as a buyer will meet it: its cover (the preview, when that is a picture, or a frame of it when it is a video), its title, and what was uploaded. Paid or free: the card is the piece, not the price. */
function PieceCard({ format, title, meta, cover }: { format: FormatId; title: string; meta: string; cover: Pick<UploadedFile, 'contentType' | 'previewUri' | 'frame'> }) {
  const { colors } = useWawu();
  const [broken, setBroken] = useState(false);
  const picture = listingStill(cover, useCover());
  const still = picture && !broken ? picture : null;
  return (
    <Card padded testID="price-piece" style={styles.piece}>
      <View style={styles.pieceRow}>
        <View style={[styles.cover, { backgroundColor: colors.surfaceSunken }]}>
          {still ? (
            <Image testID="price-piece-image" source={still} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.centre]}>
              <Icon name={iconOf(format)} size={space.s2xl} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.pieceWords}>
          <Text variant="body" numberOfLines={2} style={[font(600), styles.pieceTitle]}>
            {title}
          </Text>
          <Text variant="caption" tone="textMuted" numberOfLines={2} style={styles.pieceMeta}>
            {meta}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/** M37's card: "Free for everyone", then what that means: anyone can open it and fans can still tip (R-8). */
export function FreeCard() {
  return (
    <Card padded testID="price-free" style={styles.free}>
      <View style={styles.freeRow}>
        <IconTile icon="Gift" tone="accent" size={freeMetrics.icon} />
        <View style={styles.pieceWords}>
          <Text variant="body" style={[font(600), styles.freeTitle]}>
            Free for everyone
          </Text>
          <Text variant="caption" tone="textMuted" style={styles.freeLine}>
            Anyone can open it. Fans can still tip.
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  note: { textAlign: 'center', fontSize: priceMetrics.note },
  piece: { paddingVertical: priceMetrics.padV, paddingHorizontal: priceMetrics.padH },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cover: { width: priceMetrics.coverW, height: priceMetrics.coverH, borderRadius: priceMetrics.coverCorner, overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  pieceWords: { flex: 1, minWidth: 0 },
  pieceTitle: { fontSize: priceMetrics.title },
  pieceMeta: { fontSize: priceMetrics.meta, marginTop: priceMetrics.metaGap },
  free: { paddingVertical: freeMetrics.padV, paddingHorizontal: freeMetrics.padH },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: freeMetrics.between },
  freeTitle: { fontSize: freeMetrics.title },
  freeLine: { fontSize: freeMetrics.line, marginTop: freeMetrics.lineGap },
});
