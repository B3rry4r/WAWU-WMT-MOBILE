import type { ReactNode } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFootBottom } from '@/components/FieldScroll';
import { ScreenFrame } from '@/components/ScreenFrame';
import { layout, useWawu } from '@/theme';

import { matterMetrics as m } from './look2';

/**
 * The frame the booking and matter screens share: the bar (a round back button and the title centred), the scrolling body, and, when the
 * screen has one, the foot (a full button standing on the page, as `foot(Btn(...))` draws it).
 * R-117 part B: a screen with a field (`keyboard`) is padded by the keyboard as a whole, foot included, so the Continue button sits on the
 * keyboard (the bar and the body used to be padded alone, and the foot, under them, went under the keyboard).
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
  const footBottom = useFootBottom(Math.max(insets.bottom, m.footBottom));
  const Root = keyboard ? KeyboardAvoidingView : View;
  return (
    <Root testID={testID} {...(keyboard ? { behavior: 'padding' as const } : {})} style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScreenFrame title={title} onBack={onBack} gap={m.bodyGap} idPrefix={testID}>
        {children}
      </ScreenFrame>
      {foot ? <View style={[styles.foot, { paddingBottom: footBottom }]}>{foot}</View> : null}
    </Root>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  foot: { paddingTop: m.footTop, paddingHorizontal: layout.gutter },
});
