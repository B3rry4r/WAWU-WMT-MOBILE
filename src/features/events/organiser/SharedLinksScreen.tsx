import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { FieldScroll, useFootBottom } from '@/components/FieldScroll';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { layout, space, useWawu } from '@/theme';

import { NavBar } from '../chrome';
import { footMetrics } from '../host/HostEnds';
import { useRefetchOnFocus } from '../useRefetchOnFocus';
import { createReferral, fetchReferrals, referralsKey } from './organiserApi';
import { LABEL, labelError, plural } from './organiserFormat';

export type SharedLinksScreenProps = { id: string; onBack: () => void };

/**
 * Shared links (E18's row, built in the canvas's own style: BRIEF E18): the host's links with the tickets sold through each, and a field to
 * make another. The code is the Hub's; a link's tickets sold are the Hub's count, never added up here.
 */
export function SharedLinksScreen({ id, onBack }: SharedLinksScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const footBottom = useFootBottom(footMetrics.bottom + insets.bottom);
  const client = useQueryClient();
  const links = useQuery({ queryKey: referralsKey(id), queryFn: () => fetchReferrals(id) });
  useRefetchOnFocus(['events', 'referrals']);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const make = async () => {
    if (inFlight.current) return;
    const problem = labelError(label);
    setError(problem);
    if (problem) return;
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await createReferral(id, label.trim());
      setLabel('');
      await client.invalidateQueries({ queryKey: referralsKey(id) });
    } catch (e) {
      setFailure(isApiError(e) ? e.message : 'The link was not made. Try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView testID="links-screen" behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Shared links" onBack={onBack} backTestID="links-back" />
      <FieldScroll contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {links.isPending ? (
          <LoadingView label="Loading your links" testID="links-loading">
            <Skeleton height={64} />
            <Skeleton height={64} />
          </LoadingView>
        ) : links.isError && !links.data ? (
          <ErrorState
            testID="links-error"
            title="Couldn't load your links"
            message={isApiError(links.error) ? links.error.message : 'Check your connection and try again.'}
            onRetry={() => void links.refetch()}
          />
        ) : links.data.length === 0 ? (
          <EmptyState testID="links-empty" icon="Link" title="No links yet" message="Make a link to see how many tickets it sells." />
        ) : (
          <GroupedList testID="links-list">
            {links.data.map((link) => (
              <ListRow
                key={link.id}
                testID={`link-${link.id}`}
                lead={<IconTile icon="Link" />}
                title={link.label}
                subtitle={`Code ${link.code}`}
                subtitleSelectable
                trailing={
                  <Text variant="kvValue" testID={`link-sales-${link.id}`}>
                    {plural(link.ticketsSold, 'sale', 'sales')}
                  </Text>
                }
              />
            ))}
          </GroupedList>
        )}
      </FieldScroll>
      {links.data ? (
        <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footBottom }]}>
          <TextField
            testID="links-label"
            label="New link"
            placeholder="Name this link"
            value={label}
            onChangeText={(v) => {
              setLabel(v);
              setError(undefined);
              setFailure(null);
            }}
            maxLength={LABEL.max}
            error={error}
          />
          {failure ? (
            <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="links-failure">
              {failure}
            </Text>
          ) : null}
          <Button testID="links-make" label="Make a link" full loading={busy} onPress={() => void make()} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  body: { paddingHorizontal: layout.gutter, paddingTop: space.sm, gap: space.md, flexGrow: 1 },
  foot: { paddingTop: footMetrics.top, paddingHorizontal: layout.gutter, gap: space.sm },
});
