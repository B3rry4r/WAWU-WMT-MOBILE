import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import type { ChosenFile } from '@/features/create/chosen';
import { pickFile } from '@/features/create/pickFile';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { Popover, usePopover } from './StudioPopover';
import type { AiTool } from './studioApi';
import { putHandoff } from './studioHandoff';
import { attachKinds, canMake, fileChips, HOME_WORDS, kindOfFile, pickTypes, promptChips, voiceInitial, type AttachKind, type Chip } from './studioHomeModel';
import { toolIcon } from './studioModel';
import { clampText } from './voiceoverModel';

/** The prompt box as ElevenLabs draws it, in WAWU's tokens: a big centred two-line title, one rounded box with a "+" bottom-left, the chips under it. */
const LOOK = { title: 32, titleMax: 270, titleGap: 18, box: radius.money, boxPad: 18, text: 17, leading: 1.4, minText: 64, round: 38, ring: 1.5, chipH: 38, chipGap: 8, attachThumb: 44, row: 52 } as const;
const ATTACH: Record<AttachKind, { label: string; icon: IconName; pickLabel: string }> = {
  photo: { label: HOME_WORDS.attachPhoto, icon: 'Image', pickLabel: 'Add a photo' },
  video: { label: HOME_WORDS.attachVideo, icon: 'Video', pickLabel: 'Add a video' },
  audio: { label: HOME_WORDS.attachAudio, icon: 'AudioLines', pickLabel: 'Add a recording' },
};

export type StudioPromptProps = {
  tools: readonly AiTool[];
  /** The tool the chip names is opened, with the words, the file and the voice already in (nothing is charged here). */
  onOpenTool: (tool: AiTool) => void;
  /** The box took focus: the page brings it above the keyboard. */
  onFocusBox?: () => void;
};

/**
 * Studio's prompt (R-113): "What would you like to make?", one box, the chips of the prompt tools the Hub lists. A "+" attaches a photo, a
 * recording or a clip, and the chips become the tools that take that file. "Make" opens the chosen tool with the words and the file in; the tool
 * shows its own quote and runs it. Drawn only while the Hub lists a prompt tool (R-47); a chip, the "+" and the voice chip each exist only for
 * what the Hub lists and the app can run.
 */
