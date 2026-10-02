import { useState, useSyncExternalStore } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, hues } from '@/components/Avatar';
import { BrandMark } from '@/components/BrandMark';
import { BottomSheet } from '@/components/BottomSheet';
import { Button, IconButton } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { ConversationRow } from '@/components/ConversationRow';
import { Credits } from '@/components/Credits';
import { CurrencyFlag, type FlagCurrency } from '@/components/CurrencyFlag';
import { FilterChips } from '@/components/FilterChips';
import { Icon, VerifiedTick, type IconName } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { KeyValueRow, ListRow, ListSection } from '@/components/ListRow';
import { MediaCard } from '@/components/MediaCard';
import { Money } from '@/components/Money';
import { StatusPill, type PillTone } from '@/components/StatusPill';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Skeleton, SkeletonRows, LoadingView } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text, type TextVariant } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { TransactionRow } from '@/components/TransactionRow';
import { layout, radius, space, text, useWawu } from '@/theme';

const textVariants = Object.keys(text) as TextVariant[];
const flagCurrencies: FlagCurrency[] = ['NGN', 'USD', 'USDT', 'BTC'];
/** Sizes the board kit draws: W10's recipient (64), the kit default (44), list rows (40) and the wallet card coin (36). */
const avatarSizes = [64, 44, 36];
const flagSizes = [40, 36, 26];
/** A bundled picture, so the photo avatar draws without a network. */
const sampleAvatar = require('../../../assets/images/icon.png') as number;
const icons: IconName[] = [
  'ChevronLeft', 'ChevronRight', 'ArrowUpRight', 'Plus', 'Check', 'X', 'Search', 'Eye', 'EyeOff', 'Lock', 'Copy', 'Edit', 'Delete', 'CircleAlert',
  'LockOpen', 'Smartphone', 'Zap', 'ArrowDownLeft', 'Clock', 'HandCoins', 'FileDown', 'Settings2', 'SquarePen', 'CircleCheck', 'WifiOff',
  'RotateCw', 'SearchX',
];

const transactionFilters = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'Money in' },
  { value: 'out', label: 'Money out' },
  { value: 'bills', label: 'Bills' },
  { value: 'content', label: 'Content' },
] as const;
const inboxFilters = [
  { value: 'all', label: 'All' },
  { value: 'dm', label: 'Paid DMs · 1' },
  { value: 'communities', label: 'Communities' },
  { value: 'money', label: 'Money' },
] as const;
const eventKinds = [
  { value: 'all', label: 'All' },
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'concert', label: 'Concert' },
  { value: 'meetup', label: 'Meetup' },
] as const;
const eventWhen = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
] as const;
/** The kit's pills: wallet.js `StatusPill` (Completed, Pending, Failed, Frozen) plus the tones the other boards use. */
const pills: { label: string; tone: PillTone; icon?: IconName }[] = [
  { label: 'Completed', tone: 'positive', icon: 'Check' },
  { label: 'Pending', tone: 'warning', icon: 'Clock' },
  { label: 'Failed', tone: 'danger', icon: 'X' },
  { label: 'Frozen', tone: 'info', icon: 'Snowflake' },
  { label: 'WAWU pick', tone: 'accent' },
  { label: 'Removed', tone: 'neutral' },
  { label: 'Live', tone: 'positive' },
  { label: 'Reversed to your wallet', tone: 'positive', icon: 'RotateCcw' },
];
const statePicks = [
  { value: 'content', label: 'Content' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
] as const;
const viewPicks = [
  { value: 'today', label: 'Today' },
  { value: 'following', label: 'Following' },
  { value: 'foryou', label: 'For you' },
] as const;

/** The Explore loading view draws its hero 24 round; the theme has 22 (card) and 26 (money). Source: design/_gen/explore.js line 56 (`loading`). */
const loadingHeroRadius = 24;
const loadingHeroHeight = 196;
const loadingTile = 80;
const loadingBar = 20;
const loadingBarRadius = 8;
const stateBoxHeight = 260;
/** Space between the loading cards (design/_gen/explore.js, `loading`: gap 10). */
const cardGap = 10;
const loadingCard = { width: 150, height: 200 } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label">{title}</Text>
      {children}
    </View>
  );
}

