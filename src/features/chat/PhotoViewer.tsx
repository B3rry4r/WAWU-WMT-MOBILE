import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { layout, useWawu } from '@/theme';

export type PhotoViewerProps = {
  /** The photo's fresh link, or null when no photo is open. */
  uri: string | null;
  onClose: () => void;
};

/** A photo from the chat at full size over the thread (FIX-104). No board draws it: a page-coloured sheet, the photo contained, and a close button. */
export function PhotoViewer({ uri, onClose }: PhotoViewerProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={uri !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View testID="photo-viewer" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
        {uri ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={onClose} style={styles.fill}>
            <Image source={{ uri }} contentFit="contain" accessibilityLabel="Photo" style={styles.fill} testID="photo-viewer-image" />
          </Pressable>
        ) : null}
        <View style={[styles.close, { top: insets.top + layout.gutter / 2 }]}>
          <IconButton icon="X" label="Close" onPress={onClose} size={40} testID="photo-viewer-close" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  close: { position: 'absolute', right: layout.gutter },
});
