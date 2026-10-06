import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type AccessibilityActionEvent } from 'react-native';

import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, layout, useWawu } from '@/theme';

import { updateDraft, useDraft } from './draft';
import { EditFrame } from './EditFrame';
import { problemsOf, withHandle } from './form';
import { SOCIAL, moved, unaddedOf, type SocialPlatform } from './social';
import { SocialLogo, hasMark } from './SocialLogo';

/**
 * design/_gen/me.js line 37 (`sRow`): 60 high with a hairline under it, 12
 * between parts, a 40 tile on a 12 corner holding an 18 logo, 15 type, an 18
 * grip; "Add" is 14 at 700 in the accent colour. The page stacks its parts 12 apart.
 */
const rowMetrics = { height: 60, between: 12, tile: 40, tileRadius: 12, logo: 18, grip: 18, fontSize: 15, addSize: 14, dragStart: 4 } as const;
const BODY_GAP = 12;

export type SocialLinksScreenProps = {
  /** Back and Done both close M9: what was typed stays in the form on M8 until Save. */
  onClose: () => void;
};

/**
 * M9 · Social links. Works on the draft M8 holds. The added links come first,
 * each with its handle to edit and a grip to drag it into place; the others
 * wait below with "Add". A handle left empty is not added.
 */
export function SocialLinksScreen({ onClose }: SocialLinksScreenProps) {
  const draft = useDraft();
  const [fresh, setFresh] = useState<SocialPlatform | null>(null);
  const [drag, setDrag] = useState<{ from: number; to: number; dy: number } | null>(null);
  if (!draft) return null;
  const { form, base } = draft;

  /** The rows on the list: every platform with something typed, and the one just added. */
  const listed = form.order;
  const unadded = unaddedOf(listed);
  const problems = problemsOf(form, base).social;
  const blocked = Object.keys(problems).length > 0;

  const close = () => {
    // A row opened with "Add" and left empty never became a link.
    updateDraft((f) => ({ ...f, order: f.order.filter((p) => f.handles[p] !== '') }));
    onClose();
  };

  const add = (platform: SocialPlatform) => {
    setFresh(platform);
    updateDraft((f) => ({ ...f, order: [...f.order.filter((p) => p !== platform), platform] }));
  };

  const place = (from: number, to: number) => updateDraft((f) => ({ ...f, order: moved(f.order, from, to) }));

  /** While one row is dragged, the others make room: the rows between its start and its target shift one place. */
  const shiftOf = (index: number): number => {
    if (!drag) return 0;
    if (index === drag.from) return drag.dy;
    if (drag.from < index && index <= drag.to) return -rowMetrics.height;
    if (drag.to <= index && index < drag.from) return rowMetrics.height;
    return 0;
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <EditFrame
        testID="social-links"
        title="Social links"
        onBack={close}
        gap={BODY_GAP}
        action={{ label: 'Done', onPress: close, disabled: blocked, testID: 'social-done' }}
      >
        <Text variant="muted">They show above your follower count, in this order. Drag to reorder.</Text>
        <View>
          {listed.map((platform, index) => (
            <AddedRow
              key={platform}
              platform={platform}
              index={index}
              count={listed.length}
              handle={form.handles[platform]}
              problem={problems[platform]}
              autoFocus={fresh === platform}
              lifted={drag?.from === index}
              shift={shiftOf(index)}
              onChange={(typed) => updateDraft((f) => withHandle(f, platform, typed))}
              onBlur={() => {
                // Left empty, a link goes back to the "Add" rows.
                if (form.handles[platform] === '') updateDraft((f) => ({ ...f, order: f.order.filter((p) => p !== platform) }));
              }}
              onDrag={(dy) => setDrag({ from: index, dy, to: clampIndex(index + Math.round(dy / rowMetrics.height), listed.length) })}
              onDrop={(dy) => {
                setDrag(null);
                place(index, clampIndex(index + Math.round(dy / rowMetrics.height), listed.length));
              }}
              onMove={(by) => place(index, index + by)}
            />
          ))}
          {unadded.map((platform) => (
            <AddRow key={platform} platform={platform} onAdd={() => add(platform)} />
          ))}
        </View>
      </EditFrame>
    </GestureHandlerRootView>
  );
}

