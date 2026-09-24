export type GracePeriodDetail = { years: number; months: number; days: number };

export function parseGracePeriod(years: string, months: string, days: string): GracePeriodDetail | null {
  const values = [years, months, days].map((part) => part.trim());
  if (values.some((part) => !/^\d+$/.test(part))) return null;
  const numbers = values.map(Number);
  if (numbers.some((part) => !Number.isSafeInteger(part)) || numbers.every((part) => part === 0)) return null;
  return { years: numbers[0], months: numbers[1], days: numbers[2] };
}

export function readGracePeriod(detail: GracePeriodDetail | null | undefined, legacyMonths: number | null | undefined): GracePeriodDetail | null {
  if (detail && [detail.years, detail.months, detail.days].every((part) => Number.isSafeInteger(part) && part >= 0)) return detail;
  if (legacyMonths != null && Number.isSafeInteger(legacyMonths) && legacyMonths >= 0) return { years: 0, months: legacyMonths, days: 0 };
  return null;
}

export function formatGracePeriod(detail: GracePeriodDetail | null): string {
  if (!detail) return "Não informada";
  return `${detail.years} ano(s), ${detail.months} mês(es), ${detail.days} dia(s)`;
}
