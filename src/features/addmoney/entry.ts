/**
 * The way into Add money from a pay sheet that was short (WALLET-05, the lead's ruling of 17 Oct 2026): `/add-money` with the
 * shortfall in kobo, which the screen names above the account card. Every pay sheet's "Add ₦X" opens it through this.
 */
export const addMoneyHref = (shortfallKobo: number) => ({ pathname: '/add-money' as const, params: { short: String(shortfallKobo) } });
