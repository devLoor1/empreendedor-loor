export type DebtSummaryInstallment = {
  installment_number: number;
  due_date: string;
  projected_amount: string;
};

export type DebtSummary = {
  base_date: string;
  first_due: string;
  payment_start_at: string | null;
  grace_period: number;
  total_installments: number;
  payment_frequency: string;
  percentage_profitability: string | null;
  parcelas: DebtSummaryInstallment[];
};

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

export function formatDebtSummaryDate(value: string): string {
  if (!isIsoDate(value)) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function parseDebtSummary(input: unknown): DebtSummary | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (!isIsoDate(value.base_date) || !isIsoDate(value.first_due)) return null;
  if (value.payment_start_at !== null && !isIsoDate(value.payment_start_at)) return null;
  if (!Number.isInteger(value.grace_period) || !Number.isInteger(value.total_installments)) return null;
  if (typeof value.payment_frequency !== "string" || !Array.isArray(value.parcelas)) return null;
  if (value.percentage_profitability !== null && typeof value.percentage_profitability !== "string") return null;
  const parcelas: DebtSummaryInstallment[] = [];
  for (const row of value.parcelas) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const item = row as Record<string, unknown>;
    if (!Number.isInteger(item.installment_number) || !isIsoDate(item.due_date) ||
        typeof item.projected_amount !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(item.projected_amount)) return null;
    parcelas.push({
      installment_number: item.installment_number as number,
      due_date: item.due_date,
      projected_amount: item.projected_amount,
    });
  }
  return {
    base_date: value.base_date,
    first_due: value.first_due,
    payment_start_at: value.payment_start_at as string | null,
    grace_period: value.grace_period as number,
    total_installments: value.total_installments as number,
    payment_frequency: value.payment_frequency as string,
    percentage_profitability: value.percentage_profitability as string | null,
    parcelas,
  };
}
