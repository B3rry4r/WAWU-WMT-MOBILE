import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, VerifiedTick } from '@/components/icon';
import { Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { GroupTile, tileMetrics } from '@/features/communities/GroupTile';
import { tickOf } from '@/features/explore/CreatorCard';
import { useInterestLabel } from '@/features/explore/interestLabel';
import { hueFor, rowPicture } from '@/features/feed/model';
import { kindIcon } from '@/features/me/model';
import { useShownPrice } from '@/features/store/ladder/usePrice';
import { font, layout, radius, space, useWawu } from '@/theme';

import type { SearchCommunity, SearchPerson } from './api';
import { communityLine, TAB_LABELS, TAB_ORDER, type ContentRowModel, type Counts, type SearchTab } from './model';

/**
 * design/_gen/explore.js `srch` (with `input`) inside `sHead`: a 44 high pill on the input colour, a 1 hairline ring (the
 * accent's 1.5 while it has focus), an 18 glyph, 10 to the words, 16 at the sides, the words 15 with the placeholder muted, and a
 * 17 round clear mark at the end once there is text. `sHead` pads 6 above, 20 at the sides and 12 below, 12 between the pill and Cancel,
 * and Cancel is 14.5 semi-bold in the accent.
 */
export const searchMetrics = { height: 44, iconGap: 10, padH: 16, icon: 18, text: 15, ring: 1, focusRing: 1.5, clear: 17, top: 6, bottom: 12, between: 12, cancel: 14.5 } as const;

/** design/_gen/explore.js `recentChip` and `trendChip`: 34 high, 14 at the sides, a 13 glyph 6 before the 13.5 medium words. */
export const chipMetrics = { height: 34, padH: 14, icon: 13, iconGap: 6, text: 13.5, between: 8 } as const;

/** design/_gen/explore.js `secLab`, `pRow`, `cRes`, `comRow`, `sTabs`. */
export const rowMetrics = {
  rowPadV: 10,
  /** The gap between the All tab's sections (`resAll`'s body gap). */
  sections: 18,
  between: 12,
  lineTop: 2,
  bylineTop: 3,
  avatar: 48,
  name: 15,
  tick: 14,
  line: 13,
  thumb: 64,
  thumbCorner: 14,
  /** The kind's mark on a row whose file is not a picture (the other lists draw theirs at 24 to 28). */
  mark: 26,
  lock: 16,
  /** The lock on a row with no picture: small, in the corner, apart from the kind's mark. */
  lockCorner: 13,
  lockInset: 6,
  /** The black over a locked picture, as `cRes` draws it: 25%. */
  price: 14.5,
  room: 52,
  roomLock: 13,
  tabsGap: 22,
  tab: 15,
  tabPadBottom: 11,
  tabLine: 2,
  action: 12.5,
} as const;

export type SearchFieldProps = {
  value: string;
  onChange: (text: string) => void;
  /** The keyboard's search key, with the text as the keyboard holds it. */
  onSubmit: (text: string) => void;
  onClear: () => void;
  placeholder: string;
  maxLength: number;
  autoFocus?: boolean;
  testID?: string;
};

export function SearchField({ value, onChange, onSubmit, onClear, placeholder, maxLength, autoFocus, testID }: SearchFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.field,
        {
          backgroundColor: colors.surfaceInput,
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 0,
              blurRadius: 0,
              spreadDistance: focused ? searchMetrics.focusRing : searchMetrics.ring,
              color: focused ? colors.accent : colors.borderHairline,
              inset: true,
            },
          ],
        },
      ]}
    >
      <Icon name="Search" size={searchMetrics.icon} color={colors.textMuted} />
      <TextInput
        testID={testID}
        value={value}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onChangeText={onChange}
        onSubmitEditing={(e) => onSubmit(e.nativeEvent.text ?? value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
      />
      {value !== '' ? (
        <Pressable testID={testID ? `${testID}-clear` : undefined} accessibilityRole="button" accessibilityLabel="Clear search text" hitSlop={space.md} onPress={onClear}>
          <Icon name="CircleX" size={searchMetrics.clear} color={colors.textMuted} strokeWidth={1.8} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** One past or popular search as a chip. Tapping it searches that text. */
export function QueryChip({ label, kind, onPress, testID }: { label: string; kind: 'recent' | 'popular'; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <Icon name={kind === 'recent' ? 'Clock' : 'TrendingUp'} size={chipMetrics.icon} color={kind === 'recent' ? colors.textMuted : colors.accentFg} />
      <NativeText numberOfLines={1} style={[font(500), { fontSize: chipMetrics.text, color: colors.textSecondary }]}>
        {label}
      </NativeText>
    </Pressable>
  );
}

/** `secLab`: the section's small capitals, and an action in the accent at the end. */
export function SectionLabel({ title, action, testID }: { title: string; action?: { label: string; onPress: () => void; testID?: string }; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View style={styles.sectionLabel} testID={testID}>
      <Text variant="label" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {action ? (
        <Pressable testID={action.testID} accessibilityRole="button" accessibilityLabel={`${action.label}, ${title}`} hitSlop={space.md} onPress={action.onPress}>
          <NativeText style={[font(600), { fontSize: rowMetrics.action, color: colors.accentFg }]}>{action.label}</NativeText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** `sTabs`: All, Content, Creators and Communities with their counts, the one on screen underlined, a hairline under the row. */
export function ResultTabs({ value, counts, onChange }: { value: SearchTab; counts: Counts; onChange: (tab: SearchTab) => void }) {
  const { colors } = useWawu();
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: colors.borderHairline }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TAB_ORDER.map((tab) => {
          const on = tab === value;
          return (
            <Pressable
              key={tab}
              testID={`search-tab-${tab}`}
              accessibilityRole="tab"
              accessibilityLabel={`${TAB_LABELS[tab]} ${counts[tab]}`}
              accessibilityState={{ selected: on }}
              onPress={() => onChange(tab)}
              style={[styles.tab, { borderBottomColor: on ? colors.accent : 'transparent' }]}
            >
              <NativeText style={[font(600), { fontSize: rowMetrics.tab, color: on ? colors.textPrimary : colors.textMuted }]}>
                {TAB_LABELS[tab]} <NativeText style={[font(500), { opacity: 0.6 }]}>{counts[tab]}</NativeText>
              </NativeText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** `pRow`: a person with their picture, name and tick, what they do, and Follow (Following when they are followed). The row opens their profile (M5, ME-02) when `onPress` is given. */
export function PersonRow({ person, onToggleFollow, onPress, testID }: { person: SearchPerson; onToggleFollow?: () => void; onPress?: () => void; testID?: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const tick = tickOf(person);
  const labelOf = useInterestLabel();
  const line = labelOf(person.field);
  const label = [person.name, line].filter(Boolean).join(', ');
  const who = (
    <>
      <Avatar name={person.name} hue={hueFor(person.wawuId)} size={rowMetrics.avatar} source={person.avatarUrl ?? undefined} decorative />
      <View style={styles.words}>
        <View style={styles.nameLine}>
          <NativeText numberOfLines={1} style={[font(600), styles.name, { color: colors.textPrimary }]}>
            {person.name}
          </NativeText>
          {tick ? <VerifiedTick kind={tick} size={rowMetrics.tick} /> : null}
        </View>
        {line ? (
          <NativeText numberOfLines={1} style={[font(400), styles.line, { color: colors.textMuted }]}>
            {line}
          </NativeText>
        ) : null}
      </View>
    </>
  );
  const follow = onToggleFollow ? (
    <Button
      label={person.following ? 'Following' : 'Follow'}
      variant={person.following ? 'secondary' : 'primary'}
      size="sm"
      onPress={onToggleFollow}
      testID={testID ? `${testID}-follow` : undefined}
    />
  ) : null;
  if (onPress) {
    return (
      <View testID={testID} style={styles.row}>
        <Pressable testID={testID ? `${testID}-open` : undefined} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.who, ring.style]}>
          {who}
        </Pressable>
        {follow}
      </View>
    );
  }
  return (
    <View testID={testID} accessible accessibilityLabel={label} style={styles.row}>
      {who}
      {follow}
    </View>
  );
}

/** `cRes`: a 64 picture (blurred, with a lock, when it is paid and not bought), the title, who made it and what kind, and the price or Free. */
export function ContentRow({ row, testID, onPress }: { row: ContentRowModel; testID?: string; /** Opens the piece's own page (H19, HOME-03). Left out, the row only reads. */ onPress?: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  // R-101 point 10: on a phone with a store a paid piece shows the store's price, and none where no rung sells it.
  const shown = useShownPrice();
  const shownKobo = row.priceKobo === null ? null : shown.forKobo(row.priceKobo);
  const label = `${row.title}, ${row.byline}, ${row.priceKobo === null ? 'free' : 'paid'}`;
  // The Hub gives the piece's public file, a clip, a sound or a PDF for most kinds: only a picture is drawn as one, and a picture that
  // will not load gives way to the kind's mark, so the square is never empty.
  const [broken, setBroken] = useState(false);
  const picture = broken ? null : rowPicture(row.kind, row.thumb);
  const inner = (
    <>
      <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
        {picture ? (
          <Image testID="search-thumb-image" source={{ uri: picture }} contentFit="cover" blurRadius={row.locked ? 6 : 0} onError={() => setBroken(true)} style={StyleSheet.absoluteFill} />
        ) : (
          <View testID="search-thumb-mark" style={[StyleSheet.absoluteFill, styles.mark]}>
            <Icon name={kindIcon(row.kind ?? 'image')} size={rowMetrics.mark} color={colors.textMuted} />
          </View>
        )}
        {row.locked && picture ? (
          // The board's lock: centred over the blurred picture.
          <View testID="search-thumb-lock" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.veil, { backgroundColor: colors.mediaBlack25 }]}>
            <Icon name="Lock" size={rowMetrics.lock} color={colors.textOnAccent} />
          </View>
        ) : null}
        {row.locked && !picture ? (
          // Over a kind mark the lock would read as one muddled glyph: it sits in the corner, as the grid's tiles carry theirs.
          <View testID="search-thumb-lock" pointerEvents="none" style={styles.lockCorner}>
            <Icon name="Lock" size={rowMetrics.lockCorner} color={colors.textMuted} />
          </View>
        ) : null}
      </View>
      <View style={styles.words}>
        <NativeText numberOfLines={1} style={[font(600), styles.name, { color: colors.textPrimary }]}>
          {row.title}
        </NativeText>
        <NativeText numberOfLines={1} style={[font(400), styles.line, styles.byline, { color: colors.textMuted }]}>
          {row.byline}
        </NativeText>
      </View>
      {row.priceKobo === null ? (
        <NativeText style={[font(600), { fontSize: styles.line.fontSize, color: colors.positive }]}>Free</NativeText>
      ) : shownKobo === null ? null : (
        <Money minorUnits={shownKobo} decimals={false} size={rowMetrics.price} weight={700} />
      )}
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} accessible accessibilityLabel={label} style={styles.row}>
        {inner}
      </View>
    );
  }
  return (
    <Pressable testID={testID} accessible accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.row, ring.style]}>
      {inner}
    </Pressable>
  );
}

export type RoomAction = 'join' | 'ask' | 'asked';

/** `comRow`: a community's picture, name (with a lock when private), its members and kind, and Join or Ask (Requested once asked). */
export function RoomRow({ room, state, busy, onPress, testID }: { room: SearchCommunity; state: RoomAction; busy: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useWawu();
  const label = state === 'asked' ? 'Requested' : state === 'ask' ? 'Ask' : 'Join';
  return (
    <View testID={testID} accessible accessibilityLabel={`${room.name}, ${communityLine(room)}`} style={styles.row}>
      <GroupTile uri={room.imageUrl} size={tileMetrics.row} />
      <View style={styles.words}>
        <View style={styles.nameLine}>
          <NativeText numberOfLines={1} style={[font(600), styles.name, { color: colors.textPrimary }]}>
            {room.name}
          </NativeText>
          {room.kind === 'private' ? <Icon name="Lock" size={rowMetrics.roomLock} color={colors.textMuted} strokeWidth={2.2} /> : null}
        </View>
        <NativeText numberOfLines={1} style={[font(400), styles.line, { color: colors.textMuted }]}>
          {communityLine(room)}
        </NativeText>
      </View>
      <Button
        label={label}
        variant="secondary"
        size="sm"
        disabled={state === 'asked'}
        loading={busy}
        onPress={onPress}
        testID={testID ? `${testID}-${state === 'join' ? 'join' : 'ask'}` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, height: searchMetrics.height, flexDirection: 'row', alignItems: 'center', gap: searchMetrics.iconGap, paddingHorizontal: searchMetrics.padH, borderRadius: radius.chip },
  input: { flex: 1, minWidth: 0, fontSize: searchMetrics.text, paddingVertical: 0, ...font(400) },
  chip: { height: chipMetrics.height, paddingHorizontal: chipMetrics.padH, borderRadius: radius.chip, flexDirection: 'row', alignItems: 'center', gap: chipMetrics.iconGap },
  sectionLabel: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { flex: 1 },
  tabs: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsRow: { flexDirection: 'row', gap: rowMetrics.tabsGap, paddingHorizontal: layout.gutter },
  tab: { paddingBottom: rowMetrics.tabPadBottom, borderBottomWidth: rowMetrics.tabLine, marginBottom: -StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between, paddingVertical: rowMetrics.rowPadV },
  who: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: rowMetrics.between },
  words: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minWidth: 0 },
  name: { fontSize: rowMetrics.name, flexShrink: 1 },
  line: { fontSize: rowMetrics.line, marginTop: rowMetrics.lineTop },
  byline: { marginTop: rowMetrics.bylineTop },
  thumb: { width: rowMetrics.thumb, height: rowMetrics.thumb, borderRadius: rowMetrics.thumbCorner, overflow: 'hidden' },
  veil: { alignItems: 'center', justifyContent: 'center' },
  mark: { alignItems: 'center', justifyContent: 'center' },
  lockCorner: { position: 'absolute', top: rowMetrics.lockInset, right: rowMetrics.lockInset },
});
