import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { space, useWawu } from '@/theme';

import { starLine } from './model';

/** design/_gen/home.js line 75: 40 stars, 12 apart, the chosen ones filled in the accent. */
const STAR = 40;
const STAR_STROKE = 1.6;
/** home.js line 75: 6 between the title and its line, and 6 above and below the stars. */
const TIGHT = 6;
const STARS = [1, 2, 3, 4, 5] as const;

export type RateSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The person's own rating so far: the stars start there, and Submit then changes it. */
  mine: number | null;
  /** Sends the stars. Rejects with the Hub's sentence when it refuses. */
  onSubmit: (stars: number) => Promise<void>;
};

/** H23 · Rate this piece: one to five stars, and Submit. */
export function RateSheet({ visible, onClose, mine, onSubmit }: RateSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Rate this piece" testID="rate-sheet">
      <RateBody mine={mine} onSubmit={onSubmit} />
    </BottomSheet>
  );
}

/** Inside the open sheet, so a sheet opened again starts from the person's own rating. */
function RateBody({ mine, onSubmit }: Pick<RateSheetProps, 'mine' | 'onSubmit'>) {
  const [stars, setStars] = useState<number>(mine ?? 0);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = async () => {
    if (stars < 1 || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      await onSubmit(stars);
    } catch (error) {
      setProblem(error instanceof Error && error.message ? error.message : "Your rating couldn't be sent. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View style={styles.head}>
        <Text variant="sheetTitleSm">Rate this piece</Text>
        <Text variant="muted">Your rating helps other buyers decide.</Text>
      </View>
      <View style={styles.stars} accessibilityRole="radiogroup" testID="rate-stars">
        {STARS.map((n) => (
          <Star key={n} n={n} on={n <= stars} onPress={() => setStars(n)} />
        ))}
      </View>
      <Text variant="body" tone="textSecondary" style={styles.line} testID="rate-line">
        {stars > 0 ? starLine(stars) : 'Tap a star'}
      </Text>
      {problem ? (
        <Text variant="errorLine" style={styles.line} accessibilityRole="alert" testID="rate-problem">
          {problem}
        </Text>
      ) : null}
      <Button testID="rate-submit" label="Submit rating" onPress={() => void submit()} disabled={stars < 1} loading={busy} full />
    </>
  );
}

function Star({ n, on, onPress }: { n: number; on: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`rate-star-${n}`}
      accessibilityRole="radio"
      accessibilityLabel={`${n} ${n === 1 ? 'star' : 'stars'}`}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      hitSlop={space.xs}
      {...ring.handlers}
      style={ring.style}
    >
      <Icon name="Star" size={STAR} color={on ? colors.accent : colors.borderStrong} fill={on ? colors.accent : 'none'} strokeWidth={STAR_STROKE} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { gap: TIGHT },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: space.md, paddingVertical: TIGHT },
  line: { textAlign: 'center' },
});
