import { StyleSheet, View } from 'react-native';

import { font, space } from '@/theme';

import { Button } from './Button';
import type { IconName } from './icon';
import { IconTile } from './IconTile';
import { Text } from './Text';

/** design/_gen/kit.js `empty`: a 56 circle, a 16 title, 13.5 words held to 280 wide. */
const stateMetrics = { icon: 56, maxWidth: 280, padV: 26, stack: 10, titleGap: space.xs, actionGap: 6 } as const;

type StateAction = { label: string; onPress: () => void };

type StateMessageProps = {
  icon: IconName;
  title: string;
  message: string;
  action?: StateAction;
  actionIcon?: IconName;
  role?: 'alert';
  testID?: string;
};

function StateMessage({ icon, title, message, action, actionIcon, role, testID }: StateMessageProps) {
  return (
    <View testID={testID} style={styles.root}>
      <IconTile icon={icon} size={stateMetrics.icon} />
      <Text variant="h3" accessibilityRole="header" style={[font(600), styles.title]}>
        {title}
      </Text>
      <Text
        variant="secondary"
        tone="textSecondary"
        accessibilityRole={role}
        accessibilityLiveRegion={role ? 'polite' : undefined}
        style={styles.message}
      >
        {message}
      </Text>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} icon={actionIcon} variant="secondary" size="md" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export type EmptyStateProps = {
  title: string;
  message: string;
  icon?: IconName;
  /** The one thing a user can do about it ("Browse communities"). */
  action?: StateAction;
  testID?: string;
};

/** Nothing here yet, or nothing matched. Not a failure: no alert, no retry. */
export function EmptyState({ title, message, icon = 'MessageCircle', action, testID }: EmptyStateProps) {
  return <StateMessage testID={testID} icon={icon} title={title} message={message} action={action} />;
}

export type ErrorStateProps = {
  title: string;
  message: string;
  /** Runs the request again. Shown as "Try again". */
  onRetry?: () => void;
  icon?: IconName;
  testID?: string;
};

/** The request failed. A screen reader is told at once, and the user gets a way to try again. */
export function ErrorState({ title, message, onRetry, icon = 'WifiOff', testID }: ErrorStateProps) {
  return (
    <StateMessage
      testID={testID}
      role="alert"
      icon={icon}
      title={title}
      message={message}
      action={onRetry ? { label: 'Try again', onPress: onRetry } : undefined}
      actionIcon="RotateCw"
    />
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: stateMetrics.stack, paddingVertical: stateMetrics.padV, paddingHorizontal: space.lg },
  title: { marginTop: stateMetrics.titleGap, textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: stateMetrics.maxWidth },
  action: { marginTop: stateMetrics.actionGap },
});
