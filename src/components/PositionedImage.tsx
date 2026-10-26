import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { placement, splitPhotoLink, type Frame } from '@/lib/photoPosition';

export type PositionedImageProps = {
  /** The picture's link as the Hub serves it, with the position it was placed at (R-96) after a `#`, if the person set one. */
  uri: string;
  /** The frame, when the caller knows its size (an avatar). Left out, it is measured from the parent that clips the picture. */
  frame?: Frame;
  blurRadius?: number;
  onError?: () => void;
  testID?: string;
  accessibilityLabel?: string;
};

/**
 * A person's profile picture or cover, filling the frame it sits in, at the position they chose (R-96).
 * With no position it is exactly what it always was: the picture cover-fitted and centred. With one, the
 * photo is drawn at the size and offset `placement` works out, so an avatar of any size, a list row, a
 * comment, the header and a card all show the same part of the photo. The parent clips (every caller's
 * frame already hides what overflows).
 */
export function PositionedImage({ uri, frame, blurRadius, onError, testID, accessibilityLabel }: PositionedImageProps) {
  const { uri: plain, position } = splitPhotoLink(uri);
  const [measured, setMeasured] = useState<Frame | null>(null);

  if (!position) {
    return (
      <Image
        testID={testID}
        source={{ uri: plain }}
        contentFit="cover"
        blurRadius={blurRadius}
        onError={onError}
        accessibilityLabel={accessibilityLabel}
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
    <View pointerEvents="none" onLayout={onLayout} style={styles.frame}>
      {at ? (
        <Image
          testID={testID}
          source={{ uri: plain }}
          contentFit="fill"
          blurRadius={blurRadius}
          onError={onError}
          accessibilityLabel={accessibilityLabel}
          style={{ position: 'absolute', left: at.left, top: at.top, width: at.width, height: at.height }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
});
