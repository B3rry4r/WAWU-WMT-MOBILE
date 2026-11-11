import { Image, type ImageLoadEventData } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { RATIO_MAX, RATIO_MIN, placement, splitPhotoLink, type Frame } from '@/lib/photoPosition';
import { useCopy, type Copies } from '@/lib/thumbs';

export type PositionedImageProps = {
  /** The picture's link as the Hub serves it, with the position it was placed at (R-96) after a `#`, if the person set one. */
  uri: string;
  /** The frame, when the caller knows its size (an avatar). Left out, it is measured from the parent that clips the picture. */
  frame?: Frame;
  /** The Hub's small copies of this picture (APP-THUMBS). Left out, or missing or null, the full picture is drawn as always. */
  thumbs?: Copies;
  /** The longest side the picture is drawn at, in layout points, where it differs from the frame (a cover wider than it is tall). */
  drawn?: number;
  blurRadius?: number;
  onError?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  accessible?: boolean;
};

/** How far the shape the link declares may be from the shape of the photo itself before the photo's own is believed (a share of it). */
const SHAPE_TOLERANCE = 0.03;

/**
 * A person's profile picture or cover, filling the frame it sits in, at the position they chose (R-96).
 * With no position it is exactly what it always was: the picture cover-fitted and centred. With one, the
 * photo is drawn at the size and offset `placement` works out, so an avatar of any size, a list row, a
 * comment, the header and a card all show the same part of the photo. The parent clips (every caller's
 * frame already hides what overflows).
 */
export function PositionedImage({ uri: link, frame, thumbs, drawn, blurRadius, onError: onErrorOut, testID, accessibilityLabel, accessible }: PositionedImageProps) {
  const { position: declared } = splitPhotoLink(link);
  // The copy for the size drawn, with the full picture behind it (APP-THUMBS). A photo placed at a zoom is drawn that much larger than its frame.
  const sizeDrawn = drawn ?? (frame ? Math.max(frame.width, frame.height) * (declared?.zoom ?? 1) : undefined);
  const copy = useCopy(link, thumbs, sizeDrawn);
  const { uri: plain } = splitPhotoLink(copy.uri);
  const onError = () => {
    if (copy.onError() === 'final') onErrorOut?.();
  };
  const [measured, setMeasured] = useState<Frame | null>(null);
  // The shape of the photo as it loaded. A link that declares another shape (a hand-made one) is not believed: the photo is never stretched.
  const [real, setReal] = useState<{ uri: string; ratio: number } | null>(null);
  const actual = real && real.uri === plain ? real.ratio : null;
  const wrong = declared !== null && actual !== null && Math.abs(actual / declared.ratio - 1) > SHAPE_TOLERANCE;
  const position = declared && wrong ? (actual !== null && actual >= RATIO_MIN && actual <= RATIO_MAX ? { ...declared, ratio: actual } : null) : declared;
  const onLoad = (event: ImageLoadEventData) => {
    copy.onLoad();
    if (!declared) return;
    const { width, height } = event.source;
    if (width > 0 && height > 0) setReal((now) => (now && now.uri === plain && now.ratio === width / height ? now : { uri: plain, ratio: width / height }));
  };

  if (!position) {
    return (
      <Image
        testID={testID}
        source={{ uri: plain }}
        contentFit="cover"
        blurRadius={blurRadius}
        onError={onError}
        onLoad={onLoad}
        accessibilityLabel={accessibilityLabel}
        accessible={accessible}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  const size = frame ?? measured;
  const onLayout = frame
    ? undefined
    : (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setMeasured((now) => (now && now.width === width && now.height === height ? now : { width, height }));
      };
  const at = size && size.width > 0 && size.height > 0 ? placement(size, position) : null;

  return (
    <View testID={testID ? `${testID}-frame` : undefined} pointerEvents="none" onLayout={onLayout} style={styles.frame}>
      {at ? (
        <Image
          testID={testID}
          source={{ uri: plain }}
          contentFit="fill"
          blurRadius={blurRadius}
          onError={onError}
          onLoad={onLoad}
          accessibilityLabel={accessibilityLabel}
          accessible={accessible}
          style={{ position: 'absolute', left: at.left, top: at.top, width: at.width, height: at.height }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
});
