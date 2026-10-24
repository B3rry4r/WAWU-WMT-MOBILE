import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { ScreenFrame } from '@/components/ScreenFrame';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { radius, space } from '@/theme';

import { cardsQuery } from './cardsList';
import { GetCardScreen, type GetCardScreenProps } from './GetCardScreen';
import { kindTitle, statusLine, WORDS } from './model';

export type CardsScreenProps = Omit<GetCardScreenProps, 'bare'> & {
  onOpenCard: (id: string) => void;
  onGetCard: () => void;
};

/**
 * The person's cards (W31's entry; no board draws a list, so it is built from the app's own rows, gap G-WALLET-22-1). With no card yet, this is
 * W29 itself: the screen that gets one. Cards switched off at the Hub: nothing is offered.
 */
export function CardsScreen(props: CardsScreenProps) {
  const owner = useSessionAccount(undefined);
  const cards = useQuery(cardsQuery(owner), queryClient);
  const frame = {
    title: WORDS.title,
    onBack: props.onBack,
    gap: space.lg,
    idPrefix: 'cards',
  } as const;

  if (cards.isPending) {
    return (
      <ScreenFrame {...frame} testID="cards-screen">
        <LoadingView label="Loading your cards" testID="cards-loading">
          <Skeleton height={64} radius={radius.card} />
          <Skeleton height={64} radius={radius.card} />
        </LoadingView>
      </ScreenFrame>
    );
  }
  if (cards.isError) {
    return (
      <ScreenFrame {...frame} testID="cards-screen">
        <ErrorState
          testID="cards-error"
          title="We couldn’t load your cards"
          message={isApiError(cards.error) && cards.error.message ? cards.error.message : 'Check your connection and try again.'}
          onRetry={() => void cards.refetch()}
        />
      </ScreenFrame>
    );
  }
  if (!cards.data.enabled && cards.data.cards.length === 0) {
    return (
      <ScreenFrame {...frame} testID="cards-screen">
        <EmptyState testID="cards-off" icon="CreditCard" title={WORDS.off} message="Check again later." />
      </ScreenFrame>
    );
  }
  if (cards.data.cards.length === 0) return <GetCardScreen {...props} />;

  return (
    <ScreenFrame {...frame} testID="cards-screen">
      <GroupedList>
        {cards.data.cards.map((card) => (
          <ListRow
            key={card.id}
            testID={`cards-row-${card.id}`}
            lead={
              <IconTile
                icon={card.status === 'frozen' ? 'Snowflake' : card.status === 'blocked' ? 'Ban' : 'CreditCard'}
                tone={card.status === 'active' ? 'accent' : 'neutral'}
              />
            }
            title={card.name}
            subtitle={[kindTitle(card.kind), card.last4 ? `••${card.last4}` : null, statusLine(card)].filter(Boolean).join(' · ')}
            onPress={() => props.onOpenCard(card.id)}
          />
        ))}
      </GroupedList>
      {cards.data.enabled ? (
        <View style={styles.foot}>
          <Button testID="cards-get-another" label={WORDS.getAnother} variant="outline" size="lg" full onPress={props.onGetCard} />
        </View>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({ foot: { paddingTop: space.md } });
