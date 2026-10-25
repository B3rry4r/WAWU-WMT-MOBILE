import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import type { IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { StatusPill } from '@/components/StatusPill';
import { ROW_TILE } from '@/features/settings/metrics';
import type { Allowance } from '@/features/create/api';
import type { Plans } from '@/features/verify/purchaseApi';
import { higherTiers, lengthOf, priceIn } from '@/features/verify/purchaseModel';

import { givesOf, type GiveRow, type TierRow } from './model';

const GIVE_ICONS: Record<GiveRow['id'], IconName> = { uploads: 'Upload', space: 'HardDrive', reach: 'TrendingUp', tick: 'BadgeCheck' };

/**
 * The row that leads to a tick (M16, M17: "Get it"), worked out from the Hub's own tiers (`GET /plans`): for a person with no running
 * tier the cheapest tier, with its name, price (in the currency the Hub gave) and length; for one with a tier running, the step up
 * (the store works out what moving up costs, R-86) while a higher tier exists. Null when the Hub gave no tiers or there is nothing above the tier held.
 */
export function getTickOf(plans: Plans | null, heldId: string | null): { title: string; line: string; button: string } | null {
  if (!plans || plans.tiers.length === 0) return null;
  if (heldId) {
    return higherTiers(plans.tiers, heldId).length > 0 ? { title: 'Move up a tier', line: 'The store works out what moving up costs', button: 'Upgrade' } : null;
  }
  const cheapest = [...plans.tiers].sort((a, b) => a.priceMinor - b.priceMinor)[0];
  return { title: 'Get your tick', line: `${cheapest.name} · ${priceIn(cheapest.priceMinor, plans.currency)} for ${lengthOf(cheapest)}`, button: 'Get it' };
}

export type GetTick = NonNullable<ReturnType<typeof getTickOf>>;

export type TicksSectionProps = {
  /** The tier the person holds, already in words (`tierRow`), or null. */
  held: TierRow | null;
  /** The way to get or raise a tick (`getTickOf`), or null when there is none to offer. */
  get: GetTick | null;
  onGetTick: () => void;
};

/** M16 and M17's "Your ticks": the tier held, then the way to get or raise one. Nothing is drawn that the Hub did not say. */
export function TicksRows({ held, get, onGetTick }: TicksSectionProps) {
  if (!held && !get) return null;
  return (
    <GroupedList>
      {held ? (
        <ListRow
          testID="verification-held"
          lead={<IconTile icon="BadgeCheck" tone="accent" size={ROW_TILE} />}
          title={held.title}
          subtitle={held.line ?? undefined}
          trailing={<StatusPill label={held.pill} tone={held.pillTone} icon={held.pillTone === 'positive' ? 'Check' : undefined} />}
        />
      ) : null}
      {get ? (
        <ListRow
          testID="verification-get-tick"
          lead={<IconTile icon="BadgeCheck" tone="neutral" size={ROW_TILE} />}
          title={get.title}
          subtitle={get.line}
          subtitleLines={0}
          trailing={<Button testID="verification-get-tick-button" label={get.button} size="sm" onPress={onGetTick} />}
        />
      ) : null}
    </GroupedList>
  );
}

/** M16 and M17's "Every tick gives you": the uploads and library space from the Hub's allowance, then the two lines that carry no figure. */
export function GivesRows({ allowance }: { allowance: Allowance | null }) {
  return (
    <GroupedList testID="verification-gives">
      {givesOf(allowance).map((row) => (
        <ListRow key={row.id} testID={`verification-gives-${row.id}`} lead={<IconTile icon={GIVE_ICONS[row.id]} size={ROW_TILE} />} title={row.title} subtitle={row.line ?? undefined} subtitleLines={0} />
      ))}
    </GroupedList>
  );
}
