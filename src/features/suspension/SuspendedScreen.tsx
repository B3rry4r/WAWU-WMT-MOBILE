import { StyleSheet, View } from 'react-native';

import { lastSuspendedRefusal } from '@/api/suspension';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Text } from '@/components/Text';
import { font, space } from '@/theme';

import { useMySuspension } from './api';

export type SuspendedScreenProps = { onBack: () => void };

/**
 * USER-SUSPEND (R-121). The one calm screen a suspended person sees when the Hub refuses a write. No board draws it (R-29): it is
 * built from the shared frame, the state-view tile and the plain button. The words are the Hub's (the refusal that opened it, else
 * `GET /me/suspension`), the support address is selectable text so it can be copied, and Back returns to where they were. Nothing
 * here is written in the app, and nothing offers a way round the refusal.
 */
export function SuspendedScreen({ onBack }: SuspendedScreenProps) {
  const mine = useMySuspension();
  const refusal = lastSuspendedRefusal();
  const message = refusal?.message || mine.data?.message || '';
  const email = refusal?.supportEmail || mine.data?.supportEmail || '';
  // The sentence ends with the address; the address is shown once more on its own line as selectable text.
  return (
    <ScreenFrame idPrefix="suspended" title="Account suspended" onBack={onBack} gap={space.lg} testID="suspended-screen">
      <View style={styles.body}>
        <IconTile icon="ShieldAlert" size={56} />
        <Text variant="h3" accessibilityRole="header" style={[font(600), styles.title]}>
          Your account is suspended
        </Text>
        {message ? (
          <Text variant="secondary" tone="textSecondary" style={styles.message} testID="suspended-message">
            {message}
          </Text>
        ) : null}
        {email ? (
          <Text selectable variant="body" style={[font(600), styles.email]} testID="suspended-email" accessibilityLabel={`Support address ${email}`}>
            {email}
          </Text>
        ) : null}
        <View style={styles.action}>
          <Button label="Go back" variant="secondary" size="md" onPress={onBack} testID="suspended-go-back" />
        </View>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingTop: space.s3xl, paddingHorizontal: space.lg, gap: space.md },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 300 },
  email: { textAlign: 'center', marginTop: space.xs },
  action: { marginTop: space.lg },
});
