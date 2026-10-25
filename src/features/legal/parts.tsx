import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, radius, useWawu } from '@/theme';

import type { LegalBrief, LegalQuickReply } from './api';
import { legalMetrics as m, normal } from './look';
import type { ChatHeader, ChatRow } from './model';

/** `chatHead`: the back button, the assistant's scales (or the consultant's initials), the name and the line under it. */
export function ChatBar({ header, onBack }: { header: ChatHeader; onBack: () => void }) {
  const { colors } = useWawu();
  return (
    <View style={[styles.bar, { boxShadow: [{ offsetX: 0, offsetY: -1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] }]}>
      <IconButton icon="ChevronLeft" label="Back" size={m.headButton} onPress={onBack} testID="legal-back" />
      {header.human ? (
        <Avatar name={header.title} hue="pink" size={m.avatar} decorative testID="legal-avatar" />
      ) : (
        <View testID="legal-avatar" style={[styles.scales, { backgroundColor: colors.accent }]}>
          <Icon name="Scale" size={m.scale} color={colors.textOnAccent} strokeWidth={m.scaleStroke} />
        </View>
      )}
      <View style={styles.words}>
        <Text variant="body" numberOfLines={1} accessibilityRole="header" style={[font(700), { fontSize: m.headName, lineHeight: normal(m.headName) }]}>
          {header.title}
        </Text>
        <Text
          variant="body"
          numberOfLines={1}
          tone="textMuted"
          testID="legal-sub"
          style={{ fontSize: m.headSub, lineHeight: normal(m.headSub), marginTop: m.headSubTop }}
        >
          {header.sub}
        </Text>
      </View>
    </View>
  );
}

/** One line of the conversation: a bubble, a name above a consultant's lines, or the "joined" notice. */
export function ChatLine({ row }: { row: ChatRow }) {
  const { colors } = useWawu();
  if (row.kind === 'system') {
    return (
      <View testID="legal-joined" accessible accessibilityRole="text" accessibilityLabel={row.text} style={styles.system}>
        <Icon name="Info" size={m.sysIcon} color={colors.textMuted} />
        <Text variant="body" tone="textMuted" style={[font(600), { fontSize: m.sysText, lineHeight: normal(m.sysText) }]}>
          {row.text}
        </Text>
      </View>
    );
  }
  if (row.kind === 'who') {
    return (
      <Text variant="body" tone="textMuted" style={[font(700), styles.who, { fontSize: m.whoText, lineHeight: normal(m.whoText) }]}>
        {row.text}
      </Text>
    );
  }
  return <Bubble mine={row.mine} body={row.body} testID={`legal-bubble-${row.id}`} />;
}

export function Bubble({ mine, body, testID, dim }: { mine: boolean; body: string; testID?: string; dim?: boolean }) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      style={[
        styles.bubble,
        mine ? styles.mine : styles.theirs,
        mine
          ? { backgroundColor: colors.accent }
          : { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
        dim ? styles.dim : null,
      ]}
    >
      <Text variant="body" style={{ fontSize: m.bubbleText, lineHeight: m.bubbleText * m.bubbleLeading, color: mine ? colors.textOnAccent : colors.textPrimary }}>
        {body}
      </Text>
    </View>
  );
}

/** The assistant is working on an answer. */
export function Typing() {
  const { colors } = useWawu();
  return (
    <View testID="legal-typing" accessible accessibilityLabel="The assistant is replying" style={[styles.bubble, styles.theirs, styles.typing, { backgroundColor: colors.surfaceCard }]}>
      <ActivityIndicator size="small" color={colors.textMuted} />
    </View>
  );
}

/** `quick`: the taps under the newest assistant line, each a pill with an accent ring. */
export function QuickReplies({ taps, onTap, disabled }: { taps: readonly LegalQuickReply[]; onTap: (tap: LegalQuickReply) => void; disabled: boolean }) {
  return (
    <View testID="legal-taps" style={styles.taps}>
      {taps.map((tap) => (
        <Tap key={tap.id} tap={tap} onTap={onTap} disabled={disabled} />
      ))}
    </View>
  );
}

function Tap({ tap, onTap, disabled }: { tap: LegalQuickReply; onTap: (tap: LegalQuickReply) => void; disabled: boolean }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`legal-tap-${tap.id}`}
      accessibilityRole="button"
      accessibilityLabel={tap.label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onTap(tap)}
      {...ring.handlers}
      style={[
        styles.tap,
        { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: m.quickRing, color: colors.accent, inset: true }], opacity: disabled ? 0.5 : 1 },
        ring.style,
      ]}
    >
      <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: m.quickText, lineHeight: normal(m.quickText), color: colors.accentFg }]}>
        {tap.label}
      </Text>
    </Pressable>
  );
}

