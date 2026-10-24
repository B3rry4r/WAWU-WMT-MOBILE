import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { BrandMark } from '@/components/BrandMark';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { MoneyGround } from '@/features/wallet/home/BalanceCard';
import { font, radius, space, useWawu } from '@/theme';

import { cardsQuery } from './cardsList';
import { kindTitle, statusLine, WORDS } from './model';

/** Whether the Hub says the WAWU card is on. A read that failed or is out says no: nothing is drawn for cards then (R-47). */
export function useCardsOn(): boolean {
  const owner = useSessionAccount(undefined);
  const cards = useQuery(cardsQuery(owner), queryClient);
  return cards.data?.enabled === true;
}

/** W35's Cards row: what it says under its title, or null while cards are off, unread or failed (the row is not drawn then). */
export function useCardsSummary(): { subtitle: string } | null {
  const owner = useSessionAccount(undefined);
  const cards = useQuery(cardsQuery(owner), queryClient);
  if (cards.data?.enabled !== true) return null;
  const first = cards.data.cards.find((c) => c.status !== 'blocked') ?? cards.data.cards[0];
  return {
    subtitle: first ? [kindTitle(first.kind), first.last4 ? `••${first.last4}` : null].filter(Boolean).join(' · ') : 'Get your card',
  };
}

/**
 * W1's WAWU card row (wallet.js line: the card's face, "Who Made This? card", then the card and its state). Drawn only while the Hub says
 * cards are on. With a card it says which and how it is; with none it leads to getting one (W29), as the board's no-card state does.
 */
export function CardRow() {
  const router = useRouter();
  const owner = useSessionAccount(undefined);
  const { colors } = useWawu();
  const cards = useQuery(cardsQuery(owner), queryClient);
  if (cards.data?.enabled !== true) return null;
  const first = cards.data.cards.find((c) => c.status !== 'blocked') ?? cards.data.cards[0];
  const line = first ? [kindTitle(first.kind), first.last4 ? `••${first.last4}` : null, statusLine(first)].filter(Boolean).join(' · ') : 'Get your card';
  return (
    <Pressable testID="wallet-card-row" accessibilityRole="button" accessibilityLabel={`${WORDS.title}. ${line}`} onPress={() => router.push('/cards')}>
      <Card style={styles.row}>
        <View style={styles.face}>
          <MoneyGround corner={radius.input / 2} glowId="wallet-card-row-glow" />
          <BrandMark width={18} surface="dark" decorative />
        </View>
        <View style={styles.words}>
          <Text variant="body" style={font(700)}>
            {WORDS.title}
          </Text>
          <Text variant="secondary" numberOfLines={1}>
            {line}
          </Text>
        </View>
        <Icon name="ChevronRight" size={20} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
  },
  face: {
    width: 64,
    height: 40,
    borderRadius: radius.input / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { flex: 1, gap: space.xs },
});
