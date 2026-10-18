import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { media, metrics, words } from '@/features/feed/look';
import { canvasNormalLineHeight, space, useWawu } from '@/theme';

import type { HomeView } from './model';

/** `page` on Today and on the feed's empty and error pages; `media` over a post (always dark). */
export type TabTone = 'media' | 'page';

/**
 * How the row gives way when the room beside it is short: Today's bar has the search and the bell at its right (H1), which a 320 wide
 * phone cannot fit beside the design's 20 between tabs. Step 0 is the design; each next step takes a little from the space between
 * the tabs, then a little from the labels' size, until the row fits. Never a clipped word, never below 80% of the design's size.
 */
export const tabFitSteps = [
  { gap: metrics.tabsSpacing, scale: 1 },
  { gap: space.lg, scale: 1 },
  { gap: space.md, scale: 1 },
  { gap: space.md, scale: 0.92 },
  { gap: space.sm, scale: 0.85 },
  { gap: space.sm, scale: 0.8 },
] as const;
const lastStep = tabFitSteps.length - 1;
/** The design's size for a tab label (16.5), read from the feed's own style so the two never differ. */
const tabSize = Number(words.tab.fontSize);

function HomeTab({
  label,
  selected,
  tone,
  size,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  tone: TabTone;
  size: number;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const onMedia = tone === 'media';
  const color = onMedia ? (selected ? media.ink : media.tabIdle) : colors[selected ? 'textPrimary' : 'textMuted'];
  const line = selected ? (onMedia ? media.ink : colors.accent) : 'transparent';
  const scaled = size === tabSize ? null : { fontSize: size, lineHeight: canvasNormalLineHeight(size) };
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.tab, { borderBottomColor: line }, ring.style]}
    >
      <Text style={[words.tab, { color }, scaled]}>{label}</Text>
    </Pressable>
  );
}

export type HomeTabsProps = {
  /** The tabs in order, and the one on screen. */
  views: readonly { view: HomeView; label: string }[];
  selected: HomeView;
  tone: TabTone;
  onChange: (view: HomeView) => void;
  style?: StyleProp<ViewStyle>;
  /**
   * The row takes the room its parent gives it and steps down (`tabFitSteps`) until every label shows. Off, the row is the
   * design's size and as wide as its labels (the feed's, over a post, where nothing sits beside it).
   */
  fit?: boolean;
};

/**
 * Home's tab row (H1 to H6): Today, Following, For you, 16.5 bold, 20 apart, the selected one
 * underlined. Today draws it on the page; the feed draws it over the post.
 */
export function HomeTabs({ views, selected, tone, onChange, style, fit = false }: HomeTabsProps) {
  const [room, setRoom] = useState(0);
  const [step, setStep] = useState(0);
  // The row's width at the design's own step, kept so a wider room can be judged without drawing every step again.
  const designWidth = useRef<number | null>(null);

  // Each layout of the row says how wide it is at the step it was drawn at: wider than the room, it takes the next step.
  const onRowLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (step === 0) designWidth.current = width;
    if (room > 0 && width > room && step < lastStep) setStep(step + 1);
  };
  // A new room starts again from the design's size, or from the first step when the design's own width is known not to fit.
  const onRoomLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width === room) return;
    setRoom(width);
    setStep(designWidth.current !== null && designWidth.current > width ? 1 : 0);
  };

  const { gap, scale } = fit ? tabFitSteps[step] : { gap: metrics.tabsSpacing, scale: 1 };
  const row = (
    <View
      testID="home-tabs"
      accessibilityRole="tablist"
      pointerEvents="box-none"
      onLayout={fit ? onRowLayout : undefined}
      style={[styles.tabs, { gap }, fit ? styles.fitRow : style]}
    >
      {views.map((v) => (
        <HomeTab
          key={v.view}
          label={v.label}
          selected={selected === v.view}
          tone={tone}
          size={tabSize * scale}
          onPress={() => onChange(v.view)}
          testID={`feed-tab-${v.view}`}
        />
      ))}
    </View>
  );
  if (!fit) return row;
  return (
    <View testID="home-tabs-room" onLayout={onRoomLayout} style={[styles.fitRoom, style]}>
      {row}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', alignItems: 'center' },
  tab: { paddingBottom: metrics.tabUnderlinePad, borderBottomWidth: metrics.tabUnderline },
  /**
   * The room the row may use: what its parent leaves, never more, so the row cannot push what sits beside it. It lays the row
   * out sideways so the row keeps the width of its labels (a column would squeeze it to the room, and the steps would never
   * see it overflow).
   */
  fitRoom: { flex: 1, minWidth: 0, flexDirection: 'row', overflow: 'hidden' },
  fitRow: { alignSelf: 'flex-start', flexShrink: 0 },
});
