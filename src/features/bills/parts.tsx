import { useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { formatMoney, Money } from '@/components/Money';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Radio } from '@/features/create/parts';
import { fieldMetrics } from '@/components/TextField';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu, type ColorToken } from '@/theme';

import { useKeepCaret } from './useKeepCaret';

/**
 * design/_gen/services.js (S2 to S4), the pieces the three screens share, each at the canvas's own size:
 * - `step`: a chip row 10 by 14 at corner 14 on the sunken colour, its label 12.5 muted in a 64 column (at least; one line always), its value 14
 *   semi-bold, and a 15 X in the muted colour at stroke 2.2;
 * - `cat`: a tile 14 all round at the tile corner on the card colour with a hairline, a 40 accent icon, 12 to the word (15,
 *   semi-bold);
 * - `biller`: 60 high, a 40 badge (corner 12, 13 bold initials) on the sunken colour, 12 to the words (15 semi-bold, the line
 *   under it 12.5 muted), a 17 chevron, a hairline under the row;
 * - the amount chips: equal width, 38 high, 8 apart, the chosen one filled with the text colour.
 */
export const billMetrics = {
  chipPadV: 10,
  chipPadH: space.md + 2,
  chipRadius: 14,
  chipLabel: 12.5,
  chipLabelWidth: 64,
  chipValue: 14,
  chipX: 15,
  chipGap: 10,
  tilePad: 14,
  tileGap: 10,
  tileIcon: 40,
  tileWord: 15,
  tileRingChosen: 1.5,
  rowMin: 60,
  badge: 40,
  badgeRadius: 12,
  badgeWord: 13,
  rowTitle: 15,
  rowLine: 12.5,
  rowChevron: 17,
  presetHeight: 38,
  presetGap: 8,
  presetWord: 13.5,
  hintIcon: 15,
  hintStroke: 2.2,
  hintGap: 6,
  hintWord: 12.5,
  amountValue: 20,
  fieldValue: 15.5,
  monoTracking: 0.04,
  fieldGap: 8,
  prefixGap: 2,
  recentIcon: 44,
  recentAmount: 14.5,
  networkHeight: 44,
  networkGap: 8,
  networkWord: 14,
} as const;
const m = billMetrics;

/** The phone's own face for a glyph Alan Sans lacks (the ₦, R-35); `Money` does the same for the sign inside its figures. */
const platformFace = { fontFamily: 'System', fontWeight: '500' } as const;

/** The chip that says what has been chosen so far ("Paying for  Electricity  X"); its X takes the choice back. */
export function StepChip({ label, value, onClear, clearLabel, testID }: { label: string; value: string; onClear: () => void; clearLabel: string; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <View testID={testID} style={[styles.chip, { backgroundColor: colors.surfaceSunken }]}>
      <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.chipLabel}>
        {label}
      </Text>
      <Text variant="body" numberOfLines={1} style={[font(600), styles.chipValue]}>
        {value}
      </Text>
      <Pressable
        testID={testID ? `${testID}-clear` : undefined}
        accessibilityRole="button"
        accessibilityLabel={clearLabel}
        hitSlop={layout.tapMin / 4}
        onPress={onClear}
        {...ring.handlers}
        style={ring.style}
      >
        <Icon name="X" size={m.chipX} color={colors.textMuted} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

/** One kind of bill on S2 (the kit's `cat`). Greyed and not pressable on S13. */
export function CategoryTile({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress?: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const body = (
    <>
      <IconTile icon={icon} tone="accent" size={m.tileIcon} />
      <Text variant="body" numberOfLines={1} style={[font(600), styles.tileWord]}>
        {label}
      </Text>
    </>
  );
  const frame = [styles.tile, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }];
  if (!onPress) {
    return (
      <View testID={testID} accessibilityRole="text" accessibilityState={{ disabled: true }} style={frame}>
        {body}
      </View>
    );
  }
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[frame, ring.style]}>
      {body}
    </Pressable>
  );
}

/** A heading in the small capitals the kit's `label` draws. */
export function SectionLabel({ children }: { children: string }) {
  return <Text variant="label">{children}</Text>;
}

/** One company on S3: its badge, its name, a note under it when the provider gives one, and a chevron. */
export function BillerRow({ name, initials, note, onPress, testID }: { name: string; initials: string; note?: string; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={note ? `${name}, ${note}` : name}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.borderHairline }, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.badge, { backgroundColor: colors.surfaceSunken }]}>
        <Text variant="body" style={[font(700), styles.badgeWord]}>
          {initials}
        </Text>
      </View>
      <View style={styles.rowWords}>
        <Text variant="body" style={[font(600), styles.rowTitle]}>
          {name}
        </Text>
        {note ? (
          <Text variant="secondary" tone="textMuted" style={styles.rowLine}>
            {note}
          </Text>
        ) : null}
      </View>
      <Icon name="ChevronRight" size={m.rowChevron} color={colors.textMuted} />
    </Pressable>
  );
}

