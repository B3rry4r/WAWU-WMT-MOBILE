import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { nairaToKobo } from '@/api/kobo';

import type { FeedItem } from './api';
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
  /** The rail's ₦ Tip was pressed (H26, HOME-13). Left out, the rail draws no Tip. */
  onTip?: (item: FeedItem) => void;
  /** The offer bar was pressed (H14, HOME-12). Left out, the bar only shows the offer. */
  onUnlock?: (item: FeedItem) => void;
  /** The unlock sheet is being opened for this post (its price is being asked for). */
  unlocking?: boolean;
  /** The caption was pressed (H19, HOME-03): the piece's own page. Left out, the caption only reads. */
  onOpen?: (item: FeedItem) => void;
};

/** A distance the canvas measures from the phone's top, on this phone. */
export const fromTop = (chromeTop: number, canvasTop: number) => chromeTop + canvasTop - metrics.statusBar;

/**
 * The room the post leaves for its middle (H4's book, H5's message): from under the tabs to
 * just above the words, measured from this phone's own layout. `ready` turns true once the
 * words have been measured; until then the middle should not draw (or be drawn invisible).
 */
export type MiddleSpace = { top: number; bottom: number; height: number; width: number; ready: boolean; /** Where the rail starts, from the post's top (0 until measured). */ railTop: number };

type FrameProps = PostProps & {
  kind: PostKind;
  /** Under everything: the picture, the video or the backdrop. */
  backdrop: ReactNode;
  /** Over the picture and under the words: H4's book, H6's player, H5's message, the tap layer. */
  middle?: ReactNode | ((space: MiddleSpace) => ReactNode);
  /** Above the pill: the scrubber (H2), the frame dots (H3) or the reading bar (H4). */
  above?: ReactNode;
  /** Over the picture, top right: H3's frame counter. */
  corner?: ReactNode | ((space: MiddleSpace) => ReactNode);
};

/** One full-screen post: its media, the scrim, the rail, and the words and offer at the foot. */
export function PostFrame({ item, kind, active, width, height, myId, chromeTop, onTip, onUnlock, unlocking, onOpen, backdrop, middle, above, corner }: FrameProps) {
  const [footHeight, setFootHeight] = useState(0);
  const [railTop, setRailTop] = useState(0);
  const onRailLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.y);
    if (next !== railTop) setRailTop(next);
  };
  const onFootLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    if (next !== footHeight) setFootHeight(next);
  };
  const top = fromTop(chromeTop, metrics.middleTop);
  const bottom = height - fromPostBottom(metrics.captionBottom) - footHeight - metrics.middleGap;
  const space: MiddleSpace = { top, bottom, height: Math.max(0, bottom - top), width, ready: footHeight > 0, railTop };
  const marks = useEngagement(item, active);
  const offer = offerFor(item, kind);
  const pill = pillFor(item, kind);
  const canFollow = !marks.follows && myId !== null && myId !== item.creatorWawuId;
  return (
    <View testID={`post-${item.id}`} style={[styles.page, { width, height, backgroundColor: media.black }]}>
      {backdrop}
      <Scrim />
      {typeof middle === 'function' ? middle(space) : middle}
      {typeof corner === 'function' ? corner(space) : corner}
      <Rail
        item={item}
        liked={marks.liked}
        likes={marks.likes}
        saved={marks.saved}
        canFollow={canFollow}
        onLike={marks.toggleLike}
        onSave={marks.toggleSave}
        onFollow={marks.followCreator}
        onTip={onTip && myId !== null && myId !== item.creatorWawuId ? () => onTip(item) : undefined}
        onLayout={onRailLayout}
      />
      <View pointerEvents="box-none" onLayout={onFootLayout} style={[styles.foot, { bottom: fromPostBottom(metrics.captionBottom) }]}>
        {above}
        <View pointerEvents="box-none" style={styles.words}>
          <Pill icon={pill.icon} text={pill.text} testID={`pill-${item.id}`} />
          <Byline item={item} follows={marks.follows} onOpen={onOpen ? () => onOpen(item) : undefined} />
        </View>
        {offer ? (
          <OfferBar
            offer={offer}
            priceKobo={nairaToKobo(item.price)}
            compact={width < metrics.compactBelow}
            onPress={onUnlock ? () => onUnlock(item) : undefined}
            busy={unlocking}
            testID={`offer-${item.id}`}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { overflow: 'hidden' },
  foot: { position: 'absolute', left: metrics.side, right: metrics.side, gap: metrics.stack, zIndex: 6 },
  words: { paddingRight: metrics.captionRight },
});
