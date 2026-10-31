import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { ApiError } from '@/api/errors';
import { Button } from '@/components/Button';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Text } from '@/components/Text';
import { space, useWawu } from '@/theme';

import { setCover, useCover, type UploadedFile } from './draft';
import { pickCover } from './coverPick';
import { canPickFile } from './pickFile';
import { UPLOAD_CANCELLED, uploadFile } from './upload';

/** The picked cover's thumbnail is the shape the price card draws the same picture in on the next step: 52 by 66, corner 10 (PriceScreen). */
const thumb = { width: 52, height: 66, corner: 10 } as const;

/** `preview` is the clip the person uploaded, when there is one: its frame is the default cover. Audio and video have no clip (R-118): the Hub makes their preview. */
export type CoverChoiceProps = { preview?: UploadedFile | null };

type Stage = { state: 'idle' } | { state: 'uploading' } | { state: 'failed'; message: string };

/**
 * "Cover" on the preview step (no board draws it, so it sits under "How it will look" in the step's own style, as the thumbnail row does):
 * the picture the listing carries. For a video (or a course) with a readable frame the default is that frame; the person can pick a picture
 * of their own instead (the phone's photo picker), or choose none. A picture goes up to `content/cover` as soon as it is picked; a refusal (a
 * type or a size the Hub does not take, no room in storage) is the Hub's own sentence.
 */
export function CoverChoice({ preview }: CoverChoiceProps) {
  const { colors } = useWawu();
  const cover = useCover();
  const [stage, setStage] = useState<Stage>({ state: 'idle' });
  const picking = useRef(false);
  const hasFrame = Boolean(preview?.frame);
  // What the segment says: the frame, a picture the person picked, or none. Without a readable frame there is no default picture.
  const value = cover.mode === 'picture' ? 'picture' : cover.mode === 'none' || !hasFrame ? 'none' : 'frame';
  const items = [
    ...(hasFrame ? [{ value: 'frame', label: 'Video frame' }] : []),
    { value: 'picture', label: 'Picture' },
    { value: 'none', label: 'None' },
  ];

  const choosePicture = async () => {
    if (picking.current || stage.state === 'uploading') return;
    picking.current = true;
    try {
      const file = await pickCover();
      if (!file) return;
      setStage({ state: 'uploading' });
      try {
        const uploaded = await uploadFile(file, { folder: 'content/cover' }, () => undefined);
        // `uploadFile` has let go of the phone's own copy by now, so the picture is drawn from the link it came back with, never from that file.
        setCover({ mode: 'picture', file: { ...uploaded, previewUri: uploaded.fileUrl } });
        setStage({ state: 'idle' });
      } catch (error) {
        if (error instanceof ApiError && error.code === UPLOAD_CANCELLED) return;
        setStage({ state: 'failed', message: isApiError(error) && error.message ? error.message : 'That picture did not upload. Try again.' });
      }
    } catch {
      setStage({ state: 'failed', message: "We couldn't open your photos. Try again." });
    } finally {
      picking.current = false;
    }
  };

  const onChange = (next: string) => {
    setStage({ state: 'idle' });
    if (next === 'frame') setCover({ mode: 'default', file: null });
    else if (next === 'none') setCover({ mode: 'none', file: null });
    else if (cover.mode === 'picture' && cover.file) setCover({ mode: 'picture', file: cover.file });
    else void choosePicture();
  };

  return (
    <View style={styles.root} testID="cover-choice">
      <Text variant="label">Cover</Text>
      <Text variant="muted">The picture your listing carries.</Text>
      <SegmentedTabs testID="cover-mode" label="Cover" items={items} value={value} onChange={onChange} />
      {value === 'picture' ? (
        <View style={styles.picked} testID="cover-picked">
          <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
            {cover.mode === 'picture' && cover.file?.previewUri ? <Image testID="cover-picked-image" source={{ uri: cover.file.previewUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
          </View>
          <View style={styles.pickedWords}>
            <Text variant="body" numberOfLines={1}>
              {stage.state === 'uploading' ? 'Sending your picture' : cover.mode === 'picture' && cover.file ? cover.file.name : 'No picture yet'}
            </Text>
          </View>
          <Button testID="cover-pick" label={cover.mode === 'picture' && cover.file ? 'Change' : 'Pick a picture'} variant="secondary" size="sm" disabled={!canPickFile || stage.state === 'uploading'} onPress={() => void choosePicture()} />
        </View>
      ) : null}
      {stage.state === 'failed' ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="cover-failure">
          {stage.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  picked: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: { width: thumb.width, height: thumb.height, borderRadius: thumb.corner, overflow: 'hidden' },
  pickedWords: { flex: 1, minWidth: 0 },
});
