import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { font, radius, space, useWawu } from '@/theme';

import { Avatar, type AvatarHue } from './Avatar';
import { useFocusRing } from './focusRing';
import { Icon, VerifiedTick } from './icon';
import { rowMetrics } from './ListRow';
import { Text } from './Text';

/** Sizes of the inbox row from the board kit (design/_gen/inbox.js line 10, `conv`; DECISIONS R-22). */
const conversationMetrics = {
  avatar: 52,
  padV: 13,
  name: 16,
  preview: 14,
  time: 12.5,
  previewGap: 6,
  lineGap: 4,
  badge: 21,
  badgeFont: 11.5,
  badgePadH: 6,
  moneyDot: 20,
  moneyGlyph: 13,
  moneyStroke: 2.6,
  /** The clock, tick and refund glyphs: 15 wide, stroke 2.2. */
  glyph: 15,
  glyphStroke: 2.2,
  /** The request glyph (HandCoins) is 16 at the default stroke. */
  requestGlyph: 16,
  tick: 14,
} as const;

/** What the last message was, drawn as a glyph before its words. */
export type ConversationKind = 'money' | 'dm' | 'req' | 'refund' | 'done';

const maxCount = 99;
export type TickKind = 'creator' | 'pro';
const tickWords: Record<TickKind, string> = { creator: 'verified creator', pro: 'verified professional' };

export type ConversationRowProps = {
  name: string;
  preview: string;
  /** "10:24", "Yest.", "Mon". */
  time: string;
  kind?: ConversationKind;
  /** Unread messages. Zero draws no badge and the quieter colours. */
  unread?: number;
  /** A verified badge after the name: a creator's (purple) or a professional's (blue). */
  tick?: TickKind;
  hue?: AvatarHue;
  /** A photo, a group picture or the WAWU mark, in place of the initials. */
  lead?: ReactNode;
  onPress?: () => void;
  testID?: string;
};

function Glyph({ kind }: { kind: ConversationKind }) {
  const { colors } = useWawu();
  if (kind === 'money') {
    return (
      <View style={[styles.moneyDot, { backgroundColor: colors.positiveTint }]}>
        <Icon name="ArrowDownLeft" size={conversationMetrics.moneyGlyph} color={colors.positive} strokeWidth={conversationMetrics.moneyStroke} />
      </View>
    );
  }
  const { glyph, glyphStroke } = conversationMetrics;
  if (kind === 'dm') return <Icon name="Clock" size={glyph} color={colors.warning} strokeWidth={glyphStroke} />;
  if (kind === 'req') return <Icon name="HandCoins" size={conversationMetrics.requestGlyph} color={colors.textSecondary} />;
  if (kind === 'refund') return <Icon name="RotateCcw" size={glyph} color={colors.positive} strokeWidth={glyphStroke} />;
  return <Icon name="CircleCheck" size={glyph} color={colors.positive} strokeWidth={glyphStroke} />;
}

/** One conversation in the inbox: who, the last message, when, and how many are unread. */
export function ConversationRow({ name, preview, time, kind, unread = 0, tick, hue, lead, onPress, testID }: ConversationRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const isUnread = unread > 0;
  const label = [name, tick ? tickWords[tick] : null, preview, time, isUnread ? `${unread} unread` : null].filter(Boolean).join(', ');
  const body = (
    <>
      {lead ?? <Avatar name={name} hue={hue} size={conversationMetrics.avatar} decorative />}
      <View style={styles.words}>
        <View style={styles.line}>
          <View style={styles.nameLine}>
            <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: conversationMetrics.name }, styles.name]}>
              {name}
            </Text>
            {tick ? <VerifiedTick kind={tick} size={conversationMetrics.tick} /> : null}
          </View>
          <Text
            variant="caption"
            tone={isUnread ? 'accentFg' : 'textMuted'}
            style={[font(isUnread ? 700 : 400), { fontSize: conversationMetrics.time }]}
          >
            {time}
          </Text>
        </View>
        <View style={[styles.line, styles.previewLine]}>
          <View style={styles.preview}>
            {kind ? <Glyph kind={kind} /> : null}
            <Text
              variant="body"
              tone={isUnread ? 'textPrimary' : 'textSecondary'}
              numberOfLines={1}
              style={[{ fontSize: conversationMetrics.preview }, styles.previewText]}
            >
              {preview}
            </Text>
          </View>
          {isUnread ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text variant="caption" tone="textOnAccent" style={[font(700), { fontSize: conversationMetrics.badgeFont }]}>
                {unread > maxCount ? `${maxCount}+` : String(unread)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.borderHairline }]} />
    </>
  );
  const frame = [styles.row];
  return onPress ? (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[...frame, ring.style]}>
      {body}
    </Pressable>
  ) : (
    <View testID={testID} accessible accessibilityLabel={label} style={frame}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rowMetrics.between,
    paddingVertical: conversationMetrics.padV,
  },
  divider: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  words: { flex: 1, minWidth: 0 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  previewLine: { alignItems: 'center', marginTop: conversationMetrics.lineGap },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexShrink: 1 },
  name: { flexShrink: 1 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: conversationMetrics.previewGap, flex: 1, minWidth: 0 },
  previewText: { flexShrink: 1 },
  moneyDot: {
    width: conversationMetrics.moneyDot,
    height: conversationMetrics.moneyDot,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: conversationMetrics.badge,
    height: conversationMetrics.badge,
    paddingHorizontal: conversationMetrics.badgePadH,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
