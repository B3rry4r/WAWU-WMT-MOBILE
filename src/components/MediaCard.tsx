import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type DimensionValue, type LayoutChangeEvent } from 'react-native';

import { font, radius, space, useWawu, type GradientToken } from '@/theme';

import { Button } from './Button';
import { useFocusRing } from './focusRing';
import { PositionedImage } from './PositionedImage';
import { Text } from './Text';

/** Sizes from the unlock sheet (design/_gen/home.js `unlockSheet`) and the Explore cards the loading view stands in for. */
export const mediaMetrics = {
  thumb: 56,
  thumbRadius: 14,
  rowGap: space.md,
  captionGap: 3,
  subtitle: 13,
  stackedWidth: 150,
  stackedHeight: 200,
  /** design/_gen/explore.js `cCard`: the caption sits 10 in from the left, right and bottom of the picture, title 14.5 bold, line under it 12 at 80%. */
  captionInset: 10,
  stackedTitle: 14.5,
  stackedSubtitle: 12,
  stackedSubtitleOpacity: 0.8,
  stackedSubtitleGap: 2,
  /** `cCard` (home.js and explore.js): the tick 4 after the name, then 8 down to the Follow button, which is 32 high. */
  titleAccessoryGap: space.xs,
  footerGap: space.sm,
  /** The Follow button's height: the shared `Button`'s `card` size. */
  actionHeight: 32,
  /**
   * The initials a creator card shows for a person with no photo (`placeholder`). Not drawn on the canvas (`cCard`
   * falls back to the sunken ground); Default (agent), owner may override: 64, the size Today's card drew before it
   * moved onto this card.
   */
  placeholderAvatar: 64,
} as const;

/** A CSS-style angle (180 is top to bottom, as in `--scrim-card`) as the start and end points `LinearGradient` takes. */
export function gradientEnds(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return { start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 }, end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 } };
}

function Scrim({ token }: { token: GradientToken }) {
  const ends = gradientEnds(token.angle);
  return (
    <LinearGradient
      testID="media-scrim"
      pointerEvents="none"
      colors={token.colors as unknown as readonly [string, string, ...string[]]}
      locations={token.locations as unknown as readonly [number, number, ...number[]]}
      start={ends.start}
      end={ends.end}
      style={StyleSheet.absoluteFill}
    />
  );
}

/**
 * The card's one button, drawn under the caption (`cCard`'s Follow): the shared `Button` at its `card` size (32 high,
 * the label 13 at 700) across the caption, on the accent, or white at 20% with no ring when `on` (the canvas's
 * "Following"). Every creator card draws Follow through this, never with a button of its own.
 */
