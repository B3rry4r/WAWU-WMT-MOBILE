import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMyTier, tierKey } from '@/features/me/api';
import { runningTier } from '@/features/me/model';
import { radius, space } from '@/theme';

import { allowanceKey, fetchAllowance, fetchFormats, formatsKey } from './api';
import { CreateFrame } from './CreateFrame';
import { setFormat, useDraft } from './draft';
import { FORMATS, formatHint, type FormatId } from './model';
import { FormatRow } from './parts';
import { SlotsFullNotice, slotsFull } from './UploadsMeter';

/** M27 draws the list it disables at 45% opacity (me.js `slotsFull`). */
const FULL_FADE = 0.45;

export type FormatScreenProps = {
  onBack: () => void;
  onContinue: (format: FormatId) => void;
  /** The full-state note's Open library button (M27) opens M28. The button is not drawn without it. */
  onOpenLibrary?: () => void;
  /**
   * A person who holds a tier has used every place: VF13 opens over this step ("You have used N of N", Upgrade instead, Open library), in
   * place of a note that told them to get verified (RELEASE-02 second pass, M-3). Called once. Not drawn without it.
   */
  onProductsFull?: () => void;
};

/**
 * M20 · What are you making? Six formats; the file types and the clip length on a row are the Hub's rule for it
 * (`GET /uploads/formats`), so a row's words change when the Hub's rule does. Continue waits for a pick.
 *
 * M27 is this screen when the Hub's own count says every upload is used (`GET /uploads/allowance`, `remaining` 0): the note says so
 * with Open library, the list is drawn faded and cannot be picked, and Continue stays off. A count that has not loaded does not
 * block: the Hub still decides when the piece is created. A person who holds a tier is also shown VF13 (`onProductsFull`).
 */
export function FormatScreen({ onBack, onContinue, onOpenLibrary, onProductsFull }: FormatScreenProps) {
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });
  const { format } = useDraft();
  const full = allowance.data ? slotsFull(allowance.data) : false;
  // The tier is the Hub's own read: a person who holds one is offered the sheet, never "Get verified".
  const tier = useQuery({ queryKey: tierKey, queryFn: fetchMyTier, staleTime: 0, retry: false });
  const holdsTier = runningTier(tier.data) !== null;
  const opened = useRef(false);
  const open = onProductsFull;
  useEffect(() => {
    if (full && holdsTier && open && !opened.current) {
      opened.current = true;
      open();
    }
  }, [full, holdsTier, open]);

  const foot = <Button testID="create-continue" label="Continue" full disabled={full || !format || !formats.data} onPress={() => format && onContinue(format)} />;

  return (
    <CreateFrame testID="format-screen" title="What are you making?" subtitle="Step 1 of 5" onLeave={onBack} foot={foot}>
      {allowance.data && full ? <SlotsFullNotice allowance={allowance.data} onOpenLibrary={onOpenLibrary} /> : <Text variant="muted">It decides what you upload, what buyers preview, and how it&apos;s delivered.</Text>}
      {formats.data ? (
        <View testID="format-faded" pointerEvents={full ? 'none' : 'auto'} accessibilityState={{ disabled: full }} style={full ? { opacity: FULL_FADE } : undefined}>
          <GroupedList testID="format-list">
            {FORMATS.map((f) => (
              <FormatRow
                key={f.id}
                testID={`format-${f.id}`}
                label={f.label}
                icon={f.icon}
                hint={formatHint(f.id, formats.data.find((r) => r.id === f.id))}
                selected={!full && format === f.id}
                onPress={() => setFormat(f.id)}
              />
            ))}
          </GroupedList>
        </View>
      ) : formats.isError ? (
        <ErrorState
          testID="format-error"
          title="Couldn't load the formats"
          message={isApiError(formats.error) ? formats.error.message : 'Check your connection and try again.'}
          onRetry={() => void formats.refetch()}
        />
      ) : (
        <View testID="format-loading" style={styles.loading}>
          {FORMATS.map((f) => (
            <Skeleton key={f.id} height={64} radius={radius.tile} />
          ))}
        </View>
      )}
    </CreateFrame>
  );
}

const styles = StyleSheet.create({
  loading: { gap: space.sm },
});
