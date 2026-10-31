import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Avatar, hues } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/StatusPill';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

import type { CommunityMessage, CommunitySender } from './api';
import { clockTime } from './format';
import type { OutgoingMessage } from './useRoomMessages';
import { LongPressable, reportAction } from '@/features/report/LongPressable';

/**
 * design/_gen/inbox.js line 72, `post`: a 34 avatar and the words 10 apart; the name 13 / 600 with a "Host" pill and the time 6
 * apart; the bubble 4 under it, 10 by 14 inside, an 18 corner with a 6 corner at its top left, 15 on a 1.4 line.
 */
const postMetrics = { avatar: 34, between: 10, headGap: 6, head: 13, bubbleTop: 4, padV: 10, padH: 14, corner: 18, cornerTail: 6, body: 15, bodyLine: 1.4, photo: 240, photoRatio: 4 / 3, photoPad: 4, captionGap: 6 } as const;

function hueFor(id: string) {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return hues[sum % hues.length];
}

export type PostProps = {
  message: CommunityMessage;
  /** The sender, from the message or, for the person's own send, from their profile. */
  sender?: CommunitySender | null;
  isHost: boolean;
};

/** One message in the room: who wrote it, a Host tag when the room's host did, when, and what they said. */
export function MessagePost({ message, sender, isHost, onLongPress }: PostProps & { onLongPress?: () => void }) {
  const who = message.sender ?? sender ?? null;
  const name = who?.name || who?.handle || 'Member';
  return (
    <LongPressable onLongPress={onLongPress}>
    <View style={styles.row} testID={`post-${message.id}`} accessible accessibilityLabel={`${name}${isHost ? ', host' : ''}, ${clockTime(message.sentAt)}, ${message.text ?? attachmentWords(message).toLowerCase()}`} {...reportAction(onLongPress)}>
      <Avatar name={name} hue={hueFor(message.senderWawuId)} size={postMetrics.avatar} source={who?.avatarUrl ?? undefined} decorative />
      <View style={styles.words}>
        <View style={styles.head}>
          <Text variant="caption" tone="textPrimary" numberOfLines={1} style={[font(600), { fontSize: postMetrics.head }, styles.name]}>
            {name}
          </Text>
          {isHost ? <StatusPill label="Host" tone="accent" testID={`post-${message.id}-host`} /> : null}
          <Text variant="caption" tone="textMuted" style={{ fontSize: postMetrics.head }}>
            {clockTime(message.sentAt)}
          </Text>
        </View>
        <Bubble text={message.text} photo={message.imageUrl ?? undefined} fallback={attachmentWords(message)} testID={`post-${message.id}-bubble`} />
      </View>
    </View>
    </LongPressable>
  );
}

/** What a message with no words and no photo to draw is called: a video or a voice note (no player is built, so they are named), else a photo. */
function attachmentWords(message: Pick<CommunityMessage, 'imageUrl' | 'videoUrl' | 'voiceUrl'>): string {
  if (message.videoUrl) return 'Video';
  if (message.voiceUrl) return 'Voice note';
  return 'Photo';
}

/** The words, a photo, or both (a photo with a caption). `fallback` stands in when there is neither words nor a photo. */
function Bubble({ text, photo, fallback, dim, testID }: { text?: string | null; photo?: string; fallback?: string; dim?: boolean; testID?: string }) {
  const { colors } = useWawu();
  const words = text ?? (photo ? null : fallback ?? null);
  return (
    <View
      testID={testID}
      style={[
        styles.bubble,
        photo ? styles.photoBubble : null,
        { backgroundColor: colors.surfaceCard, opacity: dim ? 0.6 : 1, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
      ]}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          contentFit="cover"
          accessibilityLabel="Photo"
          accessibilityIgnoresInvertColors
          style={[styles.photo, { backgroundColor: colors.surfaceSunken }]}
          testID={testID ? `${testID}-photo` : undefined}
        />
      ) : null}
      {words ? (
        <Text variant="body" style={[styles.bubbleText, photo ? styles.caption : null]}>
          {words}
        </Text>
      ) : null}
    </View>
  );
}

