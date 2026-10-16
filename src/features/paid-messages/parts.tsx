import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { Switch } from '@/features/settings/Switch';
import { font, radius, space, useWawu } from '@/theme';

import { priceInput } from './model';

/** design/_gen/inbox.js line 62, `setBase`: the switch card is 14 by 16 inside with 12 between the words and the switch; the title is 15.5 at 600, the line 13 muted, 2 under it. */
const switchMetrics = { padV: 14, toSwitch: 12, title: 15.5, line: 13, lineGap: 2 } as const;

type SwitchCardProps = { title: string; line: string; on: boolean; locked: boolean; onToggle: () => void; testID?: string };

/** "Take paid messages" and the switch. Locked (I23), it is drawn off and cannot be pressed. */
export function SwitchCard({ title, line, on, locked, onToggle, testID }: SwitchCardProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={line}
      accessibilityState={{ checked: on, disabled: locked }}
      disabled={locked}
      onPress={onToggle}
      {...ring.handlers}
      style={[
        styles.switchCard,
        { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
        ring.style,
      ]}
    >
      <View style={styles.switchWords}>
        <Text variant="body" style={styles.switchTitle}>
          {title}
        </Text>
        <Text variant="meta" tone="textMuted" style={styles.switchLine} testID={testID ? `${testID}-line` : undefined}>
          {line}
        </Text>
      </View>
      <Switch on={on && !locked} />
    </Pressable>
  );
}

export type NoteTone = 'warning' | 'danger';

/** kit.js line 58, `banner`: 18 corner, 14 by 16 inside, a 19 icon 12 from the words, 3 between title, words and the action. */
const noteMetrics = { padV: 14, icon: 19, iconToText: 12, inner: 3, nudge: 1, actionTop: 8 } as const;

type NoteProps = { tone: NoteTone; icon: IconName; title: string; body: string; children?: ReactNode; testID?: string };

/** The tinted note on I22 (warning, with an action) and I23 (danger). The shared Banner has no danger tone and no action. */
export function Note({ tone, icon, title, body, children, testID }: NoteProps) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={[styles.note, { backgroundColor: tone === 'warning' ? colors.warningTint : colors.dangerTint }]}>
      <View style={styles.noteIcon}>
        <Icon name={icon} size={noteMetrics.icon} color={tone === 'warning' ? colors.warning : colors.danger} strokeWidth={2.2} />
      </View>
      <View style={styles.noteText}>
        <Text variant="kvValue">{title}</Text>
        <Text variant="bannerBody">{body}</Text>
        {children ? <View style={styles.noteAction}>{children}</View> : null}
      </View>
    </View>
  );
}

/** inbox.js line 62: the field is the kit's 54 tall at 18, with the value at 20 (`fs: 20`), 500. */
const priceMetrics = { fontSize: 20, padH: 16 } as const;

type PriceFieldProps = {
  digits: string;
  onChangeDigits: (typed: string) => void;
  locked: boolean;
  invalid: boolean;
  testID?: string;
};

/** The price per message, typed as naira. The glyph and commas are drawn by `priceInput`, never typed. */
export function PriceField({ digits, onChangeDigits, locked, invalid, testID }: PriceFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const border = invalid ? colors.danger : focused && !locked ? colors.accent : colors.borderHairline;
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.surfaceInput, borderColor: border, borderWidth: (focused && !locked) || invalid ? fieldMetrics.ring : StyleSheet.hairlineWidth },
      ]}
    >
      <TextInput
        testID={testID}
        accessibilityLabel="Price per message"
        value={priceInput(digits)}
        onChangeText={onChangeDigits}
        editable={!locked}
        keyboardType="number-pad"
        placeholder="₦0"
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
      />
    </View>
  );
}

/** inbox.js line 61, `presets`: pills 40 tall, 8 apart, sharing the row; the chosen one fills with the text colour. */
const presetMetrics = { height: 40, between: 8, font: 14 } as const;

type PresetsProps = { presetsKobo: readonly number[]; priceKobo: number | null; locked: boolean; onPick: (kobo: number) => void };

export function Presets({ presetsKobo, priceKobo, locked, onPick }: PresetsProps) {
  return (
    <View style={styles.presets}>
      {presetsKobo.map((kobo) => (
        <Preset key={kobo} kobo={kobo} chosen={kobo === priceKobo} locked={locked} onPress={() => onPick(kobo)} />
      ))}
    </View>
  );
}

function Preset({ kobo, chosen, locked, onPress }: { kobo: number; chosen: boolean; locked: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`paid-preset-${kobo}`}
      accessibilityRole="button"
      accessibilityLabel={`Set the price to ${kobo / 100} naira`}
      accessibilityState={{ selected: chosen, disabled: locked }}
      disabled={locked}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.preset,
        chosen
          ? { backgroundColor: colors.textPrimary }
          : { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderStrong, inset: true }] },
        ring.style,
      ]}
    >
      <Money minorUnits={kobo} size={presetMetrics.font} weight={700} decimals={false} tone={chosen ? 'surfacePage' : 'textPrimary'} />
    </Pressable>
  );
}

type RaiseProps = { label: string; onPress: () => void };

/** I22's "Raise to ₦2,500": the kit's small secondary button. */
export function Raise({ label, onPress }: RaiseProps) {
  return <Button label={label} variant="secondary" size="sm" full={false} onPress={onPress} testID="paid-raise" />;
}

const styles = StyleSheet.create({
  switchCard: { flexDirection: 'row', alignItems: 'center', gap: switchMetrics.toSwitch, paddingVertical: switchMetrics.padV, paddingHorizontal: space.lg, borderRadius: radius.card },
  switchWords: { flex: 1 },
  switchTitle: { ...font(600), fontSize: switchMetrics.title },
  switchLine: { fontSize: switchMetrics.line, marginTop: switchMetrics.lineGap },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: noteMetrics.iconToText, borderRadius: radius.tile, paddingVertical: noteMetrics.padV, paddingHorizontal: space.lg },
  noteIcon: { paddingTop: noteMetrics.nudge },
  noteText: { flex: 1, gap: noteMetrics.inner },
  noteAction: { marginTop: noteMetrics.actionTop, alignSelf: 'flex-start' },
  field: { height: fieldMetrics.height, borderRadius: fieldMetrics.radius, paddingHorizontal: priceMetrics.padH, justifyContent: 'center' },
  input: { ...font(500), fontSize: priceMetrics.fontSize, padding: 0 },
  presets: { flexDirection: 'row', gap: presetMetrics.between },
  preset: { flex: 1, height: presetMetrics.height, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});
