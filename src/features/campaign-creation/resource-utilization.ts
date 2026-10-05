export type ResourceUtilizationOption = { label: string; value: string };

/** Platform defaults, used until the platform registry loads (or if it fails). */
export const RESOURCE_UTILIZATION_OPTIONS: ResourceUtilizationOption[] = [
  { label: "Capital de giro", value: "working_capital" },
  { label: "Refinanciamento de dívida", value: "debt_refinancing" },
  { label: "Investimento na oportunidade", value: "investment_in_the_opportunity" },
];

/** GET /resource-utilizations → { data: [{ code, name }] }; empty or invalid payload keeps the defaults. */
export function parseResourceUtilizationOptions(raw: unknown): ResourceUtilizationOption[] {
  const data = raw && typeof raw === "object" ? (raw as { data?: unknown }).data : undefined;
  if (!Array.isArray(data)) return RESOURCE_UTILIZATION_OPTIONS;
  const options = data.flatMap((item) => {
    const value = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return typeof value.code === "string" && typeof value.name === "string" && value.code.trim()
      ? [{ value: value.code, label: value.name }]
      : [];
  });
  return options.length > 0 ? options : RESOURCE_UTILIZATION_OPTIONS;
}

export function resourceUtilizationLabel(
  value: string | null | undefined,
  options: ResourceUtilizationOption[] = RESOURCE_UTILIZATION_OPTIONS,
  apiLabel?: string | null,
): string {
  if (apiLabel?.trim()) return apiLabel.trim();
  const normalized = value?.trim();
  if (!normalized) return "—";
  return (
    options.find((option) => option.value === normalized)?.label ??
    RESOURCE_UTILIZATION_OPTIONS.find((option) => option.value === normalized)?.label ??
    normalized
  );
}