/** One thing the person has paid for, in S2's Recent: a round icon, the company over the number, and the amount. */
export function RecentRow({ icon, title, line, amountKobo, onPress, testID }: { icon: IconName; title: string; line: string; amountKobo: number; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${line}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.recent, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <IconTile icon={icon} tone="neutral" size={m.recentIcon} />
      <View style={styles.rowWords}>
        <Text variant="body" numberOfLines={1} style={[font(600), styles.rowTitle]}>
          {title}
        </Text>
        <Text variant="secondary" tone="textMuted" numberOfLines={1} style={styles.rowLine}>
          {line}
        </Text>
      </View>
      <Money minorUnits={amountKobo} size={m.recentAmount} decimals={false} />
    </Pressable>
  );
}

/** One package, bundle or plan on S9: its name, a line under it when there is one, its price when it has one, and a radio. */
export function PackageRow({ name, line, amountKobo, chosen, onPress, testID }: { name: string; line?: string; amountKobo: number | null; chosen: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={amountKobo === null ? name : `${name}, ${formatMoney(amountKobo, { decimals: amountKobo % 100 !== 0 })}`}
      accessibilityState={{ selected: chosen }}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.row, { borderBottomColor: colors.borderHairline }, ring.style]}
    >
      <View style={styles.rowWords}>
        <Text variant="body" style={[font(600), styles.rowTitle]}>
          {name}
        </Text>
        {line ? (
          <Text variant="secondary" tone="textMuted" style={styles.rowLine}>
            {line}
          </Text>
        ) : null}
      </View>
      {amountKobo === null ? null : <Money minorUnits={amountKobo} size={m.recentAmount} decimals={amountKobo % 100 !== 0} />}
      <Radio selected={chosen} />
    </Pressable>
  );
}

