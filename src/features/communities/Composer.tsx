import { Image } from 'expo-image';
import { useLayoutEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCredits } from '@/components/Credits';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { pickImage, type PickedImage } from '@/features/profile-edit/pickImage';
import { font, radius, space, text as textStyles, useWawu } from '@/theme';

/**
 * design/_gen/inbox.js line 30, `composer`: 10 above, 16 at the sides, a hairline on top, 10 between the attached card and the row; the
 * row is a 44 "+" circle (a card fill with a 1 line outline, a 21 plus, stroke 2.2), the field and the send button, 8 apart; the field is
 * at least 44 high with a 22 corner, 10 by 16 inside and 15 on a 1.35 line, a 1 line outline that turns into a 1.5 accent ring while typing;
 * the send button is 44 high, a 44 circle with an up arrow (20, stroke 2.4), grey while there is nothing to send and accent once there is, and
 * with a photo that costs credits a 16-across pill "Send · 1" with a 14 coin (stroke 2.2), 6 apart, 14.5 / 700.
 * Line 76, `attachCard`: 8 around a 52 picture (12 corner), 12 between, "Photo" 14 / 600 over a 12.5 muted line 2 under it, and an 18 close X; an
 * 18 corner on a card fill with a 1 line outline.
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
  plus: 21,
  plusStroke: 2.2,
  /** The field grows with what is typed up to this many lines, then scrolls. */
  maxLines: 5,
  cardPad: 8,
  cardCorner: 18,
  cardBetween: 12,
  thumb: 52,
  thumbCorner: 12,
  cardTitle: 14,
  cardLine: 12.5,
  cardLineGap: 2,
  close: 18,
  stack: 10,
} as const;

/** What the "+" needs to know, all of it the Hub's: the price of a photo for this sender and the line under "Photo". */
export type ComposerAttach = {
  /** What a photo costs this sender in WAWU Credits, as the Hub says (0 for the host). Zero or more. */
  photoCost: number;
  /** The line under "Photo": the prices of photos, video and voice notes. Null says nothing (the host pays none). */
  line: string | null;
  /** The sender has no credits and a photo costs some: the "+" opens Buy credits (I28) instead of the photo library. */
  blocked: boolean;
  /** Buy credits. */
  onBuy: () => void;
};

/** A photo the person put back after it was refused, to be changed or sent again. */
export type ComposerDraft = { id: number; text: string; photo?: PickedImage | null };

export type ComposerProps = {
  /** Takes the typed words and the chosen photo; true means they were taken (and the field clears), false that nothing was sent. */
  onSend: (text: string, photo: PickedImage | null) => boolean;
  /** A message is on its way: Send waits, and a second press does nothing. */
  busy?: boolean;
  /** Left out until the Hub's prices are known: no "+" is drawn, because nothing may be said about a price that is not known. */
  attach?: ComposerAttach;
  placeholder?: string;
  /** Words to put in the field (a message the person wants to change). A new `id` puts them there again. */
  draft?: ComposerDraft;
  testID?: string;
};

/**
 * I25's field, I26's Send and I38's photo: type, then press Send; or press "+", choose a photo, and press "Send · 1". Text and emoji are
 * free and say nothing about a price. The price on a photo's button is the Hub's (`creditsByKind`), never one written here.
 */
