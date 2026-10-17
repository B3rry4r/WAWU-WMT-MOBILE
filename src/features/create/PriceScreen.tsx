import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { APP_NAME } from '@/components/BrandMark';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { formatMoney } from '@/components/Money';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { font, space, text, useWawu } from '@/theme';

import { allowanceKey, createContent } from './api';
import { CreateFrame } from './CreateFrame';
import { resetDraft, useDraft, type UploadedFile } from './draft';
import { cleanPrice, groupDigits, priceOf, priceReady, setDetails, setSent, useDetails, type AccessType, type Details } from './details';
import { formatBytes, iconOf, labelOf, type FormatId } from './model';
import { Stepper } from './parts';

/** me.js `price`: the price figure at 22 (the board's `fs`), 8 under its label; the cover 52 by 66 with 10 corners; the summary card 12 by 14. */
const priceMetrics = { value: 22, sign: 22, coverW: 52, coverH: 66, coverCorner: 10, title: 14.5, meta: 12.5, metaGap: 3, padV: space.md, padH: 14, note: 12.5 } as const;
/** The "Free for everyone" card: 14 by 16, a 44 round gift, 12 between it and the words, 15.5 over 12.5 two below. */
const freeMetrics = { padV: 14, padH: space.lg, between: space.md, icon: 44, title: 15.5, line: 12.5, lineGap: 2 } as const;

/** Alan Sans has no Naira sign (U+20A6), so the platform font draws it, as `Money` does (D15 in DECISIONS.md). */
const platformFont = 'System';

export const MODES = [
  { value: 'paid', label: 'Paid' },
  { value: 'free', label: 'Free' },
] as const satisfies readonly { value: AccessType; label: string }[];

/** `84 pages`, or what the file weighs when it does not say how many pages it has. */
const sizeOf = (file: UploadedFile): string => (file.pages ? `${file.pages} ${file.pages === 1 ? 'page' : 'pages'}` : formatBytes(file.bytes));

/** "PDF · 84 pages · preview 12 pages": the format, then the full file and the preview, each as the person's own file says. */
export function pieceMeta(format: FormatId, full: UploadedFile, preview: UploadedFile): string {
  return `${labelOf(format)} · ${sizeOf(full)} · preview ${sizeOf(preview)}`;
}

/** The sentence under a refused send: the Hub's own words when it gave them, else one the person can act on. */
export const sendFailure = (error: unknown): string => (error instanceof ApiError && error.message ? error.message : 'We could not send it. Check your connection and try again.');

export type PriceScreenProps = {
  format: FormatId;
  onBack: () => void;
  /** Opens M25 once the Hub has taken the piece. */
  onSent: () => void;
};

/**
 * M24 · Price (step 5 of 5) and M37 (the same step with Free picked). Paid asks for a price in whole naira; Free sends 0 and
 * says what free means (R-8). Send for review is the create call: the Hub files every piece as pending, so a piece that goes
 * through is in review, and the files then belong to it, not to the draft. Left out because nothing the Hub serves backs them
 * (G-ME-08-2): the Dollar and USDT picker (R-64), the preset prices, "You earn per sale", "Your share" and "Listing fee".
 */
export function PriceScreen({ format, onBack, onSent }: PriceScreenProps) {
  const details = useDetails();
  const { full, preview } = useDraft();
  const queryClient = useQueryClient();
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const free = details.accessType === 'free';

  const send = async () => {
    const price = free ? 0 : priceOf(details.price);
    if (sending.current || price === null || !full || !preview || details.category === null) return;
    sending.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const sent = await createContent({
        contentType: format,
        title: details.title.trim(),
        description: details.description.trim(),
        category: details.category,
        accessType: details.accessType,
        price,
        previewAsset: preview.fileUrl,
        fullAsset: full.fileUrl,
      });
      resetDraft();
      setSent({ title: sent.title });
      void queryClient.invalidateQueries({ queryKey: allowanceKey });
      onSent();
    } catch (error) {
      setFailure(sendFailure(error));
      sending.current = false;
      setBusy(false);
    }
  };

  const foot = (
    <>
      {failure ? <Banner testID="price-failure" tone="danger" title="Not sent" body={failure} /> : null}
      {free ? null : <NoteLine />}
      <Button testID="create-send" label="Send for review" full loading={busy} disabled={!priceReady(details)} onPress={() => void send()} />
    </>
  );

  return (
    <CreateFrame testID="price-screen" title={`New ${labelOf(format)}`} subtitle="Step 5 of 5" onLeave={onBack} foot={foot}>
      <Stepper active={3} />
      <SegmentedTabs
        testID="price-mode"
        label="Paid or free"
        items={MODES}
        value={details.accessType}
        onChange={(accessType) => {
          setFailure(null);
          setDetails({ accessType });
        }}
      />
      {free ? (
        <>
          <FreeCard />
          <Text variant="muted" testID="price-free-count">
            Free pieces count toward your uploads.
          </Text>
        </>
      ) : (
        <>
          <PriceField details={details} onChange={(price) => setDetails({ price: cleanPrice(price) })} />
          {full && preview ? <PieceCard format={format} title={details.title.trim()} meta={pieceMeta(format, full, preview)} cover={preview} /> : null}
        </>
      )}
    </CreateFrame>
  );
}

