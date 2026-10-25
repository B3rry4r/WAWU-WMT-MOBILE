import { ApiError } from '@/api/errors';

import type { LegalThread } from '../api';
import { briefToConfirm, canAttach, canTryAgain, chatRows, failureKind, failureText, firstNameOf, hasSpoken, headerOf, isLegalLiveEvent, needsAnotherAsk, placeholderOf, tapsOf, typedBody } from '../model';

const at = '2026-10-08T10:00:00.000Z';
const msg = (id: string, authorRole: 'client' | 'assistant' | 'consultant', body = id, consultantName: string | null = null) => ({ id, authorRole, body, createdAt: at, consultantName });

function thread(over: Partial<LegalThread> = {}): LegalThread {
  return {
    id: 'i1',
    stage: 'profiling',
    matter: 'other',
    matterLabel: 'Something else',
    messages: [msg('a1', 'assistant'), msg('a2', 'assistant')],
    quickReplies: [{ id: 'topic:property', label: 'A tenancy problem' }],
    brief: null,
    awaitingReply: false,
    legalRequestId: null,
    requestStatus: null,
    requestPath: null,
    fixedPrice: null,
    consultant: null,
    assistantStopped: false,
    ...over,
  };
}
const ADAORA = { name: 'Adaora Nnaji', joinedAt: at };

describe('firstNameOf', () => {
  it('takes the first word of a name', () => expect(firstNameOf('Adaora Nnaji')).toBe('Adaora'));
  it('ignores leading and repeated spaces', () => expect(firstNameOf('  Adaora   Nnaji ')).toBe('Adaora'));
  it('is null for no name, an empty name and spaces', () => {
    expect(firstNameOf(null)).toBeNull();
    expect(firstNameOf(undefined)).toBeNull();
    expect(firstNameOf('')).toBeNull();
    expect(firstNameOf('   ')).toBeNull();
  });
});

describe('chatRows', () => {
  it('draws the assistant lines and the person, in order, as bubbles', () => {
    const rows = chatRows(thread({ messages: [msg('a1', 'assistant'), msg('c1', 'client'), msg('a2', 'assistant')] }));
    expect(rows).toEqual([
      { kind: 'bubble', id: 'a1', mine: false, body: 'a1' },
      { kind: 'bubble', id: 'c1', mine: true, body: 'c1' },
      { kind: 'bubble', id: 'a2', mine: false, body: 'a2' },
    ]);
  });

  it('puts the joined notice and the consultant name before the first consultant message only', () => {
    const rows = chatRows(
      thread({
        stage: 'sent',
        consultant: ADAORA,
        messages: [msg('a1', 'assistant'), msg('k1', 'consultant', 'Hi', 'Adaora Nnaji'), msg('k2', 'consultant', 'And', 'Adaora Nnaji')],
      }),
    );
    expect(rows.map((r) => r.kind)).toEqual(['bubble', 'system', 'who', 'bubble', 'bubble']);
    expect(rows[1]).toMatchObject({ text: 'Adaora joined. The assistant has stopped replying.' });
    expect(rows[2]).toMatchObject({ text: 'Adaora Nnaji · Consultant' });
  });

  it('names the consultant again after the person has written in between', () => {
    const rows = chatRows(
      thread({
        stage: 'sent',
        consultant: ADAORA,
        messages: [msg('k1', 'consultant', 'Hi', 'Adaora Nnaji'), msg('c1', 'client'), msg('k2', 'consultant', 'Back', 'Adaora Nnaji')],
      }),
    );
    expect(rows.map((r) => r.kind)).toEqual(['system', 'who', 'bubble', 'bubble', 'who', 'bubble']);
    expect(rows.filter((r) => r.kind === 'system')).toHaveLength(1);
  });

  it('keeps the joined notice where the first consultant message falls, after the person wrote', () => {
    const rows = chatRows(thread({ stage: 'sent', consultant: ADAORA, messages: [msg('a1', 'assistant'), msg('c1', 'client'), msg('k1', 'consultant', 'Hi', 'Adaora Nnaji')] }));
    expect(rows.map((r) => r.kind)).toEqual(['bubble', 'bubble', 'system', 'who', 'bubble']);
  });

  it('says "A consultant" and a bare label when the Hub holds no name', () => {
    const rows = chatRows(thread({ stage: 'sent', consultant: { name: null, joinedAt: at }, messages: [msg('k1', 'consultant', 'Hi', null)] }));
    expect(rows[0]).toMatchObject({ text: 'A consultant joined. The assistant has stopped replying.' });
    expect(rows[1]).toMatchObject({ text: 'Consultant' });
  });

  it('draws no notice when no consultant has written', () => {
    expect(chatRows(thread({ stage: 'sent', messages: [msg('a1', 'assistant')] })).some((r) => r.kind === 'system')).toBe(false);
  });
});

