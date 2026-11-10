import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useKeyboardLift } from '@/features/feedpay/useKeyboardLift';
import { font, space, useWawu } from '@/theme';

import { BottomSheet } from './BottomSheet';
import { Icon } from './icon';
import { ListRow } from './ListRow';
import { SkeletonRows } from './Skeleton';
import { EmptyState, ErrorState } from './StateViews';
import { Text } from './Text';
import { TextField } from './TextField';

/** One row of the list: a country (with its flag and, for a phone, its calling code) or a region of one. */
export type PickerItem = {
  /** What is handed back when the row is chosen: a country's ISO code, or a region's. */
  code: string;
  name: string;
  /** The flag emoji, for a country. */
  flag?: string;
  /** Said at the row's end, such as a calling code ("+234"). Searched too. */
  note?: string | null;
};

export type CountryPickerProps = {
  visible: boolean;
  onClose: () => void;
  /** What a screen reader calls the sheet, and its heading ("Choose a country"). */
  title: string;
  /** The search box's label ("Search countries"). */
  searchLabel: string;
  /** Undefined while the Hub's list is on its way. */
  items: readonly PickerItem[] | undefined;
  selected: string | null;
  onPick: (code: string) => void;
  /** The list could not be read: the sheet says so and offers `onRetry`. */
  failed?: boolean;
  onRetry?: () => void;
  testID?: string;
};

/** The list takes at most this share of the window, so the sheet never covers the whole screen. */
const LIST_SHARE = 0.4;
/** R-117: what the sheet's grabber, title and search field take above the list, and the phone's top edge; the list gives way to the keyboard inside what is left. */
const CHROME = 260;
const LIST_MIN = 120;
const FLAG_SIZE = 24;
const pickedMetrics = { icon: 18, stroke: 2.6 } as const;

/** Names people type for a country that its list name does not spell that way. */
const ALIASES: Record<string, string> = { uk: 'GB', usa: 'US', uae: 'AE' };

function fold(text: string): string {
  try {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  } catch {
    return text.toLowerCase();
  }
}

/** The rows that answer a search: a name that starts with it first, then a name that holds it, a code, or a calling code. */
export function searchItems(items: readonly PickerItem[], query: string): PickerItem[] {
  const q = fold(query.trim());
  if (q === '') return [...items];
  const dialled = q.replace(/^\+/, '');
  const alias = ALIASES[q];
  const starts: PickerItem[] = [];
  const holds: PickerItem[] = [];
  for (const item of items) {
    const name = fold(item.name);
    if (name.startsWith(q) || item.code.toLowerCase() === q || item.code === alias) starts.push(item);
    else if (name.includes(q) || (/^\d+$/.test(dialled) && (item.note ?? '').replace(/^\+/, '').startsWith(dialled))) holds.push(item);
  }
  return [...starts, ...holds];
}

/**
 * The list behind a country field, a phone field's country button and a region field (GEO-03, R-85): a sheet with a
 * search box and a row for each item. The Hub serves the lists; this draws whatever it is given.
 */
export function CountryPicker({ visible, onClose, title, testID = 'country-sheet', ...body }: CountryPickerProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label={title} testID={testID}>
      {/* The body is drawn only while the sheet is open, so a closed sheet forgets its search and the next opening shows the whole list. */}
      {visible ? <PickerBody title={title} testID={testID} {...body} /> : null}
    </BottomSheet>
  );
}

function PickerBody({ title, searchLabel, items, selected, onPick, failed, onRetry, testID }: Omit<CountryPickerProps, 'visible' | 'onClose' | 'testID'> & { testID: string }) {
  const { colors } = useWawu();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  // R-117 part B: the sheet is a modal the keyboard covers (Android draws edge to edge), so it adds the keyboard's height under its list and the list shortens to fit.
  const lift = useKeyboardLift();
  const listHeight = lift > 0 ? Math.max(LIST_MIN, Math.min(height * LIST_SHARE, height - lift - CHROME)) : height * LIST_SHARE;
  const shown = useMemo(() => (items ? searchItems(items, query) : []), [items, query]);

  return (
    <>
      <Text variant="sheetTitleSm" accessibilityRole="header">
        {title}
      </Text>
      {failed ? (
        <ErrorState testID={`${testID}-error`} title="The list did not load" message="Check your connection and try again." onRetry={onRetry} />
      ) : !items ? (
        <SkeletonRows count={4} testID={`${testID}-loading`} />
      ) : (
        <>
          <TextField
            label={searchLabel}
            testID={`${testID}-search`}
            value={query}
            onChangeText={setQuery}
            leadingIcon="Search"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {shown.length === 0 ? (
            <EmptyState testID={`${testID}-none`} icon="Search" title="Nothing matches" message="Check the spelling, or search by calling code." />
          ) : (
            <FlatList
              testID={`${testID}-list`}
              data={shown}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              windowSize={7}
              style={{ maxHeight: listHeight }}
              renderItem={({ item }) => (
                <ListRow
                  testID={`${testID}-row-${item.code}`}
                  lead={item.flag ? <Text style={styles.flag} accessibilityElementsHidden importantForAccessibility="no">{item.flag}</Text> : undefined}
                  title={item.name}
                  accessibilityLabel={`${item.name}${item.note ? `, ${item.note}` : ''}${item.code === selected ? ', chosen' : ''}`}
                  trailing={
                    <View style={styles.end}>
                      {item.note ? (
                        <Text variant="secondary" tone="textMuted">
                          {item.note}
                        </Text>
                      ) : null}
                      {item.code === selected ? <Icon name="Check" size={pickedMetrics.icon} color={colors.accentFg} strokeWidth={pickedMetrics.stroke} /> : null}
                    </View>
                  }
                  onPress={() => onPick(item.code)}
                />
              )}
            />
          )}
          {lift > 0 ? <View testID={`${testID}-keyboard-lift`} style={{ height: lift }} /> : null}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  flag: { ...font(400), fontSize: FLAG_SIZE, lineHeight: FLAG_SIZE + 4, width: FLAG_SIZE + 6, textAlign: 'center' },
  end: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
