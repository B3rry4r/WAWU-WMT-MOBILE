import { formatBytes } from '@/features/create/model';

import type { Receptionist } from './voiceToolsApi';
import { linkProblem as httpsProblem } from './voiceToolsModel';

/**
 * The words and plain rules of the Receptionist (POINTS-12, R-109): set it up, tell it what it knows, and talk to it by text. No board draws it
 * (R-29). Nothing here names a telephone, WhatsApp, a number or a call (R-109 point 3), and no provider is named (R-68). Every limit is the Hub's
 * (`GET /ai-tools/receptionist`); the three set-up limits below are the contract's own `maxLength`s, which `GET` does not repeat (a spec reads the
 * contract and fails if they differ).
 */
export const RECEPTIONIST_LIMITS = { businessName: 80, offer: 2000, replyStyle: 1000, knowledgeName: 120, link: 4000 } as const;

export const RECEPTIONIST_WORDS = {
  tabs: { setup: 'Set-up', knows: 'What it knows', chat: 'Try it' },
  tabsLabel: 'Receptionist sections',
  intro: 'Tell it about your business. It answers from what you give it.',
  businessName: 'Business name',
  businessPlaceholder: 'What your business is called',
  offer: 'What you offer',
  offerPlaceholder: 'What you sell or do, prices, hours, anything people ask',
  replyStyle: 'How it should reply',
  replyPlaceholder: 'Optional. For example, short and friendly',
  language: 'Language',
  save: 'Save',
  saved: 'Saved.',
  saveFailed: 'We could not save that',
  clear: 'Clear everything',
  clearTitle: 'Clear your Receptionist?',
  clearBody: 'It forgets everything you told it and everything it knew, and the chat is cleared.',
  clearConfirm: 'Clear',
  clearKeep: 'Keep it',
  cleared: 'Your Receptionist is cleared.',
  clearing: 'Your Receptionist is cleared. We are still clearing the last copy.',
  clearFailed: 'We could not do that. Try again.',
  needName: 'Add your business name and what you offer to save.',
  overLimit: (what: string, max: number) => `${what} can be ${max.toLocaleString('en-US')} characters at most.`,
  knowsEmptyTitle: 'It knows nothing yet',
  knowsEmptyBody: 'Add a text, a web page or a document, and it will answer from it.',
  addText: 'Add text',
  addLink: 'Add a link',
  addDocument: 'Add a document',
  full: (max: number) => `It can know up to ${max} things. Take one away to add another.`,
  knowledgeName: 'Name',
  textLabel: 'Text',
  textPlaceholder: 'Paste or type what it should know',
  linkLabel: 'Web page',
  linkPlaceholder: 'https://',
  add: 'Add',
  cancel: 'Cancel',
  remove: (name: string) => `Remove ${name}`,
  removeLabel: 'Remove',
  kind: { text: 'Text', url: 'Link', file: 'Document' } as const,
  documentNotAccepted: 'Choose a PDF or a plain text file.',
  documentTooBig: (max: number) => `That file is over the ${formatBytes(max)} limit.`,
  documentEmpty: 'That file is empty. Choose another.',
  documentFailedTitle: "That didn't upload",
  documentFailed: 'Check your connection and choose it again.',
  addFailed: 'We could not add that',
  removeFailed: 'We could not take that away. Try again.',
  chatEmpty: 'Ask it something a customer would ask.',
  messageLabel: 'Message',
  messagePlaceholder: 'Type a message',
  send: 'Send',
  you: 'You',
  agent: 'Receptionist',
  replyFailedTitle: "That didn't work",
  unavailableTitle: "This isn't available right now",
  unavailableBody: 'Try again later.',
} as const;

export type ReceptionistTab = 'setup' | 'knows' | 'chat';

/** The reason set-up cannot be saved yet, or null. The Hub checks again. */
export function setupProblem(d: { businessName: string; offer: string; replyStyle: string }): string | null {
  if (Array.from(d.businessName).length > RECEPTIONIST_LIMITS.businessName) return RECEPTIONIST_WORDS.overLimit('The business name', RECEPTIONIST_LIMITS.businessName);
  if (Array.from(d.offer).length > RECEPTIONIST_LIMITS.offer) return RECEPTIONIST_WORDS.overLimit('What you offer', RECEPTIONIST_LIMITS.offer);
  if (Array.from(d.replyStyle).length > RECEPTIONIST_LIMITS.replyStyle) return RECEPTIONIST_WORDS.overLimit('How it should reply', RECEPTIONIST_LIMITS.replyStyle);
  if (d.businessName.trim() === '' || d.offer.trim() === '') return RECEPTIONIST_WORDS.needName;
  return null;
}

/** The reason a typed web page cannot be added, or null (https only). */
export const knowledgeLinkProblem = (link: string): string | null => httpsProblem(link, RECEPTIONIST_LIMITS.link);

/** What a document may be before it goes up: a PDF or plain text, inside the Hub's size. The Hub reads the file's first bytes again. */
export function documentProblem(file: { name: string; contentType: string; bytes: number }, limits: Pick<Receptionist['limits'], 'docMaxBytes'>): string | null {
  const ok = file.contentType === 'application/pdf' || file.contentType === 'text/plain';
  if (!ok) return RECEPTIONIST_WORDS.documentNotAccepted;
  if (file.bytes === 0) return RECEPTIONIST_WORDS.documentEmpty;
  if (file.bytes > limits.docMaxBytes) return RECEPTIONIST_WORDS.documentTooBig(limits.docMaxBytes);
  return null;
}

/** "Text, 1.2 KB", "Link", "Document, 3 MB". */
export const knowledgeLine = (k: { kind: 'text' | 'url' | 'file'; bytes: number }): string => (k.bytes > 0 ? `${RECEPTIONIST_WORDS.kind[k.kind]}, ${formatBytes(k.bytes)}` : RECEPTIONIST_WORDS.kind[k.kind]);
