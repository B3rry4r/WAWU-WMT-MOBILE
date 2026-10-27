import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { space } from '@/theme';

import type { AddCurrency } from './AddCurrency';
import { accountsQuery } from './api';
import { useCurrencyNote } from './currencyNote';
import { offerWords } from './model';

/**
 * The note right after a wallet opens: other currencies can be held here. It is drawn once for each person, while they hold nothing but
 * their first account (none for a naira wallet, one for a wallet opened outside Nigeria) and the Hub offers them something to add. The
 * words are what the Hub offers this person. "Add a currency" opens the choice and puts the note away, as does Dismiss; it is never drawn
 * again on this phone (D2, owner, 26 Oct 2026).
 */
export function CurrencyNote({ owner, adder, first = 0 }: { owner: string | null; adder: AddCurrency; first?: number }) {
  const note = useCurrencyNote(owner);
  const accounts = useQuery({ ...accountsQuery(owner), enabled: Boolean(owner) }, queryClient);
  const held = accounts.data?.length ?? null;
  if (note.seen !== false || held === null || held > first || !adder.available) return null;
  return (
    <Card padded testID="currency-note" style={styles.card}>
      <Text variant="cardTitle" accessibilityRole="header">
        More than one currency
      </Text>
      <Text variant="secondary" tone="textSecondary" testID="currency-note-line">
        {`You can also hold ${offerWords(adder.options)}.`}
      </Text>
      <View style={styles.buttons}>
        <Button
          testID="currency-note-add"
          label="Add a currency"
          size="sm"
          icon="Plus"
          onPress={() => {
            note.dismiss();
            adder.show();
          }}
        />
        <Button testID="currency-note-dismiss" label="Dismiss" size="sm" variant="secondary" onPress={note.dismiss} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
});
