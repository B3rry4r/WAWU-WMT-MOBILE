import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { FilterChips } from '@/components/FilterChips';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { STEPS, type Step } from './hostForm';

/** design/_gen/events_b.js `stepper`: three 4 high bars 6 apart, 2 corners; 11.5 semi-bold names 6 under them. */
const stepperMetrics = { bar: 4, barCorner: 2, between: 6, label: 11.5 } as const;
/** events_b.js `opt`: 42 high, 14 corner, 14 semi-bold, 8 apart; the picked one on the accent tint with a 1.5 accent ring. */
export const optMetrics = { height: 42, corner: 14, font: 14, between: 8, ring: 1.5 } as const;
/** events_b.js `ta`: a box at least 90 high, 18 corner, 14 by 16 padding, 15 type on a 1.4 line. */
const areaMetrics = { minHeight: 90, padV: 14, font: 15, leading: 1.4 } as const;
/** kit.js `field` with a `trail` icon: 17 for a calendar or clock, 18 for a chevron. */
export const trailMetrics = { clock: 17, chevron: 18 } as const;
/** events_b.js form2's banner: 110 high, 20 corner, a 1.5 strong ring; a 24 ImagePlus 8 over a 13.5 semi-bold name. */
const bannerTileMetrics = { height: 110, ring: 1.5, icon: 24, between: 8, font: 13.5 } as const;
/** kit.js `banner`: 18 corner, 14 by 16 padding, a 19 icon nudged 1 down, 12 to the words, 3 between title and text. */
const noteMetrics = { padV: 14, icon: 19, iconStroke: 2.2, nudge: 1, inner: 3 } as const;
/** kit.js `field` hint: 12.5, a 15 icon at 2.2, 6 apart, 8 under the box. */
const hintMetrics = { font: 12.5, icon: 15, iconStroke: 2.2, between: 6 } as const;

/** Basics / When and where / Tickets, the current step's bar and name lit. */
export function Stepper({ step }: { step: Step }) {
  const { colors } = useWawu();
  return (
    <View style={styles.stepper} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}, ${STEPS[step]}`} accessible>
      {STEPS.map((name, i) => (
        <View key={name} style={styles.stepCol}>
          <View style={[styles.bar, { backgroundColor: i <= step ? colors.accent : colors.surfaceSunken }]} />
          <Text
            variant="body"
            tone={i === step ? 'textPrimary' : 'textMuted'}
            style={[font(600), { fontSize: stepperMetrics.label, lineHeight: canvasNormalLineHeight(stepperMetrics.label) }]}
          >
            {name}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The field's name above it, as `TextField` draws its own. */
export function FieldLabel({ children }: { children: string }) {
  return (
    <Text variant="secondary" tone="textSecondary" style={styles.label}>
      {children}
    </Text>
  );
}

/** The red line under a field: a 15 alert and what is wrong. */
export function FieldError({ message, testID }: { message?: string; testID?: string }) {
  const { colors } = useWawu();
  if (!message) return null;
  return (
    <View style={styles.hint}>
      <Icon name="CircleAlert" size={hintMetrics.icon} color={colors.danger} strokeWidth={hintMetrics.iconStroke} />
      <Text
        testID={testID}
        variant="caption"
        tone="danger"
        accessibilityRole="alert"
        style={{ fontSize: hintMetrics.font, lineHeight: canvasNormalLineHeight(hintMetrics.font), flexShrink: 1 }}
      >
        {message}
      </Text>
    </View>
  );
}

export type PickerFieldProps = {
  label?: string;
  value: string | null;
  placeholder: string;
  icon: IconName;
  onPress: () => void;
  error?: string;
  testID: string;
};

/** A field that opens a picker: the value (or a muted placeholder) and a trailing icon (E14's Starts, Ends, Category). */
export function PickerField({ label, value, placeholder, icon, onPress, error, testID }: PickerFieldProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const size = icon === 'ChevronDown' ? trailMetrics.chevron : trailMetrics.clock;
  return (
    <View style={styles.fieldRoot}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? placeholder}, ${value ?? 'not set'}`}
        onPress={onPress}
        {...ring.handlers}
        style={({ pressed }) => [
          styles.box,
          {
            backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceInput,
            borderColor: error ? colors.danger : colors.borderHairline,
            borderWidth: error ? fieldMetrics.ring : StyleSheet.hairlineWidth,
          },
          ring.style,
        ]}
      >
        <Text
          variant="body"
          numberOfLines={1}
          tone={value ? 'textPrimary' : 'textMuted'}
          style={[font(value ? 500 : 400), styles.value]}
        >
          {value ?? placeholder}
        </Text>
        <Icon name={icon} size={size} color={colors.textMuted} />
      </Pressable>
      <FieldError message={error} testID={`${testID}-error`} />
    </View>
  );
}