export type OutgoingPostProps = {
  entry: OutgoingMessage;
  sender: CommunitySender | null;
  isHost: boolean;
  onRetry: () => void;
  onDiscard: () => void;
  /** Puts the words back in the field to be changed. Offered when sending them again cannot work. */
  onEdit: () => void;
  /** Opens Buy credits (I28). Offered when the Hub refused the message for want of credits. */
  onBuy?: () => void;
};

/** What the person just sent, until the server answers: the same post, quieter while it is on its way, and with its reason and a way on when it was refused. */
export function OutgoingPost({ entry, sender, isHost, onRetry, onDiscard, onEdit, onBuy }: OutgoingPostProps) {
  const name = sender?.name || sender?.handle || 'You';
  const failed = entry.status === 'failed';
  return (
    <View style={styles.row} testID={`outgoing-${entry.localId}`}>
      <Avatar name={name} hue={hueFor(sender?.wawuId ?? entry.localId)} size={postMetrics.avatar} source={sender?.avatarUrl ?? undefined} decorative />
      <View style={styles.words}>
        <View style={styles.head}>
          <Text variant="caption" tone="textPrimary" numberOfLines={1} style={[font(600), { fontSize: postMetrics.head }, styles.name]}>
            {name}
          </Text>
          {isHost ? <StatusPill label="Host" tone="accent" /> : null}
          <Text variant="caption" tone={failed ? 'danger' : 'textMuted'} style={{ fontSize: postMetrics.head }} testID={`outgoing-${entry.localId}-status`}>
            {failed ? 'Not sent' : 'Sending'}
          </Text>
        </View>
        <Bubble text={entry.text || null} photo={entry.photo?.previewUri} dim={!failed} testID={`outgoing-${entry.localId}-bubble`} />
        {failed ? (
          <View style={styles.failed} accessibilityRole="alert">
            <Text variant="caption" tone="danger" testID={`outgoing-${entry.localId}-error`}>
              {entry.error}
            </Text>
            <View style={styles.actions}>
              {entry.outOfCredits && onBuy ? <Button label="Buy credits" size="sm" onPress={onBuy} testID={`outgoing-${entry.localId}-buy`} /> : null}
              {entry.needsEdit ? (
                <Button label="Edit" variant="secondary" size="sm" onPress={onEdit} testID={`outgoing-${entry.localId}-edit`} />
              ) : (
                <Button label="Send again" variant="secondary" size="sm" onPress={onRetry} testID={`outgoing-${entry.localId}-retry`} />
              )}
              <Button label="Remove" variant="outline" size="sm" onPress={onDiscard} testID={`outgoing-${entry.localId}-discard`} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: postMetrics.between, alignSelf: 'stretch' },
  words: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  head: { flexDirection: 'row', alignItems: 'center', gap: postMetrics.headGap, maxWidth: '100%' },
  name: { flexShrink: 1 },
  bubble: {
    marginTop: postMetrics.bubbleTop,
    paddingVertical: postMetrics.padV,
    paddingHorizontal: postMetrics.padH,
    borderRadius: postMetrics.corner,
    borderTopLeftRadius: postMetrics.cornerTail,
    maxWidth: '100%',
  },
  bubbleText: { fontSize: postMetrics.body, lineHeight: postMetrics.body * postMetrics.bodyLine },
  failed: { marginTop: space.sm, gap: space.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  /** A photo bubble holds the picture edge to edge with a small margin; its words, if any, sit under it. */
  photoBubble: { padding: postMetrics.photoPad },
  photo: { width: postMetrics.photo, maxWidth: '100%', aspectRatio: postMetrics.photoRatio, borderRadius: postMetrics.corner - postMetrics.photoPad, borderTopLeftRadius: postMetrics.cornerTail },
  caption: { marginTop: postMetrics.captionGap, paddingHorizontal: postMetrics.padH - postMetrics.photoPad, paddingBottom: postMetrics.padV - postMetrics.photoPad },
});
