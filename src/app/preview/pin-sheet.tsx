import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PinSheet, type BiometricKind, type BiometricResult, type PinCheckResult } from '@/components/pin-sheet';
import { layout, space, text, useWawu } from '@/theme';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';

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
 *   biometric=fingerprint | face
 *                   shows that biometric key (a browser has none to read); it
 *                   answers `approved` on answer=ok, never on answer=hold,
 *                   and `failed` otherwise
 *   forgot=1        shows "Forgot PIN?"
 */

type Params = {
  answer?: string;
  tries?: string;
  lockMinutes?: string;
  opensLocked?: string;
  biometric?: string;
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
  return Promise.resolve(p.answer === 'ok' ? { code: 'approved' } : { code: 'failed' });
}

const kinds: readonly BiometricKind[] = ['fingerprint', 'face'];
const kindOf = (p: Params) => kinds.find((k) => k === p.biometric);

export default function PinSheetPreview() {
  const params = useLocalSearchParams<Params>();
  const { colors } = useWawu();
  const [open, setOpen] = useState(true);
  const [lockedUntil] = useState(() => (params.opensLocked === '1' ? lockEnd(params) : null));

  if (!__DEV__) return <LeaveDevRoute />;

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
        biometric={kindOf(params) ? { kind: kindOf(params), onPress: () => biometricAnswerFor(params) } : undefined}
        onForgotPin={params.forgot === '1' ? () => setOpen(false) : undefined}
        lockedUntil={lockedUntil}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: layout.gutter, paddingTop: space.s3xl * 2, gap: space.md },
});