const clampIndex = (index: number, count: number) => Math.max(0, Math.min(count - 1, index));

type AddedRowProps = {
  platform: SocialPlatform;
  index: number;
  count: number;
  handle: string;
  problem?: string;
  autoFocus: boolean;
  lifted: boolean;
  shift: number;
  onChange: (typed: string) => void;
  onBlur: () => void;
  onDrag: (dy: number) => void;
  onDrop: (dy: number) => void;
  onMove: (by: number) => void;
};

function AddedRow({ platform, index, count, handle, problem, autoFocus, lifted, shift, onChange, onBlur, onDrag, onDrop, onMove }: AddedRowProps) {
  const { colors } = useWawu();
  const meta = SOCIAL[platform];
  // A vertical drag that starts on the grip. Handlers run on the JS thread: the rows move with state, not a worklet.
  const pan = Gesture.Pan()
    .withTestId(`social-pan-${platform}`)
    .runOnJS(true)
    .minDistance(rowMetrics.dragStart)
    .onUpdate((event) => onDrag(event.translationY))
    .onEnd((event) => onDrop(event.translationY));

  const actions = [
    ...(index > 0 ? [{ name: 'moveUp', label: 'Move up' }] : []),
    ...(index < count - 1 ? [{ name: 'moveDown', label: 'Move down' }] : []),
  ];
  const onAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'moveUp') onMove(-1);
    if (event.nativeEvent.actionName === 'moveDown') onMove(1);
  };

  return (
    <View
      testID={`social-row-${platform}`}
      accessibilityActions={actions}
      onAccessibilityAction={onAction}
      style={[
        styles.row,
        { borderBottomColor: colors.borderHairline, backgroundColor: colors.surfacePage },
        lifted && styles.lifted,
        { transform: [{ translateY: shift }] },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
        <SocialLogo platform={platform} size={rowMetrics.logo} />
      </View>
      <View style={styles.words}>
        <TextInput
          testID={`social-input-${platform}`}
          accessibilityLabel={`${meta.label} handle`}
          value={handle}
          onChangeText={onChange}
          onBlur={onBlur}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Handle"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          style={[styles.input, browserOutlineOff, { color: colors.textPrimary }]}
        />
        {problem ? (
          <Text variant="caption" tone="danger" numberOfLines={1} accessibilityRole="alert">
            {problem}
          </Text>
        ) : hasMark(platform) ? null : (
          <Text variant="caption" tone="textMuted" numberOfLines={1}>
            {meta.label}
          </Text>
        )}
      </View>
      <GestureDetector gesture={pan}>
        <View
          testID={`social-grip-${platform}`}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Reorder ${meta.label}`}
          accessibilityHint="Drag to move it, or use the actions to move it up or down"
          style={styles.grip}
        >
          <Icon name="GripVertical" size={rowMetrics.grip} color={colors.textMuted} />
        </View>
      </GestureDetector>
    </View>
  );
}

function AddRow({ platform, onAdd }: { platform: SocialPlatform; onAdd: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const label = SOCIAL[platform].label;
  return (
    <Pressable
      testID={`social-add-${platform}`}
      accessibilityRole="button"
      accessibilityLabel={`Add ${label}`}
      onPress={onAdd}
      {...ring.handlers}
      style={[styles.row, { borderBottomColor: colors.borderHairline }, ring.style]}
    >
      <View style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
        <SocialLogo platform={platform} size={rowMetrics.logo} muted />
      </View>
      <Text variant="body" tone="textMuted" style={styles.name}>
        {label}
      </Text>
      <Text variant="body" tone="accentFg" style={[font(700), styles.add]}>
        Add
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    height: rowMetrics.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rowMetrics.between,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lifted: { zIndex: 2, opacity: 0.92 },
  tile: { width: rowMetrics.tile, height: rowMetrics.tile, borderRadius: rowMetrics.tileRadius, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, minWidth: 0 },
  input: { ...font(600), fontSize: rowMetrics.fontSize, padding: 0 },
  name: { flex: 1, fontSize: rowMetrics.fontSize },
  add: { fontSize: rowMetrics.addSize },
  grip: { minWidth: layout.tapMin, minHeight: rowMetrics.height, alignItems: 'flex-end', justifyContent: 'center' },
});
