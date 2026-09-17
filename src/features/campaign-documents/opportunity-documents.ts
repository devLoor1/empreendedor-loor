export type OpportunityDocument = {
  id: number;
  name: string;
  type: string;
  download_link: string;
};

export const OPPORTUNITY_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

export const OPPORTUNITY_DOCUMENT_WRITE_TYPES = [
  "social_contract",
  "offered_security",
  "investment_syndicate",
  "issuance_of_securities",
  "financial_statements",
  "key_information",
  "other_documents",
] as const;

export type OpportunityDocumentWriteType = (typeof OPPORTUNITY_DOCUMENT_WRITE_TYPES)[number];

export type OpportunityDocumentFile = Pick<File, "name" | "size" | "type">;

export type OpportunityDocumentReadback =
  | { kind: "create"; id: number; name: string; type: OpportunityDocumentWriteType }
  | {
      kind: "create_without_id";
      previousIds: number[];
      name: string;
      type: OpportunityDocumentWriteType;
    }
  | {
      kind: "replace";
      previousId: number;
      previousIds: number[];
      name: string;
      type: string;
    }
  | { kind: "delete"; id: number };

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

export function validateOpportunityDocumentName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Informe o nome do documento.";
  if (value.length > 128) return "O nome deve ter no máximo 128 caracteres.";
  return null;
}

export function validateOpportunityDocumentFile(file: OpportunityDocumentFile | null): string | null {
  if (!file) return "Selecione um arquivo PDF.";
  if (file.size <= 0) return "Selecione um arquivo PDF válido.";
  if (!file.name.toLowerCase().endsWith(".pdf")) return "O arquivo deve ter extensão PDF.";
  if (file.size > OPPORTUNITY_DOCUMENT_MAX_BYTES) {
    return "O PDF deve ter no máximo 20 MiB.";
  }
  return null;
}

export function isOpportunityDocumentWriteType(value: string): value is OpportunityDocumentWriteType {
  return (OPPORTUNITY_DOCUMENT_WRITE_TYPES as readonly string[]).includes(value);
}

export function canCreateOpportunityDocument(
  status: string,
  type: OpportunityDocumentWriteType,
  documents: OpportunityDocument[],
): boolean {
  if (status === "archived" || status === "finished") return false;
  return type === "other_documents" || !documents.some((document) => document.type === type);
}

export function canReplaceOpportunityDocument(status: string, document: OpportunityDocument): boolean {
  return status !== "archived" && status !== "finished" && document.type !== "investment_contract";
}

export function canDeleteOpportunityDocument(status: string, document: OpportunityDocument): boolean {
  if (status === "archived" || status === "finished" || document.type === "investment_contract") return false;
  return status !== "active" || document.type === "other_documents";
}

export function opportunityDocumentReadbackMatches(
  expectation: OpportunityDocumentReadback,
  documents: OpportunityDocument[],
): boolean {
  if (expectation.kind === "delete") {
    return !documents.some((document) => document.id === expectation.id);
  }
  if (expectation.kind === "replace") {
    if (documents.some((document) => document.id === expectation.previousId)) return false;
    return documents.some(
      (document) =>
        !expectation.previousIds.includes(document.id) &&
        document.name === expectation.name &&
        document.type === expectation.type,
    );
  }
  if (expectation.kind === "create_without_id") {
    return documents.some(
      (document) =>
        !expectation.previousIds.includes(document.id) &&
        document.name === expectation.name &&
        document.type === expectation.type,
    );
  }
  const document = documents.find((item) => item.id === expectation.id);
  return document?.name === expectation.name && document.type === expectation.type;
}

export function parseCreatedOpportunityDocumentId(response: unknown): number | null {
  if (!response || typeof response !== "object") return null;
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const id = (data as { id?: unknown }).id;
  return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
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
