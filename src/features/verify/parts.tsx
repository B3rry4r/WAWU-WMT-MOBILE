import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { IconButton } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { footMetrics } from '@/features/create/CreateFrame';
import { iconOf, type FormatId } from '@/features/create/model';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { draftCount, draftLine, shopReady } from './model';
import type { ProductDraft } from './api';

/** design/_gen/kit.js `nav`: a 56 bar, 20 sides, 12 gap, a 42 round button, a 17 bold title. The Create frame's bar, with a button on the right. */
const nav = { height: 56, button: 42, title: 17, titleTracking: -0.02 } as const;
const body = { top: space.sm, between: space.md, bottom: space.xl } as const;

export type ShopFrameProps = {
  title: string;
  onBack: () => void;
  /** A round button on the right (VF2's plus). Left out, the right side is empty. */
  trailing?: { icon: IconName; label: string; onPress: () => void; testID?: string };
  /** Pinned under the body: the Save button. */
  foot?: ReactNode;
  children: ReactNode;
  testID?: string;
};

/** The frame of VF2 and its form: safe areas, the bar (back, a centred title, an optional round button), the scrolling body and a pinned foot. */
export function ShopFrame({ title, onBack, trailing, foot, children, testID }: ShopFrameProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <View style={styles.side}>
          <IconButton icon="ChevronLeft" label="Back" onPress={onBack} testID="shop-back" />
        </View>
        <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[styles.title, { fontSize: nav.title, letterSpacing: nav.titleTracking * nav.title }]}>
          {title}
        </Text>
        <View style={styles.side}>{trailing ? <IconButton icon={trailing.icon} label={trailing.label} onPress={trailing.onPress} testID={trailing.testID} /> : null}</View>
      </View>
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}
      >
        {children}
      </ScrollView>
      {foot ? (
        <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footMetrics.bottom + insets.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }]}>
          {foot}
        </View>
      ) : null}
    </View>
  );
}

