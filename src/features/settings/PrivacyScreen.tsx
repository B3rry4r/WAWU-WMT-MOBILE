import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { GroupedList } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';

import { fetchBlocked, fetchExports, fetchPrivacy, patchPrivacy, requestExport, settingsKeys, type PrivacySettings } from './api/hub';
import { ExportSheet } from './ExportSheet';
import { exportLineOf, exportStateOf } from './exportState';
import { loadProblem, sentenceOf } from './failure';
import { PRIVACY_GROUPS, privacyOn, type PrivacyKey } from './groups';
import { ROW_TILE } from './metrics';
import { SettingsFrame } from './SettingsFrame';
import { SwitchGroups } from './SwitchGroups';
import { SwitchesLoading } from './SwitchesLoading';
import { useSwitches } from './useSwitches';

/** design/_gen/settings.js line 15 (Z4): the parts 16 apart. */
const BODY_GAP = 16;
const CARD_SIZES = PRIVACY_GROUPS.map((group) => group.switches.length);
/** The row's line when nobody is blocked: Z4 draws the count, and a count of nothing reads as a word. */
const NOBODY_BLOCKED = 'None';

export type PrivacyScreenProps = {
  onBack: () => void;
  /** Opens Z5 (Z12 when nobody is blocked). */
  onOpenBlocked: () => void;
  /** Opens Z11. */
  onOpenPolicy: () => void;
};

/**
 * Z4 · Privacy. The four switches are keys of `GET` and `PATCH /settings/privacy`. "Blocked accounts"
 * shows how many people the Hub says are blocked, "Download my data" asks the Hub to email an export
 * (SETTINGS-04), and "Privacy policy" opens the owner's text.
 */
export function PrivacyScreen({ onBack, onOpenBlocked, onOpenPolicy }: PrivacyScreenProps) {
  const switches = useSwitches<PrivacyKey, PrivacySettings>({
    queryKey: settingsKeys.privacy,
    read: fetchPrivacy,
    write: patchPrivacy,
    valueOf: privacyOn,
  });
  const blocked = useQuery({ queryKey: settingsKeys.blocked, queryFn: fetchBlocked });
  const exports = useQuery({ queryKey: settingsKeys.exports, queryFn: fetchExports });
  const client = useQueryClient();
  const [asking, setAsking] = useState(false);
  const ask = useMutation({
    mutationFn: requestExport,
    onSuccess: () => client.invalidateQueries({ queryKey: settingsKeys.exports }),
  });
  const { query } = switches;
  const problem = loadProblem(query.error);
  const state = exportStateOf(exports.data);

  return (
    <SettingsFrame title="Privacy" onBack={onBack} gap={BODY_GAP} testID="privacy-screen">
      {query.data ? (
        <>
          <SwitchGroups
            groups={PRIVACY_GROUPS}
            valueOf={switches.isOn}
            busy={switches.busy}
            onChange={(key, next) => void switches.set(key, next)}
            testIDPrefix="privacy"
          />
          {switches.failure ? (
            <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="privacy-problem">
              {switches.failure}
            </Text>
          ) : null}
          <GroupedList testID="privacy-links">
            <ListRow
              testID="privacy-blocked"
              lead={<IconTile icon="Ban" size={ROW_TILE} />}
              title="Blocked accounts"
              subtitle={blocked.data ? (blocked.data.total === 0 ? NOBODY_BLOCKED : String(blocked.data.total)) : undefined}
              onPress={onOpenBlocked}
            />
            <ListRow
              testID="privacy-export"
              lead={<IconTile icon="Download" size={ROW_TILE} />}
              title="Download my data"
              subtitle={exportLineOf(state)}
              onPress={() => {
                ask.reset();
                setAsking(true);
              }}
            />
            <ListRow testID="privacy-policy" lead={<IconTile icon="Shield" size={ROW_TILE} />} title="Privacy policy" onPress={onOpenPolicy} />
          </GroupedList>
        </>
      ) : query.isError ? (
        <ErrorState
          testID="privacy-error"
          icon={problem.icon}
          title={problem.title}
          message={problem.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <SwitchesLoading cards={CARD_SIZES} testID="privacy-loading" />
      )}
      <ExportSheet
        visible={asking}
        state={state}
        busy={ask.isPending}
        problem={ask.isError ? sentenceOf(ask.error, 'That did not send. Try again.') : null}
        onSend={() => ask.mutate(undefined, { onSuccess: () => setAsking(false) })}
        onClose={() => setAsking(false)}
      />
    </SettingsFrame>
  );
}
