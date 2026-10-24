import type { NotificationSettings, PrivacySettings } from './api/hub';

/**
 * The switches Z3 and Z4 draw, in the order they are drawn, and the Hub key each one saves.
 * Copy is the canvas's own (design/_gen/settings.js lines 14 and 15), with "WAWU" written as the
 * app's name where it names the sender (DECISIONS R-37, "Copy: where the app's name changes").
 */
export type NotificationKey = 'moneyIn' | 'refunds' | 'dmReminders' | 'communityMessages' | 'contentReviews' | 'newFollowers' | 'promotions';
export type PrivacyKey = 'showPurchases' | 'showSavedItems' | 'showFollowing' | 'showInMemberLists';

export type SwitchSpec<K extends string> = {
  key: K;
  title: string;
  /** A fixed line under the title, or one that follows the switch ("Off, nobody sees your purchases"; none when on). */
  subtitle?: string | ((on: boolean) => string | undefined);
};

export type SwitchGroup<K extends string> = { title: string; switches: readonly SwitchSpec<K>[] };

export const NOTIFICATION_GROUPS: readonly SwitchGroup<NotificationKey>[] = [
  {
    title: 'Money',
    switches: [
      { key: 'moneyIn', title: 'Money in', subtitle: 'Tips, sales, transfers' },
      { key: 'refunds', title: 'Refunds' },
    ],
  },
  {
    title: 'Messages',
    switches: [
      { key: 'dmReminders', title: 'Paid questions', subtitle: 'Including reply deadlines' },
      { key: 'communityMessages', title: 'Community messages' },
    ],
  },
  {
    title: 'Content',
    switches: [
      { key: 'contentReviews', title: 'Reviews', subtitle: 'Approved or sent back' },
      { key: 'newFollowers', title: 'New followers' },
      { key: 'promotions', title: 'From Who Made This?', subtitle: 'News and offers' },
    ],
  },
];

export const PRIVACY_GROUPS: readonly SwitchGroup<PrivacyKey>[] = [
  {
    title: 'Your profile',
    switches: [
      {
        key: 'showPurchases',
        title: 'Show what I have bought',
        // Only the off line is drawn, and it is the one that is true: the Hub shows nobody's purchases to anyone (BACKEND_GAPS G-261), so no line promises more when on.
        subtitle: (on) => (on ? undefined : 'Off, nobody sees your purchases'),
      },
      { key: 'showSavedItems', title: 'Show my saved items' },
      { key: 'showFollowing', title: 'Show who I follow' },
    ],
  },
  {
    title: 'Communities',
    switches: [{ key: 'showInMemberLists', title: 'Show me in member lists', subtitle: 'Your messages are visible either way' }],
  },
];

/**
 * A notification key the Hub has never held (`moneyIn`, `contentReviews` and `communityMessages` are
 * absent until first set, SETTINGS-07) means the person never switched it, so it is on.
 */
export function notificationOn(settings: NotificationSettings, key: NotificationKey): boolean {
  const value = settings[key];
  return typeof value === 'boolean' ? value : true;
}

export function privacyOn(settings: PrivacySettings, key: PrivacyKey): boolean {
  return settings[key];
}

export function subtitleOf(spec: SwitchSpec<string>, on: boolean): string | undefined {
  return typeof spec.subtitle === 'function' ? spec.subtitle(on) : spec.subtitle;
}
