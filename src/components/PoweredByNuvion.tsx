import { useQuery } from '@tanstack/react-query';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { queryClient } from '@/api/query';
import { aboutKey, fetchAbout } from '@/features/about/api';

import { Text } from './Text';

/** The wallet provider does not change while the app runs, so one read serves every money screen for a while. */
const PROVIDER_STALE_MS = 10 * 60_000;

/**
 * True when the Hub says the wallets run on Nuvion (R-95). The Hub serves the running provider's bank name on its public
 * `GET /about` (the same one About's "Banking by" reads: `NUVION_WALLET_BANK_NAME`, "Nuvion" in production), and under any other
 * provider it names that provider's bank instead. Until the read answers, or when it fails, this is false: nothing is drawn.
 */
export function useWalletsOnNuvion(): boolean {
  const about = useQuery({ queryKey: aboutKey, queryFn: fetchAbout, staleTime: PROVIDER_STALE_MS, retry: false }, queryClient);
  return /\bnuvion\b/i.test(about.data?.bankName ?? '');
}

export type PoweredByNuvionProps = {
  /** Where the screen puts it (a gap above it). The line itself is centred, caption size, muted ink. */
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * "Powered by Nuvion" (R-95): the one small line the money screens carry, shared by all of them and placed once on each. Plain text,
 * because the repo holds no Nuvion logo. Drawn only while the wallets run on Nuvion, and never on a screen that is not about money.
 */
export function PoweredByNuvion({ style, testID = 'powered-by-nuvion' }: PoweredByNuvionProps) {
  const nuvion = useWalletsOnNuvion();
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
