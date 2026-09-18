export const CREATION_PIX_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "random", label: "Chave aleatória" },
] as const;
export const PROFITABILITY_BASES = [
  { value: "monthly", label: "Mensal" },
  { value: "annual", label: "Anual" },
] as const;
export function requireCreationPixType(value: string) {
  if (!CREATION_PIX_TYPES.some((item) => item.value === value))
    throw new Error("Selecione um tipo Pix suportado: CPF, telefone, e-mail ou chave aleatória.");
  return value;
}
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