/** Returns a press handler that records which control fired. */
type Mark = (name: string) => () => void;

/**
 * Which control was pressed last. Many sections write it and one caption reads
 * it, so it lives outside React state: a press re-renders the caption, not the page.
 */
function lastPressedStore() {
  let value = 'Nothing yet';
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: string) => {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
type LastPressedStore = ReturnType<typeof lastPressedStore>;

function LastPressed({ store }: { store: LastPressedStore }) {
  const last = useSyncExternalStore(store.subscribe, store.get);
  return <Text variant="caption">Last pressed: {last}</Text>;
}

/*
 * Each section that changes on a press holds its own state, so pressing one
 * re-renders that section and leaves the rest of the page alone.
 */

function LargeButtons({ mark, store }: { mark: Mark; store: LastPressedStore }) {
  const [saving, setSaving] = useState(false);
  return (
    <Section title="Buttons, large">
      <Button label="Continue" onPress={mark('Continue')} full />
      <LastPressed store={store} />
      <Button
        label={saving ? 'Saving' : 'Tap to load for two seconds'}
        loading={saving}
        onPress={() => {
          setSaving(true);
          setTimeout(() => setSaving(false), 2000);
        }}
        full
      />
      <Button label="Loading" loading onPress={mark('Loading')} full />
      <Button label="Disabled" disabled onPress={mark('Disabled')} full />
      <Button label="Secondary" variant="secondary" onPress={mark('Secondary')} full />
      <Button label="Outline" variant="outline" onPress={mark('Outline')} full />
      <Button label="White" variant="white" onPress={mark('White')} full />
      <Button label="Glass" variant="glass" onPress={mark('Glass')} full />
    </Section>
  );
}

function Inputs() {
  const [email, setEmail] = useState('');
  return (
    <Section title="Inputs">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Type an email address"
        keyboardType="email-address"
        autoCapitalize="none"
        hint="Type here to see the focus ring"
      />
      <TextField label="Phone number" defaultValue="Filled" hint="Must be the number on your BVN" />
      <TextField label="Password" defaultValue="hidden text" secret hint="At least 8 characters" />
      <TextField label="Error" defaultValue="Not right" error="This is what is wrong, and how to fix it" />
      <TextField label="Checking" defaultValue="Checking" loading />
      <TextField label="Disabled" defaultValue="Locked" disabled />
      <TextField label="Search" leadingIcon="Search" placeholder="Search Who Made This" />
    </Section>
  );
}

function Tabs() {
  const [view, setView] = useState<(typeof viewPicks)[number]['value']>('foryou');
  return (
    <Section title="Segmented tabs">
      <SegmentedTabs label="Feed" items={viewPicks} value={view} onChange={setView} testID="showcase-tabs" />
      <Text variant="caption">Selected: {view}</Text>
    </Section>
  );
}

function Chips() {
  const [txFilter, setTxFilter] = useState<(typeof transactionFilters)[number]['value']>('all');
  const [inboxFilter, setInboxFilter] = useState<(typeof inboxFilters)[number]['value']>('all');
  return (
    <Section title="Filter chips">
      <View style={styles.bleed}>
        <FilterChips label="Filter transactions" items={transactionFilters} value={txFilter} onChange={setTxFilter} testID="showcase-chips" />
        <FilterChips label="Filter inbox" items={inboxFilters} value={inboxFilter} onChange={setInboxFilter} />
      </View>
    </Section>
  );
}

function OptionChips() {
  const [when, setWhen] = useState<(typeof eventWhen)[number]['value']>('upcoming');
  const [kind, setKind] = useState<(typeof eventKinds)[number]['value']>('all');
  return (
    <Section title="Option chips, as a filter sheet draws them">
      <Text variant="label">When</Text>
      <FilterChips variant="option" label="When" items={eventWhen} value={when} onChange={setWhen} testID="showcase-option-chips" />
      <Text variant="label">Kind</Text>
      <FilterChips variant="option" label="Kind of event" items={eventKinds} value={kind} onChange={setKind} />
    </Section>
  );
}

function Pills() {
  return (
    <Section title="Status pills and tags">
      <View style={styles.row}>
        {pills.map((pill) => (
          <StatusPill key={pill.label} label={pill.label} tone={pill.tone} icon={pill.icon} />
        ))}
      </View>
    </Section>
  );
}

function Sheet() {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <Section title="Bottom sheet">
      <Button label="Open the unlock sheet" variant="secondary" onPress={() => setSheetOpen(true)} full />
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} label="Unlock" testID="showcase-sheet">
        <MediaCard title="How I built a ₦2M a month agency" subtitle="Chidi Eze" subtitleAccessory={<VerifiedTick kind="pro" size={13} />} />
        <GroupedList>
          <KeyValueRow label="Price" value={<Money minorUnits={250000} size={14.5} decimals={false} />} />
          <KeyValueRow label="Yours" value="Forever, in My purchases" />
          <KeyValueRow label="Fintava's charge" value={<Money minorUnits={2325} size={14.5} />} />
          <KeyValueRow label="Total" value={<Money minorUnits={252325} size={14.5} />} />
        </GroupedList>
        <Button label="Unlock · ₦2,523.25" onPress={() => setSheetOpen(false)} full />
      </BottomSheet>
    </Section>
  );
}

