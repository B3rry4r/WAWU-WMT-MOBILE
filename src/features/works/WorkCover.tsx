import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { canPlay, VideoSurface } from '@/features/feed/player';
import { useWawu } from '@/theme';

import type { WorkMedia } from './api';

/** The icon on a block that has no picture to show: a quarter of the way across a small card is plenty, so it is a fixed size. */
const placeholderIcon = 28;

export type WorkCoverProps = {
  media: WorkMedia | null;
  /** Plays the video where the build can (the web build today); a card shows its first frame instead. */
  playing?: boolean;
  onEnded?: () => void;
  testID?: string;
};

/**
 * What fills a work's picture frame: its photo, the first frame of its video where this build can play one,
 * or a quiet block (with the kind of file it holds) where it cannot, and where a picture fails to load. The frame's size and corners belong to the
 * parent, which clips this to them.
 */
export function WorkCover({ media, playing = false, onEnded, testID }: WorkCoverProps) {
  const { colors } = useWawu();
  const url = media?.url ?? null;
  // The address that failed to load (a file that is not a picture, a link that has expired): that one shows the placeholder, never a blank box.
  const [broken, setBroken] = useState<string | null>(null);
  if (media && url && media.kind === 'image' && broken !== url) {
    return <Image testID={testID} source={{ uri: url }} contentFit="cover" style={styles.fill} accessibilityElementsHidden onError={() => setBroken(url)} />;
  }
  if (media && url && media.kind === 'video' && canPlay) {
    return (
      <View testID={testID} style={styles.fill}>
        <VideoSurface uri={url} playing={playing} seek={null} frosted={false} onTime={noTime} onEnded={onEnded ?? noEnd} />
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
});
