export const PROFITABILITY_BASES = [
  { value: "monthly", label: "Mensal" },
  { value: "annual", label: "Anual" },
] as const;
export function isProfitabilityBasis(value: unknown): value is "annual" | "monthly" {
  return value === "annual" || value === "monthly";
}
export function requireProfitabilityBasis(value: string) {
  if (!isProfitabilityBasis(value))
    throw new Error("Selecione a base mensal ou anual da rentabilidade.");
  return value;
}
export function profitabilityBasisLabel(value: unknown) {
  return (
    PROFITABILITY_BASES.find((item) => item.value === value)?.label ?? "Não informada pela API"
  );
}

/** Formats the unchanged rate only when the API supplies its authoritative period. */
export function formatProfitabilityWithBasis(
  rate: string | number | null | undefined,
  basis: unknown,
) {
  if (rate === null || rate === undefined || rate === "") return "—";
  const suffix = basis === "monthly" ? "a.m." : basis === "annual" ? "a.a." : null;
  return suffix ? `${rate}% ${suffix}` : `${rate}% · base não informada pela API`;
}
