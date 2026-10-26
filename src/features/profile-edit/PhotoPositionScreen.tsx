import { useEffect, useMemo, useState } from 'react';
import { Image as NativeImage, Platform, Pressable, StyleSheet, useWindowDimensions, View, type AccessibilityActionEvent, type LayoutChangeEvent } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Button, IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { coverHeight } from '@/features/me/ProfileHeader';
import {
  ZOOM_MAX,
  ZOOM_MIN,
  centred,
  clampPosition,
  isCentred,
  movedBy,
  placement,
  settled,
  splitPhotoLink,
  withPhotoPosition,
  zoomedTo,
  type Frame,
  type PhotoPosition,
} from '@/lib/photoPosition';
import { layout, radius, space, useWawu } from '@/theme';

export type PhotoKind = 'avatar' | 'cover';

/** Holds the position a gesture started from (a closure, not React state: it changes with every touch and nothing draws from it). */
function createGrip() {
  let at: PhotoPosition | null = null;
  return {
    hold: (position: PhotoPosition | null) => {
      at = position;
    },
    held: () => at,
  };
}

/** One press of a zoom button, and the keyboard and screen reader step of the slider. */
export const ZOOM_STEP = 0.25;
/** One press of a move button: a tenth of the frame. */
export const NUDGE_FRACTION = 0.1;
/** The room around the frame inside the stage, where the rest of the photo shows dimmed. */
const stageMetrics = { avatarInset: space.s3xl, coverInsetX: space.lg, coverInsetY: space.s3xl, controls: 232, thumb: 28, track: 4, frameLine: 2 } as const;
const BODY_GAP = space.lg;
/** The round move buttons, as the screen's other round buttons (42). */
const moveButton = 42;

const COPY: Record<PhotoKind, { title: string; hint: string; stage: string }> = {
  avatar: { title: 'Profile picture', hint: 'Drag the photo to move it. Pinch or use the slider to zoom.', stage: 'Your profile picture. Use the buttons below to move and zoom it.' },
  cover: { title: 'Cover picture', hint: 'Drag the photo to move it. Pinch or use the slider to zoom.', stage: 'Your cover picture. Use the buttons below to move and zoom it.' },
};

export type PhotoPositionScreenProps = {
  kind: PhotoKind;
  /** The picture's link as the form holds it: the Hub's link, with the position it was placed at after a `#` if it has one. */
  link: string;
  /** Done: the link to keep, with the new position on it (or none, when the photo is back to centred). */
  onDone: (link: string) => void;
  onClose: () => void;
};

type Size = { ratio: number } | 'failed' | null;

/**
 * Position a profile picture or cover (R-96): the photo moves under the exact frame it will show in (the
 * avatar's circle, the profile header's banner shape), by dragging it, by pinching, by the slider, or by
 * the buttons; it can never be dragged off its edge (the frame is always covered) and zooms from filling
 * the frame to four times that. Done hands back the link with the position on it; M8's Save sends it.
 * Gestures run on the JS thread, as M9's drag does.
 */