/** `brief`: the card the person checks before it goes to a consultant (S16), then the button that sends it. */
export function BriefCard({ brief, onSend, sending }: { brief: LegalBrief; onSend: () => void; sending: boolean }) {
  const { colors } = useWawu();
  return (
    <>
      <Card padded testID="legal-brief" style={styles.brief}>
        <View style={styles.briefHead}>
          <Icon name="FileText" size={m.briefIcon} color={colors.accentFg} />
          <Text variant="body" accessibilityRole="header" style={[font(700), { fontSize: m.briefTitle, lineHeight: normal(m.briefTitle) }]}>
            Your brief
          </Text>
        </View>
        {brief.rows.map((row, i) => (
          <View
            key={`${row.label}-${i}`}
            testID={`legal-brief-row-${i}`}
            style={[
              styles.kv,
              i > 0 ? { boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] } : null,
            ]}
          >
            <Text variant="kvLabel" tone="textSecondary" style={styles.kvLabel}>
              {row.label}
            </Text>
            <Text variant="kvValue" style={styles.kvValue}>
              {row.value}
            </Text>
          </View>
        ))}
      </Card>
      <Button label="Send to a consultant" icon="Send" onPress={onSend} loading={sending} full testID="legal-send-brief" />
      {brief.note ? (
        <Text variant="body" tone="textMuted" testID="legal-brief-note" style={[styles.briefNote, { fontSize: m.noteText, lineHeight: normal(m.noteText) }]}>
          {brief.note}
        </Text>
      ) : null}
    </>
  );
}

/** A line under the list that the person can act on: a send that failed, an assistant that is slow, a refresh that failed. */
export function Note({ text, action, onAction, busy, testID }: { text: string; action?: string; onAction?: () => void; busy?: boolean; testID: string }) {
  const { colors } = useWawu();
  return (
    <View testID={testID} accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.note}>
      <Icon name="CircleAlert" size={m.sysIcon + 2} color={colors.danger} strokeWidth={2.2} />
      <Text variant="body" tone="textSecondary" style={[styles.noteText, { fontSize: m.noteText, lineHeight: normal(m.noteText) }]}>
        {text}
      </Text>
      {action && onAction ? <Button label={action} variant="secondary" size="sm" onPress={onAction} loading={busy} testID={`${testID}-action`} /> : null}
    </View>
  );
}

export type ComposerProps = {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  onSend: (() => void) | null;
  paddingBottom: number;
};

/** `composer`: the field and the send disc. The disc is a button only while there is something to send. */
export function Composer({ value, onChange, placeholder, onSend, paddingBottom }: ComposerProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const ready = onSend !== null;
  return (
    <View
      testID="legal-composer"
      style={[
        styles.composer,
        { paddingBottom, backgroundColor: colors.surfaceChrome, boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] },
      ]}
    >
      <View
        style={[
          styles.fieldShell,
          { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] },
        ]}
      >
        <TextInput
          testID="legal-input"
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={placeholder}
          multiline
          numberOfLines={1}
          style={[styles.field, font(400), { color: colors.textPrimary }]}
        />
      </View>
      <Pressable
        testID="legal-send"
        accessibilityRole="button"
        accessibilityLabel="Send"
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={onSend ?? undefined}
        {...ring.handlers}
        style={[styles.send, { backgroundColor: ready ? colors.accent : colors.surfaceSunken }, ring.style]}
      >
        <Icon name="ArrowUp" size={m.sendIcon} color={ready ? colors.textOnAccent : colors.textDisabled} strokeWidth={m.sendStroke} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  briefNote: { textAlign: 'center' },
  bar: { height: m.headHeight, paddingLeft: m.headPadLeft, paddingRight: m.headPadRight, flexDirection: 'row', alignItems: 'center', gap: m.headGap },
  scales: { width: m.avatar, height: m.avatar, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1 },
  system: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: m.sysGap, paddingVertical: m.sysPad },
  who: { marginTop: m.whoTop, marginBottom: -m.whoTop, marginLeft: m.whoLeft },
  bubble: { maxWidth: m.bubbleMax, paddingVertical: m.bubblePadY, paddingHorizontal: m.bubblePadX, borderRadius: m.bubbleCorner },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: m.bubbleTail },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: m.bubbleTail },
  dim: { opacity: 0.6 },
  typing: { minWidth: 56, alignItems: 'center' },
  taps: { flexDirection: 'row', flexWrap: 'wrap', gap: m.quickGap },
  tap: { height: m.quickHeight, paddingHorizontal: m.quickPadX, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  brief: { paddingVertical: m.briefPadY, paddingHorizontal: m.briefPadX, gap: m.briefGap },
  briefHead: { flexDirection: 'row', alignItems: 'center', gap: m.briefHeadGap },
  kv: { minHeight: m.kvMin, paddingVertical: m.kvPadY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: m.kvGap },
  kvLabel: { flexShrink: 0 },
  kvValue: { flexShrink: 1, textAlign: 'right' },
  note: { flexDirection: 'row', alignItems: 'center', gap: m.sysGap + 2 },
  noteText: { flex: 1 },
  composer: { paddingTop: m.composerTop, paddingHorizontal: m.composerSide, flexDirection: 'row', alignItems: 'flex-end', gap: m.composerGap },
  fieldShell: { flex: 1, minHeight: m.field, maxHeight: m.fieldMaxHeight, borderRadius: m.fieldCorner, justifyContent: 'center' },
  field: {
    paddingVertical: m.fieldPadY,
    paddingHorizontal: m.fieldPadX,
    fontSize: m.fieldText,
    lineHeight: normal(m.fieldText),
  },
  send: { width: m.send, height: m.send, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
});