export type MediaCardAction = {
  label: string;
  onPress: () => void;
  /** The button's on state ("Following"): white at 20% over the picture (`Button` `veil`) instead of the accent. */
  on?: boolean;
  /** A request is in flight: a spinner, and presses are ignored. */
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export type MediaCardProps = {
  title: string;
  /** The line under the title: who made it, what kind, how long. */
  subtitle?: string;
  /** A verified Tick or a pill, shown on the subtitle line after the creator's name. */
  subtitleAccessory?: ReactNode;
  /** Drawn after the title, 4 apart (`cCard`: the name, then its 13 tick). */
  titleAccessory?: ReactNode;
  /**
   * Stacked only: anything under the caption, inside the picture, 8 below the subtitle line (`cCard`).
   * With `action` as well, the footer comes first.
   */
  footer?: ReactNode;
  /** Stacked only: the card's one button under the caption, 8 below the subtitle line (`cCard`'s Follow). */
  action?: MediaCardAction;
  /**
   * Row only: the creator's name, first on the subtitle line. With it the line
   * reads name, accessory, then "· subtitle", as H14's unlock sheet draws
   * "Chidi Eze ✓ · Video · 18 min" (design/_gen/home.js `unlockSheet`).
   */
  byline?: string;
  /** The picture. Without one a quiet block holds its place, so a layout never jumps when it arrives. */
  imageUrl?: string;
  /**
   * Drawn centred on the quiet block when there is no picture: a creator's initials on their hue
   * (`<Avatar name hue size={mediaMetrics.placeholderAvatar} decorative />`). On a stacked card it is centred in the
   * room above the caption, under the scrim. Hidden from a screen reader: the words already say who it is.
   */
  placeholder?: ReactNode;
  /** The picture as a bundled image (`require(...)`) or a URL, where `imageUrl` isn't used. */
  image?: string | number;
  /** What the picture shows, for a screen reader. Leave empty when the title already says it. */
  imageLabel?: string;
  /** `row`: thumbnail beside the words (a sheet header). `stacked`: picture above the words (a shelf). */
  layout?: 'row' | 'stacked';
  /**
   * Row only: with no picture and no placeholder, draw the words alone instead of holding the picture's place with a quiet
   * block. For a header whose item has no picture (the pay sheet's "Not enough" states); a shelf keeps the block so it never jumps.
   */
  bare?: boolean;
  /** Stacked only. Defaults to the shelf's 150 by 200 picture; a grid passes `'100%'`. */
  width?: DimensionValue;
  height?: number;
  onPress?: () => void;
  testID?: string;
};

/** With a button under the caption, the words carry the card's own press for a screen reader. */
const activate = [{ name: 'activate' as const }];

/** A piece of content: its picture, its title and who made it. */
export function MediaCard({
  title,
  subtitle,
  subtitleAccessory,
  titleAccessory,
  footer,
  action,
  byline,
  imageUrl,
  placeholder,
  image,
  imageLabel,
  bare = false,
  layout = 'row',
  width = mediaMetrics.stackedWidth,
  height = mediaMetrics.stackedHeight,
  onPress,
  testID,
}: MediaCardProps) {
  const { colors, gradients } = useWawu();
  const ring = useFocusRing();
  const stacked = layout === 'stacked';
  const frame = stacked
    ? { width, height, borderRadius: radius.media }
    : { width: mediaMetrics.thumb, height: mediaMetrics.thumb, borderRadius: mediaMetrics.thumbRadius };

  const src = imageUrl ?? image;
  const hasPicture = src !== undefined && src !== '';
  // A stacked card centres its placeholder in the room the caption leaves, so the caption's height is measured after layout.
  const [captionHeight, setCaptionHeight] = useState(0);
  const showPlaceholder = Boolean(placeholder) && !hasPicture;
  const onCaptionLayout = showPlaceholder && stacked ? (e: LayoutChangeEvent) => setCaptionHeight(e.nativeEvent.layout.height) : undefined;
  const label = [title, byline, subtitle].filter(Boolean).join(', ');
  // A button under the caption must stay reachable on its own, so the words are grouped for a screen reader
  // instead of the whole card.
  const below = stacked && Boolean(footer || action);
  const stackedTitle = (
    <Text variant="h3" tone="textOnAccent" numberOfLines={1} style={[font(700), styles.stackedTitle, titleAccessory ? styles.titleShrink : null]}>
      {title}
    </Text>
  );
  const stackedWords = (
    <>
      {titleAccessory ? (
        <View style={styles.titleLine}>
          {stackedTitle}
          {titleAccessory}
        </View>
      ) : (
        stackedTitle
      )}
      {subtitle || subtitleAccessory ? (
        <View style={styles.stackedSubtitleLine}>
          {subtitle ? (
            <Text variant="secondary" tone="textOnAccent" numberOfLines={1} style={styles.stackedSubtitle}>
              {subtitle}
            </Text>
          ) : null}
          {subtitleAccessory}
        </View>
      ) : null}
    </>
  );
  const picture = (
    <View style={[styles.picture, frame, { backgroundColor: colors.surfaceSunken }]}>
      {showPlaceholder ? (
        <View
          testID={testID ? `${testID}-placeholder` : undefined}
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.placeholder, stacked ? { paddingTop: mediaMetrics.captionInset, paddingBottom: mediaMetrics.captionInset + captionHeight + mediaMetrics.footerGap } : null]}
        >
          {placeholder}
        </View>
      ) : null}
      {hasPicture && typeof src === 'string' ? (
        // A person's picture (a creator card, the pay sheet's header) carries where they placed it (R-96); any other link has none and is cover-fitted as before.
        <PositionedImage
          testID={testID ? `${testID}-image` : undefined}
          uri={src}
          frame={typeof frame.width === 'number' && typeof frame.height === 'number' ? { width: frame.width, height: frame.height } : undefined}
          accessibilityLabel={imageLabel}
          accessible={Boolean(imageLabel)}
        />
      ) : hasPicture ? (
        <Image
          testID={testID ? `${testID}-image` : undefined}
          source={src}
          accessibilityLabel={imageLabel}
          accessible={Boolean(imageLabel)}
          contentFit="cover"
          style={styles.fill}
        />
      ) : null}
      {stacked ? (
        <>
          <Scrim token={gradients.scrimCard} />
          {below ? (
            <View onLayout={onCaptionLayout} style={[styles.caption, styles.captionStack]}>
              <View
                testID={testID ? `${testID}-words` : undefined}
                accessible
                accessibilityLabel={label}
                accessibilityRole={onPress ? 'button' : undefined}
                accessibilityActions={onPress ? activate : undefined}
                onAccessibilityAction={onPress}
              >
                {stackedWords}
              </View>
              {footer}
              {action ? (
                <Button
                  testID={action.testID}
                  label={action.label}
                  onPress={action.onPress}
                  variant={action.on ? 'veil' : 'primary'}
                  size="card"
                  full
                  loading={action.loading}
                  disabled={action.disabled}
                />
              ) : null}
            </View>
          ) : (
            <View onLayout={onCaptionLayout} style={styles.caption}>
              {stackedWords}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
  const words = stacked ? null : (
    <View style={styles.words}>
      {titleAccessory ? (
        <View style={styles.titleLine}>
          <Text variant="h3" numberOfLines={1} style={[font(600), styles.titleShrink]}>
            {title}
          </Text>
          {titleAccessory}
        </View>
      ) : (
        <Text variant="h3" numberOfLines={1} style={font(600)}>
          {title}
        </Text>
      )}
      {byline ? (
        <View style={styles.subtitleLine}>
          <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.byline}>
            {byline}
          </Text>
          {subtitleAccessory}
          {subtitle ? (
            <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.subtitle}>
              {`· ${subtitle}`}
            </Text>
          ) : null}
        </View>
      ) : subtitle || subtitleAccessory ? (
        <View style={styles.subtitleLine}>
          {subtitle ? (
            <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          {subtitleAccessory}
        </View>
      ) : null}
    </View>
  );
  const style = stacked ? styles.stacked : styles.row;
  const body = (
    <>
      {bare && !stacked && !hasPicture && !showPlaceholder ? null : picture}
      {words}
    </>
  );
  return onPress ? (
    <Pressable
      testID={testID}
      accessible={!below}
      accessibilityRole={below ? undefined : 'button'}
      accessibilityLabel={below ? undefined : label}
      onPress={onPress}
      {...ring.handlers}
      style={[style, ring.style]}
    >
      {body}
    </Pressable>
  ) : (
    <View testID={testID} accessible={!below} accessibilityLabel={below ? undefined : label} style={style}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: mediaMetrics.rowGap },
  stacked: {},
  picture: { overflow: 'hidden', flexShrink: 0 },
  fill: { width: '100%', height: '100%' },
  words: { flex: 1, minWidth: 0 },
  subtitleLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: mediaMetrics.captionGap },
  subtitle: { fontSize: mediaMetrics.subtitle, flexShrink: 1 },
  byline: { fontSize: mediaMetrics.subtitle, flexShrink: 0 },
  caption: { position: 'absolute', left: mediaMetrics.captionInset, right: mediaMetrics.captionInset, bottom: mediaMetrics.captionInset },
  stackedTitle: { fontSize: mediaMetrics.stackedTitle },
  stackedSubtitleLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: mediaMetrics.stackedSubtitleGap },
  stackedSubtitle: { fontSize: mediaMetrics.stackedSubtitle, opacity: mediaMetrics.stackedSubtitleOpacity, flexShrink: 1 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: mediaMetrics.titleAccessoryGap },
  titleShrink: { flexShrink: 1 },
  captionStack: { gap: mediaMetrics.footerGap },
  placeholder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});

