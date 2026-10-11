import { useLayoutEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCredits } from '@/components/Credits';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, space, text as textStyles, useWawu } from '@/theme';

/**
 * design/_gen/inbox.js line 30, `composer`: 10 above, 16 at the sides, a hairline on top; the field is at least 44
 * high with a 22 corner, 10 by 16 inside and 15 on a 1.35 line, a 1 line outline that turns into a 1.5 accent ring
 * while typing; the send button is 44 high, a 44 circle with an up arrow (20, stroke 2.4) when empty, and a 16-across
 * pill "Send" with a 14 coin (stroke 2.2) once there are words, 6 apart, 14.5 / 700.
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
  send: 44,
  sendPadH: 16,
  sendGap: 6,
  sendFont: 14.5,
  arrow: 20,
  arrowStroke: 2.4,
  coin: 14,
  coinStroke: 2.2,
  /** The field grows with what is typed up to this many lines, then scrolls. */
  maxLines: 5,
} as const;

export type ComposerProps = {
  /** Takes the typed words; true means they were taken (and the field clears), false that nothing was sent. */
  onSend: (text: string) => boolean;
  /** A message is on its way: Send waits, and a second press does nothing. */
  busy?: boolean;
  /**
   * What one message costs the sender, in WAWU Credits, as the server says (`messageCostInCredits` of `GET /communities/:id/room`:
   * the price for a member, 0 for the host). The field then reads "Message · 1 credit" and the button "Send · 1". With no figure,
   * or 0, they read "Message" and "Send": nothing is stated that the server did not say.
   */
  cost?: number;
  placeholder?: string;
  /** Words to put in the field (a message the person wants to change). A new `id` puts them there again. */
  draft?: { id: number; text: string };
  testID?: string;
};

/** I25's field and I26's Send: type, then press Send. The price on the field and the button is the server's (G-450). */
export function Composer({ onSend, busy, cost, placeholder = 'Message', draft, testID = 'composer' }: ComposerProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const [takenDraft, setTakenDraft] = useState(draft?.id);
  // A draft handed down is taken once, during render, so the field shows it at once.
  if (draft && draft.id !== takenDraft) {
    setTakenDraft(draft.id);
    setValue(draft.text);
  }
  const hasWords = value.trim().length > 0;
  const canSend = hasWords && !busy;
  const price = cost !== undefined && cost > 0 ? Math.floor(cost) : 0;

  // In a browser the field is a textarea that does not grow: it takes the height of its text, up to `maxLines`.
  useLayoutEffect(() => {
    if (!IS_WEB) return;
    const node = input.current as unknown as { style: { height: string }; scrollHeight: number } | null;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(maxField, Math.max(composerMetrics.field, node.scrollHeight))}px`;
  }, [value]);

  const press = () => {
    if (!canSend) return;
    if (onSend(value)) setValue('');
  };

  return (
    <View
      testID={testID}
      style={[
        styles.bar,
        { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline, paddingBottom: Math.max(insets.bottom, space.lg) },
      ]}
    >
      <TextInput
        ref={input}
        testID={`${testID}-input`}
        accessibilityLabel="Message"
        value={value}
        onChangeText={setValue}
        placeholder={price > 0 ? `${placeholder} · ${formatCredits(price)}` : placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={IS_WEB ? 1 : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.field,
          browserOutlineOff,
          textStyles.body,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surfaceInput,
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 0,
                blurRadius: 0,
                spreadDistance: focused ? composerMetrics.ringFocus : composerMetrics.ringIdle,
                color: focused ? colors.accent : colors.borderHairline,
                inset: true,
              },
            ],
          },
        ]}
      />
      <Pressable
        testID={`${testID}-send`}
        accessibilityRole="button"
        accessibilityLabel={busy ? 'Sending' : price > 0 ? `Send message, ${formatCredits(price)}` : 'Send message'}
        accessibilityState={{ disabled: !canSend, busy: Boolean(busy) }}
        disabled={!canSend}
        onPress={press}
        {...ring.handlers}
        style={[
          styles.send,
          hasWords && styles.sendWide,
          { backgroundColor: hasWords ? (busy ? colors.accentTintStrong : colors.accent) : colors.surfaceSunken },
          ring.style,
        ]}
      >
        {hasWords ? (
          <>
            <Text variant="body" tone={busy ? 'accentFg' : 'textOnAccent'} style={[font(700), { fontSize: composerMetrics.sendFont }]}>
              {busy ? 'Sending' : price > 0 ? `Send · ${price}` : 'Send'}
            </Text>
            <Icon name="Coins" size={composerMetrics.coin} color={busy ? colors.accentFg : colors.textOnAccent} strokeWidth={composerMetrics.coinStroke} />
          </>
        ) : (
          <Icon name="ArrowUp" size={composerMetrics.arrow} color={colors.textDisabled} strokeWidth={composerMetrics.arrowStroke} />
        )}
      </Pressable>
    </View>
  );
}

/**
 * A phone's multiline field grows with what is typed. A browser's does not, and draws two lines at first: there the field starts
 * at one row and takes the height of its text (up to the same number of lines).
 */
const IS_WEB = Platform.OS === 'web';

const lineHeight = composerMetrics.fieldFont * composerMetrics.fieldLine;
const maxField = composerMetrics.fieldPadV * 2 + lineHeight * composerMetrics.maxLines;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerMetrics.between,
    paddingTop: composerMetrics.padTop,
    paddingHorizontal: composerMetrics.padH,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
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
  send: {
    height: composerMetrics.send,
    minWidth: composerMetrics.send,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: composerMetrics.sendGap,
  },
  sendWide: { paddingHorizontal: composerMetrics.sendPadH },
});

