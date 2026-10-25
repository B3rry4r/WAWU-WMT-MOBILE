/**
 * Every kind the Hub writes to a notification (backend `NotificationKind` in `src/notification/notification-event.ts`
 * and `PUSH_RULE` in `src/push/push-policy.ts`, `origin/main` `b2f4df6`, 23 Oct 2026, plus `community_messages` from FIX-105, R-81). The contract types `kind` as a plain
 * string, so this list is where the app names them. A kind the Hub adds is added here and in `features/push/routes.ts`;
 * the test in `__tests__/everyKind.test.ts` fails until the new kind opens a screen.
 */
export const HUB_NOTIFICATION_KINDS = [
  'sale',
  'tip_received',
  'dm_received',
  'dm_deadline',
  'dm_refunded',
  'paid_dm_warning',
  'paid_dm_paused',
  'credits_low',
  'new_follower',
  'content_published',
  'content_rejected',
  'review_received',
  'kyc_verified',
  'verify_reminder',
  'identity_review',
  'campaign',
  'community_join_approved',
  'community_join_declined',
  'community_pass_ending',
  'community_pass_refunded',
  'community_messages',
  'legal_delivered',
  'legal_quote_ready',
  'legal_consultant_joined',
  'legal_consultation_booked',
  'tgif_daily',
  'money_in',
  'money_in_reversed',
  'wallet_ready',
] as const;

export type HubNotificationKind = (typeof HUB_NOTIFICATION_KINDS)[number];
