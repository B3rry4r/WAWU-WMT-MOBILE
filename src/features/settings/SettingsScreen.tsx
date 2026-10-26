import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card, GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon, VerifiedTick } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { fetchMe, fetchTgif, patchTgif, settingsKeys, type Me, type TgifPreference } from './api/hub';
import { THEME_LABEL, useDevicePrefs } from './devicePrefs';
import { sentenceOf } from './failure';
import { ROW_TILE } from './metrics';
import { maskPhone } from './phone';
import { ScreenFrame } from '@/components/ScreenFrame';
import { useSignedIn } from './sessionGuard';
import { signOutOfThisPhone } from './signOutFlow';
import { switchMetrics } from '@/components/Switch';
import { SwitchRow, switchRowMetrics } from '@/components/SwitchRow';
import { ThemeSheet } from './ThemeSheet';
import { useSwitches } from './useSwitches';
import { fetchPointsSettings, pointsSettingsKey, putPointsSettings, type PointsSettings } from '@/features/points/walletUseApi';

/** design/_gen/settings.js line 11 (Z2): the parts 12 apart. */
const BODY_GAP = 12;
/** Line 11: the header card is padded 12 by 14, its avatar is 52, 12 between avatar and words, the name 16 at 600 with a 15 tick 5 away, the line 13, 2 under it, the chevron 17. */
const headerMetrics = { padV: 12, padH: 14, avatar: 52, between: 12, name: 16, tick: 15, tickGap: 5, line: 13, lineGap: 2, chevron: 17 } as const;
/** Line 11, the Theme row: 56 high, a 15 title at 600, its value at 14 with a 17 chevron. */
const themeRow = { minHeight: 56, title: 15, valueSize: 14, chevron: 17 } as const;
/** Line 11, the foot of the page: Sign out 15 at 600 in the danger colour, 14 between it and the next line, 4 above and below; "Delete account" under it at 13.5 in the muted colour. */
const footMetrics = { padV: 4, signOut: 15, between: 14, deleteAccount: 13.5 } as const;

/**
 * Z2's TGIF switch (R-59, DV2-06): it means "send me TGIF each morning" (HOME-16 sends the notice).
 * The line names no time of day: the notice time is an admin setting on the Hub, and `GET /settings/tgif`
 * does not serve it, so a time is not written here.
 */
export const TGIF_TITLE = 'TGIF each morning';
export const TGIF_SUBTITLE = 'Daily verse and prayer, as a notification';

/**
 * G-POINTS-07-1: where "Use wallet" is switched (`GET` and `PUT /me/points/settings`). No board draws the row, so it is the TGIF switch's own
 * look, in the same group; the line says what the switch does, and nothing is taken from the wallet by switching it.
 */
export const USE_WALLET_TITLE = 'Use wallet for AI tools';
export const USE_WALLET_SUBTITLE = 'Pay for missing points from your wallet';

/** Said when the phone is signed out in memory but its secure store would not give up the saved sign-in. */
export const STORE_REFUSED = 'You are signed out, but this phone could not remove your saved sign-in. Tap Sign out to try again.';

export type SettingsScreenProps = {
  onBack: () => void;
  /** The header card: opens the person's own details (Edit profile). */
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenPrivacy: () => void;
  onOpenPassword: () => void;
  /** Your tier (VF14, VERIFY-05): the tier the person holds, or the way to get one. The row is drawn only when the route gives a place to go. */
  onOpenTier?: () => void;
  /** The launch access code screen (JOIN-03): claim the plan an event registration paid for. The row is drawn only when the route gives a place to go. */
  onOpenClaimCode?: () => void;
  /** Wallet and PIN: W35 (WALLET-06). The row is drawn only when the screen has somewhere to open it (the route gives it). */
  onOpenWallet?: () => void;
  /** Accounts and currencies (R-93 D3, FX-POLISH M1): the accounts held, and Add a currency. The route gives it only to a person with a wallet; without it the row is not drawn. */
  onOpenAccounts?: () => void;
  /** Delete account (Z6, SETTINGS-05): the muted line under Sign out. Drawn only when the route gives a place to go. */
  onOpenDeleteAccount?: () => void;
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenPolicy: () => void;
  /** The Legal list (LEGAL-DOCS): the owner's nine documents. The row is drawn only where this is given. */
  onOpenLegal?: () => void;
  /** After the phone has signed out: leaves Settings, which the route graph does not guard (SHARED-CHANGES SETTINGS-01 #3). */
  onSignedOut: () => void;
};

