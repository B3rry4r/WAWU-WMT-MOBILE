import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { FieldScroll, useFootBottom } from '@/components/FieldScroll';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField, fieldMetrics } from '@/components/TextField';
import { layout, space, useWawu } from '@/theme';

import { detailKey, eventsKey, fetchEvent, fetchOptions, optionsKey } from '../api';
import { NavBar } from '../chrome';
import { footMetrics } from './HostEnds';
import { HostGateScreen } from './HostGateScreen';
import { updateEvent } from './hostApi';
import { addressError, needsAddress } from './hostForm';
import { SentBackNote } from './hostParts';
import { isHostTierRefusal, type HostTierRefusal } from './hostTier';

/** events_b.js `sentBack`: a body of 14 between rows whose top is the kit's default 8 (kit.js `body`). */
const bodyMetrics = { top: 8, bottom: 14, between: 14 } as const;

export type SentBackScreenProps = {
  id: string;
  onBack: () => void;
  onDone: () => void;
  /** E21's See tiers opens VF5. The button is not drawn without it. */
  onSeeTiers?: () => void;
};

/**
 * E22 · Sent back: an event an admin sent back, with the reviewer's words on top, the street address flagged
 * when it is the thing missing, and Send again. An edit sends the event back to review (the Hub's own rule). An edit needs a running
 * tier like a new event does (EVENTS-12): a refused send opens E21 with the Hub's own sentence and price.
 */
export function SentBackScreen({ id, onBack, onDone, onSeeTiers }: SentBackScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const footBottom = useFootBottom(footMetrics.bottom + insets.bottom);
  const client = useQueryClient();
  const event = useQuery({ queryKey: detailKey(id), queryFn: () => fetchEvent(id) });
  const options = useQuery({ queryKey: optionsKey, queryFn: fetchOptions });

  // The person's edits, kept apart from the event so a refetch never throws them away.
  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [refused, setRefused] = useState<HostTierRefusal | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);

  const data = event.data;
  const opts = options.data;
  const shownName = name ?? data?.name ?? '';
  const shownAddress = address ?? data?.address ?? '';
  const addressMissing = data ? needsAddress(data.format) && (data.address ?? '').trim() === '' : false;

  const send = async () => {
    if (inFlight.current || !data || !opts) return;
    const found: { name?: string; address?: string } = {};
    if (shownName.trim() === '') found.name = 'Give the event a name.';
    else if (shownName.trim().length > opts.fields.nameMax) found.name = `Keep it to ${opts.fields.nameMax} characters.`;
    const addr = addressError(shownAddress, data.format, opts.fields);
    if (addr) found.address = addr;
    setErrors(found);
    if (found.name || found.address) return;
    inFlight.current = true;
    setSending(true);
    setFailure(null);
    try {
      await updateEvent(id, { name: shownName.trim(), ...(shownAddress.trim() ? { address: shownAddress.trim() } : {}) });
      void client.invalidateQueries({ queryKey: eventsKey });
      onDone();
    } catch (error) {
      if (!mounted.current) return;
      if (isHostTierRefusal(error)) setRefused(error as HostTierRefusal);
      else setFailure(isApiError(error) ? error.message : 'Your event was not sent. Try again.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setSending(false);
    }
  };

  if (refused) return <HostGateScreen refusal={refused} onBack={onBack} onSeeTiers={onSeeTiers} />;

  const failed = (!event.data && event.isError) || (!options.data && options.isError);
  const pending = event.isPending || options.isPending;

  return (
    <KeyboardAvoidingView testID="sent-back-screen" behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title={data?.name ?? 'Sent back'} onBack={onBack} backTestID="sent-back-back" />
      {pending ? (
        <View style={styles.body} testID="sent-back-loading">
          <Skeleton height={72} />
          <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
          <Skeleton height={fieldMetrics.height} radius={fieldMetrics.radius} />
        </View>
      ) : failed || !data || !opts ? (
        <ErrorState
          testID="sent-back-error"
          title="Couldn't open this event"
          message={isApiError(event.error) ? event.error.message : 'Check your connection and try again.'}
          onRetry={() => {
            void event.refetch();
            void options.refetch();
          }}
        />
      ) : (
        <>
          <FieldScroll contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <SentBackNote reason={data.lastDecisionReason} />
            <TextField
              testID="sent-back-address"
              label="Street address"
              placeholder="Street address"
              value={shownAddress}
              onChangeText={(v) => {
                setAddress(v);
                setFailure(null);
              }}
              maxLength={opts.fields.addressMax}
              error={errors.address ?? (addressMissing && address === null ? 'Needed before it can go live' : undefined)}
            />
            <TextField
              testID="sent-back-name"
              label="Event name"
              value={shownName}
              onChangeText={(v) => {
                setName(v);
                setFailure(null);
              }}
              maxLength={opts.fields.nameMax}
              error={errors.name}
            />
          </FieldScroll>
          <View style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footBottom }]}>
            {failure ? (
              <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="sent-back-failure">
                {failure}
              </Text>
            ) : null}
            <Button testID="sent-back-send" label="Send again" full loading={sending} onPress={() => void send()} />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  body: { paddingHorizontal: layout.gutter, paddingTop: bodyMetrics.top, paddingBottom: bodyMetrics.bottom, gap: bodyMetrics.between },
  foot: { paddingTop: footMetrics.top, paddingHorizontal: layout.gutter, gap: space.sm },
});