export function StudioPrompt({ tools, onOpenTool, onFocusBox }: StudioPromptProps) {
  const { colors } = useWawu();
  const [text, setText] = useState('');
  const [file, setFile] = useState<ChosenFile | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const attachRef = useRef<View>(null);
  const voiceRef = useRef<View>(null);
  const attach = usePopover(attachRef);
  const voices = usePopover(voiceRef);

  // A file no listed tool takes any more (the Hub stopped listing it) is not shown or sent.
  const chips = file ? fileChips(tools, file) : promptChips(tools);
  const shown = file && chips.length > 0 ? file : null;
  const chip: Chip | undefined = chips.find((c) => c.id === picked) ?? chips[0];
  const tool = chip ? tools.find((t) => t.id === chip.id) : undefined;
  const kinds = attachKinds(tools);
  const speech = tool?.id === 'voiceover' && tool.voices.length > 0 ? tool : null;
  const voice = speech ? (speech.voices.find((v) => v.id === voiceId) ?? speech.voices[0]) : null;
  const ready = canMake(chip, text, shown);

  if (promptChips(tools).length === 0) return null;

  const choose = async (kind: AttachKind) => {
    attach.hide();
    setNote(null);
    let chosen: ChosenFile | null;
    try {
      chosen = await pickFile(pickTypes(tools, kind));
    } catch {
      setNote(HOME_WORDS.pickFailed);
      return;
    }
    if (!chosen) return;
    // A file no ready tool takes (a type the picker allowed that no rule lists) is let go with the reason, never held.
    if (!kindOfFile(chosen) || fileChips(tools, chosen).length === 0) {
      chosen.discard?.();
      setNote(HOME_WORDS.pickFailed);
      return;
    }
    file?.discard?.();
    setFile(chosen);
    setPicked(null);
  };
  const removeFile = () => {
    file?.discard?.();
    setFile(null);
    setPicked(null);
    setNote(null);
  };
  const make = () => {
    if (!ready || !tool) return;
    putHandoff({ toolId: tool.id, text: clampText(text.trim(), tool.input.maxCharacters), file: shown, voiceId: speech ? (voice?.id ?? null) : null });
    // The tool's screen has the file from here.
    setFile(null);
    setText('');
    setPicked(null);
    setNote(null);
    onOpenTool(tool);
  };

  return (
    <View style={styles.wrap}>
      <Text variant="body" accessibilityRole="header" testID="studio-title" style={[font(700), styles.title, { fontSize: LOOK.title, lineHeight: canvasNormalLineHeight(LOOK.title) * 1.04, letterSpacing: -0.02 * LOOK.title }]}>
        {HOME_WORDS.title}
      </Text>
      <View testID="studio-box" style={[styles.box, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: focused ? LOOK.ring : 1, color: focused ? colors.accent : colors.borderHairline, inset: true }] }]}>
        {shown ? <Attached file={shown} onRemove={removeFile} /> : null}
        <TextInput
          testID="studio-prompt"
          accessibilityLabel={HOME_WORDS.boxLabel}
          multiline
          value={text}
          onChangeText={(next) => setText(tool ? clampText(next, tool.input.maxCharacters) : next)}
          placeholder={chip?.placeholder ?? ''}
          placeholderTextColor={colors.textMuted}
          textAlignVertical="top"
          onFocus={() => {
            setFocused(true);
            onFocusBox?.();
          }}
          onBlur={() => setFocused(false)}
          style={[styles.input, font(400), browserOutlineOff, { color: colors.textPrimary, fontSize: LOOK.text, lineHeight: LOOK.text * LOOK.leading }]}
        />
        <View style={styles.row}>
          {kinds.length > 0 ? (
            <View ref={attachRef} collapsable={false}>
              <RoundButton testID="studio-attach" label={HOME_WORDS.attach} icon="Plus" onPress={attach.show} />
            </View>
          ) : null}
          {voice ? (
            <View ref={voiceRef} collapsable={false}>
              <Pressable testID="studio-voice" accessibilityRole="button" accessibilityLabel={`Voice: ${voice.name}`} onPress={voices.show} style={[styles.round, { backgroundColor: colors.accentTint, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.accent, inset: true }] }]}>
                <Text variant="body" style={[font(700), { color: colors.accentFg, fontSize: 15 }]}>
                  {voiceInitial(voice.name)}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.grow} />
          <Button testID="studio-make" label={HOME_WORDS.make} size="pill" icon="ArrowUp" disabled={!ready} onPress={make} />
        </View>
      </View>
      {note ? (
        <Text variant="body" tone="danger" testID="studio-note" style={styles.note}>
          {note}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" testID="studio-chips" style={styles.chipScroll} contentContainerStyle={styles.chips}>
        {chips.map((c) => (
          <ChipPill key={c.id} chip={c} selected={c.id === chip?.id} icon={toolIcon({ id: c.id as AiTool['id'] })} onPress={() => setPicked(c.id)} />
        ))}
      </ScrollView>
      <Popover visible={attach.open} onClose={attach.hide} anchor={attach.anchor} align="left" label={HOME_WORDS.attach} testID="studio-attach-menu">
        {kinds.map((kind) => (
          <MenuRow key={kind} testID={`studio-attach-${kind}`} icon={ATTACH[kind].icon} title={ATTACH[kind].label} label={ATTACH[kind].pickLabel} onPress={() => void choose(kind)} />
        ))}
      </Popover>
      <Popover visible={voices.open} onClose={voices.hide} anchor={voices.anchor} align="left" label={HOME_WORDS.voiceMenu} testID="studio-voice-menu">
        {speech?.voices.map((v) => (
          <MenuRow
            key={v.id}
            testID={`studio-voice-${v.id}`}
            initial={voiceInitial(v.name)}
            title={v.name}
            line={v.description}
            label={`${v.name}${v.description ? `, ${v.description}` : ''}`}
            selected={v.id === voice?.id}
            onPress={() => {
              setVoiceId(v.id);
              voices.hide();
            }}
          />
        ))}
      </Popover>
    </View>
  );
}

