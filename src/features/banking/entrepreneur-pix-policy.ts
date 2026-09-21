export const ENTREPRENEUR_NEW_WRITE_PIX_TYPES = [
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "random", label: "Chave aleatória" },
] as const;

export type EntrepreneurNewWritePixType =
  (typeof ENTREPRENEUR_NEW_WRITE_PIX_TYPES)[number]["value"];

export function isEntrepreneurNewWritePixType(
  value: unknown,
): value is EntrepreneurNewWritePixType {
  return ENTREPRENEUR_NEW_WRITE_PIX_TYPES.some((item) => item.value === value);
}

export function requireEntrepreneurNewWritePixType(value: unknown): EntrepreneurNewWritePixType {
  if (!isEntrepreneurNewWritePixType(value)) {
    throw new Error(
      "Selecione um tipo Pix permitido para empreendedor: telefone, e-mail ou chave aleatória.",
    );
  }

  return value;
}
