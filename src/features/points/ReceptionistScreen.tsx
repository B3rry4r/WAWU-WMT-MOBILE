import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { GroupedList } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { formatPointsCount } from '@/components/PointsFigure';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { pickFile } from '@/features/create/pickFile';
import { newRequestKey } from '@/features/wallet/api/settings';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { uploadRecording } from './fileToolApi';
import { FieldBox } from './FieldBox';
import { useJobCheck } from './JobCheck';
import { PointsFrame } from './PointsFrame';
import { RECEPTIONIST_LIMITS, RECEPTIONIST_WORDS, documentProblem, knowledgeLine, knowledgeLinkProblem, setupProblem, type ReceptionistTab } from './receptionistModel';
import { fetchJobQuote, type AiTool, type JobAction } from './studioApi';
import { addKnowledge, clearReceptionist, receptionistKey, receptionistQuery, removeKnowledge, saveReceptionist, type Receptionist } from './voiceToolsApi';
import { fetchVoiceJob, outputText, startJob, voiceJobQuery, type VoiceJob } from './voiceoverApi';
import { failedWords, TOOL_WORDS } from './voiceoverModel';

const BODY_GAP = 14;

export type ReceptionistScreenProps = { owner: string | null; tool: AiTool; balance: number; onBack: () => void; onBuyPoints: () => void; onLeave: () => void };

/**
 * POINTS-12 (R-109) · The Receptionist: the person's own agent, set up in a few fields, taught from a text, a web page or a document, and tried by text.
 * Every value is the Hub's (`GET /ai-tools/receptionist`: the details, what it knows, the limits); a message is a job of the one pipeline (the quote, the
 * PT3 and PT7 sheets, one `Idempotency-Key`). No board draws it, so it is PT2's frame and parts (R-29). The voice entry joins this screen with POINTS-19
 * and is not drawn here (R-47); nothing about a telephone, WhatsApp or a call is built or drawn (R-109 point 3).
 */
