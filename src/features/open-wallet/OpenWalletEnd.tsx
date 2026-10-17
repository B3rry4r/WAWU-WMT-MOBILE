import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import type { IconName } from '@/components/icon';
import { IconTile, type IconTileTone } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, space, type } from '@/theme';

import { AuthFrame } from '@/features/auth/AuthFrame';

/**
 * design/_gen/kit.js line 67, `result`: an 88 circle with a 42 glyph at 2.2,
 * 10 between the parts, the title 8 further down, the line at 14.5. The canvas
 * sits it 80 down a screen with no bar (auth.js `verified`, `pt: 80`).
 */
const RESULT = { circle: 88, glyphStroke: 2.2, stack: 10, titleNudge: 8, line: 14.5, top: 80, extraGap: 20 } as const;

export type OpenWalletEndProps = {
  tone: IconTileTone;
  icon: IconName;
  title: string;
  message: string;
  /** Under the message (the confirmed step's masked numbers). */
  children?: ReactNode;
  actionLabel: string;
  onAction: () => void;
  /** An arrow after the label (A8's "Create your transaction PIN", kit `Btn` `iconRight`). */
  actionIcon?: IconName;
  /** A second, quieter way on, under the first (the refused opening's Done beside "Check my details"). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** With a way back (the confirmed check, seen again from A5): the bar with its back button and title, as A5 draws its own. */
  onBack?: () => void;
  navTitle?: string;
  /** Space above the result and between it and what follows, where a screen draws its own (A8: `pt: 60`, `gap: 18`). */
  top?: number;
  between?: number;
  testID?: string;
};

/**
 * Where Open your wallet stops on its first step: not available to this
 * account, a wallet already open or still opening, or the BVN confirmed. The
 * canvas's result layout (Email verified, KYC submitted): one way on, never a
 * dead end.
 */
export function OpenWalletEnd({
  tone,
  icon,
  title,
  message,
  children,
  actionLabel,
  onAction,
  actionIcon,
  secondaryLabel,
  onSecondary,
  onBack,
  navTitle,
  top,
  between,
  testID,
}: OpenWalletEndProps) {
  return (
    <AuthFrame
      testID={testID}
      bare={!onBack}
      onBack={onBack}
      navTitle={navTitle}
      contentTop={top ?? (onBack ? undefined : RESULT.top)}
      footer={
        <>
          <Button label={actionLabel} iconRight={actionIcon} full onPress={onAction} testID="open-wallet-end-action" />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} variant="secondary" full onPress={onSecondary} testID="open-wallet-end-secondary" />
          ) : null}
        </>
      }
    >
      <View style={[styles.stack, between !== undefined && { gap: between }]}>
        <View style={styles.result}>
          <IconTile icon={icon} tone={tone} size={RESULT.circle} strokeWidth={RESULT.glyphStroke} />
          <Text variant="title" style={styles.title}>
            {title}
          </Text>
          <Text variant="secondary" style={styles.line}>
            {message}
          </Text>
        </View>
        {children}
      </View>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  stack: { gap: RESULT.extraGap },
  result: { alignItems: 'center', gap: RESULT.stack, paddingHorizontal: space.sm },
  /** The kit sets no line height on either line (`normal`). */
  title: { marginTop: RESULT.titleNudge, textAlign: 'center', lineHeight: canvasNormalLineHeight(type.size.title) },
  line: { fontSize: RESULT.line, lineHeight: canvasNormalLineHeight(RESULT.line), textAlign: 'center' },
});
