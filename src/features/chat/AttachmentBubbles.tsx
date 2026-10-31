import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { clockTime } from '@/features/communities/format';
import { formatBytes } from '@/features/create/model';
import { font, space, useWawu } from '@/theme';

import { bubbleMetrics, PendingNote, Time, type PendingState } from './Bubbles';
import type { ChatFileKind } from './attachments';
import { LongPressable } from '@/features/report/LongPressable';

/**
 * A photo, a video or a file in the chat (FIX-104). No board draws these bubbles, so they are built from the text bubble's own parts
 * (R-29, BACKEND_GAPS G-FIX-104-2): the same 78% width, the same 20 corner with a 6 corner at the sender's bottom, the accent on the
 * person's own and a card with a hairline ring on theirs, the time 4 under it at 11.5. A photo fills the bubble; a video is a card with a
 * play mark; a file is a row with its name and size. While a message is on its way it is dimmed with "Sending" under it, and when it
 * was refused it says why with Try again and Delete, as a text message does.
 */
const mediaMetrics = { size: 224, play: 52, filePad: 12, fileTile: 40, fileGap: 12, fileWordsGap: 2, fileName: 15, fileMeta: 12.5, captionPadV: 10, captionPadH: 14, spinner: 28 } as const;

/**
 * A size in words. A file that was refused is rounded UP to one decimal, so a 21,000,009 byte PDF reads "20.1 MB" beside the Hub's "up to 20 MB"
 * and never "20.0 MB" (FIX-104 round 2); every other size is `formatBytes`'.
 */
function sizeWords(bytes: number, refused: boolean): string {
  const mb = bytes / (1024 * 1024);
  if (!refused || mb < 1 || mb >= 1024) return formatBytes(bytes);
  const up = Math.ceil(mb * 10) / 10;
  return `${Number.isInteger(up) ? up : up.toFixed(1)} MB`;
}

const FILE_WORDS: Record<string, string> = { 'application/pdf': 'PDF' };

export type AttachmentBubbleProps = {
  id: string;
  kind: ChatFileKind;
  mine: boolean;
  contentType: string;
  /** A photo's address: the Hub's link, or the phone's own copy while it goes up. Null when storage could not make a link (the bubble shows a plain tile). */
  uri?: string | null;
  /** A file's own name. */
  name?: string | null;
  bytes?: number | null;
  /** Words sent with the file, when there are any. */
  caption?: string | null;
  /** When it was sent. Left out for a message that is still on its way. */
  at?: string;
  /** Opens it. Left out for a message that is still on its way. */
  onOpen?: () => void;
  /** Opening is under way: the link is being asked for. */
  opening?: boolean;
  pending?: PendingState;
};

const kindWord = (kind: ChatFileKind) => (kind === 'image' ? 'Photo' : kind === 'video' ? 'Video' : 'File');

