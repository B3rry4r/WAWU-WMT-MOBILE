import { useLocalSearchParams } from 'expo-router';

import type { Corridors, Quote, Recipient, AbroadSend, Source } from './model';
import { NewRecipientView } from './NewRecipientView';
import { AbroadAmountView, AbroadHomeView, AbroadReceiptView, AbroadReviewView } from './views';

/**
 * Every Send abroad screen with canned data, for pictures (NUV-11, V5). Development only (`/dev/abroad?screen=home`): a production build
 * redirects to Home, and no tab or link points here. The figures are the ones dev answered on 24 Oct 2026.
 */
/** The countries Nuvion does not pay yet, as the Hub's setting names them. */
const OFF = ['UG'];
const field = (key: string, label: string, kind: 'text' | 'digits' | 'bank' | 'phone' | 'choice' = 'text', hint: string | null = null) => ({
  key,
  label,
  kind,
  pattern: null,
  hint,
  options: null,
});
const GH = {
  country: 'GH',
  name: 'Ghana',
  currency: 'GHS',
  decimals: 2,
  available: !OFF.includes('GH'),
  unavailableNote: null,
  rails: [
    {
      method: 'bank' as const,
      label: 'Bank account',
      directory: true,
      minReceiveMinor: null,
      maxReceiveMinor: null,
      schemes: [
        {
          id: null,
          label: 'Bank account',
          speed: 'Same day',
          fields: [field('bank', 'Bank', 'bank'), field('account_number', 'Account number', 'digits')],
        },
      ],
    },
    {
      method: 'mobile_money' as const,
      label: 'Mobile money',
      directory: false,
      minReceiveMinor: 500,
      maxReceiveMinor: 2_500_000,
      schemes: ['mtn:MTN', 'vodafone:Vodafone', 'airtel:AirtelTigo'].map((s) => ({
        id: s.split(':')[0],
        label: s.split(':')[1],
        speed: 'Instant',
        fields: [field('phone_number', 'Mobile money number', 'phone', 'With the country code, like +233')],
      })),
    },
  ],
};
const US = {
  country: 'US',
  name: 'United States',
  currency: 'USD',
  decimals: 2,
  available: !OFF.includes('US'),
  unavailableNote: null,
  rails: [
    {
      method: 'bank' as const,
      label: 'Bank account',
      directory: false,
      minReceiveMinor: null,
      maxReceiveMinor: null,
      schemes: ['ach:ACH', 'wire:Wire', 'rtp:Instant (RTP)'].map((s) => ({
        id: s.split(':')[0],
        label: s.split(':')[1],
        speed: 'Same or next day',
        fields: [
          field('bank_name', 'Bank name'),
          field('routing_number', 'Routing number', 'digits', '9 digits'),
          field('account_number', 'Account number', 'digits'),
          {
            ...field('account_type', 'Account type', 'choice'),
            options: [
              { value: 'checking', label: 'Checking' },
              { value: 'savings', label: 'Savings' },
            ],
          },
          field('bank_address_line1', "Bank's street address"),
          field('bank_address_city', "Bank's city"),
          field('bank_address_state', "Bank's state or province"),
          field('bank_address_postal_code', "Bank's postal code"),
        ],
      })),
    },
  ],
};
const UG = { ...GH, country: 'UG', name: 'Uganda', currency: 'UGX', available: !OFF.includes('UG'), unavailableNote: 'We cannot send here yet.' };
const KE = { ...GH, country: 'KE', name: 'Kenya', currency: 'KES' };
const CORRIDORS: Corridors = { enabled: true, minReceiveMinor: 100, wawuFeeKobo: 0, countries: [GH, KE, UG, US] };

