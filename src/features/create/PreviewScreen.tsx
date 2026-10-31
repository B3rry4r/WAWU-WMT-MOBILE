import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { useWawu } from '@/theme';

import { CoverChoice } from './CoverChoice';
import { CreateFrame } from './CreateFrame';
import { useDetails } from './details';
import { fullFileOf, useCover, useDraft, useLessons, type UploadedFile } from './draft';
import { coverRequired, iconOf, labelOf, previewLine, previewWayOf, type FormatId } from './model';
import { Stepper } from './parts';
import { listingStill, type StillSource } from './still';

/** me.js `previewStep`: the title at 20, 6 above its line; three 3:4 tiles 8 apart with 10 corners; the third frosted (8 blur, black at 0.3) with an 18 lock. */
const lookMetrics = { title: 20, titleGap: 6, tileGap: 8, tileCorner: 10, ratio: 3 / 4, frost: 8, lock: 18, kindIcon: 28, labelGap: 10 } as const;

export type PreviewScreenProps = {
  format: FormatId;
  onBack: () => void;
  /** Opens the details step (M23). Left out until that step is built (R-47): the screen then draws no Continue. */
  onContinue?: () => void;
};

/**
 * M22 · step 3 is the COVER step for every kind (R-118, owner, 31 Oct 2026): nobody uploads a preview file any more. A PAID piece's preview is
 * made for the creator (the Hub cuts the first 30 seconds, or makes the first pages; the phone makes a smaller copy of a picture), and one
 * muted line says which. A template, and a course whose first lesson is not a video, preview as their cover, so a paid one needs a cover to go
 * on. A FREE piece has no preview (the whole piece is open to everyone, R-8): no line, no tiles, and the cover is only the picture of the listing.
 * The three tiles show how the listing will sit beside a locked one.
 */
export function PreviewScreen({ format, onBack, onContinue }: PreviewScreenProps) {
  const draft = useDraft();
  const lessons = useLessons();
  const full = fullFileOf(draft, lessons);
  const free = useDetails().accessType === 'free';
  const cover = useCover();
  const way = previewWayOf(format, full);
  const needed = coverRequired(way, free);
  const ready = !needed || (cover.mode === 'picture' && Boolean(cover.file));
  const foot = onContinue ? <Button testID="create-continue" label="Continue" full disabled={!ready} onPress={onContinue} /> : undefined;

  return (
    <CreateFrame testID="preview-screen" title={`New ${labelOf(format)}`} subtitle="Step 3 of 5" onLeave={onBack} foot={foot}>
      <Stepper active={1} />
      <View style={styles.heading}>
        <Text variant="h2" style={styles.title}>
          Add a cover
        </Text>
        {free ? null : (
          <Text variant="muted" testID="preview-line">
            {previewLine(format, way)}
          </Text>
        )}
      </View>
      {free ? null : <HowItLooks format={format} file={full} />}
      <CoverChoice source={full} required={needed} />
    </CreateFrame>
  );
}

/** "How it will look": the preview twice, then once more behind a lock, as a buyer meets it before paying. */
function HowItLooks({ format, file }: { format: FormatId; file: Pick<UploadedFile, 'contentType' | 'previewUri' | 'frame'> | null }) {
  // The tiles draw what the listing will carry: the cover the person picked, else the frame of their video or their own picture (R-114).
  const cover = useCover();
  const picture = file ? listingStill(file, cover) : cover.mode === 'picture' && cover.file?.previewUri ? { uri: cover.file.previewUri } : null;
  return (
    <View style={styles.look} testID="preview-look">
      <Text variant="label">How it will look</Text>
      <View style={styles.tiles}>
        <LookTile format={format} picture={picture} />
        <LookTile format={format} picture={picture} />
        <LookTile format={format} picture={picture} locked />
      </View>
    </View>
  );
}

function LookTile({ format, picture, locked }: { format: FormatId; picture: StillSource | null; locked?: boolean }) {
  const { colors } = useWawu();
  const [broken, setBroken] = useState(false);
  const still = picture && !broken ? picture : null;
  return (
    <View testID={locked ? 'preview-tile-locked' : 'preview-tile'} style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
      {still ? (
        <Image testID="preview-tile-image" source={still} contentFit="cover" blurRadius={locked ? lookMetrics.frost : 0} style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
      ) : locked ? null : (
        <View style={[StyleSheet.absoluteFill, styles.centre]}>
          <Icon name={iconOf(format)} size={lookMetrics.kindIcon} color={colors.textMuted} />
        </View>
      )}
      {locked ? (
        <View style={[StyleSheet.absoluteFill, styles.centre, { backgroundColor: colors.mediaBlack30 }]}>
          <Icon name="Lock" size={lookMetrics.lock} color={colors.textOnAccent} strokeWidth={2.2} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: lookMetrics.titleGap },
  title: { fontSize: lookMetrics.title },
  look: { gap: lookMetrics.labelGap },
  tiles: { flexDirection: 'row', gap: lookMetrics.tileGap },
  tile: { flex: 1, aspectRatio: lookMetrics.ratio, borderRadius: lookMetrics.tileCorner, overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
});

