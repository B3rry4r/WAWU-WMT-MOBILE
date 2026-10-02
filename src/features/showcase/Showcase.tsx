import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Credits } from '@/components/Credits';
import { Icon, type IconName } from '@/components/icon';
import { Money } from '@/components/Money';
import { Text, type TextVariant } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { layout, space, text, useWawu } from '@/theme';

const textVariants = Object.keys(text) as TextVariant[];
const icons: IconName[] = [
  'ChevronLeft', 'ChevronRight', 'ArrowUpRight', 'Plus', 'Check', 'X', 'Search', 'Eye', 'EyeOff', 'Lock', 'Copy', 'Edit', 'Delete', 'CircleAlert',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label">{title}</Text>
      {children}
    </View>
  );
}

/**
 * Every shared component in every state, on one page. Development only: the route
 * that mounts it (src/app/dev/components.tsx) is a redirect in a production build.
 */
export function Showcase() {
  const { colors } = useWawu();
  const [last, setLast] = useState('Nothing yet');
  const mark = (name: string) => () => setLast(name);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');

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

      <Section title="Buttons, large">
        <Button label="Continue" onPress={mark('Continue')} full />
        <Text variant="caption">Last pressed: {last}</Text>
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
        <TextField label="Search" leadingIcon="Search" placeholder="Search WAWU" />
      </Section>

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
});
