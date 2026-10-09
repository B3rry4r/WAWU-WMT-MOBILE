import type { Application, ProField } from '../api';
import {
  addService,
  applicationBody,
  categoryLabel,
  credentialProblems,
  fieldOfCategory,
  isTaken,
  latestPerField,
  openFields,
  rejectedIn,
  rowState,
  servicesProblems,
} from '../model';

const field = (id: string, label: string, applyCategory: string, regulated = false, categories: string[] = [applyCategory]): ProField => ({ id, label, applyCategory, categories, regulated });
const FIELDS = [
  field('accounting_tax', 'Accounting & Tax', 'finance', true),
  field('business_consulting', 'Business & Consulting', 'professional_services', false, ['professional_services', 'business_entrepreneurship']),
];
const app = (over: Partial<Application>): Application => ({
  id: 'a1',
  status: 'pending',
  reviewedAt: null,
  category: 'finance',
  documents: [],
  wawuUserId: 'u1',
  headline: 'Chartered accountant, 9 years',
  about: 'x'.repeat(40),
  submittedAt: '2026-10-01T10:00:00.000Z',
  rejectionReason: null,
  services: [],
  credentialKind: 'licence',
  licenceNumber: null,
  issuingBody: null,
  listed: true,
  ...over,
});
const text = (n: number) => 'a'.repeat(n);

describe('P5 limits', () => {
  const ok = { headline: text(8), about: text(40), services: [] };
  it('takes a headline of 8 to 120 characters and an about of 40 to 2000, counted after trimming', () => {
    expect(servicesProblems(ok, ['x'])).toEqual({});
    expect(servicesProblems({ ...ok, headline: text(7) }, ['x']).headline).toBeDefined();
    expect(servicesProblems({ ...ok, headline: `  ${text(7)}  ` }, ['x']).headline).toBeDefined();
    expect(servicesProblems({ ...ok, headline: text(120) }, ['x']).headline).toBeUndefined();
    expect(servicesProblems({ ...ok, headline: text(121) }, ['x']).headline).toBeDefined();
    expect(servicesProblems({ ...ok, about: text(39) }, ['x']).about).toBeDefined();
    expect(servicesProblems({ ...ok, about: text(2000) }, ['x']).about).toBeUndefined();
    expect(servicesProblems({ ...ok, about: text(2001) }, ['x']).about).toBeDefined();
  });
  it('wants at least one field', () => {
    expect(servicesProblems(ok, []).fields).toBeDefined();
    expect(servicesProblems(ok, ['a']).fields).toBeUndefined();
  });
  it('adds a service trimmed, refuses an empty, a repeat in any case, one over 60 characters, and a 13th', () => {
    expect(addService([], '  Tax   filing ').list).toEqual(['Tax filing']);
    expect(addService([], '   ').problem).toBeDefined();
    expect(addService(['Tax filing'], 'tax FILING')).toEqual({ list: ['Tax filing'], problem: 'You already added that.' });
    expect(addService([], text(60)).problem).toBeUndefined();
    expect(addService([], text(61)).problem).toBeDefined();
    const twelve = Array.from({ length: 12 }, (_, i) => `s${i}`);
    expect(addService(twelve, 'one more').problem).toBeDefined();
    expect(addService(twelve.slice(0, 11), 'one more').list).toHaveLength(12);
  });
});

