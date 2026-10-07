import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import type { MediaItem } from './form';

/**
 * design/_gen/me.js line 72 (M36): a 130 high box, 22 corner, the sunken surface with a 1.5 ring in the strong border,
 * a 26 icon over a 13.5 semi-bold line, 8 between them. The previews under it (not drawn: the canvas shows the box before
 * anything is chosen) are 72 across with the same corners as the strip on M35.
 */
const boxMetrics = { height: 130, ring: 1.5, icon: 26, label: 13.5, between: space.sm } as const;
const previewMetrics = { size: 72, radius: 14, remove: 24, removeIcon: 12, removeInset: space.xs, status: 22, gap: space.sm } as const;

export type MediaPickerProps = {
  items: readonly MediaItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  disabled?: boolean;
  /** What M36 says about how many files a work can carry, before Save. */
  hint: string;
  /** The app's sentence for a pick that was more than a work can carry. It replaces the hint until the next pick. */
  notice?: string | null;
  /** No room for another file: the box stays up (so the hint is read where the person looks) but does nothing. */
  full?: boolean;
};

/** M36's "Add photos or a video" box, and under it each file chosen so far: uploading, ready, or failed with a way to try again. */
export function MediaPicker({ items, onAdd, onRemove, onRetry, disabled, hint, notice, full }: MediaPickerProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View style={styles.root}>
      <Pressable
        testID="work-add-media"
        accessibilityRole="button"
        accessibilityLabel="Add photos or a video"
        accessibilityState={{ disabled: Boolean(disabled || full) }}
        disabled={disabled || full}
        onPress={onAdd}
        {...ring.handlers}
        style={[
          styles.box,
          { backgroundColor: colors.surfaceSunken, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: boxMetrics.ring, color: colors.borderStrong, inset: true }] },
          ring.style,
        ]}
      >
        <Icon name="ImagePlus" size={boxMetrics.icon} color={full ? colors.textDisabled : colors.textSecondary} />
        <Text variant="body" tone={full ? 'textDisabled' : 'textSecondary'} style={[font(600), { fontSize: boxMetrics.label }]}>
          Add photos or a video
        </Text>
      </Pressable>
      {notice ? (
        <Text variant="caption" tone="danger" testID="work-media-notice" accessibilityRole="alert">
          {notice}
        </Text>
      ) : (
        <Text variant="caption" tone="textMuted" testID="work-media-hint">
          {hint}
        </Text>
      )}
      {items.length > 0 ? (
        <View testID="work-media-previews" style={styles.previews}>
          {items.map((item, index) => (
            <Preview key={item.id} item={item} index={index} disabled={disabled} onRemove={() => onRemove(item.id)} onRetry={() => onRetry(item.id)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type PreviewProps = { item: MediaItem; index: number; disabled?: boolean; onRemove: () => void; onRetry: () => void };

function Preview({ item, index, disabled, onRemove, onRetry }: PreviewProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const retryRing = useFocusRing();
  const video = item.file.contentType.startsWith('video/');
  const kind = video ? 'video' : 'photo';
  // A chosen file the screen cannot draw (it is not a picture): the same quiet block a work card shows, with its icon.
  const [broken, setBroken] = useState(false);
  return (
    <View testID={`work-media-${index}`} style={[styles.preview, { backgroundColor: colors.surfaceSunken }]}>
      {video || broken ? (
        <View testID={`work-media-${index}-placeholder`} style={styles.center}>
          <Icon name={video ? 'Video' : 'Image'} size={boxMetrics.icon} color={colors.textMuted} />
        </View>
      ) : (
        <Image testID={`work-media-${index}-image`} source={{ uri: item.file.previewUri }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityElementsHidden onError={() => setBroken(true)} />
      )}
      {item.state === 'uploading' ? (
        <View testID={`work-media-${index}-uploading`} accessibilityRole="progressbar" accessibilityLabel={`Uploading ${kind} ${index + 1}`} style={[styles.center, { backgroundColor: colors.surfaceScrim }]}>
          <ActivityIndicator size="small" color={colors.textOnAccent} />
        </View>
      ) : null}
      {item.state === 'failed' ? (
        <Pressable
          testID={`work-media-${index}-retry`}
          accessibilityRole="button"
          accessibilityLabel={`${item.error ?? 'That file did not upload.'} Try ${kind} ${index + 1} again`}
          onPress={onRetry}
          {...retryRing.handlers}
          style={[styles.center, { backgroundColor: colors.surfaceScrim }, retryRing.style]}
        >
          <Icon name="RotateCw" size={previewMetrics.status} color={colors.textOnAccent} strokeWidth={2.2} />
        </Pressable>
      ) : null}
      <Pressable
        testID={`work-media-${index}-remove`}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${kind} ${index + 1}`}
        disabled={disabled}
        hitSlop={space.sm}
        onPress={onRemove}
        {...ring.handlers}
        style={[styles.remove, { backgroundColor: colors.surfaceScrim }, ring.style]}
      >
        <Icon name="X" size={previewMetrics.removeIcon} color={colors.textOnAccent} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  box: { height: boxMetrics.height, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', gap: boxMetrics.between },
  previews: { flexDirection: 'row', flexWrap: 'wrap', gap: previewMetrics.gap },
  preview: { width: previewMetrics.size, height: previewMetrics.size, borderRadius: previewMetrics.radius, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', ...StyleSheet.flatten(StyleSheet.absoluteFill) },
  remove: {
    position: 'absolute',
    top: previewMetrics.removeInset,
    right: previewMetrics.removeInset,
    width: previewMetrics.remove,
    height: previewMetrics.remove,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
