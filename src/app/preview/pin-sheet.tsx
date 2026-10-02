import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PinSheet, type BiometricResult, type PinCheckResult } from '@/components/pin-sheet';
import { layout, space, text, useWawu } from '@/theme';

/*
 * Development-only harness for the PIN sheet (task MONEY-02), used to
 * screenshot each state at 390 px against W11. Release builds redirect home.
 *
 * Query parameters stand in for the server's answer (the contract's 403
 * pin_incorrect and 423 pin_locked; MONEY-09 builds the server side):
 *   answer=wrong | locked | ok | error | hold (hold never answers: submitting)
 *   tries=<n>       triesLeft on a wrong answer
 *   lockMinutes=<n> lockedUntil is now plus n minutes (locked answer or `opensLocked`)
 *   opensLocked=1   the sheet opens already locked (GET /money/pin lockedUntil)
 *   faceId=1        shows the Face ID key; it answers `approved` on answer=ok,
 *                   never on answer=hold, and `declined` otherwise
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

const lockEnd = (p: Params) => new Date(Date.now() + Number(p.lockMinutes ?? '0') * MS_PER_MINUTE).toISOString();
const never = <T,>() => new Promise<T>(() => undefined);

function answerFor(p: Params): Promise<PinCheckResult> {
  switch (p.answer) {
    case 'wrong':
      return Promise.resolve({ code: 'pin_incorrect', triesLeft: Number(p.tries ?? '0') });
    case 'locked':
      return Promise.resolve({ code: 'pin_locked', lockedUntil: lockEnd(p) });
    case 'ok':
      return Promise.resolve({ code: 'approved' });
    case 'error':
      return Promise.resolve({ code: 'unanswered' });
    default:
      return never<PinCheckResult>();
  }
}

function biometricAnswerFor(p: Params): Promise<BiometricResult> {
  if (p.answer === 'hold') return never<BiometricResult>();
  return Promise.resolve({ code: p.answer === 'ok' ? 'approved' : 'declined' });
}

export default function PinSheetPreview() {
  const params = useLocalSearchParams<Params>();
  const { colors } = useWawu();
  const [open, setOpen] = useState(true);
  const [lockedUntil] = useState(() => (params.opensLocked === '1' ? lockEnd(params) : null));

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
        biometric={params.faceId === '1' ? { label: 'Face ID', onPress: () => biometricAnswerFor(params) } : undefined}
        onForgotPin={params.forgot === '1' ? () => setOpen(false) : undefined}
        lockedUntil={lockedUntil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: layout.gutter, paddingTop: space.s3xl * 2, gap: space.md },
});
