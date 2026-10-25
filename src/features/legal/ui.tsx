import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenFrame } from '@/components/ScreenFrame';
import { layout, useWawu } from '@/theme';

import { matterMetrics as m } from './look2';

/**
 * The frame the booking and matter screens share: the bar (a round back button and the title centred), the scrolling body, and, when the
 * screen has one, the foot (a full button standing on the page, as `foot(Btn(...))` draws it).
 */
export function LegalFrame({
  title,
  onBack,
  foot,
  keyboard,
  testID,
  children,
}: {
  title: string;
  onBack: () => void;
  foot?: ReactNode;
  keyboard?: boolean;
  testID: string;
  children: ReactNode;
}) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScreenFrame title={title} onBack={onBack} gap={m.bodyGap} idPrefix={testID} keyboard={keyboard} titleLines={2}>
        {children}
      </ScreenFrame>
      {foot ? <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, m.footBottom) }]}>{foot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  foot: { paddingTop: m.footTop, paddingHorizontal: layout.gutter },
});
