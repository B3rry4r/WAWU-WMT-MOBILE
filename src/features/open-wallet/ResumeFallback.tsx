import { StyleSheet, View } from 'react-native';

import { LoadingView, Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { radius, space } from '@/theme';

import { AuthFrame } from '@/features/auth/AuthFrame';

import { useOpeningSending } from './sending';

const SKELETON_ROW = 76;

/**
 * What A31 draws while it is asked where the person belongs (the Hub's answer is on its way, or it is about to route
 * them on). Nothing while it only asks: the step they are about to see must not flash by. While A27 is sending the
 * details and documents (`sending.ts`) it routes nobody, so it can stay in front for the whole send (a back press
 * walked the person here): then it draws a busy state, never an empty page (FIX-47).
 */
export function ResumeFallback() {
  const sending = useOpeningSending();
  if (!sending) {
    return (
      <AuthFrame testID="open-wallet-resume" bare>
        <LoadingView label="Loading your account">{null}</LoadingView>
      </AuthFrame>
    );
  }
  return (
    <AuthFrame testID="open-wallet-resume" bare>
      <LoadingView testID="open-wallet-resume-sending" label="Sending your details and documents">
        <View style={styles.body}>
          <Text variant="muted" testID="open-wallet-resume-sending-line">
            Sending your details and documents
          </Text>
          <Skeleton height={fieldMetrics.height} radius={radius.tile} />
          <Skeleton height={SKELETON_ROW} radius={radius.tile} />
        </View>
      </LoadingView>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.lg },
});
