import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image as NativeImage,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { coverHeight } from '@/features/me/ProfileHeader';
import {
  canPlace,
  centred,
  clampPosition,
  isCentred,
  movedBy,
  placement,
  settled,
  splitPhotoLink,
  wheelZoomFactor,
  withPhotoPosition,
  zoomedAbout,
  zoomedTo,
  type Frame,
  type PhotoPosition,
} from '@/lib/photoPosition';
import { font, layout, radius, space } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

export type PhotoKind = 'avatar' | 'cover';

/** One step of the screen reader's "Zoom in" and "Zoom out". */
export const ZOOM_STEP = 0.25;
/** One step of the screen reader's "Move": a tenth of the frame. */
export const NUDGE_FRACTION = 0.1;

/**
 * The stage is dark in both themes, as the camera page is (`CAMERA` in open-wallet): the photo, then the page dimmed over
 * everything outside the frame, then the frame's own line. Facebook's and Instagram's profile picture editors look the same.
 */
const STAGE = { ground: darkColors.mediaBlack100, dim: darkColors.mediaInk55, line: darkColors.mediaWhite60, ink: darkColors.textOnAccent, quiet: darkColors.mediaWhite60 } as const;
const metrics = {
  bar: 56,
  side: 84,
  title: 17,
  action: 16,
  save: { height: 34, padX: 16 },
  hint: 48,
  hintText: 14,
  /** The room between the circle and the edge of the stage. */
  avatarMargin: space.s2xl,
  coverMargin: space.lg,
  /** The circle on a wide screen (a desktop browser) stays a phone-sized one. */
  avatarMax: 420,
  avatarMin: 120,
  frameLine: 2,
  fadeMs: 350,
} as const;

const COPY: Record<PhotoKind, { title: string; label: string }> = {
  avatar: { title: 'Profile picture', label: 'Profile picture. Drag to reposition, pinch to zoom.' },
  cover: { title: 'Cover photo', label: 'Cover photo. Drag to reposition, pinch to zoom.' },
};
const HINT = 'Drag to reposition';
const A11Y_HINT = 'Swipe up or down to choose an action: zoom in, zoom out, move the picture, or reset.';
const ACTIONS = [
  { name: 'zoomIn', label: 'Zoom in' },
  { name: 'zoomOut', label: 'Zoom out' },
  { name: 'moveUp', label: 'Move picture up' },
  { name: 'moveDown', label: 'Move picture down' },
  { name: 'moveLeft', label: 'Move picture left' },
  { name: 'moveRight', label: 'Move picture right' },
  { name: 'reset', label: 'Reset' },
];

export type PhotoPositionScreenProps = {
  kind: PhotoKind;
  /** The picture: the Hub's link with the position it was placed at after a `#` (if it has one), or a photo just chosen from the phone. */
  link: string;
  /** Save: the link to keep, with the new position on it (or none, when the photo is back to centred). The link as it came when nothing was moved. */
  onSave: (link: string) => void;
  /** Cancel: nothing changes. */
  onCancel: () => void;
};

type Size = { ratio: number } | 'failed' | null;
type Point = { x: number; y: number };

/** What a gesture started from (a closure, not React state: it changes with every touch and nothing draws from it). */
function createGrip() {
  let from: PhotoPosition | null = null;
  let anchor: Point | null = null;
  return {
    hold: (position: PhotoPosition | null, point: Point | null = null) => {
      from = position;
      anchor = point;
    },
    from: () => from,
    anchor: () => anchor,
  };
}

/** The part of a browser's wheel event this screen reads. */
type WheelEvent = { deltaY: number; deltaMode: number; ctrlKey: boolean; clientX: number; clientY: number; preventDefault: () => void };
type WheelTarget = {
  addEventListener: (type: 'wheel', listener: (event: WheelEvent) => void, options: { passive: boolean }) => void;
  removeEventListener: (type: 'wheel', listener: (event: WheelEvent) => void) => void;
  getBoundingClientRect: () => { left: number; top: number };
};

