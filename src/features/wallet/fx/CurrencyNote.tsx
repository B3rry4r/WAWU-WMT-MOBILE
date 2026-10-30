import { useQuery } from '@tanstack/react-query';

import { queryClient } from '@/api/query';
import { PromoRow } from '@/components/PromoRow';
import { ACCT } from '@/features/wallet/home/BalanceCard';

import type { AddCurrency } from './AddCurrency';
import { accountsQuery } from './api';
import { useCurrencyNote } from './currencyNote';
import { offerLine } from './model';

/**
 * The note right after a wallet opens: other currencies can be held here. It is drawn once for each person, while they hold nothing but
 * their first account (none for a naira wallet, one for a wallet opened outside Nigeria) and the Hub offers them something to add. The
 * words are what the Hub offers this person. It is the shared promo row (R-110 point 1): a tap on the row opens "Add a currency" and puts
 * the note away, as does the close button; it is never drawn again on this phone (D2, owner, 26 Oct 2026).
 */
export function CurrencyNote({ owner, adder, first = 0 }: { owner: string | null; adder: AddCurrency; first?: number }) {
  const note = useCurrencyNote(owner);
  const accounts = useQuery({ ...accountsQuery(owner), enabled: Boolean(owner) }, queryClient);
  const held = accounts.data?.length ?? null;
  if (note.seen !== false || held === null || held > first || !adder.available) return null;
  return (
    <PromoRow
      cardTestID="currency-note"
      testID="currency-note-add"
      subtitleTestID="currency-note-line"
      icon="Coins"
      title="More than one currency"
      subtitle={offerLine(adder.options)}
      accessibilityLabel={`More than one currency. ${offerLine(adder.options)} Add a currency.`}
      radius={ACCT.radius}
      onPress={() => {
        note.dismiss();
        adder.show();
      }}
      dismiss={{ label: 'Dismiss', onPress: note.dismiss, testID: 'currency-note-dismiss' }}
    />
  );
}
