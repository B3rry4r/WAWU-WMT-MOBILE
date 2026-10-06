import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { nairaToKobo, type FeedItem } from './api';
import { useEngagement } from './engagement';
import { media, metrics } from './look';
import { offerFor, pillFor, type PostKind } from './model';
import { Byline, fromPostBottom, OfferBar, Pill, Rail, Scrim } from './parts';

export type PostProps = {
  item: FeedItem;
  /** The post fills the screen: it plays, and its view is counted. */
  active: boolean;
  width: number;
  height: number;
  /** The viewer's id, once known: nobody is offered to follow themselves. */
  myId: string | null;
  /** Where the status bar ends on this phone (the canvas's is 50 tall). */
  chromeTop: number;
};

/** A distance the canvas measures from the phone's top, on this phone. */
export const fromTop = (chromeTop: number, canvasTop: number) => chromeTop + canvasTop - metrics.statusBar;

type FrameProps = PostProps & {
  kind: PostKind;
  /** Under everything: the picture, the video or the backdrop. */
  backdrop: ReactNode;
  /** Over the picture and under the words: H4's book, H6's player, H5's message, the tap layer. */
  middle?: ReactNode;
  /** Above the pill: the scrubber (H2), the frame dots (H3) or the reading bar (H4). */
  above?: ReactNode;
  /** Over the picture, top right: H3's frame counter. */
  corner?: ReactNode;
};

/** One full-screen post: its media, the scrim, the rail, and the words and offer at the foot. */
export function PostFrame({ item, kind, active, width, height, myId, backdrop, middle, above, corner }: FrameProps) {
  const marks = useEngagement(item, active);
  const offer = offerFor(item, kind);
  const pill = pillFor(item, kind);
  const canFollow = !marks.follows && myId !== null && myId !== item.creatorWawuId;
  return (
    <View testID={`post-${item.id}`} style={[styles.page, { width, height, backgroundColor: media.black }]}>
      {backdrop}
      <Scrim />
      {middle}
      {corner}
      <Rail
        item={item}
        liked={marks.liked}
        likes={marks.likes}
        saved={marks.saved}
        canFollow={canFollow}
        onLike={marks.toggleLike}
        onSave={marks.toggleSave}
        onFollow={marks.followCreator}
      />
      <View pointerEvents="box-none" style={[styles.foot, { bottom: fromPostBottom(metrics.captionBottom) }]}>
        {above}
        <View pointerEvents="box-none" style={styles.words}>
          <Pill icon={pill.icon} text={pill.text} testID={`pill-${item.id}`} />
          <Byline item={item} follows={marks.follows} />
        </View>
        {offer ? <OfferBar offer={offer} priceKobo={nairaToKobo(item.price)} testID={`offer-${item.id}`} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { overflow: 'hidden' },
  foot: { position: 'absolute', left: metrics.side, right: metrics.side, gap: metrics.stack, zIndex: 6 },
  words: { paddingRight: metrics.captionRight },
});
