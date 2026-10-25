/**
 * WALLET-41 round 1: a refused world opening names the fields the provider pointed at (`reason.fields`, for example
 * `address.postal_code` or `person.ssn`). This reads each name as one of the open call's own fields where there is
 * one, and as plain words where there is not, so the person is shown exactly those fields and nothing else. The
 * names are the provider's, so a name this does not know is shown as it is, humanised, and never dropped.
 */
export type HubFieldKey = 'address' | 'postalCode' | 'idType' | 'idNumber' | 'proofType' | 'birth' | 'firstName' | 'lastName' | 'gender' | 'city' | 'state';

const RULES: readonly (readonly [RegExp, HubFieldKey])[] = [
  [/postal_?code|postcode|zip/i, 'postalCode'],
  [/address\.line_?1|address\.street|^address$/i, 'address'],
  [/address\.city|^city$/i, 'city'],
  [/address\.state|^state$/i, 'state'],
  [/proof_of_address/i, 'proofType'],
  [/document\.number|id_?number/i, 'idNumber'],
  [/document\.type|id_?type/i, 'idType'],
  [/date_of_birth|dateofbirth|birth/i, 'birth'],
  [/first_?name/i, 'firstName'],
  [/last_?name/i, 'lastName'],
  [/gender/i, 'gender'],
];

/** The words for a field of the open call, as the person sees it on the form. */
export const FIELD_WORDS: Record<HubFieldKey, string> = {
  address: 'Home address',
  postalCode: 'Postal code',
  idType: 'ID type',
  idNumber: 'ID number',
  proofType: 'Document type',
  birth: 'Date of birth',
  firstName: 'First name',
  lastName: 'Last name',
  gender: 'Gender',
  city: 'City or town',
  state: 'State or province',
};

/** Names with a plain label of their own where the form has no field (the provider asked for something the app cannot collect). */
const KNOWN_WORDS: readonly (readonly [RegExp, string])[] = [
  [/(^|\.)ssn$/i, 'Social security number'],
  [/tax_?id/i, 'Tax number'],
  [/nationality/i, 'Nationality'],
  [/phone/i, 'Phone number'],
  [/email/i, 'Email address'],
];

export type MarkedFields = {
  /** The form's own fields the provider pointed at. */
  keys: HubFieldKey[];
  /** Plain words for every named field that is not one of A27's, in the order named: other screens' fields and ones the app has no field for. */
  elsewhere: string[];
};

/** Reads the provider's field names. `onScreen` lists the fields the screen asking has. */
export function markFields(names: readonly string[] | undefined, onScreen: readonly HubFieldKey[]): MarkedFields {
  const keys: HubFieldKey[] = [];
  const elsewhere: string[] = [];
  for (const name of names ?? []) {
    const rule = RULES.find(([re]) => re.test(name));
    if (rule) {
      const key = rule[1];
      if (onScreen.includes(key)) {
        if (!keys.includes(key)) keys.push(key);
      } else if (!elsewhere.includes(FIELD_WORDS[key])) elsewhere.push(FIELD_WORDS[key]);
      continue;
    }
    const known = KNOWN_WORDS.find(([re]) => re.test(name));
    const last = name.split('.').pop() ?? name;
    const words = known ? known[1] : last.replace(/\[\d*\]/g, '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
    if (!elsewhere.includes(words)) elsewhere.push(words);
  }
  return { keys, elsewhere };
}