describe('P6 rules', () => {
  const licence = { kind: 'licence' as const, licenceNumber: 'ICAN/2016/40921', issuer: 'ICAN' };
  it('a regulated field needs a practising licence with its number and issuer', () => {
    expect(credentialProblems(licence, true, false)).toEqual({});
    expect(credentialProblems({ ...licence, kind: 'qualification' }, true, false).kind).toBeDefined();
    expect(credentialProblems({ ...licence, kind: 'portfolio' }, true, false).kind).toBeDefined();
    expect(credentialProblems({ ...licence, licenceNumber: '  ' }, true, false).licenceNumber).toBeDefined();
    expect(credentialProblems({ ...licence, issuer: '' }, true, false).issuer).toBeDefined();
  });
  it('elsewhere the number and issuer are optional, and work samples need neither', () => {
    expect(credentialProblems({ kind: 'licence', licenceNumber: '', issuer: '' }, false, false)).toEqual({});
    expect(credentialProblems({ kind: 'portfolio', licenceNumber: '', issuer: '' }, false, false)).toEqual({});
  });
  it('holds the number to 80 characters and the issuer to 160', () => {
    expect(credentialProblems({ ...licence, licenceNumber: text(80) }, true, false).licenceNumber).toBeUndefined();
    expect(credentialProblems({ ...licence, licenceNumber: text(81) }, true, false).licenceNumber).toBeDefined();
    expect(credentialProblems({ ...licence, issuer: text(160) }, true, false).issuer).toBeUndefined();
    expect(credentialProblems({ ...licence, issuer: text(161) }, true, false).issuer).toBeDefined();
  });
  it('makes Send wait while a file is uploading', () => {
    expect(credentialProblems(licence, true, true).upload).toBeDefined();
  });
  it('never sends a NUL character, which the Hub answers 500 to', () => {
    const body = applicationBody(FIELDS[0], { headline: 'Charte\u0000red accountant', about: `${text(40)}\u0000`, services: ['Tax\u0000 filing'] }, { kind: 'licence', licenceNumber: 'IC\u0000AN/1', issuer: 'I\u0000CAN' }, []);
    expect(JSON.stringify(body)).not.toContain('\u0000');
    expect(body.headline).toBe('Chartered accountant');
    expect(body.licenceNumber).toBe('ICAN/1');
    expect(servicesProblems({ headline: text(7) + '\u0000', about: text(40), services: [] }, ['x']).headline).toBeDefined();
    expect(addService([], 'a\u0000b').list).toEqual(['ab']);
  });
  it('sends only what the kind carries', () => {
    const services = { headline: ' Chartered accountant ', about: text(40), services: ['Tax filing'] };
    expect(applicationBody(FIELDS[0], services, licence, ['https://f/x.pdf'])).toEqual({
      category: 'finance',
      headline: 'Chartered accountant',
      about: text(40),
      services: ['Tax filing'],
      credentialKind: 'licence',
      licenceNumber: 'ICAN/2016/40921',
      issuingBody: 'ICAN',
      documents: ['https://f/x.pdf'],
    });
    const samples = applicationBody(FIELDS[1], services, { kind: 'portfolio', licenceNumber: 'L', issuer: 'I' }, []);
    expect(samples).not.toHaveProperty('licenceNumber');
    expect(samples).not.toHaveProperty('issuingBody');
    expect(samples.category).toBe('professional_services');
    const qualification = applicationBody(FIELDS[1], services, { kind: 'qualification', licenceNumber: 'L', issuer: ' Uni ' }, []);
    expect(qualification).not.toHaveProperty('licenceNumber');
    expect(qualification.issuingBody).toBe('Uni');
  });
});

describe('fields and applications', () => {
  it('finds a field by any of its categories, and names a category no field covers', () => {
    expect(fieldOfCategory(FIELDS, 'business_entrepreneurship')?.id).toBe('business_consulting');
    expect(fieldOfCategory(FIELDS, 'real_estate')).toBeUndefined();
    expect(categoryLabel('real_estate')).toBe('Real estate');
    expect(categoryLabel('')).toBe('Other');
  });
  it('holds a field while an application in it waits or is listed, not when it was turned down', () => {
    expect(isTaken(FIELDS[0], [app({ status: 'pending' })])).toBe(true);
    expect(isTaken(FIELDS[0], [app({ status: 'approved' })])).toBe(true);
    expect(isTaken(FIELDS[0], [app({ status: 'rejected' })])).toBe(false);
    expect(isTaken(FIELDS[0], [app({ status: 'pending', category: 'legal_services' })])).toBe(false);
    expect(openFields(FIELDS, [app({ status: 'approved' })]).map((f) => f.id)).toEqual(['business_consulting']);
  });
  it('starts Apply again from the newest turned-down application in that field', () => {
    const older = app({ id: 'o', status: 'rejected', submittedAt: '2026-09-01T00:00:00.000Z' });
    const newer = app({ id: 'n', status: 'rejected', submittedAt: '2026-10-02T00:00:00.000Z' });
    expect(rejectedIn(FIELDS[0], [older, newer])?.id).toBe('n');
    expect(rejectedIn(FIELDS[0], [app({ status: 'pending' })])).toBeUndefined();
  });
  it('reads a row as listed, hidden, under review or turned down', () => {
    expect(rowState({ status: 'approved', listed: true })).toBe('listed');
    expect(rowState({ status: 'approved', listed: false })).toBe('hidden');
    expect(rowState({ status: 'pending', listed: false })).toBe('review');
    expect(rowState({ status: 'rejected', listed: true })).toBe('turned-down');
  });
  it('orders rows listed, under review, turned down, newest first inside each, one per field', () => {
    const rows = [
      app({ id: 'r', status: 'rejected', category: 'legal_services', submittedAt: '2026-10-05T00:00:00.000Z' }),
      app({ id: 'p1', status: 'pending', category: 'technology', submittedAt: '2026-10-01T00:00:00.000Z' }),
      app({ id: 'p2', status: 'pending', category: 'healthcare', submittedAt: '2026-10-03T00:00:00.000Z' }),
      app({ id: 'a', status: 'approved', category: 'finance', submittedAt: '2026-09-01T00:00:00.000Z' }),
      app({ id: 'dup', status: 'rejected', category: 'finance', submittedAt: '2026-08-01T00:00:00.000Z' }),
    ];
    expect(latestPerField(rows).map((r) => r.id)).toEqual(['a', 'p2', 'p1', 'r']);
  });
});
