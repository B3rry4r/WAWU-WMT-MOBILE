import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { queryClient } from '@/api/query';
import { aboutKey, fetchAbout } from '@/features/about/api';
import { text } from '@/theme';

import { Text } from './Text';

/** The wallet provider does not change while the app runs, so one read serves every money screen for a while. */
const PROVIDER_STALE_MS = 10 * 60_000;

const isNuvion = (bankName: string | null | undefined): boolean => /\bnuvion\b/i.test(bankName ?? '');

/**
 * True when the Hub says the wallets run on Nuvion (R-95). The Hub serves the running provider's bank name on its public
 * `GET /about` (the same one About's "Banking by" reads: `NUVION_WALLET_BANK_NAME`, "Nuvion" in production), and under any other
 * provider it names that provider's bank instead. Until the read answers, or when it fails, this is false: nothing is drawn.
 */
export function useWalletsOnNuvion(): boolean {
  const about = useQuery({ queryKey: aboutKey, queryFn: fetchAbout, staleTime: PROVIDER_STALE_MS, retry: false }, queryClient);
  return isNuvion(about.data?.bankName);
}

/** The line's own height: the caption's line height (what `Text variant="caption"` draws), kept clear while the line is not drawn. */
const LINE_HEIGHT = text.caption.lineHeight ?? 0;

export type PoweredByNuvionProps = {
  /** Where the screen puts it (a gap above it). The line itself is centred, caption size, muted ink. */
  style?: StyleProp<TextStyle>;
  testID?: string;
  /**
   * Keep the line's room and draw nothing: for a page that has a sheet open over it, whose own line is the one in view (SWEEP-1026
   * row 6), so a person never sees it twice. The room stays so the page does not move under the scrim.
   */
  hidden?: boolean;
};

/**
 * "Powered by Nuvion" (R-95): the one small line the money screens carry, shared by all of them and placed once on each. Plain text,
 * because the repo holds no Nuvion logo. Drawn only while the wallets run on Nuvion, and never on a screen that is not about money.
 */
export function PoweredByNuvion({ style, testID = 'powered-by-nuvion', hidden = false }: PoweredByNuvionProps) {
  const about = useQuery({ queryKey: aboutKey, queryFn: fetchAbout, staleTime: PROVIDER_STALE_MS, retry: false }, queryClient);
  const nuvion = isNuvion(about.data?.bankName);
  // Until the Hub has answered, the line's room is kept, so the screen does not jump when the answer comes late (SWEEP-1026 row 7).
  // Once it has answered that the wallets are not on Nuvion, or the read failed, there is no line and no room.
  if (about.isPending || (nuvion && hidden)) return <View testID={`${testID}-room`} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[style as StyleProp<ViewStyle>, { height: LINE_HEIGHT }]} />;
  if (!nuvion) return null;
  return (
    <Text variant="caption" tone="textMuted" style={[styles.line, style]} testID={testID}>
      Powered by Nuvion
    </Text>
  );
}

const styles = StyleSheet.create({
  line: { textAlign: 'center' },
});