/**
 * Position a profile picture or cover, the way Facebook and Instagram do (R-96). A dark stage; the photo fills it; a circle (the
 * banner, for a cover) shows what the picture will be and the rest is dimmed. One finger drags the photo and two pinch it, from
 * filling the frame to four times that; on the web the mouse drags it and the wheel or a trackpad pinch zooms. The frame is always
 * covered. The bar holds Cancel, the title and Save, and nothing else: a screen reader has the same moves as actions on the stage.
 * Gestures run on the JS thread, as M9's drag does.
 */
export function PhotoPositionScreen({ kind, link, onSave, onCancel }: PhotoPositionScreenProps) {
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

  // The stage is what is left of the screen under the bar and over the hint; until it is measured, the same sum.
  const [measured, setMeasured] = useState<Frame | null>(null);
  const estimate: Frame = { width: window.width, height: Math.max(0, window.height - insets.top - insets.bottom - metrics.bar - metrics.hint) };
  const stage = measured ?? estimate;

  // The frame: the avatar's circle, or the profile header's banner (the screen's width over the cover's height on this phone).
  const frame: Frame = useMemo(() => {
    if (kind === 'avatar') {
      const side = Math.min(metrics.avatarMax, stage.width - 2 * metrics.avatarMargin, stage.height - 2 * metrics.avatarMargin);
      const fitted = Math.max(metrics.avatarMin, side);
      return { width: fitted, height: fitted };
    }
    const width = Math.min(stage.width - 2 * metrics.coverMargin, metrics.avatarMax * 1.5);
    return { width, height: width / (Math.min(window.width, metrics.avatarMax * 1.5) / coverHeight(insets.top)) };
  }, [kind, stage.width, stage.height, window.width, insets.top]);
  const origin: Point = { x: (stage.width - frame.width) / 2, y: (stage.height - frame.height) / 2 };

  const [position, setPosition] = useState<PhotoPosition | null>(held);
  const shape = ratio ?? held?.ratio ?? null;
  const at: PhotoPosition | null = position ?? (shape ? centred(shape) : null);
  // The photo cannot be dragged off its edge, whatever the position that arrived.
  const current = at ? clampPosition(frame, at) : null;

  // Whether the person has moved the photo: a Save on a photo they left alone hands the link back exactly as it came.
  const [moved, setMoved] = useState(false);
  const update = (next: PhotoPosition) => {
    setMoved(true);
    setPosition(clampPosition(frame, next));
  };
  const grip = useState(createGrip)[0];

  const pan = Gesture.Pan()
    .withTestId('position-pan')
    .runOnJS(true)
    // Active from the first touch, so the first step of a drag moves the photo too.
    .minDistance(0)
    .maxPointers(1)
    .onBegin(() => grip.hold(current))
    .onUpdate((event) => {
      const from = grip.from();
      if (from) update(movedBy(frame, from, event.translationX, event.translationY));
    });
  const pinch = Gesture.Pinch()
    .withTestId('position-pinch')
    .runOnJS(true)
    .onBegin(() => grip.hold(current))
    .onStart((event) => {
      const focal = { x: Number.isFinite(event.focalX) ? event.focalX : stage.width / 2, y: Number.isFinite(event.focalY) ? event.focalY : stage.height / 2 };
      grip.hold(current, focal);
    })
    .onUpdate((event) => {
      const from = grip.from();
      if (!from) return;
      // The spot between the fingers stays under them as the photo grows, and follows them as they move.
      const start = grip.anchor() ?? { x: stage.width / 2, y: stage.height / 2 };
      const focal = { x: Number.isFinite(event.focalX) ? event.focalX : start.x, y: Number.isFinite(event.focalY) ? event.focalY : start.y };
      const grown = zoomedAbout(frame, from, from.zoom * event.scale, { x: start.x - origin.x, y: start.y - origin.y });
      update(movedBy(frame, grown, focal.x - start.x, focal.y - start.y));
    });
  const gestures = Gesture.Simultaneous(pan, pinch);

  // The web's wheel and a trackpad pinch zoom about the pointer. The handler reads what the screen holds now, not what it held when it was added.
  const stageRef = useRef<View>(null);
  const latest = useRef({ current, frame, origin, update });
  useEffect(() => {
    latest.current = { current, frame, origin, update };
  });
  const ready = current !== null;
  useEffect(() => {
    const node = stageRef.current as unknown as WheelTarget | null;
    if (Platform.OS !== 'web' || !ready || !node?.addEventListener) return undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const now = latest.current;
      if (!now.current) return;
      const box = node.getBoundingClientRect();
      const point = { x: event.clientX - box.left - now.origin.x, y: event.clientY - box.top - now.origin.y };
      const factor = wheelZoomFactor(event.deltaY, event.deltaMode, event.ctrlKey);
      now.update(zoomedAbout(now.frame, now.current, now.current.zoom * factor, point));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [ready]);

  // The hint under the stage fades after the first move.
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (moved) Animated.timing(fade, { toValue: 0, duration: metrics.fadeMs, useNativeDriver: true }).start();
  }, [moved, fade]);

  const onAction = (event: AccessibilityActionEvent) => {
    if (!current) return;
    const step = (fx: number, fy: number) => update(movedBy(frame, current, fx * NUDGE_FRACTION * frame.width, fy * NUDGE_FRACTION * frame.height));
    switch (event.nativeEvent.actionName) {
      case 'zoomIn':
        return update(zoomedTo(frame, current, current.zoom + ZOOM_STEP));
      case 'zoomOut':
        return update(zoomedTo(frame, current, current.zoom - ZOOM_STEP));
      case 'moveUp':
        return step(0, -1);
      case 'moveDown':
        return step(0, 1);
      case 'moveLeft':
        return step(-1, 0);
      case 'moveRight':
        return step(1, 0);
      case 'reset':
        return shape ? update(centred(shape)) : undefined;
      default:
        return undefined;
    }
  };

  const save = () => {
    if (!current) return;
    if (!moved) return onSave(link);
    // A photo much longer one way than the other (past 1 to 5) cannot be given a position: it is kept centred.
    if (!canPlace(current.ratio)) return onSave(withPhotoPosition(uri, null));
    const kept = settled(frame, current);
    return onSave(isCentred(kept) ? withPhotoPosition(uri, null) : withPhotoPosition(uri, kept));
  };

  const placed = current ? placement(frame, current) : null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <View testID="photo-position" style={[styles.page, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Bar title={copy.title} onCancel={onCancel} onSave={save} canSave={Boolean(current)} />
        {size === 'failed' ? (
          <View testID="position-error" style={styles.centre}>
            <Text variant="body" tone="textOnAccent" style={font(700)}>
              Your picture did not load
            </Text>
            <Text variant="body" tone="mediaWhite60" style={styles.errorLine}>
              Check your internet and try again.
            </Text>
            <Button
              label="Try again"
              variant="glass"
              size="md"
              onPress={() => {
                setSize(null);
                setAttempt((n) => n + 1);
              }}
              testID="position-retry"
            />
          </View>
        ) : !current || !placed ? (
          <View style={styles.centre}>
            <ActivityIndicator testID="position-loading" accessibilityLabel="Loading your picture" color={STAGE.ink} />
          </View>
        ) : (
          <>
            <GestureDetector gesture={gestures}>
              <View
                ref={stageRef}
                testID="position-stage"
                accessible
                accessibilityLabel={copy.label}
                accessibilityHint={A11Y_HINT}
                accessibilityActions={ACTIONS}
                onAccessibilityAction={onAction}
                onLayout={(event: LayoutChangeEvent) => {
                  const { width, height } = event.nativeEvent.layout;
                  setMeasured((now) => (now && now.width === width && now.height === height ? now : { width, height }));
                }}
                style={[styles.stage, webStage]}
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
            <Animated.View
              testID="position-hint"
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.hint, { paddingBottom: insets.bottom, opacity: fade }]}
            >
              <Text variant="body" tone="mediaWhite60" style={styles.hintText}>
                {HINT}
              </Text>
            </Animated.View>
          </>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

/** The one bar: Cancel on the left, the title in the middle, Save on the right. */
function Bar({ title, onCancel, onSave, canSave }: { title: string; onCancel: () => void; onSave: () => void; canSave: boolean }) {
  const cancelRing = useFocusRing();
  const saveRing = useFocusRing();
  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        <Pressable
          testID="position-cancel"
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onCancel}
          hitSlop={space.sm}
          {...cancelRing.handlers}
          style={[styles.cancel, cancelRing.style]}
        >
          <Text variant="body" tone="textOnAccent" style={styles.action}>
            Cancel
          </Text>
        </Pressable>
      </View>
      <Text testID="position-title" variant="body" tone="textOnAccent" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.saveSide]}>
        <Pressable
          testID="position-save"
          accessibilityRole="button"
          accessibilityLabel="Save"
          accessibilityState={{ disabled: !canSave }}
          disabled={!canSave}
          onPress={onSave}
          hitSlop={space.xs}
          {...saveRing.handlers}
          style={[styles.save, { backgroundColor: canSave ? darkColors.accent : darkColors.surfaceGlass }, saveRing.style]}
        >
          <Text variant="body" tone={canSave ? 'textOnAccent' : 'mediaWhite45'} style={styles.action}>
            Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The dimmed picture outside the frame, and the frame's own line: the circle for an avatar, the banner for a cover. */
