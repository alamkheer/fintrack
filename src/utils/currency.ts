export function formatCurrency(amountCents: number, currencyCode: string = 'GBP'): string {
  return (amountCents / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency: currencyCode,
  });
}

export function parseCurrencyInput(input: string): number {
  // Strip non-numeric except dot/comma and digits
  const cleaned = input.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return toCents(parsed);
}

export function toCents(floatAmt: number): number {
  return Math.round(floatAmt * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
