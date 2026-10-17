import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { layout, radius, useWawu } from '@/theme';

import { detailKey, eventsKey, fetchEvent, fetchOptions, fetchTickets, optionsKey, ticketsKey } from '../api';
import { NavBar } from '../chrome';
import { useRefetchOnFocus } from '../useRefetchOnFocus';
import { CancelSheet } from './CancelSheet';
import { CallOffLink, NetCard, StatTile, dashMetrics } from './organiserParts';
import { cancelEvent, dashboardKey, fetchDashboard, fetchReferrals, referralsKey, type CancelAnswer } from './organiserApi';
import { dashboardDate, linksLine, tiersLine } from './organiserFormat';

const KOBO = 100;

export type DashboardScreenProps = {
  id: string;
  onBack: () => void;
  /** At the door (E19). */
  onDoor: () => void;
  /** Ticket types, Shared links and Edit event: each row is drawn only where its screen is built. */
  onTickets?: () => void;
  onLinks?: () => void;
  onEdit?: () => void;
  /** The host has read what calling it off did: back to My events. */
  onCalledOff: () => void;
  now?: () => number;
};

/**
 * E18 · Organiser dashboard, with E25 over it: sold, checked in and left, what the host is owed after our cut, and the host's rows.
 * Every figure is the Hub's (`GET /events/{id}/dashboard`, `/options`, `/tickets`, `/referrals`).
 */
export function DashboardScreen({ id, onBack, onDoor, onTickets, onLinks, onEdit, onCalledOff, now = Date.now }: DashboardScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const event = useQuery({ queryKey: detailKey(id), queryFn: () => fetchEvent(id) });
  const dash = useQuery({ queryKey: dashboardKey(id), queryFn: () => fetchDashboard(id) });
  // The rows' second lines are nice to have: a failure leaves a row with its title alone, and is never retried.
  const tickets = useQuery({ queryKey: ticketsKey(id), queryFn: () => fetchTickets(id), retry: false });
  const links = useQuery({ queryKey: referralsKey(id), queryFn: () => fetchReferrals(id), retry: false });
  const options = useQuery({ queryKey: optionsKey, queryFn: fetchOptions, retry: false });
  useRefetchOnFocus(['events', 'dashboard']);
  const [sheet, setSheet] = useState(false);
  const [at] = useState(() => now());

  const data = dash.data;
  const ev = event.data;
  const called = ev ? ev.cancelledAt !== null : false;
  const failed = (!data && dash.isError ? dash.error : null) ?? (!ev && event.isError ? event.error : null);

  const callOff = async (reason: string): Promise<CancelAnswer> => {
    try {
      const answer = await cancelEvent(id, reason);
      void client.invalidateQueries({ queryKey: eventsKey });
      return answer;
    } catch (error) {
      // "Already called off" (409): the screen shows what the Hub now says instead of the live event it drew.
      if (isApiError(error) && error.status === 409) void client.invalidateQueries({ queryKey: eventsKey });
      throw error;
    }
  };

  return (
    <View testID="dashboard-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title={ev?.name ?? 'Your event'} subtitle={ev ? dashboardDate(ev, at) : undefined} onBack={onBack} backTestID="dashboard-back" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {dash.isPending || event.isPending ? (
          <LoadingView label="Loading your event" testID="dashboard-loading">
            <View style={styles.tiles}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} width="31%" height={86} radius={radius.card} />
              ))}
            </View>
            <Skeleton height={96} radius={radius.card} />
            <Skeleton height={260} radius={radius.card} />
          </LoadingView>
        ) : failed || !data || !ev ? (
          <ErrorState
            testID="dashboard-error"
            title="Couldn't open this event"
            message={isApiError(failed) ? failed.message : 'Check your connection and try again.'}
            onRetry={() => {
              void dash.refetch();
              void event.refetch();
            }}
          />
        ) : (
          <>
            {called ? (
              <Banner tone="danger" icon="CalendarX" title="This event was called off" body={ev.cancelReason ?? 'Every buyer was refunded.'} testID="dashboard-called-off" />
            ) : null}
            <View style={styles.tiles}>
              <StatTile label="Sold" value={data.ticketsSold} testID="dash-sold" />
              <StatTile label="Checked in" value={data.checkedIn} testID="dash-checked-in" />
              <StatTile label="Left" value={data.remaining} testID="dash-left" />
            </View>
            <NetCard kobo={data.netNaira * KOBO} percent={options.data ? options.data.tickets.hostSharePercent : null} />
            {called ? null : (
              <GroupedList testID="dash-rows">
                <ListRow
                  testID="dash-door"
                  lead={<IconTile icon="ScanLine" tone="accent" />}
                  title="At the door"
                  subtitle="Scan tickets as people arrive"
                  onPress={onDoor}
                />
                {onTickets ? (
                  <ListRow
                    testID="dash-tickets"
                    lead={<IconTile icon="Ticket" />}
                    title="Ticket types"
                    subtitle={tickets.data && tickets.data.length > 0 ? tiersLine(tickets.data) : undefined}
                    onPress={onTickets}
                  />
                ) : null}
                {onLinks ? (
                  <ListRow
                    testID="dash-links"
                    lead={<IconTile icon="Link" />}
                    title="Shared links"
                    subtitle={links.data ? linksLine(links.data) : undefined}
                    onPress={onLinks}
                  />
                ) : null}
                {onEdit ? <ListRow testID="dash-edit" lead={<IconTile icon="PenLine" />} title="Edit event" onPress={onEdit} /> : null}
              </GroupedList>
            )}
            {called ? null : <CallOffLink onPress={() => setSheet(true)} />}
          </>
        )}
      </ScrollView>
      {/* Kept up once the event reads as called off: the sheet is then showing what happened, and Done closes it. */}
      {data ? <CancelSheet visible={sheet} onClose={() => setSheet(false)} buyers={data.buyersToRefund} onCancel={callOff} onDone={onCalledOff} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  body: { paddingHorizontal: layout.gutter, paddingTop: 8, gap: dashMetrics.stack },
  tiles: { flexDirection: 'row', gap: dashMetrics.tileGap },
});