export function PhotoPositionScreen({ kind, link, onDone, onClose }: PhotoPositionScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const copy = COPY[kind];
  const { uri, position: held } = useMemo(() => splitPhotoLink(link), [link]);

  // The photo's shape: the position it already carries, else read from the photo itself.
  const [size, setSize] = useState<Size>(held ? { ratio: held.ratio } : null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (held) return undefined;
    let current = true;
    NativeImage.getSize(
      uri,
      (width, height) => {
        if (current) setSize(width > 0 && height > 0 ? { ratio: width / height } : 'failed');
      },
      () => {
        if (current) setSize('failed');
      },
    );
    return () => {
      current = false;
    };
  }, [uri, held, attempt]);

  const ratio = size && size !== 'failed' ? size.ratio : null;

  // The frame: the avatar's circle, or the profile header's banner (the screen's width over the cover's height on this phone).
  const stageWidth = window.width - 2 * layout.gutter;
  const room = Math.max(0, window.height - insets.top - insets.bottom - stageMetrics.controls - space.s3xl * 3);
  const frame: Frame = useMemo(() => {
    if (kind === 'avatar') {
      const side = Math.max(120, Math.min(stageWidth - 2 * stageMetrics.avatarInset, room - 2 * stageMetrics.avatarInset));
      return { width: side, height: side };
    }
    const width = stageWidth - 2 * stageMetrics.coverInsetX;
    return { width, height: width / (window.width / coverHeight(insets.top)) };
  }, [kind, stageWidth, room, window.width, insets.top]);
  const stage: Frame =
    kind === 'avatar'
      ? { width: stageWidth, height: frame.height + 2 * stageMetrics.avatarInset }
      : { width: stageWidth, height: frame.height + 2 * stageMetrics.coverInsetY };
  const origin = { x: (stage.width - frame.width) / 2, y: (stage.height - frame.height) / 2 };

  const [position, setPosition] = useState<PhotoPosition | null>(held);
  const shape = ratio ?? held?.ratio ?? null;
  const at: PhotoPosition | null = position ?? (shape ? centred(shape) : null);
  // The photo cannot be dragged off its edge, whatever the position that arrived.
  const current = at ? clampPosition(frame, at) : null;

  const update = (next: PhotoPosition) => setPosition(clampPosition(frame, next));
  // Where the photo was when the finger went down: a drag or a pinch is measured from there.
  const [grip] = useState(createGrip);

  const pan = Gesture.Pan()
    .withTestId('position-pan')
    .runOnJS(true)
    .minDistance(1)
    .maxPointers(1)
    .onBegin(() => grip.hold(current))
    .onUpdate((event) => {
      const from = grip.held();
      if (from) update(movedBy(frame, from, event.translationX, event.translationY));
    });
  const pinch = Gesture.Pinch()
    .withTestId('position-pinch')
    .runOnJS(true)
    .onBegin(() => grip.hold(current))
    .onUpdate((event) => {
      const from = grip.held();
      if (from) update(zoomedTo(frame, from, from.zoom * event.scale));
    });
  const gestures = Gesture.Simultaneous(pan, pinch);

  const move = (fx: number, fy: number) => {
    if (current) update(movedBy(frame, current, fx * NUDGE_FRACTION * frame.width, fy * NUDGE_FRACTION * frame.height));
  };
  const zoom = (to: number) => {
    if (current) update(zoomedTo(frame, current, to));
  };

  const done = () => {
    if (!current) return;
    const saved = settled(frame, current);
    onDone(isCentred(saved) ? withPhotoPosition(uri, null) : withPhotoPosition(uri, saved));
  };

  const placed = current ? placement(frame, current) : null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ScreenFrame
        idPrefix="position"
        testID="photo-position"
        title={copy.title}
        titleLines={1}
        onBack={onClose}
        gap={BODY_GAP}
        action={{ label: 'Done', onPress: done, disabled: !current, testID: 'position-done' }}
      >
        {size === 'failed' ? (
          <ErrorState
            testID="position-error"
            title="Your picture did not load"
            message="Check your internet and try again."
            onRetry={() => {
              setSize(null);
              setAttempt((n) => n + 1);
            }}
          />
        ) : !current || !placed ? (
          <LoadingView label="Loading your picture">
            <Skeleton height={stage.height} radius={radius.media} />
          </LoadingView>
        ) : (
          <>
            <GestureDetector gesture={gestures}>
              <View
                testID="position-stage"
                accessible
                accessibilityLabel={copy.stage}
                style={[styles.stage, { width: stage.width, height: stage.height, backgroundColor: colors.surfaceSunken }, webTouch]}
              >
                {/* The picture takes no touches itself: on the web an image is dragged away by the browser, and the stage must keep the finger. */}
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  <Image
                    testID="position-image"
                    source={{ uri }}
                    contentFit="fill"
                    style={{ position: 'absolute', left: origin.x + placed.left, top: origin.y + placed.top, width: placed.width, height: placed.height }}
                  />
                </View>
                <Veil kind={kind} stage={stage} frame={frame} origin={origin} />
              </View>
            </GestureDetector>
            <Text variant="muted" testID="position-hint">
              {copy.hint}
            </Text>
            <View style={styles.zoomRow}>
              <IconButton icon="Minus" label="Zoom out" onPress={() => zoom(current.zoom - ZOOM_STEP)} disabled={current.zoom <= ZOOM_MIN} testID="position-zoom-out" />
              <ZoomSlider value={current.zoom} onChange={zoom} />
              <IconButton icon="Plus" label="Zoom in" onPress={() => zoom(current.zoom + ZOOM_STEP)} disabled={current.zoom >= ZOOM_MAX} testID="position-zoom-in" />
            </View>
            <View style={styles.moveRow}>
              <MoveButton direction="left" label="Move picture left" onPress={() => move(-1, 0)} testID="position-left" />
              <View style={styles.upDown}>
                <MoveButton direction="up" label="Move picture up" onPress={() => move(0, -1)} testID="position-up" />
                <MoveButton direction="down" label="Move picture down" onPress={() => move(0, 1)} testID="position-down" />
              </View>
              <MoveButton direction="right" label="Move picture right" onPress={() => move(1, 0)} testID="position-right" />
            </View>
            <Button label="Centre" variant="outline" size="md" onPress={() => ratio && setPosition(centred(shape ?? ratio))} disabled={isCentred(current)} testID="position-reset" />
          </>
        )}
      </ScreenFrame>
    </GestureHandlerRootView>
  );
}

