import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { GroupedList } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { SkeletonRows } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { setHubAccountType } from '@/features/after-signup/hubAccountType';
import { canvasNormalLineHeight, font, radius, space, type, useWawu } from '@/theme';

import { applyIn, fetchFields, fetchIsCreator, fetchMine, proKeys, refreshListings, type Application, type CredentialKind, type ProField } from './api';
import {
  CREDENTIAL_KINDS,
  addService,
  applicationBody,
  credentialProblems,
  limits,
  openFields,
  rejectedIn,
  sentenceOf,
  servicesProblems,
  type CredentialForm,
  type ServicesForm,
} from './model';
import { AddChip, ChipGroup, Note, PickedChip } from './parts';
import { ProFrame } from './ProFrame';
import { canPickDocument, pickDocument } from './pickDocument';
import { uploadDocument } from './upload';

export const SCREEN_TITLE = 'Offer your services';

/** design/_gen/kit.js line 67, `result`: an 88 circle with a 42 glyph at 2.2, 10 between the parts, the title 8 lower; pros.js line 35 sets `pt: 120`, `gap: 20`. */
const RESULT = { circle: 88, stroke: 2.2, stack: 10, titleNudge: 8, line: 14.5, paragraphMax: 290, top: 120, between: 20 } as const;
/** pros.js line 34: the file's card is 14 by 16, a 12 gap to its words, 18 round; its name at 15 and its state at 12.5. */
const fileMetrics = { ten: 10, lead2words: 12, padV: 14, name: 15, state: 12.5, cross: 18, lead: 44 } as const;

export type ApplyScreenProps = {
  onBack: () => void;
  /** P7's Done. */
  onDone: () => void;
  /** P7's My listings. */
  onMyListings: () => void;
  /** A field id to start from (P8's Apply again). */
  initialField?: string;
};

/**
 * P10: the gate for an account that is not a creator's. Become a creator (AUTH-06) records the creator type on the Hub (no wallet is
 * opened, R-6), re-reads what depends on it, and opens A11 (Set up your account). A refusal leaves the gate as it was, with a line
 * saying so.
 */
export function CreatorGate({ title, onBack }: { title: string; onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const become = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await setHubAccountType('creator');
      await queryClient.invalidateQueries();
      router.push('/creator-setup');
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ProFrame title={title} onBack={onBack} gap={space.lg} centered testID="pro-gate">
      <EmptyState icon="UserCog" title="This needs a creator account" message="Setting one up is free." />
      <Button label="Become a creator" size="md" onPress={() => void become()} loading={busy} style={styles.gateButton} testID="pro-become-creator" />
      {failed ? (
        <Text variant="secondary" tone="danger" accessibilityRole="alert" testID="pro-become-failed">
          Couldn’t set up your account. Try again.
        </Text>
      ) : null}
    </ProFrame>
  );
}

/** What the three calls P5 to P7 need say, and the screen they belong to while they load or fail. */
export function ApplyScreen(props: ApplyScreenProps) {
  const creator = useQuery({ queryKey: proKeys.account, queryFn: fetchIsCreator });
  const isCreator = creator.data === true;
  const fields = useQuery({ queryKey: proKeys.fields, queryFn: fetchFields, enabled: isCreator });
  const mine = useQuery({ queryKey: proKeys.mine, queryFn: fetchMine, enabled: isCreator });

  if (creator.data === false) return <CreatorGate title={SCREEN_TITLE} onBack={props.onBack} />;
  // The full-screen error is for a first load that never got data. Once the three answers are held, a failed refetch keeps the flow (D4).
  const failed = creator.isError && creator.data === undefined ? creator : fields.isError && !fields.data ? fields : mine.isError && !mine.data ? mine : null;
  if (failed) {
    return (
      <ProFrame title={SCREEN_TITLE} onBack={props.onBack} gap={space.lg} centered testID="pro-error">
        <ErrorState
          title="This could not be loaded"
          message={sentenceOf(failed.error, 'Something went wrong. Try again.')}
          onRetry={() => void Promise.all([creator.isError && creator.refetch(), fields.isError && fields.refetch(), mine.isError && mine.refetch()])}
        />
      </ProFrame>
    );
  }
  if (!fields.data || !mine.data) {
    return (
      <ProFrame title={SCREEN_TITLE} onBack={props.onBack} gap={space.lg} testID="pro-loading">
        <SkeletonRows count={3} />
      </ProFrame>
    );
  }
  const stale = creator.isError ? creator : fields.isError ? fields : mine.isError ? mine : null;
  return (
    <ApplyFlow
      {...props}
      fields={fields.data}
      mine={mine.data}
      refresh={stale ? { problem: sentenceOf(stale.error, 'Something went wrong. Try again.'), retry: () => void Promise.all([creator.isError && creator.refetch(), fields.isError && fields.refetch(), mine.isError && mine.refetch()]) } : null}
    />
  );
}

