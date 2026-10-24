import { useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useWawu } from '@/theme';

import { CreateFrame } from './CreateFrame';
import { categoryLabel, CONTENT_CATEGORIES, detailsReady, limits, setDetails, useDetails } from './details';
import { labelOf, type FormatId } from './model';
import { Stepper } from './parts';

/** The category list takes at most this share of the window, so the sheet never covers the whole screen (as the bank list does). */
const LIST_SHARE = 0.5;
/** kit.js `Check` beside the chosen row: 18 at stroke 2.6. */
const pickedMetrics = { icon: 18, stroke: 2.6 } as const;

export type DetailsScreenProps = {
  format: FormatId;
  onBack: () => void;
  /** Opens the price step (M24). */
  onContinue: () => void;
};

/**
 * M23 · Details, step 4 of 5: the title, the description and what the piece is. The Hub takes a category from a fixed list of
 * 25 (the board's "Business · Pricing" also names a specialization, which the Hub serves no list of, G-ME-08-1), and Continue
 * waits for all three because the create call refuses a piece without them.
 */
export function DetailsScreen({ format, onBack, onContinue }: DetailsScreenProps) {
  const details = useDetails();
  const [picking, setPicking] = useState(false);

  return (
    <CreateFrame
      testID="details-screen"
      title={`New ${labelOf(format)}`}
      subtitle="Step 4 of 5"
      onLeave={onBack}
      foot={<Button testID="create-continue" label="Continue" full disabled={!detailsReady(details)} onPress={onContinue} />}
    >
      <Stepper active={2} />
      <TextField
        testID="details-title"
        label="Title"
        value={details.title}
        onChangeText={(title) => setDetails({ title })}
        maxLength={limits.title}
        autoCapitalize="sentences"
        returnKeyType="next"
      />
      <TextField
        testID="details-description"
        label="Description"
        multiline
        // M23 draws no "38 / 5000" counter under the description (SWEEP-APP-4 row 146): the box stops at the Hub's limit instead.
        maxLength={limits.description}
        value={details.description}
        onChangeText={(description) => setDetails({ description })}
        autoCapitalize="sentences"
      />
      <TextField
        testID="details-category"
        label="What is this?"
        placeholder="Choose a category"
        value={categoryLabel(details.category)}
        trailingIcon="ChevronDown"
        onPress={() => setPicking(true)}
      />
      <CategorySheet
        visible={picking}
        onClose={() => setPicking(false)}
        selected={details.category}
        onPick={(category) => {
          setDetails({ category });
          setPicking(false);
        }}
      />
    </CreateFrame>
  );
}

type CategorySheetProps = {
  visible: boolean;
  onClose: () => void;
  selected: string | null;
  onPick: (id: (typeof CONTENT_CATEGORIES)[number]['id']) => void;
};

/** The list behind "What is this?" (the canvas draws the field, not the list): the Hub's 25 categories, the chosen one ticked. */
export function CategorySheet({ visible, onClose, selected, onPick }: CategorySheetProps) {
  const { colors } = useWawu();
  const { height } = useWindowDimensions();
  return (
    <BottomSheet visible={visible} onClose={onClose} label="What is this?" testID="category-sheet">
      <Text variant="sheetTitleSm" accessibilityRole="header">
        What is this?
      </Text>
      <FlatList
        testID="category-list"
        data={CONTENT_CATEGORIES}
        keyExtractor={(category) => category.id}
        style={{ maxHeight: height * LIST_SHARE }}
        renderItem={({ item }) => (
          <ListRow
            testID={`category-${item.id}`}
            title={item.label}
            accessibilityLabel={item.id === selected ? `${item.label}, chosen` : item.label}
            trailing={item.id === selected ? <Icon name="Check" size={pickedMetrics.icon} color={colors.accentFg} strokeWidth={pickedMetrics.stroke} /> : <View />}
            onPress={() => onPick(item.id)}
          />
        )}
      />
    </BottomSheet>
  );
}
