import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { radius, space } from '@/theme';

import { fetchFormats, formatsKey } from './api';
import { CreateFrame } from './CreateFrame';
import { setFormat, useDraft } from './draft';
import { FORMATS, formatHint, type FormatId } from './model';
import { FormatRow } from './parts';

export type FormatScreenProps = { onBack: () => void; onContinue: (format: FormatId) => void };

/**
 * M20 · What are you making? Six formats; the file types and the clip length on a row are the Hub's rule for it
 * (`GET /uploads/formats`), so a row's words change when the Hub's rule does. Continue waits for a pick.
 */
export function FormatScreen({ onBack, onContinue }: FormatScreenProps) {
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const { format } = useDraft();

  const foot = <Button testID="create-continue" label="Continue" full disabled={!format || !formats.data} onPress={() => format && onContinue(format)} />;

  return (
    <CreateFrame testID="format-screen" title="What are you making?" subtitle="Step 1 of 5" onLeave={onBack} foot={foot}>
      <Text variant="muted">It decides what you upload, what buyers preview, and how it&apos;s delivered.</Text>
      {formats.data ? (
        <GroupedList testID="format-list">
          {FORMATS.map((f) => (
            <FormatRow
              key={f.id}
              testID={`format-${f.id}`}
              label={f.label}
              icon={f.icon}
              hint={formatHint(f.id, formats.data.find((r) => r.id === f.id))}
              selected={format === f.id}
              onPress={() => setFormat(f.id)}
            />
          ))}
        </GroupedList>
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
