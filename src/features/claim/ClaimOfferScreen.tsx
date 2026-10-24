import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { AuthFrame } from '@/features/auth/AuthFrame';
import { font, space } from '@/theme';

import { settleOfferStep } from './offerStep';

/** The title block of the claim screen's family (A22 style): `h1` at 28, 10 down, 6 between the title and the line. */
const TITLE = { size: 28, tracking: -0.03, leading: 1.15 } as const;
const TITLE_TOP = 10;
const TITLE_GAP = 6;
const ICON = 56;

export type ClaimOfferScreenProps = {
  /** "Enter code": the claim screen opens. */
  onEnter: () => void;
  /** "Skip": on to the app. */
  onSkip: () => void;
};

/**
 * "Have an access code?" (JOIN-03 round 2): the one question asked right after a person signs up, for the people who
 * paid for a plan at an event. Two ways out and nothing else: Enter code opens the claim screen, Skip goes on to the app.
 * It is drawn at most once per account (offerStep.ts settles it the moment it is on screen) and has no back arrow
 * because there is nothing behind it. No artboard draws it; it is built in the style of the claim screen it leads to.
 */
export function ClaimOfferScreen({ onEnter, onSkip }: ClaimOfferScreenProps) {
  useEffect(() => {
    settleOfferStep();
  }, []);
  return (
    <AuthFrame
      testID="claim-offer"
      bare
      footer={
        <>
          <Button label="Enter code" full onPress={onEnter} testID="claim-offer-enter" />
          <Button label="Skip" variant="secondary" full onPress={onSkip} testID="claim-offer-skip" />
        </>
      }
    >
      <View style={styles.head}>
        <IconTile icon="Ticket" size={ICON} />
        <Text variant="h1" style={{ fontSize: TITLE.size, lineHeight: TITLE.size * TITLE.leading, letterSpacing: TITLE.tracking * TITLE.size, ...font(700) }}>
          Have an access code?
        </Text>
        <Text variant="muted">Paid for a plan at an event? Enter the code from your registration to claim it. You can also do this later in Settings.</Text>
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  head: { gap: TITLE_GAP, paddingTop: TITLE_TOP + space.xl },
});
