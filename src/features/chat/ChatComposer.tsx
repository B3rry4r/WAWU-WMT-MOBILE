import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { font, radius, space, text as textStyles, useWawu } from '@/theme';
import { Text } from '@/components/Text';

/**
 * design/_gen/inbox.js line 53, `composer`: 10 above, 16 at the sides, a hairline on top; a 44 round + button, the field at least 44 high
 * with a 22 corner, 10 by 16 inside, 15 on a 1.35 line, a 1 line outline that turns into a 1.5 accent ring while typing, and a 44 round
 * send button with an up arrow (20, stroke 2.4), the accent once there are words.
 */
const composerMetrics = {
  padTop: 10,
  padH: 16,
  between: 8,
  field: 44,
  fieldCorner: 22,
  fieldPadV: 10,
  fieldPadH: 16,
  fieldFont: 15,
  fieldLine: 1.35,
  ringIdle: 1,
  ringFocus: 1.5,
  round: 44,
  plus: 21,
  plusStroke: 2.2,
  arrow: 20,
  arrowStroke: 2.4,
  maxLines: 5,
} as const;

export type ChatComposerProps = {
  /** Takes the typed words; true means they were taken (and the field clears), false that nothing was sent. */
  onSend: (text: string) => boolean;
  /** A message is on its way: Send waits. */
  busy?: boolean;
  /** The + button opens "Add to chat" (I13). */
  onPlus: () => void;
  testID?: string;
};

/** I12's composer: +, a field, and Send. */
export function ChatComposer({ onSend, busy, onPlus, testID = 'chat-composer' }: ChatComposerProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const hasWords = value.trim().length > 0;
  const canSend = hasWords && !busy;
  const press = () => {
    if (!canSend) return;
    if (onSend(value)) setValue('');
  };
  return (
    <View
      testID={testID}
      style={[styles.bar, { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline, paddingBottom: Math.max(insets.bottom, space.lg) }]}
    >
      <Pressable
        testID="chat-plus"
        accessibilityRole="button"
        accessibilityLabel="Add to chat"
        onPress={onPlus}
        {...ring.handlers}
        style={[
          styles.round,
          { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: composerMetrics.ringIdle, color: colors.borderHairline, inset: true }] },
          ring.style,
        ]}
      >
        <Icon name="Plus" size={composerMetrics.plus} color={colors.textPrimary} strokeWidth={composerMetrics.plusStroke} />
      </Pressable>
      <TextInput
        ref={input}
        testID={`${testID}-input`}
        accessibilityLabel="Message"
        value={value}
        onChangeText={setValue}
        placeholder="Message"
        placeholderTextColor={colors.textMuted}
        multiline
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.field,
          Platform.OS === 'web' ? browserOutlineOff : null,
          textStyles.body,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surfaceInput,
            boxShadow: [
              { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: focused ? composerMetrics.ringFocus : composerMetrics.ringIdle, color: focused ? colors.accent : colors.borderHairline, inset: true },
            ],
          },
        ]}
      />
      <Pressable
        testID={`${testID}-send`}
        accessibilityRole="button"
        accessibilityLabel={busy ? 'Sending' : 'Send message'}
        accessibilityState={{ disabled: !canSend, busy: Boolean(busy) }}
        disabled={!canSend}
        onPress={press}
        style={[styles.round, { backgroundColor: hasWords ? (busy ? colors.accentTintStrong : colors.accent) : colors.surfaceSunken }]}
      >
        <Icon name="ArrowUp" size={composerMetrics.arrow} color={hasWords ? colors.textOnAccent : colors.textDisabled} strokeWidth={composerMetrics.arrowStroke} />
      </Pressable>
    </View>
  );
}

/** A chat where nobody can write any more (a block, a person who went): the Hub's `canMessage` is false. */
export function ChatClosedBar() {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="chat-closed"
      style={[styles.closed, { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline, paddingBottom: Math.max(insets.bottom, space.lg) }]}
    >
      <Text variant="secondary" tone="textMuted" style={[font(600), styles.closedText]}>
        Messages are off in this chat.
      </Text>
    </View>
  );
}

const lineHeight = composerMetrics.fieldFont * composerMetrics.fieldLine;
const maxField = composerMetrics.fieldPadV * 2 + lineHeight * composerMetrics.maxLines;

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: composerMetrics.between, paddingTop: composerMetrics.padTop, paddingHorizontal: composerMetrics.padH, borderTopWidth: StyleSheet.hairlineWidth },
  round: { width: composerMetrics.round, height: composerMetrics.round, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  field: {
    flex: 1,
    minHeight: composerMetrics.field,
    maxHeight: maxField,
    borderRadius: composerMetrics.fieldCorner,
    paddingVertical: composerMetrics.fieldPadV,
    paddingHorizontal: composerMetrics.fieldPadH,
    fontSize: composerMetrics.fieldFont,
    lineHeight,
  },
  closed: { paddingTop: composerMetrics.padTop, paddingHorizontal: composerMetrics.padH, borderTopWidth: StyleSheet.hairlineWidth },
  closedText: { textAlign: 'center' },
});
