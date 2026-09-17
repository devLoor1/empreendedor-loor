export type CompanyInformation = {
  id: number;
  cnpj: string;
  name: string;
  fantasy_name: string | null;
  phone: string | null;
  email: string | null;
  validation_status: "pending" | "validated" | "invalid" | "not_found" | "unavailable";
  validation_source: string | null;
  validated_at: string | null;
};

export type CompanyForm = {
  cnpj: string;
  legal_name: string;
  trade_name: string;
  phone: string;
  email: string;
};

export const EMPTY_COMPANY: CompanyForm = {
  cnpj: "",
  legal_name: "",
  trade_name: "",
  phone: "",
  email: "",
};

const digits = (value: string) => value.replace(/\D/g, "");

export function readCompanyInformation(response: unknown): CompanyInformation | null {
  if (!response || typeof response !== "object" || !("data" in response)) {
    throw new Error("Resposta de empresa inválida. Recarregue a página antes de salvar.");
  }
  const data = (response as { data: unknown }).data;
  if (data === null) return null;
  if (!data || typeof data !== "object") {
    throw new Error("Resposta de empresa inválida. Recarregue a página antes de salvar.");
  }
  const company = data as Partial<CompanyInformation>;
  if (
    typeof company.id !== "number" ||
    typeof company.cnpj !== "string" ||
    typeof company.name !== "string" ||
    typeof company.validation_status !== "string"
  ) {
    throw new Error("Resposta de empresa incompleta. Recarregue a página antes de salvar.");
  }
  return company as CompanyInformation;
}

export function toCompanyForm(company: CompanyInformation | null): CompanyForm {
  if (!company) return { ...EMPTY_COMPANY };
  return {
    cnpj: company.cnpj,
    legal_name: company.name,
    trade_name: company.fantasy_name ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",
  };
}

export function companySavePayload(form: CompanyForm) {
  return {
    cnpj: digits(form.cnpj),
    name: form.legal_name.trim(),
    fantasy_name: form.trade_name.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    validate: false,
  };
}

export function companyFormMatches(company: CompanyInformation | null, form: CompanyForm) {
  if (!company) return false;
  const payload = companySavePayload(form);
  return (
    digits(company.cnpj) === payload.cnpj &&
    company.name.trim() === payload.name &&
    (company.fantasy_name ?? "").trim() === (payload.fantasy_name ?? "") &&
    (company.phone ?? "").trim() === (payload.phone ?? "") &&
    (company.email ?? "").trim() === (payload.email ?? "")
  );
}

export const COMPANY_STATUS_LABEL: Record<CompanyInformation["validation_status"], string> = {
  pending: "Pendente de validação",
  validated: "Validado pela API",
  invalid: "CNPJ inválido na consulta",
  not_found: "CNPJ não encontrado",
  unavailable: "Consulta indisponível",
};