export function AttachmentBubble({ id, kind, mine, contentType, uri, name, bytes, caption, at, onOpen, opening, pending, onLongPress }: AttachmentBubbleProps & { onLongPress?: () => void }) {
  const { colors } = useWawu();
  const size = bytes && bytes > 0 ? sizeWords(bytes, pending?.status === 'failed') : null;
  const fileKind = FILE_WORDS[contentType] ?? 'File';
  const title = kind === 'file' ? (name?.trim() || 'File') : kindWord(kind);
  const label = `${mine ? 'You' : 'They'}${at ? `, ${clockTime(at)}` : ''}, ${title}${kind === 'file' && size ? `, ${size}` : ''}${caption ? `, ${caption}` : ''}`;
  const surface = mine
    ? { backgroundColor: colors.accent }
    : { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] };
  const tone = mine ? 'textOnAccent' : 'textPrimary';
  const muted = mine ? 'textOnAccent' : 'textMuted';

  let content;
  if (kind === 'file') {
    content = (
      <View style={styles.file}>
        {mine ? (
          // The person's own file sits on the accent: the mark is the bubble's on-colour with the accent glyph, so it shows in both themes.
          <View aria-hidden style={[styles.ownMark, { backgroundColor: colors.textOnAccent }]} testID={`bubble-${id}-mark`}>
            <Icon name="FileText" size={Math.round(mediaMetrics.fileTile * 0.45)} color={colors.accent} strokeWidth={2} />
          </View>
        ) : (
          <IconTile icon="FileText" tone="neutral" size={mediaMetrics.fileTile} />
        )}
        <View style={styles.fileWords}>
          <Text variant="body" tone={tone} numberOfLines={2} style={[font(600), { fontSize: mediaMetrics.fileName }]} testID={`bubble-${id}-name`}>
            {title}
          </Text>
          <Text variant="caption" tone={muted} style={{ fontSize: mediaMetrics.fileMeta, opacity: mine ? 0.8 : 1 }}>
            {size ? `${fileKind} · ${size}` : fileKind}
          </Text>
        </View>
      </View>
    );
  } else if (kind === 'image' && uri) {
    content = <Image source={{ uri }} contentFit="cover" accessibilityLabel="Photo" style={styles.media} testID={`bubble-${id}-image`} />;
  } else {
    content = (
      <View style={[styles.media, styles.tile, { backgroundColor: colors.surfaceSunken }]} testID={`bubble-${id}-tile`}>
        {kind === 'video' ? <IconTile icon="Play" tone="accent" size={mediaMetrics.play} /> : <Icon name="Image" size={mediaMetrics.play / 2} color={colors.textMuted} />}
        {size ? (
          <Text variant="caption" tone="textMuted" style={{ fontSize: mediaMetrics.fileMeta }}>
            {`${kindWord(kind)} · ${size}`}
          </Text>
        ) : null}
      </View>
    );
  }

  const body = (
    <View style={[styles.bubble, mine ? styles.tailMine : styles.tailTheirs, surface, pending ? { opacity: 0.6 } : null]}>
      {content}
      {pending?.status === 'sending' || opening ? (
        <View style={[StyleSheet.absoluteFill, styles.spinner]} pointerEvents="none">
          <ActivityIndicator color={colors.textPrimary} size="small" />
        </View>
      ) : null}
      {caption ? (
        <Text variant="body" tone={tone} style={styles.caption}>
          {caption}
        </Text>
      ) : null}
    </View>
  );

  return (
    <LongPressable onLongPress={onLongPress}>
    <View testID={`bubble-${id}`} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      {onOpen && !pending ? (
        <Pressable testID={`bubble-${id}-open`} accessibilityRole="button" accessibilityLabel={`${label}. Open`} disabled={opening} onPress={onOpen}>
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={label}>
          {body}
        </View>
      )}
      {pending ? <PendingNote id={id} pending={pending} /> : at ? <Time iso={at} mine={mine} /> : null}
    </View>
    </LongPressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: bubbleMetrics.timeGap },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: bubbleMetrics.maxWidth },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start', maxWidth: bubbleMetrics.maxWidth },
  bubble: { borderRadius: bubbleMetrics.corner, overflow: 'hidden' },
  tailMine: { borderBottomRightRadius: bubbleMetrics.tail },
  tailTheirs: { borderBottomLeftRadius: bubbleMetrics.tail },
  media: { width: mediaMetrics.size, height: mediaMetrics.size },
  tile: { alignItems: 'center', justifyContent: 'center', gap: space.sm },
  file: { flexDirection: 'row', alignItems: 'center', gap: mediaMetrics.fileGap, padding: mediaMetrics.filePad, minWidth: mediaMetrics.size },
  ownMark: { width: mediaMetrics.fileTile, height: mediaMetrics.fileTile, borderRadius: mediaMetrics.fileTile / 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileWords: { flexShrink: 1, gap: mediaMetrics.fileWordsGap },
  spinner: { alignItems: 'center', justifyContent: 'center' },
  caption: { paddingVertical: mediaMetrics.captionPadV, paddingHorizontal: mediaMetrics.captionPadH, fontSize: bubbleMetrics.body, lineHeight: bubbleMetrics.body * bubbleMetrics.line },
});