/**
 * Z2 · Settings. The header card is read from `GET /users/me`; TGIF is `GET` and `PATCH /settings/tgif`
 * (the Hub holds it, so it follows the person to another phone); Sound and Theme are this phone's own
 * choices and are kept on it. Wallet and PIN is WALLET-06's (W35, no tier: BRIEF, Z2), and Delete account (SETTINGS-05, Z6) is the muted
 * line under Sign out, each where Z2 draws it.
 */
export function SettingsScreen(props: SettingsScreenProps) {
  const signedIn = useSignedIn();
  const me = useQuery({ queryKey: settingsKeys.me, queryFn: fetchMe, enabled: signedIn });
  const tgif = useSwitches<'show', TgifPreference>({
    queryKey: settingsKeys.tgif,
    read: fetchTgif,
    write: (patch) => patchTgif(patch.show === true),
    valueOf: (settings) => settings.show,
  });
  const useWallet = useSwitches<'useWallet', PointsSettings>({
    queryKey: pointsSettingsKey,
    read: fetchPointsSettings,
    write: (patch) => putPointsSettings(patch.useWallet === true),
    valueOf: (settings) => settings.useWallet,
  });
  const { prefs, setSound, setTheme, ensurePrefs } = useDevicePrefs();
  const [choosingTheme, setChoosingTheme] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const signingOut = useRef(false);

  useEffect(() => {
    void ensurePrefs();
  }, [ensurePrefs]);

  const signOut = async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    setLeaving(true);
    setProblem(null);
    try {
      const { storeCleared } = await signOutOfThisPhone();
      if (storeCleared) props.onSignedOut();
      else setProblem(STORE_REFUSED);
    } catch (error) {
      setProblem(sentenceOf(error, 'You could not be signed out. Try again.'));
    } finally {
      signingOut.current = false;
      setLeaving(false);
    }
  };

  return (
    <ScreenFrame idPrefix="settings" title="Settings" onBack={props.onBack} gap={BODY_GAP} testID="settings-screen">
      <Header me={me.data} loading={me.isPending} onOpen={props.onOpenProfile} onRetry={() => void me.refetch()} />
      <GroupedList testID="settings-account">
        <ListRow testID="settings-notifications" lead={<IconTile icon="Bell" size={ROW_TILE} />} title="Notifications" onPress={props.onOpenNotifications} />
        <ListRow testID="settings-privacy" lead={<IconTile icon="Lock" size={ROW_TILE} />} title="Privacy" onPress={props.onOpenPrivacy} />
        <ListRow testID="settings-password" lead={<IconTile icon="KeyRound" size={ROW_TILE} />} title="Password" onPress={props.onOpenPassword} />
        {props.onOpenTier ? <ListRow testID="settings-tier" lead={<IconTile icon="BadgeCheck" size={ROW_TILE} />} title="Your tier" onPress={props.onOpenTier} /> : null}
        {props.onOpenClaimCode ? (
          <ListRow testID="settings-claim-code" lead={<IconTile icon="Ticket" size={ROW_TILE} />} title="Access code" subtitle="Claim a plan you paid for at an event" onPress={props.onOpenClaimCode} />
        ) : null}
        {props.onOpenWallet ? (
          <ListRow
            testID="settings-wallet"
            lead={<IconTile icon="Wallet" size={ROW_TILE} />}
            title="Wallet and PIN"
            subtitle="PIN and account details"
            onPress={props.onOpenWallet}
          />
        ) : null}
        {props.onOpenAccounts ? (
          <ListRow
            testID="settings-accounts"
            lead={<IconTile icon="Coins" size={ROW_TILE} />}
            title="Accounts and currencies"
            subtitle="Your accounts, and add a currency"
            onPress={props.onOpenAccounts}
          />
        ) : null}
      </GroupedList>
      <GroupedList testID="settings-preferences">
        {tgif.query.data ? (
          <SwitchRow
            testID="settings-tgif"
            title={TGIF_TITLE}
            subtitle={TGIF_SUBTITLE}
            on={tgif.isOn('show')}
            busy={tgif.busy.includes('show')}
            onChange={(next) => void tgif.set('show', next)}
          />
        ) : (
          <PendingRow testID="settings-tgif-pending" title={TGIF_TITLE} subtitle={TGIF_SUBTITLE} failed={tgif.query.isError} onRetry={() => void tgif.query.refetch()} />
        )}
        <SwitchRow testID="settings-sound" title="Sound" subtitle="Taps and alerts" on={prefs.sound} onChange={(next) => void setSound(next)} />
        {useWallet.query.data ? (
          <SwitchRow
            testID="settings-use-wallet"
            title={USE_WALLET_TITLE}
            subtitle={USE_WALLET_SUBTITLE}
            on={useWallet.isOn('useWallet')}
            busy={useWallet.busy.includes('useWallet')}
            onChange={(next) => void useWallet.set('useWallet', next)}
          />
        ) : (
          <PendingRow testID="settings-use-wallet-pending" title={USE_WALLET_TITLE} subtitle={USE_WALLET_SUBTITLE} failed={useWallet.query.isError} onRetry={() => void useWallet.query.refetch()} />
        )}
        <ThemeRow value={THEME_LABEL[prefs.theme]} onPress={() => setChoosingTheme(true)} />
      </GroupedList>
      {useWallet.failure ? (
        <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="settings-problem-use-wallet">
          {useWallet.failure}
        </Text>
      ) : null}
      {tgif.failure ? (
        <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="settings-problem-tgif">
          {tgif.failure}
        </Text>
      ) : null}
      <GroupedList testID="settings-about">
        <ListRow testID="settings-about-app" lead={<IconTile icon="Info" size={ROW_TILE} />} title="About Who Made This?" onPress={props.onOpenAbout} />
        <ListRow testID="settings-terms" lead={<IconTile icon="FileText" size={ROW_TILE} />} title="Terms" onPress={props.onOpenTerms} />
        <ListRow testID="settings-policy" lead={<IconTile icon="Shield" size={ROW_TILE} />} title="Privacy policy" onPress={props.onOpenPolicy} />
        {props.onOpenLegal ? <ListRow testID="settings-legal" lead={<IconTile icon="Scale" size={ROW_TILE} />} title="Legal" onPress={props.onOpenLegal} /> : null}
      </GroupedList>
      <View style={styles.foot}>
        <Pressable
          testID="settings-sign-out"
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityState={{ busy: leaving }}
          disabled={leaving}
          onPress={() => void signOut()}
        >
          <Text variant="body" tone="danger" style={[font(600), { fontSize: footMetrics.signOut }]}>
            {leaving ? 'Signing out' : 'Sign out'}
          </Text>
        </Pressable>
        {problem ? (
          <Text variant="errorLine" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="settings-problem">
            {problem}
          </Text>
        ) : null}
        {props.onOpenDeleteAccount ? (
          <Pressable testID="settings-delete-account" accessibilityRole="button" accessibilityLabel="Delete account" hitSlop={space.sm} onPress={props.onOpenDeleteAccount}>
            <Text variant="secondary" tone="textMuted" style={{ fontSize: footMetrics.deleteAccount, lineHeight: canvasNormalLineHeight(footMetrics.deleteAccount) }}>
              Delete account
            </Text>
          </Pressable>
        ) : null}
      </View>
      <ThemeSheet
        visible={choosingTheme}
        value={prefs.theme}
        onPick={(choice) => {
          void setTheme(choice);
          setChoosingTheme(false);
        }}
        onClose={() => setChoosingTheme(false)}
      />
    </ScreenFrame>
  );
}

