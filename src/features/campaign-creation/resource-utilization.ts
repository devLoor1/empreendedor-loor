export const RESOURCE_UTILIZATION_OPTIONS = [
  { label: "Capital de giro", value: "working_capital" },
  { label: "Refinanciamento de dívida", value: "debt_refinancing" },
  { label: "Investimento na oportunidade", value: "investment_in_the_opportunity" },
];

export function resourceUtilizationLabel(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "—";
  return RESOURCE_UTILIZATION_OPTIONS.find((option) => option.value === normalized)?.label ?? normalized;
}
