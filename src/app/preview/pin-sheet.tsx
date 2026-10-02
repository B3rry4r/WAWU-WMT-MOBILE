import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PinSheet, type PinCheckResult } from '@/components/pin-sheet';
import { layout, space, text, useWawu } from '@/theme';

/*
 * Development-only harness for the PIN sheet (task MONEY-02), used to
 * screenshot each state at 390 px against W11. Release builds redirect home.
 *
 * Query parameters stand in for the server's answer, which is MONEY-09's:
 *   answer=wrong | locked | ok | error | hold (hold never answers: submitting)
 *   tries=<n>       tries left on a wrong answer
 *   lockMinutes=<n> length of a lock, from the locked answer or `opensLocked`
 *   opensLocked=1   the sheet opens already locked
 *   faceId=1        shows the Face ID key; pressing it answers like a PIN
 *   forgot=1        shows "Forgot PIN?"
 */

type Params = {
  answer?: string;
  tries?: string;
  lockMinutes?: string;
  opensLocked?: string;
  faceId?: string;
  forgot?: string;
};

const MS_PER_MINUTE = 60_000;

function answerFor(p: Params): Promise<PinCheckResult> {
  const minutes = Number(p.lockMinutes ?? '0');
  switch (p.answer) {
    case 'wrong':
      return Promise.resolve({ status: 'wrong', triesLeft: Number(p.tries ?? '0') });
    case 'locked':
      return Promise.resolve({ status: 'locked', until: new Date(Date.now() + minutes * MS_PER_MINUTE) });
    case 'ok':
      return Promise.resolve({ status: 'ok' });
    case 'error':
      return Promise.resolve({ status: 'error' });
    default:
      return new Promise<PinCheckResult>(() => undefined);
  }
}

export default function PinSheetPreview() {
  const params = useLocalSearchParams<Params>();
  const { colors } = useWawu();
  const [open, setOpen] = useState(true);
  const [lockedUntil] = useState(() =>
    params.opensLocked === '1'
      ? new Date(Date.now() + Number(params.lockMinutes ?? '0') * MS_PER_MINUTE)
      : undefined,
  );

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <View style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <Text style={[text.h2, { color: colors.textPrimary }]}>PIN sheet preview</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
        <Text style={[text.body, { color: colors.accentFg }]}>Open the sheet</Text>
      </Pressable>
      <PinSheet
        visible={open}
        onClose={() => setOpen(false)}
        approval={{ totalKobo: 2_506_500, payee: 'Chidinma Okoro' }}
        onSubmit={() => answerFor(params)}
        biometric={params.faceId === '1' ? { label: 'Face ID', onPress: () => answerFor(params) } : undefined}
        onForgotPin={params.forgot === '1' ? () => setOpen(false) : undefined}
        lockedUntil={lockedUntil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: layout.gutter, paddingTop: space.s3xl * 2, gap: space.md },
});
