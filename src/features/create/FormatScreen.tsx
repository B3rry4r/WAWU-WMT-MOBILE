import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
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
};

/**
 * M20 · What are you making? Six formats; the file types and the clip length on a row are the Hub's rule for it
 * (`GET /uploads/formats`), so a row's words change when the Hub's rule does. Continue waits for a pick.
 *
 * M27 is this screen when the Hub's own count says every upload is used (`GET /uploads/allowance`, `remaining` 0): the note says so
 * with Open library, the list is drawn faded and cannot be picked, and Continue stays off. A count that has not loaded does not
 * block: the Hub still decides when the piece is created.
 */
export function FormatScreen({ onBack, onContinue, onOpenLibrary }: FormatScreenProps) {
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });
  const { format } = useDraft();
  const full = allowance.data ? slotsFull(allowance.data) : false;

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
