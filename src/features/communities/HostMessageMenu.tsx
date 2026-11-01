import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { space } from '@/theme';

export type HostMenuTarget = {
  messageId: string;
  /** Who wrote it: the Mute row is drawn only for somebody else. */
  senderWawuId: string;
  senderName: string;
  /** The host's own message: no Report and no Mute, only Delete. */
  own: boolean;
};

export type HostMessageMenuProps = {
  target: HostMenuTarget | null;
  /** True when the host has already muted the sender: the row says Unmute. */
  muted: boolean;
  onClose: () => void;
  /** Report this message (another person's). No row when left out. */
  onReport?: () => void;
  /** Each throws when the Hub did not take it; the sheet shows why and stays. They resolve when done, and the sheet closes. */
  onDelete: () => Promise<void>;
  onMute: () => Promise<void>;
  onUnmute: () => Promise<void>;
};

type Step = 'menu' | 'delete' | 'mute' | 'unmute';

/**
 * MOD-ROOMS (R-122). The host's press-and-hold menu on a message in their own room: Report (another person's message), Delete
 * message, and Mute {name} (Unmute {name} when they are muted). Delete and Mute each ask once more in a confirm sheet before
 * anything is sent. A member never sees this menu: they press and hold and get the report sheet, as before.
 * Drawn from the shared parts only (BottomSheet, GroupedList, ListRow, Button), the same as the person menu.
 */
export function HostMessageMenu({ target, muted, onClose, onReport, onDelete, onMute, onUnmute }: HostMessageMenuProps) {
  const [step, setStep] = useState<Step>('menu');
  const [acting, setActing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const busy = useRef(false);

  const close = () => {
    setStep('menu');
    setProblem(null);
    onClose();
  };

  const run = async (act: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setActing(true);
    setProblem(null);
    try {
      await act();
      setStep('menu');
      onClose();
    } catch (error) {
      setProblem(isApiError(error) && error.kind === 'network' ? error.message : 'Could not do that. Try again.');
    } finally {
      busy.current = false;
      setActing(false);
    }
  };

  if (!target) return null;
  const name = target.senderName;

  return (
    <BottomSheet visible onClose={close} dismissible={!acting} label="Message options" gap={space.md} testID="host-menu">
      {step === 'menu' ? (
        <GroupedList testID="host-menu-list">
          {!target.own && onReport ? (
            <ListRow
              testID="host-menu-report"
              lead={<IconTile icon="Flag" />}
              title="Report this message"
              onPress={() => {
                close();
                onReport();
              }}
            />
          ) : null}
          <ListRow testID="host-menu-delete" lead={<IconTile icon="Trash2" />} title="Delete message" onPress={() => setStep('delete')} />
          {!target.own ? (
            <ListRow
              testID={muted ? 'host-menu-unmute' : 'host-menu-mute'}
              lead={<IconTile icon={muted ? 'Volume2' : 'VolumeX'} />}
              title={muted ? `Unmute ${name}` : `Mute ${name}`}
              onPress={() => setStep(muted ? 'unmute' : 'mute')}
            />
          ) : null}
        </GroupedList>
      ) : (
        <View style={styles.confirm} testID={`host-menu-${step}-confirm`}>
          <Text variant="h2" accessibilityRole="header">
            {step === 'delete' ? 'Delete this message?' : step === 'mute' ? `Mute ${name}?` : `Unmute ${name}?`}
          </Text>
          <Text variant="body" tone="textSecondary">
            {step === 'delete'
              ? 'It disappears for everyone in this room. This cannot be undone.'
              : step === 'mute'
                ? 'They can still read this room, but they cannot send messages in it until you unmute them. Nothing they paid for changes.'
                : 'They can send messages in this room again.'}
          </Text>
          {problem ? (
            <Text variant="body" tone="danger" accessibilityRole="alert" testID="host-menu-failed">
              {problem}
            </Text>
          ) : null}
          <Button
            testID={`host-menu-${step}-yes`}
            label={step === 'delete' ? 'Delete' : step === 'mute' ? 'Mute' : 'Unmute'}
            variant="primary"
            loading={acting}
            onPress={() => void run(step === 'delete' ? onDelete : step === 'mute' ? onMute : onUnmute)}
            full
          />
          <Button
            testID={`host-menu-${step}-no`}
            label="Cancel"
            variant="secondary"
            onPress={() => {
              setStep('menu');
              setProblem(null);
            }}
            full
          />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  confirm: { gap: space.md },
});