export function Composer({ onSend, busy, attach, placeholder = 'Message', draft, testID = 'composer' }: ComposerProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const plusRing = useFocusRing();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const [takenDraft, setTakenDraft] = useState(draft?.id);
  // A draft handed down is taken once, during render, so the field shows it at once.
  if (draft && draft.id !== takenDraft) {
    setTakenDraft(draft.id);
    setValue(draft.text);
    setPhoto(draft.photo ?? null);
  }
  const hasWords = value.trim().length > 0;
  const canSend = (hasWords || photo !== null) && !busy;
  const price = photo !== null && attach !== undefined && attach.photoCost > 0 ? Math.floor(attach.photoCost) : 0;

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
    if (onSend(value, photo)) {
      setValue('');
      setPhoto(null);
      setProblem(null);
    }
  };

  const choose = async () => {
    if (!attach || busy) return;
    if (attach.blocked) {
      attach.onBuy();
      return;
    }
    setProblem(null);
    try {
      const picked = await pickImage();
      if (picked) {
        // A second photo takes the first one's place: the app's copy of the first is deleted.
        photo?.discard?.();
        setPhoto(picked);
      }
    } catch {
      setProblem('That photo could not be read. Choose another.');
    }
  };

  const remove = () => {
    photo?.discard?.();
    setPhoto(null);
  };

  return (
    <View
      testID={testID}
      style={[
        styles.bar,
        { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline, paddingBottom: Math.max(insets.bottom, space.lg) },
      ]}
    >
      {photo !== null && attach ? (
        <View
          testID={`${testID}-photo`}
          style={[
            styles.card,
            { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
          ]}
        >
          <Image
            source={{ uri: photo.previewUri }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
            style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}
            testID={`${testID}-photo-image`}
          />
          <View style={styles.cardWords}>
            <Text variant="body" style={[font(600), { fontSize: composerMetrics.cardTitle }]}>
              Photo
            </Text>
            {attach.line ? (
              <Text variant="caption" tone="textMuted" style={[styles.cardLine, { fontSize: composerMetrics.cardLine }]} testID={`${testID}-photo-line`}>
                {attach.line}
              </Text>
            ) : null}
          </View>
          <Pressable
            testID={`${testID}-photo-remove`}
            accessibilityRole="button"
            accessibilityLabel="Remove the photo"
            hitSlop={space.md}
            onPress={remove}
            style={styles.close}
          >
            <Icon name="X" size={composerMetrics.close} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}
      {problem ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID={`${testID}-problem`}>
          {problem}
        </Text>
      ) : null}
      <View style={styles.row}>
        {attach ? (
          <Pressable
            testID={`${testID}-attach`}
            accessibilityRole="button"
            accessibilityLabel="Attach a photo"
            accessibilityState={{ disabled: Boolean(busy) }}
            onPress={() => void choose()}
            {...plusRing.handlers}
            style={[
              styles.plus,
              { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
              plusRing.style,
            ]}
          >
            <Icon name="Plus" size={composerMetrics.plus} color={colors.textPrimary} strokeWidth={composerMetrics.plusStroke} />
          </Pressable>
        ) : null}
        <TextInput
          ref={input}
          testID={`${testID}-input`}
          accessibilityLabel="Message"
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
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
          accessibilityLabel={busy ? 'Sending' : price > 0 ? `Send photo, ${formatCredits(price)}` : photo !== null ? 'Send photo' : 'Send message'}
          accessibilityState={{ disabled: !canSend, busy: Boolean(busy) }}
          disabled={!canSend}
          onPress={press}
          {...ring.handlers}
          style={[
            styles.send,
            (price > 0 || busy) && styles.sendWide,
            { backgroundColor: busy ? colors.accentTintStrong : canSend ? colors.accent : colors.surfaceSunken },
            ring.style,
          ]}
        >
          {busy ? (
            <Text variant="body" tone="accentFg" style={[font(700), { fontSize: composerMetrics.sendFont }]}>
              Sending
            </Text>
          ) : price > 0 ? (
            <>
              <Text variant="body" tone="textOnAccent" style={[font(700), { fontSize: composerMetrics.sendFont }]}>
                {`Send · ${price}`}
              </Text>
              <Icon name="Coins" size={composerMetrics.coin} color={colors.textOnAccent} strokeWidth={composerMetrics.coinStroke} />
            </>
          ) : (
            <Icon name="ArrowUp" size={composerMetrics.arrow} color={canSend ? colors.textOnAccent : colors.textDisabled} strokeWidth={composerMetrics.arrowStroke} />
          )}
        </Pressable>
      </View>
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
    gap: composerMetrics.stack,
    paddingTop: composerMetrics.padTop,
    paddingHorizontal: composerMetrics.padH,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerMetrics.between,
  },
  plus: {
    width: composerMetrics.send,
    height: composerMetrics.send,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: composerMetrics.cardBetween,
    padding: composerMetrics.cardPad,
    borderRadius: composerMetrics.cardCorner,
  },
  thumb: { width: composerMetrics.thumb, height: composerMetrics.thumb, borderRadius: composerMetrics.thumbCorner },
  cardWords: { flex: 1, minWidth: 0 },
  cardLine: { marginTop: composerMetrics.cardLineGap },
  close: { paddingHorizontal: space.sm },
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
