import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Button';
import { space } from '@/theme';

import { media, metrics, words } from '../look';

import type { ReaderProps } from './types';

export type { ReaderProps } from './types';

/**
 * H4's free pages, read in place: the PDF opens over the feed in the browser's own viewer,
 * and closing it puts the person back on the same post.
 */
export function PdfReader({ uri, title, visible, onClose, testID }: ReaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View testID={testID} style={[styles.page, { paddingTop: Math.max(insets.top, metrics.tabsGap) }]}>
        <View style={styles.head}>
          <Text numberOfLines={1} style={[words.offerTitle, styles.title]}>
            {title}
          </Text>
          <IconButton icon="X" label="Close" tone="glass" onPress={onClose} testID={testID ? `${testID}-close` : undefined} />
        </View>
        {visible ? <iframe title={title} src={uri} data-testid={testID ? `${testID}-pages` : undefined} style={frame} /> : null}
      </View>
    </Modal>
  );
}

const frame = { flex: 1, width: '100%', border: 0 } as const;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: media.black },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: metrics.side, paddingVertical: space.sm },
  title: { flex: 1, color: media.ink },
});
