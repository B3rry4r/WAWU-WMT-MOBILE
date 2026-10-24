import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';

import { media, metrics } from './look';
import { isPicture } from './model';
import { PostFrame, type PostProps } from './PostFrame';

/**
 * H8: a template in the feed. Its cover fills the frame (the creator's preview of it), the pill
 * says "Template", and the offer bar names the template and the price. A template whose preview is
 * not a picture (a PDF) has no picture to fill the frame with: the frame is the sunken backdrop
 * with the template's mark. The count of patterns on the board ("9 patterns") is not served
 * (G-HOME-07-1), so the pill does not carry it.
 */
export function TemplatePost(props: PostProps) {
  const { item } = props;
  const cover = isPicture(item.previewAssetUrl) ? item.previewAssetUrl : null;
  return (
    <PostFrame
      {...props}
      kind="template"
      backdrop={
        cover ? (
          <Image testID={`cover-${item.id}`} source={{ uri: cover }} contentFit="cover" accessibilityLabel={item.title} style={StyleSheet.absoluteFill} />
        ) : (
          <View testID={`cover-${item.id}-none`} style={[StyleSheet.absoluteFill, styles.none, { backgroundColor: media.backdrop }]}>
            <Icon name="LayoutTemplate" size={metrics.templateMark} color={media.tabIdle} />
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  none: { alignItems: 'center', justifyContent: 'center' },
});