function Veil({ kind, stage, frame, origin }: { kind: PhotoKind; stage: Frame; frame: Frame; origin: Point }) {
  const { width: w, height: h } = stage;
  const r = frame.width / 2;
  const hole =
    kind === 'avatar'
      ? `M${origin.x} ${origin.y + r}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
      : `M${origin.x} ${origin.y}h${frame.width}v${frame.height}h${-frame.width}Z`;
  return (
    <Svg testID="position-veil" pointerEvents="none" width={w} height={h} style={StyleSheet.absoluteFill}>
      <Path d={`M0 0H${w}V${h}H0Z${hole}`} fillRule="evenodd" fill={STAGE.dim} />
      {kind === 'avatar' ? (
        <Circle cx={origin.x + r} cy={origin.y + r} r={r} fill="none" stroke={STAGE.line} strokeWidth={metrics.frameLine} />
      ) : (
        <Rect x={origin.x} y={origin.y} width={frame.width} height={frame.height} fill="none" stroke={STAGE.line} strokeWidth={metrics.frameLine} />
      )}
    </Svg>
  );
}

/** On the web a finger or the mouse on the stage moves the photo, never the page, and nothing under it is selected. */
const webStage = Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none', cursor: 'grab', overscrollBehavior: 'contain' } as object) : null;

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { flex: 1, backgroundColor: STAGE.ground },
  bar: { height: metrics.bar, flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.gutter },
  side: { width: metrics.side, justifyContent: 'center' },
  saveSide: { alignItems: 'flex-end' },
  cancel: { minHeight: layout.tapMin, justifyContent: 'center', alignSelf: 'flex-start' },
  action: { ...font(600), fontSize: metrics.action },
  title: { ...font(700), flex: 1, textAlign: 'center', fontSize: metrics.title },
  save: { height: metrics.save.height, paddingHorizontal: metrics.save.padX, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  stage: { flex: 1, overflow: 'hidden', backgroundColor: STAGE.ground },
  hint: { minHeight: metrics.hint, alignItems: 'center', justifyContent: 'center' },
  hintText: { fontSize: metrics.hintText },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  errorLine: { textAlign: 'center' },
});