/** VF2: the ring is 64 across with a 7 stroke and the figure at 18 bold; the card is 22 cornered with 16 inside. */
const ring = { size: 64, stroke: 7, figure: 18, card: radius.card, pad: space.lg, gap: space.md, title: 19, sub: 14.5 } as const;
const RADIUS = (ring.size - ring.stroke) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The progress ring: a track, an arc for `percent` (0 to 100), and the figure in the middle. */
export function ShopRing({ percent }: { percent: number }) {
  const { colors } = useWawu();
  const share = Math.min(100, Math.max(0, percent));
  const middle = ring.size / 2;
  const arc = (CIRCUMFERENCE * share) / 100;
  return (
    <View testID="shop-ring" accessibilityRole="progressbar" accessibilityLabel="Shop ready" accessibilityValue={{ min: 0, max: 100, now: share }} style={styles.ringBox}>
      <Svg width={ring.size} height={ring.size} viewBox={`0 0 ${ring.size} ${ring.size}`}>
        <Circle cx={middle} cy={middle} r={RADIUS} stroke={colors.surfaceSunken} strokeWidth={ring.stroke} fill="none" />
        {share > 0 ? (
          <Circle
            cx={middle}
            cy={middle}
            r={RADIUS}
            stroke={colors.accent}
            strokeWidth={ring.stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${arc} ${CIRCUMFERENCE - arc}`}
            rotation={-90}
            origin={`${middle}, ${middle}`}
          />
        ) : null}
      </Svg>
      <View style={styles.ringFigure} pointerEvents="none">
        <Text variant="body" style={[font(700), { fontSize: ring.figure, lineHeight: canvasNormalLineHeight(ring.figure) }]} testID="shop-ready-figure">
          {`${share}%`}
        </Text>
      </View>
    </View>
  );
}

/** "Shop ready", with the ring and "N drafts · drafts are free". Every figure is worked out from the drafts read. */
export function ReadyCard({ drafts }: { drafts: readonly ProductDraft[] }) {
  const { colors } = useWawu();
  return (
    <View testID="shop-ready" style={[styles.card, { backgroundColor: colors.surfaceCard, boxShadow: hairline(colors.borderHairline) }]}>
      <ShopRing percent={shopReady(drafts)} />
      <View style={styles.cardWords}>
        <Text variant="body" style={[font(700), styles.cardTitle]}>
          Shop ready
        </Text>
        <Text variant="body" tone="textMuted" style={styles.cardSub} testID="shop-ready-line">
          {`${draftCount(drafts.length)} · drafts are free`}
        </Text>
      </View>
    </View>
  );
}

const hairline = (color: string) => [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color, inset: true }];

/** VF2: a draft is a 56 picture tile 14 cornered, a 17 name, a 14 line, a chevron; the card has 10 inside. */
const row = { pad: 10, tile: 56, tileCorner: 14, gap: space.md, title: 17, sub: 14, tag: { height: 20, padH: 7, font: 11, inset: 4 } } as const;

/** The "Draft" tag over a draft's picture (VF2, M1's grid tag). */
export function DraftTag() {
  const { colors } = useWawu();
  return (
    <View style={[styles.tag, { backgroundColor: colors.mediaInk55 }]}>
      <Text variant="caption" tone="textOnAccent" style={styles.tagText}>
        Draft
      </Text>
    </View>
  );
}

/** A draft's picture: it has no file, so the mark of the kind of product it will be (an image mark while none is chosen), tagged Draft. */
export function DraftPicture({ kind }: { kind: FormatId | null }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.picture, { backgroundColor: colors.surfaceSunken }]}>
      <Icon name={iconOf(kind ?? 'image')} size={24} color={colors.textMuted} />
      <DraftTag />
    </View>
  );
}

export function DraftCard({ draft, onPress }: { draft: ProductDraft; onPress: () => void }) {
  const { colors } = useWawu();
  const focus = useFocusRing();
  const kind = (draft.contentType ?? null) as FormatId | null;
  return (
    <Pressable
      testID={`shop-draft-${draft.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${draft.title}, draft. ${draftLine(draft)}`}
      onPress={onPress}
      {...focus.handlers}
      style={({ pressed }) => [styles.draft, { backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceCard, boxShadow: hairline(colors.borderHairline) }, focus.style]}
    >
      <DraftPicture kind={kind} />
      <View style={styles.draftWords}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.draftTitle]}>
          {draft.title}
        </Text>
        <Text variant="body" tone="textMuted" numberOfLines={1} style={styles.draftSub}>
          {draftLine(draft)}
        </Text>
      </View>
      <Icon name="ChevronRight" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

/** VF1's rows: a 72 high card, a 44 accent tile, a 17 title with a 14 line under it, a lock on the right. */
const bonus = { corner: radius.card, pad: space.lg, tile: 44, gap: space.md, title: 17, sub: 14, lock: 20 } as const;

export function BonusRowCard({ id, icon, title, sub }: { id: string; icon: IconName; title: string; sub: string | null }) {
  const { colors } = useWawu();
  return (
    <View
      testID={`bonus-${id}`}
      accessible
      accessibilityLabel={`${title}${sub ? `, ${sub}` : ''}. Locked until you make it official.`}
      style={[styles.bonus, { backgroundColor: colors.surfaceCard, boxShadow: hairline(colors.borderHairline) }]}
    >
      <IconTile icon={icon} tone="accent" size={bonus.tile} />
      <View style={styles.bonusWords}>
        <Text variant="body" style={[font(600), styles.bonusTitle]}>
          {title}
        </Text>
        {sub ? (
          <Text variant="body" tone="textMuted" style={styles.bonusSub}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Icon name="Lock" size={bonus.lock} color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: nav.height, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: layout.gutter },
  side: { width: nav.button },
  title: { ...font(700), flex: 1, minWidth: 0, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingTop: body.top, paddingBottom: body.bottom, gap: body.between },
  foot: { paddingTop: footMetrics.top, gap: space.sm },
  ringBox: { width: ring.size, height: ring.size },
  ringFigure: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: ring.gap + space.xs, borderRadius: ring.card, padding: ring.pad },
  cardWords: { flex: 1, minWidth: 0, gap: space.xs },
  cardTitle: { fontSize: ring.title },
  cardSub: { fontSize: ring.sub },
  draft: { flexDirection: 'row', alignItems: 'center', gap: row.gap, borderRadius: ring.card, padding: row.pad },
  draftWords: { flex: 1, minWidth: 0, gap: space.xs },
  draftTitle: { fontSize: row.title },
  draftSub: { fontSize: row.sub },
  picture: { width: row.tile, height: row.tile, borderRadius: row.tileCorner, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tag: { position: 'absolute', top: row.tag.inset, left: row.tag.inset, height: row.tag.height, paddingHorizontal: row.tag.padH, borderRadius: radius.chip, justifyContent: 'center' },
  tagText: { ...font(700), fontSize: row.tag.font, lineHeight: canvasNormalLineHeight(row.tag.font) },
  bonus: { flexDirection: 'row', alignItems: 'center', gap: bonus.gap, borderRadius: bonus.corner, padding: bonus.pad },
  bonusWords: { flex: 1, minWidth: 0, gap: space.xs },
  bonusTitle: { fontSize: bonus.title },
  bonusSub: { fontSize: bonus.sub },
});
