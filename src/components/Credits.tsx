import { Text, type TextProps } from './Text';

/** "1 credit", "1,250 credits". WAWU Credits are a count: never a naira value, never cashable (DECISIONS R-5). */
export function formatCredits(count: number): string {
  const whole = Math.max(0, Math.floor(count));
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${whole === 1 ? 'credit' : 'credits'}`;
}

export type CreditsProps = Omit<TextProps, 'children'> & { count: number };

export function Credits({ count, ...rest }: CreditsProps) {
  return <Text {...rest}>{formatCredits(count)}</Text>;
}
