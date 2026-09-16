export type OpportunityDocument = {
  id: number;
  name: string;
  type: string;
  download_link: string;
};

const TYPE_LABELS: Record<string, string> = {
  investment_contract: "Contrato de investimento",
  social_contract: "Contrato social",
  offered_security: "Valor mobiliário ofertado",
  investment_syndicate: "Sindicato de investimento",
  issuance_of_securities: "Emissão de valores mobiliários",
  financial_statements: "Demonstrações financeiras",
  key_information: "Informações essenciais",
  other_documents: "Outros documentos",
};

export function opportunityDocumentTypeLabel(type: string) {
  return TYPE_LABELS[type] ?? "Documento da oportunidade";
}

export function parseOpportunityDocuments(response: unknown): OpportunityDocument[] {
  if (!response || typeof response !== "object") return [];
  const data = (response as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  return data.filter((item): item is OpportunityDocument => {
    if (!item || typeof item !== "object") return false;
    const document = item as Record<string, unknown>;
    return (
      typeof document.id === "number" &&
      Number.isInteger(document.id) &&
      document.id > 0 &&
      typeof document.name === "string" &&
      typeof document.type === "string" &&
      typeof document.download_link === "string"
    );
  });
}

/** Only HTTP(S) URLs returned by the owner-scoped Backend list can be linked. */
export function safeOpportunityDocumentUrl(link: string) {
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
