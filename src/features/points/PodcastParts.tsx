import { StyleSheet, TextInput, View } from 'react-native';

import { FilterChips } from '@/components/FilterChips';
import { browserOutlineOff } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import type { AiTool } from './studioApi';
import { VoiceList } from './VoiceRows';
import { PODCAST_WORDS } from './voiceToolsModel';
import { countLine } from './voiceoverModel';

type Podcast = NonNullable<AiTool['input']['podcast']>;

/** What the person chose for a podcast; the tool's screen keeps it and the job carries it. */
export type PodcastChoice = {
  source: 'text' | 'link';
  text: string;
  link: string;
  hosts: 1 | 2;
  voiceIds: [string, string];
  duration: string;
  language: string;
};

/** PT2's box measures again (20 corner, 14 by 16 padding, 15 on 1.5) for the text and the link. No board draws the Podcast maker's parts (R-29). */
const BOX = { radius: 20, padV: 14, padH: 16, font: 15, leading: 1.5, tall: 150, ringOn: 1.5, ringOff: 1 } as const;
const LABEL = { size: 11, tracking: 0.08 } as const;

function Label({ children }: { children: string }) {
  return (
    <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), { fontSize: LABEL.size, letterSpacing: LABEL.tracking * LABEL.size, textTransform: 'uppercase' }]}>
      {children}
    </Text>
  );
}

/**
 * The Podcast maker's input (POINTS-18): a Text or Link switch and its box or field, one host or two with a voice row for each, a length row
 * (short, standard, long: the entry's) and a language row (the entry's). Every list is the Hub's; the app writes none of them.
 */
export function PodcastInputs({
  podcast,
  voices,
  choice,
  maxCharacters,
  characters,
  linkProblem,
  voiceProblem,
  editable,
  onChange,
}: {
  podcast: Podcast;
  voices: AiTool['voices'];
  choice: PodcastChoice;
  maxCharacters: number;
  characters: number;
  linkProblem: string | null;
  voiceProblem: string | null;
  editable: boolean;
  onChange: (next: Partial<PodcastChoice>) => void;
}) {
  const { colors } = useWawu();
  const two = choice.hosts === 2 && podcast.modes.includes('conversation');
  const canSwitchHosts = podcast.modes.includes('conversation') && podcast.modes.includes('bulletin');
  return (
    <View style={styles.wrap} testID="podcast-inputs">
      <View style={styles.group}>
        <Label>{PODCAST_WORDS.source}</Label>
        <FilterChips
          variant="option"
          label={PODCAST_WORDS.source}
          items={[
            { value: 'text', label: PODCAST_WORDS.text },
            { value: 'link', label: PODCAST_WORDS.link },
          ]}
          value={choice.source}
          onChange={(v) => onChange({ source: v as 'text' | 'link' })}
          testID="podcast-source"
        />
        {choice.source === 'text' ? (
          <View style={styles.group}>
            <View style={[styles.box, { minHeight: BOX.tall, backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: BOX.ringOn, color: colors.accent, inset: true }] }]}>
              <TextInput
                testID="tool-text"
                accessibilityLabel={PODCAST_WORDS.textBoxLabel}
                multiline
                editable={editable}
                value={choice.text}
                onChangeText={(text) => onChange({ text })}
                placeholder={PODCAST_WORDS.textPlaceholder}
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
                style={[styles.input, { color: colors.textPrimary }, font(400), browserOutlineOff]}
              />
            </View>
            <Text variant="body" tone="textMuted" testID="tool-count" style={styles.meta}>
              {countLine(characters, maxCharacters)}
            </Text>
          </View>
        ) : (
          <View style={styles.group}>
            <View style={[styles.field, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: linkProblem ? BOX.ringOn : BOX.ringOff, color: linkProblem ? colors.danger : colors.borderHairline, inset: true }] }]}>
              <TextInput
                testID="podcast-link"
                accessibilityLabel={PODCAST_WORDS.linkLabel}
                editable={editable}
                value={choice.link}
                onChangeText={(link) => onChange({ link })}
                placeholder={PODCAST_WORDS.linkPlaceholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[styles.input, { color: colors.textPrimary }, font(400), browserOutlineOff]}
              />
            </View>
            {linkProblem ? (
              <Text variant="body" tone="danger" accessibilityLiveRegion="polite" testID="podcast-link-problem" style={styles.meta}>
                {linkProblem}
              </Text>
            ) : null}
          </View>
        )}
      </View>
      {canSwitchHosts ? (
        <View style={styles.group}>
          <Label>{PODCAST_WORDS.hosts}</Label>
          <FilterChips
            variant="option"
            label={PODCAST_WORDS.hosts}
            items={[
              { value: '1', label: PODCAST_WORDS.oneHost },
              { value: '2', label: PODCAST_WORDS.twoHosts },
            ]}
            value={String(two ? 2 : 1)}
            onChange={(v) => onChange({ hosts: v === '2' ? 2 : 1 })}
            testID="podcast-hosts"
          />
        </View>
      ) : null}
      <VoiceList voices={voices} value={choice.voiceIds[0]} onChange={(id) => onChange({ voiceIds: [id, choice.voiceIds[1]] })} label={PODCAST_WORDS.hostVoice(1, two)} testID="podcast-voices-1" rowPrefix="podcast-voice-1" />
      {two ? <VoiceList voices={voices} value={choice.voiceIds[1]} onChange={(id) => onChange({ voiceIds: [choice.voiceIds[0], id] })} label={PODCAST_WORDS.hostVoice(2, two)} testID="podcast-voices-2" rowPrefix="podcast-voice-2" /> : null}
      {voiceProblem ? (
        <Text variant="body" tone="danger" accessibilityLiveRegion="polite" testID="podcast-voice-problem" style={styles.meta}>
          {voiceProblem}
        </Text>
      ) : null}
      <View style={styles.group}>
        <Label>{PODCAST_WORDS.length}</Label>
        <FilterChips
          variant="option"
          label={PODCAST_WORDS.length}
          items={podcast.durations.map((d) => ({ value: d.id, label: PODCAST_WORDS.duration[d.id] }))}
          value={choice.duration}
          onChange={(v) => onChange({ duration: v })}
          testID="podcast-length"
        />
      </View>
      {podcast.languages.length > 1 ? (
        <View style={styles.group}>
          <Label>{PODCAST_WORDS.language}</Label>
          <FilterChips variant="option" label={PODCAST_WORDS.language} items={podcast.languages.map((l) => ({ value: l.code, label: l.name }))} value={choice.language} onChange={(v) => onChange({ language: v })} testID="podcast-language" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  group: { gap: space.sm },
  box: { borderRadius: BOX.radius, paddingVertical: BOX.padV, paddingHorizontal: BOX.padH },
  field: { borderRadius: BOX.radius, paddingVertical: BOX.padV, paddingHorizontal: BOX.padH },
  input: { fontSize: BOX.font, lineHeight: BOX.font * BOX.leading, padding: 0, margin: 0 },
  meta: { fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5) },
});
