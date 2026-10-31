import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { FlatList, Modal, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { Text } from '@/components/Text';
import { font, radius, space } from '@/theme';

import type { FeedItem } from './api';
import { media } from './look';
import { pictureCandidates } from './model';

/** One picture the viewer can open: its address, and what a screen reader calls it. */
export type ViewerPicture = { key: string; uri: string; label: string };

/**
 * The pictures of a piece this person may see full screen: each frame the Hub gave an address for, in order (a locked frame has none, so a
 * locked set never shows more than its preview), or the one picture the piece draws.
 */
export function picturesOf(piece: Pick<FeedItem, 'title' | 'contentType' | 'coverUrl' | 'previewAssetUrl' | 'media'>): ViewerPicture[] {
  const frames = [...(piece.media?.frames ?? [])]
    .filter((f) => Boolean(f.url))
    .sort((a, b) => a.position - b.position);
  const total = Math.max(piece.media?.frameCount ?? 0, frames.length);
  if (frames.length > 0) return frames.map((f) => ({ key: String(f.position), uri: f.url as string, label: `Photo ${f.position} of ${total}` }));
  const first = pictureCandidates(piece, piece.previewAssetUrl || null)[0];
  return first ? [{ key: 'picture', uri: first, label: piece.title }] : [];
}

export type PictureViewerProps = {
  pictures: ViewerPicture[];
  /** The picture the viewer opens on. */
  index: number;
  visible: boolean;
  /** The close button, and the Android back button. */
  onClose: () => void;
  testID?: string;
};

/** The most a picture zooms, and where a double tap takes it (a number of times the picture's fitted size). */
export const MAX_ZOOM = 4;
export const DOUBLE_TAP_ZOOM = 2.5;
/** A pinch that ends under this settles back to the fitted picture. */
const SETTLE_BELOW = 1.05;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** How far a zoomed picture may be dragged from the middle before its edge leaves the screen. */
export function panLimit(box: number, zoom: number): number {
  return Math.max(0, (box * zoom - box) / 2);
}

/**
 * R-117 · a picture on black, full screen: pinch to zoom, drag it when it is zoomed, double tap to zoom in and out, swipe to the next
 * picture when there are several, a close X, and the Android back button closes it (the `Modal`'s `onRequestClose`). It is the one viewer
 * for every piece whose media is pictures (the piece page and the feed's photo sets); a locked piece hands it only the pictures it may show.
 */
export function PictureViewer({ pictures, index, visible, onClose, testID = 'picture-viewer' }: PictureViewerProps) {
  const { width, height } = useWindowDimensions();
  const [current, setCurrent] = useState(index);
  const [zoomed, setZoomed] = useState(false);

  // Each opening starts on the picture that was pressed.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCurrent(index);
      setZoomed(false);
    }
  }

  const onSettle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const at = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
      setCurrent(clamp(at, 0, Math.max(0, pictures.length - 1)));
    },
    [width, pictures.length],
  );

  const safe = clamp(index, 0, Math.max(0, pictures.length - 1));
  return (
    <Modal visible={visible && pictures.length > 0} animationType="fade" transparent={false} statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <View testID={testID} style={styles.root}>
          <FlatList
            testID={`${testID}-pages`}
            data={pictures}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed && pictures.length > 1}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={safe}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(p) => p.key}
            onMomentumScrollEnd={onSettle}
            extraData={current}
            renderItem={({ item, index: at }) => <ZoomablePicture picture={item} width={width} height={height} active={visible && at === current} onZoomed={setZoomed} testID={`${testID}-page-${at}`} />}
          />
          <TopBar testID={testID} current={current} total={pictures.length} onClose={onClose} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

/** Where a pinch or a drag started, kept outside the render so the gesture's steps measure from the same place (as the photo position screen does). */
function createGrip() {
  let held = { zoom: 1, x: 0, y: 0 };
  // Where the picture is now: a gesture's last steps can arrive before the screen has drawn the earlier ones, so its end reads this, not the render's.
  let live = 1;
  return {
    hold: (zoom: number, x: number, y: number) => {
      held = { zoom, x, y };
      live = zoom;
    },
    follow: (zoom: number) => {
      live = zoom;
    },
    zoom: () => held.zoom,
    x: () => held.x,
    y: () => held.y,
    now: () => live,
  };
}

/** The count and the close X over the top of the picture, under the status bar (the safe area is read only while the viewer is open). */
function TopBar({ testID, current, total, onClose }: { testID: string; current: number; total: number; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + space.sm }]}>
      {total > 1 ? (
        <View testID={`${testID}-count`} style={[styles.count, { backgroundColor: media.pill }]}>
          <Text variant="body" tone="textOnAccent" style={font(700)}>
            {current + 1} / {total}
          </Text>
        </View>
      ) : (
        <View />
      )}
      <IconButton icon="X" label="Close" tone="glass" onPress={onClose} testID={`${testID}-close`} />
    </View>
  );
}

type ZoomablePictureProps = { picture: ViewerPicture; width: number; height: number; active: boolean; onZoomed: (zoomed: boolean) => void; testID?: string };

/** One picture with its own zoom and drag. A picture that is no longer the one on screen goes back to fitted. */
function ZoomablePicture({ picture, width, height, active, onZoomed, testID = 'picture' }: ZoomablePictureProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [grip] = useState(createGrip);

  // A picture that is no longer the one on screen goes back to fitted (set while drawing, like the other "came back / left" resets in the feed).
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }

  const move = (next: number, x: number, y: number) => {
    const z = clamp(next, 1, MAX_ZOOM);
    const nx = clamp(x, -panLimit(width, z), panLimit(width, z));
    const ny = clamp(y, -panLimit(height, z), panLimit(height, z));
    grip.follow(z);
    setZoom(z);
    setOffset(z === 1 ? { x: 0, y: 0 } : { x: nx, y: ny });
    if (active) onZoomed(z > 1);
  };
  const settle = () => {
    if (grip.now() < SETTLE_BELOW) move(1, 0, 0);
  };

  const pinch = Gesture.Pinch()
    .withTestId(`${testID}-pinch`)
    .runOnJS(true)
    .onBegin(() => grip.hold(zoom, offset.x, offset.y))
    .onUpdate((e) => move(grip.zoom() * e.scale, grip.x(), grip.y()))
    .onEnd(settle);
  const pan = Gesture.Pan()
    .withTestId(`${testID}-pan`)
    .runOnJS(true)
    .enabled(zoom > 1)
    .minDistance(0)
    .maxPointers(1)
    .onBegin(() => grip.hold(zoom, offset.x, offset.y))
    .onUpdate((e) => move(zoom, grip.x() + e.translationX, grip.y() + e.translationY));
  const doubleTap = Gesture.Tap()
    .withTestId(`${testID}-double-tap`)
    .runOnJS(true)
    .numberOfTaps(2)
    .onEnd((_e, success) => {
      if (success) move(grip.now() > 1 ? 1 : DOUBLE_TAP_ZOOM, 0, 0);
    });
  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  return (
    <GestureDetector gesture={gesture}>
      <View testID={testID} style={{ width, height }}>
        <Image
          testID={testID ? `${testID}-image` : undefined}
          source={{ uri: picture.uri }}
          contentFit="contain"
          accessibilityLabel={picture.label}
          style={[styles.fill, { transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale: zoom }] }]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: media.black },
  fill: { width: '100%', height: '100%' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radius.chip },
});