const AMA: Recipient = {
  id: 'r1',
  country: 'GH',
  countryName: 'Ghana',
  currency: 'GHS',
  method: 'mobile_money',
  scheme: 'mtn',
  holderName: 'Ama Mensah',
  bankName: null,
  last4: '4567',
  summary: 'Ghana, MTN, ending 4567',
  createdAt: '2026-10-24T10:00:00.000Z',
};
const DAN: Recipient = {
  id: 'r2',
  country: 'US',
  countryName: 'United States',
  currency: 'USD',
  method: 'bank',
  scheme: 'ach',
  holderName: 'Danielle Brooks',
  bankName: 'Bank of America',
  last4: '1012',
  summary: 'United States, ACH, ending 1012',
  createdAt: '2026-10-23T10:00:00.000Z',
};
const SOURCES: Source[] = [
  { currency: 'NGN', name: 'Naira account', decimals: 2, availableMinor: 48_525_075 },
  { currency: 'USD', name: 'US dollar account', decimals: 2, availableMinor: 92_500 },
];
const QUOTE: Quote = {
  id: 'q1',
  recipientId: 'r1',
  fromCurrency: 'USD',
  toCurrency: 'GHS',
  fromDecimals: 2,
  toDecimals: 2,
  amountFromMinor: 10_000,
  amountToMinor: 100_361,
  converted: true,
  rate: '10.036105',
  providerFeeMinor: null,
  wawuFeeKobo: 0,
  speed: 'Instant',
  expiresAt: '2026-10-24T12:00:00.000Z',
  validForSeconds: 179,
};
const SEND: AbroadSend = {
  id: 's1',
  status: 'pending',
  recipient: AMA,
  fromCurrency: 'USD',
  toCurrency: 'GHS',
  fromDecimals: 2,
  toDecimals: 2,
  amountFromMinor: 10_000,
  amountToMinor: 100_361,
  rate: '10.036105',
  providerFeeMinor: null,
  wawuFeeKobo: 0,
  narration: null,
  failureReason: null,
  speed: 'Instant',
  createdAt: '2026-10-24T10:00:00.000Z',
  completedAt: null,
};
const read = <T,>(data: T) => ({ data, loading: false, failed: false, retry: () => undefined });
const nothing = () => undefined;
const noBanks = () => ({
  data: [{ code: '030100', name: 'ABSA BANK OF GHANA LIMITED', swiftBic: null }],
  loading: false,
  failed: false,
  retry: nothing,
});

export function AbroadGallery() {
  const { screen = 'home' } = useLocalSearchParams<{ screen?: string }>();
  const recipientProps = {
    corridors: CORRIDORS,
    useBanks: noBanks,
    saving: false,
    refusal: null,
    unanswered: false,
    onBack: nothing,
    onSave: nothing,
  };
  switch (screen) {
    case 'empty':
      return <AbroadHomeView recipients={read([] as Recipient[])} onBack={nothing} onNew={nothing} onPick={nothing} />;
    case 'country':
      return <NewRecipientView {...recipientProps} />;
    case 'recipient':
      return <NewRecipientView {...recipientProps} initial={{ country: 'GH', method: 'mobile_money' }} />;
    case 'recipient-us':
      return <NewRecipientView {...recipientProps} initial={{ country: 'US' }} />;
    case 'amount':
      return (
        <AbroadAmountView
          recipient={AMA}
          sources={read(SOURCES)}
          fromCurrency="USD"
          onFromCurrency={nothing}
          side="send"
          onSide={nothing}
          text="100"
          amountMinor={10_000}
          onKey={nothing}
          onDelete={nothing}
          onClear={nothing}
          quote={{ state: 'ready', quote: QUOTE }}
          onBack={nothing}
          onContinue={nothing}
        />
      );
    case 'amount-refused':
      return (
        <AbroadAmountView
          recipient={AMA}
          sources={read(SOURCES)}
          fromCurrency="NGN"
          onFromCurrency={nothing}
          side="send"
          onSide={nothing}
          text="10000"
          amountMinor={1_000_000}
          onKey={nothing}
          onDelete={nothing}
          onClear={nothing}
          quote={{
            state: 'refused',
            refusal: {
              code: 'rate_unavailable',
              message: 'We cannot get a rate for this pair of currencies right now. Try again later or send from another account.',
              fields: [],
              minimumMinor: null,
              maximumMinor: null,
              currency: null,
            },
          }}
          onBack={nothing}
          onContinue={nothing}
        />
      );
    case 'review':
      return (
        <AbroadReviewView
          recipient={AMA}
          quote={QUOTE}
          narration=""
          onNarration={nothing}
          secondsLeft={141}
          notice={null}
          failure={null}
          waiting={false}
          onBack={nothing}
          onSend={nothing}
          onNewQuote={nothing}
        />
      );
    case 'receipt':
      return <AbroadReceiptView send={SEND} loading={false} failed={false} retry={nothing} onDone={nothing} onAgain={nothing} />;
    case 'receipt-failed':
      return (
        <AbroadReceiptView
          send={{
            ...SEND,
            status: 'failed',
            failureReason: 'The payment partner could not deliver this send. Any money taken comes back to your account.',
          }}
          loading={false}
          failed={false}
          retry={nothing}
          onDone={nothing}
          onAgain={nothing}
        />
      );
    default:
      return <AbroadHomeView recipients={read([AMA, DAN])} onBack={nothing} onNew={nothing} onPick={nothing} />;
  }
}