type HeaderProps = { me: Me | undefined; loading: boolean; onOpen: () => void; onRetry: () => void };

/** Name, tick, email and masked phone, from the account. While it loads it is a quiet card; if it fails it says so and can retry. */
function Header({ me, loading, onOpen, onRetry }: HeaderProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  if (!me) {
    return (
      <Card style={styles.header} testID="settings-header-pending">
        <Skeleton width={headerMetrics.avatar} height={headerMetrics.avatar} radius={radius.chip} />
        <View style={styles.headerWords}>
          {loading ? (
            <>
              <Skeleton width="55%" height={headerMetrics.name} radius={radius.chip} />
              <Skeleton width="75%" height={headerMetrics.line} radius={radius.chip} />
            </>
          ) : (
            <Pressable testID="settings-header-retry" accessibilityRole="button" accessibilityLabel="Your details did not load. Try again" onPress={onRetry}>
              <Text variant="body" style={[font(600), { fontSize: headerMetrics.name }]}>
                Your details did not load
              </Text>
              <Text variant="secondary" tone="accentFg" style={styles.headerLine}>
                Try again
              </Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  }
  const name = [me.firstName, me.lastName].filter(Boolean).join(' ');
  const tick = me.verification.creator.verified ? 'creator' : me.verification.professional.verified ? 'pro' : null;
  const line = [me.email, maskPhone(me.phone)].filter(Boolean).join(' · ');
  return (
    <Pressable
      testID="settings-header"
      accessibilityRole="button"
      accessibilityLabel={[name, line].filter(Boolean).join(', ')}
      onPress={onOpen}
      {...ring.handlers}
      style={ring.style}
    >
      <Card style={styles.header}>
        <Avatar name={name} size={headerMetrics.avatar} source={me.avatarUrl ?? undefined} decorative />
        <View style={styles.headerWords}>
          <View style={styles.nameLine}>
            <Text variant="body" style={[font(600), styles.name]}>
              {name}
            </Text>
            {tick ? <VerifiedTick kind={tick} size={headerMetrics.tick} /> : null}
          </View>
          {line ? (
            <Text variant="secondary" tone="textMuted" style={styles.headerLine}>
              {line}
            </Text>
          ) : null}
        </View>
        <Icon name="ChevronRight" size={headerMetrics.chevron} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

type PendingRowProps = { testID: string; title: string; subtitle: string; failed: boolean; onRetry: () => void };

/** A switch whose value has not come back from the Hub: loading, or failed with a way to try again. It never guesses a value. */
function PendingRow({ testID, title, subtitle, failed, onRetry }: PendingRowProps) {
  if (!failed) {
    return (
      <View testID={testID} accessible accessibilityRole="progressbar" accessibilityLabel={`${title}, loading`} style={styles.pending}>
        <View style={styles.pendingWords}>
          <Text variant="body" style={[font(600), styles.pendingTitle]}>
            {title}
          </Text>
          <Text variant="secondary" tone="textMuted">
            {subtitle}
          </Text>
        </View>
        <Skeleton width={switchMetrics.width} height={switchMetrics.height} radius={radius.chip} />
      </View>
    );
  }
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${title} did not load. Try again`} onPress={onRetry} style={styles.pending}>
      <View style={styles.pendingWords}>
        <Text variant="body" style={[font(600), styles.pendingTitle]}>
          {title}
        </Text>
        <Text variant="secondary" tone="accentFg">
          Could not load. Try again
        </Text>
      </View>
    </Pressable>
  );
}

function ThemeRow({ value, onPress }: { value: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="settings-theme"
      accessibilityRole="button"
      accessibilityLabel={`Theme, ${value}`}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.themeRow, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <Text variant="body" style={[font(600), { fontSize: themeRow.title, flex: 1 }]}>
        Theme
      </Text>
      <Text variant="body" tone="textMuted" testID="settings-theme-value" style={{ fontSize: themeRow.valueSize }}>
        {value}
      </Text>
      <Icon name="ChevronRight" size={themeRow.chevron} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: headerMetrics.between, paddingVertical: headerMetrics.padV, paddingHorizontal: headerMetrics.padH },
  headerWords: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: headerMetrics.tickGap },
  name: { fontSize: headerMetrics.name, lineHeight: canvasNormalLineHeight(headerMetrics.name), flexShrink: 1 },
  headerLine: { fontSize: headerMetrics.line, lineHeight: canvasNormalLineHeight(headerMetrics.line), marginTop: headerMetrics.lineGap },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: themeRow.minHeight },
  pending: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: switchRowMetrics.minHeight, paddingVertical: switchRowMetrics.padV },
  pendingWords: { flex: 1, minWidth: 0 },
  pendingTitle: { fontSize: switchRowMetrics.title, lineHeight: canvasNormalLineHeight(switchRowMetrics.title) },
  foot: { alignItems: 'center', gap: footMetrics.between, paddingVertical: footMetrics.padV },
});
