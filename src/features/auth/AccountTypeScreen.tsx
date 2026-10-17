import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import type { IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { APP_NAME_COPY } from '@/lib/appName';
import { font, radius, useWawu } from '@/theme';

import { useAccountType, type AccountType } from './accountType';
import { AuthFrame } from './AuthFrame';

/** design/_gen/auth.js line 10: the title is `h1` at 26 px (tracking -0.03em, line 1.15), the body starts 10 px down (`body(..., { pt: 10 })`, which replaces the kit's default 8, kit.js line 35, that AuthFrame pads with), 20 above the cards. */
const TITLE = { size: 26, tracking: -0.03, leading: 1.15, top: 10, below: 20 } as const;
/** design/_gen/auth.js line 9, `choice`: 14 between icon and words, 16 padding, a 48 px icon, a 22 px radio, the words 16 bold and 13 secondary (line 1.4, 3 under the title). */
const CHOICE = { iconToWords: 14, pad: 16, icon: 48, radio: 22, title: 16, line: 13, lineHeight: 1.4, lineTop: 3 } as const;
/** design/_gen/auth.js line 10: the two cards sit 10 apart. */
const CARDS_GAP = 10;
/** design/_gen/kit.js line 60, `radio`: a 6.5 px accent ring when picked, a 1.5 px strong edge when not. */
const RADIO_RING = { on: 6.5, off: 1.5 } as const;
/** design/_gen/auth.js line 9, `choice`: the picked card's edge is 1.5 px accent; the other's is a 1 px hairline, both drawn inside. */
const EDGE = { on: 1.5, off: 1 } as const;

type Choice = { type: AccountType; icon: IconName; title: string; line: string };

/** Copy from A2. "Free." after the earn line is left out: nothing in the system backs it (BACKEND_GAPS G-34). */
const CHOICES: readonly Choice[] = [
  { type: 'discover', icon: 'Compass', title: "I'm here to discover", line: 'Follow creators, buy their work, use the wallet.' },
  { type: 'earn', icon: 'Sparkles', title: 'I want to earn', line: 'Sell content, take paid questions, host events.' },
];

type KeyEvent = { nativeEvent: { key: string }; preventDefault: () => void };

/**
 * Space and Enter pick a focused card, as they pick a radio button in a browser.
 * react-native-web's Pressable presses on Enter for any element but on Space only for
 * a `<button>` element or role `button` (`modules/usePressEvents/PressResponder.js`,
 * `isValidKeyPress`), so a radio needs its own handler. Picking is idempotent, so Enter firing both is harmless.
 * The prop exists on the web only (react-native-web's Pressable passes `onKeyDown` on),
 * which is why it is spread rather than typed on the Pressable.
 */
export function pickByKey(pick: () => void): object {
  return {
    onKeyDown: (event: KeyEvent) => {
      const key = event.nativeEvent.key;
      if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
        event.preventDefault();
        pick();
      }
    },
  };
}

function ChoiceCard({ choice, picked, onPress }: { choice: Choice; picked: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const edge = picked ? EDGE.on : EDGE.off;
  return (
    <Pressable
      testID={`account-type-${choice.type}`}
      accessibilityRole="radio"
      accessibilityLabel={`${choice.title}. ${choice.line}`}
      accessibilityState={{ checked: picked }}
      aria-checked={picked}
      onPress={onPress}
      {...pickByKey(onPress)}
      {...ring.handlers}
      style={[
        styles.card,
        {
          backgroundColor: picked ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: edge, color: picked ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <IconTile icon={choice.icon} tone={picked ? 'accent' : 'neutral'} size={CHOICE.icon} />
      <View style={styles.words}>
        <Text variant="body" style={[font(700), { fontSize: CHOICE.title }]}>
          {choice.title}
        </Text>
        <Text
          variant="secondary"
          style={{ fontSize: CHOICE.line, lineHeight: CHOICE.line * CHOICE.lineHeight, marginTop: CHOICE.lineTop }}
        >
          {choice.line}
        </Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.radio,
          picked
            ? { borderWidth: RADIO_RING.on, borderColor: colors.accent }
            : { borderWidth: RADIO_RING.off, borderColor: colors.borderStrong },
        ]}
      />
    </Pressable>
  );
}

export type AccountTypeScreenProps = {
  onBack?: () => void;
  /**
   * Where Continue goes once the pick is made. The sign-up screens (AUTH-04) pass
   * it; without it the button is not drawn, because it would lead nowhere.
   */
  onContinue?: (type: AccountType) => void;
  /** What is picked when the screen opens (a preview, never the app). */
  initialPick?: AccountType;
};

/**
 * A2: "What brings you to Who Made This?" One of two cards is picked, discover
 * or earn. The pick is kept for the sign-up screens that follow (`useAccountType`).
 * Nothing is picked at first, so Continue (when it is drawn) waits for a pick.
 */
export function AccountTypeScreen({ onBack, onContinue, initialPick }: AccountTypeScreenProps) {
  const [stored, pick] = useAccountType();
  const picked = stored ?? initialPick ?? null;
  return (
    <AuthFrame
      testID="account-type"
      onBack={onBack}
      contentTop={TITLE.top}
      footer={
        onContinue ? (
          <Button label="Continue" full disabled={!picked} onPress={() => picked && onContinue(picked)} testID="account-type-continue" />
        ) : undefined
      }
    >
      <View style={styles.body}>
        <Text
          variant="h1"
          style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size }}
        >
          {`What brings you to ${APP_NAME_COPY}`}
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="What brings you here" style={styles.cards}>
          {CHOICES.map((choice) => (
            <ChoiceCard key={choice.type} choice={choice} picked={picked === choice.type} onPress={() => pick(choice.type)} />
          ))}
        </View>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: TITLE.below },
  cards: { gap: CARDS_GAP },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: CHOICE.iconToWords, padding: CHOICE.pad, borderRadius: radius.card },
  words: { flex: 1 },
  radio: { width: CHOICE.radio, height: CHOICE.radio, borderRadius: CHOICE.radio / 2, flexShrink: 0 },
});
