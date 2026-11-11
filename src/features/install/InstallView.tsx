import { ScrollView, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import type { IconName } from '@/components/icon';
import { layout, space, useWawu } from '@/theme';

import type { InstallContext } from './detect';

export type InstallViewProps = {
  context: InstallContext;
  /** The browser has offered its own install (`beforeinstallprompt`): the Install button is drawn. */
  canPrompt: boolean;
  /** An iPad: its Share button is at the top of Safari. */
  ipad?: boolean;
  /** The person accepted the browser's install, or the browser said the app was installed. */
  installed?: boolean;
  /** "Link copied" is showing. */
  copied: boolean;
  onInstall: () => void;
  onCopy: () => void;
  onContinue: () => void;
};

type Step = { icon: IconName; text: string };

/** The steps for an iPhone or iPad in Safari (the pictures are the app's own icons: the Share glyph Safari draws, the plus tile). */
export const IOS_STEPS: Step[] = [
  { icon: 'Share', text: 'Tap Share, the square with an arrow, at the bottom of Safari.' },
  { icon: 'Plus', text: 'Scroll down and tap Add to Home Screen.' },
  { icon: 'Smartphone', text: 'Tap Add. Who Made This now opens from your home screen.' },
];

export const IPAD_SHARE = 'Tap Share, the square with an arrow, at the top of Safari.';

export const DOCK_STEPS: Step[] = [
  { icon: 'File', text: 'Choose File in the menu bar.' },
  { icon: 'Plus', text: 'Choose Add to Dock.' },
  { icon: 'CircleCheck', text: 'Click Add. Who Made This now opens from your Dock.' },
];

export const MENU_STEPS: Step[] = [
  { icon: 'Ellipsis', text: 'Open your browser menu, the three dots.' },
  { icon: 'Download', text: 'Tap Install app or Add to Home screen.' },
  { icon: 'Smartphone', text: 'Open Who Made This from your home screen.' },
];

function inAppBrowser(context: Extract<InstallContext, { kind: 'inapp' }>): string {
  return context.os === 'ios' ? 'Safari' : 'Chrome';
}

/** What the screen says for each place the person opened it in (R-131). */
export function copyFor(context: InstallContext, canPrompt: boolean, installed: boolean, ipad = false) {
  if (installed) {
    return { title: 'Who Made This is on your device', body: 'Open it from its icon from now on. You can also carry on here.', steps: [] as Step[], copy: false };
  }
  switch (context.kind) {
    case 'inapp': {
      const browser = inAppBrowser(context);
      const where = context.app === 'another app' ? 'this app' : context.app;
      return {
        title: `Open this link in ${browser}`,
        body: `${where === 'this app' ? 'This app' : where} opens links in its own small browser, which cannot put Who Made This on your home screen. Copy the link, then paste it in ${browser}.`,
        steps: [] as Step[],
        copy: true,
      };
    }
    case 'ios-safari':
      return {
        title: 'Put Who Made This on your home screen',
        body: 'Open it from its own icon, like an app.',
        steps: ipad ? [{ ...IOS_STEPS[0], text: IPAD_SHARE }, ...IOS_STEPS.slice(1)] : IOS_STEPS,
        copy: false,
      };
    case 'mac-safari':
      return { title: 'Add Who Made This to your Dock', body: 'Open it from its own icon, like an app.', steps: DOCK_STEPS, copy: false };
    case 'ios-other':
      return {
        title: 'Open this link in Safari',
        body: 'On an iPhone or iPad, Safari puts apps on the home screen. Copy the link, then paste it in Safari.',
        steps: [] as Step[],
        copy: true,
      };
    case 'chromium':
      return canPrompt || context.os === 'desktop'
        ? { title: 'Install Who Made This', body: 'Open it from its own icon, like an app.', steps: [] as Step[], copy: false }
        : { title: 'Put Who Made This on your home screen', body: 'Open it from its own icon, like an app.', steps: MENU_STEPS, copy: false };
    default:
      // Standalone and a browser that cannot install never reach the screen (the gate steps aside).
      return { title: 'Install Who Made This', body: 'Open it from its own icon, like an app.', steps: [] as Step[], copy: false };
  }
}

/** WEBAPP-11 (R-131): the install screen. No board draws it (design gap filed, R-29), so it is built from the shared parts. */
export function InstallView({ context, canPrompt, ipad, installed = false, copied, onInstall, onCopy, onContinue }: InstallViewProps) {
  const { colors } = useWawu();
  const c = copyFor(context, canPrompt, installed, ipad);
  return (
    <ScrollView
      testID="install-screen"
      style={{ backgroundColor: colors.surfacePage }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.column}>
        <View style={styles.brand}>
          <BrandMark layout="submark" width={72} />
        </View>
        <Text variant="title" style={styles.center} testID="install-title">
          {c.title}
        </Text>
        <Text variant="secondary" style={[styles.center, styles.body]} testID="install-body">
          {c.body}
        </Text>

        {c.steps.length > 0 ? (
          <Card padded style={styles.steps} testID="install-steps">
            {c.steps.map((s, i) => (
              <View key={s.text} style={styles.step}>
                <IconTile icon={s.icon} tone="accent" shape="square" size={40} />
                <View style={styles.stepText}>
                  <Text variant="label" tone="textMuted">{`Step ${i + 1}`}</Text>
                  <Text variant="body">{s.text}</Text>
                </View>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={styles.actions}>
          {!installed && context.kind === 'chromium' && canPrompt ? (
            <Button label="Install" icon="Download" onPress={onInstall} full testID="install-button" />
          ) : null}
          {c.copy ? (
            <Button
              label={copied ? 'Link copied' : 'Copy link'}
              icon={copied ? 'Check' : 'Copy'}
              onPress={onCopy}
              variant="secondary"
              full
              testID="install-copy"
            />
          ) : null}
        </View>

        <Button label="Continue in the browser" variant="outline" size="md" onPress={onContinue} testID="install-continue" style={styles.continue} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: layout.gutter, paddingVertical: space.s3xl },
  column: { width: '100%', maxWidth: layout.screenW, alignSelf: 'center', alignItems: 'stretch', gap: space.md },
  brand: { alignItems: 'center', marginBottom: space.md },
  center: { textAlign: 'center' },
  body: { marginBottom: space.md },
  steps: { gap: space.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepText: { flex: 1, gap: space.xs },
  actions: { gap: space.md, marginTop: space.md },
  continue: { alignSelf: 'center', marginTop: space.md },
});