describe('headerOf', () => {
  it('is the assistant with "a consultant takes over" until the person has said something (S14)', () => {
    expect(headerOf(thread())).toEqual({ title: 'Who Made This? Legal', sub: 'Assistant · a consultant takes over', human: false });
  });
  it('is just "Assistant" once they have (S15, S16)', () => {
    expect(headerOf(thread({ messages: [msg('c1', 'client')] }))).toEqual({ title: 'Who Made This? Legal', sub: 'Assistant', human: false });
  });
  it('waits for a consultant after the brief is sent', () => {
    expect(headerOf(thread({ stage: 'sent', messages: [msg('c1', 'client')] }))).toEqual({ title: 'Who Made This? Legal', sub: 'Waiting for a consultant', human: false });
  });
  it('is the consultant, by name, once one has joined (S17)', () => {
    expect(headerOf(thread({ stage: 'sent', consultant: ADAORA }))).toEqual({ title: 'Adaora Nnaji', sub: 'Consultant · Who Made This? Legal', human: true });
  });
  it('is "Consultant" when the Hub holds no name', () => {
    expect(headerOf(thread({ stage: 'sent', consultant: { name: '  ', joinedAt: at } }))).toEqual({ title: 'Consultant', sub: 'Who Made This? Legal', human: true });
  });
});

describe('hasSpoken and placeholderOf', () => {
  it('hasSpoken is true only for a client message', () => {
    expect(hasSpoken(thread())).toBe(false);
    expect(hasSpoken(thread({ messages: [msg('c1', 'client')] }))).toBe(true);
  });
  it('is "Type your message" while profiling, "Add anything else" beside the brief, "Message Adaora" after', () => {
    expect(placeholderOf(thread())).toBe('Type your message');
    expect(placeholderOf(thread({ stage: 'brief_ready' }))).toBe('Add anything else');
    expect(placeholderOf(thread({ stage: 'sent' }))).toBe('Message a consultant');
    expect(placeholderOf(thread({ stage: 'sent', consultant: ADAORA }))).toBe('Message Adaora');
    expect(placeholderOf(thread({ stage: 'sent', consultant: { name: null, joinedAt: at } }))).toBe('Message your consultant');
  });
});

describe('briefToConfirm, tapsOf and needsAnotherAsk', () => {
  const brief = { matter: 'property', matterLabel: 'Tenancy', rows: [{ label: 'Matter', value: 'Tenancy' }], ready: true, note: null };
  it('offers the brief only when the stage is brief_ready and the brief is ready', () => {
    expect(briefToConfirm(thread({ stage: 'brief_ready', brief }))).toBe(brief);
    expect(briefToConfirm(thread({ stage: 'brief_ready', brief: { ...brief, ready: false } }))).toBeNull();
    expect(briefToConfirm(thread({ stage: 'profiling', brief }))).toBeNull();
    expect(briefToConfirm(thread({ stage: 'sent', brief }))).toBeNull();
    expect(briefToConfirm(thread({ stage: 'brief_ready', brief: null }))).toBeNull();
  });
  it('offers taps only while profiling and not waiting on an answer', () => {
    expect(tapsOf(thread())).toHaveLength(1);
    expect(tapsOf(thread({ awaitingReply: true }))).toEqual([]);
    expect(tapsOf(thread({ stage: 'brief_ready' }))).toEqual([]);
    expect(tapsOf(thread({ stage: 'sent' }))).toEqual([]);
  });
  it('asks again only before the brief is sent', () => {
    expect(needsAnotherAsk(thread({ awaitingReply: true }))).toBe(true);
    expect(needsAnotherAsk(thread({ awaitingReply: true, stage: 'brief_ready' }))).toBe(true);
    expect(needsAnotherAsk(thread({ awaitingReply: true, stage: 'sent' }))).toBe(false);
    expect(needsAnotherAsk(thread())).toBe(false);
  });
});