/** The system Back (the Android button, the browser's back) does what the on-screen back does while `back` is given. */
function useSystemBack(back: (() => void) | null, webEntry: boolean): void {
  const handler = useRef(back);
  const on = back !== null;
  useEffect(() => {
    handler.current = back;
  });
  useEffect(() => {
    if (!on) return undefined;
    if (Platform.OS !== 'web') {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handler.current?.();
        return true;
      });
      return () => sub.remove();
    }
    if (!webEntry || typeof window === 'undefined') return undefined;
    // One history entry stands for the step, so the browser's back lands on the step before it and not off the screen.
    window.history.pushState({ proStep: true }, '');
    let consumed = false;
    const onPop = () => {
      consumed = true;
      handler.current?.();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!consumed) window.history.back();
    };
  }, [on, webEntry]);
}

type Step = 'services' | 'credentials' | 'sent';
type Doc = { key: number; name: string; state: 'uploading' | 'done' | 'failed'; url?: string; retry?: () => void };

type Refresh = { problem: string; retry: () => void } | null;

function ApplyFlow({ fields, mine, initialField, onBack, onDone, onMyListings, refresh }: ApplyScreenProps & { fields: ProField[]; mine: Application[]; refresh: Refresh }) {
  const client = useQueryClient();
  const free = openFields(fields, mine);
  const start = free.find((f) => f.id === initialField);
  const again = start ? rejectedIn(start, mine) : undefined;

  const [step, setStep] = useState<Step>('services');
  const [selected, setSelected] = useState<string[]>(start ? [start.id] : []);
  const [form, setForm] = useState<ServicesForm>({ headline: again?.headline ?? '', about: again?.about ?? '', services: again?.services ?? [] });
  const [creds, setCreds] = useState<CredentialForm>({
    kind: again?.credentialKind ?? 'licence',
    licenceNumber: again?.licenceNumber ?? '',
    issuer: again?.issuingBody ?? '',
  });
  const [docs, setDocs] = useState<Doc[]>([]);
  const [checked, setChecked] = useState(false);
  const [sheet, setSheet] = useState<'field' | 'service' | null>(null);
  const [typed, setTyped] = useState('');
  const [typedProblem, setTypedProblem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sentLabels, setSentLabels] = useState<string[]>([]);
  const [leftOut, setLeftOut] = useState<string[]>([]);
  const inFlight = useRef(false);
  const docKey = useRef(0);

  const chosen = fields.filter((f) => selected.includes(f.id));
  const regulated = chosen.some((f) => f.regulated);
  const addable = free.filter((f) => !selected.includes(f.id));
  const problems = servicesProblems(form, selected);
  const uploading = docs.some((d) => d.state === 'uploading');
  const notUploaded = docs.some((d) => d.state === 'failed');
  const credProblems = credentialProblems(creds, regulated, uploading);

  const toServices = () => setStep('services');
  useSystemBack(step === 'credentials' ? toServices : step === 'sent' ? onDone : null, step === 'credentials');

  const next = () => {
    setChecked(true);
    if (Object.keys(problems).length > 0) return;
    setChecked(false);
    setStep('credentials');
  };

  const send = async () => {
    setChecked(true);
    if (Object.keys(credProblems).length > 0 || notUploaded || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setProblem(null);
    const urls = docs.flatMap((d) => (d.state === 'done' && d.url ? [d.url] : []));
    const filed: ProField[] = [];
    const refused: ProField[] = [];
    let failure: { field: ProField; error: unknown } | null = null;
    for (const field of chosen) {
      try {
        await applyIn(applicationBody(field, form, creds, urls));
        filed.push(field);
      } catch (error) {
        // The Hub already holds an application in this field: it is not a reason to hold back the others (D7).
        if (isApiError(error) && error.kind === 'conflict') {
          refused.push(field);
          continue;
        }
        failure = { field, error };
        break;
      }
    }
    inFlight.current = false;
    setSubmitting(false);
    if (filed.length > 0 || refused.length > 0) void refreshListings(client);
    const labels = [...sentLabels, ...filed.map((f) => f.label)];
    setSentLabels(labels);
    const out = [...leftOut, ...refused.map((f) => f.label)];
    setLeftOut(out);
    const gone = [...filed, ...refused];
    setSelected((ids) => ids.filter((id) => !gone.some((f) => f.id === id)));
    const alreadyIn = refused.length > 0 ? `${refused.map((f) => f.label).join(', ')} was left out: you already have an application in this field. ` : '';
    if (failure) {
      const sent = filed.length > 0 ? `${filed.map((f) => f.label).join(', ')} was sent. ` : '';
      setProblem(`${alreadyIn}${sent}${failure.field.label} could not be sent. ${sentenceOf(failure.error, 'Something went wrong. Try again.')}`);
      return;
    }
    if (labels.length === 0) {
      setProblem(alreadyIn.trim());
      return;
    }
    setStep('sent');
  };

  const upload = async (key: number, picked: NonNullable<Awaited<ReturnType<typeof pickDocument>>>) => {
    setDocs((rows) => rows.map((d) => (d.key === key ? { ...d, state: 'uploading', retry: undefined } : d)));
    try {
      const url = await uploadDocument(picked);
      setDocs((rows) => rows.map((d) => (d.key === key ? { ...d, state: 'done', url, retry: undefined } : d)));
    } catch {
      setDocs((rows) => rows.map((d) => (d.key === key ? { ...d, state: 'failed', retry: () => void upload(key, picked) } : d)));
    }
  };

  const choose = async () => {
    const picked = await pickDocument();
    if (!picked) return;
    docKey.current += 1;
    const key = docKey.current;
    setDocs((rows) => [...rows, { key, name: picked.name, state: 'uploading' }]);
    void upload(key, picked);
  };

  if (step === 'sent') return <Sent labels={sentLabels} leftOut={leftOut} onDone={onDone} onMyListings={onMyListings} />;

  if (step === 'credentials') {
    return (
      <ProFrame
        title={SCREEN_TITLE}
        onBack={toServices}
        gap={space.lg}
        testID="pro-credentials"
        foot={<Button label="Send for review" full loading={submitting} onPress={() => void send()} testID="pro-send" />}
      >
        {regulated ? <Note tone="warning" icon="ShieldAlert" title="This field is regulated" body="We check your licence with the body that issued it." testID="pro-regulated" /> : null}
        <RefreshNote refresh={refresh} />
        {problem ? (
          <Note tone="warning" icon="CircleAlert" title="This was not sent" body={problem} testID="pro-send-problem" />
        ) : null}
        <View style={styles.kinds}>
          <Text variant="label" style={styles.kindsLabel}>
            What are you showing us?
          </Text>
          <FilterChips
            variant="option"
            label="What you are showing us"
            items={CREDENTIAL_KINDS}
            value={creds.kind}
            onChange={(kind: CredentialKind) => setCreds((c) => ({ ...c, kind }))}
          />
          {checked && credProblems.kind ? (
            <Text variant="caption" tone="danger" accessibilityRole="alert">
              {credProblems.kind}
            </Text>
          ) : null}
        </View>
        {creds.kind === 'licence' ? (
          <TextField
            label="Licence number"
            value={creds.licenceNumber}
            onChangeText={(licenceNumber) => setCreds((c) => ({ ...c, licenceNumber }))}
            error={checked ? credProblems.licenceNumber : undefined}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={limits.licence + 20}
            testID="pro-licence"
          />
        ) : null}
        {creds.kind !== 'portfolio' ? (
          <TextField
            label="Who issued it"
            value={creds.issuer}
            onChangeText={(issuer) => setCreds((c) => ({ ...c, issuer }))}
            error={checked ? credProblems.issuer : undefined}
            maxLength={limits.issuer + 20}
            testID="pro-issuer"
          />
        ) : null}
        {docs.map((d) => (
          <FileRow key={d.key} doc={d} onRemove={() => setDocs((rows) => rows.filter((r) => r.key !== d.key))} />
        ))}
        {notUploaded ? (
          <Text variant="caption" tone="danger" accessibilityRole="alert" testID="pro-send-waiting">
            Send is waiting: retry the file that did not upload, or remove it.
          </Text>
        ) : null}
        {checked && credProblems.upload ? (
          <Text variant="caption" tone="danger" accessibilityRole="alert">
            {credProblems.upload}
          </Text>
        ) : null}
        {canPickDocument && docs.length === 0 ? (
          <Button
            label="Upload a document"
            icon="Upload"
            variant="secondary"
            full
            onPress={() => void choose()}
            testID="pro-upload"
          />
        ) : null}
      </ProFrame>
    );
  }

  const noneLeft = free.length === 0 && selected.length === 0;
  if (noneLeft) {
    return (
      <ProFrame title={SCREEN_TITLE} onBack={onBack} gap={space.lg} centered testID="pro-all-applied">
        <EmptyState
          icon="BriefcaseBusiness"
          title="You have applied in every field"
          message="Your applications and their answers are in your listings."
          action={{ label: 'My listings', onPress: onMyListings }}
        />
      </ProFrame>
    );
  }

  return (
    <ProFrame
      title={SCREEN_TITLE}
      onBack={onBack}
      gap={space.lg}
      testID="pro-services"
      foot={<Button label="Continue" full onPress={next} testID="pro-continue" />}
    >
      <RefreshNote refresh={refresh} />
      {problem ? <Note tone="warning" icon="CircleAlert" title="This was not sent" body={problem} testID="pro-send-problem" /> : null}
      <Text variant="muted">People find you here and pay to send the first message.</Text>
      <ChipGroup label="Which fields?" error={checked ? problems.fields : undefined}>
        {chosen.map((f) => (
          <PickedChip key={f.id} label={f.label} onRemove={() => setSelected((ids) => ids.filter((id) => id !== f.id))} testID={`pro-field-${f.id}`} />
        ))}
        {addable.length > 0 ? <AddChip onPress={() => setSheet('field')} testID="pro-add-field" /> : null}
      </ChipGroup>
      <TextField
        label="One line about what you do"
        value={form.headline}
        onChangeText={(headline) => setForm((f) => ({ ...f, headline }))}
        error={checked ? problems.headline : undefined}
        maxLength={limits.headlineMax + 20}
        testID="pro-headline"
      />
      <TextField
        multiline
        label="About your work"
        value={form.about}
        onChangeText={(about) => setForm((f) => ({ ...f, about }))}
        error={checked ? problems.about : undefined}
        testID="pro-about"
      />
      <ChipGroup label="What do you take on?">
        {form.services.map((s) => (
          <PickedChip key={s} label={s} onRemove={() => setForm((f) => ({ ...f, services: f.services.filter((x) => x !== s) }))} />
        ))}
        {form.services.length < limits.services ? <AddChip onPress={() => setSheet('service')} testID="pro-add-service" /> : null}
      </ChipGroup>

      <BottomSheet visible={sheet === 'field'} onClose={() => setSheet(null)} label="Add a field" testID="pro-field-sheet">
        <Text variant="sheetTitleSm">Add a field</Text>
        <GroupedList>
          {addable.map((f) => (
            <ListRow
              key={f.id}
              title={f.label}
              onPress={() => {
                setSelected((ids) => [...ids, f.id]);
                setSheet(null);
              }}
              testID={`pro-pick-${f.id}`}
            />
          ))}
        </GroupedList>
      </BottomSheet>
      <BottomSheet
        visible={sheet === 'service'}
        onClose={() => {
          setSheet(null);
          setTypedProblem(null);
        }}
        label="Add something you take on"
        testID="pro-service-sheet"
      >
        <Text variant="sheetTitleSm">What do you take on?</Text>
        <TextField label="For example, Tax filing" value={typed} onChangeText={setTyped} error={typedProblem ?? undefined} testID="pro-service-input" />
        <Button
          label="Add"
          full
          onPress={() => {
            const out = addService(form.services, typed);
            if (out.problem) return setTypedProblem(out.problem);
            setForm((f) => ({ ...f, services: out.list }));
            setTyped('');
            setTypedProblem(null);
            setSheet(null);
          }}
          testID="pro-service-add"
        />
      </BottomSheet>
    </ProFrame>
  );
}

/** A refresh that failed after the flow had its data: the form stays, and this says so with a retry (D4). */
function RefreshNote({ refresh }: { refresh: Refresh }) {
  if (!refresh) return null;
  return (
    <Note tone="warning" icon="WifiOff" title="Could not check for updates" body={`${refresh.problem} What you wrote is kept.`} testID="pro-refresh-problem">
      <Button label="Try again" variant="secondary" size="sm" onPress={refresh.retry} testID="pro-refresh-retry" />
    </Note>
  );
}

function FileRow({ doc, onRemove }: { doc: Doc; onRemove: () => void }) {
  const { colors } = useWawu();
  const state = doc.state === 'done' ? 'Uploaded' : doc.state === 'uploading' ? 'Uploading' : 'Did not upload. Try again';
  return (
    <View testID="pro-file" style={[styles.file, { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
      <IconTile icon="FileCheck2" tone={doc.state === 'failed' ? 'danger' : 'in'} size={fileMetrics.lead} />
      <Pressable accessibilityRole={doc.retry ? 'button' : undefined} disabled={!doc.retry} onPress={doc.retry} style={styles.fileWords}>
        <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: fileMetrics.name }]}>
          {doc.name}
        </Text>
        <Text variant="caption" tone={doc.state === 'failed' ? 'danger' : 'textMuted'}>
          {state}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${doc.name}`} onPress={onRemove} hitSlop={space.sm}>
        <Icon name="X" size={fileMetrics.cross} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

function Sent({ labels, leftOut, onDone, onMyListings }: { labels: string[]; leftOut: string[]; onDone: () => void; onMyListings: () => void }) {
  return (
    <ProFrame
      gap={RESULT.between}
      top={RESULT.top}
      testID="pro-sent"
      foot={
        <View style={styles.footRow}>
          <Button label="My listings" variant="secondary" style={styles.half} onPress={onMyListings} testID="pro-my-listings" />
          <Button label="Done" style={styles.half} onPress={onDone} testID="pro-done" />
        </View>
      }
    >
      <View style={styles.result}>
        <IconTile icon="Clock" tone="warn" size={RESULT.circle} strokeWidth={RESULT.stroke} />
        <Text variant="title" style={styles.resultTitle}>
          Under review
        </Text>
        <Text variant="secondary" style={styles.resultLine}>
          {labels.join(', ')}
        </Text>
      </View>
      {leftOut.length > 0 ? (
        <Text variant="muted" style={styles.centerText} testID="pro-left-out">
          {`${leftOut.join(', ')} was left out: you already have an application in this field.`}
        </Text>
      ) : null}
      <Text variant="muted" style={styles.centerText}>
        {"A person checks it. You'll see the outcome in your listings."}
      </Text>
    </ProFrame>
  );
}

const styles = StyleSheet.create({
  // P10's button is the board's compact pill (Btn size md, full false): the frame's column would stretch it, so it centres itself.
  gateButton: { alignSelf: 'center' },
  kinds: { gap: fileMetrics.ten },
  kindsLabel: { lineHeight: canvasNormalLineHeight(type.size.label) },
  file: { flexDirection: 'row', alignItems: 'center', gap: fileMetrics.lead2words, paddingVertical: fileMetrics.padV, paddingHorizontal: space.lg, borderRadius: radius.tile },
  fileWords: { flex: 1, gap: space.xs / 2 },
  footRow: { flexDirection: 'row', gap: fileMetrics.ten },
  half: { flex: 1 },
  result: { alignItems: 'center', gap: RESULT.stack, paddingHorizontal: space.sm },
  resultTitle: { marginTop: RESULT.titleNudge, textAlign: 'center', lineHeight: canvasNormalLineHeight(type.size.title) },
  resultLine: { fontSize: RESULT.line, lineHeight: canvasNormalLineHeight(RESULT.line), textAlign: 'center' },
  /** The canvas sets `text-wrap: pretty` (kit.js line 33), so this line breaks before "your" at about 270 wide; 290 breaks it the same way on every platform. */
  centerText: { textAlign: 'center', alignSelf: 'center', maxWidth: RESULT.paragraphMax },
});
