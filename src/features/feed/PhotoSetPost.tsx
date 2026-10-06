import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Icon } from '@/components/icon';
import { radius } from '@/theme';

import type { MediaFrame } from './api';
import { media, metrics, words } from './look';
import { fromTop, PostFrame, type PostProps } from './PostFrame';

/** The frames to draw: the Hub's list, or the public preview alone when the set has none yet. */
function framesOf(props: PostProps): MediaFrame[] {
  const frames = props.item.media?.frames ?? [];
  if (frames.length > 0) return frames;
  return [{ position: 1, url: props.item.previewAssetUrl, locked: false }];
}

/**
 * H3: a photo set swiped sideways, the next frame peeking in at the right, a counter and
 * dots. A frame the viewer has not unlocked comes without a url (HOME-05); it is drawn as
 * the first frame, frosted, with a lock.
 */
export function PhotoSetPost(props: PostProps) {
  const { item, width, height } = props;
  const frames = framesOf(props);
  const total = Math.max(item.media?.frameCount ?? 0, frames.length);
  const [index, setIndex] = useState(0);
  const first = frames[0]?.url ?? null;
  const next = frames[index + 1];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const at = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    if (at !== index) setIndex(Math.max(0, Math.min(frames.length - 1, at)));
  };

  return (
    <PostFrame
      {...props}
      kind="photos"
      backdrop={
        <FlatList
          testID={`frames-${item.id}`}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          data={frames}
          keyExtractor={(f) => String(f.position)}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item: frame }) => (
            <View style={{ width, height }} testID={`frame-${item.id}-${frame.position}`}>
              {frame.url ? (
                <Image source={{ uri: frame.url }} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Photo ${frame.position} of ${total}`} />
              ) : (
                <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={`Photo ${frame.position} of ${total}, locked`}>
                  {first ? <Image source={{ uri: first }} contentFit="cover" blurRadius={metrics.backdropBlur} style={StyleSheet.absoluteFill} /> : null}
                  <View style={[StyleSheet.absoluteFill, styles.lockedFrame, { backgroundColor: media.veil }]}>
                    <View style={[styles.lockCircle, { backgroundColor: media.glass, borderColor: media.glassEdge }]}>
                      <Icon name="Lock" size={metrics.endedIcon} color={media.ink} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        />
      }
      corner={
        <>
          {next ? (
            <View pointerEvents="none" style={[styles.peek, { top: fromTop(props.chromeTop, metrics.peekTop) }]} testID={`peek-${item.id}`}>
              {next.url ? (
                <Image source={{ uri: next.url }} contentFit="cover" style={StyleSheet.absoluteFill} />
              ) : first ? (
                <Image source={{ uri: first }} contentFit="cover" blurRadius={metrics.backdropBlur} style={StyleSheet.absoluteFill} />
              ) : null}
            </View>
          ) : null}
          <View pointerEvents="none" style={[styles.counter, { top: fromTop(props.chromeTop, metrics.counterTop), backgroundColor: media.pill }]} testID={`counter-${item.id}`}>
            <Icon name="Images" size={metrics.counterIcon} color={media.ink} />
            <Text style={[words.counter, { color: media.ink }]}>
              {index + 1} / {total}
            </Text>
          </View>
        </>
      }
      above={
        total > 1 ? (
          <View style={styles.dots} pointerEvents="none" testID={`dots-${item.id}`}>
            {Array.from({ length: total }, (_, i) => (
              <View
                key={i}
                style={[styles.dot, { width: i === index ? metrics.dotOn : metrics.dotH, backgroundColor: i === index ? media.ink : media.dot }]}
              />
            ))}
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  lockedFrame: { alignItems: 'center', justifyContent: 'center' },
  lockCircle: {
    width: metrics.endedCircle,
    height: metrics.endedCircle,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peek: {
    position: 'absolute',
    right: metrics.peekRight,
    width: metrics.peekW,
    height: metrics.peekH,
    borderRadius: metrics.peekRadius,
    overflow: 'hidden',
    opacity: 0.9,
    zIndex: 2,
  },
  counter: {
    position: 'absolute',
    right: metrics.side,
    height: metrics.counterH,
    paddingHorizontal: metrics.counterPad,
    borderRadius: radius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: metrics.counterGap,
    zIndex: 7,
  },
  dots: { flexDirection: 'row', gap: metrics.dotGap },
  dot: { height: metrics.dotH, borderRadius: metrics.dotH / 2 },
});