describe('typedBody', () => {
  it('is null for nothing, spaces and line breaks', () => {
    expect(typedBody('')).toBeNull();
    expect(typedBody('   ')).toBeNull();
    expect(typedBody('\n\t ')).toBeNull();
  });
  it('trims what is sent and keeps what is inside', () => {
    expect(typedBody('  my rent  \n')).toBe('my rent');
    expect(typedBody('a\nb')).toBe('a\nb');
  });
});

describe('failures', () => {
  const offline = new ApiError('network', 0, 'No connection. Check your internet and try again.');
  const unavailable = new ApiError('server', 503, 'The assistant could not answer.', 'assistant_unavailable');
  const busy = new ApiError('conflict', 409, 'Wait.', 'assistant_busy');
  const full = new ApiError('conflict', 409, 'Full.', 'assistant_conversation_full');
  const limited = new ApiError('rate_limited', 429, 'Later.', 'assistant_rate_limited');
  const long = new ApiError('validation', 400, 'body must be shorter');
  const fiveHundred = new ApiError('server', 500, 'Boom');

  it('reads the kind of failure', () => {
    expect(failureKind(offline)).toBe('offline');
    expect(failureKind(unavailable)).toBe('unavailable');
    expect(failureKind(new ApiError('server', 503, 'x'))).toBe('other');
    expect(failureKind(new ApiError('conflict', 409, 'x', 'assistant_unavailable'))).toBe('other');
    expect(failureKind(new Error('x'))).toBe('other');
  });
  it('shows the server sentence, or a plain one', () => {
    expect(failureText(limited)).toBe('Later.');
    expect(failureText(new Error('x'))).toBe('Something went wrong. Try again.');
    expect(failureText(new ApiError('server', 500, ''))).toBe('Something went wrong. Try again.');
  });
  it('offers "Try again" only where the same send can work', () => {
    expect(canTryAgain(offline)).toBe(true);
    expect(canTryAgain(unavailable)).toBe(true);
    expect(canTryAgain(busy)).toBe(true);
    expect(canTryAgain(fiveHundred)).toBe(true);
    expect(canTryAgain(new Error('x'))).toBe(true);
    expect(canTryAgain(full)).toBe(false);
    expect(canTryAgain(limited)).toBe(false);
    expect(canTryAgain(long)).toBe(false);
  });
});

describe('isLegalLiveEvent', () => {
  it('is true for a legal.thread frame only', () => {
    expect(isLegalLiveEvent({ type: 'legal.thread' })).toBe(true);
    expect(isLegalLiveEvent({ type: 'chat.message' })).toBe(false);
    expect(isLegalLiveEvent(null)).toBe(false);
    expect(isLegalLiveEvent('legal.thread')).toBe(false);
  });
});

describe('R2-LEGAL3 · files in the conversation', () => {
  const at = '2026-10-08T10:00:00.000Z';
  const base = { createdAt: at, consultantName: null };
  it('a line that carries a file is a file row, with the link the Hub served; a line of words stays a bubble', () => {
    const thread = {
      messages: [
        { ...base, id: 'm1', authorRole: 'client', body: 'Sent a file: ID.pdf.', attachment: { url: 'https://files.test/a', contentType: 'application/pdf', bytes: 2048, name: 'ID.pdf' } },
        { ...base, id: 'm2', authorRole: 'client', body: 'Sent a photo.', attachment: { url: null, contentType: 'image/jpeg', bytes: 10, name: null } },
        { ...base, id: 'm3', authorRole: 'client', body: 'My address is in Lekki' },
      ],
      consultant: null,
    } as unknown as Parameters<typeof chatRows>[0];
    expect(chatRows(thread)).toEqual([
      { kind: 'file', id: 'm1', mine: true, contentType: 'application/pdf', name: 'ID.pdf', bytes: 2048, url: 'https://files.test/a' },
      { kind: 'file', id: 'm2', mine: true, contentType: 'image/jpeg', name: null, bytes: 10, url: null },
      { kind: 'bubble', id: 'm3', mine: true, body: 'My address is in Lekki' },
    ]);
  });

  it('files are sent once the matter exists and until it is delivered or cancelled', () => {
    expect(canAttach({ legalRequestId: null, requestStatus: null })).toBe(false);
    for (const status of ['awaiting_quote', 'quoted', 'contract_signed', 'in_progress']) expect(canAttach({ legalRequestId: 'r1', requestStatus: status })).toBe(true);
    expect(canAttach({ legalRequestId: 'r1', requestStatus: 'delivered' })).toBe(false);
    expect(canAttach({ legalRequestId: 'r1', requestStatus: 'cancelled' })).toBe(false);
  });
});
