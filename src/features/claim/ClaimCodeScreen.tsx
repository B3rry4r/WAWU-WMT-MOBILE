import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { AuthField } from '@/features/auth/AuthField';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { Banner } from '@/features/auth/Banner';
import { font, space } from '@/theme';

import { claimCode, type ClaimResult } from './api';
import { claimFailure, type ClaimFailure } from './claimFailure';
import { CODE_PROBLEM_WORDS, codeProblem, compactCode, formatCode, planLines, readyLine } from './model';

/** The title block of an A22-style form screen: `h1` at 28, 10 down, 6 between the title and the line. */
const TITLE = { size: 28, tracking: -0.03, leading: 1.15 } as const;
const TITLE_TOP = 10;
const TITLE_GAP = 6;
const BODY_GAP = space.lg;
const DONE_ICON = 56;

export type ClaimCodeScreenProps = {
  onBack: () => void;
  /** After the plan is shown and "Done" is tapped. The route decides where to go. */
  onDone: () => void;
  /** What the screen starts in (a preview, never the app). */
  initialResult?: ClaimResult;
};

/**
 * Claim the plan an event registration paid for (JOIN-03, R-48). The person types the launch access code the
 * registration page showed ("XXXX XXXX"); the Hub checks that it is theirs (a phone or email their account has
 * confirmed, never the code alone), gives what the plan gives, and the screen then lists exactly what the Hub
 * says they have. A refusal keeps what was typed and says why in plain words, on the field when it is the code
 * itself, in a note above it otherwise. One tap sends one claim: a second tap while one is on its way is ignored.
 */
export function ClaimCodeScreen({ onBack, onDone, initialResult }: ClaimCodeScreenProps) {
  const [shown, setShown] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(initialResult ?? null);
  const [failure, setFailure] = useState<ClaimFailure | null>(null);
  const [missing, setMissing] = useState<string | undefined>();
  /** Set before the first await, so a second tap in the same frame is ignored whatever React has rendered. */
  const inFlight = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const edit = (value: string) => {
    setShown(formatCode(value));
    setFailure(null);
    setMissing(undefined);
  };

  const submit = async () => {
    if (inFlight.current || result) return;
    const problem = codeProblem(shown);
    if (problem) {
      setMissing(CODE_PROBLEM_WORDS[problem]);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      setResult(await claimCode(compactCode(shown)));
    } catch (error) {
      setFailure(claimFailure(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (result) {
    return (
      <AuthFrame
        testID="claim-done"
        navTitle="Access code"
        footer={<Button label="Done" full onPress={onDone} testID="claim-done-button" />}
      >
        <View style={styles.body}>
          <View style={styles.doneHead}>
            <IconTile icon="CircleCheck" size={DONE_ICON} />
            <Text variant="h1" style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size, ...font(700) }}>
              Your plan is ready
            </Text>
            <Text variant="muted" testID="claim-ready-line">
              {readyLine(result)}
            </Text>
          </View>
          <GroupedList testID="claim-lines">
            {planLines(result).map((line) => (
              <KeyValueRow key={line.label} label={line.label} value={line.value} testID={`claim-line-${line.label.toLowerCase().replace(/\W+/g, '-')}`} />
            ))}
          </GroupedList>
        </View>
      </AuthFrame>
    );
  }

  const onField = failure?.where === 'field' ? failure.message : missing;

  return (
    <AuthFrame
      testID="claim-screen"
      scrollRef={scrollRef}
      onBack={onBack}
      navTitle="Access code"
      footer={<Button label="Claim my plan" full loading={busy} onPress={() => void submit()} testID="claim-submit" />}
    >
      <View style={styles.body}>
        <View style={styles.titleBlock}>
          <Text variant="h1" style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size }}>
            Your access code
          </Text>
          <Text variant="muted">Paid at an event? Enter the code from your registration to claim your plan.</Text>
        </View>
        {failure?.where === 'banner' ? <Banner tone={failure.tone} title={failure.title} body={failure.body} testID="claim-banner" /> : null}
        <AuthField
          scrollRef={scrollRef}
          label="Access code"
          testID="claim-code"
          value={shown}
          onChangeText={edit}
          error={onField}
          hint="Sign in with the phone number or email you registered with."
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: BODY_GAP },
  titleBlock: { gap: TITLE_GAP, paddingTop: TITLE_TOP },
  doneHead: { gap: TITLE_GAP, paddingTop: TITLE_TOP },
});