export function ReceptionistScreen({ owner, tool, balance, onBack, onBuyPoints, onLeave }: ReceptionistScreenProps) {
  const agent = useQuery(receptionistQuery(owner), queryClient);
  const frame = { title: tool.name, subtitle: `Points: ${formatPointsCount(balance)}`, onBack, gap: BODY_GAP } as const;
  if (agent.isError && agent.data === undefined) {
    return (
      <PointsFrame {...frame} centered testID="receptionist-screen">
        <ErrorState testID="receptionist-error" icon={isApiError(agent.error) && agent.error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'} title={TOOL_WORDS.loadFailed} message={isApiError(agent.error) && agent.error.message ? agent.error.message : TOOL_WORDS.loadFailedBody} onRetry={() => void agent.refetch()} />
      </PointsFrame>
    );
  }
  if (agent.data === undefined) {
    return (
      <PointsFrame {...frame} testID="receptionist-screen">
        <LoadingView label="Loading" testID="receptionist-loading">
          <View style={{ gap: BODY_GAP }}>
            <Skeleton height={56} radius={20} />
            <Skeleton height={96} radius={20} />
          </View>
        </LoadingView>
      </PointsFrame>
    );
  }
  if (!agent.data.available && !agent.data.setUp) {
    return (
      <PointsFrame {...frame} centered testID="receptionist-screen">
        <EmptyState testID="receptionist-unavailable" icon="Headset" title={RECEPTIONIST_WORDS.unavailableTitle} message={RECEPTIONIST_WORDS.unavailableBody} />
      </PointsFrame>
    );
  }
  return <Agent {...frame} owner={owner} tool={tool} agent={agent.data} onBuyPoints={onBuyPoints} onLeave={onLeave} />;
}

type Chat = { id: number; role: 'you' | 'agent' | 'failed'; text: string; title?: string };

function Agent({ owner, tool, agent, title, subtitle, onBack, gap, onBuyPoints, onLeave }: Omit<ReceptionistScreenProps, 'balance'> & { agent: Receptionist; title: string; subtitle: string; gap: number }) {
  const [tab, setTab] = useState<ReceptionistTab>('setup');
  const [chat, setChat] = useState<Chat[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [goodNotice, setGoodNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const setUp = agent.setUp;
  const shown: ReceptionistTab = setUp ? tab : 'setup';
  const put = (next: Receptionist) => queryClient.setQueryData(receptionistKey(owner), next);

  const clear = async () => {
    setConfirming(false);
    try {
      const out = await clearReceptionist();
      put(out.receptionist);
      setChat([]);
      setTab('setup');
      setGoodNotice(out.atProvider === 'gone' ? RECEPTIONIST_WORDS.cleared : RECEPTIONIST_WORDS.clearing);
    } catch {
      setNotice(RECEPTIONIST_WORDS.clearFailed);
    }
  };

  return (
    <PointsFrame title={title} subtitle={subtitle} onBack={onBack} gap={gap} testID="receptionist-screen">
      {setUp ? (
        <FilterChips
          variant="option"
          label={RECEPTIONIST_WORDS.tabsLabel}
          items={[
            { value: 'setup', label: RECEPTIONIST_WORDS.tabs.setup },
            { value: 'knows', label: RECEPTIONIST_WORDS.tabs.knows },
            { value: 'chat', label: RECEPTIONIST_WORDS.tabs.chat },
          ]}
          value={shown}
          onChange={(v) => setTab(v as ReceptionistTab)}
          testID="receptionist-tabs"
        />
      ) : null}
      {shown === 'setup' ? <SetupTab agent={agent} onSaved={(next) => { put(next); setGoodNotice(RECEPTIONIST_WORDS.saved); }} onClear={() => setConfirming(true)} /> : null}
      {shown === 'knows' ? <KnowsTab agent={agent} onChange={put} /> : null}
      {shown === 'chat' ? <ChatTab owner={owner} tool={tool} chat={chat} setChat={setChat} onBuyPoints={onBuyPoints} onLeave={onLeave} /> : null}
      <BottomSheet visible={confirming} onClose={() => setConfirming(false)} label={RECEPTIONIST_WORDS.clearTitle} gap={space.md} testID="receptionist-clear-sheet">
        <Text variant="sheetTitleSm" accessibilityRole="header">
          {RECEPTIONIST_WORDS.clearTitle}
        </Text>
        <Text variant="body" tone="textSecondary">
          {RECEPTIONIST_WORDS.clearBody}
        </Text>
        <Button testID="receptionist-clear-confirm" label={RECEPTIONIST_WORDS.clearConfirm} full onPress={() => void clear()} />
        <Button testID="receptionist-clear-keep" label={RECEPTIONIST_WORDS.clearKeep} variant="secondary" full onPress={() => setConfirming(false)} />
      </BottomSheet>
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="receptionist-notice" /> : null}
      {goodNotice ? <Toast message={goodNotice} tone="success" placement="top" lines={2} onHide={() => setGoodNotice(null)} testID="receptionist-notice-ok" /> : null}
    </PointsFrame>
  );
}

/** The details: business name, what it offers, how it replies (and the language, when the Hub lists more than one). Save is refused with the reason while a field is over its limit. */
function SetupTab({ agent, onSaved, onClear }: { agent: Receptionist; onSaved: (next: Receptionist) => void; onClear: () => void }) {
  const [businessName, setBusinessName] = useState(agent.details.businessName);
  const [offer, setOffer] = useState(agent.details.offer);
  const [replyStyle, setReplyStyle] = useState(agent.details.replyStyle);
  const [language, setLanguage] = useState(agent.details.language || agent.limits.languages[0]?.code || '');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [shownProblem, setShownProblem] = useState<string | null>(null);
  const saving = useRef(false);
  const save = async () => {
    const problem = setupProblem({ businessName, offer, replyStyle });
    setShownProblem(problem);
    if (problem || saving.current) return;
    saving.current = true;
    setBusy(true);
    setFailure(null);
    try {
      onSaved(await saveReceptionist({ businessName: businessName.trim(), offer: offer.trim(), ...(replyStyle.trim() ? { replyStyle: replyStyle.trim() } : {}), ...(language ? { language } : {}) }));
    } catch (error) {
      setFailure(isApiError(error) && error.message ? error.message : TOOL_WORDS.unsentBody);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={styles.tab} testID="receptionist-setup">
      <Text variant="body" tone="textSecondary" style={{ fontSize: 13.5, lineHeight: canvasNormalLineHeight(13.5) }}>
        {RECEPTIONIST_WORDS.intro}
      </Text>
      <FieldBox label={RECEPTIONIST_WORDS.businessName} value={businessName} onChange={setBusinessName} placeholder={RECEPTIONIST_WORDS.businessPlaceholder} testID="receptionist-name" editable={!busy} />
      <FieldBox label={RECEPTIONIST_WORDS.offer} value={offer} onChange={setOffer} placeholder={RECEPTIONIST_WORDS.offerPlaceholder} multiline testID="receptionist-offer" editable={!busy} />
      <FieldBox label={RECEPTIONIST_WORDS.replyStyle} value={replyStyle} onChange={setReplyStyle} placeholder={RECEPTIONIST_WORDS.replyPlaceholder} multiline testID="receptionist-style" editable={!busy} />
      {agent.limits.languages.length > 1 ? (
        <FilterChips variant="option" label={RECEPTIONIST_WORDS.language} items={agent.limits.languages.map((l) => ({ value: l.code, label: l.name }))} value={language} onChange={setLanguage} testID="receptionist-language" />
      ) : null}
      {shownProblem ? (
        <Text variant="body" tone="danger" accessibilityLiveRegion="polite" testID="receptionist-problem" style={{ fontSize: 13, lineHeight: canvasNormalLineHeight(13) }}>
          {shownProblem}
        </Text>
      ) : null}
      {failure ? <Banner tone="danger" icon="CircleX" title={RECEPTIONIST_WORDS.saveFailed} body={failure} testID="receptionist-save-failed" /> : null}
      <Button testID="receptionist-save" label={RECEPTIONIST_WORDS.save} full loading={busy} onPress={() => void save()} />
      {agent.setUp ? <Button testID="receptionist-clear" label={RECEPTIONIST_WORDS.clear} variant="secondary" full onPress={onClear} /> : null}
    </View>
  );
}

type Adding = null | 'text' | 'link' | 'document';

/** What it knows: the things added (name, kind, size) with Remove, and an Add choice of text, a web page or a document from the phone. */
function KnowsTab({ agent, onChange }: { agent: Receptionist; onChange: (next: Receptionist) => void }) {
  const [adding, setAdding] = useState<Adding>(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState<number | null>(null);
  const [failure, setFailure] = useState<{ title: string; body: string } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const working = useRef(false);
  const full = agent.knowledge.length >= agent.limits.docsMax;
  const linkIssue = adding === 'link' ? knowledgeLinkProblem(link) : null;
  const reset = () => {
    setAdding(null);
    setName('');
    setText('');
    setLink('');
    setFailure(null);
  };
  const submit = async (item: Parameters<typeof addKnowledge>[0]) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setFailure(null);
    try {
      onChange(await addKnowledge(item));
      reset();
    } catch (error) {
      setFailure({ title: RECEPTIONIST_WORDS.addFailed, body: isApiError(error) && error.message ? error.message : TOOL_WORDS.unsentBody });
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const addDocument = async () => {
    if (working.current) return;
    setFailure(null);
    let picked;
    try {
      picked = await pickFile(['application/pdf', 'text/plain']);
    } catch {
      setFailure({ title: RECEPTIONIST_WORDS.addFailed, body: RECEPTIONIST_WORDS.documentNotAccepted });
      return;
    }
    if (!picked) return;
    const problem = documentProblem({ name: picked.name, contentType: picked.contentType, bytes: picked.blob.size }, agent.limits);
    if (problem) {
      picked.discard?.();
      setFailure({ title: RECEPTIONIST_WORDS.addFailed, body: problem });
      return;
    }
    working.current = true;
    setBusy(true);
    setShare(0);
    try {
      const up = await uploadRecording(picked, 'ai/input-doc', setShare);
      onChange(await addKnowledge({ kind: 'file', name: Array.from(picked.name).slice(0, RECEPTIONIST_LIMITS.knowledgeName).join(''), fileKey: up.key }));
      reset();
    } catch (error) {
      setFailure({ title: isApiError(error) && error.code === 'upload_failed' ? RECEPTIONIST_WORDS.documentFailedTitle : RECEPTIONIST_WORDS.addFailed, body: isApiError(error) && error.message ? error.message : RECEPTIONIST_WORDS.documentFailed });
    } finally {
      working.current = false;
      setBusy(false);
      setShare(null);
    }
  };
  const remove = async (id: string) => {
    if (removing) return;
    setRemoving(id);
    setFailure(null);
    try {
      onChange(await removeKnowledge(id));
    } catch {
      setFailure({ title: RECEPTIONIST_WORDS.addFailed, body: RECEPTIONIST_WORDS.removeFailed });
    } finally {
      setRemoving(null);
    }
  };
  const ready = adding === 'text' ? name.trim() !== '' && text.trim() !== '' : adding === 'link' ? name.trim() !== '' && link.trim() !== '' && linkIssue === null : false;
  return (
    <View style={styles.tab} testID="receptionist-knows">
      {agent.knowledge.length === 0 ? (
        <EmptyState testID="receptionist-knows-empty" icon="BookOpen" title={RECEPTIONIST_WORDS.knowsEmptyTitle} message={RECEPTIONIST_WORDS.knowsEmptyBody} />
      ) : (
        <GroupedList testID="receptionist-knowledge">
          {agent.knowledge.map((k) => (
            <ListRow
              key={k.id}
              testID={`knowledge-${k.id}`}
              lead={<IconTile icon={k.kind === 'url' ? 'Link' : k.kind === 'file' ? 'FileText' : 'Type'} tone="neutral" size={44} />}
              title={k.name}
              subtitle={knowledgeLine(k)}
              trailing={<Button testID={`knowledge-remove-${k.id}`} label={RECEPTIONIST_WORDS.removeLabel} variant="secondary" size="sm" loading={removing === k.id} onPress={() => void remove(k.id)} />}
            />
          ))}
        </GroupedList>
      )}
      {adding === null ? (
        full ? (
          <Text variant="body" tone="textMuted" testID="receptionist-full" style={{ fontSize: 13, lineHeight: canvasNormalLineHeight(13) }}>
            {RECEPTIONIST_WORDS.full(agent.limits.docsMax)}
          </Text>
        ) : (
          <View style={styles.addRow}>
            <Button testID="knowledge-add-text" label={RECEPTIONIST_WORDS.addText} variant="secondary" icon="Type" full disabled={busy} onPress={() => setAdding('text')} />
            <Button testID="knowledge-add-link" label={RECEPTIONIST_WORDS.addLink} variant="secondary" icon="Link" full disabled={busy} onPress={() => setAdding('link')} />
            <Button testID="knowledge-add-document" label={share !== null ? `${RECEPTIONIST_WORDS.addDocument} ${Math.round(share * 100)}%` : RECEPTIONIST_WORDS.addDocument} variant="secondary" icon="FileUp" full loading={busy && share !== null} disabled={busy} onPress={() => void addDocument()} />
          </View>
        )
      ) : (
        <View style={styles.tab}>
          <FieldBox label={RECEPTIONIST_WORDS.knowledgeName} value={name} onChange={setName} max={RECEPTIONIST_LIMITS.knowledgeName} testID="knowledge-name" editable={!busy} />
          {adding === 'text' ? (
            <FieldBox label={RECEPTIONIST_WORDS.textLabel} value={text} onChange={setText} max={agent.limits.textMaxChars} placeholder={RECEPTIONIST_WORDS.textPlaceholder} multiline testID="knowledge-text" editable={!busy} />
          ) : (
            <View style={{ gap: space.sm }}>
              <FieldBox label={RECEPTIONIST_WORDS.linkLabel} value={link} onChange={setLink} placeholder={RECEPTIONIST_WORDS.linkPlaceholder} url testID="knowledge-link" editable={!busy} />
              {linkIssue ? (
                <Text variant="body" tone="danger" accessibilityLiveRegion="polite" testID="knowledge-link-problem" style={{ fontSize: 13, lineHeight: canvasNormalLineHeight(13) }}>
                  {linkIssue}
                </Text>
              ) : null}
            </View>
          )}
          <Button
            testID="knowledge-save"
            label={RECEPTIONIST_WORDS.add}
            full
            loading={busy}
            disabled={!ready}
            onPress={() => void submit(adding === 'text' ? { kind: 'text', name: name.trim(), text: text.trim() } : { kind: 'url', name: name.trim(), url: link.trim() })}
          />
          <Button testID="knowledge-cancel" label={RECEPTIONIST_WORDS.cancel} variant="secondary" full disabled={busy} onPress={reset} />
        </View>
      )}
      {failure ? <Banner tone="danger" icon="CircleX" title={failure.title} body={failure.body} testID="knowledge-failed" /> : null}
    </View>
  );
}

/** Try it: PT2's frame with the replies above a message box. Each message is a job: the quote, the PT3 and PT7 sheets, one `Idempotency-Key`; a reply that fails says no points were taken. */
function ChatTab({ owner, tool, chat, setChat, onBuyPoints, onLeave }: { owner: string | null; tool: AiTool; chat: Chat[]; setChat: (next: (was: Chat[]) => Chat[]) => void; onBuyPoints: () => void; onLeave: () => void }) {
  const { colors } = useWawu();
  const [message, setMessage] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [unsent, setUnsent] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const sending = useRef(false);
  const pending = useRef<{ key: string; message: string; quoteToken: string } | null>(null);
  const next = useRef(1);
  const handled = useRef<string | null>(null);
  const limits = useQuery(receptionistQuery(owner), queryClient).data?.limits;
  const max = limits?.messageMaxChars ?? 0;
  const cost = useQuery({ queryKey: ['points', 'job-quote', owner ?? '', tool.action, 1], queryFn: () => fetchJobQuote({ action: tool.action as JobAction, units: 1 }), enabled: Boolean(owner), staleTime: 30_000 }, queryClient);
  // The reply, or the failure, goes into the list once, when the job is read as ended.
  const settle = (data: VoiceJob) => {
    if (handled.current === data.id) return;
    if (data.state === 'done' && outputText(data, 'text') !== null) {
      handled.current = data.id;
      setChat((was) => [...was, { id: next.current++, role: 'agent', text: outputText(data, 'text') ?? '' }]);
      setJobId(null);
      void queryClient.invalidateQueries({ queryKey: myPointsQuery(owner).queryKey });
    } else if (data.state === 'failed') {
      handled.current = data.id;
      const words = failedWords(data.message);
      setChat((was) => [...was, { id: next.current++, role: 'failed', title: words.title, text: words.body }]);
      setJobId(null);
      void queryClient.invalidateQueries({ queryKey: myPointsQuery(owner).queryKey });
    }
  };
  useQuery(
    {
      ...voiceJobQuery(owner, jobId),
      queryFn: async () => {
        const data = await fetchVoiceJob(jobId as string);
        settle(data);
        return data;
      },
      refetchInterval: (query) => (query.state.data === undefined || query.state.data.state === 'working' || (query.state.data.state === 'done' && outputText(query.state.data, 'text') === null) ? 2000 : false),
    },
    queryClient,
  );

  const send = async (intent: { key: string; message: string; quoteToken: string }) => {
    if (sending.current) return;
    sending.current = true;
    setStarting(true);
    setUnsent(false);
    setRefusal(null);
    pending.current = intent;
    try {
      const out = await startJob({ toolId: 'receptionist', request: { kind: 'message', message: intent.message }, quoteToken: intent.quoteToken, key: intent.key });
      if (out.kind === 'started') {
        pending.current = null;
        queryClient.setQueryData(voiceJobQuery(owner, out.job.id).queryKey, out.job);
        setJobId(out.job.id);
        void queryClient.invalidateQueries({ queryKey: myPointsQuery(owner).queryKey });
      } else if (out.kind === 'unanswered') setUnsent(true);
      else {
        pending.current = null;
        setRefusal(out.message);
        void queryClient.invalidateQueries({ queryKey: ['points', 'job-quote'] });
      }
    } finally {
      sending.current = false;
      setStarting(false);
    }
  };
  const check = useJobCheck({
    onReady: (quote) => {
      const said = message.trim();
      if (said === '') return;
      setChat((was) => [...was, { id: next.current++, role: 'you', text: said }]);
      setMessage('');
      void send({ key: newRequestKey(), message: said, quoteToken: quote.quoteToken });
    },
    onBuyPoints,
    onLeave,
  });
  const replying = jobId !== null || starting;
  const run = () => {
    if (message.trim() === '' || replying || check.checking || sending.current) return;
    check.check({ action: tool.action as JobAction, units: 1 });
  };
  return (
    <View style={styles.tab} testID="receptionist-chat">
      {chat.length === 0 && !replying ? (
        <Text variant="body" tone="textMuted" testID="chat-empty" style={{ fontSize: 13.5, lineHeight: canvasNormalLineHeight(13.5) }}>
          {RECEPTIONIST_WORDS.chatEmpty}
        </Text>
      ) : (
        <View style={styles.replies} testID="chat-replies">
          {chat.map((m) =>
            m.role === 'failed' ? (
              <Banner key={m.id} tone="danger" icon="CircleX" title={m.title ?? TOOL_WORDS.failedTitle} body={m.text} testID="chat-failed" />
            ) : (
              <View key={m.id} testID={`chat-${m.role}`} style={[styles.bubble, m.role === 'you' ? [styles.mine, { backgroundColor: colors.accent }] : [styles.theirs, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]]}>
                <Text variant="body" selectable style={[{ fontSize: 15, lineHeight: 15 * 1.45 }, m.role === 'you' ? { color: colors.textOnAccent } : null]}>
                  {m.text}
                </Text>
              </View>
            ),
          )}
          {replying ? (
            <Text variant="body" tone="textMuted" testID="chat-working" accessibilityLiveRegion="polite" style={{ fontSize: 13, lineHeight: canvasNormalLineHeight(13) }}>
              {'Replying'}
            </Text>
          ) : null}
        </View>
      )}
      {refusal ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.refusedTitle} body={refusal} testID="chat-refused" /> : null}
      {unsent ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.unsentTitle} body={TOOL_WORDS.unsentBody} testID="chat-unsent" /> : null}
      <View style={[styles.messageBox, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1.5, color: colors.accent, inset: true }] }]}>
        <TextInput
          testID="chat-message"
          accessibilityLabel={RECEPTIONIST_WORDS.messageLabel}
          multiline
          editable={!replying}
          value={message}
          onChangeText={(t) => setMessage(max > 0 && Array.from(t).length > max ? Array.from(t).slice(0, max).join('') : t)}
          placeholder={RECEPTIONIST_WORDS.messagePlaceholder}
          placeholderTextColor={colors.textMuted}
          textAlignVertical="top"
          style={[styles.messageInput, { color: colors.textPrimary }, font(400), browserOutlineOff]}
        />
      </View>
      {cost.data ? (
        <View style={styles.costRow} testID="tool-cost">
          <Icon name="Sparkles" size={16} color={colors.accentFg} strokeWidth={2.2} />
          <Text variant="body" style={{ fontSize: 14, lineHeight: canvasNormalLineHeight(14) }}>
            {'This uses '}
            <Text variant="body" style={[font(700), { fontSize: 14 }]}>{`${formatPointsCount(cost.data.costPoints)} points`}</Text>
          </Text>
        </View>
      ) : null}
      {unsent ? (
        <Button testID="chat-resend" label={TOOL_WORDS.tryAgain} full loading={starting} onPress={() => pending.current && void send(pending.current)} />
      ) : (
        <Button testID="chat-send" label={RECEPTIONIST_WORDS.send} full loading={check.checking || replying} disabled={message.trim() === ''} onPress={run} />
      )}
      {check.node}
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { gap: BODY_GAP },
  addRow: { gap: space.sm },
  replies: { gap: space.sm },
  bubble: { maxWidth: '88%', paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: radius.card },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start', borderWidth: 1 },
  messageBox: { borderRadius: radius.media, paddingVertical: space.md, paddingHorizontal: space.lg, minHeight: 76 },
  messageInput: { fontSize: 15, lineHeight: 15 * 1.5, padding: 0, margin: 0 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