export type AreaFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  maxLength?: number;
  testID: string;
};

/** E13's "What happens at it": a box at least 90 high that grows with the words. */
export function AreaField({ label, value, onChangeText, error, maxLength, testID }: AreaFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const border = error ? colors.danger : focused ? colors.accent : colors.borderHairline;
  return (
    <View style={styles.fieldRoot}>
      <FieldLabel>{label}</FieldLabel>
      <View
        style={[
          styles.area,
          { backgroundColor: colors.surfaceInput, borderColor: border, borderWidth: focused || error ? fieldMetrics.ring : StyleSheet.hairlineWidth },
        ]}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          multiline
          value={value}
          maxLength={maxLength}
          onChangeText={onChangeText}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.areaInput, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
        />
      </View>
      <FieldError message={error} testID={`${testID}-error`} />
    </View>
  );
}

/** E13's FORMAT row: three equal options, one picked. */
export function OptionRow<T extends string>({
  items,
  value,
  onChange,
  label,
  testID,
}: {
  items: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  testID: string;
}) {
  return (
    <View style={styles.optRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {items.map((item) => (
        <Option key={item.value} label={item.label} selected={item.value === value} onPress={() => onChange(item.value)} testID={`${testID}-${item.value}`} />
      ))}
    </View>
  );
}

function Option({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.opt,
        selected
          ? { backgroundColor: colors.accentTint, borderColor: colors.accent, borderWidth: optMetrics.ring }
          : { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline, borderWidth: StyleSheet.hairlineWidth },
        ring.style,
      ]}
    >
      <Text variant="body" style={[font(600), { fontSize: optMetrics.font, lineHeight: canvasNormalLineHeight(optMetrics.font) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A section name in capitals (E13's FORMAT): the kit's `label`, on the canvas's normal line. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="label" style={{ lineHeight: canvasNormalLineHeight(LABEL_SIZE) }}>
      {children}
    </Text>
  );
}

/** E14's banner tile: the picked picture once there is one, else the ImagePlus and its name. */
export function BannerTile({ previewUri, onPress, error }: { previewUri: string | null; onPress: () => void; error?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View style={styles.fieldRoot}>
      <Pressable
        testID="host-banner"
        accessibilityRole="button"
        accessibilityLabel={previewUri ? 'Banner image, change it' : 'Banner image, add one'}
        onPress={onPress}
        {...ring.handlers}
        style={[styles.banner, { backgroundColor: colors.surfaceSunken, borderColor: colors.borderStrong }, ring.style]}
      >
        {previewUri ? (
          <Image testID="host-banner-preview" source={{ uri: previewUri }} contentFit="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <>
            <Icon name="ImagePlus" size={bannerTileMetrics.icon} color={colors.textSecondary} />
            <Text variant="body" tone="textSecondary" style={[font(600), styles.bannerName]}>
              Banner image
            </Text>
          </>
        )}
      </Pressable>
      <FieldError message={error} testID="host-banner-error" />
    </View>
  );
}

/** A sheet of choices, one to a row, the picked one ticked (Kind, Category). */
export function ChoiceSheet<T extends string>({
  visible,
  title,
  items,
  value,
  onPick,
  onClose,
  testID,
}: {
  visible: boolean;
  title: string;
  items: readonly { value: T; label: string }[];
  value: T | null;
  onPick: (value: T) => void;
  onClose: () => void;
  testID: string;
}) {
  const { colors } = useWawu();
  return (
    <BottomSheet visible={visible} onClose={onClose} label={title} testID={testID}>
      <Text variant="sheetTitleSm">{title}</Text>
      <ScrollView style={styles.list} accessibilityRole="radiogroup" accessibilityLabel={title}>
        {items.map((row) => {
          const selected = row.value === value;
          return (
            <Pressable
              key={row.value}
              testID={`${testID}-${row.value}`}
              accessibilityRole="radio"
              accessibilityLabel={row.label}
              accessibilityState={{ checked: selected }}
              onPress={() => onPick(row.value)}
              style={[styles.listRow, { borderBottomColor: colors.borderHairline }]}
            >
              <Text variant="body" style={[font(selected ? 700 : 500), styles.value]}>
                {row.label}
              </Text>
              {selected ? <Icon name="Check" size={space.xl} color={colors.accentFg} strokeWidth={2.4} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

/** A sheet to pick a day (a row of days that scrolls sideways) and a time, or a time alone. */
export function WhenSheet({
  visible,
  title,
  days,
  day,
  onDay,
  times,
  time,
  onTime,
  onClose,
  footer,
  testID,
}: {
  visible: boolean;
  title: string;
  days?: readonly { value: string; label: string }[];
  day?: string | null;
  onDay?: (day: string) => void;
  times: readonly string[];
  time: string | null;
  onTime: (time: string) => void;
  onClose: () => void;
  footer: ReactNode;
  testID: string;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label={title} testID={testID}>
      <Text variant="sheetTitleSm">{title}</Text>
      {days && onDay ? (
        <View style={styles.group}>
          <SectionLabel>Day</SectionLabel>
          <FilterChips label="Day" items={days} value={day ?? ''} onChange={onDay} inset={0} revealSelected testID={`${testID}-day`} />
        </View>
      ) : null}
      <View style={styles.group}>
        <SectionLabel>Time</SectionLabel>
        <ScrollView style={styles.times}>
          <FilterChips
            variant="option"
            label="Time"
            items={times.map((t) => ({ value: t, label: t }))}
            value={time ?? ''}
            onChange={onTime}
            testID={`${testID}-time`}
          />
        </ScrollView>
      </View>
      {footer}
    </BottomSheet>
  );
}

/** The danger note at the top of E22: a CircleX, "Sent back" and the reviewer's words. */
export function SentBackNote({ reason }: { reason: string | null }) {
  const { colors } = useWawu();
  return (
    <View testID="sent-back-note" accessibilityRole="alert" style={[styles.note, { backgroundColor: colors.dangerTint }]}>
      <View style={styles.noteIcon}>
        <Icon name="CircleX" size={noteMetrics.icon} color={colors.danger} strokeWidth={noteMetrics.iconStroke} />
      </View>
      <View style={styles.noteText}>
        <Text variant="kvValue">Sent back</Text>
        {reason ? <Text variant="bannerBody">{reason}</Text> : null}
      </View>
    </View>
  );
}

/** kit.js `label`: 11 px (the theme's `label` size). */
const LABEL_SIZE = 11;
/** The time list's height in the sheet: about five rows of chips, then it scrolls. */
const TIMES_MAX_H = 230;
/** The choice list's height in the sheet before it scrolls. */
const LIST_MAX_H = 420;

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', gap: stepperMetrics.between },
  stepCol: { flex: 1, gap: stepperMetrics.between },
  bar: { height: stepperMetrics.bar, borderRadius: stepperMetrics.barCorner },
  label: { ...font(600), fontSize: fieldMetrics.label, marginBottom: space.sm },
  fieldRoot: { alignSelf: 'stretch' },
  box: {
    height: fieldMetrics.height,
    borderRadius: fieldMetrics.radius,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  value: { flex: 1, fontSize: fieldMetrics.value },
  hint: { flexDirection: 'row', alignItems: 'center', gap: hintMetrics.between, marginTop: space.sm },
  area: { minHeight: areaMetrics.minHeight, borderRadius: fieldMetrics.radius, paddingVertical: areaMetrics.padV, paddingHorizontal: space.lg },
  areaInput: {
    ...font(400),
    flex: 1,
    fontSize: areaMetrics.font,
    lineHeight: areaMetrics.font * areaMetrics.leading,
    padding: 0,
    textAlignVertical: 'top',
  },
  optRow: { flexDirection: 'row', gap: optMetrics.between },
  opt: { flex: 1, height: optMetrics.height, borderRadius: optMetrics.corner, alignItems: 'center', justifyContent: 'center' },
  banner: {
    height: bannerTileMetrics.height,
    borderRadius: radius.media,
    borderWidth: bannerTileMetrics.ring,
    alignItems: 'center',
    justifyContent: 'center',
    gap: bannerTileMetrics.between,
    overflow: 'hidden',
  },
  bannerName: { fontSize: bannerTileMetrics.font, lineHeight: canvasNormalLineHeight(bannerTileMetrics.font) },
  list: { maxHeight: LIST_MAX_H },
  listRow: {
    minHeight: fieldMetrics.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  group: { gap: space.sm },
  times: { maxHeight: TIMES_MAX_H },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    borderRadius: radius.tile,
    paddingVertical: noteMetrics.padV,
    paddingHorizontal: space.lg,
  },
  noteIcon: { paddingTop: noteMetrics.nudge },
  noteText: { flex: 1, gap: noteMetrics.inner },
});