/** "Who Made This? checks every piece before it goes live": true of every piece, the Hub files each new one as pending. */
function NoteLine() {
  const { colors } = useWawu();
  return (
    <Text variant="caption" testID="price-note" style={[styles.note, { color: colors.textMuted }]}>
      {`${APP_NAME}? checks every piece before it goes live`}
    </Text>
  );
}

/** kit `field` with the figure at 22: a sign, then the digits, grouped in threes as they are typed. Whole naira only. */
export function PriceField({ details, onChange }: { details: Details; onChange: (digits: string) => void }) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const sign = formatMoney(0, { decimals: false }).replace(/\d/g, '');
  return (
    <View style={styles.fieldRoot}>
      <Text variant="secondary" tone="textSecondary" style={styles.fieldLabel}>
        Price per sale
      </Text>
      <View
        style={[
          styles.fieldBox,
          { backgroundColor: colors.surfaceInput, borderColor: focused ? colors.accent : colors.borderHairline, borderWidth: focused ? fieldMetrics.ring : StyleSheet.hairlineWidth },
        ]}
      >
        <Text variant="body" style={[font(700), styles.sign, { fontFamily: platformFont, fontWeight: '700' }]}>
          {sign}
        </Text>
        <TextInput
          testID="price-input"
          accessibilityLabel="Price per sale in naira"
          value={groupDigits(details.price)}
          onChangeText={onChange}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
        />
      </View>
    </View>
  );
}

/** The piece as a buyer will meet it: its cover (the preview, when that is a picture), its title, and what was uploaded. */
function PieceCard({ format, title, meta, cover }: { format: FormatId; title: string; meta: string; cover: UploadedFile }) {
  const { colors } = useWawu();
  const [broken, setBroken] = useState(false);
  const still = cover.previewUri && cover.contentType.startsWith('image/') && !broken ? cover.previewUri : null;
  return (
    <Card padded testID="price-piece" style={styles.piece}>
      <View style={styles.pieceRow}>
        <View style={[styles.cover, { backgroundColor: colors.surfaceSunken }]}>
          {still ? (
            <Image source={{ uri: still }} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.centre]}>
              <Icon name={iconOf(format)} size={space.s2xl} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.pieceWords}>
          <Text variant="body" numberOfLines={2} style={[font(600), styles.pieceTitle]}>
            {title}
          </Text>
          <Text variant="caption" tone="textMuted" numberOfLines={2} style={styles.pieceMeta}>
            {meta}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/** M37's card: "Free for everyone", then what that means: anyone can open it and fans can still tip (R-8). */
export function FreeCard() {
  return (
    <Card padded testID="price-free" style={styles.free}>
      <View style={styles.freeRow}>
        <IconTile icon="Gift" tone="accent" size={freeMetrics.icon} />
        <View style={styles.pieceWords}>
          <Text variant="body" style={[font(600), styles.freeTitle]}>
            Free for everyone
          </Text>
          <Text variant="caption" tone="textMuted" style={styles.freeLine}>
            Anyone can open it. Fans can still tip.
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  note: { textAlign: 'center', fontSize: priceMetrics.note },
  fieldRoot: { alignSelf: 'stretch' },
  fieldLabel: { ...font(600), fontSize: fieldMetrics.label, marginBottom: space.sm },
  fieldBox: { height: fieldMetrics.height, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.lg, borderRadius: fieldMetrics.radius },
  sign: { fontSize: priceMetrics.sign },
  input: { ...text.body, ...font(700), flex: 1, fontSize: priceMetrics.value, paddingVertical: 0 },
  piece: { paddingVertical: priceMetrics.padV, paddingHorizontal: priceMetrics.padH },
  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cover: { width: priceMetrics.coverW, height: priceMetrics.coverH, borderRadius: priceMetrics.coverCorner, overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  pieceWords: { flex: 1, minWidth: 0 },
  pieceTitle: { fontSize: priceMetrics.title },
  pieceMeta: { fontSize: priceMetrics.meta, marginTop: priceMetrics.metaGap },
  free: { paddingVertical: freeMetrics.padV, paddingHorizontal: freeMetrics.padH },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: freeMetrics.between },
  freeTitle: { fontSize: freeMetrics.title },
  freeLine: { fontSize: freeMetrics.line, marginTop: freeMetrics.lineGap },
});
