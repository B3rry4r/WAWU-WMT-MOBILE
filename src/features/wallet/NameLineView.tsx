import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, type, useWawu, type ColorToken } from '@/theme';

import type { NameLine } from './payoutForm';

/**
 * kit.js `field` hint in the `ok` state (A21): 12.5 px, 600, with a 15 px
 * CircleCheck at stroke 2.2 and 6 between them, no line height of its own.
 */
const lineMetrics = { icon: 15, stroke: 2.2, iconGap: 6, weightOk: 600, weightPlain: 400 } as const;

type Look = { icon?: IconName; tone: ColorToken; strong: boolean; words: string };

/** What the line says and how, for each state the form can be in. `none` and `unconfirmed` draw nothing here (the field shows its own error). */
export function nameLineLook(line: NameLine): Look | null {
  switch (line.kind) {
    case 'resolved':
      if (line.match === true) return { icon: 'CircleCheck', tone: 'positive', strong: true, words: `${line.name} · matches your BVN` };
      if (line.match === false) return { icon: 'TriangleAlert', tone: 'warning', strong: true, words: `${line.name} · not the name on your BVN` };
      return { icon: 'CircleCheck', tone: 'positive', strong: true, words: line.name };
    case 'checking':
      return { tone: 'textMuted', strong: false, words: 'Checking the account with the bank' };
    case 'unchecked':
      return { tone: 'textMuted', strong: false, words: 'We could not check the name now. Saving checks it with the bank.' };
    default:
      return null;
  }
}

export type NameLineViewProps = { line: NameLine; testID?: string };

/** The line under the account number: the bank's name for it, and whether it is the BVN name. */
export function NameLineView({ line, testID }: NameLineViewProps) {
  const { colors } = useWawu();
  const look = nameLineLook(line);
  if (!look) return null;
  return (
    <View testID={testID} style={styles.row} accessible accessibilityLiveRegion="polite">
      {look.icon ? <Icon name={look.icon} size={lineMetrics.icon} color={colors[look.tone]} strokeWidth={lineMetrics.stroke} /> : null}
      <Text variant="caption" tone={look.tone} style={[styles.words, font(look.strong ? lineMetrics.weightOk : lineMetrics.weightPlain)]}>
        {look.words}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: lineMetrics.iconGap, marginTop: space.sm },
  words: { flexShrink: 1, lineHeight: canvasNormalLineHeight(type.size.caption) },
});