/** One row of a pop-over: a tinted square (an icon, or a voice's first letter), the name and one muted line. */
export function MenuRow({ icon, initial, title, line, label, selected, dim, onPress, testID }: { icon?: IconName; initial?: string; title: string; line?: string; label: string; selected?: boolean; dim?: boolean; onPress?: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const body = (
    <>
      <View aria-hidden style={[styles.rowTile, { backgroundColor: colors.surfaceSunken }]}>
        {icon ? <Icon name={icon} size={20} color={colors.textSecondary} strokeWidth={1.8} /> : <Text variant="body" style={[font(700), { color: colors.accentFg, fontSize: 15 }]}>{initial}</Text>}
      </View>
      <View style={styles.rowWords}>
        <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: 16 }]}>
          {title}
        </Text>
        {line ? (
          <Text variant="body" tone="textMuted" numberOfLines={1} style={{ fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5) }}>
            {line}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon name="Check" size={18} color={colors.accentFg} strokeWidth={2.4} /> : null}
    </>
  );
  return onPress ? (
    <Pressable testID={testID} accessibilityRole="menuitem" accessibilityLabel={label} accessibilityState={{ selected: selected ?? false }} onPress={onPress} {...ring.handlers} style={({ pressed }) => [styles.menuRow, { backgroundColor: pressed ? colors.surfaceSunken : undefined }, dim ? styles.dim : null, ring.style]}>
      {body}
    </Pressable>
  ) : (
    <View testID={testID} accessible accessibilityLabel={label} style={[styles.menuRow, dim ? styles.dim : null]}>
      {body}
    </View>
  );
}

function RoundButton({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={space.xs} {...ring.handlers} style={[styles.round, { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderStrong, inset: true }] }, ring.style]}>
      <Icon name={icon} size={20} color={colors.textPrimary} strokeWidth={1.8} />
    </Pressable>
  );
}

function ChipPill({ chip, selected, icon, onPress }: { chip: Chip; selected: boolean; icon: IconName; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`studio-chip-${chip.id}`}
      accessibilityRole="button"
      accessibilityLabel={chip.label}
      accessibilityState={{ selected }}
      onPress={onPress}
      {...ring.handlers}
      style={[styles.chip, { backgroundColor: selected ? colors.accentTint : colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: selected ? LOOK.ring : 1, color: selected ? colors.accent : colors.borderHairline, inset: true }] }, ring.style]}
    >
      <Icon name={icon} size={16} color={selected ? colors.accentFg : colors.textSecondary} strokeWidth={2} />
      <Text variant="body" style={[font(selected ? 700 : 600), { fontSize: 14, color: selected ? colors.accentFg : colors.textPrimary }]}>
        {chip.label}
      </Text>
    </Pressable>
  );
}

/** The file in the box: a small picture or a mark, its name, and a way to take it out. */
function Attached({ file, onRemove }: { file: ChosenFile; onRemove: () => void }) {
  const { colors } = useWawu();
  const kind = kindOfFile(file);
  return (
    <View testID="studio-attached" accessible accessibilityLabel={`Attached: ${file.name}`} style={styles.attached}>
      <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
        {kind === 'photo' && file.previewUri ? (
          <Image source={{ uri: file.previewUri }} contentFit="cover" style={styles.thumbFill} accessibilityIgnoresInvertColors />
        ) : (
          <Icon name={kind === 'video' ? 'Video' : kind === 'photo' ? 'Image' : 'AudioLines'} size={22} color={colors.textSecondary} strokeWidth={1.8} />
        )}
      </View>
      <Text variant="body" numberOfLines={1} style={[font(600), styles.attachedName, { fontSize: 14.5 }]}>
        {file.name}
      </Text>
      <Pressable testID="studio-attached-remove" accessibilityRole="button" accessibilityLabel={HOME_WORDS.removeFile} onPress={onRemove} hitSlop={space.md} style={[styles.remove, { backgroundColor: colors.surfaceSunken }]}>
        <Icon name="X" size={16} color={colors.textPrimary} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  title: { textAlign: 'center', alignSelf: 'center', maxWidth: LOOK.titleMax, marginTop: LOOK.titleGap, marginBottom: space.xs },
  box: { borderRadius: LOOK.box, padding: LOOK.boxPad, gap: space.sm },
  input: { minHeight: LOOK.minText, padding: 0, margin: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  round: { width: LOOK.round, height: LOOK.round, borderRadius: LOOK.round / 2, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 13.5, textAlign: 'center' },
  chipScroll: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  chips: { paddingHorizontal: layout.gutter, gap: LOOK.chipGap },
  chip: { height: LOOK.chipH, borderRadius: radius.chip, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  attached: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: { width: LOOK.attachThumb, height: LOOK.attachThumb, borderRadius: radius.input, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbFill: { width: '100%', height: '100%' },
  attachedName: { flex: 1, minWidth: 0 },
  remove: { width: 30, height: 30, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: LOOK.row, paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radius.input },
  rowTile: { width: 40, height: 40, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  rowWords: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.5 },
});
