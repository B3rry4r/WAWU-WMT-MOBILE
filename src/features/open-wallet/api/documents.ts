import { Platform } from 'react-native';

import { api } from '@/api/client';
import { ApiError, isApiError, networkError, toApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

import { OPEN_WALLET_KEY } from './account';
import type { PickedFile } from '../documents/types';

/**
 * The opening's documents (KYC-06, NUV-03): `GET /money/identity/documents`
 * says whether this wallet takes documents at all (`required`), whether
 * uploads are open, how each kind stands, the largest file and the types
 * taken; `POST` sends one document, once, as multipart: `kind`, `file`, and
 * `file_back` for an ID with a back side, in the same request, of the same
 * type. WAWU keeps no copy of any file (it goes to the bank's review), so
 * the app holds the front until the back is taken and sends both together.
 *
 * Both answer 409 `wallet_not_open` until the opening's details have been
 * sent (`POST /money/wallet/open`): there is no entity to attach a file to.
 */
type View = components['schemas']['IdentityDocumentsView'];
type Envelope<T> = { statusCode: number; message: string; data: T | null };
type Answer = { data?: unknown; error?: unknown; response: Response };

export type DocumentKind = 'identity' | 'proof_of_address';
export type DocumentState = 'missing' | 'confirming' | 'send_again' | 'uploaded' | 'not_accepted' | 'needs_new';
export type DocumentRow = { kind: DocumentKind; state: DocumentState; sides: ('front' | 'back')[]; uploadedAt: string | null };
export type DocumentsView = {
  required: boolean;
  open: boolean;
  documents: DocumentRow[];
  /** `not_used`: no hosted selfie in this opening (R-39); `needed`; `done`. */
  selfie: 'not_used' | 'needed' | 'done';
  submitted: boolean;
  waitingFor: string[];
  maxBytes: number;
  acceptedTypes: string[];
};

const kinds: readonly DocumentKind[] = ['identity', 'proof_of_address'];
const states: readonly DocumentState[] = ['missing', 'confirming', 'send_again', 'uploaded', 'not_accepted', 'needs_new'];

function unreadable(): ApiError {
  return new ApiError('unknown', 200, 'Your documents could not be read. Try again.');
}

function readRow(value: unknown): DocumentRow {
  const v = value as Partial<DocumentRow> | null;
  if (!v || typeof v !== 'object' || !kinds.includes(v.kind as DocumentKind) || !states.includes(v.state as DocumentState) || !Array.isArray(v.sides)) {
    throw unreadable();
  }
  const sides = v.sides.filter((side): side is 'front' | 'back' => side === 'front' || side === 'back');
  return { kind: v.kind as DocumentKind, state: v.state as DocumentState, sides, uploadedAt: typeof v.uploadedAt === 'string' ? v.uploadedAt : null };
}

function readView(value: unknown): DocumentsView {
  const v = value as Partial<View> | null;
  if (!v || typeof v !== 'object' || typeof v.required !== 'boolean' || typeof v.open !== 'boolean' || !Array.isArray(v.documents)) throw unreadable();
  if (!Number.isSafeInteger(v.maxBytes) || !Array.isArray(v.acceptedTypes)) throw unreadable();
  return {
    required: v.required,
    open: v.open,
    documents: v.documents.map(readRow),
    selfie: v.selfie === 'needed' || v.selfie === 'done' ? v.selfie : 'not_used',
    submitted: v.submitted === true,
    waitingFor: Array.isArray(v.waitingFor) ? (v.waitingFor as string[]).filter((step) => typeof step === 'string') : [],
    maxBytes: v.maxBytes as number,
    acceptedTypes: v.acceptedTypes.filter((type): type is string => typeof type === 'string').map((type) => type.toLowerCase()),
  };
}

async function send(request: Promise<Answer>): Promise<unknown> {
  let answer: Answer;
  try {
    answer = await request;
  } catch (error) {
    throw isApiError(error) ? error : networkError();
  }
  if (!answer.response.ok) throw toApiError(answer.response.status, answer.error);
  return (answer.data as Envelope<unknown> | undefined)?.data;
}

/** GET /money/identity/documents. */
export async function fetchDocuments(): Promise<DocumentsView> {
  return readView(await send(api.GET('/api/hub/money/identity/documents')));
}

/**
 * True when both documents are in and the hosted selfie is all that is left (A6 is next): the Hub sends the opening
 * for review only once the selfie has passed, so until then nothing is being checked.
 */
export function selfieOnlyLeft(view: DocumentsView | null | undefined): boolean {
  return Boolean(view && !view.submitted && view.waitingFor.length === 1 && view.waitingFor[0] === 'selfie');
}

/** The row for one kind: always there, in the order identity, proof of address. */
export function rowOf(view: DocumentsView | undefined, kind: DocumentKind): DocumentRow | undefined {
  return view?.documents.find((row) => row.kind === kind);
}

/** What a refusal of the documents routes means to a screen (the server's `reason.code`). */
export type DocumentProblem = 'not_open' | 'closed' | 'in_progress' | 'review' | 'invalid' | 'rate_limited' | 'busy' | 'unreachable' | 'other';

const problemOf: Record<string, DocumentProblem> = {
  wallet_not_open: 'not_open',
  documents_closed: 'closed',
  document_in_progress: 'in_progress',
  identity_under_review: 'review',
  document_request_invalid: 'invalid',
  document_file_invalid: 'invalid',
  document_not_accepted: 'invalid',
  document_rate_limited: 'rate_limited',
  document_busy: 'busy',
  provider_unreachable: 'unreachable',
};

export function documentProblem(error: unknown): DocumentProblem {
  return isApiError(error) && error.code ? (problemOf[error.code] ?? 'other') : 'other';
}

/**
 * One file in the multipart form. The browser takes the bytes with a name; on the phone React Native's `FormData`
 * takes only `{ uri, name, type }`, so a file goes by where the app's own copy of it is.
 */
function appendFile(form: FormData, field: string, file: PickedFile) {
  if (Platform.OS === 'web' || !file.uri) form.append(field, file.blob, file.name);
  else form.append(field, { uri: file.uri, name: file.name, type: file.contentType } as unknown as Blob);
}

/** The ID's two sides, or a proof of address: one request. Resolves with the documents as they now stand. */
export async function uploadDocument(kind: DocumentKind, file: PickedFile, back?: PickedFile): Promise<DocumentsView> {
  const form = new FormData();
  form.append('kind', kind);
  appendFile(form, 'file', file);
  if (back) appendFile(form, 'file_back', back);
  const answer = api.POST('/api/hub/money/identity/documents', {
    // The contract types the two files as strings; the body is the multipart form itself, handed on as it is. It must
    // go in `body`: openapi-fetch skips the serializer when `body` is undefined, and the request then goes out empty.
    body: form as unknown as { kind: DocumentKind; file: string },
    bodySerializer: (body) => body as unknown as FormData,
  });
  return readView(await send(answer));
}

/** True when a file may be sent: its type is one the server takes and it is not over the largest size (when the server has said). */
export function fileProblem(file: PickedFile, view: DocumentsView | undefined): 'type' | 'size' | null {
  if (view && view.acceptedTypes.length > 0) {
    const type = file.contentType.toLowerCase();
    const subtype = type.split('/')[1] ?? type;
    const named = (accepted: string) => accepted === type || accepted === subtype || accepted === `.${subtype}` || (subtype === 'jpeg' && (accepted === 'jpg' || accepted === '.jpg'));
    if (!view.acceptedTypes.some(named)) return 'type';
  }
  if (view && file.blob.size > view.maxBytes) return 'size';
  return null;
}

export const DOCUMENTS_KEY = [OPEN_WALLET_KEY, 'documents'] as const;