/** S8's networks: equal chips in a row, the chosen one on the accent tint with an accent ring (the board's own). */
export function NetworkChips({ networks, chosen, onPick, testID }: { networks: readonly { code: string; name: string }[]; chosen: string | null; onPick: (code: string) => void; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={styles.networks}>
      {networks.map((n) => {
        const on = n.code === chosen;
        return (
          <Pressable
            key={n.code}
            testID={testID ? `${testID}-${n.code}` : undefined}
            accessibilityRole="button"
            accessibilityLabel={n.name}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(n.code)}
            style={[
              styles.network,
              on
                ? { backgroundColor: colors.accentTint, borderColor: colors.accent, borderWidth: m.tileRingChosen }
                : { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline, borderWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <Text variant="body" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[font(700), styles.networkWord]}>
              {n.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The quick amounts: equal chips in a row, the one that equals the typed amount filled. */
export function AmountPresets({ presetsKobo, chosenKobo, onPick, testID }: { presetsKobo: readonly number[]; chosenKobo: number | null; onPick: (kobo: number) => void; testID?: string }) {
  const { colors } = useWawu();
  if (presetsKobo.length === 0) return null;
  return (
    <View testID={testID} style={styles.presets}>
      {presetsKobo.map((kobo) => {
        const chosen = chosenKobo === kobo;
        return (
          <Pressable
            key={kobo}
            testID={testID ? `${testID}-${kobo}` : undefined}
            accessibilityRole="button"
            accessibilityLabel={formatMoney(kobo, { decimals: false })}
            accessibilityState={{ selected: chosen }}
            onPress={() => onPick(kobo)}
            style={[
              styles.preset,
              chosen ? { backgroundColor: colors.textPrimary } : { borderColor: colors.borderStrong, borderWidth: 1 },
            ]}
          >
            <Money minorUnits={kobo} size={m.presetWord} decimals={false} tone={chosen ? 'surfacePage' : 'textPrimary'} />
          </Pressable>
        );
      })}
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (typed: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** The kit's `mono`: the digits spaced at .04em. */
  mono?: boolean;
  /** 20 for the amount, 15.5 otherwise (`fs`). */
  valueSize?: number;
  /**
   * A sign drawn in front of the value while there is one (the amount's ₦). It is its own run in the phone's face, which has
   * the glyph (R-35: Alan Sans has none), the same size and line as the value, so the two read as one figure. It is not read
   * out; the input's label says what the box is for.
   */
  prefix?: string;
  prefixTestID?: string;
  /** The red outline: a meter that was not found, an amount outside the limits. */
  invalid?: boolean;
  maxLength?: number;
  /** The box redraws its words as the person types (the amount's commas): keep the caret after the key just typed (browsers; R2-2). */
  keepCaret?: boolean;
  /** S8's "Mine": a word at the end of the box that fills it. */
  trail?: ReactNode;
  children?: ReactNode;
  testID?: string;
};

/**
 * The kit's `field` at the sizes S4 draws (`fs` 20 for the amount, `mono` for the meter), which `TextField` has no prop for
 * (SHARED-CHANGES.md BILLS-01 #1 asks for them; this is its look, from the same `fieldMetrics`, and it goes when that lands).
 * The line under the field is the screen's own, passed as children.
 */
export function BillField({ label, value, onChangeText, placeholder, keyboardType, mono, valueSize = m.fieldValue, prefix, prefixTestID, invalid, maxLength, keepCaret, trail, children, testID }: FieldProps) {
  const { colors } = useWawu();
  const inputRef = useRef<TextInput | null>(null);
  const caret = useKeepCaret(inputRef, value, keepCaret === true);
  const [focused, setFocused] = useState(false);
  const border = invalid ? colors.danger : focused ? colors.accent : colors.borderHairline;
  return (
    <View style={styles.field}>
      <Text variant="secondary" tone="textSecondary" style={[font(600), styles.fieldLabel]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldBox,
          { backgroundColor: colors.surfaceInput, borderColor: border, borderWidth: focused || invalid ? fieldMetrics.ring : StyleSheet.hairlineWidth },
        ]}
      >
        {prefix && value !== '' ? (
          <Text
            testID={prefixTestID}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              platformFace,
              { color: colors.textPrimary, fontSize: valueSize, lineHeight: canvasNormalLineHeight(valueSize), marginRight: m.prefixGap },
            ]}
          >
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={inputRef}
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onKeyPress={caret.onKeyPress}
          onChangeText={(typed) => {
            caret.onTyped(typed);
            onChangeText(typed);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCorrect={false}
          autoCapitalize="none"
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            font(value === '' ? 400 : 500),
            styles.fieldInput,
            Platform.OS === 'web' ? browserOutlineOff : null,
            { color: colors.textPrimary, fontSize: valueSize, letterSpacing: mono ? m.monoTracking * valueSize : 0, lineHeight: canvasNormalLineHeight(valueSize) },
          ]}
        />
        {trail}
      </View>
      {children}
    </View>
  );
}

/** The kit `field` hint: 12.5, with a 15 icon at stroke 2.2 and 6 between (positive and bold when it is a good answer). */
export function HintLine({ tone, icon, words, strong, action, testID }: { tone: ColorToken; icon?: IconName; words: string; strong?: boolean; action?: { label: string; onPress: () => void }; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} style={styles.hint} accessible={action === undefined} accessibilityLiveRegion="polite" accessibilityRole={tone === 'danger' ? 'alert' : undefined}>
      {icon ? <Icon name={icon} size={m.hintIcon} color={colors[tone]} strokeWidth={m.hintStroke} /> : null}
      <Text variant="caption" tone={tone} style={[font(strong ? 600 : 400), styles.hintWords]}>
        {words}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action.label} hitSlop={layout.tapMin / 4} onPress={action.onPress} testID={testID ? `${testID}-action` : undefined}>
          <Text variant="caption" tone="accentFg" style={font(700)}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: m.chipGap, paddingVertical: m.chipPadV, paddingHorizontal: m.chipPadH, borderRadius: m.chipRadius },
  // The board's 64 column is the least the label takes, never the most: a fixed width wrapped "Paying for" onto two lines as soon as
  // the text was bigger than the board's, so the label is as wide as its words (one line) and the value gives way.
  chipLabel: { minWidth: m.chipLabelWidth, flexShrink: 0, fontSize: m.chipLabel },
  chipValue: { flex: 1, fontSize: m.chipValue, lineHeight: canvasNormalLineHeight(m.chipValue) },
  tile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: m.tilePad, borderRadius: radius.tile, borderWidth: StyleSheet.hairlineWidth },
  tileWord: { flex: 1, fontSize: m.tileWord, lineHeight: canvasNormalLineHeight(m.tileWord) },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: m.rowMin, borderBottomWidth: StyleSheet.hairlineWidth },
  badge: { width: m.badge, height: m.badge, borderRadius: m.badgeRadius, alignItems: 'center', justifyContent: 'center' },
  badgeWord: { fontSize: m.badgeWord, lineHeight: canvasNormalLineHeight(m.badgeWord) },
  rowWords: { flex: 1 },
  rowTitle: { fontSize: m.rowTitle, lineHeight: canvasNormalLineHeight(m.rowTitle) },
  rowLine: { fontSize: m.rowLine, lineHeight: canvasNormalLineHeight(m.rowLine) },
  recent: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm + 2 },
  networks: { flexDirection: 'row', gap: m.networkGap },
  network: { flex: 1, height: m.networkHeight, borderRadius: m.chipRadius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
  networkWord: { fontSize: m.networkWord, lineHeight: canvasNormalLineHeight(m.networkWord) },
  presets: { flexDirection: 'row', gap: m.presetGap },
  preset: { flex: 1, height: m.presetHeight, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  field: { alignSelf: 'stretch', gap: m.fieldGap },
  fieldLabel: { fontSize: fieldMetrics.label, lineHeight: canvasNormalLineHeight(fieldMetrics.label) },
  fieldBox: { height: fieldMetrics.height, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, borderRadius: fieldMetrics.radius },
  fieldInput: { flex: 1, paddingVertical: 0 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: m.hintGap },
  // minWidth 0 lets the words shrink to the row (a flex item's default is its longest word), and the web breaks a word that is
  // longer than the row; a phone's text already does. Text from the provider is capped at 200 characters by the Hub (D9).
  hintWords: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: m.hintWord,
    lineHeight: canvasNormalLineHeight(m.hintWord),
    ...(Platform.OS === 'web' ? ({ overflowWrap: 'anywhere', wordBreak: 'break-word' } as object) : null),
  },
});
