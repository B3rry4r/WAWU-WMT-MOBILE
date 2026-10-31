import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { PLAYER_FAILED } from '@/features/feed/model';
import { canPlay, VideoSurface } from '@/features/feed/player';
import { usePlayerLoad } from '@/features/feed/player/useLoad';
import { radius, space, useWawu } from '@/theme';

import type { WorkMedia } from './api';

/** The icon on a block that has no picture to show: a quarter of the way across a small card is plenty, so it is a fixed size. */
const placeholderIcon = 28;

export type WorkCoverProps = {
  media: WorkMedia | null;
  /** Plays the video; a card that is not playing shows its first frame. */
  playing?: boolean;
  onEnded?: () => void;
  /** R-117: the video will not load: the cover says so in words, and the screen that asked it to play lets it stop. */
  onFailed?: () => void;
  testID?: string;
};

/**
 * What fills a work's picture frame: its photo, the first frame of its video where this build can play one,
 * or a quiet block (with the kind of file it holds) where the build cannot play one, and where a picture fails to load. The frame's size and corners belong to the
 * parent, which clips this to them.
 */
export function WorkCover({ media, playing = false, onEnded, onFailed, testID }: WorkCoverProps) {
  const { colors } = useWawu();
  // R-117: the video is still coming in (a spinner stands in the middle where the play button was); or it will not load (the words, and a tap on Play asks again).
  const load = usePlayerLoad(playing, onFailed);
  const url = media?.url ?? null;
  // The address that failed to load (a file that is not a picture, a link that has expired): that one shows the placeholder, never a blank box.
  const [broken, setBroken] = useState<string | null>(null);
  if (media && url && media.kind === 'image' && broken !== url) {
    return <Image testID={testID} source={{ uri: url }} contentFit="cover" style={styles.fill} accessibilityElementsHidden onError={() => setBroken(url)} />;
  }
  if (media && url && media.kind === 'video' && canPlay) {
    return (
      <View testID={testID} style={styles.fill}>
        <VideoSurface key={load.attempt} uri={url} playing={playing} seek={null} frosted={false} onTime={noTime} onEnded={onEnded ?? noEnd} onLoad={load.onLoad} />
        {load.waiting ? (
          <View pointerEvents="none" style={styles.centre}>
            <ActivityIndicator testID={testID ? `${testID}-spinner` : undefined} size="large" color={colors.textOnAccent} />
          </View>
        ) : null}
        {load.failed ? (
          <View pointerEvents="none" style={styles.centre}>
            <Text variant="errorLine" accessibilityRole="alert" testID={testID ? `${testID}-failed` : undefined} style={[styles.failed, { backgroundColor: colors.surfaceScrim, color: colors.textOnAccent }]}>
              {PLAYER_FAILED}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <View testID={testID ? `${testID}-placeholder` : undefined} style={[styles.fill, styles.block, { backgroundColor: colors.surfaceSunken }]}>
      <Icon name={media?.kind === 'video' ? 'Video' : 'Image'} size={placeholderIcon} color={colors.textMuted} />
    </View>
  );
}

function noTime() {
  return undefined;
}

function noEnd() {
  return undefined;
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  block: { alignItems: 'center', justifyContent: 'center' },
  centre: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  failed: { textAlign: 'center', paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.chip, overflow: 'hidden' },
});