/** The dimmed picture outside the frame, and the frame's own line: the circle for an avatar, the banner for a cover. */
function Veil({ kind, stage, frame, origin }: { kind: PhotoKind; stage: Frame; frame: Frame; origin: { x: number; y: number } }) {
  const { colors } = useWawu();
  const { width: w, height: h } = stage;
  const r = frame.width / 2;
  const hole =
    kind === 'avatar'
      ? `M${origin.x} ${origin.y + r}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
      : `M${origin.x} ${origin.y}h${frame.width}v${frame.height}h${-frame.width}Z`;
  return (
    <Svg testID="position-veil" pointerEvents="none" width={w} height={h} style={StyleSheet.absoluteFill}>
      <Path d={`M0 0H${w}V${h}H0Z${hole}`} fillRule="evenodd" fill={colors.mediaInk55} />
      {kind === 'avatar' ? (
        <Circle cx={origin.x + r} cy={origin.y + r} r={r} fill="none" stroke={colors.mediaWhite60} strokeWidth={stageMetrics.frameLine} />
      ) : (
        <Rect x={origin.x} y={origin.y} width={frame.width} height={frame.height} fill="none" stroke={colors.mediaWhite60} strokeWidth={stageMetrics.frameLine} />
      )}
    </Svg>
  );
}

/**
 * The zoom slider: drag or tap the track. A screen reader adjusts it with increment and decrement, and the
 * buttons beside it do the same for anyone who cannot drag.
 */
function ZoomSlider({ value, onChange }: { value: number; onChange: (zoom: number) => void }) {
  const { colors } = useWawu();
  const [width, setWidth] = useState(0);
  const travel = Math.max(1, width - stageMetrics.thumb);
  const fraction = (value - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
  const fromX = (x: number) => onChange(ZOOM_MIN + Math.min(1, Math.max(0, (x - stageMetrics.thumb / 2) / travel)) * (ZOOM_MAX - ZOOM_MIN));
  const drag = Gesture.Pan()
    .withTestId('position-slider-pan')
    .runOnJS(true)
    .minDistance(0)
    .onBegin((event) => fromX(event.x))
    .onUpdate((event) => fromX(event.x));
  const onAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') onChange(value + ZOOM_STEP);
    if (event.nativeEvent.actionName === 'decrement') onChange(value - ZOOM_STEP);
  };
  return (
    <GestureDetector gesture={drag}>
      <View
        testID="position-slider"
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Zoom"
        accessibilityValue={{ min: ZOOM_MIN, max: ZOOM_MAX, now: Number(value.toFixed(2)), text: `${value.toFixed(1)} times` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAction}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        style={styles.slider}
      >
        <View style={[styles.track, { backgroundColor: colors.borderStrong }]} />
        <View style={[styles.track, styles.filled, { backgroundColor: colors.accent, width: fraction * travel + stageMetrics.thumb / 2 }]} />
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: fraction * travel, backgroundColor: colors.accent, borderColor: colors.surfacePage }]}
        />
      </View>
    </GestureDetector>
  );
}

/** On the web a finger on the stage moves the photo, never the page, and nothing under it is selected. */
const webTouch = Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none' } as object) : null;

const arrows = { left: 'ChevronLeft', right: 'ChevronRight', down: 'ChevronDown', up: 'ChevronDown' } as const;

/** A round button that moves the photo one step: the same look as the screen's other round buttons; "up" is the down chevron turned over (the icon set holds no up chevron). */
function MoveButton({ direction, label, onPress, testID }: { direction: keyof typeof arrows; label: string; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={space.xs}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard, borderColor: colors.borderHairline },
        ring.style,
      ]}
    >
      <View style={direction === 'up' ? styles.turned : undefined}>
        <Icon name={arrows[direction]} size={20} color={colors.textPrimary} strokeWidth={1.8} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { overflow: 'hidden', borderRadius: radius.media, alignSelf: 'center' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  moveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.lg },
  upDown: { gap: space.sm },
  round: { width: moveButton, height: moveButton, borderRadius: radius.chip, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  turned: { transform: [{ rotate: '180deg' }] },
  slider: { flex: 1, height: layout.tapMin, justifyContent: 'center' },
  track: { position: 'absolute', left: 0, right: 0, height: stageMetrics.track, borderRadius: radius.chip },
  filled: { right: undefined },
  thumb: { position: 'absolute', width: stageMetrics.thumb, height: stageMetrics.thumb, borderRadius: radius.chip, borderWidth: 3 },
});