function States({ mark }: { mark: Mark }) {
  const [listState, setListState] = useState<(typeof statePicks)[number]['value']>('content');
  const [retries, setRetries] = useState(0);
  return (
    <Section title="Loading, empty and error">
      <SegmentedTabs label="State" items={statePicks} value={listState} onChange={setListState} testID="showcase-state" />
      <View testID="showcase-state-view" style={styles.stateBox}>
        {listState === 'content' ? (
          <ListSection title="Today">
            <TransactionRow title="MTN airtime" subtitle="0803 ••• 4412" amountMinor={-200000} time="08:15" icon="Smartphone" />
          </ListSection>
        ) : listState === 'loading' ? (
          <SkeletonRows />
        ) : listState === 'empty' ? (
          <EmptyState
            title="No messages yet"
            message="Message a creator from their profile, or join a community to talk with people like you."
            action={{ label: 'Browse communities', onPress: mark('Browse communities') }}
          />
        ) : (
          <ErrorState
            title="Search isn't working right now"
            message="Check your connection and try again."
            onRetry={() => {
              setRetries((n) => n + 1);
              setListState('loading');
            }}
          />
        )}
      </View>
      <Text variant="caption">Tried again {retries} times</Text>
      <Text variant="label">Explore, while it loads</Text>
      <LoadingView label="Loading Explore" testID="showcase-explore-loading">
        <View style={styles.loadingPage}>
          <Skeleton height={loadingHeroHeight} radius={loadingHeroRadius} />
          <View style={styles.skeletonTiles}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={loadingTile} height={loadingTile} />
            ))}
          </View>
          <Skeleton width="50%" height={loadingBar} radius={loadingBarRadius} />
          <View style={styles.skeletonCards}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width={loadingCard.width} height={loadingCard.height} radius={radius.media} />
            ))}
          </View>
        </View>
      </LoadingView>
    </Section>
  );
}

/**
 * Every shared component in every state, on one page. Development only: the route
 * that mounts it (src/app/dev/components.tsx) is a redirect in a production build.
 */
