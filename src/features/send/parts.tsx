import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, VerifiedTick } from '@/components/icon';
import { Text } from '@/components/Text';
import { copyText } from '@/features/open-wallet/copy';
import { searchMetrics } from '@/features/wallet/history/HistoryParts';
import { canvasNormalLineHeight, space, useWawu } from '@/theme';

import { firstName, hueOfPayee, tickKind, type Payee } from './model';

/** W7's circles: the recent row's avatar is 56, with the first name 8 under it (wallet.js W7). */
export const SEND = { recentAvatar: 56, recentGap: 8, recentColumn: 72, recentBetween: 16, rowAvatar: 44, headAvatar: 52, sectionGap: 12 } as const;

/** The text a person typed, once they stop for `ms`: the Hub answers a search that is not one keystroke behind. Default (agent), owner may override. */
export function useSettled(value: string, ms: number): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

type SearchProps = { value: string; maxLength: number; onChange: (text: string) => void; testID?: string };

/** W7's search: W26's pill (`searchMetrics`) with W7's words, "Name, @handle or phone". */
export function RecipientSearch({ value, maxLength, onChange, testID }: SearchProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.search,
        {
          backgroundColor: colors.surfaceCard,
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
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Name, @handle or phone"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Search for someone to send money to"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
      />
      {value.length > 0 ? (
        <Pressable testID={`${testID}-clear`} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={space.md} onPress={() => onChange('')}>
          <Icon name="X" size={searchMetrics.icon - 2} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** One person in W7's Recent row: their avatar and first name. */
export function RecentChip({ payee, onPress }: { payee: Payee; onPress: () => void }) {
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`recent-${payee.wawuUserId}`}
      accessibilityRole="button"
      accessibilityLabel={`Send to ${payee.name}`}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.recent, ring.style]}
    >
      <Avatar name={payee.name} hue={hueOfPayee(payee)} size={SEND.recentAvatar} source={payee.avatarUrl ?? undefined} decorative />
      <Text variant="secondary" tone="textSecondary" numberOfLines={1} style={styles.recentName}>
        {firstName(payee.name)}
      </Text>
    </Pressable>
  );
}

/** The tick after a name, when the person has one: purple for creators, blue for professionals. */
export function PayeeTick({ payee, size = 15 }: { payee: Pick<Payee, 'tick'>; size?: number }) {
  const kind = tickKind(payee.tick);
  return kind ? <VerifiedTick kind={kind} size={size} /> : null;
}

const styles = StyleSheet.create({
  reference: { flexShrink: 1 },
  search: { height: searchMetrics.height, borderRadius: searchMetrics.height / 2, flexDirection: 'row', alignItems: 'center', gap: searchMetrics.between, paddingHorizontal: searchMetrics.padH },
  input: { flex: 1, minWidth: 0, fontSize: searchMetrics.text, lineHeight: canvasNormalLineHeight(searchMetrics.text), padding: 0 },
  // The avatar is the column (W7 spaces avatars 16 apart from the gutter); a name wider than it overflows both sides alike.
  recent: { width: SEND.recentAvatar, alignItems: 'center', gap: SEND.recentGap },
  recentName: { width: SEND.recentColumn, textAlign: 'center' },
});

/** The copy glyph beside a reference is 14, and "Copied" shows for 1.6 seconds. */
const COPY = { icon: 14, ms: 1600 } as const;

/** The reference, with a glyph that copies it ("copied" shows by its check mark for a moment and is said to a screen reader). */
export function Reference({ value }: { value: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    const done = await copyText(value);
    AccessibilityInfo.announceForAccessibility(done ? 'Reference copied' : 'Couldn’t copy the reference');
    if (!done) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPY.ms);
  };
  return (
    <>
      <Text variant="kvValue" numberOfLines={1} ellipsizeMode="middle" selectable style={styles.reference}>
        {value}
      </Text>
      <Pressable
        testID="receipt-copy"
        accessibilityRole="button"
        accessibilityLabel={copied ? 'Copied' : 'Copy reference'}
        hitSlop={space.md}
        onPress={() => void copy()}
        {...ring.handlers}
        style={ring.style}
      >
        <Icon name={copied ? 'Check' : 'Copy'} size={COPY.icon} color={colors.textMuted} />
      </Pressable>
    </>
  );
}

/** W7 and W8's two ways to send, in the board's order and words (R-69: the app's name has its question mark). */
export const SEND_WAYS = [
  { value: 'user', label: 'Who Made This? user' },
  { value: 'bank', label: 'Bank account' },
] as const;

export type SendWay = (typeof SEND_WAYS)[number]['value'];