export function Showcase() {
  const { colors } = useWawu();
  const [store] = useState(lastPressedStore);
  const mark: Mark = (name) => () => store.set(name);

  return (
    <ScrollView
      testID="showcase"
      style={{ backgroundColor: colors.surfacePage }}
      contentContainerStyle={styles.page}
    >
      <Text variant="title">Components</Text>

      <Section title="Text">
        {textVariants.map((v) => (
          <Text key={v} variant={v}>
            {v}: Who made this
          </Text>
        ))}
      </Section>

      <LargeButtons mark={mark} store={store} />

      <Section title="Buttons, medium and small">
        <View style={styles.row}>
          <Button label="Send" icon="ArrowUpRight" variant="secondary" size="md" onPress={mark('Send')} />
          <Button label="Add money" icon="Plus" variant="secondary" size="md" onPress={mark('Add money')} />
        </View>
        <View style={styles.row}>
          <Button label="Copy" icon="Copy" variant="secondary" size="sm" onPress={mark('Copy')} />
          <Button label="See all" iconRight="ChevronRight" variant="outline" size="sm" onPress={mark('See all')} />
          <Button label="Off" size="sm" disabled onPress={mark('Off')} />
        </View>
        <View style={styles.row}>
          <IconButton icon="ChevronLeft" label="Back" onPress={mark('Back icon')} />
          <IconButton icon="Search" label="Search" onPress={mark('Search icon')} />
          <IconButton icon="Copy" label="Copy" tone="glass" onPress={mark('Copy icon')} />
          <IconButton icon="X" label="Close" disabled onPress={mark('Close icon')} />
        </View>
      </Section>

      <Inputs />

      <Section title="Money">
        <Money minorUnits={48525075} size={text.display.fontSize} weight={600} />
        <Money minorUnits={2500000} size={text.display.fontSize} decimals={false} />
        <Money minorUnits={200000} signed />
        <Money minorUnits={-2506500} signed />
        <Money minorUnits={-1060000} signed />
        <Money minorUnits={48525075} masked />
        <Money minorUnits={0} loading />
        <Money minorUnits={12400050} currency="USD" />
        <Credits count={1250} />
        <Credits count={1} />
      </Section>

      <Section title="Brand (R-37)">
        <BrandMark layout="horizontal" width={180} testID="showcase-brand" />
        <View style={styles.row}>
          <BrandMark width={34} decorative />
          <BrandMark width={64} />
          <BrandMark layout="vertical" width={96} />
        </View>
      </Section>

      <Section title="Avatars">
        <View style={styles.row}>
          {avatarSizes.map((size) => (
            <Avatar key={size} name="Chidinma Okoro" hue="coral" size={size} decorative />
          ))}
          <Avatar name="Tife" source={sampleAvatar} />
          <Avatar />
        </View>
        <View style={styles.row}>
          {hues.map((hue) => (
            <Avatar key={hue} name={`${hue} Wawu`} hue={hue} />
          ))}
        </View>
      </Section>

      <Section title="Currency flags">
        <View style={styles.row}>
          {flagCurrencies.map((c) => (
            <CurrencyFlag key={c} currency={c} size={flagSizes[0]} />
          ))}
        </View>
        <View style={styles.row}>
          {flagSizes.map((size) => (
            <CurrencyFlag key={size} currency="NGN" size={size} />
          ))}
        </View>
      </Section>

      <Section title="Send review, as W10 draws it">
        <View testID="sample-w10" style={[styles.review, { backgroundColor: colors.surfacePage }]}>
          <Avatar testID="sample-avatar" name="Chidinma Okoro" hue="coral" size={avatarSizes[0]} />
          <Money testID="sample-amount" minorUnits={2500000} size={text.display.fontSize} />
        </View>
        <View testID="sample-kv" style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          <View style={styles.kv}>
            <Text variant="kvLabel">Bank</Text>
            <Text variant="kvValue">Guaranty Trust Bank</Text>
          </View>
        </View>
        <View testID="sample-wallet" style={[styles.card, styles.wallet, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
          <CurrencyFlag testID="sample-flag" currency="NGN" />
          <View>
            <Text variant="cardTitle">Pay from wallet</Text>
            <Text variant="meta">Naira wallet</Text>
          </View>
        </View>
        <Text variant="sheetTitleSm">Enter your PIN</Text>
        <Text variant="sheetTitle">Unlocked</Text>
      </Section>

      <Tabs />

      <Chips />

      <OptionChips />

      <Pills />

      <Section title="Grouped list cards">
        <GroupedList>
          <KeyValueRow label="Price" value={<Money minorUnits={250000} size={14.5} decimals={false} />} />
          <KeyValueRow label="Fintava's charge" value={<Money minorUnits={2325} size={14.5} />} />
          <KeyValueRow label="Total" value={<Money minorUnits={252325} size={14.5} />} />
          <KeyValueRow label="Yours" value="Forever, in My purchases" />
        </GroupedList>
        <GroupedList>
          <ListRow lead={<IconTile icon="Lock" />} title="Transaction PIN" subtitle="Change or reset it" onPress={mark('PIN')} />
          <ListRow lead={<Avatar name="Chidi Eze" hue="sky" size={44} decorative />} title="Chidi Eze" titleAccessory={<VerifiedTick kind="pro" size={15} />} subtitle="Video creator" onPress={mark('Chidi')} />
          <ListRow lead={<IconTile icon="Clock" tone="warn" />} title="Not pressable" subtitle="No chevron, no press" />
        </GroupedList>
        <Card padded>
          <View style={styles.summary}>
            <View style={styles.summaryHalf}>
              <Text variant="caption">In · September</Text>
              <Money minorUnits={21240000} size={18} tone="positive" />
            </View>
            <View style={styles.summaryHalf}>
              <Text variant="caption">Out · September</Text>
              <Money minorUnits={9682050} size={18} />
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Transaction rows">
        <ListSection title="Today">
          <TransactionRow title="Amaka Nwosu" subtitle="Tip on your video" amountMinor={200000} time="10:24" lead={<Avatar name="Amaka Nwosu" hue="green" decorative />} onPress={mark('Amaka')} />
          <TransactionRow title="Unlock · Lighting night shoots" subtitle="3 buyers" amountMinor={750000} time="09:02" icon="LockOpen" />
          <TransactionRow title="MTN airtime" subtitle="0803 ••• 4412" amountMinor={-200000} time="08:15" icon="Smartphone" />
        </ListSection>
        <ListSection title="Yesterday">
          <TransactionRow title="Ikeja Electric" subtitle="Prepaid · 45.2 kWh" amountMinor={-1060000} time="18:40" icon="Zap" />
          <TransactionRow title="Chidinma Okoro" subtitle="Transfer · GTBank" amountMinor={-2506500} time="11:02" icon="ArrowUpRight" />
        </ListSection>
      </Section>

      <Section title="Conversation rows">
        <View>
          <ConversationRow name="Amaka Nwosu" hue="green" preview="Sent you ₦5,000" time="10:24" kind="money" unread={2} onPress={mark('Amaka chat')} />
          <ConversationRow name="Chidi Eze" hue="sky" tick="pro" preview="Paid DM · 18h left to reply" time="09:51" kind="dm" unread={1} />
          <ConversationRow name="Lagos Freelancers" hue="lilac" preview="Tolu: who’s at the meetup Sat?" time="09:12" />
          <ConversationRow name="Kemi Okafor" hue="pink" preview="Requested ₦12,000 · Logo edits" time="Yest." kind="req" />
          <ConversationRow name="Dami Ade" hue="lemon" preview="Hundreds of messages" time="Mon" unread={140} />
          <ConversationRow name="Femi Bankole" hue="coral" preview="You: Thanks, got it" time="Yest." />
        </View>
      </Section>

      <Section title="Media cards">
        <MediaCard title="How I built a ₦2M a month agency" subtitle="Chidi Eze" subtitleAccessory={<VerifiedTick kind="pro" size={13} />} />
        <View style={styles.row}>
          <MediaCard layout="stacked" title="Lighting night shoots" subtitle="Video · 18 min" />
          <MediaCard layout="stacked" title="Pricing a wedding film" subtitle="Course" />
        </View>
      </Section>

      <Sheet />

      <States mark={mark} />

      <Section title="Icons">
        <View style={styles.row}>
          {icons.map((name) => (
            <Icon key={name} name={name} size={space.s2xl} color={colors.textPrimary} />
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: layout.screenW,
    padding: layout.gutter,
    paddingTop: space.s3xl,
    gap: layout.sectionGap,
  },
  section: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.md },
  review: { alignItems: 'center', gap: space.sm },
  card: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: layout.cardPad },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.md },
  wallet: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  bleed: { marginHorizontal: -layout.gutter, gap: space.md },
  summary: { flexDirection: 'row', gap: space.lg },
  summaryHalf: { flex: 1, gap: space.xs },
  stateBox: { minHeight: stateBoxHeight },
  skeletonTiles: { flexDirection: 'row', gap: space.sm },
  skeletonCards: { flexDirection: 'row', gap: cardGap, overflow: 'hidden', marginRight: -layout.gutter },
  loadingPage: { gap: space.xl },
});
